'use client';

import type { XSMBPrizes, DrawLifecycleState } from '@/app/lib/xsmb-types';
import { PRIZE_GROUPS } from '@/app/lib/xsmb-types';
import PrizeRow from './PrizeRow';

interface PrizeBoardProps {
  prizes: XSMBPrizes | null;
  status: DrawLifecycleState;
}

export default function PrizeBoard({ prizes, status }: PrizeBoardProps) {
  const showBoard =
    status === 'COMPLETED' ||
    status === 'UPDATING';

  if (!showBoard) return null;

  const boardGroups = PRIZE_GROUPS.filter((g) => g.key !== 'dacBiet');

  return (
    <section
      aria-label="Bảng kết quả xổ số"
      style={{
        margin: '0 16px 24px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface-muted)',
          borderBottom: '1px solid var(--border)',
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 16,
          paddingRight: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: 'var(--text-secondary)',
          }}
        >
          BẢNG KẾT QUẢ
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
          }}
        >
          XSMB · MIỀN BẮC
        </span>
      </div>

      {boardGroups.map((group) => {
        const nums = prizes?.[group.key] ?? [];
        const isFirst = group.key === 'giaiNhat';
        return (
          <PrizeRow
            key={group.key}
            label={group.label}
            numbers={nums}
            expectedCount={group.count}
            digits={group.digits}
            isFirst={isFirst}
          />
        );
      })}

      <div
        style={{
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 16,
          paddingRight: 16,
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
          }}
        >
          Kết quả chính thức từ Công ty Xổ Số Kiến Thiết
        </span>
      </div>
    </section>
  );
}
