import { describe, it, expect, vi } from 'vitest';
import { FetchHttpClient, calculateBackoff } from '../../app/lib/providers/http-client';
import { XSMBProviderError } from '../../app/lib/providers/provider-errors';

describe('FetchHttpClient Resiliency Layer', () => {
  describe('calculateBackoff', () => {
    it('should compute exponential backoff with jitter bounded by maxDelay', () => {
      const delay0 = calculateBackoff(0, 100, 1000);
      expect(delay0).toBeGreaterThanOrEqual(100);
      expect(delay0).toBeLessThanOrEqual(150);

      const delay1 = calculateBackoff(1, 100, 1000);
      expect(delay1).toBeGreaterThanOrEqual(200);
      expect(delay1).toBeLessThanOrEqual(250);

      const delayBig = calculateBackoff(10, 100, 500);
      expect(delayBig).toBeLessThanOrEqual(500);
    });
  });

  describe('Successful Requests', () => {
    it('should successfully perform GET and return HttpResponse', async () => {
      const mockHtml = '<!DOCTYPE html><html><body><h1>XSMB 2026-09-02</h1></body></html>';
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        url: 'https://xoso.com.vn/xsmb-02-09-2026.html',
        headers: new Headers({
          'content-type': 'text/html; charset=UTF-8',
          'content-length': String(mockHtml.length),
        }),
        text: vi.fn().mockResolvedValue(mockHtml),
      });

      const client = new FetchHttpClient({
        fetchFn: mockFetch as unknown as typeof fetch,
        minRequestIntervalMs: 0,
      });

      const response = await client.get('https://xoso.com.vn/xsmb-02-09-2026.html');

      expect(response.status).toBe(200);
      expect(response.body).toBe(mockHtml);
      expect(response.url).toBe('https://xoso.com.vn/xsmb-02-09-2026.html');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Timeout Handling', () => {
    it('should handle request timeout and throw SOURCE_TIMEOUT error', async () => {
      const mockFetch = vi.fn().mockImplementation((_url, options) => {
        return new Promise((_resolve, reject) => {
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              const abortErr = new Error('The operation was aborted');
              abortErr.name = 'AbortError';
              reject(abortErr);
            });
          }
        });
      });

      const client = new FetchHttpClient({
        fetchFn: mockFetch as unknown as typeof fetch,
        defaultTimeoutMs: 50,
        defaultMaxRetries: 0,
        minRequestIntervalMs: 0,
      });

      await expect(client.get('https://xoso.com.vn/test')).rejects.toThrow(XSMBProviderError);

      try {
        await client.get('https://xoso.com.vn/test');
      } catch (err: unknown) {
        const provErr = err as XSMBProviderError;
        expect(provErr.code).toBe('SOURCE_TIMEOUT');
        expect(provErr.retryable).toBe(true);
      }
    });
  });

  describe('Network Failure Handling', () => {
    it('should handle connection refused or DNS failure and throw SOURCE_NETWORK_ERROR', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new TypeError('fetch failed: ECONNREFUSED'));

      const client = new FetchHttpClient({
        fetchFn: mockFetch as unknown as typeof fetch,
        defaultMaxRetries: 0,
        minRequestIntervalMs: 0,
      });

      try {
        await client.get('https://xoso.com.vn/test');
        expect.fail('Expected call to throw');
      } catch (err: unknown) {
        const provErr = err as XSMBProviderError;
        expect(provErr.code).toBe('SOURCE_NETWORK_ERROR');
        expect(provErr.message).toContain('ECONNREFUSED');
        expect(provErr.retryable).toBe(true);
      }
    });
  });

  describe('HTTP Status Classifications', () => {
    it('should throw SOURCE_NOT_FOUND on HTTP 404 without retrying', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'text/html' }),
        text: vi.fn().mockResolvedValue('Not Found'),
      });

      const client = new FetchHttpClient({
        fetchFn: mockFetch as unknown as typeof fetch,
        defaultMaxRetries: 2,
        minRequestIntervalMs: 0,
      });

      try {
        await client.get('https://xoso.com.vn/xsmb-not-found');
        expect.fail('Expected to throw');
      } catch (err: unknown) {
        const provErr = err as XSMBProviderError;
        expect(provErr.code).toBe('SOURCE_NOT_FOUND');
        expect(provErr.httpStatus).toBe(404);
        expect(provErr.retryable).toBe(false);
        // Ensure no retry was attempted for 404
        expect(mockFetch).toHaveBeenCalledTimes(1);
      }
    });

    it('should throw SOURCE_BLOCKED on HTTP 403 / 429 without retrying', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 403,
        statusText: 'Forbidden',
        headers: new Headers({ 'content-type': 'text/html' }),
        text: vi.fn().mockResolvedValue('Cloudflare Blocked'),
      });

      const client = new FetchHttpClient({
        fetchFn: mockFetch as unknown as typeof fetch,
        defaultMaxRetries: 2,
        minRequestIntervalMs: 0,
      });

      try {
        await client.get('https://xoso.com.vn/blocked');
        expect.fail('Expected to throw');
      } catch (err: unknown) {
        const provErr = err as XSMBProviderError;
        expect(provErr.code).toBe('SOURCE_BLOCKED');
        expect(provErr.httpStatus).toBe(403);
        expect(provErr.retryable).toBe(false);
        expect(mockFetch).toHaveBeenCalledTimes(1);
      }
    });

    it('should throw SOURCE_HTTP_ERROR on HTTP 500', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'text/html' }),
        text: vi.fn().mockResolvedValue('Server Error'),
      });

      const client = new FetchHttpClient({
        fetchFn: mockFetch as unknown as typeof fetch,
        defaultMaxRetries: 0,
        minRequestIntervalMs: 0,
      });

      try {
        await client.get('https://xoso.com.vn/500');
        expect.fail('Expected to throw');
      } catch (err: unknown) {
        const provErr = err as XSMBProviderError;
        expect(provErr.code).toBe('SOURCE_HTTP_ERROR');
        expect(provErr.httpStatus).toBe(500);
      }
    });
  });

  describe('Retry Policy on Transient Errors', () => {
    it('should retry on HTTP 502/503/504 and succeed when subsequent attempt succeeds', async () => {
      const mockSuccessHtml = '<html><body>OK</body></html>';
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'content-type': 'text/html' }),
          text: vi.fn().mockResolvedValue('503 Service Unavailable'),
        })
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          url: 'https://xoso.com.vn/xsmb-retry',
          headers: new Headers({ 'content-type': 'text/html' }),
          text: vi.fn().mockResolvedValue(mockSuccessHtml),
        });

      const client = new FetchHttpClient({
        fetchFn: mockFetch as unknown as typeof fetch,
        defaultMaxRetries: 2,
        defaultRetryDelayMs: 10,
        minRequestIntervalMs: 0,
      });

      const res = await client.get('https://xoso.com.vn/xsmb-retry');
      expect(res.status).toBe(200);
      expect(res.body).toBe(mockSuccessHtml);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should exhaust bounded retries and throw if transient error persists', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 502,
        statusText: 'Bad Gateway',
        headers: new Headers({ 'content-type': 'text/html' }),
        text: vi.fn().mockResolvedValue('502 Bad Gateway'),
      });

      const client = new FetchHttpClient({
        fetchFn: mockFetch as unknown as typeof fetch,
        defaultMaxRetries: 2,
        defaultRetryDelayMs: 10,
        minRequestIntervalMs: 0,
      });

      await expect(client.get('https://xoso.com.vn/502')).rejects.toThrow(XSMBProviderError);
      // 1 initial + 2 retries = 3 attempts
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should NOT retry on permanent 400 Bad Request error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'text/html' }),
        text: vi.fn().mockResolvedValue('Bad Request'),
      });

      const client = new FetchHttpClient({
        fetchFn: mockFetch as unknown as typeof fetch,
        defaultMaxRetries: 2,
        defaultRetryDelayMs: 10,
        minRequestIntervalMs: 0,
      });

      try {
        await client.get('https://xoso.com.vn/400');
        expect.fail('Expected to throw');
      } catch (err: unknown) {
        const provErr = err as XSMBProviderError;
        expect(provErr.code).toBe('SOURCE_HTTP_ERROR');
        expect(provErr.httpStatus).toBe(400);
        expect(provErr.retryable).toBe(false);
        expect(mockFetch).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Response Size Protection', () => {
    it('should reject response if Content-Length header exceeds maxResponseBytes', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'text/html',
          'content-length': '10485760', // 10 MB
        }),
        text: vi.fn().mockResolvedValue('large body'),
      });

      const client = new FetchHttpClient({
        fetchFn: mockFetch as unknown as typeof fetch,
        defaultMaxResponseBytes: 1024 * 1024, // 1 MB limit
        defaultMaxRetries: 0,
        minRequestIntervalMs: 0,
      });

      try {
        await client.get('https://xoso.com.vn/large');
        expect.fail('Expected to throw');
      } catch (err: unknown) {
        const provErr = err as XSMBProviderError;
        expect(provErr.code).toBe('SOURCE_RESPONSE_TOO_LARGE');
        expect(provErr.retryable).toBe(false);
      }
    });

    it('should reject response if actual body text exceeds maxResponseBytes', async () => {
      const oversizedText = 'A'.repeat(5000);
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'text/html' }),
        text: vi.fn().mockResolvedValue(oversizedText),
      });

      const client = new FetchHttpClient({
        fetchFn: mockFetch as unknown as typeof fetch,
        defaultMaxResponseBytes: 1000, // 1000 bytes limit
        defaultMaxRetries: 0,
        minRequestIntervalMs: 0,
      });

      try {
        await client.get('https://xoso.com.vn/large-stream');
        expect.fail('Expected to throw');
      } catch (err: unknown) {
        const provErr = err as XSMBProviderError;
        expect(provErr.code).toBe('SOURCE_RESPONSE_TOO_LARGE');
      }
    });
  });

  describe('Content-Type Validation', () => {
    it('should reject binary content types (e.g. application/pdf, image/png)', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/pdf' }),
        text: vi.fn().mockResolvedValue('%PDF-1.4...'),
      });

      const client = new FetchHttpClient({
        fetchFn: mockFetch as unknown as typeof fetch,
        defaultMaxRetries: 0,
        minRequestIntervalMs: 0,
      });

      try {
        await client.get('https://xoso.com.vn/document.pdf');
        expect.fail('Expected to throw');
      } catch (err: unknown) {
        const provErr = err as XSMBProviderError;
        expect(provErr.code).toBe('INVALID_CONTENT_TYPE');
        expect(provErr.retryable).toBe(false);
      }
    });

    it('should accept valid text/html, application/xhtml+xml, and text/plain content types', async () => {
      const validTypes = [
        'text/html; charset=utf-8',
        'application/xhtml+xml',
        'text/plain; charset=iso-8859-1',
        'application/xml',
      ];

      for (const ct of validTypes) {
        const mockFetch = vi.fn().mockResolvedValue({
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': ct }),
          text: vi.fn().mockResolvedValue('<html><body>OK</body></html>'),
        });

        const client = new FetchHttpClient({
          fetchFn: mockFetch as unknown as typeof fetch,
          defaultMaxRetries: 0,
          minRequestIntervalMs: 0,
        });

        const res = await client.get('https://xoso.com.vn/page');
        expect(res.status).toBe(200);
      }
    });
  });

  describe('Structured Logging & Telemetry', () => {
    it('should emit structured info log on success without logging sensitive headers', async () => {
      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'text/html',
          'set-cookie': 'secret_session=12345',
          'x-server': 'nginx-prod',
        }),
        text: vi.fn().mockResolvedValue('<html><body>Draw content</body></html>'),
      });

      const client = new FetchHttpClient({
        fetchFn: mockFetch as unknown as typeof fetch,
        minRequestIntervalMs: 0,
        logger,
      });

      const res = await client.get('https://xoso.com.vn/xsmb-log-test');
      expect(res.status).toBe(200);
      // Ensure cookies are not passed in sanitized headers
      expect(res.headers['set-cookie']).toBeUndefined();
      expect(res.headers['x-server']).toBe('nginx-prod');

      expect(logger.info).toHaveBeenCalledTimes(1);
      const [msg, meta] = logger.info.mock.calls[0];
      expect(msg).toContain('Request success');
      expect(meta.resultStatus).toBe('SUCCESS');
      expect(meta.httpStatus).toBe(200);
    });
  });
});
