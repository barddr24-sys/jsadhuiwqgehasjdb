/**
 * XSMB Sync & Backfill CLI
 *
 * Triggers the full real-data pipeline:
 *   Provider → Parser → Normalizer → Validator → XSMBSyncService → MongoDB
 *
 * Usage:
 *   npx tsx scripts/sync.ts                           # syncs today (VN timezone)
 *   npx tsx scripts/sync.ts -- --date=YYYY-MM-DD      # syncs specific date
 *   npx tsx scripts/sync.ts -- --days=90              # backfills last 90 days (or --backfill=90)
 *   npx tsx scripts/sync.ts -- --from=... --to=...    # syncs date range
 *   npx tsx scripts/sync.ts -- --force                # force re-save even if NO_CHANGE
 *   npx tsx scripts/sync.ts -- --delay=200            # rate-limit delay in ms
 *
 * Prints ONLY safe diagnostics. Never prints MongoDB credentials.
 */

import path from 'path';
import fs from 'fs';

// ─── Load .env.local before any app imports ────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

// ─── App imports (must come after env load) ────────────────────────────────
import { getTodayVN, isValidDateStr } from '../app/lib/date-utils';
import { connectToDatabase, disconnectFromDatabase } from '../app/lib/db/connection';
import { XSMBSyncService } from '../app/lib/sync/xsmb-sync.service';
import { xsmbDrawRepository } from '../app/lib/db/repositories/xsmb-draw.repository';
import { DRAW_STATUS } from '../app/lib/db/config/status-config';
import type { IXSMBDrawResults } from '../app/lib/db/types/db-types';

interface CLIArgs {
  mode: 'single' | 'recent' | 'range';
  date: string;
  days: number;
  fromDate: string;
  toDate: string;
  force: boolean;
  delayMs: number;
}

// ─── Parse CLI arguments ───────────────────────────────────────────────────
function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  let mode: 'single' | 'recent' | 'range' = 'single';
  let date = getTodayVN();
  let days = 0;
  let fromDate = '';
  let toDate = '';
  let force = false;
  let delayMs = 200;

  for (const arg of args) {
    if (arg.startsWith('--date=')) {
      const raw = arg.replace('--date=', '').trim();
      if (!isValidDateStr(raw)) {
        console.error(`[ERROR] Invalid date format: "${raw}". Expected YYYY-MM-DD.`);
        process.exit(1);
      }
      date = raw;
      mode = 'single';
    } else if (arg.startsWith('--days=') || arg.startsWith('--backfill=')) {
      const raw = arg.replace(/--(days|backfill)=/, '').trim();
      const num = parseInt(raw, 10);
      if (isNaN(num) || num <= 0) {
        console.error(`[ERROR] Invalid days count: "${raw}". Expected positive integer.`);
        process.exit(1);
      }
      days = num;
      mode = 'recent';
    } else if (arg.startsWith('--from=')) {
      const raw = arg.replace('--from=', '').trim();
      if (!isValidDateStr(raw)) {
        console.error(`[ERROR] Invalid --from date format: "${raw}". Expected YYYY-MM-DD.`);
        process.exit(1);
      }
      fromDate = raw;
      mode = 'range';
    } else if (arg.startsWith('--to=')) {
      const raw = arg.replace('--to=', '').trim();
      if (!isValidDateStr(raw)) {
        console.error(`[ERROR] Invalid --to date format: "${raw}". Expected YYYY-MM-DD.`);
        process.exit(1);
      }
      toDate = raw;
      mode = 'range';
    } else if (arg.startsWith('--delay=')) {
      const raw = arg.replace('--delay=', '').trim();
      const num = parseInt(raw, 10);
      if (!isNaN(num) && num >= 0) {
        delayMs = num;
      }
    } else if (arg === '--force') {
      force = true;
    }
  }

  if (mode === 'range') {
    if (!fromDate || !toDate) {
      console.error('[ERROR] Both --from and --to are required when specifying date range.');
      process.exit(1);
    }
    if (fromDate > toDate) {
      console.error(`[ERROR] --from date (${fromDate}) must be <= --to date (${toDate}).`);
      process.exit(1);
    }
  }

  return { mode, date, days, fromDate, toDate, force, delayMs };
}

