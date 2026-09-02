'use client';

import { useState, useEffect } from 'react';
import { getSecondsUntilDraw, formatCountdown } from '@/app/lib/draw-status';

interface CountdownProps {
  initialSeconds?: number;
  onComplete?: () => void;
}

export default function Countdown({ initialSeconds, onComplete }: CountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    return initialSeconds !== undefined ? initialSeconds : getSecondsUntilDraw();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  const { hours, minutes, seconds } = formatCountdown(secondsLeft);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '12px 0 6px',
      }}
      aria-label={`Đếm ngược đến giờ quay thưởng: ${hours} giờ ${minutes} phút ${seconds} giây`}
    >
      {/* Hours */}
      <div style={{ textAlign: 'center' }}>
        <span
          className="countdown-digit tabular-numbers"
          style={{
            fontSize: 'clamp(28px, 7.5vw, 36px)',
            fontWeight: 800,
            lineHeight: 1,
            color: 'var(--text-primary)',
            display: 'inline-block',
            minWidth: '1.4em',
          }}
        >
          {hours}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginTop: 2,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Giờ
        </span>
      </div>

      <span
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text-muted)',
          marginBottom: 14,
          lineHeight: 1,
        }}
      >
        :
      </span>

      {/* Minutes */}
      <div style={{ textAlign: 'center' }}>
        <span
          className="countdown-digit tabular-numbers"
          style={{
            fontSize: 'clamp(28px, 7.5vw, 36px)',
            fontWeight: 800,
            lineHeight: 1,
            color: 'var(--text-primary)',
            display: 'inline-block',
            minWidth: '1.4em',
          }}
        >
          {minutes}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginTop: 2,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Phút
        </span>
      </div>

      <span
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text-muted)',
          marginBottom: 14,
          lineHeight: 1,
        }}
      >
        :
      </span>

      {/* Seconds */}
      <div style={{ textAlign: 'center' }}>
        <span
          className="countdown-digit tabular-numbers"
          style={{
            fontSize: 'clamp(28px, 7.5vw, 36px)',
            fontWeight: 800,
            lineHeight: 1,
            color: 'var(--text-primary)',
            display: 'inline-block',
            minWidth: '1.4em',
          }}
        >
          {seconds}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginTop: 2,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Giây
        </span>
      </div>
    </div>
  );
}
