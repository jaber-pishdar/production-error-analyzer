import React, { useState } from 'react';
import type { DashboardMetrics } from '@pea/shared';
import Dashboard from './components/Dashboard';
import LogInput from './components/LogInput';

function App() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const handleParse = async (logs: string, format?: string) => {
    setLoading(true);
    try {
      const url = format
        ? `/api/parse?format=${encodeURIComponent(format)}`
        : '/api/parse';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: logs,
      });
      const data = await res.json();
      if (data.metrics) setMetrics(data.metrics);
    } catch (err) {
      console.error('Parse failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <header style={{ padding: '24px', borderBottom: '1px solid #1e293b' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          Production Error Analyzer
        </h1>
        <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>
          Paste your logs, get instant error intelligence
        </p>
      </header>
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>
        <LogInput onParse={handleParse} loading={loading} />
        {metrics && <Dashboard metrics={metrics} />}
        {!metrics && !loading && (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              color: '#64748b',
            }}
          >
            <p style={{ fontSize: '1.125rem' }}>
              Paste your production logs above to see error analysis
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;