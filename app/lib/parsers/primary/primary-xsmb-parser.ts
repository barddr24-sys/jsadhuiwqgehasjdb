/**
 * Primary Web XSMB Parser & Normalizer
 *
 * Deterministic HTML parser implementing multi-strategy extraction:
 * 1. Primary Selectors -> 2. Semantic Fallback -> 3. Structural Fallback
 *
 * Rules:
 * - Pure extraction & normalization, no side effects, no database writes.
 * - Leading zeros preserved ("00086", "04"). Numbers remain string types.
 * - NEVER invents missing numbers.
 * - Incomplete draws produce status = 'PARTIAL'.
 * - Non-XSMB or corrupted pages produce status = 'INVALID' or 'SOURCE_LAYOUT_CHANGED'.
 */

import * as cheerio from 'cheerio';
import type { RawXSMBResponse } from '../../providers/types';
import {
  XSMB_PRIZE_CONFIG,
  PRIZE_TIER_KEYS,
  PrizeTierKey,
} from '../../db/config/prize-config';
import type {
  XSMBParser,
  ParseResult,
  ParseStatus,
  NormalizedXSMBResult,
  RawExtractedPrizes,
  ParserDiagnostics,
} from '../types';
import {
  ParseErrorDetail,
  ParserErrorFactory,
} from '../parser-errors';
import {
  cleanHtmlText,
  extractNumberTokens,
  isNumericString,
} from '../text-cleaner';
import {
  extractDateFromText,
} from '../date-parser';
import { extractProvince } from '../province-parser';
import {
  TIER_SELECTORS,
  DATE_SELECTORS,
  PROVINCE_SELECTORS,
  XSMB_IDENTIFIER_KEYWORDS,
} from './selectors';

export class PrimaryXSMBParser implements XSMBParser {
  readonly parserId = 'primary-xsmb-parser';
  readonly parserVersion = '1.0.0';

