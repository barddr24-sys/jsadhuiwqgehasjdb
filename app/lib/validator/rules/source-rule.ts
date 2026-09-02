/**
 * Source Metadata Validation Rule
 *
 * Verifies data provenance:
 * - providerId
 * - sourceUrl
 * - fetchedAt timestamp validity and freshness
 */

import { MAX_CLOCK_SKEW_FUTURE_MS, MAX_FETCH_STALENESS_MS } from '../constants';
import type {
  XSMBValidationError,
  XSMBValidationWarning,
  XSMBValidationOptions,
} from '../types';

export interface SourceValidationOutcome {
  errors: XSMBValidationError[];
  warnings: XSMBValidationWarning[];
}

export function validateSourceRule(
  source: unknown,
  options?: XSMBValidationOptions
): SourceValidationOutcome {
  const errors: XSMBValidationError[] = [];
  const warnings: XSMBValidationWarning[] = [];
  const now = options?.now ? options.now.getTime() : Date.now();

  if (!source || typeof source !== 'object') {
    if (options?.strictSourceMetadata) {
      errors.push({
        code: 'INVALID_SOURCE',
        field: 'source',
        message: 'Source metadata object is missing or invalid.',
        actual: source,
      });
    } else {
      warnings.push({
        code: 'SOURCE_METADATA_INCOMPLETE',
        field: 'source',
        message: 'Source metadata is missing.',
      });
    }
    return { errors, warnings };
  }

  const srcObj = source as Record<string, unknown>;

  // Check providerId
  if (!srcObj.providerId || typeof srcObj.providerId !== 'string') {
    if (options?.strictSourceMetadata) {
      errors.push({
        code: 'INVALID_SOURCE',
        field: 'source.providerId',
        message: 'Missing or invalid providerId in source metadata.',
        actual: srcObj.providerId,
      });
    } else {
      warnings.push({
        code: 'SOURCE_METADATA_INCOMPLETE',
        field: 'source.providerId',
        message: 'providerId is missing from source metadata.',
      });
    }
  }

  // Check sourceUrl
  if (!srcObj.sourceUrl || typeof srcObj.sourceUrl !== 'string') {
    if (options?.strictSourceMetadata) {
      errors.push({
        code: 'INVALID_SOURCE',
        field: 'source.sourceUrl',
        message: 'Missing or invalid sourceUrl in source metadata.',
        actual: srcObj.sourceUrl,
      });
    } else {
      warnings.push({
        code: 'SOURCE_METADATA_INCOMPLETE',
        field: 'source.sourceUrl',
        message: 'sourceUrl is missing from source metadata.',
      });
    }
  }

  // Check fetchedAt
  if (!srcObj.fetchedAt) {
    if (options?.strictSourceMetadata) {
      errors.push({
        code: 'INVALID_SOURCE',
        field: 'source.fetchedAt',
        message: 'Missing fetchedAt timestamp in source metadata.',
      });
    } else {
      warnings.push({
        code: 'SOURCE_METADATA_INCOMPLETE',
        field: 'source.fetchedAt',
        message: 'fetchedAt timestamp is missing from source metadata.',
      });
    }
  } else {
    const fetchedAtDate = srcObj.fetchedAt instanceof Date ? srcObj.fetchedAt : new Date(srcObj.fetchedAt as string);
    if (isNaN(fetchedAtDate.getTime())) {
      errors.push({
        code: 'INVALID_SOURCE',
        field: 'source.fetchedAt',
        message: 'fetchedAt is not a valid Date timestamp.',
        actual: srcObj.fetchedAt,
      });
    } else {
      const fetchTime = fetchedAtDate.getTime();
      if (fetchTime > now + MAX_CLOCK_SKEW_FUTURE_MS) {
        warnings.push({
          code: 'FUTURE_FETCH_TIMESTAMP',
          field: 'source.fetchedAt',
          message: `fetchedAt timestamp (${fetchedAtDate.toISOString()}) is in the future.`,
          details: { fetchedAt: fetchedAtDate.toISOString(), currentTime: new Date(now).toISOString() },
        });
      } else if (now - fetchTime > MAX_FETCH_STALENESS_MS) {
        warnings.push({
          code: 'STALE_FETCH_TIMESTAMP',
          field: 'source.fetchedAt',
          message: `fetchedAt timestamp (${fetchedAtDate.toISOString()}) is older than 30 days.`,
          details: { fetchedAt: fetchedAtDate.toISOString(), ageDays: Math.round((now - fetchTime) / (24 * 3600 * 1000)) },
        });
      }
    }
  }

  return { errors, warnings };
}
