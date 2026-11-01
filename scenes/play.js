// Ali Life: Play mode. A player bar: the page scrolls itself and each text block is read aloud as it comes into view.
// Back / next by paragraph or by chapter, pause, and a track with a tick per chapter (click to jump, hover for its name).
// Narration: a neural Arabic voice reading a fully voweled script (audio/n/*.mp3 sprites). Qur'an verses: real human
// recitation, a reciter picked at random per verse (audio/q/*.mp3). A manual scroll pauses; play carries on from there.
(() => {
const pill = document.getElementById('play');
if (!pill) return;
const html = document.documentElement;
const LEAF = 'p, li, blockquote, h1, h2, h3, figcaption, dt, dd';
const norm = (s) => s.replace(/[ً-ٰٟـ]/g, '').replace(/\s+/g, ' ').trim();
const textOf = (el) => { let t = ''; el.childNodes.forEach((n) => { if (n.nodeType === 3) t += n.textContent; else if (n.nodeType === 1 && !n.classList.contains('src') && !n.classList.contains('en')) t += textOf(n); }); return t; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let fast = false; // test hook: Play.fast = N skips the audio and scrolls N times faster
let man = null, ctx = null, out = null, cur = null, els = [];
let on = false, paused = false, busy = false, rush = false, skip = 0, gen = 0, ahead = false;
let pos = 0, last = 0, scanAt = 0, holdTo = 0, uiAt = 0, endAt = -1;
let speaking = null; // { el, k, t }: the block being read now
const read = new Set(), hist = [], bufs = new Map(); // hist: { k, y } per block, in the order they were read

// ---------- chapters: the same list as the menu ----------
const chaps = [...document.querySelectorAll('main > [id]')];
const labelOf = (s) => s.dataset.title || s.dataset.label || 'عليّ';
const topOf = (s) => s.getBoundingClientRect().top + scrollY;
const endY = () => document.documentElement.scrollHeight - innerHeight;
const chapAt = (y) => { let i = 0; chaps.forEach((s, j) => { if (topOf(s) <= y + 1) i = j; }); return i; };
const here = () => chapAt(speaking ? speaking.el.getBoundingClientRect().top + scrollY : (paused ? scrollY : pos) + innerHeight * .5);

// ---------- the bar ----------
const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const I = {
  play: svg('M8 5.5v13l10.5-6.5z'), pause: svg('M7 5h3.6v14H7zM13.4 5H17v14h-3.6z'),
  cprev: svg('M6 6h2.2v12H6zM9.6 12 18 18V6z'), cnext: svg('M15.8 6H18v12h-2.2zM6 18l8.4-6L6 6z'),
  pprev: svg('M14.6 5.2 16.4 7l-5 5 5 5-1.8 1.8L7.8 12z'), pnext: svg('M9.4 5.2 7.6 7l5 5-5 5 1.8 1.8 6.8-6.8z'),
};
const bar = document.createElement('div');
bar.className = 'player'; bar.hidden = true;
bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'مشغّل الجولة المسموعة');
bar.innerHTML = `<div class="pl-top"><button type="button" class="pl-ch" title="فهرس الفصول"><span>الآن:</span> <b>عليّ</b></button><button type="button" class="pl-x" aria-label="إغلاق المشغّل" title="إغلاق (Esc)">✕</button></div>
<div class="pl-track"><i class="pl-fill"></i><span class="pl-tip" hidden></span></div>
<div class="pl-btns">
<button type="button" data-a="chap-1" aria-label="الفصل السابق" title="الفصل السابق (Shift + ←)">${I.cprev}<small>فصل</small></button>
<button type="button" data-a="para-1" aria-label="الفقرة السابقة" title="الفقرة السابقة (←)">${I.pprev}<small>فقرة</small></button>
<button type="button" data-a="toggle" class="pl-pp" aria-label="إيقاف مؤقّت" title="إيقاف مؤقّت / متابعة (مسافة)">${I.pause}</button>
<button type="button" data-a="para+1" aria-label="الفقرة التالية" title="الفقرة التالية (→)">${I.pnext}<small>فقرة</small></button>
<button type="button" data-a="chap+1" aria-label="الفصل التالي" title="الفصل التالي (Shift + →)">${I.cnext}<small>فصل</small></button>
</div>`;
document.body.append(bar);
const q = (s) => bar.querySelector(s);
const track = q('.pl-track'), fill = q('.pl-fill'), tip = q('.pl-tip'), pp = q('.pl-pp'), title = q('.pl-ch b');
const ticks = chaps.slice(1).map(() => track.appendChild(document.createElement('i')));
ticks.forEach((t) => { t.className = 'pl-tick'; });

const ui = (t = performance.now()) => {
  uiAt = t;
  const end = Math.max(1, endY());
  if (end !== endAt) { endAt = end; ticks.forEach((tk, i) => { tk.style.left = `${(100 * topOf(chaps[i + 1]) / end).toFixed(2)}%`; }); }
  fill.style.width = `${Math.min(100, 100 * (paused ? scrollY : pos) / end).toFixed(2)}%`;
  title.textContent = labelOf(chaps[here()]);
  pp.innerHTML = paused ? I.play : I.pause;
  pp.setAttribute('aria-label', paused ? 'متابعة' : 'إيقاف مؤقّت');
};

// ---------- reading ----------
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
    if (m.s) buf(man.files[m.s[0]]);
    if (!hit && shown(el, r, all)) hit = [el, k, m];
  }
  return hit;
};
const duck = (d) => { const g = window.Sound?.master?.gain; if (g && window.Sound.ctx) g.setTargetAtTime(d ? .14 : .55, window.Sound.ctx.currentTime, .3); };
const playBuf = (b, off, dur, g) => (g !== gen ? null : fast ? wait(25) : new Promise((res) => {
  const s = ctx.createBufferSource(); s.buffer = b; s.connect(out); s.onended = res; cur = s;
  s.start(0, off ?? 0, dur ?? b.duration - (off ?? 0));
}));
const recite = async (name, g) => {
  const who = man.q[name]; if (!who) return;
  await playBuf(await buf(`audio/q/${name}-${who[Math.floor(Math.random() * who.length)]}.mp3`), 0, undefined, g);
};
const speak = async (el, k, m) => {
  const g = ++gen;
  busy = true; rush = false; read.add(k); hist.push({ k, y: pos });
  speaking = { el, k, t: performance.now() }; el.classList.add('speaking'); duck(true);
  try {
    for (const p of m.o === 'sq' ? ['s', 'q'] : ['q', 's']) {
      if (p === 's' && m.s && g === gen) await playBuf(await buf(man.files[m.s[0]]), m.s[1], m.s[2], g);
      if (p === 'q' && m.q) for (const v of [].concat(m.q)) if (g === gen) await recite(v, g);
    }
  } catch { /* a clip that fails to load is skipped */ }
  if (g !== gen) return; // a skip or a jump took over and already cleaned up
  el.classList.remove('speaking'); speaking = null; duck(false);
  await wait(fast ? 15 : 420);
  if (g === gen) busy = false;
};
// stop the block being read (its audio, its glow) without leaving Play
const cut = () => {
  gen++; busy = false;
  try { cur?.stop(); } catch { /* already ended */ }
  cur = null; speaking?.el.classList.remove('speaking'); speaking = null; duck(false);
};
const settle = (y) => {
  pos = Math.max(0, Math.min(endY(), y)); scrollTo(0, pos);
  rush = false; skip = 0;
  const t = performance.now(); holdTo = t + 450; scanAt = t + 60; // let the scenes redraw before reading
};
// jump to a scroll position: blocks read at or after it will be read again
const seek = (y) => {
  cut();
  for (let i = hist.length; i--;) if (hist[i].y >= y - 2) read.delete(hist.splice(i, 1)[0].k);
  settle(y);
};
// back to the i-th block read: it and everything read after it will be read again
const back = (i) => {
  const { y } = hist[i];
  cut(); hist.splice(i).forEach((h) => read.delete(h.k)); settle(y);
};