  /**
   * Parses a raw provider response into a normalized result or structured failure.
   */
  parse(response: RawXSMBResponse): ParseResult {
    const startTime = Date.now();
    const errors: ParseErrorDetail[] = [];

    // 1. Guard against empty response body
    if (!response || !response.rawBody || response.rawBody.trim() === '') {
      errors.push(ParserErrorFactory.missingResponseBody());
      return {
        status: 'INVALID',
        errors,
        diagnostics: {
          parserVersion: this.parserVersion,
          sourceUrl: response?.sourceUrl || '',
          requestedDate: response?.requestedDate || '',
          durationMs: Date.now() - startTime,
        },
      };
    }

    // 2. Load DOM via Cheerio (single-pass, memory-safe)
    let $: cheerio.CheerioAPI;
    try {
      $ = cheerio.load(response.rawBody);
    } catch (err) {
      errors.push(ParserErrorFactory.invalidHtml(err instanceof Error ? err.message : String(err)));
      return {
        status: 'INVALID',
        errors,
        diagnostics: {
          parserVersion: this.parserVersion,
          sourceUrl: response.sourceUrl,
          requestedDate: response.requestedDate,
          durationMs: Date.now() - startTime,
        },
      };
    }

    // Check if document has any content
    const pageText = cleanHtmlText($.root().text());
    if (!pageText || pageText.length < 10) {
      errors.push(ParserErrorFactory.emptyDocument());
      return {
        status: 'INVALID',
        errors,
        diagnostics: {
          parserVersion: this.parserVersion,
          sourceUrl: response.sourceUrl,
          requestedDate: response.requestedDate,
          durationMs: Date.now() - startTime,
        },
      };
    }

    // 3. Verify page relevance (is this an XSMB or lottery page?)
    const isLotteryPage = this.verifyLotteryRelevance($, pageText);
    if (!isLotteryPage) {
      errors.push(ParserErrorFactory.invalidLotteryPage());
      return {
        status: 'INVALID',
        errors,
        diagnostics: {
          parserVersion: this.parserVersion,
          sourceUrl: response.sourceUrl,
          requestedDate: response.requestedDate,
          durationMs: Date.now() - startTime,
        },
      };
    }

    // 4. Extract Draw Date and compare with requested date
    const extractedDate = this.extractDrawDate($);
    if (!extractedDate) {
      errors.push(ParserErrorFactory.dateNotFound());
    } else if (response.requestedDate && extractedDate !== response.requestedDate) {
      errors.push(ParserErrorFactory.dateMismatch(response.requestedDate, extractedDate));
    }

    // 5. Extract Province / Region if displayed
    const province = this.extractProvinceName($);

    // 6. Extract all 8 prize tiers
    let matchedStrategy: 'primary_selector' | 'semantic_fallback' | 'structural_fallback' | 'none' = 'none';
    const rawPrizes: RawExtractedPrizes = {
      special: [],
      firstPrize: [],
      secondPrize: [],
      thirdPrize: [],
      fourthPrize: [],
      fifthPrize: [],
      sixthPrize: [],
      seventhPrize: [],
    };

    let totalExtractedTokens = 0;
    const extractedCounts: Record<string, number> = {};
    const missingTiers: string[] = [];

    for (const tier of PRIZE_TIER_KEYS) {
      const { tokens, strategy } = this.extractTierTokens($, tier);
      rawPrizes[tier] = tokens;
      extractedCounts[tier] = tokens.length;
      totalExtractedTokens += tokens.length;

      if (strategy !== 'none' && matchedStrategy === 'none') {
        matchedStrategy = strategy;
      }

      if (tokens.length === 0) {
        missingTiers.push(tier);
      }
    }

    // 7. Check for total layout failure (0 numbers across all tiers)
    if (totalExtractedTokens === 0) {
      errors.push(ParserErrorFactory.sourceLayoutChanged('No prize tiers or numbers could be extracted from page.'));
      return {
        status: 'SOURCE_LAYOUT_CHANGED',
        errors,
        diagnostics: {
          parserVersion: this.parserVersion,
          sourceUrl: response.sourceUrl,
          requestedDate: response.requestedDate,
          extractedDate: extractedDate || undefined,
          parsingStrategy: 'none',
          missingTiers,
          durationMs: Date.now() - startTime,
        },
      };
    }

    // 8. Validate and sanitize extracted tokens.
    //
    // Placeholder tokens (e.g. "...", "…", "-", "--") appear on live pages before
    // the draw is published. They are NOT malformed data — silently drop them so
    // the parser produces PARTIAL (pre-draw) rather than INVALID.
    //
    // Only tokens that contain a mix of digits and non-digit, non-placeholder
    // characters are treated as genuinely malformed.
    const PLACEHOLDER_PATTERN = /^[.\-–—…\s]+$/;

    let hasMalformedToken = false;
    for (const tier of PRIZE_TIER_KEYS) {
      // Filter out placeholder-only tokens before validation
      const allTokens = rawPrizes[tier];
      const numericTokens = allTokens.filter(t => isNumericString(t));
      const placeholders = allTokens.filter(t => PLACEHOLDER_PATTERN.test(t));
      const genuinelyMalformed = allTokens.filter(
        t => !isNumericString(t) && !PLACEHOLDER_PATTERN.test(t)
      );

      // Replace raw tier with only valid numeric tokens
      rawPrizes[tier] = numericTokens;

      const expectedCount = XSMB_PRIZE_CONFIG[tier].count;

      // Only flag tokens that are neither numeric nor placeholder (e.g. "abc", "12x")
      for (const token of genuinelyMalformed) {
        hasMalformedToken = true;
        errors.push(ParserErrorFactory.invalidNumberFormat(token, tier, 'Contains non-digit characters'));
      }

      // Recalculate missing tiers based on filtered tokens
      const finalTokens = rawPrizes[tier];
      if (finalTokens.length === 0) {
        if (!missingTiers.includes(tier)) {
          missingTiers.push(tier);
        }
        if (!errors.some(e => e.code === ParserErrorFactory.tierNotFound(tier).code)) {
          errors.push(ParserErrorFactory.tierNotFound(tier));
        }
      } else if (finalTokens.length > expectedCount) {
        errors.push(ParserErrorFactory.anomalousPrizeCount(tier, expectedCount, finalTokens.length, finalTokens));
      }

      // Update extracted count to reflect only valid tokens
      extractedCounts[tier] = finalTokens.length;
    }

    // Recount total extracted after placeholder filtering
    totalExtractedTokens = Object.values(rawPrizes).reduce((sum, arr) => sum + arr.length, 0);

    // 9. Determine overall parse status
    let status: ParseStatus = 'SUCCESS';

    const hasDateMismatch = errors.some(e => e.code === 'DATE_MISMATCH');
    const hasDateNotFound = errors.some(e => e.code === 'DATE_NOT_FOUND');

    if (hasMalformedToken || hasDateMismatch) {
      status = 'INVALID';
    } else if (missingTiers.length > 0 || hasDateNotFound) {
      // Missing tiers = partial draw (live in progress or pre-draw placeholder state)
      status = 'PARTIAL';
    }

    // 10. Construct Normalized Output
    const normalizedResult: NormalizedXSMBResult = {
      drawDate: extractedDate || response.requestedDate,
      lotteryType: 'XSMB',
      province,
      results: {
        special: rawPrizes.special,
        firstPrize: rawPrizes.firstPrize,
        secondPrize: rawPrizes.secondPrize,
        thirdPrize: rawPrizes.thirdPrize,
        fourthPrize: rawPrizes.fourthPrize,
        fifthPrize: rawPrizes.fifthPrize,
        sixthPrize: rawPrizes.sixthPrize,
        seventhPrize: rawPrizes.seventhPrize,
      },
      source: {
        providerId: response.providerId,
        sourceUrl: response.sourceUrl,
        fetchedAt: response.fetchedAt,
      },
      parserVersion: this.parserVersion,
    };

    const diagnostics: ParserDiagnostics = {
      parserVersion: this.parserVersion,
      sourceUrl: response.sourceUrl,
      requestedDate: response.requestedDate,
      extractedDate: extractedDate || undefined,
      parsingStrategy: matchedStrategy,
      extractedCounts,
      missingTiers,
      durationMs: Date.now() - startTime,
    };

    return {
      status,
      data: normalizedResult,
      errors,
      diagnostics,
    };
  }

