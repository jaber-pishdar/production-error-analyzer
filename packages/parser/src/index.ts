import type { NormalizedLogEntry, LogFormat, ParserResult } from '@pea/shared';

export type LogParser = (input: string, sourceFormat?: LogFormat) => ParserResult;

export { parseJSONLog } from './parsers/json-parser.js';
export { parseApacheLog } from './parsers/apache-parser.js';
export { parseNodeLog } from './parsers/node-parser.js';
export { parsePHPLog } from './parsers/php-parser.js';
export { parsePythonLog } from './parsers/python-parser.js';

export function detectFormat(input: string): LogFormat {
  const firstLine = input.split('\n').find((l) => l.trim().length > 0) ?? '';
  if (firstLine.startsWith('{') || firstLine.startsWith('[')) return 'json';
  if (/^\S+ - - \[/.test(firstLine)) return 'apache';
  if (/\b(Error|Exception)\b/.test(firstLine) && /\bat\s/.test(firstLine)) return 'nodejs';
  if (/^\[[\d]{2}-[A-Za]{3}/.test(firstLine) || /^\[[\d]{4}/.test(firstLine)) return 'php';
  if (/^(DEBUG|INFO|WARNING|ERROR|CRITICAL)/.test(firstLine)) return 'python';
  return 'unknown';
}

export function parse(input: string, format?: LogFormat): ParserResult {
  const detected = format ?? detectFormat(input);
  switch (detected) {
    case 'json':
      return parseJSONLog(input);
    case 'apache':
      return parseApacheLog(input);
    case 'nodejs':
      return parseNodeLog(input);
    case 'php':
      return parsePHPLog(input);
    case 'python':
      return parsePythonLog(input);
    default:
      return { entries: [], errors: [{ line: 0, message: 'Unknown log format', raw: input.slice(0, 200) }] };
  }
}