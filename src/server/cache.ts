interface Entry<T> {
  readonly value: T;
  readonly expiresAt: number;
}

export interface Clock {
  now(): number;
}

export const systemClock: Clock = { now: () => Date.now() };

/**
 * Tiny TTL cache with single-flight behavior: concurrent reads for the
 * same key share one underlying loader call.
 */
export class TtlCache<T> {
  private readonly entries = new Map<string, Entry<T>>();
  private readonly inflight = new Map<string, Promise<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly clock: Clock = systemClock,
  ) {}

  async get(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = this.entries.get(key);
    if (cached !== undefined && cached.expiresAt > this.clock.now()) {
      return cached.value;
    }

    const existing = this.inflight.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const promise = (async () => {
      try {
        const value = await loader();
        this.entries.set(key, {
          value,
          expiresAt: this.clock.now() + this.ttlMs,
        });
        return value;
      } finally {
        this.inflight.delete(key);
      }
    })();

    this.inflight.set(key, promise);
    return promise;
  }

  invalidate(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}
