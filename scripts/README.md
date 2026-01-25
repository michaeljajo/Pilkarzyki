# Scripts Directory

This directory contains the Dev Server Management System V2 - a bulletproof 5-layer defense system that prevents all localhost server issues.

## 📚 Quick Reference

### Core V2 Components

| Script | Purpose | Layer |
|--------|---------|-------|
| `lock-manager.js` | Atomic lock management | Layer 1 |
| `process-manager.js` | PID registry & tracking | Layer 2 |
| `health-monitor-v2.js` | Advanced health monitoring | Layer 3 |
| `emergency-cleanup.sh` | Nuclear cleanup script | Layer 4 |
| `launchd/*` | System-level watchdog | Layer 5 |

### Supporting Components

| Script | Purpose |
|--------|---------|
| `dev-dashboard.js` | Real-time status dashboard |
| `auto-cleanup.js` | Pre-flight checks (V2) |
| `kill-next-aggressive.sh` | Legacy aggressive cleanup |
| `dev-health-monitor.js` | Legacy health monitor (V1) |
| `dev-with-cleanup.sh` | Graceful shutdown wrapper |

## 🚀 Usage

### Via npm commands (Recommended)

```bash
# Daily development
npm run dev

# Long sessions with monitoring
npm run dev:monitored

# Check status
npm run dev:status

# Cleanup
npm run dev:cleanup

# Emergency nuclear cleanup
npm run dev:emergency
```

### Direct script execution

```bash
# Lock Manager
node scripts/lock-manager.js acquire
node scripts/lock-manager.js release
node scripts/lock-manager.js info

# Process Manager
node scripts/process-manager.js status
node scripts/process-manager.js list
node scripts/process-manager.js cleanup

# Dashboard
node scripts/dev-dashboard.js
node scripts/dev-dashboard.js watch

# Health Monitor
node scripts/health-monitor-v2.js

# Emergency Cleanup
bash scripts/emergency-cleanup.sh

# Launchd Watchdog
bash scripts/launchd/install-watchdog.sh
bash scripts/launchd/uninstall-watchdog.sh
```

## 🏗️ Architecture

```
Layer 1: Lock Manager
└─> Prevents concurrent cleanup races

Layer 2: Process Manager
└─> Tracks all PIDs with parent-child relationships

Layer 3: Health Monitor V2
└─> Memory leak, CPU spike, and response time monitoring

Layer 4: Emergency Cleanup
└─> Nuclear option that always works

Layer 5: System Watchdog
└─> macOS launchd integration for boot cleanup
```

## 📁 Output Files

All runtime state is stored in `.dev-server/`:

```
.dev-server/
├── logs/
│   ├── health-monitor.log      # Structured JSON logs
│   └── launchd-cleanup.log     # Boot cleanup logs
├── pids/
│   └── *.json                  # Individual process metadata
├── locks/
│   └── cleanup.lock            # Cleanup operation lock
├── process-registry.json       # Central process registry
└── metrics.json                # Health metrics history
```

## 🔧 Maintenance

### Adding a new script

1. Create script in this directory
2. Make it executable: `chmod +x scripts/your-script.sh`
3. Add npm command in `package.json`
4. Document in `DEV_SERVER_GUIDE.md`

### Debugging

```bash
# Check process manager state
node scripts/process-manager.js status

# Check if cleanup is locked
node scripts/lock-manager.js info

# View health metrics
cat .dev-server/metrics.json

# View logs
npm run dev:logs
```

## 📖 Documentation

See `DEV_SERVER_GUIDE.md` for complete documentation including:
- Detailed architecture
- Troubleshooting guide
- Best practices
- Failure scenarios handled
- Performance impact
- Advanced usage

## 🎯 Key Features

✅ **Zero manual intervention** - System self-heals
✅ **Atomic operations** - Lock manager prevents races
✅ **Orphan detection** - PPID verification finds orphaned processes
✅ **Memory leak detection** - Auto-restart on 30% growth
✅ **CPU spike detection** - Auto-restart on sustained high CPU
✅ **Multi-endpoint health** - More reliable than single endpoint
✅ **Real-time dashboard** - Visual process status
✅ **System-level watchdog** - Survives kernel panics
✅ **Emergency recovery** - Nuclear option always works

---

*For questions or issues, see DEV_SERVER_GUIDE.md*
