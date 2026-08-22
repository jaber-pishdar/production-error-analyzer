import React, { useState, useCallback } from 'react';
import type { DashboardData, ErrorGroup } from '@pea/shared';
import Header from './components/Header';
import LogInput from './components/LogInput';
import OverviewCards from './components/OverviewCards';
import ErrorGroupList from './components/ErrorGroupList';
import TimelineChart from './components/TimelineChart';
import EndpointTable from './components/EndpointTable';
import ErrorDetail from './components/ErrorDetail';
import { postParse } from './api';
import './styles.css';

export default function App() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ErrorGroup | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = useCallback(async (logs: string) => {
    setLoading(true);
    setError(null);
    setSelectedGroup(null);
    try {
      const data = await postParse(logs);
      setDashboard(data.dashboard);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setDashboard(null);
    setSelectedGroup(null);
    setError(null);
  }, []);

  const handleSelectGroup = useCallback((group: ErrorGroup) => {
    setSelectedGroup(group);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="app">
      <Header onReset={handleReset} />

      <main className="main">
        {!dashboard && (
          <>
            <LogInput onParse={handleParse} loading={loading} />
            {error && <div className="error-banner">{error}</div>}
            {!loading && !error && (
              <div className="welcome">
                <p>Paste your production logs above to get instant error intelligence.</p>
                <p className="hint">Supports Node.js log format with timestamps, levels, and stack traces.</p>
              </div>
            )}
          </>
        )}

        {loading && <div className="loading">Parsing and analyzing…</div>}

        {dashboard && !loading && (
          <>
            {selectedGroup ? (
              <ErrorDetail group={selectedGroup} onBack={() => setSelectedGroup(null)} />
            ) : (
              <>
                <OverviewCards {...dashboard.overview} />
                <TimelineChart series={dashboard.timeSeries} />
                <ErrorGroupList
                  groups={dashboard.groups}
                  onSelect={handleSelectGroup}
                  selectedFingerprint={undefined}
                />
                <EndpointTable metrics={dashboard.httpMetrics} />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}