// ---------- controls ----------
const nextPara = () => {
  if (speaking) { cut(); rush = true; } // the next block starts at once
  else if (rush) skip++; // already on the way to the next one: pass one more
  else rush = true;
};
const prevPara = () => {
  let i = hist.length - 1;
  if (speaking && performance.now() - speaking.t < 3000) i--; // just started: go to the block before it
  if (i >= 0) back(i);
};
const goChap = (d) => {
  const c = here(), top = topOf(chaps[c]);
  if (d < 0 && (paused ? scrollY : pos) - top > innerHeight * .6) return seek(top); // well into a chapter: its start first
  const n = c + d;
  if (n >= 0 && n < chaps.length) seek(topOf(chaps[n]));
};
const pause = () => {
  if (!on || paused) return;
  paused = true; ctx.suspend(); duck(false); ui();
};
const resume = () => {
  if (!on || !paused) return;
  paused = false; last = performance.now();
  if (Math.abs(scrollY - pos) > 40) seek(scrollY); // the reader scrolled while paused: carry on from there
  ctx.resume(); if (speaking) duck(true);
  ui();
};
const act = (a) => {
  if (!on) return;
  if (a === 'toggle') return paused ? resume() : pause();
  resume();
  ({ 'para+1': nextPara, 'para-1': prevPara, 'chap+1': () => goChap(1), 'chap-1': () => goChap(-1) })[a]?.();
  ui();
};
bar.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.classList.contains('pl-x')) return stop();
  if (b.classList.contains('pl-ch')) return document.getElementById('menu-btn')?.click();
  act(b.dataset.a);
});
const fracAt = (e) => { const r = track.getBoundingClientRect(); return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); };
track.addEventListener('pointermove', (e) => {
  const f = fracAt(e);
  tip.textContent = labelOf(chaps[chapAt(f * endY())]); tip.style.left = `${(f * 100).toFixed(1)}%`; tip.hidden = false;
});
track.addEventListener('pointerleave', () => { tip.hidden = true; });
track.addEventListener('click', (e) => { resume(); seek(fracAt(e) * endY()); ui(); });

