(() => {
// climes: the seven climes and the ant (Nahj al-Balagha, sermon 224). One continuous camera in world units:
// the round map (al-Idrisi style, south at the top) has radius 1; log-zoom L(p) dwells at each framing:
// world → Iraq → Kufa on the Euphrates → the city → one courtyard → the earth → the ant.
// Each layer is drawn in its own local units around its own anchor (keeps canvas matrices small), and only
// inside its zoom window.
const LON0 = 50, LAT0 = 30, K = 1 / 52, LATF = 1.15, RIM = .965;
function proj(lon, lat) { // linear, then squeezed toward the rim like the round maps
  const x = -(lon - LON0) * K, y = (lat - LAT0) * K * LATF, r = Math.hypot(x, y);
  if (r < 1e-9) return [x, y];
  const f = RIM * Math.tanh(r / RIM) / r;
  return [x * f, y * f];
}
const MW = K / 111000; // one metre in world units
const KUFA = proj(44.32, 32.03); // the mosque of Kufa
const HOUSE = [KUFA[0] + 190 * MW, KUFA[1] - 40 * MW]; // one modest house near it
const ANT0 = [HOUSE[0] + 1.1 * MW, HOUSE[1] + .9 * MW]; // where the ant is at p = .75
const ANT_H = Math.PI + .1 - .32; // world heading; after the camera's turn it walks right → left on screen
const ANT_DIR = [Math.cos(ANT_H), Math.sin(ANT_H)];
const ANT_V = 120; // mm per unit p
const SH = [Math.cos(2.1) * .8, Math.sin(2.1) * .8]; // shadow offset per unit height (world axes)
const LD = [-SH[0] / .8, -SH[1] / .8]; // toward the light
const MM = MW * 1e-3;
// framings, given as css px per metre at s0 = 333 (the desktop map radius)
const PK = [.3, .375, .45, .525, .6, .675, .75];
const LK = [.12, ...[.0022, .15, 1.1, 60, 2600, 45000].map((v) => Math.log(v / (333 * MW)))];
function hermite(p) {
  if (p <= PK[0]) return .12 * c01(p / .3);
  const n = PK.length - 1;
  if (p >= PK[n]) return LK[n];
  let i = 0; while (p > PK[i + 1]) i++;
  const m = (j) => (j === 0 ? .4 : j === n ? 0 : .5 * (LK[j + 1] - LK[j - 1]) / (PK[j + 1] - PK[j - 1]));
  const h = PK[i + 1] - PK[i], s = (p - PK[i]) / h, s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * LK[i] + (s3 - 2 * s2 + s) * h * m(i) + (-2 * s3 + 3 * s2) * LK[i + 1] + (s3 - s2) * h * m(i + 1);
}
const antDist = (p) => ANT_V * (p - .75); // mm walked, relative to p = .75
const antAt = (p) => { const d = antDist(p) * MM; return [ANT0[0] + ANT_DIR[0] * d, ANT0[1] + ANT_DIR[1] * d]; };
const LEND = LK[LK.length - 1];

function camera(p, W, H) {
  const phone = W < H;
  let L = hermite(p);
  if (p > .75) L += .12 * smooth(seg(p, .75, .9)) - 2.3 * ease.io(seg(p, .9, .975));
  const s0 = Math.min(W, H) * (phone ? .44 * mix(1, .8, smooth(c01((L - 15) / 3))) : .37); // a narrow screen sees the ant a little smaller
  const Z = Math.exp(L);
  const oMap = [W * (phone ? .5 : .43), H * (phone ? .43 : .5)];
  const oEnd = [W * (phone ? .5 : .5), H * (phone ? .42 : .45)];
  let tgt = antAt(p);
  if (p > .75) { const a = antAt(.75), b = antAt(Math.min(p, .9)); tgt = [a[0] + (b[0] - a[0]) * .95, a[1] + (b[1] - a[1]) * .95]; }
  tgt = [tgt[0] + ANT_DIR[0] * 3.3 * MM, tgt[1] + ANT_DIR[1] * 3.3 * MM]; // frame the ant with its husk
  const th = .32 * smooth(c01((L - .5) / 20));
  const w = 1 - smooth(c01(L / 3.4));
  const drop = smooth(seg(p, .9, .97)) * H * (phone ? .16 : .17);
  const S = [mix(oEnd[0], oMap[0] + tgt[0] * s0, w), mix(oEnd[1], oMap[1] + tgt[1] * s0, w) + drop];
  return { p, L, Z, s: Z * s0, s0, th, cos: Math.cos(th), sin: Math.sin(th), S, tgt, W, H, phone, ppm: Z * s0 * MW };
}
// ctx transform: local coords (in units of `unit` world) around world anchor A → device pixels. Returns device px per unit.
function place(c, cam, A, unit, dpr) {
  const k = cam.s * unit * dpr, dx = (A[0] - cam.tgt[0]) * cam.s, dy = (A[1] - cam.tgt[1]) * cam.s;
  const ex = (cam.S[0] + cam.cos * dx - cam.sin * dy) * dpr, ey = (cam.S[1] + cam.sin * dx + cam.cos * dy) * dpr;
  c.setTransform(cam.cos * k, cam.sin * k, -cam.sin * k, cam.cos * k, ex, ey);
  return k;
}
const toScreen = (cam, P) => { const dx = (P[0] - cam.tgt[0]) * cam.s, dy = (P[1] - cam.tgt[1]) * cam.s; return [cam.S[0] + cam.cos * dx - cam.sin * dy, cam.S[1] + cam.sin * dx + cam.cos * dy]; };
// the visible rect in local coords (anchor A, unit u): axis-aligned bounds of the inverse-mapped screen corners
function viewRect(cam, A, unit, pad = 0) {
  const k = cam.s * unit, ox = (A[0] - cam.tgt[0]) * cam.s, oy = (A[1] - cam.tgt[1]) * cam.s;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  [[0, 0], [cam.W, 0], [0, cam.H], [cam.W, cam.H]].forEach(([sx, sy]) => {
    const rx = sx - cam.S[0], ry = sy - cam.S[1], wx = (cam.cos * rx + cam.sin * ry - ox) / k, wy = (-cam.sin * rx + cam.cos * ry - oy) / k;
    x0 = Math.min(x0, wx); x1 = Math.max(x1, wx); y0 = Math.min(y0, wy); y1 = Math.max(y1, wy);
  });
  return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
}

// Catmull-Rom through points → Path2D (closed or open)
function crPath(pts, closed, path = new Path2D()) {
  const n = pts.length, P = (i) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  path.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = P(i - 1), b = P(i), d = P(i + 1), e = P(i + 2);
    path.bezierCurveTo(b[0] + (d[0] - a[0]) / 6, b[1] + (d[1] - a[1]) / 6, d[0] - (e[0] - b[0]) / 6, d[1] - (e[1] - b[1]) / 6, d[0], d[1]);
  }
  if (closed) path.closePath();
  return path;
}
const P_ = (arr) => arr.map(([lo, la]) => proj(lo, la));
const hash = (x, y, s) => { const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
const canvas = (w, h = w) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };

// ---------- geography (lon, lat), stylised ----------
const AFRICA = [[-5.9, 35.8], [3, 36.8], [10.5, 37.2], [10.2, 34], [13, 32.9], [19.5, 30.4], [20.5, 32.6], [24, 32], [29.9, 31.2], [32.3, 31.3], [32.6, 29.8], [35.5, 23.9], [38.5, 18], [43.3, 12], [51.2, 11.8], [47.5, 4.5], [40.8, -2.4], [39.3, -8], [40.6, -15.3], [35.4, -23.5], [31, -29.9], [20, -34.8], [17.8, -32], [12, -17], [13, -8.8], [9, -1], [9.7, 4], [3.4, 6.4], [-4, 5.2], [-7.5, 4.4], [-13.2, 8.5], [-17.4, 14.7], [-16, 21], [-13, 27.6], [-9.6, 30.4], [-6.8, 34]];
const EURASIA = [[-5.6, 36.1], [-0.5, 37.6], [0.2, 39.6], [3.2, 41.9], [5.4, 43.3], [8.9, 44.4], [12.3, 41.7], [15.7, 38], [18.5, 40.1], [13.5, 43.6], [12.3, 45.4], [16.4, 43.5], [19.4, 41.3], [21.7, 36.8], [23.7, 37.9], [22.9, 40.6], [26.4, 40.1], [29, 41], [27.1, 38.4], [27.4, 37], [30.7, 36.9], [36.2, 36.6], [35.8, 34.4], [34.9, 32.6], [34.3, 31.4], [32.9, 31.1], [32.6, 29.9], [34.3, 27.8], [35, 29.5], [36.6, 26], [39.2, 21.5], [41, 18], [42.7, 15], [43.4, 12.7], [45, 12.8], [49, 14.5], [52.2, 15.6], [55.5, 17.5], [57.8, 19], [59.8, 22.5], [58.5, 23.6], [56.4, 26.3], [56, 24.8], [54.5, 24.2], [52, 24], [51.6, 25.3], [51.2, 26.1], [50.8, 24.8], [50.1, 26.4], [49.5, 27.3], [48.3, 28.6], [48, 29.4], [48.5, 30], [49.3, 30.1], [50.8, 28.9], [51.6, 27.8], [54, 26.7], [56.3, 27.2], [57.3, 25.8], [61.6, 25.2], [66.6, 25.4], [67.5, 23.8], [70.2, 22.4], [72.8, 19], [73.8, 15.4], [75.8, 11.2], [77.5, 8.1], [79.8, 10.3], [80.3, 13], [82.3, 16.6], [86, 20], [89, 21.8], [91.8, 22.3], [94.2, 18], [97.6, 16.5], [98.3, 10], [100.3, 6], [103.5, 1.4], [102.2, 6.2], [100.5, 13.4], [105, 8.6], [109.2, 12], [106.6, 19.5], [110.4, 21.2], [114.2, 22.3], [119.6, 26], [121.9, 31], [120.3, 34.5], [122.5, 37.4], [118, 38.5], [121.5, 40.9], [126.6, 35], [129.3, 35.2], [128.5, 38.6], [132, 43], [138, 50], [128, 60], [110, 66], [85, 70], [60, 70], [40, 68], [22, 66], [10, 63.5], [5, 61], [5, 58.5], [8.1, 56.7], [8.6, 53.9], [4.5, 52.3], [1.8, 50.9], [-1.6, 49.6], [-4.7, 48.4], [-1.2, 45.5], [-1.6, 43.4], [-8.9, 43.2], [-8.7, 41.2], [-9.3, 38.7], [-9, 37], [-6.3, 36.5]];
const ISLES = [
  [[-5.7, 50], [1.5, 51.3], [0, 53.5], [-1.6, 55.6], [-2.1, 57.7], [-5, 58.6], [-6.2, 56.7], [-3, 54], [-4.6, 52.8], [-5.2, 51.7]],
  [[-6, 52.2], [-6.1, 54], [-7.3, 55.3], [-10, 54.2], [-9.9, 52], [-8.5, 51.6]],
  [[12.4, 38.1], [15.6, 38.3], [15.1, 36.7], [12.6, 37.6]], [[8.4, 41.2], [9.8, 41], [9.6, 39.1], [8.4, 39]],
  [[23.5, 35.6], [26.3, 35.3], [24, 35]], [[32.3, 35.1], [34.6, 35.7], [33.9, 34.9], [32.6, 34.7]],
  [[79.9, 9.8], [81.9, 7.5], [81.2, 6.1], [80, 6.1], [79.8, 8.2]], [[44, -25.5], [47, -25], [50.2, -15.5], [49.3, -12], [44.3, -16], [43.3, -22]],
  [[95.3, 5.5], [98.5, 3.5], [104.5, -2], [106, -5.8], [102.3, -4], [98.5, 0]], [[109, 1.5], [111, -3], [116, -4], [119, 1], [117, 7], [113, 3.5]],
  [[105.5, -6.5], [114.5, -7.5], [114.4, -8.7], [106, -7.5]], [[130.9, 34], [135, 34.5], [140, 35.5], [141.5, 40], [140, 41.5], [139.5, 38], [136, 36.5], [132, 35.5]],
  [[53.3, 12.7], [54.5, 12.5], [54.1, 12.3]],
];
const LAKES = [
  [[28, 41.2], [31.2, 41.1], [36, 41.7], [41.6, 41.6], [39.3, 44.4], [36.6, 45.4], [33.6, 44.4], [32.6, 45.4], [30.7, 46.4], [28.6, 44.2]],
  [[47.5, 45.6], [52.4, 46.8], [53.2, 45.3], [51.2, 44.5], [52.9, 41], [54, 37.3], [51.8, 36.7], [49, 38.3], [49.6, 40.8], [47.5, 43]],
  [[58.5, 46], [61.5, 46.5], [61.6, 44], [59, 43.5]],
];
const EUPH = [[38.8, 39.2], [38.3, 37.5], [38.6, 36.2], [39.8, 35.8], [40.9, 34.4], [42.1, 34.4], [43.4, 33.4], [44.0, 32.65], [44.3263, 32.03], [44.55, 31.72], [45.3, 31.3], [46.3, 31.0], [47.4, 31.0]];
const TIGR = [[40.2, 38.2], [42.2, 37.3], [43.1, 36.3], [43.6, 34.9], [44.4, 33.3], [45.6, 32.5], [46.6, 31.6], [47.4, 31.0], [48.0, 30.4], [48.5, 29.95]];
const RIVERS = [EUPH, TIGR,
  [[32.9, .5], [32.4, 9.5], [32.5, 15.6], [33.8, 17.7], [32, 20.2], [31.3, 22], [32.9, 24], [32.6, 25.7], [31.2, 27.2], [31.2, 30], [31.0, 31.4]],
  [[77, 35], [74, 35.5], [72.3, 33], [71, 30], [68.5, 25.5], [67.6, 24.0]], [[79, 30.5], [80.5, 26.5], [83, 25.3], [86, 25.3], [88.1, 24], [89, 22]],
  [[71.5, 37.2], [67.5, 37.2], [64.5, 38.8], [61.2, 41.3], [59.6, 43.7]], [[72, 41], [69, 41], [66, 44], [61.6, 46]],
  [[49, 57], [46.5, 54], [48, 51], [45.8, 48.5], [47.8, 46]], [[10, 48.5], [17, 48.2], [19, 47], [21.5, 44.6], [25.5, 43.7], [29.6, 45.2]],
];
const MOUNTS = [[[32, 37.2], [36, 37.8], [40, 38.6], [43, 38.2]], [[45, 35.5], [47.5, 33.8], [50, 31], [53, 29], [56.5, 27.6]], [[38, 44], [44, 42.8], [49, 41]],
  [[48.5, 37], [53, 36], [57, 37.2]], [[64, 35], [70, 35.5], [75, 35.5], [80, 31], [88, 28], [95, 28.5]], [[6, 45], [10, 46.5], [14, 47.2]],
  [[-9, 30.5], [-4, 32.5], [2, 34.5], [8, 35.3]], [[36, 28], [40, 21], [43.5, 15.5]], [[37.5, 13.5], [39, 9]], [[26, -4], [34, -6]]];
const CITIES = [[39.83, 21.42, 1.8], [39.61, 24.47, 1.3], [44.32, 32.03, 1.5], [47.8, 30.5], [36.3, 33.5], [35.2, 31.8, 1.2], [31.2, 30], [29.9, 31.2], [28.98, 41], [44.6, 33.1], [51.7, 32.7], [61.8, 37.6], [67, 39.65], [44.2, 15.4], [10.1, 35.7], [12.5, 41.9], [52.5, 29.6], [58.9, 36.2]];
const CLIME_LAT = [12.75, 20.25, 27.5, 33.6, 38.9, 43.3, 47.25, 50.5];
const CLIME_TINT = ['#b4805c', '#93a06e', '#c79e55', '#7f9196', '#ad7c62', '#8f9a72', '#bb9a62'];
const LAND = '#977e5d', OCEAN = '#0f1828';
const SPH = [[24, '#cfd6dc', 1.1], [30, '#b8b0a0', .8], [36, '#efe4c8', 1], [48, PAL.goldHi, 2.2], [60, '#c0523e', .9], [72, '#d9c08a', 1.1], [90, '#a99e86', .9], [120, null, 0], [12, null, 0]];

// ---------- lazy caches ----------
function lazyMap(st) {
  if (st.map) return st.map;
  const land = new Path2D();
  [AFRICA, EURASIA, ...ISLES].forEach((a) => crPath(P_(a), true, land));
  const lakes = new Path2D();
  LAKES.forEach((a) => crPath(P_(a), true, lakes));
  const rivers = new Path2D();
  RIVERS.forEach((a) => crPath(P_(a), false, rivers));
  const peaks = new Path2D(), shade = new Path2D();
  MOUNTS.forEach((a) => { // each chain as a row of little peaks, apex toward the top (south) as the copyists drew them
    const pts = P_(a); let acc = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], d = Math.hypot(x1 - x0, y1 - y0);
      for (; acc < d; acc += .024) {
        const k = acc / d, x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k;
        peaks.moveTo(x - .012, y + .005); peaks.quadraticCurveTo(x - .005, y - .017, x + .002, y - .014); peaks.quadraticCurveTo(x + .008, y - .006, x + .012, y + .005); peaks.closePath();
        shade.moveTo(x + .002, y - .014); shade.quadraticCurveTo(x + .008, y - .006, x + .012, y + .005); shade.lineTo(x + .003, y + .005); shade.closePath();
      }
      acc -= d;
    }
  });
  const wv = canvas(96), wc = wv.getContext('2d'); wc.strokeStyle = 'rgba(201,165,78,.3)'; wc.lineWidth = 1.3;
  for (let r = 0; r < 4; r++) { wc.beginPath(); for (let x = -12; x <= 108; x += 24) { const y = r * 24 + 12, o = (r % 2) * 12; wc.moveTo(x + o - 9, y); wc.quadraticCurveTo(x + o - 3, y - 6, x + o + 3, y); } wc.stroke(); }
  const pv = canvas(256), pc = pv.getContext('2d'), R = rng(7);
  for (let i = 0; i < 2600; i++) { pc.fillStyle = R() < .5 ? `rgba(40,26,10,${.05 + .1 * R()})` : `rgba(255,240,205,${.04 + .08 * R()})`; pc.fillRect(R() * 256, R() * 256, 1 + R() * 2.5, 1 + R() * 2.5); }
  pc.strokeStyle = 'rgba(60,40,20,.08)'; for (let i = 0; i < 70; i++) { const x = R() * 256, y = R() * 256, a = R() * TAU; pc.beginPath(); pc.moveTo(x, y); pc.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18); pc.stroke(); }
  const cities = CITIES.map(([lo, la, r = 1]) => [...proj(lo, la), r]);
  st.map = { land, lakes, rivers, peaks, shade, waves: wv, vellum: pv, cities };
  return st.map;
}

