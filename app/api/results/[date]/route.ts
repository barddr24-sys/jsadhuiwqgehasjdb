/**
 * DEPRECATED — LEGACY DEV ENDPOINT
 * GET /api/results/[date]
 *
 * NOTE: This is a legacy development endpoint operating on in-memory history-engine.
 * Production clients MUST use the canonical v1 API:
 * GET /api/v1/xsmb/results/[date]
 */

import { NextResponse } from 'next/server';
import { getHistoryDetail } from '@/app/lib/history-engine';
import { isValidDateStr } from '@/app/lib/date-utils';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;

  if (!isValidDateStr(date)) {
    return NextResponse.json(
      { success: false, error: 'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD.' },
      { status: 400 }
    );
  }

  const result = getHistoryDetail(date);

  const maxAge = result.status === 'COMPLETED' ? 300 : 15;

  return NextResponse.json(
    { success: true, data: result },
    {
      headers: {
        'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=60`,
        'X-Deprecated': 'true',
        'X-Canonical-Route': `/api/v1/xsmb/results/${date}`,
      },
    }
  );
}
