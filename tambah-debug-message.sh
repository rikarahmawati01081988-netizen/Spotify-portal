#!/bin/bash
python - <<'PY'
from pathlib import Path

p=Path("bot.development.js")
t=p.read_text()

old='console.log("PESAN:", text);'

new='''console.log("PESAN:", text);
        console.log(
          "DEBUG RAW MESSAGE:",
          JSON.stringify(msg.message, null, 2)
        );'''

if old not in t:
    print("TARGET TIDAK DITEMUKAN")
    exit()

p.write_text(t.replace(old,new,1))
print("DEBUG MESSAGE AKTIF")
PY
