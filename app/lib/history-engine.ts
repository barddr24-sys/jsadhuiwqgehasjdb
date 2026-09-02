/**
 * XSMB History Engine
 * Provides historical draw records, multi-date querying, pagination,
 * adjacent date navigation, and normalized result formatting.
 *
 * All terminology is factual, clean, and analytical.
 */

import type { XSMBPrizes, DrawLifecycleState } from '@/app/lib/xsmb-types';
import { SAMPLE_PARTIAL_PRIZES } from '@/app/lib/xsmb-types';
import { MOCK_7DAY_DRAWS, type HistoricalDrawRecord } from '@/app/lib/statistics-engine';
import {
  formatDisplayDate,
  getDayOfWeekVN,
  getTodayVN,
  addDays,
  isFutureDate,
  isToday,
  isValidDateStr,
} from '@/app/lib/date-utils';

export interface HistoryItemSummary {
  date: string;              // "2026-09-02"
  dayOfWeek: string;         // "Thứ Tư"
  displayDate: string;       // "02/09/2026"
  shortDate: string;         // "02/09"
  isToday: boolean;
  specialPrize: string;      // "85429"
  specialTwoDigit: string;   // "29"
  firstPrize: string;        // "36192"
  secondPrizes: string[];    // ["14785", "92301"]
  thirdPrizesPreview: string[]; // ["28491", "05623", ...]
  status: DrawLifecycleState;
  prizes?: XSMBPrizes;
}

export interface HistoryDetailResult {
  date: string;              // "2026-09-02"
  dayOfWeek: string;         // "Thứ Tư"
  displayDate: string;       // "02/09/2026"
  shortDate: string;         // "02/09"
  isToday: boolean;
  status: DrawLifecycleState;
  prizes: XSMBPrizes | null;
  specialPrize: string | null;
  specialTwoDigit: string | null;
  updatedAt: string | null;
  previousDate: string | null; // e.g. "2026-09-01"
  nextDate: string | null;     // e.g. "2026-09-03" (null if future or no data)
  previousShortDate: string | null; // e.g. "01/09"
  nextShortDate: string | null;     // e.g. "03/09"
}

