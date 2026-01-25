#!/usr/bin/env node

/**
 * Lock Manager - Prevents concurrent cleanup operations
 * Implements file-based advisory locking with automatic stale lock detection
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEV_SERVER_DIR = path.join(process.cwd(), '.dev-server');
const LOCK_DIR = path.join(DEV_SERVER_DIR, 'locks');
const LOCK_FILE = path.join(LOCK_DIR, 'cleanup.lock');
const STALE_LOCK_TIMEOUT_MS = 60000; // 60 seconds

class LockManager {
  constructor() {
    this.lockAcquired = false;
    this.lockData = null;
  }

  /**
   * Initialize lock directory
   */
  initialize() {
    try {
      fs.mkdirSync(LOCK_DIR, { recursive: true });
      return true;
    } catch (error) {
      console.error('Failed to initialize lock directory:', error.message);
      return false;
    }
  }

  /**
   * Check if a lock is stale (older than timeout and process doesn't exist)
   */
  isLockStale() {
    if (!fs.existsSync(LOCK_FILE)) {
      return false;
    }

    try {
      const lockContent = fs.readFileSync(LOCK_FILE, 'utf8');
      const lockData = JSON.parse(lockContent);

      // Check age
      const lockAge = Date.now() - lockData.timestamp;
      if (lockAge < STALE_LOCK_TIMEOUT_MS) {
        return false; // Lock is fresh
      }

      // Check if process still exists
      try {
        process.kill(lockData.pid, 0); // Signal 0 checks existence without killing
        return false; // Process exists, lock is valid
      } catch (e) {
        // Process doesn't exist, lock is stale
        return true;
      }
    } catch (error) {
      // Corrupted lock file is considered stale
      return true;
    }
  }

  /**
   * Acquire the cleanup lock
   * @param {number} maxWaitMs - Maximum time to wait for lock
   * @returns {boolean} - Whether lock was acquired
   */
  acquire(maxWaitMs = 5000) {
    if (!this.initialize()) {
      return false;
    }

    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      // Check if lock exists
      if (fs.existsSync(LOCK_FILE)) {
        // Check if it's stale
        if (this.isLockStale()) {
          console.log('🔓 Breaking stale lock...');
          this.forceRelease();
        } else {
          // Lock is held by another process, wait
          const waitTime = 100;
          const elapsed = Date.now() - startTime;

          if (elapsed + waitTime < maxWaitMs) {
            // Wait and retry
            require('child_process').execSync(`sleep 0.1`, { stdio: 'ignore' });
            continue;
          } else {
            // Timeout
            console.error('⏱️  Lock acquisition timeout');
            return false;
          }
        }
      }

      // Try to create lock file
      try {
        this.lockData = {
          pid: process.pid,
          timestamp: Date.now(),
          hostname: os.hostname(),
          command: process.argv.join(' ')
        };

        // Atomic write with exclusive flag
        const fd = fs.openSync(LOCK_FILE, 'wx');
        fs.writeSync(fd, JSON.stringify(this.lockData, null, 2));
        fs.closeSync(fd);

        this.lockAcquired = true;
        return true;
      } catch (error) {
        if (error.code === 'EEXIST') {
          // Lock was created by another process between our check and create
          // Retry the loop
          continue;
        } else {
          console.error('Failed to acquire lock:', error.message);
          return false;
        }
      }
    }

    return false;
  }

  /**
   * Release the cleanup lock
   */
  release() {
    if (!this.lockAcquired) {
      return true;
    }

    try {
      if (fs.existsSync(LOCK_FILE)) {
        // Verify we own the lock
        const lockContent = fs.readFileSync(LOCK_FILE, 'utf8');
        const lockData = JSON.parse(lockContent);

        if (lockData.pid === process.pid) {
          fs.unlinkSync(LOCK_FILE);
          this.lockAcquired = false;
          return true;
        } else {
          console.warn('⚠️  Attempted to release lock owned by another process');
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to release lock:', error.message);
      return false;
    }
  }

  /**
   * Force release any lock (use with caution)
   */
  forceRelease() {
    try {
      if (fs.existsSync(LOCK_FILE)) {
        fs.unlinkSync(LOCK_FILE);
      }
      this.lockAcquired = false;
      return true;
    } catch (error) {
      console.error('Failed to force release lock:', error.message);
      return false;
    }
  }

  /**
   * Get current lock info
   */
  getLockInfo() {
    if (!fs.existsSync(LOCK_FILE)) {
      return null;
    }

    try {
      const lockContent = fs.readFileSync(LOCK_FILE, 'utf8');
      return JSON.parse(lockContent);
    } catch (error) {
      return null;
    }
  }

  /**
   * Execute function with lock
   * @param {Function} fn - Function to execute
   * @param {number} maxWaitMs - Maximum time to wait for lock
   * @returns {Promise} - Result of function
   */
  async withLock(fn, maxWaitMs = 5000) {
    if (!this.acquire(maxWaitMs)) {
      throw new Error('Failed to acquire lock');
    }

    try {
      const result = await fn();
      return result;
    } finally {
      this.release();
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const lockManager = new LockManager();

  switch (command) {
    case 'acquire':
      const acquired = lockManager.acquire();
      console.log(acquired ? '✅ Lock acquired' : '❌ Failed to acquire lock');
      process.exit(acquired ? 0 : 1);

    case 'release':
      const released = lockManager.release();
      console.log(released ? '✅ Lock released' : '❌ Failed to release lock');
      process.exit(released ? 0 : 1);

    case 'force-release':
      const forceReleased = lockManager.forceRelease();
      console.log(forceReleased ? '✅ Lock force released' : '❌ Failed to force release');
      process.exit(forceReleased ? 0 : 1);

    case 'info':
      const info = lockManager.getLockInfo();
      if (info) {
        console.log('🔒 Lock information:');
        console.log(JSON.stringify(info, null, 2));
        process.exit(0);
      } else {
        console.log('🔓 No lock currently held');
        process.exit(1);
      }

    case 'is-locked':
      const locked = fs.existsSync(LOCK_FILE) && !lockManager.isLockStale();
      process.exit(locked ? 0 : 1);

    default:
      console.log('Usage: lock-manager.js <command>');
      console.log('Commands:');
      console.log('  acquire        - Acquire the cleanup lock');
      console.log('  release        - Release the cleanup lock');
      console.log('  force-release  - Force release any lock');
      console.log('  info           - Show current lock info');
      console.log('  is-locked      - Check if lock is held (exit code 0 if locked)');
      process.exit(1);
  }
}

module.exports = LockManager;
