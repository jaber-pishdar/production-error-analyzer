import type { NormalizedLogEntry, ParserResult } from '@pea/shared';
import crypto from 'node:crypto';

// Combined Apache / Nginx access log format:
// 127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326
const APACHE_PATTERN =
  /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)\s+\S+"\s+(\d{3})\s+(\d+|-)/;

export function parseApacheLog(input: string): ParserResult {
  const entries: NormalizedLogEntry[] = [];
  const errors: ParserResult['errors'] = [];
  const lines = input.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const match = line.match(APACHE_PATTERN);
    if (match) {
      const [, , dateStr, method, endpoint, statusStr] = match;
      const status = parseInt(statusStr, 10);
      entries.push({
        id: crypto.randomUUID(),
        timestamp: parseApacheDate(dateStr),
        level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
        message: `${method} ${endpoint} → ${status}`,
        endpoint,
        httpMethod: method,
        httpStatus: status,
        raw: line,
        sourceFormat: 'apache',
      });
    } else {
      // Could be an error log line
      if (/error|fail|exception/i.test(line)) {
        entries.push({
          id: crypto.randomUUID(),
          timestamp: new Date(),
          level: 'error',
          message: line.slice(0, 200),
          raw: line,
          sourceFormat: 'nginx',
        });
      } else {
        errors.push({ line: i + 1, message: 'Unrecognized Apache log format', raw: line.slice(0, 200) });
      }
    }
  }

  return { entries, errors };
}

function parseApacheDate(dateStr: string): Date {
  // 10/Oct/2000:13:55:36 -0700
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const parts = dateStr.split(/[: ]/);
  const dayMonth = parts[0].split('/');
  const day = parseInt(dayMonth[0], 10);
  const month = months[dayMonth[1]?.toLowerCase() ?? ''] ?? 0;
  const year = parseInt(dayMonth[2], 10);
  const hour = parseInt(parts[1], 10);
  const min = parseInt(parts[2], 10);
  const sec = parseInt(parts[3], 10);
  return new Date(year, month, day, hour, min, sec);
}