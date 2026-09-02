'use client';

interface StateProps {
  onRetry?: () => void;
  onSelectAnotherDate?: () => void;
  dateStr?: string;
}

/**
 * Skeleton Loader for History List
 */
export function HistoryListSkeleton() {
  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 16,
            padding: '16px',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="skeleton-box" style={{ width: 120, height: 16 }} />
            <div className="skeleton-box" style={{ width: 60, height: 16 }} />
          </div>

          <div
            className="skeleton-box"
            style={{
              width: '100%',
              height: 64,
              borderRadius: 12,
              marginBottom: 12,
            }}
          />

          <div
            className="skeleton-box"
            style={{
              width: '100%',
              height: 36,
              borderRadius: 10,
              marginBottom: 10,
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="skeleton-box" style={{ width: 100, height: 14 }} />
            <div className="skeleton-box" style={{ width: 70, height: 14 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Loader for Result Detail View
 */
export function ResultDetailSkeleton() {
  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
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
        <div className="skeleton-box" style={{ width: 100, height: 14 }} />
        <div className="skeleton-box" style={{ width: 180, height: 48, borderRadius: 10 }} />
        <div className="skeleton-box" style={{ width: 140, height: 12 }} />
      </div>

      {/* Prize Groups Skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 14,
            padding: '14px',
            border: '1px solid var(--border)',
          }}
        >
          <div className="skeleton-box" style={{ width: 100, height: 16, marginBottom: 12 }} />
          <div className="skeleton-box" style={{ width: '100%', height: 40, borderRadius: 8 }} />
        </div>
      ))}
    </div>
  );
}

/**
 * Error State for History List or Detail
 */
export function HistoryErrorState({ onRetry, dateStr }: StateProps) {
  return (
    <div
      role="alert"
      style={{
        margin: '24px 16px',
        backgroundColor: 'var(--surface)',
        borderRadius: 20,
        padding: '32px 20px',
        border: '1px solid var(--prize-accent-border)',
        textAlign: 'center',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          backgroundColor: 'var(--prize-accent-bg)',
          color: 'var(--prize-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '0.02em' }}>
        KHÔNG THỂ TẢI DỮ LIỆU
      </h3>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.4 }}>
        {dateStr
          ? `Dữ liệu kết quả XSMB ngày ${dateStr} hiện chưa thể kết nối.`
          : 'Không thể tải lịch sử kết quả. Vui lòng kiểm tra kết nối mạng.'}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="touch-press"
          style={{
            minHeight: 46,
            padding: '0 24px',
            borderRadius: 12,
            backgroundColor: 'var(--accent-primary)',
            color: '#FFFFFF',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Thử lại
        </button>
      )}
    </div>
  );
}

/**
 * Empty State for a Selected Date
 */
export function HistoryEmptyState({ onSelectAnotherDate, dateStr }: StateProps) {
  return (
    <div
      style={{
        margin: '24px 16px',
        backgroundColor: 'var(--surface)',
        borderRadius: 20,
        padding: '32px 20px',
        border: '1px solid var(--border)',
        textAlign: 'center',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          backgroundColor: 'var(--surface-muted)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
        CHƯA CÓ KẾT QUẢ
      </h3>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.4 }}>
        Không có dữ liệu XSMB cho ngày {dateStr || 'này'}. Bạn có thể chọn ngày quay thưởng khác.
      </p>

      {onSelectAnotherDate && (
        <button
          onClick={onSelectAnotherDate}
          className="touch-press"
          style={{
            minHeight: 46,
            padding: '0 20px',
            borderRadius: 12,
            backgroundColor: 'var(--accent-primary)',
            color: '#FFFFFF',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Chọn ngày khác
        </button>
      )}
    </div>
  );
}

/**
 * Live Updating / Partial Result Banner
 */
export function HistoryUpdatingBanner({ updatedAt = '18:24' }: { updatedAt?: string }) {
  return (
    <div
      style={{
        margin: '12px 16px',
        backgroundColor: 'var(--status-updating-bg)',
        border: '1px solid var(--status-updating-border)',
        borderRadius: 14,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: 'var(--status-updating-text)',
          flexShrink: 0,
        }}
        className="live-pulse-dot"
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--status-updating-text)' }}>
            KẾT QUẢ ĐANG CẬP NHẬT
          </span>
          <span className="tabular-numbers" style={{ fontSize: 11, color: 'var(--status-updating-text)', fontWeight: 600 }}>
            {updatedAt}
          </span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
          Các giải đang được truyền trực tiếp từ trường quay số miền Bắc.
        </p>
      </div>
    </div>
  );
}
