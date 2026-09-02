import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getPrimaryProviderConfig,
  validateProviderConfig,
  DEFAULT_PRIMARY_PROVIDER_ID,
  DEFAULT_PRIMARY_PROVIDER_NAME,
  DEFAULT_PRIMARY_SOURCE_URL,
} from '../../app/lib/providers/config';
import { XSMBProviderError } from '../../app/lib/providers/provider-errors';

describe('XSMB Provider Configuration & Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load default configuration when environment variables are unset', () => {
    delete process.env.XSMB_PRIMARY_SOURCE_URL;
    delete process.env.XSMB_PRIMARY_PROVIDER_ID;
    delete process.env.XSMB_PRIMARY_PROVIDER_NAME;
    delete process.env.XSMB_HTTP_TIMEOUT_MS;
    delete process.env.XSMB_HTTP_MAX_RETRIES;
    delete process.env.XSMB_MAX_RESPONSE_BYTES;

    const config = getPrimaryProviderConfig();
    expect(config.providerId).toBe(DEFAULT_PRIMARY_PROVIDER_ID);
    expect(config.providerName).toBe(DEFAULT_PRIMARY_PROVIDER_NAME);
    expect(config.baseUrl).toBe(DEFAULT_PRIMARY_SOURCE_URL);
    expect(config.timeoutMs).toBe(10000);
    expect(config.maxRetries).toBe(2);
    expect(config.maxResponseBytes).toBe(2097152);
  });

  it('should override defaults with environment variables', () => {
    process.env.XSMB_PRIMARY_SOURCE_URL = 'https://custom-lottery.vn/xsmb/{date}';
    process.env.XSMB_PRIMARY_PROVIDER_ID = 'custom-provider';
    process.env.XSMB_PRIMARY_PROVIDER_NAME = 'Custom Provider Name';
    process.env.XSMB_HTTP_TIMEOUT_MS = '15000';
    process.env.XSMB_HTTP_MAX_RETRIES = '3';
    process.env.XSMB_MAX_RESPONSE_BYTES = '5000000';

    const config = getPrimaryProviderConfig();
    expect(config.providerId).toBe('custom-provider');
    expect(config.providerName).toBe('Custom Provider Name');
    expect(config.baseUrl).toBe('https://custom-lottery.vn/xsmb/{date}');
    expect(config.timeoutMs).toBe(15000);
    expect(config.maxRetries).toBe(3);
    expect(config.maxResponseBytes).toBe(5000000);
  });

  it('should allow explicit parameter overrides over environment variables', () => {
    process.env.XSMB_PRIMARY_SOURCE_URL = 'https://env-url.vn/xsmb/{date}';

    const config = getPrimaryProviderConfig({
      baseUrl: 'https://override-url.vn/xsmb/{ddmmyyyy}',
      timeoutMs: 8000,
    });

    expect(config.baseUrl).toBe('https://override-url.vn/xsmb/{ddmmyyyy}');
    expect(config.timeoutMs).toBe(8000);
  });

  describe('validateProviderConfig', () => {
    it('should reject missing or empty providerId', () => {
      expect(() =>
        validateProviderConfig({
          providerId: '',
          providerName: 'Test',
          baseUrl: 'https://xoso.vn/xsmb',
          timeoutMs: 5000,
          maxRetries: 1,
          retryDelayMs: 500,
          maxResponseBytes: 10000,
          minRequestIntervalMs: 500,
        })
      ).toThrow(XSMBProviderError);
    });

    it('should reject invalid baseUrl without http/https protocol', () => {
      expect(() =>
        validateProviderConfig({
          providerId: 'test-prov',
          providerName: 'Test',
          baseUrl: 'ftp://insecure-source/xsmb',
          timeoutMs: 5000,
          maxRetries: 1,
          retryDelayMs: 500,
          maxResponseBytes: 10000,
          minRequestIntervalMs: 500,
        })
      ).toThrow(XSMBProviderError);
    });

    it('should reject non-positive timeoutMs', () => {
      expect(() =>
        validateProviderConfig({
          providerId: 'test-prov',
          providerName: 'Test',
          baseUrl: 'https://xoso.vn/xsmb',
          timeoutMs: -100,
          maxRetries: 1,
          retryDelayMs: 500,
          maxResponseBytes: 10000,
          minRequestIntervalMs: 500,
        })
      ).toThrow(XSMBProviderError);
    });

    it('should reject negative maxRetries', () => {
      expect(() =>
        validateProviderConfig({
          providerId: 'test-prov',
          providerName: 'Test',
          baseUrl: 'https://xoso.vn/xsmb',
          timeoutMs: 5000,
          maxRetries: -1,
          retryDelayMs: 500,
          maxResponseBytes: 10000,
          minRequestIntervalMs: 500,
        })
      ).toThrow(XSMBProviderError);
    });
  });
});
