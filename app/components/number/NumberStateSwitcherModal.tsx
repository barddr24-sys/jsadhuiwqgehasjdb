'use client';

export type NumberUiState = 'ready' | 'loading' | 'empty' | 'error';

interface NumberStateSwitcherModalProps {
  isOpen: boolean;
  currentState: NumberUiState;
  onClose: () => void;
  onSelectState: (state: NumberUiState) => void;
}

export default function NumberStateSwitcherModal({
  isOpen,
  currentState,
  onClose,
  onSelectState,
}: NumberStateSwitcherModalProps) {
  if (!isOpen) return null;

  const statesList: { id: NumberUiState; label: string; desc: string }[] = [
    { id: 'ready', label: '🟢 Đã có đầy đủ dữ liệu (Chuẩn)', desc: 'Hiển thị đầy đủ số liệu và lịch sử' },
    { id: 'loading', label: '⏳ Đang tải (Skeleton loader)', desc: 'Mô phỏng trạng thái tải dữ liệu' },
    { id: 'empty', label: '⚪ Chưa có dữ liệu (Trống)', desc: 'Không có thông tin lịch sử cho số này' },
    { id: 'error', label: '🔴 Lỗi không thể tải dữ liệu', desc: 'Mô phỏng lỗi kết nối với nút Thử lại' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="number-state-switcher-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 360,
          backgroundColor: 'var(--surface)',
          borderRadius: 20,
          padding: '20px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
        }}
      >
        <h3
          id="number-state-switcher-title"
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '0 0 4px',
          }}
        >
          Kiểm tra các trạng thái
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
          Chọn trạng thái hiển thị để kiểm tra giao diện Chi tiết số:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {statesList.map((st) => (
            <button
              key={st.id}
              onClick={() => {
                onSelectState(st.id);
                onClose();
              }}
              className="touch-press"
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                border: currentState === st.id ? '1.5px solid var(--accent-primary)' : '1px solid var(--border)',
                backgroundColor: currentState === st.id ? 'var(--accent-blue-bg)' : 'var(--surface-muted)',
                color: currentState === st.id ? 'var(--accent-primary)' : 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 700,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <span>{st.label}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>
                {st.desc}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="touch-press"
          style={{
            width: '100%',
            marginTop: 16,
            padding: '12px 0',
            borderRadius: 12,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
