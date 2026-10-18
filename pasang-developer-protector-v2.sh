#!/bin/bash

python - <<'PY'
from pathlib import Path

file = Path("bot.development.js")
text = file.read_text()

marker = 'console.log("PESAN:", text);'

if marker not in text:
    print("MARKER PESAN TIDAK DITEMUKAN")
    exit()

if "DEVELOPER PROTECTOR AKTIF" in text:
    print("PROTECTOR SUDAH ADA")
    exit()

insert = r'''

        // ===== DEVELOPER PROTECTOR AKTIF =====
        const protectorWords = [
          "developer",
          "dev",
          "nomor developer",
          "nomor dev",
          "siapa developer",
          "siapa pembuat bot",
          "pembuat bot",
          "nomor owner",
          "kenapa kebal",
          "kenapa tidak kena",
          "kenapa tidak dihapus"
        ];

        if (
          getSecurityRole(sender) !== "developer" &&
          protectorWords.some(word =>
            text.toLowerCase().includes(word)
          )
        ) {
          await sock.sendMessage(jid, {
            text:
              "🛡️ DEVELOPER PROTECTOR\n\n" +
              "Informasi developer merupakan data terbatas."
          });

          continue;
        }

        // ===== END DEVELOPER PROTECTOR =====
'''

text = text.replace(
    marker,
    insert + "\n        " + marker,
    1
)

file.write_text(text)

print("DEVELOPER PROTECTOR BERHASIL DIPASANG")
PY
