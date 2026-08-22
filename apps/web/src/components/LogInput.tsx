import React, { useState } from 'react';

interface LogInputProps {
  onParse: (logs: string, format?: string) => void;
  loading: boolean;
}

const FORMATS = [
  { value: '', label: 'Auto-detect' },
  { value: 'json', label: 'JSON' },
  { value: 'apache', label: 'Apache / Nginx' },
  { value: 'nodejs', label: 'Node.js' },
  { value: 'php', label: 'PHP' },
  { value: 'python', label: 'Python' },
];

export default function LogInput({ onParse, loading }: LogInputProps) {
  const [logs, setLogs] = useState('');
  const [format, setFormat] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logs.trim()) return;
    onParse(logs, format || undefined);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: '#1e293b',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        <label
          htmlFor="format-select"
          style={{ color: '#94a3b8', fontSize: '0.875rem' }}
        >
          Log format:
        </label>
        <select
          id="format-select"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          style={{
            background: '#0f172a',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: '0.875rem',
          }}
        >
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={logs}
        onChange={(e) => setLogs(e.target.value)}
        placeholder="Paste your production logs here..."
        rows={12}
        style={{
          width: '100%',
          background: '#0f172a',
          color: '#e2e8f0',
          border: '1px solid #334155',
          borderRadius: 8,
          padding: 16,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          fontSize: '0.875rem',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
      <button
        type="submit"
        disabled={loading || !logs.trim()}
        style={{
          marginTop: 12,
          padding: '10px 24px',
          background: loading ? '#334155' : '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Analyzing...' : 'Analyze Errors'}
      </button>
    </form>
  );
}