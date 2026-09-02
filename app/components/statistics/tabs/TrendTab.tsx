'use client';

import React, { useState } from 'react';
import type { LotoNumberStat, TrendType } from '@/app/lib/services/statistics-deep.service';

interface TrendTabProps {
  allNumbers: LotoNumberStat[];
  onInspectNumber: (num: string) => void;
}

export default function TrendTab({ allNumbers, onInspectNumber }: TrendTabProps) {
  const [selectedTrend, setSelectedTrend] = useState<TrendType | 'all'>('all');

  const increasing = allNumbers.filter((n) => n.trend === 'increasing');
  const activeRecent = allNumbers.filter((n) => n.trend === 'recently_active');
  const stable = allNumbers.filter((n) => n.trend === 'stable');
  const decreasing = allNumbers.filter((n) => n.trend === 'decreasing');
  const inactiveRecent = allNumbers.filter((n) => n.trend === 'recently_inactive');

  const filteredNumbers = selectedTrend === 'all'
    ? allNumbers
    : allNumbers.filter((n) => n.trend === selectedTrend);

  return (
    <div className="space-y-4">
      {/* 1. HEADER & FORMULA NOTE */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-xs">
        <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
          PHÂN TÍCH XU HƯỚNG LOTO THEO CÔNG THỨC TOÁN HỌC
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          So sánh tần suất xuất hiện nửa kỳ gần nhất so với nửa kỳ trước đó để phân loại xu hướng vận động thực tế.
        </p>
      </div>

      {/* 2. 5 TREND CATEGORY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button
          type="button"
          onClick={() => setSelectedTrend(selectedTrend === 'increasing' ? 'all' : 'increasing')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${selectedTrend === 'increasing'
              ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-950/50 dark:border-emerald-500'
              : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-muted)]'
            }`}
        >
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span>↑</span> Xu hướng tăng
          </div>
          <div className="text-xl font-black text-[var(--text-primary)] mt-1">
            {increasing.length} số
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Tần suất gần tăng mạnh</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTrend(selectedTrend === 'recently_active' ? 'all' : 'recently_active')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${selectedTrend === 'recently_active'
              ? 'bg-amber-50 border-amber-500 dark:bg-amber-950/50 dark:border-amber-500'
              : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-muted)]'
            }`}
        >
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <span>⚡</span> Mới về liên tiếp
          </div>
          <div className="text-xl font-black text-[var(--text-primary)] mt-1">
            {activeRecent.length} số
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Về liên tục 2+ kỳ gần</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTrend(selectedTrend === 'stable' ? 'all' : 'stable')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${selectedTrend === 'stable'
              ? 'bg-sky-50 border-sky-500 dark:bg-sky-950/50 dark:border-sky-500'
              : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-muted)]'
            }`}
        >
          <div className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
            <span>→</span> Ổn định
          </div>
          <div className="text-xl font-black text-[var(--text-primary)] mt-1">
            {stable.length} số
          </div>
          <div className="text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5">Tần suất đều đặn</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTrend(selectedTrend === 'decreasing' ? 'all' : 'decreasing')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${selectedTrend === 'decreasing'
              ? 'bg-rose-50 border-rose-500 dark:bg-rose-950/50 dark:border-rose-500'
              : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-muted)]'
            }`}
        >
          <div className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <span>↓</span> Xu hướng giảm
          </div>
          <div className="text-xl font-black text-[var(--text-primary)] mt-1">
            {decreasing.length} số
          </div>
          <div className="text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5">Tần suất gần giảm</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTrend(selectedTrend === 'recently_inactive' ? 'all' : 'recently_inactive')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${selectedTrend === 'recently_inactive'
              ? 'bg-slate-100 border-slate-500 dark:bg-slate-800 dark:border-slate-400'
              : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-muted)]'
            }`}
        >
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <span>💤</span> Đang chững
          </div>
          <div className="text-xl font-black text-[var(--text-primary)] mt-1">
            {inactiveRecent.length} số
          </div>
          <div className="text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5">Vắng mặt nhiều kỳ gần</div>
        </button>
      </div>

      {/* 3. TREND NUMBERS TABLE */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
        <div className="p-3 bg-[var(--surface-muted)] border-b border-[var(--border)] flex items-center justify-between text-xs font-bold">
          <span>DANH SÁCH SỐ THEO XU HƯỚNG ({filteredNumbers.length} số)</span>
          {selectedTrend !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedTrend('all')}
              className="text-[var(--accent-primary)] hover:underline cursor-pointer"
            >
              Xem tất cả →
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[var(--surface-muted)] text-[var(--text-primary)] border-b border-[var(--border)]">
                <th className="py-3 px-3 font-extrabold">Số LOTO</th>
                <th className="py-3 px-3 font-extrabold text-center">Tổng lượt</th>
                <th className="py-3 px-3 font-extrabold text-center">Lượt nửa kỳ gần</th>
                <th className="py-3 px-3 font-extrabold text-center">Gan hiện tại</th>
                <th className="py-3 px-3 font-extrabold text-center">Chuỗi hiện tại</th>
                <th className="py-3 px-3 font-extrabold text-center">Phân loại xu hướng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredNumbers.map((item) => (
                <tr
                  key={item.number}
                  onClick={() => onInspectNumber(item.number)}
                  className="hover:bg-[var(--surface-muted)] cursor-pointer"
                >
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--surface-muted)] font-black text-sm text-[var(--text-primary)] border border-[var(--border)]">
                      {item.number}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-[var(--text-primary)]">
                    {item.frequency} lần
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {item.recentFrequency} lần
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-[var(--text-primary)]">
                    {item.currentGap} kỳ
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.streak >= 2 ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ⚡ {item.streak} kỳ
                      </span>
                    ) : (
                      <span className="text-[var(--text-secondary)] font-semibold">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${item.trend === 'increasing'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : item.trend === 'decreasing'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : item.trend === 'recently_active'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : item.trend === 'recently_inactive'
                                ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                : 'bg-[var(--surface-muted)] text-[var(--text-secondary)]'
                        }`}
                    >
                      {item.trend === 'increasing' && '↑ Tăng'}
                      {item.trend === 'decreasing' && '↓ Giảm'}
                      {item.trend === 'recently_active' && '⚡ Mới về liên tiếp'}
                      {item.trend === 'recently_inactive' && '💤 Đang chững'}
                      {item.trend === 'stable' && '→ Ổn định'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
