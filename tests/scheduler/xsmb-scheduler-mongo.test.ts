/**
 * Comprehensive XSMB Scheduler & Background Sync Integration Tests
 *
 * Tests:
 * 1. Timezone correctness (Asia/Ho_Chi_Minh)
 * 2. Scheduler phase transitions & polling intervals (NORMAL, PRE_DRAW, DRAWING, POST_READY)
 * 3. READY state halts aggressive polling immediately
 * 4. In-process deduplication (2 simultaneous requests trigger only 1 provider fetch)
 * 5. MongoDB uniqueness protection under concurrent sync
 * 6. Failure protection: Upstream provider failure preserves existing valid READY record
 * 7. Graceful shutdown stops scheduler timer cleanly
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase, disconnectFromDatabase } from '../../app/lib/db/connection';
import { XSMBDrawModel } from '../../app/lib/db/models/xsmb-draw.model';
import { XSMBSyncLockModel } from '../../app/lib/db/models/xsmb-sync-lock.model';
import { XSMBSyncRunModel } from '../../app/lib/db/models/xsmb-sync-run.model';
import { XSMBSyncAttemptModel } from '../../app/lib/db/models/xsmb-sync-attempt.model';
import { xsmbDrawRepository } from '../../app/lib/db/repositories/xsmb-draw.repository';
import { xsmbSyncLockRepository } from '../../app/lib/db/repositories/xsmb-sync-lock.repository';
import { XSMBSyncService } from '../../app/lib/sync/xsmb-sync.service';
import { XSMBSyncJob } from '../../app/lib/jobs/xsmb-sync.job';
import { DistributedLock } from '../../app/lib/jobs/distributed-lock';
import { XSMBSchedulerService } from '../../app/lib/scheduler/xsmb-scheduler.service';
import { DRAW_STATUS, LOTTERY_TYPE } from '../../app/lib/db/config/status-config';
import { getTodayVN } from '../../app/lib/date-utils';
import { FIXTURE_VALID_RESULTS_1 } from '../fixtures/draw-fixtures';
import type { XSMBProvider } from '../../app/lib/providers/xsmb-provider.interface';

let mongoServer: MongoMemoryServer;

describe('XSMB Scheduler & Background Sync (MongoDB Atlas ONLY)', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await connectToDatabase({ uri });
    await XSMBDrawModel.init();
    await XSMBSyncLockModel.init();
    await XSMBSyncRunModel.init();
    await XSMBSyncAttemptModel.init();
  }, 60000);

  afterAll(async () => {
    await disconnectFromDatabase();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await XSMBDrawModel.deleteMany({});
    await XSMBSyncLockModel.deleteMany({});
    await XSMBSyncRunModel.deleteMany({});
    await XSMBSyncAttemptModel.deleteMany({});
  });

  // ─── 1. Timezone & Phase Evaluation Tests ───────────────────────────────────

  describe('1. Timezone & Phase Evaluation (Asia/Ho_Chi_Minh)', () => {
    it('should correctly evaluate NORMAL, PRE_DRAW, DRAWING, and POST_READY in Asia/Ho_Chi_Minh', () => {
      const scheduler = new XSMBSchedulerService(undefined, undefined, undefined, {
        timezone: 'Asia/Ho_Chi_Minh',
        drawStartTime: '18:15',
        drawEndTime: '18:30',
        normalIntervalMs: 300000,
        preDrawIntervalMs: 60000,
        drawIntervalMs: 15000,
      });

      // 14:00 VN time -> NORMAL (5 min)
      const normalTime = new Date(2026, 8, 2, 14, 0, 0);
      const normalPhase = scheduler.determinePhase(normalTime, false);
      expect(normalPhase.phase).toBe('NORMAL');
      expect(normalPhase.intervalMs).toBe(300000);

      // 18:05 VN time -> PRE_DRAW (1 min)
      const preDrawTime = new Date(2026, 8, 2, 18, 5, 0);
      const preDrawPhase = scheduler.determinePhase(preDrawTime, false);
      expect(preDrawPhase.phase).toBe('PRE_DRAW');
      expect(preDrawPhase.intervalMs).toBe(60000);

      // 18:20 VN time -> DRAWING (15s)
      const drawTime = new Date(2026, 8, 2, 18, 20, 0);
      const drawPhase = scheduler.determinePhase(drawTime, false);
      expect(drawPhase.phase).toBe('DRAWING');
      expect(drawPhase.intervalMs).toBe(15000);

      // 18:20 VN time with isTodayReady = true -> POST_READY (300s / normal)
      const postReadyPhase = scheduler.determinePhase(drawTime, true);
      expect(postReadyPhase.phase).toBe('POST_READY');
      expect(postReadyPhase.intervalMs).toBe(300000); // aggressive polling stopped!
    });
  });

  // ─── 2. In-Process Deduplication Tests ──────────────────────────────────────

  describe('2. In-Process Deduplication', () => {
    it('should reuse in-flight promise for concurrent sync requests on same date', async () => {
      let providerCalls = 0;
      const mockProvider: Partial<XSMBProvider> = {
        providerId: 'mock-provider',
        providerName: 'Mock Provider',
        fetchToday: vi.fn().mockImplementation(async () => {
          providerCalls++;
          await new Promise((r) => setTimeout(r, 40));
          return {
            rawHtml: '<html></html>',
            fetchedAt: new Date(),
            sourceUrl: 'https://test.local',
            httpStatus: 200,
            responseSizeBytes: 100,
          };
        }),
        fetchByDate: vi.fn().mockImplementation(async () => {
          providerCalls++;
          await new Promise((r) => setTimeout(r, 40));
          return {
            rawHtml: '<html></html>',
            fetchedAt: new Date(),
            sourceUrl: 'https://test.local',
            httpStatus: 200,
            responseSizeBytes: 100,
          };
        }),
        healthCheck: vi.fn().mockResolvedValue({
          providerId: 'mock-provider',
          isAvailable: true,
          latencyMs: 10,
          lastCheckedAt: new Date(),
        }),
      };

      const syncService = new XSMBSyncService({
        provider: mockProvider as XSMBProvider,
        drawRepository: xsmbDrawRepository,
      });

      // Mock syncDate on syncService to track calls
      const syncDateSpy = vi.spyOn(syncService, 'syncDate').mockImplementation(async (date) => {
        providerCalls++;
        await new Promise((r) => setTimeout(r, 50));
        return {
          status: 'SUCCESS',
          date,
          syncRunId: 'run-1',
          lotteryType: 'XSMB',
          providerId: 'mock',
          durationMs: 50,
        };
      });

      const lock = new DistributedLock(xsmbSyncLockRepository);
      const job = new XSMBSyncJob(syncService, lock);

      // Execute 3 concurrent requests for today
      const today = getTodayVN();
      const [res1, res2, res3] = await Promise.all([
        job.execute(today),
        job.execute(today),
        job.execute(today),
      ]);

      expect(res1.status).toBe('SUCCESS');
      expect(res2.status).toBe('SUCCESS');
      expect(res3.status).toBe('SUCCESS');
      expect(providerCalls).toBe(1); // Exact deduplication: only 1 sync execution occurred
      expect(syncDateSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ─── 3. MongoDB Uniqueness & Concurrency Protection ──────────────────────────

  describe('3. MongoDB Unique Constraint Protection', () => {
    it('should maintain single document uniqueness under concurrent upserts', async () => {
      const today = getTodayVN();

      // Fire 5 concurrent upserts for the same drawDate and lotteryType
      await Promise.all([
        xsmbDrawRepository.upsert({
          drawDate: today,
          lotteryType: LOTTERY_TYPE.XSMB,
          status: DRAW_STATUS.PARTIAL,
          results: FIXTURE_VALID_RESULTS_1,
        }),
        xsmbDrawRepository.upsert({
          drawDate: today,
          lotteryType: LOTTERY_TYPE.XSMB,
          status: DRAW_STATUS.READY,
          results: FIXTURE_VALID_RESULTS_1,
        }),
        xsmbDrawRepository.upsert({
          drawDate: today,
          lotteryType: LOTTERY_TYPE.XSMB,
          status: DRAW_STATUS.READY,
          results: FIXTURE_VALID_RESULTS_1,
        }),
      ]);

      const count = await XSMBDrawModel.countDocuments({
        drawDate: today,
        lotteryType: LOTTERY_TYPE.XSMB,
      });

      expect(count).toBe(1);
    });
  });

  // ─── 4. Failure Protection & Data Preservation ──────────────────────────────

  describe('4. Failure Protection (No Data Loss / No Fake Data)', () => {
    it('should preserve existing READY record in MongoDB when external provider fails', async () => {
      const today = getTodayVN();

      // Pre-save valid READY record in MongoDB
      await xsmbDrawRepository.create({
        drawDate: today,
        lotteryType: LOTTERY_TYPE.XSMB,
        status: DRAW_STATUS.READY,
        results: FIXTURE_VALID_RESULTS_1,
      });

      // Provider throws persistent network error
      const failingProvider: Partial<XSMBProvider> = {
        providerId: 'failing-provider',
        providerName: 'Failing Provider',
        fetchToday: vi.fn().mockRejectedValue(new Error('503 Service Unavailable')),
        fetchByDate: vi.fn().mockRejectedValue(new Error('503 Service Unavailable')),
        healthCheck: vi.fn().mockResolvedValue({
          providerId: 'failing-provider',
          isAvailable: false,
          error: '503 Service Unavailable',
          lastCheckedAt: new Date(),
        }),
      };

      const syncService = new XSMBSyncService({
        provider: failingProvider as XSMBProvider,
        drawRepository: xsmbDrawRepository,
      });

      const lock = new DistributedLock(xsmbSyncLockRepository);
      const job = new XSMBSyncJob(syncService, lock);

      // Execute sync during outage
      const result = await job.execute(today, { maxRetries: 2, retryDelayMs: 10 });

      // Job completes with safe handling
      expect(result.lockAcquired).toBe(true);

      // Check that existing READY record in MongoDB remains 100% intact and valid
      const docAfterFailure = await xsmbDrawRepository.findByDate(today);
      expect(docAfterFailure).not.toBeNull();
      expect(docAfterFailure?.status).toBe(DRAW_STATUS.READY);
      expect(docAfterFailure?.results?.special[0]).toBe(FIXTURE_VALID_RESULTS_1.special[0]);
    });
  });

  // ─── 5. Graceful Shutdown & Scheduler Lifecycle ─────────────────────────────

  describe('5. Graceful Shutdown', () => {
    it('should cleanly stop scheduler timer and report stopped state', async () => {
      const mockJob: Partial<XSMBSyncJob> = {
        execute: vi.fn().mockResolvedValue({
          status: 'SUCCESS',
          date: '2026-09-02',
          durationMs: 50,
        }),
      };

      const scheduler = new XSMBSchedulerService(
        mockJob as XSMBSyncJob,
        undefined,
        xsmbDrawRepository
      );

      await scheduler.start();
      const statusRunning = await scheduler.getStatus();
      expect(statusRunning.isRunning).toBe(true);

      scheduler.stop();
      const statusStopped = await scheduler.getStatus();
      expect(statusStopped.isRunning).toBe(false);
    });
  });
});
