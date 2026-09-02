/**
 * DEPRECATED — LEGACY DEV ENDPOINT
 * GET /api/history?limit=10&offset=0&search=YYYY-MM-DD
 *
 * NOTE: This is a legacy development endpoint operating on in-memory history-engine.
 * Production clients MUST use the canonical v1 API:
 * GET /api/v1/xsmb/history?page=1&pageSize=20
 */

import { NextResponse } from 'next/server';
import { getHistoryList, normalizeDateSearch } from '@/app/lib/history-engine';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const rawSearch = searchParams.get('search') || '';

  const searchDate = rawSearch ? normalizeDateSearch(rawSearch) || undefined : undefined;

  const result = getHistoryList({
    limit,
    offset,
    searchDate,
  });

  return NextResponse.json(
    {
      success: true,
      data: result,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        'X-Deprecated': 'true',
        'X-Canonical-Route': '/api/v1/xsmb/history',
      },
    }
  );
}
