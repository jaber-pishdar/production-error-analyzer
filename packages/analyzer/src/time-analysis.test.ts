import { describe, it, expect } from 'vitest';
import { aggregateByTime, detectRegression } from '../src/time-analysis.js';
import type { NormalizedLogEntry } from '@pea/shared';

function entry(ts: string, level: string = 'error'): NormalizedLogEntry {
  return {
    id: 't',
    timestamp: new Date(ts),
    level: level as any,
    message: 'Something went wrong',
    source: 'node',
    raw: '',
  };
}

// ---- Day 12: Time Aggregation ---- //

describe('aggregateByTime', () => {
  it('returns empty series for no entries', () => {
    const result = aggregateByTime([], '1h');
    expect(result.buckets).toHaveLength(0);
    expect(result.spikeBuckets).toHaveLength(0);
  });

  it('groups entries into hourly buckets', () => {
    const entries = [
      entry('2026-08-22T10:15:00Z'),
      entry('2026-08-22T10:30:00Z'),
      entry('2026-08-22T10:45:00Z'),
      entry('2026-08-22T11:05:00Z'),
    ];
    const result = aggregateByTime(entries, '1h');
    expect(result.buckets).toHaveLength(2);
    expect(result.buckets[0].count).toBe(3);
    expect(result.buckets[1].count).toBe(1);
  });

  it('filters out info/debug entries', () => {
    const entries = [
      entry('2026-08-22T10:00:00Z', 'info'),
      entry('2026-08-22T10:00:00Z', 'error'),
      entry('2026-08-22T10:00:00Z', 'debug'),
    ];
    const result = aggregateByTime(entries, '1h');
    expect(result.buckets[0].count).toBe(1);
  });

  it('detects spike buckets (count > 3× mean)', () => {
    const entries: NormalizedLogEntry[] = [];
    for (let i = 0; i < 4; i++)   entries.push(entry('2026-08-22T10:00:00Z'));
    for (let i = 0; i < 7; i++)   entries.push(entry('2026-08-22T11:00:00Z'));
    for (let i = 0; i < 12; i++)  entries.push(entry('2026-08-22T12:00:00Z'));
    for (let i = 0; i < 87; i++)  entries.push(entry('2026-08-22T13:00:00Z'));
    for (let i = 0; i < 15; i++)  entries.push(entry('2026-08-22T14:00:00Z'));

    const result = aggregateByTime(entries, '1h');
    expect(result.spikeBuckets.some((b) => b.count === 87)).toBe(true);
  });

  it('does not flag non-spike buckets', () => {
    const entries = [
      entry('2026-08-22T10:00:00Z'),
      entry('2026-08-22T10:00:00Z'),
      entry('2026-08-22T11:00:00Z'),
      entry('2026-08-22T11:00:00Z'),
    ];
    const result = aggregateByTime(entries, '1h');
    expect(result.spikeBuckets).toHaveLength(0);
  });

  it('supports 5-minute intervals', () => {
    const entries = [
      entry('2026-08-22T10:00:00Z'),
      entry('2026-08-22T10:03:00Z'),
      entry('2026-08-22T10:07:00Z'),
    ];
    const result = aggregateByTime(entries, '5m');
    expect(result.buckets).toHaveLength(2);
    expect(result.buckets[0].count).toBe(2);
    expect(result.buckets[1].count).toBe(1);
  });
});

// ---- Day 13: Regression Detection ---- //

