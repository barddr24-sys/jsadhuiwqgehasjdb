/**
 * XSMB Statistics Engine
 * Computes factual 2-digit loto statistics across 3-day and 7-day periods.
 * Strict neutral terminology, zero gambling/predictive claims.
 */

import type { XSMBPrizes } from '@/app/lib/xsmb-types';
import { toDDMMYYYYDash } from '@/app/lib/date-utils';

export interface DayAppearance {
  date: string;       // YYYY-MM-DD
  shortDate: string;  // DD/MM (e.g. "02/09")
  appeared: boolean;  // whether number appeared in this draw
  count: number;      // how many times on this date
  prizes: string[];   // prize labels (e.g. ["Giải Đặc Biệt", "Giải Ba"])
}

export interface NumberStatItem {
  number: string;     // 2-digit string "00" - "99"
  count: number;      // total count in period
  lastAppeared?: string; // e.g. "02/09" or "Hôm nay"
  daysAppearedCount: number; // how many unique days it appeared
  appearances: DayAppearance[]; // historical timeline across analyzed dates
}

export interface DailyOccurrenceStat {
  date: string;       // YYYY-MM-DD
  shortDate: string;  // DD/MM (e.g. "02/09")
  dayOfWeek: string;  // e.g. "Thứ Tư"
  totalPrizes: number;// 27
  uniqueNumbers: number; // e.g. 24
  specialPrizeTail: string; // e.g. "29"
}

export interface PeriodStatisticsData {
  period: number;
  startDate: string;  // e.g. "2026-08-27"
  endDate: string;    // e.g. "2026-09-02"
  dateRangeDisplay: string; // "02/09 → 27/08"
  dateRangeFull: string;    // "27/08/2026 — 02/09/2026"
  totalOccurrences: number; // e.g. 189 (or 140)
  uniqueNumbersCount: number; // e.g. 73
  averagePerDay: number; // e.g. 27
  topNumbers: NumberStatItem[]; // Top 5 or 10 highest frequency
  lowNumbers: NumberStatItem[]; // 0 or 1 frequency
  allNumbers: NumberStatItem[]; // 00 to 99 sorted or indexed
  dailyBreakdown: DailyOccurrenceStat[];
}

/**
 * Extracts all 27 two-digit loto numbers from a single XSMB draw prizes group
 */
export function extractTwoDigitsFromPrizes(prizes: XSMBPrizes): { number: string; prizeLabel: string }[] {
  const result: { number: string; prizeLabel: string }[] = [];

  const prizeMeta: { key: keyof XSMBPrizes; label: string }[] = [
    { key: 'dacBiet', label: 'Giải Đặc Biệt' },
    { key: 'giaiNhat', label: 'Giải Nhất' },
    { key: 'giaiNhi', label: 'Giải Nhì' },
    { key: 'giaiBa', label: 'Giải Ba' },
    { key: 'giaiTu', label: 'Giải Tư' },
    { key: 'giaiNam', label: 'Giải Năm' },
    { key: 'giaiSau', label: 'Giải Sáu' },
    { key: 'giaiBay', label: 'Giải Bảy' },
  ];

  for (const group of prizeMeta) {
    const nums = prizes[group.key] || [];
    for (const rawNum of nums) {
      if (rawNum && rawNum.length >= 2) {
        const twoDigit = rawNum.slice(-2);
        result.push({ number: twoDigit, prizeLabel: `${group.label} (${rawNum})` });
      }
    }
  }

  return result;
}

/**
 * 7-Day Verified Mock History for standard simulation and instant responsiveness
 */
export interface HistoricalDrawRecord {
  date: string;
  dayOfWeek: string;
  shortDate: string;
  prizes: XSMBPrizes;
}

