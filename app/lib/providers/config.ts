/**
 * XSMB Provider Configuration Loader & Validator
 *
 * Reads provider configuration from environment variables or custom overrides,
 * ensuring sensitive values are never hardcoded and invalid configurations fail fast.
 */

import { XSMBProviderConfig } from './types';
import { XSMBProviderError } from './provider-errors';

export const DEFAULT_PRIMARY_PROVIDER_ID = 'primary-web-provider';
export const DEFAULT_PRIMARY_PROVIDER_NAME = 'Primary Free Web XSMB Provider';
export const DEFAULT_PRIMARY_SOURCE_URL = 'https://xoso.com.vn/xsmb-{dd-mm-yyyy}.html';

export const DEFAULT_TIMEOUT_MS = 10000;
export const DEFAULT_MAX_RETRIES = 2;
export const DEFAULT_RETRY_DELAY_MS = 500;
export const DEFAULT_MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB
export const DEFAULT_MIN_REQUEST_INTERVAL_MS = 1000; // 1 second

/**
 * Validates an XSMBProviderConfig object for completeness and sanity.
 */
export function validateProviderConfig(config: XSMBProviderConfig): void {
  if (!config.providerId || typeof config.providerId !== 'string' || config.providerId.trim() === '') {
    throw XSMBProviderError.configError('unknown', 'providerId must be a non-empty string');
  }

  if (!config.baseUrl || typeof config.baseUrl !== 'string' || config.baseUrl.trim() === '') {
    throw XSMBProviderError.configError(config.providerId, 'baseUrl must be a non-empty URL or URL template');
  }

  // Ensure base URL starts with http:// or https://
  if (!config.baseUrl.startsWith('http://') && !config.baseUrl.startsWith('https://')) {
    throw XSMBProviderError.configError(
      config.providerId,
      `baseUrl must begin with http:// or https:// (received: "${config.baseUrl}")`
    );
  }

  if (typeof config.timeoutMs !== 'number' || config.timeoutMs <= 0) {
    throw XSMBProviderError.configError(config.providerId, 'timeoutMs must be a positive integer');
  }

  if (typeof config.maxRetries !== 'number' || config.maxRetries < 0) {
    throw XSMBProviderError.configError(config.providerId, 'maxRetries must be a non-negative integer');
  }

  if (typeof config.retryDelayMs !== 'number' || config.retryDelayMs < 0) {
    throw XSMBProviderError.configError(config.providerId, 'retryDelayMs must be a non-negative integer');
  }

  if (typeof config.maxResponseBytes !== 'number' || config.maxResponseBytes <= 0) {
    throw XSMBProviderError.configError(config.providerId, 'maxResponseBytes must be a positive integer');
  }

  if (typeof config.minRequestIntervalMs !== 'number' || config.minRequestIntervalMs < 0) {
    throw XSMBProviderError.configError(config.providerId, 'minRequestIntervalMs must be a non-negative integer');
  }
}

/**
 * Parses an integer environment variable with a fallback default.
 */
function parseEnvInt(val: string | undefined, fallback: number): number {
  if (!val) return fallback;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Loads the primary XSMB provider configuration from environment variables.
 */
export function getPrimaryProviderConfig(overrides: Partial<XSMBProviderConfig> = {}): XSMBProviderConfig {
  const config: XSMBProviderConfig = {
    providerId:
      overrides.providerId ||
      process.env.XSMB_PRIMARY_PROVIDER_ID ||
      DEFAULT_PRIMARY_PROVIDER_ID,

    providerName:
      overrides.providerName ||
      process.env.XSMB_PRIMARY_PROVIDER_NAME ||
      DEFAULT_PRIMARY_PROVIDER_NAME,

    baseUrl:
      overrides.baseUrl ||
      process.env.XSMB_PRIMARY_SOURCE_URL ||
      DEFAULT_PRIMARY_SOURCE_URL,

    timeoutMs:
      overrides.timeoutMs ??
      parseEnvInt(process.env.XSMB_HTTP_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),

    maxRetries:
      overrides.maxRetries ??
      parseEnvInt(process.env.XSMB_HTTP_MAX_RETRIES, DEFAULT_MAX_RETRIES),

    retryDelayMs:
      overrides.retryDelayMs ??
      parseEnvInt(process.env.XSMB_HTTP_RETRY_DELAY_MS, DEFAULT_RETRY_DELAY_MS),

    maxResponseBytes:
      overrides.maxResponseBytes ??
      parseEnvInt(process.env.XSMB_MAX_RESPONSE_BYTES, DEFAULT_MAX_RESPONSE_BYTES),

    minRequestIntervalMs:
      overrides.minRequestIntervalMs ??
      parseEnvInt(process.env.XSMB_MIN_REQUEST_INTERVAL_MS, DEFAULT_MIN_REQUEST_INTERVAL_MS),

    userAgent:
      overrides.userAgent ||
      process.env.XSMB_HTTP_USER_AGENT,
  };

  validateProviderConfig(config);
  return config;
}
