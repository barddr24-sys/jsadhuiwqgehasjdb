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
import { xsmbSyncRunRepository, XSMBSyncRunRepository } from '../db/repositories/xsmb-sync-run.repository';
import { xsmbSyncAttemptRepository, XSMBSyncAttemptRepository } from '../db/repositories/xsmb-sync-attempt.repository';
import { xsmbSyncJob, XSMBSyncJob } from '../jobs/xsmb-sync.job';
import { isDatabaseConnected } from '../db/connection';
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
import {
  getTodayVN,
  getVietnamBusinessDate,
  addDays,
  toDDMMYYYYDash,
  getDayOfWeekVN,
  isAfterDrawTime,
  isDrawWindow,
  isPastDrawWindow,
  getVNTimeParts,
} from '../date-utils';
import {
  computeExplicitDrawStatus,
  type ExplicitDrawState,
} from '../draw-status';
import type { XSMBPrizes } from '../xsmb-types';
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
import { XSMBMemoryL1Cache } from '../cache/xsmb-l1-cache';

// ─── Service Response Interfaces ─────────────────────────────────────────────

export interface DiagnosticResponseDTO {
  serverTime: string;
  vietnamDate: string;
  vietnamTime: string;
  drawSchedule: {
    startTime: string;
    endTime: string;
    isAfterDrawTime: boolean;
    isDrawWindow: boolean;
    isPastDrawWindow: boolean;
    phase: string;
  };
  database: {
    connected: boolean;
    totalDraws: number;
    todayRecord: {
      exists: boolean;
      status: string | null;
      isComplete: boolean;
      specialPrize: string | null;
      prizeCount: number;
      updatedAt: string | null;
      fetchedAt: string | null;
    };
  };
  lastSync: {
    run: {
      syncRunId?: string;
      status?: string;
      startedAt?: string;
      finishedAt?: string;
      recordsAccepted?: number;
      recordsFetched?: number;
      conflicts?: number;
      error?: string;
    } | null;
    attempt: {
      requestedDate?: string;
      status?: string;
      httpStatus?: number;
      errorMessage?: string;
      startedAt?: string;
      finishedAt?: string;
    } | null;
  };
}

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
  timezone?: string;
  drawTime?: string;
  lotteryType: LotteryType | string;
  status: DrawStatus;
  explicitStatus?: ExplicitDrawState;
  province: string;
  isComplete: boolean;
  results: IXSMBDrawResults;
  result?: IXSMBDrawResults | null;
  source?: IXSMBDrawSource;
  updatedAt: string | null;
  fetchedAt: string | null;
  completedAt: string | null;
  isStale: boolean;
  sourceType?: 'mongodb' | 'cache' | 'in-memory';
  durationMs?: number;
}

export interface HistorySummaryItemDTO {
  date: string;
  status: DrawStatus;
  province: string;
  special: string[];
  firstPrize: string[];
  secondPrize: string[];
  thirdPrize?: string[];
  fourthPrize?: string[];
  fifthPrize?: string[];
  sixthPrize?: string[];
  seventhPrize?: string[];
  results?: IXSMBDrawResults;
  completedAt?: string;
  updatedAt?: string;
}

export interface InitialHomeDataDTO {
  today: DrawResponseDTO | null;
  todayDate: string;
  stats7Day: StatPreviewItem[];
  recentResults: RecentResultSummary[];
}

export interface StatPreviewItem {
  number: string;
  count: number;
}

export interface RecentResultSummary {
  date: string;
  dayOfWeek: string;
  displayDate: string;
  shortDate: string;
  specialPrize: string;
  twoDigit: string;
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

// ─── L1 In-Memory Cache & Singleflight Request Deduplication ─────────────────

export const xsmbMemoryCache = new XSMBMemoryL1Cache();

export function clearXSMBCache(): void {
  xsmbMemoryCache.clear();
}

// In-flight promise deduplication map
const inFlightRequests = new Map<string, Promise<unknown>>();

function deduplicateRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fn().finally(() => {
    inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, promise);
  return promise;
}

// ─── Application Service Class ───────────────────────────────────────────────

export class XSMBAPIService {
  constructor(
    private readonly repository: XSMBDrawRepository = xsmbDrawRepository,
    private readonly scheduler?: XSMBSchedulerService,
    private readonly syncJob: XSMBSyncJob = xsmbSyncJob,
    private readonly syncRunRepo: XSMBSyncRunRepository = xsmbSyncRunRepository,
    private readonly syncAttemptRepo: XSMBSyncAttemptRepository = xsmbSyncAttemptRepository
  ) {}

  /**
   * Clears in-memory L1 cache
   */
  clearCache(): void {
    xsmbMemoryCache.clear();
  }

