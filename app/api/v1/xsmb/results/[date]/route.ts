/**
 * XSMB REST API — Result by Date Endpoint
 * GET /api/v1/xsmb/results/:date
 *
 * Returns normalized XSMB draw result for a specific YYYY-MM-DD date.
 */

import { NextRequest } from 'next/server';
import { xsmbAPIService } from '../../../../../lib/services/xsmb-api.service';
import { apiSuccess, handleApiError } from '../../../../../lib/api/api-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const data = await xsmbAPIService.getDrawByDate(date);

    return apiSuccess(data, 200, {
      'Cache-Control': data.isComplete
        ? 'public, max-age=3600, stale-while-revalidate=300'
        : 'public, max-age=30, stale-while-revalidate=30',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
