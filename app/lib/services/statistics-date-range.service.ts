/**
 * Statistics Date Range Service
 *
 * Centralized service for date range calculations in Asia/Ho_Chi_Minh timezone.
 * Resolves standard periods:
 * - 'today' (1 day)
 * - 'yesterday' (1 day)
 * - '3days' / 3 (3 days)
 * - '7days' / 7 (7 days)
 * - '14days' / 14 (14 days)
 * - '30days' / 30 (30 days)
 * - '90days' / 90 (90 days)
 * - custom range (from, to)
 */

import {
  getTodayVN,
  addDays,
  toDDMMYYYYDash,
  isValidDateStr,
  parseDateStr,
} from '../date-utils';

export type StatisticsRangeKey =
  | 'today'
  | 'yesterday'
  | '3days'
  | '7days'
  | '14days'
  | '30days'
  | '90days'
  | 'custom';

export interface DateRangeConfig {
  rangeKey: StatisticsRangeKey;
  label: string;
  daysCount: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  expectedDates: string[]; // List of YYYY-MM-DD descending
  dateRangeDisplay: string; // e.g. "02/09 → 27/08"
  dateRangeFull: string;    // e.g. "27/08/2026 — 02/09/2026"
}

export interface DataCompletenessEvaluation {
  requestedDays: number;
  availableDays: number;
  missingDays: number;
  missingDates: string[];
  coveragePercentage: number;
  status: 'HEALTHY' | 'INCOMPLETE' | 'EMPTY';
  statusLabel: string;
}

export class StatisticsDateRangeService {
  /**
   * Normalizes range string or number to a standard StatisticsRangeKey
   */
  static parseRangeKey(input?: string | number | null): StatisticsRangeKey {
    if (input === undefined || input === null || input === '') {
      return '30days';
    }

    if (typeof input === 'number') {
      if (input === 1) return 'today';
      if (input <= 3) return '3days';
      if (input <= 7) return '7days';
      if (input <= 14) return '14days';
      if (input <= 30) return '30days';
      if (input <= 90) return '90days';
      return '30days';
    }

    const str = String(input).trim().toLowerCase();
    switch (str) {
      case 'today':
      case '1':
      case '1day':
      case 'hom-nay':
      case 'hôm nay':
        return 'today';
      case 'yesterday':
      case 'hom-qua':
      case 'hôm qua':
        return 'yesterday';
      case '3days':
      case '3':
      case '3day':
      case '3 ngày':
        return '3days';
      case '7days':
      case '7':
      case '7day':
      case '7 ngày':
        return '7days';
      case '14days':
      case '14':
      case '14day':
      case '14 ngày':
        return '14days';
      case '30days':
      case '30':
      case '30day':
      case '30 ngày':
        return '30days';
      case '90days':
      case '90':
      case '90day':
      case '90 ngày':
        return '90days';
      case 'custom':
        return 'custom';
      default:
        return '30days';
    }
  }

  /**
   * Converts range key to integer number of days
   */
  static rangeKeyToDays(rangeKey: StatisticsRangeKey): number {
    switch (rangeKey) {
      case 'today':
        return 1;
      case 'yesterday':
        return 1;
      case '3days':
        return 3;
      case '7days':
        return 7;
      case '14days':
        return 14;
      case '30days':
        return 30;
      case '90days':
        return 90;
      case 'custom':
        return 30;
      default:
        return 30;
    }
  }

  /**
   * Returns human-readable label for a range key
   */
  static getRangeLabel(rangeKey: StatisticsRangeKey): string {
    switch (rangeKey) {
      case 'today':
        return 'Hôm nay';
      case 'yesterday':
        return 'Hôm qua';
      case '3days':
        return '3 ngày';
      case '7days':
        return '7 ngày';
      case '14days':
        return '14 ngày';
      case '30days':
        return '30 ngày';
      case '90days':
        return '90 ngày';
      case 'custom':
        return 'Tùy chỉnh';
      default:
        return '30 ngày';
    }
  }

