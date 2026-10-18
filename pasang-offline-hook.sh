#!/bin/bash

python - <<'PY'
from pathlib import Path

file = Path("bot.development.js")
text = file.read_text()

old = '''      if (connection === "open") {
        console.log("BOT TERHUBUNG 🟢");
        console.log("DEBUG IDENTITAS BOT:", sock.user?.id, sock.user?.lid);
      }'''

if old not in text:
    old = '''    if (connection === "open") {
      console.log("BOT TERHUBUNG 🟢");
      console.log("DEBUG IDENTITAS BOT:", sock.user?.id, sock.user?.lid);
    }'''

if old not in text:
    print("BLOK TARGET TIDAK DITEMUKAN")
    exit()

new = old.replace(
'''      }''',
'''        setInterval(() => {
          checkDeveloperOffline(sock)
            .catch(err =>
              console.log("OFFLINE MONITOR ERROR:", err.message)
            );
        }, 60 * 60 * 1000);
      }''',
1
)

text = text.replace(old, new)

file.write_text(text)

print("DEVELOPER OFFLINE HOOK BERHASIL DIPASANG")
PY
