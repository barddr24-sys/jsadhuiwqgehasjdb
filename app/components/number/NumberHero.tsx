'use client';

interface NumberHeroProps {
  number: string;
  sourceContext?: string;
  head: number;
  tail: number;
  inverseNumber: string;
  previousNumber: string;
  nextNumber: string;
  onNavigateNumber: (num: string) => void;
  onCopyNumber: (num: string) => void;
}

export default function NumberHero({
  number,
  sourceContext,
  head,
  tail,
  inverseNumber,
  previousNumber,
  nextNumber,
  onNavigateNumber,
  onCopyNumber,
}: NumberHeroProps) {
  return (
    <section
      aria-label={`Thông tin tổng quan số ${number}`}
      style={{
        padding: '16px 16px 12px',
        textAlign: 'center',
      }}
    >
      {/* Source Context Badge (subtle, non-dominating) */}
      {sourceContext && (
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--accent-primary)',
              backgroundColor: 'var(--accent-blue-bg)',
              border: '1px solid var(--accent-blue-border)',
              padding: '3px 10px',
              borderRadius: 20,
              letterSpacing: '0.02em',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {sourceContext}
          </span>
        </div>
      )}

      {/* Main Card Container */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 20,
          padding: '20px 16px 16px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Label "SỐ" */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            marginBottom: 2,
          }}
        >
          Số
        </div>

        {/* Huge Number Typography (48–64px) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            position: 'relative',
          }}
        >
          <span
            className="tabular-numbers"
            style={{
              fontSize: 'clamp(52px, 14vw, 64px)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {number}
          </span>

          {/* Quick Copy Action */}
          <button
            id={`btn-copy-hero-${number}`}
            onClick={() => onCopyNumber(number)}
            aria-label={`Sao chép số ${number}`}
            className="touch-press"
            style={{
              minWidth: 40,
              minHeight: 40,
              borderRadius: 10,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-muted)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="16"
              height="16"
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
        </div>

        {/* Factual Subtitle / Anatomy */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 8,
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-secondary)',
          }}
        >
          <span>Đầu <strong style={{ color: 'var(--text-primary)' }}>{head}</strong></span>
          <span style={{ color: 'var(--border-strong)' }}>•</span>
          <span>Đuôi <strong style={{ color: 'var(--text-primary)' }}>{tail}</strong></span>
          <span style={{ color: 'var(--border-strong)' }}>•</span>
          <span>
            Số đảo{' '}
            <button
              onClick={() => onNavigateNumber(inverseNumber)}
              className="touch-press"
              style={{
                border: 'none',
                background: 'none',
                color: 'var(--accent-primary)',
                fontWeight: 800,
                cursor: 'pointer',
                padding: '0 2px',
                textDecoration: 'underline',
              }}
            >
              {inverseNumber}
            </button>
          </span>
        </div>

        {/* Horizontal Divider */}
        <div
          style={{
            height: 1,
            backgroundColor: 'var(--border)',
            margin: '16px 0 12px',
          }}
        />

        {/* One-Handed Number Navigation Controls (Min 48px touch targets) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <button
            id={`btn-nav-prev-${previousNumber}`}
            onClick={() => onNavigateNumber(previousNumber)}
            aria-label={`Xem số trước ${previousNumber}`}
            className="touch-press"
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 12,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-muted)',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '0 12px',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Số {previousNumber}</span>
          </button>

          <div
            className="tabular-numbers"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              padding: '0 4px',
            }}
          >
            2 chữ số
          </div>

          <button
            id={`btn-nav-next-${nextNumber}`}
            onClick={() => onNavigateNumber(nextNumber)}
            aria-label={`Xem số sau ${nextNumber}`}
            className="touch-press"
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 12,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-muted)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '0 12px',
            }}
          >
            <span>Số {nextNumber}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
