import { describe, expect, it, vi } from 'vitest';
import { TtlCache, type Clock } from './cache';

class FakeClock implements Clock {
  current = 0;
  now(): number {
    return this.current;
  }
  advance(ms: number): void {
    this.current += ms;
  }
}

describe('TtlCache', () => {
  it('returns cached value within TTL', async () => {
    const clock = new FakeClock();
    const cache = new TtlCache<number>(1000, clock);
    const loader = vi.fn(async () => 42);

    expect(await cache.get('k', loader)).toBe(42);
    expect(await cache.get('k', loader)).toBe(42);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('refreshes after TTL expires', async () => {
    const clock = new FakeClock();
    const cache = new TtlCache<number>(1000, clock);
    let counter = 0;
    const loader = vi.fn(async () => ++counter);

    expect(await cache.get('k', loader)).toBe(1);
    clock.advance(1500);
    expect(await cache.get('k', loader)).toBe(2);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('coalesces concurrent loads (single-flight)', async () => {
    const clock = new FakeClock();
    const cache = new TtlCache<number>(1000, clock);
    let resolveLoader!: (n: number) => void;
    const loader = vi.fn(
      () =>
        new Promise<number>((res) => {
          resolveLoader = res;
        }),
    );
    const p1 = cache.get('k', loader);
    const p2 = cache.get('k', loader);
    resolveLoader(7);
    expect(await p1).toBe(7);
    expect(await p2).toBe(7);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('invalidate forces a refresh', async () => {
    const clock = new FakeClock();
    const cache = new TtlCache<number>(1000, clock);
    let counter = 0;
    const loader = vi.fn(async () => ++counter);

    await cache.get('k', loader);
    cache.invalidate('k');
    await cache.get('k', loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('does not cache failed loads', async () => {
    const clock = new FakeClock();
    const cache = new TtlCache<number>(1000, clock);
    const loader = vi
      .fn<() => Promise<number>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(99);

    await expect(cache.get('k', loader)).rejects.toThrow('boom');
    expect(await cache.get('k', loader)).toBe(99);
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
