import { describe, it, expect } from 'vitest';
import {
  XSMB_PRIZE_CONFIG,
  PRIZE_TIER_KEYS,
  TOTAL_PRIZE_NUMBERS,
  TOTAL_PRIZE_TIERS,
  getOrderedPrizeTiers,
  getPrizeTierCount,
  getPrizeTierDigits,
} from '../app/lib/db/config/prize-config';

describe('Canonical XSMB Prize Configuration', () => {
  it('should define exactly 8 prize tiers', () => {
    expect(TOTAL_PRIZE_TIERS).toBe(8);
    expect(PRIZE_TIER_KEYS).toHaveLength(8);
    expect(PRIZE_TIER_KEYS).toEqual([
      'special',
      'firstPrize',
      'secondPrize',
      'thirdPrize',
      'fourthPrize',
      'fifthPrize',
      'sixthPrize',
      'seventhPrize',
    ]);
  });

  it('should sum to exactly 27 total prize numbers', () => {
    expect(TOTAL_PRIZE_NUMBERS).toBe(27);
  });

  it('should have exact counts and digits matching canonical Northern Vietnam Lottery rules', () => {
    // SPECIAL: 1 number, 5 digits
    expect(XSMB_PRIZE_CONFIG.special.count).toBe(1);
    expect(XSMB_PRIZE_CONFIG.special.digits).toBe(5);

    // FIRST: 1 number, 5 digits
    expect(XSMB_PRIZE_CONFIG.firstPrize.count).toBe(1);
    expect(XSMB_PRIZE_CONFIG.firstPrize.digits).toBe(5);

    // SECOND: 2 numbers, 5 digits
    expect(XSMB_PRIZE_CONFIG.secondPrize.count).toBe(2);
    expect(XSMB_PRIZE_CONFIG.secondPrize.digits).toBe(5);

    // THIRD: 6 numbers, 5 digits
    expect(XSMB_PRIZE_CONFIG.thirdPrize.count).toBe(6);
    expect(XSMB_PRIZE_CONFIG.thirdPrize.digits).toBe(5);

    // FOURTH: 4 numbers, 4 digits
    expect(XSMB_PRIZE_CONFIG.fourthPrize.count).toBe(4);
    expect(XSMB_PRIZE_CONFIG.fourthPrize.digits).toBe(4);

    // FIFTH: 6 numbers, 4 digits
    expect(XSMB_PRIZE_CONFIG.fifthPrize.count).toBe(6);
    expect(XSMB_PRIZE_CONFIG.fifthPrize.digits).toBe(4);

    // SIXTH: 3 numbers, 3 digits
    expect(XSMB_PRIZE_CONFIG.sixthPrize.count).toBe(3);
    expect(XSMB_PRIZE_CONFIG.sixthPrize.digits).toBe(3);

    // SEVENTH: 4 numbers, 2 digits
    expect(XSMB_PRIZE_CONFIG.seventhPrize.count).toBe(4);
    expect(XSMB_PRIZE_CONFIG.seventhPrize.digits).toBe(2);
  });

  it('should return ordered prize tiers from Special down to Seventh', () => {
    const tiers = getOrderedPrizeTiers();
    expect(tiers).toHaveLength(8);
    expect(tiers[0].key).toBe('special');
    expect(tiers[7].key).toBe('seventhPrize');
  });

  it('should return correct counts and digits via helper functions', () => {
    expect(getPrizeTierCount('special')).toBe(1);
    expect(getPrizeTierDigits('special')).toBe(5);
    expect(getPrizeTierCount('seventhPrize')).toBe(4);
    expect(getPrizeTierDigits('seventhPrize')).toBe(2);
  });
});
