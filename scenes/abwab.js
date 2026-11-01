(() => {
// abwab: «a thousand doors, each door opening a thousand» (al-Khisal). One unbroken forward flight, no cuts.
// World in metres: x right, y up, z forward. The camera never rotates, so every frontal plane (walls, frames) maps
// affinely and is drawn as vector paths in its own metres; swinging leaves are textured in thin perspective strips.
// Painter's order runs through the apertures: a stage draws what lies behind its exit wall, then the next stage clipped
// to the exit openings, then its leaves, its wall with holes, and what stands in front.
// 0 night facade, door at z=0 · 1 a court of light, a free-standing portal at z=24 · 2 a corridor of doors, end door z=64
// · 3 a hall, a wall of 10×10 doors at z=110 · 4 a colossal arch built of exactly 1000 doors at z=330 · 5 a starfield.
const ZW = [0, 24, 64, 110, 330];
const DOOR = [
  { hw: 1.6, sp: 4.4, ap: 6.4, cells: 2, tex: 2048 },
  { hw: 1.2, sp: 3.1, ap: 4.5, cells: 3, tex: 1536 },
  { hw: 1.0, sp: 2.6, ap: 3.7, cells: 4, tex: 1024 },
  { hw: .55, sp: 1.3, ap: 1.9, cells: 5, tex: 1024 },
  { hw: 1.1, sp: 2.65, ap: 3.8, cells: 7, tex: 1024 },
  { hw: .72, sp: 2.2, ap: 3.05, cells: 3, tex: 768 }, // the corridor's side doors
];
const CWD = 2, CHT = 4, SIDEZ = [30, 38, 46, 54], RIBZ = [26, 34, 42, 50, 58];
const GX = 1.5, GY = 2.4, GN = 10, GT = [5, 1]; // the grid: 10 × 10 over a polished floor; the camera enters door (5, 1)
const gX = (i) => (i - 4.5) * GX, gY = (j) => .65 + (j - 1) * GY, HFLOOR = gY(0) - .85;
// the lattice: a colossal pointed arch built of exactly 1000 doors (40 columns; 13 full rows, then the arch narrows)
const LXs = 3.4, LYs = 4.8, LT = [20, 10];
const lX = (i) => (i - 19.5) * LXs, lY = (j) => -.6 + (j - 10) * LYs;
const LFLOOR = lY(0) - .5, LHW = 68, LYS = LFLOOR + 13 * LYs, LA = 83.355;
const lArch = (ax) => { const r = (LHW * LHW + LA * LA) / (2 * LHW); return ax > LHW + 1e-9 ? -1e9 : LYS + Math.sqrt(Math.max(0, r * r - (LHW - r - ax) ** 2)); };
const LCELL = []; for (let i = 0; i < 40; i++) for (let j = 0; j < 40; j++) { const top = LFLOOR + (j + 1) * LYs; if (top <= LYS + 1e-6 || top <= lArch(Math.abs(lX(i)) + LXs / 2)) LCELL.push([i, j]); }
const GCELL = []; for (let i = 0; i < GN; i++) for (let j = 0; j < GN; j++) GCELL.push([i, j]);

// ---------- the camera: monotone cubic through keys [p, ez, ex, ey] ----------
const KEYS = [
  [-.06, -18.6, 0, 1.6], [0, -18, 0, 1.6], [.08, -14.6, 0, 1.6], [.155, -10.6, 0, 1.6], [.2, -2.6, 0, 1.6], [.218, 2.5, 0, 1.6],
  [.25, 12, 0, 1.6], [.305, 16.8, 0, 1.6], [.335, 22.4, 0, 1.6], [.35, 26.5, 0, 1.6],
  [.435, 52.5, 0, 1.6], [.495, 56.2, 0, 1.6], [.515, 63, 0, 1.6], [.53, 66.8, 0, 1.6],
  [.6, 72.5, .35, 1.6], [.645, 103, .75, 1.6], [.665, 112, .75, 1.6], [.7, 130, 1.25, 1.6],
  [.79, 240, 1.7, 1.6], [.83, 316, 1.7, 1.6], [.85, 335, 1.7, 1.6], [.93, 380, 1.7, 1.6], [1.06, 422, 1.7, 1.6],
];
function mono(col) {
  const X = KEYS.map((k) => k[0]), Y = KEYS.map((k) => k[col]), n = X.length, d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((Y[i + 1] - Y[i]) / (X[i + 1] - X[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) { m[i] = 0; continue; }
    const h0 = X[i] - X[i - 1], h1 = X[i + 1] - X[i], w1 = 2 * h1 + h0, w2 = h1 + 2 * h0;
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  }
  return (x) => {
    if (x <= X[0]) return Y[0]; if (x >= X[n - 1]) return Y[n - 1];
    let i = 0; while (x > X[i + 1]) i++;
    const h = X[i + 1] - X[i], s = (x - X[i]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * Y[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * Y[i + 1] + (s3 - s2) * h * m[i + 1];
  };
}
const camZ = mono(1), camX = mono(2), camY = mono(3);

// ---------- door timings (all from p, or from the camera's z, which is a function of p) ----------
const MAXA = 1.38;
const open0 = (p) => ease.io(seg(p, .085, .16));
const open1 = (p) => ease.io(seg(p, .255, .31));
const openS = (ez, z) => ease.io(seg(ez, z - 13, z - 6.5));
const open2 = (p) => ease.io(seg(p, .445, .5));
const gD = (i, j) => Math.hypot(i - GT[0], (j - GT[1]) * 1.3) / 10.5;
const lD = (i, j) => Math.hypot(i - LT[0], (j - LT[1]) * 1.4) / 24;
const openG = (p, i, j) => ease.io(seg(p, .535 + .075 * gD(i, j), .562 + .075 * gD(i, j)));
const openL = (p, i, j) => ease.io(seg(p, .705 + .08 * lD(i, j), .727 + .08 * lD(i, j)));
function count(p) {
  if (p > .86) return Math.round(1000 * 1000 ** smooth(seg(p, .86, .925)));
  const ez = camZ(p);
  let n = (open0(p) > .12) + (open1(p) > .12);
  SIDEZ.forEach((z) => { if (openS(ez, z) > .12) n += 2; });
  let g = 0; for (let i = 0; i < GN; i++) for (let j = 0; j < GN; j++) if (openG(p, i, j) > .12) g++;
  let l = 0; if (p > .7) LCELL.forEach(([i, j]) => { if (openL(p, i, j) > .12) l++; });
  return n + Math.round(90 * g / 100) + Math.round(900 * l / 1000);
}
const fmt = (n) => arNum(n.toLocaleString('en-US')).replace(/,/g, '٬');

// ---------- geometry helpers ----------
const archY = (D, ax) => { const a = D.ap - D.sp, r = (D.hw * D.hw + a * a) / (2 * D.hw), q = D.hw - r - ax; return D.sp + Math.sqrt(Math.max(0, r * r - q * q)); };
function archPts(D, n = 10, grow = 0) { // the opening outline, bottom-left, up and over the pointed top, bottom-right
  const E = grow ? { hw: D.hw + grow, sp: D.sp, ap: D.ap + grow * 1.15 } : D;
  const a = E.ap - E.sp, r = (E.hw * E.hw + a * a) / (2 * E.hw), th = Math.atan2(a, E.hw - r), out = [[-E.hw, 0], [-E.hw, E.sp]];
  for (let i = 1; i <= n; i++) { const q = Math.PI + (th - Math.PI) * i / n; out.push([-E.hw + r + r * Math.cos(q), E.sp + r * Math.sin(q)]); }
  for (let i = n - 1; i >= 1; i--) { const q = Math.PI + (th - Math.PI) * i / n; out.push([E.hw - r - r * Math.cos(q), E.sp + r * Math.sin(q)]); }
  out.push([E.hw, E.sp], [E.hw, 0]);
  return out;
}
const addPoly = (path, pts, dx = 0, dy = 0) => { pts.forEach(([x, y], i) => (i ? path.lineTo(x + dx, y + dy) : path.moveTo(x + dx, y + dy))); path.closePath(); return path; };
const canvas = (w, h = w) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
function mips(cv, min = 20) { const out = [cv]; let cur = cv; while (cur.height > min * 2) { const nx = canvas(cur.width / 2, cur.height / 2), g = nx.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(cur, 0, 0, nx.width, nx.height); out.push(nx); cur = nx; } return out; }
const pickMip = (chain, hDev) => { let i = 0; while (i < chain.length - 1 && chain[i + 1].height >= hDev * .85) i++; return i; };
// the 8-fold star-and-cross strapwork on a square grid of cell cs (centre lines), and the star centres
function girih(x0, y0, cs, nx, ny, path = new Path2D()) {
  const h = .28 * cs, d = h * Math.SQRT2, stars = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const cx = x0 + (i + .5) * cs, cy = y0 + (j + .5) * cs; stars.push([cx, cy]);
    path.rect(cx - h, cy - h, 2 * h, 2 * h);
    path.moveTo(cx + d, cy); path.lineTo(cx, cy + d); path.lineTo(cx - d, cy); path.lineTo(cx, cy - d); path.closePath();
    path.moveTo(cx + d, cy); path.lineTo(cx + cs / 2, cy); path.moveTo(cx - d, cy); path.lineTo(cx - cs / 2, cy);
    path.moveTo(cx, cy + d); path.lineTo(cx, cy + cs / 2); path.moveTo(cx, cy - d); path.lineTo(cx, cy - cs / 2);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sy]) => { path.moveTo(cx + sx * h, cy + sy * h); path.lineTo(cx + sx * cs / 2, cy + sy * cs / 2); });
  }
  return { path, stars };
}
// carve strapwork: a groove shadow, the raised strap, a thin highlight (all widths relative to the cell)
function carve(g, gp, cs, strap, lite, shadow = 'rgba(10,5,2,.75)') {
  g.lineJoin = 'miter'; g.lineCap = 'butt';
  g.save(); g.translate(cs * .03, cs * .03); g.strokeStyle = shadow; g.lineWidth = cs * .15; g.stroke(gp); g.restore();
  g.strokeStyle = strap; g.lineWidth = cs * .1; g.stroke(gp);
  g.save(); g.translate(-cs * .018, -cs * .018); g.strokeStyle = lite; g.lineWidth = cs * .022; g.stroke(gp); g.restore();
}
function star8(g, x, y, r, fill) { g.fillStyle = fill; g.beginPath(); for (let i = 0; i < 16; i++) { const q = i * Math.PI / 8 + Math.PI / 8, rr = i % 2 ? r * .45 : r; g.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr); } g.closePath(); g.fill(); }
const STUD = (() => { const cv = canvas(64), g = cv.getContext('2d'); g.fillStyle = 'rgba(0,0,0,.55)'; g.beginPath(); g.arc(36, 37, 24, 0, TAU); g.fill(); const gr = g.createRadialGradient(24, 23, 2, 32, 32, 26); gr.addColorStop(0, '#fff1c4'); gr.addColorStop(.25, '#e3c06a'); gr.addColorStop(.7, '#8a6a2c'); gr.addColorStop(1, '#3a2a10'); g.fillStyle = gr; g.beginPath(); g.arc(32, 32, 24, 0, TAU); g.fill(); return cv; })();
const glowSprite = (r, g2, b) => { const cv = canvas(128), g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, `rgba(${r},${g2},${b},1)`); gr.addColorStop(.18, `rgba(${r},${g2},${b},.55)`); gr.addColorStop(.5, `rgba(${r},${g2},${b},.14)`); gr.addColorStop(1, `rgba(${r},${g2},${b},0)`); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return cv; };
const GLOW = glowSprite(255, 214, 140), WHITE = glowSprite(255, 246, 222);

