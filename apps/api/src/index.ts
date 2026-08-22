import express from 'express';
import cors from 'cors';
import { parse } from '@pea/parser';
import { groupErrors, computeHttpMetrics, aggregateByTime, detectRegression } from '@pea/analyzer';
import type { NormalizedLogEntry } from '@pea/shared';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.text({ limit: '10mb', type: 'text/plain' }));
app.use(express.json({ limit: '10mb' }));

let currentEntries: NormalizedLogEntry[] = [];
let currentGroups = 0;

// POST /api/parse — parse Node.js log input
app.post('/api/parse', (req, res) => {
  try {
    const input = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const result = parse(input);

    currentEntries = result.entries;
    const groups = groupErrors(result.entries);
    currentGroups = groups.length;

    res.json({
      entriesCount: result.entries.length,
      errorsCount: result.errors.length,
      groupsCount: groups.length,
      parseErrors: result.errors,
      entries: result.entries,
      groups: groups,
      httpMetrics: computeHttpMetrics(result.entries),
    });
  } catch (err) {
    res.status(400).json({ error: 'Failed to parse logs', details: String(err) });
  }
});

// GET /api/http-metrics — compute HTTP metrics from current entries
app.get('/api/http-metrics', (_req, res) => {
  res.json(computeHttpMetrics(currentEntries));
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