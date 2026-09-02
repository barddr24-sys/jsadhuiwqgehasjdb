/**
 * XSMB L1 In-Memory Fast Cache
 *
 * Provides ultra-fast sub-millisecond lookups for hot lottery draws.
 * Features bounded LRU eviction and automatic TTL expiry.
 */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

export class XSMBMemoryL1Cache {
  private readonly defaultTtlMs: number;
  private readonly maxEntries: number;
  private cache = new Map<string, CacheEntry<unknown>>();

  constructor(defaultTtlMs = 300_000, maxEntries = 500) {
    this.defaultTtlMs = defaultTtlMs;
    this.maxEntries = maxEntries;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      cachedAt: now,
      expiresAt: now + (ttlMs ?? this.defaultTtlMs),
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const xsmbMemoryCache = new XSMBMemoryL1Cache();
