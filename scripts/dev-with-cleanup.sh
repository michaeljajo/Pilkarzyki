#!/bin/bash

# Graceful dev server wrapper with cleanup on exit
# Ensures ALL processes are killed when you Ctrl+C

echo "🚀 Starting Next.js dev server with auto-cleanup..."

# Store the main process PID
MAIN_PID=$$

# Cleanup function
cleanup() {
  echo ""
  echo "🛑 Shutting down gracefully..."

  # Kill all child processes of this script
  pkill -P $MAIN_PID 2>/dev/null || true

  # Run aggressive cleanup
  bash "$(dirname "$0")/kill-next-aggressive.sh" 2>/dev/null || true

  echo "✅ Cleanup complete"
  exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Run auto-cleanup first
node "$(dirname "$0")/auto-cleanup.js"

# Start Next.js dev server
next dev --turbo &
DEV_PID=$!

# Wait for dev server to exit
wait $DEV_PID

# If we get here, dev server exited on its own
cleanup
