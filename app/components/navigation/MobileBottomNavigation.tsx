'use client';

import { useTheme } from '@/app/components/theme/ThemeProvider';

export type NavTabId = 'home' | 'statistics' | 'loto' | 'history';

interface NavTab {
  id: NavTabId;
  label: string;
  icon: React.ReactNode;
}

interface MobileBottomNavigationProps {
  activeTab: NavTabId;
  onTabChange: (tabId: NavTabId) => void;
}

export default function MobileBottomNavigation({
  activeTab,
  onTabChange,
}: MobileBottomNavigationProps) {
  const { resolvedTheme, openSettings } = useTheme();

  const tabs: NavTab[] = [
    {
      id: 'home',
      label: 'Trang chủ',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      id: 'statistics',
      label: 'Thống kê',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18"/>
          <path d="m19 9-5 5-4-4-3 3"/>
        </svg>
      ),
    },
    {
      id: 'loto',
      label: 'Loto',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M7 7h.01"/>
          <path d="M12 7h.01"/>
          <path d="M17 7h.01"/>
          <path d="M7 12h.01"/>
          <path d="M12 12h.01"/>
          <path d="M17 12h.01"/>
          <path d="M7 17h.01"/>
          <path d="M12 17h.01"/>
          <path d="M17 17h.01"/>
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'Lịch sử',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Điều hướng chính"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: 'var(--nav-bg)',
        borderTop: '1px solid var(--nav-border)',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.03)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 'var(--nav-h)',
          maxWidth: 480,
          margin: '0 auto',
          paddingLeft: 4,
          paddingRight: 6,
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className="touch-press"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: isActive ? 'var(--accent-primary)' : 'var(--nav-inactive)',
                position: 'relative',
                height: '100%',
              }}
            >
              <div
                style={{
                  transition: 'transform 0.15s ease',
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                {tab.icon}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: isActive ? 800 : 600,
                  letterSpacing: '0.01em',
                  lineHeight: 1.1,
                }}
              >
                {tab.label}
              </span>
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 28,
                    height: 3,
                    borderRadius: '0 0 4px 4px',
                    backgroundColor: 'var(--accent-primary)',
                  }}
                />
              )}
            </button>
          );
        })}

        <button
          id="btn-header-theme-settings"
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
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {resolvedTheme === 'dark' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      </div>
    </nav>
  );
}
