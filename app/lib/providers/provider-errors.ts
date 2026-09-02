/**
 * XSMB Provider Layer Structured Errors
 *
 * Provides standardized, structured error classifications for all external data provider operations.
 * Ensures internal errors do NOT leak raw stack traces to higher application layers.
 */

export type XSMBProviderErrorCode =
  | 'SOURCE_TIMEOUT'
  | 'SOURCE_NETWORK_ERROR'
  | 'SOURCE_HTTP_ERROR'
  | 'SOURCE_BLOCKED'
  | 'SOURCE_NOT_FOUND'
  | 'SOURCE_EMPTY'
  | 'SOURCE_RESPONSE_TOO_LARGE'
  | 'INVALID_CONTENT_TYPE'
  | 'INVALID_DATE'
  | 'PROVIDER_CONFIG_ERROR'
  | 'RATE_LIMITED';

export interface XSMBProviderErrorPayload {
  code: XSMBProviderErrorCode;
  providerId: string;
  message: string;
  httpStatus?: number;
  sourceUrl?: string;
  requestedDate?: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export class XSMBProviderError extends Error {
  readonly code: XSMBProviderErrorCode;
  readonly providerId: string;
  readonly httpStatus?: number;
  readonly sourceUrl?: string;
  readonly requestedDate?: string;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(payload: XSMBProviderErrorPayload, cause?: unknown) {
    super(payload.message);
    this.name = 'XSMBProviderError';
    this.code = payload.code;
    this.providerId = payload.providerId;
    this.httpStatus = payload.httpStatus;
    this.sourceUrl = payload.sourceUrl;
    this.requestedDate = payload.requestedDate;
    this.retryable = payload.retryable;
    this.details = payload.details;

    if (cause !== undefined) {
      this.cause = cause;
    }

    // Maintain proper prototype chain for instanceof checks in all environments
    Object.setPrototypeOf(this, XSMBProviderError.prototype);
  }

  /**
   * Serializes the error to a clean, structured object safe for logging or API boundaries.
   */
  toJSON(): XSMBProviderErrorPayload {
    return {
      code: this.code,
      providerId: this.providerId,
      message: this.message,
      httpStatus: this.httpStatus,
      sourceUrl: this.sourceUrl,
      requestedDate: this.requestedDate,
      retryable: this.retryable,
      details: this.details,
    };
  }

  // ─── Factory Helpers ────────────────────────────────────────────────────────

  static timeout(providerId: string, sourceUrl: string, timeoutMs: number, requestedDate?: string, cause?: unknown): XSMBProviderError {
    return new XSMBProviderError(
      {
        code: 'SOURCE_TIMEOUT',
        providerId,
        message: `Provider request to ${sourceUrl} timed out after ${timeoutMs}ms`,
        sourceUrl,
        requestedDate,
        retryable: true,
        details: { timeoutMs },
      },
      cause
    );
  }

  static networkError(providerId: string, sourceUrl: string, originalMessage: string, requestedDate?: string, cause?: unknown): XSMBProviderError {
    return new XSMBProviderError(
      {
        code: 'SOURCE_NETWORK_ERROR',
        providerId,
        message: `Network connection to provider failed: ${originalMessage}`,
        sourceUrl,
        requestedDate,
        retryable: true,
      },
      cause
    );
  }

  static httpError(providerId: string, sourceUrl: string, status: number, statusText: string, requestedDate?: string): XSMBProviderError {
    const isTransient = [502, 503, 504].includes(status);
    return new XSMBProviderError({
      code: 'SOURCE_HTTP_ERROR',
      providerId,
      message: `Provider returned HTTP ${status} (${statusText})`,
      httpStatus: status,
      sourceUrl,
      requestedDate,
      retryable: isTransient,
      details: { statusText },
    });
  }

  static blocked(providerId: string, sourceUrl: string, status: number, requestedDate?: string): XSMBProviderError {
    return new XSMBProviderError({
      code: 'SOURCE_BLOCKED',
      providerId,
      message: `Provider request was blocked by the source (HTTP ${status})`,
      httpStatus: status,
      sourceUrl,
      requestedDate,
      retryable: false,
    });
  }

  static notFound(providerId: string, sourceUrl: string, requestedDate?: string): XSMBProviderError {
    return new XSMBProviderError({
      code: 'SOURCE_NOT_FOUND',
      providerId,
      message: `No lottery resource found at provider URL for date: ${requestedDate || 'unknown'}`,
      httpStatus: 404,
      sourceUrl,
      requestedDate,
      retryable: false,
    });
  }

  static emptyResponse(providerId: string, sourceUrl: string, requestedDate?: string): XSMBProviderError {
    return new XSMBProviderError({
      code: 'SOURCE_EMPTY',
      providerId,
      message: `Provider returned an empty response body for date: ${requestedDate || 'unknown'}`,
      sourceUrl,
      requestedDate,
      retryable: false,
    });
  }

  static responseTooLarge(providerId: string, sourceUrl: string, maxBytes: number, actualBytes?: number, requestedDate?: string): XSMBProviderError {
    return new XSMBProviderError({
      code: 'SOURCE_RESPONSE_TOO_LARGE',
      providerId,
      message: `Provider response exceeded maximum allowed limit of ${maxBytes} bytes${actualBytes ? ` (received ${actualBytes} bytes)` : ''}`,
      sourceUrl,
      requestedDate,
      retryable: false,
      details: { maxBytes, actualBytes },
    });
  }

  static invalidContentType(providerId: string, sourceUrl: string, receivedType: string, requestedDate?: string): XSMBProviderError {
    return new XSMBProviderError({
      code: 'INVALID_CONTENT_TYPE',
      providerId,
      message: `Provider returned unexpected content type: "${receivedType}". Expected HTML/text.`,
      sourceUrl,
      requestedDate,
      retryable: false,
      details: { receivedType },
    });
  }

  static invalidDate(providerId: string, invalidDate: string, reason?: string): XSMBProviderError {
    return new XSMBProviderError({
      code: 'INVALID_DATE',
      providerId,
      message: `Invalid draw date requested: "${invalidDate}". Date must be in valid YYYY-MM-DD format.${reason ? ` (${reason})` : ''}`,
      requestedDate: invalidDate,
      retryable: false,
      details: { invalidDate, reason },
    });
  }

  static configError(providerId: string, detail: string): XSMBProviderError {
    return new XSMBProviderError({
      code: 'PROVIDER_CONFIG_ERROR',
      providerId,
      message: `Provider configuration error: ${detail}`,
      retryable: false,
      details: { detail },
    });
  }

  static rateLimited(providerId: string, waitMs: number): XSMBProviderError {
    return new XSMBProviderError({
      code: 'RATE_LIMITED',
      providerId,
      message: `Provider rate limit exceeded. Please wait ${waitMs}ms before making another request.`,
      retryable: true,
      details: { waitMs },
    });
  }
}
