#!/usr/bin/env node

/**
 * Enhanced Health Monitor V2
 * Advanced monitoring with memory leak detection, CPU tracking, and self-healing
 */

const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ProcessManager = require('./process-manager');

const DEV_SERVER_DIR = path.join(process.cwd(), '.dev-server');
const LOGS_DIR = path.join(DEV_SERVER_DIR, 'logs');
const HEALTH_LOG = path.join(LOGS_DIR, 'health-monitor.log');
const METRICS_FILE = path.join(DEV_SERVER_DIR, 'metrics.json');
const MONITOR_PID_FILE = path.join(DEV_SERVER_DIR, 'health-monitor.pid');

// Configuration
const CONFIG = {
  port: 3000,
  checkInterval: 30000,        // Check every 30 seconds
  timeout: 10000,              // 10 second timeout
  maxFailures: 2,              // Restart after 2 consecutive failures
  memoryLeakThreshold: 0.3,    // 30% memory growth triggers warning
  memoryLeakWindow: 10,        // Check memory growth over 10 samples
  cpuSpikeThreshold: 80,       // CPU > 80% is a spike
  cpuSpikeWindow: 3,           // 3 consecutive spikes triggers action
  responseTimeThreshold: 5000, // Response time > 5s is slow
  slowResponseWindow: 3,       // 3 consecutive slow responses triggers action
  maxLogSize: 10 * 1024 * 1024, // 10MB max log size
  healthEndpoints: [           // Multiple endpoints to check
    '/',
    '/api/health',
  ]
};

