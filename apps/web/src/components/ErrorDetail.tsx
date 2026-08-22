import React from 'react';
import type { ErrorGroup } from '@pea/shared';

interface Props {
  group: ErrorGroup;
  onBack: () => void;
}

export default function ErrorDetail({ group, onBack }: Props) {
  return (
    <div className="section">
      <div className="section-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2 style={{ margin: 0 }}>Error Detail</h2>
      </div>

      <div className="detail-grid">
        <div className="detail-field">
          <span className="field-label">Message</span>
          <pre className="field-value">{group.message}</pre>
        </div>

        <div className="detail-row">
          <div className="detail-field-mini">
            <span className="field-label">Severity</span>
            <span className={`severity-badge badge-${group.severity}`}>{group.severity}</span>
          </div>
          <div className="detail-field-mini">
            <span className="field-label">Occurrences</span>
            <span className="field-value">{group.count}</span>
          </div>
          <div className="detail-field-mini">
            <span className="field-label">Level</span>
            <span className="field-value">{group.level}</span>
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-field-mini">
            <span className="field-label">First Seen</span>
            <span className="field-value">{new Date(group.firstSeen).toLocaleString()}</span>
          </div>
          <div className="detail-field-mini">
            <span className="field-label">Last Seen</span>
            <span className="field-value">{new Date(group.lastSeen).toLocaleString()}</span>
          </div>
        </div>

        {group.stackTrace && (
          <div className="detail-field">
            <span className="field-label">Stack Trace</span>
            <pre className="field-value stack">{group.stackTrace}</pre>
          </div>
        )}
      </div>
    </div>
  );
}