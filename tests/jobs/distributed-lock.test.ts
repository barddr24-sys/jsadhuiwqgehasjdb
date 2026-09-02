/**
 * MongoDB Distributed Lock Tests
 *
 * Validates atomic distributed lock operations against MongoDB Atlas (xsmb_sync_locks)
 * and in-memory fallback.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase, disconnectFromDatabase } from '../../app/lib/db/connection';
import { XSMBSyncLockModel } from '../../app/lib/db/models/xsmb-sync-lock.model';
import { XSMBSyncLockRepository } from '../../app/lib/db/repositories/xsmb-sync-lock.repository';
import { DistributedLock } from '../../app/lib/jobs/distributed-lock';

let mongoServer: MongoMemoryServer;
let lockRepository: XSMBSyncLockRepository;
let lock: DistributedLock;

describe('DistributedLock (MongoDB Atlas & In-Memory)', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await connectToDatabase({ uri });
    await XSMBSyncLockModel.init();
    lockRepository = new XSMBSyncLockRepository(XSMBSyncLockModel);
    lock = new DistributedLock(lockRepository);
  }, 60000);

  afterAll(async () => {
    await disconnectFromDatabase();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await XSMBSyncLockModel.deleteMany({});
  });

  describe('1. MongoDB Distributed Locking', () => {
    it('should acquire lock successfully for a free draw date', async () => {
      const res = await lock.acquire('2026-09-02', 30);
      expect(res.acquired).toBe(true);
      expect(res.token).not.toBeNull();
      expect(typeof res.token).toBe('string');
    });

    it('should reject concurrent lock acquisition for the same date', async () => {
      const res1 = await lock.acquire('2026-09-02', 30);
      expect(res1.acquired).toBe(true);

      const res2 = await lock.acquire('2026-09-02', 30);
      expect(res2.acquired).toBe(false);
      expect(res2.token).toBeNull();
    });

    it('should allow concurrent locking for different dates', async () => {
      const res1 = await lock.acquire('2026-09-01', 30);
      const res2 = await lock.acquire('2026-09-02', 30);

      expect(res1.acquired).toBe(true);
      expect(res2.acquired).toBe(true);
    });

    it('should release lock cleanly when token matches', async () => {
      const { token } = await lock.acquire('2026-09-02', 30);
      const released = await lock.release('2026-09-02', token);
      expect(released).toBe(true);

      // Subsequent acquisition should now succeed
      const secondAcquire = await lock.acquire('2026-09-02', 30);
      expect(secondAcquire.acquired).toBe(true);
    });

    it('should not release lock when token does not match', async () => {
      const { token } = await lock.acquire('2026-09-02', 30);

      const released = await lock.release('2026-09-02', 'wrong-token');
      expect(released).toBe(false);

      // Lock should still be held
      const secondAcquire = await lock.acquire('2026-09-02', 30);
      expect(secondAcquire.acquired).toBe(false);

      // Cleanup
      await lock.release('2026-09-02', token);
    });

    it('should execute actions wrapped in withLock and auto-release', async () => {
      let executedAction = false;

      const res = await lock.withLock('2026-09-02', 30, async () => {
        executedAction = true;
        return 42;
      });

      expect(res.executed).toBe(true);
      expect(res.result).toBe(42);
      expect(executedAction).toBe(true);

      // Lock should have been released automatically
      const nextAcquire = await lock.acquire('2026-09-02', 30);
      expect(nextAcquire.acquired).toBe(true);
    });
  });

  describe('2. In-Memory Fallback Locking (when DB disconnected)', () => {
    it('should acquire, reject duplicate, and release in-memory fallback', async () => {
      const memLock = new DistributedLock({
        acquireLock: async () => {
          throw new Error('DB offline');
        },
        releaseLock: async () => true,
        forceRelease: async () => true,
        isLocked: async () => false,
        cleanExpiredLocks: async () => 0,
      } as unknown as XSMBSyncLockRepository);

      const res1 = await memLock.acquire('2026-09-02', 10);
      expect(res1.acquired).toBe(true);

      const res2 = await memLock.acquire('2026-09-02', 10);
      expect(res2.acquired).toBe(false);

      const released = await memLock.release('2026-09-02', res1.token);
      expect(released).toBe(true);

      const res3 = await memLock.acquire('2026-09-02', 10);
      expect(res3.acquired).toBe(true);
      await memLock.release('2026-09-02', res3.token);
    });
  });
});
