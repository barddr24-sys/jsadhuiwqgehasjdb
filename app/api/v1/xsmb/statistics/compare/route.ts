/**
 * XSMB REST API — Period Comparison Endpoint
 * GET /api/v1/xsmb/statistics/compare?rangeA=7days&rangeB=30days
 */

import { NextRequest } from 'next/server';
import { statisticsDeepService } from '../../../../../lib/services/statistics-deep.service';
import { apiSuccess, handleApiError } from '../../../../../lib/api/api-response';
import { validateStatisticsRangeParam } from '../../../../../lib/api/validators';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawRangeA = searchParams.get('rangeA') || searchParams.get('range1') || '7days';
    const rawRangeB = searchParams.get('rangeB') || searchParams.get('range2') || '30days';

    const rangeA = validateStatisticsRangeParam(rawRangeA, '7days');
    const rangeB = validateStatisticsRangeParam(rawRangeB, '30days');

    const data = await statisticsDeepService.comparePeriods(rangeA, rangeB);

    return apiSuccess(data, 200, {
      'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
