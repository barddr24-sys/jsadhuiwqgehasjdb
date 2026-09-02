/**
 * XSMB Parser Structured Errors & Error Classifications
 *
 * Defines standardized error codes and payload details for the HTML parsing layer.
 * Parsers return structured error details instead of throwing unhandled exceptions.
 */

import type { PrizeTierKey } from '../db/config/prize-config';

export type XSMBParserErrorCode =
  | 'INVALID_HTML'
  | 'INVALID_LOTTERY_PAGE'
  | 'DATE_NOT_FOUND'
  | 'DATE_MISMATCH'
  | 'SPECIAL_NOT_FOUND'
  | 'FIRST_NOT_FOUND'
  | 'SECOND_NOT_FOUND'
  | 'THIRD_NOT_FOUND'
  | 'FOURTH_NOT_FOUND'
  | 'FIFTH_NOT_FOUND'
  | 'SIXTH_NOT_FOUND'
  | 'SEVENTH_NOT_FOUND'
  | 'INVALID_NUMBER_FORMAT'
  | 'SOURCE_LAYOUT_CHANGED'
  | 'EMPTY_DOCUMENT'
  | 'MISSING_RESPONSE_BODY'
  | 'ANOMALOUS_PRIZE_COUNT';

export interface ParseErrorDetail {
  code: XSMBParserErrorCode;
  message: string;
  tier?: PrizeTierKey;
  selectorUsed?: string;
  details?: Record<string, unknown>;
}

export class ParserErrorFactory {
  static missingResponseBody(): ParseErrorDetail {
    return {
      code: 'MISSING_RESPONSE_BODY',
      message: 'Raw response body is empty or null.',
    };
  }

  static emptyDocument(): ParseErrorDetail {
    return {
      code: 'EMPTY_DOCUMENT',
      message: 'HTML document contains no recognizable body or DOM elements.',
    };
  }

  static invalidHtml(reason: string): ParseErrorDetail {
    return {
      code: 'INVALID_HTML',
      message: `Failed to parse HTML document: ${reason}`,
      details: { reason },
    };
  }

  static invalidLotteryPage(reason = 'Page does not appear to contain Northern Vietnam (XSMB) lottery results.'): ParseErrorDetail {
    return {
      code: 'INVALID_LOTTERY_PAGE',
      message: reason,
    };
  }

  static dateNotFound(): ParseErrorDetail {
    return {
      code: 'DATE_NOT_FOUND',
      message: 'Unable to extract draw date from source HTML.',
    };
  }

  static dateMismatch(requestedDate: string, extractedDate: string): ParseErrorDetail {
    return {
      code: 'DATE_MISMATCH',
      message: `Extracted draw date (${extractedDate}) does not match requested date (${requestedDate}).`,
      details: { requestedDate, extractedDate },
    };
  }

  static sourceLayoutChanged(detail?: string): ParseErrorDetail {
    return {
      code: 'SOURCE_LAYOUT_CHANGED',
      message: detail || 'Expected XSMB prize table or prize rows were not found on the page.',
      details: detail ? { detail } : undefined,
    };
  }

  static tierNotFound(tier: PrizeTierKey, selectorUsed?: string): ParseErrorDetail {
    const tierCodeMap: Record<PrizeTierKey, XSMBParserErrorCode> = {
      special: 'SPECIAL_NOT_FOUND',
      firstPrize: 'FIRST_NOT_FOUND',
      secondPrize: 'SECOND_NOT_FOUND',
      thirdPrize: 'THIRD_NOT_FOUND',
      fourthPrize: 'FOURTH_NOT_FOUND',
      fifthPrize: 'FIFTH_NOT_FOUND',
      sixthPrize: 'SIXTH_NOT_FOUND',
      seventhPrize: 'SEVENTH_NOT_FOUND',
    };

    return {
      code: tierCodeMap[tier] || 'SOURCE_LAYOUT_CHANGED',
      tier,
      selectorUsed,
      message: `Prize tier "${tier}" was not found or contained 0 numbers.`,
    };
  }

  static invalidNumberFormat(rawToken: string, tier?: PrizeTierKey, reason?: string): ParseErrorDetail {
    return {
      code: 'INVALID_NUMBER_FORMAT',
      tier,
      message: `Extracted value "${rawToken}" is not a valid lottery number.${reason ? ` (${reason})` : ''}`,
      details: { rawToken, reason },
    };
  }

  static anomalousPrizeCount(tier: PrizeTierKey, expected: number, actual: number, values: string[]): ParseErrorDetail {
    return {
      code: 'ANOMALOUS_PRIZE_COUNT',
      tier,
      message: `Tier "${tier}" extracted ${actual} numbers (expected ${expected}).`,
      details: { expected, actual, values },
    };
  }
}
