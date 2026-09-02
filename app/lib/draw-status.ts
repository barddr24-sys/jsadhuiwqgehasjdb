/**
 * XSMB Draw Status & Timing Logic
 *
 * XSMB draws occur daily starting at 18:15 Vietnam time.
 * Draw order: Giải 7 -> Giải 6 -> Giải 5 -> Giải 4 -> Giải 3 -> Giải 2 -> Giải 1 -> Đặc Biệt.
 */

import type { DrawLifecycleState, XSMBPrizes, PrizeMilestone } from './xsmb-types';
import { PRIZE_GROUPS } from './xsmb-types';
import { isFutureDate, isToday, getNowVN } from './date-utils';

export const DRAW_TARGET_HOUR = 18;
export const DRAW_TARGET_MINUTE = 15;

/** Total seconds remaining until 18:15 today (Vietnam Time) */
export function getSecondsUntilDraw(): number {
  const now = getNowVN();
  const target = new Date(now);
  target.setHours(DRAW_TARGET_HOUR, DRAW_TARGET_MINUTE, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / 1000));
}

/** Formats seconds into HH : MM : SS */
export function formatCountdown(totalSeconds: number): {
  hours: string;
  minutes: string;
  seconds: string;
} {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return {
    hours: String(h).padStart(2, '0'),
    minutes: String(m).padStart(2, '0'),
    seconds: String(s).padStart(2, '0'),
  };
}

/** Checks if all 27 prizes are available */
export function isResultComplete(prizes: XSMBPrizes | null): boolean {
  if (!prizes) return false;
  return PRIZE_GROUPS.every(({ key, count }) => {
    const arr = prizes[key];
    return Array.isArray(arr) && arr.length >= count && arr.every(n => typeof n === 'string' && n.length > 0);
  });
}

/** Checks if any prize is available */
export function hasAnyData(prizes: XSMBPrizes | null): boolean {
  if (!prizes) return false;
  return PRIZE_GROUPS.some(({ key }) => {
    const arr = prizes[key];
    return Array.isArray(arr) && arr.length > 0 && arr.some(n => n.length > 0);
  });
}

/** Build milestone progress checklist for the updating state */
export function getPrizeMilestones(prizes: XSMBPrizes | null): PrizeMilestone[] {
  // Vietnamese Northern Lottery draw sequence order
  const order: (keyof XSMBPrizes)[] = [
    'giaiBay',
    'giaiSau',
    'giaiNam',
    'giaiTu',
    'giaiBa',
    'giaiNhi',
    'giaiNhat',
    'dacBiet',
  ];

  const labelMap: Record<keyof XSMBPrizes, string> = {
    giaiBay: 'Giải Bảy',
    giaiSau: 'Giải Sáu',
    giaiNam: 'Giải Năm',
    giaiTu: 'Giải Tư',
    giaiBa: 'Giải Ba',
    giaiNhi: 'Giải Nhì',
    giaiNhat: 'Giải Nhất',
    dacBiet: 'Đặc Biệt',
  };

  const expectedCounts: Record<keyof XSMBPrizes, number> = {
    giaiBay: 4,
    giaiSau: 3,
    giaiNam: 6,
    giaiTu: 4,
    giaiBa: 6,
    giaiNhi: 2,
    giaiNhat: 1,
    dacBiet: 1,
  };

  return order.map((key) => {
    const arr = prizes?.[key] ?? [];
    const isComplete = arr.length >= expectedCounts[key];
    return {
      key,
      label: labelMap[key],
      isComplete,
      count: arr.length,
    };
  });
}

/**
 * Compute the draw status based on date, time, and data
 */
export function computeDrawStatus(
  dateStr: string,
  prizes: XSMBPrizes | null,
): DrawLifecycleState {
  if (isFutureDate(dateStr)) return 'FUTURE';

  const complete = isResultComplete(prizes);
  if (complete) return 'COMPLETED';

  const anyData = hasAnyData(prizes);
  if (anyData) return 'UPDATING';

  if (!isToday(dateStr)) {
    return 'ERROR';
  }

  const now = getNowVN();
  const minutes = now.getHours() * 60 + now.getMinutes();

  if (minutes < 18 * 60 + 10) return 'SCHEDULED';
  if (minutes < 18 * 60 + 35) return 'DRAWING';
  if (minutes < 18 * 60 + 55) return 'UPDATING';

  return 'DELAYED';
}
