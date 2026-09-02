/**
 * XSMB Application Service
 *
 * Core service mediating between REST API controllers and MongoDB repository layer.
 * Operates on MongoDB Atlas ONLY (single source of truth).
 *
 * All features:
 * - Today & Date Result retrieval
 * - Historical draws pagination
 * - 3-day and 7-day loto statistics
 * - Number detail & multi-tier prize matching
 * - Live draw status & progress tracking
 * - Data freshness / staleness evaluation
 * - Full system health status (MongoDB Atlas, Scheduler)
 */

import { xsmbDrawRepository, XSMBDrawRepository } from '../db/repositories/xsmb-draw.repository';
import {
  DRAW_STATUS,
  type DrawStatus,
  type LotteryType,
  LOTTERY_TYPE,
} from '../db/config/status-config';
import {
  TOTAL_PRIZE_NUMBERS,
  type PrizeTierKey,
} from '../db/config/prize-config';
import type {
  IXSMBDraw,
  IXSMBDrawResults,
  IXSMBDrawSource,
} from '../db/types/db-types';
import { getTodayVN, addDays, toDDMMYYYYDash } from '../date-utils';
import { XSMBAPIError, type PaginationMeta } from '../api/api-response';
import {
  validateDateParam,
  validateNumberParam,
  validateDaysParam,
  validatePaginationParams,
  validateTwoDigitRangeParam,
  type TwoDigitRangeParam,
} from '../api/validators';
import { xsmbSchedulerService, XSMBSchedulerService } from '../scheduler/xsmb-scheduler.service';

// ─── Service Response Interfaces ─────────────────────────────────────────────

export interface TwoDigitItemDTO {
  number: string;
  count: number;
  prizes: string[];
  prizeCodes: string[];
  datesAppeared: string[];
  lastAppearance: string | null;
}

export interface TwoDigitTableResponseDTO {
  range: TwoDigitRangeParam;
  rangeLabel: string;
  drawCount: number;
  dateRangeDisplay: string;
  totalOccurrences: number;
  uniqueNumbersCount: number;
  numbers: TwoDigitItemDTO[];
}

export interface DrawResponseDTO {
  date: string;
  lotteryType: LotteryType | string;
  status: DrawStatus;
  province: string;
  isComplete: boolean;
  results: IXSMBDrawResults;
  source?: IXSMBDrawSource;
  updatedAt: string | null;
  fetchedAt: string | null;
  completedAt: string | null;
  isStale: boolean;
}

export interface HistorySummaryItemDTO {
  date: string;
  status: DrawStatus;
  province: string;
  special: string[];
  firstPrize: string[];
  secondPrize: string[];
  completedAt?: string;
  updatedAt?: string;
}

export interface StatisticsNumberItemDTO {
  number: string;
  count: number;
}

export interface StatisticsHeadTailDTO {
  head?: number;
  tail?: number;
  count: number;
}

export interface StatisticsResponseDTO {
  period: number;
  drawCount: number;
  isSufficient: boolean;
  totalOccurrences: number;
  uniqueNumbers: number;
  averagePerDraw: number;
  topNumbers: StatisticsNumberItemDTO[];
  bottomNumbers: StatisticsNumberItemDTO[];
  numbers: StatisticsNumberItemDTO[];
  heads: { head: number; count: number }[];
  tails: { tail: number; count: number }[];
}

export interface NumberDailyHistoryDTO {
  date: string;
  count: number;
  prizes: string[];
}

export interface NumberDetailResponseDTO {
  number: string;
  period: number;
  drawCount: number;
  totalOccurrences: number;
  activeDays: number;
  latestAppearance: string | null;
  dailyHistory: NumberDailyHistoryDTO[];
}

export interface StatusResponseDTO {
  date: string;
  status: DrawStatus;
  progress: number;
  availableTiers: string[];
  updatedAt: string | null;
  isStale: boolean;
}

export interface SchedulerSyncMetricDTO {
  date: string;
  timestamp: string;
  durationMs?: number;
  status?: string;
  error?: string;
}

export interface HealthResponseDTO {
  status: 'UP' | 'DOWN';
  database: 'CONNECTED' | 'DISCONNECTED';
  timestamp: string;
  totalDraws: number;
  scheduler?: {
    isRunning: boolean;
    currentPhase: string;
    lastTickAt: string | null;
    lastSuccessfulSync?: SchedulerSyncMetricDTO | null;
    lastFailedSync?: SchedulerSyncMetricDTO | null;
    lastSyncedDate?: string | null;
  };
}