// Iraq: local units are "K" (≈ one degree of longitude) around the Kufa anchor
const RG = (lo, la) => { const q = proj(lo, la); return [(q[0] - KUFA[0]) / K, (q[1] - KUFA[1]) / K]; };
function meander(poly, amp, seed, keep) { // densify a river and let it wander, pinned near `keep`
  const pts = poly.map(([lo, la]) => RG(lo, la)), out = [];
  let arc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.ceil(d / .005));
    for (let j = 0; j < n; j++, arc += d / n) {
      const k = j / n, x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k, nx = -(y1 - y0) / d, ny = (x1 - x0) / d;
      const pin = keep ? c01((Math.hypot(x - keep[0], y - keep[1]) - .02) / .25) : 1;
      const m = amp * pin * (.65 * Math.sin(arc / .045 + seed) + .35 * Math.sin(arc / .017 + seed * 2));
      out.push([x + nx * m, y + ny * m]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function lazyRegion(st) {
  if (st.reg) return st.reg;
  const R = rng(21);
  const sawadPts = [[43.6, 34.3], [44.3, 34.0], [44.9, 33.6], [45.5, 33.0], [46.3, 32.4], [47.0, 31.9], [47.6, 31.4], [47.2, 30.9], [46.4, 30.9], [45.4, 31.1], [44.7, 31.5], [44.36, 31.85], [44.3, 32.2], [43.8, 32.75], [43.25, 33.3], [43.2, 33.8]].map(([a, b]) => RG(a, b));
  const sawad = crPath(sawadPts, true);
  const marsh = crPath([[46.2, 31.7], [46.9, 31.6], [47.5, 31.3], [47.6, 30.8], [47.1, 30.6], [46.5, 30.8], [46.1, 31.2]].map(([a, b]) => RG(a, b)), true);
  const zagros = crPath([[44.8, 35.6], [45.6, 34.6], [46.6, 33.6], [47.6, 32.7], [48.6, 31.7], [49.6, 30.9]].map(([a, b]) => RG(a, b)), false);
  const eu = meander(EUPH, .014, 1, [0, 0]), ti = meander(TIGR, .018, 4, null);
  const rivers = new Path2D(); [eu, ti].forEach((pts) => { rivers.moveTo(...pts[0]); pts.forEach((q) => rivers.lineTo(...q)); });
  const canals = new Path2D();
  [[[43.75, 33.32], [44.1, 33.3], [44.42, 33.33]], [[43.95, 33.05], [44.25, 33.1], [44.56, 33.12]], [[44.1, 32.86], [44.4, 32.92], [44.72, 32.98]], [[44.25, 32.6], [44.7, 32.58], [45.25, 32.52]], [[44.38, 32.2], [44.8, 32.1], [45.4, 32.05]], [[44.5, 31.9], [45.1, 31.7], [45.8, 31.6]]].forEach((a) => crPath(a.map(([x, y]) => RG(x, y)), false, canals));
  const groves = new Path2D();
  [eu, ti].forEach((pts) => pts.forEach(([x, y]) => { for (let j = 0; j < 5; j++) { const ox = (R() - .5) * .07, oy = (R() - .5) * .07, r = .0025 + R() * .004; groves.moveTo(x + ox + r, y + oy); groves.arc(x + ox, y + oy, r, 0, TAU); } }));
  const dunes = new Path2D();
  for (let i = 0; i < 700; i++) { const x = .05 + R() * 3.4, y = -2.2 + R() * 5, l = .02 + R() * .05; if (y > -.1 + x * .3 && x < .6) continue; dunes.moveTo(x - l, y); dunes.quadraticCurveTo(x, y - l * .35, x + l, y); }
  // field patchwork for the Sawad (tile ≈ 0.06 units)
  const ft = canvas(256), fc = ft.getContext('2d');
  fc.fillStyle = '#4c5a36'; fc.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 10 + Math.floor(R() * 8)) for (let x = 0; x < 256;) { const w = 8 + R() * 22; fc.fillStyle = ['#56653c', '#46552f', '#6a6a3c', '#5b6b40', '#7a7044'][Math.floor(R() * 5)]; fc.fillRect(x, y, w - 1, 9 + R() * 6); x += w; }
  fc.strokeStyle = 'rgba(20,30,20,.35)'; fc.lineWidth = 1; for (let i = 0; i < 6; i++) { fc.beginPath(); fc.moveTo(0, R() * 256); fc.lineTo(256, R() * 256); fc.stroke(); }
  const towns = [[44.6, 33.1], [47.81, 30.5], [43.7, 33.37], [42.82, 33.64], [43.68, 34.6]].map(([a, b]) => RG(a, b));
  const wadis = new Path2D(); // dry channels running down off the desert toward the river
  for (let i = 0; i < 9; i++) { let x = .6 + R() * 2.6, y = -1.6 + R() * 3.6; const pts = [[x, y]]; for (let j = 0; j < 6; j++) { x -= .08 + R() * .12; y += (R() - .5) * .14; pts.push([x, y]); } crPath(pts, false, wadis); }
  const mt = canvas(256), mc = mt.getContext('2d'); // coarse tonal mottling of the desert
  for (let i = 0; i < 40; i++) { const x = R() * 256, y = R() * 256, r = 20 + R() * 60, dk = R() < .55; for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) { const gr = mc.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); gr.addColorStop(0, dk ? 'rgba(50,34,18,.09)' : 'rgba(230,205,160,.07)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); mc.fillStyle = gr; mc.fillRect(x + ox - r, y + oy - r, r * 2, r * 2); } }
  const city = new Path2D(); { const pts = []; for (let a = 0; a < 40; a++) { const q = a / 40 * TAU, r = (820 + 120 * Math.sin(3 * q + 1) + 70 * Math.sin(5 * q)) * .92; pts.push([(330 + Math.cos(q) * r) / 111000, (40 + Math.sin(q) * r) / 111000]); } crPath(pts, true, city); }
  st.reg = { sawad, wadis, mottle: mt, city, marsh, zagros, rivers, canals, groves, dunes, towns, eu, fields: ft };
  return st.reg;
}

// Kufa: local units are metres around the mosque; +x is west, +y is north (south is up, as on the map)
const LOT = { x0: 12.75, y0: -13.25, px: 42, py: 34, bw: 37, bh: 29 };
function lazyCity(st) {
  if (st.city) return st.city;
  const R = rng(5), CELL = 200, cells = new Map();
  // the Euphrates here is the region's river, read in metres (one region unit = 111 km)
  const RIVER = lazyRegion(st).eu.map(([x, y]) => [x * 111000, y * 111000]).filter(([x, y]) => Math.hypot(x, y) < 9000);
  const rdist = (x, y) => { let d = Infinity; for (let i = 0; i < RIVER.length - 1; i++) { const [ax, ay] = RIVER[i], [bx, by] = RIVER[i + 1], vx = bx - ax, vy = by - ay, u = c01(((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)); d = Math.min(d, Math.hypot(x - ax - vx * u, y - ay - vy * u)); } return d; };
  const cell = (x, y) => { const key = `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`; if (!cells.has(key)) cells.set(key, { roofs: [new Path2D(), new Path2D(), new Path2D()], court: new Path2D(), lit: new Path2D(), shade: new Path2D(), cx: Math.floor(x / CELL), cy: Math.floor(y / CELL) }); return cells.get(key); };
  const rad = (a) => 820 + 120 * Math.sin(3 * a + 1) + 70 * Math.sin(5 * a);
  const inCity = (x, y) => { const dx = x - 330, dy = y - 40; return Math.hypot(dx, dy) < rad(Math.atan2(dy, dx)) && rdist(x, y) > 330; };
  const sx = SH[0] * 3.5, sy = SH[1] * 3.5;
  for (let i = -40; i < 40; i++) for (let j = -40; j < 40; j++) {
    let x0 = LOT.x0 + i * LOT.px, y0 = LOT.y0 + j * LOT.py, bw = LOT.bw, bh = LOT.bh;
    if (((i % 5) + 5) % 5 === 2) { x0 += 14; bw -= 14; }
    if (((j % 5) + 5) % 5 === 3) { y0 += 12; bh -= 12; }
    const cxb = x0 + bw / 2, cyb = y0 + bh / 2;
    if (!inCity(cxb, cyb) || (Math.abs(cxb) < 105 && cyb > -250 && cyb < 100)) continue;
    const nx = R() < .5 ? 2 : 3, ny = 2;
    for (let a = 0; a < nx; a++) for (let b = 0; b < ny; b++) {
      const lx = x0 + a * bw / nx, ly = y0 + b * bh / ny, lw = bw / nx, lh = bh / ny;
      if (Math.abs(lx + lw / 2 - 190) < 10 && Math.abs(ly + lh / 2 + 40) < 8) continue; // the house we will enter
      if (R() < .07) continue; // an empty plot
      const hx = lx + .6, hy = ly + .6, hw = lw - 1.2, hh = lh - 1.2, cw = hw * (.36 + R() * .2), ch = hh * (.36 + R() * .2);
      const cxp = hx + .8 + R() * (hw - cw - 1.6), cyp = hy + .8 + R() * (hh - ch - 1.6);
      const C = cell(hx + hw / 2, hy + hh / 2);
      C.shade.rect(hx + sx, hy + sy, hw, hh);
      C.roofs[Math.floor(R() * 3)].rect(hx, hy, hw, hh);
      C.court.rect(cxp, cyp, cw, ch);
      const lx0 = Math.max(cxp, cxp + sx), lx1 = Math.min(cxp + cw, cxp + cw + sx), ly0 = Math.max(cyp, cyp + sy), ly1 = Math.min(cyp + ch, cyp + ch + sy);
      if (lx1 > lx0 && ly1 > ly0) C.lit.rect(lx0, ly0, lx1 - lx0, ly1 - ly0);
    }
  }
  const river = crPath(RIVER, false);
  const notCity = new Path2D(); notCity.rect(-12000, -12000, 24000, 24000);
  { const pts = []; for (let a = 0; a < 72; a++) { const q = a / 72 * TAU; let r = rad(q) + 30; while (r > 100 && rdist(330 + Math.cos(q) * r, 40 + Math.sin(q) * r) < 300) r -= 20; pts.push([330 + Math.cos(q) * r, 40 + Math.sin(q) * r]); } crPath(pts, true, notCity); }
  const fields = [new Path2D(), new Path2D(), new Path2D()];
  for (let i = -80; i < 80; i++) for (let j = -60; j < 60; j++) { // irrigated strips beyond the palms
    const x = i * 52 + (R() - .5) * 8, y = j * 70 + (R() - .5) * 8, d = rdist(x, y);
    if (d < 500 || d > 1900 + 500 * Math.sin(y * .001) || R() < .12) continue;
    fields[Math.floor(R() * 3)].rect(x, y, 44 + R() * 8, 30 + R() * 34);
  }
  // palm crowns, 128 m tile
  const pt = canvas(512), g = pt.getContext('2d');
  for (let n = 0; n < 230; n++) {
    const x = R() * 512, y = R() * 512, r = 14 + R() * 8;
    for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]) {
      const X = x + ox, Y = y + oy; if (X < -30 || X > 542 || Y < -30 || Y > 542) continue;
      g.fillStyle = 'rgba(14,16,8,.45)'; g.beginPath(); g.arc(X + SH[0] * 22, Y + SH[1] * 22, r * .9, 0, TAU); g.fill();
      for (let f = 0; f < 11; f++) { const q = f / 11 * TAU + n; g.strokeStyle = f % 2 ? '#34482a' : '#2a3b22'; g.lineWidth = 3.2; g.beginPath(); g.moveTo(X, Y); g.quadraticCurveTo(X + Math.cos(q) * r * .6, Y + Math.sin(q) * r * .6 - 2, X + Math.cos(q) * r, Y + Math.sin(q) * r + 2); g.stroke(); }
      g.fillStyle = '#4c5f34'; g.beginPath(); g.arc(X - LD[0] * -2, Y + LD[1] * 2, 3, 0, TAU); g.fill();
    }
  }
  st.city = { cells: [...cells.values()], CELL, river, notCity, fields, palms: pt };
  return st.city;
}

// the house: local metres around HOUSE
const HX = [-7, 7], HY = [-6, 6], CY = [-6.3, 3.0, -5.3, 1.6]; // outer box; courtyard x0 x1 y0 y1
const PALM = [-3.8, -2.6], WELL = [-1.6, -4.1], JAR = [2.25, -4.55];
function lazyHouse(st) {
  if (st.house) return st.house;
  const R = rng(9);
  const solid = new Path2D(); solid.rect(HX[0], HY[0], 14, 12); solid.rect(CY[0], CY[2], CY[1] - CY[0], CY[3] - CY[2]); solid.rect(-4.6, -6, 1, .8);
  const court = new Path2D(); court.rect(CY[0], CY[2], CY[1] - CY[0], CY[3] - CY[2]); court.rect(-4.6, -6.02, 1, .8);
  const h = 3.1, sx = SH[0] * h, sy = SH[1] * h; // shadow of the walls on the light side of the court
  const shade = new Path2D();
  shade.moveTo(CY[1], CY[2]); shade.lineTo(CY[1], CY[3]); shade.lineTo(CY[1] + sx, CY[3] + sy); shade.lineTo(CY[1] + sx, CY[2] + sy); shade.closePath();
  shade.moveTo(CY[0], CY[2]); shade.lineTo(CY[1], CY[2]); shade.lineTo(CY[1] + sx, CY[2] + sy); shade.lineTo(CY[0] + sx, CY[2] + sy); shade.closePath();
  // mud bricks on the wall heads, 0.34 × 0.17 m, running bond
  const bricks = new Path2D();
  const course = (x0, x1, y0, y1) => { for (let y = y0, r = 0; y < y1 - .01; y += .17, r++) { bricks.moveTo(x0, y); bricks.lineTo(x1, y); for (let x = x0 + (r % 2) * .17; x < x1; x += .34) { bricks.moveTo(x, y); bricks.lineTo(x, Math.min(y1, y + .17)); } } };
  course(HX[0], HX[1], HY[0], HY[0] + .7); course(HX[0], HX[1], HY[1] - .7, HY[1]);
  course(CY[0] - .7, CY[1] + .7, CY[2] - .7, CY[2]); course(CY[0] - .7, CY[1] + .7, CY[3], CY[3] + .7);
  const vcourse = (x0, x1, y0, y1) => { for (let x = x0, r = 0; x < x1 - .01; x += .17, r++) { bricks.moveTo(x, y0); bricks.lineTo(x, y1); for (let y = y0 + (r % 2) * .17; y < y1; y += .34) { bricks.moveTo(x, y); bricks.lineTo(Math.min(x1, x + .17), y); } } };
  vcourse(HX[0], HX[0] + .7, HY[0], HY[1]); vcourse(HX[1] - .7, HX[1], HY[0], HY[1]); vcourse(CY[0] - .7, CY[0], CY[2], CY[3]); vcourse(CY[1], CY[1] + .7, CY[2], CY[3]);
  // roof plaster streaks and the line of roof beams
  const streaks = new Path2D();
  for (let i = 0; i < 160; i++) { const x = HX[0] + R() * 14, y = HY[0] + R() * 12; if (x > CY[0] - .8 && x < CY[1] + .8 && y > CY[2] - .8 && y < CY[3] + .8) continue; const l = .2 + R() * .9, a = R() * TAU; streaks.moveTo(x, y); streaks.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); }
  // palm crown: fronds with leaflets
  const fronds = [];
  for (let f = 0; f < 23; f++) { const a = f / 23 * TAU + R() * .2, len = 2.6 + R() * .9, droop = (R() - .5) * .5; fronds.push([a, len, droop]); }
  st.house = { solid, court, shade, bricks, streaks, fronds };
  return st.house;
}

