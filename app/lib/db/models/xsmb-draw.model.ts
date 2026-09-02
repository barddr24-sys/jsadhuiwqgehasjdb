/**
 * Mongoose Model & Schema for Primary Collection: `xsmb_draws`
 *
 * Enforces:
 * - String numbers preservation
 * - Controlled DrawStatus & ValidationStatus enums
 * - Unique compound index on (drawDate, lotteryType)
 * - Secondary compound indexes for status and query performance
 */

import mongoose, { Schema, type Model, type Document } from 'mongoose';
import {
  DRAW_STATUS,
  VALID_DRAW_STATUSES,
  VALID_VALIDATION_STATUSES,
  VALIDATION_STATUS,
  LOTTERY_TYPE,
} from '../config/status-config';
import type { IXSMBDraw } from '../types/db-types';

export type XSMBDrawDocument = IXSMBDraw & Document;

const ResultsSchema = new Schema(
  {
    special: { type: [String], default: [] },
    firstPrize: { type: [String], default: [] },
    secondPrize: { type: [String], default: [] },
    thirdPrize: { type: [String], default: [] },
    fourthPrize: { type: [String], default: [] },
    fifthPrize: { type: [String], default: [] },
    sixthPrize: { type: [String], default: [] },
    seventhPrize: { type: [String], default: [] },
  },
  { _id: false }
);

const SourceSchema = new Schema(
  {
    providerId: { type: String, trim: true },
    providerName: { type: String, trim: true },
    sourceUrl: { type: String, trim: true },
    fetchedAt: { type: Date },
    verifiedAt: { type: Date },
    checksum: { type: String, trim: true },
  },
  { _id: false }
);

const SyncSchema = new Schema(
  {
    syncRunId: { type: String, trim: true },
    lastSyncAt: { type: Date },
    attemptCount: { type: Number, default: 0 },
    rawHash: { type: String, trim: true },
  },
  { _id: false }
);

const ValidationSchema = new Schema(
  {
    status: {
      type: String,
      enum: VALID_VALIDATION_STATUSES,
      default: VALIDATION_STATUS.PENDING,
    },
    validatedAt: { type: Date },
    validatorVersion: { type: String, trim: true },
    errors: { type: [String], default: [] },
  },
  { _id: false, suppressReservedKeysWarning: true }
);

const CorrectionSchema = new Schema(
  {
    isCorrected: { type: Boolean, default: false },
    correctedAt: { type: Date },
    reason: { type: String, trim: true },
    previousChecksum: { type: String, trim: true },
  },
  { _id: false }
);

export const XSMBDrawSchema = new Schema<XSMBDrawDocument>(
  {
    drawDate: {
      type: String,
      required: [true, 'drawDate is required'],
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'drawDate must be in YYYY-MM-DD format'],
      index: true,
    },
    lotteryType: {
      type: String,
      required: [true, 'lotteryType is required'],
      enum: [LOTTERY_TYPE.XSMB],
      default: LOTTERY_TYPE.XSMB,
      trim: true,
    },
    province: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'status is required'],
      enum: VALID_DRAW_STATUSES,
      default: DRAW_STATUS.SCHEDULED,
      index: true,
    },
    results: {
      type: ResultsSchema,
      default: () => ({
        special: [],
        firstPrize: [],
        secondPrize: [],
        thirdPrize: [],
        fourthPrize: [],
        fifthPrize: [],
        sixthPrize: [],
        seventhPrize: [],
      }),
    },
    source: {
      type: SourceSchema,
      default: () => ({}),
    },
    sync: {
      type: SyncSchema,
      default: () => ({ attemptCount: 0 }),
    },
    validation: {
      type: ValidationSchema,
      default: () => ({
        status: VALIDATION_STATUS.PENDING,
        errors: [],
      }),
    },
    correction: {
      type: CorrectionSchema,
      default: () => ({ isCorrected: false }),
    },
    completedAt: {
      type: Date,
    },
  },
  {
    collection: 'xsmb_draws',
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// Primary unique index: exactly one draw per date and lotteryType
XSMBDrawSchema.index({ drawDate: 1, lotteryType: 1 }, { unique: true });

// Query indexes
XSMBDrawSchema.index({ status: 1, drawDate: -1 });
XSMBDrawSchema.index({ lotteryType: 1, drawDate: -1 });

export const XSMBDrawModel: Model<XSMBDrawDocument> =
  mongoose.models.XSMBDraw ||
  mongoose.model<XSMBDrawDocument>('XSMBDraw', XSMBDrawSchema, 'xsmb_draws');
