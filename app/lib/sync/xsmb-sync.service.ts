/**
 * XSMB Sync Service
 *
 * Implements the idempotent synchronization orchestrator:
 * Provider -> Parser -> Strict Validator -> Persistence (MongoDB).
 *
 * Enforces:
 * 1. Only fully validated draws can transition to READY.
 * 2. Idempotency & SHA-256 checksums to eliminate redundant database writes (NO_CHANGE).
 * 3. READY Protection: Stored READY records are trusted and never downgraded on upstream scrape failure.
 * 4. Safe partial merge: In-progress draws merge newly available valid tiers without corrupting existing valid data.
 * 5. Full audit logging in xsmb_sync_runs and xsmb_sync_attempts.
 * 6. Error isolation: Single date failure never corrupts other dates.
 */

import { randomUUID } from 'crypto';
import {
  DRAW_STATUS,
  VALIDATION_STATUS,
  SYNC_RUN_STATUS,
  LOTTERY_TYPE,
} from '../db/config/status-config';
import { validateDrawDate } from '../db/validation/draw-validator';
import { xsmbDrawRepository, type XSMBDrawRepository } from '../db/repositories/xsmb-draw.repository';
import { xsmbSyncRunRepository, type XSMBSyncRunRepository } from '../db/repositories/xsmb-sync-run.repository';
import { xsmbSyncAttemptRepository, type XSMBSyncAttemptRepository } from '../db/repositories/xsmb-sync-attempt.repository';
import type {
  UpsertDrawDTO,
} from '../db/types/db-types';
import { PrimaryWebXSMBProvider } from '../providers/primary-web-provider';
import type { XSMBProvider } from '../providers/xsmb-provider.interface';
import { PrimaryXSMBParser } from '../parsers/primary/primary-xsmb-parser';
import type { XSMBParser } from '../parsers/types';
import { strictXSMBValidator } from '../validator/strict-xsmb-validator';
import type { XSMBValidator } from '../validator/types';
import type { ProviderLogger } from '../providers/types';
import { getTodayVN, isValidDateStr, addDays } from '../date-utils';
import {
  calculateRawHash,
  calculateResultsChecksum,
  mergePartialResults,
} from './sync-utils';
import type {
  SyncResult,
  BatchSyncResult,
  SyncOptions,
  XSMBSyncDependencies,
} from './types';

export class XSMBSyncService {
  private readonly provider: XSMBProvider;
  private readonly parser: XSMBParser;
  private readonly validator: XSMBValidator;
  private readonly drawRepository: XSMBDrawRepository;
  private readonly syncRunRepository: XSMBSyncRunRepository;
  private readonly syncAttemptRepository: XSMBSyncAttemptRepository;
  private readonly logger?: ProviderLogger;

  constructor(deps: XSMBSyncDependencies = {}) {
    this.provider = deps.provider || new PrimaryWebXSMBProvider();
    this.parser = deps.parser || new PrimaryXSMBParser();
    this.validator = deps.validator || strictXSMBValidator;
    this.drawRepository = deps.drawRepository || xsmbDrawRepository;
    this.syncRunRepository = deps.syncRunRepository || xsmbSyncRunRepository;
    this.syncAttemptRepository = deps.syncAttemptRepository || xsmbSyncAttemptRepository;
    this.logger = deps.logger;
  }

  /**
   * Synchronizes lottery data for today (Vietnam timezone: Asia/Ho_Chi_Minh).
   */
  async syncToday(options?: SyncOptions): Promise<SyncResult> {
    const todayVN = getTodayVN();
    return this.syncDate(todayVN, options);
  }

