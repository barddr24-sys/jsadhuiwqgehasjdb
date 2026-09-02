'use client';

import type { HistoryItemSummary } from '@/app/lib/history-engine';

interface HistoryDateCardProps {
  item: HistoryItemSummary;
  onSelect: (date: string) => void;
  onInspectTail?: (tail: string, date: string) => void;
}

export default function HistoryDateCard({
  item,
  onSelect,
  onInspectTail,
}: HistoryDateCardProps) {
  const g2Preview = item.secondPrizes.join(' · ');

  return (
    <article
      onClick={() => onSelect(item.date)}
      className="touch-press"
      role="button"
      tabIndex={0}
      aria-label={`Kết quả XSMB ngày ${item.displayDate}, Giải Đặc Biệt: ${item.specialPrize}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item.date);
        }
      }}
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 16,
        padding: '16px 16px 14px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        position: 'relative',
        outline: 'none',
      }}
    >
      {/* Card Header: Date & Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: '1px solid var(--surface-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="tabular-numbers"
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            {item.displayDate}
          </span>

          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-secondary)',
            }}
          >
            {item.dayOfWeek}
          </span>
        </div>

        {item.isToday ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: 4,
              backgroundColor: 'var(--status-completed-bg)',
              color: 'var(--status-completed-text)',
              border: '1px solid var(--status-completed-border)',
              letterSpacing: '0.04em',
            }}
          >
            HÔM NAY
          </span>
        ) : (
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              fontWeight: 600,
            }}
          >
            Chính thức
          </span>
        )}
      </div>

      {/* Special Prize Feature Block */}
      <div
        style={{
          backgroundColor: 'var(--prize-accent-bg)',
          border: '1px solid var(--prize-accent-border)',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: 'var(--prize-accent)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 2,
            }}
          >
            GIẢI ĐẶC BIỆT
          </span>

          <span
            className="tabular-numbers"
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: 'var(--prize-accent)',
              letterSpacing: '0.06em',
              lineHeight: 1.1,
              display: 'block',
            }}
          >
            {item.specialPrize || '-----'}
          </span>
        </div>

        {/* 2-Digit Tail Badge */}
        {item.specialTwoDigit && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onInspectTail?.(item.specialTwoDigit, item.date);
            }}
            className="touch-press"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--prize-accent-border)',
              borderRadius: 10,
              padding: '4px 10px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
            title={`Xem chi tiết số loto ${item.specialTwoDigit}`}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--text-secondary)',
                display: 'block',
                textTransform: 'uppercase',
              }}
            >
              Đuôi số
            </span>
            <span
              className="tabular-numbers"
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: 'var(--prize-accent)',
              }}
            >
              {item.specialTwoDigit}
            </span>
          </div>
        )}
      </div>

      {/* Compact Secondary Prizes Preview */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          backgroundColor: 'var(--surface-muted)',
          borderRadius: 10,
          padding: '10px 12px',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--text-primary)',
              width: 24,
              flexShrink: 0,
            }}
          >
            G1
          </span>
          <span
            className="tabular-numbers"
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
            }}
          >
            {item.firstPrize || '-----'}
          </span>
        </div>

        {item.secondPrizes.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                width: 24,
                flexShrink: 0,
              }}
            >
              G2
            </span>
            <span
              className="tabular-numbers"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                letterSpacing: '0.03em',
              }}
            >
              {g2Preview}
            </span>
          </div>
        )}
      </div>

      {/* Card Footer: View Full Result Link */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 4,
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
          Đầy đủ 27 giải thưởng
        </span>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--accent-primary)',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <span>Xem chi tiết</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </div>
    </article>
  );
}