// the ground: self-similar sand, tiles at 10 mm × 4^k
const NT = 11, T0MM = 10;
function lazyGround(st) {
  if (st.gnd) return st.gnd;
  const R = rng(3), tiles = [];
  const t0 = canvas(512), g = t0.getContext('2d');
  g.fillStyle = '#806a4a'; g.fillRect(0, 0, 512, 512);
  const cols = [[226, 204, 164], [210, 182, 138], [196, 164, 120], [236, 220, 184], [176, 140, 100], [128, 104, 82], [216, 172, 140], [166, 156, 144]];
  for (let i = 0; i < 3600; i++) {
    const x = R() * 512, y = R() * 512, r = 3.5 + R() * R() * 8.5, e = .65 + R() * .35, rot = R() * Math.PI, [cr, cg, cb] = cols[Math.floor(R() * R() * cols.length)];
    const sh = .7 + R() * .18;
    for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]) {
      const X = x + ox, Y = y + oy; if (X < -r - 6 || X > 518 + r || Y < -r - 6 || Y > 518 + r) continue;
      g.fillStyle = 'rgba(40,26,14,.25)'; g.beginPath(); g.ellipse(X + SH[0] * r * .45, Y + SH[1] * r * .45, r, r * e, rot, 0, TAU); g.fill();
      const gr = g.createRadialGradient(X + LD[0] * r * .45, Y + LD[1] * r * .45, 0, X, Y, r * 1.1);
      gr.addColorStop(0, `rgb(${Math.min(255, cr * sh + 26)},${Math.min(255, cg * sh + 22)},${Math.min(255, cb * sh + 16)})`);
      gr.addColorStop(.6, `rgb(${cr * sh | 0},${cg * sh | 0},${cb * sh | 0})`);
      gr.addColorStop(1, `rgb(${cr * sh * .74 | 0},${cg * sh * .72 | 0},${cb * sh * .7 | 0})`);
      g.fillStyle = gr; g.beginPath(); g.ellipse(X, Y, r, r * e, rot, 0, TAU); g.fill();
    }
  }
  tiles.push(t0);
  for (let k = 1; k < NT; k++) { // 4×4 copies of the finer tile, then a little new mottling at this scale
    const tk = canvas(512), c = tk.getContext('2d'); c.imageSmoothingQuality = 'high';
    for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) c.drawImage(tiles[k - 1], a * 128, b * 128, 128, 128);
    for (let i = 0; i < 26; i++) {
      const x = R() * 512, y = R() * 512, r = 30 + R() * 90, dark = R() < .5;
      for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]) {
        const gr = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        gr.addColorStop(0, dark ? 'rgba(60,40,20,.09)' : 'rgba(235,215,175,.07)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gr; c.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
      }
    }
    tiles.push(tk);
  }
  // pebble sprites (shading and cast shadow baked in world orientation)
  const peb = [];
  const pc = [['#8d8478', '#3a342c'], ['#a79a82', '#4a3f30'], ['#b89a6e', '#5a4428'], ['#6f6a64', '#2a2622'], ['#c8b896', '#5d5038'], ['#94805f', '#3b2f1f'], ['#5e5248', '#221c18'], ['#b0a48e', '#4b4236']];
  for (let i = 0; i < 12; i++) {
    const cv = canvas(128), c = cv.getContext('2d'), n = 9, pts = [], [hi, lo] = pc[i % pc.length];
    for (let j = 0; j < n; j++) { const a = j / n * TAU, r = 34 * (.75 + R() * .3) * (j % 3 === 0 ? 1 : .92); pts.push([64 + Math.cos(a) * r, 64 + Math.sin(a) * r * (.7 + (i % 3) * .1)]); }
    c.fillStyle = 'rgba(30,18,8,.4)'; c.translate(SH[0] * 18, SH[1] * 18); c.fill(crPath(pts, true)); c.setTransform(1, 0, 0, 1, 0, 0);
    const gr = c.createRadialGradient(64 + LD[0] * 16, 64 + LD[1] * 16, 2, 64, 64, 40);
    gr.addColorStop(0, hi); gr.addColorStop(1, lo);
    c.fillStyle = gr; c.fill(crPath(pts, true));
    for (let j = 0; j < 60; j++) { c.fillStyle = R() < .5 ? 'rgba(255,245,220,.18)' : 'rgba(20,12,6,.2)'; c.fillRect(30 + R() * 68, 34 + R() * 60, 1.5, 1.5); }
    c.save(); c.clip(crPath(pts, true)); const sp = c.createRadialGradient(64 + LD[0] * 20, 64 + LD[1] * 20, 0, 64 + LD[0] * 20, 64 + LD[1] * 20, 18); sp.addColorStop(0, 'rgba(255,240,210,.35)'); sp.addColorStop(1, 'rgba(255,240,210,0)'); c.fillStyle = sp; c.fillRect(0, 0, 128, 128); c.restore();
    peb.push(cv);
  }
  st.gnd = { tiles, peb, pats: null };
  return st.gnd;
}

