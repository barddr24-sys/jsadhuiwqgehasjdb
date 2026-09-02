/**
 * Strict XSMB Validator & Data Integrity Test Suite
 *
 * Automated verification of all 17 required criteria from Prompt 4:
 * 1. Valid complete XSMB result
 * 2. Leading zero values preservation
 * 3. Exact prize counts per tier
 * 4. Total 27 numbers verification
 * 5. Wrong prize count rejection
 * 6. Wrong digit length rejection
 * 7. Numeric type rejection (string-only rule)
 * 8. Empty value rejection
 * 9. Non-numeric characters rejection
 * 10. Invalid date & calendar date rejection
 * 11. Date mismatch cross-check
 * 12. Missing prize tier rejection
 * 13. Partial result recognition vs invalid
 * 14. Conflict state detection
 * 15. Validator immutability
 * 16. Deterministic output
 * 17. Source metadata validation & warnings
 */

import { describe, it, expect } from 'vitest';
import {
  StrictXSMBValidator,
  validateXSMBResult,
  XSMB_VALIDATOR_VERSION,
  compareNormalizedResults,
  detectConflicts,
} from '../../app/lib/validator';
import {
  XSMB_PRIZE_CONFIG,
  TOTAL_PRIZE_NUMBERS,
} from '../../app/lib/db/config/prize-config';
import type { NormalizedXSMBResult } from '../../app/lib/parsers/types';
import {
  FIXTURE_VALID_COMPLETE,
  FIXTURE_VALID_LEADING_ZERO,
  FIXTURE_PARTIAL_RESULT,
  FIXTURE_MISSING_TIER,
  FIXTURE_WRONG_COUNT,
  FIXTURE_WRONG_DIGIT_LENGTH,
  FIXTURE_NUMERIC_VALUE,
  FIXTURE_EMPTY_VALUE,
  FIXTURE_NON_NUMERIC,
  FIXTURE_INVALID_DATE_FORMAT,
  FIXTURE_IMPOSSIBLE_CALENDAR_DATE,
  FIXTURE_DATE_MISMATCH,
  FIXTURE_WRONG_LOTTERY_TYPE,
  FIXTURE_CONFLICT_PROVIDER_A,
  FIXTURE_CONFLICT_PROVIDER_B,
} from '../fixtures/validator-fixtures';

