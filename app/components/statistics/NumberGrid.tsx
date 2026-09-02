'use client';

import { useState, useMemo } from 'react';
import type { NumberStatItem } from '@/app/lib/statistics-engine';
import NumberCell from './NumberCell';

export type SortMode = 'number_asc' | 'frequency_desc' | 'frequency_asc';

interface NumberGridProps {
  allNumbers: NumberStatItem[];
  period: number;
  onInspectNumber: (num: string) => void;
}

export default function NumberGrid({
  allNumbers,
  period,
  onInspectNumber,
}: NumberGridProps) {
  const [sortMode, setSortMode] = useState<SortMode>('number_asc');

  // Sorted list based on chosen mode
  const sortedNumbers = useMemo(() => {
    const list = [...allNumbers];
    if (sortMode === 'frequency_desc') {
      return list.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.number.localeCompare(b.number);
      });
    }
    if (sortMode === 'frequency_asc') {
      return list.sort((a, b) => {
        if (a.count !== b.count) return a.count - b.count;
        return a.number.localeCompare(b.number);
      });
    }
    // number_asc (00 -> 99)
    return list.sort((a, b) => a.number.localeCompare(b.number));
  }, [allNumbers, sortMode]);

  return (
    <section
      aria-label="Bảng thống kê 00-99"
      style={{
        margin: '0 16px 16px',
        backgroundColor: 'var(--surface)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '16px 14px',
      }}
    >
      {/* Header & Sort Selector */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <h2
              style={{
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              BẢNG TẦN SUẤT 00–99
            </h2>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--text-muted)',
                backgroundColor: 'var(--surface-muted)',
                padding: '1px 6px',
                borderRadius: 6,
              }}
            >
              100 số
            </span>
          </div>

          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {period} ngày
          </span>
        </div>

        {/* Sort Pills */}
        <div
          role="group"
          aria-label="Sắp xếp bảng số"
          style={{
            display: 'flex',
            gap: 6,
            backgroundColor: 'var(--surface-muted)',
            padding: 3,
            borderRadius: 10,
          }}
        >
          <button
            id="sort-number-asc"
            type="button"
            onClick={() => setSortMode('number_asc')}
            className="touch-press"
            style={{
              flex: 1,
              minHeight: 34,
              border: 'none',
              borderRadius: 8,
              backgroundColor: sortMode === 'number_asc' ? 'var(--surface)' : 'transparent',
              color: sortMode === 'number_asc' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: sortMode === 'number_asc' ? 700 : 500,
              fontSize: 12,
              cursor: 'pointer',
              boxShadow: sortMode === 'number_asc' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Số 00 → 99
          </button>

          <button
            id="sort-freq-desc"
            type="button"
            onClick={() => setSortMode('frequency_desc')}
            className="touch-press"
            style={{
              flex: 1,
              minHeight: 34,
              border: 'none',
              borderRadius: 8,
              backgroundColor: sortMode === 'frequency_desc' ? 'var(--surface)' : 'transparent',
              color: sortMode === 'frequency_desc' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: sortMode === 'frequency_desc' ? 700 : 500,
              fontSize: 12,
              cursor: 'pointer',
              boxShadow: sortMode === 'frequency_desc' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Tần suất ↓
          </button>

          <button
            id="sort-freq-asc"
            type="button"
            onClick={() => setSortMode('frequency_asc')}
            className="touch-press"
            style={{
              flex: 1,
              minHeight: 34,
              border: 'none',
              borderRadius: 8,
              backgroundColor: sortMode === 'frequency_asc' ? 'var(--surface)' : 'transparent',
              color: sortMode === 'frequency_asc' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: sortMode === 'frequency_asc' ? 700 : 500,
              fontSize: 12,
              cursor: 'pointer',
              boxShadow: sortMode === 'frequency_asc' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Tần suất ↑
          </button>
        </div>
      </div>

      {/* 5-Column Grid */}
      <div
        id="stats-00-99-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 6,
        }}
      >
        {sortedNumbers.map((item) => (
          <NumberCell
            key={item.number}
            item={item}
            onInspect={onInspectNumber}
          />
        ))}
      </div>

      {/* Subtle Legend */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 10,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'var(--surface-muted)', border: '1px solid var(--border)' }} />
          <span>0 lần</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }} />
          <span>1-2 lần</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'var(--accent-blue-bg)', border: '1px solid var(--accent-blue-border)' }} />
          <span>3-4 lần</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'var(--accent-blue-bg)', border: '1px solid var(--accent-primary)' }} />
          <span>5+ lần</span>
        </div>
      </div>
    </section>
  );
}
