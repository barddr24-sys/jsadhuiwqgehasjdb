'use client';

/**
 * BottomNav — Fixed 5-tab bottom navigation
 * Active tab: Trang chủ
 * Future tabs: Tra cứu, Thống kê, Cỡ chữ, Giao diện (navigate to correct routes when implemented)
 */

interface NavTab {
  id: string;
  label: string;
  icon: string;
  href: string;
  ariaLabel: string;
}

const TABS: NavTab[] = [
  { id: 'home',      label: 'Trang chủ', icon: '🏠', href: '/',          ariaLabel: 'Trang chủ' },
  { id: 'lookup',    label: 'Tra cứu',   icon: '📅', href: '/tra-cuu',   ariaLabel: 'Tra cứu kết quả' },
  { id: 'stats',     label: 'Thống kê',  icon: '📊', href: '/thong-ke',  ariaLabel: 'Thống kê' },
  { id: 'font',      label: 'Cỡ chữ',   icon: '🔠', href: '/co-chu',    ariaLabel: 'Cỡ chữ' },
  { id: 'theme',     label: 'Giao diện', icon: '🌙', href: '/giao-dien', ariaLabel: 'Giao diện' },
];

interface BottomNavProps {
  activeTab?: string;
  onTabPress?: (tab: NavTab) => void;
}

export default function BottomNav({ activeTab = 'home', onTabPress }: BottomNavProps) {
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
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            aria-label={tab.ariaLabel}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onTabPress?.(tab)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              minHeight: 64,
              paddingTop: 8,
              paddingBottom: 8,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)',
              transition: 'color 150ms ease, transform 150ms ease',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
            onMouseDown={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)';
            }}
            onMouseUp={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = '';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = '';
            }}
            onTouchStart={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)';
            }}
            onTouchEnd={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = '';
            }}
          >
            <span
              role="img"
              aria-hidden="true"
              style={{ fontSize: 20, lineHeight: 1 }}
            >
              {tab.icon}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: isActive ? 800 : 600,
                letterSpacing: '0.01em',
                lineHeight: 1.1,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </span>
            {isActive && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  bottom: 'env(safe-area-inset-bottom, 0px)',
                  width: 24,
                  height: 3,
                  borderRadius: '2px 2px 0 0',
                  backgroundColor: 'var(--nav-active)',
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
