/**
 * XSMB Province & Region Extractor
 *
 * Extracts displayed location metadata (e.g. "Miền Bắc", "Hà Nội", "Quảng Ninh")
 * from the source HTML without fabricating values.
 */

import { cleanHtmlText } from './text-cleaner';

/**
 * Standard XSMB host provinces and aliases.
 */
const KNOWN_XSMB_PROVINCES = [
  'Hà Nội',
  'Quảng Ninh',
  'Bắc Ninh',
  'Hải Phòng',
  'Nam Định',
  'Thái Bình',
  'Miền Bắc',
];

/**
 * Attempts to extract province or regional designation from text.
 * Returns undefined if no recognizable province is mentioned.
 */
export function extractProvince(text: string | null | undefined): string | undefined {
  if (!text) return undefined;

  const cleaned = cleanHtmlText(text);
  if (!cleaned) return undefined;

  for (const province of KNOWN_XSMB_PROVINCES) {
    // Look for exact word boundary match (case-insensitive)
    const regex = new RegExp(`\\b${province}\\b`, 'i');
    if (regex.test(cleaned)) {
      return province;
    }
  }

  return undefined;
}
