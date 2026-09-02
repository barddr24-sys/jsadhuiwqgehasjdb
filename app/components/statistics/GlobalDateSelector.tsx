'use client';

import React from 'react';
import type { DataCompletenessEvaluation } from '@/app/lib/services/statistics-date-range.service';

interface GlobalDateSelectorProps {
  selectedRange: string;
  onSelectRange: (range: string) => void;
  dateRangeDisplay?: string;
  dateRangeFull?: string;
  completeness?: DataCompletenessEvaluation;
  disabled?: boolean;
}

const RANGE_OPTIONS = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'yesterday', label: 'Hôm qua' },
  { key: '3days', label: '3 ngày' },
  { key: '7days', label: '7 ngày' },
  { key: '14days', label: '14 ngày' },
  { key: '30days', label: '30 ngày' },
];

export default function GlobalDateSelector({
  selectedRange,
  onSelectRange,
  dateRangeDisplay,
  dateRangeFull,
  completeness,
  disabled = false,
}: GlobalDateSelectorProps) {
  return (
    <section className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-xs mb-4">
      {/* 1. Segmented Date Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
        {RANGE_OPTIONS.map((opt) => {
          const isSelected = selectedRange === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              disabled={disabled}
              onClick={() => onSelectRange(opt.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-[var(--accent-primary)] text-white shadow-xs font-bold'
                  : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-press)]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* 2. Range Label & Health Status Badge */}
      <div className="mt-2.5 pt-2.5 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-secondary)] font-semibold">Khoảng thời gian:</span>
          <span className="font-bold text-[var(--text-primary)]">
            {dateRangeFull || dateRangeDisplay || 'Đang tải...'}
          </span>
        </div>

        {completeness && (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                completeness.status === 'HEALTHY'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : completeness.status === 'EMPTY'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  completeness.status === 'HEALTHY'
                    ? 'bg-emerald-500'
                    : completeness.status === 'EMPTY'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              {completeness.statusLabel}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
