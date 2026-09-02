'use client';

import type { DailyAppearanceRecord, NumberDetailPeriod } from '@/app/lib/number-detail-engine';
import DailyHistoryRow from './DailyHistoryRow';

interface DailyHistoryProps {
  number: string;
  period: NumberDetailPeriod;
  dailyHistory: DailyAppearanceRecord[];
  onSelectDateResult: (date: string) => void;
}

export default function DailyHistory({
  number,
  period,
  dailyHistory,
  onSelectDateResult,
}: DailyHistoryProps) {
  const periodTitle =
    period === 'today'
      ? 'Hôm nay'
      : period === '3days'
      ? '3 ngày gần nhất'
      : '7 ngày gần nhất';

  return (
    <section
      aria-label="Lịch sử xuất hiện theo ngày"
      style={{
        padding: '0 16px 16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <h2
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Lịch sử xuất hiện ({periodTitle})
        </h2>

        <span
          className="tabular-numbers"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          {dailyHistory.length} kỳ quay
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {dailyHistory.map((rec) => (
          <DailyHistoryRow
            key={rec.date}
            record={rec}
            number={number}
            onSelectDateResult={onSelectDateResult}
          />
        ))}
      </div>
    </section>
  );
}
