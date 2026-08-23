#!/usr/bin/env node
/**
 * Demo Mode — generates ~10,000 log lines, POSTs to the API, and shows a summary.
 *
 * Usage: pnpm run demo
 *
 * Prerequisite: API server running on http://localhost:4000
 */

var http = require('http');

function pad(n) { return String(n).padStart(2, '0'); }

var lines = [];

// Phase 1 — Normal traffic (hours 0–9, ~5 errors/hour, 50 errors total)
var normalMsgs = [
  'INFO GET /api/users 200 OK',
  'INFO GET /api/products 200 OK',
  'WARN POST /api/orders 422 validation failed',
  'ERROR GET /api/users/123 404 not found',
  'ERROR Token expired for user session',
  'WARN Disk space usage at 78%',
  'INFO Health check passed',
  'ERROR POST /api/checkout 409 conflict',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

for (var h = 0; h < 10; h++) {
  for (var i = 0; i < 5; i++) {
    var msg = pick(normalMsgs);
    var m = Math.floor(Math.random() * 60);
    var s = Math.floor(Math.random() * 60);
    lines.push('2026-08-22T' + pad(h) + ':' + pad(m) + ':' + pad(s) + 'Z ' + msg);
  }
}

// Phase 2 — Buggy release at hour 10 → massive spike (hours 10–11, ~80 errors/hour)
var spikeStart = lines.length;
var stack = [
  '    at UserService.getUser (services/user.js:42:12)',
  '    at UserController.show (controllers/user.js:88:5)',
  '    at Router.handle (router.js:15:3)',
  '    at Server.processRequest (server.js:200:8)',
];

for (var h = 10; h < 12; h++) {
  // TypeError ~40/hour
  for (var i = 0; i < 40; i++) {
    var m = Math.floor(Math.random() * 60);
    var s = Math.floor(Math.random() * 60);
    lines.push('2026-08-22T' + pad(h) + ':' + pad(m) + ':' + pad(s) + 'Z ERROR TypeError: Cannot read properties of undefined');
    // add stack trace for half of them
    if (i % 2 === 0) {
      lines.push(stack.join('\n'));
    }
  }
  // Database timeout ~25/hour
  for (var i = 0; i < 25; i++) {
    var m = Math.floor(Math.random() * 60);
    lines.push('2026-08-22T' + pad(h) + ':' + pad(m) + ':' + pad(Math.floor(Math.random() * 60)) + 'Z ERROR POST /api/orders 500 Database connection timeout');
  }
  // 500 errors ~20/hour
  for (var i = 0; i < 20; i++) {
    var m = Math.floor(Math.random() * 60);
    lines.push('2026-08-22T' + pad(h) + ':' + pad(m) + ':' + pad(Math.floor(Math.random() * 60)) + 'Z ERROR GET /api/products 500 Internal server error');
  }
}

// Phase 3 — Recovery (hours 12–13, back to normal)
for (var h = 12; h < 14; h++) {
  for (var i = 0; i < 4; i++) {
    lines.push('2026-08-22T' + pad(h) + ':' + pad(Math.floor(Math.random() * 60)) + ':' + pad(Math.floor(Math.random() * 60)) + 'Z ' + pick(normalMsgs));
  }
}

var body = lines.join('\n');

console.log('Generating ' + lines.length + ' log lines...');
console.log('Sending to http://localhost:4000/api/parse ...');

var req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/parse',
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain',
    'Content-Length': Buffer.byteLength(body),
  },
}, function (res) {
  var data = '';
  res.on('data', function (chunk) { data += chunk; });
  res.on('end', function () {
    var json = JSON.parse(data);
    var d = json.dashboard;
    if (!d) {
      console.log('ERROR: API returned unexpected response');
      console.log(data.slice(0, 500));
      process.exit(1);
    }
    var total = d.overview.totalErrors;
    var crit = d.overview.criticalErrors;
    var groups = d.groups.length;
    var spikeBuckets = d.timeSeries.spikeBuckets.length;
    var hasRegression = 'Run regression check with: curl "http://localhost:4000/api/regression?release=2026-08-22T10:00:00Z"';

    console.log('');
    console.log('=== Demo Complete ===');
    console.log('');
    console.log('  Logs parsed:      ' + json.entriesCount);
    console.log('  Error entries:     ' + total);
    console.log('  Error groups:      ' + groups);
    console.log('  Critical groups:   ' + crit);
    console.log('  Spike buckets:     ' + spikeBuckets);
    console.log('  Affected endpoints:' + d.overview.affectedEndpoints);
    console.log('  Error rate:        ' + d.overview.errorRate + '%');
    console.log('');
    if (spikeBuckets > 0) {
      console.log('  ⚡ Spike detected in ' + spikeBuckets + ' time bucket(s)');
    }
    console.log('  ' + hasRegression);
    console.log('');
    console.log('Open http://localhost:4000 to see the dashboard.');
    console.log('');
  });
});

req.on('error', function (e) {
  console.log('ERROR: Could not connect to http://localhost:4000');
  console.log('Make sure the API server is running (docker compose up or pnpm dev)');
  console.log(e.message);
  process.exit(1);
});

req.write(body);
req.end();