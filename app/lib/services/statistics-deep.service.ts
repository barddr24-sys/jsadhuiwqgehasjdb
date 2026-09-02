/**
 * XSMB Deep Statistics & Aggregation Engine
 *
 * Implements pure mathematical aggregation over real MongoDB historical XSMB draws.
 * Zero mock data, zero gambling/predictive claims, 100% reproducible.
 */

import { xsmbDrawRepository, type XSMBDrawRepository } from '../db/repositories/xsmb-draw.repository';
import {
  StatisticsDateRangeService,
  type DateRangeConfig,
  type DataCompletenessEvaluation,
} from './statistics-date-range.service';
import { StatisticsCacheService } from './statistics-cache.service';
import { getDayOfWeekVN, toDDMMYYYYDash } from '../date-utils';
import type { IXSMBDraw, IXSMBDrawResults } from '../db/types/db-types';
import type { PrizeTierKey } from '../db/config/prize-config';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface ExtractedPrizeNumber {
  number: string;     // 2-digit "00".."99"
  fullNumber: string; // e.g. "85429"
  tierKey: PrizeTierKey;
  tierCode: string;   // e.g. "SPECIAL", "G.1"
  tierLabel: string;  // e.g. "Giải Đặc Biệt", "Giải Nhất"
}

export interface DayAppearanceItem {
  date: string;
  shortDate: string;
  dayOfWeek: string;
  appeared: boolean;
  count: number;
  prizes: { tierCode: string; tierLabel: string; fullNumber: string }[];
}

export type TrendType = 'increasing' | 'stable' | 'decreasing' | 'recently_active' | 'recently_inactive';

export interface LotoNumberStat {
  number: string;
  frequency: number;
  percentage: number;
  daysAppeared: number;
  daysPercentage: number;
  lastAppearance: string | null;
  lastAppearanceDisplay: string | null;
  currentGap: number;     //   hiện tại (0 if appeared in newest draw)
  avgGap: number;         //   trung bình
  maxGap: number;         //   cực đại trong kỳ
  recentFrequency: number; // Frequency in recent half of window
  streak: number;         // Current streak of consecutive draws
  longestStreak: number;  // Longest streak in period
  trend: TrendType;
  trendLabel: string;
  appearances: DayAppearanceItem[];
}

export interface HotNumberStat {
  rank: number;
  number: string;
  frequency: number;
  percentage: number;
  recentFrequency: number;
  streak: number;
  lastAppearance: string | null;
}

export interface ColdNumberStat {
  rank: number;
  number: string;
  frequency: number;
  currentGap: number;
  lastAppearance: string | null;
}

export interface NumberStat {
  rank: number;
  number: string;
  currentGap: number;
  avgGap: number;
  maxGap: number;
  lastAppearance: string | null;
  statusLevel: 'extreme' | 'high' | 'moderate' | 'normal';
  statusLabel: string;
}

// GanNumberStat is an alias of NumberStat
export type GanNumberStat = NumberStat;

export interface NumberIntervalStat {
  number: string;
  appearancesCount: number;
  minInterval: number;
  avgInterval: number;
  maxInterval: number;
  currentInterval: number;
  intervalsList: number[];
}

export interface StreakNumberStat {
  number: string;
  currentStreak: number;
  longestStreak: number;
  streak2Count: number; // times appeared 2 consecutive draws
  streak3Count: number; // times appeared 3 consecutive draws
  streak4PlusCount: number;
  lastAppearance: string | null;
}

export interface PairStat {
  pair: [string, string]; // [num1, num2] sorted
  pairLabel: string;      // "27 – 72"
  frequency: number;      // draws where both appeared
  percentage: number;
  latestOccurrence: string | null;
  currentGap: number;
}

export interface ReversePairStat {
  numA: string;
  numB: string;
  label: string;          // "27 ↔ 72"
  freqA: number;
  freqB: number;
  combinedFreq: number;
  coOccurrence: number;   // draws where both appeared together
  lastAppearedA: string | null;
  lastAppearedB: string | null;
  currentGapA: number;
  currentGapB: number;
}

export interface DigitStat {
  digit: number;
  frequency: number;
  percentage: number;
}

export interface HeadTailAnalysis {
  heads: DigitStat[];
  tails: DigitStat[];
  mostFrequentHead: { digit: number; frequency: number };
  leastFrequentHead: { digit: number; frequency: number };
  mostFrequentTail: { digit: number; frequency: number };
  leastFrequentTail: { digit: number; frequency: number };
}

export interface ParityAnalysis {
  evenCount: number;
  evenPercentage: number;
  oddCount: number;
  oddPercentage: number;
  evenEvenCount: number; // Chẵn - Chẵn (00, 02, 20...)
  evenEvenPercentage: number;
  evenOddCount: number;  // Chẵn - Lẻ (01, 03, 21...)
  evenOddPercentage: number;
  oddEvenCount: number;  // Lẻ - Chẵn (10, 12, 30...)
  oddEvenPercentage: number;
  oddOddCount: number;   // Lẻ - Lẻ (11, 13, 31...)
  oddOddPercentage: number;
}

export interface LowHighAnalysis {
  lowCount: number;       // 00–49
  lowPercentage: number;
  highCount: number;      // 50–99
  highPercentage: number;
}

export interface DailyTimeSeriesItem {
  date: string;
  shortDate: string;
  dayOfWeek: string;
  totalPrizes: number;
  uniqueNumbers: number;
  specialPrizeTail: string;
  specialPrizeFull: string;
  evenCount: number;
  oddCount: number;
  lowCount: number;
  highCount: number;
  headDistribution: number[]; // counts for heads 0..9
  tailDistribution: number[]; // counts for tails 0..9
}

export interface SpecialPrizeOccurrence {
  date: string;
  shortDate: string;
  dayOfWeek: string;
  fullNumber: string;
  tail: string;
}

export interface SpecialPrizeNumberStat {
  number: string;
  frequency: number;
  percentage: number;
  lastAppearance: string | null;
  currentGap: number;
  avgGap: number;
  maxGap: number;
  trend: TrendType;
  history: SpecialPrizeOccurrence[];
}

export interface SpecialPrizeAnalysisResponse {
  range: DateRangeConfig;
  completeness: DataCompletenessEvaluation;
  totalDraws: number;
  uniqueSpecialNumbersCount: number;
  allNumbers: SpecialPrizeNumberStat[];
  hotNumbers: SpecialPrizeNumberStat[];
  coldNumbers: SpecialPrizeNumberStat[];
  ganNumbers: SpecialPrizeNumberStat[];
  recentOccurrences: SpecialPrizeOccurrence[];
}

export interface StatisticsOverviewDTO {
  range: DateRangeConfig;
  completeness: DataCompletenessEvaluation;
  drawCount: number;
  totalOccurrences: number;
  uniqueNumbersCount: number;
  averagePerDraw: number;
  mostFrequentLoto: LotoNumberStat[];
  leastFrequentLoto: LotoNumberStat[];
  highestGanLoto: GanNumberStat[];
  specialPrizeHighlights: SpecialPrizeNumberStat[];
  topPairs: PairStat[];
  headTail: HeadTailAnalysis;
  parity: ParityAnalysis;
  lowHigh: LowHighAnalysis;
  dailyBreakdown: DailyTimeSeriesItem[];
}

