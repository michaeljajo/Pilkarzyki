#!/usr/bin/env node

/**
 * Developer Dashboard - Visual status of dev server and all processes
 * Provides real-time visibility into the state of the development environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ProcessManager = require('./process-manager');

const DEV_SERVER_DIR = path.join(process.cwd(), '.dev-server');
const METRICS_FILE = path.join(DEV_SERVER_DIR, 'metrics.json');
const HEALTH_LOG = path.join(DEV_SERVER_DIR, 'logs', 'health-monitor.log');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

class DevDashboard {
  constructor() {
    this.processManager = new ProcessManager();
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  /**
   * Format duration
   */
  formatDuration(ms) {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get colored status indicator
   */
  getStatusIndicator(healthy) {
    return healthy
      ? `${colors.green}●${colors.reset} Healthy`
      : `${colors.red}●${colors.reset} Unhealthy`;
  }

  /**
   * Draw a simple bar chart
   */
  drawBar(value, max, width = 20) {
    const filled = Math.floor((value / max) * width);
    const empty = width - filled;

    let color = colors.green;
    if (value / max > 0.8) color = colors.red;
    else if (value / max > 0.6) color = colors.yellow;

    return `${color}${'█'.repeat(filled)}${colors.dim}${'░'.repeat(empty)}${colors.reset}`;
  }

  /**
   * Load metrics from file
   */
  loadMetrics() {
    if (!fs.existsSync(METRICS_FILE)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
    } catch (e) {
      return null;
    }
  }

  /**
   * Get recent log entries
   */
  getRecentLogs(count = 10) {
    if (!fs.existsSync(HEALTH_LOG)) {
      return [];
    }

    try {
      const output = execSync(`tail -n ${count} "${HEALTH_LOG}"`, { encoding: 'utf8' });
      return output
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            return { message: line };
          }
        });
    } catch (e) {
      return [];
    }
  }

  /**
   * Check if server is responding
   */
  async checkServerHealth() {
    return new Promise((resolve) => {
      const http = require('http');
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        resolve({ responding: true, status: res.statusCode });
        res.resume();
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ responding: false, error: 'Timeout' });
      });

      req.on('error', (err) => {
        resolve({ responding: false, error: err.message });
      });

      req.end();
    });
  }

  /**
   * Get system resource usage
   */
  getSystemResources() {
    try {
      // Get Next.js process info
      const nextProcess = execSync(
        `ps aux | grep "next dev" | grep -v grep | head -1`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      ).trim();

      if (!nextProcess) {
        return null;
      }

      const parts = nextProcess.split(/\s+/);
      return {
        cpu: parseFloat(parts[2]),
        memory: parseFloat(parts[3]),
        rss: parseInt(parts[5]) * 1024, // Convert KB to bytes
        vsz: parseInt(parts[4]) * 1024,
        time: parts[9]
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Print header
   */
  printHeader() {
    const line = '═'.repeat(80);
    console.log(`${colors.bright}${colors.cyan}${line}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}  NEXT.JS DEV SERVER DASHBOARD${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${line}${colors.reset}\n`);
  }

  /**
   * Print server status section
   */
  async printServerStatus() {
    console.log(`${colors.bright}🚀 SERVER STATUS${colors.reset}`);
    console.log('─'.repeat(80));

    const health = await this.checkServerHealth();
    const resources = this.getSystemResources();

    console.log(`  Status:          ${this.getStatusIndicator(health.responding)}`);
    console.log(`  URL:             ${colors.cyan}http://localhost:3000${colors.reset}`);

    if (health.responding) {
      console.log(`  HTTP Status:     ${colors.green}${health.status}${colors.reset}`);
    } else {
      console.log(`  Error:           ${colors.red}${health.error}${colors.reset}`);
    }

    if (resources) {
      console.log(`  CPU Usage:       ${resources.cpu.toFixed(1)}% ${this.drawBar(resources.cpu, 100)}`);
      console.log(`  Memory Usage:    ${resources.memory.toFixed(1)}% ${this.drawBar(resources.memory, 100)}`);
      console.log(`  RSS:             ${this.formatBytes(resources.rss)}`);
      console.log(`  VSZ:             ${this.formatBytes(resources.vsz)}`);
      console.log(`  CPU Time:        ${resources.time}`);
    } else {
      console.log(`  ${colors.yellow}⚠ Dev server process not found${colors.reset}`);
    }

    console.log();
  }

  /**
   * Print process registry section
   */
  printProcessRegistry() {
    console.log(`${colors.bright}📋 PROCESS REGISTRY${colors.reset}`);
    console.log('─'.repeat(80));

    const status = this.processManager.getStatus();

    console.log(`  Registered:      ${status.registered.alive}/${status.registered.total} alive`);
    console.log(`  Orphaned:        ${status.orphans > 0 ? colors.red : colors.green}${status.orphans}${colors.reset}`);
    console.log(`  Unregistered:    ${status.unregistered > 0 ? colors.yellow : colors.green}${status.unregistered}${colors.reset}`);
    console.log(`  Ports in use:    ${status.ports}`);

    if (status.details.processes.length > 0) {
      console.log(`\n  ${colors.dim}Active Processes:${colors.reset}`);
      status.details.processes.forEach(p => {
        const uptime = this.formatDuration(Date.now() - p.startTime);
        const ports = p.ports && p.ports.length > 0 ? ` [${p.ports.join(', ')}]` : '';
        console.log(`    ${colors.green}●${colors.reset} PID ${p.pid}: ${p.name}${ports} (${uptime})`);
      });
    }

    if (status.orphans > 0) {
      console.log(`\n  ${colors.red}Orphaned Processes:${colors.reset}`);
      status.details.orphans.forEach(p => {
        console.log(`    ${colors.red}●${colors.reset} PID ${p.pid}: ${p.name} (${p.reason})`);
      });
    }

    if (status.unregistered > 0) {
      console.log(`\n  ${colors.yellow}Unregistered Processes:${colors.reset}`);
      status.details.unregistered.forEach(p => {
        console.log(`    ${colors.yellow}●${colors.reset} PID ${p.pid}: ${p.pattern}`);
      });
    }

    console.log();
  }

  /**
   * Print health metrics section
   */
  printHealthMetrics() {
    console.log(`${colors.bright}📊 HEALTH METRICS${colors.reset}`);
    console.log('─'.repeat(80));

    const metrics = this.loadMetrics();

    if (!metrics || !metrics.history || metrics.history.length === 0) {
      console.log(`  ${colors.dim}No metrics available yet${colors.reset}\n`);
      return;
    }

    const summary = metrics.summary || {};
    const recent = metrics.history.slice(-10);

    console.log(`  Total Checks:    ${summary.totalChecks || 0}`);
    console.log(`  Total Failures:  ${summary.totalFailures || 0}`);
    console.log(`  Total Restarts:  ${summary.totalRestarts || 0}`);
    console.log(`  Avg Response:    ${(summary.avgResponseTime || 0).toFixed(0)}ms`);
    console.log(`  Max Memory:      ${this.formatBytes(summary.maxMemory)}`);
    console.log(`  Max CPU:         ${(summary.maxCpu || 0).toFixed(1)}%`);

    if (recent.length > 0) {
      console.log(`\n  ${colors.dim}Recent Response Times (last 10 checks):${colors.reset}`);
      recent.forEach((sample, i) => {
        const time = sample.responseTime || 0;
        const status = sample.healthy ? colors.green + '✓' : colors.red + '✗';
        const bar = this.drawBar(Math.min(time, 1000), 1000, 15);
        console.log(`    ${status}${colors.reset} ${bar} ${time.toFixed(0)}ms`);
      });
    }

    console.log();
  }

  /**
   * Print recent logs section
   */
  printRecentLogs() {
    console.log(`${colors.bright}📜 RECENT LOGS${colors.reset}`);
    console.log('─'.repeat(80));

    const logs = this.getRecentLogs(5);

    if (logs.length === 0) {
      console.log(`  ${colors.dim}No logs available${colors.reset}\n`);
      return;
    }

    logs.forEach(log => {
      const levelColors = {
        info: colors.cyan,
        warn: colors.yellow,
        error: colors.red,
        success: colors.green
      };

      const levelColor = levelColors[log.level] || colors.white;
      const time = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '?';

      console.log(`  ${colors.dim}[${time}]${colors.reset} ${levelColor}${log.level?.toUpperCase() || 'LOG'}${colors.reset} ${log.message}`);
    });

    console.log();
  }

  /**
   * Print actions section
   */
  printActions() {
    console.log(`${colors.bright}⚡ QUICK ACTIONS${colors.reset}`);
    console.log('─'.repeat(80));
    console.log(`  ${colors.cyan}npm run dev:status${colors.reset}       - Refresh this dashboard`);
    console.log(`  ${colors.cyan}npm run dev:cleanup${colors.reset}     - Clean up all processes`);
    console.log(`  ${colors.cyan}npm run dev:emergency${colors.reset}   - Emergency nuclear cleanup`);
    console.log(`  ${colors.cyan}npm run dev:logs${colors.reset}        - View full health monitor logs`);
    console.log();
  }

  /**
   * Print footer
   */
  printFooter() {
    const line = '═'.repeat(80);
    const now = new Date().toLocaleString();
    console.log(`${colors.dim}${line}${colors.reset}`);
    console.log(`${colors.dim}  Last updated: ${now}${colors.reset}`);
    console.log(`${colors.dim}${line}${colors.reset}`);
  }

  /**
   * Display full dashboard
   */
  async display() {
    // Clear screen
    console.clear();

    this.printHeader();
    await this.printServerStatus();
    this.printProcessRegistry();
    this.printHealthMetrics();
    this.printRecentLogs();
    this.printActions();
    this.printFooter();
  }

  /**
   * Watch mode - refresh every N seconds
   */
  async watch(interval = 5) {
    console.log(`${colors.bright}Starting dashboard in watch mode (refresh every ${interval}s)...${colors.reset}`);
    console.log(`${colors.dim}Press Ctrl+C to exit${colors.reset}\n`);

    await this.display();

    setInterval(async () => {
      await this.display();
    }, interval * 1000);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const dashboard = new DevDashboard();

  if (command === 'watch') {
    const interval = parseInt(args[1]) || 5;
    dashboard.watch(interval).catch(err => {
      console.error('Dashboard error:', err);
      process.exit(1);
    });
  } else {
    // Single display
    dashboard.display().then(() => {
      process.exit(0);
    }).catch(err => {
      console.error('Dashboard error:', err);
      process.exit(1);
    });
  }
}

module.exports = DevDashboard;
