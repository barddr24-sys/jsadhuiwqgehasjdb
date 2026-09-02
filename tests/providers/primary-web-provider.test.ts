import { describe, it, expect, vi } from 'vitest';
import { PrimaryWebXSMBProvider } from '../../app/lib/providers/primary-web-provider';
import { XSMBProviderError } from '../../app/lib/providers/provider-errors';
import { IHttpClient } from '../../app/lib/providers/http-client';
import { HttpResponse } from '../../app/lib/providers/types';
import { getTodayVN } from '../../app/lib/date-utils';

describe('PrimaryWebXSMBProvider', () => {
  const SAMPLE_HTML = `
    <!DOCTYPE html>
    <html lang="vi">
    <head><title>XSMB Kết Quả Xổ Số Miền Bắc</title></head>
    <body>
      <div class="box-ketqua">
        <span class="special-prize">85429</span>
        <span class="first-prize">36192</span>
      </div>
    </body>
    </html>
  `.trim();

  function createMockHttpClient(response: Partial<HttpResponse> = {}): IHttpClient {
    return {
      get: vi.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        url: 'https://xoso.com.vn/xsmb-02-09-2026.html',
        headers: {
          'content-type': 'text/html; charset=UTF-8',
          'content-length': String(SAMPLE_HTML.length),
        },
        body: SAMPLE_HTML,
        durationMs: 42,
        ...response,
      }),
    };
  }

  describe('fetchByDate', () => {
    it('should successfully fetch and return RawXSMBResponse contract', async () => {
      const mockClient = createMockHttpClient();
      const provider = new PrimaryWebXSMBProvider(
        {
          baseUrl: 'https://xoso.com.vn/xsmb-{dd-mm-yyyy}.html',
        },
        mockClient
      );

      const result = await provider.fetchByDate('2026-09-02');

      expect(result.providerId).toBe('primary-web-provider');
      expect(result.requestedDate).toBe('2026-09-02');
      expect(result.httpStatus).toBe(200);
      expect(result.sourceUrl).toBe('https://xoso.com.vn/xsmb-02-09-2026.html');
      expect(result.contentType).toBe('text/html; charset=UTF-8');
      expect(result.rawBody).toBe(SAMPLE_HTML);
      expect(result.fetchedAt).toBeInstanceOf(Date);
      expect(result.durationMs).toBe(42);

      // Verify the URL was properly formatted and called
      expect(mockClient.get).toHaveBeenCalledWith(
        'https://xoso.com.vn/xsmb-02-09-2026.html',
        expect.objectContaining({
          timeoutMs: 10000,
          maxRetries: 2,
        })
      );
    });

    it('should throw SOURCE_EMPTY if the response body is empty or whitespace', async () => {
      const mockClient = createMockHttpClient({ body: '   \n  ' });
      const provider = new PrimaryWebXSMBProvider({}, mockClient);

      try {
        await provider.fetchByDate('2026-09-02');
        expect.fail('Expected to throw');
      } catch (err: unknown) {
        const provErr = err as XSMBProviderError;
        expect(provErr.code).toBe('SOURCE_EMPTY');
        expect(provErr.requestedDate).toBe('2026-09-02');
      }
    });
  });

  describe('fetchToday', () => {
    it('should automatically compute Vietnam today date (Asia/Ho_Chi_Minh)', async () => {
      const mockClient = createMockHttpClient();
      const provider = new PrimaryWebXSMBProvider({}, mockClient);

      const todayVN = getTodayVN();
      const result = await provider.fetchToday();

      expect(result.requestedDate).toBe(todayVN);
      expect(mockClient.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Date Validation & SSRF Prevention', () => {
    const provider = new PrimaryWebXSMBProvider({}, createMockHttpClient());

    it('should reject malformed date formats', async () => {
      const invalidDates = [
        '02/09/2026',
        '2026/09/02',
        '02-09-2026',
        '2026.09.02',
        '20260902',
        'invalid-date',
        '',
      ];

      for (const date of invalidDates) {
        await expect(provider.fetchByDate(date)).rejects.toThrow(XSMBProviderError);
        try {
          await provider.fetchByDate(date);
        } catch (err: unknown) {
          const provErr = err as XSMBProviderError;
          expect(provErr.code).toBe('INVALID_DATE');
          expect(provErr.retryable).toBe(false);
        }
      }
    });

    it('should reject invalid calendar dates (e.g. Feb 30, Month 13)', async () => {
      const invalidCalendarDates = [
        '2026-02-30',
        '2026-04-31',
        '2025-02-29', // Non-leap year
        '2026-13-01',
      ];

      for (const date of invalidCalendarDates) {
        await expect(provider.fetchByDate(date)).rejects.toThrow(XSMBProviderError);
      }
    });

    it('should reject SSRF / injection patterns', async () => {
      const ssrfPayloads = [
        'http://169.254.169.254/latest/meta-data',
        '../../../../etc/passwd',
        '2026-09-02/../../admin',
        '<script>alert(1)</script>',
        '2026-09-02; DROP TABLE',
      ];

      for (const payload of ssrfPayloads) {
        await expect(provider.fetchByDate(payload)).rejects.toThrow(XSMBProviderError);
      }
    });
  });

  describe('URL Construction Templates', () => {
    it('should construct correct URL with {dd-mm-yyyy}', async () => {
      const mockClient = createMockHttpClient();
      const provider = new PrimaryWebXSMBProvider(
        { baseUrl: 'https://source1.vn/xsmb-{dd-mm-yyyy}.html' },
        mockClient
      );

      await provider.fetchByDate('2026-09-02');
      expect(mockClient.get).toHaveBeenCalledWith(
        'https://source1.vn/xsmb-02-09-2026.html',
        expect.anything()
      );
    });

    it('should construct correct URL with {ddmmyyyy}', async () => {
      const mockClient = createMockHttpClient();
      const provider = new PrimaryWebXSMBProvider(
        { baseUrl: 'https://minhngoc.com.vn/mien-bac/{ddmmyyyy}.html' },
        mockClient
      );

      await provider.fetchByDate('2026-09-02');
      expect(mockClient.get).toHaveBeenCalledWith(
        'https://minhngoc.com.vn/mien-bac/02092026.html',
        expect.anything()
      );
    });

    it('should construct correct URL with {date}', async () => {
      const mockClient = createMockHttpClient();
      const provider = new PrimaryWebXSMBProvider(
        { baseUrl: 'https://api-source.vn/xsmb?date={date}' },
        mockClient
      );

      await provider.fetchByDate('2026-09-02');
      expect(mockClient.get).toHaveBeenCalledWith(
        'https://api-source.vn/xsmb?date=2026-09-02',
        expect.anything()
      );
    });

    it('should append date when no template placeholder is present', async () => {
      const mockClient = createMockHttpClient();
      const provider = new PrimaryWebXSMBProvider(
        { baseUrl: 'https://source-plain.vn/xsmb' },
        mockClient
      );

      await provider.fetchByDate('2026-09-02');
      expect(mockClient.get).toHaveBeenCalledWith(
        'https://source-plain.vn/xsmb/02-09-2026.html',
        expect.anything()
      );
    });
  });

  describe('fetchHistory', () => {
    it('should sequentially fetch a date range', async () => {
      const mockClient = createMockHttpClient();
      const provider = new PrimaryWebXSMBProvider({}, mockClient);

      const history = await provider.fetchHistory({
        from: '2026-09-01',
        to: '2026-09-03',
      });

      expect(history).toHaveLength(3);
      expect(history[0].requestedDate).toBe('2026-09-01');
      expect(history[1].requestedDate).toBe('2026-09-02');
      expect(history[2].requestedDate).toBe('2026-09-03');
    });

    it('should reject invalid history range where from > to', async () => {
      const provider = new PrimaryWebXSMBProvider({}, createMockHttpClient());

      await expect(
        provider.fetchHistory({ from: '2026-09-05', to: '2026-09-01' })
      ).rejects.toThrow(XSMBProviderError);
    });
  });

  describe('healthCheck', () => {
    it('should return available = true with latency when provider is reachable', async () => {
      const mockClient = createMockHttpClient({ status: 200 });
      const provider = new PrimaryWebXSMBProvider({}, mockClient);

      const health = await provider.healthCheck();

      expect(health.providerId).toBe('primary-web-provider');
      expect(health.available).toBe(true);
      expect(health.latencyMs).toBeGreaterThanOrEqual(0);
      expect(health.checkedAt).toBeInstanceOf(Date);
      expect(health.httpStatus).toBe(200);
      expect(health.error).toBeUndefined();
    });

    it('should return available = false with error when provider is unreachable', async () => {
      const mockClient: IHttpClient = {
        get: vi.fn().mockRejectedValue(
          XSMBProviderError.networkError('primary-web-provider', 'https://xoso.com.vn', 'DNS resolution failed')
        ),
      };
      const provider = new PrimaryWebXSMBProvider({}, mockClient);

      const health = await provider.healthCheck();

      expect(health.providerId).toBe('primary-web-provider');
      expect(health.available).toBe(false);
      expect(health.error).toContain('DNS resolution failed');
    });
  });

  describe('XSMBProviderError Serialization', () => {
    it('should serialize to clean JSON structure without leaking internal stack frames', () => {
      const err = XSMBProviderError.timeout(
        'primary-web-provider',
        'https://xoso.com.vn/test',
        10000,
        '2026-09-02'
      );

      const json = err.toJSON();
      expect(json).toEqual({
        code: 'SOURCE_TIMEOUT',
        providerId: 'primary-web-provider',
        message: 'Provider request to https://xoso.com.vn/test timed out after 10000ms',
        sourceUrl: 'https://xoso.com.vn/test',
        requestedDate: '2026-09-02',
        retryable: true,
        details: { timeoutMs: 10000 },
        httpStatus: undefined,
      });
    });
  });
});