// ---------- textures ----------
// one leaf: x = 0 at the hinge (outer jamb) → W at the meeting stile; the top follows half the pointed arch
function bakeLeaf(D, seed) {
  const H = D.tex, s = H / D.ap, W = Math.ceil(D.hw * s), cv = canvas(W, H), g = cv.getContext('2d'), R = rng(seed), u1 = H / 1024;
  const topV = (u) => (D.ap - archY(D, Math.max(0, D.hw - u / s))) * s;
  const out = new Path2D(); out.moveTo(0, H); for (let i = 0; i <= 40; i++) out.lineTo(W * i / 40, topV(W * i / 40)); out.lineTo(W, H); out.closePath();
  g.save(); g.clip(out);
  for (let x = 0; x < W; x += .17 * s) { // cedar boards with grain
    const k = R() * 14; g.fillStyle = `rgb(${70 + k},${43 + k * .6},${24 + k * .3})`; g.fillRect(x, 0, .17 * s + 1, H);
    g.strokeStyle = 'rgba(22,11,4,.28)'; g.lineWidth = Math.max(.6, .8 * u1);
    for (let l = 0; l < 9; l++) { const gx = x + R() * .17 * s, w = 1.5 + R() * 3; g.beginPath(); g.moveTo(gx, 0); for (let y = 0; y <= H; y += 40 * u1) g.lineTo(gx + Math.sin(y / (90 * u1) + l * 2 + x) * w * u1, y); g.stroke(); }
    g.fillStyle = 'rgba(12,6,2,.5)'; g.fillRect(x, 0, Math.max(1, 1.5 * u1), H);
  }
  const bb = .1 * s, ix0 = bb * 1.7, ix1 = W - bb * 1.5, ya = topV(0) + .32 * s, yb = H - bb * 1.7, ym = H - Math.min(1.25, D.ap * .26) * s;
  const panel = (y0, y1) => {
    const pw = ix1 - ix0, cs = pw / D.cells, ny = Math.max(1, Math.floor((y1 - y0) / cs)), oy = y0 + (y1 - y0 - ny * cs) / 2;
    g.fillStyle = 'rgba(16,8,3,.55)'; g.fillRect(ix0, y0, pw, y1 - y0);
    g.save(); g.beginPath(); g.rect(ix0, y0, pw, y1 - y0); g.clip();
    const gp = girih(ix0, oy, cs, D.cells, ny);
    if (oy > y0 + 2) { girih(ix0, oy - cs, cs, D.cells, 1, gp.path); girih(ix0, oy + ny * cs, cs, D.cells, 1, gp.path); }
    carve(g, gp.path, cs, '#8a5a30', 'rgba(255,214,150,.45)');
    gp.stars.forEach(([x, y]) => { if (D.cells <= 3) star8(g, x, y, cs * .17, '#c9a54e'); g.drawImage(STUD, x - cs * .045, y - cs * .045, cs * .09, cs * .09); });
    g.restore();
    g.strokeStyle = 'rgba(8,4,1,.8)'; g.lineWidth = 2.5 * u1; g.strokeRect(ix0, y0, pw, y1 - y0);
    g.strokeStyle = 'rgba(214,160,96,.35)'; g.lineWidth = 1.2 * u1; g.strokeRect(ix0 - 2 * u1, y0 - 2 * u1, pw + 4 * u1, y1 - y0 + 4 * u1);
  };
  panel(ya + bb * .9, ym - bb * .6); panel(ym + bb * .6, yb);
  // the arch panel: rays fanning from the meeting stile
  g.save(); g.beginPath(); g.moveTo(ix0, ya - bb * .3); for (let i = 0; i <= 30; i++) { const u = ix0 + (W - ix0) * i / 30; g.lineTo(u, topV(u) + bb * 1.4); } g.lineTo(W, ya - bb * .3); g.closePath(); g.clip();
  g.fillStyle = 'rgba(16,8,3,.5)'; g.fillRect(0, 0, W, ya);
  const fan = new Path2D(); for (let i = 0; i < 9; i++) { const q = Math.PI + (i + .5) / 9 * Math.PI / 2; fan.moveTo(W, ya); fan.lineTo(W + Math.cos(q) * W * 1.6, ya + Math.sin(q) * W * 1.6); }
  carve(g, fan, W / 5, '#8a5a30', 'rgba(255,214,150,.4)');
  g.restore();
  // the frame band along the outline, the rails, and brass studs
  g.lineJoin = 'round'; g.strokeStyle = 'rgba(8,4,1,.85)'; g.lineWidth = bb * 2 + 5 * u1; g.stroke(out);
  g.strokeStyle = '#6a4222'; g.lineWidth = bb * 2; g.stroke(out);
  g.fillStyle = '#6a4222'; g.fillRect(0, ym - bb * .6, W, bb * 1.2); g.fillRect(0, ya - bb * .3, W, bb * 1.2);
  g.fillStyle = 'rgba(8,4,1,.7)'; [ym - bb * .6, ym + bb * .6, ya - bb * .3, ya + bb * .9].forEach((y) => g.fillRect(0, y - u1, W, 2 * u1));
  const sr = Math.max(2, bb * .3), studAt = (x, y) => g.drawImage(STUD, x - sr, y - sr, sr * 2, sr * 2), sp = .2 * s;
  for (let y = topV(0) + sp * .6; y < H - sp * .3; y += sp) { studAt(bb * .5, y); studAt(W - bb * .5, y); }
  for (let x = bb * 1.6; x < W - bb; x += sp) { studAt(x, H - bb * .5); studAt(x, ym); studAt(x, ya + bb * .3); }
  for (let i = 1; i < 12; i++) { const u = W * i / 12, v = topV(u); studAt(u, v + bb * .55); }
  if (D.cells <= 4) { // the knocker: a brass ring on a rosette plate at the meeting stile
    const kx = W - .2 * s, ky = ym - .55 * s, kr = .12 * s;
    star8(g, kx, ky, kr * .9, '#7a5a22'); g.drawImage(STUD, kx - kr * .35, ky - kr * .35, kr * .7, kr * .7);
    g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = kr * .22; g.beginPath(); g.arc(kx + kr * .1, ky + kr * 1.1, kr, 0, TAU); g.stroke();
    const rg = g.createLinearGradient(kx - kr, 0, kx + kr, 0); rg.addColorStop(0, '#f3d98f'); rg.addColorStop(.5, '#a07a30'); rg.addColorStop(1, '#5a4018');
    g.strokeStyle = rg; g.lineWidth = kr * .18; g.beginPath(); g.arc(kx, ky + kr, kr, 0, TAU); g.stroke();
  }
  const sh = g.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, 'rgba(255,220,170,.06)'); sh.addColorStop(.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.28)');
  g.fillStyle = sh; g.fillRect(0, 0, W, H);
  const sx = g.createLinearGradient(0, 0, W, 0); sx.addColorStop(0, 'rgba(0,0,0,.25)'); sx.addColorStop(.15, 'rgba(0,0,0,0)'); sx.addColorStop(1, 'rgba(0,0,0,.1)');
  g.fillStyle = sx; g.fillRect(0, 0, W, H);
  g.restore();
  g.strokeStyle = 'rgba(6,3,1,.9)'; g.lineWidth = 2 * u1; g.stroke(out);
  const dk = canvas(W, H), dg = dk.getContext('2d'); dg.fillStyle = '#070302'; dg.fill(out);
  return { tex: mips(cv), dark: mips(dk), D };
}
// small doors (grid, lattice): both leaves seen near-frontally, K swing states, a mip chain each
const KS = 12;
function bakeSprites(L) {
  const D = L.D, out = [];
  for (let k = 0; k < KS; k++) {
    const ang = MAXA * k / (KS - 1), H = 256, s = H / D.ap, W = Math.ceil(2 * D.hw * s), cv = canvas(W, H), g = cv.getContext('2d'), lw = D.hw * s * Math.cos(ang);
    const src = L.tex[pickMip(L.tex, H)], dsrc = L.dark[pickMip(L.dark, H)];
    [0, 1].forEach((side) => {
      g.save(); if (side) { g.translate(W, 0); g.scale(-1, 1); }
      const sq = 1 - .06 * Math.sin(ang); // the free edge recedes a little
      g.setTransform(side ? -1 : 1, 0, 0, 1, side ? W : 0, 0);
      for (let i = 0; i < 6; i++) { const u0 = i / 6, u1 = (i + 1) / 6, sc = 1 - (1 - sq) * (u0 + u1) / 2; g.drawImage(src, u0 * src.width, 0, (u1 - u0) * src.width + .5, src.height, u0 * lw, H * (1 - sc) / 2, (u1 - u0) * lw + .5, H * sc); g.globalAlpha = .15 + .65 * Math.sin(ang); g.drawImage(dsrc, u0 * dsrc.width, 0, (u1 - u0) * dsrc.width + .5, dsrc.height, u0 * lw, H * (1 - sc) / 2, (u1 - u0) * lw + .5, H * sc); g.globalAlpha = 1; }
      if (k) { g.fillStyle = `rgba(255,214,140,${.7 * Math.sin(ang)})`; g.fillRect(lw - 2, H * .06, 2, H * .94); }
      g.restore();
    });
    out.push(mips(cv, 8));
  }
  return out;
}
// ashlar for the night facade: 4 m tile; strapwork tiles for the grid wall and the lattice screen (one door cell each,
// drawn y-up so they line up with the plane transforms, which flip y)
function bakeStone() {
  const cv = canvas(512), g = cv.getContext('2d'), R = rng(41);
  g.fillStyle = '#6d6a6e'; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) for (let x = -R() * 90; x < 512;) {
    const w = 70 + R() * 90, k = R() * 26 - 13; g.fillStyle = `rgb(${104 + k},${100 + k},${104 + k * .8})`; g.fillRect(x + 2, y + 2, w - 4, 60);
    for (let i = 0; i < 30; i++) { g.fillStyle = R() < .5 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.05)'; g.fillRect(x + R() * w, y + R() * 64, 2 + R() * 5, 2 + R() * 4); }
    g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x + 2, y + 2, w - 4, 3);
    x += w;
  }
  return cv;
}
function bakeCell(D, cw, chh, pad, px, cells, tone) { // one wall cell: girih ground, the door's carved frame; y up
  const W = Math.round(cw * px), H = Math.round(chh * px), cv = canvas(W, H), g = cv.getContext('2d');
  g.translate(0, H); g.scale(px, -px); // metres, y up, origin at the cell's bottom-left
  g.fillStyle = tone[0]; g.fillRect(0, 0, cw, chh);
  const cs = cw / cells, gp = girih(0, 0, cs, cells, Math.ceil(chh / cs) + 1);
  carve(g, gp.path, cs, tone[1], tone[2], 'rgba(0,0,0,.6)');
  gp.stars.forEach(([x, y]) => star8(g, x, y, cs * .12, tone[3]));
  const o = archPts(D, 12, D.hw * .32).map(([x, y]) => [x + cw / 2, y + pad - .08]);
  g.fillStyle = tone[0]; g.fill(addPoly(new Path2D(), o)); // the frame band clears the ground
  const inn = archPts(D, 12).map(([x, y]) => [x + cw / 2, y + pad]);
  for (let i = 0; i < o.length - 1; i++) { // voussoirs, alternating
    g.fillStyle = i % 2 ? tone[1] : tone[4]; g.beginPath(); g.moveTo(...o[i]); g.lineTo(...o[i + 1]); g.lineTo(...inn[i + 1]); g.lineTo(...inn[i]); g.closePath(); g.fill();
  }
  g.strokeStyle = tone[2]; g.lineWidth = 1.4 / px; g.stroke(addPoly(new Path2D(), o)); g.stroke(addPoly(new Path2D(), inn));
  return cv;
}
function bakeLantern() { // a pierced brass lantern, lit from within; 64 × 128, hung from its top centre
  const cv = canvas(64, 128), g = cv.getContext('2d');
  const body = new Path2D(); body.moveTo(32, 18); body.lineTo(50, 40); body.lineTo(46, 92); body.lineTo(32, 104); body.lineTo(18, 92); body.lineTo(14, 40); body.closePath();
  const gl = g.createRadialGradient(32, 64, 2, 32, 64, 34); gl.addColorStop(0, '#fff3c8'); gl.addColorStop(.5, '#f0b860'); gl.addColorStop(1, '#a8602a');
  g.fillStyle = gl; g.fill(body);
  g.save(); g.clip(body); g.strokeStyle = '#3a2410'; g.lineWidth = 3;
  for (let y = 30; y < 104; y += 12) for (let x = 12 + (y % 24 ? 6 : 0); x < 54; x += 12) { g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + 5, y); g.lineTo(x, y + 5); g.lineTo(x - 5, y); g.closePath(); g.stroke(); }
  g.restore();
  g.strokeStyle = '#2a1a0a'; g.lineWidth = 3; g.stroke(body);
  g.fillStyle = '#3a2812'; g.beginPath(); g.moveTo(32, 2); g.lineTo(44, 20); g.lineTo(20, 20); g.closePath(); g.fill(); g.fillRect(28, 102, 8, 10);
  return cv;
}
function assets(st, name) {
  const A = st.A;
  if (A[name]) return A[name];
  if (name.startsWith('leaf')) { const i = +name.slice(4); A[name] = bakeLeaf(DOOR[i], 11 + i); }
  else if (name === 'spG') A[name] = bakeSprites(assets(st, 'leaf3'));
  else if (name === 'spL') A[name] = bakeSprites(assets(st, 'leaf4'));
  else if (name === 'stone') A[name] = bakeStone();
  else if (name === 'cellG') A[name] = bakeCell(DOOR[3], GX, GY, (GY - DOOR[3].ap) / 2, 160 / GX, 4, ['#10121e', '#2a2d48', 'rgba(160,170,230,.25)', '#8a7a4a', '#8a744a']);
  else if (name === 'cellL') A[name] = bakeCell(DOOR[4], LXs, LYs, (LYs - DOOR[4].ap) / 2, 160 / LXs, 3, ['#120c07', '#6a4820', 'rgba(255,220,150,.55)', '#e0bc62', '#2e1e0e']);
  else if (name === 'plainG') A[name] = (() => { const cv = canvas(160), g = cv.getContext('2d'); g.fillStyle = '#16192a'; g.fillRect(0, 0, 160, 160); const gp = girih(0, 0, 40, 4, 4); carve(g, gp.path, 40, '#2a2d44', 'rgba(150,160,220,.22)', 'rgba(0,0,0,.6)'); return cv; })();
  else if (name === 'plainL') A[name] = (() => { const cv = canvas(160), g = cv.getContext('2d'); g.fillStyle = '#100a05'; g.fillRect(0, 0, 160, 160); const gp = girih(0, 0, 40, 4, 4); carve(g, gp.path, 40, '#4a3216', 'rgba(255,214,150,.3)', 'rgba(0,0,0,.6)'); return cv; })();
  else if (name === 'lantern') A[name] = bakeLantern();
  return A[name];
}
// upcoming assets, one per frame, so no single frame stalls
const PLAN = [[-1, 'leaf0'], [-1, 'stone'], [-1, 'lantern'], [.05, 'leaf1'], [.15, 'leaf5'], [.2, 'leaf2'], [.3, 'leaf3'], [.33, 'cellG'], [.36, 'plainG'], [.39, 'spG'], [.45, 'leaf4'], [.5, 'cellL'], [.52, 'plainL'], [.55, 'spL']];
function prewarm(st, p) { for (const [a, n] of PLAN) if (p > a && !st.A[n]) { assets(st, n); return; } }

