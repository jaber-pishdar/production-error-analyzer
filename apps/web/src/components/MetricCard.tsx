import React from 'react';

interface MetricCardProps {
  label: string;
  value: number;
  color: string;
}

export default function MetricCard({ label, value, color }: MetricCardProps) {
  return (
    <div
      style={{
        background: '#1e293b',
        borderRadius: 12,
        padding: 24,
        borderLeft: `4px solid ${color}`,
      }}
    >
      <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>{label}</p>
      <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '4px 0 0', color }}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}