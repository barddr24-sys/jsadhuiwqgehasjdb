/**
 * XSMB REST API — Statistics Endpoint
 * GET /api/v1/xsmb/statistics?days=3
 * GET /api/v1/xsmb/statistics?days=7
 *
 * Computes 2-digit statistics from the latest N completed draws.
 * Only periods 3 and 7 are permitted.
 */

import { NextRequest } from 'next/server';
import { xsmbAPIService } from '../../../../lib/services/xsmb-api.service';
import { apiSuccess, handleApiError } from '../../../../lib/api/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days');

    const data = await xsmbAPIService.getStatistics(days);

    return apiSuccess(data, 200, {
      'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
