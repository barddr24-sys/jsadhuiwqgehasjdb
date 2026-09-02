import { describe, it, expect } from 'vitest';
import {
  validateDrawDate,
  validatePrizeNumber,
  validateDrawResults,
  validateDrawStatus,
} from '../app/lib/db/validation/draw-validator';
import { DRAW_STATUS } from '../app/lib/db/config/status-config';
import {
  FIXTURE_VALID_RESULTS_1,
  FIXTURE_VALID_RESULTS_2,
  FIXTURE_PARTIAL_RESULTS,
} from './fixtures/draw-fixtures';

describe('XSMB Draw Validation Layer', () => {
  describe('validateDrawDate', () => {
    it('should accept valid YYYY-MM-DD dates', () => {
      expect(validateDrawDate('2026-09-02').isValid).toBe(true);
      expect(validateDrawDate('2024-02-29').isValid).toBe(true); // Leap year
    });

    it('should reject non-string or malformed dates', () => {
      // @ts-expect-error testing runtime validation
      expect(validateDrawDate(null).isValid).toBe(false);
      expect(validateDrawDate('02/09/2026').isValid).toBe(false);
      expect(validateDrawDate('2026-9-2').isValid).toBe(false);
      expect(validateDrawDate('invalid-date').isValid).toBe(false);
    });

    it('should reject invalid calendar dates', () => {
      expect(validateDrawDate('2026-02-31').isValid).toBe(false);
      expect(validateDrawDate('2026-04-31').isValid).toBe(false);
      expect(validateDrawDate('2025-02-29').isValid).toBe(false); // Non-leap year
      expect(validateDrawDate('2026-13-01').isValid).toBe(false); // Month 13
    });
  });

  describe('validatePrizeNumber & Leading-Zero Preservation', () => {
    it('should validate string numbers with leading zeroes correctly', () => {
      expect(validatePrizeNumber('00086', 5, 'special', 0).isValid).toBe(true);
      expect(validatePrizeNumber('021', 3, 'sixthPrize', 0).isValid).toBe(true);
      expect(validatePrizeNumber('04', 2, 'seventhPrize', 0).isValid).toBe(true);
    });

    it('should REJECT integer types to prevent leading zero loss', () => {
      const res = validatePrizeNumber(86, 5, 'special', 0);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('must be a string');
    });

    it('should reject numbers with wrong digit lengths', () => {
      // Special prize must be 5 digits, not 4
      const res1 = validatePrizeNumber('1234', 5, 'special', 0);
      expect(res1.isValid).toBe(false);
      expect(res1.error).toContain('expected 5 digits');

      // Seventh prize must be 2 digits, not 3
      const res2 = validatePrizeNumber('021', 2, 'seventhPrize', 0);
      expect(res2.isValid).toBe(false);
      expect(res2.error).toContain('expected 2 digits');
    });

    it('should reject non-digit characters in prize string', () => {
      const res = validatePrizeNumber('12A45', 5, 'special', 0);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('non-digit');
    });
  });

  describe('validateDrawResults (Full & Partial Prize Structures)', () => {
    it('should pass full 27-number valid results', () => {
      const val1 = validateDrawResults(FIXTURE_VALID_RESULTS_1);
      expect(val1.isValid).toBe(true);
      expect(val1.isComplete).toBe(true);
      expect(val1.totalNumbersCount).toBe(27);
      expect(val1.errors).toHaveLength(0);

      const val2 = validateDrawResults(FIXTURE_VALID_RESULTS_2);
      expect(val2.isValid).toBe(true);
      expect(val2.isComplete).toBe(true);
      expect(val2.totalNumbersCount).toBe(27);
    });

    it('should preserve leading zeroes in all 8 tiers', () => {
      expect(FIXTURE_VALID_RESULTS_1.special[0]).toBe('00086');
      expect(FIXTURE_VALID_RESULTS_1.fourthPrize[0]).toBe('0123');
      expect(FIXTURE_VALID_RESULTS_1.sixthPrize[0]).toBe('021');
      expect(FIXTURE_VALID_RESULTS_1.seventhPrize[0]).toBe('04');
    });

    it('should reject when a prize tier has too few numbers for complete draw', () => {
      const incompleteResults = {
        ...FIXTURE_VALID_RESULTS_1,
        seventhPrize: ['04', '05', '89'], // Only 3 numbers instead of 4
      };

      const val = validateDrawResults(incompleteResults, { allowPartial: false });
      expect(val.isValid).toBe(false);
      expect(val.isComplete).toBe(false);
      expect(val.errors.some((e) => e.includes('seventhPrize'))).toBe(true);
    });

    it('should reject when a prize tier has too many numbers', () => {
      const overflowResults = {
        ...FIXTURE_VALID_RESULTS_1,
        special: ['00086', '12345'], // 2 special prizes instead of 1
      };

      const val = validateDrawResults(overflowResults);
      expect(val.isValid).toBe(false);
      expect(val.errors.some((e) => e.includes('special'))).toBe(true);
    });

    it('should allow partial results when allowPartial = true', () => {
      const val = validateDrawResults(FIXTURE_PARTIAL_RESULTS, {
        allowPartial: true,
      });
      expect(val.isValid).toBe(true);
      expect(val.isComplete).toBe(false);
      expect(val.totalNumbersCount).toBeGreaterThan(0);
      expect(val.totalNumbersCount).toBeLessThan(27);
    });

    it('should reject partial results when allowPartial = false', () => {
      const val = validateDrawResults(FIXTURE_PARTIAL_RESULTS, {
        allowPartial: false,
      });
      expect(val.isValid).toBe(false);
      expect(val.isComplete).toBe(false);
    });
  });

  describe('validateDrawStatus & Lifecycle Rules', () => {
    it('should accept valid status values', () => {
      expect(validateDrawStatus(DRAW_STATUS.SCHEDULED).isValid).toBe(true);
      expect(validateDrawStatus(DRAW_STATUS.DRAWING).isValid).toBe(true);
      expect(validateDrawStatus(DRAW_STATUS.UPDATING).isValid).toBe(true);
      expect(validateDrawStatus(DRAW_STATUS.PARTIAL).isValid).toBe(true);
      expect(validateDrawStatus(DRAW_STATUS.DELAYED).isValid).toBe(true);
    });

    it('should reject arbitrary status strings', () => {
      expect(validateDrawStatus('UNKNOWN_STATUS').isValid).toBe(false);
      expect(validateDrawStatus('DONE').isValid).toBe(false);
      expect(validateDrawStatus('').isValid).toBe(false);
    });

    it('should allow READY status ONLY when complete validation passes', () => {
      const validComplete = validateDrawResults(FIXTURE_VALID_RESULTS_1);
      const readyWithValid = validateDrawStatus(
        DRAW_STATUS.READY,
        validComplete
      );
      expect(readyWithValid.isValid).toBe(true);

      const invalidIncomplete = validateDrawResults(FIXTURE_PARTIAL_RESULTS, {
        allowPartial: true,
      });
      const readyWithIncomplete = validateDrawStatus(
        DRAW_STATUS.READY,
        invalidIncomplete
      );
      expect(readyWithIncomplete.isValid).toBe(false);
      expect(readyWithIncomplete.error).toContain('cannot be marked as "READY"');
    });
  });
});
