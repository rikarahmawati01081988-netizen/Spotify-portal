#!/data/data/com.termux/files/usr/bin/bash

URL_FILE="$HOME/wa-bot/pinggy-url.txt"
LOG_FILE="$HOME/wa-bot/pinggy-auto.log"

while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔄 Menjalankan Pinggy..." | tee -a "$LOG_FILE"

  ssh -o ServerAliveInterval=30 \
      -o ServerAliveCountMax=3 \
      -o StrictHostKeyChecking=no \
      -o ExitOnForwardFailure=yes \
      -p 443 \
      -R0:127.0.0.1:8787 \
      free.pinggy.io 2>&1 | while IFS= read -r line; do

        echo "$line" | tee -a "$LOG_FILE"

        url=$(printf '%s\n' "$line" | grep -Eo 'https://[A-Za-z0-9.-]+\.free\.pinggy\.net|https://[A-Za-z0-9.-]+\.pinggy\.link' | head -n 1)

        if [ -n "$url" ]; then
          printf '%s\n' "$url" > "$URL_FILE"
          echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ URL Pinggy terbaru: $url" | tee -a "$LOG_FILE"
        fi
  done

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ Pinggy terputus. Reconnect 5 detik lagi..." | tee -a "$LOG_FILE"
  sleep 5
done
