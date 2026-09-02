'use client';

/**
 * Header — Compact premium XSMB app header
 */

interface HeaderProps {
  /** Called when offline indicator is shown */
  isOffline?: boolean;
}

export default function Header({ isOffline = false }: HeaderProps) {
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Brand mark — simple geometric circle in accent */}
        <div
          aria-hidden="true"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            XS
          </span>
        </div>

        <div>
          <h1
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--text-primary)',
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            XỔ SỐ MIỀN BẮC
          </h1>
          <p
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
              margin: 0,
              lineHeight: 1,
            }}
          >
            KẾT QUẢ HÀNG NGÀY
          </p>
        </div>
      </div>

      {/* Right side — offline badge or empty */}
      {isOffline && (
        <span
          role="status"
          aria-live="polite"
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: 'var(--status-before-color)',
            backgroundColor: 'var(--status-before-bg)',
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 4,
            paddingBottom: 4,
            borderRadius: 20,
            border: '1px solid var(--border)',
            whiteSpace: 'nowrap',
          }}
        >
          NGOẠI TUYẾN
        </span>
      )}
    </header>
  );
}
