import React, { useState, useMemo } from 'react';
import type { ErrorGroup, Severity } from '@pea/shared';

interface Props {
  groups: ErrorGroup[];
  onSelect: (group: ErrorGroup) => void;
  selectedFingerprint?: string;
}

type SortKey = 'count' | 'severity' | 'firstSeen';
type SortDir = 'asc' | 'desc';

const SEVERITY_ORDER: Record<Severity, number> = {
  info: 0, low: 1, warning: 2, high: 3, critical: 4,
};
const SEVERITY_COLORS: Record<Severity, string> = {
  info: '#64748b', low: '#22c55e', warning: '#f59e0b', high: '#ef4444', critical: '#dc2626',
};

export default function ErrorGroupList({ groups, onSelect, selectedFingerprint }: Props) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('count');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');

  const sorted = useMemo(() => {
    let filtered = groups;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = groups.filter((g) => g.message.toLowerCase().includes(q));
    }
    if (severityFilter !== 'all') {
      filtered = filtered.filter((g) => g.severity === severityFilter);
    }
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'count') cmp = a.count - b.count;
      else if (sortKey === 'severity') cmp = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      else if (sortKey === 'firstSeen') cmp = new Date(a.firstSeen).getTime() - new Date(b.firstSeen).getTime();
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [groups, search, sortKey, sortDir, severityFilter]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  function sortArrow(key: SortKey) {
    if (sortKey !== key) return '';
    return sortDir === 'desc' ? ' ↓' : ' ↑';
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2>Error Groups</h2>
        <div className="toolbar">
          <input
            className="search-input"
            placeholder="Search errors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="filter-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as Severity | 'all')}
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="warning">Warning</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 && <div className="empty-state">No errors match the current filters.</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th className="clickable" onClick={() => toggleSort('severity')}>Sev{sortArrow('severity')}</th>
              <th>Error</th>
              <th className="clickable" onClick={() => toggleSort('count')}>Count{sortArrow('count')}</th>
              <th>Stack</th>
              <th className="clickable" onClick={() => toggleSort('firstSeen')}>First{sortArrow('firstSeen')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((g) => (
              <tr
                key={g.fingerprint}
                className={`clickable-row ${selectedFingerprint === g.fingerprint ? 'selected' : ''}`}
                onClick={() => onSelect(g)}
              >
                <td>
                  <span className="severity-badge" style={{ background: SEVERITY_COLORS[g.severity] }}>
                    {g.severity}
                  </span>
                </td>
                <td className="cell-message" title={g.message}>{g.message}</td>
                <td className="cell-count">{g.count}</td>
                <td className="cell-stack">{g.stackTrace ? 'yes' : '—'}</td>
                <td className="cell-time">{formatTime(g.firstSeen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}