(() => {
// qada: «قضاؤه». The bench of judgment (dakkat al-qada) in the mosque of Kufa at night, seen across the arcade with
// the bench against the east wall. Three cases play out on the reed mats in front of it: the two women and the child,
// the loaves and the dirhams, the men set apart at the columns. People are faceless cloaked shapes; the child is a
// small light; Ali is a calm warm light seated on the bench, larger than every other light.
// World in metres: x right, y up, z away from the camera. The east wall stands at z = ZW.
const v3 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  mix: (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k],
};
const cr1 = (a, b, c, d, u) => .5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
const hash = (i, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const sprite = (stops, n = 128) => { const c = mk(n, n), g = c.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); stops.forEach(([o, s]) => gr.addColorStop(o, s)); g.fillStyle = gr; g.fillRect(0, 0, n, n); return c; };
const keys = (K, p) => { if (p <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (p <= K[i][0]) { const a = K[i - 1], b = K[i]; return mix(a[1], b[1], smooth((p - a[0]) / (b[0] - a[0]))); } return K[K.length - 1][1]; };
const bump = (p, a, b, c, d) => smooth(seg(p, a, b)) * (1 - smooth(seg(p, c, d)));
const lerp2 = (a, b, k) => [mix(a[0], b[0], k), mix(a[1], b[1], k)];

// ---------- the hall ----------
const ZW = 14, CEIL = 8.4, SPRING = 4.6, RISE = 2.4, COLR = .32, ARD = .8, IMP = .46, NEAR = .12;
const XS = [-22.5, -16.5, -10.5, -4.5, 4.5, 10.5, 16.5, 22.5];
const ROWS = [{ z: -1.5, xs: XS, arch: true }, { z: 5.5, xs: XS, arch: true }, { z: 10, xs: [-16.5, -10.5, -4.5, 4.5, 10.5, 16.5], arch: false }];
const ALI = [0, 1.42, 12.95];
const SCRIBE = [1.35, 1.02, 12.6];
const NICHE = [0, 2.55, 13.82];
const LAMPS = [];
[8.2, 2.2].forEach((z, r) => [0, -7.5, 7.5, -13.5, 13.5, -19.5, 19.5].forEach((x) => LAMPS.push([x, r ? 5.35 : 5.05 - Math.abs(x) * .004, z])));
const WINS = [-10.5, -4.5, 4.5, 10.5].map((x) => [x, 6.3, 7.5]); // high windows in the east wall: x, y0, y1
const BLIND = [-7.5, 7.5, -13.5, 13.5, -19.5, 19.5];

// ---------- camera: [p, eye, look, focal] ----------
const CAM = [
  [-.06, [0, 2.9, -15.5], [0, 2.55, 10], 1],
  [0, [0, 2.8, -14.5], [0, 2.5, 10], 1],
  [.06, [.4, 2.15, -5.5], [0, 1.85, 10], 1.04],
  [.115, [.95, 1.7, 1.2], [0, 1.25, 9.6], 1.1],
  [.2, [.55, 2.45, 2.7], [0, .8, 9.4], 1.12],
  [.28, [-.35, 2.35, 3.2], [0, .85, 9.5], 1.14],
  [.335, [0, 2.0, 2.2], [0, 1.3, 9.6], 1.08],
  [.405, [0, 5.3, 7.6], [0, 0, 10.75], .95],
  [.46, [0, 5.0, 8.3], [0, 0, 10.55], 1],
  [.6, [0, 4.85, 8.4], [0, 0, 10.5], 1.02],
  [.65, [0, 5.3, 7.9], [0, 0, 10.65], .97],
  [.715, [0, 3.35, -8.8], [0, 2.1, 9], .96],
  [.79, [0, 2.6, -3.2], [0, 1.75, 9], 1],
  [.85, [0, 2.4, -2.4], [0, 1.7, 9], 1.03],
  [.92, [0, 3.1, -7.6], [0, 2.0, 9], .99],
  [1, [0, 3.75, -14.5], [0, 2.5, 9], .95],
  [1.06, [0, 3.85, -15], [0, 2.5, 9], .95],
];
function camAt(p) {
  let i = 0; while (i < CAM.length - 2 && p > CAM[i + 1][0]) i++;
  const u = c01((p - CAM[i][0]) / (CAM[i + 1][0] - CAM[i][0])), A = CAM[Math.max(0, i - 1)], B = CAM[i], C = CAM[i + 1], D = CAM[Math.min(CAM.length - 1, i + 2)];
  const sp = (j) => [0, 1, 2].map((q) => cr1(A[j][q], B[j][q], C[j][q], D[j][q], u));
  return { eye: sp(1), look: sp(2), fm: cr1(A[3], B[3], C[3], D[3], u) };
}

// ---------- silhouettes (local metres, u right, v up) ----------
const WOMAN = [[-.3, 0], [-.27, .32], [-.215, .72], [-.2, 1.02], [-.215, 1.24], [-.205, 1.37], [-.155, 1.47], [-.12, 1.59], [-.06, 1.66], [0, 1.68]];
const MAN = [[-.27, 0], [-.245, .4], [-.205, .86], [-.22, 1.16], [-.245, 1.39], [-.19, 1.47], [-.075, 1.505], [-.07, 1.545], [-.112, 1.6], [-.116, 1.7], [-.07, 1.77], [0, 1.79]];
const KNEEL = [[-.36, 0], [-.4, .1], [-.36, .3], [-.27, .52], [-.2, .7], [-.12, .8], [-.02, .85], [.08, .84], [.16, .78], [.2, .7], [.16, .58], [.26, .44], [.36, .24], [.4, .08], [.36, 0]];
function figPts(base, o) { // mirror a half profile, then lean, bow and step
  let pts = base === KNEEL ? KNEEL.map((q) => [q[0] * o.dir, q[1]]) : base.concat(base.slice(0, -1).reverse().map(([u, v]) => [-u, v]));
  const piv = o.piv ?? .95;
  return pts.map(([u, v]) => {
    let x = u + (o.lean || 0) * v, y = v;
    if (o.bow && v > piv) { const a = o.bow * (o.bowMax ?? .55) * o.dir, dx = x - (o.lean || 0) * piv, dy = v - piv; x = (o.lean || 0) * piv + dx * Math.cos(a) + dy * Math.sin(a); y = piv - dx * Math.sin(a) + dy * Math.cos(a); }
    if (o.sink) y *= 1 - o.sink * (v < .6 ? .45 : .32);
    return [x, y];
  });
}
function smoothPath(c, pts) {
  const n = pts.length; c.beginPath();
  const m0 = lerp2(pts[n - 1], pts[0], .5); c.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], m = lerp2(a, b, .5); c.quadraticCurveTo(a[0], a[1], m[0], m[1]); }
  c.closePath();
}
// a seated or standing figure as stacked discs, for the high camera: [y, r, forward]
const SEAT = [[0, .42, .1], [.07, .44, .1], [.14, .4, .08], [.21, .3, .02], [.3, .245, -.02], [.4, .235, -.03], [.5, .23, -.03], [.58, .235, -.02], [.64, .22, -.01], [.69, .16, 0], [.72, .085, .01], [.76, .1, .02], [.82, .108, .02], [.88, .1, .02], [.93, .07, .02]];
const STAND = SEAT.map(([y, r, f], i) => [i < 9 ? i / 8 * 1.38 : 1.38 + (y - .64) * 1.5, i < 3 ? .27 : i < 9 ? .22 + .02 * Math.sin(i) : r, 0]);

