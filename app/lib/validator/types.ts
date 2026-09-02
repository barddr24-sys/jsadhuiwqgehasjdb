/**
 * Strict XSMB Validator & Data Integrity Layer — Types & Contracts
 *
 * Defines strongly typed models for deterministic lottery data validation,
 * error taxonomy, non-fatal warnings, and multi-source conflict verification.
 */

import type { NormalizedXSMBResult } from '../parsers/types';
import type { PrizeTierKey } from '../db/config/prize-config';

/**
 * 4-state canonical validation outcome
 */
export type XSMBValidationStatus = 'VALID' | 'PARTIAL' | 'INVALID' | 'CONFLICT';

/**
 * Stable validation error codes for programmatic handling
 */
export type XSMBValidationErrorCode =
  | 'INVALID_DATE'
  | 'INVALID_LOTTERY_TYPE'
  | 'MISSING_RESULTS'
  | 'MISSING_PRIZE_TIER'
  | 'COUNT_MISMATCH'
  | 'INVALID_NUMBER_TYPE'
  | 'INVALID_NUMBER_FORMAT'
  | 'INVALID_DIGIT_LENGTH'
  | 'EMPTY_NUMBER'
  | 'DATE_MISMATCH'
  | 'INVALID_SOURCE'
  | 'PARSER_ERROR'
  | 'STRUCTURE_ERROR'
  | 'SOURCE_CONFLICT';

/**
 * Structured validation error with debugging context
 */
export interface XSMBValidationError {
  code: XSMBValidationErrorCode;
  message: string;
  tier?: PrizeTierKey;
  index?: number;
  expected?: number | string | number[] | string[];
  actual?: number | string | number[] | string[] | unknown;
  value?: unknown;
  field?: string;
  details?: Record<string, unknown>;
}

/**
 * Non-fatal validation warning codes
 */
export type XSMBValidationWarningCode =
  | 'SOURCE_METADATA_INCOMPLETE'
  | 'UNEXPECTED_OPTIONAL_FIELD'
  | 'STALE_FETCH_TIMESTAMP'
  | 'FUTURE_FETCH_TIMESTAMP'
  | 'SUSPICIOUS_DUPLICATE_NUMBER';

/**
 * Structured non-fatal warning
 */
export interface XSMBValidationWarning {
  code: XSMBValidationWarningCode;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

/**
 * Diagnostic metrics gathered during validation pass
 */
export interface XSMBValidationDiagnostics {
  totalNumbersCount: number;
  validNumbersCount: number;
  tierCounts: Record<PrizeTierKey, number>;
  isComplete: boolean;
  hasConflict?: boolean;
}

/**
 * Full deterministic outcome returned by the strict validator
 */
export interface XSMBValidationResult {
  /** True strictly when status === 'VALID' and 0 errors present */
  valid: boolean;

  /** Canonical status: VALID, PARTIAL, INVALID, or CONFLICT */
  status: XSMBValidationStatus;

  /** Structured error list detailing validation failures */
  errors: XSMBValidationError[];

  /** Non-fatal diagnostic warnings */
  warnings: XSMBValidationWarning[];

  /** Timestamp of validation execution */
  validatedAt: Date;

  /** Centralized validator version string (e.g. "1.0.0") */
  validatorVersion: string;

  /** Reference to the input data that was validated */
  data?: NormalizedXSMBResult;

  /** Optional internal metrics on counts and completeness */
  diagnostics?: XSMBValidationDiagnostics;
}

/**
 * Options configuring validator behavior
 */
export interface XSMBValidationOptions {
  /** Requested draw date to enforce cross-check (produces DATE_MISMATCH on failure) */
  expectedDrawDate?: string;

  /** Enforce source provenance fields as hard errors instead of non-fatal warnings */
  strictSourceMetadata?: boolean;

  /** Allow partial in-progress draw without emitting missing tier errors */
  allowPartial?: boolean;

  /** Fixed clock reference for deterministic testing of timestamps */
  now?: Date;
}

/**
 * Primary validator contract
 */
export interface XSMBValidator {
  readonly validatorVersion: string;
  validate(data: NormalizedXSMBResult, options?: XSMBValidationOptions): XSMBValidationResult;
}

/**
 * Multi-source comparison outcome
 */
export interface MultiSourceComparisonResult {
  hasConflict: boolean;
  status: XSMBValidationStatus;
  conflicts: XSMBValidationError[];
  providerIds: string[];
  agreedResult?: NormalizedXSMBResult;
  individualResults: Array<{
    providerId: string;
    validation: XSMBValidationResult;
  }>;
}