// ---------- the loop ----------
const tick = (t) => {
  if (!on) return;
  requestAnimationFrame(tick);
  const dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
  if (t - uiAt > 200) ui(t);
  if (paused) return;
  const moved = Math.abs(scrollY - pos);
  if (moved > 3) { if (moved > innerHeight * .5) seek(scrollY); else pos = scrollY; } // a menu link, or scroll anchoring
  if (busy) return;
  if (t - scanAt > (rush ? 0 : 110)) { // re-list each time: scenes rewrite their captions
    scanAt = t; list();
    let h = scan();
    while (h && skip > 0) { read.add(h[1]); hist.push({ k: h[1], y: pos }); skip--; h = scan(); }
    if (h) { speak(...h); return; }
  }
  const end = endY();
  if (pos >= end - 1) { const h = scan(true); if (h) speak(...h); else pause(); return; }
  if (t < holdTo) return;
  const sc = [...document.querySelectorAll('.scene')].some((e) => { const r = e.getBoundingClientRect(); return r.top <= 1 && r.bottom >= innerHeight - 1; });
  pos = Math.min(end, pos + innerHeight * (ahead || sc ? .5 : 1.6) * (rush ? 6 : 1) * (fast || 1) * dt); // scenes are watched at the slow pace
  scrollTo(0, pos);
};
const start = async () => {
  pill.disabled = true;
  try {
    if (!man) man = await (await fetch('audio/narr.json')).json();
    if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); out = ctx.createGain(); out.connect(ctx.destination); }
    await ctx.resume();
  } catch { pill.disabled = false; return; }
  pill.disabled = false; pill.hidden = true; pill.setAttribute('aria-pressed', 'true');
  on = true; paused = false; html.classList.add('playing'); bar.hidden = false; endAt = -1;
  seek(scrollY); holdTo = performance.now() + 3000; last = performance.now();
  ui(); requestAnimationFrame(tick);
};
function stop() {
  cut(); on = false; paused = false; rush = false; skip = 0;
  bar.hidden = true; pill.hidden = false; pill.setAttribute('aria-pressed', 'false');
  html.classList.remove('playing');
}
pill.addEventListener('click', start);
// the reader takes over: a manual scroll pauses; the bar and the keys drive the tour
const take = (e) => { if (!e.target.closest?.('.player, dialog')) pause(); };
addEventListener('wheel', take, { passive: true });
addEventListener('touchmove', take, { passive: true });
addEventListener('keydown', (e) => {
  if (!on || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.('dialog, input, textarea, select')) return;
  const k = e.key;
  if (k === ' ' && !e.target.closest?.('button')) { e.preventDefault(); act('toggle'); }
  else if (k === 'ArrowRight' || k === 'ArrowLeft') { e.preventDefault(); act(`${e.shiftKey ? 'chap' : 'para'}${k === 'ArrowRight' ? '+1' : '-1'}`); }
  else if (k === 'Escape') stop();
  else if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(k)) pause();
});
window.Play = { start, stop, pause, resume, act, read, hist, get on() { return on; }, get paused() { return paused; }, get speaking() { return speaking?.k ?? null; }, get chapter() { return labelOf(chaps[here()]); }, set fast(v) { fast = v; } };
})();
