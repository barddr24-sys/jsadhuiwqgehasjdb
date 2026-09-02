/**
 * Strict XSMB Validator & Data Integrity Layer
 *
 * Implements deterministic, side-effect free, in-memory validation of NormalizedXSMBResult.
 * Strictly decoupled from MongoDB, network requests, and UI rendering.
 */

import {
  TOTAL_PRIZE_NUMBERS,
} from '../db/config/prize-config';
import type { NormalizedXSMBResult } from '../parsers/types';
import { XSMB_VALIDATOR_VERSION } from './constants';
import type {
  XSMBValidator,
  XSMBValidationResult,
  XSMBValidationOptions,
  XSMBValidationStatus,
  XSMBValidationError,
  XSMBValidationWarning,
} from './types';
import { validateDrawDateRule } from './rules/date-rule';
import { validatePrizeTiersRule } from './rules/tier-rule';
import { validateSourceRule } from './rules/source-rule';

export class StrictXSMBValidator implements XSMBValidator {
  readonly validatorVersion = XSMB_VALIDATOR_VERSION;

  /**
   * Validates a normalized XSMB draw result deterministically without mutating the input.
   */
  validate(
    data: NormalizedXSMBResult,
    options?: XSMBValidationOptions
  ): XSMBValidationResult {
    const validatedAt = options?.now ?? new Date();
    const errors: XSMBValidationError[] = [];
    const warnings: XSMBValidationWarning[] = [];

    // ─── 1. Object Structure Validation ──────────────────────────────────────
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      errors.push({
        code: 'STRUCTURE_ERROR',
        message: 'Normalized result must be a non-null object.',
        actual: data,
      });

      return {
        valid: false,
        status: 'INVALID',
        errors,
        warnings,
        validatedAt,
        validatorVersion: this.validatorVersion,
        diagnostics: {
          totalNumbersCount: 0,
          validNumbersCount: 0,
          tierCounts: {
            special: 0,
            firstPrize: 0,
            secondPrize: 0,
            thirdPrize: 0,
            fourthPrize: 0,
            fifthPrize: 0,
            sixthPrize: 0,
            seventhPrize: 0,
          },
          isComplete: false,
        },
      };
    }

    // ─── 2. drawDate Validation ──────────────────────────────────────────────
    const dateOutcome = validateDrawDateRule(data.drawDate, options);
    errors.push(...dateOutcome.errors);

    // ─── 3. Lottery Type Validation ──────────────────────────────────────────
    if (data.lotteryType !== 'XSMB') {
      errors.push({
        code: 'INVALID_LOTTERY_TYPE',
        field: 'lotteryType',
        message: `lotteryType must be "XSMB", got "${String(data.lotteryType)}".`,
        expected: 'XSMB',
        actual: data.lotteryType,
      });
    }

    // ─── 4. Results & Prize Tiers Validation (Steps 4-11) ────────────────────
    const tierOutcome = validatePrizeTiersRule(data.results, options);
    errors.push(...tierOutcome.errors);
    warnings.push(...tierOutcome.warnings);

    // ─── 12. Source Provenance Metadata Validation ───────────────────────────
    const sourceOutcome = validateSourceRule(data.source, options);
    errors.push(...sourceOutcome.errors);
    warnings.push(...sourceOutcome.warnings);

    // ─── 13. Upstream Parser Errors Check ────────────────────────────────────
    // If input object carries custom parser error flags or anomalies
    if ((data as unknown as Record<string, unknown>).parserErrors) {
      const rawParserErrors = (data as unknown as Record<string, unknown>).parserErrors;
      if (Array.isArray(rawParserErrors) && rawParserErrors.length > 0) {
        errors.push({
          code: 'PARSER_ERROR',
          message: 'Upstream parser reported unresolved errors.',
          details: { parserErrors: rawParserErrors },
        });
      }
    }

    // ─── 14. Conflict State Check ────────────────────────────────────────────
    const hasSourceConflict = errors.some((err) => err.code === 'SOURCE_CONFLICT');

