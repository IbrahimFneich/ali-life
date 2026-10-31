# Copies the built page into a publish folder: page skeleton stripped (the artifact adds it), assets alongside.
import pathlib, re, shutil, sys
root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True); (out / 'scenes').mkdir(exist_ok=True)
html = (root / 'index.html').read_text()
for pat in [r'<!doctype html>\s*', r'<html[^>]*>\s*', r'</html>\s*', r'<head>\s*', r'</head>\s*', r'<body[^>]*>\s*', r'</body>\s*', r'<meta charset="utf-8">\s*', r'<meta name="viewport"[^>]*>\s*']:
    html = re.sub(pat, '', html, flags=re.I)
(out / 'ali-life.html').write_text(html)
for f in ['styles.css', 'app.js']: shutil.copy(root / f, out / f)
for f in (root / 'scenes').iterdir():
    if f.suffix in ('.js', '.css'): shutil.copy(f, out / 'scenes' / f.name)  # .html snippets are already pasted into the page
print('\n'.join(sorted(str(p.relative_to(out)) for p in out.rglob('*') if p.is_file())))

# FILES_JSON: the exact `files` list for the Artifact publish call
import json
print('FILES_JSON ' + json.dumps([{"path": str(f.relative_to(out))} for f in sorted(out.rglob('*')) if f.is_file() and f.name != 'ali-life.html']))
