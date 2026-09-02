/**
 * Isolated Test Fixtures for XSMB Validator Suite
 *
 * Provides fixture objects for valid, leading zero, partial, malformed,
 * invalid date, wrong lottery type, and multi-source conflict scenarios.
 */

import type { NormalizedXSMBResult } from '../../app/lib/parsers/types';

/**
 * 1. Valid complete XSMB result (27 numbers across all 8 tiers)
 */
export const FIXTURE_VALID_COMPLETE: NormalizedXSMBResult = {
  drawDate: '2026-09-02',
  lotteryType: 'XSMB',
  province: 'Hà Nội',
  results: {
    special: ['85429'],
    firstPrize: ['36192'],
    secondPrize: ['14785', '92301'],
    thirdPrize: ['28491', '05623', '74128', '63904', '81235', '49017'],
    fourthPrize: ['4821', '6039', '1748', '9532'],
    fifthPrize: ['8204', '3195', '6471', '0852', '9316', '5270'],
    sixthPrize: ['529', '841', '306'],
    seventhPrize: ['29', '45', '78', '02'],
  },
  source: {
    providerId: 'test-provider-primary',
    sourceUrl: 'https://test.provider/xsmb/2026-09-02',
    fetchedAt: new Date('2026-09-02T18:35:00Z'),
  },
  parserVersion: '1.0.0',
};

/**
 * 2. Valid result with prominent leading zeroes across all tiers
 */
export const FIXTURE_VALID_LEADING_ZERO: NormalizedXSMBResult = {
  drawDate: '2026-09-02',
  lotteryType: 'XSMB',
  province: 'Hà Nội',
  results: {
    special: ['00086'], // 5 digits with double leading zero
    firstPrize: ['01234'], // 5 digits with leading zero
    secondPrize: ['04567', '09876'], // 5 digits with leading zero
    thirdPrize: ['00123', '04556', '07889', '09876', '04321', '07890'],
    fourthPrize: ['0123', '0567', '0901', '0345'], // 4 digits with leading zero
    fifthPrize: ['0012', '0456', '0890', '0234', '0678', '0012'],
    sixthPrize: ['021', '045', '078'], // 3 digits with leading zero
    seventhPrize: ['04', '08', '09', '00'], // 2 digits with leading zero
  },
  source: {
    providerId: 'test-provider-primary',
    sourceUrl: 'https://test.provider/xsmb/2026-09-02',
    fetchedAt: new Date('2026-09-02T18:35:00Z'),
  },
  parserVersion: '1.0.0',
};

/**
 * 3. Partial result during in-progress live draw
 * (Seventh, Sixth, Fifth, Fourth completed; Third partial; Second, First, Special pending)
 */
export const FIXTURE_PARTIAL_RESULT: NormalizedXSMBResult = {
  drawDate: '2026-09-02',
  lotteryType: 'XSMB',
  province: 'Hà Nội',
  results: {
    special: [],
    firstPrize: [],
    secondPrize: [],
    thirdPrize: ['28491', '05623'], // 2 of 6 drawn so far
    fourthPrize: ['4821', '6039', '1748', '9532'], // 4 of 4
    fifthPrize: ['8204', '3195', '6471', '0852', '9316', '5270'], // 6 of 6
    sixthPrize: ['529', '841', '306'], // 3 of 3
    seventhPrize: ['29', '45', '78', '02'], // 4 of 4
  },
  source: {
    providerId: 'test-provider-primary',
    sourceUrl: 'https://test.provider/xsmb/2026-09-02',
    fetchedAt: new Date('2026-09-02T18:20:00Z'),
  },
  parserVersion: '1.0.0',
};

/**
 * 4. Missing prize tier (seventhPrize is completely omitted from results object)
 */
