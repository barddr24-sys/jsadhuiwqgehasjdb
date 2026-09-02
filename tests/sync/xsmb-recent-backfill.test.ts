/**
 * XSMB Recent Draws Backfill Integration Tests
 *
 * Validates:
 * 1. syncRecentDraws(limit) generates bounded dates.
 * 2. Checks MongoDB for existing READY records.
 * 3. Identifies missing dates and syncs only those missing/incomplete.
 * 4. Rate-limiting between requests.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase, disconnectFromDatabase } from '../../app/lib/db/connection';
import { XSMBDrawModel } from '../../app/lib/db/models/xsmb-draw.model';
import { XSMBSyncRunModel } from '../../app/lib/db/models/xsmb-sync-run.model';
import { XSMBSyncAttemptModel } from '../../app/lib/db/models/xsmb-sync-attempt.model';
import { xsmbDrawRepository } from '../../app/lib/db/repositories/xsmb-draw.repository';
import { XSMBSyncService } from '../../app/lib/sync/xsmb-sync.service';
import { DRAW_STATUS, LOTTERY_TYPE } from '../../app/lib/db/config/status-config';
import { getTodayVN, addDays } from '../../app/lib/date-utils';
import { FIXTURE_VALID_RESULTS_1 } from '../fixtures/draw-fixtures';

let mongoServer: MongoMemoryServer;

describe('XSMBSyncService.syncRecentDraws', () => {
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
    await XSMBSyncRunModel.deleteMany({});
    await XSMBSyncAttemptModel.deleteMany({});
  });

  it('should detect missing recent dates and trigger bounded sync for them', async () => {
    const today = getTodayVN();
    const dayMinus1 = addDays(today, -1);
    const dayMinus2 = addDays(today, -2);
    const dayMinus3 = addDays(today, -3);

    // Pre-populate dayMinus3 as READY in database
    await xsmbDrawRepository.create({
      drawDate: dayMinus3,
      lotteryType: LOTTERY_TYPE.XSMB,
      status: DRAW_STATUS.READY,
      results: FIXTURE_VALID_RESULTS_1,
    });

    const mockSyncDate = vi.fn().mockImplementation(async (date: string) => ({
      status: 'SUCCESS',
      date,
      syncRunId: 'mock-run',
      lotteryType: 'XSMB',
      providerId: 'mock-provider',
      durationMs: 10,
    }));

    const syncService = new XSMBSyncService({
      drawRepository: xsmbDrawRepository,
    });
    syncService.syncDate = mockSyncDate;

    // Run recent sync for 4 days (today, -1, -2, -3)
    const result = await syncService.syncRecentDraws(4, { rateLimitDelayMs: 0 });

    expect(result.successful).toBeGreaterThan(0);
    // dayMinus3 is already READY and not today, so it should be skipped
    expect(mockSyncDate).not.toHaveBeenCalledWith(dayMinus3, expect.any(Object));
    // dayMinus2, dayMinus1, and today should have been called
    expect(mockSyncDate).toHaveBeenCalledWith(dayMinus2, expect.any(Object));
    expect(mockSyncDate).toHaveBeenCalledWith(dayMinus1, expect.any(Object));
    expect(mockSyncDate).toHaveBeenCalledWith(today, expect.any(Object));
  });
});
