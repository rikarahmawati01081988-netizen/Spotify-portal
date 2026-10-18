#!/bin/bash

python - <<'PY'
from pathlib import Path

file = Path("bot.development.js")
text = file.read_text()

marker = '\"👑 DEVELOPER BYPASS ANTI TOXIC:\",'

pos = text.find(marker)

if pos == -1:
    print("MARKER TIDAK DITEMUKAN")
    exit()

end = text.find('  } else if (', pos)

if end == -1:
    print("BLOK ELSE TIDAK DITEMUKAN")
    exit()

before = text[:end]

if "continue;" in before[pos:end]:
    print("CONTINUE SUDAH ADA")
    exit()

text = (
    text[:end]
    + "    continue;\n\n"
    + text[end:]
)

file.write_text(text)

print("CONTINUE ANTI TOXIC BERHASIL DITAMBAHKAN")
PY
