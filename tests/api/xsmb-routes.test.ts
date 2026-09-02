/**
 * XSMB REST API Route Handlers Tests
 *
 * Tests all endpoints under /api/v1/xsmb:
 * - GET /api/v1/xsmb/today
 * - GET /api/v1/xsmb/results/:date
 * - GET /api/v1/xsmb/history
 * - GET /api/v1/xsmb/statistics
 * - GET /api/v1/xsmb/number/:number
 * - GET /api/v1/xsmb/status
 * - GET /api/v1/xsmb/health
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase, disconnectFromDatabase } from '../../app/lib/db/connection';
import { XSMBDrawModel } from '../../app/lib/db/models/xsmb-draw.model';
import { xsmbDrawRepository } from '../../app/lib/db/repositories/xsmb-draw.repository';
import { DRAW_STATUS, LOTTERY_TYPE } from '../../app/lib/db/config/status-config';
import { getTodayVN } from '../../app/lib/date-utils';
import {
  FIXTURE_VALID_RESULTS_1,
  FIXTURE_VALID_RESULTS_2,
  FIXTURE_PARTIAL_RESULTS,
} from '../fixtures/draw-fixtures';

// Import Route Handlers
import { GET as getTodayRoute } from '../../app/api/v1/xsmb/today/route';
import { GET as getResultByDateRoute } from '../../app/api/v1/xsmb/results/[date]/route';
import { GET as getHistoryRoute } from '../../app/api/v1/xsmb/history/route';
import { GET as getStatisticsRoute } from '../../app/api/v1/xsmb/statistics/route';
import { GET as getNumberRoute } from '../../app/api/v1/xsmb/number/[number]/route';
import { GET as getStatusRoute } from '../../app/api/v1/xsmb/status/route';
import { GET as getHealthRoute } from '../../app/api/v1/xsmb/health/route';
import type { IXSMBDrawResults } from '../../app/lib/db/types/db-types';
import { clearXSMBCache } from '../../app/lib/services/xsmb-api.service';

let mongoServer: MongoMemoryServer;

function createNextRequest(urlStr: string): NextRequest {
  return new NextRequest(new URL(urlStr, 'http://localhost:3000'));
}

describe('XSMB REST API Route Handlers (/api/v1/xsmb)', () => {
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
    clearXSMBCache(); // clear L1 cache between tests to prevent pollution
  });

  describe('GET /api/v1/xsmb/today', () => {
    it('should return 200 and today draw payload with standard envelope', async () => {
      const today = getTodayVN();
      await xsmbDrawRepository.create({
        drawDate: today,
        lotteryType: LOTTERY_TYPE.XSMB,
        status: DRAW_STATUS.READY,
        results: FIXTURE_VALID_RESULTS_1,
      });

      const req = createNextRequest('/api/v1/xsmb/today');
      const res = await getTodayRoute(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data).toBeDefined();
      expect(body.data.date).toBe(today);
      expect(body.data.status).toBe('READY');
      expect(body.data.isComplete).toBe(true);
      expect(body.data.results.special[0]).toBe('00086');
      expect(res.headers.get('content-type')).toContain('application/json');
    });

    it('should return 200 for today endpoint even when not in DB initially', async () => {
      const today = getTodayVN();
      const req = createNextRequest('/api/v1/xsmb/today');
      const res = await getTodayRoute(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data).toBeDefined();
      expect(body.data.date).toBe(today);
    });
  });

  describe('GET /api/v1/xsmb/results/:date', () => {
    it('should return 200 and normalized draw for valid date', async () => {
      await xsmbDrawRepository.create({
        drawDate: '2026-09-02',
        status: DRAW_STATUS.READY,
        results: FIXTURE_VALID_RESULTS_1,
      });

      const req = createNextRequest('/api/v1/xsmb/results/2026-09-02');
      const res = await getResultByDateRoute(req, {
        params: Promise.resolve({ date: '2026-09-02' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.date).toBe('2026-09-02');
      expect(body.data.isComplete).toBe(true);
    });

    it('should return 400 for invalid date formats', async () => {
      const req = createNextRequest('/api/v1/xsmb/results/invalid-date');
      const res = await getResultByDateRoute(req, {
        params: Promise.resolve({ date: 'invalid-date' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error.code).toBe('INVALID_DATE');
    });

    it('should return 404 when valid date is not found in database', async () => {
      const req = createNextRequest('/api/v1/xsmb/results/2026-01-01');
      const res = await getResultByDateRoute(req, {
        params: Promise.resolve({ date: '2026-01-01' }),
      });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error.code).toBe('XSMB_RESULT_NOT_FOUND');
    });

    it('should return PARTIAL status and isComplete=false for partial draw', async () => {
      await xsmbDrawRepository.create({
        drawDate: '2026-09-02',
        status: DRAW_STATUS.PARTIAL,
        results: FIXTURE_PARTIAL_RESULTS as IXSMBDrawResults,
      });

      const req = createNextRequest('/api/v1/xsmb/results/2026-09-02');
      const res = await getResultByDateRoute(req, {
        params: Promise.resolve({ date: '2026-09-02' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.status).toBe('PARTIAL');
      expect(body.data.isComplete).toBe(false);
    });
  });

  describe('GET /api/v1/xsmb/history', () => {
    beforeEach(async () => {
      for (let i = 1; i <= 25; i++) {
        const d = String(i).padStart(2, '0');
        await xsmbDrawRepository.create({
          drawDate: `2026-08-${d}`,
          status: DRAW_STATUS.READY,
          results: FIXTURE_VALID_RESULTS_1,
        });
      }
    });

    it('should return 200 with paginated data and pagination envelope', async () => {
      const req = createNextRequest('/api/v1/xsmb/history?page=2&pageSize=10');
      const res = await getHistoryRoute(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data).toHaveLength(10);
      expect(body.pagination).toBeDefined();
      expect(body.pagination.page).toBe(2);
      expect(body.pagination.pageSize).toBe(10);
      expect(body.pagination.total).toBe(25);
      expect(body.pagination.totalPages).toBe(3);
      expect(body.pagination.hasNextPage).toBe(true);
      expect(body.pagination.hasPrevPage).toBe(true);
    });

    it('should return 400 for invalid page or pageSize', async () => {
      const req1 = createNextRequest('/api/v1/xsmb/history?page=-1');
      const res1 = await getHistoryRoute(req1);
      expect(res1.status).toBe(400);

      const req2 = createNextRequest('/api/v1/xsmb/history?pageSize=200');
      const res2 = await getHistoryRoute(req2);
      expect(res2.status).toBe(400);
    });
  });

  describe('GET /api/v1/xsmb/statistics', () => {
    beforeEach(async () => {
      for (let i = 1; i <= 7; i++) {
        const d = String(i).padStart(2, '0');
        await xsmbDrawRepository.create({
          drawDate: `2026-09-${d}`,
          status: DRAW_STATUS.READY,
          results: FIXTURE_VALID_RESULTS_1,
        });
      }
    });

    it('should return 200 for days=3 and days=7', async () => {
      const req3 = createNextRequest('/api/v1/xsmb/statistics?days=3');
      const res3 = await getStatisticsRoute(req3);
      const body3 = await res3.json();

      expect(res3.status).toBe(200);
      expect(body3.data.period).toBe(3);
      expect(body3.data.drawCount).toBe(3);
      expect(body3.data.isSufficient).toBe(true);

      const req7 = createNextRequest('/api/v1/xsmb/statistics?days=7');
      const res7 = await getStatisticsRoute(req7);
      const body7 = await res7.json();

      expect(res7.status).toBe(200);
      expect(body7.data.period).toBe(7);
      expect(body7.data.drawCount).toBe(7);
    });

    it('should default to days=7 when days parameter is omitted', async () => {
      const req = createNextRequest('/api/v1/xsmb/statistics');
      const res = await getStatisticsRoute(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.period).toBe(7);
    });

    it('should return 400 for invalid days periods (e.g. days=abc or negative)', async () => {
      const req = createNextRequest('/api/v1/xsmb/statistics?days=abc');
      const res = await getStatisticsRoute(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error.code).toBe('INVALID_STATISTICS_PERIOD');
    });
  });

  describe('GET /api/v1/xsmb/number/:number', () => {
    beforeEach(async () => {
      await xsmbDrawRepository.create({
        drawDate: '2026-09-02',
        status: DRAW_STATUS.READY,
        results: FIXTURE_VALID_RESULTS_2, // has "29" in special, sixth, seventh
      });
    });

    it('should return 200 and matching details for a 2-digit number', async () => {
      const req = createNextRequest('/api/v1/xsmb/number/29?days=7');
      const res = await getNumberRoute(req, {
        params: Promise.resolve({ number: '29' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.number).toBe('29');
      expect(body.data.totalOccurrences).toBe(3);
      expect(body.data.activeDays).toBe(1);
      expect(body.data.dailyHistory[0].prizes).toContain('SPECIAL');
    });

    it('should normalize single-digit route input (e.g. /number/3 -> "03")', async () => {
      const req = createNextRequest('/api/v1/xsmb/number/3?days=7');
      const res = await getNumberRoute(req, {
        params: Promise.resolve({ number: '3' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.number).toBe('03');
    });

    it('should return 400 for invalid number parameter (/number/abc or /number/123)', async () => {
      const req1 = createNextRequest('/api/v1/xsmb/number/abc');
      const res1 = await getNumberRoute(req1, {
        params: Promise.resolve({ number: 'abc' }),
      });
      expect(res1.status).toBe(400);

      const req2 = createNextRequest('/api/v1/xsmb/number/123');
      const res2 = await getNumberRoute(req2, {
        params: Promise.resolve({ number: '123' }),
      });
      expect(res2.status).toBe(400);
    });
  });

  describe('GET /api/v1/xsmb/status', () => {
    it('should return 200 with draw progress and available tiers', async () => {
      const today = getTodayVN();
      await xsmbDrawRepository.create({
        drawDate: today,
        status: DRAW_STATUS.READY,
        results: FIXTURE_VALID_RESULTS_1,
      });

      const req = createNextRequest('/api/v1/xsmb/status');
      const res = await getStatusRoute(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.status).toBe('READY');
      expect(body.data.progress).toBe(100);
      expect(body.data.availableTiers).toHaveLength(8);
      expect(body.data.isStale).toBe(false);
    });
  });

  describe('GET /api/v1/xsmb/health', () => {
    it('should return 200 with UP status', async () => {
      const req = createNextRequest('/api/v1/xsmb/health');
      const res = await getHealthRoute(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.status).toBe('UP');
      expect(body.data.database).toBe('CONNECTED');
    });
  });

  describe('GET /api/v1/xsmb/diagnostic', () => {
    it('should return 200 with diagnostic status and timezone metadata', async () => {
      const { GET: getDiagnosticRoute } = await import('../../app/api/v1/xsmb/diagnostic/route');
      const req = createNextRequest('/api/v1/xsmb/diagnostic');
      const res = await getDiagnosticRoute(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.vietnamDate).toBeDefined();
      expect(body.data.database.connected).toBe(true);
      expect(body.data.drawSchedule.startTime).toBe('18:15');
    });
  });
});
