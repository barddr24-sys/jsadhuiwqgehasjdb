'use client';

import type { DrawLifecycleState } from '@/app/lib/xsmb-types';

interface StateSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: DrawLifecycleState;
  onSelectState: (state: DrawLifecycleState) => void;
}

export default function StateSwitcherModal({
  isOpen,
  onClose,
  currentState,
  onSelectState,
}: StateSwitcherModalProps) {
  if (!isOpen) return null;

  const states: { id: DrawLifecycleState; title: string; desc: string; badge: string; badgeColor: string }[] = [
    {
      id: 'SCHEDULED',
      title: '1. Kỳ quay tiếp theo (Scheduled)',
      desc: 'Đếm ngược đến 18:15, hiển thị trạng thái chờ',
      badge: '02:17:36',
      badgeColor: '#4B5563',
    },
    {
      id: 'DRAWING',
      title: '2. Kỳ quay đang diễn ra (Drawing)',
      desc: 'Chấm đỏ nhấp nháy, đang quay trực tiếp tại trường quay',
      badge: '🔴 Đang quay',
      badgeColor: '#DC2626',
    },
    {
      id: 'UPDATING',
      title: '3. Đang cập nhật kết quả (Updating)',
      desc: 'Hiển thị tiến độ từng giải: G7 ✓, G6 ✓ ... ĐB ...',
      badge: '⚡ Đang cập nhật',
      badgeColor: '#D97706',
    },
    {
      id: 'COMPLETED',
      title: '4. Kết quả đã cập nhật (Completed)',
      desc: 'Đầy đủ 27 giải, Giải Đặc Biệt 48px, nút sao chép',
      badge: '🟢 Đã có kết quả',
      badgeColor: '#16A34A',
    },
    {
      id: 'DELAYED',
      title: '5. Kết quả đang chậm (Delayed)',
      desc: 'Cảnh báo hệ thống đang chờ dữ liệu chính thức',
      badge: '⚠️ Chậm',
      badgeColor: '#D97706',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="state-switcher-title"
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
          maxHeight: '85vh',
          overflowY: 'auto',
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
          <div>
            <h3 id="state-switcher-title" style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px' }}>
              Mô phỏng 5 trạng thái kỳ quay
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              Kiểm tra nhanh giao diện theo từng giai đoạn XSMB
            </p>
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

        {/* State Selection List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {states.map((st) => {
            const isSelected = currentState === st.id;
            return (
              <button
                key={st.id}
                onClick={() => {
                  onSelectState(st.id);
                  onClose();
                }}
                className="touch-press"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 14,
                  backgroundColor: isSelected ? 'var(--accent-blue-bg)' : 'var(--surface-muted)',
                  border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                      {st.title}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    {st.desc}
                  </p>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: st.badgeColor,
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    padding: '3px 8px',
                    borderRadius: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {st.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