export const MOCK_7DAY_DRAWS: HistoricalDrawRecord[] = [
  {
    date: '2026-09-02',
    dayOfWeek: 'Thứ Tư',
    shortDate: '02/09',
    prizes: {
      dacBiet: ['85429'],
      giaiNhat: ['36192'],
      giaiNhi: ['14785', '92301'],
      giaiBa: ['28491', '05623', '74128', '63904', '81235', '49017'],
      giaiTu: ['4821', '6039', '1748', '9532'],
      giaiNam: ['8204', '3195', '6471', '0852', '9316', '5270'],
      giaiSau: ['529', '841', '306'],
      giaiBay: ['29', '45', '78', '02'],
    },
  },
  {
    date: '2026-09-01',
    dayOfWeek: 'Thứ Ba',
    shortDate: '01/09',
    prizes: {
      dacBiet: ['67890'],
      giaiNhat: ['45123'],
      giaiNhi: ['23456', '78912'],
      giaiBa: ['34523', '89045', '12378', '56789', '90123', '23412'],
      giaiTu: ['6789', '0123', '4567', '8901'],
      giaiNam: ['2345', '6789', '0123', '4567', '8901', '2345'],
      giaiSau: ['678', '901', '234'],
      giaiBay: ['56', '78', '90', '12'],
    },
  },
  {
    date: '2026-08-31',
    dayOfWeek: 'Thứ Hai',
    shortDate: '31/08',
    prizes: {
      dacBiet: ['45678'],
      giaiNhat: ['12345'],
      giaiNhi: ['67890', '23456'],
      giaiBa: ['78923', '01245', '34578', '67812', '90156', '23478'],
      giaiTu: ['5678', '9012', '3456', '7890'],
      giaiNam: ['1234', '5678', '9012', '3456', '7890', '1234'],
      giaiSau: ['567', '890', '123'],
      giaiBay: ['45', '67', '89', '01'],
    },
  },
  {
    date: '2026-08-30',
    dayOfWeek: 'Chủ Nhật',
    shortDate: '30/08',
    prizes: {
      dacBiet: ['92314'],
      giaiNhat: ['78901'],
      giaiNhi: ['23456', '67890'],
      giaiBa: ['12323', '45645', '78978', '01212', '34556', '67823'],
      giaiTu: ['9012', '3456', '7890', '1234'],
      giaiNam: ['5678', '9012', '3456', '7890', '1234', '5678'],
      giaiSau: ['901', '234', '567'],
      giaiBay: ['89', '01', '23', '45'],
    },
  },
  {
    date: '2026-08-29',
    dayOfWeek: 'Thứ Bảy',
    shortDate: '29/08',
    prizes: {
      dacBiet: ['10856'],
      giaiNhat: ['23456'],
      giaiNhi: ['78901', '12345'],
      giaiBa: ['67823', '90145', '23478', '56712', '89056', '12345'],
      giaiTu: ['4567', '8901', '2345', '6789'],
      giaiNam: ['0123', '4567', '8901', '2345', '6789', '0123'],
      giaiSau: ['456', '789', '012'],
      giaiBay: ['34', '56', '78', '90'],
    },
  },
  {
    date: '2026-08-28',
    dayOfWeek: 'Thứ Sáu',
    shortDate: '28/08',
    prizes: {
      dacBiet: ['54321'],
      giaiNhat: ['67890'],
      giaiNhi: ['12345', '23456'],
      giaiBa: ['78945', '01278', '34512', '67856', '90123', '23489'],
      giaiTu: ['0123', '4567', '8901', '2345'],
      giaiNam: ['6789', '0123', '4567', '8901', '2345', '6789'],
      giaiSau: ['012', '345', '678'],
      giaiBay: ['90', '12', '34', '56'],
    },
  },
  {
    date: '2026-08-27',
    dayOfWeek: 'Thứ Năm',
    shortDate: '27/08',
    prizes: {
      dacBiet: ['32109'],
      giaiNhat: ['45678'],
      giaiNhi: ['89012', '34567'],
      giaiBa: ['12378', '45612', '78956', '01223', '34545', '67878'],
      giaiTu: ['8901', '2345', '6789', '0123'],
      giaiNam: ['4567', '8901', '2345', '6789', '0123', '4567'],
      giaiSau: ['890', '123', '456'],
      giaiBay: ['78', '90', '12', '34'],
    },
  },
];

/**
 * Calculates complete period statistics for 3, 7, 30, 90 or any number of days
 */