// ─── Safe tier counter ─────────────────────────────────────────────────────
const EXPECTED_COUNTS: Record<string, number> = {
  special: 1,
  firstPrize: 1,
  secondPrize: 2,
  thirdPrize: 6,
  fourthPrize: 4,
  fifthPrize: 6,
  sixthPrize: 3,
  seventhPrize: 4,
};

const TIER_LABELS: Record<string, string> = {
  special: 'SPECIAL',
  firstPrize: 'FIRST',
  secondPrize: 'SECOND',
  thirdPrize: 'THIRD',
  fourthPrize: 'FOURTH',
  fifthPrize: 'FIFTH',
  sixthPrize: 'SIXTH',
  seventhPrize: 'SEVENTH',
};

function countResults(results: IXSMBDrawResults | undefined): number {
  if (!results) return 0;
  return Object.values(results).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const cliArgs = parseArgs();

  console.log('═══════════════════════════════════════════════════');
  console.log('  XSMB REAL DATA INGESTION & SYNC CLI');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Mode:     ${cliArgs.mode.toUpperCase()}`);
  if (cliArgs.mode === 'single') console.log(`  Date:     ${cliArgs.date}`);
  if (cliArgs.mode === 'recent') console.log(`  Days:     ${cliArgs.days}`);
  if (cliArgs.mode === 'range') console.log(`  Range:    ${cliArgs.fromDate} → ${cliArgs.toDate}`);
  console.log(`  Force:    ${cliArgs.force}`);
  console.log(`  Delay:    ${cliArgs.delayMs}ms`);
  console.log(`  Provider: ${process.env.XSMB_PRIMARY_SOURCE_URL || '(default: xoso.com.vn)'}`);
  console.log('───────────────────────────────────────────────────\n');

  // [1/4] Connect to MongoDB
  console.log('[1/4] Connecting to MongoDB...');
  try {
    await connectToDatabase();
    console.log('      ✓ Connected\n');
  } catch (err) {
    console.error(`      ✗ MongoDB connection failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  const syncService = new XSMBSyncService();

  // [2/4] Run sync pipeline based on mode
  if (cliArgs.mode === 'recent' || cliArgs.mode === 'range') {
    console.log('[2/4] Running batch historical sync...');
    const startMs = Date.now();

    let batchResult;
    if (cliArgs.mode === 'recent') {
      batchResult = await syncService.syncRecentDraws(cliArgs.days, {
        allowPartial: true,
        forceUpdate: cliArgs.force,
        rateLimitDelayMs: cliArgs.delayMs,
        onProgress: (idx, total, d, res) => {
          const mark = res.status === 'SUCCESS' ? '✓' : res.status === 'NO_CHANGE' ? '=' : res.status === 'PARTIAL' ? '~' : '✗';
          console.log(`      [${String(idx).padStart(2, ' ')}/${total}] ${d} [${mark} ${res.status}] ${res.errorMessage ? `(${res.errorMessage})` : ''}`);
        },
      });
    } else {
      batchResult = await syncService.syncDateRange(cliArgs.fromDate, cliArgs.toDate, {
        allowPartial: true,
        forceUpdate: cliArgs.force,
      });
    }

    const durationMs = Date.now() - startMs;
    console.log('\n───────────────────────────────────────────────────');
    console.log('  BATCH SYNC RESULT SUMMARY');
    console.log('───────────────────────────────────────────────────');
    console.log(`  Requested:   ${batchResult.totalRequested}`);
    console.log(`  Successful:  ${batchResult.successful}`);
    console.log(`  No change:   ${batchResult.noChange}`);
    console.log(`  Partial:     ${batchResult.partial}`);
    console.log(`  Conflicts:   ${batchResult.conflicts}`);
    console.log(`  Failed:      ${batchResult.failed}`);
    console.log(`  Duration:    ${(durationMs / 1000).toFixed(2)}s`);
    console.log('═══════════════════════════════════════════════════\n');

    await disconnectFromDatabase();
    process.exit(0);
  }

  // Single date sync
  console.log('[2/4] Running single date sync pipeline...');
  console.log(`      Provider → Parser → Validator → MongoDB (${cliArgs.date})\n`);

  const startMs = Date.now();
  const result = await syncService.syncDate(cliArgs.date, {
    allowPartial: true,
    forceUpdate: cliArgs.force,
  });
  const durationMs = Date.now() - startMs;

  console.log('───────────────────────────────────────────────────');
  console.log('  SYNC RESULT');
  console.log('───────────────────────────────────────────────────');
  console.log(`  Status:      ${result.status}`);
  console.log(`  Date:        ${result.date}`);
  console.log(`  Provider:    ${result.providerId}`);
  console.log(`  HTTP status: ${result.httpStatus ?? 'N/A'}`);
  console.log(`  Duration:    ${durationMs}ms`);

  if (result.errorCode) {
    console.log(`  Error code:  ${result.errorCode}`);
    console.log(`  Error:       ${result.errorMessage}`);
  }
  if (result.validationErrors?.length) {
    console.log(`  Validation:  ${result.validationErrors.join('; ')}`);
  }
  console.log('');

  // [3/4] Verify MongoDB
  console.log('[3/4] Verifying MongoDB document...');
  const stored = await xsmbDrawRepository.findByDate(cliArgs.date);

  if (!stored) {
    if (result.status === 'NO_CHANGE') {
      console.log('      ℹ NO_CHANGE — Data was already current in MongoDB.');
    } else {
      console.error('      ✗ Document not found in MongoDB after sync!');
    }
  } else {
    const results = stored.results;
    const total = countResults(results);
    const expectedTotal = 27;
    const isReady = stored.status === DRAW_STATUS.READY;

    console.log('\n  XSMB REAL DATA VERIFIED');
    console.log('  ─────────────────────────');
    console.log(`  Date:   ${stored.drawDate}`);
    console.log(`  Status: ${stored.status}`);
    console.log('');

    if (results) {
      for (const [key, label] of Object.entries(TIER_LABELS)) {
        const tier = key as keyof IXSMBDrawResults;
        const actual = results[tier]?.length ?? 0;
        const expected = EXPECTED_COUNTS[key] ?? 0;
        const mark = actual === expected ? '✓' : (actual > 0 ? '~' : '✗');
        console.log(`  ${mark} ${label.padEnd(10)} ${actual}/${expected}`);
      }
    }

    console.log('');
    console.log(`  TOTAL: ${total}/${expectedTotal} ${total === expectedTotal ? '✓' : '✗'}`);
    console.log(`  MongoDB: ${isReady && total === expectedTotal ? 'PASS ✓' : 'PARTIAL/INCOMPLETE'}`);
  }

  // [4/4] Summary
  console.log('\n───────────────────────────────────────────────────');
  console.log('  REAL XSMB DATA STATUS');
  console.log('───────────────────────────────────────────────────');
  console.log(`  Provider:  ${result.providerId}`);
  console.log(`  Date:      ${cliArgs.date}`);
  console.log(`  Result:    ${result.status}`);
  console.log(`  MongoDB:   ${result.status === 'NO_CHANGE' ? 'NO_CHANGE' : result.status === 'SUCCESS' ? 'CREATED/UPDATED' : 'NOT_WRITTEN'}`);
  console.log('═══════════════════════════════════════════════════\n');

  await disconnectFromDatabase();
  process.exit((result.status as string) === 'FAILED' ? 1 : 0);
}

main().catch((err) => {
  console.error('[FATAL]', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
