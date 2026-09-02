/**
 * XSMB Sync Lock Repository
 *
 * Implements atomic distributed lock operations against MongoDB Atlas (xsmb_sync_locks).
 * Ensures:
 * 1. Safe atomic acquisition (no two processes can hold the same lock simultaneously).
 * 2. Automatic takeover of expired locks.
 * 3. Safe token-verified release (only lock owner can release).
 * 4. Lock auto-expiry via TTL Date timestamp.
 */

import { XSMBSyncLockModel, IXSMBSyncLockDocument } from '../models/xsmb-sync-lock.model';
import type { Model } from 'mongoose';

export class XSMBSyncLockRepository {
  constructor(private readonly model: Model<IXSMBSyncLockDocument> = XSMBSyncLockModel) {}

  /**
   * Attempts to acquire an atomic distributed lock on MongoDB.
   *
   * @param lockKey - Resource identifier (e.g., "XSMB_SYNC_2026-09-02")
   * @param ownerId - Unique token of the caller
   * @param ttlSeconds - Time-to-live in seconds
   * @returns true if acquired, false if held by another active process
   */
  async acquireLock(
    lockKey: string,
    ownerId: string,
    ttlSeconds: number = 30
  ): Promise<boolean> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    try {
      // 1. Try to take over an expired lock atomically or renew if owned by same owner
      const updated = await this.model.findOneAndUpdate(
        {
          lockKey,
          $or: [
            { expiresAt: { $lte: now } },
            { ownerId },
          ],
        },
        {
          $set: {
            ownerId,
            expiresAt,
            updatedAt: now,
          },
        },
        { returnDocument: 'after' }
      );

      if (updated) {
        return true;
      }

      // 2. If no existing document matched (doesn't exist yet), insert new lock
      await this.model.create({
        lockKey,
        ownerId,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      });

      return true;
    } catch (err: unknown) {
      // Duplicate key error (E11000) means another active process holds the lock
      const errorObj = err as { code?: number; name?: string };
      if (errorObj?.code === 11000 || errorObj?.name === 'MongoServerError') {
        return false;
      }
      return false;
    }
  }

  /**
   * Releases the distributed lock only if the ownerId matches.
   */
  async releaseLock(lockKey: string, ownerId: string): Promise<boolean> {
    try {
      const res = await this.model.deleteOne({ lockKey, ownerId });
      return (res.deletedCount ?? 0) > 0;
    } catch {
      return false;
    }
  }

  /**
   * Forcefully releases a lock regardless of owner (e.g. administrative cleanup).
   */
  async forceRelease(lockKey: string): Promise<boolean> {
    try {
      const res = await this.model.deleteOne({ lockKey });
      return (res.deletedCount ?? 0) > 0;
    } catch {
      return false;
    }
  }

  /**
   * Checks whether an active (non-expired) lock exists for the key.
   */
  async isLocked(lockKey: string): Promise<boolean> {
    try {
      const now = new Date();
      const lock = await this.model.findOne({
        lockKey,
        expiresAt: { $gt: now },
      });
      return lock !== null;
    } catch {
      return false;
    }
  }

  /**
   * Cleans up expired locks from the database.
   */
  async cleanExpiredLocks(): Promise<number> {
    try {
      const res = await this.model.deleteMany({ expiresAt: { $lte: new Date() } });
      return res.deletedCount ?? 0;
    } catch {
      return 0;
    }
  }
}

export const xsmbSyncLockRepository = new XSMBSyncLockRepository();
