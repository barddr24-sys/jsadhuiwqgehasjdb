'use client';

import { useState, useEffect } from 'react';
import type { StatPreviewItem } from '@/app/lib/xsmb-types';
import type { StatisticsResponseDTO } from '@/app/lib/services/xsmb-api.service';

interface StatisticsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onInspectNumber?: (num: string) => void;
  stats?: StatPreviewItem[];
}

export default function StatisticsSheet({
  isOpen,
  onClose,
  onInspectNumber,
  stats,
}: StatisticsSheetProps) {
  const [filterPeriod, setFilterPeriod] = useState<'3' | '7'>('7');
  const [fetchedStats, setFetchedStats] = useState<StatPreviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (stats && stats.length > 0 && filterPeriod === '7') {
      setFetchedStats(stats);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    fetch(`/api/v1/xsmb/statistics?days=${filterPeriod}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          const dto: StatisticsResponseDTO = json.data;
          const mapped: StatPreviewItem[] = (dto.topNumbers || []).map((item) => ({
            number: item.number,
            count: item.count,
          }));
          setFetchedStats(mapped);
        } else {
          setFetchedStats([]);
        }
      })
      .catch(() => {
        setFetchedStats([]);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [isOpen, filterPeriod, stats]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stats-sheet-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          padding: '20px 20px 32px',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'var(--border-strong)',
            margin: '0 auto 16px',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 id="stats-sheet-title" style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px' }}>
              Thống kê nhanh 2 số cuối
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              Tần suất xuất hiện loto thực tế
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng"
            className="touch-press"
            style={{
              border: 'none',
              backgroundColor: 'var(--surface-muted)',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Period Selector Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--surface-muted)',
            borderRadius: 10,
            padding: 3,
            marginBottom: 16,
            gap: 4,
          }}
        >
          <button
            onClick={() => setFilterPeriod('7')}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 8,
              border: 'none',
              backgroundColor: filterPeriod === '7' ? 'var(--surface)' : 'transparent',
              color: filterPeriod === '7' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: filterPeriod === '7' ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: filterPeriod === '7' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            7 ngày gần nhất
          </button>
          <button
            onClick={() => setFilterPeriod('3')}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 8,
              border: 'none',
              backgroundColor: filterPeriod === '3' ? 'var(--surface)' : 'transparent',
              color: filterPeriod === '3' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: filterPeriod === '3' ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: filterPeriod === '3' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            3 ngày gần nhất
          </button>
        </div>

        {/* Statistics Content */}
        {isLoading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: 13 }}>
            Đang tải thống kê…
          </p>
        ) : fetchedStats.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0', fontSize: 13 }}>
            Chưa có dữ liệu thống kê
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {fetchedStats.map((item) => (
              <button
                key={item.number}
                onClick={() => {
                  onClose();
                  if (onInspectNumber) onInspectNumber(item.number);
                }}
                className="touch-press"
                style={{
                  padding: '12px 8px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <span className="tabular-numbers" style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {item.number}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {item.count} lần
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
