/**
 * Mongoose Model & Schema for Collection: `xsmb_sources`
 *
 * Stores external provider metadata.
 * Do NOT store API secrets or credentials.
 */

import mongoose, { Schema, type Model, type Document } from 'mongoose';
import type { IXSMBSource } from '../types/db-types';

export type XSMBSourceDocument = IXSMBSource & Document;

export const XSMBSourceSchema = new Schema<XSMBSourceDocument>(
  {
    providerId: {
      type: String,
      required: [true, 'providerId is required'],
      unique: true,
      trim: true,
      index: true,
    },
    providerName: {
      type: String,
      required: [true, 'providerName is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'type is required'],
      trim: true,
      default: 'API',
    },
    baseUrl: {
      type: String,
      required: [true, 'baseUrl is required'],
      trim: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    reliability: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
  },
  {
    collection: 'xsmb_sources',
    timestamps: true,
  }
);

export const XSMBSourceModel: Model<XSMBSourceDocument> =
  mongoose.models.XSMBSource ||
  mongoose.model<XSMBSourceDocument>(
    'XSMBSource',
    XSMBSourceSchema,
    'xsmb_sources'
  );
