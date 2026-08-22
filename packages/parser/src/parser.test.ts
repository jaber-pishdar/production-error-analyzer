import { describe, it, expect } from 'vitest';
import { parse } from '../src/index.js';

describe('Node.js log parser', () => {
  // 1. Valid log — single line
  it('parses a valid single-line error', () => {
    const input = '2026-08-22T10:15:31Z ERROR Database connection failed';
    const result = parse(input);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].timestamp).toEqual(new Date('2026-08-22T10:15:31Z'));
    expect(result.entries[0].level).toBe('error');
    expect(result.entries[0].message).toBe('Database connection failed');
    expect(result.entries[0].source).toBe('node');
    expect(result.errors).toHaveLength(0);
  });

  // 2. Invalid log — bad format
  it('rejects a line without a valid timestamp+level header', () => {
    const input = 'this is just some random text';
    const result = parse(input);
    expect(result.entries).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].line).toBe(1);
  });

  // 3. Missing timestamp
  it('rejects a line with level but no timestamp prefix', () => {
    const input = 'ERROR something broke';
    const result = parse(input);
    expect(result.entries).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  // 4. Missing level
  it('rejects a line with timestamp but no level keyword', () => {
    const input = '2026-08-22T10:15:31Z just a message without level';
    const result = parse(input);
    expect(result.entries).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  // 5. Multi-line stack trace
  it('parses a multi-line error with stack trace', () => {
    const input = [
      '2026-08-22T10:15:31Z ERROR Connection timeout',
      '    at Socket.connect (net.js:123:15)',
      '    at RedisClient._onConnect (redis.js:456:10)',
      '    at processTicksAndRejections (internal/process/task_queues.js:95:5)',
    ].join('\n');
    const result = parse(input);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].message).toBe('Connection timeout');
    expect(result.entries[0].stackTrace).toContain('net.js:123:15');
    expect(result.entries[0].stackTrace).toContain('redis.js:456:10');
    expect(result.errors).toHaveLength(0);
  });

  // 6. Duplicate errors
  it('parses two identical error lines as two separate entries', () => {
    const input = [
      '2026-08-22T10:15:31Z ERROR Database connection failed',
      '2026-08-22T10:16:01Z ERROR Database connection failed',
    ].join('\n');
    const result = parse(input);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].message).toBe(result.entries[1].message);
    expect(result.entries[0].id).not.toBe(result.entries[1].id);
    expect(result.errors).toHaveLength(0);
  });

  // 7. Different errors
  it('parses two distinct error types', () => {
    const input = [
      '2026-08-22T10:15:31Z ERROR Database connection failed',
      '2026-08-22T10:16:01Z ERROR Out of memory',
    ].join('\n');
    const result = parse(input);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].message).toBe('Database connection failed');
    expect(result.entries[1].message).toBe('Out of memory');
    expect(result.errors).toHaveLength(0);
  });

  // Extra: mixed valid/invalid
  // Lines without a TIMESTAMP LEVEL header are treated as continuation
  // of the previous entry's message, not as errors
  it('treats continuation lines as part of the previous entry', () => {
    const input = [
      '2026-08-22T10:15:31Z ERROR First error',
      'some additional detail',
      '2026-08-22T10:16:01Z ERROR Second error',
    ].join('\n');
    const result = parse(input);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].message).toContain('some additional detail');
    expect(result.errors).toHaveLength(0);
  });

  // Extra: blank lines are ignored
  it('skips blank lines', () => {
    const input = [
      '',
      '2026-08-22T10:15:31Z ERROR Something broke',
      '',
    ].join('\n');
    const result = parse(input);
    expect(result.entries).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  // Extra: timezone offset
  it('parses timestamp with timezone offset', () => {
    const input = '2026-08-22T14:45:00+03:30 ERROR With offset';
    const result = parse(input);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].message).toBe('With offset');
    // Date parsing should handle ISO-8601 with offset
    expect(result.entries[0].timestamp).toBeDefined();
  });

  // Extra: WARN level alias
  it('parses WARNING as warn level', () => {
    const input = '2026-08-22T10:15:31Z WARNING Disk space low';
    const result = parse(input);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].level).toBe('warn');
  });

  // Extra: multiline message without stack trace
  it('handles multi-line message without stack trace', () => {
    const input = [
      '2026-08-22T10:15:31Z ERROR',
      'Request failed with status 500',
      'Response body: {"error":"internal"}',
    ].join('\n');
    const result = parse(input);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].message).toBe('Request failed with status 500\nResponse body: {"error":"internal"}');
    expect(result.entries[0].stackTrace).toBeUndefined();
  });

  // HTTP: GET request
  it('parses GET /path 200 as HTTP entry', () => {
    const input = '2026-08-22T10:15:31Z INFO GET /api/users 200';
    const result = parse(input);
    expect(result.entries[0].method).toBe('GET');
    expect(result.entries[0].endpoint).toBe('/api/users');
    expect(result.entries[0].statusCode).toBe(200);
  });

  // HTTP: POST with error
  it('parses POST /path 500 as error HTTP entry', () => {
    const input = '2026-08-22T10:15:31Z ERROR POST /api/orders 500';
    const result = parse(input);
    expect(result.entries[0].method).toBe('POST');
    expect(result.entries[0].endpoint).toBe('/api/orders');
    expect(result.entries[0].statusCode).toBe(500);
  });

  // HTTP: extra text after status code
  it('parses HTTP line with trailing text', () => {
    const input = '2026-08-22T10:15:31Z INFO GET /api/products 200 ok';
    const result = parse(input);
    expect(result.entries[0].method).toBe('GET');
    expect(result.entries[0].endpoint).toBe('/api/products');
    expect(result.entries[0].statusCode).toBe(200);
  });

  // HTTP: non-HTTP entry should not get method/endpoint
  it('does not extract HTTP fields from a non-HTTP message', () => {
    const input = '2026-08-22T10:15:31Z ERROR Database connection failed';
    const result = parse(input);
    expect(result.entries[0].method).toBeUndefined();
    expect(result.entries[0].endpoint).toBeUndefined();
    expect(result.entries[0].statusCode).toBeUndefined();
  });
});