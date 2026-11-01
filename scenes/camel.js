(() => {
// camel: the battle of the Camel on the plain outside Basra, Jumada I 36 AH. World in metres: x east, y up, z north.
// Ali's army stands west (x < 0), the army of the Camel east of it, Basra's wall on the eastern horizon behind palm
// groves. The camel with the red howdah stands at CAM0 inside a dense knot of defenders, facing west.
// Beats: dawn over Basra, the two armies; they close and meet; arrows rain and lodge in the howdah until it bristles;
// the camel is hamstrung, kneels and falls on its side; the fighting stops; in the evening a column of forty cloaked
// riders escorts the howdah west, toward Medina, into the low sun. Ali stands behind his army's centre, a veiled figure
// with a gold disc behind the head and Dhul-Fiqar at his side (scenes/holy.js); no face is ever drawn.
const CAM0 = [150, 0, 0], HD = [-1, 0, 0], LW = [0, 0, -1]; // heading west; local +w is south
const ALI = [-300, 1.3, 18], NEAR = .5;
const v3 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};
const hash = (i, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const mixc = (a, b, k) => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];
const rgb = (a, k = 1) => `rgba(${Math.min(255, a[0]) | 0},${Math.min(255, a[1]) | 0},${Math.min(255, a[2]) | 0},${k})`;
const lerpAny = (a, b, k) => (Array.isArray(a) ? a.map((x, i) => mix(x, b[i], k)) : mix(a, b, k));
const keyv = (K, p) => { let i = 1; while (i < K.length - 1 && p > K[i][0]) i++; const A = K[i - 1], B = K[i], k = smooth(c01((p - A[0]) / (B[0] - A[0]))); return A.slice(1).map((v, j) => lerpAny(v, B[j + 1], k)); };
const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
const sprite = (stops, n = 64) => { const cv = mk(n, n), g = cv.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); stops.forEach(([o, s]) => gr.addColorStop(o, s)); g.fillStyle = gr; g.fillRect(0, 0, n, n); return cv; };
const cr1 = (a, b, c, d, u) => .5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
function mono(xs, ys) { // monotone cubic through (xs, ys): smooth, never overshoots between far-apart keys
  const n = xs.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) { if (!d[i]) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], q = a * a + b * b; if (q > 9) { const k = 3 / Math.sqrt(q); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; } }
  return (x) => {
    if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], u = (x - xs[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1];
  };
}

// ---------- camera keys: [p, eye, look, zoom] ----------
const CAM = [
  [-.06, [-1080, 24, -40], [1750, 26, 0], 2.1],
  [0, [-1060, 23.5, -40], [1750, 26, 0], 2.1],
  [.12, [-800, 26, -50], [900, 10, 0], 1.5],
  [.24, [-300, 26, -70], [300, 4, 0], 1],
  [.34, [-60, 18, -70], [150, 4, 0], 1.05],
  [.44, [104, 9, -48], [150, 2.4, 0], 1.2],
  [.52, [141, 5.2, -24], [150, 2.3, 0], 1.45],
  [.59, [143.5, 6, -23.5], [150, 1.8, 0], 1.42],
  [.64, [141.5, 8.5, -23], [150.5, 1, 0], 1.42],
  [.7, [137, 11, -29], [151, .6, 0], 1.3],
  [.76, [110, 48, -150], [160, 0, 20], 1],
  [.82, [300, 26, 70], [120, 2, -10], 1],
  [.88, [196, 11, 32], [40, 1, -40], 1.05],
  [.94, [-196, 11, -84], [-380, 1, -160], 1.05],
  [1, [-456, 12, -164], [-660, 1, -246], 1.05],
  [1.06, [-470, 12, -169], [-680, 1, -252], 1.05],
];
const CS = (() => { const xs = CAM.map((k) => k[0]); return [0, 1, 2].map((j) => mono(xs, CAM.map((k) => k[1][j]))).concat([0, 1, 2].map((j) => mono(xs, CAM.map((k) => k[2][j]))), [mono(xs, CAM.map((k) => k[3]))]); })();
const camAt = (p) => ({ eye: [CS[0](p), CS[1](p), CS[2](p)], look: [CS[3](p), CS[4](p), CS[5](p)], zoom: CS[6](p) });
// ---------- light: p, sky top, sky horizon, haze, far ground, near ground, sun strength ----------
const LK = [
  [-.06, [34, 44, 74], [236, 168, 108], [192, 150, 112], [146, 112, 82], [48, 38, 30], 1],
  [.12, [44, 60, 92], [236, 182, 128], [198, 164, 126], [152, 122, 92], [54, 43, 34], 1],
  [.32, [52, 72, 104], [214, 186, 150], [192, 170, 142], [146, 122, 94], [56, 46, 37], .95],
  [.5, [60, 76, 102], [206, 180, 150], [180, 160, 136], [140, 118, 92], [52, 43, 34], .9],
  [.7, [60, 72, 96], [212, 176, 136], [180, 154, 124], [138, 112, 86], [52, 43, 34], .9],
  [.88, [40, 44, 70], [236, 152, 94], [192, 140, 104], [132, 98, 72], [42, 33, 27], 1],
  [1.06, [30, 32, 58], [230, 130, 80], [176, 120, 90], [116, 84, 60], [36, 28, 23], 1],
];
// the sun: azimuth (0 = east, -pi/2 = south) and elevation, from dawn over Basra to evening over the road west
const SK = [[-.06, .02, .008], [0, .02, .012], [.12, -.05, .06], [.35, -.35, .24], [.55, -.7, .3], [.75, -1.6, .28], [.9, -2.45, .1], [1.06, -2.75, .045]];
const FOG = [[-.06, 6000], [.3, 6500], [.5, 5000], [.7, 6000], [1.06, 7000]];
// the road west: the column of forty rides it from beside the fallen camel
const PATH = [[260, 0, 30], [175, 0, 8], [70, 0, -22], [-150, 0, -88], [-500, 0, -190], [-1000, 0, -340], [-1700, 0, -570], [-2600, 0, -860]];
const PL = (() => { const L = [0]; for (let i = 1; i < PATH.length; i++) L.push(L[i - 1] + Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][2] - PATH[i - 1][2])); return L; })();
const S0 = PL[1]; // the column starts here
function pathAt(s) { // [x, z, dir x, dir z] at arc length s (beyond the ends: straight on)
  s = Math.max(-200, s); let i = 1; while (i < PATH.length - 1 && s > PL[i]) i++;
  const a = PATH[i - 1], b = PATH[i], L = PL[i] - PL[i - 1], k = (s - PL[i - 1]) / L, dx = (b[0] - a[0]) / L, dz = (b[2] - a[2]) / L;
  return [a[0] + (b[0] - a[0]) * k, a[2] + (b[2] - a[2]) * k, dx, dz];
}
const laneZ = (x) => { for (let i = 1; i < PATH.length; i++) { const a = PATH[i - 1], b = PATH[i]; if (x <= a[0] && x >= b[0]) return mix(a[2], b[2], (a[0] - x) / (a[0] - b[0])); } return x > PATH[0][0] ? PATH[0][2] : PATH[PATH.length - 1][2]; };

