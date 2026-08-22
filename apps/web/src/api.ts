import type { NormalizedLogEntry, ErrorGroup, HttpMetrics, TimeSeries } from '@pea/shared';

export interface DashboardData {
  overview: { totalErrors: number; errorRate: number; criticalErrors: number; affectedEndpoints: number };
  groups: ErrorGroup[];
  httpMetrics: HttpMetrics;
  timeSeries: TimeSeries;
}

export interface ParseResponse {
  entriesCount: number;
  errorsCount: number;
  parseErrors: { line: number; message: string; raw: string }[];
  dashboard: DashboardData;
}

export async function postParse(logs: string): Promise<ParseResponse> {
  const res = await fetch('/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: logs,
  });
  if (!res.ok) throw new Error(`Parse failed: ${res.status}`);
  return res.json();
}

export async function getDashboard(): Promise<DashboardData> {
  const res = await fetch('/api/dashboard');
  return res.json();
}

export async function getTimeSeries(interval = '1h'): Promise<TimeSeries> {
  const res = await fetch(`/api/time-series?interval=${interval}`);
  return res.json();
}