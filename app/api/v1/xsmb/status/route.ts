/**
 * XSMB REST API — Draw Status Endpoint
 * GET /api/v1/xsmb/status
 *
 * Returns current draw lifecycle status, progress percentage,
 * available tiers, and freshness for Screen 1.
 */

import { NextRequest } from 'next/server';
import { xsmbAPIService } from '../../../../lib/services/xsmb-api.service';
import { apiSuccess, handleApiError } from '../../../../lib/api/api-response';

export async function GET(request?: NextRequest) {
  void request;
  try {
    const data = await xsmbAPIService.getStatus();

    return apiSuccess(data, 200, {
      'Cache-Control': data.status === 'READY'
        ? 'public, max-age=300, stale-while-revalidate=60'
        : 'public, max-age=10, stale-while-revalidate=10',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
