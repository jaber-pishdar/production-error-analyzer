import type { NormalizedLogEntry, ParserResult } from '@pea/shared';
import crypto from 'node:crypto';

export function parseJSONLog(input: string): ParserResult {
  const entries: NormalizedLogEntry[] = [];
  const errors: ParserResult['errors'] = [];
  const lines = input.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const parsed = JSON.parse(line);
      entries.push({
        id: crypto.randomUUID(),
        timestamp: new Date(parsed.timestamp ?? parsed.time ?? parsed['@timestamp'] ?? Date.now()),
        level: normalizeLevel(parsed.level ?? parsed.severity ?? parsed.status ?? 'info'),
        message: parsed.message ?? parsed.msg ?? parsed.error ?? '',
        service: parsed.service ?? parsed.service_name ?? parsed.logger,
        endpoint: parsed.endpoint ?? parsed.route ?? parsed.url ?? parsed.request,
        httpMethod: parsed.method ?? parsed.http_method ?? parsed.verb,
        httpStatus: parsed.status_code ?? parsed.status ?? parsed.httpStatus,
        stackTrace: parsed.stack_trace ?? parsed.stackTrace ?? parsed.stack,
        errorType: parsed.error_type ?? parsed.errorType ?? parsed.exception,
        raw: line,
        sourceFormat: 'json',
      });
    } catch {
      errors.push({ line: i + 1, message: 'Invalid JSON', raw: line.slice(0, 200) });
    }
  }

  return { entries, errors };
}

function normalizeLevel(level: string): NormalizedLogEntry['level'] {
  const l = String(level).toLowerCase();
  if (['fatal', 'critical', 'emergency'].includes(l)) return 'critical';
  if (l === 'error') return 'error';
  if (['warn', 'warning'].includes(l)) return 'warn';
  if (['debug', 'trace', 'verbose'].includes(l)) return 'debug';
  return 'info';
}