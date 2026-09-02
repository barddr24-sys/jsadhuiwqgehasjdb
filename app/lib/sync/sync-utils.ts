/**
 * XSMB Sync Utilities
 *
 * Deterministic cryptographic hashing, canonical serialization, and safe prize merging.
 */

import { createHash } from 'crypto';
import {
  PRIZE_TIER_KEYS,
  XSMB_PRIZE_CONFIG,
} from '../db/config/prize-config';
import type { IXSMBDrawResults } from '../db/types/db-types';

/**
 * Computes a SHA-256 hash of raw HTTP response body.
 */
export function calculateRawHash(rawBody: string): string {
  if (!rawBody) return '';
  return createHash('sha256').update(rawBody, 'utf8').digest('hex');
}

/**
 * Computes a deterministic SHA-256 checksum of canonical draw results.
 * Guarantees that identical prize results produce the exact same checksum regardless of key order.
 */
export function calculateResultsChecksum(
  results: IXSMBDrawResults,
  drawDate: string,
  lotteryType: string = 'XSMB'
): string {
  const canonicalObj = {
    drawDate,
    lotteryType,
    results: {
      special: results?.special ?? [],
      firstPrize: results?.firstPrize ?? [],
      secondPrize: results?.secondPrize ?? [],
      thirdPrize: results?.thirdPrize ?? [],
      fourthPrize: results?.fourthPrize ?? [],
      fifthPrize: results?.fifthPrize ?? [],
      sixthPrize: results?.sixthPrize ?? [],
      seventhPrize: results?.seventhPrize ?? [],
    },
  };

  return createHash('sha256')
    .update(JSON.stringify(canonicalObj), 'utf8')
    .digest('hex');
}

/**
 * Compares two IXSMBDrawResults structures for exact equality.
 */
export function areResultsEqual(
  a?: IXSMBDrawResults | null,
  b?: IXSMBDrawResults | null
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;

  for (const tier of PRIZE_TIER_KEYS) {
    const arrA = a[tier] || [];
    const arrB = b[tier] || [];

    if (arrA.length !== arrB.length) return false;
    for (let i = 0; i < arrA.length; i++) {
      if (arrA[i] !== arrB[i]) return false;
    }
  }

  return true;
}

/**
 * Merges newly available valid prize tiers into an existing partial draw result.
 *
 * Rules:
 * - Preserves existing valid prize tiers if incoming tier is empty or incomplete.
 * - Accepts incoming tier only if it contains newly available valid numbers.
 * - Never overwrites an existing valid tier with an empty array.
 * - Returns merged result and a boolean indicating whether any change occurred.
 */
export function mergePartialResults(
  existing: IXSMBDrawResults | undefined | null,
  incoming: IXSMBDrawResults
): { merged: IXSMBDrawResults; hasChanges: boolean } {
  const merged: IXSMBDrawResults = {
    special: [],
    firstPrize: [],
    secondPrize: [],
    thirdPrize: [],
    fourthPrize: [],
    fifthPrize: [],
    sixthPrize: [],
    seventhPrize: [],
  };

  let hasChanges = false;

  for (const tier of PRIZE_TIER_KEYS) {
    const existingTier = existing?.[tier] || [];
    const incomingTier = incoming?.[tier] || [];
    const expectedCount = XSMB_PRIZE_CONFIG[tier].count;

    // If incoming has complete or more numbers than existing, use incoming
    if (incomingTier.length > 0) {
      if (existingTier.length === 0) {
        merged[tier] = [...incomingTier];
        hasChanges = true;
      } else if (
        incomingTier.length >= existingTier.length &&
        incomingTier.length <= expectedCount
      ) {
        // Check if values differ
        const isDifferent =
          incomingTier.length !== existingTier.length ||
          incomingTier.some((val, idx) => val !== existingTier[idx]);

        if (isDifferent) {
          merged[tier] = [...incomingTier];
          hasChanges = true;
        } else {
          merged[tier] = [...existingTier];
        }
      } else {
        // Keep existing tier if incoming is shorter or anomalous
        merged[tier] = [...existingTier];
      }
    } else {
      // Incoming is empty for this tier, preserve existing
      merged[tier] = [...existingTier];
    }
  }

  return { merged, hasChanges };
}
