#!/bin/bash

# Comprehensive Next.js process cleanup script
# Kills all Next.js processes, clears ports, and removes lock files

KILLED=0

echo "🧹 Cleaning up Next.js processes..."

# Kill Next.js processes by name
if pgrep -f "next dev" > /dev/null 2>&1; then
  pkill -9 -f "next dev" 2>/dev/null
  KILLED=1
  echo "  ✓ Killed Next.js dev processes"
fi

# Kill node processes running Next.js
if pgrep -f "node.*\.next" > /dev/null 2>&1; then
  pkill -9 -f "node.*\.next" 2>/dev/null
  KILLED=1
  echo "  ✓ Killed Next.js node processes"
fi

# Kill processes on common Next.js ports (3000-3010)
for port in {3000..3010}; do
  if lsof -ti:$port > /dev/null 2>&1; then
    lsof -ti:$port | xargs kill -9 2>/dev/null
    KILLED=1
    echo "  ✓ Killed process on port $port"
  fi
done

# Remove lock file if it exists
if [ -f ".next/dev/lock" ]; then
  rm -f .next/dev/lock
  echo "  ✓ Removed .next/dev/lock"
  KILLED=1
fi

# Remove entire .next/dev directory to ensure clean state
if [ -d ".next/dev" ]; then
  rm -rf .next/dev
  echo "  ✓ Cleaned .next/dev directory"
  KILLED=1
fi

if [ $KILLED -eq 0 ]; then
  echo "  ✓ No cleanup needed - all clear!"
else
  echo "✅ Cleanup complete!"
fi

exit 0
