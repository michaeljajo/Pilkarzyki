#!/bin/bash

###############################################################################
# Install macOS launchd watchdog for dev server cleanup
# This provides system-level guarantees for process cleanup
###############################################################################

set -e

echo "🔧 Installing macOS launchd watchdog"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get project directory and current user
PROJECT_DIR=$(pwd)
CURRENT_USER=$(whoami)
PLIST_FILE="com.pilkarzyki.dev-cleanup.plist"
TEMPLATE_PATH="scripts/launchd/$PLIST_FILE"
LAUNCHD_DIR="$HOME/Library/LaunchAgents"
DEST_PATH="$LAUNCHD_DIR/$PLIST_FILE"

# Check if template exists
if [ ! -f "$TEMPLATE_PATH" ]; then
    echo "❌ Error: Template file not found: $TEMPLATE_PATH"
    exit 1
fi

# Create LaunchAgents directory if it doesn't exist
mkdir -p "$LAUNCHD_DIR"

# Create .dev-server/logs directory
mkdir -p "$PROJECT_DIR/.dev-server/logs"

# Replace placeholders in template
echo "  📝 Configuring plist file..."
cat "$TEMPLATE_PATH" | \
    sed "s|REPLACE_WITH_PROJECT_DIR|$PROJECT_DIR|g" | \
    sed "s|REPLACE_WITH_USERNAME|$CURRENT_USER|g" > "$DEST_PATH"

echo "  ✓ Created: $DEST_PATH"

# Unload existing service if running
if launchctl list | grep -q "com.pilkarzyki.dev-cleanup"; then
    echo "  🔄 Unloading existing service..."
    launchctl unload "$DEST_PATH" 2>/dev/null || true
fi

# Load the service
echo "  🚀 Loading service..."
launchctl load "$DEST_PATH"

# Verify it's loaded
if launchctl list | grep -q "com.pilkarzyki.dev-cleanup"; then
    echo ""
    echo "✅ Watchdog installed successfully!"
    echo ""
    echo "The system will now:"
    echo "  • Run cleanup on boot (clears stale processes from crashes)"
    echo "  • Ensure no orphaned Next.js processes survive system restarts"
    echo ""
    echo "To manage the watchdog:"
    echo "  • Check status:  launchctl list | grep pilkarzyki"
    echo "  • View logs:     cat .dev-server/logs/launchd-cleanup.log"
    echo "  • Uninstall:     bash scripts/launchd/uninstall-watchdog.sh"
    echo ""
else
    echo ""
    echo "⚠️  Warning: Service loaded but not visible in launchctl list"
    echo "This is normal - it will run on next boot"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Installation complete!"
