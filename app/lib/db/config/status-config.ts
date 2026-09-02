/**
 * Controlled Enums and Constants for XSMB Draw & Sync Life Cycle
 */

export const DRAW_STATUS = {
  SCHEDULED: 'SCHEDULED',
  DRAWING: 'DRAWING',
  UPDATING: 'UPDATING',
  READY: 'READY',
  PARTIAL: 'PARTIAL',
  DELAYED: 'DELAYED',
  FAILED: 'FAILED',
  INVALID: 'INVALID',
  CONFLICT: 'CONFLICT',
} as const;

export type DrawStatus = (typeof DRAW_STATUS)[keyof typeof DRAW_STATUS];

export const VALID_DRAW_STATUSES = Object.values(DRAW_STATUS);

export const VALIDATION_STATUS = {
  PENDING: 'PENDING',
  VALID: 'VALID',
  INVALID: 'INVALID',
  CONFLICT: 'CONFLICT',
} as const;

export type ValidationStatus =
  (typeof VALIDATION_STATUS)[keyof typeof VALIDATION_STATUS];

export const VALID_VALIDATION_STATUSES = Object.values(VALIDATION_STATUS);

export const SYNC_RUN_STATUS = {
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  PARTIAL: 'PARTIAL',
} as const;

export type SyncRunStatus =
  (typeof SYNC_RUN_STATUS)[keyof typeof SYNC_RUN_STATUS];

export const VALID_SYNC_RUN_STATUSES = Object.values(SYNC_RUN_STATUS);

export const LOTTERY_TYPE = {
  XSMB: 'XSMB',
} as const;

export type LotteryType = (typeof LOTTERY_TYPE)[keyof typeof LOTTERY_TYPE];

export const SOURCE_TYPE = {
  API: 'API',
  SCRAPER: 'SCRAPER',
  MANUAL: 'MANUAL',
  FALLBACK: 'FALLBACK',
} as const;

export type SourceType = (typeof SOURCE_TYPE)[keyof typeof SOURCE_TYPE];