// ---------- per-frame drawing state ----------
let C, c, dpr;
const P = (x, y, z) => { const k = C.F / (z - C.ez); return [C.cx + (x - C.ex) * k, C.cy - (y - C.ey) * k]; };
function plane(z) { const k = C.F / (z - C.ez); c.setTransform(k * dpr, 0, 0, -k * dpr, (C.cx - C.ex * k) * dpr, (C.cy + C.ey * k) * dpr); return k; }
const scr = () => c.setTransform(dpr, 0, 0, dpr, 0, 0);
function clipZ(pts, zn) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], ia = a[2] >= zn, ib = b[2] >= zn;
    if (ia) out.push(a);
    if (ia !== ib) { const t = (zn - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, zn]); }
  }
  return out;
}
function poly3(pts, path = new Path2D()) {
  const q = clipZ(pts, C.ez + .04); if (q.length < 3) return path;
  q.forEach((v, i) => { const [x, y] = P(v[0], v[1], v[2]); i ? path.lineTo(x, y) : path.moveTo(x, y); }); path.closePath(); return path;
}
const rectBox = (x0, y0, x1, y1, z) => { const a = P(x0, y1, z), b = P(x1, y0, z); return [a[0], a[1], b[0], b[1]]; };
const isect = (a, b) => { const r = [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])]; return r[2] > r[0] && r[3] > r[1] ? r : null; };
const clipRect = (r) => { scr(); c.beginPath(); c.rect(r[0], r[1], r[2] - r[0], r[3] - r[1]); c.clip(); };
function glowEll(spr, x, y, rx, ry, a) { if (a <= 0 || rx < .5) return; c.globalAlpha = Math.min(1, a); c.drawImage(spr, x - rx, y - ry, 2 * rx, 2 * ry); c.globalAlpha = 1; }
function glowAt(spr, x, y, r, a) { if (a <= 0 || r < .5) return; c.globalAlpha = Math.min(1, a); c.drawImage(spr, x - r, y - r, 2 * r, 2 * r); c.globalAlpha = 1; }

