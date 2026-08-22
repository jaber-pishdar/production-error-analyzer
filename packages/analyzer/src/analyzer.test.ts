import { describe, it, expect } from 'vitest';
import { fingerprint, groupErrors } from '../src/index.js';
import type { NormalizedLogEntry } from '@pea/shared';

function makeEntry(overrides: Partial<NormalizedLogEntry> = {}): NormalizedLogEntry {
  return {
    id: 'test-id',
    timestamp: new Date(),
    level: 'error',
    message: 'Something went wrong',
    raw: '{"error":"Something went wrong"}',
    sourceFormat: 'json',
    ...overrides,
  };
}

describe('fingerprint', () => {
  it('generates consistent fingerprints for identical messages', () => {
    const a = makeEntry({ message: 'Error: connection refused' });
    const b = makeEntry({ message: 'Error: connection refused' });
    expect(fingerprint(a)).toBe(fingerprint(b));
  });

  it('generates different fingerprints for different messages', () => {
    const a = makeEntry({ message: 'Error: connection refused' });
    const b = makeEntry({ message: 'Error: timeout exceeded' });
    expect(fingerprint(a)).not.toBe(fingerprint(b));
  });

  it('normalizes numbers in messages', () => {
    const a = makeEntry({ message: 'User 123 not found' });
    const b = makeEntry({ message: 'User 456 not found' });
    expect(fingerprint(a)).toBe(fingerprint(b));
  });
});

describe('groupErrors', () => {
  it('groups identical errors together', () => {
    const entries = [
      makeEntry({ message: 'Error: DB timeout' }),
      makeEntry({ message: 'Error: DB timeout' }),
      makeEntry({ message: 'Error: DB timeout' }),
    ];
    const groups = groupErrors(entries);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(3);
  });

  it('separates different errors', () => {
    const entries = [
      makeEntry({ message: 'Error: timeout' }),
      makeEntry({ message: 'Error: not found' }),
    ];
    const groups = groupErrors(entries);
    expect(groups).toHaveLength(2);
  });

  it('filters out info and debug entries', () => {
    const entries = [
      makeEntry({ level: 'info', message: 'Server started' }),
      makeEntry({ level: 'error', message: 'Server crashed' }),
    ];
    const groups = groupErrors(entries);
    expect(groups).toHaveLength(1);
  });
});