export interface StatisticsLotoTableDTO {
  range: DateRangeConfig;
  completeness: DataCompletenessEvaluation;
  drawCount: number;
  totalOccurrences: number;
  uniqueNumbersCount: number;
  allNumbers: LotoNumberStat[];
  hotNumbers: LotoNumberStat[];
  coldNumbers: LotoNumberStat[];
  ganRanking: GanNumberStat[];
  streaks: StreakNumberStat[];
  intervals: NumberIntervalStat[];
  headTail: HeadTailAnalysis;
  parity: ParityAnalysis;
  lowHigh: LowHighAnalysis;
}

export interface StatisticsGanDTO {
  range: DateRangeConfig;
  completeness: DataCompletenessEvaluation;
  drawCount: number;
  ganRanking: GanNumberStat[];
  intervals: NumberIntervalStat[];
}

export interface StatisticsPairsDTO {
  range: DateRangeConfig;
  completeness: DataCompletenessEvaluation;
  drawCount: number;
  topPairs: PairStat[];
  reversePairs: ReversePairStat[];
}

/** Alias for the special prize analysis response */
export type StatisticsSpecialPrizeDTO = SpecialPrizeAnalysisResponse;

export interface NumberDetailSearchResult {
  number: string;
  range: DateRangeConfig;
  completeness: DataCompletenessEvaluation;
  loto: {
    frequency: number;
    percentage: number;
    rank: number;
    daysAppeared: number;
    currentGap: number;
    avgGap: number;
    maxGap: number;
    streak: number;
    longestStreak: number;
    trend: TrendType;
    trendLabel: string;
    appearances: DayAppearanceItem[];
  };
  reverseNumber: {
    reverseNumber: string;
    frequency: number;
    currentGap: number;
    combinedFrequency: number;
    coOccurrenceCount: number;
    lastCoOccurrence: string | null;
  };
  topCoOccurringPairs: {
    partnerNumber: string;
    coFrequency: number;
    percentage: number;
    lastCoOccurrence: string | null;
  }[];
  specialPrize: {
    frequency: number;
    percentage: number;
    currentGap: number;
    avgGap: number;
    maxGap: number;
    occurrences: SpecialPrizeOccurrence[];
  };
}

export interface PeriodComparisonItem {
  number: string;
  periodAFreq: number;
  periodARank: number;
  periodAPercentage: number;
  periodBFreq: number;
  periodBRank: number;
  periodBPercentage: number;
  freqDelta: number;
  rankDelta: number;
  status: 'rising' | 'falling' | 'stable';
}

