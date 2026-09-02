'use client';

import { useState, useRef } from 'react';
import { getTodayVN, addDays, formatDisplayDate, isValidDateStr, isFutureDate } from '@/app/lib/date-utils';
import { normalizeDateSearch } from '@/app/lib/history-engine';

interface HistoryDateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenModal?: () => void;
}

export default function HistoryDateSelector({
  selectedDate,
  onSelectDate,
  isOpen = false,
  onClose,
  onOpenModal,
}: HistoryDateSelectorProps) {
  const [searchInput, setSearchInput] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const todayStr = getTodayVN();
  const yesterdayStr = addDays(todayStr, -1);
  const threeDaysAgoStr = addDays(todayStr, -3);
  const sevenDaysAgoStr = addDays(todayStr, -7);

  const currentDisplay = formatDisplayDate(selectedDate);

  const handleApplySearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;

    const matched = normalizeDateSearch(searchInput);
    if (!matched) {
      setSearchError('Vui lòng nhập ngày hợp lệ (VD: 02/09/2026 hoặc 2026-09-02)');
      return;
    }

    if (isFutureDate(matched)) {
      setSearchError('Chưa có kết quả cho ngày trong tương lai');
      return;
    }

    setSearchError(null);
    onSelectDate(matched);
    onClose?.();
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && isValidDateStr(val)) {
      if (isFutureDate(val)) {
        setSearchError('Chưa có kết quả cho ngày trong tương lai');
        return;
      }
      setSearchError(null);
      onSelectDate(val);
      onClose?.();
    }
  };

  return (
    <>
      {/* 1. Main Compact Date Control Bar in History List */}
      <section
        aria-label="Chọn ngày tra cứu"
        style={{
          margin: '12px 16px 8px',
          backgroundColor: 'var(--surface)',
          borderRadius: 16,
          padding: '12px 14px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          {/* Date Picker Trigger Button */}
          <button
            onClick={onOpenModal}
            className="touch-press"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minHeight: 48,
              padding: '0 14px',
              backgroundColor: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
                flexShrink: 0,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>
                Chọn ngày tra cứu
              </span>
              <span className="tabular-numbers" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                📅 {currentDisplay.short} ({currentDisplay.dayOfWeek})
              </span>
            </div>

            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* Jump to Today Button */}
          {selectedDate !== todayStr && (
            <button
              onClick={() => onSelectDate(todayStr)}
              className="touch-press"
              style={{
                minHeight: 48,
                padding: '0 12px',
                backgroundColor: 'var(--accent-blue-bg)',
                border: '1px solid var(--accent-blue-border)',
                borderRadius: 12,
                color: 'var(--accent-primary)',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Hôm nay
            </button>
          )}
        </div>

        {/* Quick presets pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
            overflowX: 'auto',
            paddingBottom: 2,
            scrollbarWidth: 'none',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginRight: 2 }}>
            Nhanh:
          </span>

          {[
            { label: 'Hôm nay', date: todayStr },
            { label: 'Hôm qua', date: yesterdayStr },
            { label: '3 ngày trước', date: threeDaysAgoStr },
            { label: '7 ngày trước', date: sevenDaysAgoStr },
          ].map((preset) => {
            const isSelected = selectedDate === preset.date;
            return (
              <button
                key={preset.date}
                onClick={() => onSelectDate(preset.date)}
                className="touch-press"
                style={{
                  padding: '5px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: isSelected ? 700 : 500,
                  backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--surface-muted)',
                  color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Interactive Date Picker Modal (Native & Search) */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="date-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            backdropFilter: 'blur(3px)',
          }}
          onClick={onClose}
        >
          <div
            className="animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: 'var(--surface)',
              borderRadius: '24px 24px 0 0',
              padding: '20px 20px 32px',
              boxShadow: 'var(--shadow-lg)',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal Handle */}
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'var(--border-strong)',
                margin: '0 auto 16px',
              }}
            />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 id="date-modal-title" style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                  Chọn Ngày Tra Cứu
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                  Dữ liệu lưu trữ lịch sử kết quả XSMB chính thức
                </p>
              </div>

              <button
                onClick={onClose}
                aria-label="Đóng"
                className="touch-press"
                style={{
                  border: 'none',
                  backgroundColor: 'var(--surface-muted)',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                }}
              >
                ✕
              </button>
            </div>

            {/* Native Mobile Date Picker Button/Input */}
            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor="native-date-picker"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                Chọn lịch theo ngày (Dương lịch)
              </label>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <input
                  id="native-date-picker"
                  ref={dateInputRef}
                  type="date"
                  max={todayStr}
                  value={selectedDate}
                  onChange={handleNativeDateChange}
                  style={{
                    width: '100%',
                    minHeight: 48,
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: 15,
                    fontWeight: 600,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Text Search by Date */}
            <form onSubmit={handleApplySearch} style={{ marginBottom: 16 }}>
              <label
                htmlFor="search-date-input"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                Hoặc nhập ngày nhanh (VD: 02/09/2026)
              </label>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="search-date-input"
                  type="text"
                  placeholder="DD/MM/YYYY (VD: 02/09/2026)"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    if (searchError) setSearchError(null);
                  }}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    padding: '0 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  className="touch-press"
                  style={{
                    minHeight: 48,
                    padding: '0 18px',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Tìm
                </button>
              </div>

              {searchError && (
                <p style={{ fontSize: 12, color: 'var(--prize-accent)', marginTop: 6, margin: '6px 0 0' }}>
                  {searchError}
                </p>
              )}
            </form>

            {/* Quick Presets Grid */}
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                }}
              >
                Kỳ quay nổi bật
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {[
                  { label: 'Hôm nay', sub: formatDisplayDate(todayStr).short, date: todayStr },
                  { label: 'Hôm qua', sub: formatDisplayDate(yesterdayStr).short, date: yesterdayStr },
                  { label: '3 ngày trước', sub: formatDisplayDate(threeDaysAgoStr).short, date: threeDaysAgoStr },
                  { label: '7 ngày trước', sub: formatDisplayDate(sevenDaysAgoStr).short, date: sevenDaysAgoStr },
                ].map((item) => (
                  <button
                    key={item.date}
                    onClick={() => {
                      onSelectDate(item.date);
                      onClose?.();
                    }}
                    className="touch-press"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      backgroundColor: selectedDate === item.date ? 'var(--accent-blue-bg)' : 'var(--surface-muted)',
                      border: selectedDate === item.date ? '1px solid var(--accent-blue-border)' : '1px solid var(--border)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                      {item.label}
                    </span>
                    <span className="tabular-numbers" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {item.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
