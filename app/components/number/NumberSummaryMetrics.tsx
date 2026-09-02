'use client';

import type { NumberDetailPeriod } from '@/app/lib/number-detail-engine';

interface NumberSummaryMetricsProps {
  period: NumberDetailPeriod;
  totalOccurrences: number;
  latestAppearanceDate: string | null;
  activeDaysCount: number;
  totalDaysInPeriod: number;
}

export default function NumberSummaryMetrics({
  period,
  totalOccurrences,
  latestAppearanceDate,
  activeDaysCount,
  totalDaysInPeriod,
}: NumberSummaryMetricsProps) {
  return (
    <section
      aria-label="3 chỉ số thống kê chính"
      style={{
        padding: '0 16px 16px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
        }}
      >
        {/* Metric 1: XUẤT HIỆN */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '12px 10px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              lineHeight: 1.2,
            }}
          >
            Xuất hiện
          </span>
          <div
            className="tabular-numbers"
            style={{
              fontSize: 'clamp(20px, 5.5vw, 26px)',
              fontWeight: 900,
              color: totalOccurrences > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
              margin: '4px 0 2px',
              lineHeight: 1,
            }}
          >
            {totalOccurrences}{' '}
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>lần</span>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-secondary)',
            }}
          >
            {period === 'today' ? 'Kỳ hôm nay' : `Trong ${totalDaysInPeriod} ngày`}
          </span>
        </div>

        {/* Metric 2: NGÀY GẦN NHẤT */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '12px 10px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              lineHeight: 1.2,
            }}
          >
            Ngày gần nhất
          </span>
          <div
            className="tabular-numbers"
            style={{
              fontSize: 'clamp(18px, 5vw, 24px)',
              fontWeight: 900,
              color: latestAppearanceDate ? 'var(--accent-primary)' : 'var(--text-secondary)',
              margin: '4px 0 2px',
              lineHeight: 1,
            }}
          >
            {latestAppearanceDate || '—'}
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-secondary)',
            }}
          >
            {latestAppearanceDate ? 'Có kết quả' : 'Chưa về'}
          </span>
        </div>

        {/* Metric 3: SỐ NGÀY XUẤT HIỆN */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '12px 10px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              lineHeight: 1.2,
            }}
          >
            Số ngày về
          </span>
          <div
            className="tabular-numbers"
            style={{
              fontSize: 'clamp(20px, 5.5vw, 26px)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              margin: '4px 0 2px',
              lineHeight: 1,
            }}
          >
            {activeDaysCount}{' '}
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
              / {totalDaysInPeriod}
            </span>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-secondary)',
            }}
          >
            Ngày quay
          </span>
        </div>
      </div>
    </section>
  );
}
