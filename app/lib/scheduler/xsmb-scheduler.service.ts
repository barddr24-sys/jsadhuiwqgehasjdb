/**
 * XSMB Background Scheduler Service
 *
 * Coordinates time-aware lottery synchronization based on the Vietnam business clock (Asia/Ho_Chi_Minh).
 *
 * Responsibilities:
 * 1. Evaluates draw phase: NORMAL -> PRE_DRAW -> DRAWING -> POST_READY.
 * 2. Dynamically adjusts polling frequency based on phase and today's draw completion status in MongoDB Atlas.
 * 3. Immediately stops aggressive polling once today's draw reaches READY.
 * 4. Isolates execution in background jobs (XSMBSyncJob); survives any single job failure without terminating.
 * 5. Provides manual sync & historical backfill interfaces (syncToday, syncDate, syncRecentDraws).
 * 6. Exposes operational health metrics without leaking credentials/secrets.
 */

import { getNowVN, getTodayVN } from '../date-utils';
import { getSchedulerConfig, parseTimeToMinutes, SchedulerConfig } from './scheduler-config';
import { xsmbSyncJob, XSMBSyncJob } from '../jobs/xsmb-sync.job';
import { xsmbDrawRepository, XSMBDrawRepository } from '../db/repositories/xsmb-draw.repository';
import { xsmbSyncService, XSMBSyncService } from '../sync/xsmb-sync.service';
import type { SyncJobResult } from '../jobs/types';
import type { SyncResult, BatchSyncResult } from '../sync/types';

export type SchedulerPhase = 'NORMAL' | 'PRE_DRAW' | 'DRAWING' | 'POST_READY';

export interface SchedulerSyncMetric {
  date: string;
  timestamp: string;
  durationMs?: number;
  status?: string;
  error?: string;
}

export interface SchedulerStatus {
  isRunning: boolean;
  currentPhase: SchedulerPhase;
  currentIntervalMs: number;
  lastTickAt: string | null;
  lastSuccessfulSync: SchedulerSyncMetric | null;
  lastFailedSync: SchedulerSyncMetric | null;
  lastSyncedDate: string | null;
  lastSyncResult: {
    date: string;
    status: string;
    durationMs: number;
  } | null;
  todayDate: string;
  isTodayReady: boolean;
}

export class XSMBSchedulerService {
  private config: SchedulerConfig;
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;
  private lastTickAt: Date | null = null;
  private lastSyncResult: SyncJobResult | null = null;
  private lastSuccessfulSync: SchedulerSyncMetric | null = null;
  private lastFailedSync: SchedulerSyncMetric | null = null;
  private lastSyncedDate: string | null = null;

  constructor(
    private readonly job: XSMBSyncJob = xsmbSyncJob,
    private readonly syncService: XSMBSyncService = xsmbSyncService,
    private readonly drawRepository: XSMBDrawRepository = xsmbDrawRepository,
    customConfig?: Partial<SchedulerConfig>
  ) {
    this.config = { ...getSchedulerConfig(), ...customConfig };
  }

  /**
   * Evaluates the current schedule phase and corresponding polling interval.
   */
  determinePhase(
    nowVN: Date = getNowVN(),
    isTodayReady: boolean = false
  ): { phase: SchedulerPhase; intervalMs: number } {
    const startMinutes = parseTimeToMinutes(this.config.drawStartTime).totalMinutes; // e.g. 18*60+15 = 1095
    const endMinutes = parseTimeToMinutes(this.config.drawEndTime).totalMinutes;     // e.g. 18*60+30 = 1110
    const preDrawStart = startMinutes - this.config.preDrawLeadMinutes;            // e.g. 18*60+00 = 1080

    const currentMinutes = nowVN.getHours() * 60 + nowVN.getMinutes();

    // 1. If today's draw is already READY, stop aggressive polling immediately
    if (isTodayReady) {
      return {
        phase: 'POST_READY',
        intervalMs: this.config.normalIntervalMs,
      };
    }

    // 2. Pre-draw window (e.g. 18:00 - 18:15)
    if (currentMinutes >= preDrawStart && currentMinutes < startMinutes) {
      return {
        phase: 'PRE_DRAW',
        intervalMs: this.config.preDrawIntervalMs,
      };
    }

    // 3. Draw window (e.g. 18:15 - 18:30 or up to 19:30 if still not complete)
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes + 60) {
      return {
        phase: 'DRAWING',
        intervalMs: this.config.drawIntervalMs,
      };
    }

