'use client';

import { useTheme } from '@/app/components/theme/ThemeProvider';

interface StatisticsHeaderProps {
  onBack: () => void;
  onSearchClick?: () => void;
  onCompareClick?: () => void;
  isSearchActive?: boolean;
}

export default function StatisticsHeader({
  onBack,
  onSearchClick,
  onCompareClick,
  isSearchActive = false,
}: StatisticsHeaderProps) {
  const { resolvedTheme, openSettings } = useTheme();

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 h-[var(--header-h,56px)] bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-2 sm:px-4 shadow-xs"
    >
      {/* Back Button */}
      <button
        id="btn-stats-back"
        onClick={onBack}
        aria-label="Quay lại trang chủ"
        className="w-10 h-10 rounded-xl text-[var(--text-primary)] hover:bg-[var(--surface-muted)] flex items-center justify-center cursor-pointer transition-colors"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      {/* Title & Subtitle */}
      <div className="flex-1 text-center px-2">
        <h1 className="text-sm sm:text-base font-black tracking-wide text-[var(--text-primary)] uppercase leading-tight">
          XSMB THỐNG KÊ & PHÂN TÍCH
        </h1>
        <p className="text-[10px] sm:text-[11px] font-medium text-[var(--text-secondary)] mt-0.5 leading-none">
          Phân tích dữ liệu kết quả XSMB thực tế
        </p>
      </div>

      {/* Right Actions: Compare + Search + Theme/Settings */}
      <div className="flex items-center gap-1">
        {/* Compare Mode Button */}
        <button
          id="btn-stats-compare"
          onClick={onCompareClick}
          aria-label="So sánh hai giai đoạn"
          title="So sánh giai đoạn"
          className="w-9 h-9 rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--surface-press)] text-[var(--text-primary)] flex items-center justify-center cursor-pointer text-xs font-bold transition-colors"
        >
          ⚖️
        </button>

        {/* Search Button */}
        <button
          id="btn-stats-header-search"
          onClick={onSearchClick}
          aria-label="Tìm kiếm số"
          title="Tra cứu số nhanh"
          className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
            isSearchActive
              ? 'bg-[var(--accent-primary)] text-white'
              : 'bg-[var(--surface-muted)] hover:bg-[var(--surface-press)] text-[var(--text-primary)]'
          }`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>

        {/* Theme Settings Button */}
        <button
          id="btn-stats-theme-settings"
          onClick={openSettings}
          aria-label="Cài đặt giao diện"
          className="w-9 h-9 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] flex items-center justify-center cursor-pointer transition-colors"
        >
          {resolvedTheme === 'dark' ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}

