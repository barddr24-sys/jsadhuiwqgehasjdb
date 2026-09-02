'use client';

import React, { useState, useMemo } from 'react';
import type { LotoNumberStat } from '@/app/lib/services/statistics-deep.service';

interface LotoTableTabProps {
  allNumbers: LotoNumberStat[];
  onInspectNumber: (num: string) => void;
}

type SortField =
  | 'number'
  | 'frequency'
  | 'percentage'
  | 'lastAppearance'
  | 'currentGap'
  | 'avgGap'
  | 'maxGap'
  | 'streak';

type FilterType = 'all' | 'hot' | 'cold' | ' ' | 'even' | 'odd';

export default function LotoTableTab({ allNumbers, onInspectNumber }: LotoTableTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedHead, setSelectedHead] = useState<string>('all');
  const [selectedTail, setSelectedTail] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('frequency');
  const [sortAsc, setSortAsc] = useState(false);
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAndSorted = useMemo(() => {
    let result = [...allNumbers];

    // 1. Search term filter
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter((n) => n.number.includes(q));
    }

    // 2. Head filter
    if (selectedHead !== 'all') {
      result = result.filter((n) => n.number[0] === selectedHead);
    }

    // 3. Tail filter
    if (selectedTail !== 'all') {
      result = result.filter((n) => n.number[1] === selectedTail);
    }

    // 4. Filter type
    if (filterType === 'hot') {
      result = result.filter((n) => n.frequency >= 2);
    } else if (filterType === 'cold') {
      result = result.filter((n) => n.frequency <= 1);
    } else if (filterType === ' ') {
      result = result.filter((n) => n.currentGap >= 5);
    } else if (filterType === 'even') {
      result = result.filter((n) => parseInt(n.number, 10) % 2 === 0);
    } else if (filterType === 'odd') {
      result = result.filter((n) => parseInt(n.number, 10) % 2 !== 0);
    }

    // 5. Sorting
    result.sort((a, b) => {
      let valA: string | number | null | undefined = a[sortField];
      let valB: string | number | null | undefined = b[sortField];

      if (sortField === 'lastAppearance') {
        valA = typeof valA === 'string' ? new Date(valA).getTime() : 0;
        valB = typeof valB === 'string' ? new Date(valB).getTime() : 0;
      }

      if (valA == null && valB == null) return 0;
      if (valA == null) return sortAsc ? -1 : 1;
      if (valB == null) return sortAsc ? 1 : -1;

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return a.number.localeCompare(b.number);
    });

    return result;
  }, [allNumbers, searchTerm, selectedHead, selectedTail, filterType, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredAndSorted.length / pageSize) || 1;
  const paginatedItems = filteredAndSorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
    setCurrentPage(1);
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return <span className="opacity-30 ml-0.5">↕</span>;
    return <span className="text-[var(--accent-primary)] font-bold ml-0.5">{sortAsc ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-3.5">
      {/* 1. FILTER & SEARCH CONTROLS */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Quick Search */}
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm số nhanh (vd: 27, 45)..."
              maxLength={2}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
            <span className="absolute left-2.5 top-2 text-xs text-[var(--text-muted)]">🔍</span>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {(
              [
                { key: 'all', label: 'Tất cả' },
                { key: 'hot', label: 'Về nhiều' },
                { key: ' ', label: 'Đang  ' },
                { key: 'even', label: 'Chẵn' },
                { key: 'odd', label: 'Lẻ' },
              ] as { key: FilterType; label: string }[]
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setFilterType(f.key);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${filterType === f.key
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-press)]'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Head & Tail select dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border)] text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-secondary)] font-medium">Đầu:</span>
            <select
              value={selectedHead}
              onChange={(e) => {
                setSelectedHead(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded bg-[var(--surface-muted)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none"
            >
              <option value="all">Tất cả đầu</option>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <option key={d} value={String(d)}>
                  Đầu {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-secondary)] font-medium">Đuôi:</span>
            <select
              value={selectedTail}
              onChange={(e) => {
                setSelectedTail(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded bg-[var(--surface-muted)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none"
            >
              <option value="all">Tất cả đuôi</option>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <option key={d} value={String(d)}>
                  Đuôi {d}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-[11px] text-[var(--text-muted)]">
            Hiển thị <span className="font-bold text-[var(--text-primary)]">{filteredAndSorted.length}</span> số
          </div>
        </div>
      </div>

      {/* 2. COMPREHENSIVE LOTO DATA TABLE */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[var(--surface-muted)] text-[var(--text-primary)] border-b border-[var(--border)] select-none">
                <th
                  onClick={() => handleSort('number')}
                  className="py-3 px-3 font-extrabold cursor-pointer hover:text-[var(--accent-primary)]"
                >
                  Số {renderSortIndicator('number')}
                </th>
                <th
                  onClick={() => handleSort('frequency')}
                  className="py-3 px-3 font-extrabold text-center cursor-pointer hover:text-[var(--accent-primary)]"
                >
                  Lượt về {renderSortIndicator('frequency')}
                </th>
                <th
                  onClick={() => handleSort('percentage')}
                  className="py-3 px-3 font-extrabold text-center cursor-pointer hover:text-[var(--accent-primary)]"
                >
                  Tỷ lệ {renderSortIndicator('percentage')}
                </th>
                <th
                  onClick={() => handleSort('lastAppearance')}
                  className="py-3 px-3 font-extrabold text-center cursor-pointer hover:text-[var(--accent-primary)]"
                >
                  Lần gần nhất {renderSortIndicator('lastAppearance')}
                </th>
                <th
                  onClick={() => handleSort('currentGap')}
                  className="py-3 px-3 font-extrabold text-center cursor-pointer hover:text-[var(--accent-primary)]"
                >
                  HT {renderSortIndicator('currentGap')}
                </th>
                <th
                  onClick={() => handleSort('avgGap')}
                  className="py-3 px-3 font-extrabold text-center cursor-pointer hover:text-[var(--accent-primary)]"
                >
                  TB {renderSortIndicator('avgGap')}
                </th>
                <th
                  onClick={() => handleSort('maxGap')}
                  className="py-3 px-3 font-extrabold text-center cursor-pointer hover:text-[var(--accent-primary)]"
                >
                  Max {renderSortIndicator('maxGap')}
                </th>
                <th
                  onClick={() => handleSort('streak')}
                  className="py-3 px-3 font-extrabold text-center cursor-pointer hover:text-[var(--accent-primary)]"
                >
                  Chuỗi {renderSortIndicator('streak')}
                </th>
                <th className="py-3 px-3 font-extrabold text-center">Xu hướng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {paginatedItems.map((item) => (
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
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`font-black text-sm ${item.frequency >= 4
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : item.frequency === 0
                            ? 'text-[var(--text-secondary)]'
                            : 'text-[var(--text-primary)]'
                        }`}
                    >
                      {item.frequency}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-[var(--text-primary)] font-bold">
                    {item.percentage}%
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-[var(--text-primary)]">
                    {item.lastAppearanceDisplay || '--'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${item.currentGap === 0
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : item.currentGap >= 10
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-black'
                            : item.currentGap >= 5
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'text-[var(--text-primary)] font-bold'
                        }`}
                    >
                      {item.currentGap} kỳ
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-[var(--text-primary)] font-bold">
                    {item.avgGap}
                  </td>
                  <td className="py-2.5 px-3 text-center text-[var(--text-primary)] font-bold">
                    {item.maxGap}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.streak >= 2 ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ⚡ {item.streak} kỳ
                      </span>
                    ) : (
                      <span className="text-[var(--text-secondary)] font-semibold">{item.longestStreak > 1 ? `max ${item.longestStreak}` : '-'}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${item.trend === 'increasing'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : item.trend === 'decreasing'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                            : item.trend === 'recently_active'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                              : item.trend === 'recently_inactive'
                                ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                                : 'bg-[var(--surface-muted)] text-[var(--text-primary)]'
                        }`}
                    >
                      {item.trend === 'increasing' && '↑ Tăng'}
                      {item.trend === 'decreasing' && '↓ Giảm'}
                      {item.trend === 'recently_active' && '⚡ Mới về'}
                      {item.trend === 'recently_inactive' && '💤 Chững'}
                      {item.trend === 'stable' && '→ Ổn định'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[var(--border)] flex items-center justify-between text-xs bg-[var(--surface-muted)]">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-secondary)]">Số lượng/trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-primary)]"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-[var(--border)] bg-[var(--surface)] disabled:opacity-40 cursor-pointer text-[var(--text-primary)]"
              >
                ← Trước
              </button>
              <span className="px-2 font-semibold text-[var(--text-primary)]">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-[var(--border)] bg-[var(--surface)] disabled:opacity-40 cursor-pointer text-[var(--text-primary)]"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
