// يوم الدار: a hall of the clan in Mecca at night, lit by clay oil lamps. The men of Banu Abd al-Muttalib sit
// in a wide ring round a shared meal; the Prophet sits at the head, Ali, the youngest (about 13), in the ring.
// Asked three times: the ring stays still, the lamps gutter, only Ali stands; the third time he crosses, stands
// beside the Prophet and is told to sit. Through the door, down the valley, the Kaaba under the stars.
// World in metres: x right, y up, z from the door wall towards the head of the room. The men are faceless cloaked
// figures; the Prophet and Ali are veiled figures with a gold disc behind the head (scenes/holy.js), no face drawn.
(() => {
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const tone = (x) => 255 * (1 - Math.exp(-1.2 * x));
  const shadeOf = (alb, e) => [tone(alb[0] * e[0]), tone(alb[1] * e[1]), tone(alb[2] * e[2])];
  const hx = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
  const spline = (K, p) => {
    const n = K.length;
    if (p <= K[0][0]) return K[0].slice(1);
    if (p >= K[n - 1][0]) return K[n - 1].slice(1);
    let i = 0;
    while (p > K[i + 1][0]) i++;
    const u = (p - K[i][0]) / (K[i + 1][0] - K[i][0]);
    const A = K[Math.max(0, i - 1)], B = K[i], C = K[i + 1], D = K[Math.min(n - 1, i + 2)];
    return B.slice(1).map((_, j) => { const p0 = A[j + 1], p1 = B[j + 1], p2 = C[j + 1], p3 = D[j + 1]; return .5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (3 * p1 - p0 - 3 * p2 + p3) * u * u * u); });
  };
  const sprite = (stops, n = 128) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = n;
    const g = cv.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    stops.forEach(([o, cc]) => gr.addColorStop(o, cc));
    g.fillStyle = gr; g.fillRect(0, 0, n, n);
    return cv;
  };
  // a light falling on a plane: (1 + 12 s^2)^-1.5, eased to zero at the rim
  const pool = (r, g, b) => sprite(Array.from({ length: 11 }, (_, k) => { const s = k / 10; return [s, `rgba(${r},${g},${b},${((1 + 12 * s * s) ** -1.5 * (1 - s * s)).toFixed(4)})`]; }), 256);
  const path = (pts) => { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, len: cum[cum.length - 1] }; };
  const walk = (P, u) => {
    const s = c01(u) * P.len;
    let i = 1;
    while (i < P.pts.length - 1 && P.cum[i] < s) i++;
    const a = P.pts[i - 1], b = P.pts[i], k = c01((s - P.cum[i - 1]) / ((P.cum[i] - P.cum[i - 1]) || 1));
    return [mix(a[0], b[0], k), mix(a[1], b[1], k)];
  };

  // ---------- the house ----------
  const X0 = -6.5, X1 = 6.5, Z0 = -2.6, Z1 = 10.5, HT = 3.6, WT = .6;
  const DOOR = [-5.35, -3.65, 2.7];
  const RING = [0, 5.75, 4.45, 3.1];
  const ringAt = (th) => [RING[0] + RING[2] * Math.sin(th), RING[1] + RING[3] * Math.cos(th)];
  const PRO = [0, .98, 8.95];
  const COLS = [[-5.45, 0], [5.45, 0], [-5.45, 3.6], [5.45, 3.6], [-5.45, 7.2], [5.45, 7.2]];
  const BEAMS = [0, 3.6, 7.2];
  const NICHE = [[-2.5, 1.5, Z1, 'b'], [2.5, 1.5, Z1, 'b'], [X0, 1.5, 1.8, 'l'], [X0, 1.5, 5.4, 'l'], [X0, 1.5, 9.0, 'l'], [X1, 1.5, 1.8, 'r'], [X1, 1.5, 9.0, 'r'], [-2.6, 1.5, Z0, 'f'], [2.6, 1.5, Z0, 'f']];
  const STANDS = [[-2.2, 9.3], [2.2, 9.3]];
  const MEAL_LAMPS = [[-1.32, 5.95], [1.32, 5.55]];
  // outside: the house stands up the slope; the valley drops away to the sanctuary
  const VAL = -16, KAABA = { x: -51.5, z: 92, hw: 5.6, hd: 6.2, h: 13, rot: .32 };
  const ground = (x, z) => VAL * smooth(c01((Math.hypot(x + 4.5, z - 10.5) - 2.5) / 24));
  // the doorway frames the Kaaba: the opening shot sits on the line from the House through the door
  const KLOOK = [-51.5, -9.5, 92], DC = [-4.5, .72, 10.5];
  const KD = (() => { const v = [KLOOK[0] - DC[0], KLOOK[1] - DC[1], KLOOK[2] - DC[2]], n = Math.hypot(...v); return v.map((q) => q / n); })();
  const OPEN = (d) => DC.map((q, i) => q - KD[i] * d);
  // camera keys: [p, x, y, z, look x, y, z, zoom, screen x of the look point]
  const CAM = [
    [-.05, ...OPEN(2.35), ...OPEN(-1.6), 1.0, .4],
    [.07, ...OPEN(1.8), ...OPEN(-1.6), 1.12, .4],
    [.115, -3.35, 1.35, 8.75, 2.5, 1.1, 9.5, 1.0, .42],
    [.155, -3.9, 2.4, 9.5, 1.6, .5, 5.6, .98, .42],
    [.205, -5.6, 3.1, 9.95, 1.2, .2, 4.2, .95, .42],
    [.25, -3.4, 1.3, 2.75, .2, .12, 5.75, 1.12, .42],
    [.335, 1.9, 1.2, 2.45, -.2, .14, 6.0, 1.12, .42],
    [.385, .7, 2.75, -2.1, .2, .62, 6.6, 1.0, .42],
    [.545, 1.3, 1.95, .7, .6, .7, 6.6, 1.06, .42],
    [.6, -5.6, 1.55, 3.6, 0, .78, 6.0, 1.02, .42],
    [.68, -5.5, 1.5, 4.2, .2, .8, 6.2, 1.08, .42],
    [.725, -3.4, 3.1, -.6, 1.4, .5, 6.6, 1.0, .42],
    [.775, -2.9, 2.9, .2, 1.4, .55, 6.8, 1.04, .42],
    [.845, .8, 1.85, 1.6, .6, 1.0, 8.6, 1.08, .45],
    [.905, .8, 2.3, .6, -.45, .9, 9.2, 1.0, .5],
    [1, .9, 2.4, .9, -.5, .95, 9.2, 1.02, .5],
    [1.05, .9, 2.4, .9, -.5, .95, 9.2, 1.02, .5],
  ];

  S.dar = {
    init(el, st) {
      st.cv = el.querySelector('canvas');
      st.ctx = st.cv.getContext('2d');
      const r = rng(214);
      st.lampPool = pool(255, 158, 82);
      st.palePool = pool(255, 222, 176);
      st.skyPool = pool(110, 140, 210);
      st.shadow = sprite([[0, 'rgba(8,5,3,.62)'], [.5, 'rgba(8,5,3,.3)'], [1, 'rgba(8,5,3,0)']], 64);
      st.ringS = sprite([[0, 'rgba(255,230,190,.06)'], [.55, 'rgba(255,230,190,.08)'], [.8, 'rgba(255,230,190,.4)'], [.9, 'rgba(255,230,190,.16)'], [1, 'rgba(255,230,190,0)']], 256);
      st.pale = sprite([[0, 'rgba(255,246,222,1)'], [.2, 'rgba(255,236,196,.5)'], [.55, 'rgba(240,214,160,.12)'], [1, 'rgba(240,214,160,0)']]);
      st.gold = sprite([[0, 'rgba(255,240,200,1)'], [.2, 'rgba(250,214,140,.5)'], [.55, 'rgba(230,180,100,.12)'], [1, 'rgba(230,180,100,0)']]);
      st.fire = sprite([[0, 'rgba(255,214,150,1)'], [.25, 'rgba(255,150,60,.5)'], [.6, 'rgba(220,90,30,.12)'], [1, 'rgba(200,70,20,0)']]);
      st.noise = document.createElement('canvas');
      st.noise.width = st.noise.height = 160;
      { const ng = st.noise.getContext('2d'), id = ng.createImageData(160, 160);
        for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 22; }
        ng.putImageData(id, 0, 0); }
      // the clan: one wide ring; the head of it is the Prophet's place, Ali's is on the near right of the ring
      const N = 40;
      st.men = [];
      for (let k = 0; k < N - 1; k++) {
        const th = .36 + (TAU - .72) * k / (N - 2);
        const [x, z] = ringAt(th + (r() - .5) * .03);
        st.men.push({ th, x, z, s: .93 + r() * .13, w: .95 + r() * .14, cloak: hx(['#3a2c20', '#2b241e', '#4b3a28', '#5c4630', '#26262a', '#6a5640', '#6e3626', '#33291f', '#55402c', '#1f2124'][(r() * 10) | 0]), head: hx(r() < .55 ? ['#d9cdb4', '#cbbd9f', '#e6dcc6'][(r() * 3) | 0] : ['#3a3028', '#2a2622', '#5a4a36'][(r() * 3) | 0]), turban: r() < .5, lean: (r() - .5) * .05, kl: r() < .2 ? .38 + r() * .06 : .22 + r() * .06, kr: r() < .2 ? .38 + r() * .06 : .22 + r() * .06, sw: .19 + r() * .05, hs: .082 + r() * .014, hu: (r() - .3) * .04, fo: [r() * .1 - .05, r() * .1 - .05] });
      }
      let ai = 0; st.men.forEach((m, i) => { if (Math.abs(m.th - 2.25) < Math.abs(st.men[ai].th - 2.25)) ai = i; });
      const am = st.men.splice(ai, 1)[0];
      st.aliSeat = [am.x, am.z];
      st.aliPath = path([[am.x, am.z], [am.x * .82, am.z + .55], [2.55, 6.3], [1.7, 7.75], [1.02, 8.62]]);
      // rafters across the hall, palm trunks every 0.6 m; two main beams on the columns
      st.rafters = [];
      for (let x = X0 + .35; x < X1; x += .6) st.rafters.push([x + (r() - .5) * .06, .085 + r() * .03]);
      // the meal: bread rounds round the platter, bowls, a cup of milk
      st.bread = [];
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + r() * .2, rr = 1.12 + r() * .18; st.bread.push([Math.sin(a) * rr, RING[1] + Math.cos(a) * rr * .66, .13 + r() * .03, r()]); }
      st.bowls = [[.82, 5.32, .19, 0], [-.8, 6.2, .17, 0], [.28, 6.42, .15, 0], [-.48, 5.05, .15, 0], [.62, 6.05, .12, 1]];
      st.meat = Array.from({ length: 9 }, () => { const a = r() * TAU, d = r() * .27; return [Math.sin(a) * d, Math.cos(a) * d * .9, .045 + r() * .04]; });
      // a woven hanging on the right wall; rug cells behind the Prophet
      const rugCol = (u, v, W2, H2) => {
        const bu = Math.min(u, W2 - 1 - u), bv = Math.min(v, H2 - 1 - v), b = Math.min(bu, bv);
        if (b === 0) return [.16, .1, .08];
        if (b === 1) return (u + v) % 2 ? [.62, .48, .3] : [.42, .12, .09];
        const cu = u - (W2 - 1) / 2, cv = v - (H2 - 1) / 2, dmd = Math.abs(cu) / ((W2 - 4) / 2) + Math.abs(cv) / ((H2 - 4) / 2);
        if (dmd < .34) return [.66, .52, .32];
        if (dmd < .62) return [.13, .16, .26];
        if (Math.abs(dmd - .8) < .1) return [.62, .5, .32];
        return [.46, .13, .09];
      };
      st.rug = { x0: -1.5, x1: 1.5, z0: 8.3, z1: 10.3, nu: 23, nv: 15, col: [] };
      for (let v = 0; v < 15; v++) for (let u = 0; u < 23; u++) st.rug.col.push(rugCol(u, v, 23, 15));
      st.hang = { z0: 4.4, z1: 6.4, y0: 1.0, y1: 2.8, nu: 15, nv: 13, col: [] };
      for (let v = 0; v < 13; v++) for (let u = 0; u < 15; u++) st.hang.col.push(rugCol(u, v, 15, 13).map((q) => q * .85));
      // cushions along the side walls, bolsters at the backs
      st.cush = [];
      [[X0 + .02, X0 + .62], [X1 - .62, X1 - .02]].forEach(([a, b]) => {
        [[-2.3, -.3], [.4, 3.2], [4.0, 6.8], [7.6, 10.2]].forEach(([z0, z1]) => {
          st.cush.push({ x0: a, x1: b, y0: 0, y1: .2, z0, z1, alb: [.36, .16, .11], bands: true });
          const back = a < 0 ? [a, a + .26] : [b - .26, b];
          st.cush.push({ x0: back[0], x1: back[1], y0: .2, y1: .6, z0: z0 + .05, z1: z1 - .05, alb: [.44, .3, .18] });
        });
      });
      st.cush.push({ x0: -.8, x1: .8, y0: 0, y1: .08, z0: 9.25, z1: 9.95, alb: [.2, .08, .06], bands: true });
      // the city below: house blocks in the wedge seen through the door; stars; the far hills
      st.houses = [];
      const base = Math.atan2(KAABA.x - DC[0], KAABA.z - DC[2]);
      for (let k = 0; k < 320; k++) {
        const a = (r() - .5) * 1.3, d = 7 + r() ** .8 * 160;
        const x = DC[0] + Math.sin(base + a) * d, z = DC[2] + .8 + Math.cos(base + a) * d;
        if (Math.hypot(x - KAABA.x, z - KAABA.z) < 34) continue;
        if (d < 86 && Math.abs(Math.sin(a)) * d < 4 + d * .06) continue; // the lane down to the sanctuary
        const w = 4 + r() * 7, dd = 4 + r() * 7, h = 3.2 + r() * 4.5, y0 = ground(x, z);
        if (d < 60 && y0 + h > -1.2 - d * .13) continue; // the near roofs stay under the line of sight down the valley
        st.houses.push({ x0: x - w / 2, x1: x + w / 2, z0: z - dd / 2, z1: z + dd / 2, y0: y0 - 3, y1: y0 + h, lit: r() < .2 ? [r() * .7 + .15, r() * .4 + .3] : null, alb: .7 + r() * .35 });
      }
      st.stars = Array.from({ length: 2400 }, () => ({ az: r() * TAU, el: Math.asin(r() * .98) * (r() < .5 ? 1 : .4) + .005, m: .25 + r() ** 3 * 1.6, ph: r() * 9 }));
      st.hills = [[0, 420, 26, 1.3], [1, 700, 40, .8], [2, 1200, 62, .5]].map(([li, d, h, f]) => {
        const pts = [];
        const base = Math.atan2(KAABA.x - DC[0], KAABA.z - DC[2]);
        for (let k = 0; k <= 60; k++) { const a = base - .9 + k / 60 * 1.8; const n = .55 + .25 * Math.sin(k * .37 * f + li * 2) + .14 * Math.sin(k * .91 * f + li) + .06 * Math.sin(k * 2.3 + li * 5); pts.push([DC[0] + Math.sin(a) * d, DC[2] + Math.cos(a) * d, VAL + h * n]); }
        return { li, pts };
      });
      st.torches = Array.from({ length: 16 }, () => { const a = r() * TAU, d = 30 + r() * 10; return [KAABA.x + Math.sin(a) * d, KAABA.z + Math.cos(a) * d, r() * 9]; });
      st.motes = Array.from({ length: 260 }, () => [X0 + r() * (X1 - X0), .3 + r() * 3, 1 + r() * 9.4, r() * 9, .3 + r() * .7]);
    },

    frame(p, t, el, st) {
      fit(st.cv);
      const c = st.ctx, W = st.cv.width, H = st.cv.height;
      const phone = st.cv.clientWidth < 700;
      const pc = Math.min(1.05, Math.max(-.05, p));
      let [px, py, pz, tx, ty, tz, zoom, sxk] = spline(CAM, pc);
      if (phone) { // a tall screen is narrow: turn towards Ali's place while the question is asked
        const w = .4 * smooth(seg(p, .38, .44)) * (1 - smooth(seg(p, .84, .9)));
        tx = mix(tx, st.aliSeat[0], w); tz = mix(tz, st.aliSeat[1], w);
      }
      // camera basis (look-at, no roll)
      const dx0 = tx - px, dy0 = ty - py, dz0 = tz - pz;
      const yaw = Math.atan2(dx0, dz0), pitch = Math.atan2(dy0, Math.hypot(dx0, dz0));
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const F = (phone ? W * 1.12 : Math.min(H * .98, W * .62)) * zoom;
      const CX = phone ? W * .5 : W * sxk, CY = phone ? H * .56 : H * .5;
      const NEAR = .05;
      const cs = (x, y, z) => { const a = x - px, b = y - py, d = z - pz; return [a * cyw - d * syw, -a * syw * sp + b * cp - d * cyw * sp, a * syw * cp + b * sp + d * cyw * cp]; };
      const clip = (q) => {
        const out = [];
        for (let i = 0; i < q.length; i++) {
          const a = q[i], b = q[(i + 1) % q.length], ain = a[2] > NEAR, bin = b[2] > NEAR;
          if (ain) out.push(a);
          if (ain !== bin) { const k = (NEAR - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, NEAR]); }
        }
        return out;
      };
      const SX = (q) => CX + q[0] * F / q[2], SY = (q) => CY - q[1] * F / q[2];
      const sc = (x, y, z) => { const q = cs(x, y, z); return q[2] > NEAR ? [SX(q), SY(q), q[2]] : null; };
      const addPoly = (pts) => {
        const q = clip(pts.map((v) => cs(v[0], v[1], v[2])));
        if (q.length < 3) return false;
        c.moveTo(SX(q[0]), SY(q[0]));
        for (let i = 1; i < q.length; i++) c.lineTo(SX(q[i]), SY(q[i]));
        c.closePath();
        return true;
      };
      const fillPoly = (pts, style) => { c.beginPath(); if (addPoly(pts)) { c.fillStyle = style; c.fill(); } };

      // ---------- beats ----------
      const gust = (a) => Math.sin(Math.PI * seg(p, a, a + .045)) * (1 - .4 * seg(p, a, a + .045));
      const G = Math.max(gust(.405), gust(.57), gust(.705));
      const pulse = [[.4, .44], [.565, .6], [.7, .735]].map(([a, b]) => seg(p, a, b));
      const rise = ease.out(seg(p, .45, .475)) * (1 - smooth(seg(p, .51, .535))) + ease.out(seg(p, .6, .625)) * (1 - smooth(seg(p, .655, .68))) + ease.out(seg(p, .74, .765));
      const go = smooth(seg(p, .775, .845));
      const sit = smooth(seg(p, .872, .905));
      const aliXZ = go > 0 ? walk(st.aliPath, go) : st.aliSeat;
      const aliY = mix(mix(.765, 1.365, rise), .765, sit) + .03 * Math.sin(Math.PI * go);
      const aliI = .8 + .45 * rise * (1 - sit) + .2 * sit;
      const meal = 1 - .35 * smooth(seg(p, .36, .44));
      const after = smooth(seg(p, .86, .95));
      // Ali (h 1.5 m) sits, stands at each asking, walks across, stands beside the Prophet, sits when told; the pose
      // switches at the midpoint of each move (one figure, one disc), while his light and bloom move smoothly
      const aliPose = rise * (1 - sit) < .5 ? 'sit' : go > 0 && go < 1 ? 'walk' : 'stand';
      const famb = .42 - .1 * G; // lamplight at night; dims when the lamps gutter

      // ---------- lights ----------
      const L = [];
      const flick = (ph, k = 1) => (.86 + .14 * Math.sin(t * 7.3 + ph) * Math.sin(t * 4.1 + ph * 2.1)) * (1 - .55 * G * k);
      NICHE.forEach(([x, y, z, w], i) => { const o = { b: [0, 0, -.22], f: [0, 0, .22], l: [.22, 0, 0], r: [-.22, 0, 0] }[w]; L.push({ x: x + o[0], y: y + .02, z: z + o[2], c: [1, .55, .24], i: 1.25 * flick(i * 1.7, 1 + .3 * (i % 2)), r2: 2.2, k: 'lamp', w }); });
      STANDS.forEach(([x, z], i) => L.push({ x, y: 1.42, z, c: [1, .56, .25], i: 1.1 * flick(i * 3.3 + 1), r2: 2.6, k: 'lamp' }));
      MEAL_LAMPS.forEach(([x, z], i) => L.push({ x, y: .18, z, c: [1, .58, .26], i: .9 * flick(i * 2.2 + 5, 1.2), r2: 1.8, k: 'lamp' }));
      const proI = 2.6 + .9 * Math.max(...pulse.map((q) => Math.sin(Math.PI * q))) + .5 * after;
      L.push({ x: PRO[0], y: PRO[1], z: PRO[2], c: [1, .9, .74], i: proI, r2: 6, k: 'holy' });
      L.push({ x: aliXZ[0], y: aliY, z: aliXZ[1], c: [1, .84, .58], i: aliI, r2: 2.6, k: 'ali' });
      L.push({ x: DC[0], y: 1.3, z: Z1 + .4, c: [.32, .42, .7], i: .5, r2: 4, k: 'sky' });
      const AMB = [.022, .025, .042];
      const lit = (x, y, z, nx, ny, nz) => {
        let R = AMB[0], Gg = AMB[1], B = AMB[2];
        for (let k = 0; k < L.length; k++) {
          const l = L[k], ddx = l.x - x, ddy = l.y - y, ddz = l.z - z, d2 = ddx * ddx + ddy * ddy + ddz * ddz, d = Math.sqrt(d2) || 1;
          const lam = ((nx * ddx + ny * ddy + nz * ddz) / d + .25) / 1.25;
          if (lam <= 0) continue;
          const e = l.i * lam / (1 + d2 / l.r2);
          R += l.c[0] * e; Gg += l.c[1] * e; B += l.c[2] * e;
        }
        return [R, Gg, B];
      };

      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
      c.fillStyle = '#060504'; c.fillRect(0, 0, W, H);

      // ---------- outside, through the door ----------
      c.save();
      c.beginPath();
      if (addPoly([[DOOR[0], 0, Z1], [DOOR[1], 0, Z1], [DOOR[1], DOOR[2], Z1], [DOOR[0], DOOR[2], Z1]])) {
        c.clip();
        drawOutside();
      }
      c.restore();
      // the reveal of the doorway, the thickness of the wall
      { const e1 = lit(DOOR[0], 1.1, Z1 + .2, 1, 0, 0), e2 = lit(DOOR[1], 1.1, Z1 + .2, -1, 0, 0), e3 = lit((DOOR[0] + DOOR[1]) / 2, DOOR[2], Z1 + .2, 0, -1, 0);
        fillPoly([[DOOR[0], 0, Z1], [DOOR[0], 0, Z1 + WT], [DOOR[0], DOOR[2], Z1 + WT], [DOOR[0], DOOR[2], Z1]], rgb(shadeOf([.5, .38, .26], e1.map((v) => v * .5))));
        fillPoly([[DOOR[1], 0, Z1], [DOOR[1], 0, Z1 + WT], [DOOR[1], DOOR[2], Z1 + WT], [DOOR[1], DOOR[2], Z1]], rgb(shadeOf([.5, .38, .26], e2.map((v) => v * .5))));
        fillPoly([[DOOR[0], DOOR[2], Z1], [DOOR[1], DOOR[2], Z1], [DOOR[1], DOOR[2], Z1 + WT], [DOOR[0], DOOR[2], Z1 + WT]], rgb(shadeOf([.34, .22, .13], e3.map((v) => v * .5))));
        fillPoly([[DOOR[0], 0, Z1], [DOOR[1], 0, Z1], [DOOR[1], .12, Z1 + .08], [DOOR[0], .12, Z1 + .08]], rgb(shadeOf([.32, .2, .12], lit(-4.4, .1, Z1, 0, .5, -1))));
        fillPoly([[DOOR[0], .12, Z1 + .08], [DOOR[1], .12, Z1 + .08], [DOOR[1], .12, Z1 + WT], [DOOR[0], .12, Z1 + WT]], rgb(shadeOf([.4, .3, .2], lit(-4.4, .12, Z1 + .3, 0, 1, 0))));
      }

      // ---------- the room shell: walls, floor and ceiling, then the lamplight on them ----------
      const SURF = [
        { n: [0, 0, -1], o: [0, 0, Z1], u: [1, 0, 0], v: [0, 1, 0], pts: [[X0, 0, Z1], [X1, 0, Z1], [X1, HT, Z1], [X0, HT, Z1]], hole: true, alb: [.66, .5, .34] },
        { n: [0, 0, 1], o: [0, 0, Z0], u: [1, 0, 0], v: [0, 1, 0], pts: [[X0, 0, Z0], [X0, HT, Z0], [X1, HT, Z0], [X1, 0, Z0]], alb: [.66, .5, .34] },
        { n: [1, 0, 0], o: [X0, 0, 0], u: [0, 0, 1], v: [0, 1, 0], pts: [[X0, 0, Z0], [X0, 0, Z1], [X0, HT, Z1], [X0, HT, Z0]], alb: [.64, .49, .33] },
        { n: [-1, 0, 0], o: [X1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], pts: [[X1, 0, Z0], [X1, HT, Z0], [X1, HT, Z1], [X1, 0, Z1]], alb: [.64, .49, .33] },
        { n: [0, 1, 0], o: [0, 0, 0], u: [1, 0, 0], v: [0, 0, 1], pts: [[X0, 0, Z0], [X1, 0, Z0], [X1, 0, Z1], [X0, 0, Z1]], alb: [.4, .3, .2], floor: true },
        { n: [0, -1, 0], o: [0, HT, 0], u: [1, 0, 0], v: [0, 0, 1], pts: [[X0, HT, Z0], [X0, HT, Z1], [X1, HT, Z1], [X1, HT, Z0]], alb: [.26, .19, .12] },
      ];
      const glowOn = (s, l, gain) => {
        const d = (l.x - s.o[0]) * s.n[0] + (l.y - s.o[1]) * s.n[1] + (l.z - s.o[2]) * s.n[2];
        if (d <= 0) return;
        const dd = Math.max(d, l.k === 'lamp' ? .5 : .7), R = 1 + 3.4 * dd;
        const O = [l.x - s.n[0] * d, l.y - s.n[1] * d, l.z - s.n[2] * d];
        planeSprite(O, s.u, s.v, R, l.k === 'lamp' ? st.lampPool : l.k === 'sky' ? st.skyPool : st.palePool, gain * l.i / (.5 + dd * dd));
      };
      SURF.forEach((s) => {
        c.beginPath();
        if (!addPoly(s.pts)) return;
        if (s.hole) addPoly([[DOOR[0], 0, Z1], [DOOR[0], DOOR[2], Z1], [DOOR[1], DOOR[2], Z1], [DOOR[1], 0, Z1]]);
        const base = s.floor ? lit(0, 0, 5.5, 0, 1, 0).map((v) => v * .22) : AMB.map((v) => v * 1.6);
        c.fillStyle = rgb(shadeOf(s.alb, base));
        c.fill('evenodd');
        c.save(); c.clip('evenodd');
        // soot and shade gather under the roof
        if (!s.floor && s.n[1] === 0) wallDetails(s);
        c.globalCompositeOperation = 'lighter';
        L.forEach((l) => glowOn(s, l, s.floor ? .42 : s.n[1] < 0 ? .25 : l.k === 'lamp' ? .58 : .45));
        c.globalCompositeOperation = 'source-over';
        if (s.n[1] === 0) { // dark at the top of the wall
          const wx = s.n[0] ? s.o[0] : Math.min(X1, Math.max(X0, px)), wz = s.n[0] ? Math.min(Z1, Math.max(Z0, pz + 4)) : s.o[2];
          const a = sc(wx, HT, wz), b = sc(wx, 1.7, wz);
          if (a && b) { const g = c.createLinearGradient(a[0], a[1], b[0], b[1]); g.addColorStop(0, 'rgba(10,6,3,.55)'); g.addColorStop(1, 'rgba(10,6,3,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
        }
        c.restore();
      });

      // ---------- the roof: two beams on the columns, palm-trunk rafters, fronds between ----------
      drawRoof();
      // ---------- on the floor: mats, the rug, the cloth of the meal ----------
      drawFloorThings();
      // pools of light on everything that lies on the floor; the Prophet's word goes out across it, each of the three times
      c.save(); c.beginPath();
      if (addPoly(SURF[4].pts)) {
        c.clip();
        c.globalCompositeOperation = 'lighter';
        L.forEach((l) => glowOn(SURF[4], l, l.k === 'lamp' ? .16 : .22));
        pulse.forEach((q) => { if (q > 0 && q < 1) planeSprite([PRO[0], .01, PRO[2] - .2], [1, 0, 0], [0, 0, 1], .8 + 7 * ease.out(q), st.ringS, .32 * Math.sin(Math.PI * q) ** .8); });
      }
      c.restore();
      c.globalCompositeOperation = 'source-over';
      // contact shadows
      st.men.forEach((m) => planeSprite([m.x, .005, m.z], [1, 0, 0], [0, 0, 1], .62, st.shadow, .85));

      // ---------- upright things, far to near ----------
      const items = [];
      const dist = (x, z) => { const q = cs(x, .5, z); return q[2]; };
      COLS.forEach(([x, z]) => items.push([dist(x, z), () => column(x, z)]));
      st.cush.forEach((b) => items.push([dist((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2) + (b.y0 > 0 ? -.01 : .01), () => box(b)]));
      st.men.forEach((m) => items.push([dist(m.x, m.z), () => man(m)]));
      STANDS.forEach(([x, z], i) => items.push([dist(x, z), () => stand(x, z, i)]));
      st.bowls.forEach((b) => items.push([dist(b[0], b[1]) + .3, () => bowl(b)]));
      items.push([dist(0, RING[1]) + .35, () => platter()]);
      MEAL_LAMPS.forEach(([x, z], i) => items.push([dist(x, z) + .2, () => clayLamp(x, .04, z, 1, L[NICHE.length + 2 + i], i + 20)]));
      const heads = {};
      items.push([dist(PRO[0], PRO[2]), () => { heads.pro = figure('prophet', PRO[0], PRO[2], 1.85, 24, { pose: 'sit' }); }]);
      items.push([dist(aliXZ[0], aliXZ[1]), () => { heads.ali = figure('ali', aliXZ[0], aliXZ[1], 1.5, 20, { pose: aliPose, phase: go * st.aliPath.len / 1.4 }); }]);
      if (go > .02) items.push([dist(st.aliSeat[0], st.aliSeat[1]) + .1, () => { // the place he left
        const s0 = sc(st.aliSeat[0], .08, st.aliSeat[1]); if (!s0) return;
        c.globalAlpha = .7 * smooth(c01(go * 6)); planeSprite([st.aliSeat[0], .01, st.aliSeat[1]], [1, 0, 0], [0, 0, 1], .5, st.shadow, .6); c.globalAlpha = 1;
      }]);
      items.sort((a, b) => b[0] - a[0]);
      for (const [d, fn] of items) if (d > NEAR) fn();

      // ---------- the air: lamp halos, a soft bloom at each disc, motes ----------
      c.globalCompositeOperation = 'lighter';
      L.forEach((l) => {
        if (l.k !== 'lamp') return;
        const q = sc(l.x, l.y + .06, l.z); if (!q) return;
        const R = Math.min(H * .16, .65 * F / q[2]);
        halo(q[0], q[1], R, st.fire, .3 * l.i);
      });
      { const q = heads.pro; // the head radius is .133 m at h 1.85: 27 r spans the old 3.6 m glow
        if (q) { const k = 1 + .3 * after + .2 * Math.max(...pulse.map((v) => Math.sin(Math.PI * v))); halo(q.x, q.y, Math.min(H * .9, 27 * q.r) * k, st.pale, .2); halo(q.x, q.y, 5 * q.r * k, st.pale, .14); } }
      { const q = heads.ali; // the bloom follows his light, which moves smoothly while the pose switches
        const hy = q && sc(aliXZ[0], aliY, aliXZ[1]);
        if (q && hy) { halo(hy[0], hy[1], Math.min(H * .6, 20 * q.r) * (.75 + .4 * rise + .25 * sit), st.gold, .11 * aliI); halo(hy[0], hy[1], 5 * q.r, st.gold, .12 * aliI); } }
      // dust turning slowly in the lamplight
      c.fillStyle = 'rgba(255,214,160,1)';
      st.motes.forEach(([x0, y0, z0, ph, m]) => {
        const x = x0 + .25 * Math.sin(t * .13 + ph), y = y0 + .2 * Math.sin(t * .09 + ph * 2), z = z0 + .2 * Math.cos(t * .11 + ph);
        const q = sc(x, y, z); if (!q || q[2] > 12) return;
        let e = 0; for (const l of L) { const d2 = (l.x - x) ** 2 + (l.y - y) ** 2 + (l.z - z) ** 2; e += l.i / (1 + d2 / .9); }
        const a = Math.min(.5, e * .12 * m); if (a < .03) return;
        const s = Math.max(1, .012 * F / q[2]);
        c.globalAlpha = a; c.fillRect(q[0], q[1], s, s);
      });
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';

      // ---------- grade ----------
      c.globalCompositeOperation = 'overlay';
      c.fillStyle = c.createPattern(st.noise, 'repeat');
      c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      const vg = c.createRadialGradient(CX, CY, Math.min(W, H) * .25, CX, CY, Math.hypot(W, H) * .68);
      vg.addColorStop(0, 'rgba(4,3,2,0)'); vg.addColorStop(1, 'rgba(4,3,2,.5)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);

      // ================= helpers (closures over this frame) =================
      function halo(x, y, R, img, a) {
        if (a <= .01 || x + R < 0 || x - R > W || y + R < 0 || y - R > H) return;
        c.globalAlpha = Math.min(1, a); c.drawImage(img, x - R, y - R, R * 2, R * 2); c.globalAlpha = 1;
      }
      // a radial sprite laid on a plane through O spanned by unit vectors U, V (affine about the centre)
      function planeSprite(O, U, V, R, img, a) {
        if (a <= .004) return;
        const pa = sc(O[0] + U[0] * R, O[1] + U[1] * R, O[2] + U[2] * R), pb = sc(O[0] - U[0] * R, O[1] - U[1] * R, O[2] - U[2] * R);
        const pc2 = sc(O[0] + V[0] * R, O[1] + V[1] * R, O[2] + V[2] * R), pd = sc(O[0] - V[0] * R, O[1] - V[1] * R, O[2] - V[2] * R);
        if (!pa || !pb || !pc2 || !pd) { if (R > .3) planeSprite(O, U, V, R * .6, img, a * .8); return; }
        const ox = (pa[0] + pb[0] + pc2[0] + pd[0]) / 4, oy = (pa[1] + pb[1] + pc2[1] + pd[1]) / 4;
        const ux = (pa[0] - pb[0]) / 2, uy = (pa[1] - pb[1]) / 2, vx = (pc2[0] - pd[0]) / 2, vy = (pc2[1] - pd[1]) / 2;
        if (Math.abs(ux) + Math.abs(uy) > W * 6) return;
        c.globalAlpha = Math.min(1, a);
        c.setTransform(ux, uy, vx, vy, ox, oy);
        c.drawImage(img, -1, -1, 2, 2);
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.globalAlpha = 1;
      }
      function wallDetails(s) {
        const side = s.n[0] ? (s.n[0] > 0 ? 'l' : 'r') : (s.n[2] < 0 ? 'b' : 'f');
        const P3 = (u, y) => (s.n[0] ? [s.o[0], y, u] : [u, y, s.o[2]]);
        const span = s.n[0] ? [Z0, Z1] : [X0, X1];
        // a darker dado of trodden plaster
        fillPoly([P3(span[0], 0), P3(span[1], 0), P3(span[1], .42), P3(span[0], .42)], 'rgba(20,12,6,.32)');
        c.strokeStyle = 'rgba(20,12,6,.35)'; c.lineWidth = Math.max(1, H / 900);
        c.beginPath(); if (addPolyLine([P3(span[0], .42), P3(span[1], .42)])) c.stroke();
        // courses of mud brick under a thin plaster
        c.strokeStyle = 'rgba(28,16,8,.13)'; c.lineWidth = Math.max(1, H / 1100);
        c.beginPath();
        let row = 0;
        for (let y = .42; y < HT - .25; y += .3, row++) {
          addPolyLine([P3(span[0], y), P3(span[1], y)]);
          for (let u = span[0] + (row % 2) * .33 + ((row * 7) % 5) * .04; u < span[1]; u += .66 + ((row * 3 + u * 5 | 0) % 3) * .05) addPolyLine([P3(u, y), P3(u, y + .3)]);
        }
        c.stroke();
        // niches with their lamps
        NICHE.forEach(([x, y, z, w], i) => {
          if (w !== side) return;
          const u = s.n[0] ? z : x, l = L[i];
          const arch = [];
          for (let k = 0; k <= 10; k++) { const a = Math.PI * k / 10; arch.push(P3(u + .25 * Math.cos(a), y + .3 + .2 * Math.sin(a))); }
          const pts = [P3(u + .25, y - .14), ...arch, P3(u - .25, y - .14)];
          const ctr = sc(...P3(u, y + .05)); if (!ctr) return;
          c.beginPath(); if (!addPoly(pts)) return;
          const R = .5 * F / ctr[2], g = c.createRadialGradient(ctr[0], ctr[1], 0, ctr[0], ctr[1], R);
          const e = l.i;
          g.addColorStop(0, `rgba(255,${(190 + 30 * e) | 0},120,${Math.min(1, .95 * e)})`); g.addColorStop(.35, `rgba(200,110,50,${Math.min(1, .8 * e)})`); g.addColorStop(1, 'rgba(40,20,10,.95)');
          c.fillStyle = g; c.fill();
          c.strokeStyle = 'rgba(15,8,4,.55)'; c.lineWidth = Math.max(1, .03 * F / ctr[2]); c.stroke();
          clayLamp(...P3(u, y - .14).map((v, j) => v + (j === 1 ? 0 : (j === 0 ? s.n[0] : s.n[2]) * -.12)), .8, l, i);
        });
        // the door's wooden lintel and the leaf standing open against the wall
        if (side === 'b') {
          fillPoly([[DOOR[0] - .25, DOOR[2], Z1 - .01], [DOOR[1] + .25, DOOR[2], Z1 - .01], [DOOR[1] + .25, DOOR[2] + .2, Z1 - .01], [DOOR[0] - .25, DOOR[2] + .2, Z1 - .01]], rgb(shadeOf([.3, .2, .12], lit(-4.4, 2.45, Z1, 0, 0, -1))));
        }
        if (side === 'r') { // a woven hanging
          const hg = st.hang;
          for (let v = 0; v < hg.nv; v++) for (let u = 0; u < hg.nu; u++) {
            const z0 = mix(hg.z0, hg.z1, u / hg.nu), z1 = mix(hg.z0, hg.z1, (u + 1) / hg.nu), y0 = mix(hg.y1, hg.y0, v / hg.nv), y1 = mix(hg.y1, hg.y0, (v + 1) / hg.nv);
            const cc = rgb(shadeOf(hg.col[v * hg.nu + u], lit(X1, (y0 + y1) / 2, (z0 + z1) / 2, -1, 0, 0)));
            c.beginPath(); if (addPoly([[X1 - .03, y0, z0], [X1 - .03, y0, z1], [X1 - .03, y1, z1], [X1 - .03, y1, z0]])) { c.fillStyle = cc; c.fill(); c.strokeStyle = cc; c.lineWidth = 1; c.stroke(); }
          }
        }
      }
      function addPolyLine(pts) {
        const q = pts.map((v) => cs(v[0], v[1], v[2]));
        if (q[0][2] <= NEAR && q[1][2] <= NEAR) return false;
        let [a, b] = q;
        if (a[2] <= NEAR) { const k = (NEAR - a[2]) / (b[2] - a[2]); a = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, NEAR]; }
        if (b[2] <= NEAR) { const k = (NEAR - b[2]) / (a[2] - b[2]); b = [b[0] + (a[0] - b[0]) * k, b[1] + (a[1] - b[1]) * k, NEAR]; }
        c.moveTo(SX(a), SY(a)); c.lineTo(SX(b), SY(b));
        return true;
      }
      function clayLamp(x, y, z, sz, l, i) {
        const q = sc(x, y + .05, z); if (!q) return;
        const s = F / q[2] * sz;
        c.fillStyle = 'rgba(40,24,14,1)';
        c.beginPath(); c.ellipse(q[0], q[1], .09 * s, .035 * s, 0, 0, TAU); c.fill();
        c.fillStyle = `rgba(150,90,50,${Math.min(1, .3 + .4 * l.i)})`;
        c.beginPath(); c.ellipse(q[0], q[1] - .012 * s, .075 * s, .022 * s, 0, 0, TAU); c.fill();
        // the flame leans in the draught at each asking
        const lean = (.4 * G + .06 * Math.sin(t * 3.1 + i)) * (i % 2 ? 1 : -1), fx = q[0] + .07 * s, fy = q[1] - .03 * s, fh = (.075 + .02 * Math.sin(t * 9 + i * 3)) * s * (1 - .35 * G);
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = 'rgba(255,190,90,.9)';
        c.beginPath(); c.moveTo(fx - .016 * s, fy); c.quadraticCurveTo(fx - .02 * s, fy - fh * .5, fx + lean * fh, fy - fh); c.quadraticCurveTo(fx + .02 * s, fy - fh * .5, fx + .016 * s, fy); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,245,215,.9)';
        c.beginPath(); c.ellipse(fx, fy - fh * .25, .007 * s, fh * .2, 0, 0, TAU); c.fill();
        c.globalCompositeOperation = 'source-over';
      }
      function drawRoof() {
        // main beams on the columns
        BEAMS.forEach((z) => {
          const e = lit(0, HT - .2, z, 0, -1, 0);
          fillPoly([[X0, HT - .34, z - .17], [X1, HT - .34, z - .17], [X1, HT - .34, z + .17], [X0, HT - .34, z + .17]], rgb(shadeOf([.3, .21, .13], e)));
          const ez = lit(0, HT - .2, z - .17, 0, 0, -1), ez2 = lit(0, HT - .2, z + .17, 0, 0, 1);
          fillPoly([[X0, HT - .34, z - .17], [X1, HT - .34, z - .17], [X1, HT - .1, z - .17], [X0, HT - .1, z - .17]], rgb(shadeOf([.3, .21, .13], pz < z ? ez : ez2)));
        });
        // rafters: round palm trunks running front to back
        st.rafters.forEach(([x, rr]) => {
          for (let k = 0; k <= BEAMS.length; k++) {
            const za = k ? BEAMS[k - 1] : Z0, zb = k < BEAMS.length ? BEAMS[k] : Z1;
            const a = sc(x, HT - .1, (za + zb) / 2); if (!a) continue;
            const e = lit(x, HT - .2, (za + zb) / 2, 0, -1, 0), e1 = shadeOf([.34, .25, .16], e), e0 = shadeOf([.34, .25, .16], e.map((v) => v * .35));
            const p1 = sc(x - rr, HT - .1, (za + zb) / 2), p2 = sc(x + rr, HT - .1, (za + zb) / 2);
            c.beginPath(); if (!addPoly([[x - rr, HT - .1, za + (k ? .17 : 0)], [x + rr, HT - .1, za + (k ? .17 : 0)], [x + rr, HT - .1, zb - (k < BEAMS.length ? .17 : 0)], [x - rr, HT - .1, zb - (k < BEAMS.length ? .17 : 0)]])) continue;
            if (p1 && p2) { const g = c.createLinearGradient(p1[0], p1[1], p2[0], p2[1]); g.addColorStop(0, rgb(e0)); g.addColorStop(.45, rgb(e1)); g.addColorStop(1, rgb(e0)); c.fillStyle = g; } else c.fillStyle = rgb(e1);
            c.fill();
          }
        });
      }
      function drawFloorThings() {
        // reed mats under the ring
        const matE = lit(0, 0, 5.5, 0, 1, 0).map((v) => v * .55);
        [[-5.1, -1.7], [-1.7, 1.7], [1.7, 5.1]].forEach(([a, b], i) => {
          fillPoly([[a + .03, .004, 1.9], [b - .03, .004, 1.9], [b - .03, .004, 9.9], [a + .03, .004, 9.9]], rgb(shadeOf([.5, .4, .24], matE)));
          c.strokeStyle = `rgba(40,26,12,${.28})`; c.lineWidth = Math.max(1, H / 1100);
          c.beginPath();
          for (let z = 1.98; z < 9.9; z += .16) addPolyLine([[a + .05, .005, z], [b - .05, .005, z]]);
          c.stroke();
          c.strokeStyle = 'rgba(30,18,8,.55)'; c.lineWidth = Math.max(1, H / 600);
          c.beginPath(); addPolyLine([[a + .05, .005, 1.92], [a + .05, .005, 9.88]]); addPolyLine([[b - .05, .005, 1.92], [b - .05, .005, 9.88]]); c.stroke();
        });
        // the rug at the head of the room
        const rg = st.rug;
        for (let v = 0; v < rg.nv; v++) for (let u = 0; u < rg.nu; u++) {
          const x0 = mix(rg.x0, rg.x1, u / rg.nu), x1 = mix(rg.x0, rg.x1, (u + 1) / rg.nu), z0 = mix(rg.z0, rg.z1, v / rg.nv), z1 = mix(rg.z0, rg.z1, (v + 1) / rg.nv);
          const e = lit((x0 + x1) / 2, .01, (z0 + z1) / 2, 0, 1, 0).map((q) => q * .55);
          const cc = rgb(shadeOf(rg.col[v * rg.nu + u], e));
          c.beginPath(); if (addPoly([[x0, .008, z0], [x1, .008, z0], [x1, .008, z1], [x0, .008, z1]])) { c.fillStyle = cc; c.fill(); c.strokeStyle = cc; c.lineWidth = 1; c.stroke(); }
        }
        // the cloth of the meal: an oval of tanned leather with a stitched rim
        const ring = (rx, rz, y, n = 40) => Array.from({ length: n }, (_, k) => { const a = k / n * TAU; return [Math.sin(a) * rx, y, RING[1] + Math.cos(a) * rz]; });
        fillPoly(ring(1.75, 1.18, .009), rgb(shadeOf([.34, .19, .11], lit(0, .01, RING[1], 0, 1, 0).map((v) => v * .6))));
        fillPoly(ring(1.62, 1.08, .01), rgb(shadeOf([.46, .28, .16], lit(0, .01, RING[1], 0, 1, 0).map((v) => v * .6))));
        // bread rounds lie flat on the cloth
        st.bread.forEach(([x, z, rr, v]) => {
          if (p > .34 && v < .55 * c01((p - .34) / .1)) return; // some of the bread is eaten as the meal goes on
          disc(x, z, rr, .02, [.62, .42, .22], [.72, .52, .3]);
        });
      }
      // a short cylinder standing on the floor: its silhouette, then its top
      function disc(x, z, rr, h, side, top, inner, n = 22) {
        const ptsB = [], ptsT = [];
        const vx = px - x, vz = pz - z;
        for (let k = 0; k < n; k++) { const a = k / n * TAU, ox = Math.sin(a) * rr, oz = Math.cos(a) * rr; ptsB.push([x + ox, .005, z + oz, ox * vx + oz * vz > 0]); ptsT.push([x + ox, h, z + oz]); }
        const sil = ptsB.map((b, k) => (b[3] ? b : ptsT[k]));
        const e = lit(x, h, z, 0, 1, 0);
        fillPoly(sil, rgb(shadeOf(side, e.map((v) => v * .5))));
        fillPoly(ptsT, rgb(shadeOf(top, e)));
        if (inner) fillPoly(ptsT.map(([a, b2, d]) => [x + (a - x) * .8, b2 - .005, z + (d - z) * .8]), rgb(shadeOf(inner, e.map((v) => v * .8))));
      }
      function bowl([x, z, rr, milk]) { disc(x, z, rr, .085, [.3, .18, .1], [.42, .26, .14], milk ? [.95, .92, .84] : [.4, .24, .12]); }
      function platter() {
        const x = 0, z = RING[1];
        disc(x, z, .56, .07, [.42, .26, .12], [.58, .38, .18], [.5, .32, .16], 32);
        // the tharid mounded in it, pieces of meat on top; steam while the meal is hot
        const e = lit(x, .15, z, 0, 1, 0);
        const q = sc(x, .1, z); if (!q) return;
        const mound = [];
        for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; mound.push([x + Math.sin(a) * .38, .09, z + Math.cos(a) * .36]); }
        fillPoly(mound, rgb(shadeOf([.55, .36, .18], e)));
        st.meat.forEach(([ox, oz, rr]) => { const m = sc(x + ox, .12, z + oz); if (!m) return; const s = F / m[2]; c.fillStyle = rgb(shadeOf([.42, .2, .12], e)); c.beginPath(); c.ellipse(m[0], m[1], rr * s, rr * s * .55, 0, 0, TAU); c.fill(); c.fillStyle = rgb(shadeOf([.6, .36, .2], e)); c.beginPath(); c.ellipse(m[0] - rr * s * .2, m[1] - rr * s * .2, rr * s * .5, rr * s * .25, 0, 0, TAU); c.fill(); });
        if (meal > .7) { // steam off the hot dish
          c.globalCompositeOperation = 'lighter';
          const k0 = (meal - .65) / .35;
          for (let k = 0; k < 10; k++) {
            const u = ((t * .12 + k / 10) % 1), m = sc(x + .12 * Math.sin(k * 2.1 + u * 3), .12 + u * .9, z + .1 * Math.cos(k * 1.3)); if (!m) continue;
            const R = (.08 + .22 * u) * F / m[2];
            halo(m[0], m[1], R, st.pale, .05 * k0 * Math.sin(Math.PI * u));
          }
          c.globalCompositeOperation = 'source-over';
        }
      }
      function box(b) {
        const faces = [];
        if (px > b.x1) faces.push([[b.x1, b.y0, b.z0], [b.x1, b.y0, b.z1], [b.x1, b.y1, b.z1], [b.x1, b.y1, b.z0]], [1, 0, 0]);
        if (px < b.x0) faces.push([[b.x0, b.y0, b.z0], [b.x0, b.y1, b.z0], [b.x0, b.y1, b.z1], [b.x0, b.y0, b.z1]], [-1, 0, 0]);
        if (pz > b.z1) faces.push([[b.x0, b.y0, b.z1], [b.x0, b.y1, b.z1], [b.x1, b.y1, b.z1], [b.x1, b.y0, b.z1]], [0, 0, 1]);
        if (pz < b.z0) faces.push([[b.x0, b.y0, b.z0], [b.x1, b.y0, b.z0], [b.x1, b.y1, b.z0], [b.x0, b.y1, b.z0]], [0, 0, -1]);
        if (py > b.y1) faces.push([[b.x0, b.y1, b.z0], [b.x1, b.y1, b.z0], [b.x1, b.y1, b.z1], [b.x0, b.y1, b.z1]], [0, 1, 0]);
        for (let k = 0; k < faces.length; k += 2) {
          const f = faces[k], n = faces[k + 1];
          const cx2 = (f[0][0] + f[2][0]) / 2, cy2 = (f[0][1] + f[2][1]) / 2, cz2 = (f[0][2] + f[2][2]) / 2;
          fillPoly(f, rgb(shadeOf(b.alb, lit(cx2, cy2, cz2, ...n).map((v) => v * (n[1] ? 1 : .8)))));
          if (b.bands && n[1]) { // woven bands across the top
            c.strokeStyle = 'rgba(200,160,90,.18)'; c.lineWidth = Math.max(1, H / 700); c.beginPath();
            const along = b.z1 - b.z0 > b.x1 - b.x0;
            for (let s = .2; s < (along ? b.z1 - b.z0 : b.x1 - b.x0); s += .35) addPolyLine(along ? [[b.x0, b.y1, b.z0 + s], [b.x1, b.y1, b.z0 + s]] : [[b.x0 + s, b.y1, b.z0], [b.x0 + s, b.y1, b.z1]]);
            c.stroke();
          }
        }
      }
      function column(x, z) {
        const a = sc(x, 0, z), b = sc(x, HT - .34, z); if (!a || !b) return;
        const rr = .17, w = rr * F / a[2], w2 = rr * F / b[2];
        // lit side: towards the strongest lights, in screen terms
        const eL = lit(x, 1.4, z, -cyw, 0, syw), eR = lit(x, 1.4, z, cyw, 0, -syw), eF = lit(x, 1.4, z, -syw, 0, -cyw);
        const g = c.createLinearGradient(a[0] - w, 0, a[0] + w, 0);
        const alb = [.42, .3, .2];
        g.addColorStop(0, rgb(shadeOf(alb, eL.map((v) => v * .7)))); g.addColorStop(.5, rgb(shadeOf(alb, eF))); g.addColorStop(1, rgb(shadeOf(alb, eR.map((v) => v * .7))));
        c.fillStyle = g;
        c.beginPath(); c.moveTo(a[0] - w, a[1]); c.lineTo(b[0] - w2, b[1]); c.lineTo(b[0] + w2, b[1]); c.lineTo(a[0] + w, a[1]); c.closePath(); c.fill();
        // the scars of the cut fronds wind up the trunk
        c.strokeStyle = 'rgba(20,12,6,.35)'; c.lineWidth = Math.max(1, .012 * F / a[2]);
        c.beginPath();
        for (let y = .1; y < HT - .4; y += .14) { const s1 = sc(x, y, z), s2 = sc(x, y + .07, z); if (!s1 || !s2) continue; const ww = rr * F / s1[2]; c.moveTo(s1[0] - ww, s1[1]); c.quadraticCurveTo(s1[0], s1[1] + ww * .25, s2[0] + ww, s2[1]); }
        c.stroke();
        // a stone base
        const ww = .24 * F / a[2], hh = Math.abs((sc(x, .18, z) || a)[1] - a[1]);
        c.fillStyle = rgb(shadeOf([.36, .3, .24], eF)); c.fillRect(a[0] - ww, a[1] - hh, ww * 2, hh);
      }
      function stand(x, z, i) {
        const a = sc(x, 0, z), b = sc(x, 1.36, z); if (!a || !b) return;
        const e = lit(x, .8, z, -syw, 0, -cyw), s = F / a[2];
        c.strokeStyle = rgb(shadeOf([.3, .2, .12], e)); c.lineWidth = Math.max(1, .04 * s);
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
        c.beginPath(); c.moveTo(a[0] - .18 * s, a[1]); c.lineTo(a[0], a[1] - .14 * s); c.lineTo(a[0] + .18 * s, a[1]); c.stroke();
        c.fillStyle = rgb(shadeOf([.36, .24, .14], e)); c.beginPath(); c.ellipse(b[0], b[1], .13 * s, .035 * s, 0, 0, TAU); c.fill();
        clayLamp(x - .05, 1.37, z, 1, L[NICHE.length + i], i + 10);
      }
      // the Prophet and Ali: veiled figures (scenes/holy.js) on their ground point, sheared like the men's billboards
      // so they keep the room's verticals; m is the standing height in metres, min the smallest readable px height
      function figure(who, x, z, m, min, o) {
        const a = sc(x, 0, z), b = sc(x, 1, z); if (!a || !b) return null;
        const kx = (b[0] - a[0]) / ((b[1] - a[1]) || -1), h = Math.max(min, m * Math.hypot(b[0] - a[0], b[1] - a[1]));
        c.setTransform(1, 0, kx, 1, -kx * a[1], 0);
        const hd = Holy.draw(c, { who, x: a[0], y: a[1], h, t, amb: famb, ...o });
        c.setTransform(1, 0, 0, 1, 0, 0);
        return hd && { x: hd.x + kx * (hd.y - a[1]), y: hd.y, r: hd.r };
      }
      // a seated man wrapped in his cloak, turban or headcloth; faceless. A billboard that keeps the room's verticals.
      function man(m) {
        const a = sc(m.x, 0, m.z), b = sc(m.x, 1, m.z); if (!a || !b) return;
        const s = F / a[2] * m.w * m.s, vx = (b[0] - a[0]) * m.s, vy = (b[1] - a[1]) * m.s;
        const eL = lit(m.x, .6, m.z, -cyw, 0, syw), eR = lit(m.x, .6, m.z, cyw, 0, -syw), eF = lit(m.x, .6, m.z, -syw, 0, -cyw), eB = lit(m.x, .7, m.z, syw, 0, cyw);
        c.setTransform(s, 0, vx + m.lean * s, vy, a[0], a[1]);
        const sw = m.sw, hs = m.hs, sy = .66 + m.hu, ny = sy + .05;
        const body = () => {
          c.beginPath();
          c.moveTo(-.4, 0);
          c.bezierCurveTo(-.47, .07, -.45, m.kl * .8, -.33, m.kl);
          c.bezierCurveTo(-.27, m.kl + .06, -.26, sy - .14, -sw - .015, sy - .04);
          c.bezierCurveTo(-sw + .01, sy + .01, -sw * .55, sy + .035, -.07, ny);
          c.quadraticCurveTo(-.06, ny + .03, -.065, ny + .06);
          c.lineTo(.065, ny + .06);
          c.quadraticCurveTo(.06, ny + .03, .07, ny);
          c.bezierCurveTo(sw * .55, sy + .035, sw - .01, sy + .01, sw + .015, sy - .04);
          c.bezierCurveTo(.26, sy - .14, .27, m.kr + .06, .33, m.kr);
          c.bezierCurveTo(.45, m.kr * .8, .47, .07, .4, 0);
          c.quadraticCurveTo(0, -.025, -.4, 0);
          c.closePath();
        };
        const shade3 = (alb, k = 1) => { const g = c.createLinearGradient(-.42, 0, .42, 0); g.addColorStop(0, rgb(shadeOf(alb, eL.map((v) => v * .7 * k)))); g.addColorStop(.5, rgb(shadeOf(alb, eF.map((v) => v * k)))); g.addColorStop(1, rgb(shadeOf(alb, eR.map((v) => v * .7 * k)))); return g; };
        body();
        c.fillStyle = shade3(m.cloak); c.fill();
        // the cloak darkens towards the floor; light from behind just catches its edge
        const vg = c.createLinearGradient(0, .55, 0, 0); vg.addColorStop(0, 'rgba(6,4,2,0)'); vg.addColorStop(1, 'rgba(6,4,2,.38)');
        c.fillStyle = vg; c.fill();
        const back = (eB[0] + eB[1]) * .5;
        if (back > .3) { c.strokeStyle = `rgba(255,196,130,${Math.min(.28, (back - .3) * .2).toFixed(3)})`; c.lineWidth = .014; c.stroke(); }
        // two soft folds from the shoulder into the lap
        c.strokeStyle = 'rgba(6,4,2,.2)'; c.lineWidth = .02;
        c.beginPath(); c.moveTo(-sw * .5 + m.fo[0], sy - .02); c.quadraticCurveTo(-.17 + m.fo[0], .38, -.12, .08); c.moveTo(sw * .45 + m.fo[1], sy - .03); c.quadraticCurveTo(.15 + m.fo[1], .34, .19, .1); c.stroke();
        // the head, wrapped
        c.beginPath();
        const hy = ny + .06 + hs * .95;
        if (m.turban) { // the wrapped turban sits on the head as one rounded mass
          c.moveTo(-hs * .78, hy - hs * 1.05);
          c.bezierCurveTo(-hs * 1.3, hy - hs * .4, -hs * 1.35, hy + hs * .75, -hs * .55, hy + hs * 1.12);
          c.bezierCurveTo(-hs * .2, hy + hs * 1.3, hs * .35, hy + hs * 1.28, hs * .62, hy + hs * 1.08);
          c.bezierCurveTo(hs * 1.35, hy + hs * .7, hs * 1.3, hy - hs * .4, hs * .78, hy - hs * 1.05);
          c.quadraticCurveTo(0, hy - hs * 1.25, -hs * .78, hy - hs * 1.05);
        } else {
          c.moveTo(-sw * .82, sy - .01); c.quadraticCurveTo(-hs * 1.25, sy + .05, -hs * 1.12, hy - hs * .1);
          c.bezierCurveTo(-hs * 1.15, hy + hs * 1.1, hs * 1.15, hy + hs * 1.1, hs * 1.12, hy - hs * .1);
          c.quadraticCurveTo(hs * 1.25, sy + .05, sw * .82, sy - .01); c.quadraticCurveTo(0, sy - .04, -sw * .82, sy - .01);
        }
        c.fillStyle = shade3(m.head, .9); c.fill();
        if (m.turban) { c.strokeStyle = 'rgba(6,4,2,.18)'; c.lineWidth = .01; c.beginPath(); c.moveTo(-hs * 1.1, hy + hs * .05); c.quadraticCurveTo(0, hy + hs * .55, hs * 1.05, hy + hs * .75); c.moveTo(-hs * 1.0, hy - hs * .45); c.quadraticCurveTo(0, hy + hs * .05, hs * 1.12, hy + hs * .2); c.stroke(); }
        c.setTransform(1, 0, 0, 1, 0, 0);
      }
      // ---------- the valley outside: stars, hills, the city's roofs, the Kaaba ----------
      function drawOutside() {
        const hz = CY + F * Math.tan(pitch);
        const sky = c.createLinearGradient(0, hz - F * .5, 0, hz);
        sky.addColorStop(0, '#04060f'); sky.addColorStop(.7, '#0a1024'); sky.addColorStop(1, '#1a1e30');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        // stars
        c.fillStyle = 'rgba(236,230,214,1)';
        const sz = Math.max(1, H / 900);
        st.stars.forEach((s) => {
          const d = [Math.cos(s.el) * Math.sin(s.az), Math.sin(s.el), Math.cos(s.el) * Math.cos(s.az)];
          const q = cs(px + d[0] * 1e4, py + d[1] * 1e4, pz + d[2] * 1e4); if (q[2] <= 0) return;
          const x = SX(q), y = SY(q); if (x < 0 || x > W || y < 0 || y > H) return;
          c.globalAlpha = Math.min(1, s.m * (.7 + .3 * Math.sin(t * 1.4 + s.ph)) * .8);
          c.fillRect(x, y, s.m > 1.2 ? 2 * sz : sz, s.m > 1.2 ? 2 * sz : sz);
        });
        c.globalAlpha = 1;
        // hills, far to near
        for (let k = st.hills.length - 1; k >= 0; k--) {
          const hl = st.hills[k];
          const q = hl.pts.map(([x, z, y]) => sc(x, y, z));
          if (q.some((v) => !v)) continue;
          c.beginPath(); c.moveTo(q[0][0], H * 3);
          q.forEach((v) => c.lineTo(v[0], v[1]));
          c.lineTo(q[q.length - 1][0], H * 3); c.closePath();
          c.fillStyle = ['#0b0e18', '#0e111b', '#121420'][k]; c.fill();
        }
        // the floor of the valley
        const gq = sc(KAABA.x, VAL, KAABA.z);
        if (gq) { c.fillStyle = '#0f0f12'; c.fillRect(0, gq[1] - F * .02, W, H); }
        // the open sanctuary round the House
        const san = []; for (let k = 0; k < 28; k++) { const a = k / 28 * TAU; san.push([KAABA.x + Math.sin(a) * 34, VAL, KAABA.z + Math.cos(a) * 34]); }
        fillPoly(san, '#4a4236');
        c.globalCompositeOperation = 'lighter';
        st.torches.forEach(([x, z, ph]) => { const q2 = sc(x, VAL + 1.4, z); if (q2) halo(q2[0], q2[1], 3.5 * F / q2[2], st.fire, .5 + .1 * Math.sin(t * 6 + ph)); });
        c.globalCompositeOperation = 'source-over';
        // houses and the Kaaba, far to near
        const list = st.houses.map((h) => [Math.hypot((h.x0 + h.x1) / 2 - px, (h.z0 + h.z1) / 2 - pz), h]);
        list.push([Math.hypot(KAABA.x - px, KAABA.z - pz), null]);
        list.sort((m, n) => n[0] - m[0]);
        list.forEach(([, h]) => (h ? house(h) : kaaba()));
        c.globalCompositeOperation = 'lighter';
        st.torches.forEach(([x, z, ph]) => { const q2 = sc(x, VAL + 1.6, z); if (q2) { c.fillStyle = 'rgba(255,200,120,.9)'; const s = Math.max(1.2, .3 * F / q2[2]); c.fillRect(q2[0] - s / 2, q2[1] - s, s, s * 1.5); } });
        c.globalCompositeOperation = 'source-over';
        // the two plank leaves, swung out into the night
        [[DOOR[0], -1], [DOOR[1], 1]].forEach(([hx0, sd]) => {
          const ang = 1.15, lw = (DOOR[1] - DOOR[0]) / 2, zz = Z1 + WT, ex = hx0 + sd * lw * Math.cos(ang), ez = zz + lw * Math.sin(ang);
          const el = lit(hx0, 1.2, zz, -sd, 0, 0).map((v) => v * .35);
          fillPoly([[hx0, .1, zz], [ex, .1, ez], [ex, DOOR[2] - .05, ez], [hx0, DOOR[2] - .05, zz]], rgb(shadeOf([.3, .2, .12], el)));
          c.strokeStyle = 'rgba(8,5,2,.55)'; c.lineWidth = Math.max(1, H / 900); c.beginPath();
          for (let k = 1; k < 4; k++) { const u = k / 4; addPolyLine([[mix(hx0, ex, u), .12, mix(zz, ez, u)], [mix(hx0, ex, u), DOOR[2] - .07, mix(zz, ez, u)]]); }
          [.5, 2.2].forEach((y) => addPolyLine([[hx0, y, zz], [ex, y, ez]]));
          c.stroke();
        });
        // the night air over the valley
        const hg = c.createLinearGradient(0, hz - F * .08, 0, hz + F * .2);
        hg.addColorStop(0, 'rgba(40,44,62,0)'); hg.addColorStop(.4, 'rgba(40,44,62,.22)'); hg.addColorStop(1, 'rgba(40,44,62,0)');
        c.fillStyle = hg; c.fillRect(0, 0, W, H);
      }
      function house(h) {
        const f = h.alb, top = [44 * f, 44 * f, 54 * f], fr = [22 * f, 21 * f, 28 * f], sd = [16 * f, 15 * f, 21 * f];
        if (pz < h.z0) fillPoly([[h.x0, h.y0, h.z0], [h.x1, h.y0, h.z0], [h.x1, h.y1, h.z0], [h.x0, h.y1, h.z0]], rgb(fr));
        if (px > h.x1) fillPoly([[h.x1, h.y0, h.z0], [h.x1, h.y0, h.z1], [h.x1, h.y1, h.z1], [h.x1, h.y1, h.z0]], rgb(sd));
        if (px < h.x0) fillPoly([[h.x0, h.y0, h.z0], [h.x0, h.y1, h.z0], [h.x0, h.y1, h.z1], [h.x0, h.y0, h.z1]], rgb(sd));
        if (py > h.y1) fillPoly([[h.x0, h.y1, h.z0], [h.x1, h.y1, h.z0], [h.x1, h.y1, h.z1], [h.x0, h.y1, h.z1]], rgb(top));
        if (h.lit && pz < h.z0) {
          const [u, v] = h.lit, x = mix(h.x0, h.x1, u), y = mix(h.y0 + 3, h.y1, v);
          const q = sc(x, y, h.z0 - .05); if (!q) return;
          const s = F / q[2];
          c.fillStyle = 'rgba(255,170,80,.85)'; c.fillRect(q[0], q[1], Math.max(1, .5 * s), Math.max(1, .8 * s));
          c.globalCompositeOperation = 'lighter'; halo(q[0], q[1], 3 * s, st.fire, .25); c.globalCompositeOperation = 'source-over';
        }
      }
      function kaaba() {
        const K = KAABA, ca = Math.cos(K.rot), sa = Math.sin(K.rot), y0 = VAL;
        const P = (u, y, v) => [K.x + u * ca + v * sa, y, K.z - u * sa + v * ca];
        const faces = [
          [[-K.hw, -K.hd], [K.hw, -K.hd], [0, -1]], [[K.hw, -K.hd], [K.hw, K.hd], [1, 0]], [[K.hw, K.hd], [-K.hw, K.hd], [0, 1]], [[-K.hw, K.hd], [-K.hw, -K.hd], [-1, 0]],
        ];
        faces.forEach(([A, B, n]) => {
          const nx = n[0] * ca + n[1] * sa, nz = -n[0] * sa + n[1] * ca;
          const mxp = (A[0] + B[0]) / 2, mzp = (A[1] + B[1]) / 2, M = P(mxp, 0, mzp);
          if ((px - M[0]) * nx + (pz - M[2]) * nz <= 0) return;
          const tone2 = .6 + .4 * Math.abs(nx);
          fillPoly([P(A[0], y0, A[1]), P(B[0], y0, B[1]), P(B[0], y0 + K.h, B[1]), P(A[0], y0 + K.h, A[1])], rgb([14 * tone2, 13 * tone2, 15 * tone2]));
          // the gold band of the kiswa
          fillPoly([P(A[0], y0 + K.h * .7, A[1]), P(B[0], y0 + K.h * .7, B[1]), P(B[0], y0 + K.h * .77, B[1]), P(A[0], y0 + K.h * .77, A[1])], `rgba(${(196 * tone2) | 0},${(156 * tone2) | 0},${(72 * tone2) | 0},1)`);
        });
        if (py > y0 + K.h) fillPoly([P(-K.hw, y0 + K.h, -K.hd), P(K.hw, y0 + K.h, -K.hd), P(K.hw, y0 + K.h, K.hd), P(-K.hw, y0 + K.h, K.hd)], 'rgb(24,24,30)');
        // the torches of the sanctuary catch its lower edge
        c.globalCompositeOperation = 'lighter';
        const q = sc(K.x, y0 + 1, K.z); if (q) halo(q[0], q[1], 30 * F / q[2], st.fire, .16);
        c.globalCompositeOperation = 'source-over';
      }
    },
  };
})();
