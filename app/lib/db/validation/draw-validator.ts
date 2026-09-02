/**
 * Validation Engine for XSMB Draw Data Layer
 *
 * Enforces:
 * 1. String-only lottery numbers with leading zero preservation ("04", "021", "00086").
 * 2. Exact 8 prize tiers with exact required counts and digit lengths.
 * 3. Exact 27-number structure for complete draws.
 * 4. Strict drawDate YYYY-MM-DD validation.
 * 5. Controlled status transitions (A draw can only become READY when fully valid).
 */

import {
  XSMB_PRIZE_CONFIG,
  PRIZE_TIER_KEYS,
  TOTAL_PRIZE_NUMBERS,
  type PrizeTierKey,
} from '../config/prize-config';
import {
  DRAW_STATUS,
  type DrawStatus,
  VALID_DRAW_STATUSES,
} from '../config/status-config';
import type { IXSMBDrawResults } from '../types/db-types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  totalNumbersCount: number;
  isComplete: boolean;
}

/**
 * Validates ISO date format YYYY-MM-DD and real calendar validity
 */
export function validateDrawDate(drawDate: string): { isValid: boolean; error?: string } {
  if (typeof drawDate !== 'string') {
    return { isValid: false, error: 'drawDate must be a string' };
  }

  const match = drawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return {
      isValid: false,
      error: `drawDate "${drawDate}" must be formatted as YYYY-MM-DD`,
    };
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) {
    return { isValid: false, error: `Invalid month in drawDate: ${month}` };
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return {
      isValid: false,
      error: `Invalid day ${day} for month ${month} in year ${year}`,
    };
  }

  return { isValid: true };
}

/**
 * Validates a single lottery prize number:
 * - Must be a string
 * - Must contain only digits (preserving leading zeros, e.g. "04", "00086")
 * - Must have exact expected digit length
 */
export function validatePrizeNumber(
  num: unknown,
  expectedDigits: number,
  tierKey: PrizeTierKey,
  index: number
): { isValid: boolean; error?: string } {
  if (typeof num !== 'string') {
    return {
      isValid: false,
      error: `Prize in ${tierKey}[${index}] must be a string, got ${typeof num}. Lottery numbers must never be converted to integers to preserve leading zeros.`,
    };
  }

  const trimmed = num.trim();
  if (trimmed.length !== expectedDigits) {
    return {
      isValid: false,
      error: `Prize number "${num}" in ${tierKey}[${index}] has ${trimmed.length} digits, expected ${expectedDigits} digits.`,
    };
  }

  if (!/^\d+$/.test(trimmed)) {
    return {
      isValid: false,
      error: `Prize number "${num}" in ${tierKey}[${index}] contains non-digit characters.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates full XSMB prize results structure against canonical config
 */
export function validateDrawResults(
  results: Partial<IXSMBDrawResults> | null | undefined,
  options: { allowPartial?: boolean } = {}
): ValidationResult {
  const errors: string[] = [];
  let totalNumbersCount = 0;

  if (!results || typeof results !== 'object') {
    return {
      isValid: false,
      errors: ['Results object is required and must not be null'],
      totalNumbersCount: 0,
      isComplete: false,
    };
  }

  for (const tierKey of PRIZE_TIER_KEYS) {
    const config = XSMB_PRIZE_CONFIG[tierKey];
    const prizeArr = results[tierKey];

    if (!Array.isArray(prizeArr)) {
      errors.push(`Prize tier "${tierKey}" must be an array of strings.`);
      continue;
    }

    if (!options.allowPartial && prizeArr.length !== config.count) {
      errors.push(
        `Prize tier "${tierKey}" (${config.name}) requires exactly ${config.count} numbers, but found ${prizeArr.length}.`
      );
    } else if (options.allowPartial && prizeArr.length > config.count) {
      errors.push(
        `Prize tier "${tierKey}" (${config.name}) exceeds maximum ${config.count} numbers, found ${prizeArr.length}.`
      );
    }

    for (let i = 0; i < prizeArr.length; i++) {
      const numValidation = validatePrizeNumber(prizeArr[i], config.digits, tierKey, i);
      if (!numValidation.isValid && numValidation.error) {
        errors.push(numValidation.error);
      } else {
        totalNumbersCount++;
      }
    }
  }

  const isComplete = totalNumbersCount === TOTAL_PRIZE_NUMBERS && errors.length === 0;
  const isValid = errors.length === 0 && (options.allowPartial ? true : isComplete);

  return {
    isValid,
    errors,
    totalNumbersCount,
    isComplete,
  };
}

/**
 * Validates draw status value and lifecycle transition
 */
export function validateDrawStatus(
  status: unknown,
  resultsValidation?: ValidationResult
): { isValid: boolean; error?: string } {
  if (typeof status !== 'string' || !VALID_DRAW_STATUSES.includes(status as DrawStatus)) {
    return {
      isValid: false,
      error: `Invalid draw status "${String(status)}". Must be one of: ${VALID_DRAW_STATUSES.join(', ')}.`,
    };
  }

  // Draw can only become READY when complete validation passes
  if (status === DRAW_STATUS.READY) {
    if (!resultsValidation || !resultsValidation.isValid || !resultsValidation.isComplete) {
      return {
        isValid: false,
        error: `Draw cannot be marked as "READY" because results validation failed or is incomplete. (Found ${resultsValidation?.totalNumbersCount ?? 0}/${TOTAL_PRIZE_NUMBERS} valid numbers).`,
      };
    }
  }

  return { isValid: true };
}
