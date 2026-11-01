// Ali Life: scroll engine, page-computed numbers, chrome (menu, HUD with Hijri year and age).
// scenes/core.js and every scenes/*.js file load first and register window.SCENES.
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
// English lookup keys are read now, before any counter animates the numbers inside its text block
const LEAF = 'p, li, blockquote, h1, h2, h3, figcaption, label, dt, dd, th';
const normAr = (s) => s.replace(/[ً-ٰٟـ]/g, '').replace(/\s+/g, ' ').trim();
const textOf = (el) => { let t = ''; el.childNodes.forEach((n) => { if (n.nodeType === 3) t += n.textContent; else if (n.nodeType === 1 && !n.classList.contains('src') && !n.classList.contains('en')) t += textOf(n); }); return t; };
const enKeys = new Map($$(`${LEAF}, span.src`).map((el) => [el, normAr(textOf(el))]));
const fx = document.documentElement.classList.contains('fx-on');
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ar = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const chapters = $$('.chapter');
const yearOf = (c) => +c.dataset.y; // negative = before the Hijra
const ahText = (y) => (y < 0 ? `${ar(-y)} ق.هـ` : `${ar(y)} هـ`);
const whenOf = (c) => c.dataset.when || ahText(yearOf(c)); // data-when: no sourced year, print a label instead

// ---------- numbers and tables computed from the page ----------
$$('[data-count]').forEach((el) => { el.textContent = ar($$(el.dataset.count).length); });
chapters.forEach((c, i) => { const n = $('.op-n', c); if (n) n.textContent = ar(i + 1); });
const tbl = $('#chrono');
if (tbl) {
  $('tbody', tbl).innerHTML = chapters.map((c, i) => `<tr><td>${ar(i + 1)}</td><td><a href="#${c.id}">${c.dataset.title}</a></td><td>${whenOf(c)}</td><td>${c.dataset.when ? '—' : c.dataset.age === '0' ? 'الولادة' : `نحو ${ar(c.dataset.age)}`}</td><td>${c.dataset.place}</td></tr>`).join('');
}

// ---------- menu ----------
const sections = $$('main > *');
const labelOf = (s) => s.dataset.title || s.dataset.label || 'عليّ';
const menu = $('#menu');
const menuBtn = $('#menu-btn');
$('#menu-list').innerHTML = sections.filter((s) => s.id && s.id !== 'top').map((s) => {
  const ch = s.classList.contains('chapter');
  return `<li><a href="#${s.id}"><span class="mn">${ch ? ar(chapters.indexOf(s) + 1) : '◆'}</span><b>${labelOf(s)}</b><span class="my">${ch ? whenOf(s) : ''}</span></a></li>`;
}).join('');
menuBtn.addEventListener('click', () => { menu.showModal(); menuBtn.setAttribute('aria-expanded', 'true'); });
menu.addEventListener('close', () => menuBtn.setAttribute('aria-expanded', 'false'));
menu.addEventListener('click', (e) => { if (e.target === menu || e.target.closest('a')) menu.close(); });

// ---------- words fade in one by one (Arabic: whole words only, never letters, so joining survives) ----------
const splitWords = (el, specAt) => {
  let i = 0;
  const walk = (node) => [...node.childNodes].forEach((n) => {
    if (n.nodeType === 1) return walk(n);
    if (n.nodeType !== 3 || !n.textContent.trim()) return;
    n.replaceWith(...n.textContent.split(/(\s+)/).map((t) => {
      if (!t || /^\s+$/.test(t)) return document.createTextNode(t);
      const w = document.createElement('span');
      w.className = 'w'; w.textContent = t; w.dataset.fx = specAt(i++);
      return w;
    }));
  });
  walk(el);
};

// ---------- canvas and DOM scenes ----------
const hooks = $$('[data-scene]').map((el) => ({ el, sc: window.SCENES[el.dataset.scene], st: {}, rest: +(el.dataset.rest ?? .5) })).filter((h) => h.sc);
hooks.forEach((h) => h.sc.init?.(h.el, h.st));

