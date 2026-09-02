'use client';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export default function Toast({ message, onClose }: ToastProps) {
  if (!message) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Thông báo"
      className="toast-anim"
      style={{
        position: 'fixed',
        bottom: 84,
        left: '50%',
        zIndex: 100,
        backgroundColor: '#1E293B',
        color: '#FFFFFF',
        padding: '10px 18px',
        borderRadius: 24,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.01em',
        pointerEvents: 'auto',
        maxWidth: '90%',
        whiteSpace: 'nowrap',
      }}
      onClick={onClose}
    >
      <span style={{ color: '#4ADE80', fontSize: 15 }}>✓</span>
      <span>{message}</span>
    </aside>
  );
}
