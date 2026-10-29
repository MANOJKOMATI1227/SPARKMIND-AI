#!/usr/bin/env bash
# SparkMind AI - GitHub Sync & Push Script
# Target Repository: https://github.com/MANOJKOMATI1227/SPARKMIND-AI.git

set -e

REPO_NAME="MANOJKOMATI1227/SPARKMIND-AI.git"
TOKEN="${1:-$GITHUB_TOKEN}"

echo "=========================================="
echo "🚀 SparkMind AI -> GitHub Deployment"
echo "Repository: https://github.com/$REPO_NAME"
echo "Branch: main"
echo "Author: Manoj Komati <komatimanojkumar1227@gmail.com>"
echo "=========================================="

if [ -n "$TOKEN" ]; then
  echo "🔑 Setting up authenticated GitHub remote..."
  git remote set-url origin "https://${TOKEN}@github.com/${REPO_NAME}"
  
  echo "📤 Pushing branch 'main' to GitHub..."
  git push origin main
  
  echo ""
  echo "✅ Successfully synced and pushed to https://github.com/${REPO_NAME}!"
  exit 0
fi

echo "⚠️  No GitHub Personal Access Token provided."
echo ""
echo "Usage options:"
echo "  1) ./push_to_github.sh <YOUR_GITHUB_TOKEN>"
echo "  2) GITHUB_TOKEN=\"<YOUR_GITHUB_TOKEN>\" ./push_to_github.sh"
echo "  3) Provide your GitHub token in the chat prompt, and I will sync and push automatically!"
echo ""
exit 1
