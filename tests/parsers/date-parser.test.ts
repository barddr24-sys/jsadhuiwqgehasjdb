/**
 * Unit Tests for Date Extraction & Normalization
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeDateToISO,
  extractDateFromText,
} from '../../app/lib/parsers/date-parser';

describe('Date Parser & Normalizer', () => {
  describe('normalizeDateToISO', () => {
    it('normalizes DD/MM/YYYY format to YYYY-MM-DD', () => {
      expect(normalizeDateToISO('02/09/2026')).toBe('2026-09-02');
      expect(normalizeDateToISO('31/12/2025')).toBe('2025-12-31');
      expect(normalizeDateToISO('01/01/2026')).toBe('2026-01-01');
    });

    it('normalizes DD-MM-YYYY format to YYYY-MM-DD', () => {
      expect(normalizeDateToISO('02-09-2026')).toBe('2026-09-02');
      expect(normalizeDateToISO('15-08-2026')).toBe('2026-08-15');
    });

    it('normalizes DD.MM.YYYY format to YYYY-MM-DD', () => {
      expect(normalizeDateToISO('02.09.2026')).toBe('2026-09-02');
    });

    it('preserves valid YYYY-MM-DD format', () => {
      expect(normalizeDateToISO('2026-09-02')).toBe('2026-09-02');
    });

    it('rejects invalid calendar dates (e.g. February 30th)', () => {
      expect(normalizeDateToISO('30/02/2026')).toBeNull();
      expect(normalizeDateToISO('31/04/2026')).toBeNull();
      expect(normalizeDateToISO('invalid-date')).toBeNull();
    });
  });

  describe('extractDateFromText', () => {
    it('extracts date from Vietnamese phrase "ngày 02/09/2026"', () => {
      const text = 'Kết quả xổ số Miền Bắc ngày 02/09/2026 - XSMB';
      expect(extractDateFromText(text)).toBe('2026-09-02');
    });

    it('extracts date from "kỳ quay ngày 02-09-2026"', () => {
      const text = 'Kỳ quay ngày 02-09-2026 trực tiếp lúc 18h15';
      expect(extractDateFromText(text)).toBe('2026-09-02');
    });

    it('extracts date from title string with day of week', () => {
      const text = 'XSMB Thứ Tư, 02/09/2026';
      expect(extractDateFromText(text)).toBe('2026-09-02');
    });

    it('returns null if no valid date is present in text', () => {
      expect(extractDateFromText('Không có thông tin ngày quay')).toBeNull();
      expect(extractDateFromText('')).toBeNull();
    });
  });
});
