/**
 * XSMB Text Cleaner & Token Normalizer
 *
 * Provides safe HTML string sanitization, entity decoding, whitespace normalization,
 * and string-safe token splitting. Leading zeros are strictly preserved.
 */

/**
 * Common HTML entities decoding map.
 */
const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&#160;': ' ',
  '&thinsp;': ' ',
  '&ensp;': ' ',
  '&emsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

/**
 * Cleans and normalizes raw text extracted from HTML nodes.
 * Strips zero-width characters, collapses whitespace, decodes entities.
 */
export function cleanHtmlText(text: string | null | undefined): string {
  if (!text) return '';

  let cleaned = String(text);

  // Replace common HTML entities
  for (const [entity, replacement] of Object.entries(HTML_ENTITIES)) {
    cleaned = cleaned.replaceAll(entity, replacement);
  }

  // Replace numeric HTML entities (e.g. &#8203;)
  cleaned = cleaned.replace(/&#(\d+);/g, (_, code) => {
    try {
      return String.fromCharCode(parseInt(code, 10));
    } catch {
      return '';
    }
  });

  // Replace Unicode non-breaking & zero-width spaces (\u00A0, \u200B, \u200C, \u200D, \uFEFF)
  cleaned = cleaned.replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ');

  // Standardize multiple whitespace/newlines to a single space
  cleaned = cleaned.replace(/\s+/g, ' ');

  return cleaned.trim();
}

/**
 * Tokenizes cell content into distinct prize strings.
 * Safely splits on whitespace, tabs, newlines, commas, slashes, or hyphens that separate values.
 *
 * Example:
 * "12345 67890" -> ["12345", "67890"]
 * "04 - 05 - 89" -> ["04", "05", "89"]
 * "  00086  " -> ["00086"]
 *
 * NEVER converts to numbers. Preserves leading zeroes.
 */
export function extractNumberTokens(raw: string | null | undefined): string[] {
  if (!raw) return [];

  // First clean entities and unicode spaces
  const cleaned = cleanHtmlText(raw);
  if (!cleaned) return [];

  // Split on delimiters commonly used between multiple prize numbers (spaces, commas, semicolons, dashes with spaces, newlines, pipes)
  // Note: We match whitespace, dashes surrounded by whitespace, commas, pipes, or semicolons
  const rawTokens = cleaned
    .replace(/\s*[-–—|;,/]\s*/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);

  return rawTokens;
}

/**
 * Validates if a token is a valid lottery digit string (all characters are ASCII digits 0-9).
 */
export function isNumericString(token: string): boolean {
  return /^\d+$/.test(token);
}

/**
 * Normalizes an array of raw prize tokens.
 * Filters empty items, preserves exact source order, does NOT sort or deduplicate.
 */
export function normalizePrizeTokens(tokens: string[]): string[] {
  return tokens
    .map(t => cleanHtmlText(t))
    .filter(t => t.length > 0);
}
