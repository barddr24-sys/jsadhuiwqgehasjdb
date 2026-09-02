import { describe, it, expect } from 'vitest';
import {
  StatisticsDateRangeService,
} from '../../app/lib/services/statistics-date-range.service';

describe('StatisticsDateRangeService', () => {
  it('should parse range keys accurately', () => {
    expect(StatisticsDateRangeService.parseRangeKey('today')).toBe('today');
    expect(StatisticsDateRangeService.parseRangeKey('yesterday')).toBe('yesterday');
    expect(StatisticsDateRangeService.parseRangeKey('3days')).toBe('3days');
    expect(StatisticsDateRangeService.parseRangeKey('7days')).toBe('7days');
    expect(StatisticsDateRangeService.parseRangeKey('14days')).toBe('14days');
    expect(StatisticsDateRangeService.parseRangeKey('30days')).toBe('30days');
    expect(StatisticsDateRangeService.parseRangeKey('90days')).toBe('90days');
    expect(StatisticsDateRangeService.parseRangeKey(3)).toBe('3days');
    expect(StatisticsDateRangeService.parseRangeKey(7)).toBe('7days');
    expect(StatisticsDateRangeService.parseRangeKey(14)).toBe('14days');
    expect(StatisticsDateRangeService.parseRangeKey(30)).toBe('30days');
  });

  it('should resolve standard 30-day date range with expected dates sequence', () => {
    const range = StatisticsDateRangeService.resolveDateRange('30days', {
      anchorDate: '2026-09-01',
    });

    expect(range.rangeKey).toBe('30days');
    expect(range.daysCount).toBe(30);
    expect(range.endDate).toBe('2026-09-01');
    expect(range.startDate).toBe('2026-08-03');
    expect(range.expectedDates.length).toBe(30);
    expect(range.expectedDates[0]).toBe('2026-09-01');
    expect(range.expectedDates[29]).toBe('2026-08-03');
  });

  it('should resolve 7-day date range accurately', () => {
    const range = StatisticsDateRangeService.resolveDateRange('7days', {
      anchorDate: '2026-09-01',
    });

    expect(range.daysCount).toBe(7);
    expect(range.endDate).toBe('2026-09-01');
    expect(range.startDate).toBe('2026-08-26');
    expect(range.expectedDates.length).toBe(7);
  });

  it('should resolve yesterday accurately', () => {
    const range = StatisticsDateRangeService.resolveDateRange('yesterday', {
      anchorDate: '2026-09-01',
    });

    expect(range.daysCount).toBe(1);
    expect(range.endDate).toBe('2026-09-01');
    expect(range.startDate).toBe('2026-09-01');
    expect(range.expectedDates).toEqual(['2026-09-01']);
  });

  it('should evaluate data completeness as HEALTHY when all dates present', () => {
    const expected = ['2026-09-01', '2026-08-31', '2026-08-30'];
    const available = ['2026-09-01', '2026-08-31', '2026-08-30'];

    const evaluation = StatisticsDateRangeService.evaluateCompleteness(expected, available);

    expect(evaluation.status).toBe('HEALTHY');
    expect(evaluation.missingDays).toBe(0);
    expect(evaluation.missingDates).toEqual([]);
    expect(evaluation.coveragePercentage).toBe(100);
  });

  it('should evaluate data completeness as INCOMPLETE when dates missing', () => {
    const expected = ['2026-09-01', '2026-08-31', '2026-08-30', '2026-08-29'];
    const available = ['2026-09-01', '2026-08-30'];

    const evaluation = StatisticsDateRangeService.evaluateCompleteness(expected, available);

    expect(evaluation.status).toBe('INCOMPLETE');
    expect(evaluation.missingDays).toBe(2);
    expect(evaluation.missingDates).toEqual(['2026-08-31', '2026-08-29']);
    expect(evaluation.coveragePercentage).toBe(50);
  });
});
