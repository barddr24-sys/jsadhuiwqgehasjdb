/**
 * DEPRECATED — LEGACY DEV ENDPOINT (DATABASE-FIRST)
 * GET /api/results/[date]
 *
 * NOTE: Refactored to read from MongoDB (L2) and in-memory cache (L1).
 * Production clients MUST use the canonical v1 API:
 * GET /api/v1/xsmb/results/[date]
 */

import { NextResponse } from 'next/server';
import { isValidDateStr, getDayOfWeekVN } from '@/app/lib/date-utils';
import { xsmbAPIService } from '@/app/lib/services/xsmb-api.service';
import type { XSMBPrizes } from '@/app/lib/xsmb-types';

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

    const [year, month, day] = date.split('-');
    const result = {
      date,
      dayOfWeek: getDayOfWeekVN(date),
      displayDate: `${day}/${month}/${year}`,
      status: dto.status === 'READY' ? 'COMPLETED' : dto.status === 'PARTIAL' ? 'UPDATING' : 'EMPTY',
      prizes,
      specialPrize: prizes?.dacBiet?.[0] || '—',
      specialTwoDigit: prizes?.dacBiet?.[0]?.slice(-2) || '—',
      updatedAt: dto.updatedAt,
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
    return NextResponse.json(
      { success: false, error: 'Không tìm thấy kết quả cho ngày này.' },
      { status: 404 }
    );
  }
}
