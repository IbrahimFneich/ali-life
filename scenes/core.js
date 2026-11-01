// Ali Life: helpers shared by every scenes/*.js file. Loads first, then each scene file, then app.js.
// A scene registers S.name = { init(el, st), frame(p, t, el, st) }. app.js calls frame with the pinned-scene
// progress p (about -0.05 → 1.05) and time t in seconds while the scene is on screen. With reduced motion it
// calls frame once with p = data-rest and t = 0. Everything a frame draws must follow from p (scroll runs both
// ways); t is only for ambient flicker. No face is ever drawn: people are faceless silhouettes or small lights, and
// the five of the Kisa are veiled figures with a gold disc, drawn only by scenes/holy.js (Holy.draw).
window.SCENES = {};
const S = window.SCENES;
const TAU = Math.PI * 2;
const c01 = (v) => Math.min(1, Math.max(0, v));
const seg = (p, a, b) => c01((p - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
const ease = {
  out: (t) => 1 - (1 - t) ** 3,
  in: (t) => t * t * t,
  io: (t) => (t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
};
const mix = (a, b, k) => a + (b - a) * k;
const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const SVGNS = 'http://www.w3.org/2000/svg';
const reduced = !document.documentElement.classList.contains('fx-on');

// Size a canvas backing store to its CSS box (DPR capped at 2). Returns true when it changed.
function fit(cv, mul = 1) {
  const d = Math.min(2, devicePixelRatio || 1) * mul;
  const w = Math.max(1, Math.round(cv.clientWidth * d));
  const h = Math.max(1, Math.round(cv.clientHeight * d));
  if (cv.width === w && cv.height === h) return false;
  cv.width = w; cv.height = h;
  return true;
}
const setText = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };

// Palette: the same values as the CSS tokens in styles.css.
const PAL = {
  ink: '#0d0e0b', ink2: '#16180f', night: '#070b16', dusk: '#1b2440',
  paper: '#e6dcc3', paperDim: '#b9ad90',
  gold: '#c9a54e', goldHi: '#f3d98f',
  green: '#2e7558', greenHi: '#79c9a2',
  blood: '#a4322b', sand: '#c2a576', clay: '#8a6a45',
};
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};
const FONT = {
  kufi: '"Reem Kufi", "Noto Kufi Arabic", sans-serif',
  naskh: 'Amiri, "Noto Naskh Arabic", serif',
  ui: '"IBM Plex Sans Arabic", system-ui, sans-serif',
};
// Terrain for badr, uhud and hunayn: a heightfield sampled as NS depth bands (far to near) of NK + 1 projected points
// (TX/TY, CSS px), with r,g,b in TC at every `step`-th point. The bands are rasterised front to back into a small
// buffer, one pixel column at a time, the colour running smoothly between bands and between samples, so the land
// paints as one soft surface with no band seams; pixels no band reaches stay clear for the sky. The buffer is then
// scaled up over the canvas, with an optional fine grain (grainA) laid over the land.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16);
function terrainRaster(st, c, W, H, NS, NK, step, TX, TY, TC, grainA = 0) {
  const q = Math.min(.6, Math.sqrt(32e4 / (W * H))), BW = Math.ceil(W * q), BH = Math.ceil(H * q), NC = NK / step + 1;
  if (BW < 1 || BH < 1) return;
  let T = st.terr;
  if (!T || T.cv.width !== BW || T.cv.height !== BH) {
    const cv = document.createElement('canvas'); cv.width = BW; cv.height = BH;
    const g = cv.getContext('2d'), img = g.createImageData(BW, BH);
    T = st.terr = { cv, g, img, px: new Uint32Array(img.data.buffer), top: new Float32Array(BW), py: new Float32Array(BW), pc: new Float32Array(BW * 3) };
  }
  const { px, top, py, pc } = T;
  px.fill(0); top.fill(BH);
  for (let i = NS - 1; i >= 0; i--) {
    const o = i * (NK + 1), oc = i * NC * 3;
    for (let bx = 0, k = 0; bx < BW; bx++) {
      const X = (bx + .5) / q;
      while (k < NK - 1 && TX[o + k + 1] < X) k++;
      const x0 = TX[o + k], x1 = TX[o + k + 1], f = x1 > x0 ? Math.min(1, Math.max(0, (X - x0) / (x1 - x0))) : 0;
      const y = (TY[o + k] + (TY[o + k + 1] - TY[o + k]) * f) * q;
      const kc = (k + f) / step, ci = Math.min(NC - 2, kc | 0), cf = kc - ci, a = oc + ci * 3;
      const r = Math.min(255, TC[a] + (TC[a + 3] - TC[a]) * cf), g = Math.min(255, TC[a + 1] + (TC[a + 4] - TC[a + 1]) * cf), b = Math.min(255, TC[a + 2] + (TC[a + 5] - TC[a + 2]) * cf);
      const j = bx * 3;
      if (i === NS - 1) { py[bx] = BH + 1; pc[j] = r; pc[j + 1] = g; pc[j + 2] = b; }
      const yp = py[bx], yb = Math.min(top[bx], yp);
      if (y < yb) {
        const y0 = Math.max(0, Math.round(y)), y1 = Math.min(BH, Math.round(yb)), inv = 1 / Math.max(.001, yp - y), t0 = (y0 + .5 - y) * inv;
        const dr = (pc[j] - r) * inv, dg = (pc[j + 1] - g) * inv, db = (pc[j + 2] - b) * inv;
        let R = r + (pc[j] - r) * t0, G = g + (pc[j + 1] - g) * t0, B = b + (pc[j + 2] - b) * t0;
        for (let yy = y0, n = y0 * BW + bx; yy < y1; yy++, n += BW) {
          const dt = BAYER[(yy & 3) * 4 + (bx & 3)];
          px[n] = 0xff000000 | ((B + dt) << 16) | ((G + dt) << 8) | (R + dt);
          R += dr; G += dg; B += db;
        }
        top[bx] = y;
      }
      py[bx] = y; pc[j] = r; pc[j + 1] = g; pc[j + 2] = b;
    }
  }
  for (let bx = 0; bx < BW; bx++) { // the skyline: the top pixel of each column covers only part of itself
    const y = top[bx], p = Math.round(y);
    if (p <= 0 || p >= BH) continue;
    const n = p * BW + bx, col = px[n] & 0xffffff, a0 = Math.min(1, p + 1 - y), a1 = p - y;
    if (a0 < 1) px[n] = col | ((a0 * 255) << 24);
    if (a1 > 0) px[n - BW] = col | ((a1 * 255) << 24);
  }
  for (let bx = 0; bx < BW - 1; bx++) { // a steep skyline: the edge between two column centres also covers the near half of the lower column
    const a = top[bx], b = top[bx + 1], hi = a < b ? bx : bx + 1, lo = hi === bx ? bx + 1 : bx, yh = Math.max(0, Math.min(a, b)), yl = Math.min(BH, Math.max(a, b)), dy = yl - yh;
    for (let yy = Math.round(yh + dy / 2), e = Math.round(yl) - 1; yy < e; yy++) {
      const n = yy * BW + lo, cov = Math.min(.5, (yy + .5 - yh) / dy - .5) * 255;
      if (cov > px[n] >>> 24) px[n] = (px[yy * BW + hi] & 0xffffff) | (cov << 24);
    }
  }
  T.g.putImageData(T.img, 0, 0);
  c.drawImage(T.cv, 0, 0, W, H);
  if (grainA > 0) { // a fine grain over the land only, so sand and rock read as a surface and the sky stays clean
    c.save(); c.beginPath(); c.moveTo(0, H);
    for (let bx = 0; bx < BW; bx += 2) c.lineTo(bx / q, Math.min(H, top[bx] / q));
    c.lineTo(W, Math.min(H, top[BW - 1] / q)); c.lineTo(W, H); c.closePath(); c.clip();
    T.pat = T.pat || c.createPattern(grainTile(), 'repeat');
    c.globalCompositeOperation = 'overlay'; c.globalAlpha = grainA; c.fillStyle = T.pat; c.fillRect(0, 0, W, H); c.restore();
  }
}
// A tile of fine grey grain, made once, laid over the land with 'overlay'.
let grainCv = null;
function grainTile() {
  if (grainCv) return grainCv;
  grainCv = document.createElement('canvas'); grainCv.width = grainCv.height = 160;
  const g = grainCv.getContext('2d'), id = g.createImageData(160, 160), R = rng(4242);
  for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (R() + R() - 1) * 127; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0);
  return grainCv;
}
// Arabic-Indic digits for any number a scene prints.
const arNum = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
