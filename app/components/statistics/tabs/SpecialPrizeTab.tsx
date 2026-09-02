'use client';

import React, { useState } from 'react';
import type {
  SpecialPrizeAnalysisResponse,
  SpecialPrizeNumberStat,
} from '@/app/lib/services/statistics-deep.service';
import { toDDMMYYYYDash } from '@/app/lib/date-utils';

interface SpecialPrizeTabProps {
  data: SpecialPrizeAnalysisResponse;
  onInspectNumber: (num: string) => void;
}

export default function SpecialPrizeTab({ data, onInspectNumber }: SpecialPrizeTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNumberDetail, setSelectedNumberDetail] = useState<SpecialPrizeNumberStat | null>(null);

  const filteredNumbers = data.allNumbers.filter((n) => {
    if (!searchTerm.trim()) return true;
    return n.number.includes(searchTerm.trim());
  });

  return (
    <div className="space-y-4">
      {/* 1. HEADER & STRICT SPECIAL PRIZE BADGE */}
      <div className="bg-[var(--prize-accent-bg)] border border-[var(--prize-accent-border)] rounded-xl p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base">👑</span>
              <h2 className="text-sm font-black text-[var(--prize-accent)] uppercase tracking-wide">
                THỐNG KÊ GIẢI ĐẶC BIỆT — 2 SỐ CUỐI
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Chỉ tính toán duy nhất 2 số cuối của Giải Đặc Biệt (mỗi kỳ quay đúng 1 kết quả). Tuyệt đối không gộp với 27 giải LOTO.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--prize-accent)] bg-white/70 dark:bg-black/40 px-2.5 py-1 rounded-lg border border-[var(--prize-accent-border)]">
              {data.totalDraws} kỳ quay ({data.uniqueSpecialNumbersCount} số ĐB khác nhau)
            </span>
          </div>
        </div>
      </div>

      {/* 2. HOT / COLD /   WIDGETS FOR SPECIAL PRIZE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Hot Special Prize */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[var(--border)]">
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase">
              🔥 ĐB Về Nhiều Nhất
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.hotNumbers.slice(0, 6).map((item) => (
              <button
                key={item.number}
                type="button"
                onClick={() => setSelectedNumberDetail(item)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--prize-accent-bg)] border border-[var(--prize-accent-border)] hover:brightness-95 cursor-pointer text-xs"
              >
                <span className="font-black text-[var(--prize-accent)]">{item.number}</span>
                <span className="font-bold text-[var(--text-primary)]">({item.frequency} lần)</span>
              </button>
            ))}
          </div>
        </div>

        {/* Highest Gan Special Prize */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[var(--border)]">
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase">
              ⏳ ĐB Đang Gan Cao Nhất
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.ganNumbers.slice(0, 6).map((item) => (
              <button
                key={item.number}
                type="button"
                onClick={() => setSelectedNumberDetail(item)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:bg-[var(--surface-press)] cursor-pointer text-xs"
              >
                <span className="font-black text-[var(--text-primary)]">{item.number}</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">({item.currentGap} kỳ)</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Special Prize Occurrences */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[var(--border)]">
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase">
              📅 ĐB Các Kỳ Gần Nhất
            </h3>
          </div>
          <div className="space-y-1.5 text-xs">
            {data.recentOccurrences.slice(0, 3).map((occ) => (
              <div key={occ.date} className="flex items-center justify-between p-1.5 rounded bg-[var(--surface-muted)]">
                <span className="text-[var(--text-secondary)]">
                  {occ.shortDate} ({occ.dayOfWeek})
                </span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-[var(--text-muted)]">{occ.fullNumber.slice(0, -2)}</span>
                  <span className="px-1.5 py-0.2 rounded bg-[var(--prize-accent-bg)] text-[var(--prize-accent)] font-black">
                    {occ.tail}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. SEARCH & DETAIL MODAL TRIGGER */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm 2 số cuối ĐB (vd: 29, 45)..."
            maxLength={2}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
          <span className="absolute left-2.5 top-2 text-xs text-[var(--text-muted)]">🔍</span>
        </div>
        <div className="text-xs text-[var(--text-muted)]">
          Hiển thị <span className="font-bold text-[var(--text-primary)]">{filteredNumbers.length}</span> số
        </div>
      </div>

      {/* 4. SPECIAL PRIZE 00–99 DATA TABLE */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[var(--surface-muted)] text-[var(--text-primary)] border-b border-[var(--border)]">
                <th className="py-3 px-3 font-extrabold">2 Số Cuối ĐB</th>
                <th className="py-3 px-3 font-extrabold text-center">Số Lần Về ĐB</th>
                <th className="py-3 px-3 font-extrabold text-center">Tỷ Lệ</th>
                <th className="py-3 px-3 font-extrabold text-center">Lần Về Gần Nhất</th>
                <th className="py-3 px-3 font-extrabold text-center">Gan ĐB Hiện Tại</th>
                <th className="py-3 px-3 font-extrabold text-center">Gan ĐB Max</th>
                <th className="py-3 px-3 font-extrabold text-center">Lịch Sử Về</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredNumbers.map((item) => (
                <tr
                  key={item.number}
                  onClick={() => setSelectedNumberDetail(item)}
                  className="hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--prize-accent-bg)] font-black text-sm text-[var(--prize-accent)] border border-[var(--prize-accent-border)]">
                      {item.number}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`font-black text-sm ${item.frequency > 0
                          ? 'text-[var(--prize-accent)]'
                          : 'text-[var(--text-secondary)]'
                        }`}
                    >
                      {item.frequency} lần
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-[var(--text-primary)] font-bold">
                    {item.percentage}%
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-[var(--text-primary)]">
                    {item.lastAppearance ? toDDMMYYYYDash(item.lastAppearance) : 'Chưa về'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-black text-[var(--text-primary)]">
                    {item.currentGap} kỳ
                  </td>
                  <td className="py-2.5 px-3 text-center text-[var(--text-primary)] font-bold">
                    {item.maxGap} kỳ
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.history.length > 0 ? (
                      <span className="text-xs font-bold text-[var(--accent-primary)] hover:underline">
                        {item.history.length} kỳ ({item.history.map((h) => h.shortDate).join(', ')})
                      </span>
                    ) : (
                      <span className="text-[var(--text-secondary)] font-semibold">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. SELECTED SPECIAL PRIZE NUMBER HISTORY MODAL */}
      {selectedNumberDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedNumberDetail(null)}
        >
          <div
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-4 shadow-xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[var(--prize-accent-bg)] text-[var(--prize-accent)] font-black text-lg flex items-center justify-center border border-[var(--prize-accent-border)]">
                  {selectedNumberDetail.number}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">
                    Lịch sử về Giải Đặc Biệt: số {selectedNumberDetail.number}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Đã về {selectedNumberDetail.frequency} lần trong kỳ phân tích
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNumberDetail(null)}
                className="w-7 h-7 rounded-full bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {selectedNumberDetail.history.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedNumberDetail.history.map((h, idx) => (
                  <div
                    key={h.date}
                    className="p-2.5 rounded-lg bg-[var(--surface-muted)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[var(--text-primary)]">
                        #{idx + 1} — {toDDMMYYYYDash(h.date)}
                      </span>
                      <div className="text-[11px] text-[var(--text-secondary)]">{h.dayOfWeek}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-sm text-[var(--prize-accent)]">
                        {h.fullNumber}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">2 số cuối: {h.tail}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                Số {selectedNumberDetail.number} chưa về Giải Đặc Biệt trong khoảng thời gian đã chọn ({selectedNumberDetail.currentGap} kỳ vắng mặt).
              </div>
            )}

            <div className="pt-2 border-t border-[var(--border)] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onInspectNumber(selectedNumberDetail.number);
                  setSelectedNumberDetail(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-bold cursor-pointer"
              >
                Tra cứu đầy đủ số {selectedNumberDetail.number} →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
