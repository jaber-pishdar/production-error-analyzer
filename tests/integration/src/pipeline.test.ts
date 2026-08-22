/**
 * Integration test: full pipeline from raw logs to regression detection.
 *
 * Scenario:
 *   Deploy v1 → 10 hours of normal traffic (~5 errors/hour)
 *   Release v2 at 12:00 → bug introduced → error spike (~92 errors/hour)
 *
 * Pipeline under test:
 *   Raw logs → parse() → groupErrors() → classifyGroupSeverity()
 *            → aggregateByTime() → detectRegression()
 */

import { describe, it, expect } from 'vitest';
import { parse } from '@pea/parser';
import { groupErrors, classifyGroupSeverity, aggregateByTime, detectRegression } from '@pea/analyzer';
import type { NormalizedLogEntry } from '@pea/shared';

const RELEASE_TIME = '2026-08-22T12:00:00Z';

describe('Full pipeline: deploy v1 → release v2 → regression detected', () => {
  let entries: NormalizedLogEntry[];

  it('Step 1 — parses 10 hours of v1 logs and 1 hour of v2 logs', () => {
    const logLines: string[] = [];

    // ---- v1: 10 hours of normal traffic (02:00 – 11:59) ---- //
    const v1Messages = [
      'GET /api/users/123 404',
      'POST /api/orders 422 validation failed',
      'GET /api/products 200 ok',
      'WARN Disk space warning',
      'Token expired for user session',
    ];

    for (let h = 2; h < 12; h++) {
      for (let m = 0; m < 5; m++) {
        logLines.push(
          `2026-08-22T${String(h).padStart(2, '0')}:${String(m * 12).padStart(2, '0')}:00Z ERROR ${v1Messages[m]}`,
        );
      }
    }

    // ---- v2: buggy release at 12:00 — massive spike ---- //
    const stackTrace = [
      '    at UserService.getUser (services/user.js:42:12)',
      '    at UserController.show (controllers/user.js:88:5)',
      '    at Router.handle (router.js:15:3)',
      '    at Server.processRequest (server.js:200:8)',
    ];

    // TypeError: Cannot read properties of undefined
    for (let m = 0; m < 60; m++) {
      if (m % 3 === 0) {
        logLines.push(
          `2026-08-22T12:${String(m).padStart(2, '0')}:10Z ERROR TypeError: Cannot read properties of undefined\n${stackTrace.join('\n')}`,
        );
      }
    }
    // Database connection timeout
    for (let m = 0; m < 60; m++) {
      if (m % 2 === 0 && m % 3 !== 0) {
        logLines.push(
          `2026-08-22T12:${String(m).padStart(2, '0')}:20Z ERROR POST /api/orders 500 Database connection timeout`,
        );
      }
    }
    // GET /api/products 500
    for (let m = 0; m < 60; m++) {
      if (m % 3 !== 0 && m % 2 !== 0) {
        logLines.push(
          `2026-08-22T12:${String(m).padStart(2, '0')}:30Z ERROR GET /api/products 500`,
        );
      }
    }

    const rawLogs = logLines.join('\n');
    const result = parse(rawLogs);
    entries = result.entries;

    expect(result.entries.length).toBeGreaterThan(100);
    expect(result.errors).toHaveLength(0);
  });

  it('Step 2 — groups identical errors together', () => {
    const groups = groupErrors(entries);

    const typeErrorGroup = groups.find((g) => g.message.includes('TypeError'));
    const dbTimeoutGroup = groups.find((g) => g.message.includes('Database connection timeout'));
    const product500Group = groups.find((g) => g.message.includes('GET /api/products 500'));

    expect(typeErrorGroup).toBeDefined();
    expect(dbTimeoutGroup).toBeDefined();
    expect(product500Group).toBeDefined();

    // Each should have multiple occurrences (grouped, not separate)
    expect(typeErrorGroup!.count).toBeGreaterThan(10);
    expect(dbTimeoutGroup!.count).toBeGreaterThan(10);
    expect(product500Group!.count).toBeGreaterThan(10);
  });

  it('Step 3 — classifies v2 groups as high or critical severity', () => {
    const groups = groupErrors(entries);
    const v2ErrorGroups = groups.filter((g) => g.count >= 10);

    for (const g of v2ErrorGroups) {
      const severity = classifyGroupSeverity(g);
      expect(['high', 'critical']).toContain(severity);
    }
  });

  it('Step 4 — aggregateByTime shows spike at 12:00', () => {
    const series = aggregateByTime(entries, '1h');

    const spikeBucket = series.buckets.find((b) => b.time.startsWith('2026-08-22T12'));
    expect(spikeBucket).toBeDefined();
    expect(spikeBucket!.count).toBeGreaterThan(50);

    const spikeFound = series.spikeBuckets.some((b) => b.time.startsWith('2026-08-22T12'));
    expect(spikeFound).toBe(true);
  });

  it('Step 5 — detectRegression flags the v2 release as a regression', () => {
    const regression = detectRegression(entries, RELEASE_TIME);

    expect(regression.detected).toBe(true);
    expect(regression.releaseTime).toBe(RELEASE_TIME);
    expect(regression.afterRate).toBeGreaterThan(regression.beforeRate);
    expect(regression.ratio).toBeGreaterThan(2);
    expect(regression.message).toContain('regression');
  });
});