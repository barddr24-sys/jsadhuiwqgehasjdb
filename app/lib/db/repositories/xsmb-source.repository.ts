/**
 * XSMB Source Provider Repository
 *
 * Manages external provider metadata in `xsmb_sources`.
 */

import { connectToDatabase } from '../connection';
import { XSMBSourceModel } from '../models/xsmb-source.model';
import type { IXSMBSource, CreateSourceDTO } from '../types/db-types';

export class XSMBSourceRepository {
  private async ensureConnection(): Promise<void> {
    await connectToDatabase();
  }

  async findByProviderId(providerId: string): Promise<IXSMBSource | null> {
    await this.ensureConnection();
    return XSMBSourceModel.findOne({ providerId }).lean<IXSMBSource>();
  }

  async findAllEnabled(): Promise<IXSMBSource[]> {
    await this.ensureConnection();
    return XSMBSourceModel.find({ enabled: true })
      .sort({ priority: -1 })
      .lean<IXSMBSource[]>();
  }

  async upsertProvider(data: CreateSourceDTO): Promise<IXSMBSource> {
    await this.ensureConnection();
    const doc = await XSMBSourceModel.findOneAndUpdate(
      { providerId: data.providerId },
      {
        $set: {
          ...data,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      {
        returnDocument: 'after',
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).lean<IXSMBSource>();

    if (!doc) {
      throw new Error(`Failed to upsert provider ${data.providerId}`);
    }

    return doc;
  }

  async setProviderStatus(providerId: string, enabled: boolean): Promise<IXSMBSource | null> {
    await this.ensureConnection();
    return XSMBSourceModel.findOneAndUpdate(
      { providerId },
      { $set: { enabled, updatedAt: new Date() } },
      { returnDocument: 'after' }
    ).lean<IXSMBSource>();
  }
}

export const xsmbSourceRepository = new XSMBSourceRepository();