// ─── Staleness Evaluation Helper ─────────────────────────────────────────────

const FRESHNESS_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export function computeIsStale(draw: IXSMBDraw): boolean {
  if (draw.status === DRAW_STATUS.READY) {
    return false;
  }

  if (draw.status === DRAW_STATUS.SCHEDULED) {
    return false;
  }

  const now = new Date().getTime();
  const lastUpdated = draw.updatedAt
    ? new Date(draw.updatedAt).getTime()
    : (draw.source?.fetchedAt ? new Date(draw.source.fetchedAt).getTime() : 0);

  // In active drawing states (UPDATING, PARTIAL)
  if (draw.status === DRAW_STATUS.UPDATING || draw.status === DRAW_STATUS.PARTIAL) {
    const today = getTodayVN();
    if (draw.drawDate === today) {
      return now - lastUpdated > FRESHNESS_THRESHOLD_MS;
    }
    // Past dates that are still PARTIAL or UPDATING are permanently stale
    return true;
  }

  if (draw.status === DRAW_STATUS.DELAYED || draw.status === DRAW_STATUS.CONFLICT) {
    return now - lastUpdated > 15 * 60 * 1000;
  }

  return false;
}

// ─── Prize Extraction Helpers ────────────────────────────────────────────────

const PRIZE_TIER_ORDER: { key: PrizeTierKey; code: string }[] = [
  { key: 'special', code: 'SPECIAL' },
  { key: 'firstPrize', code: 'FIRST' },
  { key: 'secondPrize', code: 'SECOND' },
  { key: 'thirdPrize', code: 'THIRD' },
  { key: 'fourthPrize', code: 'FOURTH' },
  { key: 'fifthPrize', code: 'FIFTH' },
  { key: 'sixthPrize', code: 'SIXTH' },
  { key: 'seventhPrize', code: 'SEVENTH' },
];

export function extract2Digits(results?: IXSMBDrawResults): string[] {
  if (!results) return [];
  const digits: string[] = [];

  for (const { key } of PRIZE_TIER_ORDER) {
    const list = results[key] || [];
    for (const num of list) {
      if (typeof num === 'string' && num.trim().length >= 2) {
        const cleaned = num.trim();
        digits.push(cleaned.slice(-2));
      }
    }
  }

  return digits;
}

export function findMatchingPrizes(
  results: IXSMBDrawResults | undefined,
  target2D: string
): string[] {
  if (!results) return [];
  const extracted: string[] = [];

  for (const { key, code } of PRIZE_TIER_ORDER) {
    const list = results[key] || [];
    for (const num of list) {
      if (typeof num === 'string' && num.trim().slice(-2) === target2D) {
        extracted.push(code);
      }
    }
  }

  return extracted;
}

// ─── Application Service Class ───────────────────────────────────────────────

export class XSMBAPIService {
  constructor(
    private readonly repository: XSMBDrawRepository = xsmbDrawRepository,
    private readonly scheduler?: XSMBSchedulerService
  ) {}

  /**
   * Retrieves the latest XSMB draw for the current Vietnam business date.
   */
  async getTodayDraw(): Promise<DrawResponseDTO> {
    const todayVN = getTodayVN();
    let doc = await this.repository.findByDate(todayVN);

    if (!doc) {
      // If today is not in DB yet, query the latest available draw
      doc = await this.repository.findLatest();
    }

    if (!doc) {
      throw XSMBAPIError.notFound(
        'XSMB_RESULT_NOT_FOUND',
        'No XSMB result is available for today'
      );
    }

    return this.formatDrawDTO(doc);
  }

  /**
   * Retrieves XSMB draw result by specific date (YYYY-MM-DD).
   */
  async getDrawByDate(rawDate: string): Promise<DrawResponseDTO> {
    const date = validateDateParam(rawDate);
    const doc = await this.repository.findByDate(date);

    if (!doc) {
      throw XSMBAPIError.notFound(
        'XSMB_RESULT_NOT_FOUND',
        'No XSMB result is available for this date'
      );
    }

    return this.formatDrawDTO(doc);
  }

