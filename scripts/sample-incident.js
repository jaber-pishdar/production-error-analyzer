#!/usr/bin/env node
/**
 * Sample Incident Generator — Simulated Production Incident.
 *
 * Usage: pnpm run sample-incident
 *
 * Generates a short, dramatic log sequence that demonstrates the full pipeline:
 *
 *   Deploy v1 -> normal traffic (30 min) -> bad release -> error spike -> regression detected
 *
 * Pipe to the API: pnpm run sample-incident | curl -X POST http://localhost:4000/api/parse --data-binary @-
 */

function pad(n) { return String(n).padStart(2, '0'); }

function log(h, m, s, level, msg, stack) {
  var ds = '2026-08-23T' + pad(h) + ':' + pad(m) + ':' + pad(s) + 'Z';
  var line = ds + ' ' + level + ' ' + msg;
  if (stack) line += '\n' + stack.join('\n');
  return line;
}

var stack = [
  '    at UserService.getUser (services/user.js:42:12)',
  '    at UserController.show (controllers/user.js:88:5)',
  '    at Router.handle (router.js:15:3)',
  '    at Server.processRequest (server.js:200:8)',
];

var lines = [];

var normal = [
  'GET /api/users/123 404',
  'POST /api/orders 422 validation failed',
  'Health check passed',
  'Token expired for user session',
  'GET /api/products 200 OK',
];

// Phase 1 — Normal traffic (09:00 - 09:30, ~10 errors)
for (var m = 0; m < 30; m++) {
  if (m % 6 === 0) {
    var msg = normal[Math.floor(Math.random() * normal.length)];
    lines.push(log(9, m, Math.floor(Math.random() * 10), 'ERROR', msg));
  }
}

// Phase 2 — Bad release at 09:30
lines.push('#RELEASE 2026-08-23T09:30:00Z');

// Phase 3 — Error spike (09:31 - 10:00, ~80 errors)
for (var m = 31; m < 60; m++) {
  lines.push(log(9, m, Math.floor(Math.random() * 10), 'ERROR', 'TypeError: Cannot read properties of undefined', stack));
  if (m % 2 === 0) {
    lines.push(log(9, m, Math.floor(Math.random() * 10) + 15, 'ERROR', 'POST /api/orders 500 Database connection timeout'));
  }
  if (m % 3 === 0) {
    lines.push(log(9, m, Math.floor(Math.random() * 10) + 30, 'ERROR', 'GET /api/products 500 Internal server error'));
  }
}

console.log(lines.join('\n'));