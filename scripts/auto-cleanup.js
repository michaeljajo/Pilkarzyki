#!/usr/bin/env node

/**
 * ENHANCED Auto-cleanup script for Next.js dev server V2
 * Runs before 'npm run dev' to prevent lock and port conflicts
 * Integrated with ProcessManager for comprehensive tracking
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Try to load ProcessManager, fallback to basic cleanup if not available
let ProcessManager;
let useProcessManager = false;

try {
  ProcessManager = require('./process-manager');
  useProcessManager = true;
} catch (e) {
  console.log('  ℹ️  Process Manager not available, using basic cleanup');
}

const LOCK_FILE = path.join(process.cwd(), '.next', 'dev', 'lock');
const MIDDLEWARE_BUILD = path.join(process.cwd(), '.next', 'server', 'middleware.js');
const NEXT_DIR = path.join(process.cwd(), '.next');
const PORTS_TO_CHECK = [3000, 3001, 3002];
const MONITOR_PID_FILE = path.join(process.cwd(), '.dev-server', 'health-monitor.pid');
const OLD_MONITOR_PID_FILE = path.join(process.cwd(), '.next', 'dev-monitor.pid');

let cleanupNeeded = false;
let issues = [];

console.log('🔍 Pre-flight checks (V2)...');

// Initialize process manager if available
let pm;
if (useProcessManager) {
  try {
    pm = new ProcessManager();
    console.log('  ✓ Process Manager initialized');
  } catch (e) {
    console.log('  ⚠️  Failed to initialize Process Manager:', e.message);
    pm = null;
  }
}

// 1. Kill any existing health monitors (both old and new locations)
[MONITOR_PID_FILE, OLD_MONITOR_PID_FILE].forEach(pidFile => {
  if (fs.existsSync(pidFile)) {
    try {
      const monitorPid = fs.readFileSync(pidFile, 'utf8').trim();
      process.kill(parseInt(monitorPid), 'SIGTERM');
      console.log('  ✓ Stopped old health monitor');
      fs.unlinkSync(pidFile);
    } catch (e) {
      // Monitor not running or already stopped
      try {
        fs.unlinkSync(pidFile);
      } catch (err) {
        // Ignore
      }
    }
  }
});

// 2. Check for orphaned processes using ProcessManager
if (pm) {
  try {
    const orphans = pm.findOrphanedProcesses();
    if (orphans.length > 0) {
      console.log(`  ⚠️  Found ${orphans.length} orphaned processes`);
      issues.push(`${orphans.length} orphaned processes`);
      cleanupNeeded = true;
    }

    const unregistered = pm.findUnregisteredProcesses();
    if (unregistered.length > 0) {
      console.log(`  ⚠️  Found ${unregistered.length} unregistered Next.js processes`);
      issues.push(`${unregistered.length} unregistered processes`);
      cleanupNeeded = true;
    }

    // Clean up dead processes from registry
    const dead = pm.cleanupDeadProcesses();
    if (dead.length > 0) {
      console.log(`  ✓ Cleaned ${dead.length} dead processes from registry`);
    }
  } catch (e) {
    console.log('  ⚠️  Process Manager check failed:', e.message);
  }
}

// 3. Check for Next.js 16 middleware/proxy conflict
if (fs.existsSync(MIDDLEWARE_BUILD)) {
  console.log('  ⚠️  Old middleware cache detected');
  issues.push('old middleware cache');
  cleanupNeeded = true;
}

// 4. Check for stale lock file
if (fs.existsSync(LOCK_FILE)) {
  console.log('  ⚠️  Stale lock file detected');
  issues.push('stale lock file');
  cleanupNeeded = true;
}

// 5. Check for orphaned processes on ports
for (const port of PORTS_TO_CHECK) {
  try {
    execSync(`lsof -ti:${port}`, { stdio: 'pipe' });
    console.log(`  ⚠️  Port ${port} is occupied`);
    issues.push(`port ${port} occupied`);
    cleanupNeeded = true;
    break;
  } catch (e) {
    // Port is free
  }
}

// 6. Check for zombie Next.js processes (if not using ProcessManager)
if (!pm) {
  try {
    execSync('pgrep -f "next-server" > /dev/null 2>&1');
    console.log('  ⚠️  Zombie next-server processes detected');
    issues.push('zombie processes');
    cleanupNeeded = true;
  } catch (e) {
    // No zombie processes
  }
}

// 7. Check if .next is corrupted (older than 24 hours)
if (fs.existsSync(NEXT_DIR)) {
  const stats = fs.statSync(NEXT_DIR);
  const ageInHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
  if (ageInHours > 24) {
    console.log('  ⚠️  Cache is >24 hours old, clearing for freshness');
    issues.push('old cache');
    cleanupNeeded = true;
  }
}

// Run cleanup if needed
if (cleanupNeeded) {
  console.log(`\n🧹 Issues detected: ${issues.join(', ')}`);
  console.log('🧹 Running comprehensive cleanup...\n');

  try {
    if (pm) {
      // Use ProcessManager for comprehensive cleanup
      console.log('  Using ProcessManager for cleanup...');
      pm.comprehensiveCleanup()
        .then(result => {
          console.log('  ✅ ProcessManager cleanup complete');
          console.log(`     - Orphans killed: ${result.orphansKilled}`);
          console.log(`     - Unregistered killed: ${result.unregisteredKilled}`);
          console.log(`     - Ports freed: ${result.portsFreed}`);
          console.log();
          process.exit(0);
        })
        .catch(err => {
          console.error('  ⚠️  ProcessManager cleanup failed:', err.message);
          fallbackCleanup();
        });
    } else {
      // Fallback to aggressive cleanup script
      fallbackCleanup();
    }
  } catch (error) {
    console.error('⚠️  Cleanup failed:', error.message);
    fallbackCleanup();
  }
} else {
  console.log('✅ All checks passed - system clean!\n');
  process.exit(0);
}

// Fallback cleanup function
function fallbackCleanup() {
  console.log('  Using fallback cleanup script...');
  try {
    execSync('bash scripts/kill-next-aggressive.sh', { stdio: 'inherit' });
    console.log();
    process.exit(0);
  } catch (error) {
    console.error('⚠️  Cleanup script failed:', error.message);
    // Try basic cleanup at least
    try {
      execSync('rm -rf .next', { stdio: 'pipe' });
      execSync('lsof -ti:3000 | xargs kill -9 2>/dev/null || true', { stdio: 'pipe' });
      console.log('  ✓ Basic cleanup complete\n');
    } catch (e) {
      console.error('⚠️  Even basic cleanup failed!');
    }
    process.exit(1);
  }
}
