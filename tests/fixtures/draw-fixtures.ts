/**
 * Isolated Test Fixtures for XSMB Data Layer Tests
 *
 * All test data is strictly isolated and contains realistic prizes with leading zeroes.
 */

import { DRAW_STATUS, VALIDATION_STATUS, LOTTERY_TYPE } from '../../app/lib/db/config/status-config';
import type { IXSMBDrawResults, CreateDrawDTO } from '../../app/lib/db/types/db-types';

/**
 * Valid complete XSMB results (exactly 27 numbers across 8 prize tiers)
 * Explicitly includes numbers with leading zeros: "00086", "021", "04", "05"
 */
export const FIXTURE_VALID_RESULTS_1: IXSMBDrawResults = {
  special: ['00086'], // 1x 5 digits (leading zero test)
  firstPrize: ['12345'], // 1x 5 digits
  secondPrize: ['04567', '98765'], // 2x 5 digits
  thirdPrize: ['11223', '44556', '77889', '09876', '54321', '67890'], // 6x 5 digits
  fourthPrize: ['0123', '4567', '8901', '2345'], // 4x 4 digits (leading zero)
  fifthPrize: ['0012', '3456', '7890', '1234', '5678', '9012'], // 6x 4 digits (leading zeroes)
  sixthPrize: ['021', '345', '678'], // 3x 3 digits (leading zero)
  seventhPrize: ['04', '05', '89', '90'], // 4x 2 digits (leading zero)
};

export const FIXTURE_VALID_RESULTS_2: IXSMBDrawResults = {
  special: ['85429'],
  firstPrize: ['36192'],
  secondPrize: ['14785', '92301'],
  thirdPrize: ['28491', '05623', '74128', '63904', '81235', '49017'],
  fourthPrize: ['4821', '6039', '1748', '9532'],
  fifthPrize: ['8204', '3195', '6471', '0852', '9316', '5270'],
  sixthPrize: ['529', '841', '306'],
  seventhPrize: ['29', '45', '78', '02'],
};

/**
 * Partial XSMB results during a live draw (Special and First prize not yet available)
 */
export const FIXTURE_PARTIAL_RESULTS: Partial<IXSMBDrawResults> = {
  special: [],
  firstPrize: [],
  secondPrize: ['14785', '92301'],
  thirdPrize: ['28491', '05623'],
  fourthPrize: ['4821', '6039'],
  fifthPrize: ['8204', '3195', '6471'],
  sixthPrize: ['529', '841', '306'],
  seventhPrize: ['29', '45', '78', '02'],
};

/**
 * Valid complete draw creation DTO
 */
export const FIXTURE_VALID_DRAW_DTO_1: CreateDrawDTO = {
  drawDate: '2026-09-02',
  lotteryType: LOTTERY_TYPE.XSMB,
  province: 'Hà Nội',
  status: DRAW_STATUS.READY,
  results: FIXTURE_VALID_RESULTS_1,
  source: {
    providerId: 'provider-test-1',
    providerName: 'Test Provider A',
    sourceUrl: 'https://test.provider/xsmb/2026-09-02',
    fetchedAt: new Date('2026-09-02T18:30:00Z'),
    checksum: 'abc123hash',
  },
  validation: {
    status: VALIDATION_STATUS.VALID,
    validatedAt: new Date('2026-09-02T18:31:00Z'),
    validatorVersion: '1.0.0',
    errors: [],
  },
  completedAt: new Date('2026-09-02T18:30:00Z'),
};

export const FIXTURE_VALID_DRAW_DTO_2: CreateDrawDTO = {
  drawDate: '2026-09-01',
  lotteryType: LOTTERY_TYPE.XSMB,
  province: 'Hà Nội',
  status: DRAW_STATUS.READY,
  results: FIXTURE_VALID_RESULTS_2,
  source: {
    providerId: 'provider-test-1',
    providerName: 'Test Provider A',
    sourceUrl: 'https://test.provider/xsmb/2026-09-01',
    fetchedAt: new Date('2026-09-01T18:30:00Z'),
    checksum: 'def456hash',
  },
  validation: {
    status: VALIDATION_STATUS.VALID,
    validatedAt: new Date('2026-09-01T18:31:00Z'),
    validatorVersion: '1.0.0',
    errors: [],
  },
  completedAt: new Date('2026-09-01T18:30:00Z'),
};
