/**
 * XSMB REST API — History Endpoint
 * GET /api/v1/xsmb/history?page=1&pageSize=20
 *
 * Returns paginated historical draws sorted in descending order (newest first).
 */

import { NextRequest } from 'next/server';
import { xsmbAPIService } from '../../../../lib/services/xsmb-api.service';
import { apiPaginated, handleApiError } from '../../../../lib/api/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');
    const includeResults = searchParams.get('includeResults');

    const { items, pagination } = await xsmbAPIService.getHistory(page, pageSize, includeResults);

    return apiPaginated(items, pagination, 200, {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
