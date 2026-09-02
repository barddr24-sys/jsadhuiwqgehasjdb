/**
 * XSMB Sync Attempt Repository
 *
 * Manages granular sync attempt logs in `xsmb_sync_attempts`.
 */

import { connectToDatabase } from '../connection';
import { XSMBSyncAttemptModel } from '../models/xsmb-sync-attempt.model';
import type {
  IXSMBSyncAttempt,
  CreateSyncAttemptDTO,
} from '../types/db-types';

export class XSMBSyncAttemptRepository {
  private async ensureConnection(): Promise<void> {
    await connectToDatabase();
  }

  /**
   * Records a new sync attempt entry.
   */
  async createAttempt(data: CreateSyncAttemptDTO): Promise<IXSMBSyncAttempt> {
    await this.ensureConnection();
    const doc = await XSMBSyncAttemptModel.create({
      ...data,
      startedAt: data.startedAt || new Date(),
      finishedAt: data.finishedAt || new Date(),
    });
    return doc.toObject<IXSMBSyncAttempt>();
  }

  /**
   * Retrieves recent sync attempts for audit and monitoring.
   */
  async findRecentAttempts(limit: number = 20): Promise<IXSMBSyncAttempt[]> {
    await this.ensureConnection();
    return XSMBSyncAttemptModel.find()
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean<IXSMBSyncAttempt[]>();
  }

  /**
   * Retrieves all attempts associated with a specific sync run.
   */
  async findByRunId(syncRunId: string): Promise<IXSMBSyncAttempt[]> {
    await this.ensureConnection();
    return XSMBSyncAttemptModel.find({ syncRunId })
      .sort({ startedAt: -1 })
      .lean<IXSMBSyncAttempt[]>();
  }

  /**
   * Retrieves attempts for a specific draw date.
   */
  async findByDate(date: string, limit: number = 10): Promise<IXSMBSyncAttempt[]> {
    await this.ensureConnection();
    return XSMBSyncAttemptModel.find({ requestedDate: date })
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean<IXSMBSyncAttempt[]>();
  }
}

export const xsmbSyncAttemptRepository = new XSMBSyncAttemptRepository();
