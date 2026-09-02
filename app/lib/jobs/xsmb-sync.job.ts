/**
 * XSMB Background Sync Job
 *
 * Encapsulates the execution of a background synchronization run for a given draw date.
 * Enforces:
 * 1. Process-local deduplication (Map<string, Promise<SyncJobResult>>) to prevent duplicate concurrent runs.
 * 2. MongoDB distributed lock acquisition to prevent multi-instance / multi-process collisions.
 * 3. Idempotent synchronization via XSMBSyncService (MongoDB Atlas ONLY).
 * 4. Bounded exponential retry backoff for transient errors.
 * 5. Safe failure handling: Preserves valid existing database records (never deletes/fakes data).
 * 6. Observability logging without leaking credentials/secrets.
 */

import { randomUUID } from 'crypto';
import { getTodayVN } from '../date-utils';
import { xsmbSyncService, XSMBSyncService } from '../sync/xsmb-sync.service';
import { distributedLock, DistributedLock } from './distributed-lock';
import type { SyncJobOptions, SyncJobResult, JobStatus } from './types';
import type { SyncResult } from '../sync/types';

export class XSMBSyncJob {
  // In-process deduplication map: Key = "XSMB:{date}"
  private readonly inFlightJobs = new Map<string, Promise<SyncJobResult>>();

  constructor(
    private readonly syncService: XSMBSyncService = xsmbSyncService,
    private readonly lock: DistributedLock = distributedLock
  ) {}

  /**
   * Executes synchronization for the specified date (defaults to today Vietnam time).
   * Automatically deduplicates concurrent calls for the same date within the process.
   */
  async execute(targetDate?: string, options?: SyncJobOptions): Promise<SyncJobResult> {
    const date = targetDate || getTodayVN();
    const dedupKey = `XSMB:${date}`;

    // ─── 1. In-Process Deduplication ──────────────────────────────────────────
    const existingJob = this.inFlightJobs.get(dedupKey);
    if (existingJob) {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[Sync Job] Sync skipped because already running for date: ${date}`);
      }
      return existingJob;
    }

    // Wrap execution in a tracked Promise
    const executionPromise = this.runJob(date, options).finally(() => {
      this.inFlightJobs.delete(dedupKey);
    });

    this.inFlightJobs.set(dedupKey, executionPromise);
    return executionPromise;
  }

  /**
   * Internal job execution logic with distributed lock and retries.
   */
  private async runJob(date: string, options?: SyncJobOptions): Promise<SyncJobResult> {
    const startTime = Date.now();
    const jobId = `job-sync-${randomUUID()}`;
    const maxRetries = options?.maxRetries ?? 3;
    const baseDelayMs = options?.retryDelayMs ?? 500;
    const lockTtlSec = options?.lockTtlSec ?? 30;

    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Sync Job ${jobId}] Sync triggered for date: ${date}`);
    }

    // ─── 2. MongoDB Distributed Lock Acquisition ─────────────────────────────
    const { acquired, token } = await this.lock.acquire(date, lockTtlSec);
    if (!acquired || !token) {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[Sync Job ${jobId}] Lock skipped / already held for date: ${date}`);
      }
      return {
        status: 'SKIPPED_LOCKED',
        date,
        jobId,
        durationMs: Date.now() - startTime,
        attempts: 0,
        lockAcquired: false,
      };
    }

    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Sync Job ${jobId}] Lock acquired, sync started for date: ${date}`);
    }

    let attempts = 0;
    let lastError: string | undefined;
    let syncResult: SyncResult | undefined;

    try {
      // ─── 3. Bounded Execution with Exponential Backoff Retries ─────────────
      while (attempts < maxRetries) {
        attempts++;
        try {
          syncResult = await this.syncService.syncDate(date, {
            forceUpdate: options?.forceUpdate,
            allowCorrection: options?.allowCorrection,
            allowPartial: options?.allowPartial ?? true,
          });

          // Break retry loop on definitive outcomes
          if (
            syncResult.status === 'SUCCESS' ||
            syncResult.status === 'NO_CHANGE' ||
            syncResult.status === 'PARTIAL' ||
            syncResult.status === 'CONFLICT'
          ) {
            break;
          }

          // FAILED status returned from sync service
          lastError = syncResult.errorMessage || 'Sync service returned FAILED status';

          if (attempts < maxRetries) {
            const delay = baseDelayMs * Math.pow(2, attempts - 1);
            if (process.env.NODE_ENV !== 'test') {
              console.log(
                `[Sync Job ${jobId}] Attempt ${attempts} failed. Retrying in ${delay}ms...`
              );
            }
            await this.sleep(delay);
          }
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
          if (attempts < maxRetries) {
            const delay = baseDelayMs * Math.pow(2, attempts - 1);
            await this.sleep(delay);
          }
        }
      }

      // ─── 4. Map Final Job Status ──────────────────────────────────────────
      let jobStatus: JobStatus = 'FAILED';

      if (syncResult) {
        if (syncResult.status === 'SUCCESS') {
          jobStatus = 'SUCCESS';
        } else if (syncResult.status === 'NO_CHANGE') {
          jobStatus = 'NO_CHANGE';
        } else if (syncResult.status === 'PARTIAL') {
          jobStatus = 'PARTIAL';
        } else if (syncResult.status === 'CONFLICT') {
          jobStatus = 'CONFLICT';
        }
      }

      const durationMs = Date.now() - startTime;
      if (process.env.NODE_ENV !== 'test') {
        if (jobStatus === 'FAILED') {
          console.error(
            `[Sync Job ${jobId}] Sync failed for date ${date}: ${lastError || 'Unknown error'} (Duration: ${durationMs}ms, Attempts: ${attempts})`
          );
        } else {
          console.log(
            `[Sync Job ${jobId}] Sync completed for date ${date} with status: ${jobStatus} (Duration: ${durationMs}ms, Attempts: ${attempts})`
          );
        }
      }

      return {
        status: jobStatus,
        date,
        jobId,
        syncRunId: syncResult?.syncRunId,
        durationMs,
        attempts,
        syncResult,
        error: jobStatus === 'FAILED' ? lastError : undefined,
        lockAcquired: true,
      };
    } finally {
      // ─── 5. Safe Lock Release ──────────────────────────────────────────────
      await this.lock.release(date, token);
    }
  }

  /**
   * Clears the in-memory active jobs map (primarily for testing).
   */
  clearInFlightJobs(): void {
    this.inFlightJobs.clear();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const xsmbSyncJob = new XSMBSyncJob();
