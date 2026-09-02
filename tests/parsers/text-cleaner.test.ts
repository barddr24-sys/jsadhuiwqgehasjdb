/**
 * Unit Tests for Text Cleaner & Token Normalizer
 */

import { describe, it, expect } from 'vitest';
import {
  cleanHtmlText,
  extractNumberTokens,
  isNumericString,
  normalizePrizeTokens,
} from '../../app/lib/parsers/text-cleaner';

describe('Text Cleaner & Token Normalizer', () => {
  describe('cleanHtmlText', () => {
    it('handles null, undefined, or empty strings safely', () => {
      expect(cleanHtmlText(null)).toBe('');
      expect(cleanHtmlText(undefined)).toBe('');
      expect(cleanHtmlText('')).toBe('');
      expect(cleanHtmlText('   ')).toBe('');
    });

    it('decodes HTML entities including &nbsp; and numeric codes', () => {
      expect(cleanHtmlText('12345&nbsp;&nbsp;67890')).toBe('12345 67890');
      expect(cleanHtmlText('Giải&#160;Đặc&#160;Biệt')).toBe('Giải Đặc Biệt');
      expect(cleanHtmlText('&lt;b&gt;85429&lt;/b&gt;')).toBe('<b>85429</b>');
    });

    it('collapses consecutive whitespace and newlines to single space', () => {
      expect(cleanHtmlText('  12345   \n\t  67890 \r\n 11223 ')).toBe('12345 67890 11223');
    });

    it('strips Unicode zero-width and non-breaking spaces', () => {
      expect(cleanHtmlText('12345\u00A067890\u200B11223')).toBe('12345 67890 11223');
    });
  });

  describe('extractNumberTokens', () => {
    it('splits space-separated numbers without accidental concatenation', () => {
      const result = extractNumberTokens('12345 67890 11223');
      expect(result).toEqual(['12345', '67890', '11223']);
    });

    it('strictly preserves leading zeroes', () => {
      const result = extractNumberTokens('00086 04 021 0012');
      expect(result).toEqual(['00086', '04', '021', '0012']);
      expect(result[0]).toBe('00086');
      expect(result[1]).toBe('04');
    });

    it('splits numbers separated by dashes, commas, slashes, or pipes', () => {
      expect(extractNumberTokens('14785 - 92301')).toEqual(['14785', '92301']);
      expect(extractNumberTokens('4821, 6039, 1748, 9532')).toEqual(['4821', '6039', '1748', '9532']);
      expect(extractNumberTokens('8204 | 3195 | 6471')).toEqual(['8204', '3195', '6471']);
    });

    it('preserves duplicate numbers if present in source', () => {
      const result = extractNumberTokens('12345 12345 67890');
      expect(result).toEqual(['12345', '12345', '67890']);
    });
  });

  describe('isNumericString', () => {
    it('returns true for pure digit strings', () => {
      expect(isNumericString('0')).toBe(true);
      expect(isNumericString('04')).toBe(true);
      expect(isNumericString('00086')).toBe(true);
      expect(isNumericString('85429')).toBe(true);
    });

    it('returns false for alphanumeric, negative, or symbol strings', () => {
      expect(isNumericString('12A45')).toBe(false);
      expect(isNumericString('-12345')).toBe(false);
      expect(isNumericString('12.345')).toBe(false);
      expect(isNumericString(' ')).toBe(false);
      expect(isNumericString('')).toBe(false);
    });
  });

  describe('normalizePrizeTokens', () => {
    it('trims and filters empty tokens while keeping exact order', () => {
      const input = [' 12345 ', '', '  67890  ', '00086'];
      expect(normalizePrizeTokens(input)).toEqual(['12345', '67890', '00086']);
    });
  });
});