describe('Strict XSMB Validator & Data Integrity Suite', () => {
  const validator = new StrictXSMBValidator();

  // ─── 1. Valid Complete XSMB Result ─────────────────────────────────────────
  it('1. should validate a complete valid XSMB result with status VALID and valid=true', () => {
    const result = validator.validate(FIXTURE_VALID_COMPLETE);

    expect(result.valid).toBe(true);
    expect(result.status).toBe('VALID');
    expect(result.errors).toHaveLength(0);
    expect(result.validatorVersion).toBe(XSMB_VALIDATOR_VERSION);
    expect(result.diagnostics?.isComplete).toBe(true);
    expect(result.diagnostics?.validNumbersCount).toBe(TOTAL_PRIZE_NUMBERS);
    expect(result.diagnostics?.totalNumbersCount).toBe(27);
  });

  // ─── 2. Leading Zero Preservation ──────────────────────────────────────────
  it('2. should accept and preserve leading-zero numbers ("04", "08", "021", "00123", "00086")', () => {
    const result = validator.validate(FIXTURE_VALID_LEADING_ZERO);

    expect(result.valid).toBe(true);
    expect(result.status).toBe('VALID');
    expect(result.errors).toHaveLength(0);

    // Verify leading zeroes are intact and untouched
    expect(FIXTURE_VALID_LEADING_ZERO.results.special[0]).toBe('00086');
    expect(FIXTURE_VALID_LEADING_ZERO.results.sixthPrize[0]).toBe('021');
    expect(FIXTURE_VALID_LEADING_ZERO.results.seventhPrize[0]).toBe('04');
    expect(FIXTURE_VALID_LEADING_ZERO.results.seventhPrize[3]).toBe('00');
  });

  // ─── 3. Exact Prize Counts Per Tier ────────────────────────────────────────
  it('3. should verify exact canonical prize tier counts (Special:1, First:1, Second:2, Third:6, Fourth:4, Fifth:6, Sixth:3, Seventh:4)', () => {
    const result = validator.validate(FIXTURE_VALID_COMPLETE);

    expect(result.diagnostics?.tierCounts).toEqual({
      special: XSMB_PRIZE_CONFIG.special.count,
      firstPrize: XSMB_PRIZE_CONFIG.firstPrize.count,
      secondPrize: XSMB_PRIZE_CONFIG.secondPrize.count,
      thirdPrize: XSMB_PRIZE_CONFIG.thirdPrize.count,
      fourthPrize: XSMB_PRIZE_CONFIG.fourthPrize.count,
      fifthPrize: XSMB_PRIZE_CONFIG.fifthPrize.count,
      sixthPrize: XSMB_PRIZE_CONFIG.sixthPrize.count,
      seventhPrize: XSMB_PRIZE_CONFIG.seventhPrize.count,
    });
  });

  // ─── 4. Total 27 Numbers Verification ──────────────────────────────────────
  it('4. should verify exactly 27 total prize numbers in a complete draw', () => {
    expect(TOTAL_PRIZE_NUMBERS).toBe(27);
    const result = validator.validate(FIXTURE_VALID_COMPLETE);
    expect(result.diagnostics?.validNumbersCount).toBe(27);
    expect(result.diagnostics?.totalNumbersCount).toBe(27);
  });

  // ─── 5. Wrong Prize Count Rejection ────────────────────────────────────────
  it('5. should reject wrong prize counts (e.g. Special with 2, Third with 7) with COUNT_MISMATCH and status INVALID', () => {
    const result = validator.validate(FIXTURE_WRONG_COUNT);

    expect(result.valid).toBe(false);
    expect(result.status).toBe('INVALID');

    const countErrors = result.errors.filter((e) => e.code === 'COUNT_MISMATCH');
    expect(countErrors.length).toBeGreaterThanOrEqual(2);

    const specialError = countErrors.find((e) => e.tier === 'special');
    expect(specialError).toBeDefined();
    expect(specialError?.expected).toBe(1);
    expect(specialError?.actual).toBe(2);

    const thirdError = countErrors.find((e) => e.tier === 'thirdPrize');
    expect(thirdError).toBeDefined();
    expect(thirdError?.expected).toBe(6);
    expect(thirdError?.actual).toBe(7);
  });

  // ─── 6. Wrong Digit Length Rejection ───────────────────────────────────────
  it('6. should reject numbers with invalid digit lengths (Special:4 digits, Seventh:1 digit) with INVALID_DIGIT_LENGTH', () => {
    const result = validator.validate(FIXTURE_WRONG_DIGIT_LENGTH);

    expect(result.valid).toBe(false);
    expect(result.status).toBe('INVALID');

    const digitErrors = result.errors.filter((e) => e.code === 'INVALID_DIGIT_LENGTH');
    expect(digitErrors.length).toBeGreaterThanOrEqual(2);

    const specialDigitErr = digitErrors.find((e) => e.tier === 'special');
    expect(specialDigitErr?.expected).toBe(5);
    expect(specialDigitErr?.actual).toBe(4);
    expect(specialDigitErr?.value).toBe('1234');

    const seventhDigitErr = digitErrors.find((e) => e.tier === 'seventhPrize');
    expect(seventhDigitErr?.expected).toBe(2);
    expect(seventhDigitErr?.actual).toBe(1);
    expect(seventhDigitErr?.value).toBe('4');
  });

  // ─── 7. Numeric Type Rejection ─────────────────────────────────────────────
  it('7. should reject numeric types (raw integers 12345, 4) with INVALID_NUMBER_TYPE', () => {
    const result = validator.validate(FIXTURE_NUMERIC_VALUE);

    expect(result.valid).toBe(false);
    expect(result.status).toBe('INVALID');

    const typeErrors = result.errors.filter((e) => e.code === 'INVALID_NUMBER_TYPE');
    expect(typeErrors.length).toBeGreaterThanOrEqual(3);
    expect(typeErrors[0].expected).toBe('string');
    expect(typeErrors[0].actual).toBe('number');
  });

  // ─── 8. Empty Value Rejection ──────────────────────────────────────────────
  it('8. should reject empty strings and whitespace-only strings with EMPTY_NUMBER', () => {
    const result = validator.validate(FIXTURE_EMPTY_VALUE);

    expect(result.valid).toBe(false);
    expect(result.status).toBe('INVALID');

    const emptyErrors = result.errors.filter((e) => e.code === 'EMPTY_NUMBER');
    expect(emptyErrors.length).toBeGreaterThanOrEqual(2);
  });

  // ─── 9. Non-Numeric Rejection ──────────────────────────────────────────────
  it('9. should reject non-numeric characters (letters, hyphens, periods, spaces) with INVALID_NUMBER_FORMAT', () => {
    const result = validator.validate(FIXTURE_NON_NUMERIC);

    expect(result.valid).toBe(false);
    expect(result.status).toBe('INVALID');

    const formatErrors = result.errors.filter((e) => e.code === 'INVALID_NUMBER_FORMAT');
    expect(formatErrors.length).toBeGreaterThanOrEqual(3);
  });

  // ─── 10. Invalid Date & Calendar Date ──────────────────────────────────────
  it('10. should reject invalid date formats (02/09/2026) and impossible dates (2026-02-30) with INVALID_DATE', () => {
    const formatResult = validator.validate(FIXTURE_INVALID_DATE_FORMAT);
    expect(formatResult.valid).toBe(false);
    expect(formatResult.status).toBe('INVALID');
    expect(formatResult.errors.some((e) => e.code === 'INVALID_DATE')).toBe(true);

    const calendarResult = validator.validate(FIXTURE_IMPOSSIBLE_CALENDAR_DATE);
    expect(calendarResult.valid).toBe(false);
    expect(calendarResult.status).toBe('INVALID');
    expect(calendarResult.errors.some((e) => e.code === 'INVALID_DATE')).toBe(true);
  });

  // ─── 11. Date Mismatch Cross-Check ─────────────────────────────────────────
  it('11. should detect date mismatch when expectedDrawDate differs from drawDate with DATE_MISMATCH', () => {
    const result = validator.validate(FIXTURE_DATE_MISMATCH, {
      expectedDrawDate: '2026-09-02',
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe('INVALID');

    const mismatchError = result.errors.find((e) => e.code === 'DATE_MISMATCH');
    expect(mismatchError).toBeDefined();
    expect(mismatchError?.expected).toBe('2026-09-02');
    expect(mismatchError?.actual).toBe('2026-09-01');
  });

  // ─── 12. Missing Prize Tier ────────────────────────────────────────────────
  it('12. should reject when a prize tier is omitted from results with MISSING_PRIZE_TIER', () => {
    const result = validator.validate(FIXTURE_MISSING_TIER);

    expect(result.valid).toBe(false);
    expect(result.status).toBe('INVALID');

    const missingTierErr = result.errors.find((e) => e.code === 'MISSING_PRIZE_TIER');
    expect(missingTierErr).toBeDefined();
    expect(missingTierErr?.tier).toBe('seventhPrize');
  });

  // ─── 13. Partial Result ────────────────────────────────────────────────────
  it('13. should distinguish partial in-progress results (status PARTIAL, valid=false) from malformed data', () => {
    const result = validator.validate(FIXTURE_PARTIAL_RESULT, { allowPartial: true });

    expect(result.valid).toBe(false);
    expect(result.status).toBe('PARTIAL');
    expect(result.diagnostics?.validNumbersCount).toBeGreaterThan(0);
    expect(result.diagnostics?.validNumbersCount).toBeLessThan(27);

    // Partial should NOT have malformed number errors
    const malformedErrors = result.errors.filter(
      (e) => e.code === 'INVALID_NUMBER_FORMAT' || e.code === 'INVALID_DIGIT_LENGTH'
    );
    expect(malformedErrors).toHaveLength(0);
  });

  // ─── 14. Conflict State ────────────────────────────────────────────────────
  it('14. should detect multi-source discrepancies and produce CONFLICT state with SOURCE_CONFLICT errors', () => {
    const conflicts = detectConflicts([
      FIXTURE_CONFLICT_PROVIDER_A,
      FIXTURE_CONFLICT_PROVIDER_B,
    ]);

    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].code).toBe('SOURCE_CONFLICT');
    expect(conflicts[0].tier).toBe('special');

    const comparison = compareNormalizedResults([
      FIXTURE_CONFLICT_PROVIDER_A,
      FIXTURE_CONFLICT_PROVIDER_B,
    ]);

    expect(comparison.hasConflict).toBe(true);
    expect(comparison.status).toBe('CONFLICT');
    expect(comparison.agreedResult).toBeUndefined();
  });

  // ─── 15. Validator Immutability ───────────────────────────────────────────
  it('15. should never modify the input object (pure, read-only validation)', () => {
    const inputClone = JSON.parse(JSON.stringify(FIXTURE_VALID_COMPLETE));
    Object.freeze(inputClone);
    Object.freeze(inputClone.results);
    Object.freeze(inputClone.results.special);
    Object.freeze(inputClone.source);

    expect(() => validator.validate(inputClone)).not.toThrow();

    // Verify properties remain unchanged
    expect(inputClone.results.special[0]).toBe('85429');
    expect(inputClone.drawDate).toBe('2026-09-02');
  });

  // ─── 16. Deterministic Output ──────────────────────────────────────────────
  it('16. should produce identical validation results on repeated runs for the same input', () => {
    const fixedNow = new Date('2026-09-02T19:00:00Z');
    const run1 = validator.validate(FIXTURE_VALID_COMPLETE, { now: fixedNow });
    const run2 = validator.validate(FIXTURE_VALID_COMPLETE, { now: fixedNow });

    expect(run1).toEqual(run2);
  });

  // ─── 17. Source Metadata Validation ────────────────────────────────────────
  it('17. should emit warnings for incomplete source metadata or future timestamps in non-strict mode', () => {
    const incompleteSourceData: NormalizedXSMBResult = {
      ...FIXTURE_VALID_COMPLETE,
      source: {
        providerId: '',
        sourceUrl: '',
        fetchedAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days in future
      },
    };

    const result = validator.validate(incompleteSourceData);

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(
      result.warnings.some(
        (w) =>
          w.code === 'SOURCE_METADATA_INCOMPLETE' ||
          w.code === 'FUTURE_FETCH_TIMESTAMP'
      )
    ).toBe(true);

    // In strict mode, incomplete source turns into an error
    const strictResult = validator.validate(incompleteSourceData, {
      strictSourceMetadata: true,
    });
    expect(strictResult.valid).toBe(false);
    expect(strictResult.errors.some((e) => e.code === 'INVALID_SOURCE')).toBe(true);
  });

  // ─── Additional Edge Cases ────────────────────────────────────────────────
  it('should reject wrong lottery type with INVALID_LOTTERY_TYPE', () => {
    const result = validator.validate(FIXTURE_WRONG_LOTTERY_TYPE);
    expect(result.valid).toBe(false);
    expect(result.status).toBe('INVALID');
    expect(result.errors.some((e) => e.code === 'INVALID_LOTTERY_TYPE')).toBe(true);
  });

  it('should reject non-object root or null input gracefully with STRUCTURE_ERROR', () => {
    const result = validator.validate(null as unknown as NormalizedXSMBResult);
    expect(result.valid).toBe(false);
    expect(result.status).toBe('INVALID');
    expect(result.errors.some((e) => e.code === 'STRUCTURE_ERROR')).toBe(true);
  });

  it('should handle leap years correctly (2024-02-29 valid, 2026-02-29 invalid)', () => {
    const leapYearValid: NormalizedXSMBResult = {
      ...FIXTURE_VALID_COMPLETE,
      drawDate: '2024-02-29',
    };
    const nonLeapYearInvalid: NormalizedXSMBResult = {
      ...FIXTURE_VALID_COMPLETE,
      drawDate: '2026-02-29',
    };

    const leapRes = validator.validate(leapYearValid);
    expect(leapRes.errors.some((e) => e.code === 'INVALID_DATE')).toBe(false);

    const nonLeapRes = validator.validate(nonLeapYearInvalid);
    expect(nonLeapRes.errors.some((e) => e.code === 'INVALID_DATE')).toBe(true);
  });

  it('should support convenience function validateXSMBResult', () => {
    const result = validateXSMBResult(FIXTURE_VALID_COMPLETE);
    expect(result.valid).toBe(true);
    expect(result.status).toBe('VALID');
  });

  it('should agree and return status VALID when multi-sources match perfectly', () => {
    const source1: NormalizedXSMBResult = {
      ...FIXTURE_VALID_COMPLETE,
      source: {
        providerId: 'prov-1',
        sourceUrl: 'https://prov1.com',
        fetchedAt: new Date(),
      },
    };
    const source2: NormalizedXSMBResult = {
      ...FIXTURE_VALID_COMPLETE,
      source: {
        providerId: 'prov-2',
        sourceUrl: 'https://prov2.com',
        fetchedAt: new Date(),
      },
    };

    const comparison = compareNormalizedResults([source1, source2]);
    expect(comparison.hasConflict).toBe(false);
    expect(comparison.status).toBe('VALID');
    expect(comparison.agreedResult).toBeDefined();
    expect(comparison.agreedResult?.drawDate).toBe('2026-09-02');
  });
});
