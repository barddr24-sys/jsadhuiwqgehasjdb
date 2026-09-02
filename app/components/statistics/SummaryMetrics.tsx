'use client';

interface SummaryMetricsProps {
  totalOccurrences: number;
  uniqueNumbersCount: number;
  averagePerDay: number;
}

export default function SummaryMetrics({
  totalOccurrences,
  uniqueNumbersCount,
  averagePerDay,
}: SummaryMetricsProps) {
  return (
    <section
      aria-label="Chỉ số thống kê tổng quan"
      style={{
        margin: '0 16px 16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
      }}
    >
      {/* 1. TỔNG LƯỢT */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 14,
          padding: '12px 10px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          className="tabular-numbers"
          style={{
            fontSize: 'clamp(24px, 6vw, 30px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}
        >
          {totalOccurrences}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            marginTop: 4,
          }}
        >
          Tổng lượt
        </div>
      </div>

      {/* 2. SỐ KHÁC NHAU */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 14,
          padding: '12px 10px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          className="tabular-numbers"
          style={{
            fontSize: 'clamp(24px, 6vw, 30px)',
            fontWeight: 800,
            color: 'var(--accent-primary)',
            lineHeight: 1.1,
          }}
        >
          {uniqueNumbersCount}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            marginTop: 4,
          }}
        >
          Số khác nhau
        </div>
      </div>

      {/* 3. TRUNG BÌNH */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 14,
          padding: '12px 10px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          className="tabular-numbers"
          style={{
            fontSize: 'clamp(22px, 5.5vw, 28px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}
        >
          {averagePerDay}
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>/ngày</span>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            marginTop: 4,
          }}
        >
          Trung bình
        </div>
      </div>
    </section>
  );
}
