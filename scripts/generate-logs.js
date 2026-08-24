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

function ts(h, m, s) {
  return '2026-08-22T' + pad(h) + ':' + pad(m) + ':' + pad(s) + 'Z';
}

var stack = '    at UserService.getUser (services/user.js:42:12)\n    at UserController.show (controllers/user.js:88:5)\n    at Router.handle (router.js:15:3)';

var patterns = [
  'WARN GET /api/users/123 404 not found',
  'ERROR POST /api/orders 422 validation failed',
  'INFO GET /api/products 200 OK',
  'WARN Disk space usage at 78%',
  'ERROR Token expired for user session',
  'ERROR GET /api/users/123 404 not found',
  'ERROR POST /api/orders 422 validation failed',
  'INFO GET /api/products 200 OK',
  'WARN Disk space usage at 78%',
  'ERROR Token expired for user session',
  'ERROR GET /api/users/123 404 not found',
  'ERROR POST /api/orders 422 validation failed',
  'INFO GET /api/products 200 OK',
  'WARN Disk space usage at 78%',
  'ERROR Token expired for user session',
];

var spikePatterns = [
  'ERROR TypeError: Cannot read properties of undefined',
  'ERROR POST /api/orders 500 Database connection timeout',
  'ERROR GET /api/products 500 Internal server error',
  'ERROR TypeError: Cannot read properties of undefined',
  'ERROR POST /api/orders 500 Database connection timeout',
  'ERROR GET /api/products 500 Internal server error',
];

var startHour = 9;
var startDay = 22;
var lines = [];

for (var i = 0; i < count; i++) {
  var totalMinutes = i;
  var absHour = startHour + Math.floor(totalMinutes / 60);
  var h = absHour % 24;
  var m = totalMinutes % 60;
  var s = Math.floor(Math.random() * 59);
  var day = startDay + Math.floor(absHour / 24);

  var windowHour = Math.floor(totalMinutes / 60);
  var isSpike = windowHour >= 3 && windowHour <= 5;

  var raw = isSpike
    ? spikePatterns[Math.floor(Math.random() * spikePatterns.length)]
    : patterns[Math.floor(Math.random() * patterns.length)];

  var line = '2026-08-' + pad(day) + 'T' + pad(h) + ':' + pad(m) + ':' + pad(s) + 'Z ' + raw;
  if (raw.indexOf('TypeError') !== -1) {
    line += '\n' + stack;
  }

  lines.push(line);
}

console.log(lines.join('\n'));