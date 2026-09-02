/**
 * MongoDB Distributed Lock for XSMB Synchronization
 *
 * Prevents multiple server instances or concurrent background jobs from synchronizing
 * the same draw date simultaneously.
 *
 * Implements atomic distributed locking natively on MongoDB Atlas (xsmb_sync_locks)
 * with a process-local in-memory fallback if the database connection is offline.
 *
 * Security: Never logs credentials or secrets.
 */

import { randomUUID } from 'crypto';
import { xsmbSyncLockRepository, XSMBSyncLockRepository } from '../db/repositories/xsmb-sync-lock.repository';
import { isDatabaseConnected } from '../db/connection';

const DEFAULT_LOCK_TTL_SEC = 30;

interface MemoryLockEntry {
  token: string;
  expiresAt: number;
  timer: NodeJS.Timeout;
}

export class DistributedLock {
  private readonly inMemoryLocks = new Map<string, MemoryLockEntry>();

  constructor(
    private readonly lockRepository: XSMBSyncLockRepository = xsmbSyncLockRepository
  ) {}

  /**
   * Helper to format standard lock key
   */
  getLockKey(drawDate: string): string {
    return `XSMB_SYNC_${drawDate}`;
  }

  /**
   * Attempts to acquire a distributed lock for a given draw date.
   */
  async acquire(
    drawDate: string,
    ttlSeconds: number = DEFAULT_LOCK_TTL_SEC
  ): Promise<{ acquired: boolean; token: string | null }> {
    const lockKey = this.getLockKey(drawDate);
    const token = `lock-token-${randomUUID()}-${Date.now()}`;

    // 1. If MongoDB is connected, use native atomic MongoDB distributed lock
    if (isDatabaseConnected()) {
      try {
        const acquired = await this.lockRepository.acquireLock(lockKey, token, ttlSeconds);

        if (process.env.NODE_ENV !== 'test') {
          if (acquired) {
            console.log(`[Lock] Acquired MongoDB lock for ${drawDate} (TTL: ${ttlSeconds}s)`);
          } else {
            console.log(`[Lock] Lock for ${drawDate} already held by another worker`);
          }
        }

        return { acquired, token: acquired ? token : null };
      } catch (err) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn(
            `[Lock] MongoDB lock error, falling back to local memory lock:`,
            err instanceof Error ? err.message : err
          );
        }
        return this.acquireMemoryLock(lockKey, token, ttlSeconds);
      }
    }

    // 2. Local in-memory lock fallback when MongoDB is not connected (e.g. mock tests)
    return this.acquireMemoryLock(lockKey, token, ttlSeconds);
  }

  /**
   * Releases a distributed lock using its unique token.
   */
  async release(drawDate: string, token: string | null): Promise<boolean> {
    if (!token) return false;

    const lockKey = this.getLockKey(drawDate);

    if (isDatabaseConnected()) {
      try {
        const released = await this.lockRepository.releaseLock(lockKey, token);
        if (process.env.NODE_ENV !== 'test' && released) {
          console.log(`[Lock] Released MongoDB lock for ${drawDate}`);
        }
        // Also clean up local memory lock if any
        this.releaseMemoryLock(lockKey, token);
        return released;
      } catch (err) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`[Lock] MongoDB release error:`, err instanceof Error ? err.message : err);
        }
      }
    }

    return this.releaseMemoryLock(lockKey, token);
  }

  /**
   * Helper to execute an async action inside a distributed lock.
   */
  async withLock<T>(
    drawDate: string,
    ttlSeconds: number,
    action: () => Promise<T>
  ): Promise<{ executed: boolean; result?: T; error?: Error }> {
    const { acquired, token } = await this.acquire(drawDate, ttlSeconds);
    if (!acquired || !token) {
      return { executed: false };
    }

    try {
      const result = await action();
      return { executed: true, result };
    } catch (error) {
      return { executed: true, error: error instanceof Error ? error : new Error(String(error)) };
    } finally {
      await this.release(drawDate, token);
    }
  }

  // ─── In-Memory Fallback Implementation ──────────────────────────────────────

  private acquireMemoryLock(
    lockKey: string,
    token: string,
    ttlSeconds: number
  ): { acquired: boolean; token: string | null } {
    const now = Date.now();
    const existing = this.inMemoryLocks.get(lockKey);

    if (existing && existing.expiresAt > now) {
      return { acquired: false, token: null };
    }

    if (existing) {
      clearTimeout(existing.timer);
    }

    const timer = setTimeout(() => {
      this.inMemoryLocks.delete(lockKey);
    }, ttlSeconds * 1000);

    if (timer.unref) timer.unref();

    this.inMemoryLocks.set(lockKey, {
      token,
      expiresAt: now + ttlSeconds * 1000,
      timer,
    });

    return { acquired: true, token };
  }

  private releaseMemoryLock(lockKey: string, token: string): boolean {
    const existing = this.inMemoryLocks.get(lockKey);
    if (existing && existing.token === token) {
      clearTimeout(existing.timer);
      this.inMemoryLocks.delete(lockKey);
      return true;
    }
    return false;
  }
}

export const distributedLock = new DistributedLock();
