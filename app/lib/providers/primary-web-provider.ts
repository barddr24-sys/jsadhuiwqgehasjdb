/**
 * Primary Free Web XSMB Provider
 *
 * Implements the XSMBProvider contract for acquiring raw lottery responses
 * from publicly accessible Vietnamese lottery websites.
 *
 * Architecture boundary:
 * FETCH EXTERNAL WEB SOURCE -> RETURN RawXSMBResponse
 *
 * This class NEVER writes to MongoDB, NEVER parses prize numbers,
 * and NEVER generates fake data.
 */

import { XSMBProvider, XSMBHistoryParams } from './xsmb-provider.interface';
import {
  RawXSMBResponse,
  ProviderHealth,
  XSMBProviderConfig,
  ProviderLogger,
} from './types';
import { XSMBProviderError } from './provider-errors';
import { IHttpClient, FetchHttpClient } from './http-client';
import { getPrimaryProviderConfig } from './config';
import {
  getTodayVN,
  isValidDateStr,
  toDDMMYYYY,
  toDDMMYYYYDash,
} from '../date-utils';

export class PrimaryWebXSMBProvider implements XSMBProvider {
  readonly providerId: string;
  readonly providerName: string;
  private readonly config: XSMBProviderConfig;
  private readonly httpClient: IHttpClient;
  private readonly logger?: ProviderLogger;

  constructor(
    configOverrides: Partial<XSMBProviderConfig> = {},
    httpClient?: IHttpClient,
    logger?: ProviderLogger
  ) {
    this.config = getPrimaryProviderConfig(configOverrides);
    this.providerId = this.config.providerId;
    this.providerName = this.config.providerName;
    this.logger = logger;

    // Use provided HTTP client (for unit testing) or instantiate default resilient client
    this.httpClient =
      httpClient ||
      new FetchHttpClient({
        providerId: this.providerId,
        defaultTimeoutMs: this.config.timeoutMs,
        defaultMaxRetries: this.config.maxRetries,
        defaultRetryDelayMs: this.config.retryDelayMs,
        defaultMaxResponseBytes: this.config.maxResponseBytes,
        minRequestIntervalMs: this.config.minRequestIntervalMs,
        defaultUserAgent: this.config.userAgent,
        logger: this.logger,
      });
  }

  /**
   * Fetches raw XSMB lottery payload for today in Vietnam timezone (Asia/Ho_Chi_Minh).
   */
  async fetchToday(): Promise<RawXSMBResponse> {
    const todayVN = getTodayVN();
    return this.fetchByDate(todayVN);
  }

  /**
   * Fetches raw XSMB lottery payload for a specific YYYY-MM-DD date.
   */
  async fetchByDate(date: string): Promise<RawXSMBResponse> {
    // 1. Strict date parameter validation (protects against SSRF and injection)
    this.validateDate(date);

    // 2. Resolve safe source URL for the requested date
    const targetUrl = this.buildSourceUrl(date);

    // 3. Execute HTTP request via resilient client
    const response = await this.httpClient.get(targetUrl, {
      timeoutMs: this.config.timeoutMs,
      maxRetries: this.config.maxRetries,
      retryDelayMs: this.config.retryDelayMs,
      maxResponseBytes: this.config.maxResponseBytes,
    });

    // 4. Validate raw body presence
    if (!response.body || response.body.trim() === '') {
      throw XSMBProviderError.emptyResponse(this.providerId, targetUrl, date);
    }

    // 5. Return unparsed raw response contract
    const rawResponse: RawXSMBResponse = {
      providerId: this.providerId,
      requestedDate: date,
      fetchedAt: new Date(),
      httpStatus: response.status,
      sourceUrl: response.url || targetUrl,
      contentType: response.headers['content-type'],
      rawBody: response.body,
      durationMs: response.durationMs,
      headers: response.headers,
    };

    return rawResponse;
  }

  /**
   * Optional helper to fetch historical dates sequentially without flooding the source.
   */
  async fetchHistory(params: XSMBHistoryParams): Promise<RawXSMBResponse[]> {
    if (!params.from || !params.to) {
      throw XSMBProviderError.invalidDate(
        this.providerId,
        `${params.from}..${params.to}`,
        'Both "from" and "to" parameters are required for historical range'
      );
    }

    this.validateDate(params.from);
    this.validateDate(params.to);

    if (params.from > params.to) {
      throw XSMBProviderError.invalidDate(
        this.providerId,
        params.from,
        '"from" date must be earlier than or equal to "to" date'
      );
    }

    const results: RawXSMBResponse[] = [];
    const current = new Date(params.from);
    const end = new Date(params.to);

    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const res = await this.fetchByDate(dateStr);
      results.push(res);

      current.setDate(current.getDate() + 1);
    }

    return results;
  }

  /**
   * Performs a lightweight connectivity and health probe to the provider.
   */
  async healthCheck(): Promise<ProviderHealth> {
    const startedAt = Date.now();
    try {
      const todayVN = getTodayVN();
      const targetUrl = this.buildSourceUrl(todayVN);

      // Probe with single attempt (no retry for health check)
      const response = await this.httpClient.get(targetUrl, {
        timeoutMs: Math.min(this.config.timeoutMs, 5000),
        maxRetries: 0,
      });

      const latencyMs = Date.now() - startedAt;
      return {
        providerId: this.providerId,
        providerName: this.providerName,
        available: response.status >= 200 && response.status < 400,
        latencyMs,
        checkedAt: new Date(),
        httpStatus: response.status,
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - startedAt;
      const errorMessage = err instanceof Error ? err.message : String(err);
      const httpStatus = err instanceof XSMBProviderError ? err.httpStatus : undefined;

      return {
        providerId: this.providerId,
        providerName: this.providerName,
        available: false,
        latencyMs,
        checkedAt: new Date(),
        httpStatus,
        error: errorMessage,
      };
    }
  }

  /**
   * Validates date format strictly. Rejects any malformed or non-YYYY-MM-DD input.
   */
  private validateDate(dateStr: string): void {
    if (!dateStr || typeof dateStr !== 'string') {
      throw XSMBProviderError.invalidDate(this.providerId, String(dateStr), 'Date must be a string');
    }

    // Strict regex match: YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw XSMBProviderError.invalidDate(
        this.providerId,
        dateStr,
        'Format must be YYYY-MM-DD (e.g. 2026-09-02)'
      );
    }

    // Calendar validity check (e.g. rejects 2026-02-30)
    if (!isValidDateStr(dateStr)) {
      throw XSMBProviderError.invalidDate(this.providerId, dateStr, 'Calendar date is not valid');
    }
  }

  /**
   * Constructs the provider-specific external URL using isolated template resolution.
   */
  private buildSourceUrl(dateStr: string): string {
    const base = this.config.baseUrl;
    const ddmmyyyy = toDDMMYYYY(dateStr);
    const ddmmDash = toDDMMYYYYDash(dateStr);

    if (base.includes('{dd-mm-yyyy}')) {
      return base.replace(/\{dd-mm-yyyy\}/g, ddmmDash);
    }
    if (base.includes('{ddmmyyyy}')) {
      return base.replace(/\{ddmmyyyy\}/g, ddmmyyyy);
    }
    if (base.includes('{date}')) {
      return base.replace(/\{date\}/g, dateStr);
    }
    if (base.includes('{yyyy-mm-dd}')) {
      return base.replace(/\{yyyy-mm-dd\}/g, dateStr);
    }

    // Fallback if no template variable is present: append date query or path
    if (base.endsWith('/')) {
      return `${base}${ddmmDash}.html`;
    }
    return `${base}/${ddmmDash}.html`;
  }
}