function drawSpheres(c, cam, dpr, p, t, a) {
  const k = place(c, cam, [0, 0], 1, dpr), px = dpr / k;
  const offer = smooth(seg(p, .12, .3)) * (1 - smooth(seg(p, .3, .4)));
  const spin = p + .55 * smooth(seg(p, .12, .3)) + .2 * smooth(seg(p, .3, .45)); // faster while the world is offered
  for (let i = 0; i < 9; i++) {
    const r = 1.075 + i * .052, [n, col, size] = SPH[i];
    const ang = (i % 2 ? -1 : 1) * spin * TAU * (.55 / (1 + i * .45)) + i * 1.7;
    c.globalAlpha = a * (.26 + .34 * offer + (i === 8 ? .15 : 0));
    c.strokeStyle = PAL.gold; c.lineWidth = (i === 8 ? 1.3 : .8) * px;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
    if (i === 8) { c.beginPath(); c.arc(0, 0, r + .012, 0, TAU); c.stroke(); }
    c.beginPath();
    for (let j = 0; j < n; j++) {
      const q = ang + j * TAU / n, big = i === 8 ? 1 : j % 6 === 0, len = (i === 8 ? .045 : big ? .016 : .008);
      c.moveTo(Math.cos(q) * r, Math.sin(q) * r); c.lineTo(Math.cos(q) * (r + len), Math.sin(q) * (r + len));
    }
    c.lineWidth = .9 * px; c.stroke();
    if (i === 7) { // the sphere of the fixed stars
      c.fillStyle = PAL.goldHi;
      for (let j = 0; j < 150; j++) { const q = ang * .5 + j * 2.399, rr = r + .004 + ((j * 37) % 11) / 11 * .03, tw = .55 + .45 * Math.sin(t * 1.3 + j); c.globalAlpha = a * (.25 + .5 * tw * ((j * 13) % 7) / 7); c.fillRect(Math.cos(q) * rr - px, Math.sin(q) * rr - px, 2 * px, 2 * px); }
    }
    if (col) { // the planet carried on its sphere
      const q = ang + 2.1, x = Math.cos(q) * r, y = Math.sin(q) * r, rr = size * 2.6 * px;
      c.globalAlpha = a * (.75 + .25 * offer);
      const g = c.createRadialGradient(x, y, 0, x, y, rr * 4); g.addColorStop(0, rgba(col, .5)); g.addColorStop(1, rgba(col, 0));
      c.fillStyle = g; c.fillRect(x - rr * 4, y - rr * 4, rr * 8, rr * 8);
      c.fillStyle = col; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill();
    }
  }
  c.globalAlpha = 1;
}

