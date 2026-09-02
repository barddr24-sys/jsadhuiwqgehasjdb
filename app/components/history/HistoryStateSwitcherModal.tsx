'use client';

export type HistoryUiState = 'ready' | 'loading' | 'empty' | 'partial' | 'error';

interface HistoryStateSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: HistoryUiState;
  onSelectState: (state: HistoryUiState) => void;
}

const STATES: { id: HistoryUiState; label: string; desc: string; icon: string }[] = [
  {
    id: 'ready',
    label: '🟢 Đã có đầy đủ kết quả (Hoàn tất)',
    desc: 'Hiển thị đủ 27 giải chính thức với Giải Đặc Biệt nổi bật và các giải thưởng con.',
    icon: '✅',
  },
  {
    id: 'partial',
    label: '🟡 Đang cập nhật kết quả (Trực tiếp)',
    desc: 'Mô phỏng kỳ quay đang diễn ra: giải 7-1 có số, Giải Đặc Biệt đang quay.',
    icon: '⏳',
  },
  {
    id: 'loading',
    label: '⚪ Đang tải dữ liệu (Skeleton)',
    desc: 'Hiển thị khung xương skeleton mượt mà không che khuất thanh điều hướng.',
    icon: '🔄',
  },
  {
    id: 'empty',
    label: '🔵 Chưa có kết quả (Trống)',
    desc: 'Trạng thái ngày nghỉ quay hoặc chưa có dữ liệu chính thức.',
    icon: '📭',
  },
  {
    id: 'error',
    label: '🔴 Lỗi không thể tải dữ liệu (Error)',
    desc: 'Thông báo lỗi thân thiện kèm nút thử lại nhanh.',
    icon: '⚠️',
  },
];

export default function HistoryStateSwitcherModal({
  isOpen,
  onClose,
  currentState,
  onSelectState,
}: HistoryStateSwitcherModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="state-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
            <h3 id="state-modal-title" style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px' }}>
              Mô Phỏng Trạng Thái Lịch Sử
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              Kiểm tra nhanh giao diện theo từng tình huống dữ liệu
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STATES.map((st) => {
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
                  textAlign: 'left',
                  padding: '14px 16px',
                  borderRadius: 14,
                  backgroundColor: isSelected ? 'var(--accent-blue-bg)' : 'var(--surface-muted)',
                  border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>{st.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                      display: 'block',
                      marginBottom: 2,
                    }}
                  >
                    {st.label}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.35,
                      display: 'block',
                    }}
                  >
                    {st.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
