(() => {
// khaybar: the gate of al-Qamus at dawn. A pinhole camera over a small 3D world (metres; x right, y up, z toward
// the fortress). The door is the hero: an extruded, iron-bound slab with a keyed, weighty pose. People are lights, except
// Ali: a veiled figure with a gold disc behind the head (scenes/holy.js); no face is ever drawn.
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
const crv = (P, u) => { // Catmull-Rom through points P at parameter u in [0, P.length - 1]
  const n = P.length - 1, i = Math.max(0, Math.min(n - 1, Math.floor(u))), f = u - i;
  const a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(n, i + 2)];
  return [0, 1, 2].map((j) => cr1(a[j], b[j], c[j], d[j], f));
};
const heavy = (k) => { // a weighty response: slow to start, a small overshoot, settles
  if (k <= 0) return 0; if (k >= 1) return 1;
  const q = k ** 1.25 * 1.0, e = Math.exp(-6.5 * q);
  return (1 - e * (Math.cos(5.5 * q) + 6.5 / 5.5 * Math.sin(5.5 * q))) / (1 - Math.exp(-6.5) * (Math.cos(5.5) + 6.5 / 5.5 * Math.sin(5.5)));
};
const nz = (x, s = 0) => Math.sin(x * 12.9898 + s * 78.233) * Math.sin(x * 4.1414 + s * 1.7) ; // smooth-ish shake
const hash = (i, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

// ---------- camera keys: [p, eye, look] ----------
const CAM = [
  [-.06, [-7.4, 1.65, -2], [-.2, 5.2, 60]],
  [0, [-7.2, 1.7, -1.4], [0, 5.2, 60]],
  [.13, [-6.8, 1.75, .4], [.2, 5.1, 60]],
  [.2, [-7.5, 2.7, 22], [0, 3, 50]],
  [.33, [-5.2, 2.5, 30], [0, 3, 50]],
  [.42, [-3.8, 2.2, 41], [0, 5, 60]],
  [.52, [-3.4, 2.1, 42.5], [0, 6.2, 59]],
  [.6, [-5.6, 2.4, 41.5], [0, 4.4, 57]],
  [.675, [-9, 4, 26], [0, 4.6, 50]],
  [.745, [-9.5, 5.6, 20], [.6, 1.6, 43]],
  [.8, [-6.2, 7, 27], [1.6, .2, 37.5]],
  [.9, [-5.4, 6.4, 28], [1.6, .5, 37.5]],
  [1, [-9.5, 8.8, 20], [1.2, 2, 42]],
  [1.06, [-10, 9, 19.5], [1.2, 2.1, 42]],
];
function camAt(p) {
  let i = 0; while (i < CAM.length - 2 && p > CAM[i + 1][0]) i++;
  const u = i + c01((p - CAM[i][0]) / (CAM[i + 1][0] - CAM[i][0]));
  return { eye: crv(CAM.map((k) => k[1]), u), look: crv(CAM.map((k) => k[2]), u) };
}

// ---------- the fortress (boxes x0 x1 y0 y1 z0 z1) ----------
const GATE = { x: 0, z: 60, hw: 1.8, h: 5.6, sp: 3.8 }; // opening half-width, height, springing of the arch
const BOXES = [
  [-28, -6.2, 0, 12.5, 60, 63], [6.2, 28, 0, 12.5, 60, 63],
  [-3, 3, 0, 14.6, 60, 63.5, 'gh'],
  [-6.2, -3, 0, 17.5, 58.2, 63.5, 'gt'], [3, 6.2, 0, 17.5, 58.2, 63.5, 'gt'],
  [-32, -26, 0, 18, 58.4, 64.4], [26, 32, 0, 18, 58.4, 64.4],
  [-31, -28, 0, 12.5, 64.4, 90], [28, 31, 0, 12.5, 64.4, 90],
  [5, 13, 0, 27, 70, 78], [-15, -8, 0, 22, 75, 81], [-6, 4, 0, 16, 66, 72], [14, 22, 0, 18, 72, 80],
];
(() => { // merlons along the front edges of the wall heads
  [[-28, -6.2, 12.5, 60], [6.2, 28, 12.5, 60], [-3, 3, 14.6, 60], [-6.2, -3, 17.5, 58.2], [3, 6.2, 17.5, 58.2], [-32, -26, 18, 58.4], [26, 32, 18, 58.4], [5, 13, 27, 70], [-15, -8, 22, 75], [14, 22, 18, 72]].forEach(([x0, x1, y, z]) => {
    const n = Math.max(2, Math.round((x1 - x0) / 1.7));
    for (let i = 0; i < n; i++) { const a = x0 + (x1 - x0) * (i + .2) / n, b = x0 + (x1 - x0) * (i + .75) / n; BOXES.push([a, b, y, y + .95, z, z + .7, 'm']); }
  });
})();
const TORCHES = [[-17, 13.1, 59.7], [-9, 13.1, 59.7], [8.5, 13.1, 59.7], [17, 13.1, 59.7], [-4.6, 18.1, 58], [4.6, 18.1, 58], [-29, 18.6, 58.2], [29, 18.6, 58.2], [-2.6, 6.4, 59.9], [2.6, 6.4, 59.9]];

// ---------- the door: local u across, v up from its centre, w through (front face at w = -T) ----------
const DW = 1.78, DH = 5.56, DSP = 3.78, DT = .23, DC = 2.8; // half width, height, arch springing, half thickness, centre height
const DOOR_OUT = (() => { const o = [[-DW, 0], [DW, 0], [DW, DSP]]; for (let i = 1; i < 14; i++) { const a = i / 14 * Math.PI; o.push([DW * Math.cos(a), DSP + (DH - DSP) * Math.sin(a)]); } o.push([-DW, DSP]); return o.map(([u, v]) => [u, v - DC]); })();
const topAt = (u) => DSP + (DH - DSP) * Math.sqrt(Math.max(0, 1 - (u / DW) ** 2)) - DC;
function rotM(yaw, pitch, tilt = 0, roll = 0) { // R = Ry(yaw) · Rx(pitch) · Ry(tilt) · Rz(roll), as columns
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), ct = Math.cos(tilt), stl = Math.sin(tilt), cr = Math.cos(roll), sr = Math.sin(roll);
  const ap = (v) => { let [x, y, z] = v; [x, y] = [x * cr - y * sr, x * sr + y * cr]; [x, z] = [x * ct + z * stl, -x * stl + z * ct]; [y, z] = [y * cp - z * sp, y * sp + z * cp]; [x, z] = [x * cy + z * sy, -x * sy + z * cy]; return [x, y, z]; };
  return ap;
}
const HINGE = [-DW, DC, GATE.z];
const HOLD = 2.35; // the door's centre height held overhead: its underside just above a 1.8 m man's raised hands
const REST = [1.6, DT, 37.2];
function doorPose(p) {
  let C = [0, DC, GATE.z], yaw = 0, pitch = 0, tilt = 0, roll = 0;
  // ajar for a moment, to let Marhab out
  const open = smooth(seg(p, .152, .172)) * (1 - smooth(seg(p, .2, .228)));
  if (open > 0) { yaw = -.55 * open; C = [HINGE[0] + DW * Math.cos(yaw), DC, HINGE[2] - DW * Math.sin(yaw)]; }
  // strain: the door shudders in its frame
  const sh = smooth(seg(p, .385, .47)) * (1 - smooth(seg(p, .47, .49)));
  if (sh > 0) { roll += .02 * sh * nz(p * 60, 1); C = [C[0] + .03 * sh * nz(p * 47, 2), C[1], C[2] - .05 * sh * Math.abs(nz(p * 31, 3))]; }
  // hinges tear: it lurches out of the arch
  const lu = smooth(seg(p, .468, .488));
  C = [C[0], C[1], C[2] - .7 * lu]; pitch -= .07 * lu; roll += .045 * lu;
  // it rises, heavy, turning toward the horizontal, onto his raised hands
  const ri = heavy(seg(p, .488, .578));
  if (ri > 0) { C = v3.mix(C, [0, HOLD, 57.7], ri); pitch = mix(pitch, Math.PI / 2, ri); roll = mix(roll, 0, ri); pitch += .02 * Math.sin(p * 140) * smooth(seg(p, .56, .6)) * (1 - smooth(seg(p, .6, .62))); }
  // held as a shield: turned upright, its inner face toward us
  const sd = heavy(seg(p, .6, .652));
  if (sd > 0) { C = v3.mix(C, [.2, 3.05, 55.4], sd); pitch = mix(pitch, .05, sd); yaw = mix(yaw, Math.PI - .32, sd); }
  // flung behind him: a wind-up, then a tumbling arc forty cubits back
  const wu = smooth(seg(p, .664, .684)) * (1 - smooth(seg(p, .684, .69)));
  C = [C[0], C[1] + .5 * wu, C[2] + .35 * wu]; pitch -= .2 * wu;
  const fl = seg(p, .686, .738);
  if (fl > 0) {
    const s = fl < 1 ? fl : 1, sx = ease.out(s) * .3 + s * .7;
    C = [mix(.2, REST[0], sx), mix(3.05, REST[1], s) + 4 * 6.8 * s * (1 - s), mix(55.4, REST[2], sx)];
    pitch = mix(.05, -1.5 * Math.PI, ease.io(s) * .25 + s * .75); yaw = mix(Math.PI - .32, Math.PI + .35, s); roll = .12 * Math.sin(Math.PI * s);
  }
  const bo = seg(p, .738, .762); // one heavy bounce
  if (bo > 0 && bo < 1) { C = [C[0], C[1] + .22 * Math.sin(Math.PI * bo) * (1 - bo), C[2]]; tilt = .05 * Math.sin(Math.PI * bo) * (1 - bo); }
  // seventy try: it barely tilts; then together they lift it, and set it down
  const tr = seg(p, .832, .862);
  if (tr > 0 && tr < 1) tilt += .022 * Math.sin(Math.PI * tr) * (1 + .25 * Math.sin(p * 900));
  const up = heavy(seg(p, .862, .895)) * (1 - smooth(seg(p, .898, .932)));
  C = [C[0], C[1] + .72 * up, C[2]];
  return { C, R: rotM(yaw, pitch, tilt, roll), lift: up };
}

// ---------- Ali and Marhab ----------
const ALI0 = [-8.1, 1.0, 9.5], MEET = [-.2, 1.35, 45];
function aliAt(p) {
  if (p < .15) return ALI0;
  if (p < .25) return crv([ALI0, [-4.6, 1.3, 26], [-1.4, 1.35, 41], [-.9, 1.35, 45]], 3 * smooth(seg(p, .15, .25)));
  if (p < .29) { const a = Math.PI + seg(p, .245, .29) * TAU * 1.15, r = mix(.9, .55, seg(p, .245, .29)); return [MEET[0] + Math.cos(a) * r, 1.35 + .08 * Math.sin(a * 2), MEET[2] + Math.sin(a) * r * .7]; }
  if (p < .37) return crv([[-.55, 1.35, 45], [-.3, 1.3, 49], [0, 1.25, 53], [0, 1.25, 58.7]], 3 * smooth(seg(p, .305, .37)));
  if (p < .6) return [0, 1.25, mix(58.7, 57.2, smooth(seg(p, .488, .53)))]; // hands on the door; he steps back as it comes down onto him
  if (p < .72) return v3.mix([0, 1.25, 57.2], [.15, 1.25, 54.2], smooth(seg(p, .6, .645)));
  return crv([[.15, 1.25, 54.2], [0, 1.25, 56.5], [0, 1.25, 59], [0, 1.25, 62]], 3 * smooth(seg(p, .72, .775)));
}
// how far Ali has walked by p (metres): it drives his steps, so he stops when the path stops
const ALID = (() => { const n = 1000, d = new Float32Array(n + 1); let q = aliAt(0); for (let i = 1; i <= n; i++) { const a = aliAt(i / n); d[i] = d[i - 1] + Math.hypot(a[0] - q[0], a[2] - q[2]); q = a; } return d; })();
const aliDist = (p) => { const f = c01(p) * 1000, i = Math.min(999, Math.floor(f)); return mix(ALID[i], ALID[i + 1], f - i); };
function marhabAt(p) {
  const IN = [.3, 1.4, 61.6];
  if (p < .245) return crv([IN, [.3, 1.38, 58.5], [.4, 1.36, 52], [.7, 1.35, 46.8]], 3 * smooth(seg(p, .165, .245)));
  if (p < .29) { const a = seg(p, .245, .29) * TAU * 1.15, r = mix(.9, .55, seg(p, .245, .29)); return [MEET[0] + Math.cos(a) * r, 1.32 + .06 * Math.sin(a * 3), MEET[2] + Math.sin(a) * r * .7]; }
  const f = ease.in(seg(p, .292, .33)); return [MEET[0] + .55 + .5 * f, mix(1.32, .12, f), MEET[2]];
}

S.khaybar = {
  init(el, st) {
    st.cv = el.querySelector('canvas');
    st.c = st.cv.getContext('2d');
    st.n = el.querySelector('.kh-n');
    st.men = Math.max(1, Math.round(+el.dataset.men || 70));
    const R = rng(17);
    st.rocks = []; for (let i = 0; i < 260; i++) { const x = (R() - .5) * 90, z = R() * 56 - 6; if (z > 48 && z < 56 && Math.abs(x) < 42) continue; st.rocks.push([x, z, .12 + R() * R() * .55, R()]); }
    st.palms = [];
    for (let i = 0; i < 70; i++) st.palms.push([(R() - .5) * 420, 150 + R() * 260, 9 + R() * 8, R() * TAU, 0]);
    for (let i = 0; i < 36; i++) { const sd = R() < .5 ? -1 : 1; st.palms.push([sd * (40 + R() * 60), 30 + R() * 90, 9 + R() * 7, R() * TAU, 1]); }
    st.palms.sort((a, b) => b[1] - a[1]);
    st.stars = []; for (let i = 0; i < 220; i++) { const az = (R() - .5) * 2.4, el2 = .05 + R() * .9; st.stars.push([Math.sin(az) * Math.cos(el2), Math.sin(el2), Math.cos(az) * Math.cos(el2), R()]); }
    st.camp = []; for (let i = 0; i < 64; i++) st.camp.push([(R() - .5) * 46, 1.0 + R() * .5, 4 + R() * 26, R()]);
    st.army = []; for (let i = 0; i < 64; i++) st.army.push([(R() - .5) * 30, 2 + R() * 28, R()]);
    // cracks around the arch: jagged paths in the wall plane (x, y) starting at the voussoirs
    st.cracks = [];
    for (let i = 0; i < 11; i++) {
      const a = Math.PI * (i + .5) / 11, r0 = 2.75, pts = [[Math.cos(a) * r0, GATE.sp + Math.sin(a) * r0 * .95]];
      let ang = a + (R() - .5) * .6;
      for (let j = 0; j < 7; j++) { ang += (R() - .5) * .9; const l = .25 + R() * .45, q = pts[pts.length - 1]; pts.push([q[0] + Math.cos(ang) * l, Math.max(.2, q[1] + Math.sin(ang) * l)]); }
      st.cracks.push(pts);
    }
    [[-2.7, .6], [-2.75, 2.2], [2.7, 1.1], [2.72, 2.9]].forEach(([x, y]) => { const pts = [[x, y]]; let ang = (x < 0 ? Math.PI : 0) + (R() - .5); for (let j = 0; j < 6; j++) { ang += (R() - .5) * .9; const q = pts[pts.length - 1]; pts.push([q[0] + Math.cos(ang) * .4, Math.max(.05, q[1] + Math.sin(ang) * .4)]); } st.cracks.push(pts); });
    st.dust = [];
    for (let i = 0; i < 140; i++) { const a = R() * Math.PI, [x, y] = R() < .7 ? [Math.cos(a) * (2 + R() * .8), GATE.sp + Math.sin(a) * (2 + R() * .8)] : [(R() < .5 ? -1 : 1) * (1.9 + R() * .5), R() * 4]; st.dust.push([x, y, .42 + R() * .18, R()]); }
  },
  frame(p, t, el, st) {
    fit(st.cv);
    const { c, cv } = st;
    const dpr = cv.width / Math.max(1, cv.clientWidth), W = cv.clientWidth, H = cv.clientHeight, phone = W < H;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // ----- camera -----
    const { eye, look } = camAt(p);
    if (phone) { // a tall screen keeps the banner in frame, and stands further back from the seventy
      look[0] -= 2.6 * (1 - smooth(seg(p, .12, .19)));
      const back = 1 + .38 * smooth(seg(p, .7, .78));
      for (let j = 0; j < 3; j++) eye[j] = look[j] + (eye[j] - look[j]) * back;
    }
    const fw = v3.norm(v3.sub(look, eye)), rt = v3.norm(v3.cross([0, 1, 0], fw)), up = v3.cross(fw, rt);
    const F = Math.min(H * 1.18, W * (phone ? 1.6 : 1.4)), cx = W / 2, cy = H * (phone ? .54 : .5);
    const P = (q) => { const d = v3.sub(q, eye), z = v3.dot(d, fw); return z < .3 ? null : [cx + F * v3.dot(d, rt) / z, cy - F * v3.dot(d, up) / z, z]; };
    const dawn = smooth(seg(p, 0, 1)), warm = smooth(seg(p, .82, 1));
    const sunDir = v3.norm([-.42, mix(.04, .2, dawn), 1]);
    // ----- sky -----
    const hd = v3.norm([fw[0], 0, fw[2]]), hy = cy - F * v3.dot(hd, up) / v3.dot(hd, fw); // horizon line
    const sky = c.createLinearGradient(0, hy - H * 1.1, 0, hy);
    const top = [mix(9, 30, dawn), mix(13, 40, dawn), mix(30, 70, dawn)], mid = [mix(40, 120, dawn), mix(38, 92, dawn), mix(70, 104, dawn)], hor = [mix(150, 236, dawn), mix(92, 176, dawn), mix(70, 112, dawn)];
    const rgb = (a, k = 1) => `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${k})`;
    sky.addColorStop(0, rgb(top)); sky.addColorStop(.62, rgb(mid)); sky.addColorStop(1, rgb(hor));
    c.fillStyle = sky; c.fillRect(0, 0, W, Math.max(0, hy + 2));
    const sp = P(v3.add(eye, v3.mul(sunDir, 4000)));
    if (sp) { const r = H * mix(.7, 1.1, dawn), g = c.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], r); g.addColorStop(0, `rgba(255,214,150,${mix(.35, .7, dawn)})`); g.addColorStop(.3, `rgba(240,160,100,${mix(.16, .3, dawn)})`); g.addColorStop(1, 'rgba(240,160,100,0)'); c.fillStyle = g; c.fillRect(0, 0, W, hy + 2); }
    const starA = 1 - smooth(seg(p, 0, .45));
    if (starA > 0) { c.fillStyle = '#f3ead2'; st.stars.forEach(([x, y, z, k]) => { const q = P(v3.add(eye, [x * 1e4, y * 1e4, z * 1e4])); if (!q || q[1] > hy - 20) return; c.globalAlpha = starA * (.25 + .6 * k) * (.75 + .25 * Math.sin(t * 2 + k * 40)) * c01((hy - q[1]) / (H * .5)); c.fillRect(q[0], q[1], k > .85 ? 1.6 : 1, k > .85 ? 1.6 : 1); }); c.globalAlpha = 1; }
    // far hills on the horizon
    c.fillStyle = rgb(v3.mix([40, 34, 52], [120, 92, 92], dawn)); c.beginPath(); c.moveTo(0, hy + 2);
    for (let x = 0; x <= W + 20; x += 20) { const ph = Math.atan((x - cx) / F) + Math.atan2(fw[0], fw[2]); c.lineTo(x, hy - (8 + 10 * Math.sin(ph * 7 + 1) + 6 * Math.sin(ph * 17)) * (H / 900)); }
    c.lineTo(W, hy + 2); c.fill();
    // ----- ground -----
    const gr = c.createLinearGradient(0, hy, 0, H);
    gr.addColorStop(0, rgb(v3.mix([62, 46, 52], [150, 110, 82], dawn))); gr.addColorStop(.18, rgb(v3.mix([36, 28, 32], [92, 66, 50], dawn))); gr.addColorStop(1, rgb(v3.mix([16, 13, 16], [44, 32, 26], dawn)));
    c.fillStyle = gr; c.fillRect(0, hy, W, H - hy);
    // distant palms (haze) and nearer palm groves to the sides
    st.palms.forEach(([x, z, h, ph, near]) => {
      const b = P([x, 0, z]), tp = P([x + Math.sin(ph) * .8, h, z]); if (!b || !tp) return;
      const s = F / b[2], haze = near ? .55 : .8;
      const col = rgb(v3.mix(v3.mix([22, 20, 30], [70, 54, 60], dawn), v3.mix([60, 50, 66], [170, 130, 110], dawn), haze));
      c.strokeStyle = col; c.fillStyle = col; c.lineWidth = Math.max(.6, .35 * s); c.lineCap = 'round';
      c.beginPath(); c.moveTo(b[0], b[1]); c.quadraticCurveTo((b[0] + tp[0]) / 2 + .6 * s * Math.sin(ph), (b[1] + tp[1]) / 2, tp[0], tp[1]); c.stroke();
      c.lineWidth = Math.max(.5, .22 * s);
      for (let f = 0; f < 9; f++) { const a = f / 9 * TAU + ph + Math.sin(t * .6 + x) * .04, l = 3.4 * s, dx = Math.cos(a) * l, dy = Math.sin(a) * l * .45 + l * .35 * Math.abs(Math.cos(a)); c.beginPath(); c.moveTo(tp[0], tp[1]); c.quadraticCurveTo(tp[0] + dx * .55, tp[1] - l * .25 + dy * .2, tp[0] + dx, tp[1] + dy * .9); c.stroke(); }
    });
    // rocks on the plain (basalt, lit at the rim by the low sun)
    const rockC = rgb(v3.mix([18, 17, 22], [40, 32, 30], dawn)), rimC = rgb(v3.mix([110, 96, 120], [240, 180, 120], dawn), .3), shC = 'rgba(6,5,8,.45)';
    st.rocks.forEach(([x, z, r, k]) => { // basalt stones, backlit: a dark dome, a warm rim on top, the shadow toward us
      const q = P([x, 0, z]); if (!q) return; const s = F / q[2] * r; if (s < .5) return;
      c.fillStyle = shC; c.beginPath(); c.ellipse(q[0] + s * .1, q[1] + s * .12, s * 1.5, s * .32, 0, 0, TAU); c.fill();
      c.fillStyle = rockC; c.beginPath(); c.ellipse(q[0], q[1], s * (1 + k * .3), s * (.55 + k * .35), 0, Math.PI, 0); c.closePath(); c.fill();
      c.strokeStyle = rimC; c.lineWidth = Math.max(.6, s * .07); c.beginPath(); c.ellipse(q[0], q[1], s * (1 + k * .3), s * (.55 + k * .35), 0, Math.PI * 1.2, Math.PI * 1.8); c.stroke();
    });
    // the trench, with an earth causeway to the gate
    [[-44, -2.6], [2.6, 44]].forEach(([x0, x1]) => {
      const a = P([x0, 0, 50]), b = P([x1, 0, 50]), d = P([x0, 0, 54]), e = P([x1, 0, 54]); if (!a || !b || !d || !e) return;
      const open = new Path2D(); open.moveTo(a[0], a[1]); open.lineTo(b[0], b[1]); open.lineTo(e[0], e[1]); open.lineTo(d[0], d[1]); open.closePath();
      c.fillStyle = '#08070a'; c.fill(open);
      const fa = P([x0, -2.6, 54]), fb = P([x1, -2.6, 54]);
      if (fa && fb) { c.save(); c.clip(open); const g = c.createLinearGradient(0, d[1], 0, fa[1]); g.addColorStop(0, rgb(v3.mix([50, 40, 44], [120, 86, 64], dawn))); g.addColorStop(1, 'rgba(10,8,10,1)'); c.fillStyle = g; c.beginPath(); c.moveTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.lineTo(fb[0], fb[1]); c.lineTo(fa[0], fa[1]); c.closePath(); c.fill(); c.restore(); }
      c.strokeStyle = rgb(v3.mix([70, 56, 60], [190, 140, 100], dawn), .5); c.lineWidth = 1; c.beginPath(); c.moveTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.stroke();
    });
    // ----- fortress, gate, door: painter's order -----
    const pose = doorPose(p);
    const items = BOXES.map((b) => ({ d: Math.hypot((b[0] + b[1]) / 2 - eye[0], (b[2] + b[3]) / 2 - eye[1], (b[4] + b[5]) / 2 - eye[2]) + (b[6] === 'm' ? -.5 : 0), b }));
    const gh = items.find((it) => it.b[6] === 'gh');
    items.push({ d: gh.d - .01, gate: true });
    const doorFree = p > .47;
    items.push({ d: doorFree ? Math.hypot(pose.C[0] - eye[0], pose.C[1] - eye[1], pose.C[2] - eye[2]) - 2 : gh.d - .02, door: true });
    const aa = 1 - smooth(seg(p, .745, .775)), A = aliAt(p);
    if (aa > 0) { // kept in front of the gate hole as he walks into it, and in front of the door while it is at his back
      const doorD = items[items.length - 1].d;
      items.push({ d: Math.min(Math.hypot(A[0] - eye[0], .9 - eye[1], A[2] - eye[2]), gh.d - .015, pose.C[2] > A[2] - .3 ? doorD - .01 : 1e9), ali: true });
    }
    items.sort((a, b) => b.d - a.d);
    const sunK = mix(.55, 1, dawn), amb = mix(.24, .5, dawn);
    const basalt = [36, 35, 45], sunCol = [255, 178, 120];
    const shade = (n, base = basalt, extra = 0) => { const s = Math.max(0, v3.dot(n, sunDir)) * sunK, sk = .5 + .5 * n[1]; return [0, 1, 2].map((j) => Math.min(255, base[j] * (amb + .25 * sk + extra) + sunCol[j] * s * .5 + warm * 18 * (j === 0 ? 1.2 : j === 1 ? .8 : .4))); };
    const quad = (pts) => { const q = pts.map(P); if (q.some((x) => !x)) return null; const pa = new Path2D(); pa.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) pa.lineTo(q[i][0], q[i][1]); pa.closePath(); return pa; };
    const lines = (segs, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); segs.forEach(([a, b]) => { const qa = P(a), qb = P(b); if (qa && qb) { c.moveTo(qa[0], qa[1]); c.lineTo(qb[0], qb[1]); } }); c.stroke(); };
    const drawBox = ([x0, x1, y0, y1, z0, z1, tag]) => {
      const faces = [
        [[0, 0, -1], [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]]], [[-1, 0, 0], [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]]],
        [[1, 0, 0], [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]]], [[0, 1, 0], [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]],
        [[0, 0, 1], [[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]]],
      ];
      faces.forEach(([n, pts]) => {
        if (v3.dot(n, v3.sub(eye, pts[0])) <= 0) return;
        const pa = quad(pts); if (!pa) return;
        const hz = c01(Math.hypot(...v3.sub(pts[0], eye)) / 150) * .3, col = v3.mix(shade(tag === 'gt' && n[0] ? [0, 0, -1] : n, basalt, n[1] > 0 ? .1 : 0), hor, hz); // the gate towers' inner flanks stay in shade: no sunlit sliver above the duel
        if (n[2] < 0 && tag !== 'm') { const qa = P([pts[0][0], y0, pts[0][2]]), qb = P([pts[0][0], y1, pts[0][2]]); if (qa && qb) { const g = c.createLinearGradient(0, qa[1], 0, qb[1]); g.addColorStop(0, rgb(v3.mul(col, .8))); g.addColorStop(1, rgb(v3.mix(col, hor, .12))); c.fillStyle = g; } else c.fillStyle = rgb(col); } else c.fillStyle = rgb(col);
        c.fill(pa);
        if (n[1] > 0) { c.strokeStyle = rgb(v3.mix([110, 90, 110], [255, 190, 130], dawn), .5); c.lineWidth = 1; const qa = P(pts[0]), qb = P(pts[1]); if (qa && qb) { c.beginPath(); c.moveTo(qa[0], qa[1]); c.lineTo(qb[0], qb[1]); c.stroke(); } }
        if (tag === 'm' || n[1] > 0) return;
        // stone courses on faces large enough to read
        const q0 = P(pts[0]), q2 = P(pts[2]); if (!q0 || !q2 || Math.abs(q2[1] - q0[1]) < 40) return;
        const segs = [], horiz = n[2] !== 0, a0 = horiz ? x0 : z0, a1 = horiz ? x1 : z1, zz = n[2] < 0 ? z0 : n[2] > 0 ? z1 : null, xx = n[0] < 0 ? x0 : x1;
        const at = (a, y) => (horiz ? [a, y, zz] : [xx, y, a]);
        for (let y = y0, r = 0; y < y1; r++) { // large dressed basalt blocks in uneven courses
          const hgt = .5 + .35 * hash(r, x0 + z0), yy = Math.min(y1, y + hgt);
          segs.push([at(a0, yy), at(a1, yy)]);
          for (let a = a0 + hash(r, 3 + x0) * 1.2; a < a1; a += .8 + 1.1 * hash(Math.floor(a * 7), r)) segs.push([at(a, y), at(a, yy)]);
          y = yy;
        }
        c.save(); c.clip(pa); lines(segs, 'rgba(6,6,10,.5)', .9); c.restore();
      });
    };
    const drawGate = () => {
      // the opening: darkness within, a ring of voussoirs, jambs; cracks run out from it
      const out = DOOR_OUT.map(([u, v]) => [u * 1.01, v * 1.0 + DC]);
      const hole = quad(out.map(([u, v]) => [u, v, GATE.z - .001])); if (!hole) return;
      c.fillStyle = '#050407'; c.fill(hole);
      if (p > .47) { const g = P([0, 1.6, GATE.z + 4]); if (g) { const gg = c.createRadialGradient(g[0], g[1], 0, g[0], g[1], F / g[2] * 3); gg.addColorStop(0, `rgba(230,150,80,${.28 * smooth(seg(p, .5, .6))})`); gg.addColorStop(1, 'rgba(230,150,80,0)'); c.save(); c.clip(hole); c.fillStyle = gg; c.fillRect(0, 0, W, H); c.restore(); } }
      const vs = [];
      for (let i = 0; i <= 13; i++) { const a = Math.PI * i / 13; vs.push([[Math.cos(a) * 1.85, GATE.sp + Math.sin(a) * 1.85, GATE.z - .01], [Math.cos(a) * 2.6, GATE.sp + Math.sin(a) * 2.5, GATE.z - .01]]); }
      const ring = []; for (let i = 0; i <= 26; i++) { const a = Math.PI * i / 26; ring.push([Math.cos(a) * 2.6, GATE.sp + Math.sin(a) * 2.5, GATE.z - .01]); }
      for (let i = 0; i < 26; i++) vs.push([ring[i], ring[i + 1]]);
      [-1, 1].forEach((sd) => { vs.push([[sd * 1.85, 0, GATE.z - .01], [sd * 1.85, GATE.sp, GATE.z - .01]]); for (let y = .7; y < GATE.sp; y += .7) vs.push([[sd * 1.85, y, GATE.z - .01], [sd * 2.6, y, GATE.z - .01]]); });
      lines(vs, rgb(v3.mix([70, 64, 76], [150, 110, 90], dawn), .5), 1);
      const ck = seg(p, .4, .475), shk = smooth(seg(p, .385, .47)) * (1 - smooth(seg(p, .49, .52)));
      if (ck > 0) {
        st.cracks.forEach((pts, i) => {
          const n = (pts.length - 1) * c01(ck * 1.6 - (i % 5) * .1); if (n <= 0) return;
          const q = []; for (let j = 0; j <= Math.ceil(n); j++) { const f = Math.min(j, n), a = pts[Math.floor(f)], b = pts[Math.min(pts.length - 1, Math.floor(f) + 1)], k = f - Math.floor(f); const pp = P([mix(a[0], b[0], k), mix(a[1], b[1], k), GATE.z - .02]); if (pp) q.push(pp); }
          c.lineJoin = 'round';
          c.strokeStyle = 'rgba(4,3,5,.95)'; c.lineWidth = 2.2; c.beginPath(); q.forEach((x, j) => (j ? c.lineTo(x[0], x[1]) : c.moveTo(x[0], x[1]))); c.stroke();
          c.strokeStyle = `rgba(255,190,110,${.45 * shk})`; c.lineWidth = .8; c.stroke();
        });
      }
    };
    const drawDoor = () => {
      const { C, R } = pose, W3 = (u, v, w) => v3.add(C, R([u, v, w]));
      const outF = DOOR_OUT.map(([u, v]) => W3(u, v, -DT)), outB = DOOR_OUT.map(([u, v]) => W3(u, v, DT));
      const nF = R([0, 0, -1]), wood = [92, 60, 36], dk = (n) => rgb(shade(n, wood, .18));
      // sides (the thickness), then whichever face looks at us
      const sides = [];
      for (let i = 0; i < DOOR_OUT.length; i++) {
        const j = (i + 1) % DOOR_OUT.length, a = DOOR_OUT[i], b = DOOR_OUT[j], n = R(v3.norm([b[1] - a[1], -(b[0] - a[0]), 0]));
        const mid = W3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0);
        if (v3.dot(n, v3.sub(eye, mid)) > 0) sides.push({ n, pts: [outF[i], outF[j], outB[j], outB[i]], d: Math.hypot(...v3.sub(mid, eye)) });
      }
      sides.sort((a, b) => b.d - a.d).forEach(({ n, pts }) => { const pa = quad(pts); if (pa) { c.fillStyle = dk(n); c.fill(pa); c.strokeStyle = 'rgba(20,12,6,.35)'; c.lineWidth = .6; c.stroke(pa); } });
      const front = v3.dot(nF, v3.sub(eye, C)) > 0, w = front ? -DT : DT, n = front ? nF : v3.mul(nF, -1);
      const face = quad(front ? outF : outB); if (!face) return;
      const base = shade(n, wood, .18);
      c.fillStyle = rgb(base); c.fill(face);
      c.save(); c.clip(face);
      const segs = [], grain = [];
      for (let k = -2; k <= 3; k++) { const u = -DW + k * 0 + (k + 2) * (2 * DW / 6); if (k > -2) segs.push([W3(u, -DC, w), W3(u, topAt(u), w)]); }
      for (let pk = 0; pk < 6; pk++) for (let g = 0; g < 3; g++) { const u0 = -DW + (pk + .2 + g * .28) * (2 * DW / 6); let prev = W3(u0, -DC, w); for (let s = 1; s <= 8; s++) { const v = -DC + s / 8 * (topAt(u0) + DC), q = W3(u0 + .03 * Math.sin(s * 1.7 + pk * 3 + g), v, w); grain.push([prev, q]); prev = q; } }
      lines(grain, 'rgba(30,16,8,.28)', .7); lines(segs, 'rgba(18,10,4,.8)', 1.3);
      if (front) { // iron straps, studs, a ring
        const iron = rgb(shade(n, [40, 40, 44], .1)), hi = rgb(shade(n, [120, 110, 100], .1), .6);
        [.55, 1.65, 2.75, 3.6].forEach((v0) => {
          const v = v0 - DC, pa = quad([W3(-DW, v - .09, w - .01), W3(DW, v - .09, w - .01), W3(DW, v + .09, w - .01), W3(-DW, v + .09, w - .01)]);
          if (pa) { c.fillStyle = iron; c.fill(pa); }
          lines([[W3(-DW, v + .08, w - .012), W3(DW, v + .08, w - .012)]], hi, .7);
          for (let i = 0; i < 10; i++) { const q = P(W3(-DW + .18 + i * (2 * DW - .36) / 9, v, w - .02)); if (q) { const r = Math.max(.8, F / q[2] * .045); c.fillStyle = iron; c.beginPath(); c.arc(q[0], q[1], r, 0, TAU); c.fill(); c.fillStyle = hi; c.beginPath(); c.arc(q[0] - r * .3, q[1] - r * .3, r * .4, 0, TAU); c.fill(); } }
        });
        const rq = P(W3(.9, 2.2 - DC, w - .03)); if (rq) { c.strokeStyle = iron; c.lineWidth = Math.max(1, F / rq[2] * .05); c.beginPath(); c.arc(rq[0], rq[1], F / rq[2] * .18, 0, TAU); c.stroke(); }
      } else { // the inner face: battens and a braced Z
        const bat = rgb(shade(n, [110, 74, 44], .2)), edge = 'rgba(20,10,4,.55)';
        [[.4, .75], [2.0, 2.35], [3.45, 3.75]].forEach(([a, b]) => { const pa = quad([W3(-DW, a - DC, w + .01), W3(DW, a - DC, w + .01), W3(DW, b - DC, w + .01), W3(-DW, b - DC, w + .01)]); if (pa) { c.fillStyle = bat; c.fill(pa); c.strokeStyle = edge; c.lineWidth = .8; c.stroke(pa); } });
        [[.75, 2.0], [2.35, 3.45]].forEach(([a, b]) => { const pa = quad([W3(-DW + .1, a - DC, w + .01), W3(-DW + .5, a - DC, w + .01), W3(DW - .1, b - DC, w + .01), W3(DW - .5, b - DC, w + .01)]); if (pa) { c.fillStyle = bat; c.fill(pa); c.strokeStyle = edge; c.lineWidth = .8; c.stroke(pa); } });
        [.57, 2.17, 3.6].forEach((v) => { for (let i = 0; i < 6; i++) { const q = P(W3(-DW + .25 + i * (2 * DW - .5) / 5, v - DC, w + .02)); if (q) { c.fillStyle = 'rgba(30,28,30,.9)'; c.beginPath(); c.arc(q[0], q[1], Math.max(.7, F / q[2] * .035), 0, TAU); c.fill(); } } });
      }
      c.restore();
      c.strokeStyle = 'rgba(16,9,4,.7)'; c.lineWidth = 1; c.stroke(face);
    };
    // ----- Ali: a veiled figure (scenes/holy.js) -----
    let aliHead = null;
    const drawAli = () => {
      const g0 = P([A[0], 0, A[2]]); if (!g0) return;
      const h = Math.max(22, 1.8 * F / g0[2]), walked = aliDist(p), walking = aliDist(p + .003) - walked > .04;
      const at = (q) => { const s = P(q); return s ? [(s[0] - g0[0]) / h, (s[1] - g0[1]) / h] : null; };
      const D = (u, v, w) => v3.add(pose.C, pose.R([u, v, w]));
      const two = (a, b) => { if (!a || !b) return undefined; if (a[0] > b[0]) [a, b] = [b, a]; return [[Math.min(a[0], -.05), a[1]], [Math.max(b[0], .05), b[1]]]; }; // one hand per shoulder
      const o = { who: 'ali', pose: walking ? 'walk' : 'stand', phase: walked / 1.5, sword: p > .29, x: g0[0], y: g0[1], h, t, amb: mix(.3, .95, dawn), alpha: aa };
      if (p < .15) { const q = at([BAN.pole[0] + .06, 1.3, BAN.pole[2]]); if (q) o.arms = [q]; } // the banner is his
      else if (p > .245 && p < .29) { // the duel: Dhul-Fiqar against Marhab, facing him; the last stroke lands on the flash
        const m = P(marhabAt(p)); o.pose = 'fight'; o.sword = true; o.flip = !!m && m[0] < g0[0]; o.phase = ((p - .245) / .045 * 3 + .5) % 1;
      } else if (p > .37 && p < .686) { // his hands on the door: on its face, then under it overhead, then on the shield
        const ri = heavy(seg(p, .488, .578)), sd = heavy(seg(p, .6, .652)), v = mix(mix(-1.25, -.5, ri), -1.6, sd), w = mix(-DT, DT, Math.max(ri, sd)), u = mix(.55, .62, sd);
        o.arms = two(at(D(-u, v, w)), at(D(u, v, w)));
      } else if (p >= .686 && p < .745) { // the throw: both hands go up and over, then come down
        const up = smooth(seg(p, .686, .7)), dn = smooth(seg(p, .71, .742)), y = mix(-1.15, -.42, dn), x = mix(.16, .2, dn);
        if (up > 0) o.arms = [[-x, mix(-.6, y, up)], [x, mix(-.6, y, up)]];
      }
      c.globalAlpha = 1; aliHead = Holy.draw(c, o);
    };
    items.forEach((it) => { if (it.gate) drawGate(); else if (it.door) drawDoor(); else if (it.ali) drawAli(); else drawBox(it.b); });
    // ----- dust from the arch, hinge fragments -----
    if (p > .4 && p < .8) {
      const dg = smooth(seg(p, .45, .55)) * (1 - smooth(seg(p, .62, .78)));
      if (dg > 0) { const q = P([0, 1.4, GATE.z - 1.5]); if (q) { const r = F / q[2] * 5.5, g = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], r); g.addColorStop(0, rgb(v3.mix([120, 100, 100], [210, 170, 130], dawn), .32 * dg)); g.addColorStop(1, 'rgba(160,130,110,0)'); c.fillStyle = g; c.fillRect(q[0] - r, q[1] - r, r * 2, r * 2); } }
      st.dust.forEach(([x, y, t0, k]) => {
        const tau = (p - t0) * 9; if (tau <= 0 || tau > 1.4) return;
        const q = P([x + (k - .5) * tau, Math.max(0, y - 4.9 * tau * tau), GATE.z - .2 - k * tau]); if (!q) return;
        c.fillStyle = rgb(v3.mix([150, 130, 120], [225, 190, 150], dawn), .7 * (1 - tau / 1.4)); const r = Math.max(.6, F / q[2] * (.03 + k * .05)); c.fillRect(q[0] - r / 2, q[1] - r / 2, r, r);
      });
      [[-DW, .9], [-DW, 4.1]].forEach(([hx, hv], h) => { for (let i = 0; i < 6; i++) { const tau = (p - .47) * 7; if (tau <= 0 || tau > 1) continue; const vx = (hash(i, h) - .9) * 3, vy = 2 + hash(i, h + 4) * 3, vz = -1 - hash(i, h + 8) * 2; const q = P([hx + vx * tau, hv + vy * tau - 4.9 * tau * tau, GATE.z - .3 + vz * tau]); if (!q) continue; c.fillStyle = 'rgba(30,28,30,.9)'; c.fillRect(q[0], q[1], 3, 2); c.fillStyle = `rgba(255,200,120,${.8 * (1 - tau)})`; c.fillRect(q[0] + 3, q[1], 1.5, 1.5); } });
    }
    // arrows from the wall against the shield: dark shafts in flight, small sparks at its rim
    if (p > .608 && p < .68) {
      const { C, R } = pose;
      for (let i = 0; i < 8; i++) {
        const t0 = .61 + i * .0062, tau = (p - t0) / .011; if (tau <= 0 || tau > 1.6) continue;
        const src = [-9 + hash(i, 1) * 18, 13.5 + hash(i, 2) * 4, 60.2], e = DOOR_OUT[(i * 5) % DOOR_OUT.length], dst = v3.add(C, R([e[0] * .92, e[1] * .92, -DT]));
        if (tau < .72) { const a = P(v3.mix(src, dst, Math.max(0, tau - .1))), b = P(v3.mix(src, dst, tau)); if (a && b) { c.strokeStyle = 'rgba(12,8,6,.85)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); } }
        else if (tau > 1) { const q = P(v3.add(C, R([e[0] * 1.02, e[1] * 1.02, 0]))); if (q) { const k = 1 - (tau - 1) / .6; c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,210,140,${.9 * k})`; for (let j = 0; j < 4; j++) c.fillRect(q[0] + (hash(i, j) - .5) * 14 * (1 - k), q[1] + (hash(i, j + 5) - .5) * 14 * (1 - k), 1.6, 1.6); c.globalCompositeOperation = 'source-over'; } }
      }
    }
    // landing: a burst of dust where the door falls
    const ld = seg(p, .736, .8);
    if (ld > 0 && ld < 1) { const q = P([REST[0], .5, REST[2]]); if (q) { const r = F / q[2] * mix(2, 7, ease.out(ld)), g = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], r); g.addColorStop(0, rgb(v3.mix([120, 100, 100], [220, 180, 140], dawn), .4 * (1 - ld))); g.addColorStop(1, 'rgba(180,140,110,0)'); c.fillStyle = g; c.fillRect(q[0] - r, q[1] - r, r * 2, r * 2); } }
    // ----- the banner on its pole -----
    drawBanner(c, P, F, p, t, dawn);
    // ----- lights -----
    const glow = (q, r, col, a) => { const g = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); c.fillStyle = g; c.fillRect(q[0] - r, q[1] - r, r * 2, r * 2); };
    // Marhab: a dark, heavy light
    const ma = smooth(seg(p, .16, .19)) * (1 - smooth(seg(p, .3, .345)));
    if (ma > 0) {
      const q = P(marhabAt(p)); if (q) { const s = F / q[2];
        for (let k = 0; k < 5; k++) glow([q[0] + Math.cos(t * .7 + k * 1.3 + p * 40) * s * .4, q[1] + Math.sin(t * .9 + k * 2.1 + p * 30) * s * .28], s * 1.7, 'rgba(3,1,4,A)', .42 * ma);
        c.globalCompositeOperation = 'lighter'; glow(q, s * 1.1, 'rgba(110,26,12,A)', .5 * ma * (.85 + .15 * Math.sin(t * 4.3))); glow(q, s * .38, 'rgba(160,48,24,A)', .55 * ma); c.globalCompositeOperation = 'source-over';
      }
    }
    if (p > .29 && p < .45) { const k = seg(p, .29, .45); for (let i = 0; i < 7; i++) { const q = P([MEET[0] + .9 + (hash(i) - .5) * 1.2, .3 + k * (1.5 + hash(i, 2) * 2.5), MEET[2] + (hash(i, 3) - .5)]); if (q) glow(q, F / q[2] * (.5 + k * 1.2), 'rgba(10,6,10,A)', .3 * (1 - k)); } }
    c.globalCompositeOperation = 'lighter';
    // the camp's torches, then the army entering the fortress
    st.camp.forEach(([x, y, z, k]) => { const a = 1 - smooth(seg(p, .7, .76)); if (a <= 0) return; const q = P([x, y, z]); if (!q) return; const s = Math.min(18, F / q[2]); glow(q, s * 1.1, 'rgba(255,170,90,A)', .4 * a * (.8 + .2 * Math.sin(t * 7 + k * 30))); c.fillStyle = `rgba(255,220,160,${.9 * a})`; c.fillRect(q[0] - .8, q[1] - .8, 1.6, 1.6); });
    st.army.forEach(([x, z, k], i) => {
      const s = (p - .7 - k * .05) / .055; if (s <= 0 || s >= 1) return;
      const pos = crv([[x, 1.1, z], [x * .4, 1.15, 40], [(k - .5) * 2, 1.15, 51], [(k - .5) * 1.2, 1.15, 56.5], [0, 1.15, 62]], 4 * s);
      const q = P(pos); if (!q) return; const r = Math.min(26, F / q[2] * .55), a = Math.min(1, s * 6) * (1 - smooth(c01((s - .82) / .18)));
      glow(q, r, 'rgba(255,190,120,A)', .55 * a); c.fillStyle = `rgba(255,236,200,${a})`; c.beginPath(); c.arc(q[0], q[1], Math.max(.8, r * .12), 0, TAU); c.fill();
    });
    TORCHES.forEach(([x, y, z], i) => { const q = P([x, y, z]); if (!q) return; const s = F / q[2], f = .75 + .25 * Math.sin(t * 9 + i * 2) * Math.sin(t * 5.3 + i); glow(q, s * 1.6, 'rgba(255,150,70,A)', .35 * f * (1 - .6 * dawn)); c.fillStyle = `rgba(255,214,150,${.8 * f})`; c.fillRect(q[0] - .9, q[1] - 1.4, 1.8, 2.4); });
    // seventy lights gather around the fallen door, strain, then lift it together
    const nMen = st.men, gat = (i) => smooth(c01((p - .765 - (i / nMen) * .05) / .02));
    let arrived = 0;
    if (p > .755 && p < 1.01) {
      const { C, R } = pose, mk = (o) => DOOR_OUT.map(([u, v]) => { const L = Math.hypot(u, v + .2) || 1; return v3.add(C, R([u + u / L * o, v + (v + .2) / L * o, 0])); });
      const rings = [mk(.6), mk(1.25)], pers = rings.map((ring) => { const per = []; let tot = 0; for (let i = 0; i < ring.length; i++) { const d = Math.hypot(...v3.sub(ring[(i + 1) % ring.length], ring[i])); per.push(d); tot += d; } return [per, tot]; });
      const fade = 1 - .8 * smooth(seg(p, .905, .945)) - .2 * smooth(seg(p, .95, .99)), strain = smooth(seg(p, .83, .86)) * (1 - smooth(seg(p, .9, .93)));
      for (let i = 0; i < nMen; i++) {
        const row = i % 2, ring = rings[row], [per, tot] = pers[row], half = Math.ceil(nMen / 2);
        let d = ((Math.floor(i / 2) + .5 + row * .5) / half % 1) * tot, j = 0; while (j < per.length - 1 && d > per[j]) { d -= per[j]; j++; }
        const a = ring[j], b = ring[(j + 1) % ring.length], slot = v3.mix(a, b, Math.min(1, d / per[j]));
        const from = [REST[0] + Math.cos(i * 2.4) * (9 + hash(i) * 10), 1.1, REST[2] + Math.sin(i * 2.4) * (7 + hash(i, 1) * 8) - 4];
        const g = gat(i); if (g >= .98) arrived++;
        const pos = v3.mix(from, [slot[0], 1.0 + pose.lift * .9 + (slot[1] - DT) * .3, slot[2]], g);
        const q = P(pos); if (!q) continue;
        const pulse = 1 + strain * (.3 + .25 * Math.sin(t * 6 + i * 1.7) + .3 * Math.sin(p * 400 + i)), r = Math.min(16, F / q[2] * .3) * pulse, al = fade * Math.min(1, g * 3 + .15) * (p > .765 ? 1 : 0) * (.75 + .25 * hash(i, 9));
        glow(q, r, 'rgba(255,190,120,A)', .38 * al); c.fillStyle = `rgba(255,236,200,${.95 * al})`; c.beginPath(); c.arc(q[0], q[1], Math.max(.9, r * .16), 0, TAU); c.fill();
      }
    }
    setText(st.n, arNum(p < .765 ? 0 : Math.min(nMen, arrived)));
    // Ali's disc: a soft warm bloom in the dark before dawn, fainter as the day comes
    if (aliHead) glow([aliHead.x, aliHead.y], Math.max(14, aliHead.r * 6), 'rgba(255,214,150,A)', aa * mix(.5, .18, dawn));
    // the meeting: one soft bloom, no rays
    const fl = Math.max(0, 1 - Math.abs(p - .29) / .012);
    if (fl > 0) { const q = P(MEET); if (q) { glow(q, F / q[2] * 9 * (1 + (1 - fl)), 'rgba(255,236,200,A)', .85 * fl); glow([W / 2, H / 2], Math.max(W, H), 'rgba(255,220,170,A)', .25 * fl); } }
    c.globalCompositeOperation = 'source-over';
    // grade: warm at the end, a gentle vignette
    if (warm > 0) { c.globalCompositeOperation = 'soft-light'; c.fillStyle = `rgba(255,190,110,${.35 * warm})`; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
    const vg = c.createRadialGradient(W / 2, H * .55, Math.min(W, H) * .35, W / 2, H * .55, Math.hypot(W, H) * .62);
    vg.addColorStop(0, 'rgba(7,11,22,0)'); vg.addColorStop(1, `rgba(5,7,14,${mix(.6, .4, dawn)})`); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  },
};

// the banner: a cloth grid, unfurling with p and rippling with p and t
const BAN = { pole: [-8.6, 0, 9], h: 4.7, top: 4.3, w: 2.5, bh: 1.5, nu: 24, nv: 8 };
function drawBanner(c, P, F, p, t, dawn) {
  const b = BAN, base = P(b.pole), tip = P([b.pole[0], b.h, b.pole[2]]);
  if (!base || !tip) return;
  c.strokeStyle = '#2a1d12'; c.lineWidth = Math.max(1, F / base[2] * .09); c.lineCap = 'round';
  c.beginPath(); c.moveTo(base[0], base[1]); c.lineTo(tip[0], tip[1]); c.stroke();
  c.fillStyle = PAL.gold; const ts = F / tip[2]; c.beginPath(); c.moveTo(tip[0], tip[1] - ts * .45); c.lineTo(tip[0] + ts * .09, tip[1]); c.lineTo(tip[0] - ts * .09, tip[1]); c.fill();
  const un = smooth(seg(p, .0, .1)), ph = p * 26 + t * 2.1, pts = [];
  for (let j = 0; j <= b.nv; j++) {
    const row = [];
    for (let i = 0; i <= b.nu; i++) {
      const u = i / b.nu, v = j / b.nv;
      const span = u * b.w * mix(.18, 1, un);
      const fold = (1 - un) * .22 * Math.sin(u * 22) * u; // furled: gathered folds by the pole
      const wave = (.14 + .5 * u) * un * Math.sin(u * 7.2 - ph + v * .8) + .09 * u * Math.sin(u * 14 - ph * 1.6 + v * 2.2) + .05 * Math.sin(v * 5 + ph * .5) * u;
      const sag = (1 - un) * u * 1.1 + u * u * .12 + .05 * u * Math.sin(ph * .7 + u * 3);
      row.push([b.pole[0] + .06 + span * .93, b.top - (1 - v) * b.bh - sag * (1 - v * .3) - .0, b.pole[2] + wave + fold + span * .3]);
    }
    pts.push(row);
  }
  const sun = v3.norm([-.42, mix(.04, .2, dawn), 1]), cols = [];
  for (let i = 0; i <= b.nu; i++) { // shade per column: lit where it faces the low sun, glowing where light comes through
    const j = b.nv >> 1, a = pts[j][Math.max(0, i - 1)], bb = pts[j][Math.min(b.nu, i + 1)], d = pts[Math.min(b.nv, j + 1)][i], e = pts[Math.max(0, j - 1)][i];
    const n = v3.norm(v3.cross(v3.sub(bb, a), v3.sub(d, e))), lam = Math.abs(v3.dot(n, sun)), trans = Math.max(0, -n[2]) * .35;
    const k = (.42 + .62 * lam) * mix(.62, 1, dawn);
    cols.push(`rgb(${Math.min(255, 230 * k + 70 * trans * dawn + 18) | 0},${Math.min(255, 220 * k + 40 * trans * dawn + 12) | 0},${Math.min(255, 192 * k + 14 * trans) | 0})`);
  }
  const strips = [];
  for (let i = 0; i < b.nu; i++) {
    const L = [], Rr = []; let ok = true, z = 0;
    for (let j = 0; j <= b.nv; j++) { const qa = P(pts[j][i]), qb = P(pts[j][i + 1]); if (!qa || !qb) { ok = false; break; } L.push(qa); Rr.push(qb); z += qa[2]; }
    if (ok) strips.push({ L, R: Rr, z, i });
  }
  strips.sort((x, y) => y.z - x.z).forEach(({ L, R: Rr, i }) => {
    const m = b.nv >> 1, g = c.createLinearGradient(L[m][0], L[m][1], Rr[m][0], Rr[m][1]);
    g.addColorStop(0, cols[i]); g.addColorStop(1, cols[i + 1]);
    c.fillStyle = g; c.strokeStyle = g; c.lineWidth = .8;
    c.beginPath(); L.forEach((q, j) => (j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); for (let j = Rr.length - 1; j >= 0; j--) c.lineTo(Rr[j][0], Rr[j][1]); c.closePath(); c.fill(); c.stroke();
  });
  // a gold thread along the fly and the foot
  c.strokeStyle = rgba(PAL.gold, .75); c.lineWidth = 1.1; c.beginPath();
  pts.forEach((row, j) => { const q = P(row[b.nu]); if (q) (j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); }); c.stroke();
  c.strokeStyle = rgba(PAL.gold, .45); c.beginPath(); pts[0].forEach((pt, i) => { const q = P(pt); if (q) (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); }); c.stroke();
}
})();
