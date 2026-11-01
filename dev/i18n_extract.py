# dev/i18n_extract.py OUT.json — collects every text block of the built index.html that the English toggle can
# translate, keyed the same way app.js looks them up (Arabic with vowel marks removed, spaces collapsed).
import html.parser, json, pathlib, re, sys
root = pathlib.Path(__file__).resolve().parent.parent
BLOCK = {'p', 'li', 'blockquote', 'h1', 'h2', 'h3', 'figcaption', 'label', 'button', 'dt', 'dd', 'th'}
def norm(s):
    s = re.sub(r'[ً-ٰٟـ]', '', s)
    return re.sub(r'\s+', ' ', s).strip()
class P(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(); self.stack = []; self.out = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs); cls = a.get('class') or ''
        src = tag == 'span' and 'src' in cls.split()
        if tag in BLOCK or src:
            for f in self.stack:
                if f and not src: f.append('kids')
            self.stack.append([tag, src, []])
        else: self.stack.append(None)
        if tag in ('br', 'img', 'input', 'meta', 'link', 'i', 'canvas', 'path', 'circle', 'rect', 'ellipse') and tag not in BLOCK:
            self.stack.pop()
    def handle_endtag(self, tag):
        while self.stack:
            e = self.stack.pop()
            if e is None: return
            t = ''.join(e[2])
            if e[1]:  # a source chip: its own key, and kept out of its parent block
                if norm(t): self.out.append(norm(t))
            else:
                if norm(t) and 'kids' not in e[3:]: self.out.append(norm(t))
                for f in self.stack:
                    if f: f[2].append(t)
            return
    def handle_data(self, d):
        for f in reversed(self.stack):
            if f: f[2].append(d); break
p = P(); p.feed((root / 'index.html').read_text())
seen, keys = set(), []
for k in p.out:
    if re.search(r'[؀-ۿ]', k) and k not in seen: seen.add(k); keys.append(k)
pathlib.Path(sys.argv[1]).write_text(json.dumps(keys, ensure_ascii=False, indent=0))
print(len(keys), 'blocks')