export interface PeriodComparisonResponse {
  periodA: DateRangeConfig;
  periodB: DateRangeConfig;
  completenessA: DataCompletenessEvaluation;
  completenessB: DataCompletenessEvaluation;
  comparison: PeriodComparisonItem[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const PRIZE_TIERS: { key: PrizeTierKey; code: string; label: string }[] = [
  { key: 'special', code: 'SPECIAL', label: 'Giải Đặc Biệt' },
  { key: 'firstPrize', code: 'FIRST', label: 'Giải Nhất' },
  { key: 'secondPrize', code: 'SECOND', label: 'Giải Nhì' },
  { key: 'thirdPrize', code: 'THIRD', label: 'Giải Ba' },
  { key: 'fourthPrize', code: 'FOURTH', label: 'Giải Tư' },
  { key: 'fifthPrize', code: 'FIFTH', label: 'Giải Năm' },
  { key: 'sixthPrize', code: 'SIXTH', label: 'Giải Sáu' },
  { key: 'seventhPrize', code: 'SEVENTH', label: 'Giải Bảy' },
];

export function extractAll2DigitsFromDraw(results?: IXSMBDrawResults): ExtractedPrizeNumber[] {
  if (!results) return [];
  const items: ExtractedPrizeNumber[] = [];

  for (const tier of PRIZE_TIERS) {
    const list = results[tier.key] || [];
    for (const raw of list) {
      if (typeof raw === 'string' && raw.trim().length >= 2) {
        const cleaned = raw.trim();
        const twoDigit = cleaned.slice(-2);
        items.push({
          number: twoDigit,
          fullNumber: cleaned,
          tierKey: tier.key,
          tierCode: tier.code,
          tierLabel: tier.label,
        });
      }
    }
  }

  return items;
}

export function extractSpecialTailFromDraw(results?: IXSMBDrawResults): { tail: string; fullNumber: string } | null {
  if (!results || !results.special || results.special.length === 0) return null;
  const raw = results.special[0];
  if (typeof raw === 'string' && raw.trim().length >= 2) {
    const cleaned = raw.trim();
    return {
      tail: cleaned.slice(-2),
      fullNumber: cleaned,
    };
  }
  return null;
}

export function calculateTrend(
  recentFreq: number,
  recentDraws: number,
  olderFreq: number,
  olderDraws: number,
  currentGap: number,
  currentStreak: number,
  totalDraws: number
): { trend: TrendType; label: string } {
  if (totalDraws <= 2) {
    return { trend: 'stable', label: 'Ổn định' };
  }

  if (currentGap === 0 && currentStreak >= 2) {
    return { trend: 'recently_active', label: 'Mới về liên tiếp' };
  }

  if (currentGap >= Math.min(8, Math.floor(totalDraws * 0.4)) && recentFreq === 0) {
    return { trend: 'recently_inactive', label: 'Đang chững' };
  }

  const recentRate = recentDraws > 0 ? recentFreq / recentDraws : 0;
  const olderRate = olderDraws > 0 ? olderFreq / olderDraws : 0;

  if (olderRate === 0 && recentRate > 0) {
    return { trend: 'increasing', label: 'Xu hướng tăng' };
  }

  if (recentRate === 0 && olderRate > 0) {
    return { trend: 'decreasing', label: 'Xu hướng giảm' };
  }

  const ratio = olderRate > 0 ? recentRate / olderRate : 1;

  if (ratio >= 1.35) {
    return { trend: 'increasing', label: 'Xu hướng tăng' };
  } else if (ratio <= 0.65) {
    return { trend: 'decreasing', label: 'Xu hướng giảm' };
  } else {
    return { trend: 'stable', label: 'Ổn định' };
  }
}

// ─── Main Statistics Deep Service Class ──────────────────────────────────────

export class StatisticsDeepService {
  constructor(private readonly repository: XSMBDrawRepository = xsmbDrawRepository) { }

  /**
   * Fetches draws for a specific date range config
   */
  private async getDrawsForRange(rangeConfig: DateRangeConfig): Promise<{
    draws: IXSMBDraw[];
    completeness: DataCompletenessEvaluation;
  }> {
    const docs = await this.repository.findDateRange(
      rangeConfig.startDate,
      rangeConfig.endDate
    );

    // Filter to READY draws and sort descending by drawDate (newest first)
    const completedDraws = docs
      .filter((d) => d.status === 'READY')
      .sort((a, b) => b.drawDate.localeCompare(a.drawDate));

    const availableDates = completedDraws.map((d) => d.drawDate);
    const completeness = StatisticsDateRangeService.evaluateCompleteness(
      rangeConfig.expectedDates,
      availableDates
    );

    return { draws: completedDraws, completeness };
  }

  /**
   * Helper to resolve DateRangeConfig anchored to latest available draw
   */
  private async resolveRange(rangeInput?: string | number | null): Promise<DateRangeConfig> {
    const latest = await this.repository.findLatest();
    return StatisticsDateRangeService.resolveDateRange(rangeInput, {
      anchorDate: latest?.drawDate,
    });
  }

  /**
   * 1. OVERVIEW — Key metrics & high-level summary
   */
  async getOverview(rangeInput?: string | number | null): Promise<StatisticsOverviewDTO> {
    const rangeConfig = await this.resolveRange(rangeInput);
    const cacheKey = StatisticsCacheService.buildKey('overview', rangeConfig.rangeKey, {
      start: rangeConfig.startDate,
      end: rangeConfig.endDate,
    });

    const cached = StatisticsCacheService.get<StatisticsOverviewDTO>(cacheKey);
    if (cached) return cached;

    const { draws, completeness } = await this.getDrawsForRange(rangeConfig);
    const lotoData = this.computeLotoStatistics(draws);
    const specialData = this.computeSpecialPrizeStatistics(draws);
    const pairsData = this.computePairStatistics(draws);
    const headTailData = this.computeHeadTailAnalysis(draws);
    const parityData = this.computeParityAnalysis(draws);
    const lowHighData = this.computeLowHighAnalysis(draws);
    const dailyBreakdown = this.computeDailyTimeSeries(draws);

    let totalOccurrences = 0;
    lotoData.allNumbers.forEach((n) => {
      totalOccurrences += n.frequency;
    });

    const uniqueNumbersCount = lotoData.allNumbers.filter((n) => n.frequency > 0).length;
    const averagePerDraw = draws.length > 0 ? +(totalOccurrences / draws.length).toFixed(2) : 0;

    const result: StatisticsOverviewDTO = {
      range: rangeConfig,
      completeness,
      drawCount: draws.length,
      totalOccurrences,
      uniqueNumbersCount,
      averagePerDraw,
      mostFrequentLoto: lotoData.hotNumbers.slice(0, 5),
      leastFrequentLoto: lotoData.coldNumbers.slice(0, 5),
      highestGanLoto: lotoData.ganRanking.slice(0, 5),
      specialPrizeHighlights: specialData.hotNumbers.slice(0, 5),
      topPairs: pairsData.pairs.slice(0, 6),
      headTail: headTailData,
      parity: parityData,
      lowHigh: lowHighData,
      dailyBreakdown,
    };

    StatisticsCacheService.set(cacheKey, result);
    return result;
  }

  /**
   * 2. LOTO ANALYSIS — 00–99 Full Analysis Matrix
   */
  async getLotoAnalysis(rangeInput?: string | number | null) {
    const rangeConfig = await this.resolveRange(rangeInput);
    const cacheKey = StatisticsCacheService.buildKey('loto', rangeConfig.rangeKey, {
      start: rangeConfig.startDate,
      end: rangeConfig.endDate,
    });

    const cached = StatisticsCacheService.get(cacheKey);
    if (cached) return cached;

    const { draws, completeness } = await this.getDrawsForRange(rangeConfig);
    const lotoData = this.computeLotoStatistics(draws);
    const headTail = this.computeHeadTailAnalysis(draws);
    const parity = this.computeParityAnalysis(draws);
    const lowHigh = this.computeLowHighAnalysis(draws);
    const streaks = this.computeStreakStatistics(draws);
    const intervals = this.computeIntervalStatistics(draws);

    const result = {
      range: rangeConfig,
      completeness,
      drawCount: draws.length,
      totalOccurrences: lotoData.totalOccurrences,
      uniqueNumbersCount: lotoData.uniqueNumbersCount,
      allNumbers: lotoData.allNumbers,
      hotNumbers: lotoData.hotNumbers,
      coldNumbers: lotoData.coldNumbers,
      ganRanking: lotoData.ganRanking,
      streaks,
      intervals,
      headTail,
      parity,
      lowHigh,
    };

    StatisticsCacheService.set(cacheKey, result);
    return result;
  }

  /**
   * 3. GAN & OVERDUE ANALYSIS
   */
  async getGanAnalysis(rangeInput?: string | number | null) {
    const rangeConfig = await this.resolveRange(rangeInput);
    const cacheKey = StatisticsCacheService.buildKey('gan', rangeConfig.rangeKey, {
      start: rangeConfig.startDate,
      end: rangeConfig.endDate,
    });

    const cached = StatisticsCacheService.get(cacheKey);
    if (cached) return cached;

    const { draws, completeness } = await this.getDrawsForRange(rangeConfig);
    const lotoData = this.computeLotoStatistics(draws);
    const intervals = this.computeIntervalStatistics(draws);

    const result = {
      range: rangeConfig,
      completeness,
      drawCount: draws.length,
      ganRanking: lotoData.ganRanking,
      intervals,
    };

    StatisticsCacheService.set(cacheKey, result);
    return result;
  }

  /**
   * 4. PAIRS & REVERSE NUMBERS ANALYSIS
   */
  async getPairAnalysis(rangeInput?: string | number | null) {
    const rangeConfig = await this.resolveRange(rangeInput);
    const cacheKey = StatisticsCacheService.buildKey('pairs', rangeConfig.rangeKey, {
      start: rangeConfig.startDate,
      end: rangeConfig.endDate,
    });

    const cached = StatisticsCacheService.get(cacheKey);
    if (cached) return cached;

    const { draws, completeness } = await this.getDrawsForRange(rangeConfig);
    const pairStats = this.computePairStatistics(draws);
    const reverseStats = this.computeReversePairStatistics(draws);

    const result = {
      range: rangeConfig,
      completeness,
      drawCount: draws.length,
      topPairs: pairStats.pairs,
      reversePairs: reverseStats,
    };

    StatisticsCacheService.set(cacheKey, result);
    return result;
  }

  /**
   * 5. SPECIAL PRIZE LAST TWO DIGITS ANALYSIS
   */
  async getSpecialPrizeAnalysis(rangeInput?: string | number | null): Promise<SpecialPrizeAnalysisResponse> {
    const rangeConfig = await this.resolveRange(rangeInput);
    const cacheKey = StatisticsCacheService.buildKey('special-last-two', rangeConfig.rangeKey, {
      start: rangeConfig.startDate,
      end: rangeConfig.endDate,
    });

    const cached = StatisticsCacheService.get<SpecialPrizeAnalysisResponse>(cacheKey);
    if (cached) return cached;

    const { draws, completeness } = await this.getDrawsForRange(rangeConfig);
    const specialData = this.computeSpecialPrizeStatistics(draws);

    const result: SpecialPrizeAnalysisResponse = {
      range: rangeConfig,
      completeness,
      totalDraws: draws.length,
      uniqueSpecialNumbersCount: specialData.allNumbers.filter((n) => n.frequency > 0).length,
      allNumbers: specialData.allNumbers,
      hotNumbers: specialData.hotNumbers,
      coldNumbers: specialData.coldNumbers,
      ganNumbers: specialData.ganNumbers,
      recentOccurrences: specialData.recentOccurrences,
    };

    StatisticsCacheService.set(cacheKey, result);
    return result;
  }

  /**
   * 6. GLOBAL NUMBER SEARCH (00–99 Deep Lookup)
   */
  async searchNumber(
    numberInput: string,
    rangeInput?: string | number | null
  ): Promise<NumberDetailSearchResult> {
    const num = String(numberInput).padStart(2, '0').slice(-2);
    const rangeConfig = await this.resolveRange(rangeInput);

    const { draws, completeness } = await this.getDrawsForRange(rangeConfig);
    const lotoData = this.computeLotoStatistics(draws);
    const specialData = this.computeSpecialPrizeStatistics(draws);

    const lotoStat = lotoData.allNumbers.find((n) => n.number === num) || {
      number: num,
      frequency: 0,
      percentage: 0,
      daysAppeared: 0,
      daysPercentage: 0,
      lastAppearance: null,
      lastAppearanceDisplay: null,
      currentGap: draws.length,
      avgGap: draws.length,
      maxGap: draws.length,
      recentFrequency: 0,
      streak: 0,
      longestStreak: 0,
      trend: 'stable' as TrendType,
      trendLabel: 'Ổn định',
      appearances: [],
    };

    // Calculate rank
    const sortedDesc = [...lotoData.allNumbers].sort((a, b) => b.frequency - a.frequency);
    const rank = sortedDesc.findIndex((n) => n.number === num) + 1;

    // Reverse number
    const revNum = `${num[1]}${num[0]}`;
    const revStat = lotoData.allNumbers.find((n) => n.number === revNum);

    // Co-occurrence with reverse number
    let coCount = 0;
    let lastCoDate: string | null = null;
    draws.forEach((d) => {
      const nums = new Set(extractAll2DigitsFromDraw(d.results).map((x) => x.number));
      if (nums.has(num) && nums.has(revNum)) {
        coCount++;
        if (!lastCoDate) lastCoDate = d.drawDate;
      }
    });

    // Top partner numbers
    const partnerCounts = new Map<string, { count: number; lastDate: string | null }>();
    draws.forEach((d) => {
      const extracted = extractAll2DigitsFromDraw(d.results);
      const uniqueNums = Array.from(new Set(extracted.map((x) => x.number)));
      if (uniqueNums.includes(num)) {
        uniqueNums.forEach((partner) => {
          if (partner !== num) {
            const cur = partnerCounts.get(partner) || { count: 0, lastDate: null };
            cur.count++;
            if (!cur.lastDate) cur.lastDate = d.drawDate;
            partnerCounts.set(partner, cur);
          }
        });
      }
    });

    const topPartners = Array.from(partnerCounts.entries())
      .map(([partner, data]) => ({
        partnerNumber: partner,
        coFrequency: data.count,
        percentage: lotoStat.daysAppeared > 0 ? +((data.count / lotoStat.daysAppeared) * 100).toFixed(1) : 0,
        lastCoOccurrence: data.lastDate,
      }))
      .sort((a, b) => b.coFrequency - a.coFrequency)
      .slice(0, 5);

    // Special prize for this number
    const specialStat = specialData.allNumbers.find((n) => n.number === num);

    return {
      number: num,
      range: rangeConfig,
      completeness,
      loto: {
        frequency: lotoStat.frequency,
        percentage: lotoStat.percentage,
        rank,
        daysAppeared: lotoStat.daysAppeared,
        currentGap: lotoStat.currentGap,
        avgGap: lotoStat.avgGap,
        maxGap: lotoStat.maxGap,
        streak: lotoStat.streak,
        longestStreak: lotoStat.longestStreak,
        trend: lotoStat.trend,
        trendLabel: lotoStat.trendLabel,
        appearances: lotoStat.appearances,
      },
      reverseNumber: {
        reverseNumber: revNum,
        frequency: revStat?.frequency || 0,
        currentGap: revStat?.currentGap ?? draws.length,
        combinedFrequency: lotoStat.frequency + (revStat?.frequency || 0),
        coOccurrenceCount: coCount,
        lastCoOccurrence: lastCoDate,
      },
      topCoOccurringPairs: topPartners,
      specialPrize: {
        frequency: specialStat?.frequency || 0,
        percentage: specialStat?.percentage || 0,
        currentGap: specialStat?.currentGap ?? draws.length,
        avgGap: specialStat?.avgGap ?? draws.length,
        maxGap: specialStat?.maxGap ?? draws.length,
        occurrences: specialStat?.history || [],
      },
    };
  }

  /**
   * 7. COMPARISON MODE — Period A vs Period B
   */
  async comparePeriods(
    rangeAInput?: string | number | null,
    rangeBInput?: string | number | null
  ): Promise<PeriodComparisonResponse> {
    const rangeConfigA = await this.resolveRange(rangeAInput || '7days');
    const rangeConfigB = await this.resolveRange(rangeBInput || '30days');

    const cacheKey = StatisticsCacheService.buildKey('compare', `${rangeConfigA.rangeKey}_vs_${rangeConfigB.rangeKey}`);
    const cached = StatisticsCacheService.get<PeriodComparisonResponse>(cacheKey);
    if (cached) return cached;

    const [resA, resB] = await Promise.all([
      this.getDrawsForRange(rangeConfigA),
      this.getDrawsForRange(rangeConfigB),
    ]);

    const lotoA = this.computeLotoStatistics(resA.draws);
    const lotoB = this.computeLotoStatistics(resB.draws);

    const sortedA = [...lotoA.allNumbers].sort((a, b) => b.frequency - a.frequency);
    const sortedB = [...lotoB.allNumbers].sort((a, b) => b.frequency - a.frequency);

    const rankMapA = new Map<string, number>();
    sortedA.forEach((item, idx) => rankMapA.set(item.number, idx + 1));

    const rankMapB = new Map<string, number>();
    sortedB.forEach((item, idx) => rankMapB.set(item.number, idx + 1));

    const items: PeriodComparisonItem[] = [];

    for (let i = 0; i <= 99; i++) {
      const numStr = String(i).padStart(2, '0');
      const itemA = lotoA.allNumbers.find((n) => n.number === numStr);
      const itemB = lotoB.allNumbers.find((n) => n.number === numStr);

      const freqA = itemA?.frequency || 0;
      const freqB = itemB?.frequency || 0;
      const rankA = rankMapA.get(numStr) || 100;
      const rankB = rankMapB.get(numStr) || 100;

      // Normalized frequency delta
      const normFactor = resB.draws.length > 0 ? resA.draws.length / resB.draws.length : 1;
      const freqDelta = +(freqA - freqB * normFactor).toFixed(2);
      const rankDelta = rankB - rankA; // Positive means rank improved in period A

      let status: 'rising' | 'falling' | 'stable' = 'stable';
      if (rankDelta >= 10 || freqDelta > 1.5) status = 'rising';
      else if (rankDelta <= -10 || freqDelta < -1.5) status = 'falling';

      items.push({
        number: numStr,
        periodAFreq: freqA,
        periodARank: rankA,
        periodAPercentage: itemA?.percentage || 0,
        periodBFreq: freqB,
        periodBRank: rankB,
        periodBPercentage: itemB?.percentage || 0,
        freqDelta,
        rankDelta,
        status,
      });
    }

    // Sort by largest positive change in Period A
    items.sort((a, b) => b.rankDelta - a.rankDelta);

    const result: PeriodComparisonResponse = {
      periodA: rangeConfigA,
      periodB: rangeConfigB,
      completenessA: resA.completeness,
      completenessB: resB.completeness,
      comparison: items,
    };

    StatisticsCacheService.set(cacheKey, result);
    return result;
  }

  // ─── Computational Sub-Engines ──────────────────────────────────────────────

  private computeLotoStatistics(draws: IXSMBDraw[]) {
    const totalDraws = draws.length;
    let totalOccurrences = 0;

    // Per-number tracking data structure
    interface TrackData {
      freq: number;
      drawIndexes: number[]; // 0 = newest draw, totalDraws-1 = oldest
      datesAppeared: Set<string>;
      lastAppearanceDate: string | null;
      appearances: DayAppearanceItem[];
      currentStreak: number;
      longestStreak: number;
      recentFreq: number;
      olderFreq: number;
    }

    const numberMap = new Map<string, TrackData>();

    // Initialize 00–99
    for (let i = 0; i <= 99; i++) {
      const numStr = String(i).padStart(2, '0');
      const dayApps: DayAppearanceItem[] = draws.map((d) => ({
        date: d.drawDate,
        shortDate: d.drawDate.split('-').slice(1).reverse().join('/'),
        dayOfWeek: getDayOfWeekVN(d.drawDate),
        appeared: false,
        count: 0,
        prizes: [],
      }));

      numberMap.set(numStr, {
        freq: 0,
        drawIndexes: [],
        datesAppeared: new Set(),
        lastAppearanceDate: null,
        appearances: dayApps,
        currentStreak: 0,
        longestStreak: 0,
        recentFreq: 0,
        olderFreq: 0,
      });
    }

    const recentThreshold = Math.ceil(totalDraws / 2);

    // Populate tracking from draws (draws[0] is newest, draws[totalDraws-1] is oldest)
    draws.forEach((draw, drawIndex) => {
      const extracted = extractAll2DigitsFromDraw(draw.results);
      const dayNumsCount = new Map<string, { count: number; prizes: { tierCode: string; tierLabel: string; fullNumber: string }[] }>();

      extracted.forEach((item) => {
        totalOccurrences++;
        const cur = dayNumsCount.get(item.number) || { count: 0, prizes: [] };
        cur.count++;
        cur.prizes.push({
          tierCode: item.tierCode,
          tierLabel: item.tierLabel,
          fullNumber: item.fullNumber,
        });
        dayNumsCount.set(item.number, cur);
      });

      dayNumsCount.forEach((data, num) => {
        const track = numberMap.get(num);
        if (track) {
          track.freq += data.count;
          track.drawIndexes.push(drawIndex);
          track.datesAppeared.add(draw.drawDate);
          if (!track.lastAppearanceDate) {
            track.lastAppearanceDate = draw.drawDate;
          }

          if (drawIndex < recentThreshold) {
            track.recentFreq += data.count;
          } else {
            track.olderFreq += data.count;
          }

          const dayApp = track.appearances[drawIndex];
          if (dayApp) {
            dayApp.appeared = true;
            dayApp.count = data.count;
            dayApp.prizes = data.prizes;
          }
        }
      });
    });

    // Compute Streaks and Gaps for each 00–99
    const allNumbers: LotoNumberStat[] = [];
    const ganRankingList: NumberStat[] = [];

    numberMap.forEach((track, num) => {
      // 1. Current streak calculation (from newest drawIndex = 0 backwards)
      let currentStreak = 0;
      let countingCurrent = true;
      let maxStreak = 0;
      let tempStreak = 0;

      for (let i = 0; i < totalDraws; i++) {
        const appeared = track.appearances[i]?.appeared ?? false;
        if (appeared) {
          tempStreak++;
          if (tempStreak > maxStreak) maxStreak = tempStreak;
          if (countingCurrent) currentStreak++;
        } else {
          countingCurrent = false;
          tempStreak = 0;
        }
      }

      // 2. Gaps / Intervals calculation
      // drawIndexes are ascending indexes: e.g. [0, 3, 5]
      let currentGap = totalDraws;
      let maxGap = 0;
      const gaps: number[] = [];

      if (track.drawIndexes.length > 0) {
        currentGap = track.drawIndexes[0]; // index of newest appearance
        let prevIdx = -1;

        for (const idx of track.drawIndexes) {
          if (prevIdx !== -1) {
            const gapBetween = idx - prevIdx - 1;
            gaps.push(gapBetween);
            if (gapBetween > maxGap) maxGap = gapBetween;
          }
          prevIdx = idx;
        }

        // Gap from oldest appearance to end of window
        const tailGap = totalDraws - 1 - track.drawIndexes[track.drawIndexes.length - 1];
        if (tailGap > maxGap) maxGap = tailGap;
        if (currentGap > maxGap) maxGap = currentGap;
      } else {
        currentGap = totalDraws;
        maxGap = totalDraws;
      }

      const avgGap = track.datesAppeared.size > 0
        ? +((totalDraws - track.datesAppeared.size) / track.datesAppeared.size).toFixed(1)
        : totalDraws;

      // 3. Trend
      const trendResult = calculateTrend(
        track.recentFreq,
        recentThreshold,
        track.olderFreq,
        totalDraws - recentThreshold,
        currentGap,
        currentStreak,
        totalDraws
      );

      const percentage = totalOccurrences > 0
        ? +((track.freq / totalOccurrences) * 100).toFixed(2)
        : 0;

      const daysPercentage = totalDraws > 0
        ? +((track.datesAppeared.size / totalDraws) * 100).toFixed(1)
        : 0;

      const lastAppearanceDisplay = track.lastAppearanceDate
        ? toDDMMYYYYDash(track.lastAppearanceDate)
        : null;

      const item: LotoNumberStat = {
        number: num,
        frequency: track.freq,
        percentage,
        daysAppeared: track.datesAppeared.size,
        daysPercentage,
        lastAppearance: track.lastAppearanceDate,
        lastAppearanceDisplay,
        currentGap,
        avgGap,
        maxGap,
        recentFrequency: track.recentFreq,
        streak: currentStreak,
        longestStreak: maxStreak,
        trend: trendResult.trend,
        trendLabel: trendResult.label,
        appearances: track.appearances,
      };

      allNumbers.push(item);

      //   ranking item
      let statusLevel: 'extreme' | 'high' | 'moderate' | 'normal' = 'normal';
      let statusLabel = 'Bình thường';

      if (currentGap >= 15) {
        statusLevel = 'extreme';
        statusLabel = 'Gan cực đại';
      } else if (currentGap >= 10) {
        statusLevel = 'high';
        statusLabel = 'Gan cao';
      } else if (currentGap >= 5) {
        statusLevel = 'moderate';
        statusLabel = 'Gan vừa';
      }

      ganRankingList.push({
        rank: 0,
        number: num,
        currentGap,
        avgGap,
        maxGap,
        lastAppearance: track.lastAppearanceDate,
        statusLevel,
        statusLabel,
      });
    });

    // Sort allNumbers by number "00".."99"
    allNumbers.sort((a, b) => a.number.localeCompare(b.number));

    // Hot Numbers (sorted by freq DESC, then recentFreq DESC, then streak DESC)
    const sortedDesc = [...allNumbers].sort((a, b) => {
      if (b.frequency !== a.frequency) return b.frequency - a.frequency;
      if (b.recentFrequency !== a.recentFrequency) return b.recentFrequency - a.recentFrequency;
      if (b.streak !== a.streak) return b.streak - a.streak;
      return a.number.localeCompare(b.number);
    });

    // Cold Numbers (sorted by freq ASC, currentGap DESC)
    const sortedAsc = [...allNumbers].sort((a, b) => {
      if (a.frequency !== b.frequency) return a.frequency - b.frequency;
      if (b.currentGap !== a.currentGap) return b.currentGap - a.currentGap;
      return a.number.localeCompare(b.number);
    });

    //   ranking sorted by currentGap DESC, then avgGap DESC
    ganRankingList.sort((a, b) => {
      if (b.currentGap !== a.currentGap) return b.currentGap - a.currentGap;
      if (b.avgGap !== a.avgGap) return b.avgGap - a.avgGap;
      return a.number.localeCompare(b.number);
    });

    ganRankingList.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    const uniqueNumbersCount = allNumbers.filter((n) => n.frequency > 0).length;

    return {
      allNumbers,
      hotNumbers: sortedDesc,
      coldNumbers: sortedAsc,
      ganRanking: ganRankingList,
      totalOccurrences,
      uniqueNumbersCount,
    };
  }

  /**
   * Computes intervals between appearances for 00–99
   */
  private computeIntervalStatistics(draws: IXSMBDraw[]): NumberIntervalStat[] {
    const totalDraws = draws.length;
    const intervalMap = new Map<string, number[]>();

    for (let i = 0; i <= 99; i++) {
      intervalMap.set(String(i).padStart(2, '0'), []);
    }

    draws.forEach((draw, drawIndex) => {
      const extracted = extractAll2DigitsFromDraw(draw.results);
      const uniqueNums = new Set(extracted.map((x) => x.number));
      uniqueNums.forEach((num) => {
        const arr = intervalMap.get(num);
        if (arr) arr.push(drawIndex);
      });
    });

    const result: NumberIntervalStat[] = [];

    intervalMap.forEach((indexes, num) => {
      if (indexes.length === 0) {
        result.push({
          number: num,
          appearancesCount: 0,
          minInterval: totalDraws,
          avgInterval: totalDraws,
          maxInterval: totalDraws,
          currentInterval: totalDraws,
          intervalsList: [],
        });
        return;
      }

      const currentInterval = indexes[0];
      const intervalsList: number[] = [];
      let minInt = totalDraws;
      let maxInt = 0;
      let prev = -1;

      for (const idx of indexes) {
        if (prev !== -1) {
          const gap = idx - prev - 1;
          intervalsList.push(gap);
          if (gap < minInt) minInt = gap;
          if (gap > maxInt) maxInt = gap;
        }
        prev = idx;
      }

      const avgInterval = intervalsList.length > 0
        ? +(intervalsList.reduce((s, g) => s + g, 0) / intervalsList.length).toFixed(1)
        : totalDraws;

      result.push({
        number: num,
        appearancesCount: indexes.length,
        minInterval: minInt === totalDraws ? 0 : minInt,
        avgInterval,
        maxInterval: maxInt,
        currentInterval,
        intervalsList,
      });
    });

    return result.sort((a, b) => a.number.localeCompare(b.number));
  }

  /**
   * Computes streak data (2, 3, 4+ consecutive draws)
   */
  private computeStreakStatistics(draws: IXSMBDraw[]): StreakNumberStat[] {
    const totalDraws = draws.length;
    const appearanceMatrix = new Map<string, boolean[]>();

    for (let i = 0; i <= 99; i++) {
      appearanceMatrix.set(String(i).padStart(2, '0'), new Array(totalDraws).fill(false));
    }

    draws.forEach((draw, drawIndex) => {
      const extracted = extractAll2DigitsFromDraw(draw.results);
      extracted.forEach((item) => {
        const arr = appearanceMatrix.get(item.number);
        if (arr) arr[drawIndex] = true;
      });
    });

    const result: StreakNumberStat[] = [];

    appearanceMatrix.forEach((apps, num) => {
      let curStreak = 0;
      let isCountingCur = true;
      let longestStreak = 0;
      let tempStreak = 0;
      let streak2 = 0;
      let streak3 = 0;
      let streak4Plus = 0;
      let lastAppearance: string | null = null;

      for (let i = 0; i < totalDraws; i++) {
        if (apps[i]) {
          if (!lastAppearance) lastAppearance = draws[i].drawDate;
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
          if (isCountingCur) curStreak++;
        } else {
          if (tempStreak >= 2) streak2++;
          if (tempStreak >= 3) streak3++;
          if (tempStreak >= 4) streak4Plus++;
          tempStreak = 0;
          isCountingCur = false;
        }
      }

      if (tempStreak >= 2) streak2++;
      if (tempStreak >= 3) streak3++;
      if (tempStreak >= 4) streak4Plus++;

      result.push({
        number: num,
        currentStreak: curStreak,
        longestStreak,
        streak2Count: streak2,
        streak3Count: streak3,
        streak4PlusCount: streak4Plus,
        lastAppearance,
      });
    });

    return result.sort((a, b) => b.currentStreak - a.currentStreak || b.longestStreak - a.longestStreak);
  }

  private computePairStatistics(draws: IXSMBDraw[]) {
    const totalDraws = draws.length;
    const pairMap = new Map<string, { count: number; lastDate: string | null; lastDrawIndex: number }>();

    draws.forEach((draw, drawIndex) => {
      const extracted = extractAll2DigitsFromDraw(draw.results);
      const uniqueNums = Array.from(new Set(extracted.map((x) => x.number))).sort();

      for (let i = 0; i < uniqueNums.length; i++) {
        for (let j = i + 1; j < uniqueNums.length; j++) {
          const pairKey = `${uniqueNums[i]}-${uniqueNums[j]}`;
          const cur = pairMap.get(pairKey) || { count: 0, lastDate: null, lastDrawIndex: -1 };
          cur.count++;
          if (!cur.lastDate) {
            cur.lastDate = draw.drawDate;
            cur.lastDrawIndex = drawIndex;
          }
          pairMap.set(pairKey, cur);
        }
      }
    });

    const pairsList: PairStat[] = [];

    pairMap.forEach((data, pairKey) => {
      const [n1, n2] = pairKey.split('-');
      const percentage = totalDraws > 0 ? +((data.count / totalDraws) * 100).toFixed(1) : 0;
      const currentGap = data.lastDrawIndex >= 0 ? data.lastDrawIndex : totalDraws;

      pairsList.push({
        pair: [n1, n2],
        pairLabel: `${n1} – ${n2}`,
        frequency: data.count,
        percentage,
        latestOccurrence: data.lastDate,
        currentGap,
      });
    });

    pairsList.sort((a, b) => {
      if (b.frequency !== a.frequency) return b.frequency - a.frequency;
      if (a.currentGap !== b.currentGap) return a.currentGap - b.currentGap;
      return a.pairLabel.localeCompare(b.pairLabel);
    });

    return { pairs: pairsList };
  }

  /**
   * Computes reverse numbers (AB ↔ BA) relationships
   */
  private computeReversePairStatistics(draws: IXSMBDraw[]): ReversePairStat[] {
    const totalDraws = draws.length;
    const freqMap = new Map<string, { count: number; lastDate: string | null; lastDrawIndex: number }>();

    for (let i = 0; i <= 99; i++) {
      freqMap.set(String(i).padStart(2, '0'), { count: 0, lastDate: null, lastDrawIndex: -1 });
    }

    const coOccurrenceMap = new Map<string, number>();

    draws.forEach((draw, drawIndex) => {
      const extracted = extractAll2DigitsFromDraw(draw.results);
      const uniqueNums = new Set(extracted.map((x) => x.number));

      extracted.forEach((item) => {
        const cur = freqMap.get(item.number);
        if (cur) {
          cur.count++;
          if (!cur.lastDate) {
            cur.lastDate = draw.drawDate;
            cur.lastDrawIndex = drawIndex;
          }
        }
      });

      // Check co-occurrence for all unique 2-digit pairs
      for (let i = 0; i <= 99; i++) {
        const numA = String(i).padStart(2, '0');
        const numB = `${numA[1]}${numA[0]}`;
        if (numA < numB && uniqueNums.has(numA) && uniqueNums.has(numB)) {
          const key = `${numA}-${numB}`;
          coOccurrenceMap.set(key, (coOccurrenceMap.get(key) || 0) + 1);
        }
      }
    });

    const result: ReversePairStat[] = [];

    for (let i = 0; i <= 99; i++) {
      const numA = String(i).padStart(2, '0');
      const numB = `${numA[1]}${numA[0]}`;

      // Only process unique AB < BA pairs where A != B
      if (numA < numB) {
        const statA = freqMap.get(numA)!;
        const statB = freqMap.get(numB)!;
        const coKey = `${numA}-${numB}`;
        const coCount = coOccurrenceMap.get(coKey) || 0;

        const gapA = statA.lastDrawIndex >= 0 ? statA.lastDrawIndex : totalDraws;
        const gapB = statB.lastDrawIndex >= 0 ? statB.lastDrawIndex : totalDraws;

        result.push({
          numA,
          numB,
          label: `${numA} ↔ ${numB}`,
          freqA: statA.count,
          freqB: statB.count,
          combinedFreq: statA.count + statB.count,
          coOccurrence: coCount,
          lastAppearedA: statA.lastDate,
          lastAppearedB: statB.lastDate,
          currentGapA: gapA,
          currentGapB: gapB,
        });
      }
    }

    return result.sort((a, b) => b.combinedFreq - a.combinedFreq || b.coOccurrence - a.coOccurrence);
  }

  /**
   * Computes Head/Tail digit analysis (0–9)
   */
  private computeHeadTailAnalysis(draws: IXSMBDraw[]): HeadTailAnalysis {
    const headCounts = new Array(10).fill(0);
    const tailCounts = new Array(10).fill(0);
    let totalNumbers = 0;

    draws.forEach((draw) => {
      const extracted = extractAll2DigitsFromDraw(draw.results);
      extracted.forEach((item) => {
        totalNumbers++;
        const h = parseInt(item.number[0], 10);
        const t = parseInt(item.number[1], 10);
        if (!isNaN(h)) headCounts[h]++;
        if (!isNaN(t)) tailCounts[t]++;
      });
    });

    const heads: DigitStat[] = headCounts.map((count, digit) => ({
      digit,
      frequency: count,
      percentage: totalNumbers > 0 ? +((count / totalNumbers) * 100).toFixed(1) : 0,
    }));

    const tails: DigitStat[] = tailCounts.map((count, digit) => ({
      digit,
      frequency: count,
      percentage: totalNumbers > 0 ? +((count / totalNumbers) * 100).toFixed(1) : 0,
    }));

    const sortedHeads = [...heads].sort((a, b) => b.frequency - a.frequency);
    const sortedTails = [...tails].sort((a, b) => b.frequency - a.frequency);

    return {
      heads,
      tails,
      mostFrequentHead: sortedHeads[0] || { digit: 0, frequency: 0 },
      leastFrequentHead: sortedHeads[sortedHeads.length - 1] || { digit: 0, frequency: 0 },
      mostFrequentTail: sortedTails[0] || { digit: 0, frequency: 0 },
      leastFrequentTail: sortedTails[sortedTails.length - 1] || { digit: 0, frequency: 0 },
    };
  }

  /**
   * Computes Parity (Even / Odd) and 4-group distribution
   */
  private computeParityAnalysis(draws: IXSMBDraw[]): ParityAnalysis {
    let evenCount = 0;
    let oddCount = 0;
    let evenEven = 0;
    let evenOdd = 0;
    let oddEven = 0;
    let oddOdd = 0;
    let total = 0;

    draws.forEach((draw) => {
      const extracted = extractAll2DigitsFromDraw(draw.results);
      extracted.forEach((item) => {
        total++;
        const val = parseInt(item.number, 10);
        const h = parseInt(item.number[0], 10);
        const t = parseInt(item.number[1], 10);

        if (val % 2 === 0) evenCount++;
        else oddCount++;

        const hEven = h % 2 === 0;
        const tEven = t % 2 === 0;

        if (hEven && tEven) evenEven++;
        else if (hEven && !tEven) evenOdd++;
        else if (!hEven && tEven) oddEven++;
        else oddOdd++;
      });
    });

    return {
      evenCount,
      evenPercentage: total > 0 ? +((evenCount / total) * 100).toFixed(1) : 0,
      oddCount,
      oddPercentage: total > 0 ? +((oddCount / total) * 100).toFixed(1) : 0,
      evenEvenCount: evenEven,
      evenEvenPercentage: total > 0 ? +((evenEven / total) * 100).toFixed(1) : 0,
      evenOddCount: evenOdd,
      evenOddPercentage: total > 0 ? +((evenOdd / total) * 100).toFixed(1) : 0,
      oddEvenCount: oddEven,
      oddEvenPercentage: total > 0 ? +((oddEven / total) * 100).toFixed(1) : 0,
      oddOddCount: oddOdd,
      oddOddPercentage: total > 0 ? +((oddOdd / total) * 100).toFixed(1) : 0,
    };
  }

  /**
   * Computes Low (00–49) vs High (50–99) distribution
   */
  private computeLowHighAnalysis(draws: IXSMBDraw[]): LowHighAnalysis {
    let lowCount = 0;
    let highCount = 0;
    let total = 0;

    draws.forEach((draw) => {
      const extracted = extractAll2DigitsFromDraw(draw.results);
      extracted.forEach((item) => {
        total++;
        const val = parseInt(item.number, 10);
        if (val < 50) lowCount++;
        else highCount++;
      });
    });

    return {
      lowCount,
      lowPercentage: total > 0 ? +((lowCount / total) * 100).toFixed(1) : 0,
      highCount,
      highPercentage: total > 0 ? +((highCount / total) * 100).toFixed(1) : 0,
    };
  }

  /**
   * Computes daily breakdown and time series items
   */
  private computeDailyTimeSeries(draws: IXSMBDraw[]): DailyTimeSeriesItem[] {
    return draws.map((draw) => {
      const extracted = extractAll2DigitsFromDraw(draw.results);
      const uniqueNums = new Set(extracted.map((x) => x.number));
      const sp = extractSpecialTailFromDraw(draw.results);

      let evenCount = 0;
      let oddCount = 0;
      let lowCount = 0;
      let highCount = 0;
      const headDist = new Array(10).fill(0);
      const tailDist = new Array(10).fill(0);

      extracted.forEach((item) => {
        const val = parseInt(item.number, 10);
        const h = parseInt(item.number[0], 10);
        const t = parseInt(item.number[1], 10);

        if (val % 2 === 0) evenCount++;
        else oddCount++;

        if (val < 50) lowCount++;
        else highCount++;

        if (!isNaN(h)) headDist[h]++;
        if (!isNaN(t)) tailDist[t]++;
      });

      const [, month, day] = draw.drawDate.split('-');

      return {
        date: draw.drawDate,
        shortDate: `${day}/${month}`,
        dayOfWeek: getDayOfWeekVN(draw.drawDate),
        totalPrizes: extracted.length,
        uniqueNumbers: uniqueNums.size,
        specialPrizeTail: sp?.tail || '--',
        specialPrizeFull: sp?.fullNumber || '--',
        evenCount,
        oddCount,
        lowCount,
        highCount,
        headDistribution: headDist,
        tailDistribution: tailDist,
      };
    });
  }

  private computeSpecialPrizeStatistics(draws: IXSMBDraw[]) {
    const totalDraws = draws.length;

    interface SpecialTrack {
      freq: number;
      drawIndexes: number[];
      history: SpecialPrizeOccurrence[];
    }

    const specialMap = new Map<string, SpecialTrack>();

    for (let i = 0; i <= 99; i++) {
      specialMap.set(String(i).padStart(2, '0'), {
        freq: 0,
        drawIndexes: [],
        history: [],
      });
    }

    const recentOccurrences: SpecialPrizeOccurrence[] = [];

    draws.forEach((draw, drawIndex) => {
      const sp = extractSpecialTailFromDraw(draw.results);
      if (sp) {
        const occ: SpecialPrizeOccurrence = {
          date: draw.drawDate,
          shortDate: draw.drawDate.split('-').slice(1).reverse().join('/'),
          dayOfWeek: getDayOfWeekVN(draw.drawDate),
          fullNumber: sp.fullNumber,
          tail: sp.tail,
        };

        recentOccurrences.push(occ);

        const track = specialMap.get(sp.tail);
        if (track) {
          track.freq++;
          track.drawIndexes.push(drawIndex);
          track.history.push(occ);
        }
      }
    });

    const allNumbers: SpecialPrizeNumberStat[] = [];
    const recentThreshold = Math.ceil(totalDraws / 2);

    specialMap.forEach((track, num) => {
      let currentGap = totalDraws;
      let maxGap = 0;
      let recentFreq = 0;
      let olderFreq = 0;

      if (track.drawIndexes.length > 0) {
        currentGap = track.drawIndexes[0];
        let prev = -1;
        for (const idx of track.drawIndexes) {
          if (idx < recentThreshold) recentFreq++;
          else olderFreq++;

          if (prev !== -1) {
            const gap = idx - prev - 1;
            if (gap > maxGap) maxGap = gap;
          }
          prev = idx;
        }

        const tailGap = totalDraws - 1 - track.drawIndexes[track.drawIndexes.length - 1];
        if (tailGap > maxGap) maxGap = tailGap;
        if (currentGap > maxGap) maxGap = currentGap;
      } else {
        currentGap = totalDraws;
        maxGap = totalDraws;
      }

      const avgGap = track.freq > 0
        ? +((totalDraws - track.freq) / track.freq).toFixed(1)
        : totalDraws;

      const trendRes = calculateTrend(
        recentFreq,
        recentThreshold,
        olderFreq,
        totalDraws - recentThreshold,
        currentGap,
        currentGap === 0 ? 1 : 0,
        totalDraws
      );

      const percentage = totalDraws > 0 ? +((track.freq / totalDraws) * 100).toFixed(2) : 0;

      allNumbers.push({
        number: num,
        frequency: track.freq,
        percentage,
        lastAppearance: track.history[0]?.date || null,
        currentGap,
        avgGap,
        maxGap,
        trend: trendRes.trend,
        history: track.history,
      });
    });

    allNumbers.sort((a, b) => a.number.localeCompare(b.number));

    const hotNumbers = [...allNumbers]
      .filter((n) => n.frequency > 0)
      .sort((a, b) => b.frequency - a.frequency || a.currentGap - b.currentGap);

    const coldNumbers = [...allNumbers]
      .sort((a, b) => a.frequency - b.frequency || b.currentGap - a.currentGap);

    const ganNumbers = [...allNumbers]
      .sort((a, b) => b.currentGap - a.currentGap || b.avgGap - a.avgGap);

    return {
      allNumbers,
      hotNumbers,
      coldNumbers,
      ganNumbers,
      recentOccurrences,
    };
  }
}

export const statisticsDeepService = new StatisticsDeepService();