// a swinging leaf in perspective strips. H0 = hinge (x, z); u0 = closed direction from the hinge; nv = swing direction
function leaf(L, H0, u0, nv, yb, ang, dark, rim) {
  const D = L.D, ca = Math.cos(ang), sa = Math.sin(ang), dir = [u0[0] * ca + nv[0] * sa, u0[1] * ca + nv[1] * sa];
  const at = (s) => [H0[0] + dir[0] * D.hw * s, H0[1] + dir[1] * D.hw * s], zn = C.ez + .05;
  const A0 = at(0), A1 = at(1); if (A0[1] < zn && A1[1] < zn) return;
  const near = A0[1] > zn ? A0 : A1, k = C.F / (near[1] - C.ez), hDev = D.ap * k * dpr;
  const mi = pickMip(L.tex, hDev), img = L.tex[mi], dimg = L.dark[mi], tw = img.width, th = img.height;
  const wpx = Math.abs(P(A0[0], yb, Math.max(zn, A0[1]))[0] - P(A1[0], yb, Math.max(zn, A1[1]))[0]);
  const n = ang < .002 ? 1 : Math.max(2, Math.min(96, Math.ceil(wpx / 3.5)));
  for (let i = 0; i < n; i++) {
    const s0 = i / n, s1 = (i + 1) / n, Q0 = at(s0), Q1 = at(s1); if (Q0[1] < zn || Q1[1] < zn) continue;
    const a = P(Q0[0], yb + D.ap, Q0[1]), cc = P(Q0[0], yb, Q0[1]), b = P(Q1[0], yb + D.ap, Q1[1]), d = P(Q1[0], yb, Q1[1]);
    const t0 = s0 * tw, t1 = s1 * tw, dw = t1 - t0;
    const Xx = ((b[0] + d[0]) - (a[0] + cc[0])) / 2 / dw, Xy = ((b[1] + d[1]) - (a[1] + cc[1])) / 2 / dw;
    const Yx = ((cc[0] + d[0]) - (a[0] + b[0])) / 2 / th, Yy = ((cc[1] + d[1]) - (a[1] + b[1])) / 2 / th;
    const ox = (a[0] + b[0] + cc[0] + d[0]) / 4 - Xx * (t0 + t1) / 2 - Yx * th / 2, oy = (a[1] + b[1] + cc[1] + d[1]) / 4 - Xy * (t0 + t1) / 2 - Yy * th / 2;
    c.setTransform(Xx * dpr, Xy * dpr, Yx * dpr, Yy * dpr, ox * dpr, oy * dpr);
    const sw = Math.min(tw - t0, dw + 1);
    c.drawImage(img, t0, 0, sw, th, t0, 0, sw, th);
    if (dark > 0) { c.globalAlpha = Math.min(1, dark); c.drawImage(dimg, t0, 0, sw, th, t0, 0, sw, th); c.globalAlpha = 1; }
  }
  if (rim > 0 && A1[1] > zn) { // the free edge catches the light beyond
    scr(); const tp = P(A1[0], yb + D.ap * .97, A1[1]), bt = P(A1[0], yb, A1[1]);
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,214,150,${Math.min(1, rim)})`; c.lineWidth = Math.max(1, .02 * C.F / (A1[1] - C.ez));
    c.beginPath(); c.moveTo(tp[0], tp[1]); c.lineTo(bt[0], bt[1]); c.stroke(); c.globalCompositeOperation = 'source-over';
  }
}
// both leaves of a frontal door centred at x0 in the plane z, swinging away from us
function pair(L, x0, yb, z, ang, dark, rim) {
  const hw = L.D.hw;
  leaf(L, [x0 - hw, z], [1, 0], [0, 1], yb, ang, dark, rim);
  leaf(L, [x0 + hw, z], [-1, 0], [0, 1], yb, ang, dark, rim);
}

// ---------- stage 0: the night facade ----------
function buildFacade() {
  const D = DOOR[0], wall = new Path2D(), top = 6.4, pt = 9.4;
  const crenel = (x0, x1, y) => { const pts = []; for (let x = x0; x < x1 - .3; x += 1.2) pts.push([x, y], [x, y + .55], [x + .15, y + .55], [x + .15, y + .75], [x + .55, y + .75], [x + .55, y + .55], [x + .7, y + .55], [x + .7, y]); return pts; };
  addPoly(wall, [[-60, 0], ...crenel(-60, -2.8, top), [-2.8, top], [-2.8, pt], ...crenel(-2.6, 2.8, pt), [2.8, pt], [2.8, top], ...crenel(2.95, 60, top), [60, top], [60, 0]]);
  addPoly(wall, archPts(D, 14));
  const orn = { band: new Path2D(), vous: [new Path2D(), new Path2D()], spand: new Path2D(), cols: new Path2D(), arc: new Path2D(), lines: new Path2D() };
  orn.band.rect(-2.45, 0, 4.9, 7.75); orn.band.rect(-2.05, 0, 4.1, 7.35);
  const o = archPts(D, 15, .42), inn = archPts(D, 15);
  for (let i = 1; i < o.length - 2; i++) addPoly(orn.vous[i % 2], [o[i], o[i + 1], inn[i + 1], inn[i]]);
  orn.spand.rect(-2.05, D.sp - .2, 4.1, 7.35 - D.sp + .2); addPoly(orn.spand, o);
  [-1, 1].forEach((sd) => { orn.cols.rect(sd > 0 ? 1.6 : -1.78, 0, .18, D.sp - .3); orn.cols.rect(sd > 0 ? 1.55 : -1.83, D.sp - .34, .28, .2); orn.cols.rect(sd > 0 ? 1.55 : -1.83, 0, .28, .25); });
  for (let x = -2.3; x < 2.3; x += .46) { orn.arc.moveTo(x, 7.95); orn.arc.lineTo(x, 8.45); orn.arc.quadraticCurveTo(x + .23, 8.85, x + .46, 8.45); }
  orn.lines.rect(-2.45, 7.85, 4.9, 1.1);
  const strip = girih(-2.45, 0, .4, 1, 20, new Path2D()); girih(2.05, 0, .4, 1, 20, strip.path); girih(-2.05, 7.35, .4, 11, 1, strip.path);
  const sg = girih(-2.21, D.sp - .2, .34, 13, 9);
  return { wall, orn, strip: strip.path, sgir: sg.path };
}
function s0back(st, t, p) {
  scr();
  const { W, H, cy } = C, op = open0(p);
  const sky = c.createLinearGradient(0, 0, 0, cy + 4);
  sky.addColorStop(0, '#03050c'); sky.addColorStop(.5, '#0a1024'); sky.addColorStop(1, '#1e2444');
  c.fillStyle = sky; c.fillRect(0, 0, W, cy + 4);
  c.fillStyle = '#efe6cf';
  st.stars.forEach(([u, v, b, s]) => { c.globalAlpha = b * (.75 + .25 * Math.sin(t * 1.6 + u * 97)); c.fillRect(u * W, v * cy, s, s); });
  c.globalAlpha = 1;
  const m = [W * .18, H * .13]; glowAt(WHITE, m[0], m[1], H * .5, .07); glowAt(WHITE, m[0], m[1], H * .04, .5);
  c.fillStyle = '#e9e2cc'; c.beginPath(); c.arc(m[0], m[1], H * .016, 0, TAU); c.fill();
  c.fillStyle = '#0a1024'; c.beginPath(); c.arc(m[0] + H * .007, m[1] - H * .004, H * .014, 0, TAU); c.fill();
  // the court's light, rising behind the wall
  const g0 = P(0, 7, 30);
  c.globalCompositeOperation = 'lighter';
  glowAt(GLOW, g0[0], P(0, 6.4, 0)[1], W * .42, .16 + .5 * op);
  c.globalCompositeOperation = 'source-over';
  // the city beyond the wall: domes, a minaret, palms, in haze
  st.city.forEach(({ x, z, path, col }) => { if (z - C.ez < .5) return; const k = plane(z); c.fillStyle = col; c.translate(x, 0); c.fill(path); });
  scr();
  // the ground: packed earth and worn paving
  const yb = P(0, 0, 0)[1];
  const gr = c.createLinearGradient(0, yb, 0, H); gr.addColorStop(0, '#24232a'); gr.addColorStop(1, '#0c0c10');
  c.fillStyle = gr; c.fillRect(0, yb, W, H - yb);
  c.strokeStyle = 'rgba(150,140,130,.09)'; c.lineWidth = 1; c.beginPath();
  for (let i = 1; i < 40; i++) { const z = -.8 * i; if (z - C.ez < .3) break; const y = P(0, 0, z)[1]; c.moveTo(0, y); c.lineTo(W, y); }
  for (let i = -30; i <= 30; i++) { const z1 = Math.max(C.ez + .3, -40), a = P(i * .8, 0, 0), b = P(i * .8, 0, z1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
}
function s0front(st, t, p) {
  const D = DOOR[0], op = open0(p), ang = MAXA * op, L = assets(st, 'leaf0');
  pair(L, 0, 0, ZW[0], ang, .3 + .55 * Math.sin(ang), .9 * Math.sin(ang));
  const F = st.fac, k = plane(ZW[0]), px = 1 / k;
  const pat = c.createPattern(assets(st, 'stone'), 'repeat'); pat.setTransform(new DOMMatrix().scale(4 / 512));
  c.fillStyle = pat; c.fill(F.wall, 'evenodd');
  c.save(); c.clip(F.wall, 'evenodd');
  c.fillStyle = 'rgba(122,118,112,.55)'; c.fill(F.orn.band, 'evenodd'); c.fill(F.orn.lines);
  c.fillStyle = 'rgba(18,16,22,.55)'; c.save(); c.clip(F.orn.spand, 'evenodd'); c.fillRect(-3, 0, 6, 9); carve(c, F.sgir, .34, 'rgba(150,140,128,.7)', 'rgba(255,240,210,.2)'); c.restore();
  c.save(); c.clip(F.orn.band, 'evenodd'); carve(c, F.strip, .4, 'rgba(70,64,62,.8)', 'rgba(255,240,210,.15)'); c.restore();
  c.fillStyle = '#9a8a76'; c.fill(F.orn.vous[0]); c.fillStyle = '#3c3434'; c.fill(F.orn.vous[1]);
  c.fillStyle = '#8c8682'; c.fill(F.orn.cols);
  c.strokeStyle = 'rgba(20,16,20,.7)'; c.lineWidth = 2 * px; c.stroke(F.orn.arc); c.strokeRect(-2.45, 0, 4.9, 7.75); c.strokeRect(-2.05, 0, 4.1, 7.35);
  // night, then lamplight and the light of the open door
  const nt = c.createLinearGradient(0, 10, 0, 0); nt.addColorStop(0, 'rgba(10,14,32,.5)'); nt.addColorStop(1, 'rgba(6,8,18,.8)');
  c.fillStyle = nt; c.fillRect(-61, 0, 122, 10);
  const ed = c.createLinearGradient(-30, 0, 30, 0); ed.addColorStop(0, 'rgba(4,5,10,.6)'); ed.addColorStop(.38, 'rgba(4,5,10,0)'); ed.addColorStop(.62, 'rgba(4,5,10,0)'); ed.addColorStop(1, 'rgba(4,5,10,.6)');
  c.fillStyle = ed; c.fillRect(-61, 0, 122, 10);
  c.globalCompositeOperation = 'lighter';
  const fl = .85 + .1 * Math.sin(t * 7.3) + .05 * Math.sin(t * 13.1);
  [-2.25, 2.25].forEach((x) => { const g = c.createRadialGradient(x, 3.8, 0, x, 3.8, 3.4); g.addColorStop(0, `rgba(255,170,80,${.32 * fl})`); g.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = g; c.fillRect(x - 3.5, 0, 7, 8); });
  if (op > 0) { const g = c.createRadialGradient(0, 2.6, 0, 0, 2.6, 9); g.addColorStop(0, `rgba(255,214,150,${.45 * op})`); g.addColorStop(1, 'rgba(255,214,150,0)'); c.fillStyle = g; c.fillRect(-10, 0, 20, 10); }
  c.globalCompositeOperation = 'source-over';
  c.restore();
  // the gap between the leaves, before they part
  if (op < .2) { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,214,150,${.75 * (1 - op * 5) * (.9 + .1 * Math.sin(t * 3))})`; c.fillRect(-1.2 * px, .05, 2.4 * px, D.ap - .2); c.fillRect(-D.hw, 0, 2 * D.hw, 1.6 * px); c.globalCompositeOperation = 'source-over'; }
  scr();
  // the step, and the light thrown out over the ground
  c.fillStyle = '#3a3638'; c.fill(poly3([[-2.3, .2, -1.1], [2.3, .2, -1.1], [2.3, .2, 0], [-2.3, .2, 0]]));
  c.fillStyle = '#1a181c'; c.fill(poly3([[-2.3, 0, -1.1], [2.3, 0, -1.1], [2.3, .2, -1.1], [-2.3, .2, -1.1]]));
  const gap = 1 - Math.cos(ang);
  if (gap > .01) {
    c.globalCompositeOperation = 'lighter';
    const sp = poly3([[-D.hw * gap, .21, 0], [D.hw * gap, .21, 0], [D.hw * gap * 2.4, 0, -9], [-D.hw * gap * 2.4, 0, -9]]);
    const y0 = P(0, 0, 0)[1], y1 = P(0, 0, -9)[1], lg = c.createLinearGradient(0, y0, 0, Math.max(y0 + 1, y1));
    lg.addColorStop(0, `rgba(255,214,150,${.55 * gap})`); lg.addColorStop(1, 'rgba(255,190,110,0)');
    c.fillStyle = lg; c.fill(sp);
    const ctr = P(0, 2.4, 0); glowAt(GLOW, ctr[0], ctr[1], C.F / (0 - C.ez) * 6, .35 * gap);
    c.globalCompositeOperation = 'source-over';
  }
  c.globalCompositeOperation = 'lighter';
  [-2.25, 2.25].forEach((x) => { const q = P(x, 0, -.9), kk = C.F / (-.9 - C.ez); glowEll(GLOW, q[0], q[1], 3.2 * kk, 3.2 * kk * (C.ey / (-.9 - C.ez)) + 4, .5); });
  c.globalCompositeOperation = 'source-over';
  // lanterns on their brackets
  const lan = assets(st, 'lantern');
  [-2.25, 2.25].forEach((x) => {
    const z = -.4, top = P(x, 4.55, z), kk = C.F / (z - C.ez), w = .38 * kk, h = .76 * kk;
    c.strokeStyle = '#120e0c'; c.lineWidth = Math.max(1, .05 * kk); c.beginPath(); const b = P(x * 1.12, 4.9, 0); c.moveTo(b[0], b[1]); c.lineTo(top[0], top[1] - .25 * kk); c.lineTo(top[0], top[1]); c.stroke();
    c.drawImage(lan, top[0] - w / 2, top[1], w, h);
    c.globalCompositeOperation = 'lighter'; glowAt(GLOW, top[0], top[1] + h * .55, h * 1.6, .6 * (.85 + .1 * Math.sin(t * 7.3 + x))); c.globalCompositeOperation = 'source-over';
  });
}

// ---------- a carved portal frame (alfiz band, voussoirs, spandrel strapwork), in its own metres ----------
function buildPortal(D, ww, hh, cell) {
  const o = archPts(D, 14, D.hw * .26), inn = archPts(D, 14), b = cell;
  const band = new Path2D(); band.rect(-ww, 0, 2 * ww, hh); band.rect(-ww + b, 0, 2 * (ww - b), hh - b);
  const vous = [new Path2D(), new Path2D()]; for (let i = 1; i < o.length - 2; i++) addPoly(vous[i % 2], [o[i], o[i + 1], inn[i + 1], inn[i]]);
  const spand = new Path2D(); spand.rect(-ww + b, D.sp - .05, 2 * (ww - b), hh - b - D.sp + .05); addPoly(spand, o);
  const nb = Math.round(hh / b), strip = girih(-ww, 0, b, 1, nb).path; girih(ww - b, 0, b, 1, nb, strip); girih(-ww + b, hh - b, b, Math.round(2 * (ww - b) / b), 1, strip);
  const sc = b * .8, sg = girih(-ww + b, D.sp - .05, sc, Math.ceil(2 * (ww - b) / sc), Math.ceil((hh - D.sp) / sc)).path;
  const outer = addPoly(new Path2D(), o), hole = addPoly(new Path2D(), inn);
  return { D, ww, hh, b, band, vous, spand, strip, sg, outer, hole };
}
// draws a portal inside the current plane transform; col = [ground, strap, lite, vous A, vous B, line]
function drawPortal(Pt, col, px) {
  c.fillStyle = col[0]; c.fill(Pt.band, 'evenodd');
  c.save(); c.clip(Pt.band, 'evenodd'); carve(c, Pt.strip, Pt.b, col[1], col[2]); c.restore();
  c.save(); c.beginPath(); c.rect(-Pt.ww, Pt.D.sp - .05, 2 * Pt.ww, Pt.hh); c.clip(); c.clip(Pt.spand, 'evenodd'); c.fillStyle = col[0]; c.fillRect(-Pt.ww, 0, 2 * Pt.ww, Pt.hh); carve(c, Pt.sg, Pt.b * .8, col[1], col[2]); c.restore();
  c.fillStyle = col[3]; c.fill(Pt.vous[0]); c.fillStyle = col[4]; c.fill(Pt.vous[1]);
  c.strokeStyle = col[5]; c.lineWidth = 1.5 * px; c.stroke(Pt.outer); c.stroke(Pt.hole);
  c.strokeRect(-Pt.ww, 0, 2 * Pt.ww, Pt.hh); c.strokeRect(-Pt.ww + Pt.b, 0, 2 * (Pt.ww - Pt.b), Pt.hh - Pt.b);
}

