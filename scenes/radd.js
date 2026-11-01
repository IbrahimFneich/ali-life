(() => {
// radd: the sun returned for Ali, twice (al-Irshad 1:345-347).
// Part one, in the Prophet's lifetime: a Medina house at golden afternoon. Two calm lights rest in the shade of the
// portico, the larger (the Prophet) against the smaller (Ali). The sun goes down through the west door, dusk comes,
// then the sun climbs back to its Asr place, the light floods in, and Ali's light stands in prayer. Then it sets.
// Part two, after the Prophet: Babil, the Euphrates crossing at dusk, the ruins on the far bank. The same return,
// shorter. People are never figures here except small faceless waders; the Prophet and Ali are lights only.
// World units are metres: x to the right (north), y up, z away from the camera (west, toward the sunset).
// One scene clock per part runs forward, back and forward again: the sun, the shadows, the birds and the dust
// follow it, so the return reads as the day itself running back.
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
const fract = (v) => v - Math.floor(v);
const NEAR = .25, D2R = Math.PI / 180;

// sky by sun elevation (degrees): sky top, sky mid, horizon, sun colour, ambient light
const SK = [
  [-14, [4, 7, 18], [10, 14, 30], [22, 22, 38], [255, 110, 70], [26, 30, 52]],
  [-7, [9, 13, 30], [28, 30, 56], [74, 52, 62], [255, 120, 74], [44, 50, 78]],
  [-3.5, [19, 25, 52], [72, 58, 84], [164, 86, 68], [255, 136, 80], [62, 60, 86]],
  [0, [33, 41, 76], [142, 96, 96], [234, 128, 74], [255, 156, 88], [70, 58, 68]],
  [4, [45, 59, 96], [182, 136, 112], [250, 174, 106], [255, 194, 128], [100, 84, 86]],
  [10, [54, 78, 118], [180, 158, 138], [244, 204, 150], [255, 220, 168], [118, 106, 104]],
  [28, [60, 92, 136], [164, 168, 168], [228, 212, 178], [255, 238, 206], [130, 124, 122]],
];
// the scene clocks: [p, tau]. Each segment eases in and out, so the return starts and stops like a held breath.
const T1 = [[-.06, 0], [.02, 0], [.28, 1], [.33, 1.1], [.42, -.06], [.53, .01], [.64, 1], [1.06, 1.1]];
const T2 = [[-.06, .56], [.64, .56], [.77, 1], [.855, .1], [.915, .15], [1, .9], [1.06, .95]];
const clock = (K, p) => { let i = 1; while (i < K.length - 1 && p > K[i][0]) i++; const A = K[i - 1], B = K[i]; return mix(A[1], B[1], smooth(c01((p - A[0]) / (B[0] - A[0])))); };
const camAt = (K, p) => { let i = 0; while (i < K.length - 2 && p > K[i + 1][0]) i++; const u = i + smooth(c01((p - K[i][0]) / (K[i + 1][0] - K[i][0]))); return { eye: crv(K.map((k) => k[1]), u), look: crv(K.map((k) => k[2]), u) }; };

// ---------- part one: the house ----------
const XW = 7, ZE = -3, ZW = 16, HS = 4.4, HWW = 2.8; // courtyard half width, east and west ends, side-wall and west-wall heights
const DX = -3.9, DW = .78, DH = 2.3; // the west door: centre x, half width, height
const PX0 = 3.4, PY0 = 2.9; // the portico along the north wall: front edge, roof height
const COLS = [.4, 4.4, 8.4, 12.4];
const PRO = [5.25, .5, 7.4], ALI1 = [4.62, .86, 7.95], ALI1P = [3.95, 1.3, 8.1];
const CAM1 = [
  [-.06, [-2.6, 9.8, -9.8], [1.8, 1.0, 12]],
  [0, [-2.4, 9.4, -9.2], [1.8, 1.1, 12]],
  [.08, [-1.8, 4.6, -4.6], [1.8, 1.6, 16]],
  [.16, [-1.3, 2.3, -2.7], [1.9, 2.0, 22]],
  [.22, [.2, 1.55, .4], [-2.4, 2.1, 24]],
  [.27, [.5, 1.45, 1], [-3.5, 1.65, 30]],
  [.31, [.4, 1.5, 1.4], [-1.2, 5.6, 24]],
  [.35, [.5, 1.45, 1], [-3.4, 1.9, 30]],
  [.4, [-.9, 1.9, -.8], [.2, 2.6, 20]],
  [.46, [-1.6, 1.65, 2.4], [4.4, 1.0, 9.0]],
  [.53, [-1.2, 1.75, 2.9], [4.2, 1.1, 9.1]],
  [.6, [-1.9, 5.6, -5.2], [1, 2.3, 14]],
  [.7, [-2.4, 11.5, -10.5], [0, 16, 36]],
];
// ---------- part two: Babil ----------
const ZF = 220; // the far shore; the near shore is z = 0
const ALI2 = [-3.2, 1.3, -2.2];
const CAM2 = [
  [.6, [10, 22, -80], [-12, 70, 500]],
  [.67, [8, 17, -62], [-12, 26, 500]],
  [.76, [5, 8, -34], [-14, 6, 500]],
  [.83, [2.6, 2.7, -17], [-30, 9, 400]],
  [.89, [3.6, 2.1, -12.5], [-7, 1.6, 30]],
  [.95, [6, 6, -32], [-12, 6, 500]],
  [1.06, [9, 13, -64], [-12, 8, 500]],
];
const MANS = [-.3, 0, -.22, 1.3, -.12, 1.5, -.08, 1.76, .08, 1.76, .12, 1.5, .22, 1.3, .3, 0];
const RIDER = [-1.1, .9, -1.0, 1.5, -.3, 1.45, -.24, 1.95, -.12, 2.2, -.06, 2.4, .08, 2.4, .14, 2.2, .24, 1.95, .4, 1.5, .7, 1.6, .9, 2.05, 1.12, 2.0, 1.0, 1.55, .8, 1.1, 1.1, .9];
const CAMEL = [-1.3, 1.0, -1.25, 1.6, -.6, 2.1, -.1, 2.0, .3, 1.7, .6, 1.8, .85, 2.5, 1.15, 2.6, 1.25, 2.4, 1.05, 2.3, .95, 1.6, .9, 1.0];

function view(eye, look, W, H, F, cx, cy) {
  const fw = norm(sub(look, eye)), rt = norm(cross([0, 1, 0], fw)), up = cross(fw, rt);
  const [E0, E1, E2] = eye, [f0, f1, f2] = fw, [r0, r1, r2] = rt, [u0, u1, u2] = up;
  const V = { eye, fw, rt, up, F, cx, cy, W, H, x: 0, y: 0, z: 0 };
  V.pj = (x, y, z) => { const dx = x - E0, dy = y - E1, dz = z - E2, zc = dx * f0 + dy * f1 + dz * f2; if (zc < NEAR * .999) return false; const iz = F / zc; V.x = cx + (dx * r0 + dy * r1 + dz * r2) * iz; V.y = cy - (dx * u0 + dy * u1 + dz * u2) * iz; V.z = zc; return true; };
  V.zc = (x, y, z) => (x - E0) * f0 + (y - E1) * f1 + (z - E2) * f2;
  V.dir = (az, el) => V.pj(E0 + Math.sin(az) * Math.cos(el) * 1e5, E1 + Math.sin(el) * 1e5, E2 + Math.cos(az) * Math.cos(el) * 1e5);
  const pitch = Math.asin(Math.max(-.99, Math.min(.99, f1)));
  V.hy = cy + F * Math.tan(pitch);
  V.az0 = Math.atan2(f0, f2);
  // a 3D polygon clipped at the near plane, appended to a Path2D; returns false when nothing is left
  V.poly = (pts, pa) => {
    let n = 0;
    const emit = (x, y, z) => { V.pj(x, y, z); if (n++) pa.lineTo(V.x, V.y); else pa.moveTo(V.x, V.y); };
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], za = V.zc(a[0], a[1], a[2]), zb = V.zc(b[0], b[1], b[2]);
      if (za >= NEAR) emit(a[0], a[1], a[2]);
      if ((za >= NEAR) !== (zb >= NEAR)) { const k = (NEAR + 1e-4 - za) / (zb - za); emit(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k); }
    }
    if (n > 2) pa.closePath();
    return n > 2;
  };
  return V;
}

