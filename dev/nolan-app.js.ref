// Nolan Life: scroll engine, page-computed numbers, chrome (menu, side label, timecode, sound).
// scenes.js loads first and registers window.SCENES (canvas and DOM scenes) and window.Sound.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fx = document.documentElement.classList.contains('fx-on');
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const chapters = $$('.chapter');
const pad2 = (n) => String(n).padStart(2, '0');

// ---------- numbers computed from the page itself ----------
const oscars = (c) => (c.dataset.oscars || '0/0').split('/').map(Number);
const minutes = chapters.reduce((a, c) => a + +c.dataset.min, 0);
const totals = {
  films: chapters.length,
  hours: Math.floor(minutes / 60),
  wins: chapters.reduce((a, c) => a + oscars(c)[0], 0),
  noms: chapters.reduce((a, c) => a + oscars(c)[1], 0),
};
$$('[data-total]').forEach((el) => { el.textContent = totals[el.dataset.total]; });
const accOf = (c) => getComputedStyle(c).getPropertyValue('--acc').trim();

// The company: every name in a credits row marked data-people, counted once per film.
const ROLE = { Starring: 'Actor', Cinematography: 'Cinematographer', Music: 'Composer', Editing: 'Editor', 'Produced by': 'Producer', 'Associate producer': 'Producer', 'Production design': 'Production designer' };
const people = new Map();
chapters.forEach((c, i) => {
  $$('.credits div', c).forEach((row) => {
    const dd = $('dd[data-people]', row);
    if (!dd) return;
    const role = ROLE[$('dt', row).textContent] || 'Writer';
    dd.textContent.split(/,\s*/).map((n) => n.replace(/\s*\(.*?\)/g, '').trim())
      .filter((n) => n && n !== 'Christopher Nolan')
      .forEach((n) => {
        const p = people.get(n) || { films: new Set(), roles: new Set() };
        p.films.add(i); p.roles.add(role); people.set(n, p);
      });
  });
});
const crew = $('#crew');
if (crew) { // rows for the company race in scenes.js: one block per film, in film order
  const accs = chapters.map(accOf);
  [...people].filter(([, p]) => p.films.size >= 2)
    .sort((a, b) => b[1].films.size - a[1].films.size || a[0].localeCompare(b[0]))
    .forEach(([name, p]) => {
      const fl = [...p.films].sort((x, y) => x - y);
      const li = document.createElement('li');
      li.dataset.films = fl.join(',');
      li.innerHTML = `<span class="nm">${name}</span><span class="cr-bar" aria-label="${fl.map((i) => chapters[i].dataset.title).join(', ')}">${fl.map((i) => `<i style="--c:${accs[i]}"></i>`).join('')}</span><b class="ct">${p.films.size}</b><span class="rl">${[...p.roles].join(' · ')}</span>`;
      crew.append(li);
    });
  const strip = $('#co-films');
  if (strip) strip.innerHTML = chapters.map((c, i) => `<li style="--c:${accs[i]}"><b>${c.dataset.year}</b><span>${c.dataset.title}</span></li>`).join('');
}

// Filmography table, from each chapter's data attributes.
const tbl = $('#tbl');
if (tbl) {
  const os = (c) => { const [w, n] = oscars(c); return n ? `${w} of ${n}` : '—'; };
  $('tbody', tbl).innerHTML = chapters.map((c, i) => `<tr><td>${pad2(i + 1)}</td><td><i style="--c:${accOf(c)}"></i><a href="#${c.id}">${c.dataset.title}</a></td><td>${c.dataset.year}</td><td>${c.dataset.min}</td><td>${c.dataset.format}</td><td>${c.dataset.budget}</td><td>${c.dataset.gross}</td><td>${os(c)}</td></tr>`).join('');
  $('tfoot', tbl).innerHTML = `<tr><td></td><td>${chapters.length} films</td><td></td><td>${minutes.toLocaleString('en')}</td><td colspan="3">${Math.floor(minutes / 60)} h ${minutes % 60} min, back to back</td><td>${totals.wins} of ${totals.noms}</td></tr>`;
}

// ---------- menu ----------
const sections = $$('main > *');
const labelOf = (s) => (s.classList.contains('chapter') ? `${pad2(chapters.indexOf(s) + 1)} ${s.dataset.title}` : s.dataset.label || 'Leader');
const menu = $('#menu');
const menuBtn = $('#menu-btn');
$('#menu-list').innerHTML = sections.filter((s) => s.id && s.id !== 'top').map((s) => {
  const ch = s.classList.contains('chapter');
  return `<li><a href="#${s.id}"><span class="mono">${ch ? pad2(chapters.indexOf(s) + 1) : '·'}</span><b>${ch ? s.dataset.title : s.dataset.label}</b><span class="mono">${ch ? s.dataset.year : ''}</span></a></li>`;
}).join('');
menuBtn.addEventListener('click', () => { menu.showModal(); menuBtn.setAttribute('aria-expanded', 'true'); });
menu.addEventListener('close', () => menuBtn.setAttribute('aria-expanded', 'false'));
menu.addEventListener('click', (e) => { if (e.target === menu || e.target.closest('a')) menu.close(); });

// ---------- sound ----------
const soundBtn = $('#sound');
soundBtn.addEventListener('click', () => {
  const on = window.Sound.toggle();
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.textContent = on ? 'Sound on' : 'Sound off';
});

