# dev/narrate.py SRC.json VOC.json VERSES.json — builds the Play-mode audio.
#   SRC    [key, displayText, sectionId] per text block, in reading order (collected from the live page)
#   VOC    [{i, speak, quran?}] per block: the fully voweled script to synthesise (null = not read aloud)
#   VERSES [{keys, frag, nf, na, pos}] the verses on the page; their recitations live in audio/q/<name>-<reciter>.mp3
# Writes audio/n/NN.mp3 (narration sprites, ~90 s each), audio/narr.json (key -> clip), caches TTS in dev/tts-cache/.
import concurrent.futures as cf, hashlib, json, pathlib, re, subprocess, sys, wave, array

root = pathlib.Path(__file__).resolve().parent.parent
VOICE, RATE, PITCH = 'ar-SA-HamedNeural', '-8%', '-2Hz'
TTS = pathlib.Path.home() / '.claude/tools/edge-tts/.venv/bin/edge-tts'
SR, GAP, TARGET = 24000, .35, 90.0
cache = root / 'dev/tts-cache'; cache.mkdir(exist_ok=True)
(root / 'audio/n').mkdir(parents=True, exist_ok=True)
src, voc, verses = (json.load(open(a)) for a in sys.argv[1:4])
voc = {v['i']: v for v in voc}

strip = lambda t: re.sub(r'[\u064B-\u0670\u06D6-\u06ED\u0640اٱأإآىيء\s]', '', re.sub(r'<[^>]+>', '', t).replace('ة', 'ه'))
def clip_name(v):  # the recitation file stem for a verse on the page; "a" = the fragment shown, cut from the ayah
    su, ay = map(int, v['keys'][0].split(':'))
    part = (su, ay) in {(33, 33), (5, 67), (5, 3)} or ((su, ay) == (17, 81) and v['nf'] < v['na'])
    return f'{su}-{ay}' + ('a' if part else '')
VN = [(strip(v['frag']), clip_name(v)) for v in verses]
have = {}
for f in (root / 'audio/q').glob('*.mp3'):
    stem, who = f.stem.rsplit('-', 1); have.setdefault(stem, []).append(who)

def tts(text):
    h = hashlib.sha1(f'{VOICE}|{RATE}|{PITCH}|{text}'.encode()).hexdigest()[:16]
    mp3, wav = cache / f'{h}.mp3', cache / f'{h}.wav'
    if not wav.exists():
        for _ in range(3):
            r = subprocess.run([str(TTS), '--voice', VOICE, f'--rate={RATE}', f'--pitch={PITCH}', '--text', text, '--write-media', str(mp3)], capture_output=True)
            if r.returncode == 0 and mp3.exists() and mp3.stat().st_size > 1000: break
        else: raise RuntimeError(f'tts failed: {text[:60]}')
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(mp3), '-ac', '1', '-ar', str(SR), '-sample_fmt', 's16', str(wav)], check=True)
    return wav

jobs = [(i, voc[i]['speak']) for i in range(len(src)) if voc.get(i, {}).get('speak')]
with cf.ThreadPoolExecutor(6) as ex: wavs = dict(zip([i for i, _ in jobs], ex.map(lambda j: tts(j[1]), jobs)))

man = {'files': [], 'k': {}, 'q': {n: sorted(w) for n, w in have.items()}}
buf, t, n = array.array('h'), 0.0, 0
def flush():
    global buf, t, n
    if not buf: return
    w = root / f'audio/n/{n:02d}.wav'
    with wave.open(str(w), 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes(buf.tobytes())
    mp3 = root / f'audio/n/{n:02d}.mp3'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(w), '-ac', '1', '-b:a', '48k', str(mp3)], check=True); w.unlink()
    man['files'].append(f'audio/n/{n:02d}.mp3'); buf, t, n = array.array('h'), 0.0, n + 1
for i, (key, raw, _sec) in enumerate(src):
    m = {}
    if '﴿' in raw:
        s = strip(raw); hit = [(frag, name) for frag, name in VN if frag and frag in s and name in have]
        qs = list(dict.fromkeys(name for frag, name in hit if not any(frag != g and frag in g for g, _ in hit)))  # longest match only
        if qs: m['q'] = qs[0] if len(qs) == 1 else qs; m['o'] = 'qs' if raw.lstrip().startswith('﴿') else 'sq'
    if i in wavs:
        with wave.open(str(wavs[i])) as f: pcm = array.array('h', f.readframes(f.getnframes()))
        m['s'] = [n, round(t, 3), round(len(pcm) / SR, 3)]
        buf.extend(pcm); buf.extend(array.array('h', bytes(int(GAP * SR) * 2))); t += len(pcm) / SR + GAP
    if m: man['k'][key] = m
    if t >= TARGET: flush()
flush()
json.dump(man, open(root / 'audio/narr.json', 'w'), ensure_ascii=False, separators=(',', ':'))
tot = sum(v['s'][2] for v in man['k'].values() if 's' in v)
print(f"clips {sum('s' in v for v in man['k'].values())}, verses {sum('q' in v for v in man['k'].values())}, sprites {len(man['files'])}, speech {tot / 60:.1f} min")
