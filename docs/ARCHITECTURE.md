# XSMB Application Architecture & Integration Guide

## 1. System Overview

XSMB is a mobile-first, high-reliability Vietnamese Northern Lottery (Xổ Số Miền Bắc) data platform built on **Next.js (App Router)**, **MongoDB Atlas**, and deployed on **Vercel**.

### End-to-End Data Pipeline

```text
               VERCEL CRON
                    │ (Protected by XSMB_CRON_SECRET)
                    ▼
       /api/internal/xsmb/sync
                    │
                    ▼
             XSMBSyncService
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
  Provider        Parser      Validator
 (HTTP Fetch)   (Cheerio)    (Strict Rule Engine)
      │             │             │
      └─────────────┼─────────────┘
                    ▼
           XSMBDrawRepository
                    │
                    ▼
              MongoDB Atlas
                    │
                    ▼
             XSMBAPIService
                    │
                    ▼
           /api/v1/xsmb/*
                    │
                    ▼
             Mobile UI / UX
```

---

## 2. Server / Client Separation

A strict boundary is maintained between client components and server logic:

* **Client Components (`'use client'`)**:
  * Render UI, handle user interactions, touch gestures, animations, and local UI state.
  * Access lottery data strictly by fetching application Route Handlers (`/api/v1/xsmb/*`).
  * Never import Mongoose, MongoDB connection pools, HTTP scrapers, Cheerio, or environment secrets.

* **Server Runtime (`Route Handlers`, `Services`, `Repositories`)**:
  * Own database access, secret validation, provider requests, parsing, and data validation.
  * Secrets (`MONGODB_URI`, `XSMB_CRON_SECRET`, etc.) are never exposed to the client bundle or response payloads.

---

## 3. Database Architecture (MongoDB Atlas ONLY)

* **Single Data Store**: MongoDB Atlas is the exclusive database. No Redis, PostgreSQL, MySQL, or secondary databases are permitted.
* **Connection Management**:
  * Singleton connection caching implemented in [`app/lib/db/connection.ts`](../app/lib/db/connection.ts) using `global.mongooseCache`.
  * Safe for Next.js hot-reloading in development and serverless container lifecycles on Vercel.
* **Primary Collections**:
  * `xsmb_draws`: Canonical lottery draw records with unique compound index on `(drawDate, lotteryType)`.
  * `xsmb_sources`: Provider configuration and metadata tracking.
  * `xsmb_sync_runs`: Audit history of synchronization runs.
  * `xsmb_sync_attempts`: Granular log of individual HTTP sync attempts and error diagnostics.
  * `xsmb_sync_locks`: MongoDB-backed distributed locks for multi-instance sync safety.

---

## 4. Canonical XSMB Structure & Domain Types

### Prize Configuration (Exactly 27 Numbers)

| Prize Tier | Code | Digits | Numbers Count | Order |
|---|---|---|---|---|
| Giải Đặc Biệt | `SPECIAL` | 5 | 1 | 1 |
| Giải Nhất | `FIRST` | 5 | 1 | 2 |
| Giải Nhì | `SECOND` | 5 | 2 | 3 |
| Giải Ba | `THIRD` | 5 | 6 | 4 |
| Giải Tư | `FOURTH` | 4 | 4 | 5 |
| Giải Năm | `FIFTH` | 4 | 6 | 6 |
| Giải Sáu | `SIXTH` | 3 | 3 | 7 |
| Giải Bảy | `SEVENTH` | 2 | 4 | 8 |
| **Total** | | | **27 numbers** | |

Defined once in [`app/lib/db/config/prize-config.ts`](../app/lib/db/config/prize-config.ts) and reused across parsers, validators, services, and tests.

### String Number Representation Rule

* All lottery numbers **MUST be stored and handled as strings** (e.g., `"04"`, `"021"`, `"00123"`).
* Leading zeros must never be stripped or truncated. Integers are forbidden for lottery numbers.

### Controlled Draw Lifecycle States

```text
SCHEDULED  ──►  DRAWING  ──►  UPDATING  ──►  READY
    │              │             │             │
    ▼              ▼             ▼             │
 DELAYED        FAILED       CONFLICT ◄────────┘
                                 │
                             (INVALID)
```