  /**
   * Synchronizes lottery data for a specific draw date (YYYY-MM-DD).
   */
  async syncDate(date: string, options?: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    const now = options?.now || new Date();
    const syncRunId = options?.syncRunId || `sync-run-${randomUUID()}`;
    const isStandaloneRun = !options?.syncRunId;

    if (isStandaloneRun) {
      await this.syncRunRepository.createRun({
        syncRunId,
        providerId: this.provider.providerId,
        startedAt: now,
        status: SYNC_RUN_STATUS.RUNNING,
      });
    }

    // ─── 1. Input Date Validation ──────────────────────────────────────────
    const dateValidation = validateDrawDate(date);
    if (!dateValidation.isValid || !isValidDateStr(date)) {
      const errorMessage = `Invalid date for sync: ${dateValidation.error || date}`;
      await this.syncAttemptRepository.createAttempt({
        syncRunId,
        providerId: this.provider.providerId,
        requestedDate: date || 'UNKNOWN',
        startedAt: now,
        finishedAt: new Date(),
        status: 'FAILED',
        errorCode: 'PARSER_ERROR',
        errorMessage,
      });

      if (isStandaloneRun) {
        await this.syncRunRepository.finishRun(syncRunId, {
          status: SYNC_RUN_STATUS.FAILED,
          recordsFetched: 0,
          recordsAccepted: 0,
          recordsRejected: 1,
          conflicts: 0,
          error: errorMessage,
        });
      }

      return {
        status: 'FAILED',
        date,
        syncRunId,
        lotteryType: 'XSMB',
        errorCode: 'PARSER_ERROR',
        errorMessage,
        durationMs: Date.now() - startTime,
        providerId: this.provider.providerId,
      };
    }

    // ─── 2. Provider Fetch ─────────────────────────────────────────────────
    let rawResponse;
    try {
      rawResponse = await this.provider.fetchByDate(date);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const httpStatus = (err as { httpStatus?: number })?.httpStatus;

      await this.syncAttemptRepository.createAttempt({
        syncRunId,
        providerId: this.provider.providerId,
        requestedDate: date,
        startedAt: now,
        finishedAt: new Date(),
        status: 'FAILED',
        httpStatus,
        errorCode: 'PROVIDER_ERROR',
        errorMessage,
      });

      if (isStandaloneRun) {
        await this.syncRunRepository.finishRun(syncRunId, {
          status: SYNC_RUN_STATUS.FAILED,
          recordsFetched: 0,
          recordsAccepted: 0,
          recordsRejected: 1,
          conflicts: 0,
          error: errorMessage,
        });
      }

      return {
        status: 'FAILED',
        date,
        syncRunId,
        lotteryType: 'XSMB',
        errorCode: 'PROVIDER_ERROR',
        errorMessage,
        httpStatus,
        durationMs: Date.now() - startTime,
        providerId: this.provider.providerId,
      };
    }

    const rawHash = calculateRawHash(rawResponse.rawBody);

    // ─── 3. HTML Parsing ───────────────────────────────────────────────────
    const parseResult = this.parser.parse(rawResponse);
    if (
      parseResult.status === 'SOURCE_LAYOUT_CHANGED' ||
      parseResult.status === 'INVALID' ||
      !parseResult.data
    ) {
      const errorMessage =
        parseResult.errors[0]?.message ||
        `Parser failed with status ${parseResult.status}`;

      await this.syncAttemptRepository.createAttempt({
        syncRunId,
        providerId: this.provider.providerId,
        requestedDate: date,
        startedAt: now,
        finishedAt: new Date(),
        status: 'FAILED',
        httpStatus: rawResponse.httpStatus,
        responseHash: rawHash,
        errorCode: 'PARSER_ERROR',
        errorMessage,
      });

      if (isStandaloneRun) {
        await this.syncRunRepository.finishRun(syncRunId, {
          status: SYNC_RUN_STATUS.FAILED,
          recordsFetched: 1,
          recordsAccepted: 0,
          recordsRejected: 1,
          conflicts: 0,
          error: errorMessage,
        });
      }

      return {
        status: 'FAILED',
        date,
        syncRunId,
        lotteryType: 'XSMB',
        errorCode: 'PARSER_ERROR',
        errorMessage,
        httpStatus: rawResponse.httpStatus,
        durationMs: Date.now() - startTime,
        providerId: this.provider.providerId,
      };
    }

    // Protect against date mismatch
    if (parseResult.data.drawDate !== date) {
      const errorMessage = `Date mismatch: requested ${date}, source contained ${parseResult.data.drawDate}`;
      await this.syncAttemptRepository.createAttempt({
        syncRunId,
        providerId: this.provider.providerId,
        requestedDate: date,
        startedAt: now,
        finishedAt: new Date(),
        status: 'FAILED',
        httpStatus: rawResponse.httpStatus,
        responseHash: rawHash,
        errorCode: 'DATE_MISMATCH',
        errorMessage,
      });

      if (isStandaloneRun) {
        await this.syncRunRepository.finishRun(syncRunId, {
          status: SYNC_RUN_STATUS.FAILED,
          recordsFetched: 1,
          recordsAccepted: 0,
          recordsRejected: 1,
          conflicts: 0,
          error: errorMessage,
        });
      }

      return {
        status: 'FAILED',
        date,
        syncRunId,
        lotteryType: 'XSMB',
        errorCode: 'DATE_MISMATCH',
        errorMessage,
        httpStatus: rawResponse.httpStatus,
        durationMs: Date.now() - startTime,
        providerId: this.provider.providerId,
      };
    }

    // ─── 4. Strict Validation ──────────────────────────────────────────────
    const validationResult = this.validator.validate(parseResult.data, {
      expectedDrawDate: date,
      allowPartial: options?.allowPartial ?? true,
      now,
    });

    if (validationResult.status === 'INVALID') {
      const errorMessages = validationResult.errors.map((e) => e.message);
      const errorMessage = errorMessages.join('; ') || 'Data failed strict validation';

      await this.syncAttemptRepository.createAttempt({
        syncRunId,
        providerId: this.provider.providerId,
        requestedDate: date,
        startedAt: now,
        finishedAt: new Date(),
        status: 'FAILED',
        httpStatus: rawResponse.httpStatus,
        responseHash: rawHash,
        errorCode: 'VALIDATION_ERROR',
        errorMessage,
      });

      if (isStandaloneRun) {
        await this.syncRunRepository.finishRun(syncRunId, {
          status: SYNC_RUN_STATUS.FAILED,
          recordsFetched: 1,
          recordsAccepted: 0,
          recordsRejected: 1,
          conflicts: 0,
          error: errorMessage,
        });
      }

      return {
        status: 'FAILED',
        date,
        syncRunId,
        lotteryType: 'XSMB',
        errorCode: 'VALIDATION_ERROR',
        errorMessage,
        validationErrors: errorMessages,
        httpStatus: rawResponse.httpStatus,
        durationMs: Date.now() - startTime,
        providerId: this.provider.providerId,
      };
    }

    if (validationResult.status === 'CONFLICT') {
      const errorMessages = validationResult.errors.map((e) => e.message);
      const errorMessage = errorMessages.join('; ') || 'Validation conflict detected';

      await this.syncAttemptRepository.createAttempt({
        syncRunId,
        providerId: this.provider.providerId,
        requestedDate: date,
        startedAt: now,
        finishedAt: new Date(),
        status: 'CONFLICT',
        httpStatus: rawResponse.httpStatus,
        responseHash: rawHash,
        errorCode: 'CONFLICT',
        errorMessage,
      });

      if (isStandaloneRun) {
        await this.syncRunRepository.finishRun(syncRunId, {
          status: SYNC_RUN_STATUS.PARTIAL,
          recordsFetched: 1,
          recordsAccepted: 0,
          recordsRejected: 0,
          conflicts: 1,
          error: errorMessage,
        });
      }

      return {
        status: 'CONFLICT',
        date,
        syncRunId,
        lotteryType: 'XSMB',
        errorCode: 'CONFLICT',
        errorMessage,
        validationErrors: errorMessages,
        httpStatus: rawResponse.httpStatus,
        durationMs: Date.now() - startTime,
        providerId: this.provider.providerId,
      };
    }

    // ─── 5. Persistence & Status Decisions ─────────────────────────────────
    const existing = await this.drawRepository.findByDate(date, LOTTERY_TYPE.XSMB);
    const checksum = calculateResultsChecksum(
      parseResult.data.results,
      date,
      LOTTERY_TYPE.XSMB
    );

    // ── 5A. Existing Draw is already READY ──
    if (existing && existing.status === DRAW_STATUS.READY) {
      if (validationResult.status === 'VALID') {
        const isSameChecksum = existing.source?.checksum === checksum;

        if (isSameChecksum) {
          if (!options?.forceUpdate) {
            // NO_CHANGE optimization
            await this.syncAttemptRepository.createAttempt({
              syncRunId,
              providerId: this.provider.providerId,
              requestedDate: date,
              startedAt: now,
              finishedAt: new Date(),
              status: 'NO_CHANGE',
              httpStatus: rawResponse.httpStatus,
              responseHash: rawHash,
            });

            if (isStandaloneRun) {
              await this.syncRunRepository.finishRun(syncRunId, {
                status: SYNC_RUN_STATUS.COMPLETED,
                recordsFetched: 1,
                recordsAccepted: 1,
                recordsRejected: 0,
                conflicts: 0,
              });
            }

            return {
              status: 'NO_CHANGE',
              date,
              syncRunId,
              lotteryType: 'XSMB',
              draw: existing,
              checksum,
              httpStatus: rawResponse.httpStatus,
              durationMs: Date.now() - startTime,
              providerId: this.provider.providerId,
            };
          }

          // forceUpdate: true with identical checksum -> re-save with updated sync timestamp
          const forcedUpdateData: UpsertDrawDTO = {
            drawDate: date,
            lotteryType: LOTTERY_TYPE.XSMB,
            province: parseResult.data.province || existing.province,
            status: DRAW_STATUS.READY,
            results: parseResult.data.results,
            source: {
              providerId: this.provider.providerId,
              providerName: this.provider.providerName,
              sourceUrl: rawResponse.sourceUrl,
              fetchedAt: rawResponse.fetchedAt,
              verifiedAt: validationResult.validatedAt,
              checksum,
            },
            sync: {
              syncRunId,
              lastSyncAt: now,
              attemptCount: (existing.sync?.attemptCount || 0) + 1,
              rawHash,
            },
            validation: {
              status: VALIDATION_STATUS.VALID,
              validatedAt: validationResult.validatedAt,
              validatorVersion: validationResult.validatorVersion,
              errors: [],
            },
            completedAt: existing.completedAt || now,
          };

          const updated = await this.drawRepository.upsert(forcedUpdateData);

          await this.syncAttemptRepository.createAttempt({
            syncRunId,
            providerId: this.provider.providerId,
            requestedDate: date,
            startedAt: now,
            finishedAt: new Date(),
            status: 'SUCCESS',
            httpStatus: rawResponse.httpStatus,
            responseHash: rawHash,
          });

          if (isStandaloneRun) {
            await this.syncRunRepository.finishRun(syncRunId, {
              status: SYNC_RUN_STATUS.COMPLETED,
              recordsFetched: 1,
              recordsAccepted: 1,
              recordsRejected: 0,
              conflicts: 0,
            });
          }

          return {
            status: 'SUCCESS',
            date,
            syncRunId,
            lotteryType: 'XSMB',
            draw: updated,
            checksum,
            httpStatus: rawResponse.httpStatus,
            durationMs: Date.now() - startTime,
            providerId: this.provider.providerId,
          };
        }

        // Checksum changed for a READY draw
        if (options?.allowCorrection) {
          // Intentional verified correction
          const updateData: UpsertDrawDTO = {
            drawDate: date,
            lotteryType: LOTTERY_TYPE.XSMB,
            province: parseResult.data.province || existing.province,
            status: DRAW_STATUS.READY,
            results: parseResult.data.results,
            source: {
              providerId: this.provider.providerId,
              providerName: this.provider.providerName,
              sourceUrl: rawResponse.sourceUrl,
              fetchedAt: rawResponse.fetchedAt,
              verifiedAt: validationResult.validatedAt,
              checksum,
            },
            sync: {
              syncRunId,
              lastSyncAt: now,
              attemptCount: (existing.sync?.attemptCount || 0) + 1,
              rawHash,
            },
            validation: {
              status: VALIDATION_STATUS.VALID,
              validatedAt: validationResult.validatedAt,
              validatorVersion: validationResult.validatorVersion,
              errors: [],
            },
            correction: {
              isCorrected: true,
              correctedAt: now,
              reason: 'Source data correction',
              previousChecksum: existing.source?.checksum,
            },
            completedAt: existing.completedAt || now,
          };

          const updated = await this.drawRepository.upsert(updateData);

          await this.syncAttemptRepository.createAttempt({
            syncRunId,
            providerId: this.provider.providerId,
            requestedDate: date,
            startedAt: now,
            finishedAt: new Date(),
            status: 'SUCCESS',
            httpStatus: rawResponse.httpStatus,
            responseHash: rawHash,
          });

          if (isStandaloneRun) {
            await this.syncRunRepository.finishRun(syncRunId, {
              status: SYNC_RUN_STATUS.COMPLETED,
              recordsFetched: 1,
              recordsAccepted: 1,
              recordsRejected: 0,
              conflicts: 0,
            });
          }

          return {
            status: 'SUCCESS',
            date,
            syncRunId,
            lotteryType: 'XSMB',
            draw: updated,
            checksum,
            isCorrection: true,
            httpStatus: rawResponse.httpStatus,
            durationMs: Date.now() - startTime,
            providerId: this.provider.providerId,
          };
        }

        // Without allowCorrection, protect existing READY draw against unverified overwriting
        const conflictMessage =
          'Source checksum differs from stored READY record. Update rejected without explicit allowCorrection flag.';

        await this.syncAttemptRepository.createAttempt({
          syncRunId,
          providerId: this.provider.providerId,
          requestedDate: date,
          startedAt: now,
          finishedAt: new Date(),
          status: 'CONFLICT',
          httpStatus: rawResponse.httpStatus,
          responseHash: rawHash,
          errorCode: 'CONFLICT',
          errorMessage: conflictMessage,
        });

        if (isStandaloneRun) {
          await this.syncRunRepository.finishRun(syncRunId, {
            status: SYNC_RUN_STATUS.COMPLETED,
            recordsFetched: 1,
            recordsAccepted: 0,
            recordsRejected: 0,
            conflicts: 1,
            error: conflictMessage,
          });
        }

        return {
          status: 'CONFLICT',
          date,
          syncRunId,
          lotteryType: 'XSMB',
          draw: existing,
          errorCode: 'CONFLICT',
          errorMessage: conflictMessage,
          httpStatus: rawResponse.httpStatus,
          durationMs: Date.now() - startTime,
          providerId: this.provider.providerId,
        };
      }

      // READY PROTECTION: If incoming is PARTIAL, do NOT downgrade stored READY draw
      await this.syncAttemptRepository.createAttempt({
        syncRunId,
        providerId: this.provider.providerId,
        requestedDate: date,
        startedAt: now,
        finishedAt: new Date(),
        status: 'NO_CHANGE',
        httpStatus: rawResponse.httpStatus,
        responseHash: rawHash,
        errorMessage: 'Existing READY draw protected from partial downgrade',
      });

      if (isStandaloneRun) {
        await this.syncRunRepository.finishRun(syncRunId, {
          status: SYNC_RUN_STATUS.COMPLETED,
          recordsFetched: 1,
          recordsAccepted: 1,
          recordsRejected: 0,
          conflicts: 0,
        });
      }

      return {
        status: 'NO_CHANGE',
        date,
        syncRunId,
        lotteryType: 'XSMB',
        draw: existing,
        httpStatus: rawResponse.httpStatus,
        durationMs: Date.now() - startTime,
        providerId: this.provider.providerId,
      };
    }

    // ── 5B. Existing Draw does NOT exist or is SCHEDULED / UPDATING / PARTIAL ──
    if (validationResult.status === 'VALID') {
      // Completed valid result -> transition to READY
      const upsertData: UpsertDrawDTO = {
        drawDate: date,
        lotteryType: LOTTERY_TYPE.XSMB,
        province: parseResult.data.province || existing?.province,
        status: DRAW_STATUS.READY,
        results: parseResult.data.results,
        source: {
          providerId: this.provider.providerId,
          providerName: this.provider.providerName,
          sourceUrl: rawResponse.sourceUrl,
          fetchedAt: rawResponse.fetchedAt,
          verifiedAt: validationResult.validatedAt,
          checksum,
        },
        sync: {
          syncRunId,
          lastSyncAt: now,
          attemptCount: (existing?.sync?.attemptCount || 0) + 1,
          rawHash,
        },
        validation: {
          status: VALIDATION_STATUS.VALID,
          validatedAt: validationResult.validatedAt,
          validatorVersion: validationResult.validatorVersion,
          errors: [],
        },
        completedAt: existing?.completedAt || now,
      };

      const savedDraw = await this.drawRepository.upsert(upsertData);

      await this.syncAttemptRepository.createAttempt({
        syncRunId,
        providerId: this.provider.providerId,
        requestedDate: date,
        startedAt: now,
        finishedAt: new Date(),
        status: 'SUCCESS',
        httpStatus: rawResponse.httpStatus,
        responseHash: rawHash,
      });

      if (isStandaloneRun) {
        await this.syncRunRepository.finishRun(syncRunId, {
          status: SYNC_RUN_STATUS.COMPLETED,
          recordsFetched: 1,
          recordsAccepted: 1,
          recordsRejected: 0,
          conflicts: 0,
        });
      }

      return {
        status: 'SUCCESS',
        date,
        syncRunId,
        lotteryType: 'XSMB',
        draw: savedDraw,
        checksum,
        httpStatus: rawResponse.httpStatus,
        durationMs: Date.now() - startTime,
        providerId: this.provider.providerId,
      };
    }

    // In-progress PARTIAL draw handling
    if (validationResult.status === 'PARTIAL') {
      const allowPartial = options?.allowPartial ?? true;
      if (!allowPartial) {
        const msg = 'Partial draw rejected because allowPartial is disabled';
        return {
          status: 'FAILED',
          date,
          syncRunId,
          lotteryType: 'XSMB',
          errorCode: 'VALIDATION_ERROR',
          errorMessage: msg,
          durationMs: Date.now() - startTime,
          providerId: this.provider.providerId,
        };
      }

      const { merged, hasChanges } = mergePartialResults(
        existing?.results,
        parseResult.data.results
      );

      // If existing is already PARTIAL and no new tiers were added, NO_CHANGE
      if (!hasChanges && existing?.status === DRAW_STATUS.PARTIAL && !options?.forceUpdate) {
        await this.syncAttemptRepository.createAttempt({
          syncRunId,
          providerId: this.provider.providerId,
          requestedDate: date,
          startedAt: now,
          finishedAt: new Date(),
          status: 'NO_CHANGE',
          httpStatus: rawResponse.httpStatus,
          responseHash: rawHash,
        });

        if (isStandaloneRun) {
          await this.syncRunRepository.finishRun(syncRunId, {
            status: SYNC_RUN_STATUS.COMPLETED,
            recordsFetched: 1,
            recordsAccepted: 1,
            recordsRejected: 0,
            conflicts: 0,
          });
        }

        return {
          status: 'NO_CHANGE',
          date,
          syncRunId,
          lotteryType: 'XSMB',
          draw: existing,
          httpStatus: rawResponse.httpStatus,
          durationMs: Date.now() - startTime,
          providerId: this.provider.providerId,
        };
      }

      const partialChecksum = calculateResultsChecksum(
        merged,
        date,
        LOTTERY_TYPE.XSMB
      );

      const partialData: UpsertDrawDTO = {
        drawDate: date,
        lotteryType: LOTTERY_TYPE.XSMB,
        province: parseResult.data.province || existing?.province,
        status: DRAW_STATUS.PARTIAL,
        results: merged,
        source: {
          providerId: this.provider.providerId,
          providerName: this.provider.providerName,
          sourceUrl: rawResponse.sourceUrl,
          fetchedAt: rawResponse.fetchedAt,
          verifiedAt: validationResult.validatedAt,
          checksum: partialChecksum,
        },
        sync: {
          syncRunId,
          lastSyncAt: now,
          attemptCount: (existing?.sync?.attemptCount || 0) + 1,
          rawHash,
        },
        validation: {
          status: VALIDATION_STATUS.PENDING,
          validatedAt: validationResult.validatedAt,
          validatorVersion: validationResult.validatorVersion,
          errors: validationResult.errors.map((e) => e.message),
        },
      };

      const savedDraw = await this.drawRepository.upsert(partialData);

      await this.syncAttemptRepository.createAttempt({
        syncRunId,
        providerId: this.provider.providerId,
        requestedDate: date,
        startedAt: now,
        finishedAt: new Date(),
        status: 'PARTIAL',
        httpStatus: rawResponse.httpStatus,
        responseHash: rawHash,
      });

      if (isStandaloneRun) {
        await this.syncRunRepository.finishRun(syncRunId, {
          status: SYNC_RUN_STATUS.PARTIAL,
          recordsFetched: 1,
          recordsAccepted: 1,
          recordsRejected: 0,
          conflicts: 0,
        });
      }

      return {
        status: 'PARTIAL',
        date,
        syncRunId,
        lotteryType: 'XSMB',
        draw: savedDraw,
        checksum: partialChecksum,
        httpStatus: rawResponse.httpStatus,
        durationMs: Date.now() - startTime,
        providerId: this.provider.providerId,
      };
    }

    // Default fallback
    return {
      status: 'FAILED',
      date,
      syncRunId,
      lotteryType: 'XSMB',
      errorCode: 'UNKNOWN_ERROR',
      errorMessage: 'Unhandled synchronization state',
      durationMs: Date.now() - startTime,
      providerId: this.provider.providerId,
    };
  }

