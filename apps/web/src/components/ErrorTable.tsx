import React from 'react';
import type { ErrorGroup } from '@pea/shared';

interface ErrorTableProps {
  groups: ErrorGroup[];
}

export default function ErrorTable({ groups }: ErrorTableProps) {
  if (groups.length === 0) {
    return <p style={{ color: '#64748b' }}>No errors found</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
            <th style={{ padding: '8px 12px' }}>Count</th>
            <th style={{ padding: '8px 12px' }}>Level</th>
            <th style={{ padding: '8px 12px' }}>Error</th>
            <th style={{ padding: '8px 12px' }}>Endpoints</th>
            <th style={{ padding: '8px 12px' }}>First Seen</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.fingerprint} style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ padding: '10px 12px', fontWeight: 700, color: '#f59e0b' }}>
                {g.count}
              </td>
              <td style={{ padding: '10px 12px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: g.level === 'critical' ? '#450a0a' : '#1e293b',
                    color: g.level === 'critical' ? '#fca5a5' : '#94a3b8',
                  }}
                >
                  {g.level}
                </span>
              </td>
              <td style={{ padding: '10px 12px', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {g.message}
              </td>
              <td style={{ padding: '10px 12px' }}>{g.endpoints.join(', ') || '-'}</td>
              <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '0.75rem' }}>
                {g.firstSeen.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}