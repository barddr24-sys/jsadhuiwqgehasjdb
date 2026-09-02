/**
 * XSMB REST API — Last Two-Digit Results Table Endpoint
 * GET /api/v1/xsmb/two-digit-table?range=today|yesterday|7days|30days
 *
 * Computes frequency and appearance breakdown for all 100 two-digit pairs (00-99)
 * from MongoDB XSMB lottery results.
 */

import { NextRequest } from 'next/server';
import { xsmbAPIService } from '../../../../lib/services/xsmb-api.service';
import { apiSuccess, handleApiError } from '../../../../lib/api/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range');

    const data = await xsmbAPIService.getTwoDigitTable(range);

    // Dynamic cache: today is cached briefly (30s) during draw, historical ranges longer
    const maxAge = data.range === 'today' ? 30 : 180;

    return apiSuccess(data, 200, {
      'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=300`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