// ---------- stage 1: a court of light, a free-standing portal ----------
const SKY1 = [[0, '#a88c5c'], [.55, '#e2cc98'], [1, '#fff3d6']];
function s1back(st, t, p) {
  scr();
  const { W, H, cx, cy } = C;
  const sky = c.createLinearGradient(0, 0, 0, cy + 2); SKY1.forEach(([o, col]) => sky.addColorStop(o, col));
  c.fillStyle = sky; c.fillRect(0, 0, W, cy + 2);
  const sun = P(0, 2.2, 1e5);
  c.globalCompositeOperation = 'lighter'; glowAt(WHITE, sun[0], sun[1], H * 1.1, .5); glowAt(WHITE, sun[0], sun[1], H * .25, .7); c.globalCompositeOperation = 'source-over';
  // far doors standing alone in the haze, nearer ones clearer
  st.far.forEach(({ x, z }) => {
    if (z - C.ez < 1) return;
    const k = plane(z), f = Math.min(1, (z - C.ez) / 260), a = .5 * (1 - f) + .06;
    c.fillStyle = `rgba(${mix(120, 236, f) | 0},${mix(96, 214, f) | 0},${mix(62, 168, f) | 0},${a})`; c.translate(x, 0); c.fill(st.farPath, 'evenodd');
  });
  scr();
  const fl = c.createLinearGradient(0, cy, 0, H); fl.addColorStop(0, '#fbefd2'); fl.addColorStop(.25, '#e8d4a6'); fl.addColorStop(1, '#a88a5a');
  c.fillStyle = fl; c.fillRect(0, cy, W, H - cy);
  c.strokeStyle = 'rgba(120,92,52,.22)'; c.lineWidth = 1; c.beginPath();
  for (let i = 0; i < 80; i++) { const z = Math.max(0, Math.ceil(C.ez / 1.5)) * 1.5 + i * 1.5; if (z - C.ez < .3) continue; const y = P(0, 0, z)[1]; if (y - cy < 2) break; c.moveTo(0, y); c.lineTo(W, y); }
  for (let i = -40; i <= 40; i++) { const a = P(i * 1.5, 0, Math.max(C.ez + .3, 0)), b = P(i * 1.5, 0, 400); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  // a long rill of still water toward the portal, holding the sky
  const rl = poly3([[-.32, .001, 1.5], [.32, .001, 1.5], [.32, .001, 22.5], [-.32, .001, 22.5]]);
  const r0 = P(0, 0, Math.max(C.ez + .3, 1.5))[1], r1 = P(0, 0, 22.5)[1], rg = c.createLinearGradient(0, r0, 0, r1);
  rg.addColorStop(0, '#8a7a5a'); rg.addColorStop(1, '#fff6dc'); c.fillStyle = rg; c.fill(rl);
  c.strokeStyle = 'rgba(90,66,36,.5)'; c.lineWidth = 1.5; c.stroke(rl);
}
function s1front(st, t, p) {
  const D = DOOR[1], op = open1(p), ang = MAXA * op, z = ZW[1];
  // the portal's long shadow toward us, the sun being behind it; light through the open door
  scr();
  const y0 = P(0, 0, z)[1], y1 = P(0, 0, Math.max(C.ez + .3, 8))[1], sg = c.createLinearGradient(0, y0, 0, Math.max(y0 + 1, y1));
  sg.addColorStop(0, 'rgba(70,50,24,.42)'); sg.addColorStop(1, 'rgba(70,50,24,0)');
  c.fillStyle = sg; c.fill(poly3([[-1.95, 0, z], [1.95, 0, z], [2.7, 0, 8], [-2.7, 0, 8]]));
  const gap = 1 - Math.cos(ang);
  if (gap > .01) { c.globalCompositeOperation = 'lighter'; const lg = c.createLinearGradient(0, y0, 0, Math.max(y0 + 1, y1)); lg.addColorStop(0, `rgba(255,236,190,${.6 * gap})`); lg.addColorStop(1, 'rgba(255,236,190,0)'); c.fillStyle = lg; c.fill(poly3([[-D.hw * gap, 0, z], [D.hw * gap, 0, z], [D.hw * gap * 1.5, 0, 8], [-D.hw * gap * 1.5, 0, 8]])); c.globalCompositeOperation = 'source-over'; }
  pair(assets(st, 'leaf1'), 0, 0, z, ang, .5 + .4 * Math.sin(ang), .9 * Math.sin(ang));
  const k = plane(z), px = 1 / k, Pt = st.port1;
  const sl = c.createLinearGradient(0, 7.2, 0, 0); sl.addColorStop(0, '#8a6c44'); sl.addColorStop(1, '#5e4a30');
  c.fillStyle = sl; c.fill(st.slab1, 'evenodd');
  c.save(); c.clip(st.slab1, 'evenodd');
  drawPortal(Pt, ['#6a5234', 'rgba(150,118,74,.9)', 'rgba(255,236,190,.35)', '#9a7a4e', '#4e3c26', 'rgba(40,28,14,.6)'], px);
  c.restore();
  c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,240,200,.75)'; c.lineWidth = 2.2 * px; c.beginPath(); c.moveTo(-1.95, 0); c.lineTo(-1.95, 6.7); c.lineTo(1.95, 6.7); c.lineTo(1.95, 0); c.stroke(); c.globalCompositeOperation = 'source-over';
  // haze between us and the portal
  c.fillStyle = `rgba(255,240,206,${.1 * c01((z - C.ez) / 24)})`; c.fill(st.slab1, 'evenodd');
  // motes drifting in the light
  scr(); c.globalCompositeOperation = 'lighter'; c.fillStyle = '#fff4d8';
  st.motes.forEach(([x, y, zz, ph]) => { const zm = zz + 0; if (zm - C.ez < .4 || zm > z) return; const q = P(x + .3 * Math.sin(t * .3 + ph), y + .2 * Math.sin(t * .23 + ph * 2), zm), s = Math.min(4, 30 / (zm - C.ez)); c.globalAlpha = .35; c.fillRect(q[0], q[1], s, s); });
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}

// ---------- stage 2: the corridor of doors ----------
const VAULT = Array.from({ length: 11 }, (_, i) => { const a = Math.PI * i / 10; return [CWD * Math.cos(a), CHT + CWD * Math.sin(a)]; });
const sideOutline = (sd, zc, grow = 0) => archPts(DOOR[5], 10, grow).map(([u, y]) => [sd * CWD, y, zc + u * sd]);
function buildCorridor() {
  const sect = (w) => [[-w, 0], [w, 0], [w, CHT], ...Array.from({ length: 15 }, (_, i) => { const a = Math.PI * (i + 1) / 16; return [w * Math.cos(a), CHT + w * Math.sin(a)]; }), [-w, CHT]];
  const outer = sect(CWD), inner = sect(1.78), endWall = addPoly(new Path2D(), outer); addPoly(endWall, archPts(DOOR[2], 14));
  const rib = addPoly(new Path2D(), outer); addPoly(rib, inner);
  const vous = new Path2D(); for (let i = 0; i < 14; i += 2) { const a0 = Math.PI * i / 14, a1 = Math.PI * (i + 1) / 14; addPoly(vous, [[CWD * Math.cos(a0), CHT + CWD * Math.sin(a0)], [CWD * Math.cos(a1), CHT + CWD * Math.sin(a1)], [1.78 * Math.cos(a1), CHT + 1.78 * Math.sin(a1)], [1.78 * Math.cos(a0), CHT + 1.78 * Math.sin(a0)]]); }
  return { inner, endWall, rib, vous, portal: buildPortal(DOOR[2], 1.62, 4.62, .17) };
}
function s2front(st, t, p) {
  const z0 = ZW[1], z1 = ZW[2], ez = C.ez, { W, H, cx, cy } = C, K = st.cor;
  // the end wall and its door
  const ang2 = MAXA * open2(p);
  pair(assets(st, 'leaf2'), 0, 0, z1, ang2, .35 + .5 * Math.sin(ang2), .9 * Math.sin(ang2));
  let k = plane(z1), px = 1 / k;
  c.fillStyle = '#4a3a28'; c.fill(K.endWall, 'evenodd');
  c.save(); c.clip(K.endWall, 'evenodd');
  drawPortal(K.portal, ['#3e3022', 'rgba(140,104,64,.95)', 'rgba(255,214,150,.3)', '#8a6a44', '#3a2c1c', 'rgba(20,12,6,.7)'], px);
  if (ang2 > 0) { c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, 1.8, 0, 0, 1.8, 4); g.addColorStop(0, `rgba(170,190,255,${.25 * Math.sin(ang2)})`); g.addColorStop(1, 'rgba(170,190,255,0)'); c.fillStyle = g; c.fillRect(-2, 0, 4, 6); c.globalCompositeOperation = 'source-over'; }
  c.restore();
  scr();
  // side rooms: light behind the openings, the leaves swinging into it
  const L5 = assets(st, 'leaf5'), D5 = DOOR[5];
  SIDEZ.forEach((zc) => {
    if (zc + D5.hw < ez + .1) return;
    const o = openS(ez, zc), a = MAXA * o;
    [-1, 1].forEach((sd) => {
      if (o > 0) {
        const op = poly3(sideOutline(sd, zc)), q = P(sd * (CWD + 1), 1.4, zc), r = 3 * C.F / Math.max(.3, zc - ez);
        const g = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], r); g.addColorStop(0, '#fff1c8'); g.addColorStop(.5, '#f0c070'); g.addColorStop(1, '#a06030');
        c.fillStyle = g; c.fill(op);
      }
      leaf(L5, [sd * CWD, zc - D5.hw], [0, 1], [sd, 0], 0, a, .25 + .55 * Math.sin(a), .8 * Math.sin(a));
      leaf(L5, [sd * CWD, zc + D5.hw], [0, -1], [sd, 0], 0, a, .25 + .55 * Math.sin(a), .8 * Math.sin(a));
      scr();
    });
  });
  // walls, floor, vault
  const near = Math.max(z0, ez + .05);
  [-1, 1].forEach((sd) => {
    const wp = poly3([[sd * CWD, 0, z0], [sd * CWD, 0, z1], [sd * CWD, CHT, z1], [sd * CWD, CHT, z0]]);
    const dado = poly3([[sd * CWD, 0, z0], [sd * CWD, 0, z1], [sd * CWD, 1.1, z1], [sd * CWD, 1.1, z0]]);
    SIDEZ.forEach((zc) => { if (zc + D5.hw > ez + .05) poly3(sideOutline(sd, zc), wp); });
    const g = c.createLinearGradient(sd < 0 ? 0 : W, 0, cx, 0); g.addColorStop(0, '#2c2014'); g.addColorStop(.7, '#5a4430'); g.addColorStop(1, '#7a5e40');
    c.fillStyle = g; c.fill(wp, 'evenodd');
    c.save(); c.clip(wp, 'evenodd'); c.fillStyle = 'rgba(22,30,26,.7)'; c.fill(dado); c.restore();
    c.fillStyle = 'rgba(16,10,6,.5)'; c.fill(poly3([[sd * CWD, 3.55, z0], [sd * CWD, 3.55, z1], [sd * CWD, 3.75, z1], [sd * CWD, 3.75, z0]]));
    c.strokeStyle = 'rgba(201,165,78,.35)'; c.lineWidth = 1; const l0 = P(sd * CWD, 1.1, near), l1 = P(sd * CWD, 1.1, z1); c.beginPath(); c.moveTo(l0[0], l0[1]); c.lineTo(l1[0], l1[1]); c.stroke();
    SIDEZ.forEach((zc) => { // the frames of the side doors
      if (zc + D5.hw < ez + .1) return;
      const fr = poly3(sideOutline(sd, zc, .17)); poly3(sideOutline(sd, zc), fr);
      c.fillStyle = '#7a5c3a'; c.fill(fr, 'evenodd'); c.strokeStyle = 'rgba(20,12,6,.7)'; c.lineWidth = 1; c.stroke(fr);
    });
  });
  const fl = poly3([[-CWD, 0, z0], [CWD, 0, z0], [CWD, 0, z1], [-CWD, 0, z1]]), fg = c.createLinearGradient(0, H, 0, cy);
  fg.addColorStop(0, '#16110c'); fg.addColorStop(.8, '#3a2c1e'); fg.addColorStop(1, '#5a4430'); c.fillStyle = fg; c.fill(fl);
  c.fillStyle = '#4a1612'; c.fill(poly3([[-.8, 0, z0 + .5], [.8, 0, z0 + .5], [.8, 0, z1 - .6], [-.8, 0, z1 - .6]]));
  c.fillStyle = 'rgba(201,165,78,.4)'; [-.68, .62].forEach((x) => c.fill(poly3([[x, 0, z0 + .7], [x + .06, 0, z0 + .7], [x + .06, 0, z1 - .8], [x, 0, z1 - .8]])));
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.beginPath();
  for (let z = Math.ceil(near); z < z1; z += 1) { const a = P(-CWD, 0, z), b = P(CWD, 0, z); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
  for (let i = 0; i < 10; i++) {
    const [xa, ya] = VAULT[i], [xb, yb] = VAULT[i + 1], f = Math.abs(i - 4.5) / 4.5;
    c.fillStyle = `rgb(${mix(40, 92, f) | 0},${mix(30, 70, f) | 0},${mix(24, 46, f) | 0})`; c.fill(poly3([[xa, ya, z0], [xb, yb, z0], [xb, yb, z1], [xa, ya, z1]]));
  }
  // transverse arches, far to near: soffit then face
  for (let r = RIBZ.length - 1; r >= 0; r--) {
    const z = RIBZ[r]; if (z - ez < .25) continue;
    scr(); const ring = new Path2D(); [z, z + .35].forEach((zz) => { K.inner.forEach(([x, y], i) => { const q = P(x, y, zz); i ? ring.lineTo(q[0], q[1]) : ring.moveTo(q[0], q[1]); }); ring.closePath(); });
    c.fillStyle = '#2a1e14'; c.fill(ring, 'evenodd');
    k = plane(z); px = 1 / k;
    c.fillStyle = '#6e5436'; c.fill(K.rib, 'evenodd'); c.fillStyle = '#9a7a52'; c.fill(K.vous);
    c.strokeStyle = 'rgba(20,12,6,.6)'; c.lineWidth = 1.2 * px; c.stroke(K.rib);
  }
  scr();
  // light from the open side doors across the floor; the lamps
  c.globalCompositeOperation = 'lighter';
  SIDEZ.forEach((zc) => {
    const o = openS(ez, zc); if (o <= 0 || zc + 1.5 < ez) return; const gap = 1 - Math.cos(MAXA * o);
    [-1, 1].forEach((sd) => {
      const sp = poly3([[sd * CWD, .002, zc - D5.hw * gap], [sd * CWD, .002, zc + D5.hw * gap], [-sd * .6, .002, zc + D5.hw * gap - 1.1], [-sd * .6, .002, zc - D5.hw * gap - 1.6]]);
      c.fillStyle = `rgba(255,200,120,${.3 * gap})`; c.fill(sp);
      const q = P(sd * CWD, 1.5, zc); glowAt(GLOW, q[0], q[1], 2.4 * C.F / Math.max(.4, zc - ez), .35 * gap);
    });
  });
  c.globalCompositeOperation = 'source-over';
  const lan = assets(st, 'lantern');
  for (let r = RIBZ.length - 1; r >= 1; r--) {
    const z = RIBZ[r] + .17; if (z - ez < .4) continue;
    const kk = C.F / (z - ez), top = P(0, 4.75, z), ch = P(0, CHT + CWD - .02, z), fl2 = .85 + .1 * Math.sin(t * 6.1 + r * 2) + .05 * Math.sin(t * 11 + r);
    c.strokeStyle = '#140c06'; c.lineWidth = Math.max(1, .03 * kk); c.beginPath(); c.moveTo(ch[0], ch[1]); c.lineTo(top[0], top[1]); c.stroke();
    c.drawImage(lan, top[0] - .22 * kk, top[1], .44 * kk, .88 * kk);
    c.globalCompositeOperation = 'lighter';
    glowAt(GLOW, top[0], top[1] + .5 * kk, 1.2 * kk, .75 * fl2);
    glowAt(GLOW, top[0], P(0, 1.6, z)[1], 4.2 * kk, .2 * fl2);
    c.globalCompositeOperation = 'source-over';
  }
  // amber haze deepening toward the end door
  const vp = P(0, 1.8, z1); c.globalCompositeOperation = 'lighter'; glowAt(GLOW, vp[0], vp[1], 2.6 * C.F / Math.max(.5, z1 - ez), .12); c.globalCompositeOperation = 'source-over';
}

