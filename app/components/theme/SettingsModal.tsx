'use client';

import React from 'react';
import { useTheme, type ThemePreference, type FontSizePreference } from './ThemeProvider';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme, fontSize, setFontSize } = useTheme();

  if (!isOpen) return null;

  const themeOptions: { id: ThemePreference; label: string; icon: string; desc: string }[] = [
    { id: 'light', label: 'Sáng', icon: '☀️', desc: 'Giao diện nền sáng mặc định' },
    { id: 'dark', label: 'Tối', icon: '🌙', desc: 'Dễ nhìn trong môi trường tối' },
    { id: 'system', label: 'Hệ thống', icon: '⚙️', desc: 'Tự động theo cài đặt thiết bị' },
  ];

  const fontOptions: { id: FontSizePreference; label: string; preview: string; desc: string }[] = [
    { id: '100%', label: '100%', preview: 'Chuẩn', desc: 'Kích thước mặc định' },
    { id: '115%', label: '115%', preview: 'Lớn', desc: 'Dễ đọc hơn (+15%)' },
    { id: '130%', label: '130%', preview: 'Rất lớn', desc: 'Kích thước tối đa (+30%)' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
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
          borderTop: '1px solid var(--border)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle bar */}
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'var(--border-strong)',
            margin: '0 auto 16px',
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              id="settings-title"
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '0 0 2px',
              }}
            >
              Cài đặt hiển thị
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Tùy chỉnh giao diện và cỡ chữ theo ý muốn
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng cài đặt"
            className="touch-press"
            style={{
              border: 'none',
              backgroundColor: 'var(--surface-muted)',
              width: 36,
              height: 36,
              minHeight: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {/* Section 1: Giao diện (Theme) */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              marginBottom: 10,
            }}
          >
            GIAO DIỆN
          </label>

          <div
            role="radiogroup"
            aria-label="Chọn giao diện"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}
          >
            {themeOptions.map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setTheme(opt.id)}
                  className="touch-press"
                  style={{
                    minHeight: 64,
                    padding: '10px 8px',
                    borderRadius: 14,
                    border: isSelected
                      ? '2px solid var(--accent-primary)'
                      : '1px solid var(--border)',
                    backgroundColor: isSelected
                      ? 'var(--accent-blue-bg)'
                      : 'var(--surface-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{opt.icon}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: isSelected ? 800 : 600,
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Cỡ chữ (Font Size) */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              marginBottom: 10,
            }}
          >
            CỠ CHỮ
          </label>

          <div
            role="radiogroup"
            aria-label="Chọn cỡ chữ"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}
          >
            {fontOptions.map((opt) => {
              const isSelected = fontSize === opt.id;
              return (
                <button
                  key={opt.id}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setFontSize(opt.id)}
                  className="touch-press"
                  style={{
                    minHeight: 64,
                    padding: '10px 8px',
                    borderRadius: 14,
                    border: isSelected
                      ? '2px solid var(--accent-primary)'
                      : '1px solid var(--border)',
                    backgroundColor: isSelected
                      ? 'var(--accent-blue-bg)'
                      : 'var(--surface-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      fontSize: opt.id === '100%' ? 15 : opt.id === '115%' ? 17 : 20,
                      fontWeight: 800,
                      lineHeight: 1,
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                    }}
                  >
                    {opt.preview}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="touch-press"
          style={{
            width: '100%',
            minHeight: 48,
            borderRadius: 14,
            border: '1px solid var(--border-strong)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Hoàn tất
        </button>
      </div>
    </div>
  );
}
