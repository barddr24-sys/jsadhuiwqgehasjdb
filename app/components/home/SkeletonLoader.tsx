'use client';

/**
 * SkeletonLoader — Layout-matched loading skeleton.
 * Matches the structure of the actual HomeScreen content to prevent layout shifts.
 */

export default function SkeletonLoader() {
  return (
    <div aria-busy="true" aria-label="Đang tải kết quả..." role="status">
      {/* Date section skeleton */}
      <div style={{ padding: '20px 20px 12px', textAlign: 'center' }}>
        <div
          className="skeleton-box"
          style={{ width: 80, height: 12, borderRadius: 6, margin: '0 auto 8px' }}
        />
        <div
          className="skeleton-box"
          style={{ width: 200, height: 26, borderRadius: 6, margin: '0 auto 8px' }}
        />
        <div
          className="skeleton-box"
          style={{ width: 60, height: 20, borderRadius: 20, margin: '0 auto' }}
        />
      </div>

      {/* Date nav skeleton */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 16px 16px',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="skeleton-box"
            style={{ flex: 1, height: 48, borderRadius: 10 }}
          />
        ))}
      </div>

      {/* Status badge skeleton */}
      <div style={{ margin: '0 16px 16px' }}>
        <div
          className="skeleton-box"
          style={{ height: 42, borderRadius: 10 }}
        />
      </div>

      {/* Special prize hero skeleton */}
      <div
        style={{
          margin: '0 16px 20px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '24px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div
          className="skeleton-box"
          style={{ width: 100, height: 12, borderRadius: 6 }}
        />
        <div
          className="skeleton-box"
          style={{ width: 220, height: 56, borderRadius: 10 }}
        />
        <div
          className="skeleton-box"
          style={{ width: 80, height: 11, borderRadius: 6 }}
        />
      </div>

      {/* Prize board skeleton */}
      <div
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
            padding: '10px 16px',
          }}
        >
          <div className="skeleton-box" style={{ width: 100, height: 12, borderRadius: 6 }} />
        </div>
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderBottom: i < 6 ? '1px solid var(--border)' : undefined,
            }}
          >
            <div className="skeleton-box" style={{ width: 56, height: 12, borderRadius: 6, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {Array.from({ length: i === 2 ? 2 : i === 3 ? 3 : 1 }, (_, j) => (
                <div
                  key={j}
                  className="skeleton-box"
                  style={{ width: 60, height: 24, borderRadius: 6 }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
