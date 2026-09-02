'use client';

import type { LotoPeriod } from '@/app/lib/loto-engine';

interface LotoSummaryCardProps {
  period: LotoPeriod;
  totalOccurrences: number;
  uniqueNumbersCount: number;
  topNumbers: { number: string; count: number }[];
  onInspectNumber: (num: string) => void;
}

export default function LotoSummaryCard({
  period,
  totalOccurrences,
  uniqueNumbersCount,
  topNumbers,
  onInspectNumber,
}: LotoSummaryCardProps) {
  const periodTitle =
    period === 'today'
      ? 'TỔNG QUAN LOTO HÔM NAY'
      : period === '3days'
      ? 'TỔNG QUAN LOTO 3 NGÀY'
      : 'TỔNG QUAN LOTO 7 NGÀY';

  return (
    <section
      aria-label="Tổng quan loto"
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
          padding: '16px',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: '0.06em',
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          {periodTitle}
        </div>

        {/* 3 Key Metrics Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1.2fr',
            gap: 10,
            alignItems: 'center',
          }}
        >
          {/* Metric 1: Tổng lượt */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--surface-muted)',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 2 }}>
              Tổng lượt
            </div>
            <div
              className="tabular-numbers"
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: 'var(--text-primary)',
                lineHeight: 1.1,
              }}
            >
              {totalOccurrences}
            </div>
          </div>

          {/* Metric 2: Số khác nhau */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--surface-muted)',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 2 }}>
              Số khác nhau
            </div>
            <div
              className="tabular-numbers"
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: 'var(--text-primary)',
                lineHeight: 1.1,
              }}
            >
              {uniqueNumbersCount}
            </div>
          </div>

          {/* Metric 3: Top xuất hiện */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--surface-muted)',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4 }}>
              Top nổi bật
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flexWrap: 'wrap',
              }}
            >
              {topNumbers.length > 0 ? (
                topNumbers.map((item, idx) => (
                  <button
                    key={item.number}
                    onClick={() => onInspectNumber(item.number)}
                    className="touch-press tabular-numbers"
                    style={{
                      border: '1px solid var(--accent-blue-border)',
                      backgroundColor: 'var(--surface)',
                      borderRadius: 6,
                      padding: '2px 6px',
                      fontSize: 13,
                      fontWeight: 800,
                      color: 'var(--accent-primary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    {item.number}
                    {idx < topNumbers.length - 1 && (
                      <span style={{ color: 'var(--text-secondary)', marginLeft: 3, fontWeight: 700 }}>·</span>
                    )}
                  </button>
                ))
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>--</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
