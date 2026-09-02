/**
 * Application Lifecycle & Graceful Shutdown Manager
 *
 * Coordinates initialization and clean teardown of:
 * - XSMB Scheduler
 * - MongoDB Connection
 *
 * Adheres strictly to MongoDB Atlas ONLY architecture (No Redis).
 */

import { xsmbSchedulerService } from './scheduler/xsmb-scheduler.service';
import { connectToDatabase, disconnectFromDatabase } from './db/connection';

let isShuttingDown = false;
let isInitialized = false;

/**
 * Initializes application background services.
 */
export async function initApplication(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;

  if (process.env.NODE_ENV !== 'test') {
    console.log('[Lifecycle] Initializing XSMB background services...');
  }

  // 1. Connect to MongoDB Atlas
  try {
    await connectToDatabase();
  } catch (err) {
    console.warn('[Lifecycle] Warning: MongoDB initial connection failed:', err);
  }

  // 2. Start background scheduler if enabled (disabled on Vercel serverless functions)
  const isVercel = !!process.env.VERCEL;
  if (isVercel) {
    if (process.env.NODE_ENV !== 'test') {
      console.log(
        '[Lifecycle] Vercel Serverless environment detected. In-process timer scheduler is disabled; synchronization is triggered via Vercel Cron -> /api/internal/xsmb/sync.'
      );
    }
    return;
  }

  const schedulerEnabled = process.env.XSMB_SCHEDULER_ENABLED !== 'false';
  if (schedulerEnabled) {
    await xsmbSchedulerService.start();
    // Non-blocking asynchronous historical integrity check (last 90 days)
    void xsmbSchedulerService.ensureRecentHistory(90);
  }
}

/**
 * Performs graceful shutdown of all backend components.
 */
export async function shutdownApplication(signal?: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (process.env.NODE_ENV !== 'test') {
    console.log(
      `[Lifecycle] Received ${signal || 'shutdown signal'}, stopping background services gracefully...`
    );
  }

  // 1. Stop scheduler and any pending timers
  try {
    xsmbSchedulerService.stop();
  } catch (err) {
    console.warn('[Lifecycle] Error stopping scheduler:', err);
  }

  // 2. Disconnect from MongoDB
  try {
    await disconnectFromDatabase();
  } catch (err) {
    console.warn('[Lifecycle] Error disconnecting from MongoDB:', err);
  }

  if (process.env.NODE_ENV !== 'test') {
    console.log('[Lifecycle] Clean shutdown complete.');
  }
}

/**
 * Registers process signal handlers for production.
 */
if (typeof process !== 'undefined' && process.on && process.env.NODE_ENV === 'production') {
  process.on('SIGTERM', () => shutdownApplication('SIGTERM'));
  process.on('SIGINT', () => shutdownApplication('SIGINT'));
}
