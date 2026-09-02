'use client';

import type { StatPreviewItem } from '@/app/lib/xsmb-types';

interface QuickStatisticsCardProps {
  stats: StatPreviewItem[];
  onViewStats: () => void;
  onInspectNumber?: (num: string) => void;
}

export default function QuickStatisticsCard({
  stats,
  onViewStats,
  onInspectNumber,
}: QuickStatisticsCardProps) {
  return (
    <section
      aria-label="Thống kê 7 ngày gần nhất"
      style={{
        margin: '0 16px 16px',
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
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
            THỐNG KÊ 7 NGÀY
          </h2>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              padding: '2px 7px',
              borderRadius: 10,
            }}
          >
            Loto hay về
          </span>
        </div>

        <button
          id="btn-quick-stats-view-all"
          onClick={onViewStats}
          aria-label="Xem toàn bộ thống kê 7 ngày"
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
            gap: 3,
          }}
        >
          <span>Xem tất cả</span>
          <span style={{ fontSize: 14 }}>→</span>
        </button>
      </div>

      {/* Top numbers row */}
      {stats.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '12px 0', fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>
          Đang cập nhật thống kê…
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            marginBottom: 12,
          }}
        >
          {stats.slice(0, 4).map((item) => (
            <button
              key={item.number}
              onClick={() => onInspectNumber?.(item.number)}
              className="touch-press"
              aria-label={`Số ${item.number}, xuất hiện ${item.count} lần`}
              style={{
                backgroundColor: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '10px 4px 8px',
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className="tabular-numbers"
                style={{
                  fontSize: 19,
                  fontWeight: 900,
                  color: 'var(--text-primary)',
                  lineHeight: 1.1,
                }}
              >
                {item.number}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'var(--accent-primary)',
                  marginTop: 2,
                }}
              >
                {item.count} lần
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Full-width CTA button */}
      <button
        id="btn-open-statistics"
        onClick={onViewStats}
        className="touch-press"
        style={{
          width: '100%',
          minHeight: 44,
          borderRadius: 12,
          backgroundColor: 'var(--surface-muted)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          fontSize: 14,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          cursor: 'pointer',
        }}
      >
        <span>Xem thống kê chi tiết</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14"/>
          <path d="m12 5 7 7-7 7"/>
        </svg>
      </button>
    </section>
  );
}
