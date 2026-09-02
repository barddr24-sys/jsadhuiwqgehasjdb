'use client';

/**
 * PrizeRow — renders a single prize group row in the result board.
 *
 * Numbers are ALWAYS rendered as strings. Never converted to numbers.
 */

interface PrizeRowProps {
  label: string;
  numbers: string[];
  expectedCount: number;
  digits: number;
  isFirst?: boolean;
}

export default function PrizeRow({
  label,
  numbers,
  expectedCount,
  digits,
  isFirst = false,
}: PrizeRowProps) {
  // Font size based on digit count
  const numFontSize = digits >= 5 ? 20 : digits >= 4 ? 18 : 16;
  const numFontWeight = isFirst ? 700 : 600;

  // Grid columns based on count and available width
  const gridCols = getGridCols(expectedCount, digits);

  // How many numbers to show (filled slots)
  const slots = Array.from({ length: expectedCount }, (_, i) => numbers[i] ?? null);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        borderBottom: '1px solid var(--border)',
        minHeight: 48,
      }}
    >
      {/* Prize label column */}
      <div
        style={{
          width: 72,
          flexShrink: 0,
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 16,
          paddingRight: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            lineHeight: 1.3,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      </div>

      {/* Numbers grid */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gap: 6,
          paddingTop: 10,
          paddingBottom: 10,
          paddingRight: 12,
          paddingLeft: 4,
          alignItems: 'center',
        }}
      >
        {slots.map((num, i) => (
          <div
            key={i}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            {num !== null ? (
              <span
                className="prize-num"
                aria-label={`Số ${num}`}
                style={{
                  fontSize: numFontSize,
                  fontWeight: numFontWeight,
                  lineHeight: 1,
                  padding: '3px 6px',
                  borderRadius: 6,
                  backgroundColor: isFirst ? 'var(--accent-bg)' : 'transparent',
                  border: isFirst ? '1px solid var(--accent-border)' : 'none',
                  color: isFirst ? 'var(--accent)' : 'var(--text-primary)',
                }}
              >
                {num}
              </span>
            ) : (
              <span
                aria-hidden="true"
                style={{
                  display: 'block',
                  width: `${Math.max(32, digits * 10)}px`,
                  height: 22,
                  borderRadius: 4,
                  backgroundColor: 'var(--border)',
                }}
                className="skeleton"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Determine grid column count based on prize count and digit size */
function getGridCols(count: number, digits: number): number {
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  if (count === 4) {
    // 4 × 5-digit numbers: 2 cols on narrow screens
    return digits >= 5 ? 2 : 4;
  }
  if (count === 6) {
    return digits >= 5 ? 3 : 3;
  }
  return count;
}
