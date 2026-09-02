'use client';

import { useTheme } from '@/app/components/theme/ThemeProvider';

interface NumberDetailHeaderProps {
  onBack: () => void;
  onSearchClick: () => void;
  onOptionsClick: () => void;
}

export default function NumberDetailHeader({
  onBack,
  onSearchClick,
  onOptionsClick,
}: NumberDetailHeaderProps) {
  const { resolvedTheme, openSettings } = useTheme();

  return (
    <header
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        height: 'var(--header-h)',
        padding: '0 8px 0 4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Left: Back Button (48px Touch Target) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <button
          id="btn-number-detail-back"
          onClick={onBack}
          aria-label="Quay lại"
          className="touch-press"
          style={{
            minWidth: 48,
            minHeight: 48,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            borderRadius: 12,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        {/* Title */}
        <h1
          style={{
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Chi Tiết Số
        </h1>
      </div>

      {/* Right: Theme, Search & Actions Menu Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <button
          id="btn-number-detail-theme"
          onClick={openSettings}
          aria-label="Cài đặt giao diện và cỡ chữ"
          className="touch-press"
          style={{
            minWidth: 44,
            minHeight: 44,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            borderRadius: 12,
          }}
        >
          {resolvedTheme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          )}
        </button>

        <button
          id="btn-number-detail-search"
          onClick={onSearchClick}
          aria-label="Tra cứu số khác"
          className="touch-press"
          style={{
            minWidth: 44,
            minHeight: 44,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            borderRadius: 12,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        <button
          id="btn-number-detail-options"
          onClick={onOptionsClick}
          aria-label="Tùy chọn hiển thị"
          className="touch-press"
          style={{
            minWidth: 44,
            minHeight: 44,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            borderRadius: 12,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </div>
    </header>
  );
}
