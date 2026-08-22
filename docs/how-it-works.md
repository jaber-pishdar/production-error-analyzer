# How It Works

Production Error Analyzer turns raw production logs into actionable error intelligence using a four-stage pipeline.

## Pipeline

```
Raw Logs
    │
    ▼
  Parser ─── Normalises log entries into a
  Stage      structured format with timestamp,
             level, message, method, endpoint,
             status code, and stack trace.
    │
    ▼
  Analyzer ── Fingerprints every error by
  Stage      type + message + stack frames.
             Groups identical errors together.
             Classifies severity (info→critical).
    │
    ▼
  Metrics ─── Computes HTTP metrics per endpoint.
  Stage      Aggregates error counts into time
             buckets. Detects spikes (>3x mean).
    │
    ▼
  Dashboard ─ Presents everything in one page:
              overview cards, error groups table,
              timeline chart, endpoint analysis.
```

## Supported Log Format

Each line follows this structure:

```
<TIMESTAMP> <LEVEL> <MESSAGE>
```

- **Timestamp**: ISO-8601 (`2026-08-22T10:15:31Z` or with offset `+03:30`)
- **Level**: `DEBUG`, `INFO`, `WARN`/`WARNING`, `ERROR`, `FATAL`, `CRITICAL`
- **Message**: free text; if it starts with `METHOD /path STATUS`, HTTP fields are extracted automatically
- **Stack trace**: Lines starting with whitespace + `at` are stored as structured stack frames

### Example

```
2026-08-22T10:15:31Z ERROR TypeError: Cannot read properties of undefined
    at UserService.getUser (services/user.js:42:12)
    at UserController.show (controllers/user.js:88:5)
```

## Error Fingerprinting

The fingerprint algorithm normalises dynamic values so identical errors get grouped together:

1. Extract error type prefix (`TypeError:`, `Error:`, …)
2. Normalise numbers → `0`, quoted strings → `"..."`, hex → `0x...`
3. Parse stack frames, normalise line/column to `0`
4. Take the top 4 frames (capped + padded for stability)
5. MD5 of `type|normalisedMessage|normalisedFrames`

**Result**: Two stack traces with different line numbers but the same function chain produce the same fingerprint.

## Severity Classification

| Severity  | Criteria |
|-----------|----------|
| `info`    | Log level is info/debug or health/heartbeat keywords |
| `low`     | Single 404, validation messages |
| `warning` | WARN level, minor upstream errors |
| `high`    | ERROR level, TypeError/ReferenceError/SyntaxError |
| `critical`| FATAL/CRITICAL level, database errors, 5xx, 50+ occurrences |

## Regression Detection

Given a release timestamp, the engine compares error rates (errors/hour) before and after:

- **≥2× increase** with at least 5 entries on each side → regression flagged
- **After rate > 50 errors/hour** → regression flagged regardless
- Result includes `beforeRate`, `afterRate`, `ratio`, and a human-readable message