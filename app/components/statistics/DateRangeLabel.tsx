'use client';

interface DateRangeLabelProps {
  period: number;
  dateRangeDisplay: string; // e.g. "02/09 → 27/08"
  dateRangeFull?: string;    // e.g. "27/08/2026 — 02/09/2026"
}

export default function DateRangeLabel({
  period,
  dateRangeDisplay,
  dateRangeFull,
}: DateRangeLabelProps) {
  return (
    <div
      style={{
        margin: '0 16px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
          }}
        >
          PHẠM VI
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-secondary)',
          }}
        >
          • {period} ngày gần nhất
        </span>
      </div>

      <div
        className="tabular-numbers"
        title={dateRangeFull}
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--accent-primary)',
          backgroundColor: 'var(--accent-blue-bg)',
          padding: '2px 8px',
          borderRadius: 6,
          border: '1px solid var(--accent-blue-border)',
        }}
      >
        {dateRangeDisplay}
      </div>
    </div>
  );
}
