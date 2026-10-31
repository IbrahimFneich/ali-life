(() => {
// badr: the valley of the wells on 17 Ramadan 2 AH, from first light to mid-morning. A pinhole camera over a small
// world in metres: x to the west, y up, z to the south (the Quraysh side). The sun rises in the east (-x).
// Terrain is a heightfield drawn as camera-facing depth bands, far to near, with a low sun and haze; the armies stand
// on the flat valley floor as faceless silhouettes. The Prophet and Ali are never figures: they are calm lights.
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerp = (a, b, k) => (Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * k) : a + (b - a) * k);
const cr1 = (a, b, c, d, u) => .5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
const crv = (P, u) => { const n = P.length - 1, i = Math.max(0, Math.min(n - 1, Math.floor(u))), f = u - i, a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(n, i + 2)]; return b.map((_, j) => cr1(a[j], b[j], c[j], d[j], f)); };
const keyAt = (K, p) => { let i = 1; while (i < K.length - 1 && p > K[i][0]) i++; const A = K[i - 1], B = K[i], k = smooth(c01((p - A[0]) / (B[0] - A[0]))); return A.slice(1).map((v, j) => lerp(v, B[j + 1], k)); };
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const sprite = (stops, n = 64) => { const c = mk(n, n), g = c.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); stops.forEach(([o, s]) => gr.addColorStop(o, s)); g.fillStyle = gr; g.fillRect(0, 0, n, n); return c; };

// ---------- the land: a flat floor of firm sand, a ring of dunes, low hills beyond ----------
const prof = (q) => (q < .7 ? smooth(q / .7) ** 1.3 : q < .8 ? 1 - .15 * ((q - .7) / .1) ** 2 : .85 * (1 - smooth((q - .8) / .2))); // windward slope, rounded crest, slip face
function height(x, z) {
  const ex = x / 430, ez = (z - 70) / 560, r = Math.sqrt(ex * ex + ez * ez);
  const belt = smooth(c01((r - .78) / .5)), hills = smooth(c01((r - 1.45) / 1.5));
  let h = .35 * Math.sin(x * .07 + z * .043) * Math.sin(z * .09 - x * .02) * (1 - belt);
  if (belt > 0) {
    const a = x * .0135 + z * .009 + Math.sin(z * .0071 + x * .0029) * 1.6 + Math.sin(x * .0047 - z * .0105) * 1.1;
    const b = x * .006 - z * .0155 + Math.sin(x * .009 + 2) * 1.2;
    const amp = .65 + .35 * Math.sin(x * .0037 + z * .0061) * Math.sin(z * .0029 - 1);
    h += belt * (6 + amp * (14 * prof(a - Math.floor(a)) + 7 * prof(b - Math.floor(b))) + 5 * Math.sin(x * .004 + z * .002));
  }
  if (hills > 0) h += hills * (60 + 38 * Math.sin(x * .0021 + 1.3) * Math.sin(z * .0027 + .4) + 14 * Math.sin(x * .011 + z * .007));
  const ad = (x + 20) ** 2 + (z + 64) ** 2; // the low rise behind the lines where the shelter stood
  return h + 2.6 * Math.exp(-ad / 600);
}
const ARISH = [-20, 0, -64];
const WELLS = [[16, -4, 2.2, 1], [-26, -30, 1.6, 0], [44, -36, 1.5, 0], [-60, 14, 1.5, 0], [66, 8, 1.4, 0]]; // x, z, radius, the cistern
const SUNH = norm([-1, 0, .25]);

// ---------- camera keys: [p, eye, look] ----------
const CAM = [
  [-.06, [74, 1.25, 0], [-40, 2.4, -24]],
  [0, [72, 1.3, -1], [-40, 2.4, -24]],
  [.05, [70, 13, -38], [-20, 2, -10]],
  [.1, [40, 30, -112], [-6, 0, 60]],
  [.15, [40, 6.5, -46], [-4, 1.6, 50]],
  [.205, [24, 2.0, 33], [-2, 1.6, 47]],
  [.27, [20.5, 1.85, 37], [-1, 1.5, 47.5]],
  [.33, [22, 2.1, 35], [-2, 1.6, 48]],
  [.38, [40, 9, -6], [-4, 2, 62]],
  [.45, [26, 38, -70], [-4, 0, 70]],
  [.51, [62, 7, 24], [-14, 2.5, 66]],
  [.57, [44, 13, 52], [-36, 2, 110]],
  [.63, [-10, 60, -40], [-24, 0, 104]],
  [.7, [16, 88, -60], [-22, 2, 110]],
  [.86, [12, 92, -54], [-22, 2, 112]],
  [1, [10, 93, -52], [-22, 2, 112]],
  [1.06, [9.5, 93.5, -51.5], [-22, 2, 112]],
];
function camAt(p) {
  let i = 0; while (i < CAM.length - 2 && p > CAM[i + 1][0]) i++;
  const u = i + smooth(c01((p - CAM[i][0]) / (CAM[i + 1][0] - CAM[i][0])));
  return { eye: crv(CAM.map((k) => k[1]), u), look: crv(CAM.map((k) => k[2]), u) };
}
// ---------- light keys: p, sky top, sky mid, horizon, sun colour, ambient, haze, sun elevation (deg), fog length ----------
const LK = [
  [-.06, [10, 12, 26], [30, 32, 54], [120, 78, 74], [255, 130, 80], [36, 40, 66], [84, 68, 80], -4, 700],
  [.06, [16, 22, 42], [58, 58, 86], [196, 120, 92], [255, 146, 90], [56, 60, 90], [140, 104, 100], -1, 760],
  [.17, [26, 34, 58], [96, 90, 108], [232, 156, 106], [255, 170, 108], [70, 76, 104], [190, 142, 112], 1.6, 820],
  [.34, [36, 48, 74], [124, 116, 122], [236, 178, 126], [255, 190, 128], [82, 88, 112], [200, 158, 124], 3.5, 760],
  [.5, [44, 54, 76], [136, 124, 122], [222, 182, 140], [255, 204, 146], [90, 94, 112], [186, 156, 128], 6, 560],
  [.66, [50, 64, 90], [146, 140, 136], [216, 192, 156], [255, 218, 170], [98, 102, 118], [188, 168, 140], 9, 900],
  [1.06, [54, 70, 98], [152, 148, 144], [214, 196, 164], [255, 226, 184], [104, 108, 124], [190, 174, 150], 13, 1100],
];

