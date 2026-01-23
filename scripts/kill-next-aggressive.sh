#!/bin/bash

# ULTRA-AGGRESSIVE Next.js cleanup script
# Ensures ALL related processes are killed and cache is cleared

echo "🔥 AGGRESSIVE cleanup starting..."

KILLED=0

# 1. Kill by process name patterns (most specific to least specific)
PATTERNS=(
  "next-server"
  "next dev"
  "next build"
  "@next/swc"
  "turbopack"
  "postcss.js"
  "node.*\.next"
  "node.*next.*dev"
  "auto-cleanup.js"
)

for pattern in "${PATTERNS[@]}"; do
  if pgrep -f "$pattern" > /dev/null 2>&1; then
    echo "  🎯 Killing: $pattern"
    pkill -9 -f "$pattern" 2>/dev/null || true
    sleep 0.5  # Give processes time to die
    KILLED=1
  fi
done

# 2. Kill by ports (3000-3010)
echo "  🔌 Checking ports 3000-3010..."
for port in {3000..3010}; do
  PIDS=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$PIDS" ]; then
    echo "    ✓ Killing port $port: $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
    KILLED=1
  fi
done

# 3. Nuclear option: Kill any orphaned node processes from this project
PROJECT_DIR=$(pwd)
echo "  💣 Scanning for orphaned node processes in: $PROJECT_DIR"

# Find node processes with this project path in their command
ps aux | grep node | grep "$PROJECT_DIR" | grep -v grep | awk '{print $2}' | while read pid; do
  if [ -n "$pid" ]; then
    echo "    ✓ Killing orphaned process: $pid"
    kill -9 "$pid" 2>/dev/null || true
    KILLED=1
  fi
done

# 4. Remove ALL Next.js cache and lock files
echo "  🗑️  Removing cache and lock files..."

if [ -d ".next" ]; then
  rm -rf .next
  echo "    ✓ Removed .next directory"
  KILLED=1
fi

if [ -d "node_modules/.cache" ]; then
  rm -rf node_modules/.cache
  echo "    ✓ Removed node_modules/.cache"
  KILLED=1
fi

# Remove any lingering lock files
find . -name "*.lock" -path "*/.next/*" -delete 2>/dev/null || true

# 5. Wait a moment for everything to settle
sleep 1

# 6. Final verification
REMAINING=$(lsof -ti:3000 2>/dev/null)
if [ -n "$REMAINING" ]; then
  echo "  ⚠️  WARNING: Port 3000 still in use! Force killing..."
  echo "$REMAINING" | xargs kill -9 2>/dev/null || true
  sleep 1
fi

if [ $KILLED -eq 0 ]; then
  echo "✅ System was already clean!"
else
  echo "✅ AGGRESSIVE cleanup complete! All processes terminated."
fi

exit 0
