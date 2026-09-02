'use client';

import { useState } from 'react';
import type { LotoPeriod } from '@/app/lib/loto-engine';

interface LotoFrequencyRankingProps {
  period: LotoPeriod;
  topFrequent: { number: string; count: number }[];
  onInspectNumber: (num: string) => void;
}

export default function LotoFrequencyRanking({
  period,
  topFrequent,
  onInspectNumber,
}: LotoFrequencyRankingProps) {
  const [showAll, setShowAll] = useState(false);

  const displayedItems = showAll ? topFrequent : topFrequent.slice(0, 5);
  const maxCount = topFrequent[0]?.count || 1;

  const subtitle =
    period === 'today'
      ? 'Top các số nổ nhiều lượt trong ngày'
      : `Top các số xuất hiện nhiều nhất trong ${period === '3days' ? '3' : '7'} ngày`;

  return (
    <section
      aria-label="Loto xuất hiện nhiều"
      style={{
        padding: '0 16px 20px',
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
        {/* Header */}
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              LOTO XUẤT HIỆN NHIỀU
            </h2>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--accent-primary)',
                backgroundColor: 'var(--accent-blue-bg)',
                border: '1px solid var(--accent-blue-border)',
                padding: '2px 7px',
                borderRadius: 4,
              }}
            >
              Top {displayedItems.length}
            </span>
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            {subtitle}
          </p>
        </div>

        {/* List of Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayedItems.map((item, idx) => {
            const percentage = Math.min(100, Math.max(15, (item.count / maxCount) * 100));
            const isTop1 = idx === 0;

            return (
              <button
                key={item.number}
                onClick={() => onInspectNumber(item.number)}
                className="touch-press"
                aria-label={`Số ${item.number}, xuất hiện ${item.count} lần`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 10,
                  backgroundColor: 'var(--surface-muted)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                {/* Number Badge */}
                <div
                  className="tabular-numbers"
                  style={{
                    width: 38,
                    height: 34,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: isTop1 ? 'var(--accent-primary)' : 'var(--surface)',
                    color: isTop1 ? 'var(--text-inverse)' : 'var(--text-primary)',
                    fontWeight: 900,
                    fontSize: 17,
                    border: isTop1 ? 'none' : '1px solid var(--border)',
                    flexShrink: 0,
                  }}
                >
                  {item.number}
                </div>

                {/* Bar Graph */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <div
                    style={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: 'var(--border)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${percentage}%`,
                        backgroundColor: isTop1
                          ? 'var(--accent-primary)'
                          : 'var(--accent)',
                        borderRadius: 5,
                        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </div>
                </div>

                {/* Count Badge */}
                <div
                  className="tabular-numbers"
                  style={{
                    minWidth: 48,
                    textAlign: 'right',
                    fontSize: 13,
                    fontWeight: 800,
                    color: isTop1 ? 'var(--accent-primary)' : 'var(--text-primary)',
                  }}
                >
                  {item.count} lần
                </div>
              </button>
            );
          })}
        </div>

        {/* Expand / Collapse Button */}
        {topFrequent.length > 5 && (
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="touch-press"
            aria-expanded={showAll}
            style={{
              width: '100%',
              marginTop: 12,
              padding: '10px 0',
              borderRadius: 10,
              backgroundColor: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span>{showAll ? 'Thu gọn top 5 ↑' : 'Xem tất cả top 10 →'}</span>
          </button>
        )}
      </div>
    </section>
  );
}