// ---------- silhouettes (u across, v up, metres; facing +u) ----------
const MAN = [-.34, 0, -.27, .55, -.2, 1.0, -.25, 1.3, -.21, 1.42, -.17, 1.5, -.16, 1.62, -.1, 1.74, .02, 1.78, .11, 1.7, .12, 1.58, .08, 1.5, .2, 1.42, .24, 1.25, .19, 1.0, .26, .55, .32, 0];
const MAN2 = [-.4, 0, -.3, .5, -.21, 1.0, -.26, 1.32, -.2, 1.44, -.1, 1.5, -.14, 1.58, -.13, 1.7, -.04, 1.79, .08, 1.78, .14, 1.68, .12, 1.56, .07, 1.5, .19, 1.44, .25, 1.28, .2, 1.0, .3, .5, .36, 0];
const MANS = [-.3, 0, -.22, 1.3, -.12, 1.5, -.08, 1.76, .08, 1.76, .12, 1.5, .22, 1.3, .3, 0]; // far LOD
const RIMF = [[9, 16], [10, 17]], RIMB = [[1, 8], [1, 9]]; // contour points on each side, per shape
const HORSE = [-1.14, 1.3, -.98, 1.5, -.3, 1.46, .42, 1.56, .66, 1.76, .9, 2.06, 1.02, 2.1, 1.3, 1.86, 1.3, 1.75, 1.16, 1.73, .96, 1.84, .82, 1.42, .78, 1.16, .2, 1.02, -.6, 1.05, -.96, 1.14, -1.04, .98, -1.2, 1.06];
const RIDER = [-.24, 1.48, -.22, 1.95, -.14, 2.12, -.13, 2.26, -.06, 2.37, .05, 2.37, .11, 2.26, .12, 2.12, .2, 1.95, .24, 1.48];
const CAMEL = [-1.05, 1.36, -.95, 1.62, -.6, 1.95, -.2, 2.2, .15, 2.05, .45, 1.78, .72, 1.72, .95, 1.62, 1.18, 1.78, 1.32, 2.08, 1.42, 2.28, 1.62, 2.32, 1.72, 2.24, 1.66, 2.14, 1.46, 2.08, 1.3, 1.7, 1.08, 1.38, .85, 1.3, .3, 1.24, -.4, 1.24, -.9, 1.3];
const KNEEL = [-1.1, 0, -1.08, .55, -.8, .85, -.35, 1.18, .05, 1.12, .4, .86, .75, .78, 1.0, 1.05, 1.15, 1.4, 1.38, 1.48, 1.48, 1.4, 1.36, 1.3, 1.18, 1.0, 1.0, .55, .95, .3, 1.05, 0];
const TENT = [-3.4, 0, -3.1, 1.05, -1.8, 1.7, 0, 1.92, 1.8, 1.7, 3.1, 1.05, 3.4, 0];
const poly = (pa, sh, bx, by, s, sv, dir, rot = 0, lean = 0) => {
  const cr = Math.cos(rot), sr = Math.sin(rot);
  for (let i = 0; i < sh.length; i += 2) {
    const u = (sh[i] + lean * sh[i + 1]) * dir, v = sh[i + 1], X = bx + (u * cr + v * sr * dir) * s, Y = by - (v * cr - u * sr * dir) * sv;
    i ? pa.lineTo(X, Y) : pa.moveTo(X, Y);
  }
  pa.closePath();
};

// ---------- Ali's way through the Quraysh ranks ----------
const PATH = [[0, 50], [-8, 64], [-28, 78], [-46, 96], [-40, 118], [-20, 130], [-6, 148], [-22, 166], [-48, 172], [-70, 160], [-80, 138]];
const pathAt = (u) => crv(PATH, c01(u) * (PATH.length - 1));
const aliU = (p) => smooth(seg(p, .465, .6));
const MEET = [0, 1.25, 49];
function aliAt(p) {
  if (p < .12) return [0, 1.25, -12];
  if (p < .27) return [0, 1.25, mix(-12, 41, smooth(seg(p, .12, .205))) + .4 * Math.sin(p * 90) * seg(p, .205, .26)];
  if (p < .4) return [0, 1.25, mix(41, 47.4, smooth(seg(p, .27, .281))) - 3.6 * smooth(seg(p, .29, .33))];
  if (p < .465) return [0, 1.25, mix(43.8, 50, smooth(seg(p, .4, .465)))];
  const q = pathAt(aliU(p)); return [q[0], 1.25, q[1]];
}

