/**
 * Mongoose Model & Schema for Collection: `xsmb_sync_attempts`
 *
 * Stores granular synchronization attempt logs per date fetch execution.
 */

import mongoose, { Schema, type Model, type Document } from 'mongoose';
import type { IXSMBSyncAttempt } from '../types/db-types';

export type XSMBSyncAttemptDocument = IXSMBSyncAttempt & Document;

export const XSMBSyncAttemptSchema = new Schema<XSMBSyncAttemptDocument>(
  {
    syncRunId: {
      type: String,
      required: [true, 'syncRunId is required'],
      trim: true,
      index: true,
    },
    providerId: {
      type: String,
      required: [true, 'providerId is required'],
      trim: true,
      index: true,
    },
    requestedDate: {
      type: String,
      required: [true, 'requestedDate is required'],
      trim: true,
      index: true,
    },
    startedAt: {
      type: Date,
      required: [true, 'startedAt is required'],
      default: Date.now,
      index: true,
    },
    finishedAt: {
      type: Date,
    },
    status: {
      type: String,
      required: [true, 'status is required'],
      enum: ['SUCCESS', 'NO_CHANGE', 'PARTIAL', 'FAILED', 'CONFLICT'],
      index: true,
    },
    httpStatus: {
      type: Number,
    },
    responseHash: {
      type: String,
      trim: true,
    },
    errorCode: {
      type: String,
      trim: true,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
  },
  {
    collection: 'xsmb_sync_attempts',
    timestamps: true,
  }
);

// Indexes for fast history queries and audit monitoring
XSMBSyncAttemptSchema.index({ providerId: 1, requestedDate: 1, startedAt: -1 });
XSMBSyncAttemptSchema.index({ requestedDate: 1, status: 1 });

export const XSMBSyncAttemptModel: Model<XSMBSyncAttemptDocument> =
  mongoose.models.XSMBSyncAttempt ||
  mongoose.model<XSMBSyncAttemptDocument>(
    'XSMBSyncAttempt',
    XSMBSyncAttemptSchema,
    'xsmb_sync_attempts'
  );