    // 4. Normal hours (e.g. 00:00 - 18:00, or late night)
    return {
      phase: 'NORMAL',
      intervalMs: this.config.normalIntervalMs,
    };
  }

  /**
   * Starts the scheduler loop.
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Scheduler] XSMB Scheduler started in timezone ${this.config.timezone}`);
    }

    // Schedule first tick immediately (async execution)
    this.scheduleNextTick(100);
  }

  /**
   * Stops the scheduler loop cleanly.
   */
  stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (process.env.NODE_ENV !== 'test') {
      console.log('[Scheduler] XSMB Scheduler stopped');
    }
  }

  /**
   * Core scheduler tick.
   * Executes background job, records metrics, and schedules the subsequent tick.
   */
  async tick(): Promise<SyncJobResult | null> {
    if (!this.isRunning) return null;

    this.lastTickAt = new Date();
    const todayVN = getTodayVN();
    const nowVN = getNowVN();

    // Check if today is already READY in MongoDB
    let isTodayReady = false;
    try {
      const existing = await this.drawRepository.findByDate(todayVN);
      isTodayReady = existing?.status === 'READY';
    } catch {
      // MongoDB check failure, continue safely
    }

    const { phase } = this.determinePhase(nowVN, isTodayReady);

    // If today is READY and we are outside the immediate draw window, skip triggering provider fetch
    let jobResult: SyncJobResult | null = null;
    const shouldExecuteSync =
      phase === 'DRAWING' || phase === 'PRE_DRAW' || (!isTodayReady && phase === 'NORMAL');

    if (shouldExecuteSync) {
      try {
        jobResult = await this.job.execute(todayVN, {
          maxRetries: this.config.maxRetries,
        });

        this.lastSyncResult = jobResult;
        this.lastSyncedDate = todayVN;

        if (
          jobResult.status === 'SUCCESS' ||
          jobResult.status === 'NO_CHANGE' ||
          jobResult.status === 'PARTIAL'
        ) {
          this.lastSuccessfulSync = {
            date: todayVN,
            timestamp: new Date().toISOString(),
            durationMs: jobResult.durationMs,
            status: jobResult.status,
          };
        } else if (jobResult.status === 'FAILED') {
          this.lastFailedSync = {
            date: todayVN,
            timestamp: new Date().toISOString(),
            error: jobResult.error,
          };
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn(
            '[Scheduler] Sync job threw error during tick:',
            err instanceof Error ? err.message : err
          );
        }
        this.lastFailedSync = {
          date: todayVN,
          timestamp: new Date().toISOString(),
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

    // Re-check phase for next tick (if draw just reached READY, next interval will be normal)
    const nextPhase = this.determinePhase(
      getNowVN(),
      isTodayReady || jobResult?.syncResult?.draw?.status === 'READY'
    );

    if (this.isRunning) {
      this.scheduleNextTick(nextPhase.intervalMs);
    }

    return jobResult;
  }

  /**
   * Schedules the next tick after intervalMs.
   */
  private scheduleNextTick(delayMs: number): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(async () => {
      if (this.isRunning) {
        await this.tick();
      }
    }, delayMs);

    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  // ─── Manual Sync & Backfill Methods ──────────────────────────────────────────

  /**
   * Manual sync for today's lottery draw.
   */
  async syncToday(): Promise<SyncResult> {
    return this.syncService.syncToday();
  }

  /**
   * Manual sync for a specific date (YYYY-MM-DD).
   */
  async syncDate(date: string): Promise<SyncResult> {
    return this.syncService.syncDate(date);
  }

  /**
   * Controlled historical backfill over a date range.
   */
  async syncDateRange(startDate: string, endDate: string): Promise<BatchSyncResult> {
    return this.syncService.syncDateRange(startDate, endDate);
  }

  /**
   * Controlled synchronization for recent missing draws (bounded).
   */
  async syncRecentDraws(limit: number = 90): Promise<BatchSyncResult> {
    return this.syncService.syncRecentDraws(limit);
  }

  /**
   * Proactively ensures the recent N days of historical draws exist in MongoDB Atlas.
   * Runs asynchronously in the background.
   */
  async ensureRecentHistory(days: number = 90): Promise<void> {
    try {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[Scheduler] Checking and ensuring last ${days} days of historical draws...`);
      }
      const result = await this.syncService.syncRecentDraws(days, { rateLimitDelayMs: 200 });
      if (process.env.NODE_ENV !== 'test') {
        console.log(
          `[Scheduler] Historical sync check completed: ${result.successful} fetched, ${result.noChange} current, ${result.failed} failed out of ${result.totalRequested} requested.`
        );
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[Scheduler] ensureRecentHistory encountered an error:', err);
      }
    }
  }

  /**
   * Returns current scheduler operational status and observability metrics.
   */
  async getStatus(): Promise<SchedulerStatus> {
    const todayVN = getTodayVN();
    const nowVN = getNowVN();

    let isTodayReady = false;
    try {
      const existing = await this.drawRepository.findByDate(todayVN);
      isTodayReady = existing?.status === 'READY';
    } catch {
      // Ignore
    }

    const { phase, intervalMs } = this.determinePhase(nowVN, isTodayReady);

    return {
      isRunning: this.isRunning,
      currentPhase: phase,
      currentIntervalMs: intervalMs,
      lastTickAt: this.lastTickAt ? this.lastTickAt.toISOString() : null,
      lastSuccessfulSync: this.lastSuccessfulSync,
      lastFailedSync: this.lastFailedSync,
      lastSyncedDate: this.lastSyncedDate,
      lastSyncResult: this.lastSyncResult
        ? {
            date: this.lastSyncResult.date,
            status: this.lastSyncResult.status,
            durationMs: this.lastSyncResult.durationMs,
          }
        : null,
      todayDate: todayVN,
      isTodayReady,
    };
  }
}

export const xsmbSchedulerService = new XSMBSchedulerService();
