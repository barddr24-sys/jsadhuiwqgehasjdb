'use client';

import React, { memo } from 'react';
import type { LotoGridItem, LotoPeriod } from '@/app/lib/loto-engine';

interface CompleteLotoGridProps {
  period: LotoPeriod;
  grid: LotoGridItem[];
  onInspectNumber: (num: string) => void;
}

// Memoized individual cell to ensure 60fps scrolling & instant period switching
const LotoCell = memo(function LotoCell({
  item,
  onInspect,
}: {
  item: LotoGridItem;
  onInspect: (num: string) => void;
}) {
  const isZero = item.count === 0;

  let bg = 'var(--surface)';
  let border = '1px solid var(--border)';
  let numColor = 'var(--text-primary)';
  let countColor = 'var(--text-secondary)';

  if (item.intensity === 'neutral') {
    bg = 'var(--surface-muted)';
    numColor = 'var(--text-secondary)';
    countColor = 'var(--text-secondary)';
  } else if (item.intensity === 'low') {
    bg = 'var(--surface)';
    numColor = 'var(--text-primary)';
    countColor = 'var(--text-secondary)';
  } else if (item.intensity === 'medium') {
    bg = 'var(--accent-blue-bg)';
    border = '1px solid var(--accent-blue-border)';
    numColor = 'var(--accent-primary)';
    countColor = 'var(--accent-primary)';
  } else if (item.intensity === 'high') {
    bg = 'var(--surface-press)';
    border = '1.5px solid var(--accent-primary)';
    numColor = 'var(--accent-primary)';
    countColor = 'var(--text-primary)';
  }

  return (
    <button
      onClick={() => onInspect(item.number)}
      className="touch-press"
      aria-label={`Số ${item.number}, xuất hiện ${item.count} lần`}
      style={{
        minHeight: 52,
        padding: '6px 2px',
        borderRadius: 10,
        backgroundColor: bg,
        border,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: item.count > 0 ? 'var(--shadow-sm)' : 'none',
      }}
    >
      <span
        className="tabular-numbers"
        style={{
          fontSize: 17,
          fontWeight: 800,
          color: numColor,
          lineHeight: 1.1,
        }}
      >
        {item.number}
      </span>
      <span
        className="tabular-numbers"
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: countColor,
          marginTop: 2,
          lineHeight: 1,
        }}
      >
        {isZero ? '0' : item.count}
      </span>
    </button>
  );
});

export default function CompleteLotoGrid({
  period,
  grid,
  onInspectNumber,
}: CompleteLotoGridProps) {
  const subtitle =
    period === 'today'
      ? 'Ma trận tần suất 100 số từ 00 đến 99 trong ngày hôm nay'
      : `Ma trận tần suất 100 số trong khoảng ${period === '3days' ? '3' : '7'} ngày`;

  return (
    <section
      aria-label="Tất cả loto 00 đến 99"
      style={{
        padding: '0 16px 24px',
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
        <div style={{ marginBottom: 12 }}>
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
                fontWeight: 900,
                color: 'var(--text-primary)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              TẤT CẢ LOTO (00–99)
            </h2>
            <span
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                fontWeight: 700,
              }}
            >
              100 số
            </span>
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            {subtitle}
          </p>
        </div>

        {/* Legend / Frequency Guide */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: 'var(--surface-muted)',
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                display: 'inline-block',
              }}
            />
            <span>0 lần</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'inline-block',
              }}
            />
            <span>1–2 lần</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: 'var(--accent-blue-bg)',
                border: '1px solid var(--accent-blue-border)',
                display: 'inline-block',
              }}
            />
            <span>3–4 lần</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: 'var(--surface-press)',
                border: '1px solid var(--accent-primary)',
                display: 'inline-block',
              }}
            />
            <span>5+ lần</span>
          </div>
        </div>

        {/* 5-Column Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 6,
          }}
        >
          {grid.map((item) => (
            <LotoCell key={item.number} item={item} onInspect={onInspectNumber} />
          ))}
        </div>
      </div>
    </section>
  );
}
