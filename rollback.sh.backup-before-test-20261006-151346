#!/data/data/com.termux/files/usr/bin/sh

set -e

cd ~/wa-bot

if [ ! -f bot.production.v1.js ]; then
  echo "❌ Backup production tidak ditemukan"
  exit 1
fi

cp bot.js bot.before-rollback-$(date +%Y%m%d-%H%M%S).js
cp bot.production.v1.js bot.js

node --check bot.js

echo "✅ ROLLBACK BERHASIL"
echo "Production kembali ke v1"
