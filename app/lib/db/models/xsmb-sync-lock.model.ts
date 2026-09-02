/**
 * MongoDB Schema for XSMB Sync Distributed Locks (xsmb_sync_locks)
 *
 * Implements native MongoDB distributed locks for synchronization jobs.
 * Enforces uniqueness on `lockKey` and TTL expiration.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IXSMBSyncLock {
  lockKey: string;
  ownerId: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IXSMBSyncLockDocument extends IXSMBSyncLock, Document { }

const XSMBSyncLockSchema = new Schema<IXSMBSyncLockDocument>(
  {
    lockKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index automatically removes expired locks
    },
  },
  {
    collection: 'xsmb_sync_locks',
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for querying active/expired locks
XSMBSyncLockSchema.index({ lockKey: 1, expiresAt: 1 });

export const XSMBSyncLockModel: Model<IXSMBSyncLockDocument> =
  mongoose.models.XSMBSyncLock ||
  mongoose.model<IXSMBSyncLockDocument>('XSMBSyncLock', XSMBSyncLockSchema);
