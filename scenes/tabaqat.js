(() => {
// tabaqat: the classes of the people in the covenant to Malik al-Ashtar. Fustat at night, seen from the Nile: a city
// that climbs from the water in seven terraces, one class to a terrace. The army camps on the crest against the sky;
// below it the diwan of the scribes, the judges' bench, the governor's house, the fields, the market and workshops
// on the quay with the ships, and on the strand at the water's edge the lowest class, the needy and the poor.
// Each terrace lights in turn as the camera cranes down; the lowest glows most strongly; then the whole city at once.
// World in metres: x right, y up, z away from the river. Terrace k (0 = the strand, 6 = the crest) has its floor at
// YB(k) from ZB(k) to ZB(k + 1); its back is the retaining wall of the terrace above.
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
const lerp2 = (a, b, k) => [mix(a[0], b[0], k), mix(a[1], b[1], k)];
const NEAR = .3;

const HS = 7, DS = 12, Y0 = 1.2, XW = 260;
const YB = (k) => Y0 + k * HS, ZB = (k) => k * DS, WK = (k) => 92 - 8.5 * k, SL = (z) => Y0 + z * HS / DS;
const TURN = [.655, .56, .47, .38, .29, .2, .11]; // when terrace k is centred and lit (k = 0 is the lowest)

// ---------- camera: [p, eye, look, focal] ----------
const camK = (k, ex, push = 0) => [[ex, YB(k) + 4.4, ZB(k) - 19 + push], [ex * .15, YB(k) + 2.7, ZB(k) + 8], 1.36];
const CAM = [[-.06, [-34, 50, -78], [15, 20, 40], 1], [0, [-32, 49, -75], [15, 20, 40], 1], [.068, [-6, 50.5, 38], [2, 47, 90], 1.3]];
[6, 5, 4, 3, 2].forEach((k) => { const ex = [0, 7.5, -8, 7.5, -7.5, 8, -6][k]; CAM.push([TURN[k] - .02, ...camK(k, ex)], [TURN[k] + .025, ...camK(k, ex * .6, 3)]); });
CAM.push([TURN[1] - .02, [5, 7.6, -44], [0, 8.4, 14], 1.55], [TURN[1] + .025, [-4, 7.9, -41], [0, 8.5, 14], 1.6]);
CAM.push([.635, [0, 3.9, -14.5], [0, 2.9, 7], 1.3], [.68, [0, 4.2, -9.5], [0, 2.5, 7], 1.3], [.79, [0, 4.5, -10.5], [0, 2.7, 7], 1.3], [.835, [0, 4.6, -11.5], [0, 2.8, 7], 1.28], [.93, [-30, 49, -74], [15, 20, 40], 1], [1.06, [-33, 50, -77], [15, 20, 40], 1]);
function camAt(p) { // eased from key to key: it settles on each terrace, never overshoots
  let i = 0; while (i < CAM.length - 2 && p > CAM[i + 1][0]) i++;
  const u = ease.io(c01((p - CAM[i][0]) / (CAM[i + 1][0] - CAM[i][0]))), B = CAM[i], C = CAM[i + 1];
  return { eye: v3.mix(B[1], C[1], u), look: v3.mix(B[2], C[2], u), fm: mix(B[3], C[3], u) };
}
// how lit is terrace k at p: its own turn, then a residue; the lowest keeps rising; at the end all of them
function litK(k, p) {
  const T = TURN[k], own = smooth(seg(p, T - .04, T - .008)), after = smooth(seg(p, T + .03, T + .065));
  let v = k === 0 ? own * (1 + .45 * smooth(seg(p, .69, .8))) : own * mix(.85, .26, after);
  const fin = smooth(seg(p, .84, .93));
  return mix(v, k === 0 ? 1.65 : 1, fin);
}

// ---------- silhouettes ----------
const MAN = [[-.27, 0], [-.245, .4], [-.205, .86], [-.22, 1.16], [-.245, 1.39], [-.19, 1.47], [-.075, 1.505], [-.07, 1.545], [-.112, 1.6], [-.116, 1.7], [-.07, 1.77], [0, 1.79]];
const WOMAN = [[-.3, 0], [-.27, .32], [-.215, .72], [-.2, 1.02], [-.215, 1.24], [-.205, 1.37], [-.155, 1.47], [-.12, 1.59], [-.06, 1.66], [0, 1.68]];
const SIT = [[-.4, 0], [-.42, .1], [-.36, .26], [-.25, .42], [-.22, .6], [-.21, .7], [-.13, .77], [-.06, .79], [-.1, .84], [-.1, .93], [-.05, .99], [0, 1.0]];
const full = (h) => h.concat(h.slice(0, -1).reverse().map(([u, v]) => [-u, v]));
const BENT = [[-.24, 0], [-.2, .45], [-.27, .82], [-.26, 1.1], [-.12, 1.27], [.08, 1.3], [.24, 1.22], [.36, 1.1], [.4, .98], [.32, .93], [.2, 1.0], [.12, .92], [.16, .66], [.22, .36], [.24, 0]];
const SH = { man: full(MAN), woman: full(WOMAN), sit: full(SIT), bent: BENT };
const HORSE = [[-1.18, 1.0], [-1.1, 1.42], [-.8, 1.56], [-.2, 1.5], [.35, 1.6], [.62, 1.95], [.8, 2.2], [.98, 2.1], [1.16, 1.78], [.98, 1.7], [.7, 1.56], [.56, 1.2], [.52, .55], [.54, 0], [.42, 0], [.38, .58], [.25, .98], [-.5, .98], [-.6, .58], [-.58, 0], [-.7, 0], [-.8, .6], [-.95, 1.0], [-1.2, .75]];
function smoothPath(c, pts, sx = 1, sy = 1, ox = 0, oy = 0) {
  const n = pts.length; c.beginPath();
  const m0 = lerp2(pts[n - 1], pts[0], .5); c.moveTo(ox + m0[0] * sx, oy + m0[1] * sy);
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], m = lerp2(a, b, .5); c.quadraticCurveTo(ox + a[0] * sx, oy + a[1] * sy, ox + m[0] * sx, oy + m[1] * sy); }
  c.closePath();
}

