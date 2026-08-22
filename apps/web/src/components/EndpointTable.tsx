import React from 'react';
import type { HttpMetrics } from '@pea/shared';

interface Props {
  metrics: HttpMetrics;
}

export default function EndpointTable({ metrics }: Props) {
  if (metrics.endpoints.length === 0) {
    return (
      <div className="section">
        <h2>Endpoint Analysis</h2>
        <div className="empty-state">No HTTP request data found.</div>
      </div>
    );
  }

  const maxRate = Math.max(...metrics.endpoints.map((e) => e.errorRate), 1);

  return (
    <div className="section">
      <h2>Endpoint Analysis</h2>
      <div className="overview-grid" style={{ marginBottom: 16 }}>
        <div className="card" style={{ borderLeftColor: '#8b5cf6' }}>
          <div className="card-label">Total Requests</div>
          <div className="card-value" style={{ color: '#8b5cf6' }}>{metrics.totalRequests.toLocaleString()}</div>
        </div>
        <div className="card" style={{ borderLeftColor: '#ef4444' }}>
          <div className="card-label">Overall Error Rate</div>
          <div className="card-value" style={{ color: '#ef4444' }}>{metrics.overallErrorRate.toFixed(1)}%</div>
        </div>
        {metrics.worstEndpoint && (
          <div className="card" style={{ borderLeftColor: '#dc2626' }}>
            <div className="card-label">Worst Endpoint</div>
            <div className="card-value" style={{ color: '#dc2626', fontSize: '1rem' }}>
              {metrics.worstEndpoint.method} {metrics.worstEndpoint.endpoint}
            </div>
            <div className="card-suffix">{metrics.worstEndpoint.errorRate.toFixed(0)}% error rate</div>
          </div>
        )}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Total</th>
              <th>Errors</th>
              <th>Error Rate</th>
              <th>Status Codes</th>
            </tr>
          </thead>
          <tbody>
            {metrics.endpoints.map((ep) => (
              <tr key={`${ep.method} ${ep.endpoint}`}>
                <td><code>{ep.method} {ep.endpoint}</code></td>
                <td>{ep.total}</td>
                <td style={{ color: ep.errors > 0 ? '#ef4444' : undefined }}>{ep.errors}</td>
                <td>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${(ep.errorRate / maxRate) * 100}%`,
                        background: ep.errorRate > 50 ? '#dc2626' : ep.errorRate > 10 ? '#f59e0b' : '#22c55e',
                      }}
                    />
                    <span className="bar-label">{ep.errorRate.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="cell-stack">
                  {Object.entries(ep.statusCodes)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([code, count]) => (
                      <span key={code} className="status-chip" data-code={code}>{code}:{count}</span>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}