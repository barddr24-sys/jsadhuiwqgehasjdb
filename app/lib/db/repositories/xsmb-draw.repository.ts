/**
 * XSMB Draw Repository
 *
 * Encapsulates all MongoDB queries and mutations for the `xsmb_draws` collection.
 * No database queries should be placed in controllers or frontend code.
 */

import { connectToDatabase } from '../connection';
import { XSMBDrawModel } from '../models/xsmb-draw.model';
import {
  DRAW_STATUS,
  LOTTERY_TYPE,
  VALIDATION_STATUS,
  type DrawStatus,
  type LotteryType,
} from '../config/status-config';
import {
  validateDrawDate,
  validateDrawResults,
  validateDrawStatus,
} from '../validation/draw-validator';
import type {
  IXSMBDraw,
  CreateDrawDTO,
  UpsertDrawDTO,
  DrawHistoryFilter,
  PaginatedResult,
  IXSMBDrawValidation,
} from '../types/db-types';

export class XSMBDrawRepository {
  /**
   * Helper to ensure database connection before executing operations
   */
  private async ensureConnection(): Promise<void> {
    await connectToDatabase();
  }

  /**
   * Finds a single draw document by date and lotteryType.
   */
  async findByDate(
    date: string,
    lotteryType: LotteryType = LOTTERY_TYPE.XSMB
  ): Promise<IXSMBDraw | null> {
    await this.ensureConnection();

    const dateValidation = validateDrawDate(date);
    if (!dateValidation.isValid) {
      throw new Error(`Invalid date format for findByDate: ${dateValidation.error}`);
    }

    const doc = await XSMBDrawModel.findOne({
      drawDate: date,
      lotteryType,
    }).lean<IXSMBDraw>();

    return doc;
  }

  /**
   * Finds the most recent draw in the database.
   */
  async findLatest(
    lotteryType: LotteryType = LOTTERY_TYPE.XSMB
  ): Promise<IXSMBDraw | null> {
    await this.ensureConnection();

    const doc = await XSMBDrawModel.findOne({ lotteryType })
      .sort({ drawDate: -1 })
      .lean<IXSMBDraw>();

    return doc;
  }

  /**
   * Finds the latest completed/ready draws (status READY or COMPLETED) in descending date order.
   */
  async findLatestCompleted(
    limit: number = 10,
    lotteryType: LotteryType = LOTTERY_TYPE.XSMB
  ): Promise<IXSMBDraw[]> {
    await this.ensureConnection();

    const safeLimit = Math.max(1, Math.min(limit, 100));

    const docs = await XSMBDrawModel.find({
      lotteryType,
      status: { $in: [DRAW_STATUS.READY] },
    })
      .sort({ drawDate: -1 })
      .limit(safeLimit)
      .lean<IXSMBDraw[]>();

    return docs;
  }

  /**
   * Finds draws within an inclusive date range [startDate, endDate].
   */
  async findDateRange(
    startDate: string,
    endDate: string,
    lotteryType: LotteryType = LOTTERY_TYPE.XSMB
  ): Promise<IXSMBDraw[]> {
    await this.ensureConnection();

    return XSMBDrawModel.find({
      lotteryType,
      drawDate: { $gte: startDate, $lte: endDate },
    })
      .sort({ drawDate: 1 })
      .lean<IXSMBDraw[]>();
  }

  /**
   * Finds historical draws with pagination and optional filters.
   */
  async findHistory(
    limit: number = 10,
    offset: number = 0,
    filter: DrawHistoryFilter = {}
  ): Promise<PaginatedResult<IXSMBDraw>> {
    await this.ensureConnection();

    const safeLimit = Math.max(1, Math.min(limit, 100));
    const safeOffset = Math.max(0, offset);

    const query: Record<string, unknown> = {
      lotteryType: filter.lotteryType || LOTTERY_TYPE.XSMB,
    };

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.province) {
      query.province = filter.province;
    }

    if (filter.startDate || filter.endDate) {
      const dateQuery: Record<string, string> = {};
      if (filter.startDate) dateQuery.$gte = filter.startDate;
      if (filter.endDate) dateQuery.$lte = filter.endDate;
      query.drawDate = dateQuery;
    }

    const [items, total] = await Promise.all([
      XSMBDrawModel.find(query)
        .sort({ drawDate: -1 })
        .skip(safeOffset)
        .limit(safeLimit)
        .lean<IXSMBDraw[]>(),
      XSMBDrawModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + items.length < total,
    };
  }