  /**
   * Retrieves historical completed draws with pagination.
   */
  async getHistory(
    pageStr?: string | null,
    pageSizeStr?: string | null
  ): Promise<{ items: HistorySummaryItemDTO[]; pagination: PaginationMeta }> {
    const { page, pageSize } = validatePaginationParams(pageStr, pageSizeStr);
    const offset = (page - 1) * pageSize;

    const result = await this.repository.findHistory(pageSize, offset, {
      status: DRAW_STATUS.READY,
    });

    const totalPages = result.total > 0 ? Math.ceil(result.total / pageSize) : 0;

    const items: HistorySummaryItemDTO[] = result.items.map((doc) => ({
      date: doc.drawDate,
      status: doc.status,
      province: doc.province || 'Miền Bắc',
      special: doc.results?.special || [],
      firstPrize: doc.results?.firstPrize || [],
      secondPrize: doc.results?.secondPrize || [],
      completedAt: doc.completedAt ? new Date(doc.completedAt).toISOString() : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
    }));

    const pagination: PaginationMeta = {
      page,
      pageSize,
      total: result.total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return { items, pagination };
  }

  /**
   * Computes 2-digit statistics over the most recent completed draws (3 or 7 days).
   */
  async getStatistics(daysParam?: string | null): Promise<StatisticsResponseDTO> {
    const period = validateDaysParam(daysParam);
    const completedDraws = await this.repository.findLatestCompleted(period);
    const drawCount = completedDraws.length;
    const isSufficient = drawCount >= period;

    // Aggregate counts of all 2-digit pairs [00..99]
    const counts = new Map<string, number>();
    for (let i = 0; i < 100; i++) {
      counts.set(String(i).padStart(2, '0'), 0);
    }

    const headCounts = new Array(10).fill(0);
    const tailCounts = new Array(10).fill(0);
    let totalOccurrences = 0;

    for (const draw of completedDraws) {
      const twoDigits = extract2Digits(draw.results);
      for (const num of twoDigits) {
        if (counts.has(num)) {
          counts.set(num, (counts.get(num) || 0) + 1);
          const h = parseInt(num[0], 10);
          const t = parseInt(num[1], 10);
          if (!isNaN(h)) headCounts[h]++;
          if (!isNaN(t)) tailCounts[t]++;
          totalOccurrences++;
        }
      }
    }

    const numbersList: StatisticsNumberItemDTO[] = Array.from(counts.entries())
      .map(([number, count]) => ({ number, count }))
      .sort((a, b) => a.number.localeCompare(b.number));

    const sortedByFrequency = [...numbersList].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.number.localeCompare(b.number);
    });

    const topNumbers = sortedByFrequency.slice(0, 10);
    const bottomNumbers = [...sortedByFrequency].reverse().slice(0, 10);

    const uniqueNumbers = numbersList.filter((item) => item.count > 0).length;
    const averagePerDraw = drawCount > 0 ? +(totalOccurrences / drawCount).toFixed(2) : 0;

    const heads = headCounts.map((count, head) => ({ head, count }));
    const tails = tailCounts.map((count, tail) => ({ tail, count }));

