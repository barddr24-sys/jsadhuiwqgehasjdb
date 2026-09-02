/**
 * XSMB Protected Internal Synchronization Route
 *
 * Invoked by Vercel Cron (once per day at 11:15 UTC / 18:15 Vietnam time)
 * or secure internal triggers.
 *
 * Security:
 * - Requires Authorization: Bearer <XSMB_CRON_SECRET> header or CRON_SECRET matching.
 * - XSMB_CRON_SECRET is NEVER logged, exposed to clients, or included in responses.
 * - Rejects unauthorized requests with 401 Unauthorized.
 *
 * Architecture:
 * Vercel Cron (15 11 * * * UTC) -> Protected Internal Sync Route -> XSMBSyncService -> MongoDB Atlas
 *
 * Daily execution flow:
 *   1. Authenticate cron request (XSMB_CRON_SECRET / CRON_SECRET).
 *   2. Fetch and sync today's XSMB lottery result.
 *   3. Invalidate in-memory statistics cache.
 *   4. Enforce 30-day data retention (delete records older than 30 days).
 *   5. Return sanitized response.
 *
 * Supported modes (via query params):
 *   ?date=YYYY-MM-DD               -> single date sync (default: today)
 *   ?days=N                        -> batch sync last N days (up to 365)
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD -> batch sync date range
 */

import { NextRequest, NextResponse } from 'next/server';
import { xsmbSyncService } from '../../../../lib/sync/xsmb-sync.service';
import { getTodayVN, isValidDateStr } from '../../../../lib/date-utils';
import { StatisticsCacheService } from '../../../../lib/services/statistics-cache.service';

/**
 * Validates the authorization header against the configured server secret.
 */
function isAuthorized(request: NextRequest): boolean {
  const expectedSecret = process.env.XSMB_CRON_SECRET || process.env.CRON_SECRET;

  if (!expectedSecret) {
    // If no secret configured on server, reject all sync requests in production for security
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Internal Sync] Rejecting sync: XSMB_CRON_SECRET is not configured on server.');
      return false;
    }
    // In local development, allow if explicitly set or if local dev mode
    return true;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1] === expectedSecret;
    }
  }

  // Also support standard x-cron-secret header
  const customHeader = request.headers.get('x-cron-secret');
  if (customHeader === expectedSecret) {
    return true;
  }

  return false;
}

/**
 * Executes synchronization: single date, recent N days, or date range.
 */
async function handleSync(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing authorization secret.',
        },
      },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const startedAt = Date.now();

  // ── Batch mode: ?days=N ─────────────────────────────────────────────────
  const daysParam = searchParams.get('days') ?? searchParams.get('limit');
  if (daysParam) {
    const days = parseInt(daysParam, 10);
    if (isNaN(days) || days <= 0 || days > 365) {
      return NextResponse.json(
        { error: { code: 'INVALID_DAYS', message: 'days must be a positive integer between 1 and 365.' } },
        { status: 400 }
      );
    }

    try {
      const batchResult = await xsmbSyncService.syncRecentDraws(days, { rateLimitDelayMs: 200 });
      return NextResponse.json(
        {
          success: true,
          data: {
            mode: 'recent',
            days,
            totalRequested: batchResult.totalRequested,
            successful: batchResult.successful,
            noChange: batchResult.noChange,
            partial: batchResult.partial,
            failed: batchResult.failed,
            conflicts: batchResult.conflicts,
            durationMs: Date.now() - startedAt,
          },
        },
        { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        { success: false, error: { code: 'SYNC_EXECUTION_ERROR', message: msg, durationMs: Date.now() - startedAt } },
        { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }
  }

  // ── Batch mode: ?from=YYYY-MM-DD&to=YYYY-MM-DD ──────────────────────────
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  if (fromParam && toParam) {
    if (!isValidDateStr(fromParam) || !isValidDateStr(toParam)) {
      return NextResponse.json(
        { error: { code: 'INVALID_DATE_RANGE', message: 'from and to must be valid YYYY-MM-DD dates.' } },
        { status: 400 }
      );
    }
    if (fromParam > toParam) {
      return NextResponse.json(
        { error: { code: 'INVALID_DATE_RANGE', message: 'from must be earlier than or equal to to.' } },
        { status: 400 }
      );
    }

    try {
      const batchResult = await xsmbSyncService.syncDateRange(fromParam, toParam, { rateLimitDelayMs: 200 } as never);
      return NextResponse.json(
        {
          success: true,
          data: {
            mode: 'range',
            from: fromParam,
            to: toParam,
            totalRequested: batchResult.totalRequested,
            successful: batchResult.successful,
            noChange: batchResult.noChange,
            partial: batchResult.partial,
            failed: batchResult.failed,
            conflicts: batchResult.conflicts,
            durationMs: Date.now() - startedAt,
          },
        },
        { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        { success: false, error: { code: 'SYNC_EXECUTION_ERROR', message: msg, durationMs: Date.now() - startedAt } },
        { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }
  }

  // ── Single date mode: ?date=YYYY-MM-DD (default: today) ─────────────────
  const targetDate = searchParams.get('date') || getTodayVN();

  try {
    const syncResult = await xsmbSyncService.syncDate(targetDate);
    const durationMs = Date.now() - startedAt;

    // ── Post-sync: Invalidate statistics cache ─────────────────────────────
    // Ensures stale aggregations are not served after new draw data is ingested.
    if (syncResult.status === 'SUCCESS' || syncResult.status === 'NO_CHANGE') {
      StatisticsCacheService.invalidateAll();
    }

    // ── Post-sync: Enforce 30-day data retention ───────────────────────────
    // Deletes draws, sync runs, and sync attempts older than 30 days.
    // Runs concurrently and non-blocking; errors are logged but do not fail the response.
    // Only runs on a valid sync (not on FAILED), to avoid excessive DB load on failures.
    let retentionResult: { deletedDraws: number; deletedRuns: number; deletedAttempts: number } | null = null;
    if (syncResult.status !== 'FAILED') {
      try {
        retentionResult = await xsmbSyncService.enforceRetention(30);
        if (
          retentionResult.deletedDraws > 0 ||
          retentionResult.deletedRuns > 0 ||
          retentionResult.deletedAttempts > 0
        ) {
          console.log(
            `[Internal Sync] Retention cleanup: removed ${retentionResult.deletedDraws} draws, ` +
            `${retentionResult.deletedRuns} sync runs, ${retentionResult.deletedAttempts} sync attempts ` +
            `older than 30 days.`
          );
        }
      } catch (retentionError: unknown) {
        // Non-fatal: retention failure must not break the sync response.
        console.warn(
          '[Internal Sync] Retention cleanup failed (non-fatal):',
          retentionError instanceof Error ? retentionError.message : String(retentionError)
        );
      }
    }

    return NextResponse.json(
      {
        success: syncResult.status !== 'FAILED',
        data: {
          mode: 'single',
          date: syncResult.date,
          status: syncResult.status,
          syncRunId: syncResult.syncRunId,
          lotteryType: syncResult.lotteryType,
          checksum: syncResult.checksum,
          isChanged: syncResult.status === 'SUCCESS',
          errorMessage: syncResult.errorMessage,
          durationMs,
          ...(retentionResult !== null ? { retention: retentionResult } : {}),
        },
      },
      {
        status: syncResult.status === 'FAILED' ? 502 : 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  } catch (error: unknown) {
    const durationMs = Date.now() - startedAt;
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SYNC_EXECUTION_ERROR',
          message: 'An error occurred during synchronization execution.',
          details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined,
          durationMs,
        },
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}