// ---------- the camel: a loft along a spine (u forward, v up), radii (half-height, half-width) ----------
const SPK = [
  [-1.4, 1.6, .08, .08], [-1.3, 1.66, .3, .28], [-1.12, 1.66, .4, .38], [-.9, 1.68, .45, .43], [-.62, 1.74, .52, .46], [-.34, 1.84, .6, .48],
  [-.06, 1.9, .64, .48], [.22, 1.86, .6, .46], [.5, 1.76, .54, .43], [.74, 1.64, .48, .38], [.96, 1.56, .4, .3], [1.12, 1.48, .27, .2],
  [1.3, 1.4, .19, .16], [1.46, 1.46, .17, .15], [1.6, 1.7, .16, .14], [1.68, 2.02, .15, .13], [1.74, 2.34, .14, .12], [1.82, 2.58, .14, .12],
  [1.98, 2.7, .15, .12], [2.16, 2.7, .13, .11], [2.34, 2.64, .1, .09], [2.48, 2.58, .08, .08],
];
const NSTA = 44, ELL = 12;
const STA = (() => { // resampled stations: u, v, hv, hw, tangent (tu, tv), neck flag
  const out = [], n = SPK.length - 1;
  for (let k = 0; k <= NSTA; k++) {
    const f = k / NSTA * n, i = Math.min(n - 1, Math.floor(f)), g = f - i;
    const a = SPK[Math.max(0, i - 1)], b = SPK[i], c = SPK[i + 1], d = SPK[Math.min(n, i + 2)];
    const q = [0, 1, 2, 3].map((j) => cr1(a[j], b[j], c[j], d[j], g));
    out.push(q);
  }
  return out.map((q, k) => { const a = out[Math.max(0, k - 1)], b = out[Math.min(out.length - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [q[0], q[1], Math.max(.05, q[2]), Math.max(.05, q[3]), (b[0] - a[0]) / l, (b[1] - a[1]) / l, q[0] > 1.1 ? 1 : 0]; });
})();
const LEGS = [[.84, 1.32, .24, 1], [.84, 1.32, -.24, 1], [-.96, 1.42, .26, 0], [-.96, 1.42, -.26, 0]]; // hip u, v, w, front?
const MUZ = [2.56, 2.56];
// the howdah: walls to v = 3.15, an arched roof; a red cloth skirt over the flanks
const HU = .6, HW = .66, HB = 2.32, HT = 2.98;
const HFACE = (() => {
  const f = [];
  [1, -1].forEach((sd) => f.push({ n: [0, 0, sd], pts: [[-HU, HB, sd * HW], [HU, HB, sd * HW], [HU, HT, sd * HW], [-HU, HT, sd * HW]], k: 'side' }));
  for (let i = 0; i < 6; i++) { const a0 = i / 6 * Math.PI, a1 = (i + 1) / 6 * Math.PI, am = (a0 + a1) / 2; f.push({ n: [0, Math.sin(am), Math.cos(am)], pts: [[-HU, HT + HW * Math.sin(a0), HW * Math.cos(a0)], [HU, HT + HW * Math.sin(a0), HW * Math.cos(a0)], [HU, HT + HW * Math.sin(a1), HW * Math.cos(a1)], [-HU, HT + HW * Math.sin(a1), HW * Math.cos(a1)]], k: 'roof' }); }
  [1, -1].forEach((sd) => { const pts = [[sd * HU, HB, -HW], [sd * HU, HB, HW]]; for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI; pts.push([sd * HU, HT + HW * Math.sin(a), HW * Math.cos(a)]); } f.push({ n: [sd, 0, 0], pts, k: 'end' }); });
  return f;
})();
function rig(pose) { // local (u, v, w) -> world, with the hamstrung drop, the kneel and the roll onto the side
  const { base, hd, drop = 0, dropF = 0, roll = 0, bob = 0 } = pose;
  const lw = [-hd[2], 0, hd[0]], cr = Math.cos(roll), sr = Math.sin(roll), PW = .55;
  const dv = (u) => mix(-drop, -dropF, c01((u + .96) / 1.8)) + bob;
  const T = (u, v, w, noDrop) => { v += noDrop ? 0 : dv(u); const dw = w - PW; const w2 = PW + dw * cr + v * sr, v2 = -dw * sr + v * cr; return [base[0] + u * hd[0] + w2 * lw[0], v2, base[2] + u * hd[2] + w2 * lw[2]]; };
  const N = (n) => { const w2 = n[2] * cr + n[1] * sr, v2 = -n[2] * sr + n[1] * cr; return [n[0] * hd[0] + w2 * lw[0], v2, n[0] * hd[2] + w2 * lw[2]]; };
  return { T, N, dv, lw };
}
function ik(hx, hy, fx, fy, L1, L2, bend) { // two-bone: hip (hx, hy), foot target -> knee
  let dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy); const dm = Math.min(L1 + L2 - 1e-3, Math.max(Math.abs(L1 - L2) + 1e-3, d));
  if (d < 1e-6) { dx = 0; dy = -1; d = 1; }
  const ux = dx / d, uy = dy / d, a = (L1 * L1 - L2 * L2 + dm * dm) / (2 * dm), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const kx = hx + ux * a - uy * h * bend, ky = hy + uy * a + ux * h * bend;
  const ex = hx + ux * dm, ey = hy + uy * dm;
  return [kx, ky, ex, ey];
}

