import React from 'react';
import type { DashboardMetrics } from '@pea/shared';
import MetricCard from './MetricCard';
import ErrorTable from './ErrorTable';
import EndpointChart from './EndpointChart';
import TimeChart from './TimeChart';

interface DashboardProps {
  metrics: DashboardMetrics;
}

export default function Dashboard({ metrics }: DashboardProps) {
  return (
    <div>
      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <MetricCard label="Total Errors" value={metrics.totalErrors} color="#ef4444" />
        <MetricCard label="Unique Errors" value={metrics.uniqueErrors} color="#f59e0b" />
        <MetricCard label="Critical Errors" value={metrics.criticalErrors} color="#dc2626" />
      </div>

      {/* Most frequent errors */}
      <section
        style={{
          background: '#1e293b',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 16px' }}>
          Most Frequent Errors
        </h2>
        <ErrorTable groups={metrics.mostFrequent} />
      </section>

      {/* Charts row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <section
          style={{
            background: '#1e293b',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 16px' }}>
            Errors by Endpoint
          </h2>
          <EndpointChart data={metrics.errorsByEndpoint} />
        </section>
        <section
          style={{
            background: '#1e293b',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 16px' }}>
            Errors by Time
          </h2>
          <TimeChart data={metrics.errorsByTime} />
        </section>
      </div>
    </div>
  );
}