/**
 * XSMB HTML Parser & Normalizer — Core Types & Contracts
 *
 * Defines canonical normalized outputs, parser interfaces, diagnostics,
 * and parsing statuses for transforming raw HTML provider responses.
 */

import type { RawXSMBResponse } from '../providers/types';
import type { IXSMBDrawResults } from '../db/types/db-types';
import type { ParseErrorDetail } from './parser-errors';

/**
 * Normalized result structure conforming strictly to the canonical data model.
 */
export interface NormalizedXSMBResult {
  /** Draw date in strict YYYY-MM-DD format */
  drawDate: string;

  /** Strict lottery identifier */
  lotteryType: 'XSMB';

  /** Displayed province or region (e.g. "Hà Nội", "Miền Bắc"), if present in source */
  province?: string;

  /** Canonical 8 prize tiers containing string representations with leading zeros preserved */
  results: IXSMBDrawResults;

  /** Original fetch provenance metadata (no sensitive tokens/cookies) */
  source: {
    providerId: string;
    sourceUrl: string;
    fetchedAt: Date;
  };

  /** Parser engine version string for auditing */
  parserVersion?: string;
}

/**
 * High-level parser outcome classification.
 * - SUCCESS: All 8 prize tiers and expected numbers extracted cleanly.
 * - PARTIAL: Incomplete draw (e.g. live in-progress draw with missing prize tiers).
 * - INVALID: Page contains corrupt/malformed numbers, invalid lottery type, or date mismatch.
 * - SOURCE_LAYOUT_CHANGED: Expected lottery table or semantic structure was not found.
 */
export type ParseStatus =
  | 'SUCCESS'
  | 'PARTIAL'
  | 'INVALID'
  | 'SOURCE_LAYOUT_CHANGED';

/**
 * Safe development diagnostics for parser analysis and source monitoring.
 * Contains no raw HTML body or secrets.
 */
export interface ParserDiagnostics {
  parserVersion: string;
  sourceUrl: string;
  requestedDate: string;
  extractedDate?: string;
  matchedSelector?: string;
  parsingStrategy?: 'primary_selector' | 'semantic_fallback' | 'structural_fallback' | 'none';
  extractedCounts?: Record<string, number>;
  missingTiers?: string[];
  durationMs: number;
}

/**
 * Unified return type for all XSMB HTML parsers.
 */
export interface ParseResult {
  status: ParseStatus;
  data?: NormalizedXSMBResult;
  errors: ParseErrorDetail[];
  diagnostics?: ParserDiagnostics;
}

/**
 * Standard parser contract implemented by all source-specific parsers.
 */
export interface XSMBParser {
  readonly parserId: string;
  readonly parserVersion: string;
  parse(response: RawXSMBResponse): ParseResult;
}

/**
 * Intermediate raw extracted prizes prior to normalization and count checks.
 */
export interface RawExtractedPrizes {
  special: string[];
  firstPrize: string[];
  secondPrize: string[];
  thirdPrize: string[];
  fourthPrize: string[];
  fifthPrize: string[];
  sixthPrize: string[];
  seventhPrize: string[];
}
