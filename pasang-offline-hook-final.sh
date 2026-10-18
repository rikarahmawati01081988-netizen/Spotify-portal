#!/bin/bash

python - <<'PY'
from pathlib import Path

file = Path("bot.development.js")
text = file.read_text()

target = 'console.log("DEBUG IDENTITAS BOT:", sock.user?.id, sock.user?.lid);'

if "developerOfflineMonitor" in text:
    print("HOOK SUDAH ADA")
    exit()

if target not in text:
    print("TARGET TIDAK DITEMUKAN")
    exit()

add = '''

        if (!global.developerOfflineMonitor) {
          global.developerOfflineMonitor = true;

          setInterval(() => {
            checkDeveloperOffline(sock)
              .catch(err =>
                console.log(
                  "OFFLINE MONITOR ERROR:",
                  err.message
                )
              );
          }, 60 * 60 * 1000);

          console.log(
            "👑 DEVELOPER OFFLINE MONITOR AKTIF"
          );
        }
'''

text = text.replace(
    target,
    target + add,
    1
)

file.write_text(text)

print("HOOK OFFLINE MONITOR TERPASANG")
PY
