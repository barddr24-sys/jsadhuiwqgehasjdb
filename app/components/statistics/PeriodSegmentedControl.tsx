'use client';

interface PeriodSegmentedControlProps {
  selectedPeriod: number;
  onPeriodChange: (period: number) => void;
}

const PERIODS: { value: number; label: string; id: string }[] = [
  { value: 3,  label: '3 NGÀY',  id: 'btn-period-3' },
  { value: 7,  label: '7 NGÀY',  id: 'btn-period-7' },
  { value: 30, label: '30 NGÀY', id: 'btn-period-30' },
  { value: 90, label: '90 NGÀY', id: 'btn-period-90' },
];

export default function PeriodSegmentedControl({
  selectedPeriod,
  onPeriodChange,
}: PeriodSegmentedControlProps) {
  return (
    <div
      role="group"
      aria-label="Chọn chu kỳ thống kê"
      style={{
        margin: '16px 16px 8px',
        padding: 4,
        backgroundColor: 'var(--surface-muted)',
        borderRadius: 14,
        display: 'flex',
        position: 'relative',
        border: '1px solid var(--border)',
        gap: 2,
      }}
    >
      {PERIODS.map(({ value, label, id }) => {
        const isActive = selectedPeriod === value;
        return (
          <button
            key={value}
            id={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onPeriodChange(value)}
            className="touch-press"
            style={{
              flex: 1,
              minHeight: 44,
              height: 44,
              borderRadius: 10,
              border: 'none',
              backgroundColor: isActive ? 'var(--surface)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: isActive ? 800 : 600,
              fontSize: 13,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
