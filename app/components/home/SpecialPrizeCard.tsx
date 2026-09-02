'use client';

import type { DrawLifecycleState } from '@/app/lib/xsmb-types';

interface SpecialPrizeCardProps {
  number: string | null;
  status: DrawLifecycleState;
  onCopy: (num: string) => void;
  onInspectNumber?: (num: string) => void;
}

export default function SpecialPrizeCard({
  number,
  status,
  onCopy,
  onInspectNumber,
}: SpecialPrizeCardProps) {
  const isAvailable = Boolean(number) && status === 'COMPLETED';
  const isDrawingOrUpdating = status === 'DRAWING' || status === 'UPDATING';

  function handleCardClick() {
    if (number && onInspectNumber) {
      onInspectNumber(number);
    }
  }

  function handleCopyClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (number) {
      onCopy(number);
    }
  }

  return (
    <section
      aria-label="Giải Đặc Biệt XSMB"
      onClick={isAvailable ? handleCardClick : undefined}
      className={isAvailable ? 'touch-press' : ''}
      style={{
        margin: '0 16px 16px',
        padding: '24px 20px',
        borderRadius: 20,
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        textAlign: 'center',
        position: 'relative',
        cursor: isAvailable ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
    >
      {/* Top Accent Line */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: isAvailable ? 'var(--prize-accent)' : 'var(--border)',
        }}
      />

      {/* Header Label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: '0.12em',
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
          }}
        >
          GIẢI ĐẶC BIỆT
        </span>
      </div>

      {/* Available Number or Waiting State */}
      {isAvailable && number ? (
        <div className="animate-slide-up" style={{ padding: '4px 0 12px' }}>
          <div
            className="special-prize-text"
            aria-label={`Giải đặc biệt: ${number}`}
            style={{ marginBottom: 4 }}
          >
            {number}
          </div>

        </div>
      ) : isDrawingOrUpdating ? (
        <div style={{ padding: '16px 0 8px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 48,
              minWidth: 160,
              borderRadius: 10,
              backgroundColor: 'var(--surface-muted)',
              border: '1px dashed var(--border-strong)',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span className="live-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--prize-accent)' }} />
              Đang quay giải đặc biệt...
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
            Kết quả sẽ hiển thị ngay khi hội đồng công bố
          </p>
        </div>
      ) : (
        /* SCHEDULED / FUTURE / DELAYED waiting state */
        <div style={{ padding: '14px 0 8px' }}>
          <p
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 4px',
            }}
          >
            Đang chờ kết quả
          </p>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            Kết quả sẽ được cập nhật tự động sau 18:15
          </p>
        </div>
      )
      }
    </section >
  );
}
