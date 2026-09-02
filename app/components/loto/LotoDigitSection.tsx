'use client';

import { useState } from 'react';
import type { DigitGroup, DigitSummaryItem } from '@/app/lib/loto-engine';

interface LotoDigitSectionProps {
  type: 'head' | 'tail';
  groups: DigitGroup[];
  topSummary: DigitSummaryItem[];
  onInspectNumber: (num: string) => void;
}

export default function LotoDigitSection({
  type,
  groups,
  topSummary,
  onInspectNumber,
}: LotoDigitSectionProps) {
  const isHead = type === 'head';
  const title = isHead ? 'LOTO THEO ĐẦU' : 'LOTO THEO ĐUÔI';
  const shortTitle = isHead ? 'ĐẦU' : 'ĐUÔI';
  const topTitle = isHead ? 'ĐẦU XUẤT HIỆN NHIỀU' : 'ĐUÔI XUẤT HIỆN NHIỀU';
  const description = isHead
    ? 'Nhóm các số loto theo chữ số hàng chục (0 → 9)'
    : 'Nhóm các số loto theo chữ số hàng đơn vị (0 → 9)';

  // Accordion state: by default, top appearing digits or first few are expanded
  const [expandedDigits, setExpandedDigits] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    // Pre-expand the top 3 digits
    topSummary.forEach((t) => initial.add(t.digit));
    return initial;
  });

  const toggleDigit = (digit: number) => {
    setExpandedDigits((prev) => {
      const next = new Set(prev);
      if (next.has(digit)) {
        next.delete(digit);
      } else {
        next.add(digit);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (expandedDigits.size === groups.length) {
      setExpandedDigits(new Set());
    } else {
      setExpandedDigits(new Set(groups.map((g) => g.digit)));
    }
  };

  const maxTopCount = topSummary[0]?.count || 1;

  return (
    <section
      aria-label={title}
      style={{
        padding: '0 16px 20px',
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          padding: '16px',
        }}
      >
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                margin: '0 0 2px',
              }}
            >
              {title}
            </h2>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
              {description}
            </p>
          </div>

          <button
            onClick={toggleAll}
            className="touch-press"
            aria-label={expandedDigits.size === groups.length ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              backgroundColor: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {expandedDigits.size === groups.length ? 'Thu gọn' : 'Mở tất cả'}
          </button>
        </div>

        {/* 1. Summary Bar Chart (Top 3 Heads / Tails) */}
        {topSummary.length > 0 && (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 12px',
              borderRadius: 12,
              backgroundColor: 'var(--surface-muted)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
                marginBottom: 8,
              }}
            >
              {topTitle}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topSummary.map((item) => {
                const percentage = Math.min(100, Math.max(20, (item.count / maxTopCount) * 100));
                return (
                  <div
                    key={item.digit}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span
                      className="tabular-numbers"
                      style={{
                        width: 20,
                        fontSize: 13,
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        textAlign: 'center',
                      }}
                    >
                      {item.digit}
                    </span>

                    <div style={{ flex: 1, height: 8, backgroundColor: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${percentage}%`,
                          backgroundColor: 'var(--accent-primary)',
                          borderRadius: 4,
                        }}
                      />
                    </div>

                    <span
                      className="tabular-numbers"
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        width: 40,
                        textAlign: 'right',
                      }}
                    >
                      {item.count} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>lượt</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Expandable Accordion Rows (0 to 9) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {groups.map((group) => {
            const isExpanded = expandedDigits.has(group.digit);
            const hasNumbers = group.numbers.length > 0;

            return (
              <div
                key={group.digit}
                style={{
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  overflow: 'hidden',
                }}
              >
                {/* Accordion Row Header */}
                <button
                  onClick={() => toggleDigit(group.digit)}
                  className="touch-press"
                  aria-expanded={isExpanded}
                  aria-label={`${shortTitle} ${group.digit}, có ${group.totalCount} lượt`}
                  style={{
                    width: '100%',
                    minHeight: 46,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: 'none',
                    backgroundColor: isExpanded ? 'var(--surface-muted)' : 'var(--surface)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      className="tabular-numbers"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        backgroundColor: hasNumbers ? 'var(--accent)' : 'var(--surface-muted)',
                        color: hasNumbers ? 'var(--text-inverse)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {group.digit}
                    </span>

                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {shortTitle} {group.digit}
                    </span>

                    <span
                      style={{
                        fontSize: 11,
                        color: hasNumbers ? 'var(--text-secondary)' : 'var(--text-muted)',
                        fontWeight: 500,
                      }}
                    >
                      {hasNumbers ? `(${group.totalCount} lượt)` : '(câm — 0 lượt)'}
                    </span>
                  </div>

                  {/* Right Icon */}
                  <div
                    style={{
                      color: 'var(--text-secondary)',
                      transition: 'transform 0.18s ease',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>

                {/* Expanded Content: Tappable number chips */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '10px 12px 12px',
                      backgroundColor: 'var(--surface)',
                      borderTop: '1px solid var(--border)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    {hasNumbers ? (
                      group.numbers.map((item) => {
                        const hasMultiple = item.count > 1;
                        return (
                          <button
                            key={item.number}
                            onClick={() => onInspectNumber(item.number)}
                            className="touch-press tabular-numbers"
                            aria-label={`Số ${item.number}, xuất hiện ${item.count} lần`}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 8,
                              backgroundColor: hasMultiple
                                ? 'var(--accent-blue-bg)'
                                : 'var(--surface-muted)',
                              border: hasMultiple
                                ? '1px solid var(--accent-blue-border)'
                                : '1px solid var(--border)',
                              fontSize: 14,
                              fontWeight: 800,
                              color: hasMultiple
                                ? 'var(--accent-primary)'
                                : 'var(--text-primary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span>{item.number}</span>
                            {hasMultiple && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '1px 3px',
                                  borderRadius: 3,
                                  backgroundColor: 'var(--surface)',
                                  border: '1px solid var(--border)',
                                }}
                              >
                                {item.count}×
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          fontStyle: 'italic',
                          padding: '4px 0',
                        }}
                      >
                        Đầu này không có số nào xuất hiện (câm).
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
