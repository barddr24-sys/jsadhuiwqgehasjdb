'use client';

import type { NumberDetailPeriod } from '@/app/lib/number-detail-engine';

interface ComparisonPeriodCardProps {
  number: string;
  activePeriod: NumberDetailPeriod;
  threeDaysSummary: {
    totalOccurrences: number;
    activeDays: number;
  };
  sevenDaysSummary: {
    totalOccurrences: number;
    activeDays: number;
  };
  onSelectPeriod: (period: NumberDetailPeriod) => void;
}

export default function ComparisonPeriodCard({
  activePeriod,
  threeDaysSummary,
  sevenDaysSummary,
  onSelectPeriod,
}: ComparisonPeriodCardProps) {
  return (
    <section
      aria-label="So sánh hiệu suất 3 ngày và 7 ngày"
      style={{
        padding: '0 16px 16px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 16,
          padding: '16px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            marginBottom: 12,
          }}
        >
          So sánh chu kỳ 3 ngày vs 7 ngày
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
          }}
        >
          {/* 3 Days Column */}
          <button
            onClick={() => onSelectPeriod('3days')}
            className="touch-press"
            style={{
              padding: '12px 10px',
              borderRadius: 12,
              backgroundColor: activePeriod === '3days' ? 'var(--accent-blue-bg)' : 'var(--surface-muted)',
              border: activePeriod === '3days' ? '1.5px solid var(--accent-blue-border)' : '1px solid var(--border)',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: activePeriod === '3days' ? 'var(--accent-primary)' : 'var(--text-primary)',
              }}
            >
              Chu kỳ 3 ngày
            </span>
            <div
              className="tabular-numbers"
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: activePeriod === '3days' ? 'var(--accent-primary)' : 'var(--text-primary)',
              }}
            >
              {threeDaysSummary.totalOccurrences}{' '}
              <span style={{ fontSize: 13, fontWeight: 700 }}>lần</span>
            </div>
            <span
              className="tabular-numbers"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-secondary)',
              }}
            >
              Có mặt {threeDaysSummary.activeDays} / 3 ngày
            </span>
          </button>

          {/* 7 Days Column */}
          <button
            onClick={() => onSelectPeriod('7days')}
            className="touch-press"
            style={{
              padding: '12px 10px',
              borderRadius: 12,
              backgroundColor: activePeriod === '7days' ? 'var(--accent-blue-bg)' : 'var(--surface-muted)',
              border: activePeriod === '7days' ? '1.5px solid var(--accent-blue-border)' : '1px solid var(--border)',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: activePeriod === '7days' ? 'var(--accent-primary)' : 'var(--text-primary)',
              }}
            >
              Chu kỳ 7 ngày
            </span>
            <div
              className="tabular-numbers"
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: activePeriod === '7days' ? 'var(--accent-primary)' : 'var(--text-primary)',
              }}
            >
              {sevenDaysSummary.totalOccurrences}{' '}
              <span style={{ fontSize: 13, fontWeight: 700 }}>lần</span>
            </div>
            <span
              className="tabular-numbers"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-secondary)',
              }}
            >
              Có mặt {sevenDaysSummary.activeDays} / 7 ngày
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
