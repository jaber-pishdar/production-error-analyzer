import { describe, it, expect } from 'vitest';
import { classifyEntrySeverity, classifyGroupSeverity } from '../src/classifier.js';
import type { NormalizedLogEntry, ErrorGroup, Severity } from '@pea/shared';

function entry(overrides: Partial<NormalizedLogEntry> = {}): NormalizedLogEntry {
  return {
    id: 't',
    timestamp: new Date('2026-08-22T10:00:00Z'),
    level: 'error',
    message: 'Something happened',
    source: 'node',
    raw: '',
    ...overrides,
  };
}

function group(overrides: Partial<ErrorGroup> = {}): ErrorGroup {
  return {
    fingerprint: 'abc',
    message: 'Something happened',
    level: 'error',
    source: 'node',
    count: 1,
    firstSeen: new Date('2026-08-22T10:00:00Z'),
    lastSeen: new Date('2026-08-22T10:00:00Z'),
    severity: 'high',
    ...overrides,
  };
}

describe('classifyEntrySeverity', () => {
  it('maps log level info → severity info', () => {
    expect(classifyEntrySeverity(entry({ level: 'info' }))).toBe('info');
  });

  it('maps log level warn → severity warning', () => {
    expect(classifyEntrySeverity(entry({ level: 'warn' }))).toBe('warning');
  });

  it('maps log level error → severity high', () => {
    expect(classifyEntrySeverity(entry({ level: 'error' }))).toBe('high');
  });

  it('maps log level critical → severity critical', () => {
    expect(classifyEntrySeverity(entry({ level: 'critical' }))).toBe('critical');
  });

  it('maps log level fatal → severity critical', () => {
    expect(classifyEntrySeverity(entry({ level: 'fatal' }))).toBe('critical');
  });

  it('single 404 → severity low', () => {
    expect(classifyEntrySeverity(entry({ message: 'status 404 not found' }))).toBe('low');
  });

  it('5xx status → severity critical (downgrade not applied after upgrade)', () => {
    // 500 triggers an upgrade of 1 step from 'high' → 'critical'
    // 404 downgrade of 2 steps from 'high' → 'info', but 500 applies *after* baseline
    // Actually the logic: baseline=error→high (idx=3). 500 regex matches → +1 = 4 → critical
    expect(classifyEntrySeverity(entry({ message: 'GET /api 500 internal error' }))).toBe('critical');
  });

  it('database keyword upgrades from high to critical', () => {
    expect(classifyEntrySeverity(entry({ message: 'Database connection timeout' }))).toBe('critical');
  });

  it('TypeError forces at least high', () => {
    expect(classifyEntrySeverity(entry({
      level: 'warn',
      message: 'TypeError: Cannot read properties of undefined',
    }))).toBe('high');
  });

  it('health check does not upgrade', () => {
    // baseline=error→high. health check keyword downgrades by 1 → warning
    expect(classifyEntrySeverity(entry({ message: 'health check passed' }))).toBe('warning');
  });

  it('heartbeat with info level stays info', () => {
    expect(classifyEntrySeverity(entry({ level: 'info', message: 'heartbeat ok' }))).toBe('info');
  });
});

describe('classifyGroupSeverity', () => {
  it('critical log level → critical severity regardless of count', () => {
    expect(classifyGroupSeverity(group({ level: 'critical', count: 1 }))).toBe('critical');
  });

  it('fatal log level → critical severity', () => {
    expect(classifyGroupSeverity(group({ level: 'fatal', count: 1 }))).toBe('critical');
  });

  it('group with 50+ occurrences → critical (frequency upgrade)', () => {
    expect(classifyGroupSeverity(group({ level: 'error', count: 50 }))).toBe('critical');
  });

  it('group with 10+ occurrences → high', () => {
    expect(classifyGroupSeverity(group({ level: 'error', count: 10 }))).toBe('high');
  });

  it('group with <10 occurrences stays at entry severity', () => {
    expect(classifyGroupSeverity(group({ level: 'error', count: 5, message: 'minor issue' }))).toBe('high');
  });

  it('warn-level group with many occurrences gets upgraded', () => {
    expect(classifyGroupSeverity(group({ level: 'warn', count: 60 }))).toBe('critical');
  });
});