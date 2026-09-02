'use client';

import React from 'react';
import type { LotoPeriod } from '@/app/lib/loto-engine';
import { lookupLotoNumberFacts } from '@/app/lib/loto-engine';

interface LotoNumberDetailModalProps {
  number: string | null;
  period: LotoPeriod;
  onClose: () => void;
  onCopy: (num: string) => void;
}

export default function LotoNumberDetailModal({
  number,
  period,
  onClose,
  onCopy,
}: LotoNumberDetailModalProps) {
  if (!number) return null;

  const facts = lookupLotoNumberFacts(number);

  const contextLabel =
    period === 'today'
      ? 'Nguồn: Loto Hôm nay'
      : period === '3days'
      ? 'Nguồn: Loto 3 Ngày'
      : 'Nguồn: Loto 7 Ngày';

  const relevantPrizes =
    period === 'today'
      ? facts.todayPrizeLabels
      : period === '3days'
      ? facts.threeDayPrizeLabels
      : facts.sevenDayPrizeLabels;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="number-detail-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 95,
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
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'var(--border-strong)',
            margin: '0 auto 16px',
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-block',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--accent-primary)',
                backgroundColor: 'var(--accent-blue-bg)',
                padding: '2px 8px',
                borderRadius: 6,
                marginBottom: 4,
              }}
            >
              {contextLabel}
            </div>
            <h3
              id="number-detail-title"
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Chi tiết loto {number}
            </h3>
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

        {/* Hero Number Card */}
        <div
          style={{
            backgroundColor: 'var(--surface-muted)',
            borderRadius: 16,
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              className="tabular-numbers"
              style={{
                width: 60,
                height: 60,
                borderRadius: 14,
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--text-inverse)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 30,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {number}
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                Đầu {facts.head} · Đuôi {facts.tail}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Lần về gần nhất: {facts.lastAppearedDate}
              </div>
            </div>
          </div>

          <button
            onClick={() => onCopy(number)}
            className="touch-press"
            aria-label={`Sao chép số ${number}`}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            <span>Sao chép</span>
          </button>
        </div>

        {/* 3-Period Frequency Overview */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              padding: '10px 8px',
              borderRadius: 12,
              backgroundColor: period === 'today' ? 'var(--accent-blue-bg)' : 'var(--surface-muted)',
              border: period === 'today' ? '1.5px solid var(--accent-blue-border)' : '1px solid var(--border)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Hôm nay</div>
            <div
              className="tabular-numbers"
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: period === 'today' ? 'var(--accent-primary)' : 'var(--text-primary)',
                marginTop: 2,
              }}
            >
              {facts.todayCount} <span style={{ fontSize: 11, fontWeight: 500 }}>lần</span>
            </div>
          </div>

          <div
            style={{
              padding: '10px 8px',
              borderRadius: 12,
              backgroundColor: period === '3days' ? 'var(--accent-blue-bg)' : 'var(--surface-muted)',
              border: period === '3days' ? '1.5px solid var(--accent-blue-border)' : '1px solid var(--border)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>3 Ngày</div>
            <div
              className="tabular-numbers"
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: period === '3days' ? 'var(--accent-primary)' : 'var(--text-primary)',
                marginTop: 2,
              }}
            >
              {facts.threeDayCount} <span style={{ fontSize: 11, fontWeight: 500 }}>lần</span>
            </div>
          </div>

          <div
            style={{
              padding: '10px 8px',
              borderRadius: 12,
              backgroundColor: period === '7days' ? 'var(--accent-blue-bg)' : 'var(--surface-muted)',
              border: period === '7days' ? '1.5px solid var(--accent-blue-border)' : '1px solid var(--border)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>7 Ngày</div>
            <div
              className="tabular-numbers"
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: period === '7days' ? 'var(--accent-primary)' : 'var(--text-primary)',
                marginTop: 2,
              }}
            >
              {facts.sevenDayCount} <span style={{ fontSize: 11, fontWeight: 500 }}>lần</span>
            </div>
          </div>
        </div>

        {/* Appearances in Prizes List */}
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            Lượt xuất hiện trong các giải ({relevantPrizes.length})
          </div>

          {relevantPrizes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {relevantPrizes.map((pz, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{pz}</span>
                  <span
                    className="tabular-numbers"
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: 'var(--accent-primary)',
                      backgroundColor: 'var(--surface)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      border: '1px solid var(--border)',
                    }}
                  >
                    Đuôi {number}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '14px',
                textAlign: 'center',
                backgroundColor: 'var(--surface-muted)',
                borderRadius: 10,
                color: 'var(--text-muted)',
                fontSize: 12,
                fontStyle: 'italic',
              }}
            >
              Số {number} không về trong khoảng thời gian đã chọn.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
