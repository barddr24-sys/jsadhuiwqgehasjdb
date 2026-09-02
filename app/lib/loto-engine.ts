/**
 * XSMB Loto Engine
 * Computes factual 2-digit loto numbers, duplicate frequencies,
 * Head (Đầu) & Tail (Đuôi) distributions, and complete 00-99 matrix.
 *
 * Strict neutral statistical terminology — zero predictive/gambling claims.
 */

import type { XSMBPrizes } from '@/app/lib/xsmb-types';
import { extractTwoDigitsFromPrizes, type HistoricalDrawRecord } from '@/app/lib/statistics-engine';
import { toDDMMYYYYDash, getTodayVN, getDayOfWeekVN } from '@/app/lib/date-utils';

export type LotoPeriod = 'today' | '3days' | '7days' | '30days' | '90days';

export interface LotoOccurrenceItem {
  number: string;        // "00" - "99"
  count: number;         // Occurrence count (e.g. 1, 2, 3)
  prizeLabels: string[]; // e.g. ["Giải Đặc Biệt (85429)", "Giải Ba (05623)"]
  isSpecialPrize: boolean;
  firstOrderIndex: number; // Chronological order of draw appearance
}

export interface DigitGroup {
  digit: number;         // 0 - 9
  numbers: { number: string; count: number }[]; // e.g. [{ number: "23", count: 2 }, { number: "25", count: 1 }]
  totalCount: number;    // sum of all counts in this head/tail
}

export interface DigitSummaryItem {
  digit: number;         // 0 - 9
  count: number;         // total count
}

export interface LotoGridItem {
  number: string;        // "00" - "99"
  count: number;
  intensity: 'neutral' | 'low' | 'medium' | 'high'; // 0, 1-2, 3-4, 5+
  lastAppeared?: string; // e.g. "02/09"
}

export interface LotoDataResult {
  period: LotoPeriod;
  date: string;          // "2026-09-02"
  dateDisplay: string;   // "Thứ Tư, 02/09/2026" or "27/08/2026 — 02/09/2026"
  dateShortRange: string;// "02/09" or "27/08 → 02/09"
  totalOccurrences: number; // 27 for today (or 81 / 189)
  uniqueNumbersCount: number; // e.g. 19
  topNumbers: { number: string; count: number }[];
  lotoList: LotoOccurrenceItem[]; // Order-preserved list with duplicate counts (e.g. 23 with count 2)
  topFrequent: { number: string; count: number }[]; // Top 10 sorted descending
  heads: DigitGroup[];   // 0 to 9
  topHeads: DigitSummaryItem[]; // Top 3 heads
  tails: DigitGroup[];   // 0 to 9
  topTails: DigitSummaryItem[]; // Top 3 tails
  grid: LotoGridItem[];  // Complete 00 - 99
  isPartial?: boolean;
}

/**
 * Helper to normalize search input (e.g., "3" -> "03", "23" -> "23")
 */
export function normalizeLotoSearch(query: string): string {
  const cleaned = query.replace(/\D/g, '');
  if (!cleaned) return '';
  if (cleaned.length === 1) {
    return `0${cleaned}`;
  }
  return cleaned.slice(0, 2);
}

/**
 * Calculates loto dataset for a given period and prizes set
 */
