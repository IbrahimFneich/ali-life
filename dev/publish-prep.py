# Copies the built page into a publish folder: page skeleton stripped (the artifact adds it), assets alongside.
import pathlib, re, shutil, sys
root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True); (out / 'scenes').mkdir(exist_ok=True)
html = (root / 'index.html').read_text()
for pat in [r'<!doctype html>\s*', r'<html[^>]*>\s*', r'</html>\s*', r'<head>\s*', r'</head>\s*', r'<body[^>]*>\s*', r'</body>\s*', r'<meta charset="utf-8">\s*', r'<meta name="viewport"[^>]*>\s*']:
    html = re.sub(pat, '', html, flags=re.I)
(out / 'ali-life.html').write_text(html)
for f in ['styles.css', 'app.js']: shutil.copy(root / f, out / f)
(out / 'i18n').mkdir(exist_ok=True)
for f in (root / 'i18n').glob('*.json'): shutil.copy(f, out / 'i18n' / f.name)
for sub in ('audio/n', 'audio/q'):  # narration sprites and Qur'an recitations for Play mode
    if (root / sub).is_dir():
        (out / sub).mkdir(parents=True, exist_ok=True)
        for f in (root / sub).glob('*.mp3'): shutil.copy(f, out / sub / f.name)
if (root / 'audio/narr.json').exists(): shutil.copy(root / 'audio/narr.json', out / 'audio/narr.json')
for f in (root / 'scenes').iterdir():
    if f.suffix in ('.js', '.css'): shutil.copy(f, out / 'scenes' / f.name)  # .html snippets are already pasted into the page
(out / 'proto').mkdir(exist_ok=True)
for f in (root / 'proto').glob('hero-*.html'): shutil.copy(f, out / 'proto' / f.name)  # cover art, shuffled in iframes
print('\n'.join(sorted(str(p.relative_to(out)) for p in out.rglob('*') if p.is_file())))

# FILES_JSON: the exact `files` list for the Artifact publish call
import json
print('FILES_JSON ' + json.dumps([{"path": str(f.relative_to(out))} for f in sorted(out.rglob('*')) if f.is_file() and f.name != 'ali-life.html']))
