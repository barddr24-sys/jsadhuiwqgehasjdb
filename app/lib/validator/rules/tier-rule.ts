/**
 * Prize Tiers & Numbers Validation Rule
 *
 * Enforces:
 * - Presence of all 8 canonical prize tiers
 * - Array typing for each tier
 * - String-only representation for all lottery numbers
 * - Leading zero preservation (e.g. "04", "021", "00086")
 * - Rejection of empty or whitespace-only strings
 * - Rejection of non-digit characters (letters, hyphens, periods, spaces)
 * - Exact digit lengths per tier
 * - Exact number counts per tier
 * - Total 27-number structure for complete results
 * - Read-only / immutable checks
 */

import {
  XSMB_PRIZE_CONFIG,
  PRIZE_TIER_KEYS,
  TOTAL_PRIZE_NUMBERS,
  type PrizeTierKey,
} from '../../db/config/prize-config';
import { NUMERIC_ONLY_REGEX } from '../constants';
import type {
  XSMBValidationError,
  XSMBValidationWarning,
  XSMBValidationDiagnostics,
  XSMBValidationOptions,
} from '../types';

export interface TierValidationOutcome {
  errors: XSMBValidationError[];
  warnings: XSMBValidationWarning[];
  diagnostics: XSMBValidationDiagnostics;
  isComplete: boolean;
  hasFatalError: boolean;
}

export function validatePrizeTiersRule(
  results: unknown,
  options?: XSMBValidationOptions
): TierValidationOutcome {
  const errors: XSMBValidationError[] = [];
  const warnings: XSMBValidationWarning[] = [];

  const tierCounts: Record<PrizeTierKey, number> = {
    special: 0,
    firstPrize: 0,
    secondPrize: 0,
    thirdPrize: 0,
    fourthPrize: 0,
    fifthPrize: 0,
    sixthPrize: 0,
    seventhPrize: 0,
  };

  const initialDiagnostics: XSMBValidationDiagnostics = {
    totalNumbersCount: 0,
    validNumbersCount: 0,
    tierCounts,
    isComplete: false,
  };

  if (!results || typeof results !== 'object' || Array.isArray(results)) {
    errors.push({
      code: 'MISSING_RESULTS',
      message: 'Results object is missing, null, or not an object.',
      field: 'results',
      actual: results,
    });
    return {
      errors,
      warnings,
      diagnostics: initialDiagnostics,
      isComplete: false,
      hasFatalError: true,
    };
  }

  const resultsObj = results as Record<string, unknown>;
  let totalNumbers = 0;
  let validNumbers = 0;
  let hasFatal = false;

  for (const tierKey of PRIZE_TIER_KEYS) {
    const config = XSMB_PRIZE_CONFIG[tierKey];
    const tierValue = resultsObj[tierKey];

    // 1. Tier existence check
    if (tierValue === undefined) {
      errors.push({
        code: 'MISSING_PRIZE_TIER',
        tier: tierKey,
        field: `results.${tierKey}`,
        message: `Missing required prize tier "${tierKey}" (${config.name}).`,
        expected: `${config.count} numbers of ${config.digits} digits`,
      });
      hasFatal = true;
      continue;
    }

    // 2. Array type check
    if (!Array.isArray(tierValue)) {
      errors.push({
        code: 'STRUCTURE_ERROR',
        tier: tierKey,
        field: `results.${tierKey}`,
        message: `Prize tier "${tierKey}" must be an array of strings, got ${typeof tierValue}.`,
        actual: typeof tierValue,
        expected: 'string[]',
      });
      hasFatal = true;
      continue;
    }

    const tierArray = tierValue as unknown[];
    tierCounts[tierKey] = tierArray.length;
    totalNumbers += tierArray.length;

    // 3. Count checks
    if (tierArray.length > config.count) {
      errors.push({
        code: 'COUNT_MISMATCH',
        tier: tierKey,
        field: `results.${tierKey}`,
        message: `Prize tier "${tierKey}" has ${tierArray.length} numbers, exceeding expected count of ${config.count}.`,
        expected: config.count,
        actual: tierArray.length,
      });
      hasFatal = true;
    } else if (!options?.allowPartial && tierArray.length < config.count) {
      errors.push({
        code: 'COUNT_MISMATCH',
        tier: tierKey,
        field: `results.${tierKey}`,
        message: `Prize tier "${tierKey}" has ${tierArray.length} numbers, expected ${config.count}.`,
        expected: config.count,
        actual: tierArray.length,
      });
      // Not necessarily fatal if treated as partial, but an error in complete mode
    }

    // 4. Per-number checks
    for (let i = 0; i < tierArray.length; i++) {
      const item = tierArray[i];

      // Number type validation (must be string, never number)
      if (typeof item !== 'string') {
        errors.push({
          code: 'INVALID_NUMBER_TYPE',
          tier: tierKey,
          index: i,
          field: `results.${tierKey}[${i}]`,
          message: `Number in ${tierKey}[${i}] must be a string, got ${typeof item}. Leading zeros would be lost if stored as number.`,
          expected: 'string',
          actual: typeof item,
          value: item,
        });
        hasFatal = true;
        continue;
      }

      // Empty / whitespace check
      if (item.trim().length === 0) {
        errors.push({
          code: 'EMPTY_NUMBER',
          tier: tierKey,
          index: i,
          field: `results.${tierKey}[${i}]`,
          message: `Empty or whitespace-only value found at ${tierKey}[${i}].`,
          value: item,
        });
        hasFatal = true;
        continue;
      }

      // Untrimmed whitespace anomaly (validator does not mutate or auto-trim)
      if (item !== item.trim()) {
        errors.push({
          code: 'INVALID_NUMBER_FORMAT',
          tier: tierKey,
          index: i,
          field: `results.${tierKey}[${i}]`,
          message: `Number "${item}" at ${tierKey}[${i}] contains unnormalized leading or trailing whitespace.`,
          value: item,
        });
        hasFatal = true;
        continue;
      }

      // Numeric-only format check (digits only)
      if (!NUMERIC_ONLY_REGEX.test(item)) {
        errors.push({
          code: 'INVALID_NUMBER_FORMAT',
          tier: tierKey,
          index: i,
          field: `results.${tierKey}[${i}]`,
          message: `Number "${item}" at ${tierKey}[${i}] contains non-digit characters.`,
          value: item,
        });
        hasFatal = true;
        continue;
      }

      // Exact digit length check
      if (item.length !== config.digits) {
        errors.push({
          code: 'INVALID_DIGIT_LENGTH',
          tier: tierKey,
          index: i,
          field: `results.${tierKey}[${i}]`,
          message: `Number "${item}" at ${tierKey}[${i}] has ${item.length} digits, expected exactly ${config.digits}.`,
          expected: config.digits,
          actual: item.length,
          value: item,
        });
        hasFatal = true;
        continue;
      }

      validNumbers++;
    }
  }

  const isComplete =
    validNumbers === TOTAL_PRIZE_NUMBERS &&
    totalNumbers === TOTAL_PRIZE_NUMBERS &&
    errors.length === 0;

  const diagnostics: XSMBValidationDiagnostics = {
    totalNumbersCount: totalNumbers,
    validNumbersCount: validNumbers,
    tierCounts,
    isComplete,
  };

  return {
    errors,
    warnings,
    diagnostics,
    isComplete,
    hasFatalError: hasFatal,
  };
}