export const FIXTURE_MISSING_TIER: NormalizedXSMBResult = {
  drawDate: '2026-09-02',
  lotteryType: 'XSMB',
  results: {
    special: ['85429'],
    firstPrize: ['36192'],
    secondPrize: ['14785', '92301'],
    thirdPrize: ['28491', '05623', '74128', '63904', '81235', '49017'],
    fourthPrize: ['4821', '6039', '1748', '9532'],
    fifthPrize: ['8204', '3195', '6471', '0852', '9316', '5270'],
    sixthPrize: ['529', '841', '306'],
    // seventhPrize is missing
  } as unknown as NormalizedXSMBResult['results'],
  source: {
    providerId: 'test-provider-primary',
    sourceUrl: 'https://test.provider/xsmb/2026-09-02',
    fetchedAt: new Date('2026-09-02T18:35:00Z'),
  },
};

/**
 * 5. Wrong prize counts (Special has 2 numbers instead of 1, Third has 7 instead of 6)
 */
export const FIXTURE_WRONG_COUNT: NormalizedXSMBResult = {
  drawDate: '2026-09-02',
  lotteryType: 'XSMB',
  results: {
    special: ['85429', '99999'], // 2 numbers (expected 1)
    firstPrize: ['36192'],
    secondPrize: ['14785', '92301'],
    thirdPrize: ['28491', '05623', '74128', '63904', '81235', '49017', '99999'], // 7 numbers (expected 6)
    fourthPrize: ['4821', '6039', '1748', '9532'],
    fifthPrize: ['8204', '3195', '6471', '0852', '9316', '5270'],
    sixthPrize: ['529', '841', '306'],
    seventhPrize: ['29', '45', '78', '02'],
  },
  source: {
    providerId: 'test-provider-primary',
    sourceUrl: 'https://test.provider/xsmb/2026-09-02',
    fetchedAt: new Date('2026-09-02T18:35:00Z'),
  },
};

/**
 * 6. Wrong digit length (Special has 4 digits instead of 5, Seventh has 1 digit instead of 2)
 */
export const FIXTURE_WRONG_DIGIT_LENGTH: NormalizedXSMBResult = {
  drawDate: '2026-09-02',
  lotteryType: 'XSMB',
  results: {
    special: ['1234'], // 4 digits (expected 5)
    firstPrize: ['36192'],
    secondPrize: ['14785', '92301'],
    thirdPrize: ['28491', '05623', '74128', '63904', '81235', '49017'],
    fourthPrize: ['4821', '6039', '1748', '9532'],
    fifthPrize: ['8204', '3195', '6471', '0852', '9316', '5270'],
    sixthPrize: ['529', '841', '306'],
    seventhPrize: ['4', '45', '78', '02'], // 1 digit (expected 2)
  },
  source: {
    providerId: 'test-provider-primary',
    sourceUrl: 'https://test.provider/xsmb/2026-09-02',
    fetchedAt: new Date('2026-09-02T18:35:00Z'),
  },
};

/**
 * 7. Numeric values passed as numbers instead of strings
 */
export const FIXTURE_NUMERIC_VALUE: NormalizedXSMBResult = {
  drawDate: '2026-09-02',
  lotteryType: 'XSMB',
  results: {
    special: [85429 as unknown as string], // Raw number
    firstPrize: ['36192'],
    secondPrize: ['14785', 92301 as unknown as string], // Raw number
    thirdPrize: ['28491', '05623', '74128', '63904', '81235', '49017'],
    fourthPrize: ['4821', '6039', '1748', '9532'],
    fifthPrize: ['8204', '3195', '6471', '0852', '9316', '5270'],
    sixthPrize: ['529', '841', '306'],
    seventhPrize: ['29', 45 as unknown as string, '78', 2 as unknown as string], // Raw numbers
  },
  source: {
    providerId: 'test-provider-primary',
    sourceUrl: 'https://test.provider/xsmb/2026-09-02',
    fetchedAt: new Date('2026-09-02T18:35:00Z'),
  },
};

/**
 * 8. Empty value strings and whitespace-only strings
 */
export const FIXTURE_EMPTY_VALUE: NormalizedXSMBResult = {
  drawDate: '2026-09-02',
  lotteryType: 'XSMB',
  results: {
    special: [''], // Empty string
    firstPrize: ['   '], // Whitespace-only string
    secondPrize: ['14785', '92301'],
    thirdPrize: ['28491', '05623', '74128', '63904', '81235', '49017'],
    fourthPrize: ['4821', '6039', '1748', '9532'],
    fifthPrize: ['8204', '3195', '6471', '0852', '9316', '5270'],
    sixthPrize: ['529', '841', '306'],
    seventhPrize: ['29', '45', '78', '02'],
  },
  source: {
    providerId: 'test-provider-primary',
    sourceUrl: 'https://test.provider/xsmb/2026-09-02',
    fetchedAt: new Date('2026-09-02T18:35:00Z'),
  },
};

