/**
 * XSMB Number Detail Engine
 * Computes comprehensive factual statistics and historical daily timeline
 * for a single 2-digit lottery number ("00" to "99") across Today, 3-Day, and 7-Day periods.
 *
 * Strict neutral, analytical terminology. Zero gambling/predictive claims.
 */

import type { HistoricalDrawRecord } from '@/app/lib/statistics-engine';
import { toDDMMYYYYDash } from '@/app/lib/date-utils';
import type { XSMBPrizes } from '@/app/lib/xsmb-types';

export type NumberDetailPeriod = 'today' | '3days' | '7days' | '30days' | '90days';

export interface PrizeAppearanceDetail {
  prizeKey: string;      // "dacBiet", "giaiBa", etc.
  prizeName: string;     // "Giải Đặc Biệt", "Giải Ba", etc.
  rawNumber: string;     // "85429", "05623", etc.
  fullLabel: string;     // "Giải Đặc Biệt (85429)"
  isSpecialPrize: boolean;
}

export interface DailyAppearanceRecord {
  date: string;          // "2026-09-02"
  shortDate: string;     // "02/09"
  displayDate: string;   // "02/09/2026"
  dayOfWeek: string;     // "Thứ Tư"
  appeared: boolean;     // true if count > 0
  count: number;         // number of appearances on this day
  prizes: PrizeAppearanceDetail[];
}

export interface NumberDetailData {
  number: string;        // e.g. "23"
  normalized: string;    // "23"
  head: number;          // 2
  tail: number;          // 3
  inverseNumber: string; // "32"
  previousNumber: string;// "22"
  nextNumber: string;    // "24"

  period: NumberDetailPeriod;
  periodDaysCount: number; // 1, 3, or 7
  totalOccurrences: number; // e.g. 6
  activeDaysCount: number;  // e.g. 5
  totalDaysInPeriod: number; // 1, 3, or 7

  latestAppearance: {
    date: string;
    shortDate: string;
    displayDate: string;
    count: number;
    prizes: PrizeAppearanceDetail[];
  } | null;

  appearedToday: boolean;
  todayCount: number;
  todayPrizes: PrizeAppearanceDetail[];

  threeDaysSummary: {
    totalOccurrences: number;
    activeDays: number;
  };

  sevenDaysSummary: {
    totalOccurrences: number;
    activeDays: number;
  };

  dailyHistory: DailyAppearanceRecord[];
  frequencyList: {
    date: string;
    shortDate: string;
    displayDate: string;
    dayOfWeek: string;
    count: number;
    appeared: boolean;
  }[];
}

/**
 * Normalizes user input into a valid 2-digit lottery number string ("00" to "99").
 * e.g., "3" -> "03", "23" -> "23", "99" -> "99", "" -> "00"
 */
export function normalizeNumber(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '00';
  const digitsOnly = String(input).replace(/\D/g, '');
  if (!digitsOnly) return '00';
  if (digitsOnly.length === 1) return `0${digitsOnly}`;
  return digitsOnly.slice(-2);
}

/**
 * Prize metadata mapping
 */
const PRIZE_META: { key: keyof XSMBPrizes; label: string; isSpecial?: boolean }[] = [
  { key: 'dacBiet', label: 'Giải Đặc Biệt', isSpecial: true },
  { key: 'giaiNhat', label: 'Giải Nhất' },
  { key: 'giaiNhi', label: 'Giải Nhì' },
  { key: 'giaiBa', label: 'Giải Ba' },
  { key: 'giaiTu', label: 'Giải Tư' },
  { key: 'giaiNam', label: 'Giải Năm' },
  { key: 'giaiSau', label: 'Giải Sáu' },
  { key: 'giaiBay', label: 'Giải Bảy' },
];

/**
 * Extracts appearances of a specific 2-digit number from a single draw's prizes
 */
export function extractNumberFromDrawPrizes(
  prizes: XSMBPrizes,
  targetNumber: string
): PrizeAppearanceDetail[] {
  const matchedPrizes: PrizeAppearanceDetail[] = [];

  for (const group of PRIZE_META) {
    const numbersList = prizes[group.key] || [];
    for (const rawNum of numbersList) {
      if (rawNum && rawNum.length >= 2) {
        const tail = rawNum.slice(-2);
        if (tail === targetNumber) {
          matchedPrizes.push({
            prizeKey: group.key,
            prizeName: group.label,
            rawNumber: rawNum,
            fullLabel: `${group.label} (${rawNum})`,
            isSpecialPrize: !!group.isSpecial,
          });
        }
      }
    }
  }

  return matchedPrizes;
}

