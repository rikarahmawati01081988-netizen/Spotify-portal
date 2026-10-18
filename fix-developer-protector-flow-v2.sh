0#!/bin/bash

python - <<'PY'
from pathlib import Path

file = Path("bot.development.js")
text = file.read_text()

start = text.find("// ===== DEVELOPER PROTECTOR AKTIF =====")
end = text.find("// ===== END DEVELOPER PROTECTOR =====")

if start == -1 or end == -1:
    print("BLOK PROTECTOR TIDAK DITEMUKAN")
    exit()

block = text[start:end]

if "continue;" not in block:
    print("CONTINUE TIDAK ADA")
    exit()

block = block.replace("continue;", "", 1)

text = text[:start] + block + text[end:]

file.write_text(text)

print("CONTINUE PROTECTOR BERHASIL DIHAPUS")
PY
