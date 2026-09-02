'use client';

/**
 * LastTwoDigitTable / TwoDigitTable — Bảng Đầu — Đuôi 2 Số Cuối
 *
 * Compact and highly readable 2-column table:
 * - Column 1: Đầu 0 — 4 (Heads 0, 1, 2, 3, 4)
 * - Column 2: Đầu 5 — 9 (Heads 5, 6, 7, 8, 9)
 *
 * Each row displays: [HEAD] : [TWO-DIGIT NUMBERS] (e.g. 0: 01, 04, 09)
 *
 * Data source: Real MongoDB XSMB results via /api/v1/xsmb/two-digit-table
 * Time filters: Hôm nay | Hôm qua | 7 ngày | 30 ngày | 90 ngày
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { TwoDigitRangeParam } from '@/app/lib/api/validators';
import type { TwoDigitItemDTO, TwoDigitTableResponseDTO } from '@/app/lib/services/xsmb-api.service';

export interface TwoDigitTableProps {
  initialRange?: TwoDigitRangeParam;
  onInspectNumber?: (num: string) => void;
  className?: string;
}

interface HeadRowData {
  head: number;
  items: TwoDigitItemDTO[];
}

const RANGE_TABS: { id: TwoDigitRangeParam; label: string }[] = [
  { id: 'today', label: 'Hôm nay' },
  { id: 'yesterday', label: 'Hôm qua' },
  { id: '7days', label: '7 ngày' },
  { id: '30days', label: '30 ngày' },
  { id: '90days', label: '90 ngày' },
];

export default function TwoDigitTable({
  initialRange = 'today',
  onInspectNumber,
  className = '',
}: TwoDigitTableProps) {
  const router = useRouter();
  const [activeRange, setActiveRange] = useState<TwoDigitRangeParam>(initialRange);
  const [data, setData] = useState<TwoDigitTableResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Hovered / Clicked tooltip & modal popover state
  const [hoveredNumber, setHoveredNumber] = useState<TwoDigitItemDTO | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [activeModalItem, setActiveModalItem] = useState<TwoDigitItemDTO | null>(null);

  const containerRef = useRef<HTMLElement>(null);

  // ─── Fetch data from MongoDB via REST API ───────────────────────────────────
  const fetchData = useCallback(
    async (range: TwoDigitRangeParam, signal?: AbortSignal) => {
      try {
        const res = await fetch(`/api/v1/xsmb/two-digit-table?range=${range}`, {
          cache: 'no-store',
          signal,
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const json = await res.json();
        const payload: TwoDigitTableResponseDTO = json.data;
        setData(payload);
        setError(null);

        // Update active modal item reference if still open
        if (activeModalItem) {
          const updated = payload.numbers.find((n) => n.number === activeModalItem.number);
          if (updated) setActiveModalItem(updated);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('[TwoDigitTable] Fetch error:', err);
        setError('Không thể tải bảng thống kê. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    },
    [activeModalItem]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(activeRange, controller.signal);
    return () => controller.abort();
  }, [activeRange, fetchData]);

  // ─── Realtime polling for 'today' tab ──────────────────────────────────────
  useEffect(() => {
    if (activeRange !== 'today') return;

    const interval = setInterval(() => {
      const controller = new AbortController();
      fetchData('today', controller.signal);
    }, 25_000);

    return () => clearInterval(interval);
  }, [activeRange, fetchData]);

  // ─── Group numbers by Head (0 to 9) and sort ascending ─────────────────────
  const { heads0To4, heads5To9 } = useMemo(() => {
    const grouped: HeadRowData[] = Array.from({ length: 10 }, (_, head) => ({
      head,
      items: [],
    }));

    if (data && Array.isArray(data.numbers)) {
      for (const item of data.numbers) {
        if (item.count > 0 && typeof item.number === 'string' && item.number.length === 2) {
          const headDigit = parseInt(item.number[0], 10);
          if (!isNaN(headDigit) && headDigit >= 0 && headDigit <= 9) {
            grouped[headDigit].items.push(item);
          }
        }
      }

      // Sort numbers numerically ascending in each head row
      for (const row of grouped) {
        row.items.sort((a, b) => a.number.localeCompare(b.number));
      }
    }

    return {
      heads0To4: grouped.slice(0, 5),
      heads5To9: grouped.slice(5, 10),
    };
  }, [data]);

  // ─── Tooltip event handlers ────────────────────────────────────────────────
  const handleMouseEnter = (item: TwoDigitItemDTO, e: React.MouseEvent<HTMLButtonElement>) => {
    const btnRect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      setTooltipPos({
        x: btnRect.left - containerRect.left + btnRect.width / 2,
        y: btnRect.top - containerRect.top - 8,
      });
    }
    setHoveredNumber(item);
  };

  const handleMouseLeave = () => {
    setHoveredNumber(null);
    setTooltipPos(null);
  };

  const handleNumberClick = (item: TwoDigitItemDTO) => {
    setActiveModalItem(item);
  };

  const handleInspect = (num: string) => {
    setActiveModalItem(null);
    if (onInspectNumber) {
      onInspectNumber(num);
    } else {
      router.push(`/number/${num}`);
    }
  };

  // ─── Helper to render a group of 5 heads (0-4 or 5-9) ──────────────────────
  const renderHeadGroup = (
    groupTitle: string,
    rangeSubtitle: string,
    rows: HeadRowData[]
  ) => {
    return (
      <div className="two-digit-panel">
        {/* Panel Header */}
        <div className="two-digit-panel-header">
          <h3 className="two-digit-panel-title">{groupTitle}</h3>
          <span className="two-digit-panel-range">{rangeSubtitle}</span>
        </div>

        {/* 5 Rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map(({ head, items }) => (
            <div key={head} className="two-digit-row">
              {/* Head Label: e.g. 0: */}
              <div className="two-digit-head-label">
                <span>{head}</span>
                <span className="two-digit-colon">:</span>
              </div>

              {/* Numbers or Empty Dash */}
              <div className="two-digit-content">
                {items.length === 0 ? (
                  <span className="two-digit-empty">—</span>
                ) : (
                  items.map((item, idx) => {
                    const isLast = idx === items.length - 1;
                    return (
                      <React.Fragment key={item.number}>
                        <button
                          type="button"
                          id={`btn-head-${head}-${item.number}`}
                          onClick={() => handleNumberClick(item)}
                          onMouseEnter={(e) => handleMouseEnter(item, e)}
                          onMouseLeave={handleMouseLeave}
                          className={`two-digit-num-btn ${item.count > 1 ? 'has-multiple' : ''}`}
                          title={`Số ${item.number} (${item.count} lần)`}
                          aria-label={`Số ${item.number}, về ${item.count} lần`}
                        >
                          <span>{item.number}</span>
                          {item.count > 1 && (
                            <span className="two-digit-count-sub">×{item.count}</span>
                          )}
                        </button>
                        {!isLast && <span className="two-digit-sep">,</span>}
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section
      ref={containerRef}
      id="section-two-digit-table"
      aria-label="Bảng Đầu — Đuôi 2 Số Cuối XSMB"
      className={`two-digit-container ${className}`}
    >
      {/* ─── SECTION HEADER ────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            BẢNG ĐẦU — ĐUÔI 2 SỐ CUỐI
          </h2>
        </div>

        {/* Sub-label: Date range and appearance summary */}
        {data && (
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              margin: '4px 0 0',
            }}
          >
            {data.rangeLabel} ({data.dateRangeDisplay}) • {data.totalOccurrences} lượt về ({data.uniqueNumbersCount} số)
          </p>
        )}
      </div>

      {/* ─── TIME RANGE SELECTOR FILTER ────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 4,
          padding: 3,
          borderRadius: 10,
          backgroundColor: 'var(--surface-muted)',
          marginBottom: 14,
        }}
      >
        {RANGE_TABS.map((tab) => {
          const isActive = activeRange === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-two-digit-${tab.id}`}
              type="button"
              onClick={() => {
                if (activeRange !== tab.id) {
                  setIsLoading(true);
                  setActiveRange(tab.id);
                }
              }}
              className="touch-press"
              style={{
                padding: '6px 2px',
                fontSize: 12,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--surface)' : 'transparent',
                border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
                minHeight: 34,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── ERROR STATE WITH RETRY ─────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            padding: '12px',
            marginBottom: 12,
            borderRadius: 10,
            backgroundColor: 'var(--status-error-bg)',
            border: '1px solid var(--status-error-border)',
            color: 'var(--status-error-text)',
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchData(activeRange)}
            style={{
              marginLeft: 8,
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 700,
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--status-error-border)',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ─── LOADING SKELETON / MAIN 2-COLUMN TABLE ───────────────────────── */}
      {isLoading && !data ? (
        <div className="two-digit-grid">
          <div className="two-digit-panel" style={{ padding: 12, gap: 8 }}>
            <div className="skeleton-box" style={{ height: 24, width: '60%' }} />
            <div className="skeleton-box" style={{ height: 20, width: '100%' }} />
            <div className="skeleton-box" style={{ height: 20, width: '100%' }} />
            <div className="skeleton-box" style={{ height: 20, width: '100%' }} />
            <div className="skeleton-box" style={{ height: 20, width: '100%' }} />
            <div className="skeleton-box" style={{ height: 20, width: '100%' }} />
          </div>
          <div className="two-digit-panel" style={{ padding: 12, gap: 8 }}>
            <div className="skeleton-box" style={{ height: 24, width: '60%' }} />
            <div className="skeleton-box" style={{ height: 20, width: '100%' }} />
            <div className="skeleton-box" style={{ height: 20, width: '100%' }} />
            <div className="skeleton-box" style={{ height: 20, width: '100%' }} />
            <div className="skeleton-box" style={{ height: 20, width: '100%' }} />
            <div className="skeleton-box" style={{ height: 20, width: '100%' }} />
          </div>
        </div>
      ) : (
        <div className="two-digit-grid">
          {/* COLUMN 1: ĐẦU 0 — 4 */}
          {renderHeadGroup('Đầu 0 — 4', '00 → 49', heads0To4)}

          {/* COLUMN 2: ĐẦU 5 — 9 */}
          {renderHeadGroup('Đầu 5 — 9', '50 → 99', heads5To9)}
        </div>
      )}

      {/* ─── DESKTOP HOVER FLOATING TOOLTIP ─────────────────────────────────── */}
      {hoveredNumber && tooltipPos && (
        <div
          className="two-digit-floating-tooltip"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 12, color: 'var(--prize-accent)', marginBottom: 2 }}>
            Số {hoveredNumber.number}
          </div>
          <div>
            Xuất hiện: <strong>{hoveredNumber.count} lần</strong>
          </div>
          {hoveredNumber.prizeCodes && hoveredNumber.prizeCodes.length > 0 && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 10 }}>
              Giải: {hoveredNumber.prizeCodes.join(', ')}
            </div>
          )}
          {hoveredNumber.lastAppearance && (
            <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>
              Gần nhất: {hoveredNumber.lastAppearance}
            </div>
          )}
        </div>
      )}

      {/* ─── CLICK DETAIL MODAL / POPOVER ──────────────────────────────────── */}
      {activeModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-two-digit-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setActiveModalItem(null)}
        >
          <div
            className="animate-slide-up"
            style={{
              width: '100%',
              maxWidth: 380,
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: 20,
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    background:
                      activeModalItem.count > 0
                        ? 'linear-gradient(135deg, var(--prize-accent), #dc2626)'
                        : 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activeModalItem.count > 0 ? '#ffffff' : 'var(--text-primary)',
                  }}
                >
                  <span
                    className="tabular-numbers"
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                  >
                    {activeModalItem.number}
                  </span>
                </div>

                <div>
                  <h3
                    id="modal-two-digit-title"
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    Số {activeModalItem.number}
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      margin: '2px 0 0',
                    }}
                  >
                    Đầu {activeModalItem.number[0]} • Đuôi {activeModalItem.number[1]}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="touch-press"
                aria-label="Đóng"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'var(--surface-muted)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 700,
                  minHeight: 32,
                }}
              >
                ✕
              </button>
            </div>

            {/* Statistics details list */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                backgroundColor: 'var(--surface-secondary)',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Kỳ thống kê:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                  {data?.rangeLabel || 'Hôm nay'} ({data?.dateRangeDisplay})
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Số lần xuất hiện:</span>
                <span
                  style={{
                    fontWeight: 900,
                    color: activeModalItem.count > 0 ? 'var(--prize-accent)' : 'var(--text-secondary)',
                    fontSize: 16,
                  }}
                >
                  {activeModalItem.count} lần
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Lần về gần nhất:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeModalItem.lastAppearance || 'Chưa về trong kỳ'}
                </span>
              </div>

              {activeModalItem.prizes && activeModalItem.prizes.length > 0 && (
                <div style={{ marginTop: 4, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                    Các giải đã về ({activeModalItem.prizes.length}):
                  </span>
                  <div
                    style={{
                      maxHeight: 120,
                      overflowY: 'auto',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 4,
                    }}
                  >
                    {activeModalItem.prizes.map((pz, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border-strong)',
                          padding: '3px 8px',
                          borderRadius: 6,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {pz}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CTA action button */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                id="btn-modal-inspect-number"
                type="button"
                onClick={() => handleInspect(activeModalItem.number)}
                className="touch-press"
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: 12,
                  backgroundColor: 'var(--accent)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span>Xem phân tích số {activeModalItem.number}</span>
                <span style={{ fontSize: 15 }}>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// Export alias for reusability across pages
export { TwoDigitTable as LastTwoDigitTable };

