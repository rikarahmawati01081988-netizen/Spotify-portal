#!/data/data/com.termux/files/usr/bin/bash

FILE="bot.development.js"

if [ -f "$FILE" ]; then
  DATE=$(date +"%Y%m%d-%H%M%S")
  cp "$FILE" "backup-$DATE-$FILE"
  echo "BACKUP OK: backup-$DATE-$FILE"
else
  echo "FILE TIDAK DITEMUKAN"
fi