  /**
   * Resolves target date range config based on latest available completed draw date (anchorDate)
   * or today in Vietnam timezone.
   */
  static resolveDateRange(
    rangeInput?: string | number | null,
    options: {
      anchorDate?: string; // Latest completed draw date (e.g. "2026-09-01")
      customFrom?: string;
      customTo?: string;
    } = {}
  ): DateRangeConfig {
    const rangeKey = this.parseRangeKey(rangeInput);
    const todayVN = getTodayVN();
    const effectiveAnchor = options.anchorDate && isValidDateStr(options.anchorDate)
      ? options.anchorDate
      : todayVN;

    let startDate: string;
    let endDate: string;
    let daysCount: number;

    if (rangeKey === 'custom' && options.customFrom && options.customTo) {
      startDate = options.customFrom;
      endDate = options.customTo;
      if (startDate > endDate) {
        [startDate, endDate] = [endDate, startDate];
      }
      const d1 = parseDateStr(startDate);
      const d2 = parseDateStr(endDate);
      const diffMs = Math.abs(d2.getTime() - d1.getTime());
      daysCount = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
    } else if (rangeKey === 'today') {
      endDate = todayVN;
      startDate = todayVN;
      daysCount = 1;
    } else if (rangeKey === 'yesterday') {
      const yesterdayDate = effectiveAnchor === todayVN ? addDays(todayVN, -1) : effectiveAnchor;
      endDate = yesterdayDate;
      startDate = yesterdayDate;
      daysCount = 1;
    } else {
      daysCount = this.rangeKeyToDays(rangeKey);
      endDate = effectiveAnchor;
      startDate = addDays(effectiveAnchor, -(daysCount - 1));
    }

    // Generate list of expected dates (descending from endDate to startDate)
    const expectedDates: string[] = [];
    let curr = endDate;
    while (curr >= startDate) {
      expectedDates.push(curr);
      curr = addDays(curr, -1);
    }

    const [endYear, endMonth, endDay] = endDate.split('-');
    const [, startMonth, startDay] = startDate.split('-');

    const dateRangeDisplay = daysCount === 1
      ? `${endDay}/${endMonth}/${endYear}`
      : `${endDay}/${endMonth} → ${startDay}/${startMonth}`;

    const dateRangeFull = daysCount === 1
      ? `${toDDMMYYYYDash(endDate)}`
      : `${toDDMMYYYYDash(startDate)} — ${toDDMMYYYYDash(endDate)}`;

    return {
      rangeKey,
      label: this.getRangeLabel(rangeKey),
      daysCount,
      startDate,
      endDate,
      expectedDates,
      dateRangeDisplay,
      dateRangeFull,
    };
  }

  /**
   * Evaluates data completeness by comparing expected date list with available draw dates
   */
  static evaluateCompleteness(
    expectedDates: string[],
    availableDrawDates: string[]
  ): DataCompletenessEvaluation {
    const availableSet = new Set(availableDrawDates);
    const missingDates = expectedDates.filter((date) => !availableSet.has(date));
    const requestedDays = expectedDates.length;
    const availableDays = requestedDays - missingDates.length;
    const coveragePercentage = requestedDays > 0
      ? Math.round((availableDays / requestedDays) * 100)
      : 0;

    let status: 'HEALTHY' | 'INCOMPLETE' | 'EMPTY' = 'HEALTHY';
    let statusLabel = `${availableDays}/${requestedDays} ngày (${coveragePercentage}%) — Đầy đủ`;

    if (availableDays === 0) {
      status = 'EMPTY';
      statusLabel = `0/${requestedDays} ngày — Chưa có dữ liệu`;
    } else if (missingDates.length > 0) {
      status = 'INCOMPLETE';
      statusLabel = `${availableDays}/${requestedDays} ngày (${coveragePercentage}%) — Thiếu ${missingDates.length} kỳ`;
    }

    return {
      requestedDays,
      availableDays,
      missingDays: missingDates.length,
      missingDates,
      coveragePercentage,
      status,
      statusLabel,
    };
  }
}
