'use client';

import type { NumberDetailPeriod } from '@/app/lib/number-detail-engine';

interface FrequencySummaryProps {
  number: string;
  period: NumberDetailPeriod;
  totalOccurrences: number;
  frequencyList: {
    date: string;
    shortDate: string;
    displayDate: string;
    dayOfWeek: string;
    count: number;
    appeared: boolean;
  }[];
}

export default function FrequencySummary({
  number,
  period,
  totalOccurrences,
  frequencyList,
}: FrequencySummaryProps) {
  // Max possible in a single draw or normal max for progress bar scale
  const maxInSingleDay = Math.max(...frequencyList.map((f) => f.count), 1);
  const maxPeriodExpected = frequencyList.length * 2; // rough scale
  const barPercent = Math.min(Math.round((totalOccurrences / Math.max(maxPeriodExpected, 1)) * 100), 100);

  return (
    <section
      aria-label="Tần suất xuất hiện"
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
        {/* Card Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
            }}
          >
            Tần suất xuất hiện
          </span>

          <span
            className="tabular-numbers"
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--accent-primary)',
            }}
          >
            {period === 'today' ? '1 kỳ' : `${frequencyList.length} kỳ quay`}
          </span>
        </div>

        {/* Hero Frequency Bar */}
        <div
          style={{
            backgroundColor: 'var(--surface-muted)',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 14,
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                className="tabular-numbers"
                style={{
                  fontSize: 19,
                  fontWeight: 900,
                  color: 'var(--text-primary)',
                }}
              >
                Số {number}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}
              >
                (Tổng cộng)
              </span>
            </div>

            <span
              className="tabular-numbers"
              style={{
                fontSize: 17,
                fontWeight: 900,
                color: totalOccurrences > 0 ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
            >
              {totalOccurrences} lần
            </span>
          </div>

          {/* Visual Progress Bar */}
          <div
            style={{
              height: 8,
              backgroundColor: 'var(--border)',
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.max(barPercent, totalOccurrences > 0 ? 8 : 0)}%`,
                backgroundColor: totalOccurrences > 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Day-by-Day Frequency Breakdown List */}
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Chi tiết từng ngày ({frequencyList.length} ngày)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {frequencyList.map((item) => {
              const dayBarPercent = (item.count / Math.max(maxInSingleDay, 1)) * 100;
              return (
                <div
                  key={item.date}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 10,
                    backgroundColor: item.appeared ? 'var(--surface-muted)' : 'transparent',
                    border: item.appeared ? '1px solid var(--border)' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 120 }}>
                    <span
                      className="tabular-numbers"
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: item.appeared ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {item.shortDate}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {item.dayOfWeek}
                    </span>
                  </div>

                  {/* Micro mini-bar */}
                  <div
                    style={{
                      flex: 1,
                      maxWidth: 90,
                      height: 5,
                      backgroundColor: 'var(--border)',
                      borderRadius: 3,
                      margin: '0 12px',
                      overflow: 'hidden',
                    }}
                  >
                    {item.appeared && (
                      <div
                        style={{
                          height: '100%',
                          width: `${dayBarPercent}%`,
                          backgroundColor: item.count >= 2 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          borderRadius: 3,
                        }}
                      />
                    )}
                  </div>

                  <span
                    className="tabular-numbers"
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: item.appeared ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      minWidth: 42,
                      textAlign: 'right',
                    }}
                  >
                    {item.count > 0 ? `${item.count} lần` : '0 lần'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
