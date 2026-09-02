'use client';

import React from 'react';

export function LotoSkeleton() {
  return (
    <div
      style={{
        padding: '0 16px 20px',
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Summary Skeleton */}
      <div
        style={{
          padding: 16,
          borderRadius: 16,
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="skeleton-box" style={{ height: 14, width: '40%', marginBottom: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div className="skeleton-box" style={{ height: 56, borderRadius: 12 }} />
          <div className="skeleton-box" style={{ height: 56, borderRadius: 12 }} />
          <div className="skeleton-box" style={{ height: 56, borderRadius: 12 }} />
        </div>
      </div>

      {/* Number Chips Skeleton */}
      <div
        style={{
          padding: 16,
          borderRadius: 16,
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="skeleton-box" style={{ height: 16, width: '35%', marginBottom: 14 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton-box" style={{ height: 64, borderRadius: 14 }} />
          ))}
        </div>
      </div>

      {/* Frequency Bars Skeleton */}
      <div
        style={{
          padding: 16,
          borderRadius: 16,
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="skeleton-box" style={{ height: 16, width: '50%', marginBottom: 14 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton-box" style={{ height: 38, borderRadius: 10 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LotoEmptyState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      style={{
        padding: '40px 16px',
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          padding: '32px 20px',
          borderRadius: 20,
          backgroundColor: 'var(--surface)',
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
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M7 7h.01M12 7h.01M17 7h.01M7 12h.01M12 12h.01M17 12h.01" />
          </svg>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
          CHƯA CÓ LOTO
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.4 }}>
          Kết quả kỳ quay chưa được cập nhật hoặc đang chờ giờ quay thưởng 18:15.
        </p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="touch-press"
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-inverse)',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Làm mới dữ liệu
          </button>
        )}
      </div>
    </div>
  );
}

export function LotoUpdatingBanner({ currentCount = 14 }: { currentCount?: number }) {
  return (
    <div
      style={{
        padding: '0 16px 14px',
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 14,
          backgroundColor: 'var(--status-updating-bg)',
          border: '1.5px solid var(--status-updating-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span className="live-pulse-dot" style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--status-updating-text)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--status-updating-text)' }}>
            LOTO ĐANG CẬP NHẬT ({currentCount}/27 giải)
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            Đang chờ các lượt quay giải tiếp theo từ trường quay...
          </div>
        </div>
      </div>
    </div>
  );
}

export function LotoErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      style={{
        padding: '40px 16px',
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          padding: '32px 20px',
          borderRadius: 20,
          backgroundColor: 'var(--surface)',
          border: '1.5px solid var(--status-error-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            backgroundColor: 'var(--status-error-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--status-error-text)',
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--status-error-text)', margin: '0 0 6px' }}>
          KHÔNG THỂ TẢI DỮ LIỆU LOTO
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.4 }}>
          Dữ liệu hiện chưa khả dụng. Vui lòng kiểm tra kết nối mạng và thử lại.
        </p>

        <button
          onClick={onRetry}
          className="touch-press"
          style={{
            padding: '10px 24px',
            borderRadius: 10,
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--text-inverse)',
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
