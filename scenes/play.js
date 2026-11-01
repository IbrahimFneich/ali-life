// Ali Life: Play mode. The page scrolls itself and each text block is read aloud as it comes into view.
// Narration: a neural Arabic voice reading a fully voweled script (audio/n/*.mp3 sprites). Qur'an verses: real
// human recitation, a reciter picked at random per verse (audio/q/*.mp3). Wheel, touch or a key hands control back.
(() => {
const btn = document.getElementById('play');
if (!btn) return;
const LEAF = 'p, li, blockquote, h1, h2, h3, figcaption, dt, dd';
const norm = (s) => s.replace(/[ً-ٰٟـ]/g, '').replace(/\s+/g, ' ').trim();
const textOf = (el) => { let t = ''; el.childNodes.forEach((n) => { if (n.nodeType === 3) t += n.textContent; else if (n.nodeType === 1 && !n.classList.contains('src') && !n.classList.contains('en')) t += textOf(n); }); return t; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let fast = false; // test hook: Play.fast = N skips the audio and scrolls N times faster
let holdTo = 0;
let man = null, ctx = null, out = null, on = false, busy = false, pos = 0, last = 0, scanAt = 0, ahead = false, cur = null, els = [];
const read = new Set(), bufs = new Map();

const list = () => { els = [...document.querySelectorAll(LEAF)].filter((el) => !el.closest('span.en, button, dialog, nav') && !el.querySelector(LEAF)); };
const keyOf = (el) => norm(textOf(el));
const shown = (el, r, all = false) => {
  // text pinned inside a scene can sit low on screen; text in the page flow is read once it reaches reading height
  if (r.height < 2 || r.bottom < 8 || r.top > innerHeight * (all || el.closest('.stage') ? .96 : .74)) return false;
  let o = 1;
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    o *= +cs.opacity; if (o < .6) return false;
  }
  return true;
};
const fileOf = (m) => (m.s ? man.files[m.s[0]] : null);
const buf = (f) => {
  if (!bufs.has(f)) bufs.set(f, fetch(f).then((r) => r.arrayBuffer()).then((a) => new Promise((ok, no) => ctx.decodeAudioData(a, ok, no))));
  return bufs.get(f);
};
// the first unread block in reading order that is on screen; also notes whether text is coming soon (slower scroll)
const scan = (all = false) => {
  let hit = null; ahead = false;
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight * 2.4) continue;
    const k = keyOf(el), m = man.k[k];
    if (!m || read.has(k)) continue;
    ahead = true;
    const f = fileOf(m); if (f) buf(f);
    if (!hit && shown(el, r, all)) hit = [el, k, m];
  }
  return hit;
};
const duck = (d) => { const g = window.Sound?.master?.gain; if (g && window.Sound.ctx) g.setTargetAtTime(d ? .14 : .55, window.Sound.ctx.currentTime, .3); };
const playBuf = (b, off = 0, dur) => (fast ? wait(25) : new Promise((res) => {
  const s = ctx.createBufferSource(); s.buffer = b; s.connect(out); s.onended = res; cur = s;
  s.start(0, off, dur ?? b.duration - off);
}));
const recite = async (name) => {
  const who = man.q[name]; if (!who) return;
  await playBuf(await buf(`audio/q/${name}-${who[Math.floor(Math.random() * who.length)]}.mp3`));
};
const speak = async (el, k, m) => {
  busy = true; read.add(k); el.classList.add('speaking'); duck(true);
  try {
    const parts = m.o === 'sq' ? ['s', 'q'] : ['q', 's'];
    for (const p of parts) {
      if (!on) break;
      if (p === 's' && m.s) await playBuf(await buf(man.files[m.s[0]]), m.s[1], m.s[2]);
      if (p === 'q' && m.q) for (const q of [].concat(m.q)) { if (on) await recite(q); }
    }
  } catch { /* a clip that fails to load is skipped */ }
  el.classList.remove('speaking'); duck(false);
  if (on) await wait(fast ? 15 : 420);
  busy = false;
};
const tick = (t) => {
  if (!on) return;
  const dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
  if (!busy) {
    if (t - scanAt > 110) { scanAt = t; list(); const h = scan(); if (h) speak(...h); }  // re-list: scenes rewrite their captions
    if (!busy) {
      const end = document.documentElement.scrollHeight - innerHeight;
      if (pos >= end - 1) { const h = scan(true); if (h) speak(...h); else { stop(); return; } }
      if (t < holdTo) { requestAnimationFrame(tick); return; }
      const sc = [...document.querySelectorAll('.scene')].some((e) => { const r = e.getBoundingClientRect(); return r.top <= 1 && r.bottom >= innerHeight - 1; });
      pos = Math.min(end, pos + innerHeight * (ahead || sc ? .5 : 1.6) * (fast || 1) * dt);  // scenes are watched at the slow pace
      scrollTo(0, pos);
    }
  }
  requestAnimationFrame(tick);
};
const start = async () => {
  btn.disabled = true;
  try {
    if (!man) man = await (await fetch('audio/narr.json')).json();
    if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); out = ctx.createGain(); out.gain.value = 1; out.connect(ctx.destination); }
    await ctx.resume();
  } catch { btn.disabled = false; return; }
  btn.disabled = false; on = true; busy = false; last = performance.now(); holdTo = last + 3000;
  document.documentElement.classList.add('playing'); pos = scrollY; list();
  btn.setAttribute('aria-pressed', 'true'); btn.textContent = '❚❚ إيقاف';
  document.documentElement.classList.add('playing');
  requestAnimationFrame(tick);
};
function stop() {
  on = false; try { cur?.stop(); } catch { /* already ended */ }
  document.querySelectorAll('.speaking').forEach((e) => e.classList.remove('speaking'));
  duck(false); busy = false;
  btn.setAttribute('aria-pressed', 'false'); btn.textContent = '▶ استمع';
  document.documentElement.classList.remove('playing');
}
btn.addEventListener('click', () => (on ? stop() : start()));
// the reader takes over: any manual scroll input stops the tour
const take = () => { if (on) stop(); };
addEventListener('wheel', take, { passive: true });
addEventListener('touchstart', take, { passive: true });
addEventListener('keydown', (e) => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) take(); });
window.Play = { start, stop, get on() { return on; }, read, set fast(v) { fast = v; } };
})();