class HealthMonitor {
  constructor() {
    this.processManager = new ProcessManager();
    this.consecutiveFailures = 0;
    this.isRestarting = false;
    this.metrics = this.loadMetrics();
    this.cpuSpikes = 0;
    this.slowResponses = 0;
    this.setupSignalHandlers();
    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    [DEV_SERVER_DIR, LOGS_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Load historical metrics
   */
  loadMetrics() {
    if (!fs.existsSync(METRICS_FILE)) {
      return {
        history: [],
        summary: {
          totalChecks: 0,
          totalFailures: 0,
          totalRestarts: 0,
          avgResponseTime: 0,
          maxMemory: 0,
          maxCpu: 0
        }
      };
    }

    try {
      return JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
    } catch (e) {
      return { history: [], summary: {} };
    }
  }

  /**
   * Save metrics to disk
   */
  saveMetrics() {
    try {
      // Keep only last 1000 samples in history
      if (this.metrics.history.length > 1000) {
        this.metrics.history = this.metrics.history.slice(-1000);
      }

      fs.writeFileSync(METRICS_FILE, JSON.stringify(this.metrics, null, 2));
    } catch (e) {
      this.log('error', 'Failed to save metrics', { error: e.message });
    }
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  setupSignalHandlers() {
    const cleanup = () => {
      this.log('info', 'Health monitor stopping...');
      try {
        if (fs.existsSync(MONITOR_PID_FILE)) {
          fs.unlinkSync(MONITOR_PID_FILE);
        }
      } catch (e) {
        // Ignore
      }
      this.saveMetrics();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('uncaughtException', (err) => {
      this.log('error', 'Uncaught exception in monitor', { error: err.message, stack: err.stack });
      cleanup();
    });
  }

  /**
   * Structured logging with rotation
   */
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };

    // Console output
    const prefix = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅'
    }[level] || '•';

    console.log(`${prefix} [${timestamp}] ${message}`, data.details ? JSON.stringify(data.details) : '');

    // File logging
    try {
      // Check log size and rotate if needed
      if (fs.existsSync(HEALTH_LOG)) {
        const stats = fs.statSync(HEALTH_LOG);
        if (stats.size > CONFIG.maxLogSize) {
          const backup = path.join(LOGS_DIR, `health-monitor.${Date.now()}.log`);
          fs.renameSync(HEALTH_LOG, backup);
          this.log('info', 'Log rotated', { backup });
        }
      }

      fs.appendFileSync(HEALTH_LOG, JSON.stringify(logEntry) + '\n');
    } catch (e) {
      console.error('Failed to write log:', e.message);
    }
  }

  /**
   * Check server health on a specific endpoint
   */
  async checkEndpoint(endpoint) {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const req = http.request(
        {
          hostname: 'localhost',
          port: CONFIG.port,
          path: endpoint,
          method: 'GET',
          timeout: CONFIG.timeout
        },
        (res) => {
          const responseTime = Date.now() - startTime;

          // Any 2xx or 3xx response is considered healthy
          // 404 is also OK - it means server is responding
          const healthy = res.statusCode < 500;

          resolve({
            healthy,
            endpoint,
            responseTime,
            statusCode: res.statusCode
          });

          res.resume(); // Drain response
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve({
          healthy: false,
          endpoint,
          responseTime: CONFIG.timeout,
          error: 'Timeout'
        });
      });

      req.on('error', (err) => {
        resolve({
          healthy: false,
          endpoint,
          responseTime: Date.now() - startTime,
          error: err.message
        });
      });

      req.end();
    });
  }

  /**
   * Check all configured health endpoints
   */
  async checkHealth() {
    const results = await Promise.all(
      CONFIG.healthEndpoints.map(endpoint => this.checkEndpoint(endpoint))
    );

    // Server is healthy if at least one endpoint responds
    const healthy = results.some(r => r.healthy);
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    return {
      healthy,
      results,
      avgResponseTime
    };
  }

  /**
   * Get process metrics (memory, CPU)
   */
  getProcessMetrics() {
    try {
      // Find Next.js dev server process
      const output = execSync(
        `ps aux | grep "next dev" | grep -v grep | head -1`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      ).trim();

      if (!output) {
        return null;
      }

      // Parse ps output: USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND
      const parts = output.split(/\s+/);
      const cpu = parseFloat(parts[2]);
      const memory = parseFloat(parts[3]);
      const rss = parseInt(parts[5]); // RSS in KB

      return { cpu, memory, rss };
    } catch (e) {
      return null;
    }
  }

  /**
   * Detect memory leaks
   */
  detectMemoryLeak() {
    if (this.metrics.history.length < CONFIG.memoryLeakWindow) {
      return { leak: false };
    }

    const recentSamples = this.metrics.history.slice(-CONFIG.memoryLeakWindow);
    const firstRss = recentSamples[0].rss;
    const lastRss = recentSamples[recentSamples.length - 1].rss;

    if (!firstRss || !lastRss) {
      return { leak: false };
    }

    const growth = (lastRss - firstRss) / firstRss;

    if (growth > CONFIG.memoryLeakThreshold) {
      return {
        leak: true,
        growth: (growth * 100).toFixed(2) + '%',
        firstRss: `${(firstRss / 1024).toFixed(2)}MB`,
        lastRss: `${(lastRss / 1024).toFixed(2)}MB`
      };
    }

    return { leak: false };
  }

  /**
   * Detect CPU spikes
   */
  detectCpuSpike(processMetrics) {
    if (!processMetrics || processMetrics.cpu === undefined) {
      this.cpuSpikes = 0;
      return { spike: false };
    }

    if (processMetrics.cpu > CONFIG.cpuSpikeThreshold) {
      this.cpuSpikes++;

      if (this.cpuSpikes >= CONFIG.cpuSpikeWindow) {
        return {
          spike: true,
          cpu: processMetrics.cpu,
          consecutiveSpikes: this.cpuSpikes
        };
      }
    } else {
      this.cpuSpikes = 0;
    }

    return { spike: false };
  }

  /**
   * Detect slow responses
   */
  detectSlowResponse(responseTime) {
    if (responseTime > CONFIG.responseTimeThreshold) {
      this.slowResponses++;

      if (this.slowResponses >= CONFIG.slowResponseWindow) {
        return {
          slow: true,
          responseTime,
          consecutiveSlow: this.slowResponses
        };
      }
    } else {
      this.slowResponses = 0;
    }

    return { slow: false };
  }

  /**
   * Restart the dev server
   */
  async restartServer(reason) {
    if (this.isRestarting) {
      this.log('warn', 'Restart already in progress');
      return;
    }

    this.isRestarting = true;
    this.log('warn', `Restarting server: ${reason}`);

    try {
      // Use process manager for comprehensive cleanup
      await this.processManager.comprehensiveCleanup();

      // Wait for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Start fresh server
      this.log('info', 'Starting fresh server...');
      execSync('npm run dev &', {
        stdio: 'ignore',
        detached: true,
        shell: true
      });

      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Reset counters
      this.consecutiveFailures = 0;
      this.cpuSpikes = 0;
      this.slowResponses = 0;

      this.metrics.summary.totalRestarts = (this.metrics.summary.totalRestarts || 0) + 1;
      this.saveMetrics();

      this.log('success', 'Server restarted successfully');
    } catch (error) {
      this.log('error', 'Restart failed', { error: error.message });
    } finally {
      this.isRestarting = false;
    }
  }

  /**
   * Main monitoring loop
   */
  async monitor() {
    try {
      // Get process metrics
      const processMetrics = this.getProcessMetrics();

      // Check health endpoints
      const healthCheck = await this.checkHealth();

      // Record metrics
      const sample = {
        timestamp: Date.now(),
        healthy: healthCheck.healthy,
        responseTime: healthCheck.avgResponseTime,
        cpu: processMetrics?.cpu,
        memory: processMetrics?.memory,
        rss: processMetrics?.rss,
        endpoints: healthCheck.results
      };

      this.metrics.history.push(sample);
      this.metrics.summary.totalChecks = (this.metrics.summary.totalChecks || 0) + 1;

      // Update summary statistics
      if (sample.responseTime) {
        const total = this.metrics.summary.totalChecks;
        const prevAvg = this.metrics.summary.avgResponseTime || 0;
        this.metrics.summary.avgResponseTime = ((prevAvg * (total - 1)) + sample.responseTime) / total;
      }

      if (processMetrics) {
        this.metrics.summary.maxMemory = Math.max(this.metrics.summary.maxMemory || 0, processMetrics.rss);
        this.metrics.summary.maxCpu = Math.max(this.metrics.summary.maxCpu || 0, processMetrics.cpu);
      }

      // Check for issues
      if (healthCheck.healthy) {
        if (this.consecutiveFailures > 0) {
          this.log('success', 'Server recovered');
        }
        this.consecutiveFailures = 0;

        // Check for performance issues
        const memoryLeak = this.detectMemoryLeak();
        if (memoryLeak.leak) {
          this.log('warn', 'Memory leak detected', { details: memoryLeak });
          await this.restartServer(`Memory leak: ${memoryLeak.growth} growth`);
          return;
        }

        const cpuSpike = this.detectCpuSpike(processMetrics);
        if (cpuSpike.spike) {
          this.log('warn', 'Sustained CPU spike detected', { details: cpuSpike });
          await this.restartServer(`CPU spike: ${cpuSpike.cpu}% sustained`);
          return;
        }

        const slowResponse = this.detectSlowResponse(healthCheck.avgResponseTime);
        if (slowResponse.slow) {
          this.log('warn', 'Sustained slow responses detected', { details: slowResponse });
          await this.restartServer(`Slow responses: ${slowResponse.responseTime}ms avg`);
          return;
        }

      } else {
        // Health check failed
        this.consecutiveFailures++;
        this.metrics.summary.totalFailures = (this.metrics.summary.totalFailures || 0) + 1;

        this.log('warn', `Health check failed (${this.consecutiveFailures}/${CONFIG.maxFailures})`, {
          details: healthCheck.results
        });

        if (this.consecutiveFailures >= CONFIG.maxFailures) {
          await this.restartServer('Consecutive health check failures');
        }
      }

      // Save metrics periodically
      if (this.metrics.history.length % 10 === 0) {
        this.saveMetrics();
      }

    } catch (error) {
      this.log('error', 'Monitor check failed', { error: error.message, stack: error.stack });
    }
  }

  /**
   * Start monitoring
   */
  start() {
    // Write PID file
    fs.writeFileSync(MONITOR_PID_FILE, process.pid.toString());

    this.log('info', 'Health Monitor V2 started', {
      details: {
        port: CONFIG.port,
        checkInterval: CONFIG.checkInterval + 'ms',
        endpoints: CONFIG.healthEndpoints
      }
    });

    // Initial check after 10 seconds
    setTimeout(() => this.monitor(), 10000);

    // Regular monitoring
    setInterval(() => this.monitor(), CONFIG.checkInterval);
  }
}

// Start monitor
if (require.main === module) {
  const monitor = new HealthMonitor();
  monitor.start();
}

module.exports = HealthMonitor;
