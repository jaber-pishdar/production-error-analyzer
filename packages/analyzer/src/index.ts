import type { NormalizedLogEntry, ErrorGroup } from '@pea/shared';
import crypto from 'node:crypto';
import { classifyEntrySeverity, classifyGroupSeverity } from './classifier.js';

export { classifyEntrySeverity, classifyGroupSeverity };
export { computeHttpMetrics } from './http-metrics.js';

// Matches a stack frame line like:
//   at FunctionName (file.js:10:20)
//   at Object.<anonymous> (/full/path/file.ts:42:8)
//   at Socket._onTimeout (node:internal/timers:123:4)
const RE_STACK_FRAME = /^\s+at\s+(.+?)\s+\((.+?)(?::(\d+))?(?::(\d+))?\)\s*$/;

// Matches a bare "at ..." without parens:
//   at new Promise (<anonymous>)
//   at Generator.next
const RE_STACK_BARE = /^\s+at\s+(.+?)\s*$/;

// Matches an error-type prefix at the start of a message:
//   TypeError: Cannot read properties of undefined
//   Error: ENOENT: no such file or directory
const RE_ERROR_TYPE = /^([A-Za-z]\w*(?:Error|Exception|Rejection))\s*:\s*(.*)$/;

// Maximum stack frames used in the fingerprint.
// Keeps the fingerprint stable regardless of trace depth.
const MAX_FRAMES = 4;

/**
 * Generate a stack-aware fingerprint for an error entry.
 *
 * Strategy:
 *  1. Extract error type (TypeError, ReferenceError, Error, …)
 *  2. Normalise the message body (numbers→0, quotes→"..."...)
 *  3. Parse stack frames, normalise line/col numbers in each
 *  4. Take the top MAX_FRAMES frames (most recent call site first)
 *  5. MD5 the combined normalised string
 *
 * Two entries with the same error type, same message pattern, and the same
 * call chain (first N frames) produce the same fingerprint regardless of
 * line numbers, file paths, or trace depth.
 */
export function fingerprint(entry: NormalizedLogEntry): string {
  const { type, body } = extractErrorType(entry.message);
  const normalisedBody = normaliseMessage(body || entry.message);

  const frames = parseStackFrames(entry.stackTrace);
  const normalisedFrames = frames
    .slice(0, MAX_FRAMES)
    .map(normaliseFrame);
  // Pad with empty strings to exactly MAX_FRAMES so traces
  // of different depth still produce the same fingerprint
  // when the top frames are identical.
  while (normalisedFrames.length < MAX_FRAMES) {
    normalisedFrames.push('');
  }
  const framePayload = normalisedFrames.join('\n');

  const typePart = (type ?? 'Error').toLowerCase();
  const payload = `${typePart}|${normalisedBody}|${framePayload}`;
  return crypto.createHash('md5').update(payload).digest('hex');
}

// ---- internal helpers ---- //

function extractErrorType(msg: string): { type?: string; body: string } {
  const match = msg.match(RE_ERROR_TYPE);
  if (match) {
    return { type: match[1], body: match[2].trim() };
  }
  return { body: msg };
}

function normaliseMessage(msg: string): string {
  return msg
    .replace(/\b\d+\b/g, '0')               // numbers → 0
    .replace(/"[^"]*"/g, '"..."')            // double-quoted → "..."'
    .replace(/'[^']*'/g, "'...'")             // single-quoted → '...'
    .replace(/`[^`]*`/g, '`...`')             // backtick-quoted → `...`
    .replace(/\b([0-9a-f]{6,})\b/gi, '0x...') // hex constants → 0x...
    .replace(/\s+/g, ' ')                    // collapse whitespace
    .trim();
}

interface StackFrame {
  func: string;
  file: string;
  line: number | null;
  col: number | null;
}

function parseStackFrames(stackTrace: string | undefined): StackFrame[] {
  if (!stackTrace) return [];

  const frames: StackFrame[] = [];

  for (const line of stackTrace.split('\n')) {
    let match = line.match(RE_STACK_FRAME);
    if (match) {
      frames.push({
        func: match[1].trim(),
        file: match[2].trim(),
        line: match[3] ? parseInt(match[3], 10) : null,
        col: match[4] ? parseInt(match[4], 10) : null,
      });
      continue;
    }

    match = line.match(RE_STACK_BARE);
    if (match) {
      frames.push({
        func: match[1].trim(),
        file: '<anonymous>',
        line: null,
        col: null,
      });
    }
  }

  return frames;
}

function normaliseFrame(frame: StackFrame): string {
  // Keep the function name but normalise file+line+col so small
  // differences in the runtime path don't break grouping.
  const file = normaliseFilePath(frame.file);
  const line = frame.line != null ? '0' : '';
  const col = frame.col != null ? '0' : '';
  const loc = line || col ? `:${line}${col ? `:${col}` : ''}` : '';
  return `at ${frame.func} (${file}${loc})`;
}

function normaliseFilePath(file: string): string {
  // Strip drive letters / volume names (Windows: C:\, /c/, /dev/…)
  let p = file.replace(/^[a-zA-Z]:\\/, '');   // C:\ → ''
  p = p.replace(/^\/[a-zA-Z]\//, '');           // /c/ → ''
  // Replace any path segment that looks like a version or hash
  p = p.replace(/node_modules/g, 'nm');
  return p;
}

// ---- grouping (unchanged logic, improved structure) ---- //

/**
 * Group a list of entries into error groups by fingerprint.
 * Info/debug entries are ignored — only warn+ matter.
 */
export function groupErrors(entries: NormalizedLogEntry[]): ErrorGroup[] {
  const groups = new Map<string, ErrorGroup>();

  for (const entry of entries) {
    if (entry.level === 'info' || entry.level === 'debug') continue;

    const fp = fingerprint(entry);
    const existing = groups.get(fp);

    if (existing) {
      existing.count++;
      existing.lastSeen =
        entry.timestamp > existing.lastSeen ? entry.timestamp : existing.lastSeen;
      existing.firstSeen =
        entry.timestamp < existing.firstSeen ? entry.timestamp : existing.firstSeen;
    } else {
      const entrySeverity = classifyEntrySeverity(entry);
      groups.set(fp, {
        fingerprint: fp,
        message: entry.message,
        level: entry.level,
        source: entry.source,
        count: 1,
        firstSeen: entry.timestamp,
        lastSeen: entry.timestamp,
        stackTrace: entry.stackTrace,
        severity: entrySeverity,
      });
    }
  }

  // Compute group-level severity (may differ from entry severity based on count)
  for (const group of groups.values()) {
    group.severity = classifyGroupSeverity(group);
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}