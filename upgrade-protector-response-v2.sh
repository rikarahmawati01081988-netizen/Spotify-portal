#!/bin/bash

python - <<'PY'
from pathlib import Path

file = Path("bot.development.js")
text = file.read_text()

old = '"Informasi developer merupakan data terbatas."'

new = '''"🔐 Identity Protection System aktif\\\\n\\\\n" +
                "Permintaan terkait akun dengan akses keamanan khusus terdeteksi.\\\\n\\\\n" +
                "Status:\\\\n" +
                "✅ Security Role : VERIFIED\\\\n" +
                "✅ Protection Layer : ACTIVE\\\\n" +
                "✅ Abuse Guard : ENABLED\\\\n\\\\n" +
                "Informasi detail keamanan tidak tersedia untuk publik.\\\\n\\\\n" +
                "© KING SECURITY CORE"'''

if old not in text:
    print("TEXT LAMA TIDAK DITEMUKAN")
    exit()

text = text.replace(old, new, 1)

file.write_text(text)

print("RESPON PROTECTOR V2 BERHASIL DIPASANG")
PY
