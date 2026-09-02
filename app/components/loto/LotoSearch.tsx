'use client';

import React, { useState, useMemo } from 'react';
import { normalizeLotoSearch, lookupLotoNumberFacts } from '@/app/lib/loto-engine';

interface LotoSearchProps {
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onInspectNumber: (num: string) => void;
}

export default function LotoSearch({
  inputRef,
  onInspectNumber,
}: LotoSearchProps) {
  const [query, setQuery] = useState('');

  // Normalize query on typing
  const cleanQuery = query.trim();
  const searchResult = useMemo(() => {
    if (!cleanQuery) return null;
    const normalized = normalizeLotoSearch(cleanQuery);
    if (!normalized || normalized.length === 0) return null;
    return lookupLotoNumberFacts(normalized);
  }, [cleanQuery]);

  return (
    <section
      aria-label="Tìm kiếm loto"
      style={{
        padding: '0 16px 16px',
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          padding: '14px 16px',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--surface-muted)',
            borderRadius: 12,
            border: '1px solid var(--border)',
            padding: '0 12px',
            height: 46,
            gap: 8,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--text-muted)', flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm loto 00–99 (vd: 23, 78, 3)..."
            aria-label="Nhập số loto 2 chữ số để tra cứu"
            style={{
              flex: 1,
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
              outline: 'none',
              minWidth: 0,
            }}
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Xóa tìm kiếm"
              className="touch-press"
              style={{
                border: 'none',
                backgroundColor: 'var(--surface-press)',
                color: 'var(--text-secondary)',
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Instant Search Result Card */}
        {searchResult && (
          <div
            className="animate-slide-up"
            style={{
              marginTop: 12,
              padding: '12px 14px',
              backgroundColor: 'var(--surface-subtle)',
              borderRadius: 12,
              border: '1.5px solid var(--accent-blue-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Number Badge */}
              <div
                className="tabular-numbers"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--text-inverse)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {searchResult.number}
              </div>

              {/* Counts Breakdown */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  Xuất hiện hôm nay:{' '}
                  <span
                    className="tabular-numbers"
                    style={{
                      color: searchResult.todayCount > 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
                      fontWeight: 800,
                    }}
                  >
                    {searchResult.todayCount} lần
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  7 ngày:{' '}
                  <span className="tabular-numbers" style={{ fontWeight: 700 }}>
                    {searchResult.sevenDayCount} lần
                  </span>{' '}
                  · Đầu {searchResult.head} · Đuôi {searchResult.tail}
                </div>
              </div>
            </div>

            {/* View Detail Action */}
            <button
              onClick={() => onInspectNumber(searchResult.number)}
              className="touch-press"
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--text-inverse)',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Xem chi tiết →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
