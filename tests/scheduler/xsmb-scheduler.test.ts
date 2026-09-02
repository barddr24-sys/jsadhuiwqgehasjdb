/**
 * XSMB Scheduler Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { XSMBSchedulerService } from '../../app/lib/scheduler/xsmb-scheduler.service';
import type { XSMBSyncJob } from '../../app/lib/jobs/xsmb-sync.job';
import type { XSMBSyncService } from '../../app/lib/sync/xsmb-sync.service';
import type { XSMBDrawRepository } from '../../app/lib/db/repositories/xsmb-draw.repository';

describe('XSMBSchedulerService', () => {
  let mockJob: Partial<XSMBSyncJob>;
  let mockSyncService: Partial<XSMBSyncService>;
  let mockRepository: Partial<XSMBDrawRepository>;
  let scheduler: XSMBSchedulerService;

  beforeEach(() => {
    mockJob = {
      execute: vi.fn(),
    };
    mockSyncService = {
      syncToday: vi.fn(),
      syncDate: vi.fn(),
      syncDateRange: vi.fn(),
    };
    mockRepository = {
      findByDate: vi.fn(),
    };

    scheduler = new XSMBSchedulerService(
      mockJob as XSMBSyncJob,
      mockSyncService as XSMBSyncService,
      mockRepository as XSMBDrawRepository,
      {
        drawStartTime: '18:15',
        drawEndTime: '18:30',
        normalIntervalMs: 300000,
        preDrawIntervalMs: 60000,
        drawIntervalMs: 15000,
      }
    );
  });

  describe('1. Polling Phase Evaluation', () => {
    it('should identify NORMAL phase during morning/afternoon hours', () => {
      // 10:30 Vietnam time
      const time1030 = new Date(2026, 8, 2, 10, 30, 0);
      const res = scheduler.determinePhase(time1030, false);

      expect(res.phase).toBe('NORMAL');
      expect(res.intervalMs).toBe(300000);
    });

    it('should identify PRE_DRAW phase in the 15 minutes leading up to draw', () => {
      // 18:05 Vietnam time
      const time1805 = new Date(2026, 8, 2, 18, 5, 0);
      const res = scheduler.determinePhase(time1805, false);

      expect(res.phase).toBe('PRE_DRAW');
      expect(res.intervalMs).toBe(60000);
    });

    it('should identify DRAWING phase during the draw window (18:15 - 18:30)', () => {
      // 18:22 Vietnam time
      const time1822 = new Date(2026, 8, 2, 18, 22, 0);
      const res = scheduler.determinePhase(time1822, false);

      expect(res.phase).toBe('DRAWING');
      expect(res.intervalMs).toBe(15000);
    });

    it('should stop aggressive polling and transition to POST_READY once today draw is READY', () => {
      // 18:25 Vietnam time, but draw is already READY
      const time1825 = new Date(2026, 8, 2, 18, 25, 0);
      const res = scheduler.determinePhase(time1825, true);

      expect(res.phase).toBe('POST_READY');
      expect(res.intervalMs).toBe(300000); // Reverts to normal 5-minute interval
    });
  });

  describe('2. Execution & Error Resilience', () => {
    it('should execute tick, invoke job, and record status', async () => {
      vi.mocked(mockRepository.findByDate!).mockResolvedValue(null);
      vi.mocked(mockJob.execute!).mockResolvedValue({
        jobId: 'job-1',
        status: 'SUCCESS',
        date: '2026-09-02',
        durationMs: 120,
        attempts: 1,
        lockAcquired: true,
      });

      await scheduler.start();
      const tickResult = await scheduler.tick();

      expect(tickResult).not.toBeNull();
      expect(tickResult?.status).toBe('SUCCESS');
      expect(mockJob.execute).toHaveBeenCalled();

      const status = await scheduler.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.lastTickAt).not.toBeNull();
      expect(status.lastSyncResult?.status).toBe('SUCCESS');

      scheduler.stop();
      const stoppedStatus = await scheduler.getStatus();
      expect(stoppedStatus.isRunning).toBe(false);
    });

    it('should survive tick errors without crashing or throwing', async () => {
      vi.mocked(mockRepository.findByDate!).mockResolvedValue(null);
      vi.mocked(mockJob.execute!).mockRejectedValue(new Error('Critical network failure'));

      await scheduler.start();
      const tickResult = await scheduler.tick();

      // Tick completes gracefully returning null or error state without throwing
      expect(tickResult).toBeNull();

      const status = await scheduler.getStatus();
      expect(status.isRunning).toBe(true);

      scheduler.stop();
    });
  });

  describe('3. Manual Sync & Backfill Delegation', () => {
    it('should delegate syncToday, syncDate, and syncDateRange to XSMBSyncService', async () => {
      vi.mocked(mockSyncService.syncToday!).mockResolvedValue({
        status: 'SUCCESS',
        date: '2026-09-02',
        syncRunId: 'r1',
        lotteryType: 'XSMB',
        providerId: 'primary-web-provider',
        durationMs: 10,
      });
      vi.mocked(mockSyncService.syncDate!).mockResolvedValue({
        status: 'SUCCESS',
        date: '2026-09-01',
        syncRunId: 'r2',
        lotteryType: 'XSMB',
        providerId: 'primary-web-provider',
        durationMs: 10,
      });
      vi.mocked(mockSyncService.syncDateRange!).mockResolvedValue({
        syncRunId: 'batch-1',
        startDate: '2026-08-01',
        endDate: '2026-08-05',
        totalRequested: 5,
        successful: 5,
        noChange: 0,
        partial: 0,
        failed: 0,
        conflicts: 0,
        results: [],
        durationMs: 50,
      });
      mockSyncService.syncRecentDraws = vi.fn().mockResolvedValue({
        syncRunId: 'batch-2',
        startDate: '2026-08-26',
        endDate: '2026-09-02',
        totalRequested: 7,
        successful: 7,
        noChange: 0,
        partial: 0,
        failed: 0,
        conflicts: 0,
        results: [],
        durationMs: 70,
      });

      await scheduler.syncToday();
      expect(mockSyncService.syncToday).toHaveBeenCalled();

      await scheduler.syncDate('2026-09-01');
      expect(mockSyncService.syncDate).toHaveBeenCalledWith('2026-09-01');

      await scheduler.syncDateRange('2026-08-01', '2026-08-05');
      expect(mockSyncService.syncDateRange).toHaveBeenCalledWith('2026-08-01', '2026-08-05');

      await scheduler.syncRecentDraws(7);
      expect(mockSyncService.syncRecentDraws).toHaveBeenCalledWith(7);
    });
  });
});
