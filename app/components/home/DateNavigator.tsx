'use client';

import { formatDisplayDate, isToday, isFutureDate, addDays, getTodayVN } from '@/app/lib/date-utils';

interface DateNavigatorProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
  loading?: boolean;
}

export default function DateNavigator({
  selectedDate,
  onDateChange,
  loading = false,
}: DateNavigatorProps) {
  const { dayOfWeek, fullDate } = formatDisplayDate(selectedDate);
  const isCurrentDay = isToday(selectedDate);
  const isFuture = isFutureDate(selectedDate);
  const today = getTodayVN();

  // Next day is disabled if it would go past today
  const nextDate = addDays(selectedDate, 1);
  const canGoNext = nextDate <= today;
  const canGoPrev = true; // Can always go back in history

  function handlePrev() {
    if (!loading) onDateChange(addDays(selectedDate, -1));
  }

  function handleNext() {
    if (!loading || !canGoNext) onDateChange(addDays(selectedDate, 1));
  }

  function handleToday() {
    if (!loading && !isCurrentDay) onDateChange(today);
  }

  return (
    <section aria-label="Ngày xem kết quả">
      {/* Date Display */}
      <div
        style={{
          paddingTop: 20,
          paddingBottom: 12,
          paddingLeft: 20,
          paddingRight: 20,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            margin: 0,
            marginBottom: 4,
          }}
          aria-hidden="true"
        >
          {dayOfWeek}
        </p>
        <time
          dateTime={selectedDate}
          style={{
            display: 'block',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: 'var(--text-primary)',
            lineHeight: 1.2,
          }}
          aria-label={`Ngày ${fullDate}`}
        >
          {fullDate}
        </time>
        {isCurrentDay && (
          <span
            style={{
              display: 'inline-block',
              marginTop: 6,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--accent)',
              backgroundColor: 'var(--accent-bg)',
              border: '1px solid var(--accent-border)',
              borderRadius: 20,
              paddingLeft: 10,
              paddingRight: 10,
              paddingTop: 3,
              paddingBottom: 3,
            }}
          >
            HÔM NAY
          </span>
        )}
        {isFuture && (
          <span
            style={{
              display: 'inline-block',
              marginTop: 6,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              paddingLeft: 10,
              paddingRight: 10,
              paddingTop: 3,
              paddingBottom: 3,
            }}
          >
            NGÀY TƯƠNG LAI
          </span>
        )}
      </div>

      {/* Navigation Controls */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 16,
          alignItems: 'stretch',
        }}
      >
        {/* Prev Day */}
        <NavButton
          id="nav-prev-day"
          onClick={handlePrev}
          disabled={loading || !canGoPrev}
          ariaLabel="Ngày hôm trước"
        >
          <span aria-hidden="true">←</span>
          <span>NGÀY TRƯỚC</span>
        </NavButton>

        {/* Today */}
        <NavButton
          id="nav-today"
          onClick={handleToday}
          disabled={loading || isCurrentDay}
          ariaLabel="Xem kết quả hôm nay"
          accent
        >
          HÔM NAY
        </NavButton>

        {/* Next Day */}
        <NavButton
          id="nav-next-day"
          onClick={handleNext}
          disabled={loading || !canGoNext}
          ariaLabel="Ngày hôm sau"
        >
          <span>NGÀY SAU</span>
          <span aria-hidden="true">→</span>
        </NavButton>
      </div>
    </section>
  );
}

// ─── NavButton ───────────────────────────────────────────────────────────────

interface NavButtonProps {
  id: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
  accent?: boolean;
}

function NavButton({ id, children, onClick, disabled, ariaLabel, accent }: NavButtonProps) {
  return (
    <button
      id={id}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        minHeight: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        border: accent
          ? '1.5px solid var(--accent)'
          : '1.5px solid var(--border)',
        borderRadius: 10,
        cursor: disabled ? 'default' : 'pointer',
        backgroundColor: accent
          ? 'var(--accent-bg)'
          : 'var(--surface)',
        color: disabled
          ? 'var(--text-muted)'
          : accent
            ? 'var(--accent)'
            : 'var(--text-secondary)',
        opacity: disabled ? 0.45 : 1,
        transition: 'opacity 150ms ease, background-color 150ms ease, transform 100ms ease',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        userSelect: 'none',
        padding: '0 8px',
        fontFamily: 'inherit',
      }}
      onMouseDown={e => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
      }}
      onMouseUp={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = '';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = '';
      }}
      onTouchStart={e => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
      }}
      onTouchEnd={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = '';
      }}
    >
      {children}
    </button>
  );
}
