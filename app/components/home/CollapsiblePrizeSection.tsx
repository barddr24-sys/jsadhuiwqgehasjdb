'use client';

import { useState } from 'react';
import type { XSMBPrizes } from '@/app/lib/xsmb-types';
import PrizeResultRow from './PrizeResultRow';

interface CollapsiblePrizeSectionProps {
  prizes: XSMBPrizes;
  onInspectNumber?: (num: string) => void;
  defaultExpanded?: boolean;
}

export default function CollapsiblePrizeSection({
  prizes,
  onInspectNumber,
  defaultExpanded = false,
}: CollapsiblePrizeSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const collapsedCount = (prizes.giaiTu?.length || 0) +
                         (prizes.giaiNam?.length || 0) +
                         (prizes.giaiSau?.length || 0) +
                         (prizes.giaiBay?.length || 0);

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      {/* Accordion Toggle Header */}
      <button
        id="btn-toggle-collapsible-prizes"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="collapsible-prizes-content"
        className="touch-press"
        style={{
          width: '100%',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: isExpanded ? 'var(--surface-subtle)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
            }}
          >
            GIẢI TƯ ĐẾN GIẢI BẢY
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              padding: '2px 7px',
              borderRadius: 12,
            }}
          >
            {isExpanded ? '17 số' : `${collapsedCount}/17 số`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-primary)' }}>
            {isExpanded ? 'Thu gọn' : 'Xem đầy đủ'}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              color: 'var(--accent-primary)',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div id="collapsible-prizes-content" className="animate-slide-up">
          <PrizeResultRow
            label="GIẢI TƯ"
            shortLabel="G.4"
            numbers={prizes.giaiTu || []}
            expectedCount={4}
            digits={4}
            onInspectNumber={onInspectNumber}
          />
          <PrizeResultRow
            label="GIẢI NĂM"
            shortLabel="G.5"
            numbers={prizes.giaiNam || []}
            expectedCount={6}
            digits={4}
            onInspectNumber={onInspectNumber}
          />
          <PrizeResultRow
            label="GIẢI SÁU"
            shortLabel="G.6"
            numbers={prizes.giaiSau || []}
            expectedCount={3}
            digits={3}
            onInspectNumber={onInspectNumber}
          />
          <PrizeResultRow
            label="GIẢI BẢY"
            shortLabel="G.7"
            numbers={prizes.giaiBay || []}
            expectedCount={4}
            digits={2}
            onInspectNumber={onInspectNumber}
          />
        </div>
      )}
    </div>
  );
}
