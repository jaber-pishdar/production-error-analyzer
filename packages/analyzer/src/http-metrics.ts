import type { NormalizedLogEntry, HttpMetrics, HttpEndpointStats } from '@pea/shared';

/**
 * Compute HTTP metrics from a list of parsed log entries.
 *
 * Returns per-endpoint stats (total requests, errors, error rate, status-code
 * distribution) plus the worst-performing endpoint.
 */
export function computeHttpMetrics(entries: NormalizedLogEntry[]): HttpMetrics {
  const endpointMap = new Map<string, HttpEndpointStats>();

  // Only consider entries that have both method and endpoint
  for (const entry of entries) {
    if (!entry.method || !entry.endpoint) continue;

    const key = `${entry.method} ${entry.endpoint}`;
    let stats = endpointMap.get(key);

    if (!stats) {
      stats = {
        endpoint: entry.endpoint,
        method: entry.method,
        total: 0,
        errors: 0,
        errorRate: 0,
        statusCodes: {},
      };
      endpointMap.set(key, stats);
    }

    stats.total++;
    const sc = entry.statusCode ?? 0;
    stats.statusCodes[sc] = (stats.statusCodes[sc] ?? 0) + 1;

    // Count error-level and server-error status codes as errors
    if (
      entry.level === 'error' ||
      entry.level === 'fatal' ||
      entry.level === 'critical' ||
      (sc >= 500 && sc < 600)
    ) {
      stats.errors++;
    }
  }

  const endpoints: HttpEndpointStats[] = [];
  let totalRequests = 0;
  let totalErrors = 0;

  for (const stats of endpointMap.values()) {
    stats.errorRate = stats.total > 0 ? (stats.errors / stats.total) * 100 : 0;
    endpoints.push(stats);
    totalRequests += stats.total;
    totalErrors += stats.errors;
  }

  // Sort by error rate descending, then by total errors descending
  endpoints.sort((a, b) => {
    const rateDiff = b.errorRate - a.errorRate;
    if (rateDiff !== 0) return rateDiff;
    return b.errors - a.errors;
  });

  const worstEndpoint = endpoints.length > 0 ? endpoints[0] : null;
  const overallErrorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

  return { endpoints, worstEndpoint, totalRequests, totalErrors, overallErrorRate };
}