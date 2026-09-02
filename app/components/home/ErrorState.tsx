'use client';

/**
 * ErrorState — shown when lottery results cannot be fetched.
 * Never exposes HTTP errors, stack traces, or technical messages.
 */

interface ErrorStateProps {
  onRetry: () => void;
  retrying?: boolean;
}

export default function ErrorState({ onRetry, retrying = false }: ErrorStateProps) {
  return (
    <section
      role="alert"
      aria-live="assertive"
      style={{
        margin: '0 16px 24px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '32px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span role="img" aria-label="Lỗi" style={{ fontSize: 40 }}>
        📡
      </span>

      <h2
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '0.02em',
        }}
      >
        KHÔNG THỂ TẢI KẾT QUẢ
      </h2>

      <p
        style={{
          margin: 0,
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          maxWidth: 260,
        }}
      >
        Vui lòng kiểm tra kết nối mạng và thử lại.
      </p>

      <button
        id="error-retry-btn"
        onClick={onRetry}
        disabled={retrying}
        aria-label="Thử tải lại kết quả"
        style={{
          marginTop: 8,
          minHeight: 48,
          minWidth: 140,
          paddingLeft: 24,
          paddingRight: 24,
          backgroundColor: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: '0.06em',
          cursor: retrying ? 'default' : 'pointer',
          opacity: retrying ? 0.65 : 1,
          transition: 'opacity 150ms, transform 100ms',
          fontFamily: 'inherit',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
        onMouseDown={e => {
          if (!retrying) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
        }}
        onMouseUp={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = '';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = '';
        }}
        onTouchStart={e => {
          if (!retrying) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
        }}
        onTouchEnd={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = '';
        }}
      >
        {retrying ? 'ĐANG TẢI...' : 'THỬ LẠI'}
      </button>
    </section>
  );
}
