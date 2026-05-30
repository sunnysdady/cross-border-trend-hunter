#!/bin/bash
# One-shot installer for the hourly auto-sync launchd job.
# Fixes the old hardcoded "/Users/mac" path by generating the plist
# with YOUR real home folder automatically.
#
# Run once:
#   bash scripts/install-launchd.sh
# To remove later:
#   launchctl unload ~/Library/LaunchAgents/com.boomcatcher.autopush.plist

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PUSH_SCRIPT="$SCRIPT_DIR/auto-push.sh"
PLIST_DST="$HOME/Library/LaunchAgents/com.boomcatcher.autopush.plist"

chmod +x "$PUSH_SCRIPT"
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST_DST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.boomcatcher.autopush</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${PUSH_SCRIPT}</string>
    </array>
    <key>StartInterval</key>
    <integer>3600</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/boom-catcher-push.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/boom-catcher-push.err</string>
</dict>
</plist>
EOF

# Reload
launchctl unload "$PLIST_DST" 2>/dev/null || true
launchctl load "$PLIST_DST"

echo "✅ Installed. Auto-sync runs hourly."
echo "   Script: $PUSH_SCRIPT"
echo "   Plist:  $PLIST_DST"
echo "   Log:    /tmp/boom-catcher-push.log"
