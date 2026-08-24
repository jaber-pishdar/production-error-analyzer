#!/usr/bin/env node
/**
 * Seed script — generates realistic log data for demo and testing.
 *
 * Usage: pnpm seed
 *
 * Outputs formatted log lines to stdout. Pipe to the API or use directly.
 *
 * Data pattern:
 *   - 48 hours of normal traffic (~5 errors/hour)
 *   - A simulated incident at hour 12 with an error spike
 */

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function entry(iso, level, message) {
  var stack = [
    '    at UserService.' + pick(['getUser', 'updateProfile', 'deleteAccount', 'listOrders']) + ' (services/user.js:' + (Math.floor(Math.random() * 100) + 10) + ':' + (Math.floor(Math.random() * 20) + 1) + ')',
    '    at ' + pick(['UserController', 'OrderController', 'ProductController', 'AuthController']) + '.' + pick(['show', 'create', 'update', 'list']) + ' (controllers/' + pick(['user', 'order', 'product', 'auth']) + '.js:' + (Math.floor(Math.random() * 100) + 10) + ':' + (Math.floor(Math.random() * 10) + 1) + ')',
  ].join('\n');
  return iso + ' ' + level + ' ' + message + '\n' + stack;
}

function pad(n) { return String(n).padStart(2, '0'); }

function log(h, m, s, level, msg) {
  var ds = '2026-08-22T' + pad(h) + ':' + pad(m) + ':' + pad(s) + 'Z';
  return entry(ds, level, msg);
}

var seed = [];

var normalMessages = [
  ['WARN', 'GET /api/users/123 404 not found'],
  ['ERROR', 'POST /api/orders 422 validation failed: email required'],
  ['INFO', 'GET /api/products 200 OK'],
  ['WARN', 'Disk space usage at 78%'],
  ['ERROR', 'Token expired for user session'],
  ['WARN', 'GET /api/search?q= 400 bad request'],
  ['ERROR', 'POST /api/checkout 409 conflict: cart expired'],
  ['INFO', 'Health check passed'],
];

// 48 hours of normal traffic
for (var h = 0; h < 48; h++) {
  var errCount = (h === 12 || h === 36) ? 12 : Math.floor(Math.random() * 4) + 2;
  for (var e = 0; e < errCount; e++) {
    var pair = pick(normalMessages);
    seed.push(log(h % 24, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), pair[0], pair[1]));
  }
}

// Incident at hour 12 — spike
for (var m = 0; m < 60; m++) {
  seed.push(log(12, m, 10, 'ERROR', 'TypeError: Cannot read properties of undefined'));
  if (m % 3 === 0) seed.push(log(12, m, 20, 'ERROR', 'POST /api/orders 500 Database connection timeout'));
  if (m % 4 === 0) seed.push(log(12, m, 30, 'ERROR', 'GET /api/products 500 Internal server error'));
}

// Incident at hour 12 (second spike, same day)
for (var m = 0; m < 30; m++) {
  if (m % 2 === 0) seed.push(log(12, m, 15, 'ERROR', 'TypeError: Cannot read properties of undefined'));
}

console.log(seed.join('\n'));