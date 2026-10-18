#!/bin/bash

FILE="bot.development.js"

python - <<'PY'
from pathlib import Path

file = Path("bot.development.js")
text = file.read_text()

target = "// ===== END KING DEVELOPER WATCHDOG ====="

insert = r'''

// ===== KING DEVELOPER OFFLINE MONITOR =====

const developerConfigFile = path.join(__dirname, "developer-watchdog.json");

function loadDeveloperConfig() {
  try {
    return JSON.parse(
      fs.readFileSync(developerConfigFile, "utf8")
    );
  } catch {
    return null;
  }
}

function isSleepTime() {
  const config = loadDeveloperConfig();
  if (!config) return false;

  const hour = new Date().getHours();

  return (
    hour >= 22 ||
    hour < 6
  );
}

async function checkDeveloperOffline(sock) {
  const config = loadDeveloperConfig();
  if (!config) return;

  if (isSleepTime()) return;

  const state = loadDeveloperWatchdog();

  if (!state.lastSeen) return;

  const offlineHours =
    (Date.now() - state.lastSeen) /
    (1000 * 60 * 60);

  if (offlineHours >= config.warningAfterHours) {

    await sock.sendMessage(
      config.backupAlert + "@s.whatsapp.net",
      {
        text:
`👑 KING SECURITY ALERT

Developer utama belum terdeteksi aktif.

Offline selama:
${offlineHours.toFixed(1)} jam

Waktu pengecekan:
${new Date().toLocaleString("id-ID")}

Status:
MENUNGGU AKTIVITAS DEVELOPER`
      }
    );

    console.log(
      "⚠️ DEVELOPER OFFLINE ALERT SENT"
    );
  }
}

// ===== END KING DEVELOPER OFFLINE MONITOR =====
'''

if target not in text:
    print("BLOK TARGET TIDAK DITEMUKAN")
    exit()

if "KING DEVELOPER OFFLINE MONITOR" in text:
    print("MONITOR SUDAH ADA")
    exit()

text = text.replace(
    target,
    target + insert
)

file.write_text(text)

print("OFFLINE MONITOR BERHASIL DIPASANG")
PY
