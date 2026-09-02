/**
 * Statistics In-Memory Short-Lived Cache Service
 *
 * Implements bounded in-memory caching for expensive statistical aggregations.
 * Cache keys are strictly isolated by:
 *   [analysisType]:[rangeKey]:[optionsHash]
 *
 * Prevents returning 2-day or 7-day cached results for a 30-day request.
 * Automatically evicts stale entries after TTL.
 */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
  key: string;
}

export class StatisticsCacheService {
  private static readonly DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_ENTRIES = 200;
  private static cache = new Map<string, CacheEntry<unknown>>();

  /**
   * Generates a deterministic cache key
   */
  static buildKey(
    analysisType: string,
    rangeKey: string,
    params?: Record<string, unknown>
  ): string {
    const sortedParams = params
      ? Object.keys(params)
          .sort()
          .map((k) => `${k}=${String(params[k])}`)
          .join('&')
      : '';
    return `stats:${analysisType}:${rangeKey}${sortedParams ? `:${sortedParams}` : ''}`;
  }

  /**
   * Gets cached item if not expired
   */
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Sets cached item with TTL
   */
  static set<T>(key: string, data: T, ttlMs: number = this.DEFAULT_TTL_MS): void {
    // Evict oldest entries if capacity reached
    if (this.cache.size >= this.MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      cachedAt: now,
      expiresAt: now + ttlMs,
      key,
    });
  }

  /**
   * Invalidates all statistics cache entries (e.g. when a new draw is ingested)
   */
  static invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Invalidates entries matching a prefix or regex pattern
   */
  static invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Gets current cache size and stats
   */
  static getStats(): { size: number; maxEntries: number } {
    return {
      size: this.cache.size,
      maxEntries: this.MAX_ENTRIES,
    };
  }
}