function drawMap(c, cam, dpr, p, t, st, aMs) {
  const M = lazyMap(st);
  const k = place(c, cam, [0, 0], 1, dpr), px = dpr / k;
  const disc = new Path2D(); disc.arc(0, 0, 1, 0, TAU);
  const wp = c.createPattern(M.waves, 'repeat'); wp.setTransform(new DOMMatrix().scale(.034 / 96));
  if (cam.L < 2.5) { c.fillStyle = OCEAN; c.fill(disc); c.save(); c.clip(disc); } else { c.save(); c.fillStyle = OCEAN; c.fillRect(-2, -2, 4, 4); }
  c.globalAlpha = aMs; c.fillStyle = wp; c.fillRect(-1.1, -1.1, 2.2, 2.2); c.globalAlpha = 1;
  if (aMs > 0) { c.strokeStyle = rgba(PAL.gold, .2 * aMs); c.lineWidth = .7 * px; c.beginPath(); c.arc(0, 0, .94, 0, TAU); c.stroke(); }
  c.fillStyle = LAND; c.fill(M.land);
  if (aMs > 0) {
    c.save(); c.clip(M.land); c.globalAlpha = aMs;
    const vp = c.createPattern(M.vellum, 'repeat'); vp.setTransform(new DOMMatrix().scale(.16 / 256));
    c.fillStyle = vp; c.fillRect(-1, -1, 2, 2);
    for (let i = 0; i < 7; i++) { // the seven climes: latitudinal bands in manuscript tints
      const y0 = proj(LON0, CLIME_LAT[i])[1], y1 = proj(LON0, CLIME_LAT[i + 1])[1];
      c.fillStyle = rgba(CLIME_TINT[i], .2); c.fillRect(-1, y0, 2, y1 - y0);
    }
    c.restore();
  }
  if (aMs > 0) { // coastal shading inside the land, as the copyists washed their coasts
    c.save(); c.clip(M.land); c.globalAlpha = aMs; c.lineJoin = 'round';
    c.strokeStyle = 'rgba(70,46,22,.2)'; c.lineWidth = 18 * px; c.stroke(M.land);
    c.strokeStyle = 'rgba(52,34,16,.22)'; c.lineWidth = 6 * px; c.stroke(M.land);
    c.restore(); c.globalAlpha = 1;
  }
  c.fillStyle = OCEAN; c.fill(M.lakes);
  if (aMs > 0) { c.save(); c.clip(M.lakes); c.globalAlpha = aMs; c.fillStyle = wp; c.fillRect(-1, -1, 2, 2); c.restore(); }
  c.globalAlpha = aMs;
  if (aMs > 0) {
    c.globalAlpha = aMs * (1 - smooth(c01((cam.L - .4) / 1.1))); // the copyists' peaks are glyphs; they leave before they balloon
    c.fillStyle = '#6a4630'; c.fill(M.peaks); c.fillStyle = 'rgba(30,18,10,.45)'; c.fill(M.shade);
    c.globalAlpha = aMs;
    c.strokeStyle = '#3d6474'; c.lineWidth = 2.2 * px; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(M.rivers);
    c.strokeStyle = '#8fb4b4'; c.lineWidth = .8 * px; c.stroke(M.rivers);
  }
  c.globalAlpha = Math.max(aMs, .35);
  c.strokeStyle = 'rgba(28,20,10,.8)'; c.lineWidth = 1.3 * px; c.stroke(M.land); c.stroke(M.lakes);
  c.globalAlpha = aMs;
  if (aMs > 0) {
    c.strokeStyle = 'rgba(243,217,143,.32)'; c.lineWidth = .6 * px; c.stroke(M.land);
    // clime boundaries across the whole disc, then the gold of the offering, clime by clime
    const lit = (i) => smooth(seg(p, .12 + i * .024, .12 + (i + 1) * .024)) * aMs;
    c.save(); c.clip(disc);
    for (let i = 0; i < 7; i++) { // the gold of the offering, clime by clime: gilded land, a faint gilt over the sea
      const g = lit(i); if (g <= 0) continue;
      const y0 = proj(LON0, CLIME_LAT[i])[1], y1 = proj(LON0, CLIME_LAT[i + 1])[1];
      c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba(PAL.gold, .045 * g); c.fillRect(-1, y0, 2, y1 - y0);
      c.save(); c.clip(M.land);
      c.globalCompositeOperation = 'soft-light'; c.fillStyle = rgba(PAL.goldHi, .8 * g); c.fillRect(-1, y0, 2, y1 - y0);
      const sweep = (t * .05 + i * .17) % 1, gr = c.createLinearGradient(-1, 0, 1, 0);
      gr.addColorStop(0, 'rgba(243,217,143,0)'); gr.addColorStop(c01(sweep - .1), 'rgba(243,217,143,0)'); gr.addColorStop(sweep, rgba(PAL.goldHi, .14 * g)); gr.addColorStop(c01(sweep + .1), 'rgba(243,217,143,0)'); gr.addColorStop(1, 'rgba(243,217,143,0)');
      c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.fillRect(-1, y0, 2, y1 - y0);
      c.restore();
    }
    c.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 8; i++) { // the clime boundaries: ink lines that turn to gold thread
      const y = proj(LON0, CLIME_LAT[i])[1], g = Math.max(lit(Math.min(6, i)), i ? lit(i - 1) : 0);
      if (g > .01) { c.strokeStyle = rgba(PAL.gold, .14 * g); c.lineWidth = 5 * px; c.beginPath(); c.moveTo(-1, y); c.lineTo(1, y); c.stroke(); }
      c.strokeStyle = g > .01 ? rgba(PAL.goldHi, .35 + .55 * g) : 'rgba(40,28,14,.5)'; c.lineWidth = (.8 + g * .4) * px;
      c.beginPath(); c.moveTo(-1, y); c.lineTo(1, y); c.stroke();
    }
    c.restore();
  }
  if (aMs > 0 && cam.L < 2.5) { // the plate: warm light at its heart, shade toward the rim
    c.globalAlpha = aMs;
    const g = c.createRadialGradient(-.05, -.08, .05, 0, 0, 1.02); g.addColorStop(0, 'rgba(255,226,170,.1)'); g.addColorStop(.6, 'rgba(255,226,170,0)'); g.addColorStop(.86, 'rgba(8,10,16,0)'); g.addColorStop(1, 'rgba(8,10,16,.5)');
    c.fillStyle = g; c.fillRect(-1, -1, 2, 2);
  }
  c.restore();
  c.globalAlpha = aMs;
  if (aMs > 0 && cam.L < 2.5) { // the border of the encircling ocean
    c.strokeStyle = PAL.gold; c.lineWidth = 1.6 * px; c.beginPath(); c.arc(0, 0, 1, 0, TAU); c.stroke();
    c.lineWidth = .7 * px; c.beginPath(); c.arc(0, 0, 1.018, 0, TAU); c.stroke();
    c.fillStyle = PAL.gold; c.beginPath(); for (let j = 0; j < 120; j++) { const q = j * TAU / 120, x = Math.cos(q) * 1.009, y = Math.sin(q) * 1.009; c.moveTo(x + 1.1 * px, y); c.arc(x, y, 1.1 * px, 0, TAU); } c.fill();
  }
  if (aMs > 0) { // cities
    c.globalCompositeOperation = 'lighter';
    M.cities.forEach(([x, y, r]) => { const rr = 7 * r * px, g = c.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, 'rgba(243,217,143,.5)'); g.addColorStop(1, 'rgba(243,217,143,0)'); c.fillStyle = g; c.fillRect(x - rr, y - rr, rr * 2, rr * 2); });
    c.globalCompositeOperation = 'source-over';
    M.cities.forEach(([x, y, r]) => { c.fillStyle = PAL.goldHi; c.beginPath(); c.arc(x, y, 1.8 * r * px, 0, TAU); c.fill(); });
  }
  c.globalAlpha = 1;
}

function drawRegion(c, cam, dpr, t, st, a) {
  const G = lazyRegion(st), M = lazyMap(st);
  const k = place(c, cam, KUFA, K, dpr), px = dpr / k, L = cam.L;
  c.globalAlpha = a;
  const vp = c.createPattern(M.vellum, 'repeat'); vp.setTransform(new DOMMatrix().scale(.05 / 256)); // desert grain
  c.save(); c.globalAlpha = a * .7; c.fillStyle = vp; c.fillRect(-6, -6, 12, 12); c.restore();
  const mp = c.createPattern(G.mottle, 'repeat'); mp.setTransform(new DOMMatrix().scale(1.7 / 256));
  c.fillStyle = mp; c.fillRect(-6, -6, 12, 12);
  c.strokeStyle = 'rgba(70,52,30,.3)'; c.lineWidth = 1 * px; c.stroke(G.dunes);
  c.strokeStyle = 'rgba(64,46,26,.28)'; c.lineWidth = Math.max(1.6 * px, .004); c.stroke(G.wadis); c.strokeStyle = 'rgba(200,176,130,.18)'; c.lineWidth = Math.max(.7 * px, .0015); c.stroke(G.wadis);
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = 'rgba(60,40,24,.22)'; c.lineWidth = .32; c.stroke(G.zagros); c.lineWidth = .16; c.stroke(G.zagros);
  // the Sawad, the black land of Iraq: feathered edge, field patchwork inside
  c.fillStyle = 'rgba(58,72,44,.2)'; c.strokeStyle = 'rgba(58,72,44,.2)'; c.lineWidth = .07; c.stroke(G.sawad); c.lineWidth = .035; c.stroke(G.sawad);
  c.fillStyle = 'rgba(58,72,44,.82)'; c.fill(G.sawad);
  const fp = c.createPattern(G.fields, 'repeat'); fp.setTransform(new DOMMatrix().scale(.05 / 256));
  c.save(); c.clip(G.sawad); c.globalAlpha = a * .55; c.fillStyle = fp; c.fillRect(-6, -6, 12, 12); c.restore();
  c.globalAlpha = a * (1 - smooth(c01((L - 5) / 1.2))); c.fillStyle = 'rgba(28,44,28,.8)'; c.fill(G.groves); c.globalAlpha = a;
  c.fillStyle = 'rgba(28,48,52,.85)'; c.fill(G.marsh);
  c.strokeStyle = 'rgba(120,150,110,.3)'; c.lineWidth = .8 * px; c.stroke(G.marsh);
  c.strokeStyle = 'rgba(46,60,40,.75)'; c.lineWidth = Math.max(3 * px, .006); c.stroke(G.canals);
  c.strokeStyle = 'rgba(36,52,62,.85)'; c.lineWidth = Math.max(1.1 * px, .0012); c.stroke(G.canals);
  c.strokeStyle = 'rgba(44,58,38,.9)'; c.lineWidth = Math.max(4 * px, .0042); c.stroke(G.rivers);
  c.strokeStyle = '#121d26'; c.lineWidth = Math.max(2.2 * px, .002); c.stroke(G.rivers);
  c.strokeStyle = 'rgba(150,176,180,.45)'; c.lineWidth = Math.max(.7 * px, .0006); c.stroke(G.rivers);
  c.fillStyle = PAL.goldHi; G.towns.forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 2 * px, 0, TAU); c.fill(); });
  // Kufa: a pale patch of mud brick west of the river, a gold point and a slow ring
  c.fillStyle = 'rgba(172,152,116,.8)'; c.fill(G.city);
  const mk = 1 - smooth(c01((L - 5.6) / 1.2));
  if (mk > 0) {
    c.globalAlpha = a * mk; c.globalCompositeOperation = 'lighter';
    const gr = c.createRadialGradient(0, 0, 0, 0, 0, 26 * px); gr.addColorStop(0, 'rgba(243,217,143,.7)'); gr.addColorStop(1, 'rgba(243,217,143,0)');
    c.fillStyle = gr; c.fillRect(-26 * px, -26 * px, 52 * px, 52 * px);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = PAL.goldHi; c.beginPath(); c.arc(0, 0, 3 * px, 0, TAU); c.fill();
    c.strokeStyle = rgba(PAL.goldHi, .55); c.lineWidth = 1 * px; c.beginPath(); c.arc(0, 0, (14 + 3 * Math.sin(t * 1.4)) * px, 0, TAU); c.stroke();
  }
  c.globalAlpha = 1;
}