describe('detectRegression', () => {
  function makeEntries(times: string[]): NormalizedLogEntry[] {
    return times.map((t) => ({
      id: 't',
      timestamp: new Date(t),
      level: 'error' as const,
      message: 'Something went wrong',
      source: 'node',
      raw: '',
    }));
  }

  const releaseTime = '2026-08-22T12:00:00Z';

  it('detects a regression when error rate jumps sharply after release', () => {
    // Before release: 50 errors spread over hours 0-9 (10 hours) → ~5/h
    // After release: 92 errors in hour 12 over 60 minutes → ~92/h
    const before = makeEntries(
      Array.from({ length: 50 }, (_, i) =>
        `2026-08-22T${String(Math.floor(i / 5)).padStart(2, '0')}:${String((i % 5) * 12).padStart(2, '0')}:00Z`),
    );
    const after = makeEntries(
      Array.from({ length: 92 }, (_, i) =>
        `2026-08-22T12:${String(Math.floor(i / 2)).padStart(2, '0')}:${String((i % 2) * 30).padStart(2, '0')}Z`),
    );
    const entries = [...before, ...after];
    const result = detectRegression(entries, releaseTime);
    expect(result.detected).toBe(true);
    expect(result.afterRate).toBeGreaterThan(result.beforeRate);
    expect(result.ratio).toBeGreaterThan(1.5);
  });

  it('does not flag a regression when rates are similar', () => {
    const before = makeEntries(
      Array.from({ length: 25 }, (_, i) =>
        `2026-08-22T${String(Math.floor(i / 5)).padStart(2, '0')}:${String((i % 5) * 12).padStart(2, '0')}:00Z`),
    );
    const after = makeEntries(
      Array.from({ length: 30 }, (_, i) =>
        `2026-08-22T${String(12 + Math.floor(i / 6)).padStart(2, '0')}:${String((i % 6) * 10).padStart(2, '0')}:00Z`),
    );
    const entries = [...before, ...after];
    const result = detectRegression(entries, releaseTime);
    expect(result.detected).toBe(false);
  });

  it('flags a regression when after rate exceeds 50/h even with sparse before data', () => {
    const entries: NormalizedLogEntry[] = [
      { id: 't', timestamp: new Date('2026-08-22T10:00:00Z'), level: 'error', message: '', source: 'node', raw: '' },
      ...Array.from({ length: 100 }, (_, i) => ({
        id: 't', timestamp: new Date(`2026-08-22T12:${String(Math.floor(i / 2)).padStart(2, '0')}:${String((i % 2) * 30).padStart(2, '0')}Z`),
        level: 'error' as const, message: '', source: 'node' as const, raw: '',
      })),
    ];
    const result = detectRegression(entries, releaseTime);
    expect(result.detected).toBe(true);
  });

  it('returns no regression when there is zero after rate', () => {
    const before = makeEntries(
      Array.from({ length: 25 }, (_, i) =>
        `2026-08-22T${String(Math.floor(i / 5)).padStart(2, '0')}:${String((i % 5) * 12).padStart(2, '0')}:00Z`),
    );
    const result = detectRegression(before, releaseTime);
    expect(result.detected).toBe(false);
    expect(result.afterRate).toBe(0);
  });

  it('computes the correct ratio', () => {
    const before = makeEntries(
      Array.from({ length: 10 }, (_, i) =>
        `2026-08-22T${String(10 + Math.floor(i / 5)).padStart(2, '0')}:${String((i % 5) * 12).padStart(2, '0')}:00Z`),
    );
    const after = makeEntries(
      Array.from({ length: 40 }, (_, i) =>
        `2026-08-22T12:${String(Math.floor(i / 1.5)).padStart(2, '0')}:${String(Math.round((i % 1.5) * 40)).padStart(2, '0')}Z`),
    );
    const entries = [...before, ...after];
    const result = detectRegression(entries, releaseTime);
    expect(result.afterRate).toBeGreaterThan(result.beforeRate);
    expect(result.ratio).toBeGreaterThan(1.5);
    expect(result.detected).toBe(true);
  });

  it('includes a descriptive message when regression is detected', () => {
    const entries: NormalizedLogEntry[] = [];
    for (let i = 0; i < 5; i++) {
      entries.push({ id: 't', timestamp: new Date('2026-08-22T10:00:00Z'), level: 'error', message: '', source: 'node', raw: '' });
    }
    for (let i = 0; i < 20; i++) {
      entries.push({ id: 't', timestamp: new Date('2026-08-22T12:00:00Z'), level: 'error', message: '', source: 'node', raw: '' });
    }
    const result = detectRegression(entries, releaseTime);
    expect(result.message).toContain('error rate');
    expect(result.message).toContain('errors/hour');
  });
});