// ---------- small doors in a wall: sprites by swing state; the door we enter gets real leaves when it is large ----------
function doorField(st, lv, cells, xOf, yOf, z, openF, p, tgt, big) {
  const D = DOOR[lv], sp = assets(st, lv === 3 ? 'spG' : 'spL'), k = C.F / (z - C.ez), { W, H } = C;
  const hw = D.hw * k, hh = D.ap * k, mi = pickMip(sp[0], hh * dpr);
  scr();
  for (const [i, j] of cells) {
    if (big && i === tgt[0] && j === tgt[1]) continue;
    const q = P(xOf(i), yOf(j) + D.ap, z); if (q[0] + hw < 0 || q[0] - hw > W || q[1] > H || q[1] + hh < 0) continue;
    const s = Math.round(openF(p, i, j) * (KS - 1));
    c.drawImage(sp[s][mi], q[0] - hw, q[1], 2 * hw, hh);
  }
}
function doorGlows(cells, xOf, yOf, z, openF, p, lv, a0) {
  const D = DOOR[lv], k = C.F / (z - C.ez), r = D.ap * .75 * k; if (r < 6) return;
  a0 *= c01(1.6 - r / 260);
  c.globalCompositeOperation = 'lighter';
  for (const [i, j] of cells) {
    const o = openF(p, i, j); if (o <= .02) continue;
    const q = P(xOf(i), yOf(j) + D.ap * .45, z); if (q[0] < -r || q[0] > C.W + r || q[1] < -r || q[1] > C.H + r) continue;
    glowAt(GLOW, q[0], q[1], r, a0 * o);
  }
  c.globalCompositeOperation = 'source-over';
}