export function calculatePeriodStatistics(
  period: number,
  customDraws?: HistoricalDrawRecord[]
): PeriodStatisticsData {
  const draws = (customDraws && customDraws.length > 0)
    ? customDraws.slice(0, period)
    : [];

  if (draws.length === 0) {
    const emptyAllNumbers: NumberStatItem[] = [];
    for (let i = 0; i <= 99; i++) {
      emptyAllNumbers.push({
        number: String(i).padStart(2, '0'),
        count: 0,
        daysAppearedCount: 0,
        appearances: [],
      });
    }

    return {
      period,
      startDate: '',
      endDate: '',
      dateRangeDisplay: 'Chưa có dữ liệu',
      dateRangeFull: 'Chưa có dữ liệu kỳ quay',
      totalOccurrences: 0,
      uniqueNumbersCount: 0,
      averagePerDay: 0,
      topNumbers: [],
      lowNumbers: emptyAllNumbers.slice(0, 8),
      allNumbers: emptyAllNumbers,
      dailyBreakdown: [],
    };
  }

  const newestDraw = draws[0];
  const oldestDraw = draws[draws.length - 1];

  const dateRangeDisplay = `${newestDraw.shortDate} → ${oldestDraw.shortDate}`;
  const dateRangeFull = `${toDDMMYYYYDash(oldestDraw.date)} — ${toDDMMYYYYDash(newestDraw.date)}`;

  // Matrix map for numbers 00 -> 99
  const numberMap = new Map<
    string,
    {
      count: number;
      lastAppeared?: string;
      daysAppeared: Set<string>;
      appearances: DayAppearance[];
    }
  >();

  // Initialize 00 - 99
  for (let i = 0; i <= 99; i++) {
    const numStr = String(i).padStart(2, '0');
    const dayApps: DayAppearance[] = draws.map((d) => ({
      date: d.date,
      shortDate: d.shortDate,
      appeared: false,
      count: 0,
      prizes: [],
    }));

    numberMap.set(numStr, {
      count: 0,
      daysAppeared: new Set(),
      appearances: dayApps,
    });
  }

  let totalOccurrences = 0;
  const dailyBreakdown: DailyOccurrenceStat[] = [];

  // Populate from draws
  draws.forEach((draw, drawIndex) => {
    const prizesExtracted = extractTwoDigitsFromPrizes(draw.prizes);
    const dayUniqueNumbers = new Set<string>();

    prizesExtracted.forEach(({ number, prizeLabel }) => {
      totalOccurrences++;
      dayUniqueNumbers.add(number);

      const entry = numberMap.get(number);
      if (entry) {
        entry.count++;
        if (!entry.lastAppeared) {
          entry.lastAppeared = draw.shortDate;
        }
        entry.daysAppeared.add(draw.date);

        const dayApp = entry.appearances[drawIndex];
        if (dayApp) {
          dayApp.appeared = true;
          dayApp.count++;
          dayApp.prizes.push(prizeLabel);
        }
      }
    });

    const spTail = draw.prizes.dacBiet[0]?.slice(-2) || '--';
    dailyBreakdown.push({
      date: draw.date,
      shortDate: draw.shortDate,
      dayOfWeek: draw.dayOfWeek,
      totalPrizes: prizesExtracted.length,
      uniqueNumbers: dayUniqueNumbers.size,
      specialPrizeTail: spTail,
    });
  });

  // Convert to array
  const allNumbers: NumberStatItem[] = [];
  let uniqueNumbersCount = 0;

  numberMap.forEach((val, num) => {
    if (val.count > 0) {
      uniqueNumbersCount++;
    }
    allNumbers.push({
      number: num,
      count: val.count,
      lastAppeared: val.lastAppeared,
      daysAppearedCount: val.daysAppeared.size,
      appearances: val.appearances,
    });
  });

  // Top frequency (sorted descending)
  const sortedDesc = [...allNumbers].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.number.localeCompare(b.number);
  });

  // Low frequency (sorted ascending: 0 or 1 occurrences)
  const sortedAsc = [...allNumbers]
    .filter((n) => n.count <= 1)
    .sort((a, b) => {
      if (a.count !== b.count) return a.count - b.count;
      return a.number.localeCompare(b.number);
    });

  const averagePerDay = Math.round(totalOccurrences / period);

  return {
    period,
    startDate: oldestDraw.date,
    endDate: newestDraw.date,
    dateRangeDisplay,
    dateRangeFull,
    totalOccurrences,
    uniqueNumbersCount,
    averagePerDay,
    topNumbers: sortedDesc.slice(0, 10), // Top 10 items (top 5 default, expandable)
    lowNumbers: sortedAsc.slice(0, 8),   // 8 sample low frequency items
    allNumbers,
    dailyBreakdown,
  };
}

/**
 * Helper to normalize a search string to a 2-digit number (e.g. "3" -> "03", "23" -> "23")
 */
export function normalizeSearchNumber(query: string): string {
  const cleaned = query.replace(/\D/g, '');
  if (!cleaned) return '';
  if (cleaned.length === 1) {
    return `0${cleaned}`;
  }
  return cleaned.slice(0, 2);
}
