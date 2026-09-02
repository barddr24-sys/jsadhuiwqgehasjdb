/**
 * Mongoose Model & Schema for Collection: `xsmb_sync_runs`
 *
 * Stores synchronization run logs for future external sync system.
 */

import mongoose, { Schema, type Model, type Document } from 'mongoose';
import {
  SYNC_RUN_STATUS,
  VALID_SYNC_RUN_STATUSES,
} from '../config/status-config';
import type { IXSMBSyncRun } from '../types/db-types';

export type XSMBSyncRunDocument = IXSMBSyncRun & Document;

export const XSMBSyncRunSchema = new Schema<XSMBSyncRunDocument>(
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
      enum: VALID_SYNC_RUN_STATUSES,
      default: SYNC_RUN_STATUS.RUNNING,
      index: true,
    },
    recordsFetched: {
      type: Number,
      default: 0,
    },
    recordsAccepted: {
      type: Number,
      default: 0,
    },
    recordsRejected: {
      type: Number,
      default: 0,
    },
    conflicts: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      trim: true,
    },
  },
  {
    collection: 'xsmb_sync_runs',
    timestamps: true,
  }
);

// Index for query performance on recent runs
XSMBSyncRunSchema.index({ providerId: 1, startedAt: -1 });

export const XSMBSyncRunModel: Model<XSMBSyncRunDocument> =
  mongoose.models.XSMBSyncRun ||
  mongoose.model<XSMBSyncRunDocument>(
    'XSMBSyncRun',
    XSMBSyncRunSchema,
    'xsmb_sync_runs'
  );
