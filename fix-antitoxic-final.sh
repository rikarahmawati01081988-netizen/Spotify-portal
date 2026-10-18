#!/bin/bash

python - <<'PY'
from pathlib import Path

file = Path("bot.development.js")
text = file.read_text()

target = '''      sender
    );

  } else if ('''

if target in text:
    text = text.replace(
        target,
        '''      sender
    );

    continue;

  } else if (''',
        1
    )
    file.write_text(text)
    print("FIX BERHASIL")
else:
    # fallback cari lokasi manual
    start = text.find('DEVELOPER BYPASS ANTI TOXIC')

    if start == -1:
        print("BYPASS TIDAK DITEMUKAN")
        exit()

    end = text.find('} else if', start)

    if end == -1:
        print("ELSE TIDAK DITEMUKAN")
        exit()

    text = text[:end] + "continue;\n\n  " + text[end:]
    file.write_text(text)
    print("FIX FALLBACK BERHASIL")
PY
