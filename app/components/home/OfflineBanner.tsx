'use client';

/**
 * OfflineBanner — shown when displaying cached data while offline.
 */

export default function OfflineBanner() {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        margin: '0 16px 12px',
        borderRadius: 10,
        backgroundColor: 'var(--status-before-bg)',
        border: '1px solid var(--border)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span role="img" aria-hidden="true" style={{ fontSize: 16, flexShrink: 0 }}>
        📶
      </span>
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: 'var(--status-before-color)',
          }}
        >
          ĐANG HIỂN THỊ DỮ LIỆU ĐÃ LƯU
        </p>
        <p
          style={{
            margin: '2px 0 0',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          Vui lòng kết nối mạng để xem kết quả mới nhất.
        </p>
      </div>
    </div>
  );
}
