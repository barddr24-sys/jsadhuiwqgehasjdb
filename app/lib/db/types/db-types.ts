/**
 * MongoDB Data Layer Type Definitions & Interfaces
 */

import type {
  DrawStatus,
  ValidationStatus,
  SyncRunStatus,
  LotteryType,
  SourceType,
} from '../config/status-config';

/**
 * 8 Prize Tiers of XSMB. All numbers must be strings.
 */
export interface IXSMBDrawResults {
  special: string[];
  firstPrize: string[];
  secondPrize: string[];
  thirdPrize: string[];
  fourthPrize: string[];
  fifthPrize: string[];
  sixthPrize: string[];
  seventhPrize: string[];
}

export interface IXSMBDrawSource {
  providerId?: string;
  providerName?: string;
  sourceUrl?: string;
  fetchedAt?: Date;
  verifiedAt?: Date;
  checksum?: string;
}

export interface IXSMBDrawSync {
  syncRunId?: string;
  lastSyncAt?: Date;
  attemptCount?: number;
  rawHash?: string;
}

export interface IXSMBDrawValidation {
  status: ValidationStatus;
  validatedAt?: Date;
  validatorVersion?: string;
  errors?: string[];
}

export interface IXSMBDrawCorrection {
  isCorrected: boolean;
  correctedAt?: Date;
  reason?: string;
  previousChecksum?: string;
}

/**
 * Primary XSMB Draw Document Interface
 */
export interface IXSMBDraw {
  _id?: unknown;
  drawDate: string; // YYYY-MM-DD
  lotteryType: LotteryType; // "XSMB"
  province?: string;
  status: DrawStatus;
  results: IXSMBDrawResults;
  source?: IXSMBDrawSource;
  sync?: IXSMBDrawSync;
  validation?: IXSMBDrawValidation;
  correction?: IXSMBDrawCorrection;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Source Provider Metadata Document Interface
 */
export interface IXSMBSource {
  _id?: unknown;
  providerId: string;
  providerName: string;
  type: SourceType | string;
  baseUrl: string;
  priority: number;
  enabled: boolean;
  reliability?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sync Run Document Interface
 */
export interface IXSMBSyncRun {
  _id?: unknown;
  syncRunId: string;
  providerId: string;
  startedAt: Date;
  finishedAt?: Date;
  status: SyncRunStatus;
  recordsFetched: number;
  recordsAccepted: number;
  recordsRejected: number;
  conflicts: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sync Attempt Document Interface
 */
export interface IXSMBSyncAttempt {
  _id?: unknown;
  syncRunId: string;
  providerId: string;
  requestedDate: string;
  startedAt: Date;
  finishedAt?: Date;
  status: 'SUCCESS' | 'NO_CHANGE' | 'PARTIAL' | 'FAILED' | 'CONFLICT';
  httpStatus?: number;
  responseHash?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── DTOs & Query Filters ───────────────────────────────────────────────────

export interface CreateDrawDTO {
  drawDate: string;
  lotteryType?: LotteryType;
  province?: string;
  status?: DrawStatus;
  results?: Partial<IXSMBDrawResults>;
  source?: IXSMBDrawSource;
  sync?: IXSMBDrawSync;
  validation?: IXSMBDrawValidation;
  correction?: IXSMBDrawCorrection;
  completedAt?: Date;
}

export interface UpsertDrawDTO {
  drawDate: string;
  lotteryType?: LotteryType;
  province?: string;
  status?: DrawStatus;
  results?: Partial<IXSMBDrawResults>;
  source?: IXSMBDrawSource;
  sync?: IXSMBDrawSync;
  validation?: IXSMBDrawValidation;
  correction?: IXSMBDrawCorrection;
  completedAt?: Date;
}

export interface DrawHistoryFilter {
  lotteryType?: LotteryType | string;
  status?: DrawStatus;
  startDate?: string;
  endDate?: string;
  province?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CreateSourceDTO {
  providerId: string;
  providerName: string;
  type?: SourceType | string;
  baseUrl: string;
  priority?: number;
  enabled?: boolean;
  reliability?: number;
}

export interface CreateSyncRunDTO {
  syncRunId: string;
  providerId: string;
  startedAt?: Date;
  status?: SyncRunStatus;
  recordsFetched?: number;
  recordsAccepted?: number;
  recordsRejected?: number;
  conflicts?: number;
}

export interface FinishSyncRunDTO {
  finishedAt?: Date;
  status: SyncRunStatus;
  recordsFetched?: number;
  recordsAccepted?: number;
  recordsRejected?: number;
  conflicts?: number;
  error?: string;
}

export interface CreateSyncAttemptDTO {
  syncRunId: string;
  providerId: string;
  requestedDate: string;
  startedAt?: Date;
  finishedAt?: Date;
  status: 'SUCCESS' | 'NO_CHANGE' | 'PARTIAL' | 'FAILED' | 'CONFLICT';
  httpStatus?: number;
  responseHash?: string;
  errorCode?: string;
  errorMessage?: string;
}