  /**
   * Retrieves the XSMB draw for today's canonical Vietnam business date.
   * If today's result is missing/incomplete after draw time (>= 18:15 VN),
   * triggers a deduplicated on-demand synchronization.
   */
  async getTodayDraw(): Promise<DrawResponseDTO> {
    const startTime = Date.now();
    const todayVN = getVietnamBusinessDate();

    const cachedToday = xsmbMemoryCache.get<DrawResponseDTO>(`draw:date:${todayVN}`);
    if (cachedToday && cachedToday.isComplete) {
      return {
        ...cachedToday,
        sourceType: 'cache',
        durationMs: Date.now() - startTime,
      };
    }

    return deduplicateRequest(`draw:today:${todayVN}`, async () => {
      const dbStart = Date.now();
      let doc = await this.repository.findByDate(todayVN);

      // 1. If today's draw already exists in MongoDB and is completed (READY), return immediately
      if (doc && doc.status === DRAW_STATUS.READY) {
        const dto = this.formatDrawDTO(doc);
        dto.sourceType = 'mongodb';
        dto.durationMs = Date.now() - dbStart;
        xsmbMemoryCache.set(`draw:date:${todayVN}`, dto, 300_000);
        return dto;
      }

      // 2. If existing record is CONFLICT, do not auto-overwrite without explicit flag
      if (doc && doc.status === DRAW_STATUS.CONFLICT) {
        const dto = this.formatDrawDTO(doc);
        dto.sourceType = 'mongodb';
        dto.durationMs = Date.now() - dbStart;
        return dto;
      }

      // 3. If result is missing or PARTIAL, check if draw time has started or passed
      const afterDraw = isAfterDrawTime();
      if (afterDraw) {
        try {
          if (process.env.NODE_ENV !== 'test') {
            console.log(`[getTodayDraw] Post-draw check for ${todayVN}: triggering deduplicated sync`);
          }
          await this.syncJob.execute(todayVN, { maxRetries: 2, lockTtlSec: 60 });
          doc = await this.repository.findByDate(todayVN);
        } catch (syncErr) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[getTodayDraw] On-demand sync attempt error:', syncErr);
          }
        }
      }

      // 4. If MongoDB now contains today's record (READY, PARTIAL, or SCHEDULED)
      if (doc) {
        const dto = this.formatDrawDTO(doc);
        dto.sourceType = 'mongodb';
        dto.durationMs = Date.now() - dbStart;
        const ttl = dto.isComplete ? 300_000 : 10_000;
        xsmbMemoryCache.set(`draw:date:${todayVN}`, dto, ttl);
        return dto;
      }

      // 5. Document does not exist in MongoDB yet (pre-draw or external provider has not published yet)
      const explicitStatus = computeExplicitDrawStatus(todayVN, null);
      const pendingStatus: DrawStatus = isDrawWindow()
        ? DRAW_STATUS.UPDATING
        : (isPastDrawWindow() ? DRAW_STATUS.UPDATING : DRAW_STATUS.SCHEDULED);

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

      const pendingDTO: DrawResponseDTO = {
        date: todayVN,
        timezone: 'Asia/Ho_Chi_Minh',
        drawTime: '18:15',
        lotteryType: LOTTERY_TYPE.XSMB,
        status: pendingStatus,
        explicitStatus,
        province: 'Miền Bắc',
        isComplete: false,
        results: emptyResults,
        result: null,
        updatedAt: null,
        fetchedAt: null,
        completedAt: null,
        isStale: false,
        sourceType: 'mongodb',
        durationMs: Date.now() - dbStart,
      };

      const ttl = afterDraw ? 10_000 : 60_000;
      xsmbMemoryCache.set(`draw:date:${todayVN}`, pendingDTO, ttl);

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[getTodayDraw] Returning pending state for ${todayVN} (status: ${pendingStatus}, explicit: ${explicitStatus})`);
      }

      return pendingDTO;
    });
  }

  /**
   * Retrieves XSMB draw result by specific date (YYYY-MM-DD).
   * Checks L1 cache -> MongoDB.
   */
  async getDrawByDate(rawDate: string): Promise<DrawResponseDTO> {
    const startTime = Date.now();
    const date = validateDateParam(rawDate);
    const todayVN = getTodayVN();

    const cacheKey = `draw:date:${date}`;
    const cached = xsmbMemoryCache.get<DrawResponseDTO>(cacheKey);
    if (cached) {
      return {
        ...cached,
        sourceType: 'cache',
        durationMs: Date.now() - startTime,
      };
    }

    return deduplicateRequest(cacheKey, async () => {
      const dbStart = Date.now();
      let doc = await this.repository.findByDate(date);

      // If requested date is today and not in MongoDB yet, check if sync is needed
      if (!doc && date === todayVN && isAfterDrawTime()) {
        try {
          await this.syncJob.execute(todayVN, { maxRetries: 2, lockTtlSec: 30 });
          doc = await this.repository.findByDate(todayVN);
        } catch {
          // Ignore
        }
      }

      if (!doc) {
        throw XSMBAPIError.notFound(
          'XSMB_RESULT_NOT_FOUND',
          'No XSMB result is available for this date'
        );
      }

      const dto = this.formatDrawDTO(doc);
      dto.sourceType = 'mongodb';
      dto.durationMs = Date.now() - dbStart;

      // Cache completed historical draws longer (1 hour)
      const ttl = dto.isComplete ? 3_600_000 : 15_000;
      xsmbMemoryCache.set(cacheKey, dto, ttl);

      return dto;
    });
  }

  /**
   * Retrieves historical completed draws with pagination.
   * Supports `includeResults` to return full prize tiers in a single query.
   */
  async getHistory(
    pageStr?: string | null,
    pageSizeStr?: string | null,
    includeResultsStr?: string | boolean | null
  ): Promise<{ items: HistorySummaryItemDTO[]; pagination: PaginationMeta }> {
    const { page, pageSize } = validatePaginationParams(pageStr, pageSizeStr);
    const includeResults =
      includeResultsStr === true ||
      includeResultsStr === 'true' ||
      includeResultsStr === '1';

    const offset = (page - 1) * pageSize;
    const cacheKey = `history:${page}:${pageSize}:${includeResults ? 'full' : 'summary'}`;

    const cached = xsmbMemoryCache.get<{ items: HistorySummaryItemDTO[]; pagination: PaginationMeta }>(cacheKey);
    if (cached) return cached;

    return deduplicateRequest(cacheKey, async () => {
      const result = await this.repository.findHistory(pageSize, offset, {
        status: DRAW_STATUS.READY,
      });

      const totalPages = result.total > 0 ? Math.ceil(result.total / pageSize) : 0;

      const items: HistorySummaryItemDTO[] = result.items.map((doc) => {
        const item: HistorySummaryItemDTO = {
          date: doc.drawDate,
          status: doc.status,
          province: doc.province || 'Miền Bắc',
          special: doc.results?.special || [],
          firstPrize: doc.results?.firstPrize || [],
          secondPrize: doc.results?.secondPrize || [],
          completedAt: doc.completedAt ? new Date(doc.completedAt).toISOString() : undefined,
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
        };

        if (includeResults && doc.results) {
          item.thirdPrize = doc.results.thirdPrize || [];
          item.fourthPrize = doc.results.fourthPrize || [];
          item.fifthPrize = doc.results.fifthPrize || [];
          item.sixthPrize = doc.results.sixthPrize || [];
          item.seventhPrize = doc.results.seventhPrize || [];
          item.results = doc.results;
        }

        return item;
      });

      const pagination: PaginationMeta = {
        page,
        pageSize,
        total: result.total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };

      const payload = { items, pagination };
      xsmbMemoryCache.set(cacheKey, payload, 60_000); // 1 min cache
      return payload;
    });
  }

  /**
   * Retrieves pre-aggregated initial data for HomeScreen in Server Components.
   * Runs queries in parallel directly on MongoDB without client-side waterfall delays.
   */
  async getInitialHomeData(): Promise<InitialHomeDataDTO> {
    const todayVN = getTodayVN();
    const startTime = Date.now();

    const [todayRes, statsRes, historyRes] = await Promise.allSettled([
      this.getTodayDraw(),
      this.getStatistics('7'),
      this.getHistory('1', '5'),
    ]);

    const today = todayRes.status === 'fulfilled' ? todayRes.value : null;

    let stats7Day: StatPreviewItem[] = [];
    if (statsRes.status === 'fulfilled' && statsRes.value) {
      stats7Day = (statsRes.value.topNumbers || []).slice(0, 8).map((item) => ({
        number: item.number,
        count: item.count,
      }));
    }

    let recentResults: RecentResultSummary[] = [];
    if (historyRes.status === 'fulfilled' && historyRes.value?.items) {
      recentResults = historyRes.value.items.map((item) => {
        const dayOfWeek = getDayOfWeekVN(item.date);
        const [year, month, day] = item.date.split('-');
        return {
          date: item.date,
          dayOfWeek,
          displayDate: `${day}/${month}/${year}`,
          shortDate: `${day}/${month}`,
          specialPrize: item.special?.[0] || '—',
          twoDigit: item.special?.[0]?.slice(-2) || '—',
        };
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[PERF][getInitialHomeData] Parallel query completed in ${Date.now() - startTime}ms`);
    }

