import React from 'react';
import type { TimeBucket } from '@pea/shared';

interface TimeChartProps {
  data: TimeBucket[];
}

export default function TimeChart({ data }: TimeChartProps) {
  if (data.length === 0) {
    return <p style={{ color: '#64748b', textAlign: 'center' }}>No time-series data</p>;
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160 }}>
      {data.map((bucket, i) => {
        const height = (bucket.count / maxCount) * 140;
        const timeLabel = bucket.time.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        return (
          <div
            key={i}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
            title={`${timeLabel}: ${bucket.count} errors`}
          >
            <span style={{ fontSize: '0.625rem', color: '#94a3b8' }}>{bucket.count}</span>
            <div
              style={{
                width: '100%',
                height: Math.max(height, 4),
                background: '#3b82f6',
                borderRadius: '4px 4px 0 0',
                opacity: 0.8,
                transition: 'height 0.3s',
              }}
            />
            <span style={{ fontSize: '0.625rem', color: '#64748b' }}>{timeLabel}</span>
          </div>
        );
      })}
    </div>
  );
}