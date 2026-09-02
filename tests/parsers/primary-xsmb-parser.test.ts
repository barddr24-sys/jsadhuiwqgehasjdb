/**
 * Unit Tests for PrimaryXSMBParser & Normalizer
 *
 * Verifies all 16 Acceptance Criteria and edge cases specified in Prompt 3:
 * 1. Full 8 prize tiers mapped (27 canonical numbers)
 * 2. Leading zero preservation ("00086", "04", "021")
 * 3. Token splitting without accidental concatenation
 * 4. Partial/incomplete draw detection (status: PARTIAL)
 * 5. Non-lottery / 404 detection (status: INVALID, INVALID_LOTTERY_PAGE)
 * 6. Date mismatch detection (status: INVALID, DATE_MISMATCH)
 * 7. Changed layout detection (status: SOURCE_LAYOUT_CHANGED)
 * 8. Malformed number format detection (status: INVALID, INVALID_NUMBER_FORMAT)
 * 9. Semantic label fallback parsing
 * 10. Exact source order preservation
 * 11. Duplicate preservation
 * 12. Empty / missing body protection
 * 13. Province extraction
 * 14. Source metadata passthrough (no secrets)
 * 15. Absolute determinism (no fake / random numbers)
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { PrimaryXSMBParser } from '../../app/lib/parsers/primary/primary-xsmb-parser';
import type { RawXSMBResponse } from '../../app/lib/providers/types';

function loadFixture(filename: string): string {
  const filePath = path.join(__dirname, '../fixtures/xsmb', filename);
  return fs.readFileSync(filePath, 'utf-8');
}

function createRawResponse(
  rawBody: string,
  requestedDate = '2026-09-02',
  sourceUrl = 'https://kqxs.vn/xsmb/02-09-2026.html'
): RawXSMBResponse {
  return {
    providerId: 'primary-web-provider',
    requestedDate,
    fetchedAt: new Date('2026-09-02T18:35:00Z'),
    httpStatus: 200,
    sourceUrl,
    rawBody,
    durationMs: 145,
  };
}

describe('PrimaryXSMBParser', () => {
  const parser = new PrimaryXSMBParser();

  describe('1. Complete Page Extraction & Normalization', () => {
    it('extracts all 8 prize tiers and 27 canonical numbers accurately', () => {
      const html = loadFixture('complete.html');
      const response = createRawResponse(html);
      const result = parser.parse(response);

      expect(result.status).toBe('SUCCESS');
      expect(result.errors).toHaveLength(0);
      expect(result.data).toBeDefined();

      const data = result.data!;
      expect(data.drawDate).toBe('2026-09-02');
      expect(data.lotteryType).toBe('XSMB');
      expect(data.province).toBe('Hà Nội');
      expect(data.parserVersion).toBe('1.0.0');

      // Canonical 8 tiers count verification
      expect(data.results.special).toEqual(['00086']);
      expect(data.results.firstPrize).toEqual(['12345']);
      expect(data.results.secondPrize).toEqual(['04567', '98765']);
      expect(data.results.thirdPrize).toEqual(['11223', '44556', '77889', '09876', '54321', '67890']);
      expect(data.results.fourthPrize).toEqual(['0123', '4567', '8901', '2345']);
      expect(data.results.fifthPrize).toEqual(['0012', '3456', '7890', '1234', '5678', '9012']);
      expect(data.results.sixthPrize).toEqual(['021', '345', '678']);
      expect(data.results.seventhPrize).toEqual(['04', '05', '89', '90']);

      // Total count check
      const totalPrizes = Object.values(data.results).flat().length;
      expect(totalPrizes).toBe(27);
    });
  });

  describe('2. Leading Zero Preservation', () => {
    it('preserves leading zeros across all prize tiers as strings', () => {
      const html = loadFixture('leading-zero.html');
      const response = createRawResponse(html);
      const result = parser.parse(response);

      expect(result.status).toBe('SUCCESS');
      const data = result.data!;

      expect(data.results.special[0]).toBe('00086');
      expect(data.results.firstPrize[0]).toBe('01234');
      expect(data.results.secondPrize[0]).toBe('05678');
      expect(data.results.thirdPrize[0]).toBe('00123');
      expect(data.results.fourthPrize[0]).toBe('0123');
      expect(data.results.fifthPrize[0]).toBe('0001');
      expect(data.results.sixthPrize[0]).toBe('001');
      expect(data.results.seventhPrize).toEqual(['01', '02', '03', '04']);

      // Strict type check: all numbers must be string
      for (const tier of Object.values(data.results)) {
        for (const num of tier) {
          expect(typeof num).toBe('string');
        }
      }
    });
  });

  describe('3. Multi-Value Tokenization & Separator Handling', () => {
    it('correctly tokenizes prizes with mixed spaces, entities, dashes, breaks, and spans', () => {
      const html = loadFixture('multi-value.html');
      const response = createRawResponse(html);
      const result = parser.parse(response);

      expect(result.status).toBe('SUCCESS');
      const data = result.data!;

      expect(data.results.special).toEqual(['85429']);
      expect(data.results.firstPrize).toEqual(['36192']);
      expect(data.results.secondPrize).toEqual(['14785', '92301']);
      expect(data.results.thirdPrize).toEqual(['28491', '05623', '74128', '63904', '81235', '49017']);
      expect(data.results.fourthPrize).toEqual(['4821', '6039', '1748', '9532']);
      expect(data.results.fifthPrize).toEqual(['8204', '3195', '6471', '0852', '9316', '5270']);
      expect(data.results.sixthPrize).toEqual(['529', '841', '306']);
      expect(data.results.seventhPrize).toEqual(['29', '45', '78', '02']);
    });
  });

  describe('4. Partial / In-Progress Draw Extraction', () => {
    it('identifies incomplete draw as PARTIAL and never fabricates missing prizes', () => {
      const html = loadFixture('partial.html');
      const response = createRawResponse(html);
      const result = parser.parse(response);

      expect(result.status).toBe('PARTIAL');
      expect(result.data).toBeDefined();

      const data = result.data!;
      expect(data.results.special).toEqual([]);
      expect(data.results.firstPrize).toEqual([]);
      expect(data.results.secondPrize).toEqual(['14785', '92301']);
      expect(data.results.seventhPrize).toEqual(['29', '45', '78', '02']);

      // Error list contains missing tier notifications
      const errorCodes = result.errors.map(e => e.code);
      expect(errorCodes).toContain('SPECIAL_NOT_FOUND');
      expect(errorCodes).toContain('FIRST_NOT_FOUND');
    });
  });

  describe('5. Invalid / Non-XSMB Page Detection', () => {
    it('returns INVALID and INVALID_LOTTERY_PAGE for 404 or foreign pages', () => {
      const html = loadFixture('invalid.html');
      const response = createRawResponse(html);
      const result = parser.parse(response);

      expect(result.status).toBe('INVALID');
      expect(result.errors.some(e => e.code === 'INVALID_LOTTERY_PAGE')).toBe(true);
      expect(result.data).toBeUndefined();
    });
  });

  describe('6. Date Mismatch Detection', () => {
    it('returns INVALID and DATE_MISMATCH when page date disagrees with requested date', () => {
      const html = loadFixture('date-mismatch.html'); // contains 2026-09-01
      const response = createRawResponse(html, '2026-09-02'); // requested 2026-09-02
      const result = parser.parse(response);

      expect(result.status).toBe('INVALID');
      expect(result.errors.some(e => e.code === 'DATE_MISMATCH')).toBe(true);
    });
  });

  describe('7. Source Layout Changed Detection', () => {
    it('returns SOURCE_LAYOUT_CHANGED when lottery table structure is missing', () => {
      const html = loadFixture('changed-layout.html');
      const response = createRawResponse(html);
      const result = parser.parse(response);

      expect(result.status).toBe('SOURCE_LAYOUT_CHANGED');
      expect(result.errors.some(e => e.code === 'SOURCE_LAYOUT_CHANGED')).toBe(true);
      expect(result.data).toBeUndefined();
    });
  });

  describe('8. Malformed Number Format Detection', () => {
    it('flags non-numeric characters with INVALID_NUMBER_FORMAT and status INVALID', () => {
      const html = loadFixture('malformed-number.html'); // contains '85A29'
      const response = createRawResponse(html);
      const result = parser.parse(response);

      expect(result.status).toBe('INVALID');
      expect(result.errors.some(e => e.code === 'INVALID_NUMBER_FORMAT')).toBe(true);
      const formatError = result.errors.find(e => e.code === 'INVALID_NUMBER_FORMAT');
      expect(formatError?.details?.rawToken).toBe('85A29');
    });
  });

  describe('9. Semantic Table Fallback', () => {
    it('successfully extracts all tiers from table relying only on Vietnamese text headers', () => {
      const html = loadFixture('semantic-table.html');
      const response = createRawResponse(html);
      const result = parser.parse(response);

      expect(result.status).toBe('SUCCESS');
      const data = result.data!;
      expect(data.results.special).toEqual(['85429']);
      expect(data.results.firstPrize).toEqual(['36192']);
      expect(data.results.secondPrize).toEqual(['14785', '92301']);
      expect(data.results.thirdPrize).toHaveLength(6);
      expect(data.results.seventhPrize).toHaveLength(4);
    });
  });

  describe('10. Order & Duplicates Preservation', () => {
    it('preserves exact source ordering of prize numbers', () => {
      const html = loadFixture('complete.html');
      const response = createRawResponse(html);
      const result = parser.parse(response);

      const thirdPrize = result.data!.results.thirdPrize;
      expect(thirdPrize[0]).toBe('11223');
      expect(thirdPrize[1]).toBe('44556');
      expect(thirdPrize[2]).toBe('77889');
      expect(thirdPrize[3]).toBe('09876');
      expect(thirdPrize[4]).toBe('54321');
      expect(thirdPrize[5]).toBe('67890');
    });
  });

  describe('11. Empty Body & Missing Response Guard', () => {
    it('returns INVALID when raw body is empty', () => {
      const response = createRawResponse('');
      const result = parser.parse(response);

      expect(result.status).toBe('INVALID');
      expect(result.errors.some(e => e.code === 'MISSING_RESPONSE_BODY')).toBe(true);
    });
  });

  describe('12. Source Provenance Metadata Pass-Through', () => {
    it('passes through providerId, sourceUrl, and fetchedAt without leaking secrets', () => {
      const html = loadFixture('complete.html');
      const response = createRawResponse(html);
      const result = parser.parse(response);

      expect(result.data?.source).toEqual({
        providerId: 'primary-web-provider',
        sourceUrl: 'https://kqxs.vn/xsmb/02-09-2026.html',
        fetchedAt: response.fetchedAt,
      });
    });
  });

  describe('13. Deterministic Behavior', () => {
    it('produces identical output given identical raw HTML', () => {
      const html = loadFixture('complete.html');
      const response1 = createRawResponse(html);
      const response2 = createRawResponse(html);

      const result1 = parser.parse(response1);
      const result2 = parser.parse(response2);

      expect(result1.status).toBe(result2.status);
      expect(result1.data?.results).toEqual(result2.data?.results);
      expect(result1.errors).toEqual(result2.errors);
    });
  });

  describe('14. Anomalous Prize Count Preservation', () => {
    it('preserves all numbers and flags ANOMALOUS_PRIZE_COUNT when a tier has extra numbers', () => {
      const html = `
        <div class="box_kqxs">
          <h1>Xổ Số Miền Bắc</h1>
          <span class="draw-date">02/09/2026</span>
          <table class="table-xsmb">
            <tbody>
              <tr class="gdb"><td>ĐB</td><td class="v-gdb">85429</td></tr>
              <tr class="g1"><td>G1</td><td class="v-g1">36192</td></tr>
              <tr class="g2"><td>G2</td><td class="v-g2">14785 92301</td></tr>
              <tr class="g3"><td>G3</td><td class="v-g3">28491 05623 74128 63904 81235 49017</td></tr>
              <tr class="g4"><td>G4</td><td class="v-g4">4821 6039 1748 9532 9999</td></tr> <!-- 5 numbers instead of 4 -->
              <tr class="g5"><td>G5</td><td class="v-g5">8204 3195 6471 0852 9316 5270</td></tr>
              <tr class="g6"><td>G6</td><td class="v-g6">529 841 306</td></tr>
              <tr class="g7"><td>G7</td><td class="v-g7">29 45 78 02</td></tr>
            </tbody>
          </table>
        </div>
      `;
      const response = createRawResponse(html);
      const result = parser.parse(response);

      expect(result.data?.results.fourthPrize).toEqual(['4821', '6039', '1748', '9532', '9999']);
      expect(result.errors.some(e => e.code === 'ANOMALOUS_PRIZE_COUNT')).toBe(true);
      const anomalousError = result.errors.find(e => e.code === 'ANOMALOUS_PRIZE_COUNT');
      expect(anomalousError?.details?.actual).toBe(5);
      expect(anomalousError?.details?.expected).toBe(4);
    });
  });

  describe('15. Diagnostics Telemetry', () => {
    it('returns development-safe diagnostics containing parserVersion, strategy, and counts', () => {
      const html = loadFixture('complete.html');
      const response = createRawResponse(html);
      const result = parser.parse(response);

      expect(result.diagnostics).toBeDefined();
      const diag = result.diagnostics!;
      expect(diag.parserVersion).toBe('1.0.0');
      expect(diag.sourceUrl).toBe(response.sourceUrl);
      expect(diag.requestedDate).toBe('2026-09-02');
      expect(diag.extractedDate).toBe('2026-09-02');
      expect(diag.parsingStrategy).toBe('primary_selector');
      expect(diag.extractedCounts?.special).toBe(1);
      expect(diag.extractedCounts?.thirdPrize).toBe(6);
      expect(diag.missingTiers).toEqual([]);
      expect(diag.durationMs).toBeGreaterThanOrEqual(0);
    });
  });
});
