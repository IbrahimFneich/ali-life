(() => {
// rihla: the map of his journeys. A north-up manuscript map of Arabia, Iraq and Sham (the language of the Idrisi plate in
// climes.js: dark gilded seas, vellum land, glyph mountains, teal rivers, gold cities) lying on a desk under a lamp.
// A rubricated ink route draws his life stop by stop; a light travels its head; the camera pans and zooms to each stop.
// Map units: one degree of latitude; x = (lon − 42)·cos 28°, y = −(lat − 28).
const CL = Math.cos(28 * Math.PI / 180);
const pr = (lon, lat) => [(lon - 42) * CL, -(lat - 28)];
const PR = (arr) => arr.map(([a, b]) => pr(a, b));
const SHEET = [pr(30, 38.5), pr(53, 15.5)]; // top-left, bottom-right

// ---------- geography (lon, lat), stylised from real coasts ----------
const MED = [[28.5, 30.9], [29.9, 31.2], [30.4, 31.45], [31.0, 31.6], [31.8, 31.52], [32.3, 31.27], [33.0, 31.12], [33.8, 31.13], [34.45, 31.5], [34.75, 32.05], [34.95, 32.6], [35.05, 33.0], [35.2, 33.27], [35.45, 33.75], [35.65, 34.2], [35.83, 34.43], [35.9, 35.0], [35.77, 35.52], [35.95, 36.0], [36.15, 36.6], [35.85, 36.85], [35.3, 36.65], [34.6, 36.8], [33.9, 36.25], [32.8, 36.05], [32.0, 36.55], [31.0, 36.85], [28.5, 36.7]];
const CYPRUS = [[32.3, 35.1], [32.9, 35.4], [33.6, 35.35], [34.6, 35.7], [33.95, 35.1], [34.0, 34.65], [33.0, 34.6], [32.4, 34.75]];
const RED = [[32.55, 29.95], [32.7, 29.6], [33.1, 29.05], [33.6, 28.24], [34.25, 27.73], [34.45, 28.1], [34.52, 28.5], [34.67, 29.0], [34.89, 29.5], [34.97, 29.55], [35.0, 29.4], [34.95, 29.1], [34.8, 28.6], [34.75, 28.1], [35.2, 28.0], [35.68, 27.35], [36.45, 26.23], [37.25, 25.05], [38.05, 24.08], [38.6, 23.4], [38.98, 22.8], [39.1, 22.3], [39.15, 21.5], [39.6, 20.6], [40.27, 20.15], [41.08, 19.13], [41.8, 17.8], [42.55, 16.9], [42.75, 15.6], [42.9, 14.5], [43.3, 13], [41, 13], [39.9, 14.5], [39.45, 15.6], [38.6, 17.0], [37.9, 18.4], [37.33, 19.1], [37.22, 19.6], [37.1, 20.8], [36.85, 22.0], [36.6, 22.2], [35.8, 23.9], [35.48, 23.95], [34.9, 25.07], [34.28, 26.1], [33.95, 26.75], [33.83, 27.25], [33.5, 27.7], [33.1, 28.35], [32.65, 29.6]];
const GULF = [[48.5, 29.95], [48.1, 29.6], [47.75, 29.4], [48.0, 29.3], [48.15, 28.9], [48.4, 28.5], [48.8, 27.8], [49.3, 27.3], [49.65, 27.0], [50.1, 26.45], [50.2, 25.9], [50.5, 25.4], [50.75, 24.8], [51.05, 25.0], [51.2, 25.6], [51.3, 26.1], [51.55, 25.9], [51.6, 25.3], [51.5, 24.65], [52.0, 24.0], [54, 24.1], [54, 27.0], [52.6, 27.35], [52.0, 27.6], [51.3, 28.0], [50.83, 28.97], [50.5, 29.55], [50.15, 30.05], [49.6, 30.0], [49.1, 30.35], [48.9, 30.4]];
const ISLES = [[[50.45, 26.25], [50.62, 26.2], [50.6, 25.8], [50.47, 25.9]], [[35.45, 31.75], [35.57, 31.72], [35.52, 31.1], [35.4, 31.25]]]; // Bahrain is land; the Dead Sea is water
const EUPH = [[38.6, 39.2], [38.5, 38.4], [38.25, 37.6], [38.0, 37.0], [38.05, 36.6], [38.2, 36.25], [38.4, 35.98], [38.85, 35.97], [39.0, 35.95], [39.6, 35.75], [40.15, 35.33], [40.5, 34.95], [40.95, 34.45], [41.5, 34.4], [41.95, 34.38], [42.35, 34.1], [42.8, 33.65], [43.3, 33.45], [43.78, 33.35], [44.05, 33.0], [44.25, 32.5], [44.40, 32.04], [44.6, 31.75], [45.3, 31.3], [46.25, 31.05], [47.0, 31.0], [47.43, 31.0], [47.62, 30.75], [47.78, 30.48], [48.1, 30.25], [48.5, 29.95]];
const TIGR = [[40.2, 38.6], [41.0, 37.9], [42.2, 37.33], [42.7, 36.9], [43.13, 36.34], [43.3, 35.6], [43.5, 35.1], [43.68, 34.6], [43.87, 34.2], [44.2, 33.7], [44.38, 33.31], [44.58, 33.09], [45.0, 32.85], [45.82, 32.5], [46.5, 32.2], [47.15, 31.83], [47.43, 31.0]];
const NILE = [[31.25, 30.05], [31.0, 29.3], [30.85, 28.5], [30.8, 27.8], [31.2, 27.2], [31.8, 26.6], [32.5, 26.2], [32.7, 25.7], [32.9, 24.1], [32.6, 23.0], [31.8, 22.0], [31.0, 21.6], [30.6, 20.5], [30.2, 19.0]];
const DELTA = [[[31.25, 30.05], [30.9, 30.6], [30.4, 31.45]], [[31.25, 30.05], [31.5, 30.7], [31.8, 31.52]]];
const NAHRAWAN = [[44.25, 34.1], [44.5, 33.65], [44.82, 33.32], [45.2, 33.0], [45.75, 32.6]];
const MOUNTS = [
  [[35.3, 28.9], [36.2, 27.6], [37.3, 26.2], [38.4, 24.9], [39.15, 23.6], [39.95, 22.1], [40.6, 20.7], [41.5, 19.1], [42.5, 17.4], [43.2, 15.7]],
  [[35.75, 33.2], [36.05, 33.9], [36.3, 34.5], [36.45, 35.0]], [[31.5, 37.6], [33.5, 37.4], [35.0, 37.6], [36.5, 38.0], [38.5, 38.3], [40.5, 38.45], [42.5, 38.1], [44.0, 37.7]],
  [[45.2, 36.0], [45.8, 35.0], [46.6, 34.0], [47.5, 33.0], [48.5, 32.0], [49.6, 31.0], [50.8, 30.0], [52.0, 29.2], [53.2, 28.4]],
  [[33.7, 28.9], [34.1, 28.45]], [[32.9, 28.3], [33.6, 27.0], [34.3, 25.8], [35.0, 24.3], [35.8, 22.8], [36.4, 21.2], [36.8, 19.6]], [[41.2, 27.6], [42.3, 27.2]],
];
const HARRAT = [[39.95, 23.4, .3, .95], [40.25, 25.6, .55, .5], [37.85, 27.1, .4, .5], [37.2, 32.4, .9, .55], [41.0, 22.8, .3, .4], [40.0, 26.6, .3, .3], [41.6, 21.4, .3, .5], [39.45, 24.4, .1, .14], [39.75, 24.45, .12, .16]];
const WADIS = [[[40.4, 24.9], [41.2, 25.5], [42.2, 26.0], [43.5, 26.4], [44.6, 26.8], [45.6, 27.3], [46.5, 27.9], [47.2, 28.7], [47.7, 29.4]], [[37.4, 31.6], [38.2, 30.6], [38.9, 29.9], [39.5, 29.5]], [[39.9, 24.9], [39.0, 25.5], [38.0, 25.9], [37.3, 25.6]], [[40.0, 21.5], [39.6, 21.45], [39.2, 21.5]], [[40.3, 33.5], [41.3, 33.8], [42.4, 34.05]], [[42.3, 30.5], [43.3, 31.4], [44.0, 31.9]], [[45.5, 25.2], [46.6, 24.7], [47.5, 24.4]], [[41.5, 23.2], [42.5, 23.6], [43.6, 24.4]]];
const SAWAD = [[43.6, 34.3], [44.3, 34.0], [44.9, 33.6], [45.5, 33.0], [46.3, 32.4], [47.0, 31.9], [47.6, 31.4], [47.9, 30.6], [47.4, 30.6], [46.4, 30.9], [45.4, 31.1], [44.7, 31.5], [44.36, 31.85], [44.2, 32.2], [43.8, 32.75], [43.25, 33.3], [43.2, 33.8]];
const PL = { // the places: [lon, lat]; stops sit on their rivers where the brief says they do
  mecca: [39.826, 21.423], medina: [39.611, 24.468], badr: [38.77, 23.73], uhud: [39.615, 24.505], khaybar: [39.29, 25.70], hunayn: [40.06, 21.55],
  tabuk: [36.57, 28.38], ghadir: [39.2, 22.77], basra: [47.78, 30.48], kufa: [44.40, 32.04], siffin: [38.85, 35.97], nahrawan: [44.82, 33.32],
  najaf: [44.32, 31.99], karbala: [44.03, 32.62], khandaq: [39.6, 24.487],
};
const CONTEXT = [[36.3, 33.51], [35.23, 31.78], [44.58, 33.09], [31.23, 30.0], [40.42, 21.27], [38.55, 27.63]]; // Damascus, Jerusalem, al-Mada'in, Fustat, Ta'if, Tayma
// the stops: place, name, year (the event word where the brief gives one), arrival p, departure-of-the-ink p, view span, label side
const STOPS = [
  ['mecca', 'مكة', 'الولادة، ٢٣ ق.هـ', .045, .02, 1.9, 'l'],
  ['medina', 'المدينة', 'الهجرة، ١ هـ', .105, .07, 1.8, 'l'],
  ['badr', 'بدر', '٢ هـ', .15, .125, 1.7, 'l'],
  ['uhud', 'أُحد', '٣ هـ', .195, .17, 1.0, 'r'],
  ['khandaq', 'الخندق', '٥ هـ', .228, .21, .95, 'l'],
  ['khaybar', 'خيبر', '٧ هـ', .275, .245, 2.0, 'r'],
  ['mecca', 'مكة', 'الفتح، ٨ هـ', .335, .295, 1.2, 'l'],
  ['hunayn', 'حُنين', '٨ هـ', .372, .355, 1.15, 'r'],
  ['tabuk', 'تبوك', 'خلّفه النبيّ في المدينة، ٩ هـ', .455, .39, 6.4, 'l'],
  ['ghadir', 'غدير خم', '١٠ هـ', .505, .48, 2.4, 'l'],
  ['medina', 'المدينة', '١١–٣٥ هـ', .55, .525, 2.2, 'l'],
  ['basra', 'البصرة', 'الجمل، ٣٦ هـ', .625, .575, 3.0, 'r'],
  ['kufa', 'الكوفة', 'العاصمة، ٣٦ هـ', .67, .645, 2.2, 'r'],
  ['siffin', 'صفين', '٣٧ هـ', .735, .69, 3.4, 'l'],
  ['nahrawan', 'النهروان', '٣٨ هـ', .79, .755, 2.4, 'r'],
  ['kufa', 'الكوفة', '٤٠ هـ', .83, .81, 1.4, 'r'],
  ['najaf', 'النجف', '', .865, .85, 1.0, 'l'],
];
// the ink: Ali's own path. For Tabuk the ink returns from Hunayn to Medina, and a faint dashed line goes on to Tabuk without him.
const TABUK = 8;
const inkTo = (k) => (k === TABUK ? 'medina' : STOPS[k][0]);
const TABUK_INK = [.39, .42], TABUK_DASH = [.42, .455];
const FINAL = [['mecca', 'l'], ['medina', 'l'], ['badr', 'l'], ['khaybar', 'r'], ['tabuk', 'l'], ['ghadir', 'l'], ['basra', 'r'], ['kufa', 'r'], ['siffin', 'l'], ['nahrawan', 'r'], ['najaf', 'l'], ['karbala', 'l']];
const NAMES = { mecca: 'مكة', medina: 'المدينة', badr: 'بدر', khaybar: 'خيبر', tabuk: 'تبوك', ghadir: 'غدير خم', basra: 'البصرة', kufa: 'الكوفة', siffin: 'صفين', nahrawan: 'النهروان', najaf: 'النجف', karbala: 'كربلاء' };

// ---------- helpers ----------
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
const canvas = (w, h = w) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
const glow = (() => { const cv = canvas(128), g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,236,190,1)'); gr.addColorStop(.2, 'rgba(255,214,140,.55)'); gr.addColorStop(.55, 'rgba(255,190,110,.13)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return cv; })();
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const P_ = (k) => pr(...PL[k]);

// ---------- the map, built once in map units ----------
function buildMap() {
  const R = rng(31);
  const sea = new Path2D(); [MED, RED, GULF, ISLES[1]].forEach((a) => crPath(PR(a), true, sea));
  const isles = new Path2D(); [CYPRUS, ISLES[0]].forEach((a) => crPath(PR(a), true, isles));
  const rivers = new Path2D(); [EUPH, TIGR, NILE, ...DELTA].forEach((a) => crPath(PR(a), false, rivers));
  const canal = crPath(PR(NAHRAWAN), false);
  const peaks = new Path2D(), shade = new Path2D();
  const peakAt = (x, y, s) => {
    peaks.moveTo(x - s, y + .4 * s); peaks.quadraticCurveTo(x - .4 * s, y - 1.3 * s, x + .1 * s, y - 1.1 * s); peaks.quadraticCurveTo(x + .6 * s, y - .5 * s, x + s, y + .4 * s); peaks.closePath();
    shade.moveTo(x + .1 * s, y - 1.1 * s); shade.quadraticCurveTo(x + .6 * s, y - .5 * s, x + s, y + .4 * s); shade.lineTo(x + .25 * s, y + .4 * s); shade.closePath();
  };
  MOUNTS.forEach((a) => {
    const pts = PR(a); let acc = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], d = Math.hypot(x1 - x0, y1 - y0);
      for (; acc < d; acc += .19) { const k = acc / d; peakAt(x0 + (x1 - x0) * k + (R() - .5) * .08, y0 + (y1 - y0) * k + (R() - .5) * .12, .1 + R() * .03); if (R() < .45) peakAt(x0 + (x1 - x0) * k + (R() - .5) * .3, y0 + (y1 - y0) * k + .16 + R() * .1, .07); }
      acc -= d;
    }
  });
  const small = new Path2D(), smallSh = new Path2D(); // a finer engraving of the same ranges, for close views
  MOUNTS.forEach((a) => {
    const pts = PR(a); let acc = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], d = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / d, ny = (x1 - x0) / d;
      for (; acc < d; acc += .045) { const k = acc / d; for (let r = 0; r < 3; r++) { if (R() < .3) continue; const o = (r - 1) * .07 + (R() - .5) * .04, x = x0 + (x1 - x0) * k + nx * o, y = y0 + (y1 - y0) * k + ny * o, sz = .018 + R() * .014; small.moveTo(x - sz, y + .4 * sz); small.quadraticCurveTo(x - .4 * sz, y - 1.3 * sz, x + .1 * sz, y - 1.1 * sz); small.quadraticCurveTo(x + .6 * sz, y - .5 * sz, x + sz, y + .4 * sz); small.closePath(); smallSh.moveTo(x + .1 * sz, y - 1.1 * sz); smallSh.quadraticCurveTo(x + .6 * sz, y - .5 * sz, x + sz, y + .4 * sz); smallSh.lineTo(x + .25 * sz, y + .4 * sz); smallSh.closePath(); } }
      acc -= d;
    }
  });
  const harrF = new Path2D();
  HARRAT.forEach(([lo, la, rx, ry], hi) => { if (hi === 3) return; const [cx, cy] = pr(lo, la), n = Math.round(5200 * rx * ry) + 120; for (let i = 0; i < n; i++) { const a = R() * TAU, r = Math.sqrt(R()); const x = cx + Math.cos(a) * r * rx * CL, y = cy + Math.sin(a) * r * ry, sz = .0018 + R() * .0035; harrF.moveTo(x + sz, y); harrF.arc(x, y, sz, 0, TAU); } });
  const fine = new Path2D(), fineSh = new Path2D(); // Uhud and the hills by Medina, at their own scale
  [[39.6, 24.506, .009], [39.615, 24.508, .011], [39.63, 24.505, .009], [39.645, 24.507, .007], [39.585, 24.505, .006], [39.585, 24.448, .005], [39.6, 24.444, .004]].forEach(([lo, la, s]) => { const [x, y] = pr(lo, la); fine.moveTo(x - s, y + .4 * s); fine.quadraticCurveTo(x - .4 * s, y - 1.3 * s, x + .1 * s, y - 1.1 * s); fine.quadraticCurveTo(x + .6 * s, y - .5 * s, x + s, y + .4 * s); fine.closePath(); fineSh.moveTo(x + .1 * s, y - 1.1 * s); fineSh.quadraticCurveTo(x + .6 * s, y - .5 * s, x + s, y + .4 * s); fineSh.lineTo(x + .25 * s, y + .4 * s); fineSh.closePath(); });
  const harrat = new Path2D();
  HARRAT.forEach(([lo, la, rx, ry]) => { const [cx, cy] = pr(lo, la), n = Math.round(900 * rx * ry) + 30; for (let i = 0; i < n; i++) { const a = R() * TAU, r = Math.sqrt(R()); const x = cx + Math.cos(a) * r * rx * CL, y = cy + Math.sin(a) * r * ry, s = .006 + R() * .012; harrat.moveTo(x + s, y); harrat.arc(x, y, s, 0, TAU); } });
  const dunes = new Path2D(), gravel = new Path2D();
  const duneField = (lo, la, rx, ry, n, l) => { const [cx, cy] = pr(lo, la); for (let i = 0; i < n; i++) { const a = R() * TAU, r = Math.sqrt(R()), x = cx + Math.cos(a) * r * rx * CL, y = cy + Math.sin(a) * r * ry, w = l * (.6 + R() * .7); dunes.moveTo(x - w, y); dunes.quadraticCurveTo(x, y - w * .55, x + w, y); } };
  duneField(41.3, 28.4, 2.3, 1.05, 420, .07); duneField(49.5, 18.6, 4.2, 3.2, 700, .085); duneField(39.6, 19.4, .7, .6, 40, .05);
  const dahna = PR([[44.5, 28.2], [45.3, 27.0], [46.5, 26.0], [47.3, 24.8], [47.6, 23.5], [47.0, 21.6]]);
  for (let i = 0; i < 220; i++) { const s = R() * (dahna.length - 1), j = Math.floor(s), f = s - j, x = mix(dahna[j][0], dahna[j + 1][0], f) + (R() - .5) * .4, y = mix(dahna[j][1], dahna[j + 1][1], f) + (R() - .5) * .25, w = .06; dunes.moveTo(x - w, y); dunes.quadraticCurveTo(x, y - w * .55, x + w, y); }
  { const [cx, cy] = pr(40.3, 33); for (let i = 0; i < 1100; i++) { const a = R() * TAU, r = Math.sqrt(R()), x = cx + Math.cos(a) * r * 3 * CL, y = cy + Math.sin(a) * r * 1.9, s = .006; gravel.moveTo(x + s, y); gravel.arc(x, y, s, 0, TAU); } }
  const green = crPath(PR(SAWAD), true);
  const palms = new Path2D();
  [['medina', .06, 70], ['khaybar', .07, 50], ['tabuk', .05, 30], [[38.55, 27.63], .05, 26], [[44.36, 32.02], .05, 40], ['basra', .05, 40]].forEach(([k, r0, n]) => { const [cx, cy] = typeof k === 'string' ? P_(k) : pr(...k); for (let i = 0; i < n; i++) { const a = R() * TAU, r = Math.sqrt(R()) * r0, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * .8, s = .004 + R() * .004; palms.moveTo(x + s, y); palms.arc(x, y, s, 0, TAU); } });
  const wadis = new Path2D(); WADIS.forEach((a) => { const pts = PR(a); crPath(pts, false, wadis); for (let i = 1; i < pts.length - 1; i++) { const [x, y] = pts[i], q = R() * TAU; wadis.moveTo(x, y); wadis.lineTo(x + Math.cos(q) * .22, y + Math.sin(q) * .22); } });
  const trench = crPath(PR([[39.572, 24.482], [39.59, 24.488], [39.61, 24.489], [39.632, 24.484]]), false);
  const [a, b] = SHEET, sheet = new Path2D(); sheet.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
  const vel = canvas(256), vg = vel.getContext('2d');
  for (let i = 0; i < 2600; i++) { vg.fillStyle = R() < .5 ? `rgba(40,26,10,${.05 + .1 * R()})` : `rgba(255,240,205,${.04 + .08 * R()})`; vg.fillRect(R() * 256, R() * 256, 1 + R() * 2.5, 1 + R() * 2.5); }
  vg.strokeStyle = 'rgba(60,40,20,.08)'; for (let i = 0; i < 70; i++) { const x = R() * 256, y = R() * 256, q = R() * TAU; vg.beginPath(); vg.moveTo(x, y); vg.lineTo(x + Math.cos(q) * 18, y + Math.sin(q) * 18); vg.stroke(); }
  const wav = canvas(96), wg = wav.getContext('2d'); wg.strokeStyle = 'rgba(201,165,78,.32)'; wg.lineWidth = 1.3;
  for (let r = 0; r < 4; r++) { wg.beginPath(); for (let x = -12; x <= 108; x += 24) { const y = r * 24 + 12, o = (r % 2) * 12; wg.moveTo(x + o - 9, y); wg.quadraticCurveTo(x + o - 3, y - 6, x + o + 3, y); } wg.stroke(); }
  const mot = canvas(256), mg = mot.getContext('2d');
  for (let i = 0; i < 40; i++) { const x = R() * 256, y = R() * 256, r = 20 + R() * 60, dk = R() < .55; for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) { const gr = mg.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); gr.addColorStop(0, dk ? 'rgba(50,34,18,.1)' : 'rgba(230,205,160,.08)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); mg.fillStyle = gr; mg.fillRect(x + ox - r, y + oy - r, r * 2, r * 2); } }
  const stip = canvas(256), sg = stip.getContext('2d'); for (let i = 0; i < 2200; i++) { sg.fillStyle = `rgba(52,32,14,${.12 + .22 * R()})`; const r = .5 + R() * 1.1; sg.beginPath(); sg.arc(R() * 256, R() * 256, r, 0, TAU); sg.fill(); }
  const wood = canvas(512, 256), wdg = wood.getContext('2d'); wdg.fillStyle = '#1a120b'; wdg.fillRect(0, 0, 512, 256); for (let i = 0; i < 160; i++) { const y = R() * 256, a = .03 + R() * .07; wdg.strokeStyle = R() < .5 ? `rgba(0,0,0,${a * 2})` : `rgba(150,100,60,${a})`; wdg.lineWidth = .6 + R() * 2.4; wdg.beginPath(); for (let x = 0; x <= 512; x += 16) wdg.lineTo(x, y + Math.sin(x / 70 + i) * 3 + Math.sin(x / 23 + i * 2) * 1.2); wdg.stroke(); }
  const band = canvas(64), bg = band.getContext('2d'); bg.fillStyle = '#2a1a0c'; bg.fillRect(0, 0, 64, 64); bg.strokeStyle = 'rgba(201,165,78,.75)'; bg.lineWidth = 2.2;
  bg.beginPath(); bg.moveTo(32, 6); bg.lineTo(58, 32); bg.lineTo(32, 58); bg.lineTo(6, 32); bg.closePath(); bg.rect(19, 19, 26, 26); bg.moveTo(0, 32); bg.lineTo(6, 32); bg.moveTo(58, 32); bg.lineTo(64, 32); bg.stroke();
  return { wood, wadis, stip, sea, isles, rivers, canal, peaks, shade, small, smallSh, harrF, fine, fineSh, harrat, dunes, gravel, green, palms, trench, sheet, vel, wav, mot, band };
}

