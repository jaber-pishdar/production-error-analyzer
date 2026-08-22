import type { NormalizedLogEntry, ParserResult } from '@pea/shared';
import crypto from 'node:crypto';

const PHP_ERROR_PATTERN =
  /^\[(\d{2}-[A-Za-z]{3}-\d{4}\s+\d{2}:\d{2}:\d{2}\s+\S+)\]\s+(.+)/;
const PHP_STACK_PATTERN = /^#\d+\s+/;
const PHP_FATAL_PATTERN = /^(Fatal error|Catchable fatal error|Parse error|Warning|Notice):/;

export function parsePHPLog(input: string): ParserResult {
  const entries: NormalizedLogEntry[] = [];
  const errors: ParserResult['errors'] = [];
  const lines = input.split('\n');

  let currentError: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (PHP_STACK_PATTERN.test(line) || PHP_FATAL_PATTERN.test(line)) {
      currentError.push(line);
      continue;
    }

    if (currentError.length > 0) {
      processPHPBuffer(currentError, entries);
      currentError = [];
    }

    const match = line.match(PHP_ERROR_PATTERN);
    if (match) {
      const [, dateStr, message] = match;
      entries.push({
        id: crypto.randomUUID(),
        timestamp: new Date(dateStr),
        level: detectPHPLevel(message),
        message: message.slice(0, 300),
        raw: line,
        sourceFormat: 'php',
      });
    } else if (line.trim()) {
      errors.push({ line: i + 1, message: 'Unrecognized PHP log format', raw: line.slice(0, 200) });
    }
  }

  if (currentError.length > 0) {
    processPHPBuffer(currentError, entries);
  }

  return { entries, errors };
}

function detectPHPLevel(message: string): NormalizedLogEntry['level'] {
  if (/Fatal|Parse error/i.test(message)) return 'critical';
  if (/Error|Exception/i.test(message)) return 'error';
  if (/Warning/i.test(message)) return 'warn';
  if (/Notice/i.test(message)) return 'info';
  return 'error';
}

function processPHPBuffer(buffer: string[], entries: NormalizedLogEntry[]) {
  const combined = buffer.join('\n');
  entries.push({
    id: crypto.randomUUID(),
    timestamp: new Date(),
    level: 'error',
    message: combined.slice(0, 200),
    stackTrace: combined,
    raw: combined,
    sourceFormat: 'php',
  });
}