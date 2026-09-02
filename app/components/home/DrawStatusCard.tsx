'use client';

import type { DrawLifecycleState, PrizeMilestone } from '@/app/lib/xsmb-types';
import Countdown from './Countdown';

interface DrawStatusCardProps {
  status: DrawLifecycleState;
  updatedAt?: string | null;
  milestones?: PrizeMilestone[];
  onCountdownComplete?: () => void;
}

export default function DrawStatusCard({
  status,
  milestones,
  onCountdownComplete,
}: DrawStatusCardProps) {
  // ─── STATE 1: BEFORE_DRAW / SCHEDULED / FUTURE ──────────────────────────
  if (status === 'BEFORE_DRAW' || status === 'SCHEDULED' || status === 'FUTURE') {
    return (
      <section
        aria-label="Trạng thái kỳ quay tiếp theo"
        style={{
          margin: '0 16px 16px',
          padding: '16px 20px 18px',
          borderRadius: 16,
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '0.06em',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
            }}
          >
            KỲ QUAY TIẾP THEO
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--status-scheduled-text)',
              backgroundColor: 'var(--status-scheduled-bg)',
              border: '1px solid var(--status-scheduled-border)',
              padding: '3px 8px',
              borderRadius: 20,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 10 }}>◷</span> Đang chờ kỳ quay
          </span>
        </div>

        {/* Big Countdown */}
        <Countdown onComplete={onCountdownComplete} />

        {/* Subtext */}
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            Dự kiến quay lúc <strong style={{ color: 'var(--text-primary)' }}>18:15</strong>
          </p>
        </div>
      </section>
    );
  }

  // ─── STATE 2: DRAWING ────────────────────────────────────────────────────
  if (status === 'DRAWING') {
    return (
      <section
        aria-label="Kỳ quay đang diễn ra"
        style={{
          margin: '0 16px 16px',
          padding: '18px 20px',
          borderRadius: 16,
          backgroundColor: 'var(--status-drawing-bg)',
          border: '1px solid var(--status-drawing-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: '0.06em',
                color: 'var(--status-drawing-text)',
                margin: '0 0 4px',
                textTransform: 'uppercase',
              }}
            >
              KỲ QUAY ĐANG DIỄN RA
            </h2>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Đang quay trực tiếp tại trường quay Hội đồng XSMB (18:15 – 18:35)
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--status-drawing-border)',
              padding: '6px 12px',
              borderRadius: 20,
            }}
          >
            <span
              className="live-pulse-dot"
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'var(--prize-accent)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--status-drawing-text)',
                letterSpacing: '0.02em',
              }}
            >
              Đang quay
            </span>
          </div>
        </div>
      </section>
    );
  }

  // ─── STATE 3: WAITING_FOR_RESULT / DELAYED ───────────────────────────────
  if (status === 'WAITING_FOR_RESULT' || status === 'DELAYED') {
    return (
      <section
        aria-label="Đang chờ kết quả chính thức"
        style={{
          margin: '0 16px 16px',
          padding: '16px 18px',
          borderRadius: 16,
          backgroundColor: 'var(--status-delayed-bg)',
          border: '1px solid var(--status-delayed-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 20, color: 'var(--status-delayed-text)', lineHeight: 1 }}>⏳</span>
            <div>
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  color: 'var(--status-delayed-text)',
                  margin: '0 0 3px',
                  textTransform: 'uppercase',
                }}
              >
                ĐANG CHỜ KẾT QUẢ CHÍNH THỨC
              </h2>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Hệ thống đang tự động kiểm tra và đồng bộ dữ liệu từ trường quay...
              </p>
            </div>
          </div>
          <span
            className="live-pulse-dot"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--status-delayed-text)',
              display: 'inline-block',
              marginTop: 4,
              flexShrink: 0,
            }}
          />
        </div>
      </section>
    );
  }

  // ─── STATE 4: SYNCING / UPDATING ─────────────────────────────────────────
  if (status === 'SYNCING' || status === 'UPDATING') {
    const activeMilestones = milestones || [
      { key: 'giaiBay', label: 'Giải 7', isComplete: true, count: 4 },
      { key: 'giaiSau', label: 'Giải 6', isComplete: true, count: 3 },
      { key: 'giaiNam', label: 'Giải 5', isComplete: true, count: 6 },
      { key: 'giaiTu', label: 'Giải 4', isComplete: false, count: 2 },
      { key: 'giaiBa', label: 'Giải 3', isComplete: false, count: 0 },
      { key: 'giaiNhi', label: 'Giải 2', isComplete: false, count: 0 },
      { key: 'giaiNhat', label: 'Giải 1', isComplete: false, count: 0 },
      { key: 'dacBiet', label: 'Đặc biệt', isComplete: false, count: 0 },
    ];

    return (
      <section
        aria-label="Đang cập nhật tiến độ kết quả"
        style={{
          margin: '0 16px 16px',
          padding: '18px 20px',
          borderRadius: 16,
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--status-updating-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: '0.06em',
                color: 'var(--text-primary)',
                margin: '0 0 2px',
                textTransform: 'uppercase',
              }}
            >
              ĐANG CẬP NHẬT KẾT QUẢ
            </h2>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Dữ liệu đang được truyền tải theo từng giải
            </span>
          </div>

          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--status-updating-text)',
              backgroundColor: 'var(--status-updating-bg)',
              border: '1px solid var(--status-updating-border)',
              padding: '4px 10px',
              borderRadius: 20,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 12 }}>⚡</span> Đang cập nhật
          </span>
        </div>

        {/* Milestone Steps Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            paddingTop: 8,
            borderTop: '1px solid var(--border)',
          }}
        >
          {activeMilestones.map((m) => (
            <span
              key={m.key}
              style={{
                fontSize: 12,
                fontWeight: m.isComplete ? 800 : 600,
                color: m.isComplete ? 'var(--status-completed-text)' : 'var(--text-secondary)',
                backgroundColor: m.isComplete ? 'var(--status-completed-bg)' : 'var(--surface-muted)',
                border: `1px solid ${m.isComplete ? 'var(--status-completed-border)' : 'var(--border)'}`,
                padding: '4px 9px',
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <span>{m.label}</span>
              <span>{m.isComplete ? '✓' : '...'}</span>
            </span>
          ))}
        </div>
      </section>
    );
  }

  // ─── STATE 5: RESULT_AVAILABLE / COMPLETED ───────────────────────────────
  if (status === 'RESULT_AVAILABLE' || status === 'COMPLETED') {
    return null;
  }

  // ─── STATE 6: RESULT_MISSING / EMPTY / ERROR / SOURCE_ERROR ──────────────
  return (
    <section
      aria-label="Thông báo trạng thái"
      style={{
        margin: '0 16px 16px',
        padding: '16px 18px',
        borderRadius: 16,
        backgroundColor: 'var(--surface-muted)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1 }}>📭</span>
        <div>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: '0.04em',
              color: 'var(--text-primary)',
              margin: '0 0 3px',
              textTransform: 'uppercase',
            }}
          >
            CHƯA CÓ KẾT QUẢ
          </h2>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Không có kết quả XSMB cho ngày được chọn.
          </p>
        </div>
      </div>
    </section>
  );
}
