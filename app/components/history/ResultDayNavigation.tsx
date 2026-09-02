'use client';

interface ResultDayNavigationProps {
  currentDate: string;
  displayDate: string;
  previousDate: string | null;
  nextDate: string | null;
  previousShortDate: string | null;
  nextShortDate: string | null;
  onNavigateDate: (date: string) => void;
}

export default function ResultDayNavigation({
  displayDate,
  previousDate,
  nextDate,
  previousShortDate,
  nextShortDate,
  onNavigateDate,
}: ResultDayNavigationProps) {
  const isNextDisabled = !nextDate;

  return (
    <nav
      aria-label="Chuyển ngày kết quả"
      style={{
        margin: '8px 16px 20px',
        backgroundColor: 'var(--surface)',
        borderRadius: 16,
        padding: '10px 12px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      {/* Previous Day Button */}
      <button
        onClick={() => previousDate && onNavigateDate(previousDate)}
        disabled={!previousDate}
        className="touch-press"
        style={{
          flex: 1,
          minHeight: 46,
          padding: '0 8px',
          borderRadius: 12,
          backgroundColor: 'var(--surface-muted)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          cursor: previousDate ? 'pointer' : 'not-allowed',
          opacity: previousDate ? 1 : 0.4,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        <span className="tabular-numbers">
          {previousShortDate ? `← ${previousShortDate}` : 'Ngày trước'}
        </span>
      </button>

      {/* Center Current Date Indicator */}
      <div
        style={{
          textAlign: 'center',
          padding: '0 4px',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'block',
          }}
        >
          Đang xem
        </span>
        <span
          className="tabular-numbers"
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
          }}
        >
          {displayDate}
        </span>
      </div>

      {/* Next Day Button */}
      <button
        onClick={() => nextDate && onNavigateDate(nextDate)}
        disabled={isNextDisabled}
        className={isNextDisabled ? undefined : 'touch-press'}
        style={{
          flex: 1,
          minHeight: 46,
          padding: '0 8px',
          borderRadius: 12,
          backgroundColor: isNextDisabled ? 'var(--surface-subtle)' : 'var(--surface-muted)',
          border: '1px solid var(--border)',
          color: isNextDisabled ? 'var(--text-muted)' : 'var(--text-primary)',
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          cursor: isNextDisabled ? 'not-allowed' : 'pointer',
          opacity: isNextDisabled ? 0.45 : 1,
        }}
      >
        <span className="tabular-numbers">
          {nextShortDate ? `${nextShortDate} →` : 'Ngày sau'}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </nav>
  );
}
