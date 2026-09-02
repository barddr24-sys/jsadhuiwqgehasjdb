/**
 * Scheduler Configuration Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getSchedulerConfig,
  parseTimeToMinutes,
} from '../../app/lib/scheduler/scheduler-config';

describe('Scheduler Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.XSMB_TIMEZONE;
    delete process.env.XSMB_DRAW_START_TIME;
    delete process.env.XSMB_DRAW_END_TIME;
    delete process.env.XSMB_SYNC_NORMAL_INTERVAL_MS;
    delete process.env.XSMB_SYNC_PRE_DRAW_INTERVAL_MS;
    delete process.env.XSMB_SYNC_DRAW_INTERVAL_MS;
    delete process.env.XSMB_SYNC_MAX_RETRIES;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should parse HH:mm strings accurately into total minutes', () => {
    expect(parseTimeToMinutes('18:15')).toEqual({
      hours: 18,
      minutes: 15,
      totalMinutes: 18 * 60 + 15,
    });
    expect(parseTimeToMinutes('18:30')).toEqual({
      hours: 18,
      minutes: 30,
      totalMinutes: 18 * 60 + 30,
    });
    expect(parseTimeToMinutes('00:00')).toEqual({
      hours: 0,
      minutes: 0,
      totalMinutes: 0,
    });
  });

  it('should return production defaults when env variables are unset', () => {
    const config = getSchedulerConfig();

    expect(config.timezone).toBe('Asia/Ho_Chi_Minh');
    expect(config.drawStartTime).toBe('18:15');
    expect(config.drawEndTime).toBe('18:30');
    expect(config.normalIntervalMs).toBe(300000); // 5 mins
    expect(config.preDrawIntervalMs).toBe(60000);  // 1 min
    expect(config.drawIntervalMs).toBe(15000);    // 15 sec
    expect(config.maxRetries).toBe(3);
  });

  it('should override defaults with custom environment variables', () => {
    process.env.XSMB_DRAW_START_TIME = '18:10';
    process.env.XSMB_DRAW_END_TIME = '18:40';
    process.env.XSMB_SYNC_NORMAL_INTERVAL_MS = '600000';
    process.env.XSMB_SYNC_PRE_DRAW_INTERVAL_MS = '30000';
    process.env.XSMB_SYNC_DRAW_INTERVAL_MS = '5000';
    process.env.XSMB_SYNC_MAX_RETRIES = '5';

    const config = getSchedulerConfig();

    expect(config.drawStartTime).toBe('18:10');
    expect(config.drawEndTime).toBe('18:40');
    expect(config.normalIntervalMs).toBe(600000);
    expect(config.preDrawIntervalMs).toBe(30000);
    expect(config.drawIntervalMs).toBe(5000);
    expect(config.maxRetries).toBe(5);
  });
});