    // ─── 15. Final Status Classification ─────────────────────────────────────
    const status = this.determineStatus({
      errors,
      tierOutcome,
      dateOutcome,
      isLotteryTypeValid: data.lotteryType === 'XSMB',
      hasSourceConflict,
    });

    const isFullyValid = status === 'VALID';

    // In partial mode, filter out COUNT_MISMATCH errors for missing/pending tiers if individual numbers are valid
    let finalErrors = errors;
    if (status === 'PARTIAL') {
      finalErrors = errors.filter(
        (err) => err.code !== 'COUNT_MISMATCH' || (err.actual as number) > (err.expected as number)
      );
    }

    return {
      valid: isFullyValid,
      status,
      errors: finalErrors,
      warnings,
      validatedAt,
      validatorVersion: this.validatorVersion,
      data,
      diagnostics: tierOutcome.diagnostics,
    };
  }

  /**
   * Classifies final validation status into VALID, PARTIAL, INVALID, or CONFLICT
   */
  private determineStatus(ctx: {
    errors: XSMBValidationError[];
    tierOutcome: ReturnType<typeof validatePrizeTiersRule>;
    dateOutcome: ReturnType<typeof validateDrawDateRule>;
    isLotteryTypeValid: boolean;
    hasSourceConflict: boolean;
  }): XSMBValidationStatus {
    if (ctx.hasSourceConflict) {
      return 'CONFLICT';
    }

    // Check for fatal errors that preclude even a partial result
    const hasFatalDate = !ctx.dateOutcome.isValidDate;
    const hasFatalType = !ctx.isLotteryTypeValid;
    const hasFatalTier = ctx.tierOutcome.hasFatalError;

    // Check if there are malformed numbers, wrong types, wrong digit lengths, or date mismatches
    const fatalErrorCodes = new Set<string>([
      'INVALID_DATE',
      'DATE_MISMATCH',
      'INVALID_LOTTERY_TYPE',
      'STRUCTURE_ERROR',
      'MISSING_RESULTS',
      'INVALID_NUMBER_TYPE',
      'INVALID_NUMBER_FORMAT',
      'INVALID_DIGIT_LENGTH',
      'EMPTY_NUMBER',
      'INVALID_SOURCE',
      'PARSER_ERROR',
    ]);

    const hasFatalErrorCode = ctx.errors.some((err) => fatalErrorCodes.has(err.code));

    // Overflow check: any tier having more numbers than expected is FATAL INVALID
    const hasCountOverflow = ctx.errors.some(
      (err) => err.code === 'COUNT_MISMATCH' && (err.actual as number) > (err.expected as number)
    );

    if (hasFatalDate || hasFatalType || hasFatalTier || hasFatalErrorCode || hasCountOverflow) {
      return 'INVALID';
    }

    // Complete valid result: 27 valid numbers, exact tier counts, no errors
    if (
      ctx.tierOutcome.isComplete &&
      ctx.tierOutcome.diagnostics.validNumbersCount === TOTAL_PRIZE_NUMBERS &&
      ctx.errors.length === 0
    ) {
      return 'VALID';
    }

    // Partial result: In-progress draw with at least 1 valid number, no malformed numbers, and count < 27
    if (
      ctx.tierOutcome.diagnostics.validNumbersCount > 0 &&
      ctx.tierOutcome.diagnostics.validNumbersCount < TOTAL_PRIZE_NUMBERS
    ) {
      return 'PARTIAL';
    }

    return 'INVALID';
  }
}

/**
 * Singleton instance of StrictXSMBValidator
 */
export const strictXSMBValidator = new StrictXSMBValidator();

/**
 * Convenience helper to validate a normalized XSMB draw result
 */
export function validateXSMBResult(
  data: NormalizedXSMBResult,
  options?: XSMBValidationOptions
): XSMBValidationResult {
  return strictXSMBValidator.validate(data, options);
}
