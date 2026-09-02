/**
 * XSMB REST API Response & Error Handling Standards
 *
 * Enforces unified response envelope:
 * Success:   { data: T } or { data: T[], pagination: PaginationMeta }
 * Error:     { error: { code: string, message: string, details?: unknown } }
 */

import { NextResponse } from 'next/server';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiPaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
}

/**
 * Custom API Error class with predefined status codes and stable error codes.
 */
export class XSMBAPIError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(code: string, message: string, statusCode: number = 400, details?: unknown) {
    super(message);
    this.name = 'XSMBAPIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, XSMBAPIError.prototype);
  }

  static badRequest(code: string, message: string, details?: unknown): XSMBAPIError {
    return new XSMBAPIError(code, message, 400, details);
  }

  static notFound(code: string = 'XSMB_RESULT_NOT_FOUND', message: string = 'XSMB result not found'): XSMBAPIError {
    return new XSMBAPIError(code, message, 404);
  }

  static conflict(code: string = 'XSMB_CONFLICT', message: string = 'Conflict detected in XSMB data'): XSMBAPIError {
    return new XSMBAPIError(code, message, 409);
  }

  static rateLimit(message: string = 'Too many requests, please try again later'): XSMBAPIError {
    return new XSMBAPIError('RATE_LIMIT_EXCEEDED', message, 429);
  }

  static serviceUnavailable(message: string = 'Database or service temporarily unavailable'): XSMBAPIError {
    return new XSMBAPIError('DATABASE_UNAVAILABLE', message, 503);
  }

  static internal(message: string = 'Internal server error'): XSMBAPIError {
    return new XSMBAPIError('INTERNAL_SERVER_ERROR', message, 500);
  }
}

/**
 * Helper to construct standard JSON success response.
 */
export function apiSuccess<T>(
  data: T,
  statusCode: number = 200,
  headers?: Record<string, string>
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    { data },
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}

/**
 * Helper to construct standard JSON paginated response.
 */
export function apiPaginated<T>(
  data: T[],
  pagination: PaginationMeta,
  statusCode: number = 200,
  headers?: Record<string, string>
): NextResponse<ApiPaginatedResponse<T>> {
  return NextResponse.json(
    {
      data,
      pagination,
    },
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}

/**
 * Helper to construct standard JSON error response.
 */
export function apiError(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: unknown,
  headers?: Record<string, string>
): NextResponse<ApiErrorResponse> {
  const payload: ApiErrorResponse = {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };

  return NextResponse.json(payload, {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Global error mapper for route handlers.
 * Sanitizes errors and hides stack traces / internal MongoDB connection info.
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof XSMBAPIError) {
    return apiError(error.code, error.message, error.statusCode, error.details);
  }

  // Handle MongoDB / Mongoose connection errors safely
  const errMessage = error instanceof Error ? error.message : String(error);

  if (
    errMessage.includes('ECONNREFUSED') ||
    errMessage.includes('MongoServerSelectionError') ||
    errMessage.includes('topology was closed') ||
    errMessage.includes('buffering timed out')
  ) {
    return apiError(
      'DATABASE_UNAVAILABLE',
      'Database service is currently unreachable',
      503
    );
  }

  // Generic internal server error (never leak internal details)
  return apiError(
    'INTERNAL_SERVER_ERROR',
    'An unexpected error occurred while processing the request',
    500
  );
}
