import React from 'react';

interface EndpointChartProps {
  data: Record<string, number>;
}

export default function EndpointChart({ data }: EndpointChartProps) {
  const entries = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  if (entries.length === 0) {
    return <p style={{ color: '#64748b', textAlign: 'center' }}>No endpoint data</p>;
  }

  const maxCount = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div>
      {entries.map(([endpoint, count]) => (
        <div key={endpoint} style={{ marginBottom: 8 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              marginBottom: 2,
            }}
          >
            <span style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {endpoint}
            </span>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{count}</span>
          </div>
          <div
            style={{
              height: 8,
              background: '#0f172a',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(count / maxCount) * 100}%`,
                height: '100%',
                background: '#3b82f6',
                borderRadius: 4,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}