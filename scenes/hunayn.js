(() => {
// hunayn: the valley of Hunayn, Shawwal 8 AH, at grey dawn (al-Irshad 1:140-141). Ten thousand march down into a
// narrow wadi in the half-light; Hawazin rise on the slopes and the arrows come down; the army breaks and floods
// back up the valley. Ten stay with the Prophet's light: nine of Banu Hashim, Ali's light in front with the sword,
// and Ayman ibn Umm Ayman, who falls. Then the army turns and comes back, the ambush breaks, the sun clears the rim.
// A pinhole camera over a small world in metres: x across the valley, y up, z down the valley toward the sunrise.
// The terrain is a heightfield drawn as camera-facing depth bands, far to near (the uhud renderer). People are small
// faceless silhouettes; the Prophet and the ten are lights only.
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
const hash = (i, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

// ---------- the land: a wadi between steep rocky walls, its floor falling gently toward the east ----------
const rr = (v, e) => 1 + e - Math.sqrt(Math.sin(v) ** 2 + e * e); // a ridge: 1 on rounded crests (width e), about e in the hollows
const cxv = (z) => 46 * Math.sin(z * .0016 + .3) + 18 * Math.sin(z * .0043 + 1);
const yf = (z) => -.05 * z;
const hwv = (z) => 54 + 20 * Math.sin(z * .0027 + 2.2) - 18 * Math.exp(-(((z - 600) / 170) ** 2));
const runOf = (z, side) => 64 + 18 * Math.sin(z * .004 + side * 2);
function height(x, z) {
  const c = cxv(z), side = x > c ? 1 : -1, d = Math.abs(x - c) - hwv(z);
  let h = yf(z) + .5 * Math.sin(x * .05 + z * .03) * Math.sin(z * .021);
  if (d > 0) {
    const Hs = 160 + 50 * Math.sin(z * .0021 + side * 1.7) + 28 * Math.sin(z * .0067 + side), k = d / runOf(z, side);
    const gul = rr(z * .013 + side * 1.3 + Math.sin(z * .003) * 2, .3) ** 2;
    h += Hs * (1 - Math.exp(-(k ** 1.7))) * (1 - .2 * gul * c01(1 - k / 3)) + 14 * rr(x * .031 + z * .017 + Math.sin(z * .011) * 1.2, .35) ** 2 * c01(k) + 7 * rr(x * .093 + z * .061, .45) ** 2 * c01(k) + 5 * Math.sin(x * .13 + z * .07) * c01(k * 2);
  }
  return h;
}
const KZ = 470, KN = [cxv(KZ), yf(KZ), KZ]; // where the ten stood around the Prophet
// ---------- camera keys: [p, eye, look]; heights are above the valley floor at that z ----------
const CAM = [
  [-.06, [-28, 92, -500], [6, 8, 520]],
  [0, [-26, 88, -480], [6, 6, 540]],
  [.11, [-34, 54, -250], [14, 2, 640]],
  [.19, [-16, 30, 180], [52, 58, 760]],
  [.255, [22, 16, 300], [-34, 46, 690]],
  [.29, [28, 13, 360], [-16, 8, 560]],
  [.325, [15, 6, 402], [-3, 3, 520]],
  [.41, [10, 4.2, 428], [-3, 3, 520]],
  [.49, [-10, 4.4, 431], [3, 3, 520]],
  [.57, [-15, 8, 400], [0, 4, 530]],
  [.635, [-10, 22, 330], [2, 0, 640]],
  [.71, [-12, 32, 320], [4, 0, 700]],
  [.77, [8, 40, 210], [0, 8, 1000]],
  [.88, [2, 52, 120], [0, 62, 1700]],
  [1.06, [0, 56, 100], [0, 66, 1700]],
];
function camAt(p) {
  let i = 0; while (i < CAM.length - 2 && p > CAM[i + 1][0]) i++;
  const u = i + smooth(c01((p - CAM[i][0]) / (CAM[i + 1][0] - CAM[i][0])));
  const e = crv(CAM.map((k) => k[1]), u), l = crv(CAM.map((k) => k[2]), u);
  e[1] += yf(e[2]); l[1] += yf(l[2]); e[0] += cxv(e[2]); l[0] += cxv(l[2]);
  return { eye: e, look: l };
}
// ---------- light keys: p, sky top, sky mid, horizon, sun colour, ambient, haze, sun elevation (deg), fog length ----------
const LK = [
  [-.06, [26, 32, 52], [62, 70, 92], [118, 116, 126], [255, 180, 130], [76, 84, 110], [84, 90, 108], -9, 1100],
  [.3, [30, 36, 58], [72, 80, 102], [138, 130, 136], [255, 186, 136], [84, 92, 116], [94, 100, 116], -6.5, 1000],
  [.55, [38, 46, 70], [94, 100, 118], [170, 150, 142], [255, 190, 140], [94, 100, 120], [108, 110, 122], -4, 1100],
  [.72, [50, 62, 92], [126, 124, 134], [214, 170, 134], [255, 196, 140], [94, 96, 112], [128, 124, 128], -1.5, 1500],
  [.86, [64, 88, 128], [160, 152, 150], [246, 202, 150], [255, 210, 150], [112, 108, 116], [156, 146, 140], 1.6, 2200],
  [1.06, [72, 98, 140], [170, 164, 160], [248, 214, 168], [255, 222, 170], [124, 118, 122], [168, 158, 150], 4.5, 2600],
];
const SAZ = .06; // the sun comes up over the far end of the valley

// ---------- silhouettes (u across, v up, metres; facing +u) ----------
const MAN = [-.34, 0, -.27, .55, -.2, 1.0, -.25, 1.3, -.21, 1.42, -.17, 1.5, -.16, 1.62, -.1, 1.74, .02, 1.78, .11, 1.7, .12, 1.58, .08, 1.5, .2, 1.42, .24, 1.25, .19, 1.0, .26, .55, .32, 0];
const RUN = [-.55, 0, -.3, .5, -.14, .95, -.22, 1.3, -.1, 1.46, -.06, 1.6, .04, 1.72, .16, 1.66, .18, 1.52, .3, 1.38, .32, 1.15, .2, .95, .3, .5, .6, .05, .44, 0, .08, .62, -.12, .5];
const MANS = [-.3, 0, -.22, 1.3, -.12, 1.5, -.08, 1.76, .08, 1.76, .12, 1.5, .22, 1.3, .3, 0];
const CROUCH = [-.5, 0, -.45, .5, -.2, .9, .05, 1.02, .2, .95, .3, .7, .45, .4, .5, 0];
const HORSE = [-1.14, 1.3, -.98, 1.5, -.3, 1.46, .42, 1.56, .66, 1.76, .9, 2.06, 1.02, 2.1, 1.3, 1.86, 1.3, 1.75, 1.16, 1.73, .96, 1.84, .82, 1.42, .78, 1.16, .2, 1.02, -.6, 1.05, -.96, 1.14, -1.04, .98, -1.2, 1.06];
const RIDER = [-.24, 1.48, -.22, 1.95, -.14, 2.12, -.13, 2.26, -.06, 2.37, .05, 2.37, .11, 2.26, .12, 2.12, .2, 1.95, .24, 1.48];
const CAMEL = [-1.3, 1.25, -1.25, 1.75, -.6, 2.2, -.1, 2.1, .3, 1.8, .6, 1.9, .85, 2.55, 1.15, 2.65, 1.25, 2.45, 1.05, 2.35, .95, 1.7, .9, 1.2];
const LIE = [-.9, 0, -.85, .22, .9, .26, .95, 0];
const poly = (pa, sh, bx, by, s, sv, dir, lean = 0) => {
  for (let i = 0; i < sh.length; i += 2) { const X = bx + (sh[i] + lean * sh[i + 1]) * dir * s, Y = by - sh[i + 1] * sv; i ? pa.lineTo(X, Y) : pa.moveTo(X, Y); }
  pa.closePath();
};

S.hunayn = {
  init(el, st) {
    st.cv = el.querySelector('canvas');
    st.c = st.cv.getContext('2d');
    st.bloom = mk(8, 8); st.bc = st.bloom.getContext('2d');
    st.puff = sprite([[0, 'rgba(128,118,108,.8)'], [.5, 'rgba(122,112,104,.3)'], [1, 'rgba(118,108,100,0)']]);
    st.mist = sprite([[0, 'rgba(150,156,172,.7)'], [.5, 'rgba(146,152,168,.28)'], [1, 'rgba(140,146,164,0)']]);
    st.glow = sprite([[0, 'rgba(255,255,255,1)'], [.16, 'rgba(255,255,255,.55)'], [.42, 'rgba(255,255,255,.14)'], [1, 'rgba(255,255,255,0)']], 128);
    st.tints = {};
    const R = rng(808);
    const gs = () => (R() + R() + R() - 1.5) / 1.5;
    st.noise = mk(160, 160);
    { const ng = st.noise.getContext('2d'), id = ng.createImageData(160, 160); for (let i = 0; i < id.data.length; i += 4) { const v = R() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 22; } ng.putImageData(id, 0, 0); }
    st.NS = 64; st.NK = 84;
    st.TX = new Float32Array(st.NS * (st.NK + 1)); st.TY = new Float32Array(st.NS * (st.NK + 1));
    st.TC = new Float32Array(st.NS * (st.NK / 2 + 1) * 3);
    st.stars = Array.from({ length: 260 }, () => [(R() - .5) * 3.2, .04 + R() ** .8 * 1.1, R()]);
    st.clouds = Array.from({ length: 16 }, () => [-1.2 + R() * 2.4, .05 + R() * .3, .3 + R() * .8, .015 + R() * .03, .2 + R() * .35]);
    // the wadi bed: pale gravel channels and dark acacia
    st.bed = Array.from({ length: 2400 }, () => { const z = -900 + R() * 2600, l = gs() * .9; return [z, l, R(), R(), cxv(z) + l * hwv(z) * .8, yf(z) + .1]; });
    st.acacia = Array.from({ length: 160 }, () => { const z = -700 + R() * 2400, l = (R() - .5) * 1.7; return [z, l, 1.5 + R() * 2.5, R(), cxv(z) + l * hwv(z) * .9, yf(z)]; });
    // boulders on the lower slopes
    st.rocks = Array.from({ length: 900 }, () => { const side = R() < .5 ? -1 : 1, z = -800 + R() * 2600, k = -.15 + R() ** 1.6 * .8, x = cxv(z) + side * (hwv(z) + k * runOf(z, side)); return [z, side, k, .6 + R() * 2.4, R(), x, height(x, z)]; });
    // ---- the Muslims: ten thousand, drawn as thirty-four hundred ----
    const NM = 3400, NH = 1400;
    st.NM = NM; st.NH = NH;
    const M = [];
    for (let i = 0; i < NM; i++) {
      const s = ((i + R() * .9) / NM) ** 1.35, k = R();
      const kind = k < .1 ? 2 : k < .16 ? 3 : k < .45 ? 1 : 0;
      M.push({ s, lat: gs() * .55, kind, zr: -320 - R() ** .7 * 900, lr: gs() * .85, d1: 0, zb: 560 + R() ** .8 * 520, lb: gs() * .75, d2: R() * .05, ph: R() * TAU, hs: .92 + R() * .16 });
    }
    // front ranks break first: the panic runs back down the column
    M.forEach((m) => { m.d1 = m.s < .17 ? .005 + R() * .12 : .02 + m.s * .09 + R() * .02; m.d2 = .002 + (1 - m.s) * .04 + R() * .02; });
    st.M = M;
    // ---- Hawazin: in hiding on both walls; some come down to the floor ----
    const Hw = [];
    for (let i = 0; i < NH; i++) {
      const side = R() < .5 ? -1 : 1, z = 430 + R() ** .8 * 700, k = .25 + R() ** .9 * 1.6;
      const down = i < 330;
      const a = Math.PI * (.25 + R() * .5) * (R() < .5 ? 1 : -1) + Math.PI / 2; // toward the knot, from in front
      const rr = 20 + R() ** .7 * 60;
      Hw.push({ side, z, k, down, fx: KN[0] + Math.cos(a) * rr * .7 + gs() * 4, fz: KZ + 16 + Math.abs(Math.sin(a)) * rr, rise: .185 + R() * .045, dd: R() * .06, br: .65 + R() * .1, ph: R() * TAU, kind: R() < .3 ? 1 : 0, hs: .9 + R() * .18, fall: down && R() < .25 ? .48 + R() * .2 : 0 });
    }
    st.H = Hw;
    // arrows: from the walls onto the head of the column
    st.arrows = Array.from({ length: 1500 }, () => { const j = Math.floor(R() * NH); return [j, .2 + R() ** 1.3 * .24, gs() * 40, 330 + R() * 360, R()]; });
    // banners
    st.banM = Array.from({ length: 26 }, (_, i) => [Math.floor(R() * NM), i % 3 === 0 ? [222, 214, 190] : i % 3 === 1 ? [46, 110, 84] : [32, 30, 30]]);
    st.banH = Array.from({ length: 16 }, (_, i) => [Math.floor(R() * NH), i % 2 ? [120, 36, 30] : [36, 30, 28]]);
    // the ten around the Prophet's light: Ali in front; eight more of Banu Hashim; Ayman
    st.ten = [];
    for (let i = 0; i < 8; i++) { const a = Math.PI / 2 + Math.PI * (.35 + i / 7 * 1.3); st.ten.push([Math.cos(a) * (4.6 + R() * 1.6), Math.sin(a) * (4.6 + R() * 1.6), R() * TAU]); }
    st.motes = Array.from({ length: 900 }, () => [(R() - .5) * 140, R() ** 1.5 * 40, 300 + R() * 500, R() * TAU, R()]);
    st.puffs = [];
    for (let i = 0; i < 90; i++) st.puffs.push([gs() * .7, 420 - R() * 700, .27 + R() * .16, 8 + R() * 14, R() * TAU]);
    for (let i = 0; i < 50; i++) st.puffs.push([gs() * .5, 520 + R() * 380, .62 + R() * .14, 8 + R() * 12, R() * TAU]);
    st.mistB = Array.from({ length: 80 }, () => [gs() * .6, -600 + R() * 2400, 4 + R() * 18, 40 + R() * 90, R()]);
  },

  frame(p, t, el, st) {
    fit(st.cv);
    const { c, cv } = st;
    const dpr = cv.width / Math.max(1, cv.clientWidth), W = cv.clientWidth, H = cv.clientHeight, phone = W < H * .8;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    const BW = Math.max(8, Math.round(W / 4)), BH = Math.max(8, Math.round(H / 4));
    if (st.bloom.width !== BW || st.bloom.height !== BH) { st.bloom.width = BW; st.bloom.height = BH; }
    const bc = st.bc; bc.setTransform(1, 0, 0, 1, 0, 0); bc.clearRect(0, 0, BW, BH); bc.setTransform(BW / W, 0, 0, BH / H, 0, 0);
    // ----- camera -----
    const { eye, look } = camAt(p);
    if (phone) { const back = mix(1.25, 1.05, smooth(seg(p, .3, .36)) * (1 - smooth(seg(p, .58, .64)))); for (let j = 0; j < 3; j++) eye[j] = look[j] + (eye[j] - look[j]) * back; }
    const fw = norm(sub(look, eye)), rt = norm(cross([0, 1, 0], fw)), up = cross(fw, rt);
    const F = phone ? W * .92 : Math.min(H * 1.25, W * .95), cx = W / 2, cy = H * (phone ? .47 : .52);
    const [E0, E1, E2] = eye, [f0, f1, f2] = fw, [r0, r1, r2] = rt, [u0, u1, u2] = up;
    let PX = 0, PY = 0, PZ = 0;
    const pj = (x, y, z) => { const dx = x - E0, dy = y - E1, dz = z - E2, zc = dx * f0 + dy * f1 + dz * f2; if (zc < .4) return false; const iz = F / zc; PX = cx + (dx * r0 + dy * r1 + dz * r2) * iz; PY = cy - (dx * u0 + dy * u1 + dz * u2) * iz; PZ = zc; return true; };
    // ----- light -----
    const [skT, skM, skH, sunC, amb, haze0, elev, fogL] = keyAt(LK, p);
    const se = elev * Math.PI / 180, sun = [Math.sin(SAZ) * Math.cos(se), Math.sin(se), Math.cos(SAZ) * Math.cos(se)];
    const direct = c01((elev + .3) / 2.5), dawn = c01((elev + 9) / 12);
    const fogOf = (zc) => Math.min(.94, 1 - Math.exp(-zc / fogL));
    const hazeAt = (vx, vz) => { const k = Math.max(0, (vx * sun[0] + vz * sun[2]) / (Math.hypot(vx, vz) || 1)) ** 6; return lerp(haze0, lerp(skH, sunC, .2), k * .75); };
    const pitch = Math.asin(Math.max(-.99, Math.min(.99, f1))), hy = cy + F * Math.tan(pitch);
    const tint = (col) => { if (!st.tints[col]) { const cc = mk(128, 128), g = cc.getContext('2d'); g.drawImage(st.glow, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, 128, 128); st.tints[col] = cc; } return st.tints[col]; };
    // ----- sky -----
    const sg = c.createLinearGradient(0, Math.min(0, hy - F * 1.1), 0, hy);
    sg.addColorStop(0, rgb(skT)); sg.addColorStop(.6, rgb(skM)); sg.addColorStop(1, rgb(skH));
    c.fillStyle = sg; c.fillRect(0, 0, W, H);
    const SD = 1e5;
    let SX = -1e4, SY = -1e4;
    const az0 = Math.atan2(f0, f2);
    const dirP = (az, e2) => pj(E0 + Math.sin(az) * Math.cos(e2) * SD, E1 + Math.sin(e2) * SD, E2 + Math.cos(az) * Math.cos(e2) * SD);
    if (dirP(SAZ, Math.max(se, -.05))) {
      SX = PX; SY = PY;
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(SX, SY, 0, SX, SY, F * 1.3), a = .5 * dawn;
      g.addColorStop(0, rgb(sunC, a)); g.addColorStop(.14, rgb(sunC, a * .4)); g.addColorStop(.5, rgb(sunC, a * .08)); g.addColorStop(1, rgb(sunC, 0));
      c.fillStyle = g; c.fillRect(0, 0, W, hy + 2);
      if (elev > -1) { const r = F * .0085; c.globalAlpha = c01((elev + 1) / 1.5); c.drawImage(tint('#ffe8c0'), SX - r * 12, SY - r * 12, r * 24, r * 24); c.fillStyle = 'rgba(255,248,230,1)'; c.beginPath(); c.arc(SX, SY, r, 0, TAU); c.fill(); c.globalAlpha = 1; bc.fillStyle = `rgba(255,220,160,${.8 * c01((elev + 1) / 1.5)})`; bc.beginPath(); bc.arc(SX, SY, r * 6, 0, TAU); bc.fill(); }
      c.globalCompositeOperation = 'source-over';
    }
    const starA = .55 * (1 - smooth(seg(p, .1, .6)));
    if (starA > 0) { c.fillStyle = '#e8e6dc'; st.stars.forEach(([a, e2, k]) => { if (!dirP(az0 + a * .6, e2) || PX < 0 || PX > W || PY > hy - 6) return; const away = 1 - c01(1 - Math.abs(a) / .6) * .7; c.globalAlpha = starA * away * (.2 + .7 * k) * (.7 + .3 * Math.sin(t * 2 + k * 50)); c.fillRect(PX, PY, k > .9 ? 1.6 : 1, k > .9 ? 1.6 : 1); }); c.globalAlpha = 1; }
    const cl = lerp(lerp(skM, skH, .3), lerp(sunC, [255, 220, 200], .4), dawn * .5);
    st.clouds.forEach(([az, e2, w, h, a]) => {
      if (!dirP(SAZ + az, e2)) return; const x = PX, y = PY, rw = w * F * .5, rh = h * F * .5;
      if (x < -rw || x > W + rw || y > hy) return;
      c.save(); c.translate(x + Math.sin(t * .02 + az * 5) * 8, y); c.scale(rw, rh); const g = c.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, rgb(lerp(cl, sunC, c01(1 - Math.abs(az) / 1.2) * dawn * .5), a * .5)); g.addColorStop(1, rgb(cl, 0)); c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore();
    });
    // ----- terrain: depth bands, far to near -----
    const NS = st.NS, NK = st.NK, NC = NK / 2 + 1, TX = st.TX, TY = st.TY, TC = st.TC;
    const hf = norm([f0, 0, f2]), hr = [hf[2], 0, -hf[0]], cp = Math.cos(pitch), sp = Math.sin(pitch);
    const by = (H - cy) / F, dyb = sp - by * cp, dhb = cp + by * sp;
    const hFloor = height(E0, E2);
    const dMin = dyb < -.01 ? Math.max(1.5, (E1 - hFloor) / -dyb * dhb * .8) : 4, dMax = 6000;
    const bedA = [158, 148, 132], rockA = [98, 86, 80], rockB = [70, 63, 64];
    const colW = W * 1.12 / NK / F * 2, rowK = (dMax / dMin) ** (1 / (NS - 1)) - 1; // a colour sample's width per metre of depth; the band spacing
    for (let i = 0; i < NS; i++) {
      const d = dMin * (dMax / dMin) ** (1 - i / (NS - 1));
      const zc0 = Math.max(.6, d * cp - (E1 - hFloor) * sp), fogK = fogOf(d), eR = Math.max(.8, zc0 * colW), eF = Math.max(.8, d * rowK);
      for (let k = 0; k <= NK; k++) {
        const sx = -W * .06 + k * (W * 1.12 / NK), u = (sx - cx) / F * zc0;
        const x = E0 + hf[0] * d + hr[0] * u, z = E2 + hf[2] * d + hr[2] * u, h = height(x, z);
        const o = i * (NK + 1) + k;
        if (pj(x, h, z)) { TX[o] = PX; TY[o] = Math.max(-H, Math.min(H * 3, PY)); } else { TX[o] = sx; TY[o] = H * 3; }
        if (k % 2 === 0) {
          // slope over the sample's own footprint (across a colour sample, toward the next band), so finer detail cannot stripe
          const gR = (height(x + hr[0] * eR, z + hr[2] * eR) - h) / eR, gF = (height(x + hf[0] * eF, z + hf[2] * eF) - h) / eF;
          const hx = gR * hr[0] + gF * hf[0], hz = gR * hr[2] + gF * hf[2], nl = Math.hypot(hx, 1, hz);
          let lam = Math.max(0, (-hx * sun[0] + sun[1] - hz * sun[2]) / nl);
          if (lam > 0 && direct > 0) { let sh = 1; for (let m = 0, L = 14; m < 5; m++, L *= 2.6) { const q = height(x + sun[0] * L, z + sun[2] * L) - (h + .5 + sun[1] * L); if (q > 0) { sh = Math.min(sh, 1 - c01(q / 8)); if (sh <= 0) break; } } lam *= sh; }
          const sky = .55 + .45 / nl, rel = h - yf(z), steep = c01((nl - 1.05) / .6);
          const al = lerp(lerp(bedA, rockA, c01(rel / 14)), rockB, steep * .6 + .2 * c01(rel / 150)).map((v) => v * (rel > 14 ? .86 + .14 * Math.sin(rel * .3 + x * .012) * Math.sin(rel * .07 + z * .01) : 1));
          const lit = [0, 1, 2].map((j) => al[j] / 255 * (amb[j] * sky * .95 + sunC[j] * lam * 1.4 * direct));
          const hz2 = hazeAt(x - E0, z - E2), fa = fogK * (1 - .35 * c01(rel / 220)), n = (i * NC + k / 2) * 3;
          TC[n] = mix(lit[0], hz2[0], fa); TC[n + 1] = mix(lit[1], hz2[1], fa); TC[n + 2] = mix(lit[2], hz2[2], fa);
        }
      }
    }
    terrainRaster(st, c, W, H, NS, NK, 2, TX, TY, TC);
    // ----- the wadi bed: gravel channels, acacia, boulders on the slopes -----
    const bedLit = bedA.map((v, j) => v / 255 * amb[j]);
    c.lineWidth = 1;
    [0, 1].forEach((pass) => {
      const pa = new Path2D();
      st.bed.forEach(([z, l, q, k, bx, byy]) => {
        if ((k > .5) !== !!pass || !pj(bx, byy, z) || PZ > 900) return;
        const L = (2 + q * 6) * F / PZ; if (PX < -L || PX > W + L || PY > H + 2 || PY < 0) return;
        const a = .25; pa.moveTo(PX - L * a, PY - L * .02); pa.lineTo(PX + L * a, PY + L * .02);
      });
      c.strokeStyle = pass ? rgb(lerp(bedLit, [255, 250, 240], .25), .22) : rgb(lerp(bedLit, [10, 10, 14], .6), .3); c.stroke(pa);
    });
    const rockP = new Path2D(), rimP = new Path2D();
    st.rocks.forEach(([z, side, k, r, q, x, h]) => {
      if (!pj(x, h, z) || PZ > 700) return; const s = F / PZ * r; if (s < .9 || PX < -s * 2 || PX > W + s * 2 || PY > H + s) return;
      const w = s * (1 + q * .5), hh = s * (.5 + q * .4);
      rockP.moveTo(PX - w, PY + hh * .15); rockP.lineTo(PX - w * .7, PY - hh * .6); rockP.lineTo(PX - w * .1, PY - hh); rockP.lineTo(PX + w * .5, PY - hh * .75); rockP.lineTo(PX + w, PY - hh * .1); rockP.lineTo(PX + w * .8, PY + hh * .2); rockP.closePath();
      if (direct > 0) { rimP.moveTo(PX - w * .7, PY - hh * .6); rimP.lineTo(PX - w * .1, PY - hh); rimP.lineTo(PX + w * .5, PY - hh * .75); }
    });
    c.fillStyle = rgb(lerp([34, 31, 34], haze0, .12)); c.fill(rockP);
    if (direct > 0) { c.strokeStyle = rgb(sunC, .35 * direct); c.stroke(rimP); }
    const acP = new Path2D();
    st.acacia.forEach(([z, l, r, q, x, y]) => { if (!pj(x, y, z) || PZ > 1500) return; const s = F / PZ; if (s * r < .8 || PX < -50 || PX > W + 50) return; if (PZ < 35) return; acP.moveTo(PX, PY); acP.lineTo(PX - .1 * r * s, PY - r * .55 * s); acP.moveTo(PX + .1 * r * s, PY); acP.lineTo(PX + .15 * r * s, PY - r * .55 * s); acP.moveTo(PX - r * s, PY - r * .62 * s); acP.quadraticCurveTo(PX - r * .6 * s, PY - r * .9 * s, PX, PY - r * .86 * s); acP.quadraticCurveTo(PX + r * .7 * s, PY - r * .92 * s, PX + r * s, PY - r * .64 * s); acP.closePath(); });
    c.fillStyle = rgb(lerp([28, 30, 28], haze0, .2)); c.fill(acP); c.lineWidth = Math.max(1, F / 1400); c.strokeStyle = rgb(lerp([28, 30, 28], haze0, .2)); c.stroke(acP); c.lineWidth = 1;
    // ----- valley mist, thinning as the sun comes -----
    const mistA = .16 * (1 - smooth(seg(p, .7, .95)));
    if (mistA > .01) {
      const mc = lerp(haze0, skH, .3);
      st.mistB.forEach(([l, z, h, w, q]) => { const x = cxv(z) + l * hwv(z); if (!pj(x, yf(z) + h, z)) return; const s = F / PZ, r = w * s; if (PX < -r * 2 || PX > W + r * 2) return; c.globalAlpha = mistA * (.4 + .6 * q) * c01(1 - PZ / 1000); c.drawImage(st.mist, PX - r * 1.6, PY - r * .3, r * 3.2, r * .6); });
      c.globalAlpha = 1; void mc;
    }
    // ----- positions of the people -----
    const march = ease.io(seg(p, -.06, .235));
    const front = mix(-160, 640, march);
    const knotOn = smooth(seg(p, .25, .3));
    const pushR = 15;
    const M = st.M, H2 = st.H;
    const MX = st.MX || (st.MX = new Float32Array(M.length)), MZ = st.MZ || (st.MZ = new Float32Array(M.length)), MV = st.MV || (st.MV = new Float32Array(M.length));
    for (let i = 0; i < M.length; i++) {
      const m = M[i];
      const z0 = front - m.s * 1100 + Math.sin(m.ph) * 4, x0 = cxv(z0) + m.lat * (hwv(z0) - 10);
      const f = ease.io(seg(p, .255 + m.d1, .43 + m.d1)), g = ease.io(seg(p, .6 + m.d2, .74 + m.d2));
      let z = mix(z0, m.zr, f), x = mix(x0, cxv(m.zr) + m.lr * hwv(m.zr) * .85, f);
      if (g > 0) { z = mix(z, m.zb, g); x = mix(x, cxv(m.zb) + m.lb * (hwv(m.zb) - 10), g); }
      // the flood parts round the few who stand
      if (knotOn > 0) { const dx = x - KN[0], dz = z - KZ, d = Math.hypot(dx, dz * .8); if (d < pushR) { const k = (pushR - d) / pushR * knotOn; x += (dx >= 0 ? 1 : -1) * k * pushR * 1.1; } }
      MX[i] = x; MZ[i] = z; MV[i] = (f > 0 && f < 1) ? -1 : (g > 0 && g < 1) ? 1 : march < 1 ? 1 : 0;
    }
    const HX = st.HX || (st.HX = new Float32Array(H2.length)), HY = st.HY || (st.HY = new Float32Array(H2.length)), HZ = st.HZ || (st.HZ = new Float32Array(H2.length)), HA = st.HA || (st.HA = new Float32Array(H2.length));
    for (let i = 0; i < H2.length; i++) {
      const h = H2[i];
      const rise = smooth(seg(p, h.rise, h.rise + .02));
      let x = cxv(h.z) + h.side * (hwv(h.z) + h.k * runOf(h.z, h.side)), z = h.z;
      if (h.down) { const q = ease.io(seg(p, .3 + h.dd, .42 + h.dd)); x = mix(x, h.fx, q); z = mix(z, h.fz, q); }
      const brk = ease.in(seg(p, h.br, h.br + .14));
      if (brk > 0) { const kk = h.k + brk * 3.2; const zz = z + brk * 160; x = mix(x, cxv(zz) + h.side * (hwv(zz) + kk * runOf(zz, h.side)), brk); z = mix(z, zz, brk); }
      HX[i] = x; HZ[i] = z; HY[i] = height(x, z); HA[i] = rise * (1 - smooth(seg(p, h.br + .09, h.br + .14)));
    }
    // ----- the people: silhouettes near, marks far; three fog bands -----
    const BANDS = [140, 420, 1100], bodies = BANDS.map(() => new Path2D()), hawP = BANDS.map(() => new Path2D()), spearP = new Path2D(), legP = new Path2D(), lieP = new Path2D();
    const draw = (pa, kind, x, z, dir, ph, moving, hs, run, yb) => {
      const y0 = yb ?? height(x, z);
      if (!pj(x, y0, z)) return; const bx = PX, by0 = PY, zc = PZ;
      if (bx < -60 || bx > W + 60 || by0 < -40 || by0 > H + 80) return;
      const s = F / zc, sv = s * (1 - Math.abs(sp) * .45) * hs;
      const ht = kind >= 2 ? 2.4 : 1.75, hpx = ht * sv, band = pa[zc < BANDS[0] ? 0 : zc < BANDS[1] ? 1 : 2];
      if (hpx < 9) { const w = Math.max(.9, (kind >= 2 ? 1.9 : .55) * s); band.rect(bx - w / 2, by0 - Math.max(1.1, hpx), w, Math.max(1.1, hpx)); if (kind >= 2 && hpx > 4) band.rect(bx + w * .3 * dir, by0 - hpx * 1.25, w * .2, hpx * .3); return; }
      if (kind < 2) {
        const bob = moving ? Math.abs(Math.sin(ph)) * .05 * sv : 0;
        poly(band, hpx < 24 ? MANS : run ? RUN : MAN, bx, by0 - bob, s, sv, dir, run ? .12 : 0);
        if (kind === 1) { const sa = Math.sin(ph * 3.1) * .2; spearP.moveTo(bx + (.15 - sa * .3) * s * dir, by0 - .45 * sv); spearP.lineTo(bx + (run ? -.9 : .3 + sa) * s * dir, by0 - (run ? 2.2 : 2.9) * sv); }
      } else {
        poly(band, kind === 3 ? CAMEL : HORSE, bx, by0, s, sv, dir); poly(band, RIDER, bx - .1 * s * dir + (kind === 3 ? .1 * s * dir : 0), by0 - (kind === 3 ? .55 * sv : 0), s, sv, dir);
        const sw = moving ? .5 : .08, hh = kind === 3 ? 1.25 : 1.12;
        [[.62, 0], [.74, 1.6], [-.74, 3.1], [-.86, 4.7]].forEach(([hu, o]) => { const a = Math.sin(ph + o) * sw; legP.moveTo(bx + hu * s * dir, by0 - hh * sv); legP.lineTo(bx + (hu + a * .5) * s * dir, by0 - .52 * sv + Math.abs(a) * .2 * sv); legP.lineTo(bx + (hu + a * .3) * s * dir, by0); });
      }
    };
    const walkPh = (i, sp2) => st.M[i % st.M.length].ph + p * sp2;
    // depth order: far to near, for both armies together
    const order = st.order || (st.order = new Int32Array(M.length + H2.length)), dist = st.dist || (st.dist = new Float32Array(M.length + H2.length));
    for (let i = 0; i < M.length; i++) { order[i] = i; dist[i] = (MX[i] - E0) * f0 + (MZ[i] - E2) * f2; }
    for (let i = 0; i < H2.length; i++) { order[M.length + i] = M.length + i; dist[M.length + i] = (HX[i] - E0) * f0 + (HZ[i] - E2) * f2; }
    const far = [], near = [];
    for (let i = 0; i < order.length; i++) (dist[i] < BANDS[0] ? near : far).push(i);
    near.sort((a, b) => dist[b] - dist[a]);
    const ord = far.concat(near);
    const towardR = (vx, vz) => (vx * r0 + vz * r2 >= 0 ? 1 : -1);
    for (const j of ord) {
      if (dist[j] < .4) continue;
      if (j < M.length) {
        const m = M[j], v = MV[j], fleeing = v < 0;
        const dir = fleeing ? towardR(0, -1) : towardR(0, 1);
        draw(bodies, m.kind, MX[j], MZ[j], dir, walkPh(j, fleeing ? 900 : 420), v !== 0, m.hs, fleeing, yf(MZ[j]));
      } else {
        const i = j - M.length, h = H2[i]; if (HA[i] <= .02) continue;
        const fallen = h.fall && p > h.fall;
        if (fallen) { if (pj(HX[i], HY[i], HZ[i])) { const s = F / PZ; if (s > 3) poly(lieP, LIE, PX, PY, s, s, 1); } continue; }
        const crouch = 1 - smooth(seg(p, h.rise, h.rise + .015));
        const kind = crouch > .5 ? 4 : h.kind, dir = h.side > 0 ? towardR(-1, 0) : towardR(1, 0);
        if (kind === 4) { if (pj(HX[i], HY[i], HZ[i])) { const s = F / PZ; if (s * 1 > 6) poly(hawP[PZ < BANDS[0] ? 0 : PZ < BANDS[1] ? 1 : 2], CROUCH, PX, PY, s, s, dir); } continue; }
        draw(hawP, h.kind, HX[i], HZ[i], dir, h.ph + p * 300, h.down && p > .3 && p < .45, h.hs, false, HY[i]);
      }
    }
    const fogC = lerp(haze0, skH, .2);
    const mCol = lerp([36, 34, 38], [24, 22, 24], dawn), hCol = lerp([44, 30, 30], [40, 24, 22], dawn);
    BANDS.forEach((b, k) => { const f = k === 0 ? .08 : k === 1 ? fogOf(300) * .6 : fogOf(800) * .75; c.fillStyle = rgb(lerp(hCol, fogC, f)); c.fill(hawP[k]); c.fillStyle = rgb(lerp(mCol, fogC, f)); c.fill(bodies[k]); });
    c.strokeStyle = rgb(lerp(mCol, fogC, .1)); c.lineWidth = Math.max(1, F / 1600); c.stroke(legP); c.stroke(spearP);
    c.fillStyle = rgb(lerp(hCol, fogC, .2)); c.fill(lieP);
    // banners on their poles
    const flag = (x, z, col, j, a) => { const y0 = height(x, z); if (!pj(x, y0 + 1.6, z) || PZ < 30) return; const X0 = PX, Y0 = PY, s = F / PZ; if (!pj(x, y0 + 6.5, z)) return; const Y1 = PY, f = fogOf(PZ) * .7, fl = .8 + .2 * Math.sin(t * 3 + j); c.globalAlpha = a; c.strokeStyle = rgb(lerp([36, 30, 26], fogC, f)); c.lineWidth = Math.max(.8, .12 * s); c.beginPath(); c.moveTo(X0, Y0); c.lineTo(PX, Y1); c.stroke(); c.fillStyle = rgb(lerp(col, fogC, f)); c.beginPath(); c.moveTo(PX, Y1); c.lineTo(PX + 2.2 * s * fl * (j % 2 ? 1 : -1), Y1 + .5 * s); c.lineTo(PX, Y1 + 1.4 * s); c.closePath(); c.fill(); c.globalAlpha = 1; };
    st.banM.forEach(([i, col], j) => flag(MX[i], MZ[i], col, j, 1));
    st.banH.forEach(([i, col], j) => { if (HA[i] > .05) flag(HX[i], HZ[i], col, j, HA[i]); });
    // dust of the rout and of the return
    st.puffs.forEach(([l, z, a, r0p, ph]) => { const k = Math.sin(Math.PI * seg(p, a, a + .14)); if (k <= 0) return; const zz = z + (a > .5 ? 1 : -1) * seg(p, a, a + .14) * 80, x = cxv(zz) + l * hwv(zz); if (!pj(x, yf(zz) + 3, zz)) return; const s = F / PZ, r = r0p * s * (1 + .6 * seg(p, a, a + .14)); c.globalAlpha = .2 * k * c01(1 - PZ / 1200); c.drawImage(st.puff, PX - r * 1.5, PY - r, r * 3, r * 1.6); });
    c.globalAlpha = 1;
    // ----- the arrows: dark shafts against the sky, pale against the rock -----
    const arP = new Path2D();
    st.arrows.forEach(([j, a, ox, tz, q]) => {
      const u = (p - a) / .026; if (u <= 0 || u >= 1) return;
      const h = H2[j]; if (h.down && p > .3) return;
      const sx0 = HX[j], sz0 = HZ[j], sy0 = HY[j] + 1.6, tzz = tz + q * 40, tx = cxv(tzz) + ox * .9, ty = yf(tzz);
      const arc = 18 + Math.hypot(tx - sx0, tzz - sz0) * .18;
      const P = (v) => [mix(sx0, tx, v), mix(sy0, ty, v) + arc * 4 * v * (1 - v), mix(sz0, tzz, v)];
      const A = P(Math.max(0, u - .05)), B = P(u);
      if (!pj(A[0], A[1], A[2])) return; const ax = PX, ay = PY; if (!pj(B[0], B[1], B[2])) return;
      arP.moveTo(ax, ay); arP.lineTo(PX, PY);
    });
    c.lineCap = 'round'; c.lineWidth = Math.max(1, F / 1100); c.strokeStyle = rgb(lerp([22, 20, 24], haze0, .15), .85); c.stroke(arP);
    c.lineWidth = Math.max(.5, F / 2600); c.strokeStyle = rgb([226, 222, 210], .35); c.stroke(arP);
    // ----- the Prophet's light and the ten -----
    const halo = (x, y, z, size, k, col) => {
      if (k <= 0 || !pj(x, y, z)) return; const s = F / PZ, X = PX, Y = PY, Rr = Math.min(H * .09 * size, Math.max(1.8, size * s));
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.min(1, .4 * k); c.drawImage(tint(rgb(col)), X - Rr * 7, Y - Rr * 7, Rr * 14, Rr * 14);
      c.globalAlpha = Math.min(1, .75 * k); c.drawImage(tint(rgb(lerp(col, [255, 255, 250], .5))), X - Rr * 1.5, Y - Rr * 1.5, Rr * 3, Rr * 3);
      c.globalAlpha = Math.min(1, k); c.fillStyle = 'rgba(255,252,242,1)'; c.beginPath(); c.arc(X, Y, Rr * .26, 0, TAU); c.fill();
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      bc.fillStyle = rgb(col, Math.min(1, .45 * k)); bc.beginPath(); bc.arc(X, Y, Rr * 2.4, 0, TAU); bc.fill();
    };
    const pool = (x, z, r, k, col) => { if (k <= 0 || !pj(x, height(x, z) + .05, z)) return; const s = F / PZ, rr = r * s; c.save(); c.translate(PX, PY); c.scale(1, .3); const g = c.createRadialGradient(0, 0, 0, 0, 0, rr); g.addColorStop(0, rgb(col, .3 * k)); g.addColorStop(1, rgb(col, 0)); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(-rr, -rr, rr * 2, rr * 2); c.restore(); c.globalCompositeOperation = 'source-over'; };
    // the Prophet rides with the column; at the break he holds his ground where the knot forms
    const pz = p < .25 ? Math.min(KZ, front - 330) : KZ, px = cxv(pz);
    const proC = [255, 238, 200], aliC = [255, 212, 140], bhC = [250, 222, 170];
    pool(px, pz, 7, 1, proC);
    halo(px, height(px, pz) + 2.3, pz, .44, 1.1, proC);
    // the ten gather in as the army breaks
    const gather = smooth(seg(p, .27, .33)), loose = 1 - smooth(seg(p, .64, .72));
    const press = Math.sin(Math.PI * seg(p, .34, .58));
    const fwd = Math.sin(p * 90) * .5 + .5;
    // Ali: in front, toward the ambush, moving to meet each rush
    const aa = Math.sin(p * 47) * .6, ar = 8 + 5 * press * fwd;
    const ax = px + Math.sin(aa) * ar * gather + (1 - gather) * -3, az = pz + Math.cos(aa) * ar * gather + (1 - gather) * -6;
    halo(ax, height(ax, az) + 1.7, az, .3, (1.05 + .25 * press) * (.7 + .3 * gather + .3 * (1 - loose)), aliC);
    pool(ax, az, 3, .8, aliC);
    st.ten.forEach(([dx, dz, ph], i) => {
      const jx = Math.sin(t * .7 + ph) * .3, x = px + mix(dx * 3, dx, gather) + jx, z = pz + mix(dz * 3 - 12, dz, gather);
      const k = (.55 + .2 * Math.sin(t + ph)) * (.35 + .65 * gather) * (1 - .4 * (1 - loose) * c01(i / 8));
      halo(x, height(x, z) + 1.6, z, .17, k, bhC);
    });
    // Ayman: at the front, until he falls
    const fall = seg(p, .455, .49), gone = seg(p, .49, .56);
    { const x = px - 4.4 * gather, z = pz + 5.6 * gather - (1 - gather) * 10, y = height(x, z) + mix(1.6, .25, ease.in(fall));
      halo(x, y, z, .17, (.75 + .9 * Math.sin(Math.PI * fall)) * (1 - gone * .8) * (.35 + .65 * gather), bhC);
      if (gone > 0) pool(x, z, 2.5, .6 * (1 - smooth(seg(p, .7, .8))), [243, 226, 170]);
      const ring = seg(p, .48, .55); if (ring > 0 && ring < 1) { c.strokeStyle = `rgba(243,226,170,${.5 * (1 - ring)})`; c.lineWidth = 1; c.beginPath(); for (let a = 0; a <= 40; a++) { const an = a / 40 * TAU, rr = 1 + 7 * ease.out(ring); if (!pj(x + Math.cos(an) * rr, height(x, z) + .1, z + Math.sin(an) * rr)) continue; a ? c.lineTo(PX, PY) : c.moveTo(PX, PY); } c.stroke(); } }
    // ----- motes in the first sun -----
    if (direct > 0) {
      const pa = new Path2D();
      st.motes.forEach(([x0, y0, z0, ph, q]) => { const z = z0 + p * 60, x = cxv(z) + x0 + Math.sin(t * .3 + ph) * 2, y = yf(z) + y0 + Math.sin(t * .2 + ph) * 1.5; if (!pj(x, y, z)) return; const dx = x - E0, dy = y - E1, dz = z - E2, dl = Math.hypot(dx, dy, dz), g2 = Math.max(0, (dx * sun[0] + dy * sun[1] + dz * sun[2]) / dl) ** 6; if (g2 < .05) return; const s = Math.max(.7, Math.min(2.2, .15 * F / PZ)); pa.rect(PX, PY, s, s); });
      c.globalCompositeOperation = 'lighter'; c.fillStyle = rgb(sunC, .4 * direct); c.fill(pa); c.globalCompositeOperation = 'source-over';
    }
    // god rays down the valley as the sun clears the rim
    if (direct > 0 && SX > -1e3) {
      c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 7; k++) { const a = (k - 3) * .09 + Math.sin(k * 3.1) * .03, L = H * 1.6; c.save(); c.translate(SX, SY); c.rotate(Math.PI / 2 + a); const g = c.createLinearGradient(0, 0, L, 0); g.addColorStop(0, rgb(sunC, .05 * direct)); g.addColorStop(1, rgb(sunC, 0)); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(L, -L * .06); c.lineTo(L, L * .06); c.closePath(); c.fill(); c.restore(); }
      c.globalCompositeOperation = 'source-over';
    }
    // ----- grade -----
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = .9; c.drawImage(st.bloom, 0, 0, cv.width, cv.height); c.globalAlpha = 1;
    c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(st.noise, 'repeat'); c.fillRect(0, 0, cv.width, cv.height);
    c.globalCompositeOperation = 'source-over';
    const vg = c.createRadialGradient(cv.width * .5, cv.height * .52, Math.min(cv.width, cv.height) * .3, cv.width * .5, cv.height * .52, Math.hypot(cv.width, cv.height) * .62);
    vg.addColorStop(0, 'rgba(8,9,12,0)'); vg.addColorStop(1, `rgba(8,9,12,${.62 - .2 * direct})`);
    c.fillStyle = vg; c.fillRect(0, 0, cv.width, cv.height);
  },
};
})();
