import { describe, it, expect } from 'vitest';
import { fingerprint, groupErrors } from '../src/index.js';
import type { NormalizedLogEntry } from '@pea/shared';

function makeEntry(overrides: Partial<NormalizedLogEntry> = {}): NormalizedLogEntry {
  return {
    id: 'test-1',
    timestamp: new Date('2026-08-22T10:15:31Z'),
    level: 'error',
    message: 'Something went wrong',
    source: 'node',
    raw: '2026-08-22T10:15:31Z ERROR Something went wrong',
    ...overrides,
  };
}

describe('fingerprint', () => {
  it('generates consistent fingerprints for identical messages', () => {
    const a = makeEntry({ message: 'Database connection failed' });
    const b = makeEntry({ message: 'Database connection failed' });
    expect(fingerprint(a)).toBe(fingerprint(b));
  });

  it('generates different fingerprints for different messages', () => {
    const a = makeEntry({ message: 'Database connection failed' });
    const b = makeEntry({ message: 'Out of memory' });
    expect(fingerprint(a)).not.toBe(fingerprint(b));
  });

  it('normalises numbers so "User 123 not found" matches "User 456 not found"', () => {
    const a = makeEntry({ message: 'User 123 not found' });
    const b = makeEntry({ message: 'User 456 not found' });
    expect(fingerprint(a)).toBe(fingerprint(b));
  });
});

describe('groupErrors', () => {
  it('groups 100 identical errors into one group with count 100', () => {
    const entries: NormalizedLogEntry[] = [];
    for (let i = 0; i < 100; i++) {
      entries.push(
        makeEntry({
          id: `dup-${i}`,
          timestamp: new Date(`2026-08-22T${10 + Math.floor(i / 60)}:${String(i % 60).padStart(2, '0')}:00Z`),
        }),
      );
    }
    const groups = groupErrors(entries);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(100);
  });

  it('tracks firstSeen and lastSeen correctly across grouped entries', () => {
    const entries = [
      makeEntry({ id: 'e1', timestamp: new Date('2026-08-22T10:00:00Z') }),
      makeEntry({ id: 'e2', timestamp: new Date('2026-08-22T12:00:00Z') }),
      makeEntry({ id: 'e3', timestamp: new Date('2026-08-22T09:00:00Z') }),
    ];
    const groups = groupErrors(entries);
    expect(groups).toHaveLength(1);
    expect(groups[0].firstSeen).toEqual(new Date('2026-08-22T09:00:00Z'));
    expect(groups[0].lastSeen).toEqual(new Date('2026-08-22T12:00:00Z'));
  });

  it('separates different errors into different groups', () => {
    const entries = [
      makeEntry({ id: 'e1', message: 'Database connection failed' }),
      makeEntry({ id: 'e2', message: 'Out of memory' }),
      makeEntry({ id: 'e3', message: 'Database connection failed' }),
    ];
    const groups = groupErrors(entries);
    expect(groups).toHaveLength(2);
    const dbGroup = groups.find((g) => g.message.includes('Database'));
    const memGroup = groups.find((g) => g.message.includes('Out of memory'));
    expect(dbGroup?.count).toBe(2);
    expect(memGroup?.count).toBe(1);
  });

  it('ignores info and debug entries', () => {
    const entries = [
      makeEntry({ id: 'e1', level: 'info', message: 'Server started' }),
      makeEntry({ id: 'e2', level: 'error', message: 'Server crashed' }),
    ];
    const groups = groupErrors(entries);
    expect(groups).toHaveLength(1);
  });

  it('sorts groups by count descending', () => {
    const entries = [
      makeEntry({ id: 'e1', message: 'Rare error' }),
      makeEntry({ id: 'e2', message: 'Frequent error' }),
      makeEntry({ id: 'e3', message: 'Frequent error' }),
      makeEntry({ id: 'e4', message: 'Frequent error' }),
    ];
    const groups = groupErrors(entries);
    expect(groups).toHaveLength(2);
    expect(groups[0].message).toContain('Frequent');
    expect(groups[0].count).toBe(3);
    expect(groups[1].count).toBe(1);
  });
});