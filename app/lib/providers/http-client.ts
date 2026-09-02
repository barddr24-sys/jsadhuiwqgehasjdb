/**
 * Resilient HTTP Client for XSMB Web Providers
 *
 * Implements production-grade web ingestion protections:
 * 1. Abortable timeouts (AbortController)
 * 2. Bounded retries with exponential backoff and randomized jitter
 * 3. Strict retry classification (transient errors only, no retry on 4xx)
 * 4. Response size protection (prevents memory attacks from oversized payloads)
 * 5. Content-Type validation (rejects binary/unexpected formats)
 * 6. Rate limiting / request spacing (respectful to external free sources)
 * 7. Structured request telemetry & sanitized logging
 */

import {
  HttpRequestOptions,
  HttpResponse,
  ProviderLogger,
  RequestMetadata,
} from './types';
import { XSMBProviderError } from './provider-errors';

export interface IHttpClient {
  get(url: string, options?: HttpRequestOptions): Promise<HttpResponse>;
}

export interface HttpClientConfig {
  providerId?: string;
  defaultTimeoutMs?: number;
  defaultMaxRetries?: number;
  defaultRetryDelayMs?: number;
  defaultMaxResponseBytes?: number;
  minRequestIntervalMs?: number;
  defaultUserAgent?: string;
  fetchFn?: typeof fetch;
  logger?: ProviderLogger;
}

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const ALLOWED_CONTENT_TYPES = [
  'text/html',
  'text/plain',
  'application/xhtml+xml',
  'application/xml',
  'text/xml',
  'application/json',
];

/**
 * Utility to calculate exponential backoff delay with random jitter.
 */
export function calculateBackoff(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs = 5000
): number {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * (baseDelayMs * 0.5);
  return Math.min(exponential + jitter, maxDelayMs);
}

