import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase, disconnectFromDatabase } from '../app/lib/db/connection';
import { XSMBDrawModel } from '../app/lib/db/models/xsmb-draw.model';
import { XSMBSourceModel } from '../app/lib/db/models/xsmb-source.model';
import { XSMBSyncRunModel } from '../app/lib/db/models/xsmb-sync-run.model';
import { xsmbDrawRepository } from '../app/lib/db/repositories/xsmb-draw.repository';
import { xsmbSourceRepository } from '../app/lib/db/repositories/xsmb-source.repository';
import { xsmbSyncRunRepository } from '../app/lib/db/repositories/xsmb-sync-run.repository';
import { DRAW_STATUS, SYNC_RUN_STATUS } from '../app/lib/db/config/status-config';
import {
  FIXTURE_VALID_DRAW_DTO_1,
  FIXTURE_VALID_DRAW_DTO_2,
  FIXTURE_PARTIAL_RESULTS,
  FIXTURE_VALID_RESULTS_1,
} from './fixtures/draw-fixtures';

let mongoServer: MongoMemoryServer;

describe('XSMB MongoDB Repository Layer Integration Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await connectToDatabase({ uri });
    // Ensure indexes are built
    await XSMBDrawModel.init();
    await XSMBSourceModel.init();
    await XSMBSyncRunModel.init();
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
  });

  describe('XSMBDrawRepository.create', () => {
    it('should create a valid draw document with leading zeroes preserved', async () => {
      const created = await xsmbDrawRepository.create(FIXTURE_VALID_DRAW_DTO_1);

      expect(created.drawDate).toBe('2026-09-02');
      expect(created.lotteryType).toBe('XSMB');
      expect(created.status).toBe(DRAW_STATUS.READY);

      // Verify leading zeroes are preserved
      expect(created.results.special[0]).toBe('00086');
      expect(typeof created.results.special[0]).toBe('string');
      expect(created.results.sixthPrize[0]).toBe('021');
      expect(created.results.seventhPrize[0]).toBe('04');
    });

    it('should prevent duplicate draws with the same drawDate and lotteryType (Unique Index)', async () => {
      await xsmbDrawRepository.create(FIXTURE_VALID_DRAW_DTO_1);

      // Attempting to create duplicate must throw
      await expect(
        xsmbDrawRepository.create(FIXTURE_VALID_DRAW_DTO_1)
      ).rejects.toThrow();
    });
  });

  describe('XSMBDrawRepository.findByDate', () => {
    it('should find draw by date', async () => {
      await xsmbDrawRepository.create(FIXTURE_VALID_DRAW_DTO_1);

      const found = await xsmbDrawRepository.findByDate('2026-09-02');
      expect(found).not.toBeNull();
      expect(found?.drawDate).toBe('2026-09-02');
      expect(found?.results.special[0]).toBe('00086');
    });

    it('should return null for non-existent date', async () => {
      const found = await xsmbDrawRepository.findByDate('2026-01-01');
      expect(found).toBeNull();
    });

    it('should throw on invalid date format', async () => {
      await expect(xsmbDrawRepository.findByDate('invalid-date')).rejects.toThrow();
    });
  });

  describe('XSMBDrawRepository.findLatest and findLatestCompleted', () => {
    it('should find the latest draw regardless of status', async () => {
      await xsmbDrawRepository.create(FIXTURE_VALID_DRAW_DTO_2); // 2026-09-01
      await xsmbDrawRepository.create({
        drawDate: '2026-09-03',
        status: DRAW_STATUS.SCHEDULED,
      });

      const latest = await xsmbDrawRepository.findLatest();
      expect(latest?.drawDate).toBe('2026-09-03');
      expect(latest?.status).toBe(DRAW_STATUS.SCHEDULED);
    });

    it('should find latest completed/ready draws in descending date order', async () => {
      await xsmbDrawRepository.create(FIXTURE_VALID_DRAW_DTO_2); // 2026-09-01 READY
      await xsmbDrawRepository.create(FIXTURE_VALID_DRAW_DTO_1); // 2026-09-02 READY
      await xsmbDrawRepository.create({
        drawDate: '2026-09-03',
        status: DRAW_STATUS.SCHEDULED, // Not ready
      });

      const readyDraws = await xsmbDrawRepository.findLatestCompleted(10);
      expect(readyDraws).toHaveLength(2);
      expect(readyDraws[0].drawDate).toBe('2026-09-02');
      expect(readyDraws[1].drawDate).toBe('2026-09-01');
    });
  });

  describe('XSMBDrawRepository.findHistory', () => {
    it('should handle pagination correctly with limit and offset', async () => {
      // Create 5 draws
      for (let i = 1; i <= 5; i++) {
        const day = String(i).padStart(2, '0');
        await xsmbDrawRepository.create({
          drawDate: `2026-08-${day}`,
          status: DRAW_STATUS.READY,
          results: FIXTURE_VALID_RESULTS_1,
        });
      }

      const page1 = await xsmbDrawRepository.findHistory(2, 0);
      expect(page1.items).toHaveLength(2);
      expect(page1.total).toBe(5);
      expect(page1.hasMore).toBe(true);
      expect(page1.items[0].drawDate).toBe('2026-08-05');

      const page2 = await xsmbDrawRepository.findHistory(2, 2);
      expect(page2.items).toHaveLength(2);
      expect(page2.hasMore).toBe(true);
      expect(page2.items[0].drawDate).toBe('2026-08-03');

      const page3 = await xsmbDrawRepository.findHistory(2, 4);
      expect(page3.items).toHaveLength(1);
      expect(page3.hasMore).toBe(false);
      expect(page3.items[0].drawDate).toBe('2026-08-01');
    });
  });

  describe('XSMBDrawRepository.upsert', () => {
    it('should create new draw if does not exist', async () => {
      const upserted = await xsmbDrawRepository.upsert(FIXTURE_VALID_DRAW_DTO_1);
      expect(upserted.drawDate).toBe('2026-09-02');
      expect(upserted.status).toBe(DRAW_STATUS.READY);

      const count = await xsmbDrawRepository.count();
      expect(count).toBe(1);
    });

    it('should update existing draw in place without duplicate', async () => {
      // Initial create as SCHEDULED
      await xsmbDrawRepository.create({
        drawDate: '2026-09-02',
        status: DRAW_STATUS.SCHEDULED,
      });

      // Upsert to READY with results
      const updated = await xsmbDrawRepository.upsert(FIXTURE_VALID_DRAW_DTO_1);
      expect(updated.status).toBe(DRAW_STATUS.READY);
      expect(updated.results.special[0]).toBe('00086');

      const count = await xsmbDrawRepository.count();
      expect(count).toBe(1);
    });
  });

  describe('XSMBDrawRepository.updateStatus', () => {
    it('should update status and set completedAt when transitioned to READY', async () => {
      await xsmbDrawRepository.create({
        drawDate: '2026-09-02',
        status: DRAW_STATUS.UPDATING,
        results: FIXTURE_VALID_RESULTS_1,
      });

      const updated = await xsmbDrawRepository.updateStatus(
        '2026-09-02',
        DRAW_STATUS.READY
      );

      expect(updated?.status).toBe(DRAW_STATUS.READY);
      expect(updated?.completedAt).toBeDefined();
      expect(updated?.validation?.status).toBe('VALID');
    });

    it('should REJECT transition to READY if results are incomplete', async () => {
      await xsmbDrawRepository.create({
        drawDate: '2026-09-02',
        status: DRAW_STATUS.UPDATING,
        results: FIXTURE_PARTIAL_RESULTS,
      });

      await expect(
        xsmbDrawRepository.updateStatus('2026-09-02', DRAW_STATUS.READY)
      ).rejects.toThrow(/Cannot transition draw to READY/);
    });

    it('should find draws within a date range using findDateRange', async () => {
      await xsmbDrawRepository.create(FIXTURE_VALID_DRAW_DTO_1); // 2026-09-02
      await xsmbDrawRepository.create(FIXTURE_VALID_DRAW_DTO_2); // 2026-09-01

      const rangeDocs = await xsmbDrawRepository.findDateRange('2026-09-01', '2026-09-02');
      expect(rangeDocs).toHaveLength(2);
      expect(rangeDocs[0].drawDate).toBe('2026-09-01');
      expect(rangeDocs[1].drawDate).toBe('2026-09-02');
    });
  });

  describe('XSMBSourceRepository & XSMBSyncRunRepository', () => {
    it('should upsert and find source providers', async () => {
      await xsmbSourceRepository.upsertProvider({
        providerId: 'minhngoc',
        providerName: 'Minh Ngọc Live Feed',
        baseUrl: 'https://www.minhngoc.net.vn',
        priority: 10,
        enabled: true,
      });

      const provider = await xsmbSourceRepository.findByProviderId('minhngoc');
      expect(provider).not.toBeNull();
      expect(provider?.providerName).toBe('Minh Ngọc Live Feed');
      expect(provider?.priority).toBe(10);
    });

    it('should create and finish sync runs', async () => {
      const run = await xsmbSyncRunRepository.createRun({
        syncRunId: 'sync-run-001',
        providerId: 'minhngoc',
        startedAt: new Date(),
      });

      expect(run.status).toBe(SYNC_RUN_STATUS.RUNNING);

      const finished = await xsmbSyncRunRepository.finishRun('sync-run-001', {
        status: SYNC_RUN_STATUS.COMPLETED,
        recordsFetched: 1,
        recordsAccepted: 1,
        recordsRejected: 0,
        conflicts: 0,
      });

      expect(finished?.status).toBe(SYNC_RUN_STATUS.COMPLETED);
      expect(finished?.recordsAccepted).toBe(1);
      expect(finished?.finishedAt).toBeDefined();
    });
  });
});
