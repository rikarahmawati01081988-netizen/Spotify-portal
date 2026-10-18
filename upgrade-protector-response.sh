#!/bin/bash

python - <<'PY'
from pathlib import Path

file = Path("bot.development.js")
text = file.read_text()

old = "Informasi developer merupakan data terbatas."

new = """🔐 Identity Protection System aktif

Permintaan terkait akun dengan akses keamanan khusus terdeteksi.

Status:
✅ Security Role : VERIFIED
✅ Protection Layer : ACTIVE
✅ Abuse Guard : ENABLED

Informasi detail keamanan tidak tersedia untuk publik.

© KING SECURITY CORE"""

if old not in text:
    print("TEXT LAMA TIDAK DITEMUKAN")
    exit()

text = text.replace(
    old,
    new,
    1
)

file.write_text(text)

print("RESPON PROTECTOR BERHASIL DIUPDATE")
PY