// ---------- the route, in map units ----------
function bez(a, b, bow) { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = dist(a, b), n = [-(b[1] - a[1]) / (d || 1), (b[0] - a[0]) / (d || 1)], c = [m[0] + n[0] * d * bow, m[1] + n[1] * d * bow], out = []; for (let i = 0; i <= 40; i++) { const t = i / 40, u = 1 - t; out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); } return out; }
function riverWay(i0, i1) { const pts = []; const st = i0 < i1 ? 1 : -1; for (let i = i0; i !== i1 + st; i += st) pts.push(pr(...EUPH[i])); return pts; }
function withLen(pts) { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + dist(pts[i - 1], pts[i])); return { pts, L, len: L[L.length - 1] }; }
function buildRoute() {
  const segs = [];
  for (let k = 1; k < STOPS.length; k++) {
    const from = P_(inkTo(k - 1)), to = P_(inkTo(k)), name = STOPS[k][0];
    let pts;
    if (name === 'kufa' && STOPS[k - 1][0] === 'basra') pts = [P_('basra'), ...riverWay(28, 21).slice(1)];
    else if (name === 'siffin') pts = riverWay(21, 7);
    else pts = bez(from, to, (k % 2 ? 1 : -1) * (dist(from, to) < .2 ? .35 : .16));
    const t = k === TABUK ? TABUK_INK : [STOPS[k][4], STOPS[k][3]];
    segs.push({ ...withLen(pts), t, k });
  }
  const dash = withLen(bez(P_('medina'), P_('tabuk'), .12));
  return { segs, dash };
}
const cut = (S, f) => { const want = S.len * f, out = [S.pts[0]]; for (let i = 1; i < S.pts.length; i++) { if (S.L[i] <= want) { out.push(S.pts[i]); continue; } const a = S.pts[i - 1], b = S.pts[i], u = (want - S.L[i - 1]) / (S.L[i] - S.L[i - 1] || 1); out.push([mix(a[0], b[0], u), mix(a[1], b[1], u)]); break; } return out; };

