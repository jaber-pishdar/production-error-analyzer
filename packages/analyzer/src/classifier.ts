import type { NormalizedLogEntry, ErrorGroup, Severity } from '@pea/shared';

/**
 * Severity levels ordered from lowest to highest.
 */
const SEVERITY_ORDER: Severity[] = ['info', 'low', 'warning', 'high', 'critical'];

/**
 * Keywords that trigger an upgrade or downgrade of the base severity.
 */
const UPGRADE_KEYWORDS = [
  { pattern: /\b(database|db|mysql|postgres|redis|mongo|query|sql)\b/i, step: 1 },
  { pattern: /\btimeout\b/i, step: 1 },
  { pattern: /\bconnection\s*(refused|reset|closed|failed|lost)\b/i, step: 1 },
  { pattern: /\bout\s*of\s*memory\b/i, step: 1 },
  { pattern: /\bfatal\b/i, step: 1 },
  { pattern: /\bpanic\b/i, step: 1 },
  { pattern: /\buncaught\b/i, step: 1 },
  { pattern: /\bstack overflow\b/i, step: 1 },
  { pattern: /\b(?:http|status)?\s*5[0-9]{2}\b/, step: 1 },
];

const DOWNGRADE_KEYWORDS = [
  { pattern: /\bhealth\b/i, step: 1 },
  { pattern: /\bheartbeat\b/i, step: 1 },
  { pattern: /\bkeepalive\b/i, step: 1 },
  { pattern: /\bdebug\b/i, step: 1 },
  { pattern: /\b(?:http|status)?\s*404\b/, step: 2 },  // single 404 → low
];

/**
 * Error types that force the severity to at least 'high'.
 */
const HIGH_LEVEL_ERROR_TYPES = [
  'typeerror', 'referenceerror', 'syntaxerror', 'rangeerror',
  'assertionerror', 'internalerror', 'evalerror',
];

/**
 * Classify the severity of a single log entry based on its log level,
 * message content, and metadata.
 */
export function classifyEntrySeverity(entry: NormalizedLogEntry): Severity {
  // 1. Base severity from log level
  let base = baseSeverity(entry.level);
  let idx = SEVERITY_ORDER.indexOf(base);

  // 2. Upgrade keywords
  for (const kw of UPGRADE_KEYWORDS) {
    if (kw.pattern.test(entry.message)) {
      idx = Math.min(idx + kw.step, SEVERITY_ORDER.length - 1);
    }
  }

  // 3. Downgrade keywords
  for (const kw of DOWNGRADE_KEYWORDS) {
    if (kw.pattern.test(entry.message)) {
      idx = Math.max(idx - kw.step, 0);
    }
  }

  // 4. Error-type minimum floor
  const errorTypeLower = extractErrorTypeName(entry.message).toLowerCase();
  if (HIGH_LEVEL_ERROR_TYPES.includes(errorTypeLower)) {
    idx = Math.max(idx, SEVERITY_ORDER.indexOf('high'));
  }

  return SEVERITY_ORDER[idx];
}

/**
 * Classify the overall severity of an error group by looking at the
 * worst severity across all its entries and applying group-level rules.
 */
export function classifyGroupSeverity(group: ErrorGroup): Severity {
  // Start with the group's current severity (from the first entry that set it)
  // or compute it fresh from the stack trace / message.

  // Groups with critical-level log entries are always critical
  if (group.level === 'critical' || group.level === 'fatal') {
    return 'critical';
  }

  // High-frequency groups get upgraded
  if (group.count >= 50) {
    return 'critical';
  }
  if (group.count >= 10) {
    return 'high';
  }

  // Fall back to the message-based classification
  return classifyEntrySeverity({
    id: group.fingerprint,
    timestamp: group.firstSeen,
    level: group.level,
    message: group.message,
    source: group.source,
    stackTrace: group.stackTrace,
    raw: '',
  });
}

// ---- internal ---- //

function baseSeverity(level: NormalizedLogEntry['level']): Severity {
  switch (level) {
    case 'critical':
    case 'fatal':
      return 'critical';
    case 'error':
      return 'high';
    case 'warn':
      return 'warning';
    case 'info':
      return 'info';
    case 'debug':
      return 'info';
    default:
      return 'info';
  }
}

function extractErrorTypeName(message: string): string {
  const match = message.match(/^([A-Za-z]\w*(?:Error|Exception|Rejection))\s*:/);
  return match ? match[1] : '';
}