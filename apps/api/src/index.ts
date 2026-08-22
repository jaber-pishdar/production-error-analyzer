import express from 'express';
import cors from 'cors';
import { parse, detectFormat } from '@pea/parser';
import { groupErrors, computeMetrics } from '@pea/analyzer';
import type { DashboardMetrics, NormalizedLogEntry } from '@pea/shared';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb', type: 'text/plain' }));

// In-memory store (will be replaced by PostgreSQL in production)
let currentEntries: NormalizedLogEntry[] = [];
let currentMetrics: DashboardMetrics | null = null;

// POST /api/parse — parse log input
app.post('/api/parse', (req, res) => {
  try {
    const input = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const format = req.query.format as string | undefined;
    const result = parse(input, format as any);

    currentEntries = result.entries;
    const groups = groupErrors(result.entries);
    currentMetrics = computeMetrics(groups, result.entries);

    res.json({
      entries: result.entries.length,
      errors: result.errors.length,
      parseErrors: result.errors,
      metrics: currentMetrics,
    });
  } catch (err) {
    res.status(400).json({ error: 'Failed to parse logs', details: String(err) });
  }
});

// POST /api/parse/detect — detect format and parse
app.post('/api/parse/detect', (req, res) => {
  try {
    const input = typeof req.body === 'string' ? req.body : '';
    const format = detectFormat(input);
    const result = parse(input, format);
    res.json({ detectedFormat: format, ...result });
  } catch (err) {
    res.status(400).json({ error: 'Detection failed', details: String(err) });
  }
});

// GET /api/metrics — get current dashboard metrics
app.get('/api/metrics', (_req, res) => {
  if (!currentMetrics) {
    return res.json({
      totalErrors: 0,
      uniqueErrors: 0,
      criticalErrors: 0,
      mostFrequent: [],
      errorsByEndpoint: {},
      errorsByTime: [],
    });
  }
  res.json(currentMetrics);
});

// GET /api/entries — get raw parsed entries
app.get('/api/entries', (_req, res) => {
  res.json(currentEntries);
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});