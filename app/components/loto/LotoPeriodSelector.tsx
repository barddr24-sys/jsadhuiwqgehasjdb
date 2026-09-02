'use client';

import type { LotoPeriod } from '@/app/lib/loto-engine';

interface LotoPeriodSelectorProps {
  selectedPeriod: LotoPeriod;
  onPeriodChange: (period: LotoPeriod) => void;
}

const PERIODS: { id: LotoPeriod; label: string }[] = [
  { id: 'today', label: 'HÔM NAY' },
  { id: '3days', label: '3 NGÀY' },
  { id: '7days', label: '7 NGÀY' },
  { id: '30days', label: '30 NGÀY' },
  { id: '90days', label: '90 NGÀY' },
];

export default function LotoPeriodSelector({
  selectedPeriod,
  onPeriodChange,
}: LotoPeriodSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Chọn khoảng thời gian loto"
      style={{
        padding: '12px 16px 4px',
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          backgroundColor: 'var(--surface-muted)',
          padding: 4,
          borderRadius: 14,
          border: '1px solid var(--border)',
          gap: 4,
        }}
      >
        {PERIODS.map((p) => {
          const isActive = selectedPeriod === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onPeriodChange(p.id)}
              aria-pressed={isActive}
              className="touch-press"
              style={{
                minHeight: 44,
                border: 'none',
                borderRadius: 10,
                backgroundColor: isActive ? 'var(--surface)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 800 : 600,
                fontSize: 13,
                letterSpacing: '0.02em',
                cursor: 'pointer',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.16s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