export interface HistoryPaginatedResult {
  items: HistoryItemSummary[];
  totalCount: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

export interface HistoryFilterParams {
  limit?: number;
  offset?: number;
  searchDate?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Cache of known historical draws
 */
const drawsCache = new Map<string, HistoricalDrawRecord>();

/**
 * Registers verified draw records in cache (e.g. from API/DB)
 */
export function registerHistoricalDraws(draws: HistoricalDrawRecord[]): void {
  for (const d of draws) {
    if (d?.date) {
      drawsCache.set(d.date, d);
    }
  }
}

/**
 * Retrieves a historical draw for a given date.
 * Returns null if data is not available (NEVER fabricates data).
 */
export function getHistoricalDraw(dateStr: string): HistoricalDrawRecord | null {
  if (!isValidDateStr(dateStr) || isFutureDate(dateStr)) {
    return null;
  }

  if (drawsCache.has(dateStr)) {
    return drawsCache.get(dateStr)!;
  }

  return null;
}

/**
 * Retrieves a list of historical summaries with pagination and search
 */
export function getHistoryList(params: HistoryFilterParams = {}): HistoryPaginatedResult {
  const limit = Math.max(1, Math.min(params.limit || 10, 50));
  const offset = Math.max(0, params.offset || 0);
  const todayStr = getTodayVN();

  // If a specific search date is requested
  if (params.searchDate && isValidDateStr(params.searchDate)) {
    const draw = getHistoricalDraw(params.searchDate);
    if (!draw) {
      return {
        items: [],
        totalCount: 0,
        hasMore: false,
        offset,
        limit,
      };
    }

    const item = convertDrawToSummary(draw);
    return {
      items: [item],
      totalCount: 1,
      hasMore: false,
      offset: 0,
      limit,
    };
  }

  // Generate sequence of dates backward from today
  const totalDays = 60; // 60 days history pool
  const allDates: string[] = [];
  for (let i = 0; i < totalDays; i++) {
    const dStr = addDays(todayStr, -i);
    allDates.push(dStr);
  }

  const pagedDates = allDates.slice(offset, offset + limit);
  const items: HistoryItemSummary[] = [];

  for (const dStr of pagedDates) {
    const draw = getHistoricalDraw(dStr);
    if (draw) {
      items.push(convertDrawToSummary(draw));
    }
  }

  const hasMore = offset + limit < allDates.length;

  return {
    items,
    totalCount: allDates.length,
    hasMore,
    offset,
    limit,
  };
}

/**
 * Converts a HistoricalDrawRecord to a HistoryItemSummary
 */
export function convertDrawToSummary(draw: HistoricalDrawRecord): HistoryItemSummary {
  const dInfo = formatDisplayDate(draw.date);
  const sp = draw.prizes.dacBiet[0] || '';
  const spTail = sp.length >= 2 ? sp.slice(-2) : '';

  return {
    date: draw.date,
    dayOfWeek: getDayOfWeekVN(draw.date),
    displayDate: dInfo.short,
    shortDate: draw.shortDate || `${draw.date.split('-')[2]}/${draw.date.split('-')[1]}`,
    isToday: isToday(draw.date),
    specialPrize: sp,
    specialTwoDigit: spTail,
    firstPrize: draw.prizes.giaiNhat[0] || '',
    secondPrizes: draw.prizes.giaiNhi || [],
    thirdPrizesPreview: (draw.prizes.giaiBa || []).slice(0, 3),
    status: 'COMPLETED',
    prizes: draw.prizes,
  };
}

/**
 * Retrieves full result detail for a single date
 */
export function getHistoryDetail(
  dateStr: string,
  simulatedStatus?: DrawLifecycleState
): HistoryDetailResult {
  const dInfo = formatDisplayDate(dateStr);
  const dayOfWeek = getDayOfWeekVN(dateStr);
  const isDateToday = isToday(dateStr);
  const isFuture = isFutureDate(dateStr);

  // Determine previous and next valid dates
  const prevDate = addDays(dateStr, -1);
  const nextCandidate = addDays(dateStr, 1);
  const nextDate = isFutureDate(nextCandidate) ? null : nextCandidate;

  // Handle future or empty
  if (isFuture) {
    return {
      date: dateStr,
      dayOfWeek,
      displayDate: dInfo.short,
      shortDate: `${dateStr.split('-')[2]}/${dateStr.split('-')[1]}`,
      isToday: false,
      status: 'FUTURE',
      prizes: null,
      specialPrize: null,
      specialTwoDigit: null,
      updatedAt: null,
      previousDate: prevDate,
      nextDate: null,
      previousShortDate: `${prevDate.split('-')[2]}/${prevDate.split('-')[1]}`,
      nextShortDate: null,
    };
  }

  // Handle simulated status override if provided
  if (simulatedStatus === 'UPDATING') {
    return {
      date: dateStr,
      dayOfWeek,
      displayDate: dInfo.short,
      shortDate: `${dateStr.split('-')[2]}/${dateStr.split('-')[1]}`,
      isToday: isDateToday,
      status: 'UPDATING',
      prizes: SAMPLE_PARTIAL_PRIZES,
      specialPrize: null,
      specialTwoDigit: null,
      updatedAt: '18:24',
      previousDate: prevDate,
      nextDate: nextDate,
      previousShortDate: `${prevDate.split('-')[2]}/${prevDate.split('-')[1]}`,
      nextShortDate: nextDate ? `${nextDate.split('-')[2]}/${nextDate.split('-')[1]}` : null,
    };
  }

  if (simulatedStatus === 'SCHEDULED' || simulatedStatus === 'DRAWING') {
    return {
      date: dateStr,
      dayOfWeek,
      displayDate: dInfo.short,
      shortDate: `${dateStr.split('-')[2]}/${dateStr.split('-')[1]}`,
      isToday: isDateToday,
      status: simulatedStatus,
      prizes: null,
      specialPrize: null,
      specialTwoDigit: null,
      updatedAt: null,
      previousDate: prevDate,
      nextDate: nextDate,
      previousShortDate: `${prevDate.split('-')[2]}/${prevDate.split('-')[1]}`,
      nextShortDate: nextDate ? `${nextDate.split('-')[2]}/${nextDate.split('-')[1]}` : null,
    };
  }

  const draw = getHistoricalDraw(dateStr);

  if (!draw) {
    return {
      date: dateStr,
      dayOfWeek,
      displayDate: dInfo.short,
      shortDate: `${dateStr.split('-')[2]}/${dateStr.split('-')[1]}`,
      isToday: isDateToday,
      status: 'EMPTY',
      prizes: null,
      specialPrize: null,
      specialTwoDigit: null,
      updatedAt: null,
      previousDate: prevDate,
      nextDate: nextDate,
      previousShortDate: `${prevDate.split('-')[2]}/${prevDate.split('-')[1]}`,
      nextShortDate: nextDate ? `${nextDate.split('-')[2]}/${nextDate.split('-')[1]}` : null,
    };
  }

  const sp = draw.prizes.dacBiet[0] || null;
  const spTail = sp && sp.length >= 2 ? sp.slice(-2) : null;

  return {
    date: draw.date,
    dayOfWeek: getDayOfWeekVN(draw.date),
    displayDate: dInfo.short,
    shortDate: draw.shortDate || `${draw.date.split('-')[2]}/${draw.date.split('-')[1]}`,
    isToday: isDateToday,
    status: 'COMPLETED',
    prizes: draw.prizes,
    specialPrize: sp,
    specialTwoDigit: spTail,
    updatedAt: isDateToday ? '18:27' : '18:30',
    previousDate: prevDate,
    nextDate: nextDate,
    previousShortDate: `${prevDate.split('-')[2]}/${prevDate.split('-')[1]}`,
    nextShortDate: nextDate ? `${nextDate.split('-')[2]}/${nextDate.split('-')[1]}` : null,
  };
}

/**
 * Normalizes user input search string into a valid YYYY-MM-DD date if matched
 * Supports:
 * - "2026-09-02"
 * - "02/09/2026"
 * - "2/9/2026"
 * - "02-09-2026"
 * - "02092026"
 */
export function normalizeDateSearch(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed) && isValidDateStr(trimmed)) {
    return trimmed;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    const iso = `${year}-${month}-${day}`;
    if (isValidDateStr(iso)) return iso;
  }

  // DDMMYYYY (8 digits)
  if (/^\d{8}$/.test(trimmed)) {
    const day = trimmed.slice(0, 2);
    const month = trimmed.slice(2, 4);
    const year = trimmed.slice(4, 8);
    const iso = `${year}-${month}-${day}`;
    if (isValidDateStr(iso)) return iso;
  }

  return null;
}