S.tabaqat = {
  init(el, st) {
    st.cv = el.querySelector('canvas');
    st.c = st.cv.getContext('2d');
    const R = rng(5302);
    st.warm = sprite([[0, 'rgba(255,214,150,1)'], [.25, 'rgba(255,170,90,.45)'], [.6, 'rgba(240,130,60,.1)'], [1, 'rgba(240,120,50,0)']]);
    st.core = sprite([[0, 'rgba(255,250,236,1)'], [.3, 'rgba(255,232,190,.6)'], [1, 'rgba(255,220,170,0)']]);
    st.pool = sprite([[0, 'rgba(255,184,110,1)'], [.4, 'rgba(255,160,90,.42)'], [1, 'rgba(255,140,70,0)']]);
    st.hot = sprite([[0, 'rgba(255,236,190,1)'], [.2, 'rgba(255,190,110,.7)'], [.55, 'rgba(240,120,50,.2)'], [1, 'rgba(230,100,40,0)']], 256);
    st.cold = sprite([[0, 'rgba(214,226,250,1)'], [.3, 'rgba(170,190,230,.3)'], [1, 'rgba(150,170,220,0)']]);
    st.streak = (() => { const c = mk(32, 128), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,200,130,.9)'); gr.addColorStop(.35, 'rgba(255,170,100,.35)'); gr.addColorStop(1, 'rgba(255,150,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 128); const m = g.createLinearGradient(0, 0, 32, 0); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(.5, 'rgba(0,0,0,0)'); m.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = m; g.fillRect(0, 0, 32, 128); return c; })();
    st.noise = mk(192, 192);
    { const ng = st.noise.getContext('2d'), id = ng.createImageData(192, 192); for (let i = 0; i < id.data.length; i += 4) { const v = R() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 22; } ng.putImageData(id, 0, 0); }
    st.stars = Array.from({ length: 260 }, () => { const az = (R() - .5) * 2.2, el2 = .02 + R() ** 1.4 * .8; return [Math.sin(az) * Math.cos(el2), Math.sin(el2), Math.cos(az) * Math.cos(el2), R()]; });
    st.ridge = []; for (let x = -4000, h = 60; x <= 4000; x += 60) { h = mix(h, 40 + 70 * Math.sin(x * .0011 + 2) ** 2 + R() * 30, .4); st.ridge.push([x, h]); }
    const B = st.B = [[], [], [], [], [], [], []]; // per terrace: lights [x,y,z,I,R]
    // 6: the army on the crest: tents, fires, riders, banners
    const y6 = YB(6), z6 = ZB(6);
    st.tents = []; for (let i = 0; i < 80; i++) { const x = (R() - .5) * (R() < .45 ? 56 : 240), z = z6 + 6 + R() ** 1.3 * 120; st.tents.push([x, z, 2.6 + R() * 1.6, R()]); }
    st.tents.sort((a, b) => b[1] - a[1]);
    st.fires = []; for (let i = 0; i < 16; i++) { const x = (R() - .5) * (i < 6 ? 30 : 120), z = z6 + 4 + R() * 40; st.fires.push([x, z]); B[6].push([x, y6 + .6, z, .7, 3.5]); }
    st.riders = []; for (let i = 0; i < 9; i++) st.riders.push([(R() - .5) * (i < 5 ? 26 : 90), z6 + 7 + R() * 6, R() < .5 ? -1 : 1, .6 + R() * .6, R()]);
    st.camp = []; for (let i = 0; i < 26; i++) st.camp.push([(R() - .5) * 70, z6 + 3 + R() * 14, R()]);
    st.banners6 = []; for (let i = 0; i < 8; i++) st.banners6.push([(R() - .5) * 80, z6 + 10 + R() * 14, R()]);
    // 5: the diwan: a portico of piers; scribes at low desks; shelves of rolls
    const y5 = YB(5), z5 = ZB(5);
    st.piers5 = []; for (let x = -34; x <= 34; x += 4.25) st.piers5.push(x);
    st.scribes = []; for (let i = 0; i < 14; i++) { const x = -29 + i * 4.25 + (R() - .5) * 1.2; st.scribes.push([x, z5 + 8.3, R()]); }
    for (let i = 0; i < st.piers5.length - 1; i++) B[5].push([(st.piers5[i] + st.piers5[i + 1]) / 2, y5 + 3.6, z5 + 8.2, 1.1, 3]);
    st.walk5 = Array.from({ length: 7 }, () => [(R() - .5) * 60, z5 + 3 + R() * 3, R() < .5 ? -1 : 1, R()]);
    // 4: the judges: the arcade of the mosque, the bench, those who stand before it
    const y4 = YB(4), z4 = ZB(4);
    st.cols4 = []; for (let x = -36; x <= 36; x += 4.5) st.cols4.push(x);
    for (let i = 0; i < st.cols4.length - 1; i += 2) B[4].push([(st.cols4[i] + st.cols4[i + 1]) / 2, y4 + 3.4, z4 + 8, 1, 3]);
    B[4].push([0, y4 + 4.2, z4 + 7.6, 1.2, 3.4]);
    st.sitters4 = []; for (let i = 0; i < 16; i++) { const a = (i / 15 - .5) * 2.4; st.sitters4.push([Math.sin(a) * 9 + (R() - .5), z4 + 9 - Math.cos(a) * 5 + (R() - .5) * .6, R()]); }
    // 3: the governor's house: gate, latticed windows, guards and torches
    const y3 = YB(3), z3 = ZB(3);
    B[3].push([-3.4, y3 + 3.2, z3 + 5.6, 1.4, 3.5], [3.4, y3 + 3.2, z3 + 5.6, 1.4, 3.5], [0, y3 + 2, z3 + 8.5, 1.4, 4], [-14, y3 + 2.6, z3 + 6, .8, 3], [14, y3 + 2.6, z3 + 6, .8, 3]);
    st.walk3 = Array.from({ length: 8 }, () => [(R() - .5) * 50, z3 + 2 + R() * 3.5, R() < .5 ? -1 : 1, R()]);
    // 2: the fields: furrows, palms, the water-wheel, farmers, villages and their ovens
    const y2 = YB(2), z2 = ZB(2);
    st.palms2 = []; for (let i = 0; i < 26; i++) st.palms2.push([(R() - .5) * (i < 10 ? 34 : 140), z2 + 9 + R() * 2.5, 4.4 + R() * 1.8, R() * TAU]);
    st.palms2.sort((a, b) => b[1] - a[1]);
    st.farmers = Array.from({ length: 11 }, (_, i) => [-22 + i * 4.4 + (R() - .5) * 2, z2 + 2.2 + R() * 4.5, R()]);
    st.farmers.forEach(([x, z], i) => { if (i % 3 === 1) B[2].push([x + .4, y2 + .9, z - .3, .9, 2.6]); });
    st.houses2 = [[13, 6, 3.4], [21, 5, 3], [29, 7, 3.6], [-22, 6, 3.2], [-30, 7, 3]].map(([x, w, h]) => [x, z2 + 8, w, h]);
    st.houses2.forEach(([x]) => B[2].push([x, y2 + 1.2, z2 + 7.6, 1.2, 3]));
    B[2].push([-8, y2 + 1.4, z2 + 5, .8, 4], [4, y2 + 1.6, z2 + 4, .6, 4]);
    // 1: the market and workshops on the quay; lanterns on ropes; the ships at the quay
    const y1 = YB(1), z1 = ZB(1);
    st.stalls = []; for (let i = 0; i < 11; i++) { const x = -26 + i * 5.2 + (R() - .5) * .6; if (Math.abs(x) < 2.2) continue; st.stalls.push([x, z1 + 4.5 + (R() - .5) * .8, 3.6 + R() * .8, R()]); }
    st.stalls.forEach(([x, z]) => B[1].push([x, y1 + 2.2, z, .8, 2.6]));
    B[1].push([-15, y1 + 1, z1 + 10.5, 2.4, 4], [14, y1 + 1, z1 + 10.5, 1.8, 3.5]); // the forge, the kiln
    st.buyers = Array.from({ length: 16 }, () => [(R() - .5) * 56, z1 + 1.6 + R() * 2.2, R() < .5 ? -1 : 1, R()]);
    st.ships = [[-60, -9, 20, 1], [-10.5, -20, 14, 1], [11, -21.5, 15, -1], [52, -8, 18, -1]];
    // 0: the strand: arches in the quay wall, reed shelters, small fires, the poor
    const z0 = ZB(0);
    st.arches0 = []; for (let x = -38; x <= 38; x += 6.4) st.arches0.push(x);
    st.fires0 = []; for (let i = 0; i < 9; i++) { const x = -32 + i * 8 + (R() - .5) * 3; st.fires0.push([x, z0 + 6 + R() * 3]); B[0].push([x, Y0 + .5, z0 + 6 + R() * 3, 1.5, 3.2]); }
    st.arches0.forEach((x) => B[0].push([x, Y0 + 1.4, ZB(1) - .6, .9, 2.5]));
    st.poor = []; st.fires0.forEach(([x, z], i) => { const n = 2 + (i % 3); for (let j = 0; j < n; j++) { const a = (j / n) * TAU + R(); st.poor.push([x + Math.cos(a) * 1.6, z + Math.sin(a) * 1.1, R(), R() < .35 ? .62 : 1]); } });
    st.shelters = []; for (let i = 0; i < 10; i++) st.shelters.push([-41 + i * 9 + (R() - .5) * 3, 8.2 + R() * 2]);
    st.ripples = Array.from({ length: 260 }, () => [(R() - .5) * 340, -2 - R() ** 1.6 * 300, R()]);
  },
  frame(p, t, el, st) {
    fit(st.cv);
    const { c, cv } = st;
    const W = cv.width, H = cv.height, k = W / Math.max(1, cv.clientWidth), phone = W < H;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    const LK = [0, 1, 2, 3, 4, 5, 6].map((j) => litK(j, p));
    const cm = camAt(p), eye = cm.eye.slice(), look = cm.look.slice();
    if (phone) { const wide = 1 - smooth(seg(p, .03, .09)) + smooth(seg(p, .8, .9)), back = mix(1.05, .82, wide); for (let j = 0; j < 3; j++) eye[j] = look[j] + (eye[j] - look[j]) * back; }
    const fw = v3.norm(v3.sub(look, eye)), rt = v3.norm(v3.cross([0, 1, 0], fw)), up = v3.cross(fw, rt);
    const F = Math.min(H * 1.1, W * (phone ? 1.6 : 1.45)) * cm.fm, cx = W / 2, cy = H * (phone ? mix(.5, .4, smooth(seg(p, .84, .93))) : .5);
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
    const glow = (q, r, img, a) => { if (!q || a <= .003 || r < .4) return; c.globalAlpha = Math.min(1, a); c.drawImage(img, q[0] - r, q[1] - r, r * 2, r * 2); c.globalAlpha = 1; };
    const stamp = (img, o, ax, ay, r, a) => {
      const A = P(o), B = P(v3.add(o, v3.mul(ax, r))), C = P(v3.add(o, v3.mul(ay, r))); if (!A || !B || !C || a <= .003) return;
      c.setTransform(B[0] - A[0], B[1] - A[1], C[0] - A[0], C[1] - A[1], A[0], A[1]); c.globalAlpha = Math.min(1, a); c.drawImage(img, -1, -1, 2, 2); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
    };
    // ---------- light ----------
    const MOON = v3.norm([-.5, .55, .65]), AMB = [.05, .06, .1];
    const HAZE = [22, 26, 40];
    const tone = (alb, E) => [0, 1, 2].map((j) => 255 * (1 - Math.exp(-alb[j] / 255 * E[j] * 1.5)));
    const lit = (q, n, kk, wf = 1) => {
      let r = AMB[0], g = AMB[1], b = AMB[2];
      if (n) { const m = Math.max(0, v3.dot(n, MOON)) * .22; r += m * .7; g += m * .8; b += m * 1.15; const sk = (.5 + .5 * n[1]) * .06; r += sk * .5; g += sk * .6; b += sk; }
      const Lk = LK[kk] * wf, arr = st.B[kk];
      if (Lk > .005) for (let i = 0; i < arr.length; i++) {
        const l = arr[i], dx = l[0] - q[0], dy = l[1] - q[1], dz = l[2] - q[2], dd = dx * dx + dy * dy + dz * dz;
        let f = l[3] * Lk / (1 + dd / (l[4] * l[4]));
        if (n) { const nd = (dx * n[0] + dy * n[1] + dz * n[2]) / Math.sqrt(dd + 1e-6); f *= Math.max(0, nd) * .8 + .2; }
        r += f; g += f * .62; b += f * .32;
      }
      return [r, g, b];
    };
    const fogK = (q) => c01((Math.hypot(q[0] - eye[0], q[1] - eye[1], q[2] - eye[2]) - 25) / 260) * .8;
    const shade = (alb, q, n, kk, wf = 1) => mixc(tone(alb, lit(q, n, kk, wf)), HAZE, fogK(q));
    const box = (b, alb, kk, edge = .35) => {
      const [x0, x1, y0, y1, z0, z1] = b;
      const F5 = [[[0, 0, -1], [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]]], [[-1, 0, 0], [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]]], [[1, 0, 0], [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]]], [[0, 1, 0], [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]]];
      F5.forEach(([n, pts]) => {
        if (v3.dot(n, v3.sub(eye, pts[0])) <= 0) return;
        const pa = poly(pts); if (!pa) return;
        const ctr = v3.mul(pts.reduce((s, q) => v3.add(s, q), [0, 0, 0]), .25);
        c.fillStyle = rgb(shade(alb, ctr, n, kk)); c.fill(pa);
        if (edge) { c.strokeStyle = `rgba(6,5,8,${edge})`; c.lineWidth = Math.max(.5, .5 * k); c.stroke(pa); }
      });
    };
    const figure = (x, y, z, shp, alb, kk, o = {}) => {
      const A = P([x, y, z]), Bq = P([x, y + 1, z]); if (!A || !Bq) return;
      const s = F / A[2]; if (s * 1.8 < 1.2) return;
      const sc = o.sc || 1, lean = o.lean || 0;
      let pts = lean ? shp.map(([u, v]) => [u + lean * v, v]) : shp;
      if (o.bow) { const a = o.bow; pts = pts.map(([u, v]) => (v > .9 ? [u * Math.cos(a) + (v - .9) * Math.sin(a), .9 - u * Math.sin(a) + (v - .9) * Math.cos(a)] : [u, v])); }
      const E = lit([x, y + 1.2, z], v3.norm([eye[0] - x, 0, eye[2] - z]), kk), body = mixc(tone(alb, E), HAZE, fogK([x, y, z]));
      c.setTransform(s * sc * (o.dir || 1), 0, (Bq[0] - A[0]) * sc, (Bq[1] - A[1]) * sc, A[0], A[1]);
      smoothPath(c, pts);
      c.fillStyle = rgb(body); c.fill();
      if (LK[kk] > .05 && o.rim !== false) { const g = c.createLinearGradient(.3, 0, -.05, 0); g.addColorStop(0, `rgba(255,196,130,${Math.min(.42, .3 * LK[kk])})`); g.addColorStop(1, 'rgba(255,196,130,0)'); c.save(); c.clip(); c.strokeStyle = g; c.lineWidth = .09; smoothPath(c, pts); c.stroke(); c.restore(); }
      c.setTransform(1, 0, 0, 1, 0, 0);
    };
    const horse = (x, y, z, dir, alb, kk, rider, ph) => {
      const A = P([x, y, z]), Bq = P([x, y + 1, z]); if (!A || !Bq) return;
      const s = F / A[2]; if (s < .6) return;
      const E = lit([x, y + 1.3, z], v3.norm([eye[0] - x, 0, eye[2] - z]), kk), body = mixc(tone(alb, E), HAZE, fogK([x, y, z]));
      c.setTransform(s * dir, 0, Bq[0] - A[0], Bq[1] - A[1], A[0], A[1]);
      const gait = Math.sin(ph) * .08, pts = HORSE.map(([u, v], i) => (v < .6 ? [u + (i > 16 ? -gait : gait) * (1 - v / .6), v] : [u, v + gait * .15]));
      smoothPath(c, pts); c.fillStyle = rgb(body); c.fill();
      if (rider) { c.fillStyle = rgb(mixc(body, [0, 0, 0], .15)); smoothPath(c, [[-.25, 1.5], [-.2, 2.0], [-.16, 2.32], [-.05, 2.42], [-.08, 2.5], [0, 2.66], [.08, 2.6], [.1, 2.42], [.16, 2.32], [.2, 2.0], [.3, 1.55], [.05, 1.4]]); c.fill(); c.strokeStyle = rgb(body); c.lineWidth = .05; c.beginPath(); c.moveTo(.12, 1.7); c.lineTo(.32, 3.9); c.stroke(); }
      if (LK[kk] > .05) { smoothPath(c, pts); const g = c.createLinearGradient(1.2, 0, 0, 0); g.addColorStop(0, `rgba(255,196,130,${Math.min(.4, .3 * LK[kk])})`); g.addColorStop(1, 'rgba(255,196,130,0)'); c.save(); c.clip(); c.strokeStyle = g; c.lineWidth = .1; c.stroke(); c.restore(); }
      c.setTransform(1, 0, 0, 1, 0, 0);
    };
    const palm = (x, y, z, h, ph, kk) => {
      const b = P([x, y, z]), tp = P([x + Math.sin(ph) * .8, y + h, z]); if (!b || !tp) return;
      const s = F / b[2], col = shade([40, 46, 30], [x, y + h, z], [0, 1, 0], kk);
      c.strokeStyle = rgb(col); c.lineCap = 'round'; c.lineWidth = Math.max(.6, .35 * s);
      c.beginPath(); c.moveTo(b[0], b[1]); c.quadraticCurveTo((b[0] + tp[0]) / 2 + .6 * s * Math.sin(ph), (b[1] + tp[1]) / 2, tp[0], tp[1]); c.stroke();
      c.lineWidth = Math.max(.5, .2 * s);
      for (let f = 0; f < 8; f++) { const a = f / 8 * TAU + ph + Math.sin(t * .6 + x) * .04, l = 2.3 * s, dx = Math.cos(a) * l, dy = Math.sin(a) * l * .45 + l * .35 * Math.abs(Math.cos(a)); c.beginPath(); c.moveTo(tp[0], tp[1]); c.quadraticCurveTo(tp[0] + dx * .55, tp[1] - l * .25 + dy * .2, tp[0] + dx, tp[1] + dy * .9); c.stroke(); }
    };
    const airglow = (kk) => { // the stratum itself glows: a broad warm haze over the lit terrace
      const o = [0, YB(kk) + 3, ZB(kk) + 7], Lk = LK[kk] * c01((Math.hypot(o[0] - eye[0], o[1] - eye[1], o[2] - eye[2]) - 25) / 50); if (Lk < .01) return;
      const A = P(o), Bx = P(v3.add(o, [WK(kk) * .9, 0, 0])), By = P(v3.add(o, [0, 5, 0])); if (!A || !Bx || !By) return;
      c.globalCompositeOperation = 'lighter'; c.setTransform(Bx[0] - A[0], Bx[1] - A[1], By[0] - A[0], By[1] - A[1], A[0], A[1]); c.globalAlpha = Math.min(1, (kk === 0 ? .36 : .26) * Lk); c.drawImage(st.pool, -1, -1, 2, 2); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    };
    const lights = (kk, list, a = 1) => { // glow for a list of [x,y,z,size]
      const Lk = LK[kk] * a; if (Lk < .01) return;
      c.globalCompositeOperation = 'lighter';
      list.forEach(([x, y, z, sz = 1], i) => { const q = P([x, y, z]); if (!q) return; const s = Math.max(F / q[2], 3.2 * k / sz), f = .85 + .15 * Math.sin(t * 8 + i * 2.3) * Math.sin(t * 3.7 + i); glow(q, s * 2.2 * sz, st.warm, .32 * Lk * f); glow(q, s * .5 * sz, st.warm, .6 * Lk * f); glow(q, s * .12 * sz, st.core, Math.min(1, 1.1 * Lk)); });
      c.globalCompositeOperation = 'source-over';
    };
    const wash = (kk, list) => { // warm pools on the floor and the back wall of terrace kk
      const Lk = LK[kk]; if (Lk < .01) return;
      c.globalCompositeOperation = 'lighter';
      list.forEach(([x, y, z, I, Rr]) => { stamp(st.pool, [x, YB(kk) + .02, z], [1, 0, 0], [0, 0, 1], Rr * 1.5, .3 * I * Lk); if (kk < 6) stamp(st.pool, [x, y, ZB(kk + 1) - .03], [1, 0, 0], [0, 1, 0], Rr * 1.3, .22 * I * Lk / (1 + ((ZB(kk + 1) - z) / Rr) ** 2)); });
      c.globalCompositeOperation = 'source-over';
    };
    // the retaining wall at the back of terrace kk (the front face of kk + 1) and the floor of kk
    const terrace = (kk, floorAlb, wallAlb) => {
      const y0 = YB(kk), y1 = YB(kk + 1), zf = ZB(kk), zb = ZB(kk + 1), w = WK(kk);
      // the bare hillside to either side, then the cut faces of the terrace
      [-1, 1].forEach((sd) => {
        const hs = poly([[sd * w, SL(zf), zf], [sd * XW, SL(zf), zf], [sd * XW, SL(zb), zb], [sd * w, SL(zb), zb]]);
        if (hs) { c.fillStyle = rgb(shade([92, 78, 60], [sd * (w + 20), SL((zf + zb) / 2), (zf + zb) / 2], v3.norm([0, DS, -HS]), kk)); c.fill(hs); }
        const sg = []; for (let j = 1; j < 4; j++) { const z = mix(zf, zb, j / 4); sg.push([[sd * w, SL(z), z], [sd * XW, SL(z), z]]); }
        strokeSegs(sg, 'rgba(8,6,6,.18)', Math.max(.5, .6 * k));
        if (sd * eye[0] < w) { const sw = poly([[sd * w, y0, zf], [sd * w, y0, zb], [sd * w, y1, zb], [sd * w, SL(zf), zf]]); if (sw) { c.fillStyle = rgb(mixc(shade(wallAlb, [sd * w, (y0 + y1) / 2, (zf + zb) / 2], [-sd, 0, 0], kk), [0, 0, 0], .3)); c.fill(sw); } }
      });
      const wall = poly([[-w, y0, zb], [w, y0, zb], [w, y1, zb], [-w, y1, zb]]);
      if (wall) {
        const Up = P([0, y1, zb]), Dn = P([0, y0, zb]), base = shade(wallAlb, [eye[0], (y0 + y1) / 2, zb], [0, 0, -1], kk, .4);
        if (Up && Dn) { const g = c.createLinearGradient(0, Up[1], 0, Dn[1]); g.addColorStop(0, rgb(mixc(base, [0, 0, 0], .15))); g.addColorStop(1, rgb(mixc(base, [0, 0, 0], .5))); c.fillStyle = g; } else c.fillStyle = rgb(base);
        c.fill(wall);
        c.save(); c.clip(wall);
        const segs = []; for (let y = y0 + .5; y < y1; y += .5 + .25 * hash(y * 7, kk)) segs.push([[-w, y, zb - .01], [w, y, zb - .01]]);
        strokeSegs(segs, 'rgba(10,8,10,.2)', Math.max(.5, .6 * k));
        strokeSegs([[[-w, y1 - .2, zb - .02], [w, y1 - .2, zb - .02]]], 'rgba(200,214,240,.1)', Math.max(1, 1.5 * k));
        c.restore();
      }
      const fl = poly([[-w, y0, zf], [w, y0, zf], [w, y0, zb], [-w, y0, zb]]);
      if (fl) { const n = P([0, y0, zf]), fr = P([0, y0, zb]), base = shade(floorAlb, [eye[0], y0, (zf + zb) / 2], [0, 1, 0], kk, .6); if (n && fr) { const g = c.createLinearGradient(0, fr[1], 0, n[1]); g.addColorStop(0, rgb(mixc(base, [0, 0, 0], .35))); g.addColorStop(1, rgb(base)); c.fillStyle = g; } else c.fillStyle = rgb(base); c.fill(fl); }
    };
    // ---------- sky ----------
    const hd = v3.norm([fw[0], 0, fw[2]]), hy = cy - F * v3.dot(hd, up) / v3.dot(hd, fw);
    const sky = c.createLinearGradient(0, hy - H * 1.2, 0, hy);
    sky.addColorStop(0, '#05070f'); sky.addColorStop(.55, '#0b1226'); sky.addColorStop(.9, '#1c2238'); sky.addColorStop(1, '#2a2a38');
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    c.fillStyle = '#efe6d2';
    st.stars.forEach(([x, y, z, b]) => { const q = P(v3.add(eye, [x * 1e4, y * 1e4, z * 1e4])); if (!q || q[1] > hy - 6) return; c.globalAlpha = (.25 + .65 * b) * (.75 + .25 * Math.sin(t * 2 + b * 40)) * c01((hy - q[1]) / (H * .3)); const s = (b > .9 ? 1.7 : 1) * k; c.fillRect(q[0], q[1], s, s); });
    c.globalAlpha = 1;
    const mq = P(v3.add(eye, v3.mul(v3.norm([-.62, .34, 1]), 1e4)));
    if (mq) { c.globalCompositeOperation = 'lighter'; glow(mq, H * .5, st.cold, .22); glow(mq, H * .05, st.cold, .7); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#e9e6dc'; c.beginPath(); c.arc(mq[0], mq[1], H * .018, 0, TAU); c.fill(); }
    // the far ridge beyond the plateau
    { const zr = 1800; c.fillStyle = rgb([30, 32, 46]); c.beginPath(); let first = true; st.ridge.forEach(([x, h]) => { const q = P([x, YB(6) + h, zr]); if (!q) return; if (first) { c.moveTo(q[0], H * 2); first = false; } c.lineTo(q[0], q[1]); }); c.lineTo(W * 2, H * 2); c.closePath(); c.fill(); }

    // ---------- 6: the crest and the army ----------
    {
      const y6 = YB(6), z6 = ZB(6);
      const pl = poly([[-3000, y6, z6], [3000, y6, z6], [3000, y6, 1800], [-3000, y6, 1800]]);
      if (pl) { const n = P([0, y6, z6]), f = P([0, y6, 1700]); if (n && f) { const g = c.createLinearGradient(0, f[1], 0, n[1]); g.addColorStop(0, rgb([34, 34, 44])); g.addColorStop(1, rgb(shade([70, 60, 50], [0, y6, z6 + 20], [0, 1, 0], 6))); c.fillStyle = g; } else c.fillStyle = rgb([40, 36, 40]); c.fill(pl); }
      wash(6, st.B[6]);
      const L6 = LK[6];
      st.tents.forEach(([x, z, h, r]) => { // low, wide camp tents: a ridge on poles, the cloth sagging between them
        const w = h * 1.5, d = h * 1.3, hh = h * .62, alb = r < .3 ? [150, 128, 96] : r < .7 ? [104, 86, 66] : [58, 50, 44];
        const prof = []; for (let i = 0; i <= 8; i++) { const u = i / 8, xx = x - w + u * 2 * w, peak = Math.abs(u - .5) < .3 ? hh * (1 - .18 * Math.sin((u - .2) / .6 * Math.PI * 2) ** 2) : hh * (1 - Math.abs(u - .5) * 2) * 1.6; prof.push([xx, y6 + Math.max(0, Math.min(hh, peak)), z]); }
        const front = poly([[x - w, y6, z], ...prof, [x + w, y6, z]]); if (!front) return;
        const roof = poly([prof[2], prof[6], [prof[6][0], prof[6][1], z + d], [prof[2][0], prof[2][1], z + d]]);
        if (roof && eye[1] > y6 + hh) { c.fillStyle = rgb(shade(alb, [x, y6 + hh, z + d / 2], [0, 1, 0], 6)); c.fill(roof); }
        c.fillStyle = rgb(shade(alb, [x, y6 + hh * .5, z], [0, 0, -1], 6)); c.fill(front);
        const op = poly([[x - w * .18, y6, z - .02], [x + w * .18, y6, z - .02], [x + w * .14, y6 + hh * .7, z - .02], [x - w * .14, y6 + hh * .7, z - .02]]);
        if (op) { c.fillStyle = rgb(mixc([8, 6, 6], [255, 160, 80], hash(x) > .45 ? .45 * L6 : 0)); c.fill(op); }
      });
      st.banners6.forEach(([x, z, r], i) => { const b = P([x, y6, z]), tp = P([x, y6 + 7, z]); if (!b || !tp) return; const s = F / b[2]; c.strokeStyle = rgb(shade([60, 46, 30], [x, y6 + 3, z], null, 6)); c.lineWidth = Math.max(.6, .12 * s); c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(tp[0], tp[1]); c.stroke(); const col = i % 3 ? [46, 117, 88] : [201, 165, 78]; c.fillStyle = rgb(shade(col, [x, y6 + 6, z], [0, 0, -1], 6)); c.beginPath(); for (let j = 0; j <= 8; j++) { const u = j / 8, q = P([x + u * 2.6, y6 + 6.8 - .2 * u + .15 * Math.sin(u * 5 - t * 2 - r * 9), z]); if (q) (j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); } for (let j = 8; j >= 0; j--) { const u = j / 8, q = P([x + u * 2.6, y6 + 5.4 - .1 * u + .15 * Math.sin(u * 5 - t * 2 - r * 9), z]); if (q) c.lineTo(q[0], q[1]); } c.closePath(); c.fill(); });
      st.camp.forEach(([x, z, r]) => figure(x, y6, z, r < .5 ? SH.man : SH.sit, [60, 54, 46], 6, { sc: r < .5 ? 1 : .9 }));
      st.riders.forEach(([x0, z, dir, sp, r]) => { const x = x0 + dir * sp * 40 * (p - .11); horse(x, y6, z, dir, r < .5 ? [70, 52, 38] : [40, 34, 30], 6, true, p * 220 * sp + r * 9); });
      c.globalCompositeOperation = 'lighter';
      airglow(6);
      c.globalCompositeOperation = 'lighter';
      st.fires.forEach(([x, z], i) => { const q = P([x, y6 + .5, z]); if (!q) return; const s = F / q[2], f = .8 + .2 * Math.sin(t * 9 + i) * Math.sin(t * 5 + i * 2); glow(q, s * 6, st.warm, .28 * L6 * f); glow(q, s * 1.2, st.hot, .7 * L6 * f); for (let j = 0; j < 4; j++) { const u = (t * .7 + hash(i, j)) % 1, sq = P([x + (hash(i, j + 3) - .5) * .8, y6 + .6 + u * 4, z]); if (sq) glow(sq, Math.max(1, s * .06), st.core, L6 * (1 - u)); } });
      c.globalCompositeOperation = 'source-over';
    }
    // ---------- 5: the diwan ----------
    {
      const y5 = YB(5), z5 = ZB(5), kk = 5;
      terrace(kk, [104, 90, 72], [120, 100, 76]);
      wash(kk, st.B[5]);
      // the hall behind the portico: its wall with shelves of rolls
      const zh = z5 + 10.5, roofY = y5 + 5.2;
      box([-38, 38, y5, roofY + .4, zh, ZB(6) - .05], [128, 108, 82], kk, .2);
      const shelves = [], rolls = [];
      for (let x = -32; x <= 32; x += 4.25) { shelves.push([[x - 1.5, y5 + .8, zh - .02], [x + 1.5, y5 + .8, zh - .02]], [[x - 1.5, y5 + 1.6, zh - .02], [x + 1.5, y5 + 1.6, zh - .02]], [[x - 1.5, y5 + 2.4, zh - .02], [x + 1.5, y5 + 2.4, zh - .02]]); for (let r = 0; r < 3; r++) for (let j = 0; j < 9; j++) rolls.push([x - 1.35 + j * .34, y5 + 1.0 + r * .8, zh - .03]); }
      strokeSegs(shelves, rgb(shade([70, 50, 30], [0, y5 + 1.5, zh], [0, 0, -1], kk)), Math.max(.6, 1.2 * k));
      const rc = shade([220, 200, 160], [0, y5 + 1.5, zh], [0, 0, -1], kk);
      c.fillStyle = rgb(rc); rolls.forEach((q) => { const v = P(q); if (!v) return; const r = Math.max(.5, F / v[2] * .1); c.beginPath(); c.arc(v[0], v[1], r, 0, TAU); c.fill(); });
      // the portico roof and piers
      box([-36, 36, roofY, roofY + .7, z5 + 6.6, zh], [134, 112, 86], kk, .25);
      st.piers5.forEach((x) => box([x - .35, x + .35, y5, roofY, z5 + 6.6, z5 + 7.3], [140, 118, 92], kk, .3));
      // scribes at their desks; their sheets catch the lamp
      st.scribes.forEach(([x, z, r], i) => {
        box([x - .55, x + .55, y5, y5 + .35, z - .7, z - .25], [90, 64, 40], kk, .3);
        const sh = poly([[x - .4, y5 + .36, z - .66], [x + .4, y5 + .36, z - .66], [x + .4, y5 + .36, z - .3], [x - .4, y5 + .36, z - .3]]);
        if (sh) { c.fillStyle = rgb(mixc(shade([230, 216, 184], [x, y5 + .4, z - .5], [0, 1, 0], kk), [255, 240, 210], .3 * LK[kk])); c.fill(sh); }
        figure(x, y5, z, SH.sit, [[80, 66, 50], [66, 56, 48], [96, 80, 60]][i % 3], kk, { sc: .95 });
      });
      st.walk5.forEach(([x0, z, dir, r]) => figure(x0 + dir * 30 * (p - .2) * (.5 + r), y5, z, SH.man, [74, 62, 50], kk));
      lights(kk, st.B[5].map((l) => [l[0], l[1], l[2], .8]));
      airglow(kk);
    }
    // ---------- 4: the judges ----------
    {
      const y4 = YB(4), z4 = ZB(4), kk = 4;
      terrace(kk, [100, 88, 72], [118, 98, 76]);
      wash(kk, st.B[4]);
      const zq = ZB(5) - .05;
      // the mihrab in the qibla wall, behind the bench
      { const o = [[-1.1, y4, zq - .01], [1.1, y4, zq - .01]]; for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI; o.push([1.1 * Math.cos(a), y4 + 3 + 1.1 * Math.sin(a), zq - .01]); } const pa = poly(o); if (pa) { c.fillStyle = rgb(mixc(shade([60, 40, 26], [0, y4 + 2, zq], [0, 0, -1], kk), [0, 0, 0], .3)); c.fill(pa); c.strokeStyle = rgb(shade([200, 170, 110], [0, y4 + 2, zq], [0, 0, -1], kk), .5); c.lineWidth = Math.max(.6, 1.2 * k); c.stroke(pa); } }
      // the roof of the arcade, then its columns and arches
      const zc = z4 + 6, roofY = y4 + 5.6;
      box([-40, 40, roofY, roofY + .6, zc - .4, zq], [126, 106, 82], kk, .2);
      st.cols4.forEach((x, i) => {
        box([x - .22, x + .22, y4, y4 + 3.4, zc - .22, zc + .22], [150, 130, 104], kk, .25);
        if (i < st.cols4.length - 1) {
          const x1 = st.cols4[i + 1], xm = (x + x1) / 2, hw = (x1 - x) / 2 - .22;
          const o = [[x, y4 + 3.4, zc - .4], [x, roofY, zc - .4], [x1, roofY, zc - .4], [x1, y4 + 3.4, zc - .4]];
          for (let j = 0; j <= 10; j++) { const a = j / 10 * Math.PI, pt = Math.pow(Math.sin(a), .8); o.push([xm + hw * Math.cos(a), y4 + 3.4 + 1.7 * pt, zc - .4]); }
          const pa = poly(o); if (pa) { c.fillStyle = rgb(shade([140, 116, 88], [xm, roofY - .8, zc], [0, 0, -1], kk)); c.fill(pa); c.strokeStyle = 'rgba(8,6,6,.3)'; c.lineWidth = Math.max(.5, .6 * k); c.stroke(pa); }
        }
      });
      // the bench, the one who judges, those who stand before him, those who sit and watch
      box([-2.2, 2.2, y4, y4 + .65, z4 + 8.8, z4 + 10.6], [120, 96, 70], kk);
      figure(0, y4 + .65, z4 + 9.7, SH.sit, [92, 78, 62], kk, { sc: 1 });
      figure(-1.2, y4, z4 + 7.6, SH.man, [80, 64, 50], kk, { dir: 1 });
      figure(1.3, y4, z4 + 7.5, SH.man, [62, 54, 48], kk, { dir: -1 });
      st.sitters4.forEach(([x, z, r]) => figure(x, y4, z, SH.sit, [[84, 70, 54], [70, 60, 50], [98, 84, 64]][(r * 3) | 0], kk, { sc: .95 }));
      lights(kk, st.B[4].map((l) => [l[0], l[1], l[2], .8]));
      airglow(kk);
    }
    // ---------- 3: the governor's house ----------
    {
      const y3 = YB(3), z3 = ZB(3), kk = 3;
      terrace(kk, [98, 86, 70], [116, 98, 76]);
      wash(kk, st.B[3]);
      const zf = z3 + 6.2, zb = ZB(4) - .05, H3 = 6.6;
      box([-11, 11, y3, y3 + H3, zf, zb], [176, 160, 132], kk, .3);
      box([-24, -11.6, y3, y3 + 4.6, zf + 1.4, zb], [140, 122, 96], kk, .3);
      box([11.6, 24, y3, y3 + 4.6, zf + 1.4, zb], [140, 122, 96], kk, .3);
      // crenellations
      for (let x = -10.6; x < 10.8; x += 1.2) box([x, x + .6, y3 + H3, y3 + H3 + .55, zf, zf + .4], [170, 154, 126], kk, .2);
      // the gate: an arch, its doors open on the lit court
      const gate = []; gate.push([-1.6, y3, zf - .02], [1.6, y3, zf - .02]); for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI; gate.push([1.6 * Math.cos(a), y3 + 2.9 + 1.6 * Math.sin(a), zf - .02]); }
      const gp = poly(gate); if (gp) { c.fillStyle = rgb(mixc([12, 10, 12], [255, 170, 90], .35 * LK[kk])); c.fill(gp); c.strokeStyle = rgb(shade([200, 184, 150], [0, y3 + 3, zf], [0, 0, -1], kk), .7); c.lineWidth = Math.max(.8, 1.6 * k); c.stroke(gp); }
      // latticed windows, two storeys
      for (let fl = 0; fl < 2; fl++) for (let x = -9; x <= 9; x += 3) { if (Math.abs(x) < 2.5 && fl === 0) continue; const yy = y3 + 1.4 + fl * 2.6; const w = poly([[x - .55, yy, zf - .02], [x + .55, yy, zf - .02], [x + .55, yy + 1.4, zf - .02], [x - .55, yy + 1.4, zf - .02]]); if (!w) continue; const on = LK[kk] * (hash(x * 3 + fl) > .25 ? 1 : .3); c.fillStyle = rgb(mixc([18, 14, 14], [255, 176, 96], .65 * on)); c.fill(w); const gr = []; for (let g = -.4; g <= .41; g += .2) gr.push([[x + g, yy, zf - .03], [x + g, yy + 1.4, zf - .03]]); for (let g = .2; g < 1.4; g += .2) gr.push([[x - .55, yy + g, zf - .03], [x + .55, yy + g, zf - .03]]); strokeSegs(gr, 'rgba(20,12,8,.8)', Math.max(.5, .6 * k)); }
      // guards at the gate, a rider arriving, people about
      figure(-2.6, y3, zf - .8, SH.man, [70, 60, 50], kk); figure(2.6, y3, zf - .8, SH.man, [70, 60, 50], kk);
      [[-2.6], [2.6]].forEach(([x]) => strokeSegs([[[x + .3, y3 + .2, zf - .8], [x + .3, y3 + 3.1, zf - .8]]], rgb(shade([60, 50, 40], [x, y3 + 2, zf], null, kk)), Math.max(.6, F / Math.max(1, toC([x, y3, zf])[2]) * .05)));
      horse(mix(-26, -6, smooth(seg(p, .33, .42))), y3, zf - 3, 1, [80, 60, 44], kk, true, p * 300);
      st.walk3.forEach(([x0, z, dir, r]) => figure(x0 + dir * 26 * (p - .38), y3, z, r < .3 ? SH.woman : SH.man, [74, 64, 52], kk));
      lights(kk, st.B[3].map((l) => [l[0], l[1], l[2], .9]));
      airglow(kk);
    }
    // ---------- 2: the fields ----------
    {
      const y2 = YB(2), z2 = ZB(2), kk = 2;
      terrace(kk, [92, 90, 64], [112, 96, 74]);
      // furrows and crop rows
      const fur = [], crop = [];
      for (let z = z2 + .6; z < z2 + 8.5; z += .5) { fur.push([[-XW, y2 + .01, z], [XW, y2 + .01, z]]); crop.push([[-XW, y2 + .02, z + .22], [XW, y2 + .02, z + .22]]); }
      strokeSegs(fur, 'rgba(12,10,8,.35)', Math.max(.6, .8 * k));
      strokeSegs(crop, rgb(shade([60, 92, 48], [0, y2, z2 + 4], [0, 1, 0], kk), .55), Math.max(.6, 1.1 * k));
      // the canal along the front edge
      const cn = poly([[-XW, y2 + .03, z2 + .1], [XW, y2 + .03, z2 + .1], [XW, y2 + .03, z2 + .5], [-XW, y2 + .03, z2 + .5]]);
      if (cn) { c.fillStyle = rgb(mixc([30, 40, 60], [255, 180, 110], .25 * LK[kk])); c.fill(cn); }
      wash(kk, st.B[2]);
      st.palms2.forEach(([x, z, h, ph]) => palm(x, y2, z, h, ph, kk));
      st.houses2.forEach(([x, z, w, h]) => { box([x - w / 2, x + w / 2, y2, y2 + h, z, z + 3.4], [132, 112, 86], kk, .3); const d = poly([[x - .4, y2, z - .02], [x + .4, y2, z - .02], [x + .4, y2 + 1.6, z - .02], [x - .4, y2 + 1.6, z - .02]]); if (d) { c.fillStyle = rgb(mixc([14, 10, 10], [255, 160, 80], .5 * LK[kk])); c.fill(d); } });
      // the water-wheel and the ox that turns it
      { const wx = -8, wz = z2 + 5, wy = y2 + 2.4, rr = 2.3, ang = p * 30;
        const rim = [], sp = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU + ang; rim.push([wx, wy + Math.sin(a) * rr, wz + Math.cos(a) * rr * .0 - .0, a]); }
        const wc = shade([110, 84, 56], [wx, wy, wz], [0, 0, -1], kk);
        c.strokeStyle = rgb(wc); c.lineWidth = Math.max(.6, F / Math.max(1, toC([wx, wy, wz])[2]) * .12);
        c.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU + ang, q = P([wx + Math.cos(a) * rr, wy + Math.sin(a) * rr, wz]); if (q) (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); } c.stroke();
        c.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU + ang, q = P([wx + Math.cos(a) * rr * .82, wy + Math.sin(a) * rr * .82, wz]); if (q) (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); } c.stroke();
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + ang; sp.push([[wx, wy, wz], [wx + Math.cos(a) * rr, wy + Math.sin(a) * rr, wz]]); }
        strokeSegs(sp, rgb(wc), Math.max(.5, .7 * k));
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + ang, q = P([wx + Math.cos(a) * (rr + .12), wy + Math.sin(a) * (rr + .12), wz - .05]); if (q) { const s = F / q[2]; c.fillStyle = rgb(shade([150, 90, 50], [wx, wy, wz], [0, 0, -1], kk)); c.beginPath(); c.ellipse(q[0], q[1], s * .14, s * .18, 0, 0, TAU); c.fill(); } }
        { const hub = P([wx, wy, wz - .05]); if (hub) { c.fillStyle = rgb(wc); c.beginPath(); c.arc(hub[0], hub[1], F / hub[2] * .2, 0, TAU); c.fill(); } }
        box([wx - .15, wx + .15, y2, wy, wz + .1, wz + .4], [90, 70, 48], kk, .3);
        const oa = p * 18, ox = wx + 4 + Math.cos(oa) * 2.2, oz = wz - 1 + Math.sin(oa) * 1.2;
        horse(ox, y2, oz, Math.sin(oa) > 0 ? -1 : 1, [60, 50, 42], kk, false, p * 200);
      }
      st.farmers.forEach(([x, z, r], i) => {
        const bent = i % 4 !== 3, dir = r < .5 ? 1 : -1, sw = .06 * Math.sin(p * 160 + i * 1.7);
        figure(x, y2, z, bent ? SH.bent : SH.woman, [86, 72, 56], kk, { dir, sc: .97, lean: bent ? sw : 0 });
        if (bent) strokeSegs([[[x + dir * .3, y2 + 1.05, z - .05], [x + dir * (1.05 + sw * 3), y2 + .05, z - .05]]], rgb(shade([70, 54, 36], [x, y2 + 1, z], null, kk)), Math.max(.6, F / Math.max(1, toC([x, y2, z])[2]) * .05));
      });
      lights(kk, st.B[2].map((l) => [l[0], l[1], l[2] - .2, .7]));
      airglow(kk);
    }
    // ---------- 1: the market, the workshops ----------
    {
      const y1 = YB(1), z1 = ZB(1), kk = 1, L1 = LK[1];
      terrace(kk, [100, 88, 72], [114, 96, 74]);
      wash(kk, st.B[1]);
      const zb = ZB(2) - .05;
      // workshops against the wall: the forge, the kiln, the loom shed
      box([-19, -11, y1, y1 + 4, z1 + 9, zb], [104, 86, 66], kk, .3);
      box([10, 18, y1, y1 + 3.6, z1 + 9, zb], [110, 90, 68], kk, .3);
      box([-4, 4, y1, y1 + 3.8, z1 + 9.4, zb], [118, 100, 76], kk, .3);
      [[-15, 1.9, 1.5], [14, 1.4, 1.2], [0, 5.6, 2.1]].forEach(([x, w, h], i) => { const d = poly([[x - w / 2, y1, z1 + (i === 2 ? 9.38 : 8.98)], [x + w / 2, y1, z1 + (i === 2 ? 9.38 : 8.98)], [x + w / 2, y1 + h + .6, z1 + (i === 2 ? 9.38 : 8.98)], [x - w / 2, y1 + h + .6, z1 + (i === 2 ? 9.38 : 8.98)]]); if (d) { c.fillStyle = rgb(mixc([12, 10, 10], i === 2 ? [200, 150, 90] : [255, 130, 50], (i === 2 ? .35 : .7) * L1)); c.fill(d); } });
      { const lz = z1 + 9.5, lw = []; for (let x = -2.2; x <= 2.21; x += .12) lw.push([[x, y1 + .5, lz], [x, y1 + 2.3, lz]]); lw.push([[-2.4, y1 + .45, lz - .1], [2.4, y1 + .45, lz - .1]], [[-2.4, y1 + 2.35, lz - .1], [2.4, y1 + 2.35, lz - .1]], [[-2.4, y1, lz - .1], [-2.4, y1 + 2.5, lz - .1]], [[2.4, y1, lz - .1], [2.4, y1 + 2.5, lz - .1]]);
        strokeSegs(lw, rgb(mixc(shade([170, 140, 100], [0, y1 + 1.4, lz], [0, 0, -1], kk), [255, 214, 160], .25 * L1), .8), Math.max(.5, .6 * k));
        const cl = poly([[-2.2, y1 + .9, lz - .02], [2.2, y1 + .9, lz - .02], [2.2, y1 + 1.6, lz - .02], [-2.2, y1 + 1.6, lz - .02]]); if (cl) { c.fillStyle = rgb(shade([150, 50, 40], [0, y1 + 1.2, lz], [0, 0, -1], kk), .85); c.fill(cl); }
        figure(1.2, y1, lz - .7, SH.sit, [90, 74, 58], kk); }
      // stalls: posts, a striped awning, goods on the counter
      st.stalls.forEach(([x, z, w, r], i) => {
        const hw = w / 2, col1 = [[150, 50, 36], [40, 60, 110], [180, 150, 90], [46, 100, 76]][i % 4], col2 = [220, 206, 176];
        box([x - hw, x + hw, y1, y1 + .9, z, z + 1], [110, 84, 56], kk, .3);
        for (let j = 0; j < 6; j++) { const u0 = -hw + j * w / 6, u1 = u0 + w / 6; const a = poly([[x + u0, y1 + 2.7, z - .9], [x + u1, y1 + 2.7, z - .9], [x + u1, y1 + 3.3, z + 1.1], [x + u0, y1 + 3.3, z + 1.1]]); if (a) { c.fillStyle = rgb(shade(j % 2 ? col2 : col1, [x, y1 + 3, z], v3.norm([0, .8, -.6]), kk)); c.fill(a); } }
        strokeSegs([[[x - hw, y1, z - .85], [x - hw, y1 + 2.7, z - .85]], [[x + hw, y1, z - .85], [x + hw, y1 + 2.7, z - .85]]], rgb(shade([70, 50, 30], [x, y1 + 1, z], null, kk)), Math.max(.6, .9 * k));
        for (let g = 0; g < 4; g++) { const q = P([x - hw + .5 + g * (w - 1) / 3, y1 + 1.15, z + .3]); if (q) { const s = F / q[2]; c.fillStyle = rgb(shade([[170, 110, 60], [200, 180, 120], [120, 140, 160], [160, 60, 50]][(g + i) % 4], [x, y1 + 1, z], [0, 0, -1], kk)); c.beginPath(); c.ellipse(q[0], q[1], s * .22, s * .28, 0, 0, TAU); c.fill(); } }
      });
      // lanterns strung between the stalls
      const lan = [];
      for (let i = 0; i < st.stalls.length - 1; i++) { const a = st.stalls[i], b = st.stalls[i + 1]; const pts = []; for (let j = 0; j <= 8; j++) { const u = j / 8; pts.push([mix(a[0], b[0], u), y1 + 3.6 - Math.sin(Math.PI * u) * .7, mix(a[1], b[1], u) - 1]); } const sg = []; for (let j = 0; j < 8; j++) sg.push([pts[j], pts[j + 1]]); strokeSegs(sg, 'rgba(20,16,12,.7)', Math.max(.5, .6 * k)); lan.push([pts[2][0], pts[2][1] - .2, pts[2][2], .4], [pts[6][0], pts[6][1] - .2, pts[6][2], .4]); }
      st.buyers.forEach(([x0, z, dir, r], i) => figure(x0 + dir * 18 * (p - .56) * (.4 + r), y1, z, i % 3 === 0 ? SH.woman : SH.man, [[90, 70, 52], [70, 64, 60], [110, 90, 66]][i % 3], kk));
      lights(kk, lan);
      airglow(kk);
      // forge and kiln glow, sparks
      if (L1 > .01) { c.globalCompositeOperation = 'lighter'; const fq = P([-15, y1 + .8, z1 + 9.1]); if (fq) { const s = F / fq[2]; glow(fq, s * 4, st.hot, .5 * L1); for (let j = 0; j < 10; j++) { const u = (t * 1.3 + hash(j, 2)) % 1, q = P([-15 + (hash(j, 5) - .5) * 1.4 + u * (hash(j, 7) - .5) * 2, y1 + .8 + u * 2.6, z1 + 8.6]); if (q) glow(q, Math.max(1, s * .06), st.core, L1 * (1 - u)); } } const kq = P([14, y1 + .7, z1 + 9.1]); if (kq) glow(kq, F / kq[2] * 3, st.hot, .45 * L1); c.globalCompositeOperation = 'source-over'; }
    }
    // ---------- 0: the strand and the lowest class ----------
    {
      const kk = 0, L0 = LK[0], z1 = ZB(1);
      terrace(kk, [96, 84, 66], [104, 92, 74]);
      { const bl = [], zq = z1 - .015; for (let y = YB(0) + .55, r = 0; y < YB(1); y += .55, r++) for (let x = -WK(0) + (r % 2) * .7; x < WK(0); x += 1.4) bl.push([[x, y - .55, zq], [x, y, zq]]); strokeSegs(bl, 'rgba(10,8,8,.22)', Math.max(.5, .6 * k)); }
      // arches in the quay wall: shelters, each with a small fire
      st.arches0.forEach((x) => { const o = [[x - 1.5, YB(0), z1 - .02], [x + 1.5, YB(0), z1 - .02]]; for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI; o.push([x + 1.5 * Math.cos(a), YB(0) + 2.4 + 1.5 * Math.sin(a), z1 - .02]); } const pa = poly(o); if (pa) { c.fillStyle = rgb(mixc([10, 8, 10], [200, 110, 50], .2 * L0)); c.fill(pa); } });
      wash(kk, st.B[0]);
      st.shelters.forEach(([x, z]) => { // domed reed huts
        const y0 = YB(0), h = 2.2, w = 1.9, o = []; for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI; o.push([x + w * Math.cos(a), y0 + h * Math.sin(a) ** .8, z]); }
        const pa = poly(o); if (!pa) return;
        const base = shade([118, 96, 60], [x, y0 + 1, z], [0, .3, -1], kk);
        const A = P([x, y0 + h, z]), Bq = P([x, y0, z]); if (A && Bq) { const g = c.createLinearGradient(0, A[1], 0, Bq[1]); g.addColorStop(0, rgb(base)); g.addColorStop(1, rgb(mixc(base, [0, 0, 0], .45))); c.fillStyle = g; } else c.fillStyle = rgb(base);
        c.fill(pa);
        const rs = []; for (let i = 1; i < 14; i++) { const a = i / 14 * Math.PI; rs.push([[x + w * Math.cos(a), y0, z - .01], [x + w * Math.cos(a) * .9, y0 + h * Math.sin(a) ** .8 * .98, z - .01]]); } for (let j = 1; j < 4; j++) { const yy = y0 + h * j / 4, ww = w * Math.sqrt(1 - (j / 4) ** 2.5); rs.push([[x - ww, yy, z - .01], [x + ww, yy, z - .01]]); }
        strokeSegs(rs, 'rgba(30,20,10,.4)', Math.max(.5, .6 * k));
        const d = []; for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI; d.push([x + .5 * Math.cos(a), y0 + 1.1 * Math.sin(a), z - .02]); } const dp = poly(d); if (dp) { c.fillStyle = rgb(mixc([8, 6, 6], [255, 150, 70], .5 * LK[0])); c.fill(dp); }
      });
      // the stair down from the quay
      for (let s = 0; s < 12; s++) box([-1.6, 1.6, YB(0) + s * (HS / 12), YB(0) + (s + 1) * (HS / 12), ZB(1) - 6 + s * .5, ZB(1)], [120, 104, 82], 0, .2);
      st.poor.forEach(([x, z, r, sc], i) => figure(x, YB(0), z, sc < 1 ? SH.sit : i % 4 === 0 ? SH.man : SH.sit, [[92, 76, 58], [74, 64, 54], [108, 90, 70]][i % 3], kk, { sc: sc < 1 ? .62 : .95 }));
      // lanterns come down the stair from the market, and stay among them
      const bearers = [];
      for (let i = 0; i < 6; i++) {
        const u = seg(p, .688 + i * .016, .775 + i * .016); if (u <= 0) continue;
        const tgt = st.fires0[[3, 4, 5, 2, 6, 1][i]], z1b = ZB(1); let q;
        if (u < .15) { const v = u / .15; q = [mix((i - 2.5) * 1.6, 0, v), YB(1), mix(z1b + 2.5, z1b, v)]; }
        else if (u < .55) { const v = (u - .15) / .4; q = [(i % 2 ? .5 : -.5), mix(YB(1), YB(0), v), mix(z1b, z1b - 6, v)]; }
        else { const v = smooth((u - .55) / .45); q = [mix(i % 2 ? .5 : -.5, tgt[0] + (i % 2 ? 1.1 : -1.1), v), YB(0), mix(z1b - 6, tgt[1] - 1.2, v)]; }
        bearers.push([q, u]);
        figure(q[0], q[1], q[2], i % 3 === 1 ? SH.woman : SH.man, [120, 96, 70], 0, { sc: 1 });
      }
      // the fires
      c.globalCompositeOperation = 'lighter';
      bearers.forEach(([q, u], i) => { const v = P([q[0] + .3, q[1] + 1.05, q[2] - .2]); if (!v) return; const s = F / v[2], f = .85 + .15 * Math.sin(t * 7 + i * 2); glow(v, s * 2.2, st.warm, .28 * f); glow(v, s * .45, st.warm, .55 * f); glow(v, s * .08, st.core, 1); });
      st.fires0.forEach(([x, z], i) => { const q = P([x, YB(0) + .35, z]); if (!q) return; const s = F / q[2], f = .8 + .2 * Math.sin(t * 9 + i) * Math.sin(t * 4.3 + i * 2), a = .25 + .75 * c01(L0); glow(q, s * 5.5, st.warm, .3 * a * f * Math.max(.4, L0)); glow(q, s * 1, st.hot, .75 * a * f); });
      st.arches0.forEach((x, i) => { if (i % 2) return; const q = P([x, YB(0) + .8, z1 - .8]); if (q) glow(q, F / q[2] * 1.8, st.warm, .3 * L0); });
      c.globalCompositeOperation = 'source-over';
      airglow(0);
    }
    // ---------- the river ----------
    {
      const wat = poly([[-XW * 2, 0, -700], [XW * 2, 0, -700], [XW * 2, 0, 0], [-XW * 2, 0, 0]]);
      if (wat) { const n = P([0, 0, -1]), f = P([0, 0, -600]); if (n && f) { const g = c.createLinearGradient(0, f[1], 0, n[1]); g.addColorStop(0, '#1d2232'); g.addColorStop(1, '#0a0d16'); c.fillStyle = g; } else c.fillStyle = '#0c0f18'; c.fill(wat); }
      const bank = poly([[-XW, 0, 0], [XW, 0, 0], [XW, Y0, 0], [-XW, Y0, 0]]);
      if (bank) { c.fillStyle = rgb(shade([70, 60, 50], [0, .6, 0], [0, 0, -1], 0)); c.fill(bank); }
      // reflections: every light finds its place on the water
      c.globalCompositeOperation = 'lighter';
      const refl = (x, y, z, a, wd = 1) => {
        if (a < .01) return; const s = eye[1] / (eye[1] + y), zw = eye[2] + s * (z - eye[2]); if (zw > -.5) return; const xw = eye[0] + s * (x - eye[0]);
        const q = P([xw, 0, zw]); if (!q) return; const sc = F / q[2];
        const len = Math.min(H * .5, sc * (6 + y * .3)), wdt = Math.max(2 * k, sc * .9 * wd);
        c.globalAlpha = Math.min(1, a); c.drawImage(st.streak, q[0] - wdt / 2 + Math.sin(t * 1.3 + x) * wdt * .2, q[1] - wdt * .3, wdt, len); c.globalAlpha = 1;
      };
      for (let kk = 0; kk < 7; kk++) { const Lk = LK[kk]; if (Lk < .02) continue; st.B[kk].forEach((l) => refl(l[0], l[1], l[2], .25 * Lk * l[3] * (kk === 0 ? 1.6 : 1), kk === 0 ? 2 : 1)); }
      if (mq) { const mdir = v3.norm([-.62, -.34, 1]); const zw = -eye[1] / mdir[1] * mdir[2] + eye[2]; void zw; }
      c.globalCompositeOperation = 'source-over';
      // ripples
      c.lineWidth = Math.max(.6, .8 * k);
      st.ripples.forEach(([x, z, r]) => { const q = P([x + Math.sin(t * .3 + r * 9) * 2, 0, z]); if (!q || q[1] > H + 4) return; const L = Math.max(2 * k, F / q[2] * (2 + 3 * r)); c.strokeStyle = `rgba(150,170,210,${.06 + .06 * r})`; c.beginPath(); c.moveTo(q[0] - L / 2, q[1]); c.lineTo(q[0] + L / 2, q[1]); c.stroke(); });
    }
    // ---------- the ships at the quay ----------
    st.ships.forEach(([x, z0s, L, dir], i) => { // Nile boats: a hull with a deck, a mast, the long yard with its sail furled
      const z = z0s - (i === 1 || i === 2 ? 46 * smooth(seg(p, .62, .9)) : 0); // the two at the quay cast off and stand out into the river
      const kk = 1, bob = .06 * Math.sin(t * .8 + i), Ls = Math.max(.35, LK[1]), B2 = 1.7;
      const prof = (zz) => [[-L / 2, 2.3], [-L / 2 + 1.6, .25], [L / 2 - 2.8, .15], [L / 2, 2.8]].map(([u, v]) => [x + u * dir, v + bob, zz]);
      const fr = prof(z - B2), bk = prof(z + B2);
      const deck = poly([[x - L / 2 * dir, 2.3 + bob, z - B2], [x + L / 2 * dir, 2.8 + bob, z - B2], [x + L / 2 * dir, 2.8 + bob, z + B2], [x - L / 2 * dir, 2.3 + bob, z + B2]]);
      if (deck && eye[1] > 2.6) { c.fillStyle = rgb(mixc(shade([96, 74, 52], [x, 2.5, z], [0, 1, 0], kk), [255, 170, 90], .12 * Ls)); c.fill(deck); }
      const side = poly(fr); if (!side) return;
      const hq = P([x, 1.2, z - B2]); const hc = shade([70, 52, 36], [x, 1.2, z - B2], [0, 0, -1], kk);
      if (hq) { const top = P([x, 2.6, z - B2]), bot = P([x, .2, z - B2]); if (top && bot) { const g = c.createLinearGradient(0, top[1], 0, bot[1]); g.addColorStop(0, rgb(mixc(hc, [255, 180, 110], .18 * Ls))); g.addColorStop(1, rgb(mixc(hc, [0, 0, 0], .5))); c.fillStyle = g; } else c.fillStyle = rgb(hc); } else c.fillStyle = rgb(hc);
      c.fill(side);
      const planks = []; for (let v = .7; v < 2.4; v += .45) planks.push([[x - (L / 2 - 1.2) * dir, v + bob, z - B2 - .01], [x + (L / 2 - 1.6) * dir, v + .1 + bob, z - B2 - .01]]);
      strokeSegs(planks, 'rgba(10,6,4,.35)', Math.max(.5, .6 * k));
      const mx = x + L * .08 * dir, sz = Math.max(.8, F / Math.max(1, toC([mx, 7, z])[2]) * .16);
      strokeSegs([[[mx, 2.4, z], [mx, 10, z]]], rgb(mixc(hc, [0, 0, 0], .1)), sz);
      // the yard and its furled sail, lit warm along its underside
      strokeSegs([[[mx - L * .52, 4.2, z], [mx + L * .44, 8.6, z]]], rgb(mixc(shade([200, 186, 156], [mx, 6, z], [0, 0, -1], kk), [255, 200, 140], .2 * Ls)), sz * 1.5);
      strokeSegs([[[mx - L * .52, 4.2, z], [mx + L * .44, 8.6, z]]], 'rgba(20,14,10,.4)', sz * .4);
      strokeSegs([[[mx, 10, z], [x + L / 2 * dir, 2.8, z]], [[mx, 10, z], [x - L / 2 * dir, 2.3, z]], [[mx, 9, z], [x + L * .2 * dir, 2.6, z + B2]]], 'rgba(20,16,14,.55)', Math.max(.5, .5 * k));
      c.globalCompositeOperation = 'lighter';
      [[x - L * .44 * dir, 3.2], [x + L * .42 * dir, 3.5]].forEach(([lx, ly], j) => { const lq = P([lx, ly, z - B2 * .5]); if (!lq) return; const s0 = F / lq[2]; glow(lq, s0 * 2.4, st.warm, .45 * Ls); glow(lq, s0 * .14, st.core, .95); const rq = P([lx, 0, z - B2 - .5]); if (rq) { const s1 = F / rq[2]; c.globalAlpha = .35 * Ls; c.drawImage(st.streak, rq[0] - s1 * .4, rq[1], s1 * .8, s1 * 5); c.globalAlpha = 1; } void j; });
      c.globalCompositeOperation = 'source-over';
    });

    // ---------- grade ----------
    if (!st.pat) st.pat = c.createPattern(st.noise, 'repeat');
    c.globalCompositeOperation = 'overlay'; c.fillStyle = st.pat; c.save(); c.translate((t * 37 % 1) * 192 | 0, (t * 53 % 1) * 192 | 0); c.fillRect(-192, -192, W + 384, H + 384); c.restore(); c.globalCompositeOperation = 'source-over';
    const vg = c.createRadialGradient(W / 2, H * .5, Math.min(W, H) * .3, W / 2, H * .5, Math.hypot(W, H) * .62);
    vg.addColorStop(0, 'rgba(5,6,12,0)'); vg.addColorStop(1, 'rgba(4,5,10,.72)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  },
};
})();
