import React from 'react';

interface Props {
  totalErrors: number;
  errorRate: number;
  criticalErrors: number;
  affectedEndpoints: number;
}

export default function OverviewCards({ totalErrors, errorRate, criticalErrors, affectedEndpoints }: Props) {
  const cards = [
    { label: 'Total Errors', value: totalErrors.toLocaleString(), color: '#ef4444' },
    { label: 'Error Rate', value: `${errorRate}%`, color: '#f59e0b', suffix: 'of all requests' },
    { label: 'Critical', value: criticalErrors.toLocaleString(), color: '#dc2626', suffix: 'error groups' },
    { label: 'Affected Endpoints', value: affectedEndpoints.toLocaleString(), color: '#3b82f6', suffix: 'endpoints' },
  ];

  return (
    <div className="overview-grid">
      {cards.map((c) => (
        <div key={c.label} className="card" style={{ borderLeftColor: c.color }}>
          <div className="card-label">{c.label}</div>
          <div className="card-value" style={{ color: c.color }}>{c.value}</div>
          {c.suffix && <div className="card-suffix">{c.suffix}</div>}
        </div>
      ))}
    </div>
  );
}