S.qada = {
  init(el, st) {
    st.cv = el.querySelector('canvas');
    st.c = st.cv.getContext('2d');
    const R = rng(4417);
    st.warm = sprite([[0, 'rgba(255,214,150,1)'], [.25, 'rgba(255,170,90,.45)'], [.6, 'rgba(240,130,60,.1)'], [1, 'rgba(240,120,50,0)']]);
    st.core = sprite([[0, 'rgba(255,252,240,1)'], [.3, 'rgba(255,236,200,.6)'], [1, 'rgba(255,220,170,0)']]);
    st.ali = sprite([[0, 'rgba(255,250,236,1)'], [.12, 'rgba(255,236,196,.8)'], [.35, 'rgba(255,206,140,.3)'], [.7, 'rgba(240,170,100,.07)'], [1, 'rgba(240,160,90,0)']], 256);
    st.pool = sprite([[0, 'rgba(255,190,120,1)'], [.4, 'rgba(255,170,100,.45)'], [1, 'rgba(255,150,80,0)']]);
    st.cold = sprite([[0, 'rgba(210,226,255,1)'], [.35, 'rgba(170,196,240,.35)'], [1, 'rgba(150,180,230,0)']]);
    st.pale = sprite([[0, 'rgba(255,244,220,1)'], [.45, 'rgba(250,232,200,.4)'], [1, 'rgba(240,220,190,0)']]);
    st.dark = sprite([[0, 'rgba(0,0,0,.85)'], [.6, 'rgba(0,0,0,.35)'], [1, 'rgba(0,0,0,0)']]);
    st.noise = mk(192, 192);
    { const ng = st.noise.getContext('2d'), id = ng.createImageData(192, 192); for (let i = 0; i < id.data.length; i += 4) { const v = R() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 22; } ng.putImageData(id, 0, 0); }
    st.motes = Array.from({ length: 150 }, () => [(R() - .5) * 12, .3 + R() * 6, 3 + R() * 10, R()]);
    st.dust = Array.from({ length: 90 }, () => [(R() - .5) * 14, 2 + R() * 10, R(), R()]);
    st.mats = []; for (let z = .3; z < 11.1; z += 1.06) st.mats.push([z, z + .98, R()]);
    // case 2: the loaves and their thirds; A has five, B three
    const LA = [[-.79, 9.96], [-.79, 10.22], [-.79, 10.48], [-.55, 10.09], [-.55, 10.35]], LB = [[.72, 10.09], [.72, 10.35], [.49, 10.22]];
    st.loaves = LA.map((q) => ({ q, own: 0 })).concat(LB.map((q) => ({ q, own: 1 })));
    const PORT = [[-.66, 10.22, 1, 0], [.64, 10.22, -1, 0], [0, 9.68, 0, -1]]; // centre x, z, facing (toward the eater)
    st.wedges = []; const cnt = [0, 0, 0];
    st.loaves.forEach((lf, j) => { for (let m = 0; m < 3; m++) {
      const k = lf.own ? (j - 5) * 3 + m : j * 3 + m; // index within its owner
      const to = lf.own === 0 ? (k < 8 ? 0 : 2) : (k < 8 ? 1 : 2);
      const s = cnt[to]++, Pp = PORT[to], col = s % 4, row = (s / 4) | 0;
      const ax = Pp[2] ? [0, 1] : [1, 0], tw = Pp[2] ? [-Pp[2], 0] : [0, -Pp[3]];
      const dst = [Pp[0] + ax[0] * (col - 1.5) * .125 + tw[0] * (row - .5) * .14, Pp[1] + ax[1] * (col - 1.5) * .125 + tw[1] * (row - .5) * .14];
      const face = Math.atan2(-tw[1], -tw[0]); // the wedge points toward the eater
      st.wedges.push({ j, m, own: lf.own, to, dst, face, d: R() * .012 + (to === 2 ? .01 : 0), ph: R() * TAU });
    } });
    st.crumbs = Array.from({ length: 70 }, () => [R(), R(), R(), R()]);
  },
  frame(p, t, el, st) {
    fit(st.cv);
    const { c, cv } = st;
    const W = cv.width, H = cv.height, k = W / Math.max(1, cv.clientWidth), phone = W < H;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // ---------- timing ----------
    const c1 = bump(p, .075, .105, .325, .36), c2 = bump(p, .39, .42, .64, .67), c3 = bump(p, .69, .72, 1.2, 1.3);
    const hall = keys([[-.1, 1], [.18, 1], [.22, .72], [.27, 1.05], [.34, 1], [.4, .42], [.64, .42], [.7, .3], [.79, .22], [.95, .32], [1.02, .7]], p);
    const takbir = seg(p, .872, .93), tkR = ease.out(takbir) * 30, tkOn = takbir > 0 && takbir < 1;
    const aliI = 1 + .7 * bump(p, .25, .262, .27, .31) + .7 * bump(p, .598, .61, .625, .655) + .9 * bump(p, .868, .876, .885, .93) + .35 * bump(p, .935, .95, 1, 1.2);
    // ---------- camera ----------
    const cm = camAt(p), eye = cm.eye.slice(), look = cm.look.slice();
    if (tkOn) { const sh = .045 * (1 - takbir) ** 2; eye[0] += sh * Math.sin(p * 900); eye[1] += sh * Math.sin(p * 1300 + 1); }
    if (phone) { // a tall screen: stand back a little so the cases stay in frame; the overhead backs off most
      const back = 1 + .45 * c2 + .12 * c1 * (1 - c2) + .28 * (1 - c1) * (1 - c2);
      for (let j = 0; j < 3; j++) eye[j] = look[j] + (eye[j] - look[j]) * back;
    }
    const fw = v3.norm(v3.sub(look, eye)), rt = v3.norm(v3.cross([0, 1, 0], fw)), up = v3.cross(fw, rt);
    const F = Math.min(H * 1.12, W * (phone ? 1.5 : 1.4)) * cm.fm * (phone ? mix(1.18, 1, Math.max(c1, c2)) : 1), cx = W / 2, cy = H * (phone ? .6 : .5);
    const toC = (q) => { const d = [q[0] - eye[0], q[1] - eye[1], q[2] - eye[2]]; return [d[0] * rt[0] + d[1] * rt[1] + d[2] * rt[2], d[0] * up[0] + d[1] * up[1] + d[2] * up[2], d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2]]; };
    const prj = (q) => [cx + F * q[0] / q[2], cy - F * q[1] / q[2], q[2]];
    const P = (q) => { const a = toC(q); return a[2] < NEAR ? null : prj(a); };
    const poly = (pts) => {
      const cs = pts.map(toC), out = [];
      for (let i = 0; i < cs.length; i++) { const a = cs[i], b = cs[(i + 1) % cs.length], ia = a[2] >= NEAR, ib = b[2] >= NEAR; if (ia) out.push(a); if (ia !== ib) { const f = (NEAR - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, NEAR]); } }
      if (out.length < 3) return null;
      const pa = new Path2D(); out.forEach((q, i) => { const s = prj(q); if (i) pa.lineTo(s[0], s[1]); else pa.moveTo(s[0], s[1]); }); pa.closePath(); return pa;
    };
    const line = (a, b) => { let A = toC(a), B = toC(b); if (A[2] < NEAR && B[2] < NEAR) return null; if (A[2] < NEAR) A = v3.mix(A, B, (NEAR - A[2]) / (B[2] - A[2])); else if (B[2] < NEAR) B = v3.mix(B, A, (NEAR - B[2]) / (A[2] - B[2])); return [prj(A), prj(B)]; };
    const strokeSegs = (segs, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); segs.forEach(([a, b]) => { const l = line(a, b); if (l) { c.moveTo(l[0][0], l[0][1]); c.lineTo(l[1][0], l[1][1]); } }); c.stroke(); };
    const glow = (q, r, img, a) => { if (a <= .002 || r < .5) return; c.globalAlpha = Math.min(1, a); c.drawImage(img, q[0] - r, q[1] - r, r * 2, r * 2); c.globalAlpha = 1; };
    const stamp = (img, o, ax, ay, r, a) => { // a sprite lying in a plane through o, spanned by unit axes ax, ay
      const A = P(o), B = P(v3.add(o, v3.mul(ax, r))), C = P(v3.add(o, v3.mul(ay, r))); if (!A || !B || !C || a <= .002) return;
      c.setTransform(B[0] - A[0], B[1] - A[1], C[0] - A[0], C[1] - A[1], A[0], A[1]); c.globalAlpha = Math.min(1, a); c.drawImage(img, -1, -1, 2, 2); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
    };
    // ---------- lights ----------
    const lampI = LAMPS.map(([x, , z], i) => {
      let I = hall * (.85 + .15 * Math.sin(t * 7 + i * 3) * Math.sin(t * 3.1 + i));
      if (takbir > 0) { const d = Math.hypot(x - ALI[0], z - ALI[2]), w = Math.exp(-(((d - tkR) / 2.2) ** 2)); I += 1.6 * w * (1 - takbir * .6) + .25 * c01((tkR - d) / 3) * (1 - takbir); }
      return I;
    });
    const MEN3 = [[-3.85, 9.55], [3.85, 9.55], [-3.75, 6.05], [3.75, 6.05]];
    const COL3 = [[-4.5, 10], [4.5, 10], [-4.5, 5.5], [4.5, 5.5]];
    const sepT = (i) => smooth(seg(p, .738 + i * .008, .772 + i * .008));
    const askI = [bump(p, .79, .796, .804, .81), bump(p, .808, .814, .822, .828), bump(p, .826, .832, .84, .846), bump(p, .844, .85, .87, .9)];
    const confess = smooth(seg(p, .858, .871));
    const colLampI = COL3.map((_, i) => c3 * sepT(i) * (.75 + .5 * askI[i] + .25 * Math.sin(t * 6 + i * 2) * .3) + (takbir > 0 ? 1.2 * Math.exp(-(((Math.hypot(COL3[i][0], COL3[i][1] - ALI[2]) - tkR) / 2) ** 2)) * (1 - takbir) : 0));
    const floorLamp = c2 * (.92 + .08 * Math.sin(t * 5.3) * Math.sin(t * 8.1));
    const L = [];
    LAMPS.forEach((q, i) => L.push({ q: [q[0], q[1] - .3, q[2]], col: [1, .62, .3], I: .95 * lampI[i], R: 1.7 }));
    L.push({ q: NICHE, col: [1, .64, .32], I: .8 * (.6 + .4 * hall), R: 1.1 });
    L.push({ q: ALI, col: [1, .78, .52], I: 1.15 * aliI, R: 1.8 });
    if (c2 > 0) L.push({ q: [.95, .35, 10.75], col: [1, .66, .3], I: 1.9 * floorLamp, R: 1.15 });
    COL3.forEach(([x, z], i) => { if (colLampI[i] > .01) L.push({ q: [x + (x < 0 ? .45 : -.45), 2.45, z - .25], col: [1, .7, .42], I: 1.5 * colLampI[i], R: 1.3 }); });
    const scribeI = c3 * smooth(seg(p, .775, .795)) * (.8 + .4 * (askI[0] + askI[1] + askI[2]));
    if (scribeI > .01) L.push({ q: SCRIBE, col: [1, .9, .74], I: .9 * scribeI, R: .9 });
    const AMB = [.03, .032, .05];
    const lit = (q, n) => {
      let r = AMB[0], g = AMB[1], b = AMB[2];
      for (let i = 0; i < L.length; i++) {
        const l = L[i], dx = l.q[0] - q[0], dy = l.q[1] - q[1], dz = l.q[2] - q[2], dd = dx * dx + dy * dy + dz * dz;
        let f = l.I / (1 + dd / (l.R * l.R));
        if (n) { const nd = (dx * n[0] + dy * n[1] + dz * n[2]) / Math.sqrt(dd + 1e-6); f *= Math.max(0, nd) * .85 + .15; }
        r += l.col[0] * f; g += l.col[1] * f; b += l.col[2] * f;
      }
      return [r, g, b];
    };
    const tone = (alb, E) => [0, 1, 2].map((j) => 255 * (1 - Math.exp(-alb[j] / 255 * E[j] * 1.5)));
    const HAZE = [16, 14, 16];
    const fogK = (q) => c01((Math.hypot(q[0] - eye[0], q[2] - eye[2]) - 8) / 40) * .75;
    const shadeAt = (alb, q, n) => mixc(tone(alb, lit(q, n)), HAZE, fogK(q));

    // ---------- ceiling ----------
    c.fillStyle = '#060507'; c.fillRect(0, 0, W, H);
    const ceil = poly([[-40, CEIL, -30], [40, CEIL, -30], [40, CEIL, ZW], [-40, CEIL, ZW]]);
    if (ceil) {
      const a = P([0, CEIL, 6]);
      c.fillStyle = rgb(shadeAt([60, 40, 26], [0, CEIL, 6], [0, -1, 0])); c.fill(ceil);
      c.save(); c.clip(ceil);
      c.globalCompositeOperation = 'lighter';
      LAMPS.forEach((q, i) => stamp(st.pool, [q[0], CEIL - .01, q[2]], [1, 0, 0], [0, 0, 1], 3.2, .16 * lampI[i]));
      c.globalCompositeOperation = 'source-over';
      const beams = []; for (let x = -39; x <= 39; x += 1.25) beams.push([[x, CEIL - .02, -30], [x, CEIL - .02, ZW]]);
      strokeSegs(beams, 'rgba(8,5,3,.75)', Math.max(1, 2.2 * k));
      const cross = []; for (let z = -28; z < ZW; z += 3.5) cross.push([[-40, CEIL - .05, z], [40, CEIL - .05, z]]);
      strokeSegs(cross, 'rgba(6,4,2,.5)', Math.max(1, 1 * k));
      c.restore();
      void a;
    }
    // ---------- east wall ----------
    const wall = poly([[-40, 0, ZW], [40, 0, ZW], [40, CEIL, ZW], [-40, CEIL, ZW]]);
    if (wall) {
      { const Up = P([0, CEIL, ZW]), Dn = P([0, 0, ZW]); const base = shadeAt([120, 92, 64], [0, 3.5, ZW], [0, 0, -1]); if (Up && Dn) { const g = c.createLinearGradient(0, Up[1], 0, Dn[1]); g.addColorStop(0, rgb(mixc(base, [0, 0, 0], .55))); g.addColorStop(.6, rgb(base)); g.addColorStop(1, rgb(mixc(base, [0, 0, 0], .2))); c.fillStyle = g; } else c.fillStyle = rgb(base); c.fill(wall); }
      c.save(); c.clip(wall);
      // windows: the night outside, a cold breath of moonlight on their reveals
      WINS.forEach(([x, y0, y1]) => {
        const o = []; o.push([x - .5, y0, ZW - .01], [x + .5, y0, ZW - .01]); for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI; o.push([x + .5 * Math.cos(a), y1 - .5 + .5 * Math.sin(a), ZW - .01]); }
        const pa = poly([o[0], o[1], ...o.slice(2)]); if (!pa) return;
        c.fillStyle = 'rgba(24,34,60,1)'; c.fill(pa);
        const ql = P([x, y1 - .3, ZW]); if (ql) { c.globalCompositeOperation = 'lighter'; glow(ql, F / ql[2] * .9, st.cold, .25); c.globalCompositeOperation = 'source-over'; }
        const gr = []; for (let g = -.3; g <= .31; g += .2) gr.push([[x + g, y0, ZW - .02], [x + g, y1, ZW - .02]]); for (let y = y0 + .3; y < y1; y += .3) gr.push([[x - .5, y, ZW - .02], [x + .5, y, ZW - .02]]);
        strokeSegs(gr, 'rgba(10,8,8,.9)', Math.max(1, 1.6 * k));
      });
      // blind arcades
      BLIND.forEach((x) => {
        const o = [[x - 1.2, .9, ZW - .01], [x + 1.2, .9, ZW - .01]]; for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI; o.push([x + 1.2 * Math.cos(a), 4.3 + .95 * Math.sin(a), ZW - .01]); }
        const pa = poly(o); if (!pa) return;
        c.fillStyle = rgb(mixc(shadeAt([120, 92, 64], [x, 2.6, ZW], [0, 0, -1]), [0, 0, 0], .35)); c.fill(pa);
        c.strokeStyle = 'rgba(20,12,6,.45)'; c.lineWidth = Math.max(1, 1.2 * k); c.stroke(pa);
      });
      // brick courses
      const br = []; for (let y = .3; y < CEIL; y += .32) br.push([[-40, y, ZW - .005], [40, y, ZW - .005]]);
      strokeSegs(br, 'rgba(40,24,12,.16)', Math.max(1, .8 * k));
      // a frieze: a band of small lozenges in fired brick
      { const fz = poly([[-40, 5.55, ZW - .006], [40, 5.55, ZW - .006], [40, 5.95, ZW - .006], [-40, 5.95, ZW - .006]]); if (fz) { c.fillStyle = 'rgba(20,10,4,.28)'; c.fill(fz); const lz = []; for (let x = -39.5; x < 40; x += .5) lz.push([[x, 5.75, ZW - .008], [x + .25, 5.9, ZW - .008]], [[x + .25, 5.9, ZW - .008], [x + .5, 5.75, ZW - .008]], [[x, 5.75, ZW - .008], [x + .25, 5.6, ZW - .008]], [[x + .25, 5.6, ZW - .008], [x + .5, 5.75, ZW - .008]]); strokeSegs(lz, 'rgba(200,150,90,.14)', Math.max(.6, .8 * k)); } }
      // the dado
      const dd = poly([[-40, 0, ZW - .006], [40, 0, ZW - .006], [40, .9, ZW - .006], [-40, .9, ZW - .006]]);
      if (dd) { c.fillStyle = 'rgba(30,18,10,.35)'; c.fill(dd); }
      // the niche above the bench
      { const o = [[-.55, 1.85, ZW - .01], [.55, 1.85, ZW - .01]]; for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI; o.push([.55 * Math.cos(a), 3.0 + .55 * Math.sin(a), ZW - .01]); } const pa = poly(o); if (pa) { c.fillStyle = 'rgba(36,20,10,1)'; c.fill(pa); c.strokeStyle = rgb(shadeAt([190, 150, 100], NICHE, [0, 0, -1]), .6); c.lineWidth = Math.max(1, 2 * k); c.stroke(pa); } }
      // light pools on the wall
      c.globalCompositeOperation = 'lighter';
      LAMPS.forEach((q, i) => { const d = ZW - q[2]; stamp(st.pool, [q[0], q[1] - .4, ZW - .02], [1, 0, 0], [0, 1, 0], 2.2 + d * .5, .36 * lampI[i] / (1 + d * d * .06)); });
      stamp(st.pool, [0, 1.6, ZW - .02], [1, 0, 0], [0, 1, 0], 3.2, .34 * aliI);
      stamp(st.pool, [NICHE[0], NICHE[1], ZW - .02], [1, 0, 0], [0, 1, 0], 1.3, .5);
      if (scribeI > .01) stamp(st.pale, [SCRIBE[0], 1.2, ZW - .02], [1, 0, 0], [0, 1, 0], 1.3, .3 * scribeI);
      COL3.forEach(([x, z], i) => { if (z > 9 && colLampI[i] > .01) stamp(st.pool, [x + (x < 0 ? .45 : -.45), 2.3, ZW - .02], [1, 0, 0], [0, 1, 0], 2.6, .35 * colLampI[i]); });
      c.globalCompositeOperation = 'source-over';
      c.restore();
    }
    // ---------- floor: reed mats ----------
    const floor = poly([[-40, 0, -30], [40, 0, -30], [40, 0, ZW], [-40, 0, ZW]]);
    if (floor) {
      c.fillStyle = rgb(shadeAt([96, 76, 54], [0, 0, 6], [0, 1, 0])); c.fill(floor);
      c.save(); c.clip(floor);
      const ms = [], mw = [], mx = [];
      st.mats.forEach(([z0, z1, r]) => {
        const pa = poly([[-13, .002, z0], [13, .002, z0], [13, .002, z1], [-13, .002, z1]]); if (!pa) return;
        c.fillStyle = `rgba(${150 + r * 30 | 0},${118 + r * 20 | 0},${70 + r * 10 | 0},.1)`; c.fill(pa);
        for (let q = 1; q < 16; q++) ms.push([[-13, .003, mix(z0, z1, q / 16)], [13, .003, mix(z0, z1, q / 16)]]);
        for (let x = -12.8; x < 13; x += .55) mx.push([[x, .003, z0], [x, .003, z1]]);
        mw.push([[-13, .003, z1 + .02], [13, .003, z1 + .02]], [[-13, .003, z0 - .01], [13, .003, z0 - .01]]);
      });
      strokeSegs(ms, 'rgba(230,190,120,.045)', Math.max(.6, .7 * k));
      strokeSegs(mx, 'rgba(20,12,6,.12)', Math.max(.6, .6 * k));
      strokeSegs(mw, 'rgba(6,4,2,.55)', Math.max(1, 1.8 * k));
      c.globalCompositeOperation = 'lighter';
      LAMPS.forEach((q, i) => stamp(st.pool, [q[0], .01, q[2]], [1, 0, 0], [0, 0, 1], 3.6, .34 * lampI[i]));
      stamp(st.pool, [0, .01, 11.2], [1, 0, 0], [0, 0, 1], 3.4, .35 * aliI);
      if (c2 > 0) stamp(st.pool, [.95, .01, 10.75], [1, 0, 0], [0, 0, 1], 2.4, .75 * floorLamp);
      COL3.forEach(([x, z], i) => { if (colLampI[i] > .01) stamp(st.pool, [x + (x < 0 ? .7 : -.7), .01, z - .4], [1, 0, 0], [0, 0, 1], 2.3, .7 * colLampI[i]); });
      // moonlight from the high windows: pale patches on the mats
      const moon = .5 + .5 * c3;
      WINS.forEach(([x]) => stamp(st.cold, [x * .92, .01, ZW - 6.2], [1, 0, 0], [0, 0, 1], 1.5, .1 * moon));
      c.globalCompositeOperation = 'source-over';
      c.restore();
    }
    // ---------- shafts of moonlight ----------
    {
      c.globalCompositeOperation = 'lighter';
      const moon = .5 + .5 * c3;
      WINS.forEach(([x, y0, y1], i) => {
        const A = P([x - .45, y1 - .2, ZW - .02]), B = P([x + .45, y1 - .2, ZW - .02]), C = P([x * .92 + .7, .02, ZW - 6.6]), D = P([x * .92 - .7, .02, ZW - 6.6]);
        if (!A || !B || !C || !D) return;
        const g = c.createLinearGradient((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (C[0] + D[0]) / 2, (C[1] + D[1]) / 2);
        g.addColorStop(0, `rgba(150,176,230,${.075 * moon})`); g.addColorStop(1, 'rgba(150,176,230,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.lineTo(C[0], C[1]); c.lineTo(D[0], D[1]); c.closePath(); c.fill();
        void i; void y0;
      });
      c.globalCompositeOperation = 'source-over';
    }

    // ---------- objects, far to near ----------
    const items = [];
    const dist = (q) => Math.hypot(q[0] - eye[0], q[1] - eye[1], q[2] - eye[2]);
    // boxes: [x0,x1,y0,y1,z0,z1, albedo]
    const box = (b, alb) => {
      const [x0, x1, y0, y1, z0, z1] = b;
      const F6 = [[[0, 0, -1], [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]]], [[-1, 0, 0], [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]]], [[1, 0, 0], [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]]], [[0, 1, 0], [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]], [[0, -1, 0], [[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]]]];
      F6.forEach(([n, pts]) => {
        if (v3.dot(n, v3.sub(eye, pts[0])) <= 0) return;
        const pa = poly(pts); if (!pa) return;
        const ctr = v3.mul(pts.reduce((s, q) => v3.add(s, q), [0, 0, 0]), .25);
        c.fillStyle = rgb(shadeAt(alb, ctr, n)); c.fill(pa);
        c.strokeStyle = 'rgba(10,6,4,.35)'; c.lineWidth = Math.max(.6, .6 * k); c.stroke(pa);
      });
    };
    const column = (x, z, top) => {
      const sideN = v3.norm([-(eye[2] - z), 0, eye[0] - x]), r = COLR;
      const a0 = [x + sideN[0] * r, .3, z + sideN[2] * r], a1 = [x - sideN[0] * r, .3, z - sideN[2] * r];
      const pa = poly([a0, a1, [a1[0], top, a1[2]], [a0[0], top, a0[2]]]);
      if (pa) {
        const A = P(a0), B = P(a1);
        if (A && B) {
          const g = c.createLinearGradient(A[0], A[1], B[0], B[1]);
          const nl = v3.norm([sideN[0], 0, sideN[2]]), nr = v3.mul(nl, -1), nf = v3.norm([eye[0] - x, 0, eye[2] - z]);
          const mid = [x, Math.min(top, 2.4), z];
          g.addColorStop(0, rgb(shadeAt([150, 126, 98], v3.add(mid, v3.mul(nl, r)), v3.norm(v3.add(nl, v3.mul(nf, .3)))))); g.addColorStop(.5, rgb(shadeAt([150, 126, 98], v3.add(mid, v3.mul(nf, r)), nf))); g.addColorStop(1, rgb(shadeAt([150, 126, 98], v3.add(mid, v3.mul(nr, r)), v3.norm(v3.add(nr, v3.mul(nf, .3))))));
          c.fillStyle = g; c.fill(pa);
          // shade toward the floor and the capital; drum joints
          const U = P([x, top, z]), D = P([x, .3, z]);
          if (U && D) { const vg = c.createLinearGradient(0, D[1], 0, U[1]); vg.addColorStop(0, 'rgba(8,5,3,.35)'); vg.addColorStop(.35, 'rgba(8,5,3,0)'); vg.addColorStop(.8, 'rgba(8,5,3,0)'); vg.addColorStop(1, 'rgba(8,5,3,.3)'); c.fillStyle = vg; c.fill(pa); }
          const j = []; for (let y = .9; y < top; y += .62) j.push([[a0[0], y, a0[2]], [x + nf[0] * r, y - .02, z + nf[2] * r]], [[x + nf[0] * r, y - .02, z + nf[2] * r], [a1[0], y, a1[2]]]);
          strokeSegs(j, 'rgba(20,12,6,.25)', Math.max(.6, .7 * k));
        }
      }
      box([x - .42, x + .42, 0, .3, z - .42, z + .42], [120, 96, 72]);
      box([x - IMP, x + IMP, top, top + .3, z - IMP, z + IMP], [130, 104, 78]);
    };
    const arch = (x0, x1, z) => { // the arcade wall over one bay: the soffit, then the face toward us
      const xa = x0 + IMP, xb = x1 - IMP, hw = (xb - xa) / 2, xm = (xa + xb) / 2, n = 18;
      const curve = (zz) => { const o = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI; o.push([xm + hw * Math.cos(a), SPRING + RISE * Math.sin(a), zz]); } return o; };
      const zf = eye[2] < z ? z - ARD / 2 : z + ARD / 2, zb = eye[2] < z ? z + ARD / 2 : z - ARD / 2;
      const front = curve(zf), back = curve(zb);
      for (let i = 0; i < n; i++) { // the soffit, in strips
        const pa = poly([front[i], front[i + 1], back[i + 1], back[i]]); if (!pa) continue;
        const a = (i + .5) / n * Math.PI, nrm = v3.norm([-Math.cos(a) / hw, -Math.sin(a) / RISE, 0]);
        c.fillStyle = rgb(mixc(shadeAt([140, 108, 76], [xm + hw * Math.cos(a), SPRING + RISE * Math.sin(a), z], nrm), [0, 0, 0], .25)); c.fill(pa);
      }
      const face = poly([[x0, SPRING, zf], [x0, CEIL, zf], [x1, CEIL, zf], [x1, SPRING, zf], [xb, SPRING, zf], ...front, [xa, SPRING, zf]]);
      if (face) {
        const nz = eye[2] < z ? [0, 0, -1] : [0, 0, 1];
        const Up = P([xm, CEIL, zf]), Dn = P([xm, SPRING, zf]);
        if (Up && Dn) { const g = c.createLinearGradient(0, Up[1], 0, Dn[1]); g.addColorStop(0, rgb(shadeAt([140, 110, 80], [xm, CEIL - .5, zf], nz))); g.addColorStop(1, rgb(shadeAt([140, 110, 80], [xm, SPRING + 1, zf], nz))); c.fillStyle = g; } else c.fillStyle = rgb(shadeAt([140, 110, 80], [xm, 6, zf], nz));
        c.fill(face);
        // voussoirs and the extrados
        const vs = []; for (let i = 0; i <= n; i += 2) { const a = i / n * Math.PI; vs.push([[xm + hw * Math.cos(a), SPRING + RISE * Math.sin(a), zf], [xm + (hw + .42) * Math.cos(a), SPRING + (RISE + .42) * Math.sin(a), zf]]); }
        for (let i = 0; i < n; i++) { const a = i / n * Math.PI, b = (i + 1) / n * Math.PI; vs.push([[xm + (hw + .42) * Math.cos(a), SPRING + (RISE + .42) * Math.sin(a), zf], [xm + (hw + .42) * Math.cos(b), SPRING + (RISE + .42) * Math.sin(b), zf]]); }
        strokeSegs(vs, 'rgba(24,14,8,.4)', Math.max(.6, .9 * k));
        strokeSegs([[[x0, CEIL - .25, zf], [x1, CEIL - .25, zf]]], 'rgba(20,12,6,.5)', Math.max(1, 1.4 * k));
      }
    };
    ROWS.forEach((row) => {
      row.xs.forEach((x) => items.push({ d: dist([x, 2.4, row.z]), f: () => column(x, row.z, row.arch ? SPRING - .3 : CEIL - .3) }));
      if (row.arch) for (let i = 0; i < row.xs.length - 1; i++) { const x0 = row.xs[i], x1 = row.xs[i + 1]; items.push({ d: dist([(x0 + x1) / 2, 6.5, row.z]) + .5, f: () => arch(x0, x1, row.z) }); }
    });
    // the bench: brick, a rug on top, a step
    items.push({ d: dist([0, .4, 12.8]) + 1, f: () => {
      box([-1.95, 1.95, 0, .75, 12.0, ZW - .01], [92, 70, 52]);
      box([-.9, .9, 0, .36, 11.6, 12.0], [104, 80, 58]);
      const rug = poly([[-1.78, .76, 12.12], [1.78, .76, 12.12], [1.78, .76, 13.88], [-1.78, .76, 13.88]]);
      if (rug) { c.fillStyle = rgb(shadeAt([64, 22, 18], [0, .8, 12.3], [0, 1, 0])); c.fill(rug); const rb = poly([[-1.64, .762, 12.24], [1.64, .762, 12.24], [1.64, .762, 13.76], [-1.64, .762, 13.76]]); if (rb) { c.strokeStyle = rgb(shadeAt([200, 160, 90], [0, .8, 12.8], [0, 1, 0]), .7); c.lineWidth = Math.max(1, 1.2 * k); c.stroke(rb); } }
      // the scribe's place: a low desk and a sheet
      const sc = c3 * smooth(seg(p, .772, .79));
      if (sc > .01) {
        c.globalAlpha = sc; box([.95, 1.7, .75, .98, 12.3, 12.8], [110, 76, 46]);
        const sh = poly([[1.07, .985, 12.37], [1.6, .985, 12.37], [1.6, .985, 12.75], [1.07, .985, 12.75]]); if (sh) { c.fillStyle = rgb(shadeAt([236, 222, 190], [1.7, 1, 12.3], [0, 1, 0])); c.fill(sh); }
        c.globalAlpha = 1;
      }
    } });
    // hanging lamps: chains and vessels
    LAMPS.forEach((q, i) => items.push({ d: dist(q) - .3, f: () => {
      let sx = 0; if (takbir > 0) { const d = Math.hypot(q[0] - ALI[0], q[2] - ALI[2]); sx = .12 * Math.sin((tkR - d) * 1.4) * Math.exp(-Math.max(0, tkR - d) * .25) * (tkR > d ? 1 : 0); }
      st._lampPos = st._lampPos || []; st._lampPos[i] = [q[0] + sx, q[1] + .05, q[2]];
      const top = P([q[0], CEIL, q[2]]), b = P([q[0] + sx, q[1] + .25, q[2]]); if (!top || !b) return;
      c.strokeStyle = 'rgba(30,20,12,.8)'; c.lineWidth = Math.max(.6, .8 * k); c.beginPath(); c.moveTo(top[0], top[1]); c.lineTo(b[0], b[1]); c.stroke();
      const v = P([q[0] + sx, q[1], q[2]]); if (!v || v[2] < 1.6) return; const s = F / v[2];
      c.fillStyle = rgb(mixc(shadeAt([150, 110, 60], q, null), [255, 200, 120], .15)); c.beginPath(); c.ellipse(v[0], v[1], s * .17, s * .12, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(40,24,10,.6)'; c.beginPath(); c.ellipse(v[0], v[1] - s * .09, s * .14, s * .035, 0, 0, TAU); c.fill();
    } }));

    // ---------- figures ----------
    const figure = (x, z, o) => { // a standing (or kneeling) billboard in the room's light
      const A = P([x, 0, z]), B = P([x, 1, z]); if (!A || !B || o.a <= .005) return;
      const s = F / A[2];
      const pts = figPts(o.base, o);
      const head = [x, (o.base === KNEEL ? .8 : 1.45), z];
      const E = lit(head, null), Ef = lit([x, 1.0, z], v3.norm([eye[0] - x, 0, eye[2] - z]));
      // which side is lit? the brightest light, in screen terms
      let side = 0, best = 0; L.forEach((l) => { const dd = (l.q[0] - x) ** 2 + (l.q[1] - 1.3) ** 2 + (l.q[2] - z) ** 2, f = l.I / (1 + dd / (l.R * l.R)); if (f > best) { best = f; const Q = P(l.q), Ac = P([x, 1.3, z]); side = Q && Ac ? Math.sign(Q[0] - Ac[0]) || 1 : 1; } });
      c.save();
      c.setTransform(s, 0, B[0] - A[0], B[1] - A[1], A[0], A[1]);
      c.globalAlpha = o.a;
      // contact shadow
      c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(0, 0, .42, .05, 0, 0, TAU); c.fill();
      smoothPath(c, pts);
      const body = mixc(tone(o.alb, Ef), HAZE, fogK([x, 0, z]) * .8), hi = tone(o.alb, E);
      const g = c.createLinearGradient(0, 0, 0, 1.7); g.addColorStop(0, rgb(mixc(body, [0, 0, 0], .55))); g.addColorStop(.6, rgb(body)); g.addColorStop(1, rgb(mixc(body, hi, .5)));
      c.fillStyle = g; c.fill();
      c.clip();
      const rim = c.createLinearGradient(side * .32, 0, -side * .1, 0); const rc = o.rim || [255, 196, 130];
      rim.addColorStop(0, rgb(rc, Math.min(.85, .12 + best * .1) * (o.rimK ?? 1))); rim.addColorStop(1, rgb(rc, 0));
      c.strokeStyle = rim; c.lineWidth = .07; smoothPath(c, pts); c.stroke();
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-.6, 0, 1.2, .35);
      c.restore();
      if (o.arm) { // a reaching or raised arm, drawn over the cloak
        c.save(); c.setTransform(s, 0, B[0] - A[0], B[1] - A[1], A[0], A[1]); c.globalAlpha = o.a;
        const [sx0, sy0] = o.arm[0], [hx, hy] = o.arm[1], dx = hx - sx0, dy = hy - sy0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        c.beginPath(); c.moveTo(sx0 + nx * .065, sy0 + ny * .065); c.quadraticCurveTo(sx0 + dx * .5 + nx * .07, sy0 + dy * .5 + ny * .07 - .03, hx + nx * .04, hy + ny * .04); c.lineTo(hx - nx * .04, hy - ny * .04); c.quadraticCurveTo(sx0 + dx * .5 - nx * .06, sy0 + dy * .5 - ny * .06 - .03, sx0 - nx * .065, sy0 - ny * .065); c.closePath();
        c.fillStyle = rgb(mixc(body, hi, .3)); c.fill();
        c.restore();
      }
    };
    const stack = (x, z, prof, face, alb, a, hd = [200, 190, 168]) => { // stacked discs, read well from above
      if (a <= .005) return;
      const n = prof.length;
      c.globalAlpha = a;
      { const A = P([x, .005, z]), Bx = P([x + .55, .005, z]), Bz = P([x, .005, z + .55]); if (A && Bx && Bz) { c.setTransform(Bx[0] - A[0], Bx[1] - A[1], Bz[0] - A[0], Bz[1] - A[1], A[0], A[1]); c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.arc(.1 * face[0], .1 * face[1], .85, 0, TAU); c.fill(); c.setTransform(1, 0, 0, 1, 0, 0); } }
      for (let i = 0; i < n; i++) {
        const [y, r, f] = prof[i], q = [x + face[0] * f, y, z + face[1] * f];
        const A = P(q), Bx = P([q[0] + r, y, q[2]]), Bz = P([q[0], y, q[2] + r]); if (!A || !Bx || !Bz) continue;
        const isHead = i >= n - 4, E = lit([q[0], y + .1, q[2]], [0, 1, 0]), col = isHead ? tone(hd, E) : mixc(tone(alb, E), [0, 0, 0], .35 * (1 - i / n));
        if (isHead && i === n - 4) { c.setTransform(Bx[0] - A[0], Bx[1] - A[1], Bz[0] - A[0], Bz[1] - A[1], A[0], A[1]); c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(0, 0, 1.45, 0, TAU); c.fill(); }
        c.setTransform(Bx[0] - A[0], Bx[1] - A[1], Bz[0] - A[0], Bz[1] - A[1], A[0], A[1]);
        c.fillStyle = rgb(col); c.beginPath(); c.arc(0, 0, 1, 0, TAU); c.fill();
        c.setTransform(1, 0, 0, 1, 0, 0);
      }
      c.globalAlpha = 1;
    };

    // ----- case 1: the two women and the child -----
    if (c1 > 0) {
      const enter = smooth(seg(p, .08, .13)), lunge = smooth(seg(p, .224, .244)), back1 = smooth(seg(p, .28, .33));
      const W1 = [mix(3.6, 1.3, enter) + .9 * back1, mix(9.6, 8.7, enter) + .15 * back1], W2 = [mix(-3.4, -1.3, smooth(seg(p, .09, .14))) + .38 * lunge, 8.7 - .12 * lunge];
      const at = smooth(seg(p, .17, .2)), raise = smooth(seg(p, .19, .222)) * (1 - smooth(seg(p, .246, .268))), gone = smooth(seg(p, .27, .3));
      const AT = [mix(3.4, .85, at) + 1.6 * gone, mix(10.3, 9.55, at)];
      const tug = bump(p, .14, .15, .165, .175) * Math.sin(p * 260);
      items.push({ d: dist([W1[0], 1, W1[1]]), f: () => figure(W1[0], W1[1], { base: WOMAN, alb: [44, 36, 34], dir: -1, lean: -.05 * Math.abs(tug) - .04 * enter, a: c1 * (1 - .55 * back1), rimK: 1 - .5 * back1 }) });
      const w2arm = lunge > .05 ? [[.12, 1.33], [mix(.2, .62, lunge), mix(1.1, 1.0, lunge)]] : null;
      const hold = smooth(seg(p, .29, .31));
      items.push({ d: dist([W2[0], 1, W2[1]]), f: () => figure(W2[0], W2[1], { base: WOMAN, alb: [50, 40, 36], dir: 1, lean: .06 * lunge + .04 * Math.abs(tug), bow: .38 * lunge * (1 - hold * .6), a: c1, rim: hold > 0 ? mixc([255, 196, 130], [255, 226, 170], hold) : [255, 196, 130], rimK: 1 + 1.4 * hold, arm: w2arm && hold < .9 ? w2arm : null }) });
      if (at > 0 && gone < 1) items.push({ d: dist([AT[0], 1, AT[1]]), f: () => {
        figure(AT[0], AT[1], { base: MAN, alb: [40, 34, 30], dir: -1, a: c1 * at * (1 - gone), rim: [190, 210, 255], rimK: .6 + .8 * raise, arm: [[-.12, 1.36], [mix(.3, -.4, raise), mix(.95, 1.02, raise)]] });
        // the saw, held level above the child
        if (raise > .02) {
          const hx = AT[0] + mix(.3, -.4, raise) * .97, hy = mix(.95, 1.02, raise) - .1 * raise, z = AT[1] - .15, len = 1.3, w = .17;
          const blade = poly([[hx, hy + .02, z], [hx - len, hy + .05, z], [hx - len, hy - w * .55, z], [hx, hy - w, z]]);
          c.globalAlpha = raise * c1;
          if (blade) { c.fillStyle = rgb(shadeAt([150, 156, 168], [hx - .5, hy, z], [0, 0, -1])); c.fill(blade); }
          strokeSegs([[[hx, hy + .02, z - .01], [hx - len, hy + .05, z - .01]]], `rgba(206,222,250,${.75 * raise})`, Math.max(1, 1.4 * k));
          const teeth = []; for (let i = 0; i < 26; i++) { const u = i / 26, uu = (i + .5) / 26; teeth.push([[hx - len * u, hy - mix(w, w * .55, u), z], [hx - len * uu, hy - mix(w, w * .55, uu) - .025, z]], [[hx - len * uu, hy - mix(w, w * .55, uu) - .025, z], [hx - len * (i + 1) / 26, hy - mix(w, w * .55, (i + 1) / 26), z]]); }
          strokeSegs(teeth, 'rgba(70,74,84,.9)', Math.max(.6, .9 * k));
          box([hx - .02, hx + .13, hy - .1, hy + .03, z - .03, z + .03], [90, 60, 36]);
          const gl = P([hx - len * (.5 + .4 * Math.sin(p * 90)), hy - .03, z]); if (gl) { c.globalCompositeOperation = 'lighter'; glow(gl, F / gl[2] * .35, st.cold, .55 * raise); c.globalCompositeOperation = 'source-over'; }
          c.globalAlpha = 1;
        }
      } });
      // the child: held, set down, claimed, and given to the one who gave him up
      const placed = smooth(seg(p, .125, .145)), fly = smooth(seg(p, .272, .305));
      const heldBy1 = [W1[0] - .12, 1.12, W1[1] - .12], mat = [0, .2, 8.95 + 0 * tug], toW2 = [W2[0] + .14, 1.08, W2[1] - .14];
      let ch = v3.mix(heldBy1, mat, placed);
      ch = [ch[0] + .14 * tug, ch[1], ch[2]];
      if (fly > 0) { const m = v3.mix(mat, toW2, fly); m[1] += .55 * Math.sin(Math.PI * fly); ch = m; }
      st._child = { q: ch, a: c1 * smooth(seg(p, .08, .11)) };
      // the cloth the child is set on
      if (placed > 0) items.push({ d: dist(mat) + 2, f: () => { c.globalAlpha = placed * c1 * (1 - .7 * fly); stamp(st.dark, [0, .006, 8.95], [1, 0, 0], [0, 0, 1], .55, .5); const A = P([0, .01, 8.95]), Bx = P([.32, .01, 8.95]), Bz = P([0, .01, 9.17]); if (A && Bx && Bz) { c.setTransform(Bx[0] - A[0], Bx[1] - A[1], Bz[0] - A[0], Bz[1] - A[1], A[0], A[1]); c.fillStyle = rgb(shadeAt([214, 200, 170], [0, .1, 8.95], [0, 1, 0])); c.beginPath(); c.arc(0, 0, 1, 0, TAU); c.fill(); c.setTransform(1, 0, 0, 1, 0, 0); } c.globalAlpha = 1; } });
    } else st._child = null;

    // ----- case 2: the loaves and the dirhams -----
    const breadA = [186, 120, 58], breadB = [232, 214, 176];
    if (c2 > 0) {
      const spread = smooth(seg(p, .405, .43)), cIn = smooth(seg(p, .44, .47)), split = smooth(seg(p, .47, .49));
      // the leather mat and its border
      items.push({ d: 1e3 - 1, floorItem: true, f: () => {
        c.globalAlpha = c2;
        const hw = 1.18 * spread, hz = .72;
        const m = poly([[-hw, .004, 10.22 - hz], [hw, .004, 10.22 - hz], [hw, .004, 10.22 + hz], [-hw, .004, 10.22 + hz]]);
        if (m) { c.fillStyle = rgb(shadeAt([96, 44, 30], [0, 0, 10.2], [0, 1, 0])); c.fill(m); const b = poly([[-hw + .06, .005, 10.22 - hz + .06], [hw - .06, .005, 10.22 - hz + .06], [hw - .06, .005, 10.22 + hz - .06], [-hw + .06, .005, 10.22 + hz - .06]]); if (b) { c.strokeStyle = rgb(shadeAt([210, 170, 100], [0, 0, 10.2], [0, 1, 0]), .55); c.lineWidth = Math.max(1, 1.4 * k); c.stroke(b); } }
        c.globalAlpha = 1;
      } });
      // seated men: A left, B right, C comes in from the near side and sits
      const robe = [[70, 56, 44], [62, 52, 46], [58, 48, 40]];
      const seatA = SEAT, Cpos = [0, mix(7.3, 9.02, cIn)], Cprof = SEAT.map((s, i) => [mix(STAND[i][0], s[0], smooth(seg(p, .462, .478))), mix(STAND[i][1], s[1], smooth(seg(p, .462, .478))), s[2]]);
      items.push({ d: dist([-1.62, .5, 10.22]), f: () => stack(-1.62, 10.22, seatA, [1, 0], robe[0], c2, [214, 204, 180]) });
      items.push({ d: dist([1.62, .5, 10.22]), f: () => stack(1.62, 10.22, seatA, [-1, 0], robe[1], c2, [110, 86, 62]) });
      items.push({ d: dist([Cpos[0], .5, Cpos[1]]), f: () => stack(Cpos[0], Cpos[1], Cprof, [0, 1], robe[2], c2 * cIn, [190, 176, 150]) });
      // the loaves, then their thirds; then the thirds travel into three portions of eight
      const eat = smooth(seg(p, .54, .565));
      items.push({ d: 1e3 - 2, floorItem: true, f: () => {
        const disc = (q, r, y) => { const A = P([q[0], y, q[1]]), Bx = P([q[0] + r, y, q[1]]), Bz = P([q[0], y, q[1] + r]); if (!A || !Bx || !Bz) return false; c.setTransform(Bx[0] - A[0], Bx[1] - A[1], Bz[0] - A[0], Bz[1] - A[1], A[0], A[1]); return true; };
        const loafIn = smooth(seg(p, .42, .445));
        st.wedges.forEach((w) => {
          const lf = st.loaves[w.j], col = lf.own ? breadB : breadA;
          const t0 = .495 + w.d, mv = ease.io(seg(p, t0, t0 + .03));
          const ex = split * .035, a0 = w.m * TAU / 3 - Math.PI / 2, bis = a0 + Math.PI / 3;
          let q = [lf.q[0] + Math.cos(bis) * ex, lf.q[1] + Math.sin(bis) * ex], rot = 0, sc = 1;
          if (mv > 0) { q = lerp2(q, w.dst, mv); rot = mix(0, w.face - bis, mv); sc = mix(1, .82, mv); }
          const lift = .22 * Math.sin(Math.PI * mv) * (w.to === 2 ? 1.5 : .6);
          const fade = 1 - eat * (1 - (w.to === 2 ? 0 : 0));
          if (fade <= .01) return;
          const E = lit([q[0], .1, q[1]], [0, 1, 0]);
          c.globalAlpha = c2 * loafIn * fade;
          if (lift > .01 && disc(q, .12, .01)) { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, sc, a0 + rot, a0 + rot + TAU / 3); c.closePath(); c.fill(); }
          if (!disc(q, .12 * sc * (1 - .5 * eat), .012 + lift)) return;
          c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 1, a0 + rot, a0 + rot + TAU / 3 - (split > .5 ? .05 : 0)); c.closePath();
          c.fillStyle = rgb(tone(col, E)); c.fill();
          c.strokeStyle = rgb(tone(mixc(col, [60, 30, 10], .55), E)); c.lineWidth = .09; c.beginPath(); c.arc(0, 0, .93, a0 + rot, a0 + rot + TAU / 3 - (split > .5 ? .05 : 0)); c.stroke();
          c.fillStyle = rgb(tone(mixc(col, [70, 36, 12], .5), E), .5); for (let s = 0; s < 3; s++) { const aa = a0 + rot + (s + .5) / 3 * TAU / 3, rr = .35 + .3 * hash(w.j * 3 + w.m, s); c.beginPath(); c.arc(Math.cos(aa) * rr, Math.sin(aa) * rr, .07, 0, TAU); c.fill(); }
          c.setTransform(1, 0, 0, 1, 0, 0);
        });
        c.globalAlpha = 1;
        // crumbs where the portions were
        if (eat > 0) { c.fillStyle = rgb(tone([200, 160, 100], lit([0, .1, 9], [0, 1, 0])), .5 * c2 * (1 - smooth(seg(p, .6, .64)))); st.crumbs.forEach(([u, v, w2], i) => { const Pp = [[-.66, 10.22], [.64, 10.22], [0, 9.68]][i % 3], q = P([Pp[0] + (u - .5) * .4, .01, Pp[1] + (v - .5) * .3]); if (q) { const r = Math.max(.6, F / q[2] * .008 * (1 + w2)); c.fillRect(q[0], q[1], r, r); } }); }
        // the arcs of what was given: seven from A, one from B
        const arcA = bump(p, .5, .52, .55, .575) + .8 * bump(p, .605, .618, .64, .66);
        if (arcA > .01) {
          c.globalCompositeOperation = 'lighter';
          [[[-.66, 10.22], [0, 9.68], 7], [[.64, 10.22], [0, 9.68], 1]].forEach(([a, b, nn]) => {
            for (let s = 0; s < nn; s++) {
              const off = (s - (nn - 1) / 2) * .03;
              c.strokeStyle = `rgba(255,214,150,${.32 * arcA * c2})`; c.lineWidth = Math.max(1, 1.1 * k); c.beginPath();
              for (let i = 0; i <= 16; i++) { const u = i / 16, q = P([mix(a[0], b[0], u) + off, .02 + .3 * Math.sin(Math.PI * u), mix(a[1], b[1], u) + off]); if (q) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); } }
              c.stroke();
            }
          });
          c.globalCompositeOperation = 'source-over';
        }
        // the dirhams: eight from C; first split five and three; then the judgment, seven and one
        const coinIn = smooth(seg(p, .565, .578));
        if (coinIn > 0) {
          const s53 = ease.io(seg(p, .58, .594)), s71 = ease.io(seg(p, .612, .628));
          for (let i = 0; i < 8; i++) {
            const start = [-.31 + i * .089, 9.56];
            const goA = i < 5, mv2 = i === 5 || i === 6; // two of B's three move over at the judgment
            const aSlot = (n) => [-.4, 10.22 + (n - 3) * .1], bSlot = (n) => [.4, 10.22 + (n - 1) * .1];
            let q = start;
            const p53 = goA ? aSlot(i) : bSlot(i - 5), p71 = goA ? aSlot(i) : mv2 ? aSlot(i) : bSlot(1);
            q = lerp2(q, p53, s53); q = lerp2(q, p71, s71);
            const lift = .12 * Math.sin(Math.PI * s53) + (mv2 ? .2 * Math.sin(Math.PI * s71) : 0);
            const jit = !goA && s71 === 0 ? .006 * Math.sin(p * 900 + i) * bump(p, .594, .598, .606, .61) : 0;
            if (!disc([q[0] + jit, q[1]], .045, .014 + lift)) continue;
            const E = lit([q[0], .2, q[1]], [0, 1, 0]);
            c.globalAlpha = c2 * coinIn;
            c.fillStyle = rgb(tone([196, 200, 206], E)); c.beginPath(); c.arc(0, 0, 1, 0, TAU); c.fill();
            c.strokeStyle = rgb(tone([90, 92, 96], E)); c.lineWidth = .14; c.stroke();
            c.strokeStyle = rgb(tone([150, 152, 158], E)); c.lineWidth = .08; c.beginPath(); c.arc(0, 0, .6, 0, TAU); c.stroke();
            c.setTransform(1, 0, 0, 1, 0, 0);
            const gq = P([q[0] - .015, .03 + lift, q[1] - .015]); if (gq) { c.globalCompositeOperation = 'lighter'; glow(gq, F / gq[2] * .05, st.core, .45 * coinIn * c2 * (.6 + .4 * Math.sin(t * 3 + i))); c.globalCompositeOperation = 'source-over'; }
          }
          c.globalAlpha = 1;
        }
        // the oil lamp on the mat's corner
        const lq = P([.95, .05, 10.75]);
        if (lq) { const s = F / lq[2]; c.globalAlpha = c2; c.fillStyle = rgb(tone([140, 96, 52], lit([.95, .3, 10.6], null))); c.beginPath(); c.ellipse(lq[0], lq[1], s * .1, s * .05, 0, 0, TAU); c.fill(); c.globalAlpha = 1; }
      } });
    }

    // ----- case 3: the men set apart at the columns -----
    if (c3 > 0) {
      const inn = smooth(seg(p, .7, .735));
      const START = [[2.1, 8.1], [2.8, 8.5], [2.5, 7.6], [3.3, 7.9]];
      MEN3.forEach((m, i) => {
        const s = sepT(i), q = lerp2([START[i][0] + 3 * (1 - inn), START[i][1] + .5 * (1 - inn)], m, s);
        const walk = s > 0 && s < 1 ? .02 * Math.sin(p * 1400 + i) : 0;
        const cf = i === 3 ? confess : 0, ask = askI[i];
        items.push({ d: dist([q[0], 1, q[1]]), f: () => figure(q[0] + walk, q[1], { base: MAN, alb: [[66, 52, 40], [54, 48, 44], [72, 58, 44], [48, 40, 36]][i], dir: q[0] < 0 ? 1 : -1, bow: .9 * cf, bowMax: .7, sink: .5 * cf, a: c3 * inn, rim: ask > 0 ? [255, 214, 160] : [255, 196, 130], rimK: 1 + 1.5 * ask }) });
      });
      // the young man, weeping, near the bench; at the end the light reaches him
      const yw = smooth(seg(p, .912, .95));
      items.push({ d: dist([-1.7, .5, 8.1]), f: () => figure(-1.7, 8.1, { base: KNEEL, alb: [82, 70, 56], dir: 1, a: c3 * smooth(seg(p, .69, .72)), lean: .02 * Math.sin(t * 2.2) * (1 - yw), rim: [255, 220, 170], rimK: 1 + 2.2 * yw }) });
      st._yw = yw;
    }

    // draw: floor items first, then everything else far to near
    items.filter((it) => it.floorItem).sort((a, b) => b.d - a.d).forEach((it) => it.f());
    items.filter((it) => !it.floorItem).sort((a, b) => b.d - a.d).forEach((it) => it.f());

    // ---------- lights ----------
    c.globalCompositeOperation = 'lighter';
    LAMPS.forEach((q, i) => {
      const lp = (st._lampPos && st._lampPos[i]) || q, v = P(lp); if (!v || v[2] < 1.6) return; const s = F / v[2], I = lampI[i];
      glow(v, s * 2.6, st.warm, .2 * I); glow(v, s * .5, st.warm, .55 * I); glow([v[0], v[1] - s * .06], s * .13, st.core, Math.min(1, .9 * I));
    });
    if (c2 > 0) { const v = P([.95, .13, 10.75]); if (v) { const s = F / v[2]; glow(v, s * 1.6, st.warm, .45 * floorLamp); glow(v, s * .3, st.warm, .7 * floorLamp); glow([v[0], v[1] - s * .03], s * .07, st.core, floorLamp); } }
    { const v = P(NICHE); if (v) { const s = F / v[2]; glow(v, s * 1.4, st.warm, .3); glow(v, s * .1, st.core, .9); } }
    COL3.forEach(([x, z], i) => { const I = colLampI[i]; if (I < .01) return; const v = P([x + (x < 0 ? .45 : -.45), 2.45, z - .25]); if (!v) return; const s = F / v[2]; glow(v, s * 2.4, st.warm, .38 * I); glow(v, s * .5, st.warm, .5 * I); glow(v, s * .12, st.core, Math.min(1, I)); });
    // Ali: calm, warm, larger than every other light; a pool of it on the bench
    { const v = P(ALI); if (v) { const s = F / Math.max(4, v[2]), br = .94 + .06 * Math.sin(t * 1.1); glow(v, s * 4.2, st.ali, .26 * br * Math.min(1.6, aliI)); glow(v, s * 1.25, st.ali, .6 * br); glow(v, s * .34, st.core, .95); } }
    if (scribeI > .01) { const v = P(SCRIBE); if (v) { const s = F / v[2]; glow(v, s * 1.1, st.pale, .5 * scribeI); glow(v, s * .14, st.core, .8 * scribeI); const wr = askI[0] + askI[1] + askI[2]; if (wr > .05) for (let j = 0; j < 4; j++) { const q = P([1.1 + hash(j, Math.floor(t * 6)) * .45, .99, 12.4 + hash(j + 4, Math.floor(t * 6)) * .3]); if (q) glow(q, s * .05, st.core, .8 * wr * scribeI); } } }
    // the child
    if (st._child && st._child.a > 0) { const v = P(st._child.q); if (v) { const s = F / v[2], br = .9 + .1 * Math.sin(t * 2.4); glow(v, s * 1.4, st.ali, .45 * st._child.a * br); glow(v, s * .16, st.core, st._child.a); } }
    // the cry: rings out from the mother
    if (c1 > 0) { const cr = seg(p, .226, .262); if (cr > 0 && cr < 1) { const W2 = [mix(-3.4, -1.3, 1) + .38 * smooth(seg(p, .224, .244)), 8.7]; const v = P([W2[0], 1.5, W2[1]]); if (v) { const s = F / v[2]; for (let j = 0; j < 3; j++) { const u = c01(cr * 1.4 - j * .2); if (u <= 0 || u >= 1) continue; c.strokeStyle = `rgba(255,232,190,${.5 * (1 - u)})`; c.lineWidth = Math.max(1, 2 * k * (1 - u)); c.beginPath(); c.ellipse(v[0], v[1], s * (.2 + 2.6 * u), s * (.2 + 2.6 * u) * .8, 0, 0, TAU); c.stroke(); } } } }
    // the judgments: a thread of light from the bench
    const thread = (to, a) => { if (a <= .01) return; const A = P(ALI), B = P(to); if (!A || !B) return; const g = c.createLinearGradient(A[0], A[1], B[0], B[1]); g.addColorStop(0, `rgba(255,220,160,${.5 * a})`); g.addColorStop(1, `rgba(255,220,160,${.12 * a})`); c.strokeStyle = g; c.lineWidth = Math.max(1, 1.6 * k); c.beginPath(); c.moveTo(A[0], A[1]); c.quadraticCurveTo((A[0] + B[0]) / 2, Math.min(A[1], B[1]) - Math.abs(A[0] - B[0]) * .15, B[0], B[1]); c.stroke(); };
    if (c1 > 0) thread([-1.3 + .38, 1.2, 8.6], c1 * bump(p, .252, .265, .29, .315));
    if (c2 > 0) thread([-.4, .1, 10.22], c2 * bump(p, .6, .612, .63, .65));
    if (c3 > 0) { MEN3.forEach((m, i) => thread([m[0], 1.5, m[1]], c3 * askI[i] * .9)); thread([-1.7, .7, 8.1], c3 * smooth(seg(p, .91, .945)) * (1 - smooth(seg(p, 1.0, 1.1)))); }
    // the takbir: a wave through the hall, along the floor and up through the lamps
    if (tkOn) {
      const ring = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * TAU; ring.push([ALI[0] + Math.cos(a) * tkR, .03, ALI[2] + Math.sin(a) * tkR]); }
      c.strokeStyle = `rgba(255,224,170,${.55 * (1 - takbir)})`; c.lineWidth = Math.max(1, 3 * k * (1 - takbir) + 1);
      c.beginPath(); let pen = false; ring.forEach((q) => { const v = q[2] < ZW ? P(q) : null; if (!v) { pen = false; return; } if (pen) c.lineTo(v[0], v[1]); else c.moveTo(v[0], v[1]); pen = true; }); c.stroke();
      const v = P(ALI); if (v) glow(v, F / v[2] * (2 + tkR * .6), st.ali, .5 * (1 - takbir));
      // dust shaken from the beams
      c.fillStyle = `rgba(230,200,150,${.5 * (1 - takbir)})`;
      st.dust.forEach(([x, z, r, ph]) => { const d = Math.hypot(x, z - ALI[2] + 8); if (d > tkR) return; const fall = (tkR - d) / 30; const q = P([x, CEIL - .2 - fall * 9 * (1 + r), z + 2]); if (q) { const s = Math.max(.7, F / q[2] * .012 * (1 + ph)); c.fillRect(q[0], q[1], s, s * 1.6); } });
    }
    // motes in the lamplight
    c.fillStyle = 'rgba(255,220,170,.5)';
    st.motes.forEach(([x, y, z, r], i) => { const q = P([x + .3 * Math.sin(t * .2 + i), y + .25 * Math.sin(t * .13 + r * 9), z]); if (!q) return; const E = lit([x, y, z], null), a = Math.min(.6, (E[0] - .3) * .2) * (.5 + .5 * Math.sin(t * .7 + i)); if (a <= .02) return; c.globalAlpha = a; const s = Math.max(.6, F / q[2] * .01); c.fillRect(q[0], q[1], s, s); });
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    // ---------- grade ----------
    if (!st.pat) st.pat = c.createPattern(st.noise, 'repeat');
    c.globalCompositeOperation = 'overlay'; c.fillStyle = st.pat; c.save(); c.translate((t * 37 % 1) * 192 | 0, (t * 53 % 1) * 192 | 0); c.fillRect(-192, -192, W + 384, H + 384); c.restore(); c.globalCompositeOperation = 'source-over';
    const vg = c.createRadialGradient(W / 2, H * .55, Math.min(W, H) * .3, W / 2, H * .55, Math.hypot(W, H) * .62);
    vg.addColorStop(0, 'rgba(6,5,8,0)'); vg.addColorStop(1, 'rgba(4,3,6,.7)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    // the night of case three is cooler; the end returns to warmth
    const cool = c3 * (1 - smooth(seg(p, .93, 1)));
    if (cool > 0) { c.globalCompositeOperation = 'soft-light'; c.fillStyle = `rgba(70,90,140,${.35 * cool})`; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
  },
};
})();
