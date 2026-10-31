# python3 dev/sheet.py OUT.png a.png b.png ... — contact sheet, 3 per row, half size, labelled
import sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
ims = [Image.open(f).convert('RGB') for f in files]
w, h = 720, int(720 * ims[0].height / ims[0].width)
cols = 3 if len(ims) > 2 else len(ims)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w + (cols - 1) * 6, rows * h + (rows - 1) * 6), (255, 0, 255))
for i, (im, f) in enumerate(zip(ims, files)):
    t = im.resize((w, h))
    ImageDraw.Draw(t).text((8, 8), f.split('/')[-1], fill=(255, 0, 255))
    sheet.paste(t, ((i % cols) * (w + 6), (i // cols) * (h + 6)))
sheet.save(out)
