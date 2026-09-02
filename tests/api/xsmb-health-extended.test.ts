/**
 * Extended Health Endpoint Tests (MongoDB Atlas & Scheduler)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { XSMBAPIService } from '../../app/lib/services/xsmb-api.service';
import type { XSMBDrawRepository } from '../../app/lib/db/repositories/xsmb-draw.repository';
import type { XSMBSchedulerService } from '../../app/lib/scheduler/xsmb-scheduler.service';

describe('Extended Health Check', () => {
  let mockRepository: Partial<XSMBDrawRepository>;
  let mockScheduler: Partial<XSMBSchedulerService>;
  let apiService: XSMBAPIService;

  beforeEach(async () => {
    mockRepository = {
      count: vi.fn().mockResolvedValue(125),
    };

    mockScheduler = {
      getStatus: vi.fn().mockResolvedValue({
        isRunning: true,
        currentPhase: 'NORMAL',
        currentIntervalMs: 300000,
        lastTickAt: '2026-09-02T10:00:00.000Z',
        lastSuccessfulSync: {
          date: '2026-09-02',
          timestamp: '2026-09-02T10:00:00.000Z',
          status: 'SUCCESS',
          durationMs: 150,
        },
        lastFailedSync: null,
        lastSyncedDate: '2026-09-02',
        todayDate: '2026-09-02',
        isTodayReady: true,
      }),
    };

    apiService = new XSMBAPIService(
      mockRepository as XSMBDrawRepository,
      mockScheduler as XSMBSchedulerService
    );
  });

  it('should return complete health report including MongoDB and Scheduler info', async () => {
    const health = await apiService.getHealth();

    expect(health.status).toBe('UP');
    expect(health.database).toBe('CONNECTED');
    expect(health.totalDraws).toBe(125);
    expect(health.timestamp).toBeDefined();

    // Scheduler Health
    expect(health.scheduler).toBeDefined();
    expect(health.scheduler?.isRunning).toBe(true);
    expect(health.scheduler?.currentPhase).toBe('NORMAL');
    expect(health.scheduler?.lastTickAt).toBe('2026-09-02T10:00:00.000Z');
  });
});