S.radd = {
  init(el, st) {
    st.cv = el.querySelector('canvas');
    st.c = st.cv.getContext('2d');
    st.buf = mk(8, 8); st.bufc = st.buf.getContext('2d');
    st.bloom = mk(8, 8); st.bc = st.bloom.getContext('2d');
    st.glow = sprite([[0, 'rgba(255,255,255,1)'], [.16, 'rgba(255,255,255,.55)'], [.42, 'rgba(255,255,255,.14)'], [1, 'rgba(255,255,255,0)']], 128);
    st.soft = sprite([[0, 'rgba(255,255,255,.9)'], [.5, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]);
    st.tints = {};
    const R = rng(345);
    st.noise = mk(160, 160);
    { const ng = st.noise.getContext('2d'), id = ng.createImageData(160, 160); for (let i = 0; i < id.data.length; i += 4) { const v = R() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 22; } ng.putImageData(id, 0, 0); }
    st.stars = Array.from({ length: 420 }, () => [(R() - .5) * 3.4, .02 + R() ** .85 * 1.25, R()]);
    st.hills = []; { let h = .01; for (let i = 0; i <= 400; i++) { h = mix(h, .006 + .012 * Math.sin(i * .07) ** 2 + R() * .006, .3); st.hills.push(h); } }
    // ----- part one -----
    st.clouds1 = Array.from({ length: 16 }, () => [-1.3 + R() * 2.2, .05 + R() ** 1.4 * .4, .25 + R() * .55, .012 + R() * .02, .25 + R() * .4]);
    // neighbouring houses beyond the walls: boxes [x0, x1, h, z0, z1]
    st.houses = [];
    for (let i = 0; i < 46; i++) {
      const side = R(), w = 5 + R() * 9, d = 5 + R() * 9, h = 2.6 + R() * 3.2;
      let x0, z0;
      if (side < .45) { x0 = -40 + R() * 70; z0 = ZW + 3 + R() * 50; } else if (side < .72) { x0 = -XW - 2 - w - R() * 30; z0 = ZE + R() * 40; } else { x0 = XW + 2 + R() * 30; z0 = ZE + R() * 40; }
      if (x0 + w > -XW - 1.5 && x0 < XW + 1.5 && z0 < ZW + 2.5 && z0 + d > ZE) continue;
      st.houses.push([x0, x0 + w, h, z0, z0 + d, .86 + R() * .24, R()]);
    }
    st.palms1 = [];
    for (let i = 0; i < 70; i++) {
      const a = R(); let x, z;
      if (a < .55) { x = -60 + R() * 120; z = ZW + 6 + R() ** .7 * 90; } else { x = (R() < .5 ? -1 : 1) * (XW + 4 + R() * 40); z = ZE + R() * 70; }
      st.palms1.push([x, z, 7 + R() * 7, R() * TAU, (R() - .5) * .9]);
    }
    st.patches = Array.from({ length: 70 }, () => { const w = R() < .34 ? 0 : R() < .5 ? 1 : 2; return [w, w === 2 ? -XW + R() * 2 * XW : ZE + R() * (ZW - ZE), R() * (w === 2 ? HWW : HS) * .9, .4 + R() * 1.6, .25 + R() * .9, R() < .5 ? 1 : -1]; });
    st.marks1 = Array.from({ length: 900 }, () => [-XW + .2 + R() * (2 * XW - .4), ZE + R() * (ZW - ZE), R(), R()]);
    st.motes1 = new Float32Array(2200 * 5);
    for (let i = 0; i < 2200; i++) { const o = i * 5, inBeam = i < 700; st.motes1[o] = inBeam ? DX - 2 + R() * 9 : -XW + R() * 2 * XW; st.motes1[o + 1] = R() ** (inBeam ? 1.6 : 1.1) * (inBeam ? 2.6 : 4.2); st.motes1[o + 2] = inBeam ? 4 + R() * 12 : ZE + R() * (ZW - ZE); st.motes1[o + 3] = R() * TAU; st.motes1[o + 4] = R(); }
    st.birds1 = Array.from({ length: 26 }, (_, i) => [R() * TAU, 9 + R() * 16, 15 + R() * 14, (R() < .5 ? 1 : -1) * (1.1 + R() * .9), R() * TAU, i < 13 ? 0 : 1]);
    // ----- part two -----
    st.clouds2 = Array.from({ length: 18 }, () => [-1.2 + R() * 2.2, .04 + R() ** 1.5 * .38, .3 + R() * .7, .01 + R() * .02, .25 + R() * .4]);
    st.ruins = [];
    // the long broken wall along the far bank: jagged crests, a few gaps and towers
    for (let x = -520; x < 420;) {
      const w = 16 + R() * 60, gap = R() < .3 ? 8 + R() * 30 : 0, z = 300 + Math.sin(x * .006) * 30 + R() * 8, h = 7 + R() * 9, pts = [];
      const low = R() < .35 ? .35 + R() * .3 : 1; for (let k = 0; k <= 12; k++) { const u = k / 12, notch = R() < .14 ? .35 : 1; pts.push([x + u * w, h * low * (1 - .55 * R() ** 1.6) * notch * (k === 0 || k === 12 ? .35 + R() * .3 : 1), z]); }
      st.ruins.push({ kind: 'wall', pts, z, x0: x, x1: x + w, h });
      if (R() < .4) st.ruins.push({ kind: 'tower', x: x + w * R(), z: z - 2, w: 6 + R() * 5, h: h + 4 + R() * 7 });
      x += w + gap;
    }
    st.zig = { x: -120, z: 470, tiers: [[95, 13], [76, 11], [57, 10], [40, 8], [24, 6]] };
    st.mounds = Array.from({ length: 16 }, () => [-700 + R() * 1300, 330 + R() * 700, 30 + R() * 90, 5 + R() * 14]);
    st.arch = { x: 95, z: 285, w: 9, h: 14 };
    st.palms2 = [];
    for (let i = 0; i < 90; i++) { const x = -800 + R() * 1500, z = ZF + 25 + R() ** 1.4 * 500; st.palms2.push([x, z, 9 + R() * 8, R() * TAU, (R() - .5) * .6]); }
    for (let i = 0; i < 14; i++) { const x = (R() < .5 ? -1 : 1) * (14 + R() * 70), z = -8 - R() * 70; st.palms2.push([x, z, 8 + R() * 7, R() * TAU, (R() - .5) * .7]); }
    st.reeds = [];
    for (let x = -400; x < 400; x += .8 + R() * 2.4) { if (R() < .6) st.reeds.push([x, -.6 - R() * 2.5, .35 + R() * .6, R() * TAU]); if (R() < .6) st.reeds.push([x, ZF + 2 + R() * 6, 1.4 + R() * 2, R() * TAU]); }
    st.glints = Array.from({ length: 900 }, () => [R(), R(), R() * TAU, R()]);
    st.ripples = Array.from({ length: 520 }, () => [-500 + R() * 1000, 4 + R() ** .8 * (ZF - 8), R() * TAU, R()]);
    st.wade = Array.from({ length: 460 }, (_, i) => { const k = R(); return [-.75 + (i / 460) * 1.7 + R() * .01, (R() - .5) * 10, k < .14 ? 1 : k < .24 ? 2 : 0, R() * TAU, i % 9 === 0 ? 1 : 0]; });
    st.motes2 = new Float32Array(1200 * 5);
    for (let i = 0; i < 1200; i++) { const o = i * 5; st.motes2[o] = -40 + R() * 80; st.motes2[o + 1] = .3 + R() ** 1.3 * 9; st.motes2[o + 2] = -30 + R() * 90; st.motes2[o + 3] = R() * TAU; st.motes2[o + 4] = R(); }
    st.birds2 = Array.from({ length: 34 }, () => [R() * TAU, 18 + R() * 30, 30 + R() * 40, (R() < .5 ? 1 : -1) * (.9 + R() * .8), R() * TAU, 0]);
  },

  frame(p, t, el, st) {
    fit(st.cv);
    const { c, cv } = st;
    const dpr = cv.width / Math.max(1, cv.clientWidth), W = cv.clientWidth, H = cv.clientHeight;
    const BW = Math.max(8, Math.round(W / 4)), BH = Math.max(8, Math.round(H / 4));
    if (st.bloom.width !== BW || st.bloom.height !== BH) { st.bloom.width = BW; st.bloom.height = BH; }
    const bc = st.bc; bc.setTransform(1, 0, 0, 1, 0, 0); bc.globalCompositeOperation = 'source-over'; bc.clearRect(0, 0, BW, BH); bc.setTransform(BW / W, 0, 0, BH / H, 0, 0);
    const xf = smooth(seg(p, .615, .675));
    if (xf < 1) { c.setTransform(dpr, 0, 0, dpr, 0, 0); S.radd.court(c, W, H, p, t, st, bc); }
    if (xf > 0) {
      let g = c;
      if (xf < 1) { if (st.buf.width !== cv.width || st.buf.height !== cv.height) { st.buf.width = cv.width; st.buf.height = cv.height; } g = st.bufc; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (xf < 1) bc.globalAlpha = xf;
      S.radd.babil(g, W, H, p, t, st, bc);
      bc.globalAlpha = 1;
      if (xf < 1) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = xf; c.drawImage(st.buf, 0, 0); c.globalAlpha = 1; }
    }
    // grade: bloom, grain, vignette
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = .9; c.drawImage(st.bloom, 0, 0, cv.width, cv.height); c.globalAlpha = 1;
    c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(st.noise, 'repeat'); c.fillRect(0, 0, cv.width, cv.height);
    c.globalCompositeOperation = 'source-over';
    const vg = c.createRadialGradient(cv.width * .5, cv.height * .5, Math.min(cv.width, cv.height) * .3, cv.width * .5, cv.height * .5, Math.hypot(cv.width, cv.height) * .62);
    vg.addColorStop(0, 'rgba(8,8,10,0)'); vg.addColorStop(1, 'rgba(8,8,10,.62)');
    c.fillStyle = vg; c.fillRect(0, 0, cv.width, cv.height);
  },

  tint(st, col) { if (!st.tints[col]) { const cc = mk(128, 128), g = cc.getContext('2d'); g.drawImage(st.glow, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, 128, 128); st.tints[col] = cc; } return st.tints[col]; },

  // the sky, the sun, the stars and the clouds, for a sun at elevation e (deg) and azimuth az (rad)
  sky(c, V, W, H, e, az, t, st, clouds, bc) {
    const [skT, skM, skH, sunC] = keyAt(SK, e), F = V.F, hy = V.hy;
    const g = c.createLinearGradient(0, hy - F * 1.25, 0, hy);
    g.addColorStop(0, rgb(skT)); g.addColorStop(.55, rgb(skM)); g.addColorStop(1, rgb(skH));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const eR = e * D2R, glowK = c01((e + 9) / 9);
    let SX = -1e4, SY = -1e4, vis = false;
    if (V.dir(az, Math.max(eR, -.03))) {
      SX = V.x; SY = V.y; vis = true;
      c.globalCompositeOperation = 'lighter';
      const r1 = F * 1.3, a = .42 * glowK;
      const g2 = c.createRadialGradient(SX, SY, 0, SX, SY, r1);
      g2.addColorStop(0, rgb(sunC, a)); g2.addColorStop(.12, rgb(sunC, a * .45)); g2.addColorStop(.45, rgb(sunC, a * .1)); g2.addColorStop(1, rgb(sunC, 0));
      c.fillStyle = g2; c.fillRect(0, 0, W, hy + 2);
      // a low band of afterglow along the horizon toward the sun
      const g3 = c.createLinearGradient(0, hy - F * .22, 0, hy);
      g3.addColorStop(0, rgb(sunC, 0)); g3.addColorStop(1, rgb(sunC, .16 * c01((e + 7) / 7) * (1 - c01((e - 6) / 10))));
      c.save(); c.translate(SX, 0); c.scale(1.9, 1); c.translate(-SX, 0);
      const g4 = c.createRadialGradient(SX, hy, 0, SX, hy, F * .9); g4.addColorStop(0, 'rgba(255,255,255,1)'); g4.addColorStop(1, 'rgba(255,255,255,0)');
      c.restore();
      c.fillStyle = g3; c.fillRect(0, hy - F * .22, W, F * .22 + 1);
      c.globalCompositeOperation = 'source-over';
    }
    // stars, then the evening star first of all
    const starA = c01((-e - 1.5) / 5);
    if (starA > 0) {
      c.fillStyle = '#f1e8d0';
      st.stars.forEach(([a, e2, k]) => { if (!V.dir(V.az0 + a * .7, e2) || V.x < 0 || V.x > W || V.y > hy - 4) return; c.globalAlpha = starA * (.18 + .75 * k) * (.7 + .3 * Math.sin(t * 2 + k * 50)) * c01((hy - V.y) / (F * .12)); const s = k > .93 ? 1.8 : k > .7 ? 1.2 : .9; c.fillRect(V.x, V.y, s, s); });
      c.globalAlpha = 1;
    }
    const venA = c01((-e + .5) / 3);
    if (venA > 0 && V.dir(az + .16, .13)) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = venA * .9; const r = F * .006; c.drawImage(S.radd.tint(st, '#fff4dc'), V.x - r * 4, V.y - r * 4, r * 8, r * 8); c.fillStyle = '#fffaf0'; c.fillRect(V.x - 1, V.y - 1, 2.2, 2.2); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
    // clouds: thin streaks, gold from below while the sun is low, then rose, then ash
    const low = c01(1 - Math.abs(e - 1) / 9), night = c01((-e - 3) / 6);
    const cl = lerp(lerp(lerp(skM, [255, 236, 212], .25), lerp(sunC, [255, 120, 110], .25), low * .8), lerp(skT, [40, 42, 60], .3), night);
    clouds.forEach(([a, e2, w, h, al]) => {
      if (!V.dir(az + a, e2)) return; const x = V.x, y = V.y, rw = w * F, rh = h * F;
      if (x < -rw || x > W + rw || y > hy) return;
      const near = c01(1 - Math.abs(a) / 1.4);
      c.save(); c.translate(x + Math.sin(t * .03 + a * 9) * 6, y); c.scale(rw, rh);
      const g5 = c.createRadialGradient(0, 0, 0, 0, 0, 1); g5.addColorStop(0, rgb(lerp(cl, lerp(sunC, [255, 250, 240], .3), low * near * .5), al * (.45 + .3 * low))); g5.addColorStop(1, rgb(cl, 0));
      c.fillStyle = g5; c.fillRect(-1, -1, 2, 2); c.restore();
    });
    if (vis && e > -1.2) {
      const r = F * .0105, flat = 1 - .18 * c01(1 - e / 3);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = .9; c.drawImage(S.radd.tint(st, rgb(lerp(sunC, [255, 250, 236], .4))), SX - r * 12, SY - r * 12, r * 24, r * 24);
      c.globalAlpha = 1; c.fillStyle = rgb(lerp(sunC, [255, 252, 240], .65)); c.beginPath(); c.ellipse(SX, SY, r, r * flat, 0, 0, TAU); c.fill();
      c.globalCompositeOperation = 'source-over';
      bc.fillStyle = rgb(sunC, .8 * c01((e + 1.2) / 2)); bc.beginPath(); bc.arc(SX, SY, r * 5, 0, TAU); bc.fill();
    }
    return { SX, SY, vis };
  },

  palm(c, V, x, z, h, ph, lean, col, rim, t, y0 = 0) {
    if (!V.pj(x, y0, z)) return; const bx = V.x, by = V.y;
    if (!V.pj(x + lean * h * .25, y0 + h, z)) return; const tx = V.x, ty = V.y, s = V.F / V.z;
    if (tx < -6 * s || tx > V.W + 6 * s) return;
    c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = Math.max(.7, .32 * s);
    c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo((bx + tx) / 2 + lean * s * 1.2, (by + ty) / 2, tx, ty); c.stroke();
    c.lineWidth = Math.max(.6, .2 * s);
    for (let f = 0; f < 11; f++) {
      const a = f / 11 * TAU + ph + Math.sin(t * .6 + x) * .04, l = (2.6 + .9 * Math.sin(f * 2.3 + ph)) * s, dx = Math.cos(a) * l, dy = Math.sin(a) * l * .4 + l * .38 * Math.abs(Math.cos(a));
      c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + dx * .55, ty - l * .28 + dy * .2, tx + dx, ty + dy * .9); c.stroke();
    }
    if (rim) { c.strokeStyle = rim; c.lineWidth = Math.max(.5, .1 * s); c.beginPath(); c.moveTo(bx + .1 * s, by); c.quadraticCurveTo((bx + tx) / 2 + lean * s * 1.2 + .1 * s, (by + ty) / 2, tx + .1 * s, ty); c.stroke(); }
  },

  // a calm light: a pool on the ground, a halo, a bright core. k is its strength, size its radius in metres.
  light(c, V, bc, st, x, y, z, size, k, col, gy = 0) {
    if (k <= 0) return;
    c.globalCompositeOperation = 'lighter';
    if (V.pj(x, gy + .02, z)) {
      const s = V.F / V.z, gx = V.x, gyy = V.y, rr = size * 3.2 * s;
      c.save(); c.translate(gx, gyy); c.scale(1, .32);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, rr); g.addColorStop(0, rgb(col, .32 * k)); g.addColorStop(1, rgb(col, 0));
      c.fillStyle = g; c.fillRect(-rr, -rr, rr * 2, rr * 2); c.restore();
    }
    if (!V.pj(x, y, z)) { c.globalCompositeOperation = 'source-over'; return; }
    const s = V.F / V.z, X = V.x, Y = V.y, R = Math.min(V.H * .1 * size, Math.max(2.2, size * s));
    c.globalAlpha = Math.min(1, .38 * k); c.drawImage(S.radd.tint(st, rgb(col)), X - R * 7, Y - R * 7, R * 14, R * 14);
    c.globalAlpha = Math.min(1, .7 * k); c.drawImage(S.radd.tint(st, rgb(lerp(col, [255, 255, 250], .5))), X - R * 1.5, Y - R * 1.5, R * 3, R * 3);
    c.globalAlpha = Math.min(1, k); c.fillStyle = 'rgba(255,252,242,1)'; c.beginPath(); c.arc(X, Y, R * .24, 0, TAU); c.fill();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    bc.fillStyle = rgb(col, Math.min(1, .45 * k)); bc.beginPath(); bc.arc(X, Y, R * 2.4, 0, TAU); bc.fill();
  },

  birds(c, V, list, tau, t, alpha, col, C = [[-4, 18], [6, 26]], rs = 1) {
    if (alpha <= 0) return;
    c.strokeStyle = rgb(col, alpha); c.lineCap = 'round'; c.lineJoin = 'round';
    const pa = new Path2D(); let w = 1;
    list.forEach(([a0, r, h, w0, ph, grp], i) => {
      const a = a0 + w0 * (tau * 7.5 + t * .05), [cxw, czw] = C[grp];
      const x = cxw + Math.cos(a) * r * rs, y = h + 2.2 * rs * Math.sin(a * 2 + ph), z = czw + Math.sin(a) * r * .7 * rs;
      if (!V.pj(x, y, z)) return; const s = Math.min(V.H * .007, Math.max(1.6, .5 * V.F / V.z)); w = Math.max(.8, s * .16);
      const fl = Math.sin(t * 9 + ph + tau * 40) * .7;
      pa.moveTo(V.x - s, V.y - s * fl * .6); pa.quadraticCurveTo(V.x - s * .4, V.y - s * .15, V.x, V.y); pa.quadraticCurveTo(V.x + s * .4, V.y - s * .15, V.x + s, V.y - s * fl * .6);
      void i;
    });
    c.lineWidth = w; c.stroke(pa);
  },

  // ======================= part one: the house in Medina =======================
  court(c, W, H, p, t, st, bc) {
    const phone = W < H * .8;
    const tau = clock(T1, p), e = 22 - 27 * tau, az = -.42 + .2 * tau, eR = e * D2R;
    const [skT, skM, skH, sunC, amb] = keyAt(SK, e);
    const { eye, look } = camAt(CAM1, p);
    if (phone) { const back = 1.28; for (let j = 0; j < 3; j++) eye[j] = look[j] + (eye[j] - look[j]) * back; eye[1] = Math.max(1.2, eye[1]); }
    const F = phone ? W * 1.02 : Math.min(H * 1.05, W * .82), cx = W / 2, cy = H * (phone ? .58 : .5);
    const V = view(eye, look, W, H, F, cx, cy);
    const sy = Math.sin(eR), shc = Math.cos(eR), sx = Math.sin(az) * shc, sz = Math.cos(az) * shc;
    const direct = c01((e + .3) / 2.2), lowSun = c01(1 - e / 14);
    const kx = sy > .004 ? -sx / sy : 0, kz = sy > .004 ? sz / sy : 1e3;
    const dusk = c01((-e) / 7);
    // ----- sky -----
    const sun = S.radd.sky(c, V, W, H, e, az, t, st, st.clouds1, bc);
    // ----- the land outside, seen over the walls and through the door -----
    const hy = V.hy;
    const landC = lerp(lerp(skH, [70, 56, 46], .55), [16, 16, 24], dusk * .6);
    c.fillStyle = rgb(lerp(skH, landC, .45)); c.beginPath(); c.moveTo(0, hy + 1);
    for (let x = 0; x <= W + 16; x += 16) { const a = V.az0 + Math.atan((x - cx) / F), ii = ((a / TAU * 800) % 400 + 400) % 400, i0 = Math.floor(ii); c.lineTo(x, hy - F * mix(st.hills[i0], st.hills[(i0 + 1) % 401], ii - i0)); }
    c.lineTo(W, hy + 1); c.closePath(); c.fill();
    const lg = c.createLinearGradient(0, hy, 0, H);
    lg.addColorStop(0, rgb(lerp(landC, skH, .35))); lg.addColorStop(.3, rgb(landC)); lg.addColorStop(1, rgb(lerp(landC, [10, 9, 10], .5)));
    c.fillStyle = lg; c.fillRect(0, hy, W, H - hy);
    // sun glare on the open ground beyond the door
    if (sun.vis && direct > 0) { c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(sun.SX, hy, 0, sun.SX, hy, F * .5); g.addColorStop(0, rgb(sunC, .3 * direct * lowSun)); g.addColorStop(1, rgb(sunC, 0)); c.fillStyle = g; c.fillRect(0, hy, W, F * .5); c.globalCompositeOperation = 'source-over'; }
    // ----- the neighbourhood: shadows, houses and palms beyond the walls -----
    const MUD = [168, 134, 98], haze = (d) => c01(d / 260) * .55;
    const lamb = (n) => Math.max(0, n[0] * sx + n[1] * sy + n[2] * sz) * direct;
    const shadeOf = (base, n, d, lit = 1) => { const sk = .62 + .38 * n[1]; const col = [0, 1, 2].map((j) => base[j] / 255 * (amb[j] * sk * 1.05 + sunC[j] * lamb(n) * 1.25 * lit)); return lerp(col, lerp(skH, skM, .3), haze(d)); };
    if (direct > 0 && sy > .01) { // long shadows of the houses on the open ground
      const shp = new Path2D(), ok = [];
      st.houses.forEach(([x0, x1, h, z0, z1]) => { const ox = kx * h, oz = -kz * h, L = Math.min(1, 60 / Math.hypot(ox, oz)); ok.push(V.poly([[x0, .01, z0], [x1, .01, z0], [x1 + ox * L, .01, z0 + oz * L], [x0 + ox * L, .01, z0 + oz * L]], shp)); ok.push(V.poly([[x0, .01, z1], [x0, .01, z0], [x0 + ox * L, .01, z0 + oz * L], [x0 + ox * L, .01, z1 + oz * L]], shp)); });
      c.fillStyle = `rgba(14,10,12,${.35 * direct})`; c.fill(shp);
    }
    const E0 = eye[0], E1 = eye[1], E2 = eye[2];
    const items = [];
    st.houses.forEach((b) => items.push({ d: Math.hypot((b[0] + b[1]) / 2 - E0, (b[3] + b[4]) / 2 - E2), b }));
    st.palms1.forEach((pm) => items.push({ d: Math.hypot(pm[0] - E0, pm[1] - E2), pm }));
    items.sort((a, b) => b.d - a.d);
    const rimC = rgb(lerp(sunC, [255, 236, 200], .3), .55 * direct * lowSun);
    items.forEach((it) => {
      if (it.pm) { const [x, z, h, ph, lean] = it.pm; S.radd.palm(c, V, x, z, h, ph, lean, rgb(lerp(lerp([30, 30, 26], skH, haze(it.d) * .9), [12, 12, 20], dusk * .5)), rimC, t); return; }
      const [x0, x1, h, z0, z1, tone, q] = it.b, base = MUD.map((v) => v * tone);
      const faces = [[[0, 0, -1], [[x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0]]], [[-1, 0, 0], [[x0, 0, z1], [x0, 0, z0], [x0, h, z0], [x0, h, z1]]], [[1, 0, 0], [[x1, 0, z0], [x1, 0, z1], [x1, h, z1], [x1, h, z0]]], [[0, 1, 0], [[x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1]]], [[0, 0, 1], [[x1, 0, z1], [x0, 0, z1], [x0, h, z1], [x1, h, z1]]]];
      faces.forEach(([n, pts]) => {
        if (n[0] * (E0 - pts[0][0]) + n[1] * (E1 - pts[0][1]) + n[2] * (E2 - pts[0][2]) <= 0) return;
        const pa = new Path2D(); if (!V.poly(pts, pa)) return;
        c.fillStyle = rgb(shadeOf(base, n, it.d)); c.fill(pa);
        if (n[2] === -1 && x1 - x0 > 4) { const dx = x0 + (x1 - x0) * (.25 + q * .5), dp = new Path2D(); if (V.poly([[dx - .45, 0, z0 - .01], [dx + .45, 0, z0 - .01], [dx + .45, 1.9, z0 - .01], [dx - .45, 1.9, z0 - .01]], dp)) { c.fillStyle = rgb(lerp(shadeOf(base, n, it.d), [8, 6, 6], .6)); c.fill(dp); } }
        if (n[1] === 1 && q > .5) { const pp = new Path2D(); if (V.poly([[x0, h, z0], [x1, h, z0], [x1, h + .5, z0], [x0, h + .5, z0]], pp)) { c.fillStyle = rgb(shadeOf(base, [0, 0, -1], it.d)); c.fill(pp); } }
      });
      if (V.pj(x0, h, z0)) { const ax = V.x, ay = V.y; if (V.pj(x1, h, z0)) { c.strokeStyle = rgb(lerp(MUD, [255, 230, 190], .3), .35 * (1 - dusk)); c.lineWidth = 1; c.beginPath(); c.moveTo(ax, ay); c.lineTo(V.x, V.y); c.stroke(); } }
    });
    // birds wheel over the roofs; they go to roost at dusk and come back out with the sun
    S.radd.birds(c, V, st.birds1, tau, t, .7 * c01((e + 3) / 4), lerp([30, 24, 26], skT, .2));
    // ----- the courtyard -----
    const floorBase = [150, 120, 88], lightOf = (base, n) => [0, 1, 2].map((j) => base[j] / 255 * (amb[j] * (.5 + .3 * n) + 0)), litOf = (base, lam) => [0, 1, 2].map((j) => base[j] / 255 * (amb[j] * .8 + sunC[j] * lam * 1.3));
    // the sunlit floor area: the yard less the shadows of the south wall, the west wall and the portico roof
    const zT = ZW - kz * HWW, xL = -XW + Math.max(0, kx) * HS, xR = Math.min(XW, PX0 + Math.max(0, kx) * PY0);
    const litFrac = direct * c01((zT - ZE) / (ZW - ZE)) * c01((xR - xL) / (2 * XW));
    const bounce = [0, 1, 2].map((j) => sunC[j] * litFrac * .22 * direct);
    const shadowCol = (base, up = .5) => [0, 1, 2].map((j) => base[j] / 255 * (amb[j] * (.5 + .25 * up) * (1 + .5 * dusk) + bounce[j]));
    const floorP = new Path2D(); V.poly([[-XW, 0, ZE], [XW, 0, ZE], [XW, 0, ZW], [-XW, 0, ZW]], floorP);
    c.fillStyle = rgb(shadowCol(floorBase, 1)); c.fill(floorP);
    // the mat under the portico
    const matP = new Path2D(); V.poly([[4.15, .01, 6.2], [6.55, .01, 6.2], [6.55, .01, 9.2], [4.15, .01, 9.2]], matP);
    c.fillStyle = rgb(shadowCol([120, 96, 62], 1)); c.fill(matP);
    const lamF = Math.pow(Math.max(0, sy), .5) * direct;
    const litP = new Path2D();
    let hasLit = false;
    if (lamF > 0 && zT > ZE && xR > xL) hasLit = V.poly([[xL, .005, ZE], [xR, .005, ZE], [xR, .005, Math.max(ZE, zT + (xR - PX0) * 0)], [xL, .005, zT]], litP);
    // the door's patch of light, inside the west wall's shadow
    const dz0 = ZW - kz * DH, doorP = new Path2D();
    let hasDoor = false;
    if (lamF > 0 && sz > 0) {
      const za = Math.max(ZE, dz0), k2 = (ZW - za) / Math.max(1e-3, ZW - dz0), ox = kx * DH * k2;
      hasDoor = V.poly([[DX - DW, .006, ZW], [DX + DW, .006, ZW], [DX + DW + ox, .006, za], [DX - DW + ox, .006, za]], doorP);
    }
    const litFloor = rgb(litOf(floorBase, .35 + .65 * lamF)), litMat = rgb(litOf([128, 102, 66], .35 + .65 * lamF));
    if (hasLit || hasDoor) {
      c.save();
      const clipP = new Path2D(); if (hasLit) clipP.addPath(litP); if (hasDoor) clipP.addPath(doorP);
      c.clip(clipP);
      c.fillStyle = litFloor; c.fill(floorP); c.fillStyle = litMat; c.fill(matP);
      // the shadows of the columns and of the jar, streaming toward us
      const shp = new Path2D(), L = Math.min(1, 26 / Math.max(1e-3, Math.hypot(kx, kz) * PY0));
      COLS.forEach((zc) => { V.poly([[PX0 - .14, .008, zc], [PX0 + .14, .008, zc], [PX0 + .14 + kx * PY0 * L, .008, zc - kz * PY0 * L], [PX0 - .14 + kx * PY0 * L, .008, zc - kz * PY0 * L]], shp); });
      const jl = Math.min(1, 20 / Math.max(1e-3, Math.hypot(kx, kz) * .75));
      V.poly([[2.75, .008, 11.6], [3.05, .008, 11.6], [3.05 + kx * .75 * jl, .008, 11.6 - kz * .75 * jl], [2.75 + kx * .75 * jl, .008, 11.6 - kz * .75 * jl]], shp);
      c.fillStyle = rgb(shadowCol(floorBase, 1), .9); c.fill(shp);
      c.restore();
      // the sunlit edge glows a little into the shade
      if (hasLit) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgb(sunC, .08 * lamF); c.lineWidth = 6; c.stroke(litP); c.globalCompositeOperation = 'source-over'; }
      if (hasDoor) { c.globalCompositeOperation = 'lighter'; c.fillStyle = rgb(sunC, .12 * direct * lowSun); c.fill(doorP); c.globalCompositeOperation = 'source-over'; bc.fillStyle = rgb(sunC, .25 * direct * lowSun); bc.fill(doorP); }
    }
    // the floor's grain: pebbles and straw near the camera
    c.lineWidth = 1;
    [0, 1].forEach((pass) => {
      const pa = new Path2D();
      st.marks1.forEach(([x, z, q, k]) => { if ((k > .6) !== !!pass || !V.pj(x, .01, z) || V.z > 14) return; const l = (.04 + q * .1) * F / V.z; pa.moveTo(V.x - l, V.y); pa.lineTo(V.x + l, V.y); });
      c.strokeStyle = pass ? rgb([255, 236, 200], .08 + .06 * (1 - dusk)) : rgb([20, 14, 10], .22); c.stroke(pa);
    });
    // ----- the walls: south (left), west (with the door), north (right), with their sunlit parts -----
    const wallCol = (n, up) => shadowCol(MUD, up);
    const course = (pts3, col) => { c.strokeStyle = col; c.lineWidth = 1; const pa = new Path2D(); pts3.forEach(([a, b]) => { if (V.pj(...a)) { const ax = V.x, ay = V.y; if (V.pj(...b)) { pa.moveTo(ax, ay); pa.lineTo(V.x, V.y); } } }); c.stroke(pa); };
    const faceGrad = (pa, y0w, y1w, x, z, colA, colB) => { if (!V.pj(x, y0w, z)) return colA; const ya = V.y; if (!V.pj(x, y1w, z)) return colA; const g = c.createLinearGradient(0, ya, 0, V.y); g.addColorStop(0, rgb(colA)); g.addColorStop(1, rgb(colB)); return g; };
    // south wall, inner face (never sunlit; it takes the bounce)
    const sP = new Path2D();
    if (V.poly([[-XW, 0, ZW], [-XW, 0, ZE], [-XW, HS, ZE], [-XW, HS, ZW]], sP)) { c.fillStyle = faceGrad(sP, 0, HS, -XW, 6, lerp(wallCol([1, 0, 0], 0), bounce, .6), lerp(wallCol([1, 0, 0], .6), skM, .06)); c.fill(sP); }
    // north wall, inner face, with the sunlit band above the west wall's shadow line
    const nP = new Path2D();
    if (V.poly([[XW, 0, ZE], [XW, 0, ZW], [XW, HS, ZW], [XW, HS, ZE]], nP)) {
      c.fillStyle = faceGrad(nP, 0, HS, XW, 6, wallCol([-1, 0, 0], 0), lerp(wallCol([-1, 0, 0], .6), skM, .05)); c.fill(nP);
      const lamN = Math.max(0, -sx) * direct;
      if (lamN > 0 && sz > 0) {
        const kk = sy / sz, yE = HWW - (ZW - ZE) * kk, wl = new Path2D();
        const pts = [[XW, HS, ZW], [XW, HS, ZE]];
        if (yE > 0) pts.push([XW, Math.min(HS, yE), ZE]); else { pts.push([XW, 0, ZE], [XW, 0, Math.max(ZE, zT)]); }
        pts.push([XW, HWW, ZW]);
        // under the portico roof the wall is shaded
        if (V.poly(pts, wl)) {
          c.save(); c.clip(wl);
          c.fillStyle = rgb(litOf(MUD, .3 + 1.4 * lamN)); c.fill(nP); c.restore();
        }
      }
      course([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => { const y = .36 + i * .35; return [[XW, y, ZE], [XW, y + .02 * Math.sin(i), ZW]]; }), rgb([30, 20, 14], .1));
    }
    // west wall, inner face: the door is a hole through which the outside shows
    const wP = new Path2D();
    if (V.poly([[XW, 0, ZW], [-XW, 0, ZW], [-XW, HWW, ZW], [XW, HWW, ZW]], wP)) {
      const hole = new Path2D(); V.poly([[DX - DW, 0, ZW], [DX - DW, DH, ZW], [DX + DW, DH, ZW], [DX + DW, 0, ZW]], hole);
      wP.addPath(hole);
      c.fillStyle = faceGrad(wP, 0, HWW, 0, ZW, wallCol([0, 0, -1], 0), lerp(wallCol([0, 0, -1], .7), skH, .08)); c.fill(wP, 'evenodd');
      course([0, 1, 2, 3, 4, 5, 6].map((i) => { const y = .36 + i * .35; return [[-XW, y, ZW - .01], [DX - DW - .05, y, ZW - .01]]; }).concat([0, 1, 2, 3, 4, 5, 6].map((i) => { const y = .36 + i * .35; return [[DX + DW + .05, y, ZW - .01], [XW, y, ZW - .01]]; })), rgb([30, 20, 14], .1));
      // the sun's rim along the top of the wall and in the door's jambs
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgb(sunC, .5 * direct * lowSun); c.lineWidth = Math.max(1, F / 700);
      const rp = new Path2D(); if (V.pj(-XW, HWW, ZW)) { rp.moveTo(V.x, V.y); if (V.pj(XW, HWW, ZW)) rp.lineTo(V.x, V.y); }
      if (V.pj(DX - DW, 0, ZW)) { rp.moveTo(V.x, V.y); if (V.pj(DX - DW, DH, ZW)) rp.lineTo(V.x, V.y); if (V.pj(DX + DW, DH, ZW)) rp.lineTo(V.x, V.y); if (V.pj(DX + DW, 0, ZW)) rp.lineTo(V.x, V.y); }
      c.stroke(rp); c.globalCompositeOperation = 'source-over';
    }
    // plaster patches, a curtained doorway in the south wall, a small high window, rafter ends under the roof line
    { const pl = [new Path2D(), new Path2D()];
      st.patches.forEach(([w, u, v, pw, ph, sg]) => { const pts = w === 0 ? [[-XW + .01, v, u], [-XW + .01, v, u + pw], [-XW + .01, v + ph, u + pw * .9], [-XW + .01, v + ph * 1.1, u + .1]] : w === 1 ? [[XW - .01, v, u], [XW - .01, v, u + pw], [XW - .01, v + ph, u + pw * .9], [XW - .01, v + ph * 1.1, u + .1]] : [[u, v, ZW - .01], [u + pw, v, ZW - .01], [u + pw * .9, Math.min(HWW, v + ph), ZW - .01], [u + .1, Math.min(HWW, v + ph * 1.1), ZW - .01]]; if (w === 2 && u + pw > DX - DW && u < DX + DW && v < DH) return; V.poly(pts, pl[sg > 0 ? 0 : 1]); });
      c.fillStyle = 'rgba(255,236,200,.05)'; c.fill(pl[0]); c.fillStyle = 'rgba(20,12,8,.08)'; c.fill(pl[1]);
      const dr = new Path2D(); if (V.poly([[-XW + .01, 0, 9.2], [-XW + .01, 0, 10.6], [-XW + .01, 2.15, 10.6], [-XW + .01, 2.15, 9.2]], dr)) { c.fillStyle = rgb(lerp(shadowCol([60, 44, 32], 0), [8, 6, 6], .5)); c.fill(dr); }
      const cu = new Path2D(); if (V.poly([[-XW + .02, .1, 9.3], [-XW + .02, .1, 10.0], [-XW + .02, 2.1, 10.05], [-XW + .02, 2.1, 9.3]], cu)) { c.fillStyle = rgb(shadowCol([118, 86, 60], .3)); c.fill(cu); }
      const wi = new Path2D(); if (V.poly([[XW - .01, 3.35, 11.2], [XW - .01, 3.35, 11.8], [XW - .01, 3.85, 11.8], [XW - .01, 3.85, 11.2]], wi)) { c.fillStyle = 'rgba(12,8,8,.85)'; c.fill(wi); }
      const rf = new Path2D(), rt = new Path2D();
      for (let z = ZE + .6; z < ZW - .3; z += 1.05) [[-XW, 1], [XW, -1]].forEach(([x, sgn]) => { V.poly([[x, HS - .42, z], [x, HS - .42, z + .2], [x + sgn * .25, HS - .4, z + .2], [x + sgn * .25, HS - .4, z]], rt); V.poly([[x + sgn * .25, HS - .62, z], [x + sgn * .25, HS - .62, z + .2], [x + sgn * .25, HS - .4, z + .2], [x + sgn * .25, HS - .4, z]], rf); });
      c.fillStyle = rgb(shadowCol([70, 52, 38], .3)); c.fill(rf); c.fillStyle = rgb(litOf([96, 74, 52], .3 + .9 * Math.max(0, sy) * direct)); c.fill(rt);
    }
    // wall tops (seen from above)
    [[[-XW - .5, HS, ZE], [-XW, HS, ZE], [-XW, HS, ZW + .5], [-XW - .5, HS, ZW + .5]], [[XW, HS, ZE], [XW + .5, HS, ZE], [XW + .5, HS, ZW + .5], [XW, HS, ZW + .5]], [[-XW, HWW, ZW], [XW, HWW, ZW], [XW, HWW, ZW + .5], [-XW, HWW, ZW + .5]]].forEach((pts) => { if (E1 < pts[0][1]) return; const pa = new Path2D(); if (V.poly(pts, pa)) { c.fillStyle = rgb(litOf(MUD, .4 + 1.2 * Math.max(0, sy) * direct)); c.fill(pa); } });
    // the side walls rise above the west wall at its ends
    [[-XW - .5, -XW], [XW, XW + .5]].forEach(([a, b]) => { const pa = new Path2D(); if (V.poly([[a, HWW, ZW], [b, HWW, ZW], [b, HS, ZW], [a, HS, ZW]], pa)) { c.fillStyle = rgb(wallCol([0, 0, -1], .5)); c.fill(pa); } const pb = new Path2D(); if (V.poly([[a, HWW, ZW + .5], [a, HWW, ZW], [a, HS, ZW], [a, HS, ZW + .5]], pb)) { c.fillStyle = rgb(wallCol([0, 0, -1], .5)); c.fill(pb); } });
    // the volumetric beam through the door
    if (lamF > 0 && sz > 0) {
      const za = Math.max(ZE, dz0), k2 = (ZW - za) / Math.max(1e-3, ZW - dz0), ox = kx * DH * k2, ty = DH * (1 - k2);
      const beam = new Path2D();
      const A = [DX - DW, DH, ZW], B = [DX + DW, DH, ZW], Cc = [DX + DW + ox, ty, za], D = [DX - DW + ox, ty, za];
      V.poly([A, B, Cc, D], beam); V.poly([A, D, [DX - DW, 0, ZW]], beam); V.poly([B, Cc, [DX + DW, 0, ZW]], beam);
      c.globalCompositeOperation = 'lighter'; c.fillStyle = rgb(sunC, .085 * direct * (.4 + .6 * lowSun)); c.fill(beam); c.globalCompositeOperation = 'source-over';
    }
    // ----- the portico: roof, rafters, columns -----
    const roofCol = shadowCol([92, 70, 50], .2);
    const roofP = new Path2D();
    if (E1 < PY0 && V.poly([[PX0, PY0, ZE], [XW, PY0, ZE], [XW, PY0, ZW - .02], [PX0, PY0, ZW - .02]], roofP)) {
      c.fillStyle = rgb(roofCol); c.fill(roofP);
      const rf = new Path2D(); for (let z = ZE + .3; z < ZW; z += .55) { if (V.pj(PX0, PY0 - .02, z)) { const ax = V.x, ay = V.y; if (V.pj(XW, PY0 - .02, z)) { rf.moveTo(ax, ay); rf.lineTo(V.x, V.y); } } }
      c.strokeStyle = rgb([16, 11, 8], .5); c.lineWidth = Math.max(1, F / 600); c.stroke(rf);
    }
    if (E1 > PY0 + .2) { const tp = new Path2D(); if (V.poly([[PX0 - .2, PY0 + .2, ZE], [XW, PY0 + .2, ZE], [XW, PY0 + .2, ZW], [PX0 - .2, PY0 + .2, ZW]], tp)) { c.fillStyle = rgb(litOf([110, 92, 60], .3 + 1.1 * Math.max(0, sy) * direct)); c.fill(tp); const fr = new Path2D(); for (let z = ZE; z < ZW; z += .35) { if (V.pj(PX0 - .2, PY0 + .21, z)) { const ax = V.x, ay = V.y; if (V.pj(XW, PY0 + .21, z + .5)) { fr.moveTo(ax, ay); fr.lineTo(V.x, V.y); } } } c.strokeStyle = rgb([40, 30, 18], .35); c.lineWidth = 1; c.stroke(fr); } }
    const front = new Path2D(); if (V.poly([[PX0 - .2, PY0, ZE], [PX0 - .2, PY0 + .2, ZE], [PX0 - .2, PY0 + .2, ZW], [PX0 - .2, PY0, ZW]], front)) { c.fillStyle = rgb(lerp(roofCol, sunC, .1 * direct)); c.fill(front); }
    // jar and columns, far to near; the lights go after them
    const colsSorted = COLS.map((z) => [z, Math.hypot(PX0 - E0, z - E2)]).sort((a, b) => b[1] - a[1]);
    colsSorted.forEach(([z]) => {
      if (!V.pj(PX0, 0, z)) return; const bx = V.x, by = V.y, s = F / V.z; if (!V.pj(PX0, PY0, z)) return; const tx = V.x, ty = V.y;
      const w = Math.max(1.2, .3 * s);
      const g = c.createLinearGradient(bx - w / 2, 0, bx + w / 2, 0);
      const lit = Math.max(0, -sx) * direct * (z < zT ? 1 : 0);
      g.addColorStop(0, rgb(shadowCol([96, 72, 50], .4))); g.addColorStop(.6, rgb(shadowCol([96, 72, 50], .4))); g.addColorStop(1, rgb(lerp(shadowCol([96, 72, 50], .4), litOf([120, 92, 64], 1.2), lit)));
      c.fillStyle = g; c.beginPath(); c.moveTo(bx - w / 2, by); c.lineTo(tx - w * .45, ty); c.lineTo(tx + w * .45, ty); c.lineTo(bx + w / 2, by); c.closePath(); c.fill();
      c.strokeStyle = rgb([20, 14, 10], .35); c.lineWidth = 1; for (let k = 1; k < 9; k++) { const y = by + (ty - by) * k / 9; c.beginPath(); c.moveTo(bx - w / 2, y); c.lineTo(bx + w / 2, y + w * .2); c.stroke(); }
    });
    if (V.pj(2.9, 0, 11.6) && V.z > 3) { // the water jar
      const s = F / V.z, x = V.x, y = V.y;
      c.fillStyle = rgb(shadowCol([140, 96, 64], .5)); c.beginPath(); c.moveTo(x - .1 * s, y); c.quadraticCurveTo(x - .3 * s, y - .35 * s, x - .1 * s, y - .62 * s); c.lineTo(x - .08 * s, y - .72 * s); c.lineTo(x + .08 * s, y - .72 * s); c.lineTo(x + .1 * s, y - .62 * s); c.quadraticCurveTo(x + .3 * s, y - .35 * s, x + .1 * s, y); c.closePath(); c.fill();
      if (11.6 < zT) { c.strokeStyle = rgb(sunC, .4 * direct); c.lineWidth = Math.max(1, .03 * s); c.beginPath(); c.moveTo(x - .22 * s, y - .5 * s); c.quadraticCurveTo(x - .28 * s, y - .3 * s, x - .14 * s, y - .05 * s); c.stroke(); }
    }
    // ----- the dust in the air, lit where the sun reaches it: it drifts with the clock, and drifts back -----
    const M = st.motes1, n = M.length / 5, vf = 1;
    const paths = [new Path2D(), new Path2D(), new Path2D()];
    let any = false;
    if (direct > 0 && sy > .004) {
      for (let i = 0; i < n; i++) {
        const o = i * 5, ph = M[o + 3], q = M[o + 4];
        const x = M[o] + Math.sin(tau * 3.1 + ph) * .35 + tau * 1.1 * (q - .3) + Math.sin(t * .4 + ph) * .03;
        const y = M[o + 1] + Math.sin(tau * 2.3 + ph * 1.7) * .22 + tau * .25 * q;
        const z = M[o + 2] + Math.cos(tau * 2.7 + ph) * .3 - tau * .6;
        if (x < -XW || x > XW || y < 0 || y > HS || z < ZE || z > ZW) continue;
        // the ray toward the sun: over the west wall, through the door, or under the roof's edge
        const tW = (ZW - z) / sz, yW = y + tW * sy, xW = x + tW * sx;
        let lit = yW > HWW || (Math.abs(xW - DX) < DW && yW < DH);
        if (lit && sx < 0 && xW < -XW) { const tS = (x + XW) / -sx; if (y + tS * sy < HS) lit = false; }
        if (lit && x > PX0 && y < PY0) { const t3 = (x - PX0) / Math.max(1e-3, -sx); if (sx >= 0 || y + t3 * sy > PY0) lit = false; }
        if (!lit || !V.pj(x, y, z)) continue;
        const dx = x - E0, dy = y - E1, dz = z - E2, dl = Math.hypot(dx, dy, dz), ph2 = Math.max(0, (dx * sx + dy * sy + dz * sz) / dl);
        const b = (.16 + .84 * ph2 ** 5) * (.45 + .55 * q);
        const s = Math.max(.7, Math.min(2.6, .012 * F / V.z));
        paths[b > .5 ? 2 : b > .22 ? 1 : 0].rect(V.x, V.y, s, s); any = true;
      }
    }
    if (any) { c.globalCompositeOperation = 'lighter'; [.22, .45, .85].forEach((a, j) => { c.fillStyle = rgb(lerp(sunC, [255, 246, 220], .4), a * direct); c.fill(paths[j]); }); c.globalCompositeOperation = 'source-over'; }
    void vf;
    // ----- the two lights -----
    const lift = smooth(seg(p, .235, .27)), stand = smooth(seg(p, .415, .45)), sitBack = smooth(seg(p, .585, .62));
    const prayer = seg(p, .45, .55) > 0 && p < .56 ? 1 : 0;
    const breath = 1 + .12 * Math.sin((p - .45) * TAU * 5) * prayer * smooth(seg(p, .44, .47)) * (1 - smooth(seg(p, .54, .56)));
    const inSun = (z, x) => (z < zT && x < xR && x > xL ? direct : 0);
    const proC = [255, 236, 196], aliC = [255, 214, 150];
    const pr = [PRO[0], PRO[1] + .14 * lift, PRO[2]];
    const al = lerp(lerp(ALI1, ALI1P, stand), ALI1, sitBack);
    S.radd.light(c, V, bc, st, pr[0], pr[1], pr[2], .2, 1.05 + .15 * inSun(pr[2], pr[0]), proC);
    S.radd.light(c, V, bc, st, al[0], al[1], al[2], .15, (.92 + .25 * inSun(al[2], al[0]) + .25 * stand * (1 - sitBack)) * breath, aliC);
    if (stand > 0 && sitBack < 1) { // a faint column of light while he prays
      if (V.pj(al[0], .05, al[2])) { const s = F / V.z, x = V.x, y0 = V.y; if (V.pj(al[0], al[1] + 1.2, al[2])) { const y1 = V.y, g = c.createLinearGradient(0, y0, 0, y1); const a = .22 * stand * (1 - sitBack) * breath; g.addColorStop(0, rgb(aliC, 0)); g.addColorStop(.45, rgb(aliC, a)); g.addColorStop(1, rgb(aliC, 0)); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - .09 * s, y1, .18 * s, y0 - y1); c.globalCompositeOperation = 'source-over'; } }
    }
    // dusk: the house darkens toward blue
    if (dusk > 0) { c.fillStyle = `rgba(10,14,34,${.16 * dusk})`; c.fillRect(0, 0, W, H); }
  },

  // ======================= part two: Babil, the Euphrates =======================
  babil(c, W, H, p, t, st, bc) {
    const phone = W < H * .8;
    const tau = clock(T2, p), e = 7 - 13 * tau, az = -.2 + .1 * tau, eR = e * D2R;
    const [skT, skM, skH, sunC, amb] = keyAt(SK, e);
    const { eye, look } = camAt(CAM2, p);
    if (phone) { const back = 1.3; for (let j = 0; j < 3; j++) eye[j] = look[j] + (eye[j] - look[j]) * back; eye[1] = Math.max(1.8, eye[1]); }
    const F = phone ? W * 1.05 : Math.min(H * 1.15, W * .9), cx = W / 2, cy = H * (phone ? .64 : .48);
    const V = view(eye, look, W, H, F, cx, cy);
    const sy = Math.sin(eR), shc = Math.cos(eR), sx = Math.sin(az) * shc, sz = Math.cos(az) * shc;
    const direct = c01((e + .3) / 2.2), lowSun = c01(1 - e / 12), dusk = c01(-e / 7);
    const E0 = eye[0], E1 = eye[1], E2 = eye[2];
    const fogL = 900, fog = (d) => Math.min(.92, 1 - Math.exp(-d / fogL));
    const hz = lerp(skH, skM, .2);
    const sun = S.radd.sky(c, V, W, H, e, az, t, st, st.clouds2, bc);
    const hy = V.hy;
    // ----- the far plain: date groves on the horizon -----
    const farC = lerp(lerp(skH, [40, 36, 40], .45), [10, 12, 22], dusk * .5);
    c.fillStyle = rgb(farC); c.beginPath(); c.moveTo(0, hy + 1);
    for (let x = 0; x <= W + 8; x += 8) { const a = V.az0 + Math.atan((x - cx) / F), h = .004 + .003 * Math.abs(Math.sin(a * 90)) * (Math.sin(a * 13) > -.2 ? 1 : .3) + .002 * Math.sin(a * 400) ** 2; c.lineTo(x, hy - F * h); }
    c.lineTo(W, hy + 1); c.closePath(); c.fill();
    // ----- far bank ground -----
    const gFar = lerp(lerp([96, 80, 62], [30, 28, 34], dusk), skH, .2);
    const yF = V.pj(0, .8, ZF) ? V.y : hy + 2;
    const fg = c.createLinearGradient(0, hy, 0, yF);
    fg.addColorStop(0, rgb(lerp(farC, skH, .2))); fg.addColorStop(1, rgb(lerp(gFar, hz, fog(ZF - E2) * .7)));
    c.fillStyle = fg; c.fillRect(0, hy, W, Math.max(0, yF - hy) + 2);
    // ----- the ruins of Babylon: mounds, the stump of the tower, the broken wall, an arch; all backlit -----
    const ruinBase = [120, 92, 70];
    const ruinCol = (d, up = 0) => lerp([0, 1, 2].map((j) => ruinBase[j] / 255 * (amb[j] * (.45 + .3 * up))), lerp(hz, skH, .4), fog(d) * .9);
    const rim = (d) => rgb(lerp(sunC, [255, 240, 210], .3), .55 * direct * lowSun * (1 - fog(d) * .7));
    const ruinPaths = [];
    const drawRuin = (pts3, d, up) => { const pa = new Path2D(); if (!V.poly(pts3, pa)) return; c.fillStyle = rgb(ruinCol(d, up)); c.fill(pa); ruinPaths.push(pts3); };
    st.mounds.slice().sort((a, b) => b[1] - a[1]).forEach(([x, z, w, h]) => { const pts = []; for (let k = 0; k <= 12; k++) { const u = k / 12 * 2 - 1; pts.push([x + u * w, h * (1 - u * u) ** .7 * (1 + .08 * Math.sin(k * 3 + x)), z]); } drawRuin(pts, z - E2, .4); });
    { const { x, z, tiers } = st.zig; let y = 0; const d = z - E2; tiers.forEach(([hw, th], i) => { const er = (k) => .85 + .15 * Math.sin(k * 7.1 + i * 3); drawRuin([[x - hw, y, z], [x + hw, y, z], [x + hw * er(1) * .98, y + th * er(2), z], [x + hw * .4, y + th * er(3), z], [x - hw * .3, y + th * er(4) * .9, z], [x - hw * er(5) * .97, y + th, z]], d, .3 + i * .1); y += th * .92; });
      if (V.pj(x - tiers[0][0], tiers[0][1], z)) { const ax = V.x, ay = V.y; if (V.pj(x + tiers[0][0], tiers[0][1], z)) { c.strokeStyle = rim(d); c.lineWidth = 1; c.beginPath(); c.moveTo(ax, ay); c.lineTo(V.x, V.y); c.stroke(); } } }
    st.ruins.slice().sort((a, b) => b.z - a.z).forEach((r) => {
      const d = r.z - E2;
      if (r.kind === 'wall') {
        const pts = [[r.x0, 0, r.z], ...r.pts.map(([x, y, z]) => [x, y, z]), [r.x1, 0, r.z]];
        drawRuin(pts, d, .2);
        const pa = new Path2D(); let first = true; r.pts.forEach(([x, y, z]) => { if (!V.pj(x, y, z)) return; if (first) pa.moveTo(V.x, V.y); else pa.lineTo(V.x, V.y); first = false; });
        c.strokeStyle = rim(d); c.lineWidth = Math.max(.8, F / 1200); c.stroke(pa);
        // courses of brick: faint lines
        const cp = new Path2D(); for (let y = 1.2; y < r.h * .8; y += 1.4) { if (V.pj(r.x0 + 1, y, r.z)) { const ax = V.x, ay = V.y; if (V.pj(r.x1 - 1, y, r.z)) { cp.moveTo(ax, ay); cp.lineTo(V.x, V.y); } } }
        c.strokeStyle = rgb([20, 14, 12], .12 * (1 - fog(d))); c.stroke(cp);
      } else drawRuin([[r.x - r.w / 2, 0, r.z], [r.x + r.w / 2, 0, r.z], [r.x + r.w * .46, r.h * .9, r.z], [r.x + r.w * .1, r.h, r.z], [r.x - r.w * .3, r.h * .95, r.z], [r.x - r.w / 2, r.h * .8, r.z]], d, .25);
    });
    { const { x, z, w, h } = st.arch, d = z - E2, pa = new Path2D(); // a single standing arch
      const o = [[x - w, 0, z], [x - w, h, z], [x + w, h * .92, z], [x + w, 0, z]], inner = [[x + w * .55, 0, z]]; for (let k = 0; k <= 10; k++) { const a = k / 10 * Math.PI; inner.push([x + Math.cos(a) * w * .55, h * .55 + Math.sin(a) * w * .55, z]); } inner.push([x - w * .55, 0, z]);
      if (V.poly(o, pa)) { V.poly(inner, pa); c.fillStyle = rgb(ruinCol(d, .2)); c.fill(pa, 'evenodd'); } }
    // far-bank palms
    const items = st.palms2.filter((pm) => pm[1] > 0).map((pm) => ({ d: pm[1] - E2, pm })).sort((a, b) => b.d - a.d);
    const palmCol = (d) => rgb(lerp(lerp([22, 24, 20], hz, fog(d) * .85), [8, 10, 18], dusk * .4));
    items.forEach(({ d, pm }) => S.radd.palm(c, V, pm[0], pm[1], pm[2], pm[3], pm[4], palmCol(d), rim(d), t, .6));
    // the far shore line and its reeds
    const reedP = new Path2D(), reedN = new Path2D();
    st.reeds.forEach(([x, z, h, ph]) => { const pa = z > 0 ? reedP : reedN; const y0 = z > 0 ? .4 : .3; if (!V.pj(x, y0, z)) return; const ax = V.x, ay = V.y; if (V.x < -4 || V.x > W + 4) return; const s = V.F / V.z; for (let b = 0; b < 5; b++) { const lean = (b - 2) * .28 + Math.sin(t * .9 + ph + x * .05 + b) * .05, hh = h * (.6 + .4 * Math.sin(ph * 3 + b * 2.1) ** 2); pa.moveTo(ax + (b - 2) * .05 * s, ay); pa.quadraticCurveTo(ax + lean * hh * .3 * s, ay - hh * .6 * s, ax + lean * hh * .55 * s, ay - hh * s); } });
    c.lineWidth = Math.max(.8, F / 1400); c.strokeStyle = palmCol(ZF - E2); c.stroke(reedP);
    // ----- the river -----
    const yN = V.pj(0, 0, Math.max(0, E2 + 1)) ? V.y : H;
    const yS = V.pj(0, 0, ZF) ? V.y : hy;
    const wg = c.createLinearGradient(0, yS, 0, Math.max(yS + 1, Math.min(H, yN)));
    const wTop = lerp(lerp(skH, skM, .25), [20, 22, 30], .25), wBot = lerp(lerp(skM, skT, .6), [8, 10, 16], .35);
    wg.addColorStop(0, rgb(wTop)); wg.addColorStop(1, rgb(wBot));
    const waterP = new Path2D(); V.poly([[-3000, 0, 0], [3000, 0, 0], [3000, 0, ZF], [-3000, 0, ZF]], waterP);
    c.save(); c.clip(waterP);
    c.fillStyle = wg; c.fillRect(0, yS - 2, W, H - yS + 4);
    // the ruins and palms upside down in the water, softened
    c.globalAlpha = .45; ruinPaths.forEach((pts3) => { const pa = new Path2D(); if (V.poly(pts3.map(([x, y, z]) => [x, -y, z]), pa)) { c.fillStyle = rgb(lerp(ruinCol(pts3[0][2] - E2, 0), wBot, .3)); c.fill(pa); } }); c.globalAlpha = 1;
    // the sun's road on the water: glints that gather under the disc
    const glA = c01((e + 1.5) / 3);
    if (sun.vis && glA > 0) {
      c.globalCompositeOperation = 'lighter';
      const sp = [new Path2D(), new Path2D()];
      st.glints.forEach(([u, v, ph, q]) => {
        const z = 3 + u ** 1.25 * (ZF - 6), dz = z - E2, xs = E0 + dz * Math.tan(az) * 1, wd = (3 + dz * .1) * (.3 + 1.4 * (v - .5) ** 2 * 4) * (v < .5 ? -1 : 1);
        const x = xs + wd * .5;
        if (!V.pj(x, 0, z)) return; const L = (.6 + q * 1.8) * F / V.z * (1 + 3 * (1 - glA * .5)), on = .5 + .5 * Math.sin(t * 3 + ph * 7);
        if (on < .35) return; sp[q > .6 ? 1 : 0].moveTo(V.x - L, V.y); sp[q > .6 ? 1 : 0].lineTo(V.x + L, V.y);
      });
      c.lineWidth = Math.max(1, F / 900); c.strokeStyle = rgb(lerp(sunC, [255, 250, 230], .35), .35 * glA * lowSun); c.stroke(sp[0]); c.strokeStyle = rgb(lerp(sunC, [255, 250, 230], .6), .7 * glA * lowSun); c.stroke(sp[1]);
      const Rr = Math.max(10, (H - yS) * 1.1); c.save(); c.translate(sun.SX, yS); c.scale(.1, 1); const g = c.createRadialGradient(0, 0, 0, 0, 0, Rr); g.addColorStop(0, rgb(sunC, .3 * glA)); g.addColorStop(.5, rgb(sunC, .08 * glA)); g.addColorStop(1, rgb(sunC, 0)); c.fillStyle = g; c.fillRect(-Rr, 0, Rr * 2, Rr); c.restore();
      c.globalCompositeOperation = 'source-over';
    }
    // ripples
    const rpA = .14 + .1 * (1 - dusk), rpp = new Path2D();
    st.ripples.forEach(([x, z, ph]) => { const xx = x + Math.sin(t * .3 + ph) * 3; if (!V.pj(xx, 0, z)) return; if (V.x < -20 || V.x > W + 20) return; const L = (2 + 3 * Math.sin(ph) ** 2) * F / V.z; rpp.moveTo(V.x - L, V.y); rpp.lineTo(V.x + L, V.y); });
    c.lineWidth = 1; c.strokeStyle = rgb(lerp(skH, [255, 255, 255], .2), rpA); c.stroke(rpp);
    c.restore();
    // ----- the crossing: a long column wading the ford, torches as the light goes -----
    const P0 = [26, 0, -40], P1 = [24, 0, -1], P2 = [58, 0, ZF + 2], P3 = [64, 0, ZF + 50];
    const along = (u) => { u = c01(u) * 3; if (u < 1) return lerp(P0, P1, u); if (u < 2) return lerp(P1, P2, u - 1); return lerp(P2, P3, u - 2); };
    const depth = (z) => (z <= 0 || z >= ZF ? 0 : .95 * Math.sin(Math.PI * z / ZF) ** .6);
    const fire = c01((-e + .5) / 3) * (1 - c01((e - 1) / 2));
    const crowd = new Path2D(), torch = [];
    const col = lerp(lerp([26, 22, 22], hz, .15), [8, 10, 16], dusk * .4);
    const wad = st.wade.map((w) => { const u = w[0] + (p - .6) * .55; return [u, w]; }).filter(([u]) => u > 0 && u < 1).map(([u, w]) => { const q = along(u); return [q[0] + w[1] * .4, q[2] + w[1] * .25, w]; }).sort((a, b) => b[1] - a[1]);
    c.lineWidth = 1;
    const rippleP = new Path2D();
    wad.forEach(([x, z, w]) => {
      const kind = w[2], dp = depth(z), y0 = z > ZF ? .8 : z < 0 ? .4 : 0;
      if (!V.pj(x, y0, z)) return; const bx = V.x, by = V.y, s = F / V.z;
      if (bx < -30 || bx > W + 30) return;
      const sh = kind === 1 ? RIDER : kind === 2 ? CAMEL : MANS, dir = 1, bob = Math.sin(t * 2 + w[3]) * .03;
      if (s < 2.2) { const h = (kind ? 2.2 : 1.7) - dp; crowd.rect(bx - .3 * s, by - h * s, Math.max(.8, (kind ? 1.4 : .5) * s), Math.max(.8, h * s)); }
      else { for (let i = 0; i < sh.length; i += 2) { const X = bx + sh[i] * s * dir, Y = by - (Math.max(0, sh[i + 1] - dp) + bob) * s; i ? crowd.lineTo(X, Y) : crowd.moveTo(X, Y); } crowd.closePath(); }
      if (dp > .05) { const r = (kind ? 1.2 : .5) * s; rippleP.moveTo(bx - r, by); rippleP.lineTo(bx + r, by); }
      if (w[4] && fire > 0) torch.push([x, z, kind ? 2.9 : 2.2, w[3]]);
    });
    c.fillStyle = rgb(col); c.fill(crowd);
    c.strokeStyle = rgb(lerp(skH, [255, 240, 220], .3), .3); c.stroke(rippleP);
    // ----- the near bank -----
    const gNear = lerp(lerp([88, 72, 54], [24, 22, 26], dusk), [0, 0, 0], .2);
    const nb = new Path2D(); V.poly([[-3000, .3, 0], [3000, .3, 0], [3000, .6, -400], [-3000, .6, -400]], nb);
    if (V.pj(0, .3, 0)) { const y0 = V.y, g = c.createLinearGradient(0, y0, 0, H); g.addColorStop(0, rgb(lerp(gNear, skH, .25))); g.addColorStop(1, rgb(lerp(gNear, [6, 6, 8], .5))); c.fillStyle = g; } else c.fillStyle = rgb(gNear);
    c.fill(nb);
    c.strokeStyle = rgb(lerp(skH, [255, 236, 200], .2), .35 * (1 - dusk * .5)); c.lineWidth = 1; c.beginPath(); if (V.pj(-3000, .3, 0)) { c.moveTo(V.x, V.y); if (V.pj(3000, .3, 0)) c.lineTo(V.x, V.y); } c.stroke();
    { const mk2 = [new Path2D(), new Path2D()]; st.ripples.forEach(([x, z, ph, q], i) => { const zz = -2 - (z / ZF) * 70, xx = x * .25; if (!V.pj(xx, .32, zz)) return; const L = (.15 + .4 * q) * V.F / V.z; if (V.x < -L || V.x > W + L || V.y > H) return; mk2[i & 1].moveTo(V.x - L, V.y); mk2[i & 1].lineTo(V.x + L, V.y); }); c.lineWidth = 1; c.strokeStyle = rgb(lerp(gNear, [255, 236, 200], .25), .14); c.stroke(mk2[0]); c.strokeStyle = rgb(lerp(gNear, [0, 0, 0], .5), .25); c.stroke(mk2[1]); }
    c.lineWidth = Math.max(1, F / 1100); c.strokeStyle = rgb(lerp([20, 22, 16], [6, 8, 12], dusk * .5)); c.stroke(reedN);
    // the long shadows of the near palms and reeds toward us, when the sun is up
    if (direct > 0 && sy > .005) {
      const kx = -sx / sy, kz = sz / sy, shp = new Path2D();
      st.palms2.forEach(([x, z, h]) => { if (z > 0) return; const L = Math.min(1, 120 / (Math.hypot(kx, kz) * h)); V.poly([[x - .2, .32, z], [x + .2, .32, z], [x + .2 + kx * h * L, .32, z - kz * h * L], [x - .2 + kx * h * L, .32, z - kz * h * L]], shp); });
      c.fillStyle = `rgba(12,8,10,${.35 * direct})`; c.fill(shp);
    }
    st.palms2.filter((pm) => pm[1] <= 0).map((pm) => ({ d: Math.hypot(pm[0] - E0, pm[1] - E2), pm })).sort((a, b) => b.d - a.d).forEach(({ pm }) => S.radd.palm(c, V, pm[0], pm[1], pm[2], pm[3], pm[4], rgb(lerp([14, 14, 12], [4, 6, 10], dusk * .5)), rim(10), t, .3));
    // torches and their streaks on the water
    if (torch.length) {
      c.globalCompositeOperation = 'lighter';
      torch.forEach(([x, z, h, ph]) => {
        if (!V.pj(x, h, z)) return; const X = V.x, Y = V.y, s = F / V.z, fl = .8 + .2 * Math.sin(t * 13 + ph) * Math.sin(t * 7.3 + ph * 2);
        const r = Math.max(1.5, Math.min(9, .3 * s)); c.globalAlpha = .8 * fire * fl; c.drawImage(S.radd.tint(st, '#ffb060'), X - r * 4, Y - r * 4, r * 8, r * 8); c.fillStyle = `rgba(255,236,190,${fire * fl})`; c.beginPath(); c.arc(X, Y, r * .35, 0, TAU); c.fill();
        if (z > 0 && z < ZF && V.pj(x, 0, z)) { const y0 = V.y; c.fillStyle = `rgba(255,170,90,${.3 * fire * fl})`; c.fillRect(X - Math.max(.6, .15 * s), y0, Math.max(1.2, .3 * s), (y0 - Y) * .9); }
        bc.fillStyle = `rgba(255,170,90,${.4 * fire})`; bc.beginPath(); bc.arc(X, Y, 1.6 * r, 0, TAU); bc.fill();
      });
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    // birds over the river
    S.radd.birds(c, V, st.birds2, tau, t, .75 * c01((e + 3) / 4), lerp([24, 20, 22], skT, .2), [[-30, 170], [40, 120]], 1.6);
    // midges over the bank, lit when the sun comes back
    if (direct > 0) {
      const M = st.motes2, n = M.length / 5, pa = new Path2D();
      for (let i = 0; i < n; i++) {
        const o = i * 5, ph = M[o + 3], q = M[o + 4];
        const x = M[o] + Math.sin(tau * 4 + ph) * 1.5 + tau * 6 * (q - .4), y = M[o + 1] + Math.sin(tau * 3 + ph * 2) * .6, z = M[o + 2] + Math.cos(tau * 3.5 + ph) * 1.2;
        if (!V.pj(x, y, z)) continue;
        const dx = x - E0, dy = y - E1, dz = z - E2, dl = Math.hypot(dx, dy, dz), ph2 = Math.max(0, (dx * sx + dy * sy + dz * sz) / dl) ** 8;
        if (ph2 < .05) continue; const s = Math.max(.7, Math.min(2.4, .02 * F / V.z)); pa.rect(V.x, V.y, s, s);
      }
      c.globalCompositeOperation = 'lighter'; c.fillStyle = rgb(lerp(sunC, [255, 246, 220], .4), .45 * direct); c.fill(pa); c.globalCompositeOperation = 'source-over';
    }
    // ----- Ali's light at the water's edge -----
    const stand = smooth(seg(p, .835, .86)), pray = smooth(seg(p, .85, .87)) * (1 - smooth(seg(p, .93, .95)));
    const breath = 1 + .12 * Math.sin((p - .86) * TAU * 6) * pray;
    const aliC = [255, 214, 150];
    S.radd.light(c, V, bc, st, ALI2[0], ALI2[1] - .35 * (1 - stand), ALI2[2], .16, (1 + .3 * pray) * breath, aliC, .3);
    if (V.pj(ALI2[0], -ALI2[1], ALI2[2] + 4)) { /* reflection only shows where the water is */ }
    if (pray > 0 && V.pj(ALI2[0], .35, ALI2[2])) { const s = F / V.z, x = V.x, y0 = V.y; if (V.pj(ALI2[0], ALI2[1] + 1.3, ALI2[2])) { const y1 = V.y, g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, rgb(aliC, 0)); g.addColorStop(.45, rgb(aliC, .22 * pray * breath)); g.addColorStop(1, rgb(aliC, 0)); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - .09 * s, y1, .18 * s, y0 - y1); c.globalCompositeOperation = 'source-over'; } }
    if (dusk > 0) { c.fillStyle = `rgba(10,14,34,${.25 * dusk})`; c.fillRect(0, 0, W, H); }
  },
};
})();
