/**
 * DEPRECATED — LEGACY DEV ENDPOINT (DATABASE-FIRST)
 * GET /api/xsmb/[date]
 *
 * NOTE: Refactored to read from MongoDB (L2) and in-memory cache (L1).
 * Synchronous external scraper calls have been completely removed.
 *
 * Canonical endpoint:
 * GET /api/v1/xsmb/results/[date]
 */

import { NextResponse } from 'next/server';
import type { XSMBResult, XSMBPrizes } from '@/app/lib/xsmb-types';
import { isFutureDate, isValidDateStr } from '@/app/lib/date-utils';
import { xsmbAPIService } from '@/app/lib/services/xsmb-api.service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;

  // Validate format
  if (!isValidDateStr(date)) {
    return NextResponse.json(
      { success: false, error: 'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD.' },
      { status: 400 }
    );
  }

  // Future date — return status only, no fetch needed
  if (isFutureDate(date)) {
    const result: XSMBResult = {
      date,
      status: 'FUTURE',
      prizes: null,
      specialPrize: null,
      updatedAt: null,
      isFromCache: false,
    };
    return NextResponse.json({ success: true, data: result });
  }

  // Database-First Read: Retrieve from MongoDB via service
  try {
    const dto = await xsmbAPIService.getDrawByDate(date);
    const r = dto.results;

    const prizes: XSMBPrizes | null = r
      ? {
          dacBiet: r.special || [],
          giaiNhat: r.firstPrize || [],
          giaiNhi: r.secondPrize || [],
          giaiBa: r.thirdPrize || [],
          giaiTu: r.fourthPrize || [],
          giaiNam: r.fifthPrize || [],
          giaiSau: r.sixthPrize || [],
          giaiBay: r.seventhPrize || [],
        }
      : null;

    const result: XSMBResult = {
      date,
      status: dto.status === 'READY' ? 'COMPLETED' : dto.status === 'PARTIAL' ? 'UPDATING' : 'EMPTY',
      prizes,
      specialPrize: prizes?.dacBiet?.[0] || null,
      updatedAt: dto.updatedAt,
      isFromCache: dto.sourceType === 'cache',
    };

    const maxAge = dto.isComplete ? 3600 : 30;
    return NextResponse.json(
      { success: true, data: result },
      {
        headers: {
          'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=60`,
          'X-Deprecated': 'true',
          'X-Canonical-Route': `/api/v1/xsmb/results/${date}`,
          'X-Data-Source': dto.sourceType || 'mongodb',
        },
      }
    );
  } catch {
    const result: XSMBResult = {
      date,
      status: 'EMPTY',
      prizes: null,
      specialPrize: null,
      updatedAt: null,
      isFromCache: false,
    };
    return NextResponse.json(
      { success: true, data: result },
      {
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=30',
          'X-Deprecated': 'true',
          'X-Canonical-Route': `/api/v1/xsmb/results/${date}`,
        },
      }
    );
  }
}
