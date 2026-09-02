/**
 * XSMB REST API — Today Endpoint
 * GET /api/v1/xsmb/today
 *
 * Returns the latest XSMB draw for the current Vietnam business date.
 */

import { NextRequest } from 'next/server';
import { xsmbAPIService } from '../../../../lib/services/xsmb-api.service';
import { apiSuccess, handleApiError } from '../../../../lib/api/api-response';

export async function GET(request?: NextRequest) {
  void request;
  try {
    const data = await xsmbAPIService.getTodayDraw();
    return apiSuccess(data, 200, {
      'Cache-Control': data.isComplete
        ? 'public, max-age=300, stale-while-revalidate=60'
        : 'public, max-age=15, stale-while-revalidate=15',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
