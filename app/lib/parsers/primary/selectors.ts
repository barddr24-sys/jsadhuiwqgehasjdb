/**
 * Primary Web XSMB Provider — Isolated CSS Selectors & Matchers
 *
 * Isolated selector configurations for parsing HTML from primary web sources.
 * All source-specific selectors live here to facilitate maintenance when remote markup updates.
 */

import type { PrizeTierKey } from '../../db/config/prize-config';

export interface TierSelectorDefinition {
  readonly tier: PrizeTierKey;
  readonly primarySelectors: string[];
  readonly semanticAliases: string[];
}

/**
 * Common container selectors for lottery results in Vietnamese web pages.
 */
export const CONTAINER_SELECTORS = [
  'table.table-result',     // xoso.com.vn
  'table.table-xsmb',
  'table.bkq-table',
  'table.kqmb',
  'table.tbl-xsmb',
  'table.xsmb',
  '.box_kqxs',
  '.box_kqxs_mb',
  '#box_kqxs_mb',
  '.kq-table',
  'table[data-table="xsmb"]',
  '.xsmb-result-table',
  '.content-table table',
  'table',
];

/**
 * Isolated selector mappings for each of the 8 canonical XSMB prize tiers.
 */
export const TIER_SELECTORS: Record<PrizeTierKey, TierSelectorDefinition> = {
  special: {
    tier: 'special',
    primarySelectors: [
      // xoso.com.vn: table.table-result row[1] (label=ĐB), last td
      'table.table-result tr:nth-child(2) td:last-child',
      // generic class-based selectors
      'tr.gdb td.number',
      'tr.gdb td.v-gdb',
      'tr.gdb td:last-child',
      'tr.g_db td:last-child',
      'tr.special td:last-child',
      'td.gdb',
      'td.v-gdb',
      '[data-prize="special"]',
      '[data-prize="dacbiet"]',
      '.prize-special',
      '.dac-biet',
    ],
    semanticAliases: [
      'giải đặc biệt',
      'đặc biệt',
      'giai dac biet',
      'dac biet',
      'đb',
      'g.đb',
      'g.db',
    ],
  },
  firstPrize: {
    tier: 'firstPrize',
    primarySelectors: [
      // xoso.com.vn: table.table-result row[2] (label=1)
      'table.table-result tr:nth-child(3) td:last-child',
      'tr.g1 td.number',
      'tr.g1 td.v-g1',
      'tr.g1 td:last-child',
      'tr.g_1 td:last-child',
      'tr.first td:last-child',
      'td.g1',
      'td.v-g1',
      '[data-prize="first"]',
      '[data-prize="g1"]',
      '.prize-first',
      '.giai-nhat',
    ],
    semanticAliases: [
      'giải nhất',
      'giai nhat',
      'g.1',
      'g1',
      'g.nhất',
      'g.nhat',
    ],
  },
  secondPrize: {
    tier: 'secondPrize',
    primarySelectors: [
      // xoso.com.vn: table.table-result row[3] (label=2)
      'table.table-result tr:nth-child(4) td:last-child',
      'tr.g2 td.number',
      'tr.g2 td.v-g2',
      'tr.g2 td:last-child',
      'tr.g_2 td:last-child',
      'tr.second td:last-child',
      'td.g2',
      'td.v-g2',
      '[data-prize="second"]',
      '[data-prize="g2"]',
      '.prize-second',
      '.giai-nhi',
    ],
    semanticAliases: [
      'giải nhì',
      'giai nhi',
      'g.2',
      'g2',
      'g.nhì',
      'g.nhi',
    ],
  },
  thirdPrize: {
    tier: 'thirdPrize',
    primarySelectors: [
      // xoso.com.vn: table.table-result row[4] (label=3)
      'table.table-result tr:nth-child(5) td:last-child',
      'tr.g3 td.number',
      'tr.g3 td.v-g3',
      'tr.g3 td:last-child',
      'tr.g_3 td:last-child',
      'tr.third td:last-child',
      'td.g3',
      'td.v-g3',
      '[data-prize="third"]',
      '[data-prize="g3"]',
      '.prize-third',
      '.giai-ba',
    ],
    semanticAliases: [
      'giải ba',
      'giai ba',
      'g.3',
      'g3',
      'g.ba',
    ],
  },
  fourthPrize: {
    tier: 'fourthPrize',
    primarySelectors: [
      // xoso.com.vn: table.table-result row[5] (label=4)
      'table.table-result tr:nth-child(6) td:last-child',
      'tr.g4 td.number',
      'tr.g4 td.v-g4',
      'tr.g4 td:last-child',
      'tr.g_4 td:last-child',
      'tr.fourth td:last-child',
      'td.g4',
      'td.v-g4',
      '[data-prize="fourth"]',
      '[data-prize="g4"]',
      '.prize-fourth',
      '.giai-tu',
    ],
    semanticAliases: [
      'giải tư',
      'giai tu',
      'giải bốn',
      'giai bon',
      'giải 4',
      'g.4',
      'g4',
      'g.tư',
      'g.tu',
    ],
  },
  fifthPrize: {
    tier: 'fifthPrize',
    primarySelectors: [
      // xoso.com.vn: table.table-result row[6] (label=5)
      'table.table-result tr:nth-child(7) td:last-child',
      'tr.g5 td.number',
      'tr.g5 td.v-g5',
      'tr.g5 td:last-child',
      'tr.g_5 td:last-child',
      'tr.fifth td:last-child',
      'td.g5',
      'td.v-g5',
      '[data-prize="fifth"]',
      '[data-prize="g5"]',
      '.prize-fifth',
      '.giai-nam',
    ],
    semanticAliases: [
      'giải năm',
      'giai nam',
      'giải 5',
      'g.5',
      'g5',
      'g.năm',
      'g.nam',
    ],
  },
  sixthPrize: {
    tier: 'sixthPrize',
    primarySelectors: [
      // xoso.com.vn: table.table-result row[7] (label=6)
      'table.table-result tr:nth-child(8) td:last-child',
      'tr.g6 td.number',
      'tr.g6 td.v-g6',
      'tr.g6 td:last-child',
      'tr.g_6 td:last-child',
      'tr.sixth td:last-child',
      'td.g6',
      'td.v-g6',
      '[data-prize="sixth"]',
      '[data-prize="g6"]',
      '.prize-sixth',
      '.giai-sau',
    ],
    semanticAliases: [
      'giải sáu',
      'giai sau',
      'giải 6',
      'g.6',
      'g6',
      'g.sáu',
      'g.sau',
    ],
  },
  seventhPrize: {
    tier: 'seventhPrize',
    primarySelectors: [
      // xoso.com.vn: table.table-result row[8] (label=7)
      'table.table-result tr:nth-child(9) td:last-child',
      'tr.g7 td.number',
      'tr.g7 td.v-g7',
      'tr.g7 td:last-child',
      'tr.g_7 td:last-child',
      'tr.seventh td:last-child',
      'td.g7',
      'td.v-g7',
      '[data-prize="seventh"]',
      '[data-prize="g7"]',
      '.prize-seventh',
      '.giai-bay',
    ],
    semanticAliases: [
      'giải bảy',
      'giai bay',
      'giải 7',
      'g.7',
      'g7',
      'g.bảy',
      'g.bay',
    ],
  },
};

/**
 * Common selectors for finding the draw date on web pages.
 */
export const DATE_SELECTORS = [
  '.draw-date',
  '.title-date',
  '.ngay_quay',
  '.kq_date',
  '.date-title',
  '.title-xsmb',
  'h1',
  'h2',
  'h3',
  '.breadcrumb',
  'title',
];

/**
 * Selectors for discovering displayed province or region.
 */
export const PROVINCE_SELECTORS = [
  '.province',
  '.tinh_thanh',
  '.region',
  '.title-province',
  '.location-badge',
  '.box_kqxs .head',
  'h1',
  'h2',
];

/**
 * Lottery page validity keywords.
 */
export const XSMB_IDENTIFIER_KEYWORDS = [
  'xsmb',
  'miền bắc',
  'mien bac',
  'kqxsmb',
  'kết quả xổ số miền bắc',
  'xổ số miền bắc',
  'xố số miền bắc',
  'xs mb',
];
