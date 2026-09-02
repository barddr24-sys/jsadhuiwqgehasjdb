'use client';

import type { XSMBPrizes, DrawLifecycleState } from '@/app/lib/xsmb-types';
import PrizeResultRow from './PrizeResultRow';
import CollapsiblePrizeSection from './CollapsiblePrizeSection';

interface TodayResultSectionProps {
  prizes: XSMBPrizes | null;
  status: DrawLifecycleState;
  onInspectNumber?: (num: string) => void;
}

export default function TodayResultSection({
  prizes,
  status,
  onInspectNumber,
}: TodayResultSectionProps) {
  // If there's no data and not in drawing/updating/syncing/completed, don't show the board
  if (!prizes && status !== 'DRAWING' && status !== 'UPDATING' && status !== 'SYNCING' && status !== 'COMPLETED' && status !== 'RESULT_AVAILABLE') {
    return null;
  }

  const activePrizes = prizes || {
    dacBiet: [],
    giaiNhat: [],
    giaiNhi: [],
    giaiBa: [],
    giaiTu: [],
    giaiNam: [],
    giaiSau: [],
    giaiBay: [],
  };

  return (
    <section
      aria-label="Kết quả XSMB hôm nay"
      style={{
        margin: '0 16px 16px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
    >
      {/* Section Header */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--surface-subtle)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '0.08em',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            KẾT QUẢ XSMB HÔM NAY
          </h2>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--text-secondary)',
            letterSpacing: '0.04em',
          }}
        >
          27 GIẢI
        </span>
      </div>

      {/* Top Priority Groups (Always Visible) */}
      <PrizeResultRow
        label="ĐẶC BIỆT"
        shortLabel="ĐB"
        numbers={activePrizes.dacBiet || []}
        expectedCount={1}
        digits={5}
        isSpecial
        onInspectNumber={onInspectNumber}
      />

      <PrizeResultRow
        label="GIẢI NHẤT"
        shortLabel="G.1"
        numbers={activePrizes.giaiNhat || []}
        expectedCount={1}
        digits={5}
        onInspectNumber={onInspectNumber}
      />

      <PrizeResultRow
        label="GIẢI NHÌ"
        shortLabel="G.2"
        numbers={activePrizes.giaiNhi || []}
        expectedCount={2}
        digits={5}
        onInspectNumber={onInspectNumber}
      />

      <PrizeResultRow
        label="GIẢI BA"
        shortLabel="G.3"
        numbers={activePrizes.giaiBa || []}
        expectedCount={6}
        digits={5}
        onInspectNumber={onInspectNumber}
      />

      {/* Lower Priority Groups (Collapsible Accordion) */}
      <CollapsiblePrizeSection
        prizes={activePrizes}
        onInspectNumber={onInspectNumber}
        defaultExpanded={false}
      />
    </section>
  );
}
