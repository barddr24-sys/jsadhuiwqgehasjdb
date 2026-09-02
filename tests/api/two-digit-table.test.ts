/**
 * Last Two-Digit Results Table API & Service Unit Tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase, disconnectFromDatabase } from '../../app/lib/db/connection';
import { XSMBDrawModel } from '../../app/lib/db/models/xsmb-draw.model';
import { xsmbDrawRepository } from '../../app/lib/db/repositories/xsmb-draw.repository';
import { DRAW_STATUS, LOTTERY_TYPE } from '../../app/lib/db/config/status-config';
import { getTodayVN, addDays } from '../../app/lib/date-utils';
import { FIXTURE_VALID_RESULTS_1, FIXTURE_VALID_RESULTS_2 } from '../fixtures/draw-fixtures';
import { GET as getTwoDigitTableRoute } from '../../app/api/v1/xsmb/two-digit-table/route';
import { xsmbAPIService } from '../../app/lib/services/xsmb-api.service';

let mongoServer: MongoMemoryServer;

function createNextRequest(urlStr: string): NextRequest {
  return new NextRequest(new URL(urlStr, 'http://localhost:3000'));
}

describe('Last Two-Digit Results Table (/api/v1/xsmb/two-digit-table)', () => {
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
  });

  it('should return all 100 numbers (00-99) with 0 counts when DB is empty', async () => {
    const req = createNextRequest('/api/v1/xsmb/two-digit-table?range=today');
    const res = await getTwoDigitTableRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.data.range).toBe('today');
    expect(json.data.numbers).toHaveLength(100);
    expect(json.data.numbers[0].number).toBe('00');
    expect(json.data.numbers[99].number).toBe('99');
    expect(json.data.totalOccurrences).toBe(0);
  });

  it('should compute exact counts, prizes, and appearances for 7 days', async () => {
    const today = getTodayVN();
    const yesterday = addDays(today, -1);

    await xsmbDrawRepository.create({
      drawDate: today,
      lotteryType: LOTTERY_TYPE.XSMB,
      status: DRAW_STATUS.READY,
      results: FIXTURE_VALID_RESULTS_1,
    });

    await xsmbDrawRepository.create({
      drawDate: yesterday,
      lotteryType: LOTTERY_TYPE.XSMB,
      status: DRAW_STATUS.READY,
      results: FIXTURE_VALID_RESULTS_2,
    });

    const req = createNextRequest('/api/v1/xsmb/two-digit-table?range=7days');
    const res = await getTwoDigitTableRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.range).toBe('7days');
    expect(json.data.drawCount).toBe(2);
    expect(json.data.totalOccurrences).toBe(54); // 27 prizes * 2 draws
    expect(json.data.numbers).toHaveLength(100);

    // Verify special prize tail in fixture 1
    const spTail1 = FIXTURE_VALID_RESULTS_1.special[0].slice(-2);
    const item1 = json.data.numbers.find((n: { number: string }) => n.number === spTail1);
    expect(item1).toBeDefined();
    expect(item1.count).toBeGreaterThanOrEqual(1);
    expect(item1.lastAppearance).toBe(today);
  });

  it('should validate invalid range parameter gracefully', async () => {
    const req = createNextRequest('/api/v1/xsmb/two-digit-table?range=invalid_range');
    const res = await getTwoDigitTableRoute(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBeDefined();
    expect(json.error.code).toBe('INVALID_RANGE_PARAM');
  });

  it('should correctly group 2-digit numbers by heads 0-4 and 5-9 in ascending order', async () => {
    const today = getTodayVN();

    await xsmbDrawRepository.create({
      drawDate: today,
      lotteryType: LOTTERY_TYPE.XSMB,
      status: DRAW_STATUS.READY,
      results: FIXTURE_VALID_RESULTS_1,
    });

    const data = await xsmbAPIService.getTwoDigitTable('today');
    expect(data.numbers).toHaveLength(100);

    // Filter by head 0
    const head0Numbers = data.numbers
      .filter((n) => n.number.startsWith('0') && n.count > 0)
      .map((n) => n.number);

    // Verify ascending order
    for (let i = 1; i < head0Numbers.length; i++) {
      expect(Number(head0Numbers[i])).toBeGreaterThan(Number(head0Numbers[i - 1]));
    }

    // Filter by head 9
    const head9Numbers = data.numbers
      .filter((n) => n.number.startsWith('9') && n.count > 0)
      .map((n) => n.number);

    for (let i = 1; i < head9Numbers.length; i++) {
      expect(Number(head9Numbers[i])).toBeGreaterThan(Number(head9Numbers[i - 1]));
    }
  });
});

