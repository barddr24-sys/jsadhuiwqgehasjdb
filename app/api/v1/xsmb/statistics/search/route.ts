/**
 * XSMB REST API — Global Number Deep Search Endpoint
 * GET /api/v1/xsmb/statistics/search?number=27&range=30days
 */

import { NextRequest } from 'next/server';
import { statisticsDeepService } from '../../../../../lib/services/statistics-deep.service';
import { apiSuccess, handleApiError } from '../../../../../lib/api/api-response';
import { validateNumberParam, validateStatisticsRangeParam } from '../../../../../lib/api/validators';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawNumber = searchParams.get('number');
    const rawRange = searchParams.get('range') || searchParams.get('days');

    const number = validateNumberParam(rawNumber);
    const range = validateStatisticsRangeParam(rawRange, '30days');

    const data = await statisticsDeepService.searchNumber(number, range);

    return apiSuccess(data, 200, {
      'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
