'use client';

import React, { useState } from 'react';
import type { PairStat, ReversePairStat } from '@/app/lib/services/statistics-deep.service';
import { toDDMMYYYYDash } from '@/app/lib/date-utils';

interface PairsTabProps {
  topPairs: PairStat[];
  reversePairs: ReversePairStat[];
  onInspectNumber: (num: string) => void;
}

export default function PairsTab({
  topPairs,
  reversePairs,
  onInspectNumber,
}: PairsTabProps) {
  const [subTab, setSubTab] = useState<'co_occurring' | 'reverse'>('co_occurring');

  return (
    <div className="space-y-4">
      {/* 1. HEADER & SWITCHER */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
            PHÂN TÍCH CẶP SỐ & SỐ ĐẢO (27 ↔ 72)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Thống kê các cặp số cùng về trong 1 kỳ quay và mối liên hệ số đảo thực tế.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[var(--surface-muted)] p-1 rounded-lg border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setSubTab('co_occurring')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${subTab === 'co_occurring'
                ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
          >
            Cặp Số Cùng Về
          </button>
          <button
            type="button"
            onClick={() => setSubTab('reverse')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${subTab === 'reverse'
                ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
          >
            Cặp Số Đảo (↔)
          </button>
        </div>
      </div>

      {subTab === 'co_occurring' ? (
        /* CO-OCCURRING PAIRS TABLE */
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
          <div className="p-3 bg-[var(--surface-muted)] border-b border-[var(--border)] font-bold text-xs text-[var(--text-primary)]">
            TOP CẶP SỐ CÙNG XUẤT HIỆN NHIỀU NHẤT TRONG KỲ PHÂN TÍCH
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[var(--surface-muted)] text-[var(--text-primary)] border-b border-[var(--border)]">
                  <th className="py-3 px-3 font-extrabold text-center">Hạng</th>
                  <th className="py-3 px-3 font-extrabold">Cặp số</th>
                  <th className="py-3 px-3 font-extrabold text-center">Số kỳ cùng về</th>
                  <th className="py-3 px-3 font-extrabold text-center">Tỷ lệ</th>
                  <th className="py-3 px-3 font-extrabold text-center">Lần cùng về gần nhất</th>
                  <th className="py-3 px-3 font-extrabold text-center">Gan hiện tại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {topPairs.slice(0, 30).map((p, idx) => (
                  <tr key={p.pairLabel} className="hover:bg-[var(--surface-muted)]">
                    <td className="py-2.5 px-3 text-center font-black text-[var(--text-primary)]">
                      #{idx + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onInspectNumber(p.pair[0])}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--surface-press)] font-black text-sm text-[var(--text-primary)] border border-[var(--border)] cursor-pointer"
                        >
                          {p.pair[0]}
                        </button>
                        <span className="text-[var(--text-secondary)] font-bold">–</span>
                        <button
                          type="button"
                          onClick={() => onInspectNumber(p.pair[1])}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--surface-press)] font-black text-sm text-[var(--text-primary)] border border-[var(--border)] cursor-pointer"
                        >
                          {p.pair[1]}
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-sm text-emerald-600 dark:text-emerald-400">
                      {p.frequency} kỳ
                    </td>
                    <td className="py-2.5 px-3 text-center text-[var(--text-primary)] font-bold">
                      {p.percentage}%
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-[var(--text-primary)]">
                      {p.latestOccurrence ? toDDMMYYYYDash(p.latestOccurrence) : '--'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${p.currentGap === 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : p.currentGap >= 10
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-[var(--surface-muted)] text-[var(--text-primary)]'
                          }`}
                      >
                        {p.currentGap} kỳ
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* REVERSE PAIRS TABLE */
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
          <div className="p-3 bg-[var(--surface-muted)] border-b border-[var(--border)] font-bold text-xs text-[var(--text-primary)]">
            BẢNG THỐNG KÊ CẶP SỐ ĐẢO (27 ↔ 72)
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[var(--surface-muted)] text-[var(--text-primary)] border-b border-[var(--border)]">
                  <th className="py-3 px-3 font-extrabold">Cặp số đảo</th>
                  <th className="py-3 px-3 font-extrabold text-center">Lượt về số thuận</th>
                  <th className="py-3 px-3 font-extrabold text-center">Lượt về số đảo</th>
                  <th className="py-3 px-3 font-extrabold text-center">Tổng lượt về</th>
                  <th className="py-3 px-3 font-extrabold text-center">Số kỳ cùng về</th>
                  <th className="py-3 px-3 font-extrabold text-center">Gan số thuận</th>
                  <th className="py-3 px-3 font-extrabold text-center">Gan số đảo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {reversePairs.slice(0, 45).map((r) => (
                  <tr key={r.label} className="hover:bg-[var(--surface-muted)]">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onInspectNumber(r.numA)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--surface-press)] font-black text-sm text-[var(--text-primary)] border border-[var(--border)] cursor-pointer"
                        >
                          {r.numA}
                        </button>
                        <span className="text-[var(--text-secondary)] font-bold">↔</span>
                        <button
                          type="button"
                          onClick={() => onInspectNumber(r.numB)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--surface-press)] font-black text-sm text-[var(--text-primary)] border border-[var(--border)] cursor-pointer"
                        >
                          {r.numB}
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-[var(--text-primary)]">
                      {r.freqA} lần
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-[var(--text-primary)]">
                      {r.freqB} lần
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {r.combinedFreq} lần
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-[var(--accent-primary)]">
                      {r.coOccurrence} kỳ
                    </td>
                    <td className="py-2.5 px-3 text-center text-[var(--text-secondary)]">
                      {r.currentGapA} kỳ
                    </td>
                    <td className="py-2.5 px-3 text-center text-[var(--text-secondary)]">
                      {r.currentGapB} kỳ
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
