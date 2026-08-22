// Parsed log entry in normalized format
export interface NormalizedLogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  service?: string;
  endpoint?: string;
  httpMethod?: string;
  httpStatus?: number;
  stackTrace?: string;
  errorType?: string;
  raw: string;
  sourceFormat: LogFormat;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'critical';
export type LogFormat = 'json' | 'apache' | 'nginx' | 'nodejs' | 'php' | 'python' | 'unknown';

export interface ErrorGroup {
  fingerprint: string;
  message: string;
  errorType?: string;
  level: LogLevel;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  endpoints: string[];
  stackTrace?: string;
  entries: NormalizedLogEntry[];
}

export interface DashboardMetrics {
  totalErrors: number;
  uniqueErrors: number;
  criticalErrors: number;
  mostFrequent: ErrorGroup[];
  errorsByEndpoint: Record<string, number>;
  errorsByTime: TimeBucket[];
}

export interface TimeBucket {
  time: Date;
  count: number;
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