// ---------- stage 3: the hall, a wall of a hundred doors over the dark ----------
function s3back() {
  scr(); const g = c.createLinearGradient(0, 0, 0, C.H); g.addColorStop(0, '#0a0d1e'); g.addColorStop(1, '#04050b'); c.fillStyle = g; c.fillRect(0, 0, C.W, C.H);
}
function s3front(st, t, p) {
  const z = ZW[3], D = DOOR[3], kk = C.F / (z - C.ez), big = D.ap * kk > 240;
  if (big) { const o = openG(p, GT[0], GT[1]), a = MAXA * o; pair(assets(st, 'leaf3'), gX(GT[0]), gY(GT[1]), z, a, .3 + .5 * Math.sin(a), Math.sin(a)); }
  const k = plane(z), px = 1 / k;
  const pp = c.createPattern(assets(st, 'plainG'), 'repeat'); pp.setTransform(new DOMMatrix([2.4 / 160, 0, 0, 2.4 / 160, 0, 0]));
  c.fillStyle = pp; c.fill(st.gridOut, 'evenodd');
  const cg = assets(st, 'cellG'), cp = c.createPattern(cg, 'repeat'); cp.setTransform(new DOMMatrix([GX / cg.width, 0, 0, -GY / cg.height, -7.5, gY(0) - .25 + GY]));
  c.fillStyle = cp; c.fill(st.gridIn, 'evenodd');
  c.fillStyle = '#2a2a40'; c.fill(st.gridBand, 'evenodd'); c.strokeStyle = 'rgba(201,165,78,.45)'; c.lineWidth = 1.5 * px; c.stroke(st.gridBand);
  // light: cold from high above, warm from the opened doors; darkness at the edges of the hall
  let fr = 0; for (let i = 0; i < GN; i++) for (let j = 0; j < GN; j++) fr += openG(p, i, j); fr /= 100;
  c.save(); c.clip(st.gridAll, 'evenodd');
  const cold = c.createRadialGradient(0, 12, 0, 0, 7, 19); cold.addColorStop(0, 'rgba(120,140,220,.1)'); cold.addColorStop(.55, 'rgba(0,0,10,.3)'); cold.addColorStop(1, 'rgba(0,0,6,.9)');
  c.fillStyle = cold; c.fillRect(-60, -60, 120, 120);
  if (fr > 0) { c.globalCompositeOperation = 'lighter'; const w = c.createRadialGradient(0, 1, 0, 0, 1, 22); w.addColorStop(0, `rgba(255,190,110,${.12 * fr})`); w.addColorStop(1, 'rgba(255,190,110,0)'); c.fillStyle = w; c.fillRect(-60, -60, 120, 120); c.globalCompositeOperation = 'source-over'; }
  c.restore();
  c.save(); c.clip(st.gridAll, 'evenodd'); c.fillStyle = `rgba(26,32,66,${.32 * c01((z - C.ez) / 36)})`; c.fillRect(-60, -60, 120, 140); c.restore();
  if (big) { c.save(); c.translate(gX(GT[0]), gY(GT[1])); drawPortal(st.portG, ['#1c1f30', 'rgba(70,74,110,.95)', 'rgba(190,200,255,.3)', '#3a3c56', '#2a2c44', 'rgba(201,165,78,.5)'], px); c.restore(); }
  doorField(st, 3, GCELL, gX, gY, z, openG, p, GT, big);
  doorGlows(GCELL, gX, gY, z, openG, p, 3, .45);
  // columns rising out of the dark, between us and the wall
  scr();
  st.cols.forEach(([x, zc]) => {
    if (zc - .5 - C.ez < .3) return;
    const sd = Math.sign(x), f = poly3([[x - .5, HFLOOR, zc - .5], [x + .5, HFLOOR, zc - .5], [x + .5, 40, zc - .5], [x - .5, 40, zc - .5]]);
    const s = poly3([[x - .5 * sd, HFLOOR, zc - .5], [x - .5 * sd, HFLOOR, zc + .5], [x - .5 * sd, 40, zc + .5], [x - .5 * sd, 40, zc - .5]]);
    c.fillStyle = '#121528'; c.fill(s); c.fillStyle = '#080a14'; c.fill(f);
    const e = P(x - .5 * sd, HFLOOR, zc - .5); c.strokeStyle = `rgba(255,200,130,${.12 + .4 * fr})`; c.lineWidth = 1.5; c.beginPath(); c.moveTo(e[0], 0); c.lineTo(e[0], e[1]); c.stroke();
    c.fillStyle = 'rgba(0,0,0,.5)'; c.fill(poly3([[x - .9, HFLOOR + .001, zc - .9], [x + .9, HFLOOR + .001, zc - .9], [x + .9, HFLOOR + .001, zc + .9], [x - .9, HFLOOR + .001, zc + .9]]));
  });
  // the polished floor of the hall, holding the wall's light
  const fz = Math.max(C.ez + .3, ZW[2] + 2.6), fp = poly3([[-40, HFLOOR, fz], [40, HFLOOR, fz], [40, HFLOOR, z], [-40, HFLOOR, z]]);
  const fy0 = P(0, HFLOOR, z)[1], fg = c.createLinearGradient(0, fy0, 0, C.H); fg.addColorStop(0, '#1a1c30'); fg.addColorStop(.3, '#0a0b16'); fg.addColorStop(1, '#030308');
  c.fillStyle = fg; c.fill(fp);
  c.save(); c.clip(fp); c.globalCompositeOperation = 'lighter';
  const rk = C.F / (z - C.ez);
  for (const [i, j] of GCELL) { if (j > 3) continue; const o = openG(p, i, j); const q = P(gX(i), 2 * HFLOOR - gY(j) - DOOR[3].ap * .5, z); glowEll(GLOW, q[0], q[1], .9 * rk, 2.2 * rk, (.08 + .3 * o) * (1 - j * .22)); }
  const sh = P(0, HFLOOR, z); glowEll(WHITE, sh[0], sh[1] + 4, 9 * rk, 1.2 * rk, .12);
  c.restore(); c.globalCompositeOperation = 'source-over';
  c.strokeStyle = 'rgba(201,165,78,.25)'; c.lineWidth = 1; const b0 = P(-40, HFLOOR, z), b1 = P(40, HFLOOR, z); c.beginPath(); c.moveTo(b0[0], b0[1]); c.lineTo(b1[0], b1[1]); c.stroke();
  // shafts of cold light from high windows, slanting through the hall
  c.globalCompositeOperation = 'lighter';
  [[-9, .5], [-2, .35], [6, .45]].forEach(([x, a], i) => {
    const sh = poly3([[x - .6, 34, 102 - i * 6], [x + .6, 34, 102 - i * 6], [x + 4.6, HFLOOR, 108 - i * 3], [x + 2.4, HFLOOR, 108 - i * 3]]);
    const t0 = P(x, 34, 102)[1], t1 = P(x, HFLOOR, 108)[1], g = c.createLinearGradient(0, t0, 0, t1);
    g.addColorStop(0, `rgba(150,170,255,${.1 * a})`); g.addColorStop(.6, `rgba(150,170,255,${.05 * a})`); g.addColorStop(1, 'rgba(150,170,255,0)');
    c.fillStyle = g; c.fill(sh);
  });
  c.globalCompositeOperation = 'source-over';
  // the threshold we stand on, and a drop into the dark
  c.fillStyle = '#2a2016'; c.fill(poly3([[-2.6, 0, ZW[2]], [2.6, 0, ZW[2]], [2.6, 0, ZW[2] + 2.6], [-2.6, 0, ZW[2] + 2.6]]));
  c.fillStyle = '#0c0a08'; c.fill(poly3([[-2.6, -1.2, ZW[2] + 2.6], [2.6, -1.2, ZW[2] + 2.6], [2.6, 0, ZW[2] + 2.6], [-2.6, 0, ZW[2] + 2.6]]));
  const e0 = P(-2.6, 0, ZW[2] + 2.6), e1 = P(2.6, 0, ZW[2] + 2.6); if (ZW[2] + 2.6 - C.ez > .1) { c.strokeStyle = 'rgba(255,200,130,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(e0[0], e0[1]); c.lineTo(e1[0], e1[1]); c.stroke(); }
  c.globalCompositeOperation = 'lighter'; c.fillStyle = '#b8c4ff';
  st.motes.forEach(([x, y, zz, ph]) => { const zm = ZW[2] + 2 + zz * 1.4, xm = x * 1.6; if (zm - C.ez < .5) return; const q = P(xm + .4 * Math.sin(t * .2 + ph), y * 1.6 - 3 + .3 * Math.sin(t * .17 + ph), zm); c.globalAlpha = .25; const s = Math.min(3, 24 / (zm - C.ez)); c.fillRect(q[0], q[1], s, s); });
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}

// ---------- stage 4: the lattice of a thousand doors, standing in the night ----------
function s4back(st, t) {
  scr(); const { W, H, cy } = C;
  const sky = c.createLinearGradient(0, 0, 0, cy); sky.addColorStop(0, '#02030a'); sky.addColorStop(.7, '#0b1026'); sky.addColorStop(1, '#2a2440');
  c.fillStyle = sky; c.fillRect(0, 0, W, cy + 1);
  c.fillStyle = '#efe6cf'; st.stars.forEach(([u, v, b, s]) => { c.globalAlpha = b * .8 * (.75 + .25 * Math.sin(t * 1.3 + v * 71)); c.fillRect(u * W, v * cy, s, s); }); c.globalAlpha = 1;
  const fl = c.createLinearGradient(0, cy, 0, H); fl.addColorStop(0, '#2a2234'); fl.addColorStop(.2, '#0e0c14'); fl.addColorStop(1, '#040408');
  c.fillStyle = fl; c.fillRect(0, cy, W, H - cy);
  c.strokeStyle = 'rgba(201,165,78,.07)'; c.lineWidth = 1; c.beginPath();
  for (let i = -30; i <= 30; i++) { const a = P(i * 12, LFLOOR, Math.max(C.ez + 1, ZW[3])), b = P(i * 12, LFLOOR, 4000); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  for (let i = 0; i < 40; i++) { const z = ZW[3] + 12 * i; if (z - C.ez < 1) continue; const y = P(0, LFLOOR, z)[1]; c.moveTo(0, y); c.lineTo(W, y); }
  c.stroke();
}
function s4front(st, t, p) {
  const z = ZW[4], D = DOOR[4], kk = C.F / (z - C.ez), big = D.ap * kk > 240;
  if (big) { const o = openL(p, LT[0], LT[1]), a = MAXA * o; pair(assets(st, 'leaf4'), lX(LT[0]), lY(LT[1]), z, a, .3 + .5 * Math.sin(a), Math.sin(a)); }
  const k = plane(z), px = 1 / k;
  const pl = c.createPattern(assets(st, 'plainL'), 'repeat'); pl.setTransform(new DOMMatrix([1.7 / 160, 0, 0, 1.7 / 160, 0, 0]));
  c.fillStyle = pl; c.fill(st.lattPlain, 'evenodd');
  const cl = assets(st, 'cellL'), cp = c.createPattern(cl, 'repeat'); cp.setTransform(new DOMMatrix([LXs / cl.width, 0, 0, -LYs / cl.height, -LHW, LFLOOR + LYs]));
  c.fillStyle = cp; c.fill(st.latt, 'evenodd');
  let fr = 0; if (p > .7) { for (let n = 0; n < LCELL.length; n += 7) fr += openL(p, ...LCELL[n]); fr /= Math.ceil(LCELL.length / 7); }
  c.save(); c.clip(st.lattAll, 'evenodd');
  const up = c.createLinearGradient(0, LFLOOR, 0, 89); up.addColorStop(0, 'rgba(255,170,90,.2)'); up.addColorStop(.35, 'rgba(0,0,0,.05)'); up.addColorStop(1, 'rgba(4,4,12,.55)');
  c.fillStyle = up; c.fillRect(-90, LFLOOR, 180, 160);
  const ed = c.createRadialGradient(1.7, 1.6, 10, 1.7, 1.6, 120); ed.addColorStop(0, 'rgba(0,0,0,0)'); ed.addColorStop(1, 'rgba(2,2,8,.55)'); c.fillStyle = ed; c.fillRect(-90, LFLOOR, 180, 160);
  if (fr > 0) { c.globalCompositeOperation = 'lighter'; const w = c.createRadialGradient(1.7, 1.6, 0, 1.7, 1.6, 80); w.addColorStop(0, `rgba(255,214,150,${.16 * fr})`); w.addColorStop(1, 'rgba(255,214,150,0)'); c.fillStyle = w; c.fillRect(-90, LFLOOR, 180, 160); c.globalCompositeOperation = 'source-over'; }
  c.restore();
  c.strokeStyle = 'rgba(243,217,143,.6)'; c.lineWidth = 2 * px; c.stroke(st.lattOut); c.lineWidth = 1 * px; c.strokeStyle = 'rgba(243,217,143,.3)'; c.stroke(st.lattOut2);
  if (big) { c.save(); c.translate(lX(LT[0]), lY(LT[1])); drawPortal(st.portL, ['#2a1c10', 'rgba(130,92,48,.95)', 'rgba(255,214,150,.35)', '#6a4a26', '#4a3218', 'rgba(243,217,143,.5)'], px); c.restore(); }
  doorField(st, 4, LCELL, lX, lY, z, openL, p, LT, big);
  doorGlows(LCELL, lX, lY, z, openL, p, 4, .5);
  // the screen's light on the floor before it
  scr(); c.globalCompositeOperation = 'lighter';
  const fq = P(1.7, LFLOOR, z - 30); glowAt(GLOW, fq[0], fq[1], 120 * kk, (.12 + .4 * fr) * c01(1.5 - kk / 12));
  c.globalCompositeOperation = 'source-over';
}

// ---------- stage 5: the starfield: rings of star polygons of light, receding to a radiant core ----------
function s5back(st, t, p) {
  scr(); const { W, H } = C, o = P(1.7, 1.6, 1e6), R = Math.hypot(W, H);
  const g = c.createRadialGradient(o[0], o[1], 0, o[0], o[1], R * .8);
  g.addColorStop(0, '#fff8e6'); g.addColorStop(.02, '#f6dc96'); g.addColorStop(.07, '#7a5638'); g.addColorStop(.22, '#241c30'); g.addColorStop(.55, '#0d0e1e'); g.addColorStop(1, '#04050b');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'lighter';
  const spin = p * 1.2 + t * .012, pin = C.ez < ZW[4] - 40; // seen only through pinholes: radiance and wash suffice
  if (!pin) {
  st.rings.forEach(({ z, R: rr, dir, pts, ph, nv }, ri) => {
    const d = z - C.ez; if (d < 1.5) return;
    const k = C.F / d, sR = rr * k; if (sR > R * 2.5) return;
    const a = c01(1.15 - d / 1700) * c01((d - 1.5) / 10) * c01((R * 1.4 - sR) / (R * .6)), rot = ph + dir * spin, cs = Math.cos(rot), sn = Math.sin(rot);
    const X = (x, y) => o[0] + (x * cs - y * sn) * sR, Y = (x, y) => o[1] + (x * sn + y * cs) * sR;
    const la = a * c01((R * .42 - sR) / (R * .18));
    if (la > 0) { c.strokeStyle = `rgba(243,217,143,${.24 * la})`; c.lineWidth = Math.max(.5, .05 * k); c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(X(x, y), Y(x, y)) : c.moveTo(X(x, y), Y(x, y)))); c.closePath(); c.stroke(); }
    const s = Math.max(1, Math.min(4.5, .16 * k)), wave = .55 + .45 * Math.sin(ri * .7 - p * 30);
    c.fillStyle = ri % 3 ? '#ffe2a0' : '#ffffff'; c.globalAlpha = Math.min(1, a * 1.5 * wave);
    pts.forEach(([x, y]) => c.fillRect(X(x, y) - s / 2, Y(x, y) - s / 2, s, s));
    c.globalAlpha = 1;
    const gr = Math.min(60, Math.max(3, .9 * k));
    for (let v = 0; v < pts.length; v += nv) glowAt(GLOW, X(...pts[v]), Y(...pts[v]), gr, .5 * a * wave);
  });
  c.fillStyle = '#fff6e0';
  st.dust.forEach(([x, y, z, b]) => { const d = z - C.ez; if (d < 1) return; const q = P(x, y, z), s = Math.max(.8, Math.min(3.5, 40 / d)); c.globalAlpha = b * c01(1.1 - d / 2500); c.fillRect(q[0], q[1], s, s); });
  c.globalAlpha = 1;
  }
  glowAt(WHITE, o[0], o[1], R * .1, .45); glowAt(WHITE, o[0], o[1], R * .03, .9);
  const far = c01((ZW[4] + 6 - C.ez) / 90); if (far > 0) { c.fillStyle = `rgba(255,206,130,${.5 * far})`; c.fillRect(0, 0, W, H); }
  c.globalCompositeOperation = 'source-over';
}

