import { describe, it, expect } from 'vitest';
import { parse, detectFormat } from '../src/index.js';

describe('detectFormat', () => {
  it('detects JSON format', () => {
    const input = '{"message":"hello","level":"error"}';
    expect(detectFormat(input)).toBe('json');
  });

  it('detects Apache format', () => {
    const input = '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326';
    expect(detectFormat(input)).toBe('apache');
  });

  it('detects Node.js error format', () => {
    const input = 'Error: Cannot find module\n    at Function.Module._resolveFilename';
    expect(detectFormat(input)).toBe('nodejs');
  });

  it('detects PHP format', () => {
    const input = '[15-Mar-2024 10:30:00 UTC] PHP Warning:  mysqli_connect(): Connection refused';
    expect(detectFormat(input)).toBe('php');
  });

  it('detects Python format', () => {
    const input = 'ERROR:myapp:Database connection failed';
    expect(detectFormat(input)).toBe('python');
  });

  it('returns unknown for empty input', () => {
    expect(detectFormat('')).toBe('unknown');
  });
});

describe('parse JSON', () => {
  it('parses a single JSON log line', () => {
    const input = '{"timestamp":"2024-03-15T10:30:00Z","level":"error","message":"Something broke"}';
    const result = parse(input, 'json');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].message).toBe('Something broke');
    expect(result.entries[0].level).toBe('error');
  });

  it('parses multiple JSON lines', () => {
    const input = [
      '{"timestamp":"2024-03-15T10:30:00Z","level":"error","message":"First error"}',
      '{"timestamp":"2024-03-15T10:31:00Z","level":"warn","message":"A warning"}',
    ].join('\n');
    const result = parse(input, 'json');
    expect(result.entries).toHaveLength(2);
  });

  it('reports parse errors for invalid JSON', () => {
    const input = '{"valid": true}\nnot json\n{"also valid": 1}';
    const result = parse(input, 'json');
    expect(result.entries).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
  });

  it('handles empty input', () => {
    const result = parse('', 'json');
    expect(result.entries).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});

describe('parse Apache', () => {
  it('parses Apache access log', () => {
    const input = '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /index.html HTTP/1.0" 200 2326';
    const result = parse(input, 'apache');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].endpoint).toBe('/index.html');
    expect(result.entries[0].httpStatus).toBe(200);
    expect(result.entries[0].httpMethod).toBe('GET');
  });

  it('marks 5xx as error level', () => {
    const input = '127.0.0.1 - - [10/Oct/2000:13:55:36 -0700] "GET /api/users HTTP/1.0" 503 123';
    const result = parse(input, 'apache');
    expect(result.entries[0].level).toBe('error');
  });
});