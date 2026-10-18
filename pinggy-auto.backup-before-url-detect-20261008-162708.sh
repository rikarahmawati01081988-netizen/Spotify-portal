#!/data/data/com.termux/files/usr/bin/bash

while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔄 Menjalankan Pinggy..."

  ssh -o ServerAliveInterval=30 \
      -o ServerAliveCountMax=3 \
      -o StrictHostKeyChecking=no \
      -o ExitOnForwardFailure=yes \
      -p 443 \
      -R0:127.0.0.1:8787 \
      free.pinggy.io

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ Pinggy terputus. Reconnect 5 detik lagi..."
  sleep 5
done
