'use client';

import type { LotoPeriod } from '@/app/lib/loto-engine';

interface LotoDateContextProps {
  period: LotoPeriod;
  dateDisplay: string;
}

export default function LotoDateContext({
  period,
  dateDisplay,
}: LotoDateContextProps) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '6px 16px 10px',
        color: 'var(--text-secondary)',
        fontSize: 13,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
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
        style={{ color: 'var(--text-muted)' }}
      >
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span>{dateDisplay}</span>
      {period !== 'today' && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: 6,
            backgroundColor: 'var(--accent-blue-bg)',
            color: 'var(--accent-primary)',
            border: '1px solid var(--accent-blue-border)',
          }}
        >
          {period === '3days' ? '3 kỳ gần nhất' : '7 kỳ gần nhất'}
        </span>
      )}
    </div>
  );
}
