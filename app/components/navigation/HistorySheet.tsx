'use client';

import type { RecentResultSummary } from '@/app/lib/xsmb-types';

interface HistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  recentResults: RecentResultSummary[];
  onSelectDate: (dateStr: string) => void;
}

export default function HistorySheet({
  isOpen,
  onClose,
  recentResults,
  onSelectDate,
}: HistorySheetProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-sheet-title"
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
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'var(--border-strong)',
            margin: '0 auto 16px',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 id="history-sheet-title" style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px' }}>
              Lịch sử kết quả XSMB
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              Chọn ngày để xem lại chi tiết 27 giải
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng"
            className="touch-press"
            style={{
              border: 'none',
              backgroundColor: 'var(--surface-muted)',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            ✕
          </button>
        </div>

        {/* History List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recentResults.map((item) => (
            <button
              key={item.date}
              onClick={() => {
                onSelectDate(item.date);
                onClose();
              }}
              className="touch-press"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                backgroundColor: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                  {item.dayOfWeek}, {item.displayDate}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Kỳ quay số truyền thống
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>
                    Đặc biệt
                  </span>
                  <span
                    className="tabular-numbers"
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: 'var(--prize-accent)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {item.specialPrize}
                  </span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
