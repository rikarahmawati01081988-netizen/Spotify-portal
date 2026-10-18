#!/data/data/com.termux/files/usr/bin/sh

set -e

cd ~/wa-bot

RELEASE="$1"

if [ -z "$RELEASE" ] || [ ! -f "$RELEASE/bot.js" ]; then
  echo "❌ Release tidak ditemukan."
  echo "Contoh: ./deploy-release.sh release-20261006-123103"
  exit 1
fi

VERSION=$(date +%Y%m%d-%H%M%S)

echo "🔍 Mengecek release..."
node --check "$RELEASE/bot.js"

echo "💾 Backup production..."
cp bot.js "bot.before-deploy-$VERSION.js"

echo "🚀 Deploying $RELEASE..."
cp "$RELEASE/bot.js" bot.js

if node --check bot.js; then
  echo "✅ DEPLOY BERHASIL"
  echo "📦 Release: $RELEASE"
  echo "🟢 PM2 BELUM direstart."
else
  echo "❌ Production gagal check."
  cp "bot.before-deploy-$VERSION.js" bot.js
  echo "↩️ Production dikembalikan otomatis."
  exit 1
fi

cp bot.js "bot.backup-after-deploy-$VERSION.js"
