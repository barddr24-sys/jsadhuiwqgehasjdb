/**
 * XSMB (Xổ Số Miền Bắc) — Core Type Definitions & Constants
 *
 * Rules:
 * 1. Lottery numbers are ALWAYS string types to preserve leading zeros (e.g., "01234", "05").
 * 2. 5 Primary Lifecycle States:
 *    - SCHEDULED: Before draw, countdown active to 18:15
 *    - DRAWING: 18:15 draw in progress, waiting for first prizes
 *    - UPDATING: Live prizes streaming in (G7 -> G1 -> DB)
 *    - COMPLETED: All 27 prizes published & verified
 *    - DELAYED: Draw is delayed / system waiting for official feed
 */

export type ExplicitDrawState =
  | 'BEFORE_DRAW'
  | 'DRAWING'
  | 'WAITING_FOR_RESULT'
  | 'SYNCING'
  | 'RESULT_AVAILABLE'
  | 'RESULT_MISSING'
  | 'SOURCE_ERROR';

export type DrawLifecycleState =
  | ExplicitDrawState
  | 'SCHEDULED' // Legacy alias for BEFORE_DRAW
  | 'UPDATING'  // Legacy alias for SYNCING/DRAWING
  | 'COMPLETED' // Legacy alias for RESULT_AVAILABLE
  | 'DELAYED'   // Legacy alias for WAITING_FOR_RESULT
  | 'FUTURE'    // Future date
  | 'EMPTY'     // Legacy alias for RESULT_MISSING
  | 'ERROR';    // Legacy alias for SOURCE_ERROR

export type DrawStatus = DrawLifecycleState;

/**
 * All 8 standard Northern Vietnam Lottery prize groups.
 * Total 27 prizes per draw.
 */
export interface XSMBPrizes {
  dacBiet: string[];  // 1 number × 5 digits — Đặc Biệt
  giaiNhat: string[]; // 1 number × 5 digits — Giải Nhất
  giaiNhi: string[];  // 2 numbers × 5 digits — Giải Nhì
  giaiBa: string[];   // 6 numbers × 5 digits — Giải Ba
  giaiTu: string[];   // 4 numbers × 4 digits — Giải Tư
  giaiNam: string[];  // 6 numbers × 4 digits — Giải Năm
  giaiSau: string[];  // 3 numbers × 3 digits — Giải Sáu
  giaiBay: string[];  // 4 numbers × 2 digits — Giải Bảy
}

/** Single draw result representation */
export interface XSMBResult {
  date: string;              // YYYY-MM-DD
  dayOfWeek?: string;        // e.g. "Thứ Tư"
  displayDate?: string;      // e.g. "02/09/2026"
  status: DrawLifecycleState;
  prizes: XSMBPrizes | null;
  specialPrize: string | null;
  updatedAt: string | null;  // e.g. "18:27" or ISO timestamp
  isFromCache?: boolean;
  updateMilestones?: PrizeMilestone[];
}

/** Milestone progress tracking for the UPDATING state */
export interface PrizeMilestone {
  key: keyof XSMBPrizes;
  label: string;
  isComplete: boolean;
  count: number;
}

/** Quick 7-Day Statistics Preview Item */
export interface StatPreviewItem {
  number: string; // 2-digit number (e.g. "23")
  count: number;  // Frequency (e.g. 6)
  lastAppeared?: string; // e.g. "Hôm qua" or "2 ngày trước"
}

/** Recent historical result summary */
export interface RecentResultSummary {
  date: string;        // YYYY-MM-DD
  dayOfWeek: string;   // "Thứ Tư"
  displayDate: string; // "02/09/2026"
  shortDate: string;   // "02/09"
  specialPrize: string;// "12345"
  twoDigit: string;    // "45"
}

/** Prize Group metadata configuration */
export const PRIZE_GROUPS = [
  { key: 'dacBiet'  as const, label: 'GIẢI ĐẶC BIỆT', shortLabel: 'ĐB',  count: 1, digits: 5, collapsible: false },
  { key: 'giaiNhat' as const, label: 'GIẢI NHẤT',    shortLabel: 'G.1', count: 1, digits: 5, collapsible: false },
  { key: 'giaiNhi'  as const, label: 'GIẢI NHÌ',     shortLabel: 'G.2', count: 2, digits: 5, collapsible: false },
  { key: 'giaiBa'   as const, label: 'GIẢI BA',      shortLabel: 'G.3', count: 6, digits: 5, collapsible: false },
  { key: 'giaiTu'   as const, label: 'GIẢI TƯ',      shortLabel: 'G.4', count: 4, digits: 4, collapsible: true },
  { key: 'giaiNam'  as const, label: 'GIẢI NĂM',     shortLabel: 'G.5', count: 6, digits: 4, collapsible: true },
  { key: 'giaiSau'  as const, label: 'GIẢI SÁU',     shortLabel: 'G.6', count: 3, digits: 3, collapsible: true },
  { key: 'giaiBay'  as const, label: 'GIẢI BẢY',     shortLabel: 'G.7', count: 4, digits: 2, collapsible: true },
] as const;

export type PrizeKey = (typeof PRIZE_GROUPS)[number]['key'];

export const TOTAL_PRIZE_COUNT = PRIZE_GROUPS.reduce((sum, g) => sum + g.count, 0); // 27

// ─── Development / Visual Fixtures (Isolated in dev/sample-data) ─────────────
// Production services must NEVER rely on these fixtures.
export {
  SAMPLE_COMPLETED_PRIZES,
  SAMPLE_PARTIAL_PRIZES,
  SAMPLE_7DAY_STATS,
  SAMPLE_RECENT_RESULTS,
} from './dev/sample-data';

