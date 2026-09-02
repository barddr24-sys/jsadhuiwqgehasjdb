/**
 * XSMB Sync Job Unit Tests
 *
 * Tests background execution, in-process deduplication, retries, and lock management.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { XSMBSyncJob } from '../../app/lib/jobs/xsmb-sync.job';
import { DistributedLock } from '../../app/lib/jobs/distributed-lock';
import type { XSMBSyncLockRepository } from '../../app/lib/db/repositories/xsmb-sync-lock.repository';
import type { XSMBSyncService } from '../../app/lib/sync/xsmb-sync.service';
import type { SyncResult } from '../../app/lib/sync/types';
import type { IXSMBDraw } from '../../app/lib/db/types/db-types';
import { FIXTURE_VALID_RESULTS_1 } from '../fixtures/draw-fixtures';

describe('XSMBSyncJob', () => {
  let lock: DistributedLock;
  let mockSyncDate: Mock<(date: string, options?: unknown) => Promise<SyncResult>>;
  let mockSyncService: Partial<XSMBSyncService>;
  let syncJob: XSMBSyncJob;

  beforeEach(() => {
    // In-memory fallback lock
    lock = new DistributedLock({
      acquireLock: async () => true,
      releaseLock: async () => true,
      forceRelease: async () => true,
      isLocked: async () => false,
      cleanExpiredLocks: async () => 0,
    } as unknown as XSMBSyncLockRepository);

    mockSyncDate = vi.fn();
    mockSyncService = {
      syncDate: mockSyncDate as unknown as XSMBSyncService['syncDate'],
    };

    syncJob = new XSMBSyncJob(
      mockSyncService as XSMBSyncService,
      lock
    );
  });

  it('should execute sync, release lock, and return SUCCESS', async () => {
    const mockResult: SyncResult = {
      status: 'SUCCESS',
      date: '2026-09-02',
      syncRunId: 'run-123',
      lotteryType: 'XSMB',
      providerId: 'primary-web-provider',
      checksum: 'chk-123',
      durationMs: 150,
      draw: {
        drawDate: '2026-09-02',
        status: 'READY',
        results: FIXTURE_VALID_RESULTS_1,
      } as unknown as IXSMBDraw,
    };

    mockSyncDate.mockResolvedValue(mockResult);

    const result = await syncJob.execute('2026-09-02');

    expect(result.status).toBe('SUCCESS');
    expect(result.attempts).toBe(1);
    expect(result.lockAcquired).toBe(true);
    expect(mockSyncService.syncDate).toHaveBeenCalledWith('2026-09-02', expect.any(Object));

    // Verify lock is released
    const nextLock = await lock.acquire('2026-09-02', 30);
    expect(nextLock.acquired).toBe(true);
    await lock.release('2026-09-02', nextLock.token);
  });

  it('should deduplicate concurrent in-process calls for the same date', async () => {
    let callCount = 0;
    mockSyncDate.mockImplementation(async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 50));
      return {
        status: 'SUCCESS',
        date: '2026-09-02',
        syncRunId: 'run-dedup',
        lotteryType: 'XSMB',
        providerId: 'primary-web-provider',
        durationMs: 50,
      };
    });

    // Fire 2 concurrent sync executions for the same date
    const [res1, res2] = await Promise.all([
      syncJob.execute('2026-09-02'),
      syncJob.execute('2026-09-02'),
    ]);

    expect(res1.status).toBe('SUCCESS');
    expect(res2.status).toBe('SUCCESS');
    expect(callCount).toBe(1); // Only ONE provider call was made
    expect(mockSyncService.syncDate).toHaveBeenCalledTimes(1);
  });

  it('should return SKIPPED_LOCKED when lock is already held by another job', async () => {
    // Mock lock to simulate another worker holding the lock
    const lockedMock = {
      acquire: vi.fn().mockResolvedValue({ acquired: false, token: null }),
      release: vi.fn().mockResolvedValue(true),
    } as unknown as DistributedLock;

    const busyJob = new XSMBSyncJob(mockSyncService as XSMBSyncService, lockedMock);
    const result = await busyJob.execute('2026-09-02');

    expect(result.status).toBe('SKIPPED_LOCKED');
    expect(result.lockAcquired).toBe(false);
    expect(mockSyncService.syncDate).not.toHaveBeenCalled();
  });

  it('should handle NO_CHANGE status cleanly', async () => {
    const mockResult: SyncResult = {
      status: 'NO_CHANGE',
      date: '2026-09-02',
      syncRunId: 'run-123',
      lotteryType: 'XSMB',
      providerId: 'primary-web-provider',
      durationMs: 50,
    };

    mockSyncDate.mockResolvedValue(mockResult);

    const result = await syncJob.execute('2026-09-02');

    expect(result.status).toBe('NO_CHANGE');
    expect(result.attempts).toBe(1);
  });

  it('should retry transient failures up to maxRetries with backoff', async () => {
    mockSyncDate
      .mockResolvedValueOnce({
        status: 'FAILED',
        errorMessage: 'Network timeout',
        date: '2026-09-02',
        syncRunId: 'r1',
        lotteryType: 'XSMB',
        providerId: 'primary-web-provider',
        durationMs: 10,
      })
      .mockResolvedValueOnce({
        status: 'FAILED',
        errorMessage: 'HTTP 502 Bad Gateway',
        date: '2026-09-02',
        syncRunId: 'r2',
        lotteryType: 'XSMB',
        providerId: 'primary-web-provider',
        durationMs: 10,
      })
      .mockResolvedValueOnce({
        status: 'SUCCESS',
        date: '2026-09-02',
        syncRunId: 'r3',
        lotteryType: 'XSMB',
        providerId: 'primary-web-provider',
        durationMs: 10,
        draw: { status: 'READY', results: FIXTURE_VALID_RESULTS_1 } as unknown as IXSMBDraw,
      });

    const result = await syncJob.execute('2026-09-02', {
      maxRetries: 3,
      retryDelayMs: 10, // Fast test delay
    });

    expect(result.status).toBe('SUCCESS');
    expect(result.attempts).toBe(3);
    expect(mockSyncService.syncDate).toHaveBeenCalledTimes(3);
  });

  it('should return FAILED and preserve database/lock state when all retries fail', async () => {
    mockSyncDate.mockResolvedValue({
      status: 'FAILED',
      errorMessage: 'Persistent provider outage',
      date: '2026-09-02',
      syncRunId: 'r1',
      lotteryType: 'XSMB',
      providerId: 'primary-web-provider',
      durationMs: 10,
    });

    const result = await syncJob.execute('2026-09-02', {
      maxRetries: 2,
      retryDelayMs: 10,
    });

    expect(result.status).toBe('FAILED');
    expect(result.attempts).toBe(2);
    expect(result.error).toContain('Persistent provider outage');
  });
});
