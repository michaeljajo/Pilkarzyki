#!/usr/bin/env node

/**
 * Process Manager - Central PID registry and tracking system
 * Tracks all dev server processes with parent-child relationships
 * Provides guaranteed cleanup even when processes become orphaned
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const LockManager = require('./lock-manager');

const DEV_SERVER_DIR = path.join(process.cwd(), '.dev-server');
const PIDS_DIR = path.join(DEV_SERVER_DIR, 'pids');
const PORTS_FILE = path.join(DEV_SERVER_DIR, 'ports.json');
const REGISTRY_FILE = path.join(DEV_SERVER_DIR, 'process-registry.json');
const LOGS_DIR = path.join(DEV_SERVER_DIR, 'logs');

class ProcessManager {
  constructor() {
    this.lockManager = new LockManager();
    this.registry = this.loadRegistry();
    this.initialize();
  }

  /**
   * Initialize directory structure
   */
  initialize() {
    const dirs = [DEV_SERVER_DIR, PIDS_DIR, LOGS_DIR];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Load process registry from disk
   */
  loadRegistry() {
    if (!fs.existsSync(REGISTRY_FILE)) {
      return {
        processes: {},
        ports: {},
        createdAt: Date.now(),
        lastUpdated: Date.now()
      };
    }

    try {
      const content = fs.readFileSync(REGISTRY_FILE, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to load registry, creating new:', error.message);
      return {
        processes: {},
        ports: {},
        createdAt: Date.now(),
        lastUpdated: Date.now()
      };
    }
  }

  /**
   * Save process registry to disk
   */
  saveRegistry() {
    try {
      this.registry.lastUpdated = Date.now();
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(this.registry, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to save registry:', error.message);
      return false;
    }
  }

  /**
   * Register a process in the tracking system
   */
  registerProcess(pid, metadata = {}) {
    const processInfo = {
      pid,
      parentPid: metadata.parentPid || process.pid,
      name: metadata.name || 'unknown',
      command: metadata.command || '',
      ports: metadata.ports || [],
      startTime: Date.now(),
      status: 'running',
      ...metadata
    };

    this.registry.processes[pid] = processInfo;

    // Register ports
    if (metadata.ports && metadata.ports.length > 0) {
      metadata.ports.forEach(port => {
        this.registry.ports[port] = pid;
      });
    }

    // Write PID file
    const pidFile = path.join(PIDS_DIR, `${pid}.json`);
    fs.writeFileSync(pidFile, JSON.stringify(processInfo, null, 2));

    this.saveRegistry();

    return processInfo;
  }

  /**
   * Unregister a process
   */
  unregisterProcess(pid) {
    if (!this.registry.processes[pid]) {
      return false;
    }

    const processInfo = this.registry.processes[pid];

    // Remove port mappings
    if (processInfo.ports) {
      processInfo.ports.forEach(port => {
        delete this.registry.ports[port];
      });
    }

    // Remove from registry
    delete this.registry.processes[pid];

    // Remove PID file
    const pidFile = path.join(PIDS_DIR, `${pid}.json`);
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }

    this.saveRegistry();

    return true;
  }

  /**
   * Check if process is still running
   */
  isProcessAlive(pid) {
    try {
      process.kill(pid, 0);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get process info by PID
   */
  getProcessInfo(pid) {
    return this.registry.processes[pid] || null;
  }

  /**
   * Get all registered processes
   */
  getAllProcesses() {
    return Object.values(this.registry.processes);
  }

  /**
   * Get all child processes of a parent PID
   */
  getChildProcesses(parentPid) {
    return Object.values(this.registry.processes)
      .filter(p => p.parentPid === parentPid);
  }

  /**
   * Find orphaned processes (parent no longer exists)
   */
  findOrphanedProcesses() {
    const orphans = [];

    for (const [pid, info] of Object.entries(this.registry.processes)) {
      const pidNum = parseInt(pid);

      // Check if process is still alive
      if (!this.isProcessAlive(pidNum)) {
        orphans.push({ ...info, reason: 'process_dead' });
        continue;
      }

      // Check if parent is still alive (if parent is not this process manager)
      if (info.parentPid !== process.pid && !this.isProcessAlive(info.parentPid)) {
        orphans.push({ ...info, reason: 'parent_dead' });
        continue;
      }

      // Check PPID from system
      try {
        const output = execSync(`ps -o ppid= -p ${pidNum}`, { encoding: 'utf8' }).trim();
        const actualParentPid = parseInt(output);

        // If actual parent doesn't match registered parent, it's orphaned
        if (actualParentPid !== info.parentPid && actualParentPid !== 1) {
          // PPID of 1 means adopted by init, which is expected for daemon processes
          orphans.push({ ...info, reason: 'parent_mismatch', actualParentPid });
        }
      } catch (e) {
        // Process doesn't exist or ps command failed
        orphans.push({ ...info, reason: 'ps_check_failed' });
      }
    }

    return orphans;
  }

  /**
   * Scan system for Next.js related processes not in registry
   */
  findUnregisteredProcesses() {
    const patterns = [
      'next-server',
      'next dev',
      '@next/swc',
      'turbopack',
      'postcss',
    ];

    const unregistered = [];
    const projectDir = process.cwd();

    for (const pattern of patterns) {
      try {
        const output = execSync(`pgrep -f "${pattern}"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        const pids = output.trim().split('\n').filter(Boolean).map(pid => parseInt(pid));

        for (const pid of pids) {
          // Skip if already registered
          if (this.registry.processes[pid]) {
            continue;
          }

          // Get process info
          try {
            const cmdOutput = execSync(`ps -o command= -p ${pid}`, { encoding: 'utf8' }).trim();

            // Check if process is related to this project
            if (cmdOutput.includes(projectDir)) {
              unregistered.push({
                pid,
                pattern,
                command: cmdOutput
              });
            }
          } catch (e) {
            // Process might have died
          }
        }
      } catch (e) {
        // No processes matching pattern
      }
    }

    return unregistered;
  }

  /**
   * Scan for ports in use by tracked processes
   */
  scanPorts(portRange = { start: 3000, end: 3020 }) {
    const portsInUse = {};

    for (let port = portRange.start; port <= portRange.end; port++) {
      try {
        const output = execSync(`lsof -ti:${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
        if (output) {
          const pid = parseInt(output.split('\n')[0]);
          portsInUse[port] = {
            pid,
            registered: !!this.registry.processes[pid]
          };
        }
      } catch (e) {
        // Port is free
      }
    }

    return portsInUse;
  }

  /**
   * Clean up dead processes from registry
   */
  cleanupDeadProcesses() {
    const deadProcesses = [];

    for (const [pid, info] of Object.entries(this.registry.processes)) {
      const pidNum = parseInt(pid);
      if (!this.isProcessAlive(pidNum)) {
        deadProcesses.push(info);
        this.unregisterProcess(pidNum);
      }
    }

    return deadProcesses;
  }

  /**
   * Kill a process and its children
   */
  killProcess(pid, signal = 'SIGTERM') {
    try {
      // First, try to kill child processes
      const children = this.getChildProcesses(pid);
      children.forEach(child => {
        try {
          process.kill(child.pid, signal);
          console.log(`  ✓ Killed child process ${child.pid} (${child.name})`);
        } catch (e) {
          // Child already dead
        }
      });

      // Then kill the main process
      process.kill(pid, signal);
      console.log(`  ✓ Killed process ${pid}`);

      // Wait a moment for graceful shutdown
      setTimeout(() => {
        // Force kill if still alive
        if (this.isProcessAlive(pid)) {
          try {
            process.kill(pid, 'SIGKILL');
            console.log(`  ✓ Force killed process ${pid}`);
          } catch (e) {
            // Process died
          }
        }

        // Unregister
        this.unregisterProcess(pid);
      }, 1000);

      return true;
    } catch (error) {
      console.error(`Failed to kill process ${pid}:`, error.message);
      return false;
    }
  }

  /**
   * Kill all registered processes
   */
  killAllProcesses(signal = 'SIGTERM') {
    const pids = Object.keys(this.registry.processes).map(pid => parseInt(pid));
    let killed = 0;

    console.log(`🔪 Killing ${pids.length} registered processes...`);

    pids.forEach(pid => {
      if (this.killProcess(pid, signal)) {
        killed++;
      }
    });

    return killed;
  }

  /**
   * Comprehensive cleanup - kills all processes and cleans registry
   */
  async comprehensiveCleanup() {
    return this.lockManager.withLock(async () => {
      console.log('🧹 Starting comprehensive cleanup...');

      // 1. Find and kill orphaned processes
      const orphans = this.findOrphanedProcesses();
      if (orphans.length > 0) {
        console.log(`  Found ${orphans.length} orphaned processes`);
        orphans.forEach(orphan => {
          this.killProcess(orphan.pid, 'SIGKILL');
        });
      }

      // 2. Find and kill unregistered Next.js processes
      const unregistered = this.findUnregisteredProcesses();
      if (unregistered.length > 0) {
        console.log(`  Found ${unregistered.length} unregistered Next.js processes`);
        unregistered.forEach(proc => {
          try {
            process.kill(proc.pid, 'SIGKILL');
            console.log(`  ✓ Killed unregistered: ${proc.pid} (${proc.pattern})`);
          } catch (e) {
            // Already dead
          }
        });
      }

      // 3. Kill all registered processes
      this.killAllProcesses('SIGKILL');

      // 4. Scan ports and kill anything using them
      const ports = this.scanPorts();
      for (const [port, info] of Object.entries(ports)) {
        if (!info.registered) {
          try {
            execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
            console.log(`  ✓ Freed port ${port}`);
          } catch (e) {
            // Already freed
          }
        }
      }

      // 5. Clean up dead processes from registry
      const cleaned = this.cleanupDeadProcesses();

      // 6. Clear .next directory
      const nextDir = path.join(process.cwd(), '.next');
      if (fs.existsSync(nextDir)) {
        try {
          execSync(`rm -rf "${nextDir}"`, { stdio: 'ignore' });
          console.log('  ✓ Removed .next directory');
        } catch (e) {
          console.error('  ✗ Failed to remove .next directory');
        }
      }

      // 7. Clear node_modules cache
      const cacheDir = path.join(process.cwd(), 'node_modules', '.cache');
      if (fs.existsSync(cacheDir)) {
        try {
          execSync(`rm -rf "${cacheDir}"`, { stdio: 'ignore' });
          console.log('  ✓ Removed node_modules/.cache');
        } catch (e) {
          console.error('  ✗ Failed to remove cache');
        }
      }

      console.log('✅ Comprehensive cleanup complete');

      return {
        orphansKilled: orphans.length,
        unregisteredKilled: unregistered.length,
        registeredKilled: Object.keys(this.registry.processes).length,
        deadCleaned: cleaned.length,
        portsFreed: Object.keys(ports).length
      };
    });
  }

  /**
   * Get system status
   */
  getStatus() {
    const allProcesses = this.getAllProcesses();
    const aliveProcesses = allProcesses.filter(p => this.isProcessAlive(p.pid));
    const orphans = this.findOrphanedProcesses();
    const unregistered = this.findUnregisteredProcesses();
    const ports = this.scanPorts();

    return {
      registered: {
        total: allProcesses.length,
        alive: aliveProcesses.length,
        dead: allProcesses.length - aliveProcesses.length
      },
      orphans: orphans.length,
      unregistered: unregistered.length,
      ports: Object.keys(ports).length,
      healthy: orphans.length === 0 && unregistered.length === 0,
      details: {
        processes: aliveProcesses,
        orphans,
        unregistered,
        ports
      }
    };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const pm = new ProcessManager();

  switch (command) {
    case 'status':
      const status = pm.getStatus();
      console.log('📊 Process Manager Status:');
      console.log(`   Registered: ${status.registered.alive}/${status.registered.total} alive`);
      console.log(`   Orphaned: ${status.orphans}`);
      console.log(`   Unregistered: ${status.unregistered}`);
      console.log(`   Ports in use: ${status.ports}`);
      console.log(`   Health: ${status.healthy ? '✅ Healthy' : '⚠️  Issues detected'}`);
      process.exit(status.healthy ? 0 : 1);

    case 'cleanup':
      pm.comprehensiveCleanup()
        .then(result => {
          console.log('\n📊 Cleanup summary:', result);
          process.exit(0);
        })
        .catch(err => {
          console.error('❌ Cleanup failed:', err.message);
          process.exit(1);
        });
      break;

    case 'list':
      const processes = pm.getAllProcesses();
      console.log(`📋 Registered Processes (${processes.length}):`);
      processes.forEach(p => {
        const alive = pm.isProcessAlive(p.pid) ? '✅' : '❌';
        console.log(`   ${alive} PID ${p.pid}: ${p.name} (ports: ${p.ports.join(', ') || 'none'})`);
      });
      process.exit(0);

    case 'register':
      const pid = parseInt(args[1]);
      const name = args[2] || 'manual';
      pm.registerProcess(pid, { name });
      console.log(`✅ Registered process ${pid}`);
      process.exit(0);

    case 'unregister':
      const unregPid = parseInt(args[1]);
      pm.unregisterProcess(unregPid);
      console.log(`✅ Unregistered process ${unregPid}`);
      process.exit(0);

    case 'kill':
      const killPid = parseInt(args[1]);
      pm.killProcess(killPid);
      console.log(`✅ Killed process ${killPid}`);
      process.exit(0);

    default:
      console.log('Usage: process-manager.js <command> [args]');
      console.log('Commands:');
      console.log('  status          - Show process manager status');
      console.log('  cleanup         - Comprehensive cleanup of all processes');
      console.log('  list            - List all registered processes');
      console.log('  register <pid> [name] - Register a process');
      console.log('  unregister <pid> - Unregister a process');
      console.log('  kill <pid>      - Kill a process and its children');
      process.exit(1);
  }
}

module.exports = ProcessManager;