function drawGround(c, cam, dpr, st, a) {
  const G = lazyGround(st);
  if (!G.pats) G.pats = G.tiles.map((tl) => c.createPattern(tl, 'repeat'));
  const k = place(c, cam, ANT0, MM, dpr); // device px per mm
  const base = c.getTransform();
  c.setTransform(1, 0, 0, 1, 0, 0);
  const f = Math.log(512 / (T0MM * k)) / Math.log(4); // tile index whose texel is one device pixel
  const fine = Math.max(0, Math.min(NT - 1, Math.floor(f))), coarse = Math.min(NT - 1, fine + 1);
  const fr = f < 0 ? 0 : f - Math.floor(f);
  const lay = (i, al) => {
    if (al <= 0) return;
    const s = T0MM * 4 ** i / 512, pat = G.pats[i];
    pat.setTransform(base.scale(s));
    c.globalAlpha = al; c.fillStyle = pat; c.fillRect(0, 0, cam.W * dpr, cam.H * dpr);
  };
  if (f >= NT - 1) lay(NT - 1, a);
  else { lay(coarse, a); lay(fine, a * (1 - smooth(fr))); }
  c.globalAlpha = 1;
}

function drawCity(c, cam, dpr, t, st, a) {
  const C = lazyCity(st);
  const k = place(c, cam, KUFA, MW, dpr), px = dpr / k;
  const [x0, y0, x1, y1] = viewRect(cam, KUFA, MW, 60);
  c.globalAlpha = a;
  // fields and palm groves outside the city
  c.save(); c.clip(C.notCity, 'evenodd');
  ['rgba(84,98,58,.55)', 'rgba(120,112,66,.5)', 'rgba(64,82,52,.6)'].forEach((col, i) => { c.fillStyle = col; c.fill(C.fields[i]); });
  c.lineCap = 'round'; c.lineJoin = 'round';
  const pp = smooth(c01((cam.L - 8.4) / 1.2)), pat = pp > 0 && c.createPattern(C.palms, 'repeat');
  if (pat) pat.setTransform(new DOMMatrix().scale(128 / 512));
  [[0, 1000], [-700, 1500]].forEach(([dx, w]) => { // palm groves along both banks, deeper on the east
    c.save(); c.translate(dx, 0); c.strokeStyle = 'rgba(36,48,30,.92)'; c.lineWidth = w; c.stroke(C.river);
    if (pat) { c.globalAlpha = a * pp; c.strokeStyle = pat; c.stroke(C.river); c.globalAlpha = a; }
    c.restore();
  });
  c.restore();
  // the Euphrates
  c.strokeStyle = 'rgba(52,62,40,.95)'; c.lineWidth = 270; c.stroke(C.river);
  c.strokeStyle = '#121d26'; c.lineWidth = 222; c.stroke(C.river);
  c.strokeStyle = 'rgba(150,170,170,.12)'; c.lineWidth = 120; c.stroke(C.river);
  c.strokeStyle = rgba(PAL.goldHi, .18 + .05 * Math.sin(t)); c.lineWidth = Math.max(1.2 * px, 6); c.setLineDash([60, 140]); c.lineDashOffset = -t * 12; c.stroke(C.river); c.setLineDash([]);
  // houses, by visible cell
  const roofs = ['#ae9670', '#a28a66', '#b8a07a'];
  C.cells.forEach((cl) => {
    const cx = cl.cx * C.CELL, cy = cl.cy * C.CELL;
    if (cx > x1 || cx + C.CELL < x0 || cy > y1 || cy + C.CELL < y0) return;
    c.fillStyle = 'rgba(30,18,8,.42)'; c.fill(cl.shade);
    roofs.forEach((col, i) => { c.fillStyle = col; c.fill(cl.roofs[i]); });
    c.fillStyle = '#4e3d2a'; c.fill(cl.court);
    c.fillStyle = '#8a7152'; c.fill(cl.lit);
    if (cam.L > 9.6) { c.strokeStyle = 'rgba(40,26,12,.35)'; c.lineWidth = .8 * px; roofs.forEach((_, i) => c.stroke(cl.roofs[i])); }
  });
  // the mosque and, on its qibla side, the governor's palace
  const wall = 3.2, sx = SH[0] * 8, sy = SH[1] * 8;
  c.fillStyle = 'rgba(30,18,8,.45)'; c.fillRect(-55 + sx, -55 + sy, 110, 110); c.fillRect(-52 + sx * .9, -168 + sy * .9, 104, 104);
  c.fillStyle = '#bca684'; c.fillRect(-55, -55, 110, 110);
  c.fillStyle = '#9f8a68'; c.fillRect(-47, -30, 94, 77);
  c.fillStyle = '#c9b48f'; c.fillRect(-47 + Math.max(0, sx * .6), -30 + Math.max(0, sy * .6), 94 - Math.abs(sx * .6), 77 - Math.abs(sy * .6));
  if (cam.L > 9) { // arcades along the court and rows of columns under the qibla roof
    c.fillStyle = 'rgba(60,44,26,.75)';
    for (let x = -46; x <= 46; x += 4.6) { c.beginPath(); c.arc(x, -30, .7, 0, TAU); c.arc(x, 47, .7, 0, TAU); c.fill(); }
    for (let y = -30; y <= 47; y += 4.6) { c.beginPath(); c.arc(-47, y, .7, 0, TAU); c.arc(47, y, .7, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(70,52,30,.35)'; c.lineWidth = .9 * px; c.beginPath(); for (let y = -52; y < -30; y += 4.4) { c.moveTo(-55 + wall, y); c.lineTo(55 - wall, y); } c.stroke();
  }
  c.strokeStyle = 'rgba(50,34,18,.6)'; c.lineWidth = Math.max(px, .6); c.strokeRect(-55, -55, 110, 110);
  c.fillStyle = '#b39c78'; c.fillRect(-52, -167, 104, 104);
  c.fillStyle = '#8f7a5a'; c.fillRect(-34, -148, 68, 62);
  c.fillStyle = '#b39c78'; for (let i = 0; i <= 8; i++) { const q = -52 + i * 13; [[q, -167], [q, -63], [-52, -167 + i * 13], [52, -167 + i * 13]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 3.2, 0, TAU); c.fill(); }); }
  c.strokeStyle = 'rgba(50,34,18,.55)'; c.strokeRect(-52, -167, 104, 104);
  c.globalAlpha = 1;
}

