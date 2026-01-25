#!/bin/bash

###############################################################################
# EMERGENCY CLEANUP - Nuclear option for dev server issues
# This script is designed to work even when:
# - All node processes are frozen
# - Process manager is corrupted
# - File system is locked
# - System is under extreme load
###############################################################################

set -e  # Exit on error

echo "☢️  EMERGENCY CLEANUP INITIATED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

KILLED_ANYTHING=0
PROJECT_DIR=$(pwd)
DEV_SERVER_DIR=".dev-server"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

###############################################################################
# 1. KILL ALL NODE PROCESSES (NUCLEAR)
###############################################################################

echo ""
echo "🔪 Phase 1: Killing all Node.js processes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Kill by specific patterns first (most aggressive)
PATTERNS=(
    "next-server"
    "next dev"
    "next build"
    "@next/swc"
    "turbopack"
    "postcss"
    "tsx"
    "webpack"
    "babel"
    "eslint"
    "node.*$PROJECT_DIR"
    "health-monitor"
    "process-manager"
    "auto-cleanup"
)

for pattern in "${PATTERNS[@]}"; do
    PIDS=$(pgrep -f "$pattern" 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        echo "$PIDS" | while read -r pid; do
            if [ -n "$pid" ]; then
                log_info "Killing $pattern (PID: $pid)"
                kill -9 "$pid" 2>/dev/null || true
                KILLED_ANYTHING=1
            fi
        done
    fi
done

# Kill all processes with project directory in their command
log_warn "Scanning for orphaned node processes in project..."
ps aux | grep node | grep "$PROJECT_DIR" | grep -v grep | grep -v "emergency-cleanup" | awk '{print $2}' | while read -r pid; do
    if [ -n "$pid" ]; then
        CMD=$(ps -o command= -p "$pid" 2>/dev/null || echo "unknown")
        log_info "Killing orphaned: $pid ($CMD)"
        kill -9 "$pid" 2>/dev/null || true
        KILLED_ANYTHING=1
    fi
done

###############################################################################
# 2. FREE ALL PORTS
###############################################################################

echo ""
echo "🔌 Phase 2: Freeing ports 3000-3020"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for port in {3000..3020}; do
    PIDS=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        echo "$PIDS" | while read -r pid; do
            if [ -n "$pid" ]; then
                CMD=$(ps -o command= -p "$pid" 2>/dev/null || echo "unknown")
                log_info "Freeing port $port (PID: $pid, $CMD)"
                kill -9 "$pid" 2>/dev/null || true
                KILLED_ANYTHING=1
            fi
        done
    fi
done

###############################################################################
# 3. CLEAN FILE SYSTEM
###############################################################################

echo ""
echo "🗑️  Phase 3: Cleaning file system"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait for processes to fully die
sleep 2

# Remove .next directory with extreme prejudice
if [ -d ".next" ]; then
    log_info "Removing .next directory..."
    # First try normal removal
    rm -rf .next 2>/dev/null || {
        # If that fails, try to unmount if it's mounted (rare edge case)
        log_warn ".next removal failed, attempting force removal..."
        sudo rm -rf .next 2>/dev/null || {
            log_error ".next removal failed completely - manual intervention required"
        }
    }
    if [ ! -d ".next" ]; then
        log_info ".next directory removed successfully"
        KILLED_ANYTHING=1
    fi
fi

# Remove node_modules cache
if [ -d "node_modules/.cache" ]; then
    log_info "Removing node_modules/.cache..."
    rm -rf node_modules/.cache 2>/dev/null || log_warn "Cache removal failed"
    KILLED_ANYTHING=1
fi

# Clean .dev-server directory but preserve structure
if [ -d "$DEV_SERVER_DIR" ]; then
    log_info "Cleaning .dev-server state..."

    # Remove PID files
    rm -rf "$DEV_SERVER_DIR/pids"/* 2>/dev/null || true

    # Force release locks
    rm -rf "$DEV_SERVER_DIR/locks"/* 2>/dev/null || true

    # Archive old logs
    if [ -d "$DEV_SERVER_DIR/logs" ]; then
        TIMESTAMP=$(date +%s)
        ARCHIVE_DIR="$DEV_SERVER_DIR/logs/archive-$TIMESTAMP"
        mkdir -p "$ARCHIVE_DIR"
        mv "$DEV_SERVER_DIR/logs"/*.log "$ARCHIVE_DIR/" 2>/dev/null || true
        log_info "Logs archived to $ARCHIVE_DIR"
    fi

    # Clear process registry
    if [ -f "$DEV_SERVER_DIR/process-registry.json" ]; then
        echo '{"processes":{},"ports":{},"createdAt":'$(date +%s)000',"lastUpdated":'$(date +%s)000'}' > "$DEV_SERVER_DIR/process-registry.json"
        log_info "Process registry reset"
    fi

    KILLED_ANYTHING=1
fi

# Remove any stray lock files
find . -name "*.lock" -path "*/.next/*" -delete 2>/dev/null || true
find . -name ".dev-server-lock" -delete 2>/dev/null || true

# Remove temporary files
rm -f /tmp/next-*.sock 2>/dev/null || true

###############################################################################
# 4. VERIFY CLEANUP
###############################################################################

echo ""
echo "🔍 Phase 4: Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait for everything to settle
sleep 1

# Check if port 3000 is free
if lsof -ti:3000 >/dev/null 2>&1; then
    log_error "Port 3000 is still in use!"
    REMAINING=$(lsof -ti:3000)
    log_error "Remaining PIDs on port 3000: $REMAINING"

    # One final nuclear attempt
    log_warn "Attempting final force kill..."
    echo "$REMAINING" | xargs kill -9 2>/dev/null || true
    sleep 1

    if lsof -ti:3000 >/dev/null 2>&1; then
        log_error "FAILED - Port 3000 still occupied. Manual intervention required."
        exit 1
    else
        log_info "Port 3000 is now free"
    fi
else
    log_info "Port 3000 is free"
fi

# Check for remaining Next.js processes
if pgrep -f "next" >/dev/null 2>&1; then
    log_warn "Some Next.js processes still running"
    pgrep -f "next" | while read -r pid; do
        CMD=$(ps -o command= -p "$pid" 2>/dev/null || echo "unknown")
        log_warn "  Remaining: $pid ($CMD)"
    done
else
    log_info "No Next.js processes running"
fi

# Check .next directory
if [ -d ".next" ]; then
    log_warn ".next directory still exists"
else
    log_info ".next directory removed"
fi

###############################################################################
# 5. SUMMARY
###############################################################################

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $KILLED_ANYTHING -eq 1 ]; then
    log_info "EMERGENCY CLEANUP COMPLETE"
    echo ""
    echo "System is clean. You can now run:"
    echo "  npm run dev"
    echo ""
    exit 0
else
    log_info "System was already clean - no cleanup needed"
    echo ""
    exit 0
fi