// ---------- the camera: a view per stop; travel blends two views and rises between far ones ----------
function stopView(k, m) { const [name, , , , , span] = STOPS[k]; const c = k === TABUK ? [(P_('medina')[0] + P_('tabuk')[0]) / 2, (P_('medina')[1] + P_('tabuk')[1]) / 2] : P_(name); return { c, s: m * .78 / span }; }
function boxView(pts, W, H, fx, fy) { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; pts.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }); return { c: [(x0 + x1) / 2, (y0 + y1) / 2], s: Math.min(W * fx / Math.max(.01, x1 - x0), H * fy / Math.max(.01, y1 - y0)) }; }
function blend(a, b, e, W, H) {
  const la = Math.log(a.s), lb = Math.log(b.s), dx = Math.abs(a.c[0] - b.c[0]), dy = Math.abs(a.c[1] - b.c[1]);
  const fit = Math.log(Math.min(W * .62 / Math.max(.01, dx), H * .62 / Math.max(.01, dy))), rise = Math.max(0, (la + lb) / 2 - fit);
  const em = ease.io(c01((e - .08) / .84));
  return { c: [mix(a.c[0], b.c[0], em), mix(a.c[1], b.c[1], em)], s: Math.exp(mix(la, lb, e) - rise * Math.sin(Math.PI * e)) };
}
const travel = (k) => (k === TABUK ? [TABUK_INK[0], TABUK_DASH[1]] : [STOPS[k][4], STOPS[k][3]]);
function camAt(p, W, H) {
  const m = Math.min(W, H) * (W < H ? 1.6 : 1), wide = boxView(SHEET, W, H, .92, .92), fin = boxView(Object.keys(NAMES).map(P_), W, H, .74, .8);
  if (p < STOPS[0][3] + .01) return blend(wide, stopView(0, m), smooth(seg(p, .0, STOPS[0][3] + .01)), W, H);
  if (p > .872) return blend(stopView(STOPS.length - 1, m), fin, smooth(seg(p, .872, .94)), W, H);
  let k = 0; while (k < STOPS.length - 1 && p >= travel(k + 1)[0] - .004) k++;
  if (k === 0) { const v = stopView(0, m); v.s *= 1 + .05 * seg(p, STOPS[0][3], travel(1)[0]); return v; }
  const [a, b] = travel(k);
  if (p < b + .008) return blend(stopView(k - 1, m), stopView(k, m), smooth(seg(p, a - .004, b + .008)), W, H);
  const v = stopView(k, m), nx = k < STOPS.length - 1 ? travel(k + 1)[0] : .872; v.s *= 1 + .07 * seg(p, b + .008, nx); return v;
}
// where the light is: the head of the ink, or the last place it reached
function lightAt(p, R) {
  let at = P_('mecca');
  for (const S of R.segs) { if (p < S.t[0]) break; const f = ease.io(seg(p, S.t[0], S.t[1])); const q = f < 1 ? cut(S, f) : S.pts; at = q[q.length - 1]; }
  return at;
}