S.camel = {
  init(el, st) {
    st.cv = el.querySelector('canvas');
    st.c = st.cv.getContext('2d');
    st.bloom = mk(8, 8); st.bc = st.bloom.getContext('2d');
    st.puffW = sprite([[0, 'rgba(214,190,156,.8)'], [.45, 'rgba(214,190,156,.32)'], [1, 'rgba(214,190,156,0)']]);
    st.puffD = sprite([[0, 'rgba(118,96,72,.85)'], [.5, 'rgba(118,96,72,.36)'], [1, 'rgba(118,96,72,0)']]);
    st.glowS = sprite([[0, 'rgba(255,214,150,1)'], [.2, 'rgba(255,170,90,.5)'], [1, 'rgba(255,130,50,0)']]);
    const R = rng(36), F32 = (n) => new Float32Array(n);
    const gs = () => (R() + R() + R() - 1.5) / 1.5;
    // ---- the armies: 0 Ali on foot, 1 Ali horse, 2 Camel on foot, 3 Camel horse, 4 the knot, 5 the hamstringers ----
    const NA = 3000, NAH = 260, NB = 3300, NBH = 300, NK = 560, NX = 6, N = NA + NAH + NB + NBH + NK + NX;
    const G = st.G = { n: N, ty: new Uint8Array(N), dep: F32(N), z: F32(N), ph: F32(N), d: F32(N), r: F32(N), a: F32(N), dir: new Int8Array(N), x: F32(N), zz: F32(N) };
    let i = 0;
    const put = (ty, n, fn) => { for (let k = 0; k < n; k++, i++) { G.ty[i] = ty; G.ph[i] = R() * TAU; G.d[i] = R(); G.dir[i] = R() < .5 ? -1 : 1; fn(i, k); } };
    put(0, NA, (j) => { G.dep[j] = R() < .12 ? 560 + R() * 340 : 6 + R() ** 1.5 * 520 + R() * 3; G.z[j] = gs() * 330 + (R() - .5) * 120; });
    put(1, NAH, (j) => { G.dep[j] = 30 + R() * 160; G.z[j] = (R() < .5 ? -1 : 1) * (360 + R() * 170); G.dir[j] = 1; });
    put(2, NB, (j) => { G.dep[j] = 6 + R() ** 1.4 * 560 + R() * 3; G.z[j] = gs() * 350 + (R() - .5) * 120; });
    put(3, NBH, (j) => { G.dep[j] = 30 + R() * 170; G.z[j] = (R() < .5 ? -1 : 1) * (380 + R() * 170); G.dir[j] = -1; });
    put(4, NK, (j, k) => {
      if (k < 10) { G.r[j] = -1; G.a[j] = k; return; } // the hands on the halter
      let r, a; do { r = 2.4 + R() ** .85 * 27; a = R() * TAU; } while ((Math.abs(Math.sin(a) * r) < 1.3 && Math.cos(a) * r < 1.8 && Math.cos(a) * r > -3) || (Math.sin(a) < 0 && r > 3.5 && Math.abs(Math.cos(a) * r + 4) < .42 * -Math.sin(a) * r + 2));
      G.r[j] = r; G.a[j] = a;
    });
    put(5, NX, (j, k) => { G.r[j] = k; });
    st.ia = [0, NA + NAH, NA + NAH + NB + NBH, N - NX]; // first index of: Ali, Camel army, the knot, the hamstringers
    // banners: green and gold over Ali's army, red and black over the other
    st.ban = [];
    for (let k = 0; k < 64; k++) { const ali = k < 30; st.ban.push({ i: ali ? Math.floor(R() * NA) : NA + NAH + Math.floor(R() * NB), c: ali ? (k % 3 ? [46, 117, 88] : [201, 165, 78]) : (k % 2 ? [128, 32, 28] : [30, 26, 26]), h: 6 + R() * 3, ph: R() * TAU }); }
    // ---- arrows ----
    // lodged in the howdah: a point on a face, a tail direction (local), a length, the moment it strikes
    const NS = 330; st.hed = [];
    for (let k = 0; k < NS; k++) {
      const f = R() < .5 ? (R() < .5 ? 0 : 1) : R() < .72 ? 2 + Math.floor(R() * 6) : 8 + (R() < .7 ? 0 : 1);
      const F = HFACE[f]; let b;
      if (F.k === 'end') { const a = R() * Math.PI, rr = Math.sqrt(R()); b = R() < .55 ? [F.pts[0][0], HB + R() * (HT - HB), (R() - .5) * 2 * HW] : [F.pts[0][0], HT + Math.sin(a) * HW * rr, Math.cos(a) * HW * rr]; }
      else { const u = R(), v = R(); const [p0, p1, , p3] = F.pts; b = [mix(p0[0], p1[0], u), mix(p0[1], p3[1], v), mix(p0[2], p3[2], v)]; }
      const n = F.n, td = v3.norm([n[0] * .55 + .55 + (R() - .5) * .3, n[1] * .55 + .3 + R() * .35, n[2] * .55 + (R() - .5) * .45]);
      st.hed.push({ b, td, len: .34 + R() * .3, f, at: .335 + .22 * (k / NS) ** .75 + R() * .006, sx: -40 - R() * 180, sz: (R() - .5) * 220 });
    }
    // the rain: volleys from both lines
    { const R0 = rig({ base: CAM0, hd: HD }); st.tgt = st.hed.map((B) => R0.T(...B.b)); }
    st.rain = [];
    for (let k = 0; k < 1500; k++) {
      const ali = R() < .62, v = Math.floor(R() * 14), at = .3 + v * .019 + R() * .012;
      const sx = ali ? -10 - R() * 200 : 25 + R() * 220, sz = (R() - .5) * 700;
      let dx, dz; if (ali) { const near = R() < .45; dx = near ? CAM0[0] + gs() * 40 : 20 + R() * 260; dz = near ? gs() * 40 : (R() - .5) * 600; } else { dx = -30 - R() * 230; dz = (R() - .5) * 600; }
      st.rain.push({ s: [sx, 1.7, sz], e: [dx, 0, dz], at, ground: Math.hypot(dx - CAM0[0], dz) < 45 && R() < .3 });
    }
    // the plain, the groves, Basra
    st.marks = []; for (let k = 0; k < 2400; k++) st.marks.push([-3200 + R() * 6200, -1800 + R() * 3600, .5 + R() * 1.8, R()]);
    st.palms = [];
    const groves = [[1500, -900, 160], [1450, 800, 180], [1300, -1500, 220], [1900, 0, 120], [2100, 600, 300], [2200, -600, 300], [2500, 100, 300], [900, 1300, 260], [300, -1400, 200], [-900, 1200, 300], [-1300, -900, 240], [-2200, -300, 300], [-2600, -1200, 340], [-3000, 600, 300], [-1900, -1700, 260], [-700, -1700, 220]];
    for (let k = 0; k < 1500; k++) { const g = groves[k % groves.length], a = R() * TAU, r = Math.sqrt(R()) * g[2]; const x = g[0] + Math.cos(a) * r * 1.3, z = g[1] + Math.sin(a) * r; if (Math.abs(z - laneZ(x)) < 22 && x < 200) continue; st.palms.push([x, z, 10 + R() * 9, (R() - .5) * 1.6, R()]); }
    st.wall = []; const WX = 1750;
    for (let z = -1500; z < 1500; z += 110) { st.wall.push([WX, WX + 7, 0, 15, z, z + 110]); const g = Math.abs(z + 55) < 60; st.wall.push([WX - 5, WX + 11, 0, g ? 24 : 21, z - 7, z + 7]); }
    st.wall.push([WX - 6, WX + 13, 0, 21, -26, -10], [WX - 6, WX + 13, 0, 21, 10, 26]);
    for (let k = 0; k < 90; k++) { const z = gs() * 800, x = WX + 40 + R() * 600, w = 9 + R() * 12, h = 9 + R() * 12; st.wall.push([x, x + w, 0, h, z, z + w * (.6 + R())]); }
    st.clouds = []; for (let k = 0; k < 26; k++) st.clouds.push([-3.2 + R() * 6.4, .02 + R() ** 1.5 * .32, .12 + R() * .32, .008 + R() * .02, R()]);
    st.dust = []; for (let k = 0; k < 120; k++) st.dust.push([R(), R(), R(), R(), R()]);
    st.grit = []; for (let k = 0; k < 900; k++) st.grit.push([R(), R(), R(), R()]);
    st.gx = new Float32Array(N * 5);
  },

  frame(p, t, el, st) {
    fit(st.cv);
    const { c, cv, G } = st;
    const dpr = cv.width / Math.max(1, cv.clientWidth), W = cv.clientWidth, H = cv.clientHeight, phone = W < H * .85;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    const [skyT, skyH, haze, gFar, gNear, sunK] = keyv(LK, p);
    const [saz, sel] = keyv(SK, p), SUN = [Math.cos(sel) * Math.cos(saz), Math.sin(sel), Math.cos(sel) * Math.sin(saz)];
    const fogLen = keyv(FOG, p)[0], fogK = (d) => 1 - Math.exp(-d / fogLen);
    const close = smooth(seg(p, .36, .46)) * (1 - smooth(seg(p, .68, .76)));
    // ----- camera -----
    let { eye, look, zoom } = camAt(p);
    if (phone) { const back = mix(1.3, 1.1, close); eye = v3.add(look, v3.mul(v3.sub(eye, look), back)); }
    const fw = v3.norm(v3.sub(look, eye)), rt = v3.norm(v3.cross([0, 1, 0], fw)), up = v3.cross(fw, rt);
    const F = (phone ? W * mix(1.1, 1.45, close) : Math.min(H * 1.25, W * .8)) * zoom, cx = W / 2, cy = H * .5;
    const e0 = eye[0], e1 = eye[1], e2 = eye[2], f0 = fw[0], f1 = fw[1], f2 = fw[2], r0 = rt[0], r2 = rt[2], u0 = up[0], u1 = up[1], u2 = up[2];
    let QX = 0, QY = 0, QZ = 0;
    const pj = (x, y, z) => { const dx = x - e0, dy = y - e1, dz = z - e2, zc = dx * f0 + dy * f1 + dz * f2; if (zc < NEAR) return false; QX = cx + F * (dx * r0 + dz * r2) / zc; QY = cy - F * (dx * u0 + dy * u1 + dz * u2) / zc; QZ = zc; return true; };
    const P = (q) => (pj(q[0], q[1], q[2]) ? [QX, QY, QZ] : null);
    const hd = v3.norm([f0, 0, f2]), hy = cy - F * v3.dot(hd, up) / v3.dot(hd, fw);
    const hazeC = (col, d, k = 1) => mixc(col, haze, Math.min(.85, fogK(d) * k));
    const amb = mix(.75, 1, 1 - sunK * .3);
    let daz = saz - Math.atan2(hd[2], hd[0]); daz = Math.atan2(Math.sin(daz), Math.cos(daz));
    const sunX = Math.abs(daz) < 1.5 ? cx - F * Math.tan(daz) : null, sunVis = sunX === null ? 0 : Math.cos(daz) ** 2;
    const sunP = pj(e0 + SUN[0] * 1e5, e1 + SUN[1] * 1e5, e2 + SUN[2] * 1e5) ? [QX, QY] : null;
    const low = 1 - smooth(seg(sel, .12, .45)); // a low sun: warm, raking, long shadows
    // ----- sky -----
    const sg = c.createLinearGradient(0, Math.min(0, hy - H * .62), 0, hy);
    sg.addColorStop(0, rgb(skyT)); sg.addColorStop(.55, rgb(mixc(skyT, skyH, .45))); sg.addColorStop(1, rgb(skyH));
    c.fillStyle = sg; c.fillRect(0, 0, W, Math.max(0, hy + 2));
    if (sunX !== null) {
      const sy = sunP ? sunP[1] : hy - F * .1, r = W * .75, g = c.createRadialGradient(0, 0, 0, 0, 0, r), ga = sunK * sunVis * (.35 + .65 * low);
      g.addColorStop(0, `rgba(255,222,168,${.9 * ga})`); g.addColorStop(.09, `rgba(250,186,120,${.5 * ga})`); g.addColorStop(.42, `rgba(214,140,96,${.15 * ga})`); g.addColorStop(1, 'rgba(214,140,96,0)');
      c.save(); c.beginPath(); c.rect(0, 0, W, hy + 2); c.clip(); c.translate(sunX, sy); c.scale(1, mix(1, .42, low)); c.fillStyle = g; c.fillRect(-r, -r, r * 2, r * 2); c.restore();
    }
    if (sunP && sunP[1] < hy + 2) {
      const g = c.createRadialGradient(sunP[0], sunP[1], 0, sunP[0], sunP[1], F * .05); g.addColorStop(0, `rgba(255,248,226,${.95 * sunK})`); g.addColorStop(.18, `rgba(255,236,200,${.8 * sunK})`); g.addColorStop(.3, `rgba(255,220,170,${.25 * sunK})`); g.addColorStop(1, 'rgba(255,220,170,0)');
      c.fillStyle = g; c.fillRect(sunP[0] - F * .05, sunP[1] - F * .05, F * .1, F * .1);
    }
    st.clouds.forEach(([az0, el2, w, h, k]) => {
      const az = az0 + t * .0012 * (1 + k), ce = Math.cos(el2);
      if (!pj(e0 + ce * Math.cos(az) * 1e5, e1 + Math.sin(el2) * 1e5, e2 + ce * Math.sin(az) * 1e5) || QY > hy + 4) return;
      const near = sunP ? Math.exp(-Math.hypot(QX - sunP[0], QY - sunP[1]) / (W * .35)) : 0;
      const col = mixc(mixc(skyT, skyH, .35 + .45 * k), [255, 210, 160], .6 * near * sunK * low);
      c.save(); c.translate(QX, QY); c.scale(w * F, h * F);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, rgb(col, .18 + .26 * k)); g.addColorStop(1, rgb(col, 0));
      c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore();
    });
    // ----- ground -----
    const gg = c.createLinearGradient(0, hy, 0, H);
    gg.addColorStop(0, rgb(mixc(gFar, haze, .66))); gg.addColorStop(.1, rgb(mixc(gFar, haze, .22))); gg.addColorStop(.45, rgb(mixc(gFar, gNear, .6))); gg.addColorStop(1, rgb(gNear));
    c.fillStyle = gg; c.fillRect(0, hy, W, H - hy);
    if (sunX !== null) {
      const r = W * .6, g = c.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, `rgba(255,206,146,${.32 * sunK * sunVis * low})`); g.addColorStop(1, 'rgba(255,206,146,0)');
      c.save(); c.translate(sunX, hy); c.scale(1, .1); c.fillStyle = g; c.fillRect(-r, -r, r * 2, r * 2); c.restore();
    }
    [0, 1].forEach((pass) => {
      c.strokeStyle = pass ? rgb(mixc(gNear, [255, 226, 186], .18), .28) : rgb(mixc(gNear, [6, 5, 4], .45), .45);
      c.lineWidth = 1; c.beginPath();
      st.marks.forEach(([x, z, l, q]) => { if ((q > .62) !== !!pass || !pj(x, 0, z) || QZ > 2800 || QY > H + 2 || QY < hy) return; const L = l * F / QZ; if (L < .4 || QX < -L || QX > W + L) return; c.moveTo(QX - L, QY); c.lineTo(QX + L, QY); });
      c.stroke();
    });
    // ----- Basra: the wall and its towers on the eastern horizon -----
    {
      const wb = st.wall.map((b) => [Math.hypot((b[0] + b[1]) / 2 - e0, (b[4] + b[5]) / 2 - e2), b]).sort((a, b) => b[0] - a[0]);
      wb.forEach(([d, [x0, x1, , h, z0, z1]]) => {
        const faces = [[[-1, 0, 0], [[x0, 0, z1], [x0, 0, z0], [x0, h, z0], [x0, h, z1]]], [[0, 0, -1], [[x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0]]], [[0, 0, 1], [[x1, 0, z1], [x0, 0, z1], [x0, h, z1], [x1, h, z1]]], [[1, 0, 0], [[x1, 0, z0], [x1, 0, z1], [x1, h, z1], [x1, h, z0]]]];
        faces.forEach(([n, pts]) => {
          if ((pts[0][0] - e0) * n[0] + (pts[0][2] - e2) * n[2] >= 0) return;
          const q = pts.map(P); if (q.some((v) => !v)) return;
          const lit = Math.max(0, v3.dot(n, SUN)) * sunK;
          c.fillStyle = rgb(hazeC(mixc([62, 48, 38], [236, 176, 120], lit * .5), d, .72));
          c.beginPath(); q.forEach((v, k) => (k ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1]))); c.closePath(); c.fill();
        });
      });
    }
    // ----- positions of every soldier this frame -----
    const adv = ease.io(seg(p, .17, .3)), press = smooth(seg(p, .3, .56)), stop = smooth(seg(p, .64, .74)), lane = smooth(seg(p, .74, .84));
    const fight = smooth(seg(p, .25, .3)) * (1 - smooth(seg(p, .62, .68)));
    const bulge = (z) => 92 * Math.exp(-((z / 115) ** 2)) * press;
    const GP = st.gx, [iA, iB, iK, iX] = st.ia;
    const knotOut = 4 + 6 * stop;
    for (let i = 0; i < G.n; i++) {
      const ty = G.ty[i], j = i * 5; let x, z = G.z[i];
      if (ty <= 1) {
        const dep = G.dep[i]; x = mix(-120 - dep, -6 - dep * .85, adv) + bulge(z) * (1 - dep / 700) - 20 * stop;
        if (fight > 0 && dep < 40) x += Math.sin(p * 260 + G.ph[i]) * .9 * fight;
        if (lane > 0) { const lz = laneZ(x), dz = z - lz; if (Math.abs(dz) < 75) z = lz + Math.sign(dz || 1) * mix(Math.abs(dz), 75 + Math.abs(dz) * .3, lane); }
      } else if (ty <= 3) {
        const dep = G.dep[i]; x = mix(110 + dep, 6 + dep * .85, adv) + bulge(z) * (1 - dep / 900) + 22 * stop;
        if (fight > 0 && dep < 40) x -= Math.sin(p * 250 + G.ph[i]) * .9 * fight;
        const dx = x - CAM0[0], r = Math.hypot(dx, z); if (r < 36) { const k = 36 / Math.max(.1, r); x = CAM0[0] + dx * k; z *= k; }
        if (lane > 0 && x < 300) { const lz = laneZ(x), dz = z - lz; if (Math.abs(dz) < 60) z = lz + Math.sign(dz || 1) * mix(Math.abs(dz), 60 + Math.abs(dz) * .3, lane); }
      } else if (ty === 4) {
        if (G.r[i] < 0) { const k = G.a[i], hold = 1 - smooth(seg(p, .6, .66)); x = CAM0[0] - 3.3 - (k >> 1) * .75 - (1 - hold) * (2 + k * .4); z = (k & 1 ? .5 : -.5) + (1 - hold) * (k & 1 ? 2 : -2); }
        else { const r = G.r[i] + (G.r[i] > 6 ? knotOut * stop + Math.sin(p * 220 + G.ph[i]) * .35 * fight : 0); x = CAM0[0] + Math.cos(G.a[i]) * r; z = Math.sin(G.a[i]) * r; }
        if (lane > 0 && x < 300) { const lz = laneZ(x), dz = z - lz; if (Math.abs(dz) < 12) z = lz + Math.sign(dz || 1) * mix(Math.abs(dz), 12, lane); }
      } else { // they go in to the hind legs, then step back
        const k = G.r[i], go = smooth(seg(p, .555 + k * .004, .59)) * (1 - smooth(seg(p, .64, .7))), sd = k & 1 ? 1 : -1;
        x = mix(CAM0[0] - 12 - k * 2, CAM0[0] + 1.6 + (k >> 1) * .5, go); z = mix(sd * (4 + k), sd * 1.5, go);
        if (p < .54) { GP[j + 4] = 0; continue; }
      }
      G.x[i] = x; G.zz[i] = z;
      GP[j + 4] = 0;
      if (!pj(x, 0, z)) continue;
      GP[j] = QX; GP[j + 1] = QY; GP[j + 2] = QZ; GP[j + 3] = F / QZ; GP[j + 4] = 1;
    }
    // ----- depth bands, far to near -----
    const BANDS = [1e9, 3000, 1500, 800, 400, 200, 100, 50, 25, 0];
    const bandOf = (z) => { let b = 0; while (z < BANDS[b + 1]) b++; return b; };
    const NB = BANDS.length - 1, bandMid = (b) => (b === 0 ? 4500 : (BANDS[b] + BANDS[b + 1]) / 2);
    const LB = st.lb || (st.lb = Array.from({ length: NB }, () => ({ g: [], p: [] })));
    LB.forEach((L) => { L.g.length = 0; L.p.length = 0; });
    for (let i = 0; i < G.n; i++) { const j = i * 5; if (!GP[j + 4] || GP[j + 2] < 7) continue; const s = GP[j + 3]; if (GP[j] < -6 * s - 4 || GP[j] > W + 6 * s + 4 || GP[j + 1] < hy - 2 || GP[j + 1] > H + 4 * s) continue; LB[bandOf(GP[j + 2])].g.push(i); }
    st.palms.forEach((pm, i) => { const d = Math.hypot(pm[0] - e0, pm[1] - e2); if (d < 9000) LB[bandOf(d)].p.push(i); });
    const bc = st.bc, BW = Math.max(8, Math.round(W / 4)), BH = Math.max(8, Math.round(H / 4));
    if (st.bloom.width !== BW || st.bloom.height !== BH) { st.bloom.width = BW; st.bloom.height = BH; }
    bc.setTransform(1, 0, 0, 1, 0, 0); bc.clearRect(0, 0, BW, BH); bc.setTransform(BW / W, 0, 0, BH / H, 0, 0);
    const windS = (() => { const a = P(CAM0), b = P([CAM0[0] + 20, 0, CAM0[2]]); if (!a || !b) return [1, 0]; const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; })();
    const palm = (x, z, h, lean, v) => {
      if (!pj(x, 0, z)) return; const bx = QX, by = QY, s = F / QZ; if (bx < -14 * s || bx > W + 14 * s || by < hy - 1) return;
      const tx = bx + lean * s, ty = by - h * s;
      if (s < .7) { c.moveTo(bx, by); c.lineTo(tx, ty); for (let f = 0; f < 6; f++) { const a = f / 6 * TAU + v * 6, l = 3 * s; c.moveTo(tx, ty); c.lineTo(tx + Math.cos(a) * l, ty + Math.abs(Math.sin(a)) * l * .5 + l * .2); } return; }
      c.moveTo(bx, by); c.quadraticCurveTo((bx + tx) / 2 + .5 * s * Math.sin(v * 7), (by + ty) / 2, tx, ty);
      for (let f = 0; f < 11; f++) { const a = f / 11 * TAU + v * 6 + Math.sin(t * .7 + v * 20) * .04, l = (3 + hash(f, v) * 1.3) * s, dx = Math.cos(a) * l, dy = Math.sin(a) * l * .4 + l * .4 * Math.abs(Math.cos(a)); c.moveTo(tx, ty); c.quadraticCurveTo(tx + dx * .55, ty - l * .32 + dy * .1, tx + dx, ty + dy); }
    };
    const fig = (bx, by, s, h, wv, spear) => { // a cloaked standing figure: no face, only its outline
      if (s * h < 2.4) { const w = Math.max(.8, .5 * s), hh = Math.max(1.1, h * s); c.rect(bx - w / 2, by - hh, w, hh); return; }
      if (s * h < 13) { c.rect(bx - .28 * s * wv, by - 1.46 * s, .56 * s * wv, 1.46 * s); c.rect(bx - .12 * s, by - h * s, .24 * s, .26 * s); if (spear && s > 2) c.rect(bx + .3 * s * wv * spear, by - 2.9 * s, Math.max(.6, .06 * s), 2.9 * s); return; }
      const k = h / 1.75, w = s * wv;
      c.moveTo(bx - .31 * w, by); c.lineTo(bx - .24 * w, by - .9 * s * k); c.lineTo(bx - .26 * w, by - 1.34 * s * k); c.quadraticCurveTo(bx - .25 * w, by - 1.47 * s * k, bx - .1 * s, by - 1.47 * s * k); c.lineTo(bx - .05 * s, by - 1.5 * s * k);
      c.lineTo(bx + .05 * s, by - 1.5 * s * k); c.lineTo(bx + .1 * s, by - 1.47 * s * k); c.quadraticCurveTo(bx + .25 * w, by - 1.47 * s * k, bx + .26 * w, by - 1.34 * s * k); c.lineTo(bx + .24 * w, by - .9 * s * k); c.lineTo(bx + .31 * w, by); c.closePath();
      c.moveTo(bx + .13 * s, by - 1.63 * s * k); c.arc(bx, by - 1.63 * s * k, .13 * s, 0, TAU);
      if (spear) { const sx = bx + .3 * w * spear; c.moveTo(sx - .03 * s, by); c.lineTo(sx + .03 * s, by); c.lineTo(sx + .03 * s, by - 2.9 * s); c.lineTo(sx, by - 3.15 * s); c.lineTo(sx - .03 * s, by - 2.9 * s); c.closePath(); }
    };
    const HORSE = [[-1.05, -1.45], [-.6, -1.52], [.2, -1.46], [.55, -1.56], [.85, -1.95], [1.05, -2.15], [1.1, -2.32], [1.17, -2.14], [1.48, -1.8], [1.52, -1.66], [1.3, -1.68], [1.0, -1.78], [.85, -1.38], [.72, -1.06], [-.2, -.98], [-.85, -1.04], [-1.12, -1.22]];
    const horse = (bx, by, s, d, rider, gait, sq = 1, turban = 0) => { // d: facing; sq: foreshortening; gait: walk phase or -1
      const sx = s * d * sq;
      if (s < 4) { c.rect(bx - 1.05 * s * sq, by - 1.55 * s, Math.max(1.2, 2.1 * s * sq), Math.max(.9, .55 * s)); if (s > .8) { c.rect(bx - .9 * s * sq, by - s, Math.max(.6, .25 * s), s); c.rect(bx + .6 * s * sq, by - s, Math.max(.6, .25 * s), s); } if (rider) c.rect(bx - .2 * s, by - 2.45 * s, Math.max(.7, .45 * s), .95 * s); return; }
      c.moveTo(bx + HORSE[0][0] * sx, by + HORSE[0][1] * s); for (let k = 1; k < HORSE.length; k++) c.lineTo(bx + HORSE[k][0] * sx, by + HORSE[k][1] * s); c.closePath();
      [[.62, 0], [.46, .5], [-.8, .25], [-.64, .75]].forEach(([u, ph]) => { const sw = gait < 0 ? 0 : Math.sin((gait + ph) * TAU) * .22, x0 = bx + u * sx, x1 = x0 + sw * s * d; c.moveTo(x0 - .065 * s, by - 1.08 * s); c.lineTo(x0 + .065 * s, by - 1.08 * s); c.lineTo(x1 + .05 * s, by); c.lineTo(x1 - .05 * s, by); c.closePath(); });
      c.moveTo(bx - 1.02 * sx, by - 1.42 * s); c.lineTo(bx - 1.3 * sx, by - .8 * s); c.lineTo(bx - 1.16 * sx, by - .78 * s); c.lineTo(bx - .96 * sx, by - 1.3 * s); c.closePath();
      if (rider) {
        c.moveTo(bx - .34 * sx, by - 1.45 * s); c.lineTo(bx + .26 * sx, by - 1.45 * s); c.lineTo(bx + .12 * sx, by - 2.28 * s); c.lineTo(bx - .16 * sx, by - 2.28 * s); c.closePath();
        c.moveTo(bx - .2 * sx, by - 2.2 * s); c.quadraticCurveTo(bx - .55 * sx, by - 1.9 * s, bx - .62 * sx, by - 1.42 * s); c.lineTo(bx - .3 * sx, by - 1.5 * s); c.closePath(); // the cloak, streaming back
        if (turban) { c.moveTo(bx + .18 * s, by - 2.44 * s); c.ellipse(bx, by - 2.44 * s, .18 * s, .15 * s, 0, 0, TAU); c.moveTo(bx - .04 * sx, by - 2.3 * s); c.quadraticCurveTo(bx - .3 * sx, by - 2.2 * s, bx - .34 * sx, by - 1.95 * s); c.lineTo(bx - .26 * sx, by - 1.97 * s); c.closePath(); }
        else { c.moveTo(bx + .13 * s, by - 2.43 * s); c.arc(bx, by - 2.43 * s, .14 * s, 0, TAU); }
      }
    };
    // the camel: loft, legs, skirt, howdah, lodged arrows
    const drawCamel = (pose, opt) => {
      const RG = rig(pose), { T, N, dv } = RG, col = opt.col;
      // legs: hips ride the body, feet seek the ground (two-bone), all rolled with it
      const legs = LEGS.map(([hu, hv, hw, front]) => {
        const drop = front ? pose.dropF : pose.drop, hipV = hv - drop + (pose.bob || 0);
        let fu = hu + (front ? .06 : -.04), fv = 0;
        if (opt.walk !== undefined) { const ph = (opt.walk + (front ? 0 : .5) + (hw > 0 ? .25 : 0)) * TAU; fu += Math.sin(ph) * .32; fv = Math.max(0, Math.cos(ph)) * .14; }
        if (front) fu -= .55 * (pose.kneel || 0);
        const L1 = front ? .74 : .82, L2 = front ? .64 : .66;
        const [kx, ky, ex, ey] = ik(hu, hipV, fu, fv, L1, L2, front ? 1 : -1);
        const a = T(hu, hipV, hw, 1), b = T(kx, ky, hw, 1), e = T(ex, ey, hw, 1);
        return { a, b, e, w: hw, front };
      });
      const lw = RG.lw, camSide = Math.sign(v3.dot(v3.sub(eye, pose.base), lw) * Math.cos(pose.roll || 0) + .0001);
      const drawLeg = (L) => {
        const a = P(L.a), b = P(L.b), e = P(L.e); if (!a || !b || !e) return;
        c.strokeStyle = rgb(col); c.lineCap = 'round'; c.lineJoin = 'round';
        c.lineWidth = Math.max(1, (L.front ? .15 : .19) * F / a[2]); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
        c.lineWidth = Math.max(1, .085 * F / b[2]); c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(e[0], e[1]); c.stroke();
        c.fillStyle = rgb(col); c.beginPath(); c.arc(b[0], b[1], Math.max(.6, .07 * F / b[2]), 0, TAU); c.fill();
        c.beginPath(); c.ellipse(e[0], e[1], Math.max(.8, .13 * F / e[2]), Math.max(.5, .06 * F / e[2]), 0, 0, TAU); c.fill();
      };
      legs.filter((L) => Math.sign(L.w) !== camSide).forEach(drawLeg);
      // the skirt on the far side, then the body
      const skirt = (sd) => { const q = []; for (let k = 0; k <= 10; k++) { const u = mix(-.82, .82, k / 10); q.push(T(u, HB + .02, sd * (HW + .06))); } for (let k = 10; k >= 0; k--) { const u = mix(-.82, .82, k / 10); q.push(T(u, 1.66 - (k & 1) * .1 - .06 * Math.sin(k * 1.7), sd * (.6 + .05 * (k & 1)))); } const pts = q.map(P); if (pts.some((v) => !v)) return; c.fillStyle = rgb(opt.skirt); c.beginPath(); pts.forEach((v, k) => (k ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1]))); c.closePath(); c.fill(); };
      if (opt.howdah) skirt(-camSide);
      // the body: quads between neighbouring rings, each wound the same way so the union fills solid
      const ring = STA.map(([u, v, hv, hw, tu, tv, neck]) => {
        let U = u, V = v;
        if (neck && pose.droop) { const a = -pose.droop * c01((u - 1.1) / 1.4), du = u - 1.1, dvv = v - 1.48; U = 1.1 + du * Math.cos(a) - dvv * Math.sin(a); V = 1.48 + du * Math.sin(a) + dvv * Math.cos(a); }
        const nu = -tv, nv = tu, pts = [];
        for (let e = 0; e < ELL; e++) { const a = e / ELL * TAU, ca = Math.cos(a) * hv; if (!pj(...T(U + nu * ca, V + nv * ca, Math.sin(a) * hw))) return null; pts.push(QX, QY); }
        return pts;
      });
      const body = new Path2D();
      const quad = (x0, y0, x1, y1, x2, y2, x3, y3) => { const ar = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0) + (x2 - x0) * (y3 - y0) - (x3 - x0) * (y2 - y0); if (ar >= 0) { body.moveTo(x0, y0); body.lineTo(x1, y1); body.lineTo(x2, y2); body.lineTo(x3, y3); } else { body.moveTo(x0, y0); body.lineTo(x3, y3); body.lineTo(x2, y2); body.lineTo(x1, y1); } body.closePath(); };
      for (let k = 0; k < ring.length - 1; k++) { const A = ring[k], B = ring[k + 1]; if (!A || !B) continue; for (let e = 0; e < ELL; e++) { const f = (e + 1) % ELL; quad(A[e * 2], A[e * 2 + 1], A[f * 2], A[f * 2 + 1], B[f * 2], B[f * 2 + 1], B[e * 2], B[e * 2 + 1]); } }
      [ring[0], ring[ring.length - 1]].forEach((A) => { if (!A) return; let ar = 0; for (let e = 0; e < ELL; e++) { const f = (e + 1) % ELL; ar += A[e * 2] * A[f * 2 + 1] - A[f * 2] * A[e * 2 + 1]; } const ord = ar >= 0 ? [...Array(ELL).keys()] : [...Array(ELL).keys()].reverse(); ord.forEach((e, k) => (k ? body.lineTo(A[e * 2], A[e * 2 + 1]) : body.moveTo(A[e * 2], A[e * 2 + 1]))); body.closePath(); });
      c.fillStyle = rgb(col); c.fill(body, 'nonzero');
      if (opt.rim > .01) { // the low sun catches the upper edge
        c.save(); c.clip(body);
        const sp = P(v3.add(pose.base, [SUN[0] * 40, 2 + SUN[1] * 40, SUN[2] * 40])), bp = P(T(0, 1.8, 0));
        if (sp && bp) { const g = c.createLinearGradient(sp[0], sp[1], bp[0], bp[1]); g.addColorStop(0, rgb([236, 170, 110], .55 * opt.rim)); g.addColorStop(.35, rgb([236, 170, 110], 0)); c.fillStyle = g; c.fill(body); }
        c.restore();
      }
      legs.filter((L) => Math.sign(L.w) === camSide).forEach(drawLeg);
      if (opt.halter) { const m = P(T(MUZ[0], MUZ[1] - .12, 0)), h = P(opt.halter); if (m && h) { c.strokeStyle = rgb(col, .9); c.lineWidth = Math.max(.8, .03 * F / m[2]); c.beginPath(); c.moveTo(m[0], m[1]); c.quadraticCurveTo((m[0] + h[0]) / 2, Math.max(m[1], h[1]) + .3 * F / m[2], h[0], h[1]); c.stroke(); } }
      if (!opt.howdah) return;
      skirt(camSide);
      // the howdah, red cloth over a frame, gold at its edges; arrows on hidden faces first
      const faces = HFACE.map((f, k) => { const n = N(f.n), mid = T(...f.pts[0]); return { f, k, n, vis: v3.dot(n, v3.sub(eye, mid)) > 0 }; });
      const red = opt.red, gold = [214, 170, 82];
      const arrow = (A, a) => {
        const b = T(...A.b), tl = T(A.b[0] + A.td[0] * A.len * a, A.b[1] + A.td[1] * A.len * a, A.b[2] + A.td[2] * A.len * a); const qb = P(b), qt = P(tl); if (!qb || !qt) return;
        c.moveTo(qb[0], qb[1]); c.lineTo(qt[0], qt[1]);
        const dx = qt[0] - qb[0], dy = qt[1] - qb[1], l = Math.hypot(dx, dy) || 1, fl = Math.min(.1 * F / qt[2], l * .25);
        c.moveTo(qt[0], qt[1]); c.lineTo(qt[0] - dx / l * fl * 1.6 - dy / l * fl * .6, qt[1] - dy / l * fl * 1.6 + dx / l * fl * .6);
        c.moveTo(qt[0], qt[1]); c.lineTo(qt[0] - dx / l * fl * 1.6 + dy / l * fl * .6, qt[1] - dy / l * fl * 1.6 - dx / l * fl * .6);
      };
      const arrows = (vis) => { if (!opt.arrows) return; const ref = P(T(0, 3, 0)); if (!ref) return; c.strokeStyle = rgb(opt.shaft); c.lineWidth = Math.max(.7, .028 * F / ref[2]); c.lineCap = 'round'; c.beginPath(); st.hed.forEach((A) => { if (p < A.at || faces[A.f].vis !== vis) return; arrow(A, Math.min(1, (p - A.at) / .002)); }); c.stroke(); };
      arrows(false);
      faces.filter((F2) => F2.vis).forEach(({ f, n }) => {
        const q = f.pts.map((x) => P(T(...x))); if (q.some((v) => !v)) return;
        const lit = Math.max(0, v3.dot(n, SUN)) * sunK, sky = .5 + .5 * n[1];
        const cc = hazeC(mixc(v3.mul(red, .5 + .25 * sky), [255, 120, 80], lit * .45), opt.dist, 1);
        c.fillStyle = rgb(cc); c.beginPath(); q.forEach((v, k) => (k ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1]))); c.closePath(); c.fill();
        c.strokeStyle = rgb(hazeC(mixc(v3.mul(gold, .5), gold, lit), opt.dist), .8); c.lineWidth = Math.max(.6, .035 * F / q[0][2]);
        if (f.k !== 'roof') c.stroke(); else { c.beginPath(); c.moveTo(q[0][0], q[0][1]); c.lineTo(q[1][0], q[1][1]); c.stroke(); }
      });
      arrows(true);
    };
    // ----- camel and column state -----
    const k1 = ease.in(seg(p, .585, .612)), k2 = smooth(seg(p, .605, .64)), k3 = seg(p, .632, .672), rollK = k3 < 1 ? (k3 * k3 * (3 - 2 * k3)) * (1 + .06 * Math.sin(k3 * Math.PI)) : 1;
    const shake = smooth(seg(p, .58, .6)) * (1 - smooth(seg(p, .66, .68)));
    const mainPose = { base: [CAM0[0] + Math.sin(p * 900) * .04 * shake, 0, CAM0[2]], hd: HD, drop: .95 * k1, dropF: .95 * k2, kneel: k2, roll: 1.36 * rollK, droop: .55 * rollK + .2 * k1, bob: 0 };
    const howdahOn = 1 - smooth(seg(p, .74, .78));
    const colS = (s) => ease.io(seg(p, .79, 1.06)) * 820 + S0 - s;
    const colA = smooth(seg(p, .775, .81));
    const camelDist = Math.hypot(CAM0[0] - e0, CAM0[2] - e2), camelBand = bandOf(camelDist);
    const crowdC = [[34, 36, 30], [30, 30, 26], [42, 30, 26], [34, 26, 22], [38, 28, 24], [34, 36, 30]];
    const shadowK = sunK * low;
    const SHX = -SUN[0] / Math.hypot(SUN[0], SUN[2]), SHZ = -SUN[2] / Math.hypot(SUN[0], SUN[2]), SHL = Math.min(4, Math.hypot(SUN[0], SUN[2]) / Math.max(.03, SUN[1]));
    const drawCrowd = (b, fk, zmin, zmax) => {
      const L = LB[b];
      if (b >= 5 && shadowK > .05) {
        c.fillStyle = `rgba(14,10,8,${.2 * shadowK})`; c.beginPath();
        for (const i of L.g) { const z = GP[i * 5 + 2]; if (z < zmin || z >= zmax) continue; const len = (G.ty[i] === 1 || G.ty[i] === 3 ? 2.4 : 1.75) * SHL, x = G.x[i], zz = G.zz[i]; if (!pj(x + SHX * len, 0, zz + SHZ * len)) continue; const ex = QX, ey = QY; if (!pj(x - .3 * SHZ, 0, zz + .3 * SHX)) continue; const ax = QX, ay = QY; if (!pj(x + .3 * SHZ, 0, zz - .3 * SHX)) continue; c.moveTo(ax, ay); c.lineTo(ex, ey); c.lineTo(QX, QY); c.closePath(); }
        c.fill();
      }
      for (let ty = 0; ty < 6; ty++) {
        c.fillStyle = rgb(mixc(v3.mul(crowdC[ty], amb), haze, Math.min(.93, fk))); c.beginPath(); let any = false;
        for (const i of L.g) {
          if (G.ty[i] !== ty) continue; const j = i * 5, z = GP[j + 2]; if (z < zmin || z >= zmax) continue;
          const s = GP[j + 3], bx = GP[j], by = GP[j + 1];
          if (ty === 1 || ty === 3) horse(bx, by, s, G.dir[i] * (r0 < 0 ? -1 : 1), 1, -1); else fig(bx, by, s, 1.62 + G.d[i] * .22, .85 + hash(i) * .35, G.d[i] < .3 ? (ty === 0 ? 1 : -1) : 0);
          any = true;
        }
        if (any) c.fill();
      }
      st.ban.forEach((bn) => {
        const i = bn.i, j = i * 5; if (!GP[j + 4]) return; const z = GP[j + 2]; if (z < zmin || z >= zmax || bandOf(z) !== b) return;
        const bx = GP[j], by = GP[j + 1], s = GP[j + 3], tx = bx, ty = by - bn.h * s, f = Math.min(.93, fk);
        c.strokeStyle = rgb(mixc([40, 32, 24], haze, f)); c.lineWidth = Math.max(.7, .1 * s); c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke();
        c.fillStyle = rgb(mixc(v3.mul(bn.c, amb * 1.1), haze, f)); c.beginPath(); c.moveTo(tx, ty);
        for (let k = 1; k <= 6; k++) { const u = k / 6; c.lineTo(tx + windS[0] * 2.4 * s * u + Math.sin(t * 3 + bn.ph + u * 5) * .12 * s, ty + windS[1] * 2.4 * s * u + Math.cos(t * 2.6 + bn.ph + u * 4) * .16 * s * u); }
        for (let k = 6; k >= 0; k--) { const u = k / 6; c.lineTo(tx + windS[0] * 2.4 * s * u + Math.sin(t * 3 + bn.ph + u * 5 + .5) * .12 * s, ty + 1.3 * s + windS[1] * 2.4 * s * u + Math.cos(t * 2.6 + bn.ph + u * 4) * .16 * s * u); }
        c.closePath(); c.fill();
      });
    };
    // the column: forty riders two abreast, the howdah on a camel in their midst
    const column = [];
    if (colA > 0) {
      for (let r = 0; r < 40; r++) { const row = r >> 1, s = colS(row * 4.8 + (row >= 10 ? 9 : 0)), [x, z, dx, dz] = pathAt(s), sd = r & 1 ? 1 : -1; column.push({ x: x - dz * sd * 1.3, z: z + dx * sd * 1.3, dx, dz, r }); }
      const s = colS(10 * 4.8 + 3.5), [x, z, dx, dz] = pathAt(s); column.push({ x, z, dx, dz, camel: true });
    }
    const drawColumnItem = (o, fk) => {
      if (shadowK > .05) { const L = (o.camel ? 3.6 : 2.6) * Math.min(14, SHL * 3), w = o.camel ? .7 : .45; if (pj(o.x + SHX * L, 0, o.z + SHZ * L)) { const ex = QX, ey = QY; if (pj(o.x - w * SHZ, 0, o.z + w * SHX)) { const ax = QX, ay = QY; if (pj(o.x + w * SHZ, 0, o.z - w * SHX)) { const g = c.createLinearGradient((ax + QX) / 2, (ay + QY) / 2, ex, ey); g.addColorStop(0, `rgba(16,10,8,${.42 * shadowK * colA})`); g.addColorStop(1, 'rgba(16,10,8,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ex, ey); c.lineTo(QX, QY); c.closePath(); c.fill(); } } } }
      if (!pj(o.x, 0, o.z)) return; const bx = QX, by = QY, s = F / QZ, along = o.dx * r0 + o.dz * r2, sq = Math.max(.42, Math.abs(along)), d = along < 0 ? -1 : 1;
      const col = mixc(v3.mul([30, 24, 20], amb), haze, Math.min(.93, fk));
      if (o.camel) {
        const gait = (colS(0) / 3.2) % 1;
        drawCamel({ base: [o.x, 0, o.z], hd: [o.dx, 0, o.dz], drop: 0, dropF: 0, roll: 0, bob: .05 * Math.sin(gait * TAU * 2) }, { col, howdah: true, arrows: false, red: [150, 34, 28], skirt: mixc([118, 26, 22], haze, Math.min(.9, fk)), shaft: col, dist: QZ, rim: shadowK, walk: gait });
        return;
      }
      c.globalAlpha = colA; c.fillStyle = rgb(col); c.beginPath(); horse(bx, by, s, d, 1, (colS(0) / 2.6 + o.r * .13) % 1, sq, 1); c.fill();
      if (s > 5) { c.strokeStyle = rgb(col); c.lineWidth = Math.max(.7, .05 * s); c.beginPath(); c.moveTo(bx - .05 * s * d * sq, by - 1.75 * s); c.lineTo(bx - .62 * s * d * sq, by - 1.18 * s); c.stroke(); } // the sword at the hip
      c.globalAlpha = 1;
    };
    // ----- Ali: behind his army's centre, standing, Dhul-Fiqar at his side. Drawn inside the crowd at his depth, never
    // smaller than 22 px; he does not enter the fighting.
    const aliG = P([ALI[0], 0, ALI[2]]), aliBand = aliG ? bandOf(aliG[2]) : -1;
    const drawAli = () => {
      const hd = Holy.draw(c, { who: 'ali', pose: 'stand', sword: true, x: aliG[0], y: aliG[1], h: Math.max(22, 1.8 * F / aliG[2]), t, amb: 1 - .45 * low });
      if (hd) { bc.fillStyle = `rgba(255,226,170,${.2 + .25 * low})`; bc.beginPath(); bc.arc(hd.x, hd.y, Math.max(8, hd.r * 4), 0, TAU); bc.fill(); }
    };
    for (let b = 0; b < NB; b++) {
      const dm = bandMid(b), fk = fogK(dm);
      const pc = mixc(v3.mul([26, 30, 20], amb), haze, Math.min(.93, fk));
      c.strokeStyle = rgb(pc); c.lineCap = 'round';
      const L = LB[b];
      if (b < 5) { c.lineWidth = b >= 3 ? 1.2 : .8; c.beginPath(); L.p.forEach((i) => { const [x, z, h, l, v] = st.palms[i]; palm(x, z, h, l, v); }); c.stroke(); }
      else L.p.forEach((i) => { const [x, z, h, l, v] = st.palms[i]; c.lineWidth = Math.max(1, .3 * F / Math.hypot(x - e0, z - e2)); c.beginPath(); palm(x, z, h, l, v); c.stroke(); });
      column.filter((o) => bandOf(Math.hypot(o.x - e0, o.z - e2)) === b && !o.camel).sort((a, b2) => Math.hypot(b2.x - e0, b2.z - e2) - Math.hypot(a.x - e0, a.z - e2)).forEach((o) => drawColumnItem(o, fk));
      // the camel and Ali stand inside the crowd: draw the band's crowd in slices between them, far to near
      const cuts = [];
      if (b === aliBand) cuts.push([aliG[2], drawAli]);
      if (b === camelBand) cuts.push([(pj(CAM0[0], 0, CAM0[2]), QZ) + 1.5, () => {
        const scr = .6 * smooth(seg(p, .4, .48)) * (1 - smooth(seg(p, .7, .76)));
        if (scr > .01 && pj(CAM0[0], 2.4, CAM0[2] + 9)) {
          const r = 26 * F / QZ, g = c.createRadialGradient(QX, QY, 0, QX, QY, r);
          g.addColorStop(0, rgb(mixc(haze, [255, 226, 186], .35), scr)); g.addColorStop(.45, rgb(mixc(haze, [255, 226, 186], .2), scr * .6)); g.addColorStop(1, rgb(haze, 0));
          c.save(); c.translate(QX, QY); c.scale(1, .55); c.translate(-QX, -QY); c.fillStyle = g; c.fillRect(QX - r, QY - r, r * 2, r * 2); c.restore();
        }
        const cc = mixc(v3.mul([66, 46, 32], amb), haze, Math.min(.93, fogK(camelDist)));
        drawCamel(mainPose, { col: cc, howdah: howdahOn > .02, arrows: true, red: [158, 32, 26], skirt: mixc([120, 24, 20], haze, Math.min(.9, fogK(camelDist))), shaft: mixc([46, 34, 24], haze, Math.min(.9, fogK(camelDist))), dist: camelDist, rim: shadowK * .8, halter: p < .66 ? [CAM0[0] - 3.4, 1.15 * (1 - smooth(seg(p, .6, .64))), 0] : null });
      }]);
      let zHi = 1e9;
      cuts.sort((u, v) => v[0] - u[0]).forEach(([z, f]) => { drawCrowd(b, fk, z, zHi); f(); zHi = z; });
      drawCrowd(b, fk, -1e9, zHi);
      column.filter((o) => o.camel && bandOf(Math.hypot(o.x - e0, o.z - e2)) === b).forEach((o) => drawColumnItem(o, fk));
    }
    // ----- arrows in flight, and those standing in the ground -----
    {
      const fl = (A, k) => { const d = Math.hypot(A.e[0] - A.s[0], A.e[2] - A.s[2]), h = d * .2; return [mix(A.s[0], A.e[0], k), mix(A.s[1], A.e[1], k) + 4 * h * k * (1 - k), mix(A.s[2], A.e[2], k), d, h]; };
      const dur = (d) => .012 + d / 400 * .01;
      c.strokeStyle = rgb(mixc([26, 20, 16], haze, .1), .92); c.lineCap = 'round'; c.lineWidth = 1.4; c.beginPath();
      const seg2 = (q0, q1) => { if (!pj(...q0)) return; const ax = QX, ay = QY, z = QZ; if (!pj(...q1)) return; if (z > 2000) return; c.moveTo(ax, ay); c.lineTo(QX, QY); };
      st.rain.forEach((A) => {
        const d = Math.hypot(A.e[0] - A.s[0], A.e[2] - A.s[2]), T0 = (p - A.at) / dur(d);
        if (T0 <= 0) return;
        if (T0 < 1) { const a = fl(A, T0), b = fl(A, Math.min(1, T0 + 1.6 / d)); seg2([a[0], a[1], a[2]], [b[0], b[1], b[2]]); return; }
        if (!A.ground || p > .79) return;
        const a = fl(A, 1), b = fl(A, 1 - .5 / d); seg2([a[0], .02, a[2]], [b[0], Math.max(.05, b[1] * .8), b[2]]);
      });
      st.hed.forEach((A, k) => { // the howdah's arrows on their way in
        const e = st.tgt[k], s = [A.sx, 1.7, A.sz], d = Math.hypot(e[0] - s[0], e[2] - s[2]), du = dur(d), T0 = (p - (A.at - du)) / du;
        if (T0 <= 0 || T0 >= 1) return; const B = { s, e }; const a = fl(B, T0), b = fl(B, Math.min(1, T0 + .9 / d)); seg2([a[0], a[1], a[2]], [b[0], b[1], b[2]]);
      });
      c.stroke();
    }
    // ----- dust: along the front while they fight, thick about the knot, a burst where the camel falls -----
    {
      const fx = (z) => -6 + bulge(z) * .9;
      const front = fight * .4, knot = (.3 * fight + .15 * smooth(seg(p, .3, .5))) * (1 - stop), burst = Math.sin(Math.PI * seg(p, .61, .72)) * .32;
      st.dust.forEach(([u, v, w, k, ph], i) => {
        let x, y, z, R, a;
        if (i < 60) { if (front < .02) return; z = (u - .5) * 900; x = fx(z) + (v - .5) * 24 + Math.sin(t * .2 + ph * 9) * 4; y = 1 + w * 7; R = 10 + k * 22; a = front * (.35 + .4 * k); }
        else if (i < 95) { const aa = u * TAU + p * 2, rr = 9 + v * 34; x = CAM0[0] + Math.cos(aa) * rr; z = Math.abs(Math.sin(aa)) * rr; y = .4 + w * 3; R = 3 + k * 6; a = knot * (.3 + .4 * k); if (burst > 0) a = Math.max(a, .2 * burst); }
        else { if (burst <= .01) return; const aa = u * TAU, rr = 1 + v * 6 * (1 + seg(p, .62, .72) * 1.5); x = CAM0[0] + Math.cos(aa) * rr; z = Math.sin(aa) * rr - 1.2; y = .2 + w * 1.2 * (1 + seg(p, .62, .72)); R = 1.6 + k * 3; a = burst * (.45 + .4 * k); }
        if (a < .01 || !pj(x, y, z)) return; const r = R * F / QZ; if (QX < -r || QX > W + r) return;
        c.globalAlpha = Math.min(.9, a) * (1 - fogK(QZ) * .5); c.drawImage(k < .35 ? st.puffD : st.puffW, QX - r, QY - r * .7, r * 2, r * 1.4);
      });
      c.globalAlpha = 1;
      // grit in the air near the lens
      const n = Math.floor(st.grit.length * (.12 + .4 * fight)), T0 = t + p * 30;
      c.strokeStyle = rgb(mixc(haze, [255, 230, 196], .2), .22); c.lineWidth = 1; c.beginPath();
      for (let i = 0; i < n; i++) { const [u, v, w, k] = st.grit[i], sp = .6 + k, L2 = 140; const x = e0 - 20 + (((u * L2 + 6 * sp * T0) % L2) + L2) % L2, z = e2 - 70 + (((w * 140 - 2 * sp * T0) % 140) + 140) % 140, y = v * v * 5; if (!pj(x, y, z)) continue; const ax = QX, ay = QY; if (!pj(x + .3 * sp + .8, y, z)) continue; c.moveTo(ax, ay); c.lineTo(QX, QY); }
      c.stroke();
    }
    // ----- bloom, grade -----
    if (sunP && sunP[1] < hy + 4) { bc.globalAlpha = .9 * sunK * low; const r = F * .14; bc.drawImage(st.glowS, sunP[0] - r, sunP[1] - r, r * 2, r * 2); bc.globalAlpha = 1; }
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = .75; c.drawImage(st.bloom, 0, 0, W, H); c.globalAlpha = 1;
    c.globalCompositeOperation = 'soft-light'; c.fillStyle = `rgba(255,180,110,${.22 * low * sunK})`; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
    const vg = c.createRadialGradient(W / 2, H * .52, Math.min(W, H) * .32, W / 2, H * .52, Math.hypot(W, H) * .62);
    vg.addColorStop(0, 'rgba(8,8,10,0)'); vg.addColorStop(1, 'rgba(8,8,10,.5)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  },
};
})();
