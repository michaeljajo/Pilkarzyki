#!/usr/bin/env node

/**
 * ENHANCED Auto-cleanup script for Next.js dev server
 * Runs before 'npm run dev' to prevent lock and port conflicts
 * Uses aggressive cleanup to prevent chronic "server becomes unresponsive" issue
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOCK_FILE = path.join(process.cwd(), '.next', 'dev', 'lock');
const MIDDLEWARE_BUILD = path.join(process.cwd(), '.next', 'server', 'middleware.js');
const NEXT_DIR = path.join(process.cwd(), '.next');
const PORTS_TO_CHECK = [3000, 3001, 3002];
const MONITOR_PID_FILE = path.join(process.cwd(), '.next', 'dev-monitor.pid');

let cleanupNeeded = false;

console.log('🔍 Pre-flight checks...');

// 1. Kill any existing health monitor
if (fs.existsSync(MONITOR_PID_FILE)) {
  try {
    const monitorPid = fs.readFileSync(MONITOR_PID_FILE, 'utf8').trim();
    process.kill(parseInt(monitorPid), 'SIGTERM');
    console.log('  ✓ Stopped old health monitor');
    fs.unlinkSync(MONITOR_PID_FILE);
  } catch (e) {
    // Monitor not running, that's fine
  }
}

// 2. Check for Next.js 16 middleware/proxy conflict
if (fs.existsSync(MIDDLEWARE_BUILD)) {
  console.log('  ⚠️  Old middleware cache detected');
  cleanupNeeded = true;
}

// 3. Check for stale lock file
if (fs.existsSync(LOCK_FILE)) {
  console.log('  ⚠️  Stale lock file detected');
  cleanupNeeded = true;
}

// 4. Check for orphaned processes on ports
for (const port of PORTS_TO_CHECK) {
  try {
    execSync(`lsof -ti:${port}`, { stdio: 'pipe' });
    console.log(`  ⚠️  Port ${port} is occupied`);
    cleanupNeeded = true;
    break;
  } catch (e) {
    // Port is free
  }
}

// 5. Check for zombie Next.js processes
try {
  execSync('pgrep -f "next-server" > /dev/null 2>&1');
  console.log('  ⚠️  Zombie next-server processes detected');
  cleanupNeeded = true;
} catch (e) {
  // No zombie processes
}

// 6. Check if .next is corrupted (older than 24 hours and process is running)
if (fs.existsSync(NEXT_DIR)) {
  const stats = fs.statSync(NEXT_DIR);
  const ageInHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
  if (ageInHours > 24) {
    console.log('  ⚠️  Cache is >24 hours old, clearing for freshness');
    cleanupNeeded = true;
  }
}

// Run cleanup if needed
if (cleanupNeeded) {
  console.log('\n🧹 Running AGGRESSIVE cleanup...\n');
  try {
    execSync('bash scripts/kill-next-aggressive.sh', { stdio: 'inherit' });
  } catch (error) {
    console.error('⚠️  Cleanup script failed:', error.message);
    // Try basic cleanup at least
    try {
      execSync('rm -rf .next', { stdio: 'pipe' });
      execSync('lsof -ti:3000 | xargs kill -9 2>/dev/null || true', { stdio: 'pipe' });
    } catch (e) {
      console.error('⚠️  Even basic cleanup failed!');
    }
  }
  console.log();
} else {
  console.log('✅ All checks passed - system clean!\n');
}

process.exit(0);
