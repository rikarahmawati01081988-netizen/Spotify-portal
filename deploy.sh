#!/data/data/com.termux/files/usr/bin/sh

set -e

cd ~/wa-bot

VERSION=$(date +%Y%m%d-%H%M%S)
RELEASE="release-$VERSION"

echo "🔍 Cek development..."
node --check bot.development.js

echo "📦 Membuat release: $RELEASE"
mkdir -p "$RELEASE"
cp bot.development.js "$RELEASE/bot.js"

echo "🔍 Cek release..."
node --check "$RELEASE/bot.js"

echo "💾 Membuat backup production..."
cp bot.js "bot.production-backup-$VERSION.js"

echo ""
echo "✅ RELEASE SIAP"
echo "📦 $RELEASE"
echo "🟢 Customer BELUM diubah."
echo "⚠️ Jangan restart PM2."
