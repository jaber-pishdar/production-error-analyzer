import React from 'react';
import type { TimeSeries } from '@pea/shared';

interface Props {
  series: TimeSeries;
}

export default function TimelineChart({ series }: Props) {
  const { buckets, spikeBuckets } = series;

  if (buckets.length === 0) {
    return (
      <div className="section">
        <h2>Timeline</h2>
        <div className="empty-state">No time-series data.</div>
      </div>
    );
  }

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const spikeTimes = new Set(spikeBuckets.map((b) => b.time));

  return (
    <div className="section">
      <h2>Timeline <span className="interval-label">{series.interval}</span></h2>
      <div className="timeline" style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 140 }}>
        {buckets.map((b, i) => {
          const isSpike = spikeTimes.has(b.time);
          const height = (b.count / maxCount) * 120;
          const timeLabel = formatBucketTime(b.time);
          return (
            <div
              key={i}
              className={`timeline-bar${isSpike ? ' spike' : ''}`}
              style={{ height: Math.max(height, 4) }}
              title={`${timeLabel}: ${b.count} errors${isSpike ? ' ⚡ spike' : ''}`}
            >
              {b.count > maxCount * 0.7 && (
                <span className="bar-val">{b.count}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="timeline-labels">
        {buckets.map((b, i) => (
          <span key={i} className="tl-label">{formatBucketLabel(b.time, i, buckets.length)}</span>
        ))}
      </div>
      {spikeBuckets.length > 0 && (
        <div className="spike-note">
          ⚡ <strong>{spikeBuckets.length} spike{spikeBuckets.length > 1 ? 's' : ''}</strong> detected —
          bucket{spikeBuckets.length > 1 ? 's' : ''} with &gt;3× the average error count
        </div>
      )}
    </div>
  );
}

function formatBucketTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatBucketLabel(iso: string, i: number, total: number): string {
  const d = new Date(iso);
  // Show every label, but for dense data show fewer
  if (total > 24 && i % Math.ceil(total / 12) !== 0 && i !== total - 1) return '';
  return d.toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' });
}