  /**
   * Creates a new draw document. Rejects duplicates via unique index.
   */
  async create(data: CreateDrawDTO): Promise<IXSMBDraw> {
    await this.ensureConnection();

    const dateValidation = validateDrawDate(data.drawDate);
    if (!dateValidation.isValid) {
      throw new Error(`Cannot create draw: ${dateValidation.error}`);
    }

    const lotteryType = data.lotteryType || LOTTERY_TYPE.XSMB;
    const status = data.status || DRAW_STATUS.SCHEDULED;

    // Validate prize structure if results provided
    if (data.results && Object.keys(data.results).length > 0) {
      const allowPartial = status !== DRAW_STATUS.READY;
      const resVal = validateDrawResults(data.results, { allowPartial });

      const statusVal = validateDrawStatus(status, resVal);
      if (!statusVal.isValid) {
        throw new Error(`Cannot create draw: ${statusVal.error}`);
      }
    }

    const created = await XSMBDrawModel.create({
      ...data,
      lotteryType,
      status,
    });

    return created.toObject<IXSMBDraw>();
  }

  /**
   * Upserts a draw by (drawDate, lotteryType).
   * Atomically updates if exists or creates if new.
   */
  async upsert(data: UpsertDrawDTO): Promise<IXSMBDraw> {
    await this.ensureConnection();

    const dateValidation = validateDrawDate(data.drawDate);
    if (!dateValidation.isValid) {
      throw new Error(`Cannot upsert draw: ${dateValidation.error}`);
    }

    const lotteryType = data.lotteryType || LOTTERY_TYPE.XSMB;

    // Validate status & results if provided
    if (data.results && Object.keys(data.results).length > 0 && data.status) {
      const allowPartial = data.status !== DRAW_STATUS.READY;
      const resVal = validateDrawResults(data.results, { allowPartial });
      const statusVal = validateDrawStatus(data.status, resVal);
      if (!statusVal.isValid) {
        throw new Error(`Cannot upsert draw: ${statusVal.error}`);
      }
    }

    const updateDoc: Record<string, unknown> = {
      $set: {
        ...data,
        lotteryType,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    };

    const doc = await XSMBDrawModel.findOneAndUpdate(
      { drawDate: data.drawDate, lotteryType },
      updateDoc,
      {
        returnDocument: 'after',
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).lean<IXSMBDraw>();

    if (!doc) {
      throw new Error(`Failed to upsert draw for date ${data.drawDate}`);
    }

    return doc;
  }

  /**
   * Updates status of a draw by date or ID with validation.
   */
  async updateStatus(
    dateOrId: string,
    status: DrawStatus,
    options: {
      lotteryType?: LotteryType;
      completedAt?: Date;
      validation?: IXSMBDrawValidation;
    } = {}
  ): Promise<IXSMBDraw | null> {
    await this.ensureConnection();

    const lotteryType = options.lotteryType || LOTTERY_TYPE.XSMB;

    // Find current document
    const query: Record<string, unknown> = dateOrId.includes('-')
      ? { drawDate: dateOrId, lotteryType }
      : { _id: dateOrId };

    const existing = await XSMBDrawModel.findOne(query);
    if (!existing) {
      return null;
    }

    // If transitioning to READY, validate results completeness
    if (status === DRAW_STATUS.READY) {
      const resVal = validateDrawResults(existing.results, { allowPartial: false });
      const statusVal = validateDrawStatus(status, resVal);
      if (!statusVal.isValid) {
        throw new Error(`Cannot transition draw to READY: ${statusVal.error}`);
      }
    }

    const updateFields: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (options.completedAt) {
      updateFields.completedAt = options.completedAt;
    } else if (status === DRAW_STATUS.READY && !existing.completedAt) {
      updateFields.completedAt = new Date();
    }

    if (options.validation) {
      updateFields.validation = options.validation;
    } else if (status === DRAW_STATUS.READY) {
      updateFields.validation = {
        status: VALIDATION_STATUS.VALID,
        validatedAt: new Date(),
        validatorVersion: '1.0.0',
        errors: [],
      };
    }

    const updated = await XSMBDrawModel.findOneAndUpdate(
      query,
      { $set: updateFields },
      { returnDocument: 'after', runValidators: true }
    ).lean<IXSMBDraw>();

    return updated;
  }

  /**
   * Counts total documents matching filter
   */
  async count(filter: Record<string, unknown> = {}): Promise<number> {
    await this.ensureConnection();
    return XSMBDrawModel.countDocuments(filter);
  }

  /**
   * Deletes a draw by date (for cleanup and testing)
   */
  async deleteByDate(
    date: string,
    lotteryType: LotteryType = LOTTERY_TYPE.XSMB
  ): Promise<boolean> {
    await this.ensureConnection();
    const res = await XSMBDrawModel.deleteOne({ drawDate: date, lotteryType });
    return res.deletedCount > 0;
  }
}

export const xsmbDrawRepository = new XSMBDrawRepository();
