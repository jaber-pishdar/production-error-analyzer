import type { NormalizedLogEntry, TimeBucket, TimeSeries, RegressionResult } from '@pea/shared';

// ---- Day 12: Time Aggregation ---- //

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

type IntervalMs = '1m' | '5m' | '1h' | '1d';
const INTERVAL_MS: Record<IntervalMs, number> = {
  '1m': MINUTE,
  '5m': 5 * MINUTE,
  '1h': HOUR,
  '1d': DAY,
};

/**
 * Truncate a Date to the given interval boundary.
 * Returns a Date representing the start of the bucket.
 */
function truncate(date: Date, interval: IntervalMs): Date {
  const ms = date.getTime();
  const size = INTERVAL_MS[interval];
  return new Date(Math.floor(ms / size) * size);
}

/**
 * Spike threshold: a bucket is a spike when its count exceeds
 * the mean of the entire series by this multiplier.
 */
const SPIKE_MULTIPLIER = 3;

/**
 * Aggregate error entries (level >= warn) into time buckets.
 */
export function aggregateByTime(
  entries: NormalizedLogEntry[],
  interval: IntervalMs = '1h',
): TimeSeries {
  // Filter to warn+ entries only
  const errorEntries = entries.filter(
    (e) => e.level === 'warn' || e.level === 'error' || e.level === 'fatal' || e.level === 'critical',
  );

  if (errorEntries.length === 0) {
    return { buckets: [], interval, spikeBuckets: [] };
  }

  // Bucketise
  const bucketMap = new Map<number, number>();
  for (const entry of errorEntries) {
    const key = truncate(entry.timestamp, interval).getTime();
    bucketMap.set(key, (bucketMap.get(key) ?? 0) + 1);
  }

  // Build sorted bucket list
  const buckets: TimeBucket[] = Array.from(bucketMap.entries())
    .map(([time, count]) => ({ time: new Date(time).toISOString(), count }))
    .sort((a, b) => a.time.localeCompare(b.time));

  // Detect spikes (buckets with count > mean * SPIKE_MULTIPLIER)
  const mean = buckets.reduce((s, b) => s + b.count, 0) / buckets.length;
  const spikeBuckets = buckets.filter((b) => b.count > mean * SPIKE_MULTIPLIER && mean > 0);

  return { buckets, interval, spikeBuckets };
}

// ---- Day 13: Regression Detection ---- //

/**
 * Detect whether a release (at `releaseTime`) introduced a regression
 * by comparing the error rate before and after the release.
 *
 * A regression is flagged when:
 *   - The after rate is at least 2× the before rate
 *   - AND there are at least 5 error entries on each side
 *   - OR the after rate exceeds 50 errors/hour regardless
 */
export function detectRegression(
  entries: NormalizedLogEntry[],
  releaseTime: string,
): RegressionResult {
  const release = new Date(releaseTime).getTime();

  const errorEntries = entries.filter(
    (e) => e.level === 'warn' || e.level === 'error' || e.level === 'fatal' || e.level === 'critical',
  );

  const before = errorEntries.filter((e) => e.timestamp.getTime() < release);
  const after = errorEntries.filter((e) => e.timestamp.getTime() >= release);

  // Compute time spans in hours
  const beforeSpan = computeSpanHours(before);
  const afterSpan = computeSpanHours(after);

  const beforeRate = beforeSpan > 0 ? before.length / beforeSpan : 0;
  const afterRate = afterSpan > 0 ? after.length / afterSpan : 0;

  const ratio = beforeRate > 0 ? afterRate / beforeRate : Infinity;

  // Decision logic
  const sufficientData = before.length >= 5 && after.length >= 5;
  const drasticRate = afterRate > 50;
  const significantRatio = ratio >= 2;

  const detected = (sufficientData && significantRatio) || drasticRate;

  const message = detected
    ? `Possible regression detected — error rate jumped from ${fmt(beforeRate)} to ${fmt(afterRate)} errors/hour after release (${ratio.toFixed(1)}× increase)`
    : `No regression detected — error rate before: ${fmt(beforeRate)}, after: ${fmt(afterRate)} errors/hour`;

  return {
    detected,
    beforeRate: round(beforeRate),
    afterRate: round(afterRate),
    ratio: round(ratio),
    releaseTime: releaseTime,
    message,
  };
}

// ---- helpers ---- //

function computeSpanHours(entries: NormalizedLogEntry[]): number {
  if (entries.length < 2) return 0;
  const first = entries[0].timestamp.getTime();
  const last = entries[entries.length - 1].timestamp.getTime();
  const span = (last - first) / HOUR;
  // Minimum 5 minutes so that tightly clustered entries don't
  // produce an inflated (and misleading) error rate.
  return Math.max(span, 5 / 60);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmt(n: number): string {
  return n.toFixed(1);
}