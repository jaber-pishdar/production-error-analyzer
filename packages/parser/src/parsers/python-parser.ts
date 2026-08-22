import type { NormalizedLogEntry, ParserResult } from '@pea/shared';
import crypto from 'node:crypto';

const PYTHON_LOG_PATTERN =
  /^(DEBUG|INFO|WARNING|ERROR|CRITICAL)\s+(.+?)\s+(.+)/;
const PYTHON_TRACEBACK_PATTERN = /^(Traceback|File\s+".+",\s+line\s+\d)/;

export function parsePythonLog(input: string): ParserResult {
  const entries: NormalizedLogEntry[] = [];
  const errors: ParserResult['errors'] = [];
  const lines = input.split('\n');

  let currentTraceback: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (PYTHON_TRACEBACK_PATTERN.test(line) || currentTraceback.length > 0) {
      currentTraceback.push(line);
      if (line.includes('Error:') || line.includes('Exception:')) {
        // End of traceback
        const combined = currentTraceback.join('\n');
        entries.push({
          id: crypto.randomUUID(),
          timestamp: new Date(),
          level: 'error',
          message: currentTraceback[currentTraceback.length - 1],
          stackTrace: combined,
          raw: combined,
          sourceFormat: 'python',
        });
        currentTraceback = [];
      }
      continue;
    }

    const match = line.match(PYTHON_LOG_PATTERN);
    if (match) {
      const [, level, , message] = match;
      entries.push({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        level: level.toLowerCase() as NormalizedLogEntry['level'],
        message: message.slice(0, 300),
        raw: line,
        sourceFormat: 'python',
      });
    } else if (line.trim() && !line.startsWith('---') && !line.startsWith('===')) {
      errors.push({ line: i + 1, message: 'Unrecognized Python log format', raw: line.slice(0, 200) });
    }
  }

  if (currentTraceback.length > 0) {
    const combined = currentTraceback.join('\n');
    entries.push({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level: 'error',
      message: combined.slice(0, 200),
      stackTrace: combined,
      raw: combined,
      sourceFormat: 'python',
    });
  }

  return { entries, errors };
}