/**
 * XSMB Scheduler Configuration
 *
 * Configurable via environment variables with production-ready defaults.
 * All scheduling is evaluated in Asia/Ho_Chi_Minh timezone.
 */

export interface SchedulerConfig {
  timezone: string;
  drawStartTime: string; // "18:15"
  drawEndTime: string;   // "18:30"
  preDrawLeadMinutes: number; // minutes before start to enter PRE_DRAW mode (default: 15 mins -> 18:00)
  normalIntervalMs: number;
  preDrawIntervalMs: number;
  drawIntervalMs: number;
  maxRetries: number;
}

export function parseTimeToMinutes(timeStr: string): { hours: number; minutes: number; totalMinutes: number } {
  const parts = (timeStr || '18:15').split(':').map(Number);
  const hours = isNaN(parts[0]) ? 18 : parts[0];
  const minutes = isNaN(parts[1]) ? 15 : parts[1];
  return {
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
  };
}

export function getSchedulerConfig(): SchedulerConfig {
  return {
    timezone: process.env.XSMB_TIMEZONE || 'Asia/Ho_Chi_Minh',
    drawStartTime: process.env.XSMB_DRAW_START_TIME || '18:15',
    drawEndTime: process.env.XSMB_DRAW_END_TIME || '18:30',
    preDrawLeadMinutes: 15,
    normalIntervalMs: parseInt(process.env.XSMB_SYNC_NORMAL_INTERVAL_MS || '', 10) || 300000, // 5 minutes
    preDrawIntervalMs: parseInt(process.env.XSMB_SYNC_PRE_DRAW_INTERVAL_MS || '', 10) || 60000, // 1 minute
    drawIntervalMs: parseInt(process.env.XSMB_SYNC_DRAW_INTERVAL_MS || '', 10) || 15000,      // 15 seconds
    maxRetries: parseInt(process.env.XSMB_SYNC_MAX_RETRIES || '', 10) || 3,
  };
}
