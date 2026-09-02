'use client';

import type { RecentResultSummary } from '@/app/lib/xsmb-types';

interface RecentResultsPreviewProps {
  recentResults: RecentResultSummary[];
  onSelectDate: (dateStr: string) => void;
  onViewAllHistory: () => void;
}

export default function RecentResultsPreview({
  recentResults,
  onSelectDate,
  onViewAllHistory,
}: RecentResultsPreviewProps) {
  return (
    <section
      aria-label="Xem lại kết quả các ngày gần đây"
      style={{
        margin: '0 16px 20px',
        padding: '16px 18px',
        borderRadius: 16,
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <h2
          style={{
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: '0.08em',
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          KẾT QUẢ GẦN ĐÂY
        </h2>

        <button
          id="btn-view-all-history"
          onClick={onViewAllHistory}
          className="touch-press"
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: 'var(--accent-primary)',
            background: 'none',
            border: 'none',
            padding: '4px 6px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <span>Xem thêm</span>
          <span style={{ fontSize: 14 }}>→</span>
        </button>
      </div>

      {/* Tappable Date Rows */}
      {recentResults.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '8px 0', fontSize: 13, fontWeight: 600, margin: 0 }}>
          Chưa có dữ liệu kết quả gần đây
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {recentResults.slice(0, 4).map((item) => (
            <button
              key={item.date}
              onClick={() => onSelectDate(item.date)}
              className="touch-press"
              aria-label={`Xem kết quả ngày ${item.displayDate}, giải đặc biệt ${item.specialPrize}`}
              style={{
                width: '100%',
                minHeight: 46,
                padding: '8px 12px',
                borderRadius: 10,
                backgroundColor: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                  }}
                >
                  {item.shortDate}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {item.dayOfWeek}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                  }}
                >
                  ĐB:
                </span>
                <span
                  className="tabular-numbers"
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: 'var(--prize-accent)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {item.specialPrize}
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