function drawHouse(c, cam, dpr, t, st, a) {
  const Hs = lazyHouse(st);
  const k = place(c, cam, HOUSE, MW, dpr), px = dpr / k, ppm = k / dpr;
  c.globalAlpha = a;
  // wall shadows on the court floor, then the palm's dappled shadow
  c.fillStyle = 'rgba(28,16,6,.5)'; c.fill(Hs.shade);
  const sway = Math.sin(t * .7) * .015;
  c.save(); c.clip(Hs.court);
  c.translate(SH[0] * 6.2, SH[1] * 6.2); c.fillStyle = 'rgba(28,16,6,.42)';
  Hs.fronds.forEach(([q, len, dr]) => { c.save(); c.translate(PALM[0], PALM[1]); c.rotate(q + sway); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * .5, -.32 + dr * .3, len, dr); c.quadraticCurveTo(len * .5, .32 + dr * .3, 0, 0); c.fill(); c.restore(); });
  c.restore();
  // roofs and wall heads
  c.fillStyle = '#ad9570'; c.fill(Hs.solid, 'evenodd');
  if (ppm > 8) { c.strokeStyle = `rgba(80,56,30,${.25 * c01((ppm - 8) / 20)})`; c.lineWidth = Math.max(px, .015); c.stroke(Hs.streaks); }
  c.fillStyle = '#bba37c';
  [[HX[0], HY[0], 14, .7], [HX[0], HY[1] - .7, 14, .7], [HX[0], HY[0], .7, 12], [HX[1] - .7, HY[0], .7, 12], [CY[0] - .7, CY[2] - .7, CY[1] - CY[0] + 1.4, .7], [CY[0] - .7, CY[3], CY[1] - CY[0] + 1.4, .7], [CY[0] - .7, CY[2], .7, CY[3] - CY[2]], [CY[1], CY[2], .7, CY[3] - CY[2]]].forEach(([x, y, w, h]) => c.fillRect(x, y, w, h));
  c.fillStyle = '#ad9570'; c.fillRect(-4.6, -6.05, 1, 1.47); // the entrance passage stays open
  if (ppm > 14) { c.strokeStyle = `rgba(70,48,24,${.45 * c01((ppm - 14) / 30)})`; c.lineWidth = Math.max(.6 * px, .01); c.stroke(Hs.bricks); }
  c.strokeStyle = 'rgba(40,26,12,.55)'; c.lineWidth = Math.max(px, .03); c.strokeRect(HX[0], HY[0], 14, 12); c.strokeRect(CY[0], CY[2], CY[1] - CY[0], CY[3] - CY[2]);
  // the well and the water jar
  c.fillStyle = 'rgba(28,16,6,.45)'; c.beginPath(); c.arc(WELL[0] + SH[0] * .6, WELL[1] + SH[1] * .6, .8, 0, TAU); c.fill();
  for (let i = 0; i < 14; i++) { c.fillStyle = i % 2 ? '#8e8170' : '#a39582'; c.beginPath(); c.arc(WELL[0], WELL[1], .78, i / 14 * TAU, (i + 1) / 14 * TAU); c.arc(WELL[0], WELL[1], .52, (i + 1) / 14 * TAU, i / 14 * TAU, true); c.fill(); }
  c.fillStyle = '#0b0f12'; c.beginPath(); c.arc(WELL[0], WELL[1], .52, 0, TAU); c.fill();
  c.fillStyle = rgba(PAL.goldHi, .35 + .1 * Math.sin(t * 2)); c.beginPath(); c.ellipse(WELL[0] + LD[0] * .2, WELL[1] + LD[1] * .2, .12, .05, .5, 0, TAU); c.fill();
  c.fillStyle = 'rgba(28,16,6,.45)'; c.beginPath(); c.arc(JAR[0] + SH[0] * .5, JAR[1] + SH[1] * .5, .38, 0, TAU); c.fill();
  { const g = c.createRadialGradient(JAR[0] + LD[0] * .15, JAR[1] + LD[1] * .15, .02, JAR[0], JAR[1], .4); g.addColorStop(0, '#c98a5c'); g.addColorStop(1, '#6a3a22'); c.fillStyle = g; c.beginPath(); c.arc(JAR[0], JAR[1], .38, 0, TAU); c.fill(); c.fillStyle = '#24140a'; c.beginPath(); c.arc(JAR[0], JAR[1], .13, 0, TAU); c.fill(); }
  // a reed mat by the north rooms
  c.save(); c.translate(-1.9, .9); c.fillStyle = 'rgba(28,16,6,.3)'; c.fillRect(-1.3 + SH[0] * .05, -.6 + SH[1] * .05, 2.6, 1.2); c.fillStyle = '#b89a5e'; c.fillRect(-1.3, -.6, 2.6, 1.2);
  if (ppm > 20) { c.strokeStyle = 'rgba(110,80,36,.55)'; c.lineWidth = Math.max(px, .008); c.beginPath(); for (let x = -1.3; x <= 1.3; x += .05) { c.moveTo(x, -.6); c.lineTo(x, .6); } c.stroke(); }
  c.restore();
  // the palm crown
  c.save(); c.translate(PALM[0], PALM[1]);
  Hs.fronds.forEach(([q, len, dr], i) => {
    c.save(); c.rotate(q + sway * (1 + (i % 3) * .3));
    c.fillStyle = i % 2 ? '#2f4527' : '#283b22'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * .5, -.34 + dr * .3, len, dr); c.quadraticCurveTo(len * .5, .34 + dr * .3, 0, 0); c.fill();
    c.strokeStyle = '#5e6e3e'; c.lineWidth = Math.max(px, .03); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * .5, dr * .3, len, dr); c.stroke();
    if (ppm > 30) { c.strokeStyle = 'rgba(12,18,8,.6)'; c.lineWidth = Math.max(px, .012); c.beginPath(); for (let s = .2; s < .95; s += .06) { const x = len * s, y = dr * s * s, w = .3 * Math.sin(Math.PI * s); c.moveTo(x, y); c.lineTo(x + .12, y - w); c.moveTo(x, y); c.lineTo(x + .12, y + w); } c.stroke(); }
    c.restore();
  });
  c.fillStyle = '#b07a3a'; for (let i = 0; i < 5; i++) { const q = i * 1.3; c.beginPath(); c.arc(Math.cos(q) * .3, Math.sin(q) * .3, .12, 0, TAU); c.fill(); }
  c.fillStyle = '#4f5a32'; c.beginPath(); c.arc(0, 0, .16, 0, TAU); c.fill();
  c.restore();
  c.globalAlpha = 1;
}

// pebbles: three scales of hashed cells around the ant; nothing large on the ant's path
const PEB = [[300, .34, 24, 70, .12, .3], [50, .5, 3.5, 12, .3, .8], [12, .5, 1, 2.6, 2, 5]]; // cell mm, prob, min, max, fade-in px/mm range
function drawPebbles(c, cam, dpr, st) {
  const G = lazyGround(st);
  const k = place(c, cam, ANT0, MM, dpr), z = k / dpr; // css px per mm
  const [x0, y0, x1, y1] = viewRect(cam, ANT0, MM, 80);
  PEB.forEach(([cell, prob, mn, mx, za, zb], li) => {
    const al = smooth(c01((z - za) / (zb - za))); if (al <= 0) return;
    c.globalAlpha = al;
    for (let i = Math.floor(x0 / cell); i <= Math.floor(x1 / cell); i++) for (let j = Math.floor(y0 / cell); j <= Math.floor(y1 / cell); j++) {
      if (hash(i, j, li) > prob) continue;
      const x = (i + hash(i, j, li + 7)) * cell, y = (j + hash(i, j, li + 3)) * cell, s = mn + (mx - mn) * hash(i, j, li + 11) ** 2;
      const along = x * ANT_DIR[0] + y * ANT_DIR[1], across = -x * ANT_DIR[1] + y * ANT_DIR[0];
      if (along > -120 && along < 40 && Math.abs(across) < s * .6 + 6) continue;
      const v = Math.floor(hash(i, j, li + 5) * 12);
      c.drawImage(G.peb[v], x - s, y - s, s * 2, s * 2);
    }
  });
  c.globalAlpha = 1;
}

