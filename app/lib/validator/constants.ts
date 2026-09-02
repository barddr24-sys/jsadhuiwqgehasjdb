/**
 * Strict XSMB Validator Constants
 */

export const XSMB_VALIDATOR_VERSION = '1.0.0';

/**
 * Strict ISO Date regex: YYYY-MM-DD
 */
export const STRICT_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Strict numeric-only string regex: digits only, no symbols, spaces, or letters
 */
export const NUMERIC_ONLY_REGEX = /^\d+$/;

/**
 * Maximum clock skew allowed for fetchedAt before issuing future timestamp warning (1 hour)
 */
export const MAX_CLOCK_SKEW_FUTURE_MS = 60 * 60 * 1000;

/**
 * Maximum staleness allowed for fetchedAt before issuing stale timestamp warning (30 days)
 */
export const MAX_FETCH_STALENESS_MS = 30 * 24 * 60 * 60 * 1000;
