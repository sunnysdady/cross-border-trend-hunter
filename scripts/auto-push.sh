#!/bin/bash
REPO_DIR="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Obsidian/sunnysdady/10 Projects/boom-catcher"
LOCK_FILE="/tmp/boom-catcher-push.lock"
cd "$REPO_DIR" || exit 1
[ -f "$LOCK_FILE" ] && exit 0
touch "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT
git pull origin main --rebase -q 2>/dev/null
git diff --quiet && git diff --staged --quiet && exit 0
git add -A
git commit -m "🤖 自动更新: $(date '+%Y-%m-%d %H:%M')" 2>/dev/null
git push origin main && echo "[$(date)] ✅ Boom Catcher synced" >> /tmp/boom-catcher-push.log
