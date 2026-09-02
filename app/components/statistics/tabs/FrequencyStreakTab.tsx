'use client';

import React, { useState } from 'react';
import type {
  LotoNumberStat,
  StreakNumberStat,
} from '@/app/lib/services/statistics-deep.service';
import { toDDMMYYYYDash } from '@/app/lib/date-utils';

interface FrequencyStreakTabProps {
  allNumbers: LotoNumberStat[];
  streaks?: StreakNumberStat[];
  onInspectNumber: (num: string) => void;
}

export default function FrequencyStreakTab({
  allNumbers,
  streaks = [],
  onInspectNumber,
}: FrequencyStreakTabProps) {
  const [subTab, setSubTab] = useState<'hot_cold' | 'streaks'>('hot_cold');

  // Sorted Hot Numbers
  const hotNumbers = [...allNumbers]
    .sort((a, b) => b.frequency - a.frequency || b.recentFrequency - a.recentFrequency || a.number.localeCompare(b.number))
    .slice(0, 20);

  // Sorted Cold Numbers
  const coldNumbers = [...allNumbers]
    .sort((a, b) => a.frequency - b.frequency || b.currentGap - a.currentGap || a.number.localeCompare(b.number))
    .slice(0, 20);

  // Streak filters
  const activeStreaks = streaks.filter((s) => s.currentStreak >= 2);
  const longestStreaksList = [...streaks]
    .sort((a, b) => b.longestStreak - a.longestStreak || b.currentStreak - a.currentStreak)
    .slice(0, 20);

  return (
    <div className="space-y-4">
      {/* 1. SUB-TAB SWITCHER */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 shadow-xs flex items-center justify-between">
        <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
          PHÂN TÍCH TẦN SUẤT & CHUỖI VỀ LIÊN TIẾP
        </h2>

        <div className="flex items-center gap-1 bg-[var(--surface-muted)] p-1 rounded-lg border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setSubTab('hot_cold')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${subTab === 'hot_cold'
                ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
          >
            Hot & Cold LOTO
          </button>
          <button
            type="button"
            onClick={() => setSubTab('streaks')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${subTab === 'streaks'
                ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
          >
            Chuỗi Về Liên Tiếp (Streak)
          </button>
        </div>
      </div>

      {subTab === 'hot_cold' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* HOT NUMBERS */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🔥</span>
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase">
                  Top 20 LOTO Về Nhiều Nhất (HOT)
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-[var(--text-primary)] border-b border-[var(--border)] pb-2 select-none">
                    <th className="pb-2.5 font-extrabold text-center">Hạng</th>
                    <th className="pb-2.5 font-extrabold">Số</th>
                    <th className="pb-2.5 font-extrabold text-center">Số lượt</th>
                    <th className="pb-2.5 font-extrabold text-center">Tỷ lệ</th>
                    <th className="pb-2.5 font-extrabold text-center">Số kỳ về</th>
                    <th className="pb-2.5 font-extrabold text-center">Gần nhất</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {hotNumbers.map((item, idx) => (
                    <tr
                      key={item.number}
                      onClick={() => onInspectNumber(item.number)}
                      className="hover:bg-[var(--surface-muted)] cursor-pointer"
                    >
                      <td className="py-2 text-center font-black text-[var(--text-primary)]">
                        #{idx + 1}
                      </td>
                      <td className="py-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[var(--surface-muted)] font-black text-xs text-[var(--text-primary)] border border-[var(--border)]">
                          {item.number}
                        </span>
                      </td>
                      <td className="py-2 text-center font-black text-emerald-600 dark:text-emerald-400">
                        {item.frequency} lần
                      </td>
                      <td className="py-2 text-center font-bold text-[var(--text-primary)]">
                        {item.percentage}%
                      </td>
                      <td className="py-2 text-center font-bold text-[var(--text-primary)]">
                        {item.daysAppeared} kỳ
                      </td>
                      <td className="py-2 text-center font-bold text-[var(--text-primary)]">
                        {item.lastAppearance ? toDDMMYYYYDash(item.lastAppearance) : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* COLD NUMBERS */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">❄️</span>
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase">
                  Top 20 LOTO Ít Về Nhất (COLD)
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-[var(--text-primary)] border-b border-[var(--border)] pb-2 select-none">
                    <th className="pb-2.5 font-extrabold text-center">Hạng</th>
                    <th className="pb-2.5 font-extrabold">Số</th>
                    <th className="pb-2.5 font-extrabold text-center">Số lượt</th>
                    <th className="pb-2.5 font-extrabold text-center">Gan hiện tại</th>
                    <th className="pb-2.5 font-extrabold text-center">Gan Max</th>
                    <th className="pb-2.5 font-extrabold text-center">Gần nhất</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {coldNumbers.map((item, idx) => (
                    <tr
                      key={item.number}
                      onClick={() => onInspectNumber(item.number)}
                      className="hover:bg-[var(--surface-muted)] cursor-pointer"
                    >
                      <td className="py-2 text-center font-black text-[var(--text-primary)]">
                        #{idx + 1}
                      </td>
                      <td className="py-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[var(--surface-muted)] font-black text-xs text-[var(--text-primary)] border border-[var(--border)]">
                          {item.number}
                        </span>
                      </td>
                      <td className="py-2 text-center font-bold text-[var(--text-secondary)]">
                        {item.frequency} lần
                      </td>
                      <td className="py-2 text-center font-bold text-rose-600 dark:text-rose-400">
                        {item.currentGap} kỳ
                      </td>
                      <td className="py-2 text-center font-bold text-[var(--text-primary)]">
                        {item.maxGap} kỳ
                      </td>
                      <td className="py-2 text-center font-bold text-[var(--text-primary)]">
                        {item.lastAppearance ? toDDMMYYYYDash(item.lastAppearance) : 'Chưa về'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* STREAKS VIEW */
        <div className="space-y-4">
          {/* Active Streaks Widget */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-xs">
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide mb-2.5 pb-1.5 border-b border-[var(--border)] flex items-center gap-1.5">
              <span>⚡</span> LOTO Đang Trong Chuỗi Về Liên Tiếp (≥ 2 Kỳ Về Gần Nhất)
            </h3>

            {activeStreaks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {activeStreaks.map((s) => (
                  <button
                    key={s.number}
                    type="button"
                    onClick={() => onInspectNumber(s.number)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--surface-press)] border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
                  >
                    <span className="font-black text-base text-[var(--text-primary)]">
                      {s.number}
                    </span>
                    <div className="text-right">
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        ⚡ {s.currentStreak} kỳ liên tiếp
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        Kỷ lục: {s.longestStreak} kỳ
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-[var(--text-muted)]">
                Hiện không có số nào đang về liên tiếp ≥ 2 kỳ gần nhất.
              </div>
            )}
          </div>

          {/* Longest Streaks Table */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
            <div className="p-3 bg-[var(--surface-muted)] border-b border-[var(--border)] font-bold text-xs text-[var(--text-primary)]">
              BẢNG THỐNG KÊ CHUỖI VỀ DÀI NHẤT TRONG KỲ PHÂN TÍCH
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[var(--surface-muted)] text-[var(--text-secondary)] border-b border-[var(--border)]">
                    <th className="py-2.5 px-3 font-bold">Số LOTO</th>
                    <th className="py-2.5 px-3 font-bold text-center">Chuỗi Hiện Tại</th>
                    <th className="py-2.5 px-3 font-bold text-center">Chuỗi Dài Nhất</th>
                    <th className="py-2.5 px-3 font-bold text-center">Số lần về 2 kỳ liên tiếp</th>
                    <th className="py-2.5 px-3 font-bold text-center">Số lần về 3 kỳ liên tiếp</th>
                    <th className="py-2.5 px-3 font-bold text-center">Số lần về ≥ 4 kỳ liên tiếp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {longestStreaksList.map((s) => (
                    <tr
                      key={s.number}
                      onClick={() => onInspectNumber(s.number)}
                      className="hover:bg-[var(--surface-muted)] cursor-pointer"
                    >
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--surface-muted)] font-black text-sm text-[var(--text-primary)] border border-[var(--border)]">
                          {s.number}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {s.currentStreak >= 2 ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ⚡ {s.currentStreak} kỳ
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-black text-[var(--text-primary)]">
                        {s.longestStreak} kỳ
                      </td>
                      <td className="py-2.5 px-3 text-center text-[var(--text-secondary)]">
                        {s.streak2Count} lần
                      </td>
                      <td className="py-2.5 px-3 text-center text-[var(--text-secondary)]">
                        {s.streak3Count} lần
                      </td>
                      <td className="py-2.5 px-3 text-center text-[var(--text-secondary)]">
                        {s.streak4PlusCount} lần
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