// the ant (Messor, a harvester) carrying a barley husk; units mm, heading +x
const LEGS = [[1.75, .5, 3.25, 2.3, 1.5, 1.42, 0], [1.0, .42, 1.0, 2.85, 1.52, 1.5, .5], [.45, .38, -1.55, 2.75, 1.82, 1.78, 0]]; // hip x,y foot x,y femur tibia phase
const MESO = [[0, 0], [.25, .38], [.75, .36], [1.1, .5], [1.55, .7], [1.95, .55], [2.2, .28], [2.2, -.28], [1.95, -.55], [1.55, -.7], [1.1, -.5], [.75, -.36], [.25, -.38]];
const HEAD = [[2.35, 0], [2.45, .75], [2.9, 1.05], [3.6, .95], [3.95, .55], [4.02, 0], [3.95, -.55], [3.6, -.95], [2.9, -1.05], [2.45, -.75]];
function antLegs(dist) {
  const out = [], STR = 1.5, CL = 3.0;
  LEGS.forEach(([hx, hy, fx, fy, a, b, ph], li) => [1, -1].forEach((side) => {
    const u = ((dist / CL + ph + (side < 0 ? .5 : 0)) % 1 + 1) % 1;
    let off, lift = 0;
    if (u < .5) off = STR / 2 - (u / .5) * STR; else { const v = (u - .5) / .5; off = -STR / 2 + smooth(v) * STR; lift = Math.sin(Math.PI * v); }
    const H = [hx, hy * side], F = [fx + off, fy * side * (1 - .1 * lift)];
    let dx = F[0] - H[0], dy = F[1] - H[1], d = Math.hypot(dx, dy);
    const dd = Math.min(a + b - .02, Math.max(Math.abs(a - b) + .02, d));
    const al = Math.acos(c01((a * a + dd * dd - b * b) / (2 * a * dd))), base = Math.atan2(dy, dx);
    const k1 = [H[0] + a * Math.cos(base + al), H[1] + a * Math.sin(base + al)], k2 = [H[0] + a * Math.cos(base - al), H[1] + a * Math.sin(base - al)];
    const Kn = Math.abs(k1[1]) > Math.abs(k2[1]) ? k1 : k2;
    const Fe = [H[0] + dx / d * dd, H[1] + dy / d * dd];
    const tx = Fe[0] - Kn[0], ty = Fe[1] - Kn[1], tl = Math.hypot(tx, ty), tarsus = (1.15 - .3 * lift) * (li === 2 ? 1.1 : 1);
    const T = [Fe[0] + tx / tl * tarsus * .55 + (li === 0 ? .3 : li === 2 ? -.3 : 0), Fe[1] + ty / tl * tarsus * .55 + side * tarsus * .4];
    out.push({ H, Kn, F: Fe, T, lift });
  }));
  return out;
}
function huskPath(L = 7.6, W = 2.3) {
  const pth = new Path2D(), n = 24;
  for (let i = 0; i <= n; i++) { const s = -1 + 2 * i / n, w = W / 2 * (1 - s * s) ** .55 * (1 - .18 * s); i ? pth.lineTo(s * L / 2, -w) : pth.moveTo(s * L / 2, -w); }
  for (let i = n; i >= 0; i--) { const s = -1 + 2 * i / n, w = W / 2 * (1 - s * s) ** .55 * (1 - .18 * s); pth.lineTo(s * L / 2, w * .92); }
  pth.closePath();
  return pth;
}
function drawAnt(c, cam, dpr, p, t, st) {
  const pos = antAt(p), k = place(c, cam, pos, MM, dpr), z = k / dpr;
  if (z * 8 < 1.2) return;
  c.rotate(ANT_H);
  const dist = antDist(p), legs = antLegs(dist), px = dpr / k;
  const ca = Math.cos(-ANT_H), sa = Math.sin(-ANT_H), sh = [SH[0] * ca - SH[1] * sa, SH[0] * sa + SH[1] * ca], ld = [-sh[0] / .8, -sh[1] / .8];
  const st2 = st.ant || (st.ant = { meso: crPath(MESO, true), head: crPath(HEAD, true), husk: huskPath(6.8, 2.1) });
  const bob = Math.sin(dist / 1.5 * TAU) * .03;
  const HUSK = [7.75, .42, .26];
  const body = (fill, detail) => {
    c.fillStyle = fill; c.strokeStyle = fill; c.lineCap = 'round'; c.lineJoin = 'round';
    legs.forEach(({ H, Kn, F, T }) => {
      c.lineWidth = .3; c.beginPath(); c.moveTo(H[0], H[1]); c.lineTo(Kn[0], Kn[1]); c.stroke();
      c.lineWidth = .19; c.beginPath(); c.moveTo(Kn[0], Kn[1]); c.lineTo(F[0], F[1]); c.stroke();
      c.lineWidth = .1; c.beginPath(); c.moveTo(F[0], F[1]); c.lineTo(T[0], T[1]); c.stroke();
      c.beginPath(); c.arc(Kn[0], Kn[1], .17, 0, TAU); c.fill();
    });
    c.beginPath(); c.ellipse(-2.75, 0, 1.78, 1.36 + bob, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(-.95, 0, .38, .44, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(-.42, 0, .3, .3, 0, 0, TAU); c.fill(); c.fillRect(-1, -.12, 1.2, .24);
    c.fill(st2.meso); c.fill(st2.head);
    // mandibles closed on the husk
    [1, -1].forEach((sd) => { c.beginPath(); c.moveTo(3.85, .52 * sd); c.quadraticCurveTo(4.65, .62 * sd, 4.95, .05 * sd); c.lineTo(4.55, .22 * sd); c.quadraticCurveTo(4.3, .3 * sd, 3.95, .18 * sd); c.closePath(); c.fill(); });
    // antennae: scape back and out, funiculus forward, ending in a club
    [1, -1].forEach((sd, i) => {
      const sw = .18 * Math.sin(t * 1.6 + i * 2 + dist * .8), e = [3.25, (1.75 + sw * .3) * sd], tip = [5.1 + sw, (2.35 + sw * .6) * sd];
      c.lineWidth = .11; c.beginPath(); c.moveTo(3.8, .42 * sd); c.lineTo(e[0], e[1]); c.stroke();
      c.lineWidth = .085; c.beginPath(); c.moveTo(e[0], e[1]); c.quadraticCurveTo(4.3, (2.25 + sw * .4) * sd, tip[0], tip[1]); c.stroke();
      c.beginPath(); c.ellipse(tip[0] - .08, tip[1] - .05 * sd, .22, .11, .55 * sd, 0, TAU); c.fill();
      if (detail) { c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = .02; c.beginPath(); for (let s = .15; s < 1; s += .1) { const qx = mix(e[0], tip[0], s), qy = mix(e[1], tip[1], s) + Math.sin(Math.PI * s) * .25 * sd; c.moveTo(qx - .05, qy - .07); c.lineTo(qx + .05, qy + .07); } c.stroke(); c.strokeStyle = fill; }
    });
  };
  // shadows on the earth: body low, husk higher
  c.save(); c.translate(sh[0] * 1.3, sh[1] * 1.3); body('rgba(26,14,4,.36)', false); c.restore();
  c.save(); c.translate(HUSK[0] + sh[0] * 2.6, HUSK[1] + sh[1] * 2.6); c.rotate(HUSK[2]); c.fillStyle = 'rgba(26,14,4,.3)'; c.fill(st2.husk); c.restore();
  body('#150e08', z > 20);
  if (z > 6) { // chitin: sheen toward the light, a thin warm rim, fine hairs
    c.globalCompositeOperation = 'lighter';
    [[-2.75, 0, 1.5, .35], [1.45, 0, .7, .22], [3.15, 0, .8, .26], [-.95, 0, .3, .15]].forEach(([x, y, r, al]) => {
      const hx = x + ld[0] * r * .45, hy = y + ld[1] * r * .45, g = c.createRadialGradient(hx, hy, 0, hx, hy, r);
      g.addColorStop(0, `rgba(255,214,160,${al})`); g.addColorStop(.4, `rgba(170,90,40,${al * .4})`); g.addColorStop(1, 'rgba(120,50,20,0)');
      c.fillStyle = g; c.beginPath(); c.arc(hx, hy, r, 0, TAU); c.fill();
    });
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = 'rgba(90,40,22,.55)'; [1, -1].forEach((sd) => { c.beginPath(); c.ellipse(3.05, .86 * sd, .23, .14, .3 * sd, 0, TAU); c.fill(); });
    c.fillStyle = 'rgba(255,230,190,.5)'; [1, -1].forEach((sd) => { c.beginPath(); c.arc(3.05 + ld[0] * .07, .86 * sd + ld[1] * .05, .045, 0, TAU); c.fill(); });
    if (z > 18) {
      c.strokeStyle = 'rgba(232,206,160,.4)'; c.lineWidth = Math.max(px * .8, .016); c.beginPath();
      for (let i = 0; i < 46; i++) { const q = i / 46 * TAU, x = -2.75 + Math.cos(q) * 1.78, y = Math.sin(q) * 1.36, l = .18 + .1 * ((i * 7) % 3); c.moveTo(x, y); c.lineTo(x + Math.cos(q + .5) * l, y + Math.sin(q + .5) * l); }
      for (let i = 0; i < 18; i++) { const q = i / 18 * TAU, x = 3.15 + Math.cos(q) * .95, y = Math.sin(q) * 1; c.moveTo(x, y); c.lineTo(x + Math.cos(q + .4) * .13, y + Math.sin(q + .4) * .13); }
      c.stroke();
    }
    c.strokeStyle = 'rgba(243,217,143,.22)'; c.lineWidth = Math.max(px, .02); c.beginPath(); c.ellipse(-2.75, 0, 1.78, 1.36 + bob, 0, -1.9, .2); c.stroke(); c.stroke(st2.head);
  }
  // the husk: pale, papery, ribbed, light passing through it
  c.save(); c.translate(HUSK[0], HUSK[1]); c.rotate(HUSK[2]);
  const hg = c.createLinearGradient(0, -1.1, 0, 1.1); hg.addColorStop(0, '#c4ad7a'); hg.addColorStop(.4, '#f1e2b8'); hg.addColorStop(.62, '#dcc795'); hg.addColorStop(1, '#a88f5e');
  c.globalAlpha = .94; c.fillStyle = hg; c.fill(st2.husk); c.globalAlpha = 1;
  if (z > 4) {
    c.strokeStyle = 'rgba(140,112,66,.5)'; c.lineWidth = Math.max(px * .8, .03); c.beginPath();
    [-.62, -.32, 0, .3, .58].forEach((f) => { for (let i = 0; i <= 20; i++) { const s = -.97 + 1.94 * i / 20, w = 2.1 / 2 * (1 - s * s) ** .55 * (1 - .18 * s) * f; i ? c.lineTo(s * 3.4, w) : c.moveTo(s * 3.4, w); } });
    c.stroke();
    c.strokeStyle = 'rgba(255,250,232,.55)'; c.lineWidth = Math.max(px, .05); c.beginPath(); for (let i = 0; i <= 20; i++) { const s = -.9 + 1.7 * i / 20, w = -2.1 / 2 * (1 - s * s) ** .55 * (1 - .18 * s) * .78; i ? c.lineTo(s * 3.4, w) : c.moveTo(s * 3.4, w); } c.stroke();
    c.strokeStyle = 'rgba(120,96,58,.75)'; c.lineWidth = Math.max(px, .045); c.stroke(st2.husk);
    c.strokeStyle = '#c9b68a'; c.lineWidth = .06; c.beginPath(); c.moveTo(3.4, 0); c.quadraticCurveTo(4.1, -.1, 4.7, -.05); c.stroke(); // the broken awn
  }
  c.restore();
}

function drawLight(c, cam, dpr, p) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  const W = cam.W * dpr, H = cam.H * dpr, deep = smooth(c01((cam.L - 4) / 9));
  const o = toScreen(cam, cam.p > .75 ? antAt(cam.p) : cam.tgt), ox = o[0] * dpr, oy = o[1] * dpr, R = Math.hypot(W, H) * mix(.75, .55, deep);
  const g = c.createRadialGradient(ox, oy, R * .18, ox, oy, R);
  g.addColorStop(0, 'rgba(7,11,22,0)'); g.addColorStop(.45, `rgba(7,11,22,${.12 + .2 * deep})`); g.addColorStop(1, `rgba(5,8,16,${.5 + .38 * deep})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (cam.L > 13) { // warm pool on the ground
    c.globalCompositeOperation = 'soft-light';
    const g2 = c.createRadialGradient(ox, oy, 0, ox, oy, R * .62); g2.addColorStop(0, `rgba(255,200,120,${.45 * smooth(c01((cam.L - 13) / 3))})`); g2.addColorStop(1, 'rgba(255,200,120,0)');
    c.fillStyle = g2; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
  }
}

S.climes = {
  init(el, st) {
    st.cv = el.querySelector('canvas');
    st.c = st.cv.getContext('2d');
    st.n = el.querySelector('.cl-n');
  },
  frame(p, t, el, st) {
    fit(st.cv);
    const { c, cv } = st;
    const dpr = cv.width / Math.max(1, cv.clientWidth), W = cv.clientWidth, H = cv.clientHeight;
    const cam = camera(p, W, H), L = cam.L;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    c.fillStyle = PAL.ink; c.fillRect(0, 0, cv.width, cv.height);
    const aMs = 1 - smooth(c01((L - 1.8) / 1.6));
    const aReg = smooth(c01((L - 2.3) / 1.2)) * (1 - smooth(c01((L - 7.1) / 1.3)));
    const aGnd = smooth(c01((L - 7.0) / 1.3));
    const aCity = smooth(c01((L - 7.2) / 1.1));
    if (L < 3) { // a faint warm light behind the world
      const o = toScreen(cam, [0, 0]), r = cam.s * 1.9, g = c.createRadialGradient(o[0] * dpr, o[1] * dpr, 0, o[0] * dpr, o[1] * dpr, r * dpr);
      g.addColorStop(0, 'rgba(60,46,24,.55)'); g.addColorStop(.55, 'rgba(30,24,14,.25)'); g.addColorStop(1, 'rgba(13,14,11,0)');
      c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
    }
    // build the caches ahead of need, at most one per frame, so no single frame stalls
    if (L > 1.2 && !st.reg) lazyRegion(st); else if (L > 2.2 && !st.gnd) lazyGround(st); else if (L > 3.4 && !st.city) lazyCity(st); else if (L > 6 && !st.house) lazyHouse(st);
    if (L < 2.6) drawSpheres(c, cam, dpr, p, t, 1 - smooth(c01((L - .8) / 1.6)));
    if (aGnd < 1) drawMap(c, cam, dpr, p, t, st, aMs);
    if (aReg > 0 && aGnd < 1) drawRegion(c, cam, dpr, t, st, aReg);
    if (aGnd > 0) drawGround(c, cam, dpr, st, aGnd);
    if (L > 14.4) drawPebbles(c, cam, dpr, st);
    if (aCity > 0 && L < 15.6) drawCity(c, cam, dpr, t, st, aCity);
    if (L > 8.8 && L < 18.6) drawHouse(c, cam, dpr, t, st, aCity * (1 - smooth(c01((L - 18) / .6))));
    drawAnt(c, cam, dpr, p, t, st);
    drawLight(c, cam, dpr, p);
    c.setTransform(1, 0, 0, 1, 0, 0);
    setText(st.n, arNum(Math.max(1, Math.min(7, 1 + Math.floor(seg(p, .12, .3) * 7 + .0001)))));
  },
};
})();
