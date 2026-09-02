'use client';

import { useState, useRef, useEffect } from 'react';
import { normalizeNumber } from '@/app/lib/number-detail-engine';

interface NumberSearchModalProps {
  isOpen: boolean;
  currentNumber: string;
  onClose: () => void;
  onSelectNumber: (num: string) => void;
}

export default function NumberSearchModal({
  isOpen,
  currentNumber,
  onClose,
  onSelectNumber,
}: NumberSearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const prevIsOpenRef = useRef(isOpen);

  useEffect(() => {
    // Reset query when modal opens (transition from closed to open)
    if (isOpen && !prevIsOpenRef.current) {
      setQuery('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = (numToUse?: string) => {
    const target = numToUse || query;
    if (!target) return;
    const normalized = normalizeNumber(target);
    onSelectNumber(normalized);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Common quick picks
  const quickJumpNumbers = ['00', '03', '23', '29', '45', '56', '78', '89', '99'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
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
          padding: '20px 16px 32px',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle Bar */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'var(--border-strong)',
            margin: '0 auto 16px',
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h3
            id="search-modal-title"
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Tra cứu số khác (00–99)
          </h3>

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
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              placeholder="Nhập 2 chữ số (vd: 23, 05)..."
              value={query}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '').slice(0, 2);
                setQuery(cleaned);
              }}
              onKeyDown={handleKeyDown}
              style={{
                width: '100%',
                minHeight: 48,
                padding: '0 14px',
                borderRadius: 12,
                border: '1.5px solid var(--border-focus)',
                backgroundColor: 'var(--surface-subtle)',
                color: 'var(--text-primary)',
                fontSize: 16,
                fontWeight: 700,
                outline: 'none',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="touch-press"
                style={{
                  position: 'absolute',
                  right: 12,
                  border: 'none',
                  background: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => handleApply()}
            disabled={!query}
            className="touch-press"
            style={{
              minWidth: 80,
              minHeight: 48,
              borderRadius: 12,
              border: 'none',
              backgroundColor: query ? 'var(--accent-primary)' : 'var(--surface-muted)',
              color: query ? '#FFFFFF' : 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 700,
              cursor: query ? 'pointer' : 'default',
            }}
          >
            Xem số
          </button>
        </div>

        {/* Quick jump suggestions */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Số xem nhanh phổ biến
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 8,
            }}
          >
            {quickJumpNumbers.map((num) => {
              const isCurrent = num === currentNumber;
              return (
                <button
                  key={num}
                  onClick={() => handleApply(num)}
                  className="touch-press"
                  style={{
                    minHeight: 44,
                    borderRadius: 10,
                    border: isCurrent ? '1.5px solid var(--accent-primary)' : '1px solid var(--border)',
                    backgroundColor: isCurrent ? 'var(--accent-blue-bg)' : 'var(--surface-muted)',
                    color: isCurrent ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
