import type { NormalizedLogEntry, ErrorGroup, LogLevel } from '@pea/shared';
import crypto from 'node:crypto';

/**
 * Generate a fingerprint for an error based on message and stack trace.
 * Normalises dynamic values (numbers, IDs, quotes) so identical errors
 * with different runtime data produce the same fingerprint.
 */
export function fingerprint(entry: NormalizedLogEntry): string {
  const normalised = entry.message
    .replace(/\d+/g, '0')
    .replace(/"[^"]*"/g, '"..."')
       .replace(/'[^']*'/g, "'...'")
    .replace(/`[^`]*`/g, '`...`')
    .trim();

  const stackHash = entry.stackTrace
    ? crypto.createHash('md5').update(entry.stackTrace.replace(/\d+/g, '0')).digest('hex').slice(0, 12)
    : '';

  return crypto.createHash('md5').update(`${normalised}|${stackHash}`).digest('hex');
}

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
      groups.set(fp, {
        fingerprint: fp,
        message: entry.message,
        level: entry.level,
        source: entry.source,
        count: 1,
        firstSeen: entry.timestamp,
        lastSeen: entry.timestamp,
        stackTrace: entry.stackTrace,
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}