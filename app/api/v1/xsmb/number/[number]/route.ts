/**
 * XSMB REST API — Number Detail Endpoint
 * GET /api/v1/xsmb/number/:number?days=7
 *
 * Computes appearance history, multi-tier prize matches, and frequency
 * for a 2-digit number (00–99).
 */

import { NextRequest } from 'next/server';
import { xsmbAPIService } from '../../../../../lib/services/xsmb-api.service';
import { apiSuccess, handleApiError } from '../../../../../lib/api/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params;
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days');

    const data = await xsmbAPIService.getNumberDetail(number, days);

    return apiSuccess(data, 200, {
      'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