    return {
      today,
      todayDate: todayVN,
      stats7Day,
      recentResults,
    };
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
   * System diagnostic report for operations, incident triage, and monitoring.
   * Safe for dev/admin inspection (no credentials/secrets exposed).
   */
  async getDiagnostic(): Promise<DiagnosticResponseDTO> {
    const todayVN = getTodayVN();
    const parts = getVNTimeParts();
    const timeStr = `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}:${String(parts.second).padStart(2, '0')}`;
    const totalDraws = await this.repository.count().catch(() => 0);
    const todayDoc = await this.repository.findByDate(todayVN).catch(() => null);

    let countPrizes = 0;
    if (todayDoc?.results) {
      for (const { key } of PRIZE_TIER_ORDER) {
        countPrizes += (todayDoc.results[key] || []).length;
      }
    }

    let lastRun: DiagnosticResponseDTO['lastSync']['run'] = null;
    try {
      const runs = await this.syncRunRepo.findRecent(1);
      if (runs.length > 0) {
        const r = runs[0];
        lastRun = {
          syncRunId: r.syncRunId,
          status: r.status,
          startedAt: r.startedAt ? new Date(r.startedAt).toISOString() : undefined,
          finishedAt: r.finishedAt ? new Date(r.finishedAt).toISOString() : undefined,
          recordsAccepted: r.recordsAccepted,
          recordsFetched: r.recordsFetched,
          conflicts: r.conflicts,
          error: r.error,
        };
      }
    } catch {
      // Ignore
    }

    let lastAttempt: DiagnosticResponseDTO['lastSync']['attempt'] = null;
    try {
      const attempts = await this.syncAttemptRepo.findRecent(1);
      if (attempts.length > 0) {
        const a = attempts[0];
        lastAttempt = {
          requestedDate: a.requestedDate,
          status: a.status,
          httpStatus: a.httpStatus,
          errorMessage: a.errorMessage,
          startedAt: a.startedAt ? new Date(a.startedAt).toISOString() : undefined,
          finishedAt: a.finishedAt ? new Date(a.finishedAt).toISOString() : undefined,
        };
      }
    } catch {
      // Ignore
    }

    const afterDraw = isAfterDrawTime();
    const inWindow = isDrawWindow();
    const pastWindow = isPastDrawWindow();
    const phase = computeExplicitDrawStatus(todayVN, todayDoc?.status === DRAW_STATUS.READY ? (todayDoc.results as unknown as XSMBPrizes) : null);

    return {
      serverTime: new Date().toISOString(),
      vietnamDate: todayVN,
      vietnamTime: timeStr,
      drawSchedule: {
        startTime: '18:15',
        endTime: '18:35',
        isAfterDrawTime: afterDraw,
        isDrawWindow: inWindow,
        isPastDrawWindow: pastWindow,
        phase,
      },
      database: {
        connected: isDatabaseConnected(),
        totalDraws,
        todayRecord: {
          exists: Boolean(todayDoc),
          status: todayDoc?.status || null,
          isComplete: todayDoc?.status === DRAW_STATUS.READY,
          specialPrize: todayDoc?.results?.special?.[0] || null,
          prizeCount: countPrizes,
          updatedAt: todayDoc?.updatedAt ? new Date(todayDoc.updatedAt).toISOString() : null,
          fetchedAt: todayDoc?.source?.fetchedAt ? new Date(todayDoc.source.fetchedAt).toISOString() : null,
        },
      },
      lastSync: {
        run: lastRun,
        attempt: lastAttempt,
      },
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
    const explicitStatus: ExplicitDrawState = isComplete
      ? 'RESULT_AVAILABLE'
      : (doc.status === DRAW_STATUS.CONFLICT ? 'SOURCE_ERROR' : 'SYNCING');

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

    const results = doc.results || emptyResults;

    return {
      date: doc.drawDate,
      timezone: 'Asia/Ho_Chi_Minh',
      drawTime: '18:15',
      lotteryType: doc.lotteryType || LOTTERY_TYPE.XSMB,
      status: doc.status,
      explicitStatus,
      province: doc.province || 'Miền Bắc',
      isComplete,
      results,
      result: isComplete ? results : null,
      source: doc.source,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
      fetchedAt: doc.source?.fetchedAt ? new Date(doc.source.fetchedAt).toISOString() : null,
      completedAt: doc.completedAt ? new Date(doc.completedAt).toISOString() : null,
      isStale,
    };
  }
}

export const xsmbAPIService = new XSMBAPIService();
