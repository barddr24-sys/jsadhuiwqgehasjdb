/**
 * XSMB REST API — Diagnostic Endpoint
 * GET /api/v1/xsmb/diagnostic
 *
 * Provides safe operational visibility for debugging and triage:
 * - Current Vietnam local time & business date (Asia/Ho_Chi_Minh)
 * - Draw schedule & phase
 * - MongoDB database connectivity & total record count
 * - Today's record presence & status
 * - Last synchronization run and attempt details
 *
 * Never exposes credentials, tokens, or private environment variables.
 */

import { NextRequest } from 'next/server';
import { xsmbAPIService } from '../../../../lib/services/xsmb-api.service';
import { apiSuccess, handleApiError } from '../../../../lib/api/api-response';

export async function GET(request?: NextRequest) {
  void request;
  try {
    const data = await xsmbAPIService.getDiagnostic();
    return apiSuccess(data, 200, {
      'Cache-Control': 'no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
