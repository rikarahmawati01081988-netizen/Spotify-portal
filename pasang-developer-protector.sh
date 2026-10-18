#!/bin/bash

python - <<'PY'
from pathlib import Path

file = Path("bot.development.js")
text = file.read_text()

target = '''        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        console.log("PESAN:", text);'''

insert = '''        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        // ===== DEVELOPER PROTECTOR =====
        const protectorWords = [
          "developer",
          "dev",
          "nomor developer",
          "nomor dev",
          "siapa developer",
          "siapa pembuat bot",
          "pembuat bot",
          "owner siapa",
          "nomor owner",
          "kenapa kebal",
          "kenapa tidak kena",
          "kenapa tidak dihapus"
        ];

        const protectorCheck = text.toLowerCase();

        if (
          getSecurityRole(sender) !== "developer" &&
          protectorWords.some(word =>
            protectorCheck.includes(word)
          )
        ) {
          await sock.sendMessage(jid, {
            text:
              "🛡️ DEVELOPER PROTECTOR\\\\n\\\\n" +
              "Informasi developer merupakan data terbatas.\\\\n" +
              "Sistem keamanan tidak dapat memberikan identitas atau data sensitif."
          });

          continue;
        }

        // ===== END DEVELOPER PROTECTOR =====

        console.log("PESAN:", text);'''

if target not in text:
    print("TARGET TIDAK DITEMUKAN")
    exit()

if "DEVELOPER PROTECTOR" in text:
    print("PROTECTOR SUDAH ADA")
    exit()

text = text.replace(target, insert, 1)

file.write_text(text)

print("DEVELOPER PROTECTOR BERHASIL DIPASANG")
PY
