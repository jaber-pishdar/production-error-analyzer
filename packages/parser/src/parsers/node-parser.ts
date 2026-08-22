import type { NormalizedLogEntry, ParserResult } from '@pea/shared';
import crypto from 'node:crypto';

const NODE_ERROR_PATTERN =
  /(Error|Exception|TypeError|ReferenceError|SyntaxError|RangeError|AssertionError):\s(.+)/;
const STACK_LINE_PATTERN = /\s+at\s+/;

export function parseNodeLog(input: string): ParserResult {
  const entries: NormalizedLogEntry[] = [];
  const errors: ParserResult['errors'] = [];
  const blocks = input.split(/(?=^|\n)(?=[^\s])/m);

  let currentBuffer: string[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (STACK_LINE_PATTERN.test(trimmed)) {
      currentBuffer.push(trimmed);
      continue;
    }

    if (currentBuffer.length > 0) {
      processBuffer(currentBuffer, entries);
      currentBuffer = [];
    }

    // Try parsing as JSON (Winston/Bunyan style)
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        entries.push({
          id: crypto.randomUUID(),
          timestamp: new Date(parsed.timestamp ?? Date.now()),
          level: parsed.level ?? 'info',
          message: parsed.message ?? parsed.msg ?? '',
          service: parsed.service ?? parsed.logger,
          endpoint: parsed.endpoint ?? parsed.route,
          httpMethod: parsed.method,
          httpStatus: parsed.status_code,
          stackTrace: parsed.stack,
          errorType: parsed.error?.type ?? parsed.error_type,
          raw: trimmed,
          sourceFormat: 'nodejs',
        });
        continue;
      } catch {
        // fall through to regex
      }
    }

    currentBuffer.push(trimmed);
  }

  if (currentBuffer.length > 0) {
    processBuffer(currentBuffer, entries);
  }

  return { entries, errors };
}

function processBuffer(buffer: string[], entries: NormalizedLogEntry[]) {
  const combined = buffer.join('\n');
  const match = combined.match(NODE_ERROR_PATTERN);
  if (match) {
    entries.push({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level: 'error',
      message: `[${match[1]}] ${match[2]}`,
      errorType: match[1],
      stackTrace: combined,
      raw: combined,
      sourceFormat: 'nodejs',
    });
  } else if (combined.length > 20) {
    entries.push({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level: 'error',
      message: combined.slice(0, 200),
      raw: combined,
      sourceFormat: 'nodejs',
    });
  }
}