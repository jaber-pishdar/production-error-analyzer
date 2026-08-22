import type { NormalizedLogEntry, ParserResult } from '@pea/shared';

let entryCounter = 0;

const RE_HEADER =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?)\s+(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|CRITICAL)\s*/i;

const RE_STACK_LINE = /^\s+at\s+/;

export function parse(input: string): ParserResult {
  const entries: NormalizedLogEntry[] = [];
  const errors: ParserResult['errors'] = [];
  const lines = input.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // blank → skip
    if (line.trim() === '') {
      i++;
      continue;
    }

    const headerMatch = line.match(RE_HEADER);

    if (!headerMatch) {
      // not a valid log header → error
      errors.push({ line: i + 1, message: `Unrecognized log line — expected "TIMESTAMP LEVEL" format`, raw: line.slice(0, 300) });
      i++;
      continue;
    }

    const [, timestampStr, levelStr] = headerMatch;
    const timestamp = new Date(timestampStr);
    const level = normalizeLevel(levelStr);

    // Everything after the level keyword on this same line is the inline message
    const afterLevel = line.slice(headerMatch[0].length).trim();
    const messageLines: string[] = [];
    const stackLines: string[] = [];

    if (afterLevel) {
      messageLines.push(afterLevel);
    }

    // Collect continuation lines (multi-line message / stack trace)
    i++;
    while (i < lines.length) {
      const nextLine = lines[i];
      if (nextLine.trim() === '') {
        // blank line inside body — keep it as part of the message,
        // but if we have already started collecting, stop at double blank
        i++;
        continue;
      }
      // If next line is a new header, stop
      if (RE_HEADER.test(nextLine)) {
        break;
      }
      if (RE_STACK_LINE.test(nextLine)) {
        stackLines.push(nextLine);
      } else {
        messageLines.push(nextLine);
      }
      i++;
    }

    entries.push({
      id: `node-${++entryCounter}`,
      timestamp,
      level,
      message: messageLines.join('\n').trim() || '',
      source: 'node',
      stackTrace: stackLines.length > 0 ? stackLines.join('\n') : undefined,
      raw: [line, ...messageLines, ...stackLines].join('\n'),
    });
  }

  return { entries, errors };
}

function normalizeLevel(level: string): NormalizedLogEntry['level'] {
  const l = level.toUpperCase();
  if (l === 'WARNING') return 'warn';
  if (l === 'FATAL') return 'fatal';
  if (l === 'CRITICAL') return 'critical';
  return l.toLowerCase() as NormalizedLogEntry['level'];
}