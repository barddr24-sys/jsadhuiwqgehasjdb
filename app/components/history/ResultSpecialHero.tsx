'use client';

import type { DrawLifecycleState } from '@/app/lib/xsmb-types';

interface ResultSpecialHeroProps {
  number: string | null;
  displayDate: string;
  dayOfWeek?: string;
  isToday?: boolean;
  status: DrawLifecycleState;
  onCopy?: (num: string) => void;
  onInspectNumber?: (num: string) => void;
}

export default function ResultSpecialHero({
  number,
  displayDate,
  dayOfWeek,
  isToday,
  status,
  onCopy,
  onInspectNumber,
}: ResultSpecialHeroProps) {
  const tailNumber = number && number.length >= 2 ? number.slice(-2) : null;

  return (
    <section
      aria-label="Giải Đặc Biệt"
      style={{
        margin: '12px 16px 16px',
        backgroundColor: 'var(--surface)',
        borderRadius: 20,
        padding: '20px 16px 18px',
        border: '1px solid var(--prize-accent-border)',
        boxShadow: 'var(--shadow-md)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative top accent strip */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: 'var(--prize-accent)',
        }}
      />

      {/* Label & Context */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 900,
            color: 'var(--prize-accent)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          GIẢI ĐẶC BIỆT
        </span>

        {isToday ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: 4,
              backgroundColor: 'var(--status-completed-bg)',
              color: 'var(--status-completed-text)',
              border: '1px solid var(--status-completed-border)',
            }}
          >
            HÔM NAY
          </span>
        ) : (
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              fontWeight: 700,
            }}
          >
            · 5 Chữ số
          </span>
        )}
      </div>

      {/* Hero 40–52px Number */}
      <div
        style={{
          margin: '8px 0 12px',
          minHeight: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {number ? (
          <button
            onClick={() => onInspectNumber?.(number)}
            className="touch-press"
            aria-label={`Giải Đặc Biệt: ${number}. Bấm để xem phân tích số loto ${tailNumber}`}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 12px',
              borderRadius: 12,
              display: 'inline-block',
            }}
          >
            <span
              className="special-prize-text"
              style={{
                display: 'block',
                textShadow: '0 1px 2px rgba(220, 38, 38, 0.1)',
              }}
            >
              {number}
            </span>
          </button>
        ) : status === 'UPDATING' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--status-updating-text)' }} className="live-pulse-dot" />
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--status-updating-text)' }}>
              Đang quay thưởng...
            </span>
          </div>
        ) : (
          <span
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: 'var(--text-secondary)',
              letterSpacing: '0.15em',
            }}
          >
            - - - - -
          </span>
        )}
      </div>

      {/* Date Subtitle */}
      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          margin: '0 0 16px',
        }}
      >
        Kỳ quay ngày <strong className="tabular-numbers" style={{ color: 'var(--text-primary)' }}>{displayDate}</strong> {dayOfWeek ? `(${dayOfWeek})` : ''}
      </p>

      {/* Action Buttons Row */}
      {number && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
          }}
        >
          {tailNumber && (
            <button
              onClick={() => onInspectNumber?.(number)}
              className="touch-press"
              style={{
                flex: 1,
                minHeight: 44,
                padding: '0 12px',
                borderRadius: 12,
                backgroundColor: 'var(--accent-blue-bg)',
                border: '1px solid var(--accent-blue-border)',
                color: 'var(--accent-primary)',
                fontWeight: 800,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Xem số loto <strong className="tabular-numbers">{tailNumber}</strong></span>
            </button>
          )}

          <button
            onClick={() => onCopy?.(number)}
            className="touch-press"
            style={{
              minHeight: 44,
              padding: '0 14px',
              borderRadius: 12,
              backgroundColor: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontWeight: 800,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            <span>Sao chép</span>
          </button>
        </div>
      )}
    </section>
  );
}