S.badr = {
  init(el, st) {
    st.cv = el.querySelector('canvas');
    st.c = st.cv.getContext('2d');
    st.n = el.querySelector('[data-k="H7n"]');
    const de = (s) => +String(s || '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g, '');
    st.goal = Math.max(1, Math.min(69, de(st.n && st.n.textContent) || 35)); // al-Mufid's count, read from the caption
    st.bloom = mk(8, 8); st.bc = st.bloom.getContext('2d');
    st.puff = sprite([[0, 'rgba(236,200,150,.85)'], [.45, 'rgba(222,184,138,.38)'], [1, 'rgba(214,176,130,0)']]);
    st.puffD = sprite([[0, 'rgba(120,96,76,.8)'], [.5, 'rgba(120,96,76,.35)'], [1, 'rgba(120,96,76,0)']]);
    st.glow = sprite([[0, 'rgba(255,255,255,1)'], [.16, 'rgba(255,255,255,.55)'], [.42, 'rgba(255,255,255,.14)'], [1, 'rgba(255,255,255,0)']], 128);
    st.tints = {};
    const R = rng(1702);
    const gs = () => (R() + R() + R() - 1.5) / 1.5;
    st.NS = 68; st.NK = 80;
    st.TX = new Float32Array(st.NS * (st.NK + 1)); st.TY = new Float32Array(st.NS * (st.NK + 1));
    st.TC = new Array(st.NS * (st.NK / 4 + 1));
    st.ridges = [0, 1].map((L) => { const a = []; let h = .02; for (let i = 0; i <= 360; i++) { h = mix(h, (L ? .028 : .045) + (L ? .02 : .03) * Math.sin(i * .07 + L * 2) ** 2 + R() * .012, .3); a.push(h); } return a; });
    st.stars = Array.from({ length: 200 }, () => [R() * TAU, .04 + R() ** .8 * 1.1, R()]);
    st.clouds = Array.from({ length: 16 }, () => [-1.4 + R() * 3.2, .1 + R() * .32, .5 + R() * 1.2, .02 + R() * .03, .25 + R() * .5]);
    st.marks = Array.from({ length: 2200 }, () => [(R() - .5) * 760, -320 + R() * 820, R(), R()]);
    st.shrubs = []; for (let i = 0; i < 190; i++) { const x = (R() - .5) * 860, z = -340 + R() * 880; if (Math.abs(x) < 190 && z > -80 && z < 230) continue; st.shrubs.push([x, z, .5 + R() * 1.3, R(), height(x, z)]); }
    // ---- the people ----
    const F = [], add = (o) => { o.hs = o.hs || .92 + R() * .16; F.push(o); return o; };
    // Muslims: 313 in four ranks by the wells, facing south; seventy camels and two horses behind
    for (let i = 0; i < 313; i++) {
      const row = i % 4, col = Math.floor(i / 4), n = 79, grp = Math.floor(col / 9);
      const x0 = -80 + (col / (n - 1)) * 156 + grp * .9 + gs() * .45, z0 = -12 - row * 2.7 + gs() * .45;
      add({ side: 0, kind: R() < .38 ? 1 : 0, x0, z0, x1: x0 * .9 + gs() * 2, z1: 26 + (3 - row) * 3.2 + gs() * 2.2 + Math.abs(x0) * .05, x2: x0 * .75 + gs() * 12, z2: -26 + R() * 30, d: R() * .025 + row * .006, ph: R() * TAU, ft: 9 });
    }
    for (let i = 0; i < 70; i++) { const x0 = -104 + (i % 10) * 6 + gs() * 1.6, z0 = -36 - Math.floor(i / 10) * 5 + gs() * 1.2; add({ side: 0, kind: R() < .8 ? 4 : 3, x0, z0, x1: x0, z1: z0, x2: x0, z2: z0, d: 0, ph: R() * TAU, ft: 9, fix: 1, dir: R() < .5 ? 1 : -1 }); }
    [-86, 86].forEach((x) => add({ side: 0, kind: 2, x0: x, z0: -17, x1: x * .95, z1: 30, x2: x * .7, z2: 40, d: .01, ph: R() * TAU, ft: 9 }));
    // the seventy who fall: al-Walid and the two others at the duel; the rest in the field. Ali's share lies along his way.
    const fall = [{ x: 0, z: 52.6, ft: .284, ali: 1, a: .25 }, { x: -9, z: 52.6, ft: .305, ali: 0, a: -.4 }, { x: 9, z: 52.6, ft: .326, ali: 0, a: 2.6 }];
    const nAli = st.goal - 1;
    for (let j = 0; j < nAli; j++) {
      const u = .05 + (j / Math.max(1, nAli - 1)) * .92 + (R() - .5) * .03, q = pathAt(u), q2 = pathAt(u + .01), nx = -(q2[1] - q[1]), nz = q2[0] - q[0], nl = Math.hypot(nx, nz) || 1, off = (R() < .5 ? -1 : 1) * (1.4 + R() * 5.5);
      fall.push({ x: q[0] + nx / nl * off, z: q[1] + nz / nl * off, ft: .465 + .135 * smooth(c01(u)) + .004, ali: 1, a: R() * TAU });
    }
    while (fall.length < 70) { const x = (R() - .5) * 200, z = 56 + R() * 112; if (Math.abs(x) < 60 && z > 60 && z < 190 && R() < .6) continue; fall.push({ x, z, ft: .47 + R() * .14, ali: 0, a: R() * TAU }); }
    st.fall = fall;
    // Quraysh: about a thousand on foot, a hundred horse, the camels and tents of their camp
    for (let i = 0; i < 950; i++) {
      const x0 = gs() * 120 + (R() - .5) * 60, z0 = 112 + R() ** .8 * 92 + Math.abs(x0) * .1;
      const fi = i >= 3 && i < 70 ? fall[i] : null;
      add({ side: 1, kind: R() < .45 ? 1 : 0, x0, z0, x1: fi ? fi.x : x0 * .92 + gs() * 3, z1: fi ? fi.z : 58 + (z0 - 112) * .9 + gs() * 3, x2: x0 * 1.6 + gs() * 40, z2: 520 + R() * 300, d: (z0 - 112) / 92 * .03 + R() * .01, d2: R() * .05, ph: R() * TAU, ft: fi ? fi.ft : 9, fa: fi ? fi.a : 0 });
    }
    for (let i = 0; i < 100; i++) { const sd = i < 50 ? -1 : 1, x0 = sd * (128 + R() * 70), z0 = 100 + R() * 60; add({ side: 1, kind: 2, x0, z0, x1: sd * (70 + R() * 70), z1: 62 + R() * 40, x2: x0 * 1.3, z2: 560 + R() * 260, d: R() * .02 - .02, d2: R() * .03 - .02, ph: R() * TAU, ft: 9 }); }
    for (let i = 0; i < 260; i++) { const x0 = (R() - .5) * 300, z0 = 236 + R() * 110; add({ side: 1, kind: R() < .65 ? 4 : 3, x0, z0, x1: x0, z1: z0, x2: x0, z2: z0, d: 0, ph: R() * TAU, ft: 9, fix: 1, dir: R() < .5 ? 1 : -1 }); }
    for (let i = 0; i < 26; i++) { const x0 = (R() - .5) * 280, z0 = 240 + R() * 110; add({ side: 1, kind: 5, x0, z0, x1: x0, z1: z0, x2: x0, z2: z0, d: 0, ph: 0, ft: 9, fix: 1, dir: 1, hs: 1 }); }
    st.F = F;
    // champions: [x, side, which of the fallen]; the Muslim two are silhouettes, Ali is the light between them
    st.champ = [[-9, 0, -1], [9, 0, -1], [-9, 1, 1], [0, 1, 0], [9, 1, 2]];
    st.ban = [[-52, -15, [226, 214, 186], 0], [-6, -15, [226, 214, 186], 0], [30, -15, [62, 116, 88], 0]];
    for (let i = 0; i < 12; i++) st.ban.push([(R() - .5) * 220, 120 + R() * 70, i % 3 ? [112, 36, 30] : [30, 25, 24], 1, .56 + R() * .07]);
    // dust: puffs where the lines meet and along Ali's way; trails behind the horse; motes in the low sun
    st.puffs = Array.from({ length: 300 }, (_, i) => {
      if (i < 70) { const q = pathAt(i / 70); return [q[0] + gs() * 4, q[1] + gs() * 4, .465 + .135 * (i / 70), 5 + R() * 8, R() * TAU, R(), 0]; } // along his way
      if (i < 250) { const x = (R() - .5) * 236; return [x, 54 + gs() * 7 + Math.abs(x) * .05, .45 + R() * .12, 6 + R() * 10, R() * TAU, R(), 0]; } // the front
      return [(R() - .5) * 260, 50 + R() * 50, .44 + R() * .1, 22 + R() * 16, R() * TAU, R(), 1]; // a low veil over the field
    });
    st.flick = Array.from({ length: 240 }, () => [(R() - .5) * 230, 52 + gs() * 8, .9 + R() * 1.6, R()]);
    st.trail = Array.from({ length: 90 }, () => [R() < .5 ? -1 : 1, R(), 3 + R() * 6, R() * TAU]);
    st.motes = new Float32Array(2800 * 4); for (let i = 0; i < 2800; i++) { st.motes[i * 4] = (R() - .5) * 260; st.motes[i * 4 + 1] = 30 + R() * 160; st.motes[i * 4 + 2] = R() ** 1.7 * 26; st.motes[i * 4 + 3] = R(); }
  },

  frame(p, t, el, st) {
    fit(st.cv);
    const { c, cv } = st;
    const dpr = cv.width / Math.max(1, cv.clientWidth), W = cv.clientWidth, H = cv.clientHeight, phone = W < H * .8;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // ----- camera -----
    const { eye, look } = camAt(p);
    if (phone) { const back = mix(1.4, 1.05, smooth(seg(p, .13, .17)) * (1 - smooth(seg(p, .35, .4)))); for (let j = 0; j < 3; j++) eye[j] = look[j] + (eye[j] - look[j]) * back; eye[1] = Math.max(eye[1], 1.25); }
    const fw = norm(sub(look, eye)), rt = norm(cross([0, 1, 0], fw)), up = cross(fw, rt);
    const F = phone ? W * 1.05 : Math.min(H * 1.3, W * .98), cx = W / 2, cy = H * (phone ? .6 : .52);
    const [E0, E1, E2] = eye, [f0, f1, f2] = fw, [r0, r1, r2] = rt, [u0, u1, u2] = up;
    let PX = 0, PY = 0, PZ = 0;
    const pj = (x, y, z) => { const dx = x - E0, dy = y - E1, dz = z - E2, zc = dx * f0 + dy * f1 + dz * f2; if (zc < .4) return false; const iz = F / zc; PX = cx + (dx * r0 + dy * r1 + dz * r2) * iz; PY = cy - (dx * u0 + dy * u1 + dz * u2) * iz; PZ = zc; return true; };
    // ----- light -----
    const [skT, skM, skH, sunC, amb, haze0, elev, fogL0] = keyAt(LK, p);
    const fight = smooth(seg(p, .44, .5)) * (1 - smooth(seg(p, .6, .7)));
    const fogL = fogL0 * (1 - .15 * fight);
    const se = elev * Math.PI / 180, sun = [SUNH[0] * Math.cos(se), Math.sin(se), SUNH[2] * Math.cos(se)];
    const hazeAt = (vx, vz) => { const k = Math.max(0, (vx * SUNH[0] + vz * SUNH[2]) / (Math.hypot(vx, vz) || 1)) ** 5; return lerp(haze0, lerp(skH, sunC, .25), k * .8); };
    const fogOf = (zc) => Math.min(.95, 1 - Math.exp(-zc / fogL));
    const pitch = Math.asin(Math.max(-.99, Math.min(.99, f1))), hy = cy + F * Math.tan(pitch);
    const tint = (col) => { if (!st.tints[col]) { const cc = mk(128, 128), g = cc.getContext('2d'); g.drawImage(st.glow, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, 128, 128); st.tints[col] = cc; } return st.tints[col]; };
    // ----- sky -----
    const sg = c.createLinearGradient(0, hy - F * .9, 0, hy);
    sg.addColorStop(0, rgb(skT)); sg.addColorStop(.6, rgb(skM)); sg.addColorStop(1, rgb(skH));
    c.fillStyle = sg; c.fillRect(0, 0, W, H); // every pixel, every frame: below the horizon the terrain paints over it
    const SD = 1e5;
    let SX = -1e4, SY = -1e4;
    if (pj(E0 + sun[0] * SD, E1 + Math.max(sun[1], -.02) * SD, E2 + sun[2] * SD)) {
      const sx = PX, sy = PY; SX = sx; SY = sy;
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(sx, sy, 0, sx, sy, F * 1.1);
      g.addColorStop(0, rgb(sunC, .4)); g.addColorStop(.16, rgb(sunC, .14)); g.addColorStop(1, rgb(sunC, 0));
      c.fillStyle = g; c.fillRect(0, 0, W, hy + 2);
      if (elev > -1.2) { const r = F * .0062; c.globalAlpha = c01((elev + 1.2) / 1.5) * .9; c.drawImage(tint('#ffe2b0'), sx - r * 10, sy - r * 10, r * 20, r * 20); c.fillStyle = 'rgba(255,246,226,.95)'; c.beginPath(); c.arc(sx, sy, r, 0, TAU); c.fill(); c.globalAlpha = 1; }
      c.globalCompositeOperation = 'source-over';
    }
    const az0 = Math.atan2(f0, f2);
    const dirP = (az, e2) => pj(E0 + Math.sin(az) * Math.cos(e2) * SD, E1 + Math.sin(e2) * SD, E2 + Math.cos(az) * Math.cos(e2) * SD);
    const starA = 1 - smooth(seg(p, -.02, .12));
    if (starA > 0) { c.fillStyle = '#f1e8d0'; st.stars.forEach(([az, e2, k]) => { if (!dirP(az, e2) || PX < 0 || PX > W || PY > hy - 8) return; c.globalAlpha = starA * (.2 + .6 * k) * (.7 + .3 * Math.sin(t * 2 + k * 50)); const s = k > .9 ? 1.6 : 1; c.fillRect(PX, PY, s, s); }); c.globalAlpha = 1; }
    const cl = lerp(lerp(skM, sunC, .55), [255, 240, 220], .15);
    st.clouds.forEach(([az, e2, w, h, a]) => {
      if (!dirP(-Math.PI / 2 + az, e2)) return; const x = PX, y = PY, rw = w * F * .5, rh = h * F * .6;
      if (x < -rw || x > W + rw || y > hy) return;
      c.save(); c.translate(x, y); c.scale(rw, rh); const g = c.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, rgb(cl, a * .5)); g.addColorStop(1, rgb(cl, 0)); c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore();
    });
    st.ridges.forEach((rg, L) => {
      const col = lerp(lerp(haze0, skH, L ? .35 : .55), [70, 60, 70], L ? .25 : .12);
      c.fillStyle = rgb(col); c.beginPath(); c.moveTo(-2, hy + 4);
      for (let x = -2; x <= W + 22; x += 22) { const az = az0 + Math.atan((x - cx) / F); const ii = ((az / TAU * 720) % 360 + 360) % 360, i0 = Math.floor(ii), h = mix(rg[i0], rg[(i0 + 1) % 361], ii - i0); c.lineTo(x, hy - F * Math.tan(h) * (L ? .7 : .45)); }
      c.lineTo(W + 22, hy + 4); c.closePath(); c.fill();
    });
    // ----- terrain: depth bands, far to near, each band filled down to the next nearer one -----
    const NS = st.NS, NK = st.NK, NC = NK / 4 + 1, TX = st.TX, TY = st.TY, TC = st.TC;
    const hf = norm([f0, 0, f2]), hr = [hf[2], 0, -hf[0]], cp = Math.cos(pitch), sp = Math.sin(pitch);
    const by = (H - cy) / F, dyb = sp - by * cp, dhb = cp + by * sp;
    const dMin = dyb < -.01 ? Math.max(1.5, E1 / -dyb * dhb * .8) : 4, dMax = 4200;
    const albedo = [196, 162, 118];
    for (let i = 0; i < NS; i++) {
      const d = dMin * (dMax / dMin) ** (1 - i / (NS - 1));
      const zc0 = Math.max(.6, d * cp - E1 * sp), fogK = 1 - Math.exp(-d / fogL);
      for (let k = 0; k <= NK; k++) {
        const sx = -W * .06 + k * (W * 1.12 / NK), u = (sx - cx) / F * zc0;
        const x = E0 + hf[0] * d + hr[0] * u, z = E2 + hf[2] * d + hr[2] * u, h = height(x, z);
        const o = i * (NK + 1) + k;
        if (pj(x, h, z)) { TX[o] = PX; TY[o] = Math.max(-H, Math.min(H * 3, PY)); } else { TX[o] = sx; TY[o] = H * 3; }
        if (k % 4 === 0) {
          const e = Math.max(.5, d * .004), hx = (height(x + e, z) - h) / e, hz = (height(x, z + e) - h) / e, nl = Math.hypot(hx, 1, hz);
          let lam = Math.max(0, (-hx * sun[0] + sun[1] - hz * sun[2]) / nl); const sky = .55 + .45 / nl;
          if (lam > 0 && sun[1] > -.02) { let sh = 1; for (let m = 0, L = 7; m < 4; m++, L *= 2.6) { const q = height(x + sun[0] * L, z + sun[2] * L) - (h + .4 + sun[1] * L); if (q > 0) { sh = Math.min(sh, 1 - c01(q / 3)); if (sh <= 0) break; } } lam *= sh; }
          const lit = [0, 1, 2].map((j) => albedo[j] / 255 * (amb[j] * sky * .78 + sunC[j] * lam * 1.3));
          TC[i * NC + k / 4] = rgb(lerp(lit, hazeAt(x - E0, z - E2), Math.min(.97, fogK * (1 - .25 * c01(h / 120)))));
        }
      }
    }
    for (let i = 0; i < NS; i++) {
      const o = i * (NK + 1), last = i === NS - 1;
      c.beginPath(); c.moveTo(TX[o], TY[o]);
      for (let k = 1; k <= NK; k++) c.lineTo(TX[o + k], TY[o + k]);
      for (let k = NK; k >= 0; k--) c.lineTo(last ? TX[o + k] : TX[o + NK + 1 + k], last ? H + 4 : Math.max(TY[o + k], TY[o + NK + 1 + k]) + 1.2); // the nearer band's own x: no seams on steep faces
      c.closePath();
      const g = c.createLinearGradient(TX[o], 0, TX[o + NK], 0);
      for (let k = 0; k < NC; k++) g.addColorStop(k / (NC - 1), TC[i * NC + k]);
      c.fillStyle = g; c.fill();
    }
    const sandLit = albedo.map((v, j) => v / 255 * (amb[j] * .8 + sunC[j] * Math.max(0, sun[1]) * 1.15));
    // ground marks: wind ripples and stones near the camera
    c.lineWidth = 1;
    [0, 1].forEach((pass) => {
      c.strokeStyle = pass ? rgb(lerp(sandLit, [255, 236, 200], .35), .24) : rgb(lerp(sandLit, [20, 14, 10], .55), .26);
      c.beginPath();
      st.marks.forEach(([x, z, q, k]) => {
        if ((k > .55) !== !!pass || !pj(x, 0, z) || PZ > 300) return;
        const L = (.4 + q * 1.2) * F / PZ; if (PX < -L || PX > W + L || PY > H + 2 || PY < hy) return;
        c.moveTo(PX - L, PY); c.lineTo(PX + L, PY);
      });
      c.stroke();
    });
    // shrubs: dark low domes with a lit rim
    const sunSide = Math.sign(r0 * sun[0] + r2 * sun[2]) || 1, shrubP = new Path2D(), shrubS = new Path2D(), shrubR = new Path2D();
    st.shrubs.forEach(([x, z, r, k, h]) => {
      if (!pj(x, h, z)) return; const s = F / PZ * r; if (s < .6 || PX < -s * 3 || PX > W + s * 3 || PY > H + s) return;
      const ww = s * (1 + k * .4), hh = s * (.55 + k * .3);
      shrubS.moveTo(PX - sunSide * s * 1.4 + s * 2, PY); shrubS.ellipse(PX - sunSide * s * 1.4, PY, s * 2, s * .22, 0, 0, TAU);
      shrubP.moveTo(PX + ww, PY); shrubP.ellipse(PX, PY, ww, hh, 0, 0, Math.PI, true);
      { const a0 = sunSide > 0 ? -.3 : Math.PI + .3; shrubR.moveTo(PX + ww * Math.cos(a0), PY + hh * Math.sin(a0)); } shrubR.ellipse(PX, PY, ww, hh, 0, sunSide > 0 ? -.3 : Math.PI + .3, sunSide > 0 ? -1.2 : Math.PI + 1.2, sunSide > 0);
    });
    c.fillStyle = rgb([18, 14, 10], .3); c.fill(shrubS);
    c.fillStyle = rgb(lerp([38, 34, 22], haze0, .12)); c.fill(shrubP);
    c.strokeStyle = rgb(sunC, .35); c.lineWidth = 1; c.stroke(shrubR);
    // the wells and the cistern: stone rims, dark water holding the sky
    WELLS.forEach(([x, z, r, cis]) => {
      const ring = (rr, y) => { const pts = []; for (let a = 0; a <= 24; a++) { const an = a / 24 * TAU, rx = cis ? Math.max(-1, Math.min(1, Math.cos(an) * 1.6)) * rr * 2.2 : Math.cos(an) * rr, rz = cis ? Math.max(-1, Math.min(1, Math.sin(an) * 1.6)) * rr * 1.2 : Math.sin(an) * rr; if (!pj(x + rx, y, z + rz)) return null; pts.push([PX, PY]); } return pts; };
      const out = ring(r + .5, .45), inn = ring(r, .46); if (!out || !inn) return;
      const fz = fogOf(PZ), path = (pts) => { c.beginPath(); pts.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.closePath(); };
      c.fillStyle = rgb(lerp([92, 76, 60], haze0, fz)); path(out); c.fill();
      const ys = inn.map((q) => q[1]), wg = c.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys) + .1);
      wg.addColorStop(0, rgb(lerp([20, 18, 20], haze0, fz))); wg.addColorStop(1, rgb(lerp(lerp(skM, skH, .5), haze0, fz), .9));
      c.fillStyle = wg; path(inn); c.fill();
      c.strokeStyle = rgb(lerp(sunC, haze0, fz), .5); c.lineWidth = 1; path(out); c.stroke();
    });
    // the shelter on the rise behind the lines, where the Prophet's light rests
    const ah = height(ARISH[0], ARISH[2]);
    {
      const top = [], fz0 = pj(ARISH[0], ah, ARISH[2]) ? fogOf(PZ) : 1;
      c.strokeStyle = rgb(lerp([40, 30, 22], haze0, fz0)); c.lineWidth = Math.max(1, F / Math.max(1, PZ) * .1);
      [[-2.2, -1.6], [2.2, -1.6], [2.2, 1.6], [-2.2, 1.6]].forEach(([dx, dz]) => { if (pj(ARISH[0] + dx, ah, ARISH[2] + dz)) { const bx = PX, by2 = PY; if (pj(ARISH[0] + dx, ah + 2.3, ARISH[2] + dz)) { c.beginPath(); c.moveTo(bx, by2); c.lineTo(PX, PY); c.stroke(); top.push([PX, PY]); } } });
      if (top.length === 4) { c.fillStyle = rgb(lerp([52, 40, 26], haze0, fz0)); c.beginPath(); top.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.closePath(); c.fill(); c.strokeStyle = rgb(lerp(sunC, haze0, fz0), .35); c.stroke(); }
    }

    // ----- the people -----
    const towardS = Math.sign(r2) || 1; // +z (south) lies to the right of the screen when r2 > 0
    const shadowP = new Path2D(), rimP = new Path2D(), legP = new Path2D(), spearP = new Path2D(), fallP = new Path2D();
    const BANDS = [90, 260, 700], body = [BANDS.map(() => new Path2D()), BANDS.map(() => new Path2D())];
    const sl = Math.max(.32, Math.tan(se)), shn = Math.hypot(sun[0], sun[2]), shx = -sun[0] / shn / sl, shz = -sun[2] / shn / sl;
    const A = aliAt(p);
    const draw = (side, kind, x, z, dir, ph, moving, hs, rot = 0, band = -1) => {
      if (!pj(x, 0, z)) return; const bx = PX, by0 = PY, zc = PZ;
      if (bx < -60 || bx > W + 60 || by0 < -40 || by0 > H + 80) return;
      const s = F / zc, sv = s * (1 - Math.abs(sp) * .5) * hs;
      const ht = kind === 2 ? 2.4 : kind === 3 ? 2.3 : kind === 5 ? 1.9 : kind === 4 ? 1.4 : 1.75;
      const pa = body[side][band >= 0 ? band : zc < BANDS[0] ? 0 : zc < BANDS[1] ? 1 : 2];
      const hpx = ht * sv;
      if (hpx > 9 && kind !== 5 && pj(x + shx * ht, 0, z + shz * ht)) { shadowP.moveTo(bx, by0); shadowP.lineTo(PX, PY); }
      if (hpx < 5) { const w = Math.max(.9, (kind >= 2 ? 1.8 : .5) * s); pa.rect(bx - w / 2, by0 - Math.max(1.2, hpx), w, Math.max(1.2, hpx)); return; }
      if (kind < 2) {
        const lean = moving ? .1 : 0, bob = moving ? Math.abs(Math.sin(ph)) * .04 * sv : 0, alt = (ph * 7 | 0) & 1, sh = hpx < 16 && !rot ? MANS : alt ? MAN2 : MAN;
        poly(pa, sh, bx, by0 - bob, s, sv, dir, rot, lean);
        if (rot) return;
        if (kind === 1) { const sa = Math.sin(ph * 3.1) * .25; spearP.moveTo(bx + (.2 - sa * .3) * s * dir, by0 - .45 * sv); spearP.lineTo(bx + (.3 + lean * 2.6 + sa) * s * dir, by0 - (2.9 + sa * .3) * sv); }
        if (hpx >= 16) { const [i0, i1] = (dir * sunSide > 0 ? RIMF : RIMB)[alt]; for (let i = i0; i <= i1; i++) { const u = (sh[i * 2] + lean * sh[i * 2 + 1]) * dir, X = bx + u * s, Y = by0 - bob - sh[i * 2 + 1] * sv; i === i0 ? rimP.moveTo(X, Y) : rimP.lineTo(X, Y); } }
      } else if (kind === 2) {
        poly(pa, HORSE, bx, by0, s, sv, dir); poly(pa, RIDER, bx - .1 * s * dir, by0, s, sv, dir);
        const sw = moving ? .5 : .08;
        [[.62, 0], [.74, 1.6], [-.74, 3.1], [-.86, 4.7]].forEach(([hu, o]) => { const a = Math.sin(ph + o) * sw; legP.moveTo(bx + hu * s * dir, by0 - 1.12 * sv); legP.lineTo(bx + (hu + a * .5) * s * dir, by0 - .52 * sv + Math.abs(a) * .2 * sv); legP.lineTo(bx + (hu + a * .3) * s * dir, by0); });
        spearP.moveTo(bx - .1 * s * dir, by0 - 1.9 * sv); spearP.lineTo(bx + 1.6 * s * dir, by0 - 3.2 * sv);
      } else if (kind === 3) {
        poly(pa, CAMEL, bx, by0, s, sv, dir);
        [[.68, 0], [.8, 1.6], [-.72, 3.1], [-.84, 4.7]].forEach(([hu, o]) => { legP.moveTo(bx + hu * s * dir, by0 - 1.28 * sv); legP.lineTo(bx + (hu + Math.sin(ph + o) * .04) * s * dir, by0); });
      } else poly(pa, kind === 4 ? KNEEL : TENT, bx, by0, s, sv, dir);
    };
    const lie = [];
    const rout = (o) => ease.in(seg(p, .56 + (o.d2 || 0), .7 + (o.d2 || 0)));
    const F_ = st.F;
    for (let i = 0; i < F_.length; i++) {
      const o = F_[i];
      let x = o.x0, z = o.z0, moving = false, dir = o.dir || (o.side ? -towardS : towardS);
      if (!o.fix) {
        if (o.side === 0) {
          const a = ease.io(seg(p, .42 + o.d, .485 + o.d)); x = mix(o.x0, o.x1, a); z = mix(o.z0, o.z1, a); moving = a > 0 && a < 1;
          const g = ease.io(seg(p, .64 + o.d * 2, .78 + o.d * 2)); if (g > 0) { x = mix(x, o.x2, g); z = mix(z, o.z2, g); moving = moving || g < 1; }
          if (fight > 0 && z > 20) { x += Math.sin(t * 2 + o.ph + p * 60) * .6 * fight; }
        } else {
          const a = ease.io(seg(p, (o.kind === 2 ? .4 : .41) + o.d, (o.kind === 2 ? .46 : .48) + o.d)); x = mix(o.x0, o.x1, a); z = mix(o.z0, o.z1, a); moving = a > 0 && a < 1;
          if (o.ft < 2 && p >= o.ft) { lie.push([o.x1, o.z1, o.fa, o.ft]); continue; }
          if (o.ft > 2) {
            if (fight > 0) { const j = fight * (1 - rout(o)); x += Math.sin(t * 2 + o.ph + p * 60) * .8 * j; z += Math.cos(t * 1.7 + o.ph + p * 50) * .8 * j; }
            if (p > .46 && p < .64) { const dx = x - A[0], dz = z - A[2], dd = Math.hypot(dx, dz); if (dd < 12) { const k = (12 - dd) / 12 * 7; x += dx / (dd || 1) * k; z += dz / (dd || 1) * k; } } // the ranks give way where he passes
            const r = rout(o); if (r > 0) { if (r >= 1) continue; x = mix(x, o.x2, r); z = mix(z, o.z2, r); moving = true; dir = towardS; }
          }
        }
      }
      draw(o.side, o.kind, x, z, dir, o.ph + p * 260, moving, o.hs);
    }
    // the champions: three of Quraysh step out; Hamza and Ubayda beside Ali's light. Al-Walid goes down first.
    if (p > .1 && p < .5) {
      const out = smooth(seg(p, .12, .205)), back = smooth(seg(p, .34, .42));
      st.champ.forEach(([x0, side, fi], j) => {
        const z = side ? mix(108, 52.6, out) : mix(-12, mix(41, 32, back), out);
        const x = x0 + Math.sin(p * 70 + j) * .35 * seg(p, .2, .26);
        let rot = 0;
        if (side) { const f = st.fall[fi], k = seg(p, f.ft, f.ft + .01); if (k >= 1) { lie.push([f.x, f.z, f.a, f.ft]); return; } rot = -ease.in(k) * 1.45 * (side ? -towardS : towardS); }
        draw(side, 1, x, z, side ? -towardS : towardS, j + p * 300, out > 0 && out < 1, 1.04, rot, 0);
      });
    }
    // the fallen: low dark shapes on the sand
    lie.forEach(([x, z, a, ft]) => {
      const ca = Math.cos(a), sa = Math.sin(a), k = c01((p - ft) / .01);
      const pts = [[-1.05, -.34], [1.05, -.34], [1.05, .34], [-1.05, .34]].map(([u, v]) => (pj(x + ca * u - sa * v, .2, z + sa * u + ca * v) ? [PX, PY] : null));
      if (k <= 0 || pts.some((q) => !q)) return; fallP.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < 4; i++) fallP.lineTo(pts[i][0], pts[i][1]); fallP.closePath();
    });
    c.lineCap = 'round';
    c.strokeStyle = rgb([30, 20, 14], .14); c.lineWidth = Math.max(1, F / 380); c.stroke(shadowP);
    c.fillStyle = rgb(lerp([22, 15, 12], sandLit, .08), .95); c.fill(fallP);
    const tones = [lerp(sandLit.map((v) => v * .3), [52, 46, 38], .2), lerp(sandLit.map((v) => v * .14), [30, 16, 14], .3)];
    [1, 0].forEach((side) => [2, 1, 0].forEach((b) => { c.fillStyle = rgb(lerp(tones[side], haze0, Math.min(.75, fogOf([30, 170, 520][b])))); c.fill(body[side][b]); }));
    c.strokeStyle = rgb([28, 22, 18], .9); c.lineWidth = Math.max(.7, F / 1600); c.stroke(legP);
    c.strokeStyle = rgb([36, 28, 22], .75); c.lineWidth = .8; c.stroke(spearP);
    c.strokeStyle = rgb(lerp(sunC, [255, 240, 210], .3), .7 * c01(elev / 1.5) * c01(1.4 - elev / 16)); c.lineWidth = Math.max(.8, F / 1100); c.lineJoin = 'round'; c.stroke(rimP);
    // banners on their poles (the Quraysh banners go down in the rout)
    st.ban.forEach(([bx0, bz0, col, side, fallAt], j) => {
      const z = side ? mix(bz0, bz0 - 50, ease.io(seg(p, .41, .48))) : mix(bz0, 30, ease.io(seg(p, .42, .49)));
      const down = side ? ease.in(seg(p, fallAt, fallAt + .03)) : 0;
      if (!pj(bx0, 0, z)) return; const bx = PX, by0 = PY, s = F / PZ, fz = fogOf(PZ);
      const ang = down * 1.45 * (j % 2 ? 1 : -1), L = 4.6 * s, tx = bx + Math.sin(ang) * L, ty = by0 - Math.cos(ang) * L * (1 - Math.abs(sp) * .5);
      c.strokeStyle = rgb(lerp([42, 32, 24], haze0, fz)); c.lineWidth = Math.max(.8, .09 * s); c.beginPath(); c.moveTo(bx, by0); c.lineTo(tx, ty); c.stroke();
      const fl = Math.sin(t * 3 + j + p * 40) * .15, w = 1.5 * s * (1 - down * .4), h2 = .95 * s;
      c.fillStyle = rgb(lerp(col, haze0, fz * .8)); c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + w * .5, ty + h2 * fl, tx + w, ty + h2 * .1 + h2 * fl * 2); c.lineTo(tx + w * .96, ty + h2 * 1.05); c.quadraticCurveTo(tx + w * .5, ty + h2 * (1 + fl), tx + Math.sin(ang) * h2 * .3, ty + h2); c.closePath(); c.fill();
    });

    // ----- dust -----
    const bc = st.bc, BW = Math.max(8, Math.round(W / 6)), BH = Math.max(8, Math.round(H / 6));
    if (st.bloom.width !== BW || st.bloom.height !== BH) { st.bloom.width = BW; st.bloom.height = BH; }
    bc.setTransform(1, 0, 0, 1, 0, 0); bc.globalCompositeOperation = 'source-over'; bc.clearRect(0, 0, BW, BH); bc.setTransform(BW / W, 0, 0, BH / H, 0, 0);
    const dustAll = smooth(seg(p, .4, .47)) * (1 - smooth(seg(p, .6, .75)));
    if (dustAll > 0) {
      st.puffs.forEach(([x, z, born, R0, ph, k, veil]) => {
        const age = (p - born) / .1; if (age <= 0) return;
        const a = Math.min(1, age * 2.5) * dustAll * (1 - c01((age - 1) / 1.6)) * (veil ? .28 : 1);
        if (a <= .01) return;
        const y = veil ? 2 + age * 1.5 : 1.5 + age * (3 + k * 7), r = R0 * (veil ? .8 + age * .3 : .6 + age * .8);
        if (!pj(x + Math.sin(ph + t * .2) * 2 + age * 7, y, z + age * 3)) return; const rr = r * F / PZ;
        const al = a * .42 * (1 - fogOf(PZ) * .4) * c01((PZ - 6) / (rr / (F / PZ) * 2.5 + 10)), back = c01(1 - Math.hypot(PX - SX, PY - SY) / (W * .7));
        c.globalAlpha = al * (1 - .5 * back); c.drawImage(st.puffD, PX - rr * 1.5, PY - rr * .9, rr * 3, rr * 2);
        c.globalAlpha = Math.min(1, al * (.7 + 1.1 * back)); c.drawImage(st.puff, PX - rr * 1.2 + sunSide * rr * .35, PY - rr * 1.15, rr * 2.4, rr * 1.7);
      });
      st.trail.forEach(([sd, u, r0]) => {
        const ch = seg(p, .4, .47); if (ch <= 0 || ch >= 1) return;
        if (!pj(sd * mix(160, 90, ch) + sd * u * 30, 1.2, mix(130, 70, ch) + u * 20)) return; const rr = r0 * F / PZ;
        c.globalAlpha = .4 * Math.sin(Math.PI * ch) * dustAll; c.drawImage(st.puff, PX - rr * 1.6, PY - rr, rr * 3.2, rr * 2);
      });
      c.globalAlpha = 1;
      const M = st.motes, n = M.length / 4;
      c.globalCompositeOperation = 'lighter'; c.fillStyle = rgb(lerp(sunC, [255, 240, 210], .3), dustAll * .5);
      c.beginPath();
      for (let i = 0; i < n; i++) {
        if (!pj(M[i * 4] + Math.sin(t * .3 + M[i * 4 + 3] * 40) * 1.5 + (p - .4) * 30, M[i * 4 + 2] * (.5 + dustAll) + .5, M[i * 4 + 1])) continue;
        if (PX < 0 || PX > W || PY < 0 || PY > H) continue;
        const s = Math.max(.6, Math.min(2.2, F / PZ * .06)); c.rect(PX, PY, s, s);
      }
      c.fill();
      // blades catching the low sun along the front
      c.fillStyle = 'rgba(255,246,222,.9)';
      c.beginPath();
      st.flick.forEach(([x, z, y, k], i) => {
        const b = Math.sin(t * 7 + k * 60 + p * 900) * Math.sin(t * 3.1 + i + p * 400); if (b < .86 * (2 - fight)) return;
        if (!pj(x, y, z)) return; const s = Math.max(1, Math.min(3, F / PZ * .08)); c.rect(PX - s / 2, PY - s / 2, s, s);
        bc.fillStyle = 'rgba(255,236,200,.5)'; bc.fillRect(PX - 4, PY - 4, 8, 8);
      });
      c.fill(); c.globalCompositeOperation = 'source-over';
    }
    // ----- lights -----
    const gl = (x, y, z, r, col, a, min = 0, max = 1e4) => { if (!pj(x, y, z)) return false; const rr = Math.min(max, Math.max(min, r * F / Math.max(PZ, 6))); c.globalAlpha = Math.min(1, a); c.drawImage(tint(col), PX - rr, PY - rr, rr * 2, rr * 2); c.globalAlpha = 1; return true; };
    c.globalCompositeOperation = 'lighter';
    // the Prophet: the largest and stillest light, at the shelter
    if (gl(ARISH[0], ah + 1.3, ARISH[2], 14, '#ffe6bc', .42, 44, 260)) { gl(ARISH[0], ah + 1.3, ARISH[2], 3.6, '#fff4dc', .8, 14, 80); gl(ARISH[0], ah + 1.3, ARISH[2], .9, '#ffffff', 1, 4, 20); bc.fillStyle = 'rgba(255,240,210,.55)'; bc.beginPath(); bc.arc(PX, PY, 26, 0, TAU); bc.fill(); }
    // Ali: a calm, warm light, larger than all around it, with a pool on the sand
    const br = .94 + .06 * Math.sin(t * 1.3);
    if (pj(A[0], .05, A[2])) { const rr = Math.min(260, Math.max(12, 6 * F / Math.max(PZ, 6))); c.save(); c.translate(PX, PY); c.scale(1, .26); c.globalAlpha = .4; c.drawImage(tint('#ffc880'), -rr, -rr, rr * 2, rr * 2); c.restore(); c.globalAlpha = 1; }
    if (gl(A[0], A[1], A[2], 6, '#ffbe78', .36 * br, 16, 170)) { gl(A[0], A[1], A[2], 1.8, '#ffe0a8', .8 * br, 6, 48); gl(A[0], A[1], A[2], .45, '#fffaf0', 1, 2.6, 12); bc.fillStyle = 'rgba(255,210,150,.7)'; bc.beginPath(); bc.arc(PX, PY, 22, 0, TAU); bc.fill(); }
    // al-Walid's fall: one soft bloom, no rays
    const fl = Math.max(0, 1 - Math.abs(p - .283) / .01);
    if (fl > 0) { gl(MEET[0], 1.3, MEET[2] + 1.4, 5, '#fff0d2', .8 * fl, 20, 220); c.fillStyle = `rgba(255,226,180,${.05 * fl})`; c.fillRect(0, 0, W, H); }
    // the count: a faint gold glint on each that al-Mufid counts for Ali, along his way; the counter keeps step
    const cnt = seg(p, .705, .86);
    let shown = 0;
    if (p > .66) {
      const trace = smooth(seg(p, .68, .86));
      c.beginPath(); let first = true;
      for (let u = 0; u <= trace + 1e-6; u += .01) { const q = pathAt(u); if (pj(q[0], .1, q[1])) { first ? c.moveTo(PX, PY) : c.lineTo(PX, PY); first = false; } }
      c.strokeStyle = 'rgba(243,217,143,.07)'; c.lineWidth = Math.max(4, F / 160); c.stroke(); c.strokeStyle = 'rgba(243,217,143,.1)'; c.lineWidth = 1; c.stroke();
      const ali = st.fall.filter((f) => f.ali);
      ali.forEach((f, j) => {
        const at = j / ali.length; if (cnt <= at) return; shown++;
        const k = c01((cnt - at) * ali.length), tw = .8 + .2 * Math.sin(t * 1.7 + j * 2.1);
        if (gl(f.x, .5, f.z, 1.6, '#f3d98f', .42 * k * tw, 5, 26)) { c.fillStyle = `rgba(255,240,200,${.8 * k * tw})`; c.fillRect(PX - .75, PY - .75, 1.5, 1.5); bc.fillStyle = `rgba(243,217,143,${.25 * k})`; bc.beginPath(); bc.arc(PX, PY, 7, 0, TAU); bc.fill(); }
      });
    }
    setText(st.n, arNum(p < .7 ? 0 : Math.min(st.goal, shown)));
    c.globalAlpha = .7; c.drawImage(st.bloom, 0, 0, W, H); c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    // ----- grade: a gentle vignette -----
    const vg = c.createRadialGradient(W / 2, H * .55, Math.min(W, H) * .3, W / 2, H * .55, Math.hypot(W, H) * .62);
    vg.addColorStop(0, 'rgba(8,8,10,0)'); vg.addColorStop(1, 'rgba(8,7,8,.58)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  },
};
})();
