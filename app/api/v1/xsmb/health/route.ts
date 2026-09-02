/**
 * XSMB REST API — Health Check Endpoint
 * GET /api/v1/xsmb/health
 */

import { NextRequest } from 'next/server';
import { xsmbAPIService } from '../../../../lib/services/xsmb-api.service';
import { apiSuccess, handleApiError } from '../../../../lib/api/api-response';

export async function GET(request?: NextRequest) {
  void request;
  try {
    const data = await xsmbAPIService.getHealth();
    return apiSuccess(data, 200, {
      'Cache-Control': 'no-store, max-age=0',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
