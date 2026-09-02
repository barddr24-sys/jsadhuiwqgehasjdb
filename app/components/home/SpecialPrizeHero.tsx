'use client';

import type { DrawLifecycleState } from '@/app/lib/xsmb-types';

interface SpecialPrizeHeroProps {
  number: string | null;
  status: DrawLifecycleState;
}

export default function SpecialPrizeHero({ number, status }: SpecialPrizeHeroProps) {
  const showNumber = Boolean(number) && (status === 'COMPLETED' || status === 'UPDATING');

  return (
    <section
      aria-label="Giải Đặc Biệt"
      style={{
        margin: '0 16px 20px',
        borderRadius: 16,
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        padding: '24px 20px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: 'var(--prize-accent)',
          borderRadius: '16px 16px 0 0',
        }}
      />

      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: 'var(--text-muted)',
          margin: '0 0 16px',
          textTransform: 'uppercase',
        }}
      >
        GIẢI ĐẶC BIỆT
      </p>

      {showNumber ? (
        <div
          className="fade-in"
          aria-label={`Số trúng giải đặc biệt: ${number}`}
        >
          <span
            className="special-prize-text prize-num"
            aria-hidden="true"
          >
            {number}
          </span>
        </div>
      ) : (
        <SpecialPrizePlaceholder status={status} />
      )}

      <p
        style={{
          marginTop: 16,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: showNumber ? 'var(--status-completed-text)' : 'var(--text-muted)',
        }}
      >
        {getSubLabel(status)}
      </p>
    </section>
  );
}

function SpecialPrizePlaceholder({ status }: { status: DrawLifecycleState }) {
  if (status === 'SCHEDULED' || status === 'FUTURE') {
    return (
      <div
        aria-label="Chưa có kết quả"
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: 'var(--border-strong)',
            letterSpacing: '0.12em',
            fontVariantNumeric: 'tabular-nums',
          }}
          aria-hidden="true"
        >
          ·····
        </span>
      </div>
    );
  }

  if (status === 'DRAWING' || status === 'UPDATING') {
    return (
      <div
        aria-label="Đang cập nhật"
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="skeleton-box" style={{ width: 180, height: 52, borderRadius: 8 }} />
      </div>
    );
  }

  return (
    <div
      aria-label="Không có dữ liệu"
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--border-strong)',
          letterSpacing: '0.1em',
        }}
        aria-hidden="true"
      >
        — — —
      </span>
    </div>
  );
}

function getSubLabel(status: DrawLifecycleState): string {
  switch (status) {
    case 'COMPLETED': return 'ĐÃ CÓ KẾT QUẢ';
    case 'UPDATING':  return 'ĐANG CẬP NHẬT';
    case 'DRAWING':   return 'ĐANG QUAY THƯỞNG';
    case 'FUTURE':    return 'CHƯA ĐẾN NGÀY QUAY';
    case 'SCHEDULED': return 'CHƯA ĐẾN GIỜ QUAY';
    case 'DELAYED':   return 'KẾT QUẢ ĐANG CHẬM';
    case 'ERROR':     return 'KHÔNG CÓ DỮ LIỆU';
    default:          return '';
  }
}
