#!/usr/bin/env node

/**
 * Lightweight auto-cleanup script for Next.js dev server
 * Runs before 'npm run dev' to prevent lock and port conflicts
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOCK_FILE = path.join(process.cwd(), '.next', 'dev', 'lock');
const MIDDLEWARE_BUILD = path.join(process.cwd(), '.next', 'server', 'middleware.js');
const NEXT_DIR = path.join(process.cwd(), '.next');
const PORTS_TO_CHECK = [3000, 3001, 3002];

let cleanupNeeded = false;

// Check for Next.js 16 middleware/proxy conflict (cached middleware.js from previous builds)
if (fs.existsSync(MIDDLEWARE_BUILD)) {
  console.log('⚠️  Old middleware cache detected (Next.js 16 uses proxy.ts), cleaning .next...');
  try {
    execSync('rm -rf .next', { stdio: 'pipe' });
    console.log('✓ Cache cleaned');
  } catch (e) {
    console.error('⚠️  Failed to clean .next directory');
  }
}

// Check if lock file exists
if (fs.existsSync(LOCK_FILE)) {
  console.log('🔒 Stale lock file detected, cleaning up...');
  cleanupNeeded = true;
}

// Check for orphaned processes on common ports
for (const port of PORTS_TO_CHECK) {
  try {
    execSync(`lsof -ti:${port}`, { stdio: 'pipe' });
    console.log(`⚠️  Port ${port} is in use, cleaning up...`);
    cleanupNeeded = true;
    break;
  } catch (e) {
    // Port is free, continue
  }
}

// Run cleanup if needed
if (cleanupNeeded) {
  try {
    execSync('bash scripts/kill-next.sh', { stdio: 'inherit' });
  } catch (error) {
    console.error('⚠️  Cleanup script failed, attempting to continue...');
  }
} else {
  // Silent success - no cleanup needed
  process.exit(0);
}
