#!/bin/bash

python - <<'PY'
from pathlib import Path

file = Path("bot.development.js")
text = file.read_text()

old = '''    console.log(
      "👑 DEVELOPER BYPASS ANTI TOXIC:",
      sender
    );

  } else if ('''

new = '''    console.log(
      "👑 DEVELOPER BYPASS ANTI TOXIC:",
      sender
    );

    continue;

  } else if ('''

if old not in text:
    print("TARGET TIDAK DITEMUKAN")
    exit()

text=text.replace(old,new,1)

file.write_text(text)

print("FIX ANTI TOXIC DEVELOPER SELESAI")
PY