export function calculateLotoData(
  period: LotoPeriod = 'today',
  customPrizes?: XSMBPrizes | null,
  isPartial: boolean = false,
  customDraws?: HistoricalDrawRecord[]
): LotoDataResult {
  let drawsToUse: HistoricalDrawRecord[] = [];

  if (period === 'today') {
    if (customDraws && customDraws.length > 0) {
      drawsToUse = [customDraws[0]];
    } else if (customPrizes) {
      const today = getTodayVN();
      const [year, month, day] = today.split('-');
      drawsToUse = [
        {
          date: today,
          dayOfWeek: getDayOfWeekVN(today),
          shortDate: `${day}/${month}`,
          prizes: customPrizes,
        },
      ];
    }
  } else if (period === '3days') {
    if (customDraws && customDraws.length > 0) {
      drawsToUse = customDraws.slice(0, 3);
    }
  } else if (period === '7days') {
    if (customDraws && customDraws.length > 0) {
      drawsToUse = customDraws.slice(0, 7);
    }
  } else if (period === '30days') {
    if (customDraws && customDraws.length > 0) {
      drawsToUse = customDraws.slice(0, 30);
    }
  } else {
    // 90days
    if (customDraws && customDraws.length > 0) {
      drawsToUse = customDraws.slice(0, 90);
    }
  }

  if (drawsToUse.length === 0) {
    const emptyGrid: LotoGridItem[] = [];
    for (let i = 0; i <= 99; i++) {
      emptyGrid.push({
        number: String(i).padStart(2, '0'),
        count: 0,
        intensity: 'neutral',
      });
    }

    const emptyHeads: DigitGroup[] = Array.from({ length: 10 }, (_, d) => ({
      digit: d,
      numbers: [],
      totalCount: 0,
    }));

    const emptyTails: DigitGroup[] = Array.from({ length: 10 }, (_, d) => ({
      digit: d,
      numbers: [],
      totalCount: 0,
    }));

    return {
      period,
      date: '',
      dateDisplay: 'Chưa có dữ liệu',
      dateShortRange: 'Chưa có dữ liệu',
      totalOccurrences: 0,
      uniqueNumbersCount: 0,
      topNumbers: [],
      lotoList: [],
      topFrequent: [],
      heads: emptyHeads,
      topHeads: [],
      tails: emptyTails,
      topTails: [],
      grid: emptyGrid,
      isPartial,
    };
  }

  const newestDraw = drawsToUse[0];
  const oldestDraw = drawsToUse[drawsToUse.length - 1];

  let dateDisplay = '';
  let dateShortRange = '';

  if (period === 'today') {
    dateDisplay = `${newestDraw.dayOfWeek}, ${toDDMMYYYYDash(newestDraw.date)}`;
    dateShortRange = newestDraw.shortDate;
  } else {
    dateDisplay = `${toDDMMYYYYDash(oldestDraw.date)} — ${toDDMMYYYYDash(newestDraw.date)}`;
    dateShortRange = `${oldestDraw.shortDate} → ${newestDraw.shortDate}`;
  }

  // Count occurrences across 00-99
  const countsMap = new Map<string, { count: number; prizeLabels: string[]; isSpecial: boolean; firstOrder: number; lastDate: string }>();
  for (let i = 0; i <= 99; i++) {
    const num = String(i).padStart(2, '0');
    countsMap.set(num, { count: 0, prizeLabels: [], isSpecial: false, firstOrder: 9999, lastDate: '' });
  }

  let totalOccurrences = 0;
  let globalOrderCounter = 0;

  // Preserve order of appearance for the active period (starting from newest draw)
  const orderedUniqueNumbers: string[] = [];

  drawsToUse.forEach((draw) => {
    const extracted = extractTwoDigitsFromPrizes(draw.prizes);
    extracted.forEach(({ number, prizeLabel }) => {
      totalOccurrences++;
      const entry = countsMap.get(number);
      if (entry) {
        if (entry.count === 0) {
          orderedUniqueNumbers.push(number);
          entry.firstOrder = globalOrderCounter;
        }
        entry.count++;
        entry.prizeLabels.push(`${draw.shortDate}: ${prizeLabel}`);
        if (prizeLabel.includes('Giải Đặc Biệt')) {
          entry.isSpecial = true;
        }
        if (!entry.lastDate) {
          entry.lastDate = draw.shortDate;
        }
      }
      globalOrderCounter++;
    });
  });

  // Calculate unique numbers count
  let uniqueNumbersCount = 0;
  countsMap.forEach((entry) => {
    if (entry.count > 0) uniqueNumbersCount++;
  });

  // Today's / Period's Loto List (deduplicated, showing count e.g. 23 x 2)
  const lotoList: LotoOccurrenceItem[] = orderedUniqueNumbers.map((num) => {
    const entry = countsMap.get(num)!;
    return {
      number: num,
      count: entry.count,
      prizeLabels: entry.prizeLabels,
      isSpecialPrize: entry.isSpecial,
      firstOrderIndex: entry.firstOrder,
    };
  });

  // Top frequent ranking (sorted descending)
  const allNumberedArray: { number: string; count: number }[] = [];
  countsMap.forEach((entry, num) => {
    if (entry.count > 0) {
      allNumberedArray.push({ number: num, count: entry.count });
    }
  });

  allNumberedArray.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.number.localeCompare(b.number);
  });

  const topFrequent = allNumberedArray.slice(0, 10);
  const topNumbers = allNumberedArray.slice(0, 3);

  // Group by Head (Đầu 0 to 9)
  const heads: DigitGroup[] = Array.from({ length: 10 }, (_, d) => ({
    digit: d,
    numbers: [],
    totalCount: 0,
  }));

  // Group by Tail (Đuôi 0 to 9)
  const tails: DigitGroup[] = Array.from({ length: 10 }, (_, d) => ({
    digit: d,
    numbers: [],
    totalCount: 0,
  }));

  countsMap.forEach((entry, num) => {
    if (entry.count > 0) {
      const h = parseInt(num.charAt(0), 10);
      const t = parseInt(num.charAt(1), 10);

      if (!isNaN(h) && heads[h]) {
        heads[h].numbers.push({ number: num, count: entry.count });
        heads[h].totalCount += entry.count;
      }
      if (!isNaN(t) && tails[t]) {
        tails[t].numbers.push({ number: num, count: entry.count });
        tails[t].totalCount += entry.count;
      }
    }
  });

  // Sort numbers inside each head/tail
  heads.forEach((h) => h.numbers.sort((a, b) => a.number.localeCompare(b.number)));
  tails.forEach((t) => t.numbers.sort((a, b) => a.number.localeCompare(b.number)));

  // Top 3 Heads
  const topHeads: DigitSummaryItem[] = heads
    .map((h) => ({ digit: h.digit, count: h.totalCount }))
    .filter((h) => h.count > 0)
    .sort((a, b) => b.count - a.count || a.digit - b.digit)
    .slice(0, 3);

  // Top 3 Tails
  const topTails: DigitSummaryItem[] = tails
    .map((t) => ({ digit: t.digit, count: t.totalCount }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count || a.digit - b.digit)
    .slice(0, 3);

  // Build Complete 00 - 99 Grid
  const grid: LotoGridItem[] = [];
  for (let i = 0; i <= 99; i++) {
    const num = String(i).padStart(2, '0');
    const entry = countsMap.get(num);
    const count = entry ? entry.count : 0;

    let intensity: 'neutral' | 'low' | 'medium' | 'high' = 'neutral';
    if (count === 0) {
      intensity = 'neutral';
    } else if (count <= 2) {
      intensity = 'low';
    } else if (count <= 4) {
      intensity = 'medium';
    } else {
      intensity = 'high';
    }

    grid.push({
      number: num,
      count,
      intensity,
      lastAppeared: entry?.lastDate,
    });
  }

  return {
    period,
    date: newestDraw.date,
    dateDisplay,
    dateShortRange,
    totalOccurrences,
    uniqueNumbersCount,
    topNumbers,
    lotoList,
    topFrequent,
    heads,
    topHeads,
    tails,
    topTails,
    grid,
    isPartial,
  };
}

