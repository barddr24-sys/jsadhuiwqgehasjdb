'use client';

import type { DailyOccurrenceStat } from '@/app/lib/statistics-engine';

interface DailyBreakdownProps {
  dailyBreakdown: DailyOccurrenceStat[];
  period: number;
}

export default function DailyBreakdown({
  dailyBreakdown,
  period,
}: DailyBreakdownProps) {
  if (!dailyBreakdown || dailyBreakdown.length === 0) return null;

  const maxUnique = Math.max(...dailyBreakdown.map((d) => d.uniqueNumbers), 27);

  return (
    <section
      aria-label="Phân bổ kết quả theo ngày"
      style={{
        margin: '0 16px 16px',
        backgroundColor: 'var(--surface)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '16px 16px 14px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            PHÂN BỔ THEO NGÀY
          </h2>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-muted)',
              backgroundColor: 'var(--surface-muted)',
              padding: '1px 6px',
              borderRadius: 6,
            }}
          >
            27 giải/kỳ
          </span>
        </div>

        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {period} kỳ quay
        </span>
      </div>

      {/* Daily rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dailyBreakdown.map((day) => {
          const barPercent = Math.max((day.uniqueNumbers / maxUnique) * 100, 20);

          return (
            <div
              key={day.date}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 12,
              }}
            >
              {/* Date label */}
              <div style={{ width: 68 }}>
                <span
                  className="tabular-numbers"
                  style={{
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    display: 'block',
                    lineHeight: 1.1,
                  }}
                >
                  {day.shortDate}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    display: 'block',
                    lineHeight: 1,
                    marginTop: 2,
                  }}
                >
                  {day.dayOfWeek}
                </span>
              </div>

              {/* Proportional Bar */}
              <div
                style={{
                  flex: 1,
                  height: 10,
                  backgroundColor: 'var(--surface-muted)',
                  borderRadius: 5,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${barPercent}%`,
                    backgroundColor: 'var(--accent-light)',
                    borderRadius: 5,
                  }}
                />
              </div>

              {/* Special prize 2-digit tail & unique count */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  textAlign: 'right',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {day.uniqueNumbers} số
                </span>
                <span
                  className="tabular-numbers"
                  title="2 số cuối giải Đặc Biệt"
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: 'var(--prize-accent)',
                    backgroundColor: 'var(--prize-accent-bg)',
                    padding: '2px 5px',
                    borderRadius: 4,
                    border: '1px solid var(--prize-accent-border)',
                  }}
                >
                  ĐB {day.specialPrizeTail}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
