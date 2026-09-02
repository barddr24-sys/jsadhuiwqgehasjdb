'use client';

import React from 'react';
import type { StatisticsOverviewDTO } from '@/app/lib/services/statistics-deep.service';
import { toDDMMYYYYDash } from '@/app/lib/date-utils';

interface OverviewTabProps {
  data: StatisticsOverviewDTO;
  onInspectNumber: (num: string) => void;
  onNavigateTab: (tabKey: any) => void;
}

export default function OverviewTab({
  data,
  onInspectNumber,
  onNavigateTab,
}: OverviewTabProps) {
  const {
    drawCount,
    totalOccurrences,
    uniqueNumbersCount,
    averagePerDraw,
    mostFrequentLoto,
    leastFrequentLoto,
    highestGanLoto,
    specialPrizeHighlights,
    topPairs,
    headTail,
    parity,
    lowHigh,
    dailyBreakdown,
  } = data;

  return (
    <div className="space-y-4">
      {/* 1. KEY METRICS GRID (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 shadow-xs">
          <div className="text-xs font-bold text-[var(--text-secondary)]">Số kỳ quay</div>
          <div className="text-2xl font-black text-[var(--text-primary)] mt-1">{drawCount}</div>
          <div className="text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5">Kỳ phân tích</div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 shadow-xs">
          <div className="text-xs font-bold text-[var(--text-secondary)]">Tổng lượt LOTO</div>
          <div className="text-2xl font-black text-[var(--text-primary)] mt-1">{totalOccurrences}</div>
          <div className="text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5">~{averagePerDraw} lượt/kỳ</div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 shadow-xs">
          <div className="text-xs font-bold text-[var(--text-secondary)]">Số LOTO khác nhau</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {uniqueNumbersCount}/100
          </div>
          <div className="text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5">Đã xuất hiện</div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 shadow-xs">
          <div className="text-xs font-bold text-[var(--text-secondary)]">Gan cao nhất</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {highestGanLoto[0]?.number || '--'}
          </div>
          <div className="text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5">
            {highestGanLoto[0] ? `${highestGanLoto[0].currentGap} kỳ chưa về` : 'Không có'}
          </div>
        </div>
      </div>

      {/* 2. TOP 4 LEADERBOARD HIGHLIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Most Frequent LOTO */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🔥</span>
              <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wide">
                LOTO Về Nhiều Nhất
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('frequency')}
              className="text-xs font-bold text-[var(--accent-primary)] hover:underline cursor-pointer"
            >
              Xem tất cả →
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {mostFrequentLoto.map((item, idx) => (
              <button
                key={item.number}
                type="button"
                onClick={() => onInspectNumber(item.number)}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--surface-press)] border border-[var(--border)] transition-all cursor-pointer"
              >
                <span className="text-xs font-black text-[var(--accent-primary)]">
                  #{idx + 1}
                </span>
                <span className="text-lg font-black text-[var(--text-primary)] my-0.5">
                  {item.number}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {item.frequency} lần
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Highest Gan / Overdue */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">⏳</span>
              <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wide">
                LOTO Đang Gan Cao Nhất
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('gan')}
              className="text-xs font-bold text-[var(--accent-primary)] hover:underline cursor-pointer"
            >
              Xem bảng gan →
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {highestGanLoto.map((item, idx) => (
            <button
              key={item.number}
              type="button"
              onClick={() => onInspectNumber(item.number)}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--surface-press)] border border-[var(--border)] transition-all cursor-pointer"
            >
              <span className="text-xs font-black text-rose-600 dark:text-rose-400">#{idx + 1}</span>
              <span className="text-lg font-black text-[var(--text-primary)] my-0.5">
                {item.number}
              </span>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                {item.currentGap} kỳ
              </span>
            </button>
            ))}
          </div>
        </div>

        {/* Least Frequent LOTO */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">❄️</span>
              <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wide">
                LOTO Ít Xuất Hiện
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('frequency')}
              className="text-xs font-bold text-[var(--accent-primary)] hover:underline cursor-pointer"
            >
              Chi tiết →
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {leastFrequentLoto.map((item) => (
              <button
                key={item.number}
                type="button"
                onClick={() => onInspectNumber(item.number)}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--surface-press)] border border-[var(--border)] transition-all cursor-pointer"
              >
                <span className="text-lg font-black text-[var(--text-primary)]">
                  {item.number}
                </span>
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  {item.frequency} lần
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {item.currentGap}k
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Special Prize 2 Last Digits Highlights */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">👑</span>
              <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wide">
                Giải Đặc Biệt 2 Số Cuối
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('special')}
              className="text-xs font-bold text-[var(--accent-primary)] hover:underline cursor-pointer"
            >
              Toàn bộ ĐB →
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {specialPrizeHighlights.length > 0 ? (
              specialPrizeHighlights.map((item) => (
                <button
                  key={item.number}
                  type="button"
                  onClick={() => onInspectNumber(item.number)}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-[var(--prize-accent-bg)] hover:brightness-95 border border-[var(--prize-accent-border)] transition-all cursor-pointer"
                >
                  <span className="text-lg font-black text-[var(--prize-accent)]">
                    {item.number}
                  </span>
                  <span className="text-xs font-bold text-[var(--prize-accent)]">
                    {item.frequency} lần
                  </span>
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)]">
                    {item.history[0]?.shortDate || '--'}
                  </span>
                </button>
              ))
            ) : (
              <div className="col-span-5 text-center py-3 text-xs font-semibold text-[var(--text-secondary)]">
                Chưa có dữ liệu kỳ quay
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. DIGIT & PARITY DISTRIBUTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Head / Tail breakdown */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-xs">
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide mb-2.5 pb-1.5 border-b border-[var(--border)]">
            Đầu / Đuôi Nổi Bật
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-muted)]">
              <span className="text-[var(--text-secondary)]">Đầu về nhiều nhất:</span>
              <span className="font-bold text-[var(--text-primary)]">
                Đầu {headTail.mostFrequentHead.digit} ({headTail.mostFrequentHead.frequency} lần)
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-muted)]">
              <span className="text-[var(--text-secondary)]">Đầu về ít nhất:</span>
              <span className="font-bold text-[var(--text-secondary)]">
                Đầu {headTail.leastFrequentHead.digit} ({headTail.leastFrequentHead.frequency} lần)
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-muted)]">
              <span className="text-[var(--text-secondary)]">Đuôi về nhiều nhất:</span>
              <span className="font-bold text-[var(--text-primary)]">
                Đuôi {headTail.mostFrequentTail.digit} ({headTail.mostFrequentTail.frequency} lần)
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-muted)]">
              <span className="text-[var(--text-secondary)]">Đuôi về ít nhất:</span>
              <span className="font-bold text-[var(--text-secondary)]">
                Đuôi {headTail.leastFrequentTail.digit} ({headTail.leastFrequentTail.frequency} lần)
              </span>
            </div>
          </div>
        </div>

        {/* Parity (Even / Odd) */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-xs">
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide mb-2.5 pb-1.5 border-b border-[var(--border)]">
            Tỷ Lệ Chẵn / Lẻ
          </h3>

          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-sky-600 dark:text-sky-400">
                  Chẵn: {parity.evenCount} ({parity.evenPercentage}%)
                </span>
                <span className="text-amber-600 dark:text-amber-400">
                  Lẻ: {parity.oddCount} ({parity.oddPercentage}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[var(--surface-muted)] overflow-hidden flex">
                <div
                  className="bg-sky-500 h-full transition-all"
                  style={{ width: `${parity.evenPercentage}%` }}
                />
                <div
                  className="bg-amber-500 h-full transition-all"
                  style={{ width: `${parity.oddPercentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
              <div className="p-1.5 rounded bg-[var(--surface-muted)] flex justify-between">
                <span className="text-[var(--text-secondary)]">Chẵn - Chẵn:</span>
                <span className="font-bold text-[var(--text-primary)]">{parity.evenEvenCount}</span>
              </div>
              <div className="p-1.5 rounded bg-[var(--surface-muted)] flex justify-between">
                <span className="text-[var(--text-secondary)]">Chẵn - Lẻ:</span>
                <span className="font-bold text-[var(--text-primary)]">{parity.evenOddCount}</span>
              </div>
              <div className="p-1.5 rounded bg-[var(--surface-muted)] flex justify-between">
                <span className="text-[var(--text-secondary)]">Lẻ - Chẵn:</span>
                <span className="font-bold text-[var(--text-primary)]">{parity.oddEvenCount}</span>
              </div>
              <div className="p-1.5 rounded bg-[var(--surface-muted)] flex justify-between">
                <span className="text-[var(--text-secondary)]">Lẻ - Lẻ:</span>
                <span className="font-bold text-[var(--text-primary)]">{parity.oddOddCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Low / High (00-49 vs 50-99) & Top Pairs */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-xs">
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide mb-2.5 pb-1.5 border-b border-[var(--border)]">
            Tỷ Lệ Thấp / Cao (00–49 vs 50–99)
          </h3>

          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-indigo-600 dark:text-indigo-400">
                  Thấp (00-49): {lowHigh.lowCount} ({lowHigh.lowPercentage}%)
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  Cao (50-99): {lowHigh.highCount} ({lowHigh.highPercentage}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[var(--surface-muted)] overflow-hidden flex">
                <div
                  className="bg-indigo-500 h-full transition-all"
                  style={{ width: `${lowHigh.lowPercentage}%` }}
                />
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${lowHigh.highPercentage}%` }}
                />
              </div>
            </div>

            <div className="pt-1.5 border-t border-[var(--border)]">
              <div className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">
                Cặp số hay về cùng nhau nhất:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topPairs.slice(0, 3).map((p) => (
                  <span
                    key={p.pairLabel}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--surface-muted)] text-[11px] font-semibold text-[var(--text-primary)] border border-[var(--border)]"
                  >
                    <span>{p.pairLabel}</span>
                    <span className="text-[var(--accent-primary)] font-bold">({p.frequency}k)</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DAILY ACTIVITY TIMELINE (Last few days) */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-xs">
        <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide mb-2.5 pb-1.5 border-b border-[var(--border)]">
          Nhật Ký Kỳ Quay Gần Nhất
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-[var(--text-muted)] border-b border-[var(--border)]">
                <th className="pb-2 font-semibold">Ngày</th>
                <th className="pb-2 font-semibold text-center">Thứ</th>
                <th className="pb-2 font-semibold text-center">Tổng LOTO</th>
                <th className="pb-2 font-semibold text-center">Số khác nhau</th>
                <th className="pb-2 font-semibold text-center">ĐB 2 số cuối</th>
                <th className="pb-2 font-semibold text-center">Chẵn / Lẻ</th>
                <th className="pb-2 font-semibold text-center">Thấp / Cao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {dailyBreakdown.slice(0, 7).map((d) => (
                <tr key={d.date} className="hover:bg-[var(--surface-muted)]">
                  <td className="py-2 font-semibold text-[var(--text-primary)]">
                    {d.shortDate} ({toDDMMYYYYDash(d.date)})
                  </td>
                  <td className="py-2 text-center text-[var(--text-secondary)]">{d.dayOfWeek}</td>
                  <td className="py-2 text-center font-semibold text-[var(--text-primary)]">
                    {d.totalPrizes}
                  </td>
                  <td className="py-2 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                    {d.uniqueNumbers}
                  </td>
                  <td className="py-2 text-center">
                    <span className="inline-block px-2 py-0.5 rounded bg-[var(--prize-accent-bg)] text-[var(--prize-accent)] font-black">
                      {d.specialPrizeTail}
                    </span>
                  </td>
                  <td className="py-2 text-center text-[var(--text-secondary)]">
                    {d.evenCount} / {d.oddCount}
                  </td>
                  <td className="py-2 text-center text-[var(--text-secondary)]">
                    {d.lowCount} / {d.highCount}
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
