'use client';

import { useState } from 'react';
import type { XSMBPrizes, DrawLifecycleState } from '@/app/lib/xsmb-types';
import { PRIZE_GROUPS } from '@/app/lib/xsmb-types';

interface ResultPrizeGroupsProps {
  prizes: XSMBPrizes | null;
  status: DrawLifecycleState;
  onNumberClick: (number: string, prizeLabel: string) => void;
}

export default function ResultPrizeGroups({
  prizes,
  status,
  onNumberClick,
}: ResultPrizeGroupsProps) {
  // State for collapsible lower prize categories (G4 - G7)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    giaiTu: false,
    giaiNam: false,
    giaiSau: false,
    giaiBay: false,
  });

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const areAllExpanded = Object.values(collapsedGroups).every((v) => !v);

  const toggleAll = () => {
    const nextState = areAllExpanded;
    setCollapsedGroups({
      giaiTu: nextState,
      giaiNam: nextState,
      giaiSau: nextState,
      giaiBay: nextState,
    });
  };

  if (!prizes) return null;

  // Filter out 'dacBiet' since it's already prominently featured in ResultSpecialHero,
  // or include all standard G1 through G7
  const displayGroups = PRIZE_GROUPS.filter((g) => g.key !== 'dacBiet');

  return (
    <section aria-label="Chi tiết toàn bộ 27 giải thưởng" style={{ margin: '0 16px 16px' }}>
      {/* Section Header with Expand/Collapse All Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          padding: '0 4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            KẾT QUẢ 27 GIẢI
          </h2>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
            }}
          >
            (Bấm số để phân tích)
          </span>
        </div>

        <button
          onClick={toggleAll}
          className="touch-press"
          style={{
            border: 'none',
            background: 'none',
            color: 'var(--accent-primary)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 6px',
          }}
        >
          {areAllExpanded ? 'Thu gọn G4-G7' : 'Mở rộng tất cả'}
        </button>
      </div>

      {/* Prize Groups Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {displayGroups.map((group) => {
          const numbers = prizes[group.key] || [];
          const isCollapsible = group.collapsible;
          const isCollapsed = isCollapsible && collapsedGroups[group.key];
          const hasNumbers = numbers.length > 0;

          // Determine column layout based on prize type & count
          // G1: 1 col, G2: 2 cols, G3: 2 or 3 cols, G4: 2 cols, G5: 3 cols, G6: 3 cols, G7: 4 cols
          let gridCols = '1fr';
          if (group.key === 'giaiNhi' || group.key === 'giaiTu') gridCols = 'repeat(2, 1fr)';
          else if (group.key === 'giaiBa' || group.key === 'giaiNam' || group.key === 'giaiSau') gridCols = 'repeat(3, 1fr)';
          else if (group.key === 'giaiBay') gridCols = 'repeat(4, 1fr)';

          return (
            <div
              key={group.key}
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 14,
                border: '1px solid var(--border)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* Group Header Bar */}
              <div
                onClick={() => isCollapsible && toggleGroup(group.key)}
                className={isCollapsible ? 'touch-press' : undefined}
                role={isCollapsible ? 'button' : undefined}
                tabIndex={isCollapsible ? 0 : undefined}
                aria-expanded={isCollapsible ? !isCollapsed : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'var(--surface-muted)',
                  borderBottom: isCollapsed ? 'none' : '1px solid var(--border)',
                  cursor: isCollapsible ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {group.label}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    {group.count} giải · {group.digits} số
                  </span>
                </div>

                {isCollapsible && (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      transition: 'transform 0.2s ease',
                      transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Group Numbers Container */}
              {!isCollapsed && (
                <div style={{ padding: '12px 14px' }}>
                  {hasNumbers ? (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: gridCols,
                        gap: 8,
                      }}
                    >
                      {numbers.map((num, idx) => (
                        <button
                          key={`${group.key}-${idx}-${num}`}
                          onClick={() => onNumberClick(num, group.label)}
                          className="touch-press"
                          aria-label={`${group.label}: ${num}. Bấm để xem phân tích số loto.`}
                          style={{
                            minHeight: 44,
                            padding: '8px 4px',
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'border-color 0.15s ease, transform 0.1s ease',
                          }}
                        >
                          <span
                            className="tabular-numbers"
                            style={{
                              fontSize: group.digits === 5 ? 18 : group.digits === 4 ? 17 : group.digits === 3 ? 18 : 19,
                              fontWeight: 800,
                              color: 'var(--text-primary)',
                              letterSpacing: '0.04em',
                              lineHeight: 1.1,
                            }}
                          >
                            {num}
                          </span>

                          {/* 2-digit tail hint */}
                          {num.length >= 2 && (
                            <span
                              style={{
                                fontSize: 10,
                                color: 'var(--text-muted)',
                                fontWeight: 600,
                                marginTop: 2,
                              }}
                            >
                              đuôi <strong className="tabular-numbers" style={{ color: 'var(--prize-accent)' }}>{num.slice(-2)}</strong>
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                      {status === 'UPDATING' ? 'Đang cập nhật giải này...' : 'Chưa có dữ liệu'}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