// ---------- split text into clipped units that rise ----------
const wrap = (cls, text, spec) => {
  const outer = document.createElement('span');
  const inner = document.createElement('span');
  outer.className = cls; inner.textContent = text; inner.dataset.fx = spec;
  outer.append(inner);
  return outer;
};
const splitText = (el, unit, specAt, cls = unit === 'char' ? 'roll' : 'word') => {
  let i = 0;
  const walk = (node) => [...node.childNodes].forEach((n) => {
    if (n.nodeType === 1) return walk(n);
    if (n.nodeType !== 3 || !n.textContent.trim()) return;
    const parts = unit === 'char' ? [...n.textContent] : n.textContent.split(/(\s+)/);
    n.replaceWith(...parts.map((t) => (/^\s+$/.test(t) || !t ? document.createTextNode(t) : wrap(cls, t, specAt(i++)))));
  });
  walk(el);
};

// ---------- canvas and DOM scenes ----------
const hooks = $$('[data-scene]').map((el) => ({ el, sc: window.SCENES[el.dataset.scene], st: {}, rest: +(el.dataset.rest ?? .5) })).filter((h) => h.sc);
hooks.forEach((h) => h.sc.init?.(h.el, h.st));

if (fx) {
  $$('[data-roll]').forEach((el) => splitText(el, 'char', (i) => `y 110% 0% ${.12 + i * .035} ${.3 + i * .035} out`));
  $$('[data-words]').forEach((el) => {
    const [a, b] = (el.dataset.words || '.08 .3').split(' ').map(Number);
    splitText(el, 'word', (i) => `y 110% 0% ${a + i * .008} ${b + i * .008} out`);
  });
  // Life: each event owns an equal slice of the pinned scene; its year rolls in digit by digit and rolls out.
  $$('.tl').forEach((tl) => {
    const evs = $$('.ev', tl);
    const n = evs.length;
    evs.forEach((ev, i) => {
      const a = i / n, b = (i + 1) / n, d = 1 / n;
      const tin = i ? `o 0 1 ${a} ${a + d * .1}` : '';
      const tout = i < n - 1 ? `o 1 0 ${b - d * .1} ${b}` : '';
      ev.dataset.fx = [tin, tout].filter(Boolean).join(' | ') || 'o 1 1 0 1';
      splitText($('.ev-y', ev), 'char', (k) => `y 110% 0% ${a + k * d * .06} ${a + d * .32 + k * d * .06} out${i < n - 1 ? ` | y 0% -110% ${b - d * .3 + k * d * .04} ${b - d * .08 + k * d * .04} in` : ''}`);
      $('.ev-t', ev).dataset.fx = `o 0 1 ${a + d * .15} ${a + d * .35} | y 40px 0px ${a + d * .15} ${a + d * .4} out`;
      $('.ev-f', ev).dataset.fx = `y 30vh 0vh ${a} ${a + d * .45} out | r ${i % 2 ? 4 : -4}deg 0deg ${a} ${a + d * .45} out${innerWidth > 860 ? ` | y 0vh -14vh ${a + d * .45} ${b} lin` : ''}`;
    });
  });
}

// ---------- scroll engine ----------
// data-fx="prop from to start end [ease] | …". Props: x y (any unit) s sx r rx ry (deg) o g b bl ls wd wg clip dash.
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
    if (v.wd || v.wg) s.fontVariationSettings = [v.wd && `'wdth' ${v.wd[0]}`, v.wg && `'wght' ${v.wg[0]}`].filter(Boolean).join(', ');
    if (v.ls) s.letterSpacing = v.ls[0];
    if (v.clip) s.clipPath = `inset(${v.clip.join(' ')})`;
    if (v.dash) s.strokeDashoffset = v.dash[0];
  });
}

// ---------- side label + timecode ----------
const side = $('#side');
const hudFilm = $('#hud-film');
const hudTc = $('#hud-tc');
const hudNote = $('#hud-note');
const tc = (sec) => { const s = Math.max(0, sec); return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor(s / 60) % 60)}:${pad2(Math.floor(s) % 60)}:${pad2(Math.floor((s % 1) * 24))}`; };
let cur;
function hud() {
  const mid = sy + innerHeight / 2;
  const c = sections.find((s) => { const b = boxOf(s); return mid >= b.top && mid < b.top + b.h; }) || sections[0];
  if (c !== cur) {
    cur = c;
    side.textContent = labelOf(c);
    window.Sound.chapter(c.dataset.sound);
  }
  if (c.classList.contains('chapter')) {
    const b = boxOf(c);
    const len = +c.dataset.min * 60;
    const q = clamp01((mid - b.top) / b.h);
    const rev = c.dataset.tc === 'rev';
    hudFilm.textContent = labelOf(c);
    hudTc.textContent = tc(rev ? len * (1 - q) : len * q);
    hudNote.textContent = rev ? '◀ inverted' : `of ${tc(len).slice(0, 8)}`;
  } else {
    const max = document.documentElement.scrollHeight - innerHeight;
    hudFilm.textContent = labelOf(c);
    hudTc.textContent = tc(minutes * 60 * clamp01(sy / Math.max(1, max)));
    hudNote.textContent = 'all films, end to end';
  }
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
addEventListener('resize', measure);
new ResizeObserver(measure).observe($('main'));
document.fonts.ready.then(measure);
measure();