if (fx) {
  $$('[data-words]').forEach((el) => {
    const [a, b] = (el.dataset.words || '.08 .3').split(' ').map(Number);
    splitWords(el, (i) => `o .12 1 ${a + i * .006} ${b + i * .006} | y .35em 0em ${a + i * .006} ${b + i * .006} out`);
  });
  // A pinned word-by-word quote: data-say="start end" spreads the words across that slice of the scene.
  $$('[data-say]').forEach((el) => {
    const [a, b] = el.dataset.say.split(' ').map(Number);
    const n = el.textContent.trim().split(/\s+/).length;
    splitWords(el, (i) => { const s = a + (b - a) * (i / n); return `o .06 1 ${s.toFixed(4)} ${(s + (b - a) / n * 2).toFixed(4)} | bl 6px 0px ${s.toFixed(4)} ${(s + (b - a) / n * 2).toFixed(4)}`; });
  });
  // Digits may roll: they never join.
  $$('[data-roll]').forEach((el) => {
    const txt = el.textContent; el.textContent = '';
    [...txt].forEach((ch, i) => {
      const o = document.createElement('span'); o.className = 'roll';
      const n = document.createElement('span'); n.textContent = ch;
      n.dataset.fx = `y 110% 0% ${.1 + i * .04} ${.32 + i * .04} out`;
      o.append(n); el.append(o);
    });
  });
}

