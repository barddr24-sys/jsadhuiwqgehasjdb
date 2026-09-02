'use client';

interface NumberDetailModalProps {
  number: string | null;
  onClose: () => void;
  onCopy: (num: string) => void;
}

export default function NumberDetailModal({
  number,
  onClose,
  onCopy,
}: NumberDetailModalProps) {
  if (!number) return null;

  const twoDigit = number.slice(-2);
  const head = twoDigit.charAt(0);
  const tail = twoDigit.charAt(1);

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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 id="number-detail-title" style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Chi tiết số trúng thưởng
          </h3>
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

        {/* Hero Number Display */}
        <div
          style={{
            backgroundColor: 'var(--surface-muted)',
            borderRadius: 16,
            padding: '20px',
            textAlign: 'center',
            marginBottom: 16,
            border: '1px solid var(--border)',
          }}
        >
          <span
            className="tabular-numbers"
            style={{
              fontSize: 'clamp(36px, 9vw, 44px)',
              fontWeight: 800,
              color: 'var(--prize-accent)',
              letterSpacing: '0.06em',
            }}
          >
            {number}
          </span>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '6px 0 0' }}>
            2 số cuối (Lô tô): <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>{twoDigit}</strong>
          </p>
        </div>

        {/* 2-Digit Loto Breakdown Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '12px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Đầu số
            </span>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              Đầu {head}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '12px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Đuôi số
            </span>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              Đuôi {tail}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
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
          Sao chép dãy số {number}
        </button>
      </div>
    </div>
  );
}
