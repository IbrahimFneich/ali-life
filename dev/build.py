# Builds index.html from index.src.html: each <!--@scene:NAME--> marker is replaced by scenes/NAME.html.
import pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'index.src.html').read_text()
def sub(m):
    f = root / 'scenes' / f'{m.group(1)}.html'
    return f.read_text() if f.exists() else f'<!-- missing scene {m.group(1)} -->'
(root / 'index.html').write_text(re.sub(r'<!--@scene:([a-z]+)-->', sub, src))
print('built index.html')
