import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase, disconnectFromDatabase } from '../../app/lib/db/connection';
import { XSMBDrawModel } from '../../app/lib/db/models/xsmb-draw.model';
import { XSMBSourceModel } from '../../app/lib/db/models/xsmb-source.model';
import { XSMBSyncRunModel } from '../../app/lib/db/models/xsmb-sync-run.model';
import { XSMBSyncAttemptModel } from '../../app/lib/db/models/xsmb-sync-attempt.model';
import { xsmbDrawRepository } from '../../app/lib/db/repositories/xsmb-draw.repository';
import { xsmbSyncRunRepository } from '../../app/lib/db/repositories/xsmb-sync-run.repository';
import { xsmbSyncAttemptRepository } from '../../app/lib/db/repositories/xsmb-sync-attempt.repository';
import { XSMBSyncService } from '../../app/lib/sync/xsmb-sync.service';
import { DRAW_STATUS, SYNC_RUN_STATUS, VALIDATION_STATUS } from '../../app/lib/db/config/status-config';
import type { IXSMBDrawResults } from '../../app/lib/db/types/db-types';
import type { XSMBProvider } from '../../app/lib/providers/xsmb-provider.interface';
import type { RawXSMBResponse, ProviderHealth } from '../../app/lib/providers/types';
import type { XSMBParser, ParseResult, NormalizedXSMBResult } from '../../app/lib/parsers/types';
import { XSMBProviderError } from '../../app/lib/providers/provider-errors';
import {
  FIXTURE_VALID_RESULTS_1,
  FIXTURE_VALID_RESULTS_2,
  FIXTURE_PARTIAL_RESULTS,
} from '../fixtures/draw-fixtures';

let mongoServer: MongoMemoryServer;

// ─── Test Helpers & Mocks ───────────────────────────────────────────────────

function createMockRawResponse(
  date: string,
  body: string = '<html><body>Test XSMB HTML</body></html>',
  httpStatus: number = 200
): RawXSMBResponse {
  return {
    providerId: 'mock-provider',
    requestedDate: date,
    fetchedAt: new Date('2026-09-02T18:30:00Z'),
    httpStatus,
    sourceUrl: `https://test.provider/xsmb/${date}`,
    rawBody: body,
    durationMs: 45,
  };
}

function createMockNormalizedResult(
  date: string,
  results = FIXTURE_VALID_RESULTS_1,
  province = 'Hà Nội'
): NormalizedXSMBResult {
  return {
    drawDate: date,
    lotteryType: 'XSMB',
    province,
    results: JSON.parse(JSON.stringify(results)),
    source: {
      providerId: 'mock-provider',
      sourceUrl: `https://test.provider/xsmb/${date}`,
      fetchedAt: new Date('2026-09-02T18:30:00Z'),
    },
    parserVersion: '1.0.0',
  };
}

class MockXSMBProvider implements XSMBProvider {
  readonly providerId = 'mock-provider';
  readonly providerName = 'Mock Provider';
  public responseGenerator?: (date: string) => RawXSMBResponse;
  public failureGenerator?: (date: string) => Error | undefined;

  async fetchToday(): Promise<RawXSMBResponse> {
    return this.fetchByDate('2026-09-02');
  }

  async fetchByDate(date: string): Promise<RawXSMBResponse> {
    if (this.failureGenerator) {
      const err = this.failureGenerator(date);
      if (err) throw err;
    }
    if (this.responseGenerator) {
      return this.responseGenerator(date);
    }
    return createMockRawResponse(date);
  }

  async healthCheck(): Promise<ProviderHealth> {
    return {
      providerId: this.providerId,
      providerName: this.providerName,
      available: true,
      latencyMs: 10,
      checkedAt: new Date(),
      httpStatus: 200,
    };
  }
}

class MockXSMBParser implements XSMBParser {
  readonly parserId = 'mock-parser';
  readonly parserVersion = '1.0.0';
  public parseOutcomeGenerator?: (response: RawXSMBResponse) => ParseResult;

  parse(response: RawXSMBResponse): ParseResult {
    if (this.parseOutcomeGenerator) {
      return this.parseOutcomeGenerator(response);
    }

    return {
      status: 'SUCCESS',
      data: createMockNormalizedResult(response.requestedDate),
      errors: [],
    };
  }
}

