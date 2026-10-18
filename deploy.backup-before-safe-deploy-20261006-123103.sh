#!/data/data/com.termux/files/usr/bin/sh

set -e

cd ~/wa-bot

echo "🔍 Mengecek development..."
node --check bot.development.js

echo "💾 Membuat backup production..."
cp bot.js bot.production-backup-$(date +%Y%m%d-%H%M%S).js

echo "🚀 Deploy development → production..."
cp bot.development.js bot.js

echo "🔍 Mengecek production..."
node --check bot.js

echo "✅ DEPLOY BERHASIL"
echo "⚠️ PM2 belum direstart."
echo "Gunakan PM2 setelah kita memastikan hasil deploy aman."