  // ─── Internal Extraction Helpers ──────────────────────────────────────────

  /**
   * Verifies whether the HTML document represents an XSMB lottery result page.
   */
  private verifyLotteryRelevance($: cheerio.CheerioAPI, text: string): boolean {
    const lower = text.toLowerCase();

    // Check for explicit XSMB keywords
    for (const keyword of XSMB_IDENTIFIER_KEYWORDS) {
      if (lower.includes(keyword)) {
        return true;
      }
    }

    // Check if table contains prize tiers
    for (const tierKey of PRIZE_TIER_KEYS) {
      const aliases = TIER_SELECTORS[tierKey].semanticAliases;
      for (const alias of aliases) {
        if (lower.includes(alias)) {
          return true;
        }
      }
    }

    // Check for standard lottery table classes/attributes
    if ($('table.table-xsmb, table.bkq-table, [data-prize], .box_kqxs').length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Extracts draw date from metadata, headings, or date elements.
   */
  private extractDrawDate($: cheerio.CheerioAPI): string | null {
    // 1. Check targeted date selectors
    for (const selector of DATE_SELECTORS) {
      const el = $(selector);
      if (el.length > 0) {
        for (let i = 0; i < el.length; i++) {
          const text = $(el[i]).text();
          const parsed = extractDateFromText(text);
          if (parsed) return parsed;
        }
      }
    }

    // 2. Check title tag
    const titleText = $('title').text();
    const parsedFromTitle = extractDateFromText(titleText);
    if (parsedFromTitle) return parsedFromTitle;

    // 3. Check entire body text prefix
    const bodyText = $('body').text().slice(0, 1000);
    return extractDateFromText(bodyText);
  }

  /**
   * Extracts province if displayed in source HTML.
   */
  private extractProvinceName($: cheerio.CheerioAPI): string | undefined {
    for (const selector of PROVINCE_SELECTORS) {
      const el = $(selector);
      if (el.length > 0) {
        for (let i = 0; i < el.length; i++) {
          const text = $(el[i]).text();
          const province = extractProvince(text);
          if (province) return province;
        }
      }
    }
    return undefined;
  }

  /**
   * Helper to extract text from a cheerio element, converting <br> tags into whitespace
   * so numbers separated by line breaks are not concatenated.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getElementText($el: cheerio.Cheerio<any>): string {
    const clone = $el.clone();
    clone.find('br').replaceWith(' ');
    return clone.text();
  }

  /**
   * Extracts numbers for a specific tier using the 3-level fallback hierarchy:
   * Level 1: Primary CSS selectors
   * Level 2: Semantic row/cell label matching
   * Level 3: Structural table scan
   */
  private extractTierTokens(
    $: cheerio.CheerioAPI,
    tier: PrizeTierKey
  ): { tokens: string[]; strategy: 'primary_selector' | 'semantic_fallback' | 'structural_fallback' | 'none' } {
    const config = TIER_SELECTORS[tier];

    // ── Strategy 1: Primary CSS Selectors ──
    for (const selector of config.primarySelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        const collected: string[] = [];
        elements.each((_, el) => {
          const text = this.getElementText($(el));
          const tokens = extractNumberTokens(text);
          collected.push(...tokens);
        });

        if (collected.length > 0) {
          return { tokens: collected, strategy: 'primary_selector' };
        }
      }
    }

    // ── Strategy 2: Semantic Row/Cell Label Matching ──
    const rows = $('tr, .row, div.item');
    for (let i = 0; i < rows.length; i++) {
      const row = $(rows[i]);
      const rowText = cleanHtmlText(row.text()).toLowerCase();

      const matchedAlias = config.semanticAliases.some(alias => {
        // Match label in first child cell or label element
        const labelCell = row.find('td:first-child, th:first-child, .label, .prize-name').text().toLowerCase();
        if (cleanHtmlText(labelCell).includes(alias)) return true;
        return rowText.startsWith(alias) || rowText.includes(alias);
      });

      if (matchedAlias) {
        // Extract from value cells (non-label cells)
        const valueCells = row.find('td:not(:first-child), .number, .value, .prize-number, span.v-gdb, span.v-g1');
        const collected: string[] = [];

        if (valueCells.length > 0) {
          valueCells.each((_, cell) => {
            const cellText = this.getElementText($(cell));
            collected.push(...extractNumberTokens(cellText));
          });
        } else {
          // If no inner cells, extract numbers from row text excluding the alias prefix
          const fullText = this.getElementText(row);
          collected.push(...extractNumberTokens(fullText));
        }

        if (collected.length > 0) {
          return { tokens: collected, strategy: 'semantic_fallback' };
        }
      }
    }

    // ── Strategy 3: Structural Fallback (Numbered Prize Table) ──
    // For standard 8-row tables where row index or class matches prize order
    const tableRows = $('table tbody tr, table tr');
    if (tableRows.length >= 8) {
      const tierIndexMap: Record<PrizeTierKey, number> = {
        special: 0,
        firstPrize: 1,
        secondPrize: 2,
        thirdPrize: 3,
        fourthPrize: 4,
        fifthPrize: 5,
        sixthPrize: 6,
        seventhPrize: 7,
      };

      const targetRowIndex = tierIndexMap[tier];
      const targetRow = $(tableRows[targetRowIndex]);
      if (targetRow.length > 0) {
        const lastCell = targetRow.find('td:last-child');
        if (lastCell.length > 0) {
          const tokens = extractNumberTokens(this.getElementText(lastCell));
          if (tokens.length > 0) {
            return { tokens, strategy: 'structural_fallback' };
          }
        }
      }
    }

    return { tokens: [], strategy: 'none' };
  }
}
