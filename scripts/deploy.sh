#!/bin/bash
# Deploy script for Cross-Border Trend Hunter
# Called after daily generation to push to GitHub
# Vercel auto-deploys from the connected GitHub repo

set -e

REPO_URL="${GITHUB_REPO_URL:-}"  # Set via env or hardcode
SITE_DIR="$(cd "$(dirname "$0")/../site" && pwd)"
DATA_DIR="$(cd "$(dirname "$0")/../data" && pwd)"
TMP_DIR="$(cd "$(dirname "$0")/../.deploy-tmp" && pwd 2>/dev/null || mktemp -d)"

if [ -z "$REPO_URL" ]; then
  echo "❌ GITHUB_REPO_URL not set. Usage: GITHUB_REPO_URL=git@github.com:user/repo.git ./deploy.sh"
  exit 1
fi

echo "🚀 Deploying to GitHub..."

# Clone fresh
rm -rf "$TMP_DIR"
git clone "$REPO_URL" "$TMP_DIR" --depth 1

# Sync site files (preserve .git)
rsync -av --delete --exclude='.git' "$SITE_DIR/" "$TMP_DIR/"

# Sync data files
mkdir -p "$TMP_DIR/data"
rsync -av --delete "$DATA_DIR/" "$TMP_DIR/data/"

# Commit & push
cd "$TMP_DIR"
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
