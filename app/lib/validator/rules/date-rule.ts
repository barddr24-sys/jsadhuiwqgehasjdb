/**
 * Draw Date Validation Rule
 *
 * Enforces:
 * - Strict YYYY-MM-DD ISO format
 * - Calendar validity (no Feb 30, no Month 13, proper leap year handling)
 * - Consistency with expected draw date if provided
 */

import { STRICT_DATE_REGEX } from '../constants';
import type { XSMBValidationError, XSMBValidationOptions } from '../types';

export interface DateValidationOutcome {
  isValidDate: boolean;
  errors: XSMBValidationError[];
}

export function validateDrawDateRule(
  drawDate: unknown,
  options?: XSMBValidationOptions
): DateValidationOutcome {
  const errors: XSMBValidationError[] = [];

  if (typeof drawDate !== 'string') {
    errors.push({
      code: 'INVALID_DATE',
      message: `drawDate must be a string, got ${typeof drawDate}.`,
      field: 'drawDate',
      actual: drawDate,
    });
    return { isValidDate: false, errors };
  }

  const match = drawDate.match(STRICT_DATE_REGEX);
  if (!match) {
    errors.push({
      code: 'INVALID_DATE',
      message: `drawDate "${drawDate}" must be in strict YYYY-MM-DD format.`,
      field: 'drawDate',
      actual: drawDate,
      expected: 'YYYY-MM-DD',
    });
    return { isValidDate: false, errors };
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) {
    errors.push({
      code: 'INVALID_DATE',
      message: `drawDate "${drawDate}" contains invalid month ${month} (must be 01-12).`,
      field: 'drawDate',
      actual: drawDate,
    });
    return { isValidDate: false, errors };
  }

  // Days in month calculation (handles leap years accurately)
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    errors.push({
      code: 'INVALID_DATE',
      message: `drawDate "${drawDate}" contains invalid day ${day} for month ${month} in year ${year} (max ${daysInMonth}).`,
      field: 'drawDate',
      actual: drawDate,
    });
    return { isValidDate: false, errors };
  }

  // Check expected date consistency if provided
  if (options?.expectedDrawDate && options.expectedDrawDate !== drawDate) {
    errors.push({
      code: 'DATE_MISMATCH',
      message: `Extracted drawDate "${drawDate}" does not match requested date "${options.expectedDrawDate}".`,
      field: 'drawDate',
      expected: options.expectedDrawDate,
      actual: drawDate,
    });
  }

  return {
    isValidDate: errors.length === 0,
    errors,
  };
}
