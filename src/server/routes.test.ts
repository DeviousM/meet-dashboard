import { describe, expect, it, vi, beforeEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { registerRoutes } from './routes';
import type { CalendarReader } from './google';
import type { AppConfig, RoomConfig } from './config';
import type { BackgroundDto, EventDto } from '../shared/types';
import { type BackgroundProvider, UnsplashError } from './unsplash';

function buildConfig(rooms: RoomConfig[]): AppConfig {
  return {
    rooms,
    google: { clientId: 'x', clientSecret: 'y', refreshToken: 'z' },
    unsplash: { accessKey: null },
    port: 0,
    webDistPath: '/tmp/none',
  };
}

function makeApp(
  rooms: RoomConfig[],
  reader: CalendarReader,
  background: BackgroundProvider | null = null,
): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  return registerRoutes(app, {
    config: buildConfig(rooms),
    reader,
    background,
  }).then(() => app);
}

const sampleRoom: RoomConfig = {
  id: 'aurora',
  displayName: 'Aurora',
  calendarId: 'c_aurora@resource.calendar.google.com',
};

const sampleEvent: EventDto = {
  id: 'evt1',
  title: 'Sync',
  startTime: '2026-04-13T10:00:00Z',
  endTime: '2026-04-13T10:30:00Z',
  meetUrl: 'https://meet.google.com/abc-defg-hij',
  isPrivate: false,
  organizer: 'Alice',
};

describe('routes', () => {
  let reader: CalendarReader;

  beforeEach(() => {
    reader = {
      listUpcomingEvents: vi.fn(async () => [sampleEvent]),
    };
  });

  it('GET /healthz responds with ok', async () => {
    const app = await makeApp([sampleRoom], reader);
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    await app.close();
  });

  it('GET /api/rooms returns the public room list (no calendarId leak)', async () => {
    const app = await makeApp([sampleRoom], reader);
    const res = await app.inject({ method: 'GET', url: '/api/rooms' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([{ id: 'aurora', displayName: 'Aurora' }]);
    await app.close();
  });

  it('GET /api/rooms/:id/events returns events for a known room', async () => {
    const app = await makeApp([sampleRoom], reader);
    const res = await app.inject({
      method: 'GET',
      url: '/api/rooms/aurora/events',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.roomId).toBe('aurora');
    expect(body.events).toEqual([sampleEvent]);
    expect(reader.listUpcomingEvents).toHaveBeenCalledWith(
      sampleRoom.calendarId,
    );
    await app.close();
  });

  it('GET /api/rooms/:id/events returns 404 for unknown room', async () => {
    const app = await makeApp([sampleRoom], reader);
    const res = await app.inject({
      method: 'GET',
      url: '/api/rooms/borealis/events',
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('unknown_room');
    await app.close();
  });

  it('serves cached results within TTL', async () => {
    const app = await makeApp([sampleRoom], reader);
    await app.inject({ method: 'GET', url: '/api/rooms/aurora/events' });
    await app.inject({ method: 'GET', url: '/api/rooms/aurora/events' });
    expect(reader.listUpcomingEvents).toHaveBeenCalledTimes(1);
    await app.close();
  });

  it('classifies invalid_grant errors as 503 reauth_required', async () => {
    reader = {
      listUpcomingEvents: vi.fn(async () => {
        throw new Error('invalid_grant: token expired');
      }),
    };
    const app = await makeApp([sampleRoom], reader);
    const res = await app.inject({
      method: 'GET',
      url: '/api/rooms/aurora/events',
    });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe('reauth_required');
    await app.close();
  });

  describe('GET /api/background', () => {
    const sampleBg: BackgroundDto = {
      url: 'https://images.unsplash.com/photo-x?w=1920',
      photographer: 'Ada Lovelace',
      photographerUrl: 'https://unsplash.com/@ada?utm_source=meet-dashboard',
      photoPageUrl: 'https://unsplash.com/photos/x?utm_source=meet-dashboard',
      color: '#445566',
      refreshAt: '2026-04-13T12:00:00Z',
    };

    it('returns 404 when no background provider is configured', async () => {
      const app = await makeApp([sampleRoom], reader, null);
      const res = await app.inject({ method: 'GET', url: '/api/background' });
      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe('background_not_configured');
      await app.close();
    });

    it('returns the background dto when provider succeeds', async () => {
      const provider: BackgroundProvider = {
        fetch: vi.fn(async () => sampleBg),
      };
      const app = await makeApp([sampleRoom], reader, provider);
      const res = await app.inject({ method: 'GET', url: '/api/background' });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual(sampleBg);
      await app.close();
    });

    it('caches across requests within TTL', async () => {
      const fetchFn = vi.fn(async () => sampleBg);
      const app = await makeApp([sampleRoom], reader, { fetch: fetchFn });
      await app.inject({ method: 'GET', url: '/api/background' });
      await app.inject({ method: 'GET', url: '/api/background' });
      expect(fetchFn).toHaveBeenCalledTimes(1);
      await app.close();
    });

    it('propagates UnsplashError status code', async () => {
      const provider: BackgroundProvider = {
        fetch: vi.fn(async () => {
          throw new UnsplashError('rate limited', 429);
        }),
      };
      const app = await makeApp([sampleRoom], reader, provider);
      const res = await app.inject({ method: 'GET', url: '/api/background' });
      expect(res.statusCode).toBe(429);
      expect(res.json().error.code).toBe('unsplash_error');
      await app.close();
    });
  });
});
