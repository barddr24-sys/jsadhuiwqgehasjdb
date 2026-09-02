/**
 * Canonical XSMB Prize Configuration
 *
 * Exact rules for Vietnam Northern Lottery (XSMB):
 * - SPECIAL: 1 number, 5 digits
 * - FIRST: 1 number, 5 digits
 * - SECOND: 2 numbers, 5 digits
 * - THIRD: 6 numbers, 5 digits
 * - FOURTH: 4 numbers, 4 digits
 * - FIFTH: 6 numbers, 4 digits
 * - SIXTH: 3 numbers, 3 digits
 * - SEVENTH: 4 numbers, 2 digits
 *
 * Total: 27 numbers
 * All lottery numbers must be stored as strings to preserve leading zeros.
 */

export interface PrizeTierDefinition {
  readonly key: PrizeTierKey;
  readonly code: string;
  readonly name: string;
  readonly shortName: string;
  readonly count: number;
  readonly digits: number;
  readonly order: number;
}

export const XSMB_PRIZE_CONFIG = {
  special: {
    key: 'special',
    code: 'SPECIAL',
    name: 'Giải Đặc Biệt',
    shortName: 'ĐB',
    count: 1,
    digits: 5,
    order: 1,
  },
  firstPrize: {
    key: 'firstPrize',
    code: 'FIRST',
    name: 'Giải Nhất',
    shortName: 'G.1',
    count: 1,
    digits: 5,
    order: 2,
  },
  secondPrize: {
    key: 'secondPrize',
    code: 'SECOND',
    name: 'Giải Nhì',
    shortName: 'G.2',
    count: 2,
    digits: 5,
    order: 3,
  },
  thirdPrize: {
    key: 'thirdPrize',
    code: 'THIRD',
    name: 'Giải Ba',
    shortName: 'G.3',
    count: 6,
    digits: 5,
    order: 4,
  },
  fourthPrize: {
    key: 'fourthPrize',
    code: 'FOURTH',
    name: 'Giải Tư',
    shortName: 'G.4',
    count: 4,
    digits: 4,
    order: 5,
  },
  fifthPrize: {
    key: 'fifthPrize',
    code: 'FIFTH',
    name: 'Giải Năm',
    shortName: 'G.5',
    count: 6,
    digits: 4,
    order: 6,
  },
  sixthPrize: {
    key: 'sixthPrize',
    code: 'SIXTH',
    name: 'Giải Sáu',
    shortName: 'G.6',
    count: 3,
    digits: 3,
    order: 7,
  },
  seventhPrize: {
    key: 'seventhPrize',
    code: 'SEVENTH',
    name: 'Giải Bảy',
    shortName: 'G.7',
    count: 4,
    digits: 2,
    order: 8,
  },
} as const;

export type PrizeTierKey = keyof typeof XSMB_PRIZE_CONFIG;

export const PRIZE_TIER_KEYS = Object.keys(XSMB_PRIZE_CONFIG) as PrizeTierKey[];

export const TOTAL_PRIZE_NUMBERS = Object.values(XSMB_PRIZE_CONFIG).reduce(
  (sum, tier) => sum + tier.count,
  0
); // Exactly 27

export const TOTAL_PRIZE_TIERS = PRIZE_TIER_KEYS.length; // Exactly 8

/**
 * Returns array of prize tiers ordered from Special to Seventh
 */
export function getOrderedPrizeTiers(): PrizeTierDefinition[] {
  return (Object.values(XSMB_PRIZE_CONFIG) as PrizeTierDefinition[]).sort(
    (a, b) => a.order - b.order
  );
}

/**
 * Returns expected count for a prize tier
 */
export function getPrizeTierCount(tier: PrizeTierKey): number {
  return XSMB_PRIZE_CONFIG[tier]?.count ?? 0;
}

/**
 * Returns required digit length for a prize tier
 */
export function getPrizeTierDigits(tier: PrizeTierKey): number {
  return XSMB_PRIZE_CONFIG[tier]?.digits ?? 0;
}
