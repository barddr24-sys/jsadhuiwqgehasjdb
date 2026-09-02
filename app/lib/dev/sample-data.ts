/**
 * XSMB Development & Testing Fixtures
 *
 * NOTE: These fixtures are strictly for local UI testing, design state switching,
 * and visual storyboarding in development.
 *
 * PRODUCTION DATA RULE:
 * Production routes, services, and repositories MUST NEVER import or use these
 * fixtures. Production lottery data must only originate from verified upstream
 * providers stored in MongoDB Atlas.
 */

import type {
  XSMBPrizes,
  StatPreviewItem,
  RecentResultSummary,
} from '../xsmb-types';

export const SAMPLE_COMPLETED_PRIZES: XSMBPrizes = {
  dacBiet: ['85429'],
  giaiNhat: ['36192'],
  giaiNhi: ['14785', '92301'],
  giaiBa: ['28491', '05623', '74128', '63904', '81235', '49017'],
  giaiTu: ['4821', '6039', '1748', '9532'],
  giaiNam: ['8204', '3195', '6471', '0852', '9316', '5270'],
  giaiSau: ['529', '841', '306'],
  giaiBay: ['29', '45', '78', '02'],
};

export const SAMPLE_PARTIAL_PRIZES: XSMBPrizes = {
  dacBiet: [],
  giaiNhat: ['36192'],
  giaiNhi: ['14785', '92301'],
  giaiBa: ['28491', '05623', '74128'],
  giaiTu: ['4821', '6039'],
  giaiNam: ['8204', '3195', '6471', '0852', '9316', '5270'],
  giaiSau: ['529', '841', '306'],
  giaiBay: ['29', '45', '78', '02'],
};

export const SAMPLE_7DAY_STATS: StatPreviewItem[] = [
  { number: '23', count: 6, lastAppeared: 'Hôm qua' },
  { number: '45', count: 5, lastAppeared: '2 ngày trước' },
  { number: '78', count: 4, lastAppeared: '3 ngày trước' },
  { number: '29', count: 4, lastAppeared: 'Hôm nay' },
];

export const SAMPLE_RECENT_RESULTS: RecentResultSummary[] = [
  { date: '2026-09-02', dayOfWeek: 'Thứ Tư', displayDate: '02/09/2026', shortDate: '02/09', specialPrize: '85429', twoDigit: '29' },
  { date: '2026-09-01', dayOfWeek: 'Thứ Ba', displayDate: '01/09/2026', shortDate: '01/09', specialPrize: '67890', twoDigit: '90' },
  { date: '2026-08-31', dayOfWeek: 'Thứ Hai', displayDate: '31/08/2026', shortDate: '31/08', specialPrize: '45678', twoDigit: '78' },
  { date: '2026-08-30', dayOfWeek: 'Chủ Nhật', displayDate: '30/08/2026', shortDate: '30/08', specialPrize: '92314', twoDigit: '14' },
  { date: '2026-08-29', dayOfWeek: 'Thứ Bảy', displayDate: '29/08/2026', shortDate: '29/08', specialPrize: '10856', twoDigit: '56' },
];
