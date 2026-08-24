import type { NormalizedLogEntry, ParserResult } from '@pea/shared';

let entryCounter = 0;

const RE_HEADER =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?)\s+(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|CRITICAL)\s*/i;

const RE_STACK_LINE = /^\s+at\s+/;

// Matches "METHOD /path statusCode" optionally followed by more text
// Examples:
//   GET /api/users 200
//   POST /api/orders 500 timeout
//   PUT /products/123 201 created
const RE_HTTP_LINE = /^\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\/\S*)\s+(\d{3})\b/;

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
    const parsedTimestamp = new Date(timestampStr);
    const timestamp = isNaN(parsedTimestamp.getTime()) ? new Date() : parsedTimestamp;
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
        i++;
        continue;
      }
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

    const fullMessage = messageLines.join('\n').trim();

    // Extract HTTP method, endpoint and status code from the first line
    const httpMatch = (afterLevel || messageLines[0] || '').match(RE_HTTP_LINE);

    entries.push({
      id: `node-${++entryCounter}`,
      timestamp,
      level,
      message: fullMessage || '',
      source: 'node',
      method: httpMatch?.[1],
      endpoint: httpMatch?.[2],
      statusCode: httpMatch ? parseInt(httpMatch[3], 10) : undefined,
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