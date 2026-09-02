/**
 * XSMB Background Job Types
 */

import type { SyncResult } from '../sync/types';

export type JobStatus =
  | 'SUCCESS'
  | 'NO_CHANGE'
  | 'PARTIAL'
  | 'CONFLICT'
  | 'FAILED'
  | 'SKIPPED_LOCKED'
  | 'SKIPPED_RATE_LIMITED';

export interface SyncJobOptions {
  forceUpdate?: boolean;
  allowCorrection?: boolean;
  allowPartial?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  lockTtlSec?: number;
}

export interface SyncJobResult {
  status: JobStatus;
  date: string;
  jobId: string;
  syncRunId?: string;
  durationMs: number;
  attempts: number;
  syncResult?: SyncResult;
  error?: string;
  lockAcquired: boolean;
}
