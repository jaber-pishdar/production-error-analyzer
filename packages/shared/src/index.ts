// Parsed log entry in normalized format
export interface NormalizedLogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  source: LogSource;
  method?: string;
  endpoint?: string;
  statusCode?: number;
  stackTrace?: string;
  raw: string;
}

export interface HttpEndpointStats {
  endpoint: string;
  method: string;
  total: number;
  errors: number;
  errorRate: number;
  statusCodes: Record<number, number>;
}

export interface HttpMetrics {
  endpoints: HttpEndpointStats[];
  worstEndpoint: HttpEndpointStats | null;
  totalRequests: number;
  totalErrors: number;
  overallErrorRate: number;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'critical';
export type LogSource = 'node' | 'unknown';
export type Severity = 'info' | 'low' | 'warning' | 'high' | 'critical';

export interface ErrorGroup {
  fingerprint: string;
  message: string;
  level: LogLevel;
  source: LogSource;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  stackTrace?: string;
  severity: Severity;
}

export interface ParserResult {
  entries: NormalizedLogEntry[];
  errors: ParseError[];
}

export interface ParseError {
  line: number;
  message: string;
  raw: string;
}

export interface TimeBucket {
  time: string;  // ISO-8601 truncated to interval granularity, e.g. "2026-08-22T10:00:00Z"
  count: number;
}

export interface TimeSeries {
  buckets: TimeBucket[];
  interval: string;  // "1h", "5m", "1d"
  spikeBuckets: TimeBucket[];
}

export interface RegressionResult {
  detected: boolean;
  beforeRate: number;   // errors/hour before
  afterRate: number;    // errors/hour after
  ratio: number;        // afterRate / beforeRate
  releaseTime: string;  // ISO-8601
  message: string;
}