1. `SCHEDULED`: Before draw begins (countdown to 18:15 VN time).
2. `DRAWING`: Draw in progress at 18:15 VN time.
3. `UPDATING`: Live prizes streaming in tier-by-tier.
4. `PARTIAL`: Intermediate state during sync when not all 27 prizes are ready.
5. `READY`: Complete, strictly validated draw with all 27 prizes verified.
6. `DELAYED`: Draw postponed or delayed upstream.
7. `FAILED`: Upstream provider error or timeout.
8. `INVALID`: Upstream format validation failure.
9. `CONFLICT`: Discrepancy detected between multiple upstream sources.

---

## 5. Production Data Integrity Rules

1. **Zero Fake Data**:
   * If upstream providers are unavailable or database is empty, the system returns `NO_DATA`, `NOT_FOUND`, or `FAILED`.
   * The system **NEVER generates random, pseudo-random, or fallback fake lottery numbers** in production.
2. **Deterministic Validation**:
   * Only draws that pass full structural and regex validation by `StrictXSMBValidator` can transition to `READY`.
3. **Protected READY State**:
   * Once a draw achieves `READY` status in MongoDB Atlas, it is immutable against transient upstream failures.
4. **Isolated Test/Dev Fixtures**:
   * Visual UI testing fixtures live in [`app/lib/dev/sample-data.ts`](../app/lib/dev/sample-data.ts).
   * Production services never import dev fixtures.

---

## 6. Service & Layer Responsibilities

```text
modules / components:
├── Provider      (app/lib/providers/)    Fetch raw HTML/JSON from configured external URL
├── Parser        (app/lib/parsers/)      Extract prize tokens using resilient multi-tier selectors
├── Normalizer    (app/lib/parsers/)      Transform into canonical XSMB prize structure
├── Validator     (app/lib/validator/)    Verify 27 numbers, digit counts, calendar dates, checksums
├── SyncService   (app/lib/sync/)         Idempotent orchestrator: fetch -> parse -> validate -> MongoDB
├── Repositories  (app/lib/db/repositories/) MongoDB CRUD with Mongoose
└── APIService    (app/lib/services/)     API business logic, statistics, number details, health
```

---

## 7. Vercel Deployment & Synchronization Architecture

* **Serverless Execution**: Next.js runs as Vercel Serverless Functions.
* **No Long-Lived In-Process Daemons**: In-process `setTimeout` loops are disabled when running on Vercel (`VERCEL=1`).
* **Vercel Cron Trigger**:
  * Configured in [`vercel.json`](../vercel.json).
  * Automatically sends scheduled requests to the protected internal route `/api/internal/xsmb/sync`.
  * Authenticated via `Authorization: Bearer ${XSMB_CRON_SECRET}`.

---

## 8. Environment Variables Reference

| Variable | Required | Description | Example |
|---|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string | `mongodb+srv://...` |
| `MONGODB_DB_NAME` | Yes | Database name | `xsmb` |
| `XSMB_CRON_SECRET` | Yes (Prod) | Shared secret for `/api/internal/xsmb/sync` | `random_secure_secret_token` |
| `XSMB_TIMEZONE` | Optional | Business timezone (default: Asia/Ho_Chi_Minh) | `Asia/Ho_Chi_Minh` |
| `XSMB_PRIMARY_SOURCE_URL` | Optional | Template URL for primary provider | `https://xoso.com.vn/xsmb-{dd-mm-yyyy}.html` |
| `XSMB_PRIMARY_PROVIDER_ID` | Optional | Unique ID of primary provider | `primary-web-provider` |
| `XSMB_PRIMARY_PROVIDER_NAME` | Optional | Display name of primary provider | `Primary Free Web XSMB Provider` |
| `XSMB_HTTP_TIMEOUT_MS` | Optional | HTTP request timeout in ms | `10000` |
| `XSMB_HTTP_MAX_RETRIES` | Optional | Maximum HTTP retry attempts | `2` |
| `XSMB_SCHEDULER_ENABLED` | Optional | Enable in-process scheduler (local dev only) | `true` |
