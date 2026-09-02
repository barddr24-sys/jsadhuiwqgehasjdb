'use client';

import React, { useState, useEffect } from 'react';
import type { PeriodComparisonResponse } from '@/app/lib/services/statistics-deep.service';

interface ComparisonModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInspectNumber: (num: string) => void;
}

const COMPARISON_OPTIONS = [
  { keyA: '3days', keyB: '7days', label: '3 Ngày vs 7 Ngày' },
  { keyA: '7days', keyB: '30days', label: '7 Ngày vs 30 Ngày (Mặc định)' },
  { keyA: '14days', keyB: '30days', label: '14 Ngày vs 30 Ngày' },
  { keyA: '30days', keyB: '90days', label: '30 Ngày vs 90 Ngày' },
];

export default function ComparisonModeModal({
  isOpen,
  onClose,
  onInspectNumber,
}: ComparisonModeModalProps) {
  const [selectedPairIndex, setSelectedPairIndex] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PeriodComparisonResponse | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'rising' | 'falling'>('all');

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const pair = COMPARISON_OPTIONS[selectedPairIndex];

    async function fetchComparison() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/v1/xsmb/statistics/compare?rangeA=${pair.keyA}&rangeB=${pair.keyB}`,
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('Compare failed');
        const json = await res.json();
        if (isMounted) {
          setData(json.data);
        }
      } catch (err) {
        console.error('[ComparisonModeModal] fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchComparison();

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedPairIndex]);

  if (!isOpen) return null;

  const filteredItems = (data?.comparison || []).filter((item) => {
    if (filterStatus === 'rising') return item.status === 'rising';
    if (filterStatus === 'falling') return item.status === 'falling';
    return true;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-2xl w-full p-4 sm:p-5 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div>
            <h2 className="text-sm font-black text-[var(--text-primary)] uppercase flex items-center gap-1.5">
              <span>⚖️</span> SO SÁNH BIẾN ĐỘNG HAI GIAI ĐOẠN
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              So sánh thứ hạng và tần suất giữa 2 khoảng thời gian để phát hiện số bứt phá hoặc đang chững.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* 2. PAIR SELECTOR */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          {COMPARISON_OPTIONS.map((opt, idx) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setSelectedPairIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedPairIndex === idx
                  ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                  : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-press)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 3. FILTER CHIPS */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)] text-xs">
          <div className="flex items-center gap-1">
            {[
              { key: 'all', label: 'Tất cả 100 số' },
              { key: 'rising', label: '🔥 Đang bứt phá (Tăng hạng)' },
              { key: 'falling', label: '❄️ Đang chững (Giảm hạng)' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterStatus(f.key as any)}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                  filterStatus === f.key
                    ? 'bg-[var(--text-primary)] text-[var(--canvas)]'
                    : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-press)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-[var(--text-muted)]">{filteredItems.length} số</span>
        </div>

        {/* 4. COMPARISON TABLE */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)] space-y-2">
            <div className="inline-block w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
            <div>Đang tính toán so sánh biến động...</div>
          </div>
        ) : data ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[var(--surface-muted)] text-[var(--text-secondary)] border-b border-[var(--border)]">
                    <th className="py-2.5 px-3 font-bold">Số LOTO</th>
                    <th className="py-2.5 px-3 font-bold text-center">
                      {data.periodA.label} (Lượt / Hạng)
                    </th>
                    <th className="py-2.5 px-3 font-bold text-center">
                      {data.periodB.label} (Lượt / Hạng)
                    </th>
                    <th className="py-2.5 px-3 font-bold text-center">Biến Động Hạng</th>
                    <th className="py-2.5 px-3 font-bold text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.number}
                      onClick={() => {
                        onInspectNumber(item.number);
                        onClose();
                      }}
                      className="hover:bg-[var(--surface-muted)] cursor-pointer"
                    >
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--surface-muted)] font-black text-sm text-[var(--text-primary)] border border-[var(--border)]">
                          {item.number}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-bold text-[var(--text-primary)]">
                          {item.periodAFreq} lần
                        </span>
                        <span className="text-[var(--text-muted)] ml-1">
                          (#{item.periodARank})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-bold text-[var(--text-primary)]">
                          {item.periodBFreq} lần
                        </span>
                        <span className="text-[var(--text-muted)] ml-1">
                          (#{item.periodBRank})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-black ${
                            item.rankDelta > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : item.rankDelta < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {item.rankDelta > 0 ? `+${item.rankDelta}` : item.rankDelta === 0 ? '0' : item.rankDelta}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'rising'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.status === 'falling'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-[var(--surface-muted)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {item.status === 'rising' && '↑ Bứt phá'}
                          {item.status === 'falling' && '↓ Đang chững'}
                          {item.status === 'stable' && '→ Ổn định'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
