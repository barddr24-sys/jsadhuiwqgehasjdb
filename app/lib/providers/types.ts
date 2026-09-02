/**
 * XSMB External Web Provider — Core Types & Contracts
 *
 * This layer is responsible ONLY for:
 * FETCH EXTERNAL SOURCE -> RETURN RAW RESPONSE
 *
 * It contains NO database writes, NO parsing logic, and NO UI state.
 */

/**
 * Raw XSMB provider response returned directly from external sources.
 * Serves as an intermediate representation for subsequent parser/normalizer layers.
 */
export interface RawXSMBResponse {
  /** Unique identifier of the provider that performed the fetch (e.g. "primary-web-provider") */
  providerId: string;

  /** Requested draw date in YYYY-MM-DD format */
  requestedDate: string;

  /** Exact timestamp when the response was fetched */
  fetchedAt: Date;

  /** HTTP response status code (e.g. 200) */
  httpStatus: number;

  /** Final resolved source URL that was fetched */
  sourceUrl: string;

  /** Content-Type header received from the server (e.g. "text/html; charset=UTF-8") */
  contentType?: string;

  /** Unmodified raw body received from the provider */
  rawBody: string;

  /** Duration of the HTTP request in milliseconds */
  durationMs: number;

  /** Selected response headers for diagnostics (sanitized, no sensitive cookies/tokens) */
  headers?: Record<string, string>;
}

/**
 * Lightweight health check status for provider monitoring.
 */
export interface ProviderHealth {
  providerId: string;
  providerName: string;
  available: boolean;
  latencyMs: number;
  checkedAt: Date;
  httpStatus?: number;
  error?: string;
}

/**
 * Structured request telemetry metadata (safe for production logging).
 */
export interface RequestMetadata {
  providerId: string;
  requestedDate?: string;
  sourceUrl: string;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  httpStatus?: number;
  attemptCount: number;
  resultStatus: 'SUCCESS' | 'ERROR' | 'RETRY';
  errorCode?: string;
}

/**
 * Structured logger interface for provider request telemetry.
 */
export interface ProviderLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug?(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Provider runtime configuration settings.
 */
export interface XSMBProviderConfig {
  /** Unique provider identifier */
  providerId: string;

  /** Human-readable provider display name */
  providerName: string;

  /** Base source URL or URL template with placeholders ({date}, {dd-mm-yyyy}, {ddmmyyyy}) */
  baseUrl: string;

  /** Request timeout in milliseconds (default: 10000ms) */
  timeoutMs: number;

  /** Maximum number of retry attempts for transient errors (default: 2) */
  maxRetries: number;

  /** Initial delay before first retry in milliseconds (default: 500ms) */
  retryDelayMs: number;

  /** Maximum allowed response size in bytes to prevent memory attacks (default: 2MB) */
  maxResponseBytes: number;

  /** Minimum interval between consecutive requests in milliseconds (default: 1000ms) */
  minRequestIntervalMs: number;

  /** Custom HTTP User-Agent header */
  userAgent?: string;
}

/**
 * HTTP Client abstraction request options.
 */
export interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  maxResponseBytes?: number;
  signal?: AbortSignal;
}

/**
 * Standard HTTP response representation.
 */
export interface HttpResponse {
  status: number;
  statusText: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
}
