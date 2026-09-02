'use client';

import type { NumberDetailPeriod } from '@/app/lib/number-detail-engine';

interface NumberPeriodSelectorProps {
  selectedPeriod: NumberDetailPeriod;
  onPeriodChange: (period: NumberDetailPeriod) => void;
}

export default function NumberPeriodSelector({
  selectedPeriod,
  onPeriodChange,
}: NumberPeriodSelectorProps) {
  const options: { id: NumberDetailPeriod; label: string; subLabel: string }[] = [
    { id: 'today', label: 'HÔM NAY', subLabel: 'Kỳ mới nhất' },
    { id: '3days', label: '3 NGÀY', subLabel: 'Gần đây' },
    { id: '7days', label: '7 NGÀY', subLabel: 'Chu kỳ tuần' },
    { id: '30days', label: '30 NGÀY', subLabel: 'Chu kỳ tháng' },
    { id: '90days', label: '90 NGÀY', subLabel: 'Chu kỳ quý' },
  ];

  return (
    <section
      aria-label="Chọn chu kỳ xem chi tiết số"
      style={{
        padding: '0 16px 12px',
      }}
    >
      <div
        role="group"
        aria-label="Chu kỳ thống kê"
        style={{
          display: 'flex',
          backgroundColor: 'var(--surface-muted)',
          borderRadius: 14,
          padding: 4,
          gap: 4,
          border: '1px solid var(--border)',
        }}
      >
        {options.map((opt) => {
          const isSelected = selectedPeriod === opt.id;
          return (
            <button
              key={opt.id}
              id={`btn-period-${opt.id}`}
              onClick={() => onPeriodChange(opt.id)}
              aria-pressed={isSelected}
              className="touch-press"
              style={{
                flex: 1,
                minHeight: 46,
                borderRadius: 10,
                border: 'none',
                backgroundColor: isSelected ? 'var(--surface)' : 'transparent',
                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isSelected ? 800 : 600,
                fontSize: 13,
                letterSpacing: '0.03em',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{opt.label}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                  marginTop: 1,
                }}
              >
                {opt.subLabel}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
