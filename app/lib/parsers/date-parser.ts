/**
 * XSMB Date Extraction & Normalization
 *
 * Deterministically extracts and normalizes lottery draw dates from HTML content.
 * Never relies on browser locale parsing or current system date fallbacks.
 */

import { isValidDateStr } from '../date-utils';
import { cleanHtmlText } from './text-cleaner';

/**
 * Normalizes any recognized date representation into strict YYYY-MM-DD.
 * Supported input formats:
 * - DD/MM/YYYY
 * - DD-MM-YYYY
 * - DD.MM.YYYY
 * - YYYY-MM-DD
 * - YYYY/MM/DD
 */
export function normalizeDateToISO(dateString: string): string | null {
  const cleaned = cleanHtmlText(dateString);
  if (!cleaned) return null;

  // 1. Direct YYYY-MM-DD or YYYY/MM/DD match
  const isoMatch = cleaned.match(/\b(20\d{2})[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const formatted = `${year}-${month}-${day}`;
    return isValidDateStr(formatted) ? formatted : null;
  }

  // 2. Standard Vietnamese DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const vnMatch = cleaned.match(/\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](20\d{2})\b/);
  if (vnMatch) {
    const [, day, month, year] = vnMatch;
    const formatted = `${year}-${month}-${day}`;
    return isValidDateStr(formatted) ? formatted : null;
  }

  return null;
}

/**
 * Searches HTML text snippets or full page markup for draw date patterns.
 * Scans title, headers, table captions, date spans, and general text.
 */
export function extractDateFromText(text: string): string | null {
  if (!text) return null;

  const cleaned = cleanHtmlText(text);

  // Common Vietnamese date prefix patterns:
  // "ngày 02/09/2026", "ngày 02-09-2026", "Kỳ quay 02/09/2026", "XSMB 02-09-2026", "Thứ Tư, 02/09/2026"
  const patterns = [
    /ngày\s+([0-3]?\d[-/.][0-1]?\d[-/.](?:20)?\d{2})/i,
    /kỳ\s+quay(?:\s+ngày)?\s+([0-3]?\d[-/.][0-1]?\d[-/.](?:20)?\d{2})/i,
    /xsmb\s+([0-3]?\d[-/.][0-1]?\d[-/.](?:20)?\d{2})/i,
    /miền\s+bắc\s+([0-3]?\d[-/.][0-1]?\d[-/.](?:20)?\d{2})/i,
    /([0-3]?\d[-/.][0-1]?\d[-/.](?:20)?\d{2})/i,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      const normalized = normalizeDateToISO(match[1]);
      if (normalized) {
        return normalized;
      }
    }
  }

  return null;
}
