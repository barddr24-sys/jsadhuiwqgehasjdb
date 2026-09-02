/**
 * XSMB Sync Run Repository
 *
 * Manages synchronization run logs in `xsmb_sync_runs`.
 */

import { connectToDatabase } from '../connection';
import { XSMBSyncRunModel } from '../models/xsmb-sync-run.model';
import { SYNC_RUN_STATUS } from '../config/status-config';
import type {
  IXSMBSyncRun,
  CreateSyncRunDTO,
  FinishSyncRunDTO,
} from '../types/db-types';

export class XSMBSyncRunRepository {
  private async ensureConnection(): Promise<void> {
    await connectToDatabase();
  }

  async createRun(data: CreateSyncRunDTO): Promise<IXSMBSyncRun> {
    await this.ensureConnection();
    const run = await XSMBSyncRunModel.create({
      ...data,
      status: data.status || SYNC_RUN_STATUS.RUNNING,
      startedAt: data.startedAt || new Date(),
    });
    return run.toObject<IXSMBSyncRun>();
  }

  async finishRun(
    syncRunId: string,
    data: FinishSyncRunDTO
  ): Promise<IXSMBSyncRun | null> {
    await this.ensureConnection();
    const updated = await XSMBSyncRunModel.findOneAndUpdate(
      { syncRunId },
      {
        $set: {
          ...data,
          finishedAt: data.finishedAt || new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    ).lean<IXSMBSyncRun>();
    return updated;
  }

  async findRecentRuns(limit: number = 20): Promise<IXSMBSyncRun[]> {
    await this.ensureConnection();
    return XSMBSyncRunModel.find()
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean<IXSMBSyncRun[]>();
  }

  async findByRunId(syncRunId: string): Promise<IXSMBSyncRun | null> {
    await this.ensureConnection();
    return XSMBSyncRunModel.findOne({ syncRunId }).lean<IXSMBSyncRun>();
  }
}

export const xsmbSyncRunRepository = new XSMBSyncRunRepository();
