#!/bin/bash

python - <<'PY'
from pathlib import Path

file = Path("bot.development.js")
text = file.read_text()

old = '''const protectorWords = [
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
        ];'''

new = '''const protectorWords = [
          "developer",
          "dev",
          "nomor developer",
          "nomor dev",
          "siapa developer",
          "siapa pembuat bot",
          "pembuat bot",
          "nomor owner",
          "siapa owner",
          "kenapa kebal",
          "kenapa tidak kena",
          "gak kena",
          "tidak kena",
          "kenapa dia aman",
          "kenapa dia bebas",
          "kenapa dia tidak dihapus",
          "kenapa tidak kena ban",
          "nomor itu aman"
        ];'''

if old not in text:
    print("BLOK PROTECTOR TIDAK DITEMUKAN")
    exit()

text=text.replace(old,new,1)

old2='''"🛡️ DEVELOPER PROTECTOR\\n\\n" +
                "Informasi developer merupakan data terbatas."'''

new2='''"🛡️ KING SECURITY PROTOCOL\\n\\n" +
                "🔐 Identity Protection System aktif\\n\\n" +
                "Permintaan terkait akun dengan akses keamanan khusus terdeteksi.\\n\\n" +
                "Status:\\n" +
                "✅ Security Role : VERIFIED\\n" +
                "✅ Protection Layer : ACTIVE\\n" +
                "✅ Abuse Guard : ENABLED\\n\\n" +
                "Informasi detail keamanan tidak tersedia untuk publik.\\n\\n" +
                "© KING SECURITY CORE"'''

if old2 not in text:
    print("RESPON LAMA TIDAK DITEMUKAN")
    exit()

text=text.replace(old2,new2,1)

file.write_text(text)

print("DEVELOPER PROTECTOR V2 BERHASIL DIPASANG")
PY
