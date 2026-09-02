'use client';

import React, { useState } from 'react';
import type { GanNumberStat, NumberIntervalStat } from '@/app/lib/services/statistics-deep.service';
import { toDDMMYYYYDash } from '@/app/lib/date-utils';

interface GanTabProps {
  ganRanking: GanNumberStat[];
  intervals?: NumberIntervalStat[];
  onInspectNumber: (num: string) => void;
}

export default function GanTab({
  ganRanking,
  intervals = [],
  onInspectNumber,
}: GanTabProps) {
  const [viewMode, setViewMode] = useState<'gan' | 'intervals'>('gan');
  const [filterThreshold, setFilterThreshold] = useState<number>(0);

  const filteredGan = ganRanking.filter((item) => item.currentGap >= filterThreshold);

  return (
    <div className="space-y-4">
      {/* 1. SECTION HEADER & NEUTRAL DISCLAIMER */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              THỐNG KÊ LOTO GAN & KHOẢNG CÁCH CHU KỲ
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Phân tích số kỳ vắng mặt thực tế và chu kỳ lặp lại trong khoảng thời gian đã chọn.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[var(--surface-muted)] p-1 rounded-lg border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setViewMode('gan')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'gan'
                  ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Bảng Loto Gan
            </button>
            <button
              type="button"
              onClick={() => setViewMode('intervals')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'intervals'
                  ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Chu Kỳ Khoảng Cách
            </button>
          </div>
        </div>

        {/* Neutral statistical note */}
        <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-[11px] text-[var(--text-secondary)]">
          ℹ️ <strong className="text-[var(--text-primary)]">Lưu ý khách quan:</strong> Dữ liệu thể hiện khoảng cách số kỳ chưa về dựa trên thống kê thực tế từ các kỳ quay trước. Không đại diện cho quy luật bắt buộc hay cam kết kết quả trong tương lai.
        </div>
      </div>

      {viewMode === 'gan' ? (
        <>
          {/* Filter thresholds */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[var(--text-secondary)] font-medium">Lọc số kỳ gan:</span>
            {[
              { val: 0, label: 'Tất cả (00–99)' },
              { val: 5, label: 'Gan ≥ 5 kỳ' },
              { val: 10, label: 'Gan ≥ 10 kỳ' },
              { val: 15, label: 'Gan ≥ 15 kỳ' },
            ].map((th) => (
              <button
                key={th.val}
                type="button"
                onClick={() => setFilterThreshold(th.val)}
                className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap cursor-pointer ${
                  filterThreshold === th.val
                    ? 'bg-[var(--text-primary)] text-[var(--canvas)]'
                    : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-muted)]'
                }`}
              >
                {th.label}
              </button>
            ))}
          </div>

          {/* GAN TABLE */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[var(--surface-muted)] text-[var(--text-primary)] border-b border-[var(--border)]">
                    <th className="py-3 px-3 font-extrabold text-center">Hạng</th>
                    <th className="py-3 px-3 font-extrabold">Số LOTO</th>
                    <th className="py-3 px-3 font-extrabold text-center">Gan Hiện Tại</th>
                    <th className="py-3 px-3 font-extrabold text-center">Gan Trung Bình</th>
                    <th className="py-3 px-3 font-extrabold text-center">Gan Cực Đại (Max)</th>
                    <th className="py-3 px-3 font-extrabold text-center">Lần Về Gần Nhất</th>
                    <th className="py-3 px-3 font-extrabold text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredGan.map((item) => {
                    const maxVal = Math.max(item.maxGap, 15);
                    const currentPercent = Math.min(100, Math.round((item.currentGap / maxVal) * 100));

                    return (
                      <tr
                        key={item.number}
                        onClick={() => onInspectNumber(item.number)}
                        className="hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
                      >
                        <td className="py-2.5 px-3 text-center font-black text-[var(--text-primary)]">
                          #{item.rank}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--surface-muted)] font-black text-sm text-[var(--text-primary)] border border-[var(--border)]">
                            {item.number}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex flex-col items-center">
                            <span
                              className={`text-sm font-black ${
                                item.currentGap >= 10
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : item.currentGap >= 5
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-[var(--text-primary)]'
                              }`}
                            >
                              {item.currentGap} kỳ
                            </span>
                            <div className="w-16 h-1.5 rounded-full bg-[var(--surface-muted)] overflow-hidden mt-1">
                              <div
                                className={`h-full ${
                                  item.currentGap >= 10
                                    ? 'bg-rose-500'
                                    : item.currentGap >= 5
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${currentPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center text-[var(--text-primary)] font-bold">
                          {item.avgGap} kỳ
                        </td>
                        <td className="py-2.5 px-3 text-center text-[var(--text-primary)] font-bold">
                          {item.maxGap} kỳ
                        </td>
                        <td className="py-2.5 px-3 text-center text-[var(--text-primary)] font-bold">
                          {item.lastAppearance ? toDDMMYYYYDash(item.lastAppearance) : 'Chưa về'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.statusLevel === 'extreme'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : item.statusLevel === 'high'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : item.statusLevel === 'moderate'
                                ? 'bg-yellow-100 text-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-300'
                                : 'bg-[var(--surface-muted)] text-[var(--text-primary)]'
                            }`}
                          >
                            {item.statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* APPEARANCE INTERVALS / CYCLES TABLE */
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[var(--surface-muted)] text-[var(--text-primary)] border-b border-[var(--border)]">
                  <th className="py-3 px-3 font-extrabold">Số LOTO</th>
                  <th className="py-3 px-3 font-extrabold text-center">Số Lần Xuất Hiện</th>
                  <th className="py-3 px-3 font-extrabold text-center">Khoảng Cách Min</th>
                  <th className="py-3 px-3 font-extrabold text-center">Khoảng Cách TB</th>
                  <th className="py-3 px-3 font-extrabold text-center">Khoảng Cách Max</th>
                  <th className="py-3 px-3 font-extrabold text-center">Khoảng Cách Hiện Tại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {intervals.map((item) => (
                  <tr
                    key={item.number}
                    onClick={() => onInspectNumber(item.number)}
                    className="hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--surface-muted)] font-black text-sm text-[var(--text-primary)] border border-[var(--border)]">
                        {item.number}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-[var(--text-primary)]">
                      {item.appearancesCount}
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                      {item.minInterval} kỳ
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-[var(--text-secondary)]">
                      {item.avgInterval} kỳ
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-rose-600 dark:text-rose-400">
                      {item.maxInterval} kỳ
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-[var(--text-primary)]">
                      {item.currentInterval} kỳ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
