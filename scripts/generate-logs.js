#!/usr/bin/env node
/**
 * Generate realistic log data with proper time progression.
 *
 * Usage: node scripts/generate-logs.js [count]
 *
 * Default: 1500 lines, one every 60 seconds.
 * Includes a sustained error spike around the middle of the window.
 */

var count = parseInt(process.argv[2], 10) || 1500;

function pad(n) { return String(n).padStart(2, '0'); }

function timestamp(h, m, s) {
  return '2026-08-22T' + pad(h) + ':' + pad(m) + ':' + pad(s) + 'Z';
}

var stack = '    at UserService.getUser (services/user.js:42:12)\n    at UserController.show (controllers/user.js:88:5)\n    at Router.handle (router.js:15:3)';

var patterns = [
  { level: 'WARN',  msg: 'GET /api/users/123 404 not found' },
  { level: 'ERROR', msg: 'POST /api/orders 422 validation failed' },
  { level: 'INFO',  msg: 'GET /api/products 200 OK' },
  { level: 'WARN',  msg: 'Disk space usage at 78%' },
  { level: 'ERROR', msg: 'Token expired for user session' },
  { level: 'ERROR', msg: 'GET /api/users/123 404 not found' },
  { level: 'ERROR', msg: 'POST /api/orders 422 validation failed' },
  { level: 'INFO',  msg: 'GET /api/products 200 OK' },
  { level: 'WARN',  msg: 'Disk space usage at 78%' },
  { level: 'ERROR', msg: 'Token expired for user session' },
  { level: 'ERROR', msg: 'GET /api/users/123 404 not found' },
  { level: 'ERROR', msg: 'POST /api/orders 422 validation failed' },
  { level: 'INFO',  msg: 'GET /api/products 200 OK' },
  { level: 'WARN',  msg: 'Disk space usage at 78%' },
  { level: 'ERROR', msg: 'Token expired for user session' },
];

var spikePatterns = [
  { level: 'ERROR', msg: 'TypeError: Cannot read properties of undefined', stk: true },
  { level: 'ERROR', msg: 'POST /api/orders 500 Database connection timeout' },
  { level: 'ERROR', msg: 'GET /api/products 500 Internal server error' },
  { level: 'ERROR', msg: 'TypeError: Cannot read properties of undefined', stk: true },
  { level: 'ERROR', msg: 'POST /api/orders 500 Database connection timeout' },
  { level: 'ERROR', msg: 'GET /api/products 500 Internal server error' },
];

// start at 09:00
var startHour = 9;
var lines = [];

for (var i = 0; i < count; i++) {
  var totalMinutes = i;
  var h = startHour + Math.floor(totalMinutes / 60);
  var m = totalMinutes % 60;
  var s = Math.floor(Math.random() * 59);

  // Spike window: hours 3-5 (12:00 - 14:00) of the generated window
  var windowHour = Math.floor(totalMinutes / 60);
  var isSpike = windowHour >= 3 && windowHour <= 5;

  var p = isSpike
    ? spikePatterns[Math.floor(Math.random() * spikePatterns.length)]
    : patterns[Math.floor(Math.random() * patterns.length)];

  var line = timestamp(h, m, s) + ' ' + p.level + ' ' + p.msg;
  if (p.stk) line += '\n' + stack;

  lines.push(line);
}

console.log(lines.join('\n'));