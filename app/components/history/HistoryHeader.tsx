'use client';

import { useTheme } from '@/app/components/theme/ThemeProvider';

interface HistoryHeaderProps {
  mode: 'list' | 'detail';
  dateTitle?: string;
  dayOfWeek?: string;
  isToday?: boolean;
  onBack?: () => void;
  onSearchClick?: () => void;
  onOptionsClick?: () => void;
  onShareClick?: () => void;
}

export default function HistoryHeader({
  mode,
  dateTitle,
  dayOfWeek,
  isToday,
  onBack,
  onSearchClick,
  onOptionsClick,
  onShareClick,
}: HistoryHeaderProps) {
  const { resolvedTheme, openSettings } = useTheme();

  return (
    <header
      role="banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        height: 'var(--header-h)',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      {mode === 'list' ? (
        // STATE A: History List Header
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: 'var(--accent-blue-bg)',
              border: '1px solid var(--accent-blue-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              flexShrink: 0,
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
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h1
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '0.02em',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                LỊCH SỬ XSMB
              </h1>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 4,
                  backgroundColor: 'var(--surface-muted)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                Miền Bắc
              </span>
            </div>
            <p
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Kết quả theo ngày
            </p>
          </div>
        </div>
      ) : (
        // STATE B: Result Detail Header
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <button
            onClick={onBack}
            aria-label="Quay lại Lịch sử"
            className="touch-press"
            style={{
              border: 'none',
              background: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 8px 6px 0',
              cursor: 'pointer',
              color: 'var(--accent-primary)',
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Lịch sử</span>
          </button>

          <div
            style={{
              height: 18,
              width: 1,
              backgroundColor: 'var(--border)',
              marginRight: 4,
            }}
          />

          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                className="tabular-numbers"
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}
              >
                {dateTitle || 'Kết quả XSMB'}
              </span>
              {isToday && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: 4,
                    backgroundColor: 'var(--status-completed-bg)',
                    color: 'var(--status-completed-text)',
                    border: '1px solid var(--status-completed-border)',
                  }}
                >
                  HÔM NAY
                </span>
              )}
            </div>
            {dayOfWeek && (
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  display: 'block',
                  lineHeight: 1.1,
                }}
              >
                {dayOfWeek}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Right side action icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Theme Settings button */}
        <button
          id="btn-history-theme-settings"
          onClick={openSettings}
          aria-label="Cài đặt giao diện và cỡ chữ"
          className="touch-press"
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {mode === 'list' && onSearchClick && (
          <button
            id="btn-history-search"
            onClick={onSearchClick}
            aria-label="Tìm kiếm theo ngày"
            className="touch-press"
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-muted)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg
              width="17"
              height="17"
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
        )}

        {mode === 'detail' && onShareClick && (
          <button
            onClick={onShareClick}
            aria-label="Sao chép tóm tắt kết quả"
            className="touch-press"
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-muted)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
          </button>
        )}

        {onOptionsClick && (
          <button
            id="btn-history-options"
            onClick={onOptionsClick}
            aria-label="Tuỳ chọn & Mô phỏng trạng thái"
            className="touch-press"
            style={{
              width: 40,
              height: 44,
              borderRadius: 10,
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg
              width="17"
              height="17"
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
    </header>
  );
}