/**
 * Utility to sleep for a given duration.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class FetchHttpClient implements IHttpClient {
  private readonly providerId: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly maxResponseBytes: number;
  private readonly minRequestIntervalMs: number;
  private readonly userAgent: string;
  private readonly fetchFn: typeof fetch;
  private readonly logger?: ProviderLogger;
  private lastRequestTime = 0;

  constructor(config: HttpClientConfig = {}) {
    this.providerId = config.providerId || 'xsmb-http-client';
    this.timeoutMs = config.defaultTimeoutMs ?? 10000;
    this.maxRetries = config.defaultMaxRetries ?? 2;
    this.retryDelayMs = config.defaultRetryDelayMs ?? 500;
    this.maxResponseBytes = config.defaultMaxResponseBytes ?? 2 * 1024 * 1024; // 2MB
    this.minRequestIntervalMs = config.minRequestIntervalMs ?? 1000;
    this.userAgent = config.defaultUserAgent || DEFAULT_USER_AGENT;
    this.fetchFn = config.fetchFn || globalThis.fetch;
    this.logger = config.logger;
  }

  /**
   * Enforces minimum request interval to avoid flooding the external source.
   */
  private async throttle(): Promise<void> {
    if (this.minRequestIntervalMs <= 0) return;
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestIntervalMs) {
      const waitMs = this.minRequestIntervalMs - elapsed;
      await sleep(waitMs);
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Validates received Content-Type header against acceptable web formats.
   */
  private validateContentType(contentType: string | null, url: string): void {
    if (!contentType) return; // Allow if header is absent
    const lower = contentType.toLowerCase().trim();
    const isAllowed = ALLOWED_CONTENT_TYPES.some((allowed) => lower.includes(allowed));
    if (!isAllowed) {
      throw XSMBProviderError.invalidContentType(this.providerId, url, contentType);
    }
  }

  /**
   * Validates Content-Length header against max allowed response size.
   */
  private validateContentLength(contentLength: string | null, maxBytes: number, url: string): void {
    if (!contentLength) return;
    const len = parseInt(contentLength, 10);
    if (!isNaN(len) && len > maxBytes) {
      throw XSMBProviderError.responseTooLarge(this.providerId, url, maxBytes, len);
    }
  }

  /**
   * Executes an HTTP GET request with timeout, retry loop, and security bounds.
   */
  async get(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;
    const maxRetries = options.maxRetries ?? this.maxRetries;
    const retryDelayMs = options.retryDelayMs ?? this.retryDelayMs;
    const maxResponseBytes = options.maxResponseBytes ?? this.maxResponseBytes;

    let lastError: unknown;
    let attempt = 0;

    while (attempt <= maxRetries) {
      const startedAt = new Date();
      attempt++;

      await this.throttle();

      const controller = new AbortController();
      const timeoutTimer = setTimeout(() => {
        controller.abort(new Error(`Timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      // Link external signal if provided
      if (options.signal) {
        options.signal.addEventListener('abort', () => controller.abort(options.signal?.reason), { once: true });
      }

      try {
        const headers: Record<string, string> = {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          ...(options.headers || {}),
        };

        const response = await this.fetchFn(url, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutTimer);
        const finishedAt = new Date();
        const durationMs = finishedAt.getTime() - startedAt.getTime();

        const status = response.status;
        const statusText = response.statusText || '';
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');

        // Check content-type
        this.validateContentType(contentType, url);

        // Check content-length header
        this.validateContentLength(contentLength, maxResponseBytes, url);

        // Classify non-2xx HTTP status
        if (status === 403 || status === 429) {
          throw XSMBProviderError.blocked(this.providerId, url, status);
        }
        if (status === 404) {
          throw XSMBProviderError.notFound(this.providerId, url);
        }
        if (status < 200 || status >= 300) {
          throw XSMBProviderError.httpError(this.providerId, url, status, statusText);
        }

        // Read response body with size limit guard
        const bodyText = await response.text();
        const bodyByteLength = new TextEncoder().encode(bodyText).length;

        if (bodyByteLength > maxResponseBytes) {
          throw XSMBProviderError.responseTooLarge(this.providerId, url, maxResponseBytes, bodyByteLength);
        }

        // Extract clean headers for response object
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((val, key) => {
          // Do not expose set-cookie or sensitive headers
          if (!key.toLowerCase().includes('cookie') && !key.toLowerCase().includes('auth')) {
            responseHeaders[key] = val;
          }
        });

        const httpResponse: HttpResponse = {
          status,
          statusText,
          url: response.url || url,
          headers: responseHeaders,
          body: bodyText,
          durationMs,
        };

        this.logTelemetry({
          providerId: this.providerId,
          sourceUrl: url,
          startedAt,
          finishedAt,
          durationMs,
          httpStatus: status,
          attemptCount: attempt,
          resultStatus: 'SUCCESS',
        });

        return httpResponse;
      } catch (err: unknown) {
        clearTimeout(timeoutTimer);
        const finishedAt = new Date();
        const durationMs = finishedAt.getTime() - startedAt.getTime();

        const normalizedError = this.normalizeError(err, url, timeoutMs);
        lastError = normalizedError;

        const isRetryable = normalizedError.retryable && attempt <= maxRetries;

        this.logTelemetry({
          providerId: this.providerId,
          sourceUrl: url,
          startedAt,
          finishedAt,
          durationMs,
          httpStatus: normalizedError.httpStatus,
          attemptCount: attempt,
          resultStatus: isRetryable ? 'RETRY' : 'ERROR',
          errorCode: normalizedError.code,
        });

        if (isRetryable) {
          const backoffDelay = calculateBackoff(attempt - 1, retryDelayMs);
          this.logger?.warn?.(
            `[${this.providerId}] Transient error on attempt ${attempt}/${maxRetries + 1} (${normalizedError.code}). Retrying in ${Math.round(backoffDelay)}ms...`
          );
          await sleep(backoffDelay);
          continue;
        }

        throw normalizedError;
      }
    }

    // If loop exhausted
    if (lastError instanceof XSMBProviderError) {
      throw lastError;
    }
    throw XSMBProviderError.networkError(this.providerId, url, 'Max retry attempts exhausted', undefined, lastError);
  }

  /**
   * Normalizes arbitrary fetch/network errors into structured XSMBProviderError instances.
   */
  private normalizeError(err: unknown, url: string, timeoutMs: number): XSMBProviderError {
    if (err instanceof XSMBProviderError) {
      return err;
    }

    const errObj = err as { name?: string; message?: string; code?: string };
    const errName = errObj?.name || '';
    const errMsg = errObj?.message || String(err);

    // Timeout / Abort errors
    if (
      errName === 'AbortError' ||
      errName === 'TimeoutError' ||
      errMsg.toLowerCase().includes('timeout') ||
      errMsg.toLowerCase().includes('aborted')
    ) {
      return XSMBProviderError.timeout(this.providerId, url, timeoutMs, undefined, err);
    }

    // Network failures
    return XSMBProviderError.networkError(this.providerId, url, errMsg, undefined, err);
  }

  /**
   * Emits sanitized request telemetry metadata.
   */
  private logTelemetry(meta: RequestMetadata): void {
    if (!this.logger) return;
    if (meta.resultStatus === 'SUCCESS') {
      this.logger.info(`[${meta.providerId}] Request success: ${meta.sourceUrl} (${meta.durationMs}ms, HTTP ${meta.httpStatus})`, meta as unknown as Record<string, unknown>);
    } else if (meta.resultStatus === 'RETRY') {
      this.logger.warn(`[${meta.providerId}] Request retry triggered: ${meta.sourceUrl} (${meta.errorCode})`, meta as unknown as Record<string, unknown>);
    } else {
      this.logger.error(`[${meta.providerId}] Request failed: ${meta.sourceUrl} (${meta.errorCode})`, meta as unknown as Record<string, unknown>);
    }
  }
}
