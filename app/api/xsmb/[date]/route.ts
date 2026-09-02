/**
 * DEPRECATED — LEGACY DEV ENDPOINT
 * GET /api/xsmb/[date]
 *
 * NOTE: This is a legacy development endpoint that bypasses the established
 * XSMB Provider -> Parser -> Normalizer -> Validator -> MongoDB Atlas architecture.
 *
 * Production clients MUST use the canonical v1 API:
 * GET /api/v1/xsmb/results/[date]
 */

import { NextResponse } from 'next/server';
import type { XSMBResult, XSMBPrizes } from '@/app/lib/xsmb-types';
import { PRIZE_GROUPS } from '@/app/lib/xsmb-types';
import { isFutureDate, isValidDateStr, toDDMMYYYY } from '@/app/lib/date-utils';
import { computeDrawStatus, isResultComplete } from '@/app/lib/draw-status';

// ─── Padding ────────────────────────────────────────────────────────────────

function padNum(n: string, digits: number): string {
  return String(n).padStart(digits, '0');
}

// ─── minhngoc JSONP Parser ───────────────────────────────────────────────────

async function fetchFromMinhngoc(dateStr: string): Promise<XSMBPrizes | null> {
  const ddmmyyyy = toDDMMYYYY(dateStr); // e.g. "02092026"
  const url = `https://www.minhngoc.net.vn/getkqxs/xsmb/${ddmmyyyy}.js`;

  let text: string;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 12; Mobile) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
        'Referer': 'https://www.minhngoc.net.vn/',
        'Accept': '*/*',
      },
      // Never use Next.js cache for live lottery data
      cache: 'no-store',
    });
    if (!res.ok) return null;
    text = await res.text();
  } catch {
    return null;
  }

  // Strip JSONP wrapper: bKQXS({...}) or bKQXS({...});
  const match = text.match(/^bKQXS\(([\s\S]+?)\);?\s*$/);
  if (!match) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[1]);
  } catch {
    return null;
  }

  return normalizeMinhngoc(parsed as Record<string, unknown>);
}

function normalizeMinhngoc(raw: Record<string, unknown>): XSMBPrizes | null {
  // Format A: { header: {...}, data: [{dacbiet: [...]}, {g1: [...]}, ...] }
  if (Array.isArray(raw.data)) {
    return normalizeArrayFormat(raw.data as Record<string, unknown>[]);
  }

  // Format B: flat { gdb: "12345", g1: "23456 45678", ... }
  if (typeof raw.gdb === 'string' || typeof raw.dacbiet === 'string') {
    return normalizeFlatFormat(raw);
  }

  // Format C: nested under a province key { mb: { ... } }
  if (raw.mb && typeof raw.mb === 'object') {
    return normalizeMinhngoc(raw.mb as Record<string, unknown>);
  }

  return null;
}

function splitNums(value: unknown, count: number, digits: number): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return (value as unknown[])
      .slice(0, count)
      .map(n => padNum(String(n).trim(), digits))
      .filter(n => n.length > 0);
  }
  const str = String(value).trim();
  if (!str || str === '0') return [];
  const parts = str.split(/[\s,\-]+/).filter(Boolean);
  return parts.slice(0, count).map(n => padNum(n.trim(), digits));
}

function normalizeArrayFormat(arr: Record<string, unknown>[]): XSMBPrizes | null {
  const map: Record<string, unknown> = {};
  for (const item of arr) {
    Object.assign(map, item);
  }
  return buildPrizes(map);
}

function normalizeFlatFormat(data: Record<string, unknown>): XSMBPrizes | null {
  return buildPrizes(data);
}

function buildPrizes(m: Record<string, unknown>): XSMBPrizes | null {
  // Multiple possible key names from different response formats
  const prizes: XSMBPrizes = {
    dacBiet:  splitNums(m.dacbiet  ?? m.gdb  ?? m['đặc biệt'], 1, 5),
    giaiNhat: splitNums(m.g1 ?? m.giai1 ?? m.nhat,             1, 5),
    giaiNhi:  splitNums(m.g2 ?? m.giai2 ?? m.nhi,              2, 5),
    giaiBa:   splitNums(m.g3 ?? m.giai3 ?? m.ba,               6, 5),
    giaiTu:   splitNums(m.g4 ?? m.giai4 ?? m.tu,               4, 4),
    giaiNam:  splitNums(m.g5 ?? m.giai5 ?? m.nam,              6, 4),
    giaiSau:  splitNums(m.g6 ?? m.giai6 ?? m.sau,              3, 3),
    giaiBay:  splitNums(m.g7 ?? m.giai7 ?? m.bay,              4, 2),
  };

  // Reject if all arrays are empty (likely parse failure or no result yet)
  const hasAnything = PRIZE_GROUPS.some(({ key }) => prizes[key].length > 0);
  return hasAnything ? prizes : null;
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params;

  // Validate format
  if (!isValidDateStr(date)) {
    return NextResponse.json(
      { success: false, error: 'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD.' },
      { status: 400 },
    );
  }

  // Future date — return status only, no fetch needed
  if (isFutureDate(date)) {
    const result: XSMBResult = {
      date,
      status: 'FUTURE',
      prizes: null,
      specialPrize: null,
      updatedAt: null,
      isFromCache: false,
    };
    return NextResponse.json({ success: true, data: result });
  }

  // Fetch real data
  let prizes: XSMBPrizes | null = null;
  let fetchFailed = false;

  try {
    prizes = await fetchFromMinhngoc(date);
  } catch {
    fetchFailed = true;
  }

  const complete = isResultComplete(prizes);
  const status = fetchFailed ? 'ERROR' : computeDrawStatus(date, prizes);

  const result: XSMBResult = {
    date,
    status,
    prizes,
    specialPrize: prizes?.dacBiet?.[0] || null,
    updatedAt: prizes ? new Date().toISOString() : null,
    isFromCache: false,
  };

  // Cache complete results longer; during draw, cache briefly
  const maxAge = complete ? 300 : 15;
  return NextResponse.json(
    { success: true, data: result },
    {
      headers: {
        'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=30`,
        'X-Deprecated': 'true',
        'X-Canonical-Route': `/api/v1/xsmb/results/${date}`,
      },
    },
  );
}