    return {
      period,
      drawCount,
      isSufficient,
      totalOccurrences,
      uniqueNumbers,
      averagePerDraw,
      topNumbers,
      bottomNumbers,
      numbers: numbersList,
      heads,
      tails,
    };
  }

  /**
   * Computes comprehensive statistics for all 2-digit combinations (00-99)
   * for the Last Two-Digit Results Table over the specified range (today, yesterday, 7days, 30days).
   */
  async getTwoDigitTable(rangeParam?: string | null): Promise<TwoDigitTableResponseDTO> {
    const range = validateTwoDigitRangeParam(rangeParam);
    const todayVN = getTodayVN();

    let draws: IXSMBDraw[] = [];
    let rangeLabel = '7 Ngày';
    let dateRangeDisplay = '';

    if (range === 'today') {
      rangeLabel = 'Hôm nay';
      const todayDoc = await this.repository.findByDate(todayVN);
      if (todayDoc && todayDoc.results) {
        draws = [todayDoc];
      }
      dateRangeDisplay = toDDMMYYYYDash(todayVN);
    } else if (range === 'yesterday') {
      rangeLabel = 'Hôm qua';
      const yesterdayVN = addDays(todayVN, -1);
      const yesterdayDoc = await this.repository.findByDate(yesterdayVN);
      if (yesterdayDoc && yesterdayDoc.results) {
        draws = [yesterdayDoc];
        dateRangeDisplay = toDDMMYYYYDash(yesterdayDoc.drawDate);
      } else {
        // Fallback to second latest completed draw if yesterday record not directly indexed
        const latest2 = await this.repository.findLatestCompleted(2);
        if (latest2.length > 1) {
          draws = [latest2[1]];
          dateRangeDisplay = toDDMMYYYYDash(latest2[1].drawDate);
        } else if (latest2.length === 1 && latest2[0].drawDate !== todayVN) {
          draws = [latest2[0]];
          dateRangeDisplay = toDDMMYYYYDash(latest2[0].drawDate);
        } else {
          dateRangeDisplay = toDDMMYYYYDash(yesterdayVN);
        }
      }
    } else if (range === '7days') {
      rangeLabel = '7 Ngày';
      draws = await this.repository.findLatestCompleted(7);
      if (draws.length > 0) {
        const oldest = draws[draws.length - 1].drawDate;
        const newest = draws[0].drawDate;
        dateRangeDisplay = `${toDDMMYYYYDash(oldest)} → ${toDDMMYYYYDash(newest)}`;
      } else {
        dateRangeDisplay = '7 Ngày gần nhất';
      }
    } else if (range === '30days') {
      rangeLabel = '30 Ngày';
      draws = await this.repository.findLatestCompleted(30);
      if (draws.length > 0) {
        const oldest = draws[draws.length - 1].drawDate;
        const newest = draws[0].drawDate;
        dateRangeDisplay = `${toDDMMYYYYDash(oldest)} → ${toDDMMYYYYDash(newest)}`;
      } else {
        dateRangeDisplay = '30 Ngày gần nhất';
      }
    } else if (range === '90days') {
      rangeLabel = '90 Ngày';
      draws = await this.repository.findLatestCompleted(90);
      if (draws.length > 0) {
        const oldest = draws[draws.length - 1].drawDate;
        const newest = draws[0].drawDate;
        dateRangeDisplay = `${toDDMMYYYYDash(oldest)} → ${toDDMMYYYYDash(newest)}`;
      } else {
        dateRangeDisplay = '90 Ngày gần nhất';
      }
    }

    const PRIZE_DETAILS: { key: PrizeTierKey; code: string; label: string }[] = [
      { key: 'special', code: 'ĐB', label: 'Giải Đặc Biệt' },
      { key: 'firstPrize', code: 'G.1', label: 'Giải Nhất' },
      { key: 'secondPrize', code: 'G.2', label: 'Giải Nhì' },
      { key: 'thirdPrize', code: 'G.3', label: 'Giải Ba' },
      { key: 'fourthPrize', code: 'G.4', label: 'Giải Tư' },
      { key: 'fifthPrize', code: 'G.5', label: 'Giải Năm' },
      { key: 'sixthPrize', code: 'G.6', label: 'Giải Sáu' },
      { key: 'seventhPrize', code: 'G.7', label: 'Giải Bảy' },
    ];

    // Initialize 00 through 99
    const numberMap = new Map<string, TwoDigitItemDTO>();
    for (let i = 0; i < 100; i++) {
      const numStr = String(i).padStart(2, '0');
      numberMap.set(numStr, {
        number: numStr,
        count: 0,
        prizes: [],
        prizeCodes: [],
        datesAppeared: [],
        lastAppearance: null,
      });
    }

    let totalOccurrences = 0;

    for (const draw of draws) {
      if (!draw.results) continue;
      const drawDate = draw.drawDate;

      for (const { key, code, label } of PRIZE_DETAILS) {
        const list = draw.results[key] || [];
        for (const rawNum of list) {
          if (typeof rawNum === 'string' && rawNum.trim().length >= 2) {
            const twoDigit = rawNum.trim().slice(-2);
            const item = numberMap.get(twoDigit);
            if (item) {
              item.count++;
              totalOccurrences++;
              item.prizes.push(`${label} (${rawNum.trim()})`);
              if (!item.prizeCodes.includes(code)) {
                item.prizeCodes.push(code);
              }
              if (!item.datesAppeared.includes(drawDate)) {
                item.datesAppeared.push(drawDate);
              }
              if (!item.lastAppearance) {
                item.lastAppearance = drawDate;
              }
            }
          }
        }
      }
    }

    const numbers = Array.from(numberMap.values());
    const uniqueNumbersCount = numbers.filter((n) => n.count > 0).length;

    return {
      range,
      rangeLabel,
      drawCount: draws.length,
      dateRangeDisplay,
      totalOccurrences,
      uniqueNumbersCount,
      numbers,
    };
  }


  /**
   * Retrieves multi-day appearance breakdown and prize matching for a specific 2-digit number.
   */
  async getNumberDetail(
    numberParam: string,
    daysParam?: string | null
  ): Promise<NumberDetailResponseDTO> {
    const target2D = validateNumberParam(numberParam);
    const period = validateDaysParam(daysParam);

    const completedDraws = await this.repository.findLatestCompleted(period);
    let totalOccurrences = 0;
    let activeDays = 0;
    let latestAppearance: string | null = null;
    const dailyHistory: NumberDailyHistoryDTO[] = [];

    for (const draw of completedDraws) {
      const matchingPrizes = findMatchingPrizes(draw.results, target2D);
      const count = matchingPrizes.length;

      if (count > 0) {
        totalOccurrences += count;
        activeDays++;
        if (!latestAppearance) {
          latestAppearance = draw.drawDate;
        }
      }

      dailyHistory.push({
        date: draw.drawDate,
        count,
        prizes: matchingPrizes,
      });
    }

    return {
      number: target2D,
      period,
      drawCount: completedDraws.length,
      totalOccurrences,
      activeDays,
      latestAppearance,
      dailyHistory,
    };
  }

  /**
   * Retrieves real-time drawing progress and status for today or a specific date.
   */
  async getStatus(rawDate?: string | null): Promise<StatusResponseDTO> {
    const targetDate = rawDate ? validateDateParam(rawDate) : getTodayVN();
    const draw = await this.repository.findByDate(targetDate);

    if (!draw) {
      return {
        date: targetDate,
        status: DRAW_STATUS.SCHEDULED,
        progress: 0,
        availableTiers: [],
        updatedAt: null,
        isStale: false,
      };
    }

    const availableTiers: string[] = [];
    let filledCount = 0;

    if (draw.results) {
      for (const { key, code } of PRIZE_TIER_ORDER) {
        const arr = draw.results[key] || [];
        if (arr.length > 0) {
          availableTiers.push(code);
          filledCount += arr.length;
        }
      }
    }

    const progress = Math.min(
      100,
      Math.round((filledCount / TOTAL_PRIZE_NUMBERS) * 100)
    );

    return {
      date: draw.drawDate,
      status: draw.status,
      progress,
      availableTiers,
      updatedAt: draw.updatedAt ? new Date(draw.updatedAt).toISOString() : null,
      isStale: computeIsStale(draw),
    };
  }

  /**
   * Health check for API, MongoDB Atlas, and Scheduler.
   */
  async getHealth(): Promise<HealthResponseDTO> {
    const count = await this.repository.count();

    let schedulerInfo;
    const scheduler = this.scheduler || xsmbSchedulerService;
    if (scheduler) {
      try {
        const s = await scheduler.getStatus();
        schedulerInfo = {
          isRunning: s.isRunning,
          currentPhase: s.currentPhase,
          lastTickAt: s.lastTickAt,
          lastSuccessfulSync: s.lastSuccessfulSync,
          lastFailedSync: s.lastFailedSync,
          lastSyncedDate: s.lastSyncedDate,
        };
      } catch {
        // Scheduler status error ignored
      }
    }

    return {
      status: 'UP',
      database: 'CONNECTED',
      timestamp: new Date().toISOString(),
      totalDraws: count,
      scheduler: schedulerInfo,
    };
  }

  /**
   * DTO Formatter for single draw response
   */
  private formatDrawDTO(doc: IXSMBDraw): DrawResponseDTO {
    const isComplete = doc.status === DRAW_STATUS.READY;
    const isStale = computeIsStale(doc);

    const emptyResults: IXSMBDrawResults = {
      special: [],
      firstPrize: [],
      secondPrize: [],
      thirdPrize: [],
      fourthPrize: [],
      fifthPrize: [],
      sixthPrize: [],
      seventhPrize: [],
    };

    return {
      date: doc.drawDate,
      lotteryType: doc.lotteryType || LOTTERY_TYPE.XSMB,
      status: doc.status,
      province: doc.province || 'Miền Bắc',
      isComplete,
      results: doc.results || emptyResults,
      source: doc.source,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
      fetchedAt: doc.source?.fetchedAt ? new Date(doc.source.fetchedAt).toISOString() : null,
      completedAt: doc.completedAt ? new Date(doc.completedAt).toISOString() : null,
      isStale,
    };
  }
}

export const xsmbAPIService = new XSMBAPIService();
