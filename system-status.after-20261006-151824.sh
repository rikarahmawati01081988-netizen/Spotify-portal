#!/data/data/com.termux/files/usr/bin/sh

cd ~/wa-bot

echo "╔════════════════════════════╗"
echo "║       KING BOT STATUS      ║"
echo "╚════════════════════════════╝"

echo "Production : $(cat .production-version 2>/dev/null || echo "belum tercatat")"
echo "Development: $(cat .development-version 2>/dev/null || echo "belum tercatat")"

echo ""
echo "=== PM2 ==="
pm2 list

echo ""
echo "=== CUSTOMER 002 ==="
grep '"active"' "customers/customer 002.json" 2>/dev/null || echo "data tidak ditemukan"
