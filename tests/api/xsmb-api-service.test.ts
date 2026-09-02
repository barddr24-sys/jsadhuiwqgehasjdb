/**
 * XSMB Application Service Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase, disconnectFromDatabase } from '../../app/lib/db/connection';
import { XSMBDrawModel } from '../../app/lib/db/models/xsmb-draw.model';
import { xsmbDrawRepository } from '../../app/lib/db/repositories/xsmb-draw.repository';
import { XSMBAPIService } from '../../app/lib/services/xsmb-api.service';
import { DRAW_STATUS, LOTTERY_TYPE } from '../../app/lib/db/config/status-config';
import { XSMBAPIError } from '../../app/lib/api/api-response';
import { getTodayVN, addDays } from '../../app/lib/date-utils';
import {
  FIXTURE_VALID_RESULTS_1,
  FIXTURE_VALID_RESULTS_2,
  FIXTURE_PARTIAL_RESULTS,
} from '../fixtures/draw-fixtures';
import type { IXSMBDrawResults } from '../../app/lib/db/types/db-types';

let mongoServer: MongoMemoryServer;
let service: XSMBAPIService;

describe('XSMBAPIService Integration Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await connectToDatabase({ uri });
    await XSMBDrawModel.init();
  }, 60000);

  afterAll(async () => {
    await disconnectFromDatabase();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await XSMBDrawModel.deleteMany({});
    service = new XSMBAPIService(xsmbDrawRepository);
  });

  describe('1. Today Endpoint Logic (getTodayDraw)', () => {
    it('should return today draw when it exists in MongoDB', async () => {
      const today = getTodayVN();
      await xsmbDrawRepository.create({
        drawDate: today,
        lotteryType: LOTTERY_TYPE.XSMB,
        status: DRAW_STATUS.READY,
        results: FIXTURE_VALID_RESULTS_1,
      });

      const res = await service.getTodayDraw();
      expect(res.date).toBe(today);
      expect(res.status).toBe(DRAW_STATUS.READY);
      expect(res.isComplete).toBe(true);
      expect(res.results.special[0]).toBe('00086'); // Preserves leading zero
      expect(res.isStale).toBe(false);
    });

    it('should fallback to latest available draw if today draw is not in MongoDB yet', async () => {
      const pastDate = addDays(getTodayVN(), -1);
      await xsmbDrawRepository.create({
        drawDate: pastDate,
        status: DRAW_STATUS.READY,
        results: FIXTURE_VALID_RESULTS_2,
      });

      const res = await service.getTodayDraw();
      expect(res.date).toBe(pastDate);
      expect(res.status).toBe(DRAW_STATUS.READY);
      expect(res.results.special[0]).toBe('85429');
    });

    it('should throw 404 when MongoDB has no draws at all', async () => {
      await expect(service.getTodayDraw()).rejects.toThrow(XSMBAPIError);
      try {
        await service.getTodayDraw();
      } catch (err: unknown) {
        const error = err as XSMBAPIError;
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('XSMB_RESULT_NOT_FOUND');
      }
    });
  });

  describe('2. Result by Date (getDrawByDate)', () => {
    it('should return full draw data for a valid date', async () => {
      await xsmbDrawRepository.create({
        drawDate: '2026-09-02',
        status: DRAW_STATUS.READY,
        results: FIXTURE_VALID_RESULTS_1,
      });

      const res = await service.getDrawByDate('2026-09-02');
      expect(res.date).toBe('2026-09-02');
      expect(res.status).toBe('READY');
      expect(res.isComplete).toBe(true);
      expect(res.results.seventhPrize).toEqual(['04', '05', '89', '90']);
    });

    it('should return partial results and isComplete=false for PARTIAL status', async () => {
      await xsmbDrawRepository.create({
        drawDate: '2026-09-02',
        status: DRAW_STATUS.PARTIAL,
        results: FIXTURE_PARTIAL_RESULTS as IXSMBDrawResults,
      });

      const res = await service.getDrawByDate('2026-09-02');
      expect(res.status).toBe('PARTIAL');
      expect(res.isComplete).toBe(false);
      expect(res.results.special).toEqual([]);
      expect(res.results.seventhPrize).toEqual(['29', '45', '78', '02']);
    });

    it('should return conflict status and isComplete=false for CONFLICT status', async () => {
      await xsmbDrawRepository.create({
        drawDate: '2026-09-02',
        status: DRAW_STATUS.CONFLICT,
        results: FIXTURE_PARTIAL_RESULTS as IXSMBDrawResults,
      });

      const res = await service.getDrawByDate('2026-09-02');
      expect(res.status).toBe('CONFLICT');
      expect(res.isComplete).toBe(false);
    });

    it('should throw 404 when date does not exist', async () => {
      await expect(service.getDrawByDate('2026-01-01')).rejects.toThrow(XSMBAPIError);
      try {
        await service.getDrawByDate('2026-01-01');
      } catch (err: unknown) {
        const error = err as XSMBAPIError;
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('XSMB_RESULT_NOT_FOUND');
      }
    });

    it('should throw 400 for invalid date format or calendar date', async () => {
      await expect(service.getDrawByDate('invalid-date')).rejects.toThrow(XSMBAPIError);
      await expect(service.getDrawByDate('2026-02-30')).rejects.toThrow(XSMBAPIError);
      try {
        await service.getDrawByDate('02/09/2026');
      } catch (err: unknown) {
        const error = err as XSMBAPIError;
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('INVALID_DATE');
      }
    });
  });

  describe('3. Historical Draws Pagination (getHistory)', () => {
    beforeEach(async () => {
      // Seed 15 READY draws
      for (let i = 1; i <= 15; i++) {
        const dayStr = String(i).padStart(2, '0');
        await xsmbDrawRepository.create({
          drawDate: `2026-08-${dayStr}`,
          status: DRAW_STATUS.READY,
          results: FIXTURE_VALID_RESULTS_1,
        });
      }
    });

    it('should paginate historical records in descending date order', async () => {
      const page1 = await service.getHistory('1', '5');
      expect(page1.items).toHaveLength(5);
      expect(page1.pagination.total).toBe(15);
      expect(page1.pagination.totalPages).toBe(3);
      expect(page1.pagination.hasNextPage).toBe(true);
      expect(page1.pagination.hasPrevPage).toBe(false);
      expect(page1.items[0].date).toBe('2026-08-15');
      expect(page1.items[4].date).toBe('2026-08-11');

      const page2 = await service.getHistory('2', '5');
      expect(page2.items).toHaveLength(5);
      expect(page2.pagination.page).toBe(2);
      expect(page2.pagination.hasNextPage).toBe(true);
      expect(page2.pagination.hasPrevPage).toBe(true);
      expect(page2.items[0].date).toBe('2026-08-10');

      const page3 = await service.getHistory('3', '5');
      expect(page3.items).toHaveLength(5);
      expect(page3.pagination.hasNextPage).toBe(false);
      expect(page3.items[4].date).toBe('2026-08-01');
    });

    it('should reject invalid pagination parameters with 400', async () => {
      await expect(service.getHistory('0', '10')).rejects.toThrow(XSMBAPIError);
      await expect(service.getHistory('-1', '10')).rejects.toThrow(XSMBAPIError);
      await expect(service.getHistory('1', '150')).rejects.toThrow(XSMBAPIError);
      await expect(service.getHistory('abc', '10')).rejects.toThrow(XSMBAPIError);
    });
  });

  describe('4. Statistics Engine (getStatistics)', () => {
    beforeEach(async () => {
      // Seed 7 verified draws
      for (let i = 1; i <= 7; i++) {
        const dayStr = String(i).padStart(2, '0');
        await xsmbDrawRepository.create({
          drawDate: `2026-09-${dayStr}`,
          status: DRAW_STATUS.READY,
          results: i % 2 === 0 ? FIXTURE_VALID_RESULTS_2 : FIXTURE_VALID_RESULTS_1,
        });
      }
    });

    it('should compute exact 7-day statistics from 7 completed draws', async () => {
      const stats = await service.getStatistics('7');

      expect(stats.period).toBe(7);
      expect(stats.drawCount).toBe(7);
      expect(stats.isSufficient).toBe(true);
      expect(stats.totalOccurrences).toBe(7 * 27); // Exactly 189 numbers
      expect(stats.numbers).toHaveLength(100);
      expect(stats.heads).toHaveLength(10);
      expect(stats.tails).toHaveLength(10);

      // Verify strings preserve leading zero
      expect(stats.numbers.some((n) => n.number === '00')).toBe(true);
      expect(stats.numbers.some((n) => n.number === '04')).toBe(true);
      expect(stats.topNumbers[0].number).toBeDefined();

      // Verify sum of heads and tails equals total occurrences
      const sumHeads = stats.heads.reduce((acc, h) => acc + h.count, 0);
      const sumTails = stats.tails.reduce((acc, t) => acc + t.count, 0);
      expect(sumHeads).toBe(stats.totalOccurrences);
      expect(sumTails).toBe(stats.totalOccurrences);
    });

    it('should compute 3-day statistics when days=3', async () => {
      const stats = await service.getStatistics('3');

      expect(stats.period).toBe(3);
      expect(stats.drawCount).toBe(3);
      expect(stats.isSufficient).toBe(true);
      expect(stats.totalOccurrences).toBe(3 * 27); // 81 numbers
    });

    it('should handle insufficient draws without fabricating data', async () => {
      await XSMBDrawModel.deleteMany({});
      // Seed only 2 draws
      await xsmbDrawRepository.create({
        drawDate: '2026-09-01',
        status: DRAW_STATUS.READY,
        results: FIXTURE_VALID_RESULTS_1,
      });
      await xsmbDrawRepository.create({
        drawDate: '2026-09-02',
        status: DRAW_STATUS.READY,
        results: FIXTURE_VALID_RESULTS_2,
      });

      const stats = await service.getStatistics('7');
      expect(stats.period).toBe(7);
      expect(stats.drawCount).toBe(2);
      expect(stats.isSufficient).toBe(false);
      expect(stats.totalOccurrences).toBe(2 * 27); // 54
    });

    it('should reject invalid days values with 400', async () => {
      await expect(service.getStatistics('-5')).rejects.toThrow(XSMBAPIError);
      await expect(service.getStatistics('0')).rejects.toThrow(XSMBAPIError);
      await expect(service.getStatistics('abc')).rejects.toThrow(XSMBAPIError);
      await expect(service.getStatistics('9999')).rejects.toThrow(XSMBAPIError);
    });
  });

  describe('5. Number Detail & Multi-Prize Matching (getNumberDetail)', () => {
    beforeEach(async () => {
      // Create draw where "29" appears in Special ("85429") and Seventh ("29")
      await xsmbDrawRepository.create({
        drawDate: '2026-09-02',
        status: DRAW_STATUS.READY,
        results: FIXTURE_VALID_RESULTS_2,
      });

      // Create draw where "86" appears in Special ("00086")
      await xsmbDrawRepository.create({
        drawDate: '2026-09-01',
        status: DRAW_STATUS.READY,
        results: FIXTURE_VALID_RESULTS_1,
      });
    });

    it('should match multiple prize occurrences on the same date and list prize tiers without deduplication', async () => {
      const detail = await service.getNumberDetail('29', '7');

      expect(detail.number).toBe('29');
      expect(detail.drawCount).toBe(2);

      // On 2026-09-02, 29 appears in SPECIAL (85429), SIXTH (529), and SEVENTH (29)
      const day1 = detail.dailyHistory.find((d) => d.date === '2026-09-02');
      expect(day1).toBeDefined();
      expect(day1?.count).toBe(3);
      expect(day1?.prizes).toEqual(['SPECIAL', 'SIXTH', 'SEVENTH']);

      // On 2026-09-01, 29 does not appear
      const day2 = detail.dailyHistory.find((d) => d.date === '2026-09-01');
      expect(day2?.count).toBe(0);
      expect(day2?.prizes).toEqual([]);

      expect(detail.totalOccurrences).toBe(3);
      expect(detail.activeDays).toBe(1);
      expect(detail.latestAppearance).toBe('2026-09-02');
    });

    it('should normalize single-digit inputs (e.g., "4" -> "04")', async () => {
      const detail = await service.getNumberDetail('4', '7');
      expect(detail.number).toBe('04');

      // On 2026-09-01 (FIXTURE_VALID_RESULTS_1), "04" appears in 7th prize ("04")
      const day = detail.dailyHistory.find((d) => d.date === '2026-09-01');
      expect(day?.count).toBe(1);
      expect(day?.prizes).toContain('SEVENTH');
    });

    it('should reject invalid numbers with 400', async () => {
      await expect(service.getNumberDetail('123')).rejects.toThrow(XSMBAPIError);
      await expect(service.getNumberDetail('abc')).rejects.toThrow(XSMBAPIError);
      await expect(service.getNumberDetail('12.3')).rejects.toThrow(XSMBAPIError);
      await expect(service.getNumberDetail('-5')).rejects.toThrow(XSMBAPIError);
    });
  });

  describe('6. Draw Status & Progress (getStatus)', () => {
    it('should return READY and 100% progress for a completed draw', async () => {
      const today = getTodayVN();
      await xsmbDrawRepository.create({
        drawDate: today,
        status: DRAW_STATUS.READY,
        results: FIXTURE_VALID_RESULTS_1,
      });

      const status = await service.getStatus();
      expect(status.date).toBe(today);
      expect(status.status).toBe('READY');
      expect(status.progress).toBe(100);
      expect(status.availableTiers).toHaveLength(8);
      expect(status.isStale).toBe(false);
    });

    it('should return PARTIAL with accurate progress percentage and available tiers', async () => {
      const today = getTodayVN();
      await xsmbDrawRepository.create({
        drawDate: today,
        status: DRAW_STATUS.PARTIAL,
        results: FIXTURE_PARTIAL_RESULTS as IXSMBDrawResults,
      });

      const status = await service.getStatus();
      expect(status.status).toBe('PARTIAL');
      expect(status.progress).toBeGreaterThan(0);
      expect(status.progress).toBeLessThan(100);
      expect(status.availableTiers).toContain('SEVENTH');
      expect(status.availableTiers).toContain('SIXTH');
      expect(status.availableTiers).not.toContain('SPECIAL');
    });

    it('should return SCHEDULED with 0% progress when no prizes are drawn', async () => {
      const today = getTodayVN();
      await xsmbDrawRepository.create({
        drawDate: today,
        status: DRAW_STATUS.SCHEDULED,
        results: {
          special: [],
          firstPrize: [],
          secondPrize: [],
          thirdPrize: [],
          fourthPrize: [],
          fifthPrize: [],
          sixthPrize: [],
          seventhPrize: [],
        },
      });

      const status = await service.getStatus();
      expect(status.status).toBe('SCHEDULED');
      expect(status.progress).toBe(0);
      expect(status.availableTiers).toEqual([]);
    });
  });

  describe('7. Health Endpoint (getHealth)', () => {
    it('should return UP and total draw count', async () => {
      await xsmbDrawRepository.create({
        drawDate: '2026-09-02',
        status: DRAW_STATUS.READY,
        results: FIXTURE_VALID_RESULTS_1,
      });

      const health = await service.getHealth();
      expect(health.status).toBe('UP');
      expect(health.database).toBe('CONNECTED');
      expect(health.totalDraws).toBe(1);
    });
  });
});