  /**
   * Synchronizes a sequential range of dates [startDate, endDate].
   * Ensures error isolation: failure on one date does not abort or corrupt others.
   */
  async syncDateRange(
    startDate: string,
    endDate: string,
    options?: SyncOptions
  ): Promise<BatchSyncResult> {
    const startTime = Date.now();
    const batchRunId = options?.syncRunId || `sync-run-batch-${randomUUID()}`;
    const now = options?.now || new Date();

    await this.syncRunRepository.createRun({
      syncRunId: batchRunId,
      providerId: this.provider.providerId,
      startedAt: now,
      status: SYNC_RUN_STATUS.RUNNING,
    });

    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
      current.setDate(current.getDate() + 1);
    }

    const results: SyncResult[] = [];
    let successful = 0;
    let noChange = 0;
    let partial = 0;
    let failed = 0;
    let conflicts = 0;

    for (const d of dates) {
      try {
        const res = await this.syncDate(d, {
          ...options,
          syncRunId: batchRunId,
        });

        results.push(res);
        if (res.status === 'SUCCESS') successful++;
        else if (res.status === 'NO_CHANGE') noChange++;
        else if (res.status === 'PARTIAL') partial++;
        else if (res.status === 'CONFLICT') conflicts++;
        else failed++;
      } catch (err) {
        failed++;
        results.push({
          status: 'FAILED',
          date: d,
          syncRunId: batchRunId,
          lotteryType: 'XSMB',
          errorCode: 'UNKNOWN_ERROR',
          errorMessage: err instanceof Error ? err.message : String(err),
          durationMs: 0,
          providerId: this.provider.providerId,
        });
      }
    }

