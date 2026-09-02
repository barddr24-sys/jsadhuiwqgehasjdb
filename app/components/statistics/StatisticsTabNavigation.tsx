'use client';

import React from 'react';

export type StatisticsTabKey =
  | 'overview'
  | 'special'
  | 'loto'
  | 'gan'
  | 'frequency'
  | 'trend'
  | 'pairs';

interface StatisticsTabNavigationProps {
  activeTab: StatisticsTabKey;
  onTabChange: (tab: StatisticsTabKey) => void;
}

const TABS: { key: StatisticsTabKey; label: string; icon?: string; badge?: string }[] = [
  { key: 'overview', label: 'Tổng Quan' },
  { key: 'special', label: 'ĐB 2 Số Cuối', badge: 'Đặc Biệt' },
  { key: 'loto', label: 'LOTO 00–99' },
  { key: 'gan', label: 'Gan & Chu Kỳ' },
  { key: 'frequency', label: 'Tần Suất & Lặp' },
  { key: 'trend', label: 'Xu Hướng' },
  { key: 'pairs', label: 'Cặp Số & Đảo' },
];

export default function StatisticsTabNavigation({
  activeTab,
  onTabChange,
}: StatisticsTabNavigationProps) {
  return (
    <nav className="mb-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1.5 shadow-xs overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1 min-w-max">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[var(--accent-primary)] text-white shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
