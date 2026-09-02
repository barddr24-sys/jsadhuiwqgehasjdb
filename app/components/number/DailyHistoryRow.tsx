'use client';

import type { DailyAppearanceRecord } from '@/app/lib/number-detail-engine';

interface DailyHistoryRowProps {
  record: DailyAppearanceRecord;
  number: string;
  onSelectDateResult: (date: string) => void;
}

export default function DailyHistoryRow({
  record,
  onSelectDateResult,
}: DailyHistoryRowProps) {
  const { date, displayDate, dayOfWeek, appeared, count, prizes } = record;

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 14,
        padding: '14px 14px 12px',
        border: appeared ? '1px solid var(--border)' : '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Top row: Date & Status Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            className="tabular-numbers"
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            {displayDate}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-secondary)',
            }}
          >
            ({dayOfWeek})
          </span>
        </div>

        {/* Appearance status pill */}
        {appeared ? (
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--status-completed-text)',
              backgroundColor: 'var(--status-completed-bg)',
              border: '1px solid var(--status-completed-border)',
              padding: '3px 8px',
              borderRadius: 8,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>✓</span>
            <span>Xuất hiện {count} lần</span>
          </span>
        ) : (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              padding: '3px 8px',
              borderRadius: 8,
            }}
          >
            Không xuất hiện
          </span>
        )}
      </div>

      {/* Prize Breakdown Details if appeared */}
      {appeared && prizes.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            paddingTop: 4,
          }}
        >
          {prizes.map((pz, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: 8,
                backgroundColor: pz.isSpecialPrize ? 'var(--prize-accent-bg)' : 'var(--surface-muted)',
                border: pz.isSpecialPrize ? '1px solid var(--prize-accent-border)' : '1px solid var(--border)',
                fontSize: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    color: pz.isSpecialPrize ? 'var(--prize-accent)' : 'var(--text-primary)',
                    fontWeight: 800,
                  }}
                >
                  → {pz.prizeName}
                </span>
              </div>

              <span
                className="tabular-numbers"
                style={{
                  fontWeight: 900,
                  color: pz.isSpecialPrize ? 'var(--prize-accent)' : 'var(--text-primary)',
                  letterSpacing: '0.04em',
                }}
              >
                {pz.rawNumber}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Link: View full result for this date */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          paddingTop: 4,
          borderTop: '1px solid var(--border)',
          marginTop: 2,
        }}
      >
        <button
          onClick={() => onSelectDateResult(date)}
          className="touch-press"
          aria-label={`Xem kết quả XSMB ngày ${displayDate}`}
          style={{
            minHeight: 44,
            border: 'none',
            background: 'none',
            color: 'var(--accent-primary)',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
          }}
        >
          <span>Xem kết quả ngày này</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
