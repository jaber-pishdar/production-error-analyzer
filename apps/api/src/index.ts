import express from 'express';
import cors from 'cors';
import { parse } from '@pea/parser';
import {
  groupErrors,
  computeHttpMetrics,
  aggregateByTime,
  detectRegression,
  classifyGroupSeverity,
} from '@pea/analyzer';
import type { NormalizedLogEntry, DashboardData } from '@pea/shared';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.text({ limit: '10mb', type: 'text/plain' }));
app.use(express.json({ limit: '10mb' }));

let currentEntries: NormalizedLogEntry[] = [];

function buildDashboard(entries: NormalizedLogEntry[]): DashboardData {
  const groups = groupErrors(entries);
  const httpMetrics = computeHttpMetrics(entries);
  const timeSeries = aggregateByTime(entries, '1h');
  const errorEntries = entries.filter(
    (e) => e.level === 'warn' || e.level === 'error' || e.level === 'fatal' || e.level === 'critical',
  );
  const totalErrors = errorEntries.length;
  const criticalErrors = groups.filter((g) => classifyGroupSeverity(g) === 'critical').length;
  const reqCount = httpMetrics.totalRequests;
  const errorRate = reqCount > 0 ? Math.round((httpMetrics.totalErrors / reqCount) * 100 * 10) / 10 : 0;
  const affectedEndpoints = httpMetrics.endpoints.filter((e) => e.errors > 0).length;

  return {
    overview: { totalErrors, errorRate, criticalErrors, affectedEndpoints },
    groups,
    httpMetrics,
    timeSeries,
  };
}

// POST /api/parse — parse logs and return full dashboard data
app.post('/api/parse', (req, res) => {
  try {
    const input = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const result = parse(input);
    currentEntries = result.entries;

    res.json({
      entriesCount: result.entries.length,
      errorsCount: result.errors.length,
      parseErrors: result.errors,
      dashboard: buildDashboard(result.entries),
    });
  } catch (err) {
    res.status(400).json({ error: 'Failed to parse logs', details: String(err) });
  }
});

// GET /api/dashboard — refresh dashboard from current entries
app.get('/api/dashboard', (_req, res) => {
  res.json(buildDashboard(currentEntries));
});

// GET /api/time-series — aggregate errors by time interval
app.get('/api/time-series', (req, res) => {
  const interval = (req.query.interval as string) || '1h';
  res.json(aggregateByTime(currentEntries, interval as any));
});

// GET /api/regression — detect regression after a release time
app.get('/api/regression', (req, res) => {
  const releaseTime = req.query.release as string;
  if (!releaseTime) {
    return res.status(400).json({ error: 'Missing "release" query parameter (ISO-8601 timestamp)' });
  }
  res.json(detectRegression(currentEntries, releaseTime));
});

// GET /api/entries — get raw parsed entries
app.get('/api/entries', (_req, res) => {
  res.json(currentEntries);
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});