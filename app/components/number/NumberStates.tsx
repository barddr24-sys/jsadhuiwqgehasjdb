'use client';

interface ErrorStateProps {
  onRetry: () => void;
}

export function NumberSkeleton() {
  return (
    <div
      aria-label="Đang tải dữ liệu số..."
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Hero Skeleton */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 20,
          padding: '24px 16px',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div className="skeleton-box" style={{ width: 40, height: 14 }} />
        <div className="skeleton-box" style={{ width: 100, height: 56, borderRadius: 12 }} />
        <div className="skeleton-box" style={{ width: 180, height: 16 }} />
        <div style={{ width: '100%', height: 1, backgroundColor: 'var(--border)', margin: '8px 0' }} />
        <div style={{ display: 'flex', width: '100%', gap: 8 }}>
          <div className="skeleton-box" style={{ flex: 1, height: 44, borderRadius: 10 }} />
          <div className="skeleton-box" style={{ flex: 1, height: 44, borderRadius: 10 }} />
        </div>
      </div>

      {/* Period Selector Skeleton */}
      <div className="skeleton-box" style={{ width: '100%', height: 46, borderRadius: 14 }} />

      {/* 3 Metrics Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div className="skeleton-box" style={{ height: 80, borderRadius: 16 }} />
        <div className="skeleton-box" style={{ height: 80, borderRadius: 16 }} />
        <div className="skeleton-box" style={{ height: 80, borderRadius: 16 }} />
      </div>

      {/* Daily History Rows Skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton-box" style={{ width: 140, height: 16 }} />
        <div className="skeleton-box" style={{ height: 90, borderRadius: 14 }} />
        <div className="skeleton-box" style={{ height: 90, borderRadius: 14 }} />
        <div className="skeleton-box" style={{ height: 90, borderRadius: 14 }} />
      </div>
    </div>
  );
}

export function NumberEmptyState({ number, onRetry }: { number: string; onRetry: () => void }) {
  return (
    <div
      style={{
        padding: '32px 20px',
        textAlign: 'center',
        backgroundColor: 'var(--surface)',
        borderRadius: 20,
        margin: '16px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          backgroundColor: 'var(--surface-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: 'var(--text-muted)',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h3
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: '0 0 6px',
          letterSpacing: '0.02em',
        }}
      >
        CHƯA CÓ DỮ LIỆU
      </h3>

      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          margin: '0 0 20px',
          lineHeight: 1.5,
        }}
      >
        Không có đủ dữ liệu lịch sử cho số <strong style={{ color: 'var(--text-primary)' }}>{number}</strong> trong khoảng thời gian đã chọn.
      </p>

      <button
        onClick={onRetry}
        className="touch-press"
        style={{
          minHeight: 44,
          padding: '0 20px',
          borderRadius: 12,
          border: '1px solid var(--border)',
          backgroundColor: 'var(--surface-muted)',
          color: 'var(--text-primary)',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Làm mới dữ liệu
      </button>
    </div>
  );
}

export function NumberErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div
      style={{
        padding: '32px 20px',
        textAlign: 'center',
        backgroundColor: 'var(--surface)',
        borderRadius: 20,
        margin: '16px',
        border: '1.5px solid var(--prize-accent-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          backgroundColor: 'var(--prize-accent-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: 'var(--prize-accent)',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h3
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: 'var(--prize-accent)',
          margin: '0 0 6px',
          letterSpacing: '0.02em',
        }}
      >
        KHÔNG THỂ TẢI CHI TIẾT
      </h3>

      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          margin: '0 0 20px',
          lineHeight: 1.5,
        }}
      >
        Dữ liệu hiện chưa khả dụng hoặc có sự cố kết nối máy chủ.
      </p>

      <button
        onClick={onRetry}
        className="touch-press"
        style={{
          minHeight: 46,
          padding: '0 24px',
          borderRadius: 12,
          border: 'none',
          backgroundColor: 'var(--accent)',
          color: 'var(--text-inverse)',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Thử lại
      </button>
    </div>
  );
}
