#!/bin/bash
# dev/shot.sh 'SELECTOR' P OUT.png [W] [H] [fx]  — headless render of one element of the built page at progress P
SEL=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$1")
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=${4:-1440},${5:-900} --virtual-time-budget=9000 --screenshot="$3" \
  "http://127.0.0.1:8091/dev/scene.html?sel=${SEL}&p=$2&fx=${6:-1}" 2>/dev/null >/dev/null
