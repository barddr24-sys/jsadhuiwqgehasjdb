'use client';

interface NumberActionModalProps {
  isOpen: boolean;
  number: string | null;
  prizeLabel?: string;
  dateStr: string;
  displayDate: string;
  onClose: () => void;
  onInspectNumber: (twoDigit: string) => void;
  onCopy: (rawNumber: string) => void;
  onViewLotoBoard?: () => void;
}

export default function NumberActionModal({
  isOpen,
  number,
  prizeLabel,
  displayDate,
  onClose,
  onInspectNumber,
  onCopy,
  onViewLotoBoard,
}: NumberActionModalProps) {
  if (!isOpen || !number) return null;

  const tail2Digit = number.length >= 2 ? number.slice(-2) : number.padStart(2, '0');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="number-action-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 95,
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
        {/* Handle */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'var(--border-strong)',
            margin: '0 auto 16px',
          }}
        />

        {/* Modal Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'block',
              }}
            >
              {prizeLabel || 'Giải thưởng XSMB'} · Ngày {displayDate}
            </span>
            <h3
              id="number-action-title"
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '2px 0 0',
              }}
            >
              Tùy Chọn Khám Phá Số
            </h3>
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

        {/* Number Display Box */}
        <div
          style={{
            backgroundColor: 'var(--surface-muted)',
            borderRadius: 16,
            padding: '16px',
            marginBottom: 18,
            textAlign: 'center',
            border: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Số trúng thưởng đầy đủ
          </span>
          <div
            className="tabular-numbers"
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '0.06em',
              lineHeight: 1.1,
            }}
          >
            {number}
          </div>

          {/* 2-Digit Loto explanation */}
          <div
            style={{
              marginTop: 10,
              padding: '6px 12px',
              backgroundColor: 'var(--prize-accent-bg)',
              borderRadius: 8,
              border: '1px solid var(--prize-accent-border)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--prize-accent)', fontWeight: 600 }}>
              Số phân tích Loto (2 số cuối):
            </span>
            <strong className="tabular-numbers" style={{ fontSize: 15, color: 'var(--prize-accent)', fontWeight: 800 }}>
              {tail2Digit}
            </strong>
          </div>
        </div>

        {/* Actions Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Action 1: Inspect Number Detail */}
          <button
            onClick={() => {
              onInspectNumber(tail2Digit);
              onClose();
            }}
            className="touch-press"
            style={{
              minHeight: 50,
              padding: '0 16px',
              borderRadius: 14,
              backgroundColor: 'var(--accent-primary)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Phân tích chi tiết số <strong className="tabular-numbers">{tail2Digit}</strong></span>
          </button>

          {/* Action 2: Copy Raw Number */}
          <button
            onClick={() => {
              onCopy(number);
              onClose();
            }}
            className="touch-press"
            style={{
              minHeight: 48,
              padding: '0 16px',
              borderRadius: 14,
              backgroundColor: 'var(--surface-muted)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              fontWeight: 600,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            <span>Sao chép số {number}</span>
          </button>

          {/* Action 3: View Loto Board */}
          {onViewLotoBoard && (
            <button
              onClick={() => {
                onViewLotoBoard();
                onClose();
              }}
              className="touch-press"
              style={{
                minHeight: 44,
                padding: '0 16px',
                borderRadius: 14,
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: 'none',
                fontWeight: 600,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 7h.01M12 7h.01M17 7h.01M7 12h.01M12 12h.01M17 12h.01M7 17h.01M12 17h.01M17 17h.01" />
              </svg>
              <span>Xem bảng thống kê Loto ngày này</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
