/**
 * XSMB Provider Contract Interface
 *
 * Defines the standard contract that every XSMB data provider must fulfill.
 * Providers are solely responsible for external web acquisition and returning
 * raw responses.
 */

import type { RawXSMBResponse, ProviderHealth } from './types';

export interface XSMBHistoryParams {
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

export interface XSMBProvider {
  /** Unique identifier for the provider (e.g., 'primary-web-provider') */
  readonly providerId: string;

  /** Human-readable display name */
  readonly providerName: string;

  /**
   * Fetches the raw lottery response for today's draw in Vietnam timezone (Asia/Ho_Chi_Minh).
   * @returns RawXSMBResponse containing raw HTML/text payload and metadata.
   */
  fetchToday(): Promise<RawXSMBResponse>;

  /**
   * Fetches the raw lottery response for a specific date (YYYY-MM-DD).
   * @param date Date string in strict YYYY-MM-DD format.
   * @returns RawXSMBResponse containing raw HTML/text payload and metadata.
   */
  fetchByDate(date: string): Promise<RawXSMBResponse>;

  /**
   * Optional method to fetch historical raw responses over a date range.
   */
  fetchHistory?(params: XSMBHistoryParams): Promise<RawXSMBResponse[] | RawXSMBResponse>;

  /**
   * Performs a lightweight connectivity and health probe to the provider.
   */
  healthCheck(): Promise<ProviderHealth>;
}
