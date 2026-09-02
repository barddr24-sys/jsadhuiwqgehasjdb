/**
 * XSMB REST API — Special Prize Last Two Digits Statistics Endpoint
 * GET /api/v1/xsmb/statistics/special-last-two?range=30days
 */

import { NextRequest } from 'next/server';
import { statisticsDeepService } from '../../../../../lib/services/statistics-deep.service';
import { apiSuccess, handleApiError } from '../../../../../lib/api/api-response';
import { validateStatisticsRangeParam } from '../../../../../lib/api/validators';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawRange = searchParams.get('range') || searchParams.get('days');
    const range = validateStatisticsRangeParam(rawRange, '30days');

    const data = await statisticsDeepService.getSpecialPrizeAnalysis(range);

    return apiSuccess(data, 200, {
      'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