/**
 * 9. Non-numeric characters (letters, hyphens, periods, unnormalized whitespace)
 */
export const FIXTURE_NON_NUMERIC: NormalizedXSMBResult = {
  drawDate: '2026-09-02',
  lotteryType: 'XSMB',
  results: {
    special: ['12A45'], // Letters
    firstPrize: ['1-234'], // Hyphen
    secondPrize: ['12.34', ' 98765 '], // Decimal & untrimmed whitespace
    thirdPrize: ['28491', '05623', '74128', '63904', '81235', '49017'],
    fourthPrize: ['4821', '6039', '1748', '9532'],
    fifthPrize: ['8204', '3195', '6471', '0852', '9316', '5270'],
    sixthPrize: ['529', '841', '306'],
    seventhPrize: ['29', '45', '78', '02'],
  },
  source: {
    providerId: 'test-provider-primary',
    sourceUrl: 'https://test.provider/xsmb/2026-09-02',
    fetchedAt: new Date('2026-09-02T18:35:00Z'),
  },
};

/**
 * 10. Invalid dates (wrong formats and impossible calendar dates)
 */
export const FIXTURE_INVALID_DATE_FORMAT: NormalizedXSMBResult = {
  drawDate: '02/09/2026', // Slash format
  lotteryType: 'XSMB',
  results: FIXTURE_VALID_COMPLETE.results,
  source: FIXTURE_VALID_COMPLETE.source,
};

export const FIXTURE_IMPOSSIBLE_CALENDAR_DATE: NormalizedXSMBResult = {
  drawDate: '2026-02-30', // Feb 30th does not exist
  lotteryType: 'XSMB',
  results: FIXTURE_VALID_COMPLETE.results,
  source: FIXTURE_VALID_COMPLETE.source,
};

/**
 * 11. Date mismatch (contains 2026-09-01 when 2026-09-02 was requested)
 */
export const FIXTURE_DATE_MISMATCH: NormalizedXSMBResult = {
  drawDate: '2026-09-01',
  lotteryType: 'XSMB',
  results: FIXTURE_VALID_COMPLETE.results,
  source: FIXTURE_VALID_COMPLETE.source,
};

/**
 * 12. Wrong lottery type (e.g. XSMN or LOTTO)
 */
export const FIXTURE_WRONG_LOTTERY_TYPE: NormalizedXSMBResult = {
  drawDate: '2026-09-02',
  lotteryType: 'XSMN' as unknown as 'XSMB',
  results: FIXTURE_VALID_COMPLETE.results,
  source: FIXTURE_VALID_COMPLETE.source,
};

/**
 * 13. Conflicting provider results (Provider A vs Provider B with different special prize)
 */
export const FIXTURE_CONFLICT_PROVIDER_A: NormalizedXSMBResult = {
  drawDate: '2026-09-02',
  lotteryType: 'XSMB',
  province: 'Hà Nội',
  results: {
    ...FIXTURE_VALID_COMPLETE.results,
    special: ['12345'],
  },
  source: {
    providerId: 'provider-alpha',
    sourceUrl: 'https://alpha.example/xsmb/2026-09-02',
    fetchedAt: new Date('2026-09-02T18:35:00Z'),
  },
};

export const FIXTURE_CONFLICT_PROVIDER_B: NormalizedXSMBResult = {
  drawDate: '2026-09-02',
  lotteryType: 'XSMB',
  province: 'Hà Nội',
  results: {
    ...FIXTURE_VALID_COMPLETE.results,
    special: ['12354'], // Discrepancy with Provider A
  },
  source: {
    providerId: 'provider-beta',
    sourceUrl: 'https://beta.example/xsmb/2026-09-02',
    fetchedAt: new Date('2026-09-02T18:35:00Z'),
  },
};
