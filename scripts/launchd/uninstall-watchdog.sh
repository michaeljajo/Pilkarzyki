#!/bin/bash

###############################################################################
# Uninstall macOS launchd watchdog
###############################################################################

set -e

echo "🗑️  Uninstalling macOS launchd watchdog"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PLIST_FILE="com.pilkarzyki.dev-cleanup.plist"
LAUNCHD_DIR="$HOME/Library/LaunchAgents"
DEST_PATH="$LAUNCHD_DIR/$PLIST_FILE"

if [ ! -f "$DEST_PATH" ]; then
    echo "⚠️  Watchdog not installed (plist file not found)"
    exit 0
fi

# Unload the service
if launchctl list | grep -q "com.pilkarzyki.dev-cleanup"; then
    echo "  🔄 Unloading service..."
    launchctl unload "$DEST_PATH" 2>/dev/null || true
fi

# Remove plist file
echo "  🗑️  Removing plist file..."
rm -f "$DEST_PATH"

# Verify it's gone
if launchctl list | grep -q "com.pilkarzyki.dev-cleanup"; then
    echo ""
    echo "⚠️  Warning: Service still appears in launchctl list"
    echo "Try: launchctl remove com.pilkarzyki.dev-cleanup"
else
    echo ""
    echo "✅ Watchdog uninstalled successfully!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