// ---------- drawing ----------
const OCEAN = '#0f1828', LAND = '#977e5d';
function drawMap(c, st, cam, p, t, dpr) {
  const M = st.map, s = cam.s, px = 1 / s, R = st.route;
  c.setTransform(s * dpr, 0, 0, s * dpr, (cam.W / 2 - cam.c[0] * s) * dpr, (cam.H / 2 - cam.c[1] * s) * dpr);
  const [a, b] = SHEET;
  const wd = c.createPattern(M.wood, 'repeat'); wd.setTransform(new DOMMatrix().scale(9 / 512)); c.fillStyle = wd; c.fillRect(a[0] - 40, a[1] - 40, b[0] - a[0] + 80, b[1] - a[1] + 80);
  for (let i = 4; i >= 1; i--) { c.fillStyle = `rgba(0,0,0,${.12})`; c.fillRect(a[0] + .06 * i, a[1] + .1 * i, b[0] - a[0], b[1] - a[1]); }
  c.save(); c.clip(M.sheet);
  c.fillStyle = LAND; c.fill(M.sheet);
  const mp = c.createPattern(M.mot, 'repeat'); mp.setTransform(new DOMMatrix().scale(3.2 / 256)); c.globalAlpha = .55; c.fillStyle = mp; c.fill(M.sheet); c.globalAlpha = 1;
  const sp = c.createPattern(M.stip, 'repeat'); sp.setTransform(new DOMMatrix().scale((s > 300 ? .55 : 1.6) / 256)); c.globalAlpha = .55; c.fillStyle = sp; c.fill(M.sheet); c.globalAlpha = 1;
  const vp = c.createPattern(M.vel, 'repeat'); vp.setTransform(new DOMMatrix().scale(Math.max(.12, 140 / s) / 256)); c.globalAlpha = .8; c.fillStyle = vp; c.fill(M.sheet); c.globalAlpha = 1;
  const zc = c01((s - 220) / 220), zf = c01((s - 200) / 200); // coarse glyphs give way to finer ones as we come close
  c.fillStyle = 'rgba(70,86,50,.32)'; c.fill(M.green);
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = 'rgba(70,86,50,.4)'; c.lineWidth = Math.min(.2, 14 * px); c.stroke(M.rivers);
  c.globalAlpha = 1 - .7 * zc; c.strokeStyle = 'rgba(140,58,26,.42)'; c.lineWidth = 1.2 * px; c.stroke(M.dunes); c.globalAlpha = 1;
  c.fillStyle = `rgba(60,40,20,${.22 * (1 - zc)})`; c.fill(M.gravel);
  c.strokeStyle = 'rgba(92,60,30,.5)'; c.lineWidth = 1.1 * px; c.stroke(M.wadis); c.strokeStyle = 'rgba(230,205,160,.18)'; c.lineWidth = .6 * px; c.save(); c.translate(-.6 * px, -.6 * px); c.stroke(M.wadis); c.restore();
  if (zc < 1) { c.globalAlpha = 1 - zc; c.fillStyle = 'rgba(34,24,20,.6)'; c.fill(M.harrat); c.globalAlpha = 1; }
  if (zf > 0) { c.globalAlpha = zf; c.fillStyle = 'rgba(34,24,20,.55)'; c.fill(M.harrF); c.globalAlpha = 1; }
  // seas: the coastal wash on the land, the dark gilded water, the ink of the coast
  c.strokeStyle = 'rgba(70,46,22,.22)'; c.lineWidth = 16 * px; c.stroke(M.sea); c.lineWidth = 6 * px; c.strokeStyle = 'rgba(52,34,16,.22)'; c.stroke(M.sea);
  c.fillStyle = OCEAN; c.fill(M.sea);
  const wp = c.createPattern(M.wav, 'repeat'); wp.setTransform(new DOMMatrix().scale(Math.max(.05, 30 / s) / 96)); c.save(); c.clip(M.sea); c.fillStyle = wp; c.fill(M.sheet);
  const sg = c.createLinearGradient(0, a[1], 0, b[1]); sg.addColorStop(0, 'rgba(255,226,170,.05)'); sg.addColorStop(1, 'rgba(0,0,0,.18)'); c.fillStyle = sg; c.fill(M.sheet); c.restore();
  c.fillStyle = LAND; c.fill(M.isles);
  c.strokeStyle = 'rgba(28,20,10,.8)'; c.lineWidth = 1.3 * px; c.stroke(M.sea); c.stroke(M.isles);
  c.strokeStyle = 'rgba(243,217,143,.32)'; c.lineWidth = .6 * px; c.stroke(M.sea);
  c.save(); c.clip(M.sea); c.strokeStyle = 'rgba(201,165,78,.22)'; c.lineWidth = 9 * px; c.stroke(M.sea); c.strokeStyle = OCEAN; c.lineWidth = 7 * px; c.stroke(M.sea); c.restore();
  // rivers and the Nahrawan canal
  c.strokeStyle = '#3d6474'; c.lineWidth = 2.4 * px; c.stroke(M.rivers); c.strokeStyle = '#8fb4b4'; c.lineWidth = .9 * px; c.stroke(M.rivers);
  c.strokeStyle = 'rgba(61,100,116,.8)'; c.lineWidth = 1.2 * px; c.stroke(M.canal);
  // mountains as the copyists drew them; the finer hills by Medina when we are close
  if (zc < 1) { c.globalAlpha = 1 - zc; c.fillStyle = '#6a4630'; c.fill(M.peaks); c.fillStyle = 'rgba(30,18,10,.45)'; c.fill(M.shade); c.globalAlpha = 1; }
  if (zf > 0) { c.globalAlpha = zf; c.fillStyle = '#6a4630'; c.fill(M.small); c.fillStyle = 'rgba(30,18,10,.5)'; c.fill(M.smallSh); c.globalAlpha = 1; }
  const fa = c01((s - 260) / 400); if (fa > 0) { c.globalAlpha = fa; c.fillStyle = '#6a4630'; c.fill(M.fine); c.fillStyle = 'rgba(30,18,10,.45)'; c.fill(M.fineSh); c.globalAlpha = 1; }
  const pa = c01((s - 140) / 260); if (pa > 0) { c.globalAlpha = pa; c.fillStyle = '#3e4c2a'; c.fill(M.palms); c.globalAlpha = 1; }
  const ka = c01((s - 500) / 500) * c01((p - .2) / .02); if (ka > 0) { c.globalAlpha = ka; c.strokeStyle = '#2a1a0c'; c.lineWidth = 3 * px; c.stroke(M.trench); c.setLineDash([2 * px, 3 * px]); c.strokeStyle = 'rgba(243,217,143,.6)'; c.lineWidth = 1 * px; c.stroke(M.trench); c.setLineDash([]); c.globalAlpha = 1; }
  // places: context dots, then the gold of the places in his life (brighter once he has been there)
  c.fillStyle = 'rgba(60,36,16,.75)'; CONTEXT.forEach(([lo, la]) => { const [x, y] = pr(lo, la); c.beginPath(); c.arc(x, y, 2 * px, 0, TAU); c.fill(); });
  const seen = new Set(); STOPS.forEach(([n, , , tk]) => { if (p >= tk) seen.add(n); }); if (p >= .42) seen.add('medina');
  c.globalCompositeOperation = 'lighter';
  Object.keys(NAMES).concat(['hunayn', 'uhud']).forEach((n) => { const [x, y] = P_(n), r = (seen.has(n) ? 16 : 8) * px; c.globalAlpha = seen.has(n) ? .75 : .35; c.drawImage(glow, x - r, y - r, 2 * r, 2 * r); });
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  Object.keys(NAMES).concat(['hunayn', 'uhud']).forEach((n) => { const [x, y] = P_(n); c.fillStyle = '#2a1a0c'; c.beginPath(); c.arc(x, y, 3.2 * px, 0, TAU); c.fill(); c.fillStyle = seen.has(n) ? PAL.goldHi : PAL.gold; c.beginPath(); c.arc(x, y, 2.2 * px, 0, TAU); c.fill(); });
  // the ink of his road: rubricated, with a thread of gold
  const ink = new Path2D();
  R.segs.forEach((S) => { if (p < S.t[0]) return; const f = ease.io(seg(p, S.t[0], S.t[1])), q = f < 1 ? cut(S, f) : S.pts; q.forEach(([x, y], i) => (i ? ink.lineTo(x, y) : ink.moveTo(x, y))); });
  c.strokeStyle = 'rgba(120,30,18,.22)'; c.lineWidth = 12 * px; c.stroke(ink);
  c.strokeStyle = 'rgba(40,10,6,.75)'; c.lineWidth = 6 * px; c.stroke(ink);
  c.strokeStyle = '#ad321f'; c.lineWidth = 4 * px; c.stroke(ink);
  c.strokeStyle = 'rgba(243,217,143,.7)'; c.lineWidth = 1 * px; c.stroke(ink);
  if (p > TABUK_DASH[0]) { // the road to Tabuk, which he did not take
    const f = ease.io(seg(p, TABUK_DASH[0], TABUK_DASH[1])), q = cut(R.dash, f), d = new Path2D(); q.forEach(([x, y], i) => (i ? d.lineTo(x, y) : d.moveTo(x, y)));
    c.setLineDash([7 * px, 7 * px]); c.strokeStyle = 'rgba(40,24,12,.8)'; c.lineWidth = 2.4 * px; c.stroke(d); c.setLineDash([]);
  }
  { const [x, y] = pr(50.6, 17.4), r = .62; c.fillStyle = 'rgba(42,26,12,.55)'; c.beginPath(); c.arc(x, y, r * 1.08, 0, TAU); c.fill(); c.strokeStyle = PAL.gold; c.lineWidth = 1.2 * px; c.beginPath(); c.arc(x, y, r * 1.08, 0, TAU); c.stroke();
    [[0, PAL.goldHi, 1], [Math.PI / 8, PAL.gold, .62]].forEach(([o, col, k]) => { c.fillStyle = col; c.beginPath(); for (let i = 0; i < 16; i++) { const q = o + i * Math.PI / 8 - Math.PI / 2, rr = i % 2 ? r * .2 * k : r * k; c.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr); } c.closePath(); c.fill(); }); }
  c.restore();
  // the sheet's border: gold rules and a band of strapwork; corner stars
  const ins = .22, bw = .38, x0 = a[0] + ins, y0 = a[1] + ins, x1 = b[0] - ins, y1 = b[1] - ins;
  const bd = new Path2D(); bd.rect(x0, y0, x1 - x0, y1 - y0); bd.rect(x0 + bw, y0 + bw, x1 - x0 - 2 * bw, y1 - y0 - 2 * bw);
  const bp = c.createPattern(M.band, 'repeat'); bp.setTransform(new DOMMatrix([bw / 64, 0, 0, bw / 64, x0, y0]));
  c.fillStyle = bp; c.fill(bd, 'evenodd');
  c.strokeStyle = PAL.gold; c.lineWidth = 1.6 * px; c.strokeRect(x0, y0, x1 - x0, y1 - y0); c.strokeRect(x0 + bw, y0 + bw, x1 - x0 - 2 * bw, y1 - y0 - 2 * bw);
  c.lineWidth = .7 * px; c.strokeRect(a[0] + .08, a[1] + .08, b[0] - a[0] - .16, b[1] - a[1] - .16);
  c.fillStyle = PAL.goldHi; [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(([x, y]) => { c.beginPath(); for (let i = 0; i < 16; i++) { const q = i * Math.PI / 8, r = i % 2 ? .1 : .26; c.lineTo(x + Math.cos(q) * r, y + Math.sin(q) * r); } c.closePath(); c.fill(); });
}
function drawLight(c, st, cam, p, t, dpr) {
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const { W, H } = cam, scr = ([x, y]) => [W / 2 + (x - cam.c[0]) * cam.s, H / 2 + (y - cam.c[1]) * cam.s];
  const L = scr(lightAt(p, st.route)), born = smooth(seg(p, .015, .045));
  // the lamp over the desk follows the light; the far sheet sinks into shadow
  const D = Math.hypot(W, H), lp = c.createRadialGradient(L[0], L[1], 0, L[0], L[1], D * .7);
  lp.addColorStop(0, 'rgba(255,200,120,.16)'); lp.addColorStop(.35, 'rgba(255,200,120,.04)'); lp.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalCompositeOperation = 'soft-light'; c.fillStyle = lp; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
  const vg = c.createRadialGradient(L[0] * .4 + W * .3, L[1] * .4 + H * .3, Math.min(W, H) * .25, W / 2, H / 2, D * .72);
  vg.addColorStop(0, 'rgba(6,5,4,0)'); vg.addColorStop(1, 'rgba(6,5,4,.62)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'lighter';
  // arrival: a ring of light opens at each stop
  STOPS.forEach(([n, , , tk], k) => { const u = seg(p, tk, tk + .03); if (u <= 0 || u >= 1) return; const q = scr(P_(k === TABUK ? 'tabuk' : n)); c.strokeStyle = `rgba(243,217,143,${.7 * (1 - u)})`; c.lineWidth = 1.5; c.beginPath(); c.arc(q[0], q[1], 6 + 54 * ease.out(u), 0, TAU); c.stroke(); });
  if (born > 0) {
    const pulse = .85 + .15 * Math.sin(t * 2.2), r = (W < H ? 24 : 34) * born * (p > .865 ? 1 + .25 * smooth(seg(p, .865, .9)) : 1);
    c.globalAlpha = .9 * pulse; c.drawImage(glow, L[0] - r, L[1] - r, 2 * r, 2 * r);
    c.globalAlpha = .5; c.drawImage(glow, L[0] - r * 2.4, L[1] - r * 2.4, r * 4.8, r * 4.8);
    c.globalAlpha = 1; c.fillStyle = '#fff6e0'; c.beginPath(); c.arc(L[0], L[1], 3.2 * born, 0, TAU); c.fill();
    c.strokeStyle = `rgba(243,217,143,${.35 * born})`; c.lineWidth = 1; c.beginPath(); c.arc(L[0], L[1], 14 + 3 * Math.sin(t * 1.4), 0, TAU); c.stroke();
  }
  // dust in the lamplight, above the page: it drifts a little faster than the map
  c.fillStyle = '#ffe9c0';
  st.motes.forEach(([u, v, z, ph]) => {
    const k = 1.15 + z * .5, x = ((u * W * 1.4 - cam.c[0] * cam.s * .02 * k + Math.sin(t * .2 + ph) * 12) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * .2;
    const y = ((v * H * 1.4 - cam.c[1] * cam.s * .02 * k + Math.cos(t * .15 + ph) * 10) % (H * 1.4) + H * 1.4) % (H * 1.4) - H * .2;
    const near = Math.max(0, 1 - Math.hypot(x - L[0], y - L[1]) / (D * .45)); c.globalAlpha = .12 + .4 * near; c.fillRect(x, y, 1 + z * 1.6, 1 + z * 1.6);
  });
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}

S.rihla = {
  init(el, st) {
    st.cv = el.querySelector('canvas'); st.c = st.cv.getContext('2d');
    st.map = buildMap(); st.route = buildRoute();
    const R = rng(77); st.motes = Array.from({ length: 70 }, () => [R(), R(), R(), R() * TAU]);
    const stage = el.querySelector('.stage'), pins = [];
    const pin = (place, side, html, fx, small) => {
      const w = document.createElement('div'); w.className = 'rh-pin';
      const l = document.createElement('div'); l.className = `rh-lab rh-${side}${small ? ' rh-sm' : ''}`; l.dataset.fx = fx; l.innerHTML = html;
      w.append(l); stage.append(w); pins.push({ w, l, place, small });
    };
    STOPS.forEach(([n, name, year, tk, , , side], k) => {
      const at = k === TABUK ? TABUK_DASH[1] : tk, nx = k < STOPS.length - 1 ? (k + 1 === TABUK ? TABUK_DASH[1] : STOPS[k + 1][3]) : .89, end = nx - .008;
      pin(k === TABUK ? 'tabuk' : n, side, `<b data-k="rihla.s${k + 1}">${name}</b>${year ? `<span data-k="rihla.s${k + 1}y">${year}</span>` : ''}`, `o 0 1 ${(at - .012).toFixed(3)} ${(at + .002).toFixed(3)} | o 1 0 ${end.toFixed(3)} ${(end + .01).toFixed(3)}`, false);
    });
    FINAL.forEach(([n, side]) => pin(n, side, `<b data-k="rihla.f-${n}">${NAMES[n]}</b>`, 'o 0 1 .905 .94', true));
    st.pins = pins;
    if (reduced) pins.forEach((q) => { q.l.style.opacity = q.small ? '1' : '0'; });
  },
  frame(p, t, el, st) {
    fit(st.cv);
    const { c, cv } = st, dpr = cv.width / Math.max(1, cv.clientWidth), W = cv.clientWidth, H = cv.clientHeight;
    const cam = camAt(p, W, H); cam.W = W; cam.H = H;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    c.fillStyle = '#0b0906'; c.fillRect(0, 0, W, H);
    const desk = c.createRadialGradient(W / 2, H * .45, 0, W / 2, H * .45, Math.hypot(W, H) * .6); desk.addColorStop(0, 'rgba(70,46,24,.55)'); desk.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = desk; c.fillRect(0, 0, W, H);
    drawMap(c, st, cam, p, t, dpr);
    drawLight(c, st, cam, p, t, dpr);
    st.pins.forEach((q) => { const [x, y] = P_(q.place); q.w.style.translate = `${(W / 2 + (x - cam.c[0]) * cam.s).toFixed(1)}px ${(H / 2 + (y - cam.c[1]) * cam.s).toFixed(1)}px`; });
  },
};
})();
