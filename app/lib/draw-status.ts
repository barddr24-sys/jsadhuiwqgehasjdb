/**
 * XSMB Draw Status & Timing Logic
 *
 * XSMB draws occur daily starting at 18:15 Vietnam time.
 * Draw order: Giải 7 -> Giải 6 -> Giải 5 -> Giải 4 -> Giải 3 -> Giải 2 -> Giải 1 -> Đặc Biệt.
 */

import type { DrawLifecycleState, ExplicitDrawState, XSMBPrizes, PrizeMilestone } from './xsmb-types';
import { PRIZE_GROUPS } from './xsmb-types';
import { isFutureDate, isToday, getVNTimeParts, DRAW_CONFIG } from './date-utils';

export const DRAW_TARGET_HOUR = DRAW_CONFIG.hour;
export const DRAW_TARGET_MINUTE = DRAW_CONFIG.minute;

/** Explicit API Draw Lifecycle States */
export const EXPLICIT_DRAW_STATE = {
  BEFORE_DRAW: 'BEFORE_DRAW',
  DRAWING: 'DRAWING',
  WAITING_FOR_RESULT: 'WAITING_FOR_RESULT',
  SYNCING: 'SYNCING',
  RESULT_AVAILABLE: 'RESULT_AVAILABLE',
  RESULT_MISSING: 'RESULT_MISSING',
  SOURCE_ERROR: 'SOURCE_ERROR',
} as const;

export type { ExplicitDrawState };

/** Total seconds remaining until 18:15 today (Vietnam Time) */
export function getSecondsUntilDraw(nowVN?: Date): number {
  const parts = nowVN ? getVNTimeParts(nowVN) : getVNTimeParts();
  const currentTotalSeconds = parts.hour * 3600 + parts.minute * 60 + parts.second;
  const targetTotalSeconds = DRAW_TARGET_HOUR * 3600 + DRAW_TARGET_MINUTE * 60;
  return Math.max(0, targetTotalSeconds - currentTotalSeconds);
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
 * Computes the mandatory ExplicitDrawState based on date, time, data existence, and sync activity.
 */
export function computeExplicitDrawStatus(
  dateStr: string,
  prizes: XSMBPrizes | null,
  options?: { isSyncing?: boolean; hasSourceError?: boolean; nowVN?: Date }
): ExplicitDrawState {
  if (options?.hasSourceError) return 'SOURCE_ERROR';

  const complete = isResultComplete(prizes);
  if (complete) return 'RESULT_AVAILABLE';

  if (options?.isSyncing) return 'SYNCING';

  if (isFutureDate(dateStr)) return 'BEFORE_DRAW';

  if (isToday(dateStr)) {
    const parts = options?.nowVN ? getVNTimeParts(options.nowVN) : getVNTimeParts();
    const minutes = parts.totalMinutes;
    const drawStartMinutes = DRAW_CONFIG.hour * 60 + DRAW_CONFIG.minute;
    const drawEndMinutes = DRAW_CONFIG.windowEndHour * 60 + DRAW_CONFIG.windowEndMinute;

    if (minutes < drawStartMinutes) return 'BEFORE_DRAW';
    if (minutes <= drawEndMinutes) return 'DRAWING';

    return 'WAITING_FOR_RESULT';
  }

  // Past date without complete result
  return 'RESULT_MISSING';
}

/**
 * Compute the UI draw status based on date, time, and data (backward compatible)
 */
export function computeDrawStatus(
  dateStr: string,
  prizes: XSMBPrizes | null,
  nowVN?: Date
): DrawLifecycleState {
  if (isFutureDate(dateStr)) return 'FUTURE';

  const complete = isResultComplete(prizes);
  if (complete) return 'COMPLETED';

  const anyData = hasAnyData(prizes);
  if (anyData) return 'UPDATING';

  if (!isToday(dateStr)) {
    return 'EMPTY';
  }

  const parts = nowVN ? getVNTimeParts(nowVN) : getVNTimeParts();
  const minutes = parts.totalMinutes;
  const drawStartMinutes = DRAW_CONFIG.hour * 60 + DRAW_CONFIG.minute;
  const drawEndMinutes = DRAW_CONFIG.windowEndHour * 60 + DRAW_CONFIG.windowEndMinute;

  if (minutes < drawStartMinutes) return 'SCHEDULED';
  if (minutes <= drawEndMinutes) return 'DRAWING';

  return 'UPDATING';
}