// ---------- composition: stages nest through their exits ----------
const stageOf = (ez) => (ez < ZW[0] ? 0 : ez < ZW[1] ? 1 : ez < ZW[2] ? 2 : ez < ZW[3] ? 3 : ez < ZW[4] ? 4 : 5);
let st_;
function exitBox(k, p) {
  if (k === 0) return open0(p) > 0 && rectBox(-DOOR[0].hw, 0, DOOR[0].hw, DOOR[0].ap, ZW[0]);
  if (k === 1) return open1(p) > 0 && rectBox(-DOOR[1].hw, 0, DOOR[1].hw, DOOR[1].ap, ZW[1]);
  if (k === 2) return open2(p) > 0 && rectBox(-DOOR[2].hw, 0, DOOR[2].hw, DOOR[2].ap, ZW[2]);
  if (k === 3) return p > .535 && rectBox(gX(0) - GX / 2, gY(0), gX(GN - 1) + GX / 2, gY(GN - 1) + DOOR[3].ap, ZW[3]);
  if (k === 4) { if (p <= .705) return null; const pa = new Path2D(); st_.lattOutPts.forEach(([x, y], i) => { const q = P(x, y, ZW[4]); i ? pa.lineTo(q[0], q[1]) : pa.moveTo(q[0], q[1]); }); pa.closePath(); const r = rectBox(-LHW - 1.2, LFLOOR - .6, LHW + 1.2, LYS + LA + 1, ZW[4]); r.path = pa; return r; }
  return null;
}
function entryLeaves(st, k, p) { // the leaves we just passed still stand beside us for a moment
  const a = [0, open0(p), open1(p), open2(p), openG(p, GT[0], GT[1]), openL(p, LT[0], LT[1])][k] * MAXA, dk = .3 + .5 * Math.sin(a), rim = Math.sin(a);
  if (k === 1) pair(assets(st, 'leaf0'), 0, 0, ZW[0], a, dk, rim);
  if (k === 2) pair(assets(st, 'leaf1'), 0, 0, ZW[1], a, dk, rim);
  if (k === 3) pair(assets(st, 'leaf2'), 0, 0, ZW[2], a, dk, rim);
  if (k === 4) pair(assets(st, 'leaf3'), gX(GT[0]), gY(GT[1]), ZW[3], a, dk, rim);
  if (k === 5) pair(assets(st, 'leaf4'), lX(LT[0]), lY(LT[1]), ZW[4], a, dk, rim);
}
const BACK = [s0back, s1back, null, s3back, s4back, s5back], FRONT = [s0front, s1front, s2front, s3front, s4front, null];
function stage(k, R, st, t, p, S) {
  c.save(); clipRect(R);
  if (BACK[k]) BACK[k](st, t, p);
  if (k < 5) { const ex = exitBox(k, p); if (ex) { const R2 = isect(R, ex); if (R2) { if (ex.path) { c.save(); scr(); c.clip(ex.path); } stage(k + 1, R2, st, t, p, S); if (ex.path) c.restore(); } } }
  if (FRONT[k]) FRONT[k](st, t, p);
  if (k === S && k > 0) entryLeaves(st, k, p);
  c.restore();
}

S.abwab = {
  init(el, st) {
    st.cv = el.querySelector('canvas'); st.c = st.cv.getContext('2d'); st.n = el.querySelector('.ab-n'); st.A = {};
    const R = rng(23);
    st.stars = Array.from({ length: 300 }, () => [R(), R() * R() * .95, .2 + .8 * R() * R(), R() < .1 ? 1.6 : 1]);
    const dome = (w, h) => { const pa = new Path2D(); pa.rect(-w, 0, 2 * w, h); pa.moveTo(-w * 1.05, h); pa.quadraticCurveTo(-w * 1.1, h + w * 1.25, 0, h + w * 1.35); pa.quadraticCurveTo(w * 1.1, h + w * 1.25, w * 1.05, h); pa.closePath(); pa.rect(-.08, h + w * 1.3, .16, w * .5); return pa; };
    const minaret = (h) => { const pa = new Path2D(); pa.rect(-.9, 0, 1.8, h); pa.rect(-1.4, h * .72, 2.8, .5); pa.rect(-.7, h, 1.4, h * .12); pa.moveTo(-.8, h * 1.12); pa.lineTo(0, h * 1.25); pa.lineTo(.8, h * 1.12); pa.closePath(); return pa; };
    const palm = (h, lean) => { const pa = new Path2D(); pa.moveTo(-.25, 0); pa.quadraticCurveTo(lean * .5, h * .5, lean - .15, h); pa.lineTo(lean + .15, h); pa.quadraticCurveTo(lean * .5 + .3, h * .5, .25, 0); pa.closePath(); for (let f = 0; f < 9; f++) { const a = f / 9 * TAU, l = 3.2, dx = Math.cos(a) * l, dy = Math.sin(a) * l * .4 - l * .25 * Math.abs(Math.cos(a)); pa.moveTo(lean, h); pa.quadraticCurveTo(lean + dx * .5, h + .9 + dy * .3, lean + dx, h + dy); pa.quadraticCurveTo(lean + dx * .5, h + .4 + dy * .3, lean, h - .2); pa.closePath(); } return pa; };
    const haze = (z) => { const f = Math.min(1, z / 140); return `rgb(${mix(9, 30, f) | 0},${mix(12, 36, f) | 0},${mix(24, 66, f) | 0})`; };
    st.city = [[-13, 34, dome(4.2, 8.5)], [11, 46, minaret(21)], [27, 74, dome(7, 12)], [-30, 90, dome(5, 9)], [-6, 120, minaret(26)], [40, 110, minaret(18)], [-7.5, 12, palm(9.5, .6)], [8, 16, palm(11, -.8)], [15.5, 10, palm(8.5, .5)], [-17, 18, palm(10, .4)]]
      .map(([x, z, path]) => ({ x, z, path, col: haze(z) })).sort((a, b) => b.z - a.z);
    st.far = [[-16, 60], [13, 80], [-34, 120], [30, 150], [-8, 190], [52, 220], [-60, 260], [20, 300], [-24, 340], [70, 360], [4, 420]].map(([x, z]) => ({ x, z })).sort((a, b) => b.z - a.z);
    st.farPath = new Path2D(); st.farPath.rect(-1.95, 0, 3.9, 6.7); addPoly(st.farPath, archPts(DOOR[1], 10));
    st.motes = Array.from({ length: 90 }, () => [(R() - .5) * 12, .2 + R() * 5, 2 + R() * 21, R() * TAU]);
    st.fac = buildFacade();
    st.port1 = buildPortal(DOOR[1], 1.62, 5.9, .26);
    st.slab1 = new Path2D(); addPoly(st.slab1, [[-1.95, 0], [-1.95, 6.7], ...Array.from({ length: 6 }, (_, i) => [[-1.6 + i * .64, 6.7], [-1.6 + i * .64, 7.15], [-1.28 + i * .64, 7.15], [-1.28 + i * .64, 6.7]]).flat(), [1.95, 6.7], [1.95, 0]]); addPoly(st.slab1, archPts(DOOR[1], 14));
    st.cor = buildCorridor();
    const gy0 = gY(0) - .25, holesG = new Path2D(); for (let i = 0; i < GN; i++) for (let j = 0; j < GN; j++) addPoly(holesG, archPts(DOOR[3], 8), gX(i), gY(j));
    st.gridIn = new Path2D(); st.gridIn.rect(-7.5, gy0, 15, GY * GN);
    st.gy0 = gy0; st.gridIn.addPath(holesG);
    st.gridAll = new Path2D(); st.gridAll.rect(-60, -60, 120, 140); st.gridAll.addPath(holesG);
    st.gridOut = new Path2D(); st.gridOut.rect(-60, -60, 120, 140); st.gridOut.rect(-8.1, gy0 - .6, 16.2, GY * GN + 1.2);
    st.gridBand = new Path2D(); st.gridBand.rect(-8.1, gy0 - .6, 16.2, GY * GN + 1.2); st.gridBand.rect(-7.5, gy0, 15, GY * GN);
    st.portG = buildPortal(DOOR[3], .7, 2.05, .07);
    const big = { hw: LHW + 1.2, sp: LYS - LFLOOR, ap: LYS - LFLOOR + LA + 1.4 }, outl = archPts(big, 24).map(([x, y]) => [x, y + LFLOOR - .6]);
    st.lattOutPts = outl; st.lattOut = addPoly(new Path2D(), outl);
    st.lattOut2 = addPoly(new Path2D(), archPts({ hw: LHW + 2.4, sp: big.sp, ap: big.ap + 1.4 }, 24).map(([x, y]) => [x, y + LFLOOR - 1.2]));
    st.latt = new Path2D(); st.lattPlain = addPoly(new Path2D(), outl); st.lattAll = addPoly(new Path2D(), outl);
    LCELL.forEach(([i, j]) => { const x0 = lX(i) - LXs / 2, y0 = LFLOOR + j * LYs; st.latt.rect(x0, y0, LXs, LYs); st.lattPlain.rect(x0, y0, LXs, LYs); const h = archPts(DOOR[4], 6); addPoly(st.latt, h, lX(i), lY(j)); addPoly(st.lattAll, h, lX(i), lY(j)); });
    st.portL = buildPortal(DOOR[4], 1.6, 4.25, .15);
    st.cols = []; [-10, -14, 10, 14].forEach((x) => [76, 88, 100].forEach((z) => st.cols.push([x, z]))); st.cols.sort((a, b) => b[1] - a[1]);
    const STARS = [[16, 5], [12, 5], [8, 3]];
    st.rings = Array.from({ length: 64 }, (_, i) => {
      const [n, m] = STARS[i % 3], pts = [], nv = 4;
      for (let e = 0; e < n; e++) { const a0 = (e * m % n) / n * TAU, a1 = ((e + 1) * m % n) / n * TAU; for (let s = 0; s < nv; s++) { const f = s / nv; pts.push([mix(Math.cos(a0), Math.cos(a1), f), mix(Math.sin(a0), Math.sin(a1), f)]); } }
      return { z: 342 + i * 24, R: 16 + (i % 3) * 7, dir: i % 2 ? 1 : -1, ph: i * .37, pts, nv };
    }).reverse();
    st.dust = Array.from({ length: 1300 }, () => { const r = 4 + 75 * Math.sqrt(R()), a = R() * TAU; return [1.7 + Math.cos(a) * r, 1.6 + Math.sin(a) * r, 340 + R() * 2300, .3 + .7 * R()]; });
  },
  frame(p, t, el, st) {
    fit(st.cv);
    dpr = st.cv.width / Math.max(1, st.cv.clientWidth);
    const W = st.cv.clientWidth, H = st.cv.clientHeight, phone = W < H;
    C = { ez: camZ(p), ex: camX(p), ey: camY(p), F: phone ? W * 1.9 : Math.min(H * 1.12, W * .9), cx: W / 2, cy: H * (phone ? .52 : .54), W, H };
    c = st.c; c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    prewarm(st, p); st_ = st;
    const S0 = stageOf(C.ez);
    stage(S0, [0, 0, W, H], st, t, p, S0);
    scr();
    const v = c.createRadialGradient(W / 2, H * .5, Math.min(W, H) * .3, W / 2, H * .5, Math.hypot(W, H) * .62);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(2,3,8,.55)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    setText(st.n, fmt(Math.max(1, count(p))));
  },
};
})();
