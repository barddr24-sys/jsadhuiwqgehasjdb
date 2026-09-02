import { describe, it, expect, beforeEach } from 'vitest';
import {
  StatisticsDeepService,
  extractAll2DigitsFromDraw,
  extractSpecialTailFromDraw,
  calculateTrend,
} from '../../app/lib/services/statistics-deep.service';
import { StatisticsCacheService } from '../../app/lib/services/statistics-cache.service';
import type { IXSMBDraw } from '../../app/lib/db/types/db-types';

describe('StatisticsDeepService — Algorithms & Computations', () => {
  beforeEach(() => {
    StatisticsCacheService.invalidateAll();
  });

  // Mock draws fixture for unit testing algorithms
  const createMockDraw = (
    drawDate: string,
    special: string,
    lotoNumbers: string[]
  ): IXSMBDraw => ({
    drawDate,
    lotteryType: 'XSMB',
    status: 'READY',
    createdAt: new Date(),
    updatedAt: new Date(),
    results: {
      special: [special],
      firstPrize: [lotoNumbers[0] || '11111'],
      secondPrize: [lotoNumbers[1] || '22222', lotoNumbers[2] || '33333'],
      thirdPrize: [
        lotoNumbers[3] || '44444',
        lotoNumbers[4] || '55555',
        lotoNumbers[5] || '66666',
        lotoNumbers[6] || '77777',
        lotoNumbers[7] || '88888',
        lotoNumbers[8] || '99999',
      ],
      fourthPrize: [
        lotoNumbers[9] || '1111',
        lotoNumbers[10] || '2222',
        lotoNumbers[11] || '3333',
        lotoNumbers[12] || '4444',
      ],
      fifthPrize: [
        lotoNumbers[13] || '5555',
        lotoNumbers[14] || '6666',
        lotoNumbers[15] || '7777',
        lotoNumbers[16] || '8888',
        lotoNumbers[17] || '9999',
        lotoNumbers[18] || '0000',
      ],
      sixthPrize: [
        lotoNumbers[19] || '111',
        lotoNumbers[20] || '222',
        lotoNumbers[21] || '333',
      ],
      seventhPrize: [
        lotoNumbers[22] || '44',
        lotoNumbers[23] || '55',
        lotoNumbers[24] || '66',
        lotoNumbers[25] || '77',
      ],
    },
  });

  it('should accurately extract all 27 two-digit numbers from draw results', () => {
    const draw = createMockDraw('2026-09-01', '85429', [
      '36127', '14772', '92301', '28491', '05623', '74128',
      '63904', '81235', '49017', '4821', '6039', '1748',
      '9532', '8204', '3195', '6471', '0852', '9316',
      '5270', '529', '841', '306', '29', '45', '78', '02'
    ]);

    const extracted = extractAll2DigitsFromDraw(draw.results);

    expect(extracted.length).toBe(27);
    expect(extracted[0].number).toBe('29'); // Special prize tail
    expect(extracted[0].tierCode).toBe('SPECIAL');
    expect(extracted[1].number).toBe('27'); // First prize tail
    expect(extracted[2].number).toBe('72'); // Second prize tail
  });

  it('should isolate Special Prize 2 last digits strictly', () => {
    const draw = createMockDraw('2026-09-01', '85429', []);
    const special = extractSpecialTailFromDraw(draw.results);

    expect(special).not.toBeNull();
    expect(special?.tail).toBe('29');
    expect(special?.fullNumber).toBe('85429');
  });

  it('should classify mathematical trends deterministically', () => {
    // Increasing trend: recent rate much higher than older rate
    const trendInc = calculateTrend(4, 3, 1, 4, 0, 1, 7);
    expect(trendInc.trend).toBe('increasing');

    // Decreasing trend: older rate much higher than recent rate
    const trendDec = calculateTrend(1, 3, 3, 4, 1, 0, 7);
    expect(trendDec.trend).toBe('decreasing');

    // Recently active streak: appeared in newest draw with streak >= 2
    const trendActive = calculateTrend(2, 3, 2, 4, 0, 2, 7);
    expect(trendActive.trend).toBe('recently_active');

    // Recently inactive: high gap and zero in recent period
    const trendInactive = calculateTrend(0, 15, 3, 15, 12, 0, 30);
    expect(trendInactive.trend).toBe('recently_inactive');

    // Stable: balanced across periods
    const trendStable = calculateTrend(2, 3, 2, 4, 1, 0, 7);
    expect(trendStable.trend).toBe('stable');
  });

  it('should isolate in-memory caching by analysis type and date range', () => {
    const key30 = StatisticsCacheService.buildKey('loto', '30days');
    const key7 = StatisticsCacheService.buildKey('loto', '7days');

    expect(key30).not.toBe(key7);

    StatisticsCacheService.set(key30, { count: 30 });
    StatisticsCacheService.set(key7, { count: 7 });

    expect(StatisticsCacheService.get(key30)).toEqual({ count: 30 });
    expect(StatisticsCacheService.get(key7)).toEqual({ count: 7 });

    StatisticsCacheService.invalidatePrefix('stats:loto:7days');
    expect(StatisticsCacheService.get(key7)).toBeNull();
    expect(StatisticsCacheService.get(key30)).not.toBeNull();
  });
});