/**
 * Searches and returns comprehensive facts for a single 2-digit number across today, 3 days, and 7 days.
 */
export interface SingleNumberFact {
  number: string;
  head: number;
  tail: number;
  todayCount: number;
  threeDayCount: number;
  sevenDayCount: number;
  todayPrizeLabels: string[];
  threeDayPrizeLabels: string[];
  sevenDayPrizeLabels: string[];
  lastAppearedDate: string;
}

export function lookupLotoNumberFacts(numStr: string): SingleNumberFact {
  const normalized = normalizeLotoSearch(numStr);
  const head = parseInt(normalized.charAt(0) || '0', 10);
  const tail = parseInt(normalized.charAt(1) || '0', 10);

  const todayData = calculateLotoData('today');
  const threeDayData = calculateLotoData('3days');
  const sevenDayData = calculateLotoData('7days');

  const todayItem = todayData.lotoList.find((x) => x.number === normalized);
  const threeDayItem = threeDayData.lotoList.find((x) => x.number === normalized);
  const sevenDayItem = sevenDayData.lotoList.find((x) => x.number === normalized);

  const sevenGrid = sevenDayData.grid.find((x) => x.number === normalized);

  return {
    number: normalized,
    head,
    tail,
    todayCount: todayItem ? todayItem.count : 0,
    threeDayCount: threeDayItem ? threeDayItem.count : 0,
    sevenDayCount: sevenDayItem ? sevenDayItem.count : 0,
    todayPrizeLabels: todayItem ? todayItem.prizeLabels : [],
    threeDayPrizeLabels: threeDayItem ? threeDayItem.prizeLabels : [],
    sevenDayPrizeLabels: sevenDayItem ? sevenDayItem.prizeLabels : [],
    lastAppearedDate: sevenGrid?.lastAppeared || 'Không xuất hiện',
  };
}
