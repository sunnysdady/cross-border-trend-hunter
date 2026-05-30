#!/bin/bash
# Deploy script for Cross-Border Trend Hunter (Boom Catcher)
# Commits the current repo state and pushes to GitHub.
# Vercel auto-deploys from the connected GitHub repo (repo root).
#
# Usage (from anywhere inside the repo):
#   ./scripts/deploy.sh
# It auto-detects the repo root (the folder this script's parent lives in).

set -e

# Repo root = parent of the scripts/ directory this file lives in
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

echo "🚀 Deploying Boom Catcher from: $REPO_DIR"

if [ ! -d .git ]; then
  echo "❌ $REPO_DIR is not a git repository. Run 'git init' and add your remote first."
  exit 1
fi

# Pull latest to avoid push conflicts (ignore failure on first run)
git pull origin main --rebase -q 2>/dev/null || true

git add -A

if git diff --staged --quiet; then
  echo "📭 No changes to deploy."
  exit 0
fi

git config user.name "Claude (Cowork)"
git config user.email "cowork@anthropic.com"
git commit -m "📦 Daily trend update: $(date +%Y-%m-%d)"
git push origin main

echo "✅ Deployed! Vercel will auto-deploy from main."
