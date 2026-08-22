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
  it('identical messages produce identical fingerprints', () => {
    const a = makeEntry({ message: 'Database connection failed' });
    const b = makeEntry({ message: 'Database connection failed' });
    expect(fingerprint(a)).toBe(fingerprint(b));
  });

  it('different messages produce different fingerprints', () => {
    const a = makeEntry({ message: 'Database connection failed' });
    const b = makeEntry({ message: 'Out of memory' });
    expect(fingerprint(a)).not.toBe(fingerprint(b));
  });

  it('normalises numbers so "User 123" matches "User 456"', () => {
    const a = makeEntry({ message: 'User 123 not found' });
    const b = makeEntry({ message: 'User 456 not found' });
    expect(fingerprint(a)).toBe(fingerprint(b));
  });

  it('extracts error type from message prefix', () => {
    const a = makeEntry({ message: 'TypeError: Cannot read properties of undefined' });
    const b = makeEntry({ message: 'TypeError: Cannot read properties of undefined' });
    expect(fingerprint(a)).toBe(fingerprint(b));
  });

  it('different error types produce different fingerprints', () => {
    const a = makeEntry({ message: 'TypeError: Cannot read properties of undefined' });
    const b = makeEntry({ message: 'ReferenceError: Cannot read properties of undefined' });
    expect(fingerprint(a)).not.toBe(fingerprint(b));
  });
});

describe('fingerprint with stack traces', () => {
  it('same error, same stack frames → same fingerprint', () => {
    const msg = 'TypeError: Cannot read properties of undefined';
    const stack = [
      '    at UserService.getUser (services/user.js:42:12)',
      '    at UserController.show (controllers/user.js:88:5)',
    ].join('\n');
    const a = makeEntry({ message: msg, stackTrace: stack });
    const b = makeEntry({ message: msg, stackTrace: stack });
    expect(fingerprint(a)).toBe(fingerprint(b));
  });

  it('same error and same function names but different line numbers → same fingerprint', () => {
    const msg = 'TypeError: Cannot read properties of undefined';
    const stackA = [
      '    at UserService.getUser (services/user.js:42:12)',
      '    at UserController.show (controllers/user.js:88:5)',
    ].join('\n');
    const stackB = [
      '    at UserService.getUser (services/user.js:99:8)',
      '    at UserController.show (controllers/user.js:150:12)',
    ].join('\n');
    const a = makeEntry({ message: msg, stackTrace: stackA });
    const b = makeEntry({ message: msg, stackTrace: stackB });
    expect(fingerprint(a)).toBe(fingerprint(b));
  });

  it('different function names → different fingerprint', () => {
    const msg = 'TypeError: Cannot read properties of undefined';
    const stackA = [
      '    at UserService.getUser (services/user.js:42:12)',
      '    at UserController.show (controllers/user.js:88:5)',
    ].join('\n');
    const stackB = [
      '    at PaymentService.process (services/payment.js:15:3)',
      '    at PaymentController.create (controllers/payment.js:7:1)',
    ].join('\n');
    const a = makeEntry({ message: msg, stackTrace: stackA });
    const b = makeEntry({ message: msg, stackTrace: stackB });
    expect(fingerprint(a)).not.toBe(fingerprint(b));
  });

  it('extra deep frames do not break grouping (capped at MAX_FRAMES=4)', () => {
    const msg = 'TypeError: Cannot read properties of undefined';
    const baseFrames = [
      '    at UserService.getUser (services/user.js:42:12)',
      '    at UserController.show (controllers/user.js:88:5)',
      '    at Router.handle (router.js:15:3)',
      '    at App.middleware (app.js:55:10)',
    ];
    const stackA = baseFrames.join('\n');
    const stackB = [
      ...baseFrames,
      '    at Server.processRequest (server.js:200:8)',
      '    at HTTPServer.emit (http.js:999:50)',
    ].join('\n');
    const a = makeEntry({ message: msg, stackTrace: stackA });
    const b = makeEntry({ message: msg, stackTrace: stackB });
    // First 4 frames are the same, 5th+ are extra but capped at 4
    expect(fingerprint(a)).toBe(fingerprint(b));
  });

  it('bare stack frames (without parens) are handled', () => {
    const msg = 'Error: Something crashed';
    const stack = [
      '    at new Promise (<anonymous>)',
      '    at processTicksAndRejections (internal/process/task_queues.js:95:5)',
    ].join('\n');
    const a = makeEntry({ message: msg, stackTrace: stack });
    const b = makeEntry({ message: msg, stackTrace: stack });
    expect(fingerprint(a)).toBe(fingerprint(b));
  });

  it('no stack trace still produces a valid fingerprint', () => {
    const a = makeEntry({ message: 'Error: Something broke' });
    const b = makeEntry({ message: 'Error: Something broke' });
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
          message: 'Error: Connection timeout',
          timestamp: new Date(`2026-08-22T${10 + Math.floor(i / 60)}:${String(i % 60).padStart(2, '0')}:00Z`),
        }),
      );
    }
    const groups = groupErrors(entries);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(100);
  });

  it('groups the TypeError example from the spec (same stack)', () => {
    const msg = 'TypeError: Cannot read properties of undefined';
    const stack = [
      '    at UserService.getUser (services/user.js:42:12)',
      '    at UserController.show (controllers/user.js:88:5)',
    ].join('\n');
    const entries = [
      makeEntry({ id: 'e1', message: msg, stackTrace: stack }),
      makeEntry({ id: 'e2', message: msg, stackTrace: stack }),
    ];
    const groups = groupErrors(entries);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(2);
    expect(groups[0].message).toContain('TypeError');
  });

  it('groups errors with different line numbers as the same group', () => {
    const msg = 'TypeError: Cannot read properties of undefined';
    const stackA = [
      '    at UserService.getUser (services/user.js:42:12)',
      '    at UserController.show (controllers/user.js:88:5)',
    ].join('\n');
    const stackB = [
      '    at UserService.getUser (services/user.js:99:8)',
      '    at UserController.show (controllers/user.js:150:12)',
    ].join('\n');
    const entries = [
      makeEntry({ id: 'e1', message: msg, stackTrace: stackA }),
      makeEntry({ id: 'e2', message: msg, stackTrace: stackB }),
    ];
    const groups = groupErrors(entries);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(2);
  });

  it('tracks firstSeen and lastSeen correctly', () => {
    const entries = [
      makeEntry({ id: 'e1', timestamp: new Date('2026-08-22T10:00:00Z') }),
      makeEntry({ id: 'e2', timestamp: new Date('2026-08-22T12:00:00Z') }),
      makeEntry({ id: 'e3', timestamp: new Date('2026-08-22T09:00:00Z') }),
    ];
    const groups = groupErrors(entries);
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
    expect(groups[0].message).toContain('Frequent');
    expect(groups[0].count).toBe(3);
    expect(groups[1].count).toBe(1);
  });
});