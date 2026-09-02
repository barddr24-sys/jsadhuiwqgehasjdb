'use client';

import React, { useState, useEffect } from 'react';
import type { NumberDetailSearchResult } from '@/app/lib/services/statistics-deep.service';
import { toDDMMYYYYDash } from '@/app/lib/date-utils';

interface NumberSearchModalProps {
  initialNumber?: string;
  selectedRange: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectAnotherNumber: (num: string) => void;
}

export default function NumberSearchModal({
  initialNumber = '27',
  selectedRange,
  isOpen,
  onClose,
  onSelectAnotherNumber,
}: NumberSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialNumber);
  const [prevInitialNumber, setPrevInitialNumber] = useState(initialNumber);
  if (initialNumber !== prevInitialNumber) {
    setPrevInitialNumber(initialNumber);
    setSearchQuery(initialNumber);
  }

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<NumberDetailSearchResult | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchSearch(num: string) {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/v1/xsmb/statistics/search?number=${encodeURIComponent(num)}&range=${encodeURIComponent(selectedRange)}`,
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('Search failed');
        const json = await res.json();
        if (isMounted) {
          setData(json.data);
        }
      } catch (err) {
        console.error('[NumberSearchModal] fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    const normalized = searchQuery.padStart(2, '0').slice(-2);
    if (/^\d{2}$/.test(normalized)) {
      fetchSearch(normalized);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, searchQuery, selectedRange]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-xl w-full p-4 sm:p-5 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. HEADER & SEARCH BAR */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] text-white font-black text-xl flex items-center justify-center shadow-xs">
              {searchQuery.padStart(2, '0').slice(-2)}
            </span>
            <div>
              <h2 className="text-sm font-black text-[var(--text-primary)]">
                TRA CỨU CHI TIẾT SỐ {searchQuery.padStart(2, '0').slice(-2)}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Kỳ phân tích: {data?.range.label || selectedRange} ({data?.range.dateRangeDisplay})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Input to quickly switch number */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Đổi số cần tra cứu:</span>
          <div className="flex items-center gap-1.5 flex-1 max-w-[140px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setSearchQuery(val);
                if (val.length === 2) {
                  onSelectAnotherNumber(val);
                }
              }}
              placeholder="00-99"
              maxLength={2}
              className="w-full px-2.5 py-1 text-center font-bold text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)] space-y-2">
            <div className="inline-block w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
            <div>Đang tổng hợp dữ liệu số {searchQuery}...</div>
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* 2. LOTO SECTION */}
            <div className="bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-primary)] uppercase">
                  <span>🎯</span> THỐNG KÊ LOTO (27 GIẢI)
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  Hạng #{data.loto.rank} về nhiều
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded bg-[var(--surface)]">
                  <div className="text-[10px] text-[var(--text-muted)]">Tổng số lần về</div>
                  <div className="text-base font-black text-[var(--text-primary)] mt-0.5">
                    {data.loto.frequency} lần
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">{data.loto.percentage}%</div>
                </div>

                <div className="p-2 rounded bg-[var(--surface)]">
                  <div className="text-[10px] text-[var(--text-muted)]">Số kỳ xuất hiện</div>
                  <div className="text-base font-black text-[var(--text-primary)] mt-0.5">
                    {data.loto.daysAppeared} kỳ
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">kỳ quay</div>
                </div>

                <div className="p-2 rounded bg-[var(--surface)]">
                  <div className="text-[10px] text-[var(--text-muted)]">  hiện tại</div>
                  <div className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">
                    {data.loto.currentGap} kỳ
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">TB: {data.loto.avgGap}k</div>
                </div>

                <div className="p-2 rounded bg-[var(--surface)]">
                  <div className="text-[10px] text-[var(--text-muted)]">Xu hướng</div>
                  <div className="text-xs font-bold text-[var(--accent-primary)] mt-1">
                    {data.loto.trendLabel}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    {data.loto.streak >= 2 ? `⚡ ${data.loto.streak}k liên tiếp` : `Max ${data.loto.longestStreak}k`}
                  </div>
                </div>
              </div>

              {/* Loto Appearances Timeline */}
              <div className="pt-2 border-t border-[var(--border)]">
                <div className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">
                  Lịch sử xuất hiện các kỳ gần nhất:
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {data.loto.appearances
                    .filter((a) => a.appeared)
                    .map((app) => (
                      <div
                        key={app.date}
                        className="p-1.5 rounded bg-[var(--surface)] flex items-center justify-between text-[11px]"
                      >
                        <span className="font-semibold text-[var(--text-primary)]">
                          {toDDMMYYYYDash(app.date)} ({app.dayOfWeek})
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {app.count} nháy
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            ({app.prizes.map((p) => p.tierLabel).join(', ')})
                          </span>
                        </div>
                      </div>
                    ))}
                  {data.loto.frequency === 0 && (
                    <div className="py-2 text-center text-xs text-[var(--text-muted)]">
                      Chưa về lần nào trong khoảng thời gian này.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. REVERSE NUMBER & TOP PARTNER PAIRS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Reverse Number */}
              <div className="bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl p-3 space-y-2">
                <div className="font-bold text-xs text-[var(--text-primary)] flex items-center justify-between border-b border-[var(--border)] pb-1.5">
                  <span>↔ SỐ ĐẢO: {data.reverseNumber.reverseNumber}</span>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAnotherNumber(data.reverseNumber.reverseNumber);
                    }}
                    className="text-[10px] text-[var(--accent-primary)] font-bold hover:underline cursor-pointer"
                  >
                    Xem số {data.reverseNumber.reverseNumber} →
                  </button>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Lượt về số đảo ({data.reverseNumber.reverseNumber}):</span>
                    <span className="font-bold text-[var(--text-primary)]">{data.reverseNumber.frequency} lần</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Tổng lượt cặp {data.number} ↔ {data.reverseNumber.reverseNumber}:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">{data.reverseNumber.combinedFrequency} lần</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Số kỳ cùng về trong 1 ngày:</span>
                    <span className="font-bold text-[var(--text-primary)]">{data.reverseNumber.coOccurrenceCount} kỳ</span>
                  </div>
                </div>
              </div>

              {/* Top Partner Pairs */}
              <div className="bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl p-3 space-y-2">
                <div className="font-bold text-xs text-[var(--text-primary)] border-b border-[var(--border)] pb-1.5">
                  🤝 CẶP CÙNG VỀ NHIỀU NHẤT
                </div>
                <div className="space-y-1 text-[11px]">
                  {data.topCoOccurringPairs.slice(0, 3).map((pair) => (
                    <div key={pair.partnerNumber} className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)]">
                        Đi cùng số <strong className="text-[var(--text-primary)]">{pair.partnerNumber}</strong>:
                      </span>
                      <span className="font-bold text-[var(--accent-primary)]">
                        {pair.coFrequency} kỳ ({pair.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. SPECIAL PRIZE SECTION (ISOLATED) */}
            <div className="bg-[var(--prize-accent-bg)] border border-[var(--prize-accent-border)] rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-[var(--prize-accent-border)] pb-2">
                <div className="flex items-center gap-1.5 font-black text-xs text-[var(--prize-accent)] uppercase">
                  <span>👑</span> GIẢI ĐẶC BIỆT — 2 SỐ CUỐI
                </div>
                <span className="text-[11px] font-bold text-[var(--prize-accent)]">
                  {data.specialPrize.frequency} lần về ĐB
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded bg-white/70 dark:bg-black/40">
                  <div className="text-[10px] text-[var(--text-muted)]">Số lần về ĐB</div>
                  <div className="text-base font-black text-[var(--prize-accent)] mt-0.5">
                    {data.specialPrize.frequency} lần
                  </div>
                </div>
                <div className="p-2 rounded bg-white/70 dark:bg-black/40">
                  <div className="text-[10px] text-[var(--text-muted)]">  ĐB hiện tại</div>
                  <div className="text-base font-black text-[var(--text-primary)] mt-0.5">
                    {data.specialPrize.currentGap} kỳ
                  </div>
                </div>
                <div className="p-2 rounded bg-white/70 dark:bg-black/40">
                  <div className="text-[10px] text-[var(--text-muted)]">  ĐB Max</div>
                  <div className="text-base font-black text-[var(--text-primary)] mt-0.5">
                    {data.specialPrize.maxGap} kỳ
                  </div>
                </div>
              </div>

              {data.specialPrize.occurrences.length > 0 && (
                <div className="text-[11px] space-y-1 pt-1">
                  <div className="text-[10px] font-bold text-[var(--text-secondary)]">Các ngày về ĐB:</div>
                  {data.specialPrize.occurrences.map((occ) => (
                    <div key={occ.date} className="flex justify-between font-semibold text-[var(--text-primary)]">
                      <span>{toDDMMYYYYDash(occ.date)}</span>
                      <span className="font-black text-[var(--prize-accent)]">{occ.fullNumber}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
