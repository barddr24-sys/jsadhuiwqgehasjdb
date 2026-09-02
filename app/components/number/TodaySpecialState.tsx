'use client';

import type { PrizeAppearanceDetail } from '@/app/lib/number-detail-engine';

interface TodaySpecialStateProps {
  number: string;
  appearedToday: boolean;
  todayCount: number;
  todayPrizes: PrizeAppearanceDetail[];
  onViewTodayResult: () => void;
}

export default function TodaySpecialState({
  number,
  appearedToday,
  todayCount,
  todayPrizes,
  onViewTodayResult,
}: TodaySpecialStateProps) {
  return (
    <section
      aria-label="Trạng thái xuất hiện hôm nay"
      style={{
        padding: '0 16px 16px',
      }}
    >
      <div
        style={{
          borderRadius: 16,
          padding: '16px',
          backgroundColor: appearedToday ? 'var(--status-completed-bg)' : 'var(--surface)',
          border: appearedToday
            ? '1.5px solid var(--status-completed-border)'
            : '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Header Tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: appearedToday ? 'var(--status-completed-text)' : 'var(--text-secondary)',
              }}
            >
              Hôm nay
            </span>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: appearedToday ? 'var(--status-completed-text)' : 'var(--border-strong)',
              }}
            />
          </div>

          <button
            onClick={onViewTodayResult}
            className="touch-press"
            style={{
              border: 'none',
              background: 'none',
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              padding: '2px 4px',
            }}
          >
            <span>Xem bảng giải hôm nay</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {appearedToday ? (
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: 'var(--status-completed-text)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>
                Số <span className="tabular-numbers">{number}</span> đã xuất hiện {todayCount} lần
              </span>
            </div>

            {/* Prizes list */}
            {todayPrizes.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 10,
                }}
              >
                {todayPrizes.map((pz, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      backgroundColor: pz.isSpecialPrize ? 'var(--prize-accent-bg)' : 'var(--surface)',
                      color: pz.isSpecialPrize ? 'var(--prize-accent)' : 'var(--text-primary)',
                      border: pz.isSpecialPrize
                        ? '1px solid var(--prize-accent-border)'
                        : '1px solid var(--border)',
                      padding: '4px 10px',
                      borderRadius: 8,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {pz.isSpecialPrize && (
                      <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>★</span>
                    )}
                    <span>{pz.prizeName}</span>
                    <strong className="tabular-numbers" style={{ letterSpacing: '0.02em' }}>
                      ({pz.rawNumber})
                    </strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              Số <span className="tabular-numbers">{number}</span> chưa xuất hiện trong kỳ quay hôm nay
            </div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-secondary)',
                margin: '4px 0 0',
              }}
            >
              Dữ liệu được cập nhật tự động từ hội đồng xổ số kiến thiết.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
