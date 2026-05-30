#!/bin/bash
# Boom Catcher — hourly auto-sync to GitHub.
# Self-locating: works no matter which user account or folder the repo lives in.
# NOTE: this only PUSHES already-generated files. Daily report *generation*
# is done by the Cowork scheduled task (see scripts/README-automation.md).

# Repo root = parent of the scripts/ dir this file lives in
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOCK_FILE="/tmp/boom-catcher-push.lock"

cd "$REPO_DIR" || exit 1
[ -d .git ] || exit 1                      # not a git repo, nothing to do
[ -f "$LOCK_FILE" ] && exit 0              # another run in progress
touch "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

git pull origin main --rebase -q 2>/dev/null
git diff --quiet && git diff --staged --quiet && exit 0   # no changes
git add -A
git commit -m "🤖 自动同步: $(date '+%Y-%m-%d %H:%M')" 2>/dev/null
git push origin main && echo "[$(date)] ✅ Boom Catcher synced" >> /tmp/boom-catcher-push.log
