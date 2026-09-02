'use client';

/**
 * Loading Skeleton for XSMB Statistics Screen
 */
export function StatisticsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải dữ liệu thống kê"
      style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* Skeleton Period Selector */}
      <div
        className="skeleton-box"
        style={{ width: '100%', height: 48, borderRadius: 14 }}
      />

      {/* Skeleton Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div className="skeleton-box" style={{ height: 74, borderRadius: 14 }} />
        <div className="skeleton-box" style={{ height: 74, borderRadius: 14 }} />
        <div className="skeleton-box" style={{ height: 74, borderRadius: 14 }} />
      </div>

      {/* Skeleton Top Frequency Card */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 16,
          padding: 16,
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div className="skeleton-box" style={{ width: 140, height: 18, borderRadius: 4 }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton-box" style={{ width: '100%', height: 38, borderRadius: 8 }} />
        ))}
      </div>

      {/* Skeleton Number Grid */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 16,
          padding: 16,
          border: '1px solid var(--border)',
        }}
      >
        <div className="skeleton-box" style={{ width: 160, height: 18, borderRadius: 4, marginBottom: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="skeleton-box" style={{ height: 52, borderRadius: 12 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Empty State for XSMB Statistics Screen
 */
export function StatisticsEmptyState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      role="status"
      style={{
        margin: '24px 16px',
        backgroundColor: 'var(--surface)',
        borderRadius: 18,
        border: '1px solid var(--border)',
        padding: '36px 20px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: 'var(--surface-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: 'var(--text-muted)',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        }}
      >
        CHƯA ĐỦ DỮ LIỆU
      </h3>

      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          margin: '0 0 20px',
          lineHeight: 1.5,
        }}
      >
        Cần thêm dữ liệu để hiển thị thống kê.
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="touch-press"
          style={{
            minHeight: 44,
            padding: '0 20px',
            backgroundColor: 'var(--accent-primary)',
            color: '#FFFFFF',
            borderRadius: 12,
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Cập nhật lại
        </button>
      )}
    </div>
  );
}

/**
 * Error State for XSMB Statistics Screen
 */
export function StatisticsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      style={{
        margin: '24px 16px',
        backgroundColor: 'var(--surface)',
        borderRadius: 18,
        border: '1px solid var(--status-error-border)',
        padding: '36px 20px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: 'var(--status-error-bg)',
          color: 'var(--status-error-text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
        }}
      >
        KHÔNG THỂ TẢI THỐNG KÊ
      </h3>

      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          margin: '0 0 20px',
          lineHeight: 1.5,
        }}
      >
        Dữ liệu hiện chưa khả dụng.
      </p>

      <button
        id="btn-stats-retry"
        onClick={onRetry}
        className="touch-press"
        style={{
          minHeight: 44,
          padding: '0 24px',
          backgroundColor: 'var(--accent)',
          color: 'var(--text-inverse)',
          borderRadius: 12,
          border: 'none',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>Thử lại</span>
      </button>
    </div>
  );
}
