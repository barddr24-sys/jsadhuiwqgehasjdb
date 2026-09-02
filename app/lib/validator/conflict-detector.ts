/**
 * Multi-Source XSMB Conflict Detector & Comparator
 *
 * Compares normalized results from multiple providers for the same draw date.
 * If discrepancies are found across prize tiers or values, flags a deterministic
 * CONFLICT state with structured error context.
 */

import { PRIZE_TIER_KEYS } from '../db/config/prize-config';
import type { NormalizedXSMBResult } from '../parsers/types';
import type {
  MultiSourceComparisonResult,
  XSMBValidationError,
  XSMBValidationStatus,
} from './types';
import { validateDrawDateRule } from './rules/date-rule';
import { validatePrizeTiersRule } from './rules/tier-rule';

/**
 * Detects conflicts between two or more normalized XSMB draw results
 */
export function detectConflicts(
  results: NormalizedXSMBResult[]
): XSMBValidationError[] {
  const conflicts: XSMBValidationError[] = [];

  if (!results || results.length < 2) {
    return conflicts;
  }

  const base = results[0];
  const baseProvider = base.source?.providerId || 'provider-0';

  for (let i = 1; i < results.length; i++) {
    const current = results[i];
    const currentProvider = current.source?.providerId || `provider-${i}`;

    // 1. Date conflict
    if (base.drawDate !== current.drawDate) {
      conflicts.push({
        code: 'SOURCE_CONFLICT',
        field: 'drawDate',
        message: `Draw date mismatch between sources: ${baseProvider} (${base.drawDate}) vs ${currentProvider} (${current.drawDate}).`,
        details: {
          [baseProvider]: base.drawDate,
          [currentProvider]: current.drawDate,
        },
      });
    }

    // 2. Lottery type conflict
    if (base.lotteryType !== current.lotteryType) {
      conflicts.push({
        code: 'SOURCE_CONFLICT',
        field: 'lotteryType',
        message: `Lottery type mismatch between sources: ${baseProvider} (${base.lotteryType}) vs ${currentProvider} (${current.lotteryType}).`,
        details: {
          [baseProvider]: base.lotteryType,
          [currentProvider]: current.lotteryType,
        },
      });
    }

    // 3. Prize tier comparisons
    for (const tierKey of PRIZE_TIER_KEYS) {
      const baseTier = base.results?.[tierKey] || [];
      const currentTier = current.results?.[tierKey] || [];

      // Length mismatch
      if (baseTier.length !== currentTier.length) {
        conflicts.push({
          code: 'SOURCE_CONFLICT',
          tier: tierKey,
          field: `results.${tierKey}`,
          message: `Count mismatch for tier "${tierKey}": ${baseProvider} has ${baseTier.length} numbers vs ${currentProvider} has ${currentTier.length} numbers.`,
          details: {
            tier: tierKey,
            [baseProvider]: baseTier,
            [currentProvider]: currentTier,
          },
        });
        continue;
      }

      // Value mismatch at exact index
      for (let idx = 0; idx < baseTier.length; idx++) {
        const valA = baseTier[idx];
        const valB = currentTier[idx];

        if (valA !== valB) {
          conflicts.push({
            code: 'SOURCE_CONFLICT',
            tier: tierKey,
            index: idx,
            field: `results.${tierKey}[${idx}]`,
            message: `Discrepancy in tier "${tierKey}" at index ${idx}: ${baseProvider}="${valA}" vs ${currentProvider}="${valB}".`,
            details: {
              tier: tierKey,
              index: idx,
              [baseProvider]: valA,
              [currentProvider]: valB,
            },
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Compares multiple NormalizedXSMBResult entries and outputs a unified MultiSourceComparisonResult
 */
export function compareNormalizedResults(
  results: NormalizedXSMBResult[]
): MultiSourceComparisonResult {
  if (!results || results.length === 0) {
    return {
      hasConflict: false,
      status: 'INVALID',
      conflicts: [
        {
          code: 'MISSING_RESULTS',
          message: 'No normalized results provided for multi-source comparison.',
        },
      ],
      providerIds: [],
      individualResults: [],
    };
  }

  const conflicts = detectConflicts(results);
  const providerIds = results.map(
    (r, idx) => r.source?.providerId || `provider-${idx}`
  );

  // Validate individual results
  const individualResults = results.map((item, idx) => {
    const providerId = item.source?.providerId || `provider-${idx}`;
    const dateOutcome = validateDrawDateRule(item.drawDate);
    const tierOutcome = validatePrizeTiersRule(item.results);
    const hasErrors = dateOutcome.errors.length > 0 || tierOutcome.errors.length > 0;
    const status: XSMBValidationStatus = hasErrors
      ? tierOutcome.diagnostics.validNumbersCount > 0 && !tierOutcome.hasFatalError
        ? 'PARTIAL'
        : 'INVALID'
      : 'VALID';

    return {
      providerId,
      validation: {
        valid: status === 'VALID',
        status,
        errors: [...dateOutcome.errors, ...tierOutcome.errors],
        warnings: tierOutcome.warnings,
        validatedAt: new Date(),
        validatorVersion: '1.0.0',
        data: item,
        diagnostics: tierOutcome.diagnostics,
      },
    };
  });

  if (conflicts.length > 0) {
    return {
      hasConflict: true,
      status: 'CONFLICT',
      conflicts,
      providerIds,
      individualResults,
    };
  }

  // If no conflicts, determine status from the first item
  const firstValidation = individualResults[0].validation;
  return {
    hasConflict: false,
    status: firstValidation.status,
    conflicts: [],
    providerIds,
    agreedResult: firstValidation.valid ? results[0] : undefined,
    individualResults,
  };
}
