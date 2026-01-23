#!/usr/bin/env node

/**
 * Next.js Development Server Health Monitor
 *
 * Monitors localhost:3000 health and auto-restarts on failure
 * Prevents the chronic "server becomes unresponsive" issue
 */

const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds
const TIMEOUT_MS = 10000; // 10 second timeout for health check
const MAX_FAILURES = 2; // Restart after 2 consecutive failures
const MONITOR_FILE = path.join(process.cwd(), '.next', 'dev-monitor.pid');

let consecutiveFailures = 0;
let isRestarting = false;

console.log('🏥 Health monitor started');
console.log(`   Checking http://localhost:${PORT} every ${CHECK_INTERVAL_MS/1000}s`);
console.log(`   Max failures before restart: ${MAX_FAILURES}`);

// Write monitor PID for cleanup
fs.mkdirSync(path.dirname(MONITOR_FILE), { recursive: true });
fs.writeFileSync(MONITOR_FILE, process.pid.toString());

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n👋 Health monitor stopped');
  try { fs.unlinkSync(MONITOR_FILE); } catch (e) {}
  process.exit(0);
});

process.on('SIGTERM', () => {
  try { fs.unlinkSync(MONITOR_FILE); } catch (e) {}
  process.exit(0);
});

/**
 * Check if server is responsive
 */
function checkHealth() {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/',
        method: 'GET',
        timeout: TIMEOUT_MS
      },
      (res) => {
        const responseTime = Date.now() - startTime;

        // Any response means server is alive
        if (res.statusCode >= 200 && res.statusCode < 500) {
          resolve({ healthy: true, responseTime, status: res.statusCode });
        } else {
          resolve({ healthy: false, error: `Bad status: ${res.statusCode}`, responseTime });
        }

        // Drain response to free up socket
        res.resume();
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve({ healthy: false, error: 'Timeout', responseTime: TIMEOUT_MS });
    });

    req.on('error', (err) => {
      resolve({ healthy: false, error: err.message, responseTime: Date.now() - startTime });
    });

    req.end();
  });
}

/**
 * Restart the dev server
 */
async function restartServer() {
  if (isRestarting) {
    console.log('   ⏳ Restart already in progress...');
    return;
  }

  isRestarting = true;
  console.log('\n🔄 RESTARTING SERVER (unresponsive detected)');

  try {
    // Kill all Next.js processes
    console.log('   🔪 Killing processes...');
    execSync('bash scripts/kill-next-aggressive.sh', { stdio: 'inherit' });

    // Wait for processes to fully die
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start fresh server in background
    console.log('   🚀 Starting fresh server...');
    execSync('npm run dev &', {
      stdio: 'ignore',
      detached: true,
      shell: true
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Reset failure counter
    consecutiveFailures = 0;
    console.log('✅ Server restarted successfully\n');

  } catch (error) {
    console.error('❌ Restart failed:', error.message);
  } finally {
    isRestarting = false;
  }
}

/**
 * Main monitoring loop
 */
async function monitor() {
  const result = await checkHealth();

  if (result.healthy) {
    if (consecutiveFailures > 0) {
      console.log(`✅ Server recovered (${result.responseTime}ms)`);
    }
    consecutiveFailures = 0;
  } else {
    consecutiveFailures++;
    console.log(`❌ Health check failed (${consecutiveFailures}/${MAX_FAILURES}): ${result.error}`);

    if (consecutiveFailures >= MAX_FAILURES) {
      await restartServer();
    }
  }
}

// Start monitoring
setInterval(monitor, CHECK_INTERVAL_MS);

// Initial check after 10 seconds (let server boot)
setTimeout(monitor, 10000);

console.log('✓ Monitor running in background\n');
