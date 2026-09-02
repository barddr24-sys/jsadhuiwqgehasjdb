/**
 * Historical Backfill Service
 *
 * Ensures the historical window (at least 30–35 consecutive days) is present in MongoDB.
 * Workflow:
 *   1. Check available draws in MongoDB for the target historical window.
 *   2. Detect any missing dates.
 *   3. If missing dates are found, sequentially backfill via XSMBSyncService:
 *      Fetch -> Parse -> Strict Validate -> Store -> Invalidate Cache.
 *   4. Return comprehensive completeness report.
 */

import { xsmbDrawRepository, type XSMBDrawRepository } from '../db/repositories/xsmb-draw.repository';
import { XSMBSyncService } from './xsmb-sync.service';
import {
  StatisticsDateRangeService,
  type DataCompletenessEvaluation,
} from '../services/statistics-date-range.service';
import { StatisticsCacheService } from '../services/statistics-cache.service';
import { getTodayVN } from '../date-utils';

export interface BackfillOptions {
  windowDays?: number; // Target window in days (default: 35)
  autoSync?: boolean;  // If true, automatically fetches missing dates
  delayMs?: number;    // Rate limiting delay between requests (default: 150ms)
}

export interface BackfillReport {
  targetWindowDays: number;
  startDate: string;
  endDate: string;
  expectedDatesCount: number;
  existingDatesCount: number;
  missingDates: string[];
  backfilledDates: string[];
  failedDates: string[];
  completeness: DataCompletenessEvaluation;
  durationMs: number;
}

export class HistoricalBackfillService {
  constructor(
    private readonly drawRepository: XSMBDrawRepository = xsmbDrawRepository,
    private readonly syncService: XSMBSyncService = new XSMBSyncService()
  ) {}

  /**
   * Evaluates the historical dataset completeness for the given window (e.g. 35 days).
   * Optionally backfills missing dates.
   */
  async ensureHistoricalWindow(options: BackfillOptions = {}): Promise<BackfillReport> {
    const startTime = Date.now();
    const windowDays = Math.max(30, Math.min(options.windowDays || 35, 90));
    const autoSync = options.autoSync ?? false;
    const delayMs = options.delayMs ?? 150;

    // Find latest completed draw to anchor window
    const latestDraw = await this.drawRepository.findLatest();
    const todayVN = getTodayVN();
    const anchorDate = latestDraw?.drawDate || todayVN;

    const rangeConfig = StatisticsDateRangeService.resolveDateRange(windowDays, {
      anchorDate,
    });

    // Query all existing draws in range
    const existingDocs = await this.drawRepository.findDateRange(
      rangeConfig.startDate,
      rangeConfig.endDate
    );

    const existingDates = existingDocs
      .filter((d) => d.status === 'READY')
      .map((d) => d.drawDate);

    const completenessBefore = StatisticsDateRangeService.evaluateCompleteness(
      rangeConfig.expectedDates,
      existingDates
    );

    const backfilledDates: string[] = [];
    const failedDates: string[] = [];

    // Auto-backfill missing dates if requested and missing dates exist
    if (autoSync && completenessBefore.missingDates.length > 0) {
      for (const missingDate of completenessBefore.missingDates) {
        // Skip today if draw time (18:15) hasn't completed yet
        if (missingDate === todayVN) {
          continue;
        }

        try {
          const syncRes = await this.syncService.syncDate(missingDate, {
            allowPartial: false,
          });

          if (syncRes.status === 'SUCCESS' || syncRes.status === 'NO_CHANGE') {
            backfilledDates.push(missingDate);
          } else {
            failedDates.push(missingDate);
          }

          if (delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        } catch {
          failedDates.push(missingDate);
        }
      }

      // Invalidate cache after backfill
      if (backfilledDates.length > 0) {
        StatisticsCacheService.invalidateAll();
      }
    }

    // Re-evaluate completeness after backfill
    const finalExistingDates = Array.from(
      new Set([...existingDates, ...backfilledDates])
    );

    const completeness = StatisticsDateRangeService.evaluateCompleteness(
      rangeConfig.expectedDates,
      finalExistingDates
    );

    return {
      targetWindowDays: windowDays,
      startDate: rangeConfig.startDate,
      endDate: rangeConfig.endDate,
      expectedDatesCount: rangeConfig.expectedDates.length,
      existingDatesCount: finalExistingDates.length,
      missingDates: completeness.missingDates,
      backfilledDates,
      failedDates,
      completeness,
      durationMs: Date.now() - startTime,
    };
  }
}

export const historicalBackfillService = new HistoricalBackfillService();
