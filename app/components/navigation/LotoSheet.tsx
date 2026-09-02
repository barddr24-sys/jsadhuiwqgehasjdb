'use client';

import type { XSMBPrizes } from '@/app/lib/xsmb-types';

interface LotoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  prizes: XSMBPrizes | null;
  onInspectNumber?: (num: string) => void;
}

export default function LotoSheet({
  isOpen,
  onClose,
  prizes,
  onInspectNumber,
}: LotoSheetProps) {
  if (!isOpen) return null;

  // Extract all 2-digit endings from prizes
  const allTwoDigits: string[] = [];
  if (prizes) {
    const keys = Object.keys(prizes) as (keyof XSMBPrizes)[];
    keys.forEach((k) => {
      (prizes[k] || []).forEach((n) => {
        if (n && n.length >= 2) {
          allTwoDigits.push(n.slice(-2));
        }
      });
    });
  }

  // Group by Head (0 to 9)
  const headMap: Record<number, string[]> = {};
  for (let i = 0; i <= 9; i++) {
    headMap[i] = [];
  }
  allTwoDigits.forEach((num) => {
    const h = parseInt(num.charAt(0), 10);
    if (!isNaN(h) && headMap[h]) {
      headMap[h].push(num);
    }
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="loto-sheet-title"
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
            <h3 id="loto-sheet-title" style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px' }}>
              Bảng Loto Đầu — Đuôi
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              Tổng hợp 27 giải theo đầu số (0 — 9)
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

        {/* Head-Tail Matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 10 }, (_, head) => {
            const list = headMap[head] || [];
            return (
              <div
                key={head}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 10,
                  backgroundColor: 'var(--surface-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    width: 60,
                    fontWeight: 800,
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      backgroundColor: 'var(--accent)',
                      color: 'var(--text-inverse)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                    }}
                  >
                    {head}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Đầu</span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {list.length > 0 ? (
                    list.map((num, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onInspectNumber?.(num);
                          onClose();
                        }}
                        className="touch-press tabular-numbers"
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        {num}
                      </button>
                    ))
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      (câm)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
