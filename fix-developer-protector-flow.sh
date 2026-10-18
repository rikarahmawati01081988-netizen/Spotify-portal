#!/bin/bash

python - <<'PY'
from pathlib import Path

file = Path("bot.development.js")
text = file.read_text()

old = '''            continue;
          }

          // ===== END DEVELOPER PROTECTOR ====='''

new = '''          }

          // ===== END DEVELOPER PROTECTOR ====='''

if old not in text:
    print("TARGET CONTINUE TIDAK DITEMUKAN")
    exit()

text = text.replace(old, new, 1)

file.write_text(text)

print("DEVELOPER PROTECTOR FLOW DIPERBAIKI")
PY
