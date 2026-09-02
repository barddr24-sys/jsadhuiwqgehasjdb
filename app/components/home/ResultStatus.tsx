'use client';

import type { DrawLifecycleState } from '@/app/lib/xsmb-types';

interface ResultStatusProps {
  status: DrawLifecycleState;
  updatedAt?: string | null;
}

const STATUS_CONFIG: Record<
  DrawLifecycleState,
  { icon: string; text: string; color: string; bg: string; border: string }
> = {
  SCHEDULED: {
    icon: '🕐',
    text: 'CHƯA ĐẾN GIỜ QUAY THƯỞNG',
    color: 'var(--status-scheduled-text)',
    bg:    'var(--status-scheduled-bg)',
    border:'var(--border)',
  },
  DRAWING: {
    icon: '🔄',
    text: 'ĐANG QUAY THƯỞNG',
    color: 'var(--status-drawing-text)',
    bg:    'var(--status-drawing-bg)',
    border:'var(--border)',
  },
  UPDATING: {
    icon: '🔄',
    text: 'ĐANG CẬP NHẬT KẾT QUẢ',
    color: 'var(--status-updating-text)',
    bg:    'var(--status-updating-bg)',
    border:'var(--border)',
  },
  COMPLETED: {
    icon: '✅',
    text: 'ĐÃ CÓ ĐẦY ĐỦ KẾT QUẢ',
    color: 'var(--status-completed-text)',
    bg:    'var(--status-completed-bg)',
    border:'var(--border)',
  },
  DELAYED: {
    icon: '⚠️',
    text: 'KẾT QUẢ ĐANG CHẬM',
    color: 'var(--status-delayed-text)',
    bg:    'var(--status-delayed-bg)',
    border:'var(--border)',
  },
  FUTURE: {
    icon: '📅',
    text: 'CHƯA ĐẾN NGÀY QUAY',
    color: 'var(--text-muted)',
    bg:    'var(--surface-muted)',
    border:'var(--border)',
  },
  EMPTY: {
    icon: '📭',
    text: 'CHƯA CÓ KẾT QUẢ',
    color: 'var(--text-muted)',
    bg:    'var(--surface-muted)',
    border:'var(--border)',
  },
  ERROR: {
    icon: '⚠️',
    text: 'KHÔNG CÓ KẾT QUẢ',
    color: 'var(--status-error-text)',
    bg:    'var(--status-error-bg)',
    border:'var(--border)',
  },
};

export default function ResultStatus({ status, updatedAt }: ResultStatusProps) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ERROR;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        marginLeft: 16,
        marginRight: 16,
        marginBottom: 16,
        borderRadius: 10,
        border: `1px solid ${cfg.border}`,
        backgroundColor: cfg.bg,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span role="img" aria-hidden="true" style={{ fontSize: 16, flexShrink: 0 }}>
        {cfg.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: cfg.color,
            display: 'block',
            lineHeight: 1.3,
          }}
        >
          {cfg.text}
        </span>
        {updatedAt && status === 'COMPLETED' && (
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              display: 'block',
              marginTop: 2,
              letterSpacing: '0.02em',
            }}
          >
            {formatUpdatedAt(updatedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

function formatUpdatedAt(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
