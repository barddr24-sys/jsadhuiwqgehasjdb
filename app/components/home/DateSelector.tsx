'use client';

import { formatDisplayDate, isToday, addDays, getTodayVN } from '@/app/lib/date-utils';

interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
  loading?: boolean;
}

export default function DateSelector({
  selectedDate,
  onDateChange,
  loading = false,
}: DateSelectorProps) {
  const { dayOfWeek, fullDate } = formatDisplayDate(selectedDate);
  const isCurrentDay = isToday(selectedDate);
  const today = getTodayVN();

  const nextDate = addDays(selectedDate, 1);
  const canGoNext = nextDate <= today;

  function handlePrev() {
    if (!loading) {
      onDateChange(addDays(selectedDate, -1));
    }
  }

  function handleNext() {
    if (!loading && canGoNext) {
      onDateChange(addDays(selectedDate, 1));
    }
  }

  function handleToday() {
    if (!loading && !isCurrentDay) {
      onDateChange(today);
    }
  }

  return (
    <div
      style={{
        padding: '8px 16px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--canvas)',
      }}
    >
      {/* Prev Date Button */}
      <button
        id="btn-prev-date"
        onClick={handlePrev}
        disabled={loading}
        aria-label="Xem kết quả ngày trước"
        className="touch-press"
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          border: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: loading ? 'default' : 'pointer',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      {/* Date Display */}
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <time
            dateTime={selectedDate}
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {dayOfWeek}, {fullDate}
          </time>
          {isCurrentDay && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--accent-primary)',
                backgroundColor: 'var(--accent-blue-bg)',
                border: '1px solid var(--accent-blue-border)',
                padding: '2px 7px',
                borderRadius: 12,
                letterSpacing: '0.02em',
              }}
            >
              Hôm nay
            </span>
          )}
        </div>
        {!isCurrentDay && (
          <button
            onClick={handleToday}
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--accent-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
              textUnderlineOffset: 2,
            }}
          >
            Về hôm nay
          </button>
        )}
      </div>

      {/* Next Date Button */}
      <button
        id="btn-next-date"
        onClick={handleNext}
        disabled={loading || !canGoNext}
        aria-label="Xem kết quả ngày sau"
        className="touch-press"
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          border: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          color: canGoNext ? 'var(--text-primary)' : 'var(--text-disabled)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: !canGoNext || loading ? 'not-allowed' : 'pointer',
          opacity: canGoNext ? 1 : 0.45,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    </div>
  );
}
