/**
 * Protected Internal Sync Route Tests
 *
 * Validates authentication, secret protection, and sync delegation for /api/internal/xsmb/sync
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/internal/xsmb/sync/route';
import { xsmbSyncService } from '../../app/lib/sync/xsmb-sync.service';

vi.mock('../../app/lib/sync/xsmb-sync.service', () => ({
  xsmbSyncService: {
    syncDate: vi.fn(),
    enforceRetention: vi.fn().mockResolvedValue({ deletedDraws: 0, deletedRuns: 0, deletedAttempts: 0 }),
  },
}));

describe('Protected Internal Sync Route (/api/internal/xsmb/sync)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should reject unauthorized request with 401 when secret is configured', async () => {
    process.env.XSMB_CRON_SECRET = 'test-secret-token-123';

    const req = new NextRequest(new URL('http://localhost:3000/api/internal/xsmb/sync'));
    const response = await GET(req);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('should accept valid Bearer token authorization and trigger sync', async () => {
    process.env.XSMB_CRON_SECRET = 'test-secret-token-123';

    vi.mocked(xsmbSyncService.syncDate).mockResolvedValue({
      status: 'SUCCESS',
      date: '2026-09-02',
      syncRunId: 'run-test-1',
      lotteryType: 'XSMB',
      providerId: 'primary-web-provider',
      checksum: 'chk-abc',
      durationMs: 45,
    });

    const req = new NextRequest(new URL('http://localhost:3000/api/internal/xsmb/sync?date=2026-09-02'), {
      headers: {
        authorization: 'Bearer test-secret-token-123',
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.date).toBe('2026-09-02');
    expect(json.data.status).toBe('SUCCESS');
    expect(xsmbSyncService.syncDate).toHaveBeenCalledWith('2026-09-02');
  });

  it('should accept valid x-cron-secret custom header', async () => {
    process.env.XSMB_CRON_SECRET = 'my-custom-cron-key';

    vi.mocked(xsmbSyncService.syncDate).mockResolvedValue({
      status: 'NO_CHANGE',
      date: '2026-09-02',
      syncRunId: 'run-test-2',
      lotteryType: 'XSMB',
      providerId: 'primary-web-provider',
      durationMs: 30,
    });

    const req = new NextRequest(new URL('http://localhost:3000/api/internal/xsmb/sync'), {
      headers: {
        'x-cron-secret': 'my-custom-cron-key',
      },
    });

    const response = await GET(req);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('NO_CHANGE');
  });

  it('should return 502 when sync status is FAILED', async () => {
    process.env.XSMB_CRON_SECRET = 'secret';

    vi.mocked(xsmbSyncService.syncDate).mockResolvedValue({
      status: 'FAILED',
      errorMessage: 'Upstream provider timed out',
      date: '2026-09-02',
      syncRunId: 'run-test-3',
      lotteryType: 'XSMB',
      providerId: 'primary-web-provider',
      durationMs: 500,
    });

    const req = new NextRequest(new URL('http://localhost:3000/api/internal/xsmb/sync'), {
      headers: {
        authorization: 'Bearer secret',
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(502);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.data.errorMessage).toContain('Upstream provider timed out');
  });
});
