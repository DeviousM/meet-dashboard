import type { FastifyInstance } from 'fastify';
import type { AppConfig, RoomConfig } from './config.js';
import {
  classifyGoogleError,
  type CalendarReader,
} from './google.js';
import { TtlCache } from './cache.js';
import type {
  BackgroundDto,
  EventsResponse,
  RoomDto,
} from '../shared/types.js';
import { UnsplashError, type BackgroundProvider } from './unsplash.js';

const EVENTS_CACHE_TTL_MS = 30_000;
const BACKGROUND_CACHE_TTL_MS = 30 * 60 * 1000;

export interface RouteDeps {
  readonly config: AppConfig;
  readonly reader: CalendarReader;
  readonly background: BackgroundProvider | null;
}

export async function registerRoutes(
  app: FastifyInstance,
  deps: RouteDeps,
): Promise<void> {
  const roomsById = new Map<string, RoomConfig>(
    deps.config.rooms.map((r) => [r.id, r]),
  );

  const cache = new TtlCache<EventsResponse>(EVENTS_CACHE_TTL_MS);
  const backgroundCache = new TtlCache<BackgroundDto>(
    BACKGROUND_CACHE_TTL_MS,
  );
  const BACKGROUND_KEY = 'current';

  app.get('/healthz', async () => ({ ok: true }));

  app.get('/api/background', async (request, reply) => {
    if (deps.background === null) {
      return reply.status(404).send({
        error: {
          code: 'background_not_configured',
          message: 'UNSPLASH_ACCESS_KEY is not set',
        },
      });
    }
    try {
      const dto = await backgroundCache.get(BACKGROUND_KEY, async () => {
        const refreshAt = new Date(Date.now() + BACKGROUND_CACHE_TTL_MS);
        return deps.background!.fetch(refreshAt);
      });
      return dto;
    } catch (err) {
      backgroundCache.invalidate(BACKGROUND_KEY);
      const status = err instanceof UnsplashError ? err.status : 502;
      const message = (err as Error).message;
      request.log.error({ err }, 'Failed to fetch Unsplash background');
      return reply.status(status >= 400 && status < 600 ? status : 502).send({
        error: { code: 'unsplash_error', message },
      });
    }
  });

  app.get('/api/rooms', async (): Promise<readonly RoomDto[]> => {
    return deps.config.rooms.map((r) => ({
      id: r.id,
      displayName: r.displayName,
    }));
  });

  app.get<{ Params: { id: string } }>(
    '/api/rooms/:id/events',
    async (request, reply) => {
      const { id } = request.params;
      const room = roomsById.get(id);
      if (room === undefined) {
        return reply.status(404).send({
          error: { code: 'unknown_room', message: `No room with id "${id}"` },
        });
      }

      try {
        const response = await cache.get(room.id, async () => {
          const events = await deps.reader.listUpcomingEvents(room.calendarId);
          return {
            roomId: room.id,
            fetchedAt: new Date().toISOString(),
            events,
          };
        });
        return response;
      } catch (err) {
        const classified = classifyGoogleError(err);
        request.log.error(
          { err, roomId: room.id, classified },
          'Failed to load events',
        );
        cache.invalidate(room.id);
        return reply.status(classified.status).send({
          error: { code: classified.code, message: classified.message },
        });
      }
    },
  );
}
