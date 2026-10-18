#!/bin/bash

python - <<'PY'
from pathlib import Path

file = Path("bot.development.js")
text = file.read_text()

target = '''      sender
    );

  } else if ('''

replace = '''      sender
    );

    continue;

  } else if ('''

if "continue;" in text[text.find("DEVELOPER BYPASS ANTI TOXIC"):text.find("DEVELOPER BYPASS ANTI TOXIC")+300]:
    print("CONTINUE SUDAH ADA")
    exit()

pos = text.find("👑 DEVELOPER BYPASS ANTI TOXIC:")

if pos == -1:
    print("BYPASS TIDAK DITEMUKAN")
    exit()

after = text.find("  } else if (", pos)

if after == -1:
    print("POSISI ELSE TIDAK DITEMUKAN")
    exit()

text = (
    text[:after]
    + "    continue;\n\n"
    + text[after:]
)

file.write_text(text)

print("CONTINUE BYPASS BERHASIL DIPASANG")
PY
