'use client';

import type { NumberStatItem } from '@/app/lib/statistics-engine';

interface LowFrequencyCardProps {
  lowNumbers: NumberStatItem[];
  period: number;
  onInspectNumber: (num: string) => void;
}

export default function LowFrequencyCard({
  lowNumbers,
  period,
  onInspectNumber,
}: LowFrequencyCardProps) {
  if (!lowNumbers || lowNumbers.length === 0) return null;

  return (
    <section
      aria-label="Số xuất hiện ít trong chu kỳ"
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
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            SỐ XUẤT HIỆN ÍT
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
            0 – 1 lần
          </span>
        </div>

        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {period} ngày qua
        </span>
      </div>

      {/* Grid of low frequency items */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
        }}
      >
        {lowNumbers.slice(0, 8).map((item) => {
          const isZero = item.count === 0;
          return (
            <button
              key={item.number}
              id={`btn-low-stat-${item.number}`}
              onClick={() => onInspectNumber(item.number)}
              aria-label={`Số ${item.number}, xuất hiện ${item.count} lần trong ${period} ngày`}
              className="touch-press"
              style={{
                backgroundColor: isZero ? 'var(--surface-muted)' : 'var(--surface-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '10px 4px 8px',
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className="tabular-numbers"
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: isZero ? 'var(--text-muted)' : 'var(--text-primary)',
                  lineHeight: 1.1,
                }}
              >
                {item.number}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: isZero ? 'var(--text-muted)' : 'var(--text-secondary)',
                  marginTop: 2,
                }}
              >
                {item.count} lần
              </span>
            </button>
          );
        })}
      </div>

      <p
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          margin: '10px 0 0',
          lineHeight: 1.4,
          textAlign: 'center',
        }}
      >
        Thống kê dữ liệu lịch sử {period} ngày gần nhất
      </p>
    </section>
  );
}
