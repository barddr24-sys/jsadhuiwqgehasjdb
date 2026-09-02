'use client';

import { memo } from 'react';
import type { NumberStatItem } from '@/app/lib/statistics-engine';

interface NumberCellProps {
  item: NumberStatItem;
  onInspect: (num: string) => void;
}

function NumberCellComponent({ item, onInspect }: NumberCellProps) {
  const { number, count } = item;

  // 4 Subtle Visual Intensity Levels
  let bg = 'var(--surface)';
  let border = 'var(--border)';
  let numColor = 'var(--text-primary)';
  let countColor = 'var(--text-secondary)';
  let isHighlighted = false;

  if (count === 0) {
    // 0: neutral
    bg = 'var(--surface-muted)';
    numColor = 'var(--text-secondary)';
    countColor = 'var(--text-secondary)';
  } else if (count >= 1 && count <= 2) {
    // 1–2: low emphasis
    bg = 'var(--surface)';
    border = 'var(--border)';
    numColor = 'var(--text-primary)';
    countColor = 'var(--text-secondary)';
  } else if (count >= 3 && count <= 4) {
    // 3–4: medium emphasis
    bg = 'var(--accent-blue-bg)';
    border = 'var(--accent-blue-border)';
    numColor = 'var(--text-primary)';
    countColor = 'var(--accent-primary)';
    isHighlighted = true;
  } else if (count >= 5) {
    // 5+: strong emphasis
    bg = 'var(--accent-blue-bg)';
    border = 'var(--accent-primary)';
    numColor = 'var(--accent-primary)';
    countColor = 'var(--accent-primary)';
    isHighlighted = true;
  }

  return (
    <button
      id={`grid-cell-${number}`}
      type="button"
      onClick={() => onInspect(number)}
      aria-label={`Số ${number}, xuất hiện ${count} lần`}
      className="touch-press"
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: 12,
        padding: '8px 2px 6px',
        minHeight: 52,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: isHighlighted ? '0 2px 4px rgba(37, 99, 235, 0.08)' : 'none',
      }}
    >
      {/* Primary Number (16-18px) */}
      <span
        className="tabular-numbers"
        style={{
          fontSize: 17,
          fontWeight: 800,
          color: numColor,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}
      >
        {number}
      </span>

      {/* Secondary Frequency (12-14px) */}
      <span
        className="tabular-numbers"
        style={{
          fontSize: 12,
          fontWeight: isHighlighted ? 800 : 600,
          color: countColor,
          marginTop: 2,
          lineHeight: 1,
        }}
      >
        {count}
      </span>
    </button>
  );
}

export default memo(NumberCellComponent);
