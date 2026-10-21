#!/usr/bin/env bash
# SparkMind AI - GitHub Push Script
# Target Repository: https://github.com/MANOJKOMATI1227/SPARKMIND-AI.git

set -e

REPO_URL="https://github.com/MANOJKOMATI1227/SPARKMIND-AI.git"

echo "=========================================="
echo "🚀 SparkMind AI -> GitHub Deployment"
echo "Repository: $REPO_URL"
echo "Branch: main"
echo "=========================================="

# Ensure origin remote is configured
git remote set-url origin "$REPO_URL" 2>/dev/null || git remote add origin "$REPO_URL"

if [ -n "$GITHUB_TOKEN" ]; then
  echo "Using GITHUB_TOKEN from environment..."
  git push "https://${GITHUB_TOKEN}@github.com/MANOJKOMATI1227/SPARKMIND-AI.git" main --force
  echo "✅ Successfully pushed to GitHub!"
  exit 0
fi

echo ""
echo "To push with your GitHub Personal Access Token directly, run:"
echo "  GITHUB_TOKEN=\"your_token_here\" ./push_to_github.sh"
echo ""
echo "Or push using standard git:"
echo "  git push -u origin main"
echo ""
