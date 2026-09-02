'use client';

import { useState, useRef } from 'react';
import type { NumberStatItem } from '@/app/lib/statistics-engine';
import { normalizeSearchNumber } from '@/app/lib/statistics-engine';

interface NumberSearchProps {
  allNumbers: NumberStatItem[];
  period: number;
  onInspectNumber: (num: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function NumberSearch({
  allNumbers,
  period,
  onInspectNumber,
  inputRef,
}: NumberSearchProps) {
  const [query, setQuery] = useState('');
  const localInputRef = useRef<HTMLInputElement>(null);
  const actualRef = inputRef || localInputRef;

  const normalizedQuery = normalizeSearchNumber(query);
  const matchedItem = normalizedQuery ? allNumbers.find((n) => n.number === normalizedQuery) : null;

  const handleClear = () => {
    setQuery('');
    actualRef.current?.focus();
  };

  return (
    <section
      aria-label="Tìm kiếm nhanh số 00-99"
      style={{
        margin: '0 16px 16px',
      }}
    >
      {/* Input container */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--surface)',
          borderRadius: 14,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          height: 48,
          padding: '0 12px',
        }}
      >
        <span
          style={{
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            marginRight: 8,
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
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>

        <input
          ref={actualRef}
          id="input-stats-search-number"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm số 00–99..."
          aria-label="Tìm số từ 00 đến 99"
          style={{
            flex: 1,
            height: '100%',
            border: 'none',
            background: 'transparent',
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />

        {query && (
          <button
            id="btn-stats-search-clear"
            type="button"
            onClick={handleClear}
            aria-label="Xóa tìm kiếm"
            className="touch-press"
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'var(--surface-muted)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Matched Result Card */}
      {matchedItem && (
        <div
          className="animate-slide-up"
          style={{
            marginTop: 10,
            backgroundColor: 'var(--surface)',
            borderRadius: 16,
            border: '2px solid var(--accent-primary)',
            padding: '16px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                className="tabular-numbers"
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: 'var(--prize-accent)',
                  backgroundColor: 'var(--prize-accent-bg)',
                  border: '1px solid var(--prize-accent-border)',
                  borderRadius: 12,
                  width: 54,
                  height: 54,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  letterSpacing: '-0.02em',
                }}
              >
                {matchedItem.number}
              </div>

              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                  }}
                >
                  {matchedItem.count} lần trong {period} ngày
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    marginTop: 2,
                  }}
                >
                  Xuất hiện {matchedItem.daysAppearedCount}/{period} kỳ quay
                </div>
              </div>
            </div>

            <button
              id={`btn-view-detail-${matchedItem.number}`}
              onClick={() => onInspectNumber(matchedItem.number)}
              className="touch-press"
              style={{
                minHeight: 40,
                padding: '0 14px',
                borderRadius: 10,
                backgroundColor: 'var(--accent)',
                color: 'var(--text-inverse)',
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>Xem chi tiết</span>
              <span style={{ fontSize: 14 }}>→</span>
            </button>
          </div>

          {/* Date Appearance Checklist */}
          <div
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Lịch sử các ngày:
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {matchedItem.appearances.map((app) => (
                <div
                  key={app.date}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    padding: '4px 8px',
                    borderRadius: 8,
                    backgroundColor: app.appeared ? 'var(--status-completed-bg)' : 'var(--surface-muted)',
                    border: `1px solid ${app.appeared ? 'var(--status-completed-border)' : 'var(--border)'}`,
                    color: app.appeared ? 'var(--status-completed-text)' : 'var(--text-muted)',
                    fontWeight: app.appeared ? 700 : 500,
                  }}
                >
                  <span className="tabular-numbers">{app.shortDate}</span>
                  <span>{app.appeared ? `✓ (${app.count})` : '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
