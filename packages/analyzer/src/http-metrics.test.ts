import { describe, it, expect } from 'vitest';
import { computeHttpMetrics } from '../src/http-metrics.js';
import type { NormalizedLogEntry } from '@pea/shared';

function entry(overrides: Partial<NormalizedLogEntry> = {}): NormalizedLogEntry {
  return {
    id: 't',
    timestamp: new Date('2026-08-22T10:00:00Z'),
    level: 'error',
    message: 'GET /api/users 200',
    source: 'node',
    method: 'GET',
    endpoint: '/api/users',
    statusCode: 200,
    raw: '',
    ...overrides,
  };
}

describe('computeHttpMetrics', () => {
  it('returns empty metrics when there are no HTTP entries', () => {
    const result = computeHttpMetrics([]);
    expect(result.endpoints).toHaveLength(0);
    expect(result.worstEndpoint).toBeNull();
    expect(result.totalRequests).toBe(0);
    expect(result.totalErrors).toBe(0);
  });

  it('computes a single successful request', () => {
    const result = computeHttpMetrics([entry({ statusCode: 200, level: 'info' })]);
    expect(result.totalRequests).toBe(1);
    expect(result.totalErrors).toBe(0);
    expect(result.overallErrorRate).toBe(0);
    expect(result.endpoints).toHaveLength(1);
    expect(result.endpoints[0].errorRate).toBe(0);
  });

  it('counts 500 status code as an error', () => {
    const result = computeHttpMetrics([entry({ statusCode: 500, level: 'error' })]);
    expect(result.totalErrors).toBe(1);
    expect(result.totalRequests).toBe(1);
  });

  it('counts error-level log as an error even without 5xx', () => {
    const result = computeHttpMetrics([
      entry({ statusCode: 200, level: 'error', message: 'GET /api/users 200 but error logged' }),
    ]);
    expect(result.totalErrors).toBe(1);
  });

  it('calculates error rate correctly', () => {
    const entries = [
      entry({ id: 'e1', method: 'GET', endpoint: '/api/products', statusCode: 200, level: 'info' }),
      entry({ id: 'e2', method: 'GET', endpoint: '/api/products', statusCode: 500, level: 'error' }),
      entry({ id: 'e3', method: 'GET', endpoint: '/api/products', statusCode: 200, level: 'info' }),
      entry({ id: 'e4', method: 'GET', endpoint: '/api/products', statusCode: 500, level: 'error' }),
    ];
    const result = computeHttpMetrics(entries);
    expect(result.totalRequests).toBe(4);
    expect(result.totalErrors).toBe(2);
    expect(result.overallErrorRate).toBe(50);
    expect(result.endpoints[0].errorRate).toBe(50);
    expect(result.endpoints[0].errors).toBe(2);
  });

  it('aggregates status code distribution', () => {
    const entries = [
      entry({ id: 'e1', method: 'POST', endpoint: '/api/orders', statusCode: 200, level: 'info' }),
      entry({ id: 'e2', method: 'POST', endpoint: '/api/orders', statusCode: 200, level: 'info' }),
      entry({ id: 'e3', method: 'POST', endpoint: '/api/orders', statusCode: 500, level: 'error' }),
    ];
    const result = computeHttpMetrics(entries);
    expect(result.endpoints[0].statusCodes).toEqual({ 200: 2, 500: 1 });
  });

  it('identifies the worst endpoint (highest error rate)', () => {
    const entries = [
      // /api/users: 0% error
      entry({ id: 'e1', method: 'GET', endpoint: '/api/users', statusCode: 200, level: 'info' }),
      entry({ id: 'e2', method: 'GET', endpoint: '/api/users', statusCode: 200, level: 'info' }),
      // /api/orders: 100% error
      entry({ id: 'e3', method: 'POST', endpoint: '/api/orders', statusCode: 500, level: 'error' }),
      entry({ id: 'e4', method: 'POST', endpoint: '/api/orders', statusCode: 500, level: 'error' }),
    ];
    const result = computeHttpMetrics(entries);
    expect(result.worstEndpoint).not.toBeNull();
    expect(result.worstEndpoint!.method).toBe('POST');
    expect(result.worstEndpoint!.endpoint).toBe('/api/orders');
    expect(result.worstEndpoint!.errorRate).toBe(100);
  });

  it('skips entries without method/endpoint', () => {
    const entries = [
      entry({ method: undefined, endpoint: undefined, statusCode: undefined, message: 'Something broke' }),
      entry({ method: 'GET', endpoint: '/api/ping', statusCode: 200, level: 'info' }),
    ];
    const result = computeHttpMetrics(entries);
    expect(result.totalRequests).toBe(1);
    expect(result.endpoints).toHaveLength(1);
  });

  it('handles multiple distinct endpoints', () => {
    const entries = [
      entry({ id: 'e1', method: 'GET', endpoint: '/api/users', statusCode: 200, level: 'info' }),
      entry({ id: 'e2', method: 'GET', endpoint: '/api/users', statusCode: 200, level: 'info' }),
      entry({ id: 'e3', method: 'POST', endpoint: '/api/orders', statusCode: 201, level: 'info' }),
      entry({ id: 'e4', method: 'GET', endpoint: '/api/products', statusCode: 500, level: 'error' }),
    ];
    const result = computeHttpMetrics(entries);
    expect(result.endpoints).toHaveLength(3);
  });
});