    const finalStatus =
      failed > 0 || conflicts > 0
        ? SYNC_RUN_STATUS.PARTIAL
        : SYNC_RUN_STATUS.COMPLETED;

    await this.syncRunRepository.finishRun(batchRunId, {
      status: finalStatus,
      recordsFetched: dates.length,
      recordsAccepted: successful + noChange,
      recordsRejected: failed,
      conflicts,
      finishedAt: new Date(),
    });

    return {
      syncRunId: batchRunId,
      startDate,
      endDate,
      totalRequested: dates.length,
      successful,
      noChange,
      partial,
      failed,
      conflicts,
      results,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Controlled synchronization for recent missing/incomplete draws.
   * 1. Generates the list of dates for the past `limit` days up to today.
   * 2. Queries MongoDB to find existing completed (READY) draws.
   * 3. Identifies missing/incomplete dates.
   * 4. Synchronizes only missing dates sequentially with rate-limiting pauses.
   */
  async syncRecentDraws(
    limit: number = 90,
    options?: SyncOptions & {
      rateLimitDelayMs?: number;
      onProgress?: (index: number, total: number, date: string, res: SyncResult) => void;
    }
  ): Promise<BatchSyncResult> {
    const startTime = Date.now();
    const batchRunId = options?.syncRunId || `sync-run-recent-${randomUUID()}`;
    const now = options?.now || new Date();
    const safeLimit = Math.max(1, Math.min(limit, 365));
    const delayMs = options?.rateLimitDelayMs ?? 200;

    await this.syncRunRepository.createRun({
      syncRunId: batchRunId,
      providerId: this.provider.providerId,
      startedAt: now,
      status: SYNC_RUN_STATUS.RUNNING,
    });

    const todayVN = getTodayVN();
    const startDate = addDays(todayVN, -safeLimit + 1);
    const endDate = todayVN;

    // Generate date sequence
    const dates: string[] = [];
    let curDate = startDate;
    while (curDate <= endDate) {
      dates.push(curDate);
      curDate = addDays(curDate, 1);
    }

    // 1. Query MongoDB for existing draws in date range
    const existingDraws = await this.drawRepository.findDateRange(startDate, endDate);
    const readyDateSet = new Set<string>();
    for (const d of existingDraws) {
      if (d.status === DRAW_STATUS.READY) {
        readyDateSet.add(d.drawDate);
      }
    }

    // 2. Identify dates that need sync (missing or not READY)
    const datesToSync = dates.filter((d) => !readyDateSet.has(d) || d === todayVN);

    const results: SyncResult[] = [];
    let successful = 0;
    let noChange = 0;
    let partial = 0;
    let failed = 0;
    let conflicts = 0;

    for (let i = 0; i < datesToSync.length; i++) {
      const d = datesToSync[i];
      if (i > 0 && delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }

      try {
        const res = await this.syncDate(d, {
          ...options,
          syncRunId: batchRunId,
        });

        results.push(res);
        options?.onProgress?.(i + 1, datesToSync.length, d, res);
        if (res.status === 'SUCCESS') successful++;
        else if (res.status === 'NO_CHANGE') noChange++;
        else if (res.status === 'PARTIAL') partial++;
        else if (res.status === 'CONFLICT') conflicts++;
        else failed++;
      } catch (err) {
        failed++;
        const failedRes: SyncResult = {
          status: 'FAILED',
          date: d,
          syncRunId: batchRunId,
          lotteryType: 'XSMB',
          errorCode: 'UNKNOWN_ERROR',
          errorMessage: err instanceof Error ? err.message : String(err),
          durationMs: 0,
          providerId: this.provider.providerId,
        };
        results.push(failedRes);
        options?.onProgress?.(i + 1, datesToSync.length, d, failedRes);
      }
    }

    const finalStatus =
      failed > 0 || conflicts > 0
        ? SYNC_RUN_STATUS.PARTIAL
        : SYNC_RUN_STATUS.COMPLETED;

    await this.syncRunRepository.finishRun(batchRunId, {
      status: finalStatus,
      recordsFetched: datesToSync.length,
      recordsAccepted: successful + noChange,
      recordsRejected: failed,
      conflicts,
      finishedAt: new Date(),
    });

    return {
      syncRunId: batchRunId,
      startDate,
      endDate,
      totalRequested: datesToSync.length,
      successful,
      noChange,
      partial,
      failed,
      conflicts,
      results,
      durationMs: Date.now() - startTime,
    };
  }
  /**
   * Enforces data retention policy by removing records older than `keepDays` days.
   *
   * Deletes from:
   *   - xsmb_draws:         draws with drawDate < cutoff
   *   - xsmb_sync_runs:     runs started before cutoff
   *   - xsmb_sync_attempts: attempts started before cutoff
   *
   * Runs efficiently using indexed date fields. Does NOT scan the entire collection.
   * Safe to call after every daily sync.
   */
  async enforceRetention(keepDays: number = 30): Promise<{
    deletedDraws: number;
    deletedRuns: number;
    deletedAttempts: number;
  }> {
    const cutoffMs = Date.now() - keepDays * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(cutoffMs);

    // YYYY-MM-DD string for draw repository (draws use string dates)
    const y = cutoffDate.getUTCFullYear();
    const m = String(cutoffDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(cutoffDate.getUTCDate()).padStart(2, '0');
    const cutoffDateStr = `${y}-${m}-${d}`;

    const [deletedDraws, deletedRuns, deletedAttempts] = await Promise.all([
      this.drawRepository.deleteOlderThan(cutoffDateStr),
      this.syncRunRepository.deleteOlderThan(cutoffDate),
      this.syncAttemptRepository.deleteOlderThan(cutoffDate),
    ]);

    return { deletedDraws, deletedRuns, deletedAttempts };
  }
}

export const xsmbSyncService = new XSMBSyncService();
