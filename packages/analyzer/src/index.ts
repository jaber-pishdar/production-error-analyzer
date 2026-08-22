import type { NormalizedLogEntry, ErrorGroup, DashboardMetrics, TimeBucket } from '@pea/shared';
import crypto from 'node:crypto';

/**
 * Generate a fingerprint for an error based on message and stack trace.
 * This groups identical errors together.
 */
export function fingerprint(entry: NormalizedLogEntry): string {
  const normalizedMessage = entry.message
    .replace(/\d+/g, '0')
    .replace(/"[^"]*"/g, '"..."')
    .replace(/'[^']*'/g, "'...'")
    .replace(/`[^`]*`/g, '`...`')
    .slice(0, 200);
  const stackHash = entry.stackTrace
    ? entry.stackTrace.replace(/\d+/g, '0').slice(0, 100)
    : '';
  return crypto.createHash('md5').update(normalizedMessage + stackHash).digest('hex');
}

/**
 * Group a list of entries into error groups by fingerprint.
 */
export function groupErrors(entries: NormalizedLogEntry[]): ErrorGroup[] {
  const groups = new Map<string, ErrorGroup>();

  for (const entry of entries) {
    if (entry.level === 'info' || entry.level === 'debug') continue;

    const fp = fingerprint(entry);
    const existing = groups.get(fp);

    if (existing) {
      existing.count++;
      existing.lastSeen = new Date(Math.max(existing.lastSeen.getTime(), entry.timestamp.getTime()));
      if (entry.endpoint && !existing.endpoints.includes(entry.endpoint)) {
        existing.endpoints.push(entry.endpoint);
      }
      existing.entries.push(entry);
    } else {
      groups.set(fp, {
        fingerprint: fp,
        message: entry.message,
        errorType: entry.errorType,
        level: entry.level,
        count: 1,
        firstSeen: entry.timestamp,
        lastSeen: entry.timestamp,
        endpoints: entry.endpoint ? [entry.endpoint] : [],
        stackTrace: entry.stackTrace,
        entries: [entry],
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

/**
 * Compute dashboard metrics from a list of error groups.
 */
export function computeMetrics(groups: ErrorGroup[], entries: NormalizedLogEntry[]): DashboardMetrics {
  const totalErrors = entries.filter((e) => e.level === 'error' || e.level === 'critical' || e.level === 'warn').length;
  const uniqueErrors = groups.length;
  const criticalErrors = groups.filter((g) => g.level === 'critical').length;

  // Top 10 most frequent
  const mostFrequent = groups.slice(0, 10);

  // Errors by endpoint
  const errorsByEndpoint: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.endpoint) {
      errorsByEndpoint[entry.endpoint] = (errorsByEndpoint[entry.endpoint] ?? 0) + 1;
    }
  }

  // Errors by time (hourly buckets)
  const buckets = new Map<string, number>();
  for (const entry of entries) {
    const key = entry.timestamp.toISOString().slice(0, 13); // hour precision
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const errorsByTime: TimeBucket[] = Array.from(buckets.entries())
    .map(([time, count]) => ({ time: new Date(time), count }))
    .sort((a, b) => a.time.getTime() - b.time.getTime());

  return {
    totalErrors,
    uniqueErrors,
    criticalErrors,
    mostFrequent,
    errorsByEndpoint,
    errorsByTime,
  };
}