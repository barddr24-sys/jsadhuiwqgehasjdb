'use client';

import { useState } from 'react';
import type { LotoOccurrenceItem, LotoPeriod } from '@/app/lib/loto-engine';

interface LotoTodaySectionProps {
  period: LotoPeriod;
  lotoList: LotoOccurrenceItem[];
  onInspectNumber: (num: string) => void;
}

export default function LotoTodaySection({
  period,
  lotoList,
  onInspectNumber,
}: LotoTodaySectionProps) {
  const [sortOrder, setSortOrder] = useState<'chronological' | 'numeric'>('chronological');

  const title =
    period === 'today'
      ? 'LOTO HÔM NAY'
      : period === '3days'
      ? 'LOTO 3 NGÀY VỪA QUA'
      : 'LOTO 7 NGÀY VỪA QUA';

  const subtitle =
    period === 'today'
      ? '27 lượt quay — Thu gọn các số trùng lặp'
      : `Tổng hợp tất cả số xuất hiện trong ${period === '3days' ? '3' : '7'} ngày`;

  // Sort numbers based on user preference while maintaining stability
  const displayedList = [...lotoList].sort((a, b) => {
    if (sortOrder === 'numeric') {
      return a.number.localeCompare(b.number);
    }
    return a.firstOrderIndex - b.firstOrderIndex;
  });

  return (
    <section
      aria-label={title}
      style={{
        padding: '0 16px 20px',
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 2px',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Order toggle: Thứ tự quay / Thứ tự số */}
        <button
          onClick={() =>
            setSortOrder((prev) =>
              prev === 'chronological' ? 'numeric' : 'chronological'
            )
          }
          className="touch-press"
          aria-label={`Đổi sắp xếp, hiện tại: ${
            sortOrder === 'chronological' ? 'Theo thứ tự quay' : 'Từ 00 đến 99'
          }`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 10px',
            borderRadius: 8,
            backgroundColor: 'var(--surface-muted)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 16 4 4 4-4" />
            <path d="M7 20V4" />
            <path d="m21 8-4-4-4 4" />
            <path d="M17 4v16" />
          </svg>
          <span>{sortOrder === 'chronological' ? 'Thứ tự quay' : 'Từ 00 → 99'}</span>
        </button>
      </div>

      {/* Grid of Interactive Number Chips */}
      {displayedList.length === 0 ? (
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            backgroundColor: 'var(--surface)',
            borderRadius: 16,
            border: '1px dashed var(--border)',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          Chưa có dữ liệu loto cho kỳ quay này.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
          }}
        >
          {displayedList.map((item) => {
            const hasMultiple = item.count > 1;
            const isSpecial = item.isSpecialPrize;

            return (
              <button
                key={item.number}
                onClick={() => onInspectNumber(item.number)}
                className="touch-press"
                aria-label={`Loto số ${item.number}, xuất hiện ${item.count} lần${
                  isSpecial ? ', có giải đặc biệt' : ''
                }`}
                style={{
                  minHeight: 64,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                  border: isSpecial
                    ? '1.5px solid var(--prize-accent-border)'
                    : hasMultiple
                    ? '1.5px solid var(--accent-blue-border)'
                    : '1px solid var(--border)',
                  backgroundColor: isSpecial
                    ? 'var(--prize-accent-bg)'
                    : hasMultiple
                    ? 'var(--accent-blue-bg)'
                    : 'var(--surface)',
                  padding: '8px 4px',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Special prize badge */}
                {isSpecial && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      right: 4,
                      fontSize: 9,
                      fontWeight: 800,
                      color: 'var(--prize-accent)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    ĐB
                  </span>
                )}

                {/* 2-Digit Numeral */}
                <span
                  className="tabular-numbers"
                  style={{
                    fontSize: 21,
                    fontWeight: 800,
                    lineHeight: 1.1,
                    color: isSpecial
                      ? 'var(--prize-accent)'
                      : hasMultiple
                      ? 'var(--accent-primary)'
                      : 'var(--text-primary)',
                  }}
                >
                  {item.number}
                </span>

                {/* Duplicate Frequency Badge */}
                {hasMultiple ? (
                  <span
                    style={{
                      marginTop: 2,
                      fontSize: 10,
                      fontWeight: 700,
                      color: isSpecial ? 'var(--prize-accent)' : 'var(--accent-primary)',
                      padding: '1px 5px',
                      borderRadius: 4,
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      lineHeight: 1.1,
                    }}
                  >
                    {item.count}×
                  </span>
                ) : (
                  <span
                    style={{
                      marginTop: 2,
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      lineHeight: 1.1,
                    }}
                  >
                    1 lần
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