/**
 * Calculates complete number facts and daily history for a given number and period.
 */
export function calculateNumberDetail(
  rawInput: string | number,
  period: NumberDetailPeriod = '7days',
  customDraws?: HistoricalDrawRecord[]
): NumberDetailData {
  const number = normalizeNumber(rawInput);
  const numInt = parseInt(number, 10);

  const head = parseInt(number.charAt(0), 10);
  const tail = parseInt(number.charAt(1), 10);

  // Inverse (Số đảo/lộn): e.g. 23 -> 32, 05 -> 50, 11 -> 11
  const inverseNumber = `${number.charAt(1)}${number.charAt(0)}`;

  // Previous & Next numbers in 00-99 cycle
  const previousNumber = String((numInt - 1 + 100) % 100).padStart(2, '0');
  const nextNumber = String((numInt + 1) % 100).padStart(2, '0');
  const allDraws = customDraws && customDraws.length > 0 ? customDraws : [];

  // Determine days count for selected period
  let periodDaysCount = 7;

  if (period === 'today') {
    periodDaysCount = 1;
  } else if (period === '3days') {
    periodDaysCount = 3;
  } else if (period === '7days') {
    periodDaysCount = 7;
  } else if (period === '30days') {
    periodDaysCount = 30;
  } else {
    // 90days
    periodDaysCount = 90;
  }

  // Calculate complete timeline for the active period
  const fullPeriodHistory: DailyAppearanceRecord[] = allDraws.slice(0, periodDaysCount).map((draw) => {
    const prizesMatched = extractNumberFromDrawPrizes(draw.prizes, number);
    return {
      date: draw.date,
      shortDate: draw.shortDate,
      displayDate: toDDMMYYYYDash(draw.date),
      dayOfWeek: draw.dayOfWeek,
      appeared: prizesMatched.length > 0,
      count: prizesMatched.length,
      prizes: prizesMatched,
    };
  });

  // Today specific status
  const todayRecord = fullPeriodHistory[0];
  const appearedToday = todayRecord ? todayRecord.appeared : false;
  const todayCount = todayRecord ? todayRecord.count : 0;
  const todayPrizes = todayRecord ? todayRecord.prizes : [];

  // 3-day summary
  const threeDaysSummary = {
    totalOccurrences: fullPeriodHistory.slice(0, Math.min(3, periodDaysCount)).reduce((sum, r) => sum + r.count, 0),
    activeDays: fullPeriodHistory.slice(0, Math.min(3, periodDaysCount)).filter((r) => r.appeared).length,
  };

  // 7-Day summary metrics
  const sevenDaysSummary = {
    totalOccurrences: fullPeriodHistory.slice(0, Math.min(7, periodDaysCount)).reduce((sum, r) => sum + r.count, 0),
    activeDays: fullPeriodHistory.slice(0, Math.min(7, periodDaysCount)).filter((r) => r.appeared).length,
  };


  // Active period specific calculations
  const dailyHistory: DailyAppearanceRecord[] = fullPeriodHistory.slice(0, periodDaysCount);
  const totalOccurrences = dailyHistory.reduce((sum, r) => sum + r.count, 0);
  const activeDaysCount = dailyHistory.filter((r) => r.appeared).length;

  // Latest appearance in full period history
  let latestAppearance: NumberDetailData['latestAppearance'] = null;
  for (const day of fullPeriodHistory) {
    if (day.appeared) {
      latestAppearance = {
        date: day.date,
        shortDate: day.shortDate,
        displayDate: day.displayDate,
        count: day.count,
        prizes: day.prizes,
      };
      break;
    }
  }

  // Frequency timeline for the active period
  const frequencyList = dailyHistory.map((item) => ({
    date: item.date,
    shortDate: item.shortDate,
    displayDate: item.displayDate,
    dayOfWeek: item.dayOfWeek,
    count: item.count,
    appeared: item.appeared,
  }));

  return {
    number,
    normalized: number,
    head,
    tail,
    inverseNumber,
    previousNumber,
    nextNumber,

    period,
    periodDaysCount,
    totalOccurrences,
    activeDaysCount,
    totalDaysInPeriod: periodDaysCount,

    latestAppearance,
    appearedToday,
    todayCount,
    todayPrizes,

    threeDaysSummary,
    sevenDaysSummary,

    dailyHistory,
    frequencyList,
  };
}
