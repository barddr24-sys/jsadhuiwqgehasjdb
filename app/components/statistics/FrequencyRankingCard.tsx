'use client';

import { useState } from 'react';
import type { NumberStatItem } from '@/app/lib/statistics-engine';

interface FrequencyRankingCardProps {
  topNumbers: NumberStatItem[];
  period: number;
  onInspectNumber: (num: string) => void;
}

export default function FrequencyRankingCard({
  topNumbers,
  period,
  onInspectNumber,
}: FrequencyRankingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const displayedNumbers = isExpanded ? topNumbers : topNumbers.slice(0, 5);
  const maxCount = topNumbers.length > 0 ? Math.max(...topNumbers.map((n) => n.count), 1) : 1;

  return (
    <section
      aria-label="Số xuất hiện nhiều nhất"
      style={{
        margin: '0 16px 16px',
        backgroundColor: 'var(--surface)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '16px 16px 12px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            SỐ XUẤT HIỆN NHIỀU
          </h2>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--accent-primary)',
              backgroundColor: 'var(--accent-blue-bg)',
              padding: '1px 6px',
              borderRadius: 6,
            }}
          >
            Top {displayedNumbers.length}
          </span>
        </div>

        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {period} ngày qua
        </span>
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {displayedNumbers.map((item, index) => {
          const barPercent = Math.max((item.count / maxCount) * 100, 12);
          const isTopLeader = index === 0;

          return (
            <button
              key={item.number}
              id={`btn-top-rank-${item.number}`}
              onClick={() => onInspectNumber(item.number)}
              aria-label={`Số ${item.number}, xuất hiện ${item.count} lần, hạng ${index + 1}`}
              className="touch-press"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minHeight: 44,
                padding: '6px 8px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: isTopLeader ? 'var(--accent-blue-bg)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              {/* Rank indicator badge */}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: isTopLeader ? 'var(--accent-primary)' : 'var(--text-muted)',
                  width: 18,
                  textAlign: 'center',
                }}
              >
                #{index + 1}
              </span>

              {/* 2-Digit Number */}
              <span
                className="tabular-numbers"
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: isTopLeader ? 'var(--accent-primary)' : 'var(--text-primary)',
                  width: 28,
                  textAlign: 'center',
                  letterSpacing: '-0.02em',
                }}
              >
                {item.number}
              </span>

              {/* Progress Bar Container */}
              <div
                style={{
                  flex: 1,
                  height: 12,
                  backgroundColor: 'var(--surface-muted)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${barPercent}%`,
                    backgroundColor: isTopLeader ? 'var(--accent-primary)' : 'var(--accent-light)',
                    borderRadius: 6,
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>

              {/* Frequency count text */}
              <span
                className="tabular-numbers"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: isTopLeader ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  minWidth: 44,
                  textAlign: 'right',
                }}
              >
                {item.count} lần
              </span>

              {/* Subtle chevron */}
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>›</span>
            </button>
          );
        })}
      </div>

      {/* Expand / Collapse Action */}
      {topNumbers.length > 5 && (
        <button
          id="btn-toggle-expand-top-ranking"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="touch-press"
          style={{
            marginTop: 8,
            width: '100%',
            minHeight: 40,
            border: 'none',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'transparent',
            color: 'var(--accent-primary)',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            cursor: 'pointer',
            paddingTop: 8,
          }}
        >
          <span>{isExpanded ? 'Thu gọn' : 'Xem tất cả →'}</span>
        </button>
      )}
    </section>
  );
}