describe('XSMBSyncService Integration & Unit Tests', () => {
  let mockProvider: MockXSMBProvider;
  let mockParser: MockXSMBParser;
  let syncService: XSMBSyncService;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await connectToDatabase({ uri });

    await XSMBDrawModel.init();
    await XSMBSourceModel.init();
    await XSMBSyncRunModel.init();
    await XSMBSyncAttemptModel.init();
  }, 60000);

  afterAll(async () => {
    await disconnectFromDatabase();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await XSMBDrawModel.deleteMany({});
    await XSMBSourceModel.deleteMany({});
    await XSMBSyncRunModel.deleteMany({});
    await XSMBSyncAttemptModel.deleteMany({});

    mockProvider = new MockXSMBProvider();
    mockParser = new MockXSMBParser();
    syncService = new XSMBSyncService({
      provider: mockProvider,
      parser: mockParser,
      drawRepository: xsmbDrawRepository,
      syncRunRepository: xsmbSyncRunRepository,
      syncAttemptRepository: xsmbSyncAttemptRepository,
    });
  });

  describe('1. New Valid Draw Creation Pipeline', () => {
    it('should complete the full Provider -> Parser -> Validator -> MongoDB flow and mark draw as READY', async () => {
      const result = await syncService.syncDate('2026-09-02');

      expect(result.status).toBe('SUCCESS');
      expect(result.date).toBe('2026-09-02');
      expect(result.lotteryType).toBe('XSMB');
      expect(result.checksum).toBeDefined();
      expect(result.draw).toBeDefined();

      // Check MongoDB Document
      const stored = await xsmbDrawRepository.findByDate('2026-09-02');
      expect(stored).not.toBeNull();
      expect(stored?.status).toBe(DRAW_STATUS.READY);
      expect(stored?.completedAt).toBeDefined();
      expect(stored?.results.special[0]).toBe('00086'); // Leading zero preserved
      expect(stored?.source?.providerId).toBe('mock-provider');
      expect(stored?.validation?.status).toBe(VALIDATION_STATUS.VALID);
      expect(stored?.sync?.attemptCount).toBe(1);

      // Verify Sync Run Log
      const runs = await xsmbSyncRunRepository.findRecentRuns();
      expect(runs).toHaveLength(1);
      expect(runs[0].status).toBe(SYNC_RUN_STATUS.COMPLETED);
      expect(runs[0].recordsAccepted).toBe(1);

      // Verify Sync Attempt Log
      const attempts = await xsmbSyncAttemptRepository.findRecentAttempts();
      expect(attempts).toHaveLength(1);
      expect(attempts[0].status).toBe('SUCCESS');
      expect(attempts[0].requestedDate).toBe('2026-09-02');
    });
  });

  describe('2. Idempotency & NO_CHANGE Optimization', () => {
    it('should return NO_CHANGE when syncing identical data a second time without extra DB writes', async () => {
      // First sync -> SUCCESS
      const res1 = await syncService.syncDate('2026-09-02');
      expect(res1.status).toBe('SUCCESS');

      const countAfterFirst = await xsmbDrawRepository.count();
      expect(countAfterFirst).toBe(1);

      // Second sync -> NO_CHANGE
      const res2 = await syncService.syncDate('2026-09-02');
      expect(res2.status).toBe('NO_CHANGE');
      expect(res2.checksum).toBe(res1.checksum);

      const countAfterSecond = await xsmbDrawRepository.count();
      expect(countAfterSecond).toBe(1);

      // Verify attempt logs reflect NO_CHANGE
      const attempts = await xsmbSyncAttemptRepository.findRecentAttempts();
      expect(attempts).toHaveLength(2);
      expect(attempts[0].status).toBe('NO_CHANGE');
    });
  });

  describe('3. Existing Partial Draw Completed by New Valid Data', () => {
    it('should transition a PARTIAL draw to READY when complete valid data arrives', async () => {
      // Create initial PARTIAL draw
      mockParser.parseOutcomeGenerator = () => ({
        status: 'PARTIAL',
        data: createMockNormalizedResult('2026-09-02', FIXTURE_PARTIAL_RESULTS as IXSMBDrawResults),
        errors: [],
      });

      const partialRes = await syncService.syncDate('2026-09-02');
      expect(partialRes.status).toBe('PARTIAL');

      const storedPartial = await xsmbDrawRepository.findByDate('2026-09-02');
      expect(storedPartial?.status).toBe(DRAW_STATUS.PARTIAL);
      expect(storedPartial?.results.special).toHaveLength(0);

      // Now complete data arrives
      mockParser.parseOutcomeGenerator = () => ({
        status: 'SUCCESS',
        data: createMockNormalizedResult('2026-09-02', FIXTURE_VALID_RESULTS_1),
        errors: [],
      });

      const completeRes = await syncService.syncDate('2026-09-02');
      expect(completeRes.status).toBe('SUCCESS');

      const storedReady = await xsmbDrawRepository.findByDate('2026-09-02');
      expect(storedReady?.status).toBe(DRAW_STATUS.READY);
      expect(storedReady?.results.special[0]).toBe('00086');
      expect(storedReady?.completedAt).toBeDefined();
    });
  });

  describe('4. READY Protection (Trusted Data Invariance)', () => {
    it('should NOT downgrade an existing READY draw if a later fetch returns PARTIAL', async () => {
      // Step 1: Create READY draw
      await syncService.syncDate('2026-09-02');
      const before = await xsmbDrawRepository.findByDate('2026-09-02');
      expect(before?.status).toBe(DRAW_STATUS.READY);

      // Step 2: Later fetch returns PARTIAL due to temporary upstream glitch
      mockParser.parseOutcomeGenerator = () => ({
        status: 'PARTIAL',
        data: createMockNormalizedResult('2026-09-02', FIXTURE_PARTIAL_RESULTS as IXSMBDrawResults),
        errors: [],
      });

      const res = await syncService.syncDate('2026-09-02');
      expect(res.status).toBe('NO_CHANGE');

      // Verify stored record remains READY with complete numbers intact
      const after = await xsmbDrawRepository.findByDate('2026-09-02');
      expect(after?.status).toBe(DRAW_STATUS.READY);
      expect(after?.results.special[0]).toBe('00086');
    });

    it('should NOT overwrite an existing READY draw if incoming data is INVALID', async () => {
      // Step 1: Create READY draw
      await syncService.syncDate('2026-09-02');

      // Step 2: Incoming fetch contains corrupt numbers (4-digit special prize)
      const corruptResults = JSON.parse(JSON.stringify(FIXTURE_VALID_RESULTS_1));
      corruptResults.special = ['1234']; // Invalid 4 digits for Special prize

      mockParser.parseOutcomeGenerator = () => ({
        status: 'SUCCESS',
        data: createMockNormalizedResult('2026-09-02', corruptResults),
        errors: [],
      });

      const res = await syncService.syncDate('2026-09-02');
      expect(res.status).toBe('FAILED');
      expect(res.errorCode).toBe('VALIDATION_ERROR');

      // Stored record is untouched
      const stored = await xsmbDrawRepository.findByDate('2026-09-02');
      expect(stored?.status).toBe(DRAW_STATUS.READY);
      expect(stored?.results.special[0]).toBe('00086');
    });
  });

  describe('5. Provider Failure Handling', () => {
    it('should handle network timeouts/HTTP failures gracefully and record failure telemetry', async () => {
      mockProvider.failureGenerator = (date) =>
        XSMBProviderError.timeout('mock-provider', `https://test/${date}`, 10000);

      const res = await syncService.syncDate('2026-09-02');

      expect(res.status).toBe('FAILED');
      expect(res.errorCode).toBe('PROVIDER_ERROR');

      // No document created
      const stored = await xsmbDrawRepository.findByDate('2026-09-02');
      expect(stored).toBeNull();

      // Logged in sync attempts
      const attempts = await xsmbSyncAttemptRepository.findRecentAttempts();
      expect(attempts).toHaveLength(1);
      expect(attempts[0].status).toBe('FAILED');
      expect(attempts[0].errorCode).toBe('PROVIDER_ERROR');
    });
  });

  describe('6. Parser Failure Handling', () => {
    it('should record PARSER_ERROR and not persist anything if parser encounters changed layout', async () => {
      mockParser.parseOutcomeGenerator = () => ({
        status: 'SOURCE_LAYOUT_CHANGED',
        errors: [
          {
            code: 'SOURCE_LAYOUT_CHANGED',
            message: 'No prize table found on page',
          },
        ],
      });

      const res = await syncService.syncDate('2026-09-02');

      expect(res.status).toBe('FAILED');
      expect(res.errorCode).toBe('PARSER_ERROR');

      const stored = await xsmbDrawRepository.findByDate('2026-09-02');
      expect(stored).toBeNull();
    });
  });

  describe('7. Date Mismatch Protection', () => {
    it('should reject synchronization if parsed date does not match requested date', async () => {
      // Requested 2026-09-02, but parser returns 2026-09-01
      mockParser.parseOutcomeGenerator = () => ({
        status: 'SUCCESS',
        data: createMockNormalizedResult('2026-09-01', FIXTURE_VALID_RESULTS_1),
        errors: [],
      });

      const res = await syncService.syncDate('2026-09-02');

      expect(res.status).toBe('FAILED');
      expect(res.errorCode).toBe('DATE_MISMATCH');

      const stored = await xsmbDrawRepository.findByDate('2026-09-02');
      expect(stored).toBeNull();
    });
  });

  describe('8. Safe Concurrency & Duplicate Prevention', () => {
    it('should handle multiple simultaneous sync operations for the same date without creating duplicates', async () => {
      // Execute 5 concurrent syncs for the same date
      const promises = Array.from({ length: 5 }, () =>
        syncService.syncDate('2026-09-02')
      );

      const results = await Promise.all(promises);

      // All returned valid status (either SUCCESS or NO_CHANGE)
      for (const res of results) {
        expect(['SUCCESS', 'NO_CHANGE']).toContain(res.status);
      }

      // Exactly 1 document exists in MongoDB
      const count = await xsmbDrawRepository.count({ drawDate: '2026-09-02' });
      expect(count).toBe(1);
    });
  });

  describe('9. Partial Data Merging', () => {
    it('should merge valid new prize tiers without erasing existing valid tiers', async () => {
      // Stage 1: Only 7th prize is drawn
      const stage1: Partial<typeof FIXTURE_VALID_RESULTS_1> = {
        special: [],
        firstPrize: [],
        secondPrize: [],
        thirdPrize: [],
        fourthPrize: [],
        fifthPrize: [],
        sixthPrize: [],
        seventhPrize: ['04', '05', '89', '90'],
      };

      mockParser.parseOutcomeGenerator = () => ({
        status: 'PARTIAL',
        data: createMockNormalizedResult('2026-09-02', stage1 as IXSMBDrawResults),
        errors: [],
      });

      await syncService.syncDate('2026-09-02');

      const check1 = await xsmbDrawRepository.findByDate('2026-09-02');
      expect(check1?.results.seventhPrize).toHaveLength(4);
      expect(check1?.results.sixthPrize).toHaveLength(0);

      // Stage 2: 6th prize is drawn, 7th prize is empty in this scrape
      const stage2: Partial<typeof FIXTURE_VALID_RESULTS_1> = {
        special: [],
        firstPrize: [],
        secondPrize: [],
        thirdPrize: [],
        fourthPrize: [],
        fifthPrize: [],
        sixthPrize: ['021', '345', '678'],
        seventhPrize: [],
      };

      mockParser.parseOutcomeGenerator = () => ({
        status: 'PARTIAL',
        data: createMockNormalizedResult('2026-09-02', stage2 as IXSMBDrawResults),
        errors: [],
      });

      await syncService.syncDate('2026-09-02');

      const check2 = await xsmbDrawRepository.findByDate('2026-09-02');
      // Both 7th prize (preserved) and 6th prize (merged) are present
      expect(check2?.results.seventhPrize).toHaveLength(4);
      expect(check2?.results.sixthPrize).toHaveLength(3);
      expect(check2?.status).toBe(DRAW_STATUS.PARTIAL);
    });
  });

  describe('10. Verified Corrections Handling', () => {
    it('should update a READY draw when allowCorrection is true and track correction metadata', async () => {
      // Initial draw saved with FIXTURE_VALID_RESULTS_1
      await syncService.syncDate('2026-09-02');

      const initial = await xsmbDrawRepository.findByDate('2026-09-02');
      expect(initial?.results.special[0]).toBe('00086');

      // Now an official correction arrives with FIXTURE_VALID_RESULTS_2
      mockParser.parseOutcomeGenerator = () => ({
        status: 'SUCCESS',
        data: createMockNormalizedResult('2026-09-02', FIXTURE_VALID_RESULTS_2),
        errors: [],
      });

      // Without allowCorrection, update is rejected with CONFLICT
      const conflictRes = await syncService.syncDate('2026-09-02', {
        allowCorrection: false,
      });
      expect(conflictRes.status).toBe('CONFLICT');

      // With allowCorrection: true, update is accepted
      const correctionRes = await syncService.syncDate('2026-09-02', {
        allowCorrection: true,
      });
      expect(correctionRes.status).toBe('SUCCESS');
      expect(correctionRes.isCorrection).toBe(true);

      const updated = await xsmbDrawRepository.findByDate('2026-09-02');
      expect(updated?.results.special[0]).toBe('85429');
      expect(updated?.correction?.isCorrected).toBe(true);
      expect(updated?.correction?.previousChecksum).toBeDefined();
    });
  });

  describe('11. Batch Date Range Synchronization & Error Isolation', () => {
    it('should synchronize multiple dates with error isolation across dates', async () => {
      // Fail on 2026-09-02, succeed on 2026-09-01 and 2026-09-03
      mockProvider.failureGenerator = (date) => {
        if (date === '2026-09-02') {
          return XSMBProviderError.networkError('mock-provider', 'url', 'DNS failure');
        }
        return undefined;
      };

      const batchResult = await syncService.syncDateRange('2026-09-01', '2026-09-03');

      expect(batchResult.totalRequested).toBe(3);
      expect(batchResult.successful).toBe(2);
      expect(batchResult.failed).toBe(1);

      // Verify dates 2026-09-01 and 2026-09-03 are saved
      const draw1 = await xsmbDrawRepository.findByDate('2026-09-01');
      const draw2 = await xsmbDrawRepository.findByDate('2026-09-02');
      const draw3 = await xsmbDrawRepository.findByDate('2026-09-03');

      expect(draw1?.status).toBe(DRAW_STATUS.READY);
      expect(draw2).toBeNull();
      expect(draw3?.status).toBe(DRAW_STATUS.READY);
    });
  });

  describe('12. syncToday & Options Edge Cases', () => {
    it('should synchronize today correctly via syncToday()', async () => {
      const res = await syncService.syncToday();
      expect(res.status).toBe('SUCCESS');
      expect(res.draw).toBeDefined();
    });

    it('should force update even if checksums match when forceUpdate is true', async () => {
      // First sync
      const res1 = await syncService.syncDate('2026-09-02');
      expect(res1.status).toBe('SUCCESS');

      // Second sync with forceUpdate: true
      const res2 = await syncService.syncDate('2026-09-02', { forceUpdate: true });
      expect(res2.status).toBe('SUCCESS');
    });

    it('should reject partial draw when allowPartial is false', async () => {
      mockParser.parseOutcomeGenerator = () => ({
        status: 'PARTIAL',
        data: createMockNormalizedResult('2026-09-02', FIXTURE_PARTIAL_RESULTS as IXSMBDrawResults),
        errors: [],
      });

      const res = await syncService.syncDate('2026-09-02', { allowPartial: false });
      expect(res.status).toBe('FAILED');
      expect(res.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid dates like 2026-02-30 or non-date strings', async () => {
      const res1 = await syncService.syncDate('2026-02-30');
      expect(res1.status).toBe('FAILED');
      expect(res1.errorCode).toBe('PARSER_ERROR');

      const res2 = await syncService.syncDate('invalid-date');
      expect(res2.status).toBe('FAILED');
      expect(res2.errorCode).toBe('PARSER_ERROR');
    });
  });
});
