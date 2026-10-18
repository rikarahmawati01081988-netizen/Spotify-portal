#!/bin/bash

python - <<'PY'
from pathlib import Path

file = Path("bot.development.js")
text = file.read_text()

old = '''  if (
    jid.endsWith("@g.us") &&
      containsToxic(lowerText)
  ) {'''

new = '''  if (
    getSecurityRole(sender) === "developer"
  ) {
    console.log(
      "👑 DEVELOPER BYPASS ANTI TOXIC:",
      sender
    );

  } else if (
    jid.endsWith("@g.us") &&
      containsToxic(lowerText)
  ) {'''

if old not in text:
    print("BLOK ANTI TOXIC TIDAK DITEMUKAN")
    exit()

if "DEVELOPER BYPASS ANTI TOXIC" in text:
    print("BYPASS SUDAH ADA")
    exit()

text = text.replace(old, new)

file.write_text(text)

print("ANTI TOXIC DEVELOPER BYPASS TERPASANG")
PY
