/**
 * XSMB Sync Service — Core Types & Contracts
 *
 * Defines structured sync results, error taxonomy, options, and dependency injection contracts.
 */

import type { IXSMBDraw } from '../db/types/db-types';
import type { XSMBProvider } from '../providers/xsmb-provider.interface';
import type { XSMBParser } from '../parsers/types';
import type { XSMBValidator } from '../validator/types';
import type { XSMBDrawRepository } from '../db/repositories/xsmb-draw.repository';
import type { XSMBSyncRunRepository } from '../db/repositories/xsmb-sync-run.repository';
import type { XSMBSyncAttemptRepository } from '../db/repositories/xsmb-sync-attempt.repository';
import type { ProviderLogger } from '../providers/types';

/**
 * High-level status of a synchronization operation
 */
export type SyncStatus =
  | 'SUCCESS'
  | 'NO_CHANGE'
  | 'PARTIAL'
  | 'FAILED'
  | 'CONFLICT';

/**
 * Standard error categories for synchronization failures
 */
export type SyncErrorCode =
  | 'PROVIDER_ERROR'
  | 'PARSER_ERROR'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'CONFLICT'
  | 'DATE_MISMATCH'
  | 'UNKNOWN_ERROR';

/**
 * Structured outcome returned by XSMBSyncService.syncDate / syncToday
 */
export interface SyncResult {
  /** Outcome status: SUCCESS, NO_CHANGE, PARTIAL, FAILED, or CONFLICT */
  status: SyncStatus;

  /** Requested draw date in YYYY-MM-DD format */
  date: string;

  /** Unique sync run ID identifying this execution */
  syncRunId: string;

  /** Strict lottery identifier */
  lotteryType: 'XSMB';

  /** Stored or retrieved draw document */
  draw?: IXSMBDraw;

  /** Standardized error classification if unsuccessful */
  errorCode?: SyncErrorCode;

  /** Human-readable error message (safe for telemetry, no stack traces) */
  errorMessage?: string;

  /** Detailed list of validation errors if validation failed */
  validationErrors?: string[];

  /** Duration of the sync operation in milliseconds */
  durationMs: number;

  /** Provider identifier that fulfilled the request */
  providerId: string;

  /** HTTP response status received from upstream provider */
  httpStatus?: number;

  /** Computed cryptographic checksum of validated draw data (SHA-256) */
  checksum?: string;

  /** True if this sync operation recorded a verified correction */
  isCorrection?: boolean;
}

/**
 * Aggregated outcome for batch date synchronization
 */
export interface BatchSyncResult {
  /** Unique sync run ID for the batch run */
  syncRunId: string;

  /** Start of the date range (YYYY-MM-DD) */
  startDate: string;

  /** End of the date range (YYYY-MM-DD) */
  endDate: string;

  /** Total number of dates processed */
  totalRequested: number;

  /** Number of dates successfully synced to READY */
  successful: number;

  /** Number of dates where stored data matched source (no DB write needed) */
  noChange: number;

  /** Number of dates synced as PARTIAL in-progress results */
  partial: number;

  /** Number of dates that failed sync */
  failed: number;

  /** Number of dates flagged with data conflicts */
  conflicts: number;

  /** Individual results for each date */
  results: SyncResult[];

  /** Total duration in milliseconds */
  durationMs: number;
}

/**
 * Configuration options for sync execution
 */
export interface SyncOptions {
  /**
   * Force update: bypass NO_CHANGE optimization and overwrite document if checksums match.
   */
  forceUpdate?: boolean;

  /**
   * Allow partial draws to be persisted with status PARTIAL (default: true).
   */
  allowPartial?: boolean;

  /**
   * Allow verified corrections to overwrite an existing READY draw (default: false).
   */
  allowCorrection?: boolean;

  /**
   * External syncRunId if part of a parent batch or scheduled pipeline.
   */
  syncRunId?: string;

  /**
   * Fixed clock reference for deterministic testing.
   */
  now?: Date;
}

/**
 * Dependency injection interface for XSMBSyncService
 */
export interface XSMBSyncDependencies {
  provider?: XSMBProvider;
  parser?: XSMBParser;
  validator?: XSMBValidator;
  drawRepository?: XSMBDrawRepository;
  syncRunRepository?: XSMBSyncRunRepository;
  syncAttemptRepository?: XSMBSyncAttemptRepository;
  logger?: ProviderLogger;
}
