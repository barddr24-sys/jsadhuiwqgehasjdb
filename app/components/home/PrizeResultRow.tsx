'use client';

interface PrizeResultRowProps {
  label: string;
  shortLabel?: string;
  numbers: string[];
  expectedCount: number;
  digits: number;
  isSpecial?: boolean;
  onInspectNumber?: (num: string) => void;
}

export default function PrizeResultRow({
  label,
  numbers,
  expectedCount,
  digits,
  isSpecial = false,
  onInspectNumber,
}: PrizeResultRowProps) {
  // Generate slots for expected count
  const slots = Array.from({ length: expectedCount }, (_, i) => numbers[i] ?? null);

  // Font sizing based on digits
  const getFontSize = () => {
    if (isSpecial) return 'clamp(24px, 6vw, 28px)';
    if (digits >= 5) return 'clamp(18px, 4.8vw, 22px)';
    if (digits === 4) return 'clamp(17px, 4.4vw, 20px)';
    if (digits === 3) return 'clamp(17px, 4.4vw, 20px)';
    return 'clamp(18px, 4.8vw, 22px)';
  };

  // Grid columns layout
  const getGridTemplate = () => {
    if (expectedCount === 1) return '1fr';
    if (expectedCount === 2) return 'repeat(2, 1fr)';
    if (expectedCount === 3) return 'repeat(3, 1fr)';
    if (expectedCount === 4) return 'repeat(2, 1fr)'; // 2x2 for 4 items
    if (expectedCount === 6) return 'repeat(3, 1fr)'; // 3x2 for 6 items
    return 'repeat(auto-fit, minmax(60px, 1fr))';
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: expectedCount > 3 ? 'column' : 'row',
        alignItems: expectedCount > 3 ? 'stretch' : 'center',
        gap: expectedCount > 3 ? 8 : 12,
      }}
    >
      {/* Label */}
      <div
        style={{
          width: expectedCount > 3 ? 'auto' : 76,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: isSpecial ? 'var(--prize-accent)' : 'var(--text-primary)',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        {expectedCount > 3 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
            ({numbers.length}/{expectedCount})
          </span>
        )}
      </div>

      {/* Numbers container */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: getGridTemplate(),
          gap: 6,
          alignItems: 'center',
        }}
      >
        {slots.map((num, idx) => (
          <div key={idx} style={{ textAlign: 'center' }}>
            {num !== null ? (
              <button
                onClick={() => onInspectNumber?.(num)}
                aria-label={`Số ${num} thuộc ${label}`}
                className="touch-press"
                style={{
                  width: '100%',
                  padding: '6px 4px',
                  borderRadius: 8,
                  backgroundColor: isSpecial
                    ? 'var(--prize-accent-bg)'
                    : 'var(--surface-muted)',
                  border: isSpecial
                    ? '1px solid var(--prize-accent-border)'
                    : '1px solid var(--border)',
                  color: isSpecial ? 'var(--prize-accent)' : 'var(--text-primary)',
                  fontSize: getFontSize(),
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1.15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {num}
              </button>
            ) : (
              <div
                className="skeleton-box"
                style={{
                  height: 34,
                  borderRadius: 8,
                  width: '100%',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
