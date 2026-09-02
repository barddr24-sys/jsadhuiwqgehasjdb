'use client';

import { useTheme } from '@/app/components/theme/ThemeProvider';

interface LotoHeaderProps {
  onBack: () => void;
  onSearchClick: () => void;
  onOptionsClick?: () => void;
}

export default function LotoHeader({
  onBack,
  onSearchClick,
  onOptionsClick,
}: LotoHeaderProps) {
  const { resolvedTheme, openSettings } = useTheme();

  return (
    <header
      role="banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--header-h)',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
        }}
      >
        {/* Left: Large 48px Touch Target Back Button */}
        <button
          id="btn-loto-back"
          onClick={onBack}
          aria-label="Quay lại Trang chủ"
          className="touch-press"
          style={{
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            border: 'none',
            background: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Center: Title & Subtitle */}
        <div style={{ textAlign: 'center', flex: 1, padding: '0 4px' }}>
          <h1
            style={{
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            LOTO XSMB
          </h1>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Loto miền Bắc
          </p>
        </div>

        {/* Right: Actions (Theme/Settings + Search + Options) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            id="btn-loto-theme-settings"
            onClick={openSettings}
            aria-label="Cài đặt giao diện và cỡ chữ"
            className="touch-press"
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
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
            id="btn-loto-header-search"
            onClick={onSearchClick}
            aria-label="Tìm kiếm loto"
            className="touch-press"
            style={{
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              border: 'none',
              background: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
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
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {onOptionsClick && (
            <button
              id="btn-loto-options"
              onClick={onOptionsClick}
              aria-label="Tùy chọn trạng thái"
              className="touch-press"
              style={{
                width: 40,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                border: 'none',
                background: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <svg
                width="18"
                height="18"
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
          )}
        </div>
      </div>
    </header>
  );
}
