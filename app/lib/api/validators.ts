/**
 * Request Parameter Validation & Normalization for XSMB REST API
 */

import { XSMBAPIError } from './api-response';
import { isValidDateStr } from '../date-utils';

/**
 * Validates a YYYY-MM-DD date route parameter.
 * Throws XSMBAPIError(INVALID_DATE, 400) if invalid.
 */
export function validateDateParam(dateStr: string | null | undefined): string {
  if (!dateStr || typeof dateStr !== 'string') {
    throw XSMBAPIError.badRequest(
      'INVALID_DATE',
      'Date parameter is required and must be in YYYY-MM-DD format.'
    );
  }

  const trimmed = dateStr.trim();
  if (!isValidDateStr(trimmed)) {
    throw XSMBAPIError.badRequest(
      'INVALID_DATE',
      `Invalid date '${dateStr}'. Expected valid calendar date in YYYY-MM-DD format.`
    );
  }

  return trimmed;
}

/**
 * Validates and normalizes a 2-digit lottery number parameter (00-99).
 * - "3" -> "03"
 * - "23" -> "23"
 * - "123" -> error
 * - "abc" -> error
 * Throws XSMBAPIError(INVALID_NUMBER, 400) if invalid.
 */
export function validateNumberParam(numberStr: string | null | undefined): string {
  if (numberStr === undefined || numberStr === null || typeof numberStr !== 'string') {
    throw XSMBAPIError.badRequest(
      'INVALID_NUMBER',
      'Number parameter is required.'
    );
  }

  const trimmed = numberStr.trim();

  // Reject non-integer characters (dots, letters, symbols, signs)
  if (!/^\d{1,2}$/.test(trimmed)) {
    throw XSMBAPIError.badRequest(
      'INVALID_NUMBER',
      `Invalid number '${numberStr}'. Must be a 2-digit integer between 00 and 99.`
    );
  }

  // Normalize single digit e.g. "3" -> "03"
  const normalized = trimmed.length === 1 ? `0${trimmed}` : trimmed;
  return normalized;
}

/**
 * Validates the statistics days query parameter.
 * Allows 3, 7, 30, or 90 days. Defaults to 7 if not provided.
 * Throws XSMBAPIError(INVALID_STATISTICS_PERIOD, 400) if invalid.
 */
export function validateDaysParam(daysStr: string | null | undefined, defaultDays: number = 7): number {
  if (daysStr === null || daysStr === undefined || daysStr.trim() === '') {
    return defaultDays;
  }

  const trimmed = daysStr.trim();
  const parsed = parseInt(trimmed, 10);

  if (isNaN(parsed) || parsed <= 0 || parsed > 365 || String(parsed) !== trimmed) {
    throw XSMBAPIError.badRequest(
      'INVALID_STATISTICS_PERIOD',
      `Invalid statistics period '${daysStr}'. Allowed values: 3, 7, 30, 90 (or any positive integer up to 365).`
    );
  }

  return parsed;
}

/**
 * Validates pagination query parameters.
 * page >= 1
 * 1 <= pageSize <= 100
 * Throws XSMBAPIError(INVALID_PAGINATION, 400) if invalid.
 */
export function validatePaginationParams(
  pageStr: string | null | undefined,
  pageSizeStr: string | null | undefined,
  defaultPage: number = 1,
  defaultPageSize: number = 20
): { page: number; pageSize: number } {
  let page = defaultPage;
  let pageSize = defaultPageSize;

  if (pageStr !== null && pageStr !== undefined && pageStr.trim() !== '') {
    const trimmed = pageStr.trim();
    if (!/^\d+$/.test(trimmed)) {
      throw XSMBAPIError.badRequest(
        'INVALID_PAGINATION',
        `Invalid page parameter '${pageStr}'. Must be a positive integer.`
      );
    }
    page = parseInt(trimmed, 10);
    if (page < 1) {
      throw XSMBAPIError.badRequest(
        'INVALID_PAGINATION',
        'Page must be greater than or equal to 1.'
      );
    }
  }

  if (pageSizeStr !== null && pageSizeStr !== undefined && pageSizeStr.trim() !== '') {
    const trimmed = pageSizeStr.trim();
    if (!/^\d+$/.test(trimmed)) {
      throw XSMBAPIError.badRequest(
        'INVALID_PAGINATION',
        `Invalid pageSize parameter '${pageSizeStr}'. Must be a positive integer.`
      );
    }
    pageSize = parseInt(trimmed, 10);
    if (pageSize < 1 || pageSize > 100) {
      throw XSMBAPIError.badRequest(
        'INVALID_PAGINATION',
        'PageSize must be between 1 and 100.'
      );
    }
  }

  return { page, pageSize };
}

export type TwoDigitRangeParam = 'today' | 'yesterday' | '7days' | '30days' | '90days';

/**
 * Validates range query parameter for two-digit table statistics.
 * Allowed values: 'today', 'yesterday', '7days', '30days', '90days' (and common aliases).
 */
export function validateTwoDigitRangeParam(
  rangeStr: string | null | undefined,
  defaultRange: TwoDigitRangeParam = 'today'
): TwoDigitRangeParam {
  if (rangeStr === null || rangeStr === undefined || rangeStr.trim() === '') {
    return defaultRange;
  }

  const trimmed = rangeStr.trim().toLowerCase();
  if (trimmed === 'today' || trimmed === '1' || trimmed === '1day') return 'today';
  if (trimmed === 'yesterday' || trimmed === 'hom-qua') return 'yesterday';
  if (trimmed === '7days' || trimmed === '7' || trimmed === '7day') return '7days';
  if (trimmed === '30days' || trimmed === '30' || trimmed === '30day') return '30days';
  if (trimmed === '90days' || trimmed === '90' || trimmed === '90day') return '90days';

  throw XSMBAPIError.badRequest(
    'INVALID_RANGE_PARAM',
    `Invalid range parameter '${rangeStr}'. Allowed values: 'today', 'yesterday', '7days', '30days', '90days'.`
  );
}

/**
 * Validates range query parameter for deep statistics.
 * Accepts: 'today', 'yesterday', '3days', '7days', '14days', '30days', '90days', or numeric days string.
 */
export function validateStatisticsRangeParam(
  rangeStr: string | null | undefined,
  defaultRange: string = '30days'
): string {
  if (rangeStr === null || rangeStr === undefined || rangeStr.trim() === '') {
    return defaultRange;
  }

  const trimmed = rangeStr.trim().toLowerCase();
  if (
    trimmed === 'today' ||
    trimmed === 'yesterday' ||
    trimmed === '3days' ||
    trimmed === '7days' ||
    trimmed === '14days' ||
    trimmed === '30days' ||
    trimmed === '90days' ||
    trimmed === 'custom'
  ) {
    return trimmed;
  }

  // Check if numeric (e.g. "3", "7", "14", "30")
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num > 0 && num <= 365 && String(num) === trimmed) {
    if (num === 1) return 'today';
    if (num <= 3) return '3days';
    if (num <= 7) return '7days';
    if (num <= 14) return '14days';
    if (num <= 30) return '30days';
    if (num <= 90) return '90days';
    return `${num}days`;
  }

  throw XSMBAPIError.badRequest(
    'INVALID_STATISTICS_RANGE',
    `Invalid statistics range '${rangeStr}'. Allowed values: 'today', 'yesterday', '3days', '7days', '14days', '30days', '90days'.`
  );
}

