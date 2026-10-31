# dev/swap.py OLDCLASS NAME — replace the old <div class="scene sig OLDCLASS"…> block in index.src.html with the
# marker for scenes/NAME.html, and add NAME's css/js includes if missing.
import pathlib, re, sys
old, name = sys.argv[1], sys.argv[2]
p = pathlib.Path(__file__).resolve().parent.parent / 'index.src.html'
s = p.read_text()
m = re.search(r'<div class="scene sig ' + re.escape(old) + r'["\s]', s)
if m:
    i = m.start(); depth = 0; j = i
    for t in re.finditer(r'<div\b|</div>', s[i:]):
        depth += 1 if t.group() == '<div' else -1
        if depth == 0: j = i + t.end(); break
    line_start = s.rfind('\n', 0, i) + 1
    s = s[:line_start] + f'  <!--@scene:{name}-->' + s[j:]
    print('swapped', old, '->', name)
else:
    print('no block for', old)
css = f'<link rel="stylesheet" href="scenes/{name}.css">'
if css not in s: s = s.replace('<link rel="stylesheet" href="scenes/khaybar.css">', '<link rel="stylesheet" href="scenes/khaybar.css">\n' + css)
js = f'<script src="scenes/{name}.js"></script>'
if js not in s: s = s.replace('<script src="app.js"></script>', js + '\n<script src="app.js"></script>')
p.write_text(s)
