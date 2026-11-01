(() => {
// uhud: the foot of Mount Uhud, Shawwal 3 AH, from morning to nightfall. A pinhole camera over a small world in metres:
// x to the east, y up, z to the north (toward the mountain). The Muslims stand with the mountain at their backs, the
// archers on the small hill on their left flank, Quraysh across the plain with their horse on the right wing.
// Terrain is a heightfield drawn as camera-facing depth bands, far to near. People are faceless silhouettes;
// the Prophet and Ali are never figures: they are calm lights.
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

// ---------- the land: the long dark mountain, its gullies, the small hill, the plain ----------
const HILL = [170, 470, 74, 44, 15]; // the archers' hill: centre x, z, radii, height
const ridgeZ = (x) => 1080 + 120 * Math.sin(x * .0021 + .5) + 60 * Math.sin(x * .0057 + 2);
const rr = (v, e) => 1 + e - Math.sqrt(Math.sin(v) ** 2 + e * e); // a ridge: 1 on rounded crests (width e), about e in the hollows
function mountain(x, z) {
  mountain.g = 1; mountain.v = 0; // the last call's ravine factor and height, for the shading
  if (z < 440) return 0; // the lowest foot of the mountain: the plain needs no trig
  const zr = ridgeZ(x), foot = zr - 460, k = (z - foot) / 460;
  if (k <= 0) return 0;
  const w = x + 80 * Math.sin(x * .0037 + z * .0021); // the crest wanders
  const top = 207 + 72 * Math.sin(x * .0026 + 1) + 34 * Math.sin(x * .0071 + 2) * Math.sin(x * .0017) + 26 * rr(w * .0061 + Math.sin(x * .0023) * 2.4, .3) + 12 * rr(w * .0143 + Math.sin(w * .0051) * 1.3 + 3, .35) + 5 * rr(w * .037 + 1, .4);
  const s = smooth(Math.min(k, 1)), prof = k < 1 ? s * Math.sqrt(s) : 1 - .45 * smooth(c01((k - 1) / 1.6));
  // spurs and ravines down the face, bending as they fall, in three sizes; fading out over the crest
  const ph = x * .021 + 3 * Math.sin(x * .0043 + 1) + Math.sin(z * .012 + x * .002) * 1.7;
  const gul = .6 * rr(ph, .3) + .25 * rr(ph * 2.3 + z * .009, .45) + .15 * rr(ph * 5.1 + z * .03, .5); mountain.g = gul;
  const fh = 26 * smooth(c01(k / .35)) * (1 - smooth(c01((k - .35) / .4))) * (.5 + .5 * Math.sin(x * .013 + 2)); // foothills
  const knobs = 7 * Math.sin(x * .05 + z * .031) * Math.sin(z * .043 - x * .02) * s; // granite knobs and tors
  return mountain.v = top * prof * (1 - .26 * (1 - gul) * smooth(c01(k * 1.4)) * (1 - smooth(c01((k - .95) / .35)))) + fh + knobs;
}
function height(x, z) {
  let h = .5 * Math.sin(x * .021 + z * .013) * Math.sin(z * .017 - x * .008) + .6 * Math.sin(x * .061 + z * .047 + 2.2 * Math.sin(z * .011 + x * .004)) + mountain(x, z); // the plain's long low swells
  const dx = (x - HILL[0]) / HILL[2], dz = (z - HILL[1]) / HILL[3], r2 = dx * dx + dz * dz;
  if (r2 < 1) h += HILL[4] * (1 - r2) ** 1.6;
  return h;
}
const K = [22, 396]; // where the few held around the Prophet's light
const GORGE = [-40, 772];

// ---------- camera keys: [p, eye, look] ----------
const CAM = [
  [-.06, [-300, 150, -250], [60, 70, 700]],
  [0, [-290, 145, -240], [60, 68, 700]],
  [.1, [-200, 96, -40], [60, 24, 520]],
  [.2, [-150, 74, 110], [60, 2, 430]],
  [.265, [104, 52, 330], [168, 6, 452]],
  [.32, [40, 150, 110], [190, 0, 480]],
  [.37, [70, 168, 150], [170, 0, 560]],
  [.45, [-60, 80, 240], [50, 0, 470]],
  [.53, [-30, 46, 330], [22, 0, 404]],
  [.6, [-44, 54, 320], [14, 0, 420]],
  [.67, [-120, 46, 300], [-20, 40, 760]],
  [.75, [-140, 34, 260], [-10, 210, 980]],
  [.86, [-146, 30, 250], [-6, 270, 980]],
  [1, [-148, 29, 246], [-4, 276, 980]],
  [1.06, [-148.5, 29, 245.5], [-4, 276, 980]],
];
function camAt(p) {
  let i = 0; while (i < CAM.length - 2 && p > CAM[i + 1][0]) i++;
  const u = i + smooth(c01((p - CAM[i][0]) / (CAM[i + 1][0] - CAM[i][0])));
  return { eye: crv(CAM.map((k) => k[1]), u), look: crv(CAM.map((k) => k[2]), u) };
}
// ---------- light keys: p, sky top, sky mid, horizon, sun colour, ambient, haze, sun elevation (deg), sun azimuth (rad, from east through south), fog length ----------
const LK = [
  [-.06, [58, 80, 112], [168, 160, 148], [232, 208, 168], [255, 226, 186], [84, 90, 112], [200, 186, 166], 15, .35, 4200],
  [.3, [60, 86, 120], [172, 168, 158], [230, 212, 180], [255, 236, 206], [90, 94, 112], [204, 192, 174], 34, .9, 3800],
  [.46, [66, 90, 122], [178, 172, 160], [230, 214, 186], [255, 238, 210], [98, 100, 114], [206, 192, 172], 50, 1.6, 2600],
  [.6, [58, 70, 100], [184, 152, 128], [240, 192, 146], [255, 206, 150], [88, 86, 102], [206, 166, 136], 20, 2.4, 3200],
  [.69, [32, 34, 60], [130, 80, 78], [240, 136, 84], [255, 150, 90], [58, 54, 76], [170, 106, 86], 2, 2.75, 2600],
  [.76, [12, 16, 34], [40, 36, 58], [112, 62, 56], [255, 120, 80], [26, 28, 46], [36, 28, 38], -4, 2.85, 3000],
  [.85, [6, 9, 20], [14, 18, 34], [32, 30, 46], [255, 120, 80], [14, 16, 30], [12, 12, 20], -12, 2.9, 3200],
  [1.06, [5, 8, 18], [12, 16, 30], [26, 26, 40], [255, 120, 80], [12, 14, 28], [10, 10, 18], -14, 2.9, 3200],
];

// ---------- silhouettes (u across, v up, metres; facing +u) ----------
const MAN = [-.34, 0, -.27, .55, -.2, 1.0, -.25, 1.3, -.21, 1.42, -.17, 1.5, -.16, 1.62, -.1, 1.74, .02, 1.78, .11, 1.7, .12, 1.58, .08, 1.5, .2, 1.42, .24, 1.25, .19, 1.0, .26, .55, .32, 0];
const MAN2 = [-.4, 0, -.3, .5, -.21, 1.0, -.26, 1.32, -.2, 1.44, -.1, 1.5, -.14, 1.58, -.13, 1.7, -.04, 1.79, .08, 1.78, .14, 1.68, .12, 1.56, .07, 1.5, .19, 1.44, .25, 1.28, .2, 1.0, .3, .5, .36, 0];
const MANS = [-.3, 0, -.22, 1.3, -.12, 1.5, -.08, 1.76, .08, 1.76, .12, 1.5, .22, 1.3, .3, 0];
const RIMF = [[9, 16], [10, 17]], RIMB = [[1, 8], [1, 9]];
const HORSE = [-1.14, 1.3, -.98, 1.5, -.3, 1.46, .42, 1.56, .66, 1.76, .9, 2.06, 1.02, 2.1, 1.3, 1.86, 1.3, 1.75, 1.16, 1.73, .96, 1.84, .82, 1.42, .78, 1.16, .2, 1.02, -.6, 1.05, -.96, 1.14, -1.04, .98, -1.2, 1.06];
const RIDER = [-.24, 1.48, -.22, 1.95, -.14, 2.12, -.13, 2.26, -.06, 2.37, .05, 2.37, .11, 2.26, .12, 2.12, .2, 1.95, .24, 1.48];
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
// the horse's way round the hill into the Muslims' rear
const SWEEP = [[300, 300], [372, 410], [384, 540], [320, 640], [190, 676], [90, 640], [40, 560], [30, 500]];
const sweepAt = (u) => crv(SWEEP, c01(u) * (SWEEP.length - 1));

S.uhud = {
  init(el, st) {
    st.cv = el.querySelector('canvas');
    st.c = st.cv.getContext('2d');
    st.tag = el.querySelector('.uh-tag');
    st.bloom = mk(8, 8); st.bc = st.bloom.getContext('2d');
    st.puff = sprite([[0, 'rgba(226,200,160,.85)'], [.45, 'rgba(212,186,148,.38)'], [1, 'rgba(204,178,140,0)']]);
    st.puffD = sprite([[0, 'rgba(112,96,82,.8)'], [.5, 'rgba(112,96,82,.35)'], [1, 'rgba(112,96,82,0)']]);
    st.glow = sprite([[0, 'rgba(255,255,255,1)'], [.16, 'rgba(255,255,255,.55)'], [.42, 'rgba(255,255,255,.14)'], [1, 'rgba(255,255,255,0)']], 128);
    st.tints = {};
    const R = rng(625);
    const gs = () => (R() + R() + R() - 1.5) / 1.5;
    st.NS = 66; st.NK = 84;
    st.TX = new Float32Array(st.NS * (st.NK + 1)); st.TY = new Float32Array(st.NS * (st.NK + 1));
    st.TC = new Float32Array(st.NS * (st.NK / 2 + 1) * 3);
    st.ridges = [0, 1].map((L) => { const a = []; let h = .02; for (let i = 0; i <= 360; i++) { h = mix(h, (L ? .02 : .032) + .02 * Math.sin(i * .05 + L * 2) ** 2 + R() * .01, .12); a.push(h); } return a; });
    st.stars = Array.from({ length: 320 }, () => [R() * TAU, .03 + R() ** .8 * 1.2, R()]);
    st.clouds = Array.from({ length: 14 }, () => [-1.4 + R() * 3.2, .12 + R() * .3, .5 + R() * 1.2, .02 + R() * .03, .2 + R() * .4]);
    st.marks = Array.from({ length: 2400 }, () => [(R() - .5) * 900, -200 + R() * 900, R(), R()]);
    st.rocks = []; for (let i = 0; i < 260; i++) { const x = (R() - .5) * 1400, z = -300 + R() * 1000; if (Math.abs(x) < 360 && z > -60 && z < 640) continue; st.rocks.push([x, z, .4 + R() * 1.4, R(), height(x, z)]); }
    for (let x0 = -1500; x0 < 1500; x0 += 26 + R() * 30); // the draws the old gully strokes took: the people keep their places
    // ---- the people ----
    const F = [], add = (o) => { o.hs = o.hs || .92 + R() * .16; F.push(o); return o; };
    // Muslims: about seven hundred, the mountain at their backs, facing south
    for (let i = 0; i < 650; i++) {
      const row = i % 5, col = Math.floor(i / 5), n = 130, x0 = -150 + (col / (n - 1)) * 300 + gs() * .5, z0 = 532 + row * 2.6 + gs() * .5;
      const k = R(); let tx, tz;
      if (i < 14) { const a = i / 14 * TAU + R() * .3, r = 3 + R() * 3.5; tx = K[0] + Math.cos(a) * r; tz = K[1] + Math.sin(a) * r; } // the few who stayed
      else if (k < .55) { tx = x0 * .7 + gs() * 70; tz = 640 + R() * 200; } // up toward the mountain
      else if (k < .78) { tx = -260 - R() * 260; tz = 300 + R() * 260; }
      else { tx = (R() - .5) * 600; tz = 200 + R() * 120; }
      add({ side: 0, kind: R() < .4 ? 1 : 0, x0, z0, x1: x0 * .95 + gs() * 2, z1: z0 - 140 + gs() * 4, x2: tx, z2: tz, x3: GORGE[0] + gs() * 70 + (i < 14 ? 0 : (R() - .5) * 120), z3: GORGE[1] - 30 + R() * 80, d: R() * .02 + row * .004, d2: R() * .06, knot: i < 14, ph: R() * TAU });
    }
    // the archers on their hill: most go down for the spoils; a few hold and fall
    for (let i = 0; i < 50; i++) {
      const a = R() * TAU, r = Math.sqrt(R()), x0 = HILL[0] + Math.cos(a) * r * 22, z0 = HILL[1] + Math.sin(a) * r * 11;
      const stay = i < 10;
      add({ side: 0, kind: 0, archer: 1, stay, x0, z0, x1: stay ? x0 : 100 + R() * 50, z1: stay ? z0 : 200 + R() * 50, x2: -200 - R() * 200, z2: 260 + R() * 200, x3: GORGE[0] + gs() * 80, z3: GORGE[1] - 20 + R() * 70, d: stay ? 0 : (i - 10) / 40 * .035, d2: R() * .06, ph: R() * TAU });
    }
    // Quraysh: three thousand (drawn as twelve hundred) across the plain; two hundred horse on the right wing; their camp behind
    for (let i = 0; i < 1200; i++) {
      const x0 = gs() * 150 + (R() - .5) * 90, z0 = 250 + R() ** .8 * 80;
      const grp = i < 56 ? i % 4 : -1, ga = [-2.5, -1.25, .15, 1.45][grp] || 0;
      const ra = -Math.PI / 2 + gs() * 1.9, rr = 46 + R() ** .7 * 90;
      add({ side: 1, kind: R() < .45 ? 1 : 0, x0, z0, x1: x0 * 1.05 + gs() * 8, z1: z0 - 140 + gs() * 10, x2: K[0] + Math.cos(ra) * rr * 1.3, z2: K[1] + Math.sin(ra) * rr, x3: x0 * 1.3 + gs() * 60, z3: -260 - R() * 260, d: R() * .02, d2: R() * .05, grp, ga: ga + gs() * .3, gr: R(), ph: R() * TAU });
    }
    for (let i = 0; i < 200; i++) {
      const x0 = 262 + (i % 10) * 7 + gs(), z0 = 270 + Math.floor(i / 10) * 3.4 + gs();
      add({ side: 1, kind: 2, horse: 1, x0, z0, x1: x0, z1: z0, off: gs() * 9, lag: (i / 200) * .045 + R() * .006, x2: 10 + R() * 120, z2: 440 + R() * 130, x3: -100 + R() * 200, z3: -300 - R() * 200, d: 0, d2: R() * .04, ph: R() * TAU });
    }
    for (let i = 0; i < 170; i++) { const x0 = (R() - .5) * 320, z0 = -60 + R() * 120; add({ side: 1, kind: 4, fix: 1, x0, z0, dir: R() < .5 ? 1 : -1, ph: R() * TAU }); }
    for (let i = 0; i < 18; i++) { const x0 = (R() - .5) * 300, z0 = -40 + R() * 110; add({ side: 1, kind: 5, fix: 1, x0, z0, dir: 1, hs: 1, ph: 0 }); }
    st.F = F;
    st.ban = [[-60, 528, [226, 214, 186], 0], [10, 528, [226, 214, 186], 0], [80, 528, [62, 116, 88], 0]];
    for (let i = 0; i < 10; i++) st.ban.push([(R() - .5) * 280, 260 + R() * 60, i % 3 ? [112, 36, 30] : [30, 25, 24], 1]);
    // dust: the push, the horse's trail round the hill, the rout, the withdrawal
    st.puffs = [];
    for (let i = 0; i < 70; i++) st.puffs.push([(R() - .5) * 300, 300 + gs() * 14, .15 + R() * .08, 6 + R() * 9, R() * TAU, R(), 0]);
    for (let i = 0; i < 120; i++) { const u = i / 120, q = sweepAt(u); st.puffs.push([q[0] + gs() * 8, q[1] + gs() * 8, .285 + u * .12, 7 + R() * 9, R() * TAU, R(), 0]); }
    for (let i = 0; i < 70; i++) { const a = R() * TAU, r = 40 + R() * 90; st.puffs.push([K[0] + Math.cos(a) * r * 1.3, K[1] + Math.sin(a) * r, .4 + R() * .16, 6 + R() * 9, R() * TAU, R(), 0]); }
    for (let i = 0; i < 40; i++) st.puffs.push([(R() - .5) * 300, 160 + R() * 160, .64 + R() * .06, 10 + R() * 12, R() * TAU, R(), 0]);
    st.motes = new Float32Array(2400 * 4); for (let i = 0; i < 2400; i++) { st.motes[i * 4] = K[0] + (R() - .5) * 260; st.motes[i * 4 + 1] = K[1] - 60 + R() * 220; st.motes[i * 4 + 2] = R() ** 1.7 * 24; st.motes[i * 4 + 3] = R(); }
  },

  frame(p, t, el, st) {
    fit(st.cv);
    const { c, cv } = st;
    const dpr = cv.width / Math.max(1, cv.clientWidth), W = cv.clientWidth, H = cv.clientHeight, phone = W < H * .8;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // ----- camera -----
    const { eye, look } = camAt(p);
    if (phone) { const back = mix(1.35, 1.1, smooth(seg(p, .48, .53)) * (1 - smooth(seg(p, .62, .66)))); for (let j = 0; j < 3; j++) eye[j] = look[j] + (eye[j] - look[j]) * back; }
    const fw = norm(sub(look, eye)), rt = norm(cross([0, 1, 0], fw)), up = cross(fw, rt);
    const F = phone ? W * 1.05 : Math.min(H * 1.3, W * .98), cx = W / 2, cy = H * (phone ? .6 : .52);
    const [E0, E1, E2] = eye, [f0, f1, f2] = fw, [r0, r1, r2] = rt, [u0, u1, u2] = up;
    let PX = 0, PY = 0, PZ = 0;
    const pj = (x, y, z) => { const dx = x - E0, dy = y - E1, dz = z - E2, zc = dx * f0 + dy * f1 + dz * f2; if (zc < .4) return false; const iz = F / zc; PX = cx + (dx * r0 + dy * r1 + dz * r2) * iz; PY = cy - (dx * u0 + dy * u1 + dz * u2) * iz; PZ = zc; return true; };
    // ----- light -----
    const [skT, skM, skH, sunC, amb, haze0, elev, saz, fogL0] = keyAt(LK, p);
    const fight = smooth(seg(p, .38, .44)) * (1 - smooth(seg(p, .6, .68)));
    const fogL = fogL0 * (1 - .25 * fight);
    const se = elev * Math.PI / 180, SUNH = [Math.cos(saz), 0, -Math.sin(saz)], sun = [SUNH[0] * Math.cos(se), Math.sin(se), SUNH[2] * Math.cos(se)];
    const day = c01((elev + 4) / 8), direct = c01((elev + .5) / 3); // sky light lingers after sunset; direct sun does not
    const hazeAt = (vx, vz) => { const k = Math.max(0, (vx * SUNH[0] + vz * SUNH[2]) / (Math.hypot(vx, vz) || 1)) ** 5; return lerp(haze0, lerp(skH, sunC, .25), k * .7 * day); };
    const fogOf = (zc) => Math.min(.95, 1 - Math.exp(-zc / fogL));
    const pitch = Math.asin(Math.max(-.99, Math.min(.99, f1))), hy = cy + F * Math.tan(pitch);
    const tint = (col) => { if (!st.tints[col]) { const cc = mk(128, 128), g = cc.getContext('2d'); g.drawImage(st.glow, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, 128, 128); st.tints[col] = cc; } return st.tints[col]; };
    // ----- sky -----
    const sg = c.createLinearGradient(0, Math.min(0, hy - F * 1.1), 0, hy);
    sg.addColorStop(0, rgb(skT)); sg.addColorStop(.6, rgb(skM)); sg.addColorStop(1, rgb(skH));
    c.fillStyle = sg; c.fillRect(0, 0, W, H); // every pixel, every frame: below the horizon the terrain paints over it
    const SD = 1e5;
    let SX = -1e4, SY = -1e4;
    if (elev > -8 && pj(E0 + sun[0] * SD, E1 + Math.max(sun[1], -.05) * SD, E2 + sun[2] * SD)) {
      SX = PX; SY = PY;
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(SX, SY, 0, SX, SY, F * 1.2), a = .4 * c01((elev + 8) / 6);
      g.addColorStop(0, rgb(sunC, a)); g.addColorStop(.16, rgb(sunC, a * .35)); g.addColorStop(1, rgb(sunC, 0));
      c.fillStyle = g; c.fillRect(0, 0, W, hy + 2);
      if (elev > -1) { const r = F * .0062; c.globalAlpha = .9; c.drawImage(tint('#ffe6bc'), SX - r * 10, SY - r * 10, r * 20, r * 20); c.fillStyle = 'rgba(255,248,232,.95)'; c.beginPath(); c.arc(SX, SY, r, 0, TAU); c.fill(); c.globalAlpha = 1; }
      c.globalCompositeOperation = 'source-over';
    }
    const az0 = Math.atan2(f0, f2);
    const dirP = (az, e2) => pj(E0 + Math.sin(az) * Math.cos(e2) * SD, E1 + Math.sin(e2) * SD, E2 + Math.cos(az) * Math.cos(e2) * SD);
    const starA = smooth(seg(p, .71, .8));
    if (starA > 0) { c.fillStyle = '#f1e8d0'; st.stars.forEach(([az, e2, k]) => { if (!dirP(az0 + (az - Math.PI) * .5, e2) || PX < 0 || PX > W || PY > hy - 6) return; c.globalAlpha = starA * (.2 + .7 * k) * (.7 + .3 * Math.sin(t * 2 + k * 50)); const s = k > .92 ? 1.7 : 1; c.fillRect(PX, PY, s, s); }); c.globalAlpha = 1; }
    const cl = lerp(lerp(skM, sunC, .4 * day), [255, 244, 228], .12 * day);
    st.clouds.forEach(([az, e2, w, h, a]) => {
      if (!dirP(az0 + az * .6, e2)) return; const x = PX, y = PY, rw = w * F * .5, rh = h * F * .6;
      if (x < -rw || x > W + rw || y > hy) return;
      c.save(); c.translate(x, y); c.scale(rw, rh); const g = c.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, rgb(cl, a * .45 * (.3 + .7 * day))); g.addColorStop(1, rgb(cl, 0)); c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore();
    });
    // far ranges: pale and cool, almost the sky
    st.ridges.forEach((rg, L) => {
      const col = lerp(lerp(skH, haze0, L ? .45 : .2), skT, L ? .16 : .1);
      c.fillStyle = rgb(col); c.beginPath(); c.moveTo(-2, hy + 4);
      for (let x = -2; x <= W + 22; x += 22) { const az = az0 + Math.atan((x - cx) / F); const ii = ((az / TAU * 720) % 360 + 360) % 360, i0 = Math.floor(ii), h = mix(rg[i0], rg[(i0 + 1) % 361], ii - i0); c.lineTo(x, hy - F * Math.tan(h) * (L ? .6 : .4)); }
      c.lineTo(W + 22, hy + 4); c.closePath(); c.fill();
    });
    // ----- terrain: depth bands, far to near -----
    const NS = st.NS, NK = st.NK, NC = NK / 2 + 1, TX = st.TX, TY = st.TY, TC = st.TC;
    const hf = norm([f0, 0, f2]), hr = [hf[2], 0, -hf[0]], cp = Math.cos(pitch), sp = Math.sin(pitch);
    const by = (H - cy) / F, dyb = sp - by * cp, dhb = cp + by * sp;
    const dMin = dyb < -.01 ? Math.max(1.5, E1 / -dyb * dhb * .8) : 4, dMax = 5200;
    const gravel = [146, 112, 84], sand = [198, 164, 120], rockA = [128, 78, 54], rockB = [100, 64, 52], lavaA = [56, 48, 48];
    const colW = W * 1.12 / NK / F * 2, rowK = (dMax / dMin) ** (1 / (NS - 1)) - 1, aerL = fogL * .7; // a colour sample's width per metre of depth; the band spacing
    for (let i = 0; i < NS; i++) {
      const d = dMin * (dMax / dMin) ** (1 - i / (NS - 1));
      const zc0 = Math.max(.6, d * cp - E1 * sp), aer = 1 - Math.exp(-d / aerL), eR = Math.max(.6, zc0 * colW), eF = Math.max(.6, d * rowK);
      for (let k = 0; k <= NK; k++) {
        const sx = -W * .06 + k * (W * 1.12 / NK), u = (sx - cx) / F * zc0;
        const x = E0 + hf[0] * d + hr[0] * u, z = E2 + hf[2] * d + hr[2] * u, h = height(x, z);
        const o = i * (NK + 1) + k;
        if (pj(x, h, z)) { TX[o] = PX; TY[o] = Math.max(-H, Math.min(H * 3, PY)); } else { TX[o] = sx; TY[o] = H * 3; }
        if (k % 2 === 0) {
          const mt = mountain.v, gl = mountain.g; // from the height() just above
          // slope over the sample's own footprint (across a colour sample, toward the next band), so detail finer than that cannot stripe
          const gR = (height(x + hr[0] * eR, z + hr[2] * eR) - h) / eR, gF = (height(x + hf[0] * eF, z + hf[2] * eF) - h) / eF;
          const hx = gR * hr[0] + gF * hf[0], hz = gR * hr[2] + gF * hf[2], nl = Math.hypot(hx, 1, hz);
          let lam = Math.max(0, (-hx * sun[0] + sun[1] - hz * sun[2]) / nl); const sky = .5 + .5 / nl;
          // the sun stays south of the mountain, so out on the plain only the archers' hill can shade a point
          if (lam > 0 && sun[1] > 0 && sun[1] < .5 && (mt > 0 || (Math.abs(x - HILL[0]) < 160 && z > HILL[1] - 60 && z < HILL[1] + 240))) { let sh = 1; for (let m = 0, L = 10; m < 4; m++, L *= 2.8) { const q = height(x + sun[0] * L, z + sun[2] * L) - (h + .5 + sun[1] * L); if (q > 0) { sh = Math.min(sh, 1 - c01(q / 6)); if (sh <= 0) break; } } lam *= sh; }
          const lava = smooth(c01((Math.sin(x * .006 + 1) * Math.sin(z * .0071 - 2) + .1 * Math.sin(x * .03 + z * .02) - .25) / .2)) * c01((Math.abs(x) - 300) / 200 + c01((-z - 60) / 200));
          const drift = c01(.5 + .45 * Math.sin(x * .0093 + Math.sin(z * .0061) * 2.2) * Math.sin(z * .0117 - x * .0041 + 1) + .3 * Math.sin(x * .031 + z * .022 + Math.sin(z * .019) * 1.5) * Math.sin(z * .027 - x * .013)); // pale drifted sand over darker gravel
          const al = lerp(lerp(lerp(gravel, sand, drift), lavaA, lava), lerp(rockA, rockB, c01(mt / 240)).map((v) => v * (.62 + .55 * gl) * (.9 + .1 * Math.sin(x * .0042 + z * .003))), c01(mt / 25));
          const lit = [0, 1, 2].map((j) => al[j] / 255 * (amb[j] * sky * .75 + sunC[j] * lam * 1.45 * direct));
          const hz2 = lerp(hazeAt(x - E0, z - E2), skH, .3), fa = Math.min(.96, aer * (1 - .12 * c01(h / 250))), n = (i * NC + k / 2) * 3;
          TC[n] = mix(lit[0], hz2[0], fa); TC[n + 1] = mix(lit[1], hz2[1], fa); TC[n + 2] = mix(lit[2], hz2[2], fa);
        }
      }
    }
    terrainRaster(st, c, W, H, NS, NK, 2, TX, TY, TC, .12);
    const sandLit = [140, 114, 90].map((v, j) => v / 255 * (amb[j] * .8 + sunC[j] * Math.max(0, sun[1]) * 1.2 * day));
    c.lineJoin = 'round'; c.lineCap = 'round';
    // ground: gravel and stones near the camera; black lava stones out on the flanks
    c.lineWidth = 1;
    [0, 1].forEach((pass) => {
      c.strokeStyle = pass ? rgb(lerp(sandLit, [255, 240, 210], .3), .2) : rgb(lerp(sandLit, [16, 12, 10], .6), .28);
      c.beginPath();
      st.marks.forEach(([x, z, q, k]) => {
        if ((k > .55) !== !!pass || !pj(x, height(x, z), z) || PZ > 260) return;
        const L = (.3 + q * .9) * F / PZ; if (PX < -L || PX > W + L || PY > H + 2 || PY < hy) return;
        c.moveTo(PX - L, PY); c.lineTo(PX + L, PY);
      });
      c.stroke();
    });
    const sunSide = Math.sign(r0 * sun[0] + r2 * sun[2]) || 1, rockP = new Path2D();
    st.rocks.forEach(([x, z, r, k, h]) => { if (!pj(x, h, z)) return; const s = F / PZ * r; if (s < .6 || PX < -s * 2 || PX > W + s * 2 || PY > H + s) return; rockP.moveTo(PX + s * (1 + k * .3), PY); rockP.ellipse(PX, PY, s * (1 + k * .3), s * (.5 + k * .3), 0, 0, Math.PI, true); });
    c.fillStyle = rgb(lerp([28, 24, 26], haze0, .15)); c.fill(rockP);

    // ----- the people -----
    const towardN = Math.sign(r2) || 1; // +z (north, the mountain) lies to the right of the screen when r2 > 0
    const shadowP = new Path2D(), rimP = new Path2D(), legP = new Path2D(), spearP = new Path2D(), fallP = new Path2D();
    const BANDS = [90, 260, 700], body = [BANDS.map(() => new Path2D()), BANDS.map(() => new Path2D())];
    const sl = Math.max(.32, Math.tan(Math.max(.01, se))), shn = Math.hypot(sun[0], sun[2]) || 1, shx = -sun[0] / shn / sl, shz = -sun[2] / shn / sl;
    const draw = (side, kind, x, z, dir, ph, moving, hs, rot = 0) => {
      const y0 = height(x, z);
      if (!pj(x, y0, z)) return; const bx = PX, by0 = PY, zc = PZ;
      if (bx < -60 || bx > W + 60 || by0 < -40 || by0 > H + 80) return;
      const s = F / zc, sv = s * (1 - Math.abs(sp) * .5) * hs;
      const ht = kind === 2 ? 2.4 : kind === 5 ? 1.9 : kind === 4 ? 1.4 : 1.75;
      const pa = body[side][zc < BANDS[0] ? 0 : zc < BANDS[1] ? 1 : 2];
      const hpx = ht * sv;
      if (day > .3 && hpx > 20 && kind !== 5 && pj(x + shx * ht, y0, z + shz * ht)) { shadowP.moveTo(bx, by0); shadowP.lineTo(PX, PY); }
      if (hpx < 7) { const w = Math.max(.9, (kind >= 2 ? 1.8 : .5) * s); pa.rect(bx - w / 2, by0 - Math.max(1.2, hpx), w, Math.max(1.2, hpx)); return; }
      if (kind < 2) {
        const lean = moving ? .1 : 0, bob = moving ? Math.abs(Math.sin(ph)) * .04 * sv : 0, alt = (ph * 7 | 0) & 1, sh = hpx < 30 && !rot ? MANS : alt ? MAN2 : MAN;
        poly(pa, sh, bx, by0 - bob, s, sv, dir, rot, lean);
        if (rot) return;
        if (kind === 1) { const sa = Math.sin(ph * 3.1) * .25; spearP.moveTo(bx + (.2 - sa * .3) * s * dir, by0 - .45 * sv); spearP.lineTo(bx + (.3 + lean * 2.6 + sa) * s * dir, by0 - (2.9 + sa * .3) * sv); }
        if (hpx >= 30) { const [i0, i1] = (dir * sunSide > 0 ? RIMF : RIMB)[alt]; for (let i = i0; i <= i1; i++) { const u = (sh[i * 2] + lean * sh[i * 2 + 1]) * dir, X = bx + u * s, Y = by0 - bob - sh[i * 2 + 1] * sv; i === i0 ? rimP.moveTo(X, Y) : rimP.lineTo(X, Y); } }
      } else if (kind === 2) {
        poly(pa, HORSE, bx, by0, s, sv, dir); poly(pa, RIDER, bx - .1 * s * dir, by0, s, sv, dir);
        const sw = moving ? .5 : .08;
        [[.62, 0], [.74, 1.6], [-.74, 3.1], [-.86, 4.7]].forEach(([hu, o]) => { const a = Math.sin(ph + o) * sw; legP.moveTo(bx + hu * s * dir, by0 - 1.12 * sv); legP.lineTo(bx + (hu + a * .5) * s * dir, by0 - .52 * sv + Math.abs(a) * .2 * sv); legP.lineTo(bx + (hu + a * .3) * s * dir, by0); });
        spearP.moveTo(bx - .1 * s * dir, by0 - 1.9 * sv); spearP.lineTo(bx + 1.6 * s * dir, by0 - 3.2 * sv);
      } else poly(pa, kind === 4 ? KNEEL : TENT, bx, by0, s, sv, dir);
    };
    const lie = (x, z, a) => {
      const ca = Math.cos(a), sa = Math.sin(a), y = height(x, z) + .2, pts = [];
      for (const [u, v] of [[-1.05, -.34], [1.05, -.34], [1.05, .34], [-1.05, .34]]) { if (!pj(x + ca * u - sa * v, y, z + sa * u + ca * v)) return; pts.push(PX, PY); }
      fallP.moveTo(pts[0], pts[1]); fallP.lineTo(pts[2], pts[3]); fallP.lineTo(pts[4], pts[5]); fallP.lineTo(pts[6], pts[7]); fallP.closePath();
    };
    // Ali: in the front rank; then at the edge of the few around the Prophet, turning to meet each rush
    const adv = (o) => ease.io(seg(p, .14 + o.d, .23 + o.d));
    const P0 = [10, 545], Pk = smooth(seg(p, .14, .23)), Pg = smooth(seg(p, .63, .71));
    const PR = [mix(mix(P0[0], K[0], Pk), GORGE[0] + 6, Pg), 0, mix(mix(P0[1], K[1], Pk), GORGE[1] - 8, Pg)];
    const rush = [[.455, .49, 0], [.49, .525, 1], [.525, .56, 2], [.56, .6, 3]]; // [start, end, group]
    const GA = [-2.5, -1.25, .15, 1.45];
    let aliAng = GA[0], press = 0;
    rush.forEach(([a, b, g]) => { if (p >= a - .012) aliAng = GA[g]; });
    for (let j = 1; j < rush.length; j++) { const [a] = rush[j], k = smooth(seg(p, a - .012, a + .004)); if (k > 0 && k < 1) aliAng = mix(GA[rush[j - 1][2]], GA[rush[j][2]], k); }
    rush.forEach(([a, b]) => { press = Math.max(press, Math.sin(Math.PI * seg(p, a, b))); });
    const knotOn = smooth(seg(p, .4, .45)) * (1 - smooth(seg(p, .61, .64)));
    const aliR = 6.5 + 2.5 * press;
    let A;
    { const ka = [PR[0] + Math.cos(aliAng) * aliR, PR[2] + Math.sin(aliAng) * aliR], front = [-36, mix(530, 390, Pk)];
      const k1 = smooth(seg(p, .38, .44)), k2 = Pg;
      A = [mix(mix(front[0], ka[0], k1), PR[0] + 5, k2), 1.3, mix(mix(front[1], ka[1], k1), PR[2] - 4, k2)]; void knotOn; }
    // positions
    const F_ = st.F, rout = smooth(seg(p, .385, .5)), back = smooth(seg(p, .64, .74));
    for (let i = 0; i < F_.length; i++) {
      const o = F_[i];
      let x = o.x0, z = o.z0, moving = false, dir = o.dir || (o.side ? towardN : -towardN), rot = 0;
      if (!o.fix) {
        if (o.side === 0 && o.archer) {
          const dn = smooth(seg(p, .215 + o.d, .305 + o.d));
          if (o.stay) { if (p > .345 + o.d * .4) { lie(o.x0, o.z0, o.ph); continue; } }
          else { x = mix(o.x0, o.x1, dn); z = mix(o.z0, o.z1, dn); moving = dn > 0 && dn < 1; dir = dn > 0 ? -towardN : dir; }
          const r = ease.io(seg(p, .4 + o.d2, .5 + o.d2)); if (r > 0 && !o.stay) { x = mix(x, o.x2, r); z = mix(z, o.z2, r); moving = r < 1; }
          if (back > 0 && !o.stay) { x = mix(x, o.x3, back); z = mix(z, o.z3, back); moving = back < 1; dir = towardN; }
        } else if (o.side === 0) {
          const a = adv(o); x = mix(o.x0, o.x1, a); z = mix(o.z0, o.z1, a); moving = a > 0 && a < 1;
          if (fight > 0 && !o.knot) { x += Math.sin(t * 2 + o.ph + p * 60) * .5 * fight; }
          const r = o.knot ? smooth(seg(p, .4, .46)) : ease.io(seg(p, .385 + o.d2, .5 + o.d2));
          if (r > 0) {
            let tx = o.x2, tz = o.z2; if (o.knot) { tx = PR[0] + (o.x2 - K[0]); tz = PR[2] + (o.z2 - K[1]); }
            x = mix(x, tx, r); z = mix(z, tz, r); moving = r < 1; if (!o.knot) dir = Math.sign((tx - o.x1) * r0 + (tz - o.z1) * r2) || dir;
          }
          if (o.knot && Pg > 0) { x = mix(x, GORGE[0] + (o.x2 - K[0]) * 1.2, Pg); z = mix(z, GORGE[1] + (o.z2 - K[1]) * 1.2, Pg); moving = Pg < 1; }
          if (!o.knot && back > 0) { x = mix(x, o.x3, back); z = mix(z, o.z3, back); moving = back < 1; dir = towardN; }
        } else if (o.horse) {
          const u = smooth(seg(p, .28 + o.lag, .4 + o.lag)), q = u > 0 ? sweepAt(u) : null;
          if (q) { const q2 = sweepAt(Math.min(1, u + .02)), dx = q2[0] - q[0], dz = q2[1] - q[1], dl = Math.hypot(dx, dz) || 1; x = mix(o.x0, q[0] + (-dz / dl) * o.off, smooth(c01(u * 8))); z = mix(o.z0, q[1] + (dx / dl) * o.off, smooth(c01(u * 8))); moving = u < 1; dir = Math.sign(dx * r0 + dz * r2) || dir; }
          if (u >= 1) { const m = smooth(seg(p, .4 + o.lag, .46 + o.lag)); x = mix(x, o.x2, m); z = mix(z, o.z2, m); moving = m < 1; x += Math.sin(t * 1.5 + o.ph + p * 70) * 1.5 * fight; }
          if (back > 0) { x = mix(x, o.x3, back); z = mix(z, o.z3, back); moving = back < 1; dir = -towardN; }
        } else {
          const a = ease.io(seg(p, .15 + o.d, .25 + o.d)); x = mix(o.x0, o.x1, a); z = mix(o.z0, o.z1, a); moving = a > 0 && a < 1; if (a > 0 && a < 1) dir = -towardN;
          const r = ease.io(seg(p, .38 + o.d2, .5 + o.d2));
          if (r > 0) { x = mix(x, o.x2, r); z = mix(z, o.z2, r); moving = r < 1; dir = towardN; }
          if (o.grp >= 0) { // a rush at the few around the Prophet, met and turned at its edge
            const [ra, rb] = rush[o.grp], come = smooth(seg(p, ra - .03, ra + .012)), turn = smooth(seg(p, ra + .014, rb));
            const rr = mix(30 + o.gr * 10, 11 + o.gr * 3, come) + turn * (16 + o.gr * 10), an = o.ga;
            const kx = PR[0] + Math.cos(an) * rr, kz = PR[2] + Math.sin(an) * rr, on = smooth(seg(p, ra - .05, ra - .02)) * (1 - smooth(seg(p, rb, rb + .03)));
            x = mix(x, kx, on); z = mix(z, kz, on); moving = moving || (on > 0 && on < 1) || (come > 0 && come < 1) || (turn > 0 && turn < 1);
            if (on > .5) dir = Math.sign((PR[0] - kx) * r0 + (PR[2] - kz) * r2) || dir;
          } else if (fight > 0) { x += Math.sin(t * 2 + o.ph + p * 60) * .8 * fight; z += Math.cos(t * 1.7 + o.ph + p * 50) * .8 * fight; }
          if (back > 0) { x = mix(x, o.x3, back); z = mix(z, o.z3, back); moving = back < 1; dir = -towardN; if (back >= 1) continue; }
        }
      } else if (back >= 1 && o.side) continue;
      draw(o.side, o.kind, x, z, dir, o.ph + p * 260, moving, o.hs, rot);
    }
    c.lineCap = 'round';
    c.strokeStyle = rgb([30, 20, 14], .14 * day); c.lineWidth = Math.max(1, F / 380); c.stroke(shadowP);
    c.fillStyle = rgb(lerp([22, 15, 12], sandLit, .08), .92); c.fill(fallP);
    const tones = [lerp(sandLit.map((v) => v * .3), [52, 46, 38], .2), lerp(sandLit.map((v) => v * .14), [30, 16, 14], .3)];
    [1, 0].forEach((side) => [2, 1, 0].forEach((b) => { c.fillStyle = rgb(lerp(tones[side], haze0, Math.min(.75, fogOf([30, 170, 520][b])))); c.fill(body[side][b]); }));
    c.strokeStyle = rgb([28, 22, 18], .9); c.lineWidth = Math.max(.7, F / 1600); c.stroke(legP);
    c.strokeStyle = rgb([36, 28, 22], .75); c.lineWidth = .8; c.stroke(spearP);
    c.strokeStyle = rgb(lerp(sunC, [255, 240, 210], .3), .5 * day); c.lineWidth = Math.max(.8, F / 1100); c.lineJoin = 'round'; c.stroke(rimP);
    // banners
    st.ban.forEach(([bx0, bz0, col, side], j) => {
      let x = bx0, z = bz0;
      if (side) { const a = ease.io(seg(p, .15, .25)); z = mix(bz0, bz0 - 140, a); const r = ease.io(seg(p, .38, .5)); z = mix(z, 380 + j * 6, r); x = mix(bx0, bx0 * .7, r); const b2 = smooth(seg(p, .64, .74)); z = mix(z, -300, b2); if (b2 >= 1) return; }
      else { const a = ease.io(seg(p, .14, .23)); z = mix(bz0, bz0 - 140, a); if (j === 1) { const k = smooth(seg(p, .4, .46)); x = mix(x, PR[0] - 3, k); z = mix(z, PR[2] + 2, k); x = mix(x, GORGE[0] + 3, Pg); z = mix(z, GORGE[1] - 6, Pg); } else { const k = smooth(seg(p, .4, .5)); x = mix(x, -150 + j * 40, k); z = mix(z, 690, k); } }
      const y0 = height(x, z); if (!pj(x, y0, z)) return; const bx = PX, by0 = PY, s = F / PZ, fz = fogOf(PZ);
      const L = 4.6 * s * (1 - Math.abs(sp) * .5), tx = bx, ty = by0 - L;
      c.strokeStyle = rgb(lerp([42, 32, 24], haze0, fz)); c.lineWidth = Math.max(.8, .09 * s); c.beginPath(); c.moveTo(bx, by0); c.lineTo(tx, ty); c.stroke();
      const fl = Math.sin(t * 3 + j + p * 40) * .15, w = 1.5 * s, h2 = .95 * s;
      c.fillStyle = rgb(lerp(lerp(col, [20, 18, 22], 1 - day * .8), haze0, fz * .8)); c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + w * .5, ty + h2 * fl, tx + w, ty + h2 * .1 + h2 * fl * 2); c.lineTo(tx + w * .96, ty + h2 * 1.05); c.quadraticCurveTo(tx + w * .5, ty + h2 * (1 + fl), tx, ty + h2); c.closePath(); c.fill();
    });

    // ----- dust -----
    const bc = st.bc, BW = Math.max(8, Math.round(W / 6)), BH = Math.max(8, Math.round(H / 6));
    if (st.bloom.width !== BW || st.bloom.height !== BH) { st.bloom.width = BW; st.bloom.height = BH; }
    bc.setTransform(1, 0, 0, 1, 0, 0); bc.globalCompositeOperation = 'source-over'; bc.clearRect(0, 0, BW, BH); bc.setTransform(BW / W, 0, 0, BH / H, 0, 0);
    st.puffs.forEach(([x, z, born, R0, ph, k]) => {
      const age = (p - born) / .08; if (age <= 0 || age > 2.6) return;
      const a = Math.min(1, age * 2.5) * (1 - c01((age - .9) / 1.7)) * (.4 + .6 * day);
      if (a <= .01) return;
      const y = height(x, z) + 1.5 + age * (3 + k * 6), r = R0 * (.6 + age * .8);
      if (!pj(x + Math.sin(ph + t * .2) * 2 + age * 6, y, z + age * 3)) return; const rr = r * F / PZ;
      const al = a * .42 * (1 - fogOf(PZ) * .4) * c01((PZ - 6) / (r * 2.5 + 10)), bk = c01(1 - Math.hypot(PX - SX, PY - SY) / (W * .7)) * day;
      c.globalAlpha = al * (1 - .5 * bk); c.drawImage(st.puffD, PX - rr * 1.5, PY - rr * .9, rr * 3, rr * 2);
      c.globalAlpha = Math.min(1, al * (.6 + 1.1 * bk) * (.4 + .6 * day)); c.drawImage(st.puff, PX - rr * 1.2 + sunSide * rr * .35, PY - rr * 1.15, rr * 2.4, rr * 1.7);
    });
    c.globalAlpha = 1;
    if (fight > 0) {
      const M = st.motes, n = M.length / 4;
      c.globalCompositeOperation = 'lighter'; c.fillStyle = rgb(lerp(sunC, [255, 240, 210], .3), fight * .45);
      c.beginPath();
      for (let i = 0; i < n; i++) {
        if (!pj(M[i * 4] + Math.sin(t * .3 + M[i * 4 + 3] * 40) * 1.5 + (p - .4) * 30, M[i * 4 + 2] * (.5 + fight) + .5, M[i * 4 + 1])) continue;
        if (PX < 0 || PX > W || PY < 0 || PY > H) continue;
        const s = Math.max(.6, Math.min(2.2, F / PZ * .06)); c.rect(PX, PY, s, s);
      }
      c.fill(); c.globalCompositeOperation = 'source-over';
    }
    // ----- lights -----
    const gl = (x, y, z, r, col, a, min = 0, max = 1e4) => { if (!pj(x, y, z)) return false; const rr = Math.min(max, Math.max(min, r * F / Math.max(PZ, 6))); c.globalAlpha = Math.min(1, a); c.drawImage(tint(col), PX - rr, PY - rr, rr * 2, rr * 2); c.globalAlpha = 1; return true; };
    c.globalCompositeOperation = 'lighter';
    const dusk = smooth(seg(p, .68, .8)), litA = 1 - .55 * smooth(seg(p, .76, .84));
    // the Prophet: the largest, stillest light; the few hold close around it
    const py0 = height(PR[0], PR[2]) + 1.35;
    if (gl(PR[0], py0, PR[2], 16, '#ffe6bc', (.42 + .2 * dusk) * litA, 52, 380)) { gl(PR[0], py0, PR[2], 4.4, '#fff4dc', .85 * litA, 26, 120); gl(PR[0], py0, PR[2], 1.1, '#ffffff', litA, 5, 26); bc.fillStyle = `rgba(255,240,210,${.55 * litA})`; bc.beginPath(); bc.arc(PX, PY, 26, 0, TAU); bc.fill(); }
    // Ali: warm and calm, at the edge of the few; it surges a little toward each rush
    const br = (.94 + .06 * Math.sin(t * 1.3)) * (1 + .25 * press * knotOn) * litA, ay = height(A[0], A[2]);
    if (pj(A[0], ay + .05, A[2])) { const rr = Math.min(260, Math.max(12, 6 * F / Math.max(PZ, 6))); c.save(); c.translate(PX, PY); c.scale(1, .26); c.globalAlpha = .38 * litA; c.drawImage(tint('#ffc880'), -rr, -rr, rr * 2, rr * 2); c.restore(); c.globalAlpha = 1; }
    if (gl(A[0], ay + A[1], A[2], 4.5, '#ffb468', .34 * br, 14, 120)) { gl(A[0], ay + A[1], A[2], 1.4, '#ffd896', .8 * br, 5, 36); gl(A[0], ay + A[1], A[2], .35, '#fff6e6', Math.min(1, br), 2.2, 9); bc.fillStyle = `rgba(255,210,150,${.7 * litA})`; bc.beginPath(); bc.arc(PX, PY, 22, 0, TAU); bc.fill(); }
    // each rush is turned with one small soft flash at the edge
    rush.forEach(([a, b, g]) => { const f = Math.max(0, 1 - Math.abs(p - (a + .014)) / .008); if (f > 0) gl(PR[0] + Math.cos(GA[g]) * 10, 1.4 + height(PR[0], PR[2]), PR[2] + Math.sin(GA[g]) * 10, 3, '#fff0d2', .6 * f, 14, 120); });
    c.globalAlpha = .7; c.drawImage(st.bloom, 0, 0, W, H); c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    // ----- grade: nightfall and a gentle vignette -----
    if (dusk > 0) { c.fillStyle = `rgba(6,8,18,${.32 * dusk})`; c.fillRect(0, 0, W, H); }
    const vg = c.createRadialGradient(W / 2, H * .55, Math.min(W, H) * .3, W / 2, H * .55, Math.hypot(W, H) * .62);
    vg.addColorStop(0, 'rgba(8,8,10,0)'); vg.addColorStop(1, 'rgba(6,6,9,.58)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    // the label on the archers' hill follows the camera
    if (st.tag) { const hy0 = HILL[4] + 2; if (pj(HILL[0], hy0, HILL[1]) && PX > 0 && PX < W && PY > 0 && PY < H) { st.tag.style.left = `${PX.toFixed(1)}px`; st.tag.style.top = `${PY.toFixed(1)}px`; st.tag.style.visibility = ''; } else st.tag.style.visibility = 'hidden'; }
  },
};
})();
