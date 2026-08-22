// Parsed log entry in normalized format
export interface NormalizedLogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  source: LogSource;
  stackTrace?: string;
  raw: string;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'critical';
export type LogSource = 'node' | 'unknown';

export interface ErrorGroup {
  fingerprint: string;
  message: string;
  level: LogLevel;
  source: LogSource;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  stackTrace?: string;
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