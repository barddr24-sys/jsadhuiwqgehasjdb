'use client';

import type { NumberStatItem } from '@/app/lib/statistics-engine';

interface NumberDetailPreviewProps {
  numberItem: NumberStatItem | null;
  period: number;
  onClose: () => void;
  onCopy: (num: string) => void;
}

export default function NumberDetailPreview({
  numberItem,
  period,
  onClose,
  onCopy,
}: NumberDetailPreviewProps) {
  if (!numberItem) return null;

  const { number, count, daysAppearedCount, appearances } = numberItem;
  const head = number.charAt(0);
  const tail = number.charAt(1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="number-detail-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          padding: '20px 20px 32px',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle Bar */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'var(--border-strong)',
            margin: '0 auto 16px',
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div>
            <h3
              id="number-detail-title"
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Chi tiết thống kê số {number}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Chu kỳ {period} ngày gần nhất
            </p>
          </div>

          <button
            id="btn-close-number-detail"
            onClick={onClose}
            aria-label="Đóng"
            className="touch-press"
            style={{
              border: 'none',
              backgroundColor: 'var(--surface-muted)',
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>

        {/* Hero Number Display */}
        <div
          style={{
            backgroundColor: 'var(--surface-muted)',
            borderRadius: 16,
            padding: '18px 20px',
            textAlign: 'center',
            marginBottom: 14,
            border: '1px solid var(--border)',
          }}
        >
          <span
            className="tabular-numbers"
            style={{
              fontSize: 'clamp(40px, 11vw, 48px)',
              fontWeight: 800,
              color: 'var(--prize-accent)',
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}
          >
            {number}
          </span>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginTop: 6,
            }}
          >
            Xuất hiện {count} lần trong {period} ngày
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Có mặt ở {daysAppearedCount}/{period} ngày quay thưởng
          </div>
        </div>

        {/* 2-Digit Breakdown (Đầu / Đuôi) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '10px 12px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Đầu số
            </span>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              Đầu {head}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '10px 12px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Đuôi số
            </span>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              Đuôi {tail}
            </div>
          </div>
        </div>

        {/* Detailed Timeline per Day */}
        <div
          style={{
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '12px 14px',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Lịch sử xuất hiện theo ngày
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {appearances.map((app) => (
              <div
                key={app.date}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 8,
                  backgroundColor: app.appeared ? 'var(--status-completed-bg)' : 'transparent',
                  border: app.appeared ? '1px solid var(--status-completed-border)' : '1px solid transparent',
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="tabular-numbers"
                    style={{
                      fontWeight: 700,
                      color: app.appeared ? 'var(--status-completed-text)' : 'var(--text-muted)',
                    }}
                  >
                    {app.shortDate}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: app.appeared ? 'var(--text-secondary)' : 'var(--text-muted)',
                    }}
                  >
                    {app.appeared
                      ? app.prizes.length > 0
                        ? app.prizes.join(', ')
                        : `${app.count} giải`
                      : 'Không về'}
                  </span>
                </div>

                <span
                  style={{
                    fontWeight: 700,
                    color: app.appeared ? 'var(--status-completed-text)' : 'var(--text-muted)',
                  }}
                >
                  {app.appeared ? `✓ (${app.count})` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button: Copy */}
        <button
          id={`btn-copy-num-${number}`}
          onClick={() => {
            onCopy(number);
            onClose();
          }}
          className="touch-press"
          style={{
            width: '100%',
            minHeight: 48,
            backgroundColor: 'var(--accent)',
            color: 'var(--text-inverse)',
            borderRadius: 14,
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
          Sao chép số {number}
        </button>
      </div>
    </div>
  );
}