// ---------- scroll engine ----------
// data-fx="prop from to start end [ease] | …". Props: x y (any unit) s sx r rx ry (deg) o g b bl clip dash.
// Progress 0→1: inside a .scene = how far through the pinned scene; data-src="id" = that element's pass;
// otherwise the element's own pass, from its top touching the bottom of the screen to its bottom leaving the top.
const EASE = {
  lin: (t) => t,
  in: (t) => t * t * t,
  out: (t) => 1 - (1 - t) ** 3,
  io: (t) => (t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  tick: (t) => Math.floor(t * 28) / 28,
};
const unitOf = (v) => { const m = /^(-?[\d.]+)([a-z%]*)$/.exec(v); return [parseFloat(m[1]), m[2]]; };
const items = fx ? $$('[data-fx]').map((el) => {
  const props = {};
  el.dataset.fx.split('|').forEach((track) => {
    const [prop, from, to, a, b, e = 'lin'] = track.trim().split(/\s+/);
    (props[prop] ||= []).push({ from: from.split('_').map(unitOf), to: to.split('_').map(unitOf), a: +a, b: +b, e: EASE[e] || EASE.lin });
  });
  Object.values(props).forEach((tracks) => tracks.sort((m, n) => m.a - n.a));
  const src = el.dataset.src ? document.getElementById(el.dataset.src) : el.closest('.scene') || el;
  return { el, props, src, last: '' };
}) : [];

const boxes = new Map();
const docTop = (el) => { let t = 0; for (let n = el; n; n = n.offsetParent) t += n.offsetTop; return t; };
const boxOf = (el) => {
  let b = boxes.get(el);
  if (!b) { b = { top: docTop(el), h: el.offsetHeight, pin: fx && el.classList.contains('scene') }; boxes.set(el, b); }
  return b;
};
let sy = scrollY;
const progressOf = (el) => {
  const b = boxOf(el);
  const vh = innerHeight;
  return b.pin ? (sy - b.top) / Math.max(1, b.h - vh) : (sy + vh - b.top) / (b.h + vh);
};
const valueAt = (tracks, p) => {
  let tr = tracks[0];
  for (const t of tracks) if (p >= t.a) tr = t;
  const k = tr.e(clamp01((p - tr.a) / (tr.b - tr.a || 1)));
  return tr.from.map(([f, fu], i) => {
    const [t, tu] = tr.to[i];
    return fu === tu ? `${+(f + (t - f) * k).toFixed(4)}${fu}` : `calc(${f}${fu} * ${(1 - k).toFixed(4)} + ${t}${tu} * ${k.toFixed(4)})`;
  });
};
function render() {
  items.forEach((it) => {
    const p = Math.min(1.1, Math.max(-0.1, progressOf(it.src)));
    const v = {};
    for (const prop in it.props) v[prop] = valueAt(it.props[prop], p);
    const key = JSON.stringify(v);
    if (key === it.last) return;
    it.last = key;
    const s = it.el.style;
    if (v.x || v.y || v.s || v.sx || v.r || v.rx || v.ry) {
      const sc = +(v.s?.[0] ?? 1);
      s.transform = `translate3d(${v.x?.[0] ?? 0}, ${v.y?.[0] ?? 0}, 0) rotateX(${v.rx?.[0] ?? '0deg'}) rotateY(${v.ry?.[0] ?? '0deg'}) rotate(${v.r?.[0] ?? '0deg'}) scale(${sc * +(v.sx?.[0] ?? 1)}, ${sc})`;
    }
    if (v.o) s.opacity = v.o[0];
    if (v.g || v.b || v.bl) s.filter = `grayscale(${v.g?.[0] ?? 0}) brightness(${v.b?.[0] ?? 1}) blur(${v.bl?.[0] ?? '0px'})`;
    if (v.clip) s.clipPath = `inset(${v.clip.join(' ')})`;
    if (v.dash) s.strokeDashoffset = v.dash[0];
  });
}

// ---------- HUD: where we are in his life ----------
// Age runs continuously: from one chapter's age to the next across the chapter's height.
// ---------- ambient sound: one bed per section, chosen by the place ----------
const SOUND = {
  top: 'night', birth: 'night', lap: 'desert', dar: 'night', mabit: 'night', brother: 'crowd', home: 'fire',
  badr: 'battle', uhud: 'battle', khandaq: 'storm', khaybar: 'battle', radd: 'desert', fath: 'crowd', hunayn: 'battle',
  yemen: 'desert', tabuk: 'desert', kisa: 'fire', ghadir: 'crowd', farewell: 'fire', sabr: 'wind', adl: 'crowd', jamal: 'battle',
  siffin: 'river', wasiyya: 'fire', nahrawan: 'river', mihrab: 'mosque', ghari: 'shrine', imams: 'wind', rihla: 'wind', close: 'night',
};
const soundBtn = $('#sound');
soundBtn?.addEventListener('click', () => {
  const on = window.Sound.toggle();
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.textContent = on ? 'الصوت: يعمل' : 'الصوت: مُطفأ';
  window.Sound.chapter(SOUND[cur?.id] || 'still');
});
// ---------- English: a translation of the meaning appears under each Arabic text block ----------
const enBtn = $('#en-btn');
let enDict = null;
enBtn?.addEventListener('click', async () => {
  const on = !document.documentElement.classList.contains('en');
  if (on && !enDict) {
    try { enDict = await (await fetch('i18n/en.json')).json(); } catch { enDict = {}; }
    $$(`${LEAF}, span.src`).forEach((el) => {
      if (el.closest('span.en, button, dialog') || (!el.matches('span.src') && el.querySelector(LEAF))) return;
      const tr = enDict[enKeys.get(el) ?? normAr(textOf(el))];
      if (!tr) return;
      const en = document.createElement('span');
      en.className = 'en'; en.lang = 'en'; en.dir = 'ltr'; en.textContent = tr;
      el.append(en);
    });
  }
  document.documentElement.classList.toggle('en', on);
  enBtn.setAttribute('aria-pressed', String(on));
  enBtn.textContent = on ? 'العربية فقط' : 'English';
  measure();
});
const hudT = $('#hud-t');
const hudY = $('#hud-y');
const hudA = $('#hud-a');
const bar = $('#life-bar');
let cur;
function hud() {
  const mid = sy + innerHeight / 2;
  const c = sections.find((s) => { const b = boxOf(s); return mid >= b.top && mid < b.top + b.h; }) || sections[0];
  if (c !== cur) { cur = c; hudT.textContent = labelOf(c); window.Sound?.chapter(SOUND[c.id] || 'still'); }
  const i = chapters.indexOf(c);
  if (i >= 0) {
    const b = boxOf(c);
    const q = clamp01((mid - b.top) / b.h);
    const nx = chapters[i + 1];
    const a0 = +c.dataset.age;
    const a1 = nx ? +nx.dataset.age : 63;
    const age = a0 + (a1 - a0) * q;
    hudY.textContent = whenOf(c);
    hudA.textContent = age < .5 ? 'الولادة' : `العمر ${ar(Math.floor(age))}`;
    bar.style.transform = `scaleX(${(age / 63).toFixed(4)})`;
  } else {
    const before = sections.indexOf(c) < sections.indexOf(chapters[0]);
    hudY.textContent = before ? '٢٣ ق.هـ — ٤٠ هـ' : '';
    hudA.textContent = before ? '٦٣ سنة' : '';
    bar.style.transform = `scaleX(${before ? 0 : 1})`;
  }
  $('#hud').classList.toggle('empty', !hudY.textContent && !hudA.textContent);
}

// ---------- one loop: smoothed scroll, fx layers, HUD, visible scenes ----------
const active = new Set();
let raf = 0;
let drawn = null;
function loop(t) {
  raf = 0;
  if (fx) { sy += (scrollY - sy) * .2; if (Math.abs(scrollY - sy) < .5) sy = scrollY; } else sy = scrollY;
  if (sy !== drawn) { drawn = sy; render(); hud(); }
  active.forEach((h) => h.sc.frame(Math.min(1.05, Math.max(-.05, progressOf(h.el))), t / 1000, h.el, h.st));
  if (sy !== scrollY || active.size) raf = requestAnimationFrame(loop);
}
const kick = () => { raf ||= requestAnimationFrame(loop); };
const still = (h) => h.sc.frame(h.rest, 0, h.el, h.st);
const io = new IntersectionObserver((es) => es.forEach((e) => {
  const h = hooks.find((k) => k.el === e.target);
  if (fx) { e.isIntersecting ? active.add(h) : active.delete(h); kick(); } else if (e.isIntersecting) still(h);
}), { rootMargin: '25% 0px' });
hooks.forEach((h) => io.observe(h.el));

const measure = () => {
  boxes.clear();
  drawn = null;
  if (!fx) hooks.forEach((h) => { if (h.el.getBoundingClientRect().bottom > 0) still(h); });
  kick();
};
addEventListener('scroll', kick, { passive: true });
// to-top button: shows after the first screen; jumps instantly while Play runs (a smooth scroll would be cut by the tour's own scrollTo)
const scrolled = () => document.documentElement.classList.toggle('scrolled', scrollY > innerHeight);
addEventListener('scroll', scrolled, { passive: true }); scrolled();
$('#top-btn')?.addEventListener('click', () => scrollTo({ top: 0, behavior: window.Play?.on || !fx ? 'auto' : 'smooth' }));
addEventListener('resize', measure);
new ResizeObserver(measure).observe($('main'));
// Pinned scene text stays clear of the fixed chrome (menu + HUD top-right, dock bottom-right): captions near a
// stage's top slide below the menu, captions near its bottom lift above the dock. One shift per group keeps
// each scene's own spacing. Uses `translate`, so the data-fx transforms still compose on top.
const clearChrome = () => {
  $$('[data-chrome]').forEach((e) => { e.style.translate = ''; delete e.dataset.chrome; });
  if (!fx) return;
  const top = $('.menu-btn').getBoundingClientRect().bottom + 10, bot = innerHeight - $('.dock').getBoundingClientRect().top + 10;
  $$('.scene .stage').forEach((st) => {
    const H = st.clientHeight, els = [];
    $$('*', st).forEach((e) => {
      if (els.some(([a]) => a.contains(e)) || e.closest('[aria-hidden="true"], svg') || !e.textContent.trim()) return;
      const cs = getComputedStyle(e);
      if (cs.position !== 'absolute' || cs.translate !== 'none' || e.offsetHeight > H * .7) return;
      let y = 0, n = e;
      while (n && n !== st) { y += n.offsetTop; n = n.offsetParent; }
      if (n === st) els.push([e, y, y + e.offsetHeight]);
    });
    const hi = els.filter(([, y]) => y < H * .4), lo = els.filter(([, y, b]) => y >= H * .4 && b > H * .6);
    const up = Math.min(...hi.map(([, y]) => y)), down = Math.max(...lo.map(([, , b]) => b));
    if (up < top) hi.forEach(([e]) => { e.style.translate = `0 ${Math.round(top - up)}px`; e.dataset.chrome = ''; });
    if (down > H - bot) lo.forEach(([e]) => { e.style.translate = `0 ${Math.round(H - bot - down)}px`; e.dataset.chrome = ''; });
  });
};
document.fonts.ready.then(clearChrome);
addEventListener('resize', clearChrome);
// Dev: ?at=SELECTOR@p jumps to progress p of that element (used for headless screenshots).
const jump = () => {
  const at = new URLSearchParams(location.search).get('at');
  if (!at) return;
  const [sel, pp] = at.split('@');
  const t = $(sel);
  if (!t) return;
  boxes.clear();
  const b = boxOf(t);
  scrollTo(0, b.top + (+pp || 0) * Math.max(0, b.h - innerHeight));
  sy = scrollY; drawn = null; kick();
};
document.fonts.ready.then(() => { measure(); jump(); });
measure();
})();
