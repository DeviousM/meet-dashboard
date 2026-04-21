import { describe, expect, it, vi } from 'vitest';
import { createUnsplashProvider, UnsplashError } from './unsplash';

function makeFetchReturning(payload: unknown, ok = true, status = 200) {
  return vi.fn<typeof fetch>(async () => {
    return {
      ok,
      status,
      json: async () => payload,
    } as unknown as Response;
  });
}

const REFRESH_AT = new Date('2026-04-13T12:00:00Z');

describe('createUnsplashProvider', () => {
  it('maps Unsplash response to BackgroundDto with UTM-tagged links', async () => {
    const fetchImpl = makeFetchReturning({
      urls: { regular: 'https://images.unsplash.com/photo-1?w=1080' },
      links: { html: 'https://unsplash.com/photos/abc' },
      user: {
        name: 'Ada Lovelace',
        links: { html: 'https://unsplash.com/@ada' },
      },
      color: '#445566',
    });
    const provider = createUnsplashProvider({
      accessKey: 'KEY',
      fetchImpl,
    });
    const dto = await provider.fetch(REFRESH_AT);
    expect(dto).toEqual({
      url: 'https://images.unsplash.com/photo-1?w=1080',
      photographer: 'Ada Lovelace',
      photographerUrl:
        'https://unsplash.com/@ada?utm_source=meet-dashboard&utm_medium=referral',
      photoPageUrl:
        'https://unsplash.com/photos/abc?utm_source=meet-dashboard&utm_medium=referral',
      color: '#445566',
      refreshAt: REFRESH_AT.toISOString(),
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [, init] = fetchImpl.mock.calls[0]!;
    expect(init?.headers).toMatchObject({
      Authorization: 'Client-ID KEY',
    });
  });

  it('falls back to other URL sizes when regular is missing', async () => {
    const fetchImpl = makeFetchReturning({
      urls: { full: 'https://images.unsplash.com/full' },
      user: { username: 'anon' },
    });
    const provider = createUnsplashProvider({
      accessKey: 'KEY',
      fetchImpl,
    });
    const dto = await provider.fetch(REFRESH_AT);
    expect(dto.url).toBe('https://images.unsplash.com/full');
    expect(dto.photographer).toBe('anon');
  });

  it('throws UnsplashError with HTTP status on non-2xx', async () => {
    const fetchImpl = makeFetchReturning({}, false, 429);
    const provider = createUnsplashProvider({
      accessKey: 'KEY',
      fetchImpl,
    });
    await expect(provider.fetch(REFRESH_AT)).rejects.toMatchObject({
      name: 'UnsplashError',
      status: 429,
    });
  });

  it('throws when response has no usable image URL', async () => {
    const fetchImpl = makeFetchReturning({ urls: {}, user: {} });
    const provider = createUnsplashProvider({
      accessKey: 'KEY',
      fetchImpl,
    });
    await expect(provider.fetch(REFRESH_AT)).rejects.toBeInstanceOf(
      UnsplashError,
    );
  });
});
