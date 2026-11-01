// في بيت عليّ وفاطمة: the one room of their house in Medina. Mud brick under palm-trunk beams and a roof of fronds,
// a doorway with a woollen curtain onto a small court with a well, a high window on the left. By day the camera goes
// round four corners of the room, each lit in turn: the waterskin dripping by the door, the hand quern turning with
// flour at its lip, the palm-frond broom sweeping in the shaft of sun, the pot on three stones over the fire. Fatima
// is a soft gold light beside each; the things move on their own. Then night in the same room: Ali's light comes
// home, the Prophet's light comes in at the door and sits between them, and a ring of a hundred beads on the
// sheepskin lights 34 + 33 + 33 in step with the counts on the page.
// World in metres: x right, y up, z from the front of the room to the back wall. Nobody is drawn; the three are lights.
(() => {
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mixc = (a, b, k) => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];
  const tone = (x) => 255 * (1 - Math.exp(-1.2 * x));
  const shadeOf = (alb, e) => [tone(alb[0] * e[0]), tone(alb[1] * e[1]), tone(alb[2] * e[2])];
  const nrm = (v) => { const n = Math.hypot(...v) || 1; return v.map((q) => q / n); };
  const bump = (p, a, b, f = .025) => smooth(seg(p, a - f, a)) * (1 - smooth(seg(p, b, b + f)));
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

  // ---------- the house ----------
  const X0 = -2.7, X1 = 2.7, Z0 = -2.4, Z1 = 3.4, HT = 2.5, WT = .5;
  const DOOR = [-1.95, -1.05, 1.92], DCX = -1.5; // x0, x1, height in the back wall
  const WIN = [.3, 1.0, 1.62, 2.1]; // z0, z1, y0, y1 in the left wall
  const SUNV = nrm([1, -1, .3]); // the sun's rays through the window
  const sunAt = (y, z) => { const k = y / -SUNV[1]; return [X0 + SUNV[0] * k, 0, z + SUNV[2] * k]; };
  const PATCH = [sunAt(WIN[2], WIN[0]), sunAt(WIN[2], WIN[1]), sunAt(WIN[3], WIN[1]), sunAt(WIN[3], WIN[0])];
  const PC = [(PATCH[0][0] + PATCH[2][0]) / 2, 0, (PATCH[0][2] + PATCH[2][2]) / 2];
  const QB = [-.62, Z1 - .2, 1.8]; // the waterskin: x, z, its peg
  const BASIN = [-.62, Z1 - .34], JAR = [.08, Z1 - .4];
  const QUERN = [-1.85, 2.15], BASKET = [-1.0, 2.95];
  const BROOM = [PC[0] + .05, PC[2] + .05];
  const HEARTH = [1.85, 2.6];
  const NICHE = [.95, 1.15];
  const BEAD = [.25, .4, .26];
  const WELL = [-4.3, 7.5], PALM = [-2.4, 10.6], CT = { x0: -8, x1: 4.6, z1: 12, h: 2.5 };
  const LABELS = ['استقت بالقربة', 'طحنت بالرحى', 'كسحت البيت', 'أوقدت تحت القدر'];
  // camera keys: [p, eye x, y, z, look x, y, z, zoom, screen x of the look point, its screen y (wide), (phone)]
  const CAM = [
    [-.05, 2.0, 1.65, -2.1, -.55, .85, 2.7, .98, .42, .52, .62],
    [.025, 1.85, 1.6, -1.8, -.6, .85, 2.7, 1.0, .42, .52, .62],
    [.065, .8, 1.45, .55, -.8, 1.05, 3.2, 1.0, .4, .5, .66],
    [.1, .7, 1.4, .8, -.8, 1.0, 3.2, 1.04, .4, .5, .66],
    [.145, -1.2, 1.25, .2, -1.85, .2, 2.15, 1.0, .4, .58, .7],
    [.18, -1.3, 1.12, .4, -1.85, .18, 2.15, 1.06, .4, .58, .7],
    [.225, .95, 1.55, -1.15, -1.0, .7, 1.05, 1.0, .4, .52, .66],
    [.26, .85, 1.45, -1.0, -1.0, .65, 1.1, 1.03, .4, .52, .66],
    [.305, .25, 1.15, .75, 1.85, .55, 2.65, 1.0, .38, .56, .62],
    [.34, .38, 1.05, .95, 1.85, .5, 2.65, 1.05, .38, .56, .62],
    [.42, 1.45, 1.45, -1.65, -.45, .75, 2.2, 1.0, .42, .52, .54],
    [.52, 1.3, 1.35, -1.35, -.3, .7, 2.0, 1.0, .42, .52, .54],
    [.6, 1.15, 1.3, -1.25, .2, .3, .8, 1.0, .42, .58, .66],
    [.87, 1.0, 1.18, -1.0, .22, .26, .75, 1.06, .42, .58, .66],
    [.95, .95, 1.75, -1.55, .25, .22, .7, 1.0, .5, .38, .38],
    [1.05, .95, 1.8, -1.6, .25, .22, .7, 1.0, .5, .38, .38],
  ];
  // Fatima's light beside each task in turn, then at the sheepskin for the night
  const FAT = [
    [-.05, -1.05, .82, 2.85], [.035, -1.05, .82, 2.85], [.1, -1.1, .84, 2.9],
    [.125, -1.4, .5, 2.12], [.185, -1.4, .5, 2.12],
    [.205, -.42, .76, 1.62], [.265, -.42, .76, 1.62],
    [.285, 1.22, .52, 2.85], [.345, 1.22, .52, 2.85],
    [.39, -.14, .5, .36], [1.05, -.14, .5, .36],
  ];
  // Ali's light comes home at dusk; the Prophet's light comes in at the door after it
  const ALI = [[.33, -3.6, 1.0, 8.4], [.36, -1.5, .98, 3.9], [.385, -.4, .82, 1.85], [.41, .66, .52, .36], [1.05, .66, .52, .36]];
  const PRO = [[.4, -3.9, 1.15, 9.2], [.44, -1.5, 1.1, 3.9], [.47, -.45, .98, 1.9], [.5, .28, .62, .84], [1.05, .28, .62, .84]];
  const GROUPS = [[0, 34, .56], [34, 67, .67], [67, 100, .78]];
  const BCOL = [[255, 214, 130], [121, 201, 162], [236, 226, 204]];

  S.bayt = {
    init(el, st) {
      st.cv = el.querySelector('canvas');
      st.ctx = st.cv.getContext('2d');
      const r = rng(1122);
      st.lampPool = pool(255, 158, 82);
      st.firePool = pool(255, 128, 58);
      st.dayPool = pool(255, 226, 184);
      st.palePool = pool(255, 222, 176);
      st.skyPool = pool(110, 140, 210);
      st.soot = sprite([[0, 'rgba(12,8,5,.8)'], [.5, 'rgba(12,8,5,.38)'], [1, 'rgba(12,8,5,0)']], 128);
      st.shadow = sprite([[0, 'rgba(8,5,3,.62)'], [.5, 'rgba(8,5,3,.3)'], [1, 'rgba(8,5,3,0)']], 64);
      st.glow = sprite([[0, 'rgba(255,255,255,1)'], [.18, 'rgba(255,255,255,.55)'], [.45, 'rgba(255,255,255,.16)'], [1, 'rgba(255,255,255,0)']]);
      st.pale = sprite([[0, 'rgba(255,246,222,1)'], [.2, 'rgba(255,236,196,.5)'], [.55, 'rgba(240,214,160,.12)'], [1, 'rgba(240,214,160,0)']]);
      st.gold = sprite([[0, 'rgba(255,240,200,1)'], [.2, 'rgba(250,214,140,.5)'], [.55, 'rgba(230,180,100,.12)'], [1, 'rgba(230,180,100,0)']]);
      st.fire = sprite([[0, 'rgba(255,214,150,1)'], [.25, 'rgba(255,150,60,.5)'], [.6, 'rgba(220,90,30,.12)'], [1, 'rgba(200,70,20,0)']]);
      st.smoke = sprite([[0, 'rgba(150,132,116,.5)'], [.5, 'rgba(136,120,104,.22)'], [1, 'rgba(120,106,94,0)']], 64);
      st.dust = sprite([[0, 'rgba(236,214,170,.55)'], [.5, 'rgba(226,200,160,.2)'], [1, 'rgba(220,196,150,0)']], 64);
      st.beadG = BCOL.map(([a, b, d]) => sprite([[0, `rgba(${a},${b},${d},1)`], [.3, `rgba(${a},${b},${d},.35)`], [1, `rgba(${a},${b},${d},0)`]], 64));
      st.noise = document.createElement('canvas');
      st.noise.width = st.noise.height = 160;
      { const ng = st.noise.getContext('2d'), id = ng.createImageData(160, 160);
        for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 22; }
        ng.putImageData(id, 0, 0); }
      st.motes = Array.from({ length: 240 }, () => [r(), r(), r(), r() * 9, .3 + r() * .7]); // along the shaft, across it twice, phase, brightness
      st.air = Array.from({ length: 110 }, () => [X0 + .3 + r() * 5, .3 + r() * 1.9, -1 + r() * 4, r() * 9, .3 + r() * .7]);
      st.marks = Array.from({ length: 60 }, () => [.06 + r() * .17, r() * TAU, .015 + r() * .03, (r() - .5) * 1.2]);
      st.fall = Array.from({ length: 46 }, () => [r() * TAU, r(), .6 + r() * .8]);
      st.grain = Array.from({ length: 80 }, () => { const a = r() * TAU, d = Math.sqrt(r()) * .12; return [Math.cos(a) * d, Math.sin(a) * d, r()]; });
      st.stars = Array.from({ length: 420 }, () => { const az = (r() - .5) * 1.4, e = .03 + r() * .9; return [Math.sin(az) * Math.cos(e), Math.sin(e), Math.cos(az) * Math.cos(e), r()]; });
      st.edge = (() => { const e = Array.from({ length: 48 }, () => .9 + r() * .16); return e.map((v, i) => (e[(i + 47) % 48] + 2 * v + e[(i + 1) % 48]) / 4); })(); // the sheepskin's ragged edge
      st.tufts = Array.from({ length: 120 }, () => { const a = r() * TAU, d = Math.sqrt(r()) * .92; return [Math.cos(a) * d, Math.sin(a) * d, r()]; });
      st.far = Array.from({ length: 12 }, () => [(r() - .5) * 26, 16 + r() * 22, 7 + r() * 5, r() * TAU]);
      st.mottle = Array.from({ length: 14 }, () => [X0 + .4 + r() * 4.6, Z0 + 1.4 + r() * 3.6, .5 + r() * 1.1, .12 + r() * .2]);
      st.stones = [0, 1, 2].map((k) => { const a = k / 3 * TAU + .5; return [HEARTH[0] + Math.cos(a) * .17, HEARTH[1] + Math.sin(a) * .17, .07 + r() * .02]; });
    },

    frame(p, t, el, st) {
      fit(st.cv);
      const c = st.ctx, W = st.cv.width, H = st.cv.height;
      const phone = st.cv.clientWidth < 700;
      const pc = Math.min(1.05, Math.max(-.05, p));
      let [px, py, pz, tx, ty, tz, zoom, sxk, syk, syp] = spline(CAM, pc);
      if (phone) { const k = 1 - .26 * (1 - smooth(seg(p, .35, .42))); px = tx + (px - tx) * k; py = ty + (py - ty) * k; pz = tz + (pz - tz) * k; syp += .06 * smooth(seg(p, .88, .95)); }
      const dx0 = tx - px, dy0 = ty - py, dz0 = tz - pz;
      const yaw = Math.atan2(dx0, dz0), pitch = Math.atan2(dy0, Math.hypot(dx0, dz0));
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const F = (phone ? W * 1.3 : Math.min(H * .98, W * .62)) * zoom;
      const CX = W * (phone ? .5 : sxk), CY = H * (phone ? syp : syk);
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
      const px1 = Math.max(1, H / 900);

      // ---------- beats ----------
      const night = smooth(seg(p, .34, .46)), day = 1 - night, dusk = Math.sin(Math.PI * seg(p, .3, .52));
      const w = [bump(p, .04, .11), bump(p, .12, .19), bump(p, .2, .27), bump(p, .28, .35)];
      const fireI = mix(1, .42, smooth(seg(p, .4, .55))), lampOn = smooth(seg(p, .37, .41));
      const done = smooth(seg(p, .88, .94));
      const fp = spline(FAT, pc), ap = spline(ALI, pc), pp = spline(PRO, pc);
      const aliA = smooth(seg(p, .33, .35)), proA = smooth(seg(p, .4, .425));
      const theta = p * 46 + t * .7 * (.3 + w[1]); // the upper stone turns with the scroll, and slowly on its own
      const sweep = p * 120 + t * 2.4 * w[2]; // the broom's strokes
      const beadK = (i) => { const [g0, g1, a0] = GROUPS.find(([a, b]) => i >= a && i < b); const a = a0 + ((i - g0) / (g1 - g0)) * .09; return smooth(seg(p, a, a + .012)); };
      let litN = 0; for (let i = 0; i < 100; i++) litN += beadK(i);

      // ---------- lights ----------
      const fl = (ph, k = 1) => .86 + .14 * k * Math.sin(t * 7.3 + ph) * Math.sin(t * 4.1 + ph * 2.1);
      const L = [];
      L.push({ x: DCX, y: 1.15, z: Z1 + .3, c: mixc(mixc([1, .9, .74], [1, .7, .45], dusk * day), [.34, .44, .8], night), i: mix(2.2, .45, night) + .7 * w[0], r2: 5, k: night > .5 ? 'sky' : 'day' });
      L.push({ x: PC[0], y: .3, z: PC[2], c: [1, .86, .62], i: day * (.9 + .6 * w[2]), r2: .9, k: 'day' });
      L.push({ x: HEARTH[0], y: .32, z: HEARTH[1], c: [1, .55, .22], i: (.9 + .9 * w[3]) * fireI * fl(1.3, 2), r2: 2.4, k: 'fire' });
      L.push({ x: NICHE[0], y: NICHE[1] + .05, z: Z1 - .2, c: [1, .58, .26], i: 1.25 * lampOn * fl(4.1), r2: 2.2, k: 'lamp' });
      L.push({ x: fp[0], y: fp[1], z: fp[2], c: [1, .86, .62], i: .55 + .4 * night, r2: 1.1, k: 'holy' });
      if (aliA > 0) L.push({ x: ap[0], y: ap[1], z: ap[2], c: [1, .84, .58], i: .85 * aliA, r2: 1.3, k: 'holy', out: ap[2] > Z1 });
      if (proA > 0) L.push({ x: pp[0], y: pp[1], z: pp[2], c: [1, .92, .78], i: (1.5 + .6 * done) * proA, r2: 2.4, k: 'holy', out: pp[2] > Z1 });
      if (litN > 0) L.push({ x: BEAD[0], y: .12, z: BEAD[1], c: [1, .86, .6], i: .003 * litN + .2 * done, r2: .5, k: 'holy' });
      const AMB = mixc([.1, .082, .064], [.022, .026, .044], night);
      const lit = (x, y, z, nx, ny, nz) => {
        let R = AMB[0], G = AMB[1], B = AMB[2];
        for (let k = 0; k < L.length; k++) {
          const l = L[k]; if (l.out) continue;
          const ddx = l.x - x, ddy = l.y - y, ddz = l.z - z, d2 = ddx * ddx + ddy * ddy + ddz * ddz, d = Math.sqrt(d2) || 1;
          const lam = ((nx * ddx + ny * ddy + nz * ddz) / d + .25) / 1.25;
          if (lam <= 0) continue;
          const e = l.i * lam / (1 + d2 / l.r2);
          R += l.c[0] * e; G += l.c[1] * e; B += l.c[2] * e;
        }
        return [R, G, B];
      };

      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
      c.fillStyle = '#0a0705'; c.fillRect(0, 0, W, H);

      // ---------- outside: the court through the door, the sky through the window ----------
      const doorPts = [[DOOR[0], 0, Z1], [DOOR[1], 0, Z1], [DOOR[1], DOOR[2], Z1], [DOOR[0], DOOR[2], Z1]];
      const winPts = [[X0, WIN[2], WIN[0]], [X0, WIN[2], WIN[1]], [X0, WIN[3], WIN[1]], [X0, WIN[3], WIN[0]]];
      c.save(); c.beginPath(); if (addPoly(doorPts)) { c.clip(); court(); } c.restore();
      c.save(); c.beginPath(); if (addPoly(winPts)) { c.clip(); const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgb(mixc(mixc([255, 246, 226], [255, 200, 140], dusk), [20, 28, 56], night))); g.addColorStop(1, rgb(mixc(mixc([250, 228, 190], [240, 150, 90], dusk), [12, 16, 36], night))); c.fillStyle = g; c.fillRect(0, 0, W, H); } c.restore();
      // the reveals: the thickness of the wall at the door and the window
      { const e1 = lit(DOOR[0], 1, Z1 + .2, 1, 0, 0), e2 = lit(DOOR[1], 1, Z1 + .2, -1, 0, 0), e3 = lit(DCX, DOOR[2], Z1 + .2, 0, -1, 0), out = mixc([.9, .82, .7], [.12, .15, .26], night);
        [[DOOR[0], e1, .7], [DOOR[1], e2, .5]].forEach(([dx, e, k]) => {
          const a = sc(dx, 1, Z1), b = sc(dx, 1, Z1 + WT), inner = shadeOf([.6, .46, .32], e.map((v, j) => v * .4 + out[j] * k * .3)), outer = shadeOf([.6, .46, .32], e.map((v, j) => v * .4 + out[j] * k));
          let st2 = rgb(outer); if (a && b) { const g = c.createLinearGradient(a[0], a[1], b[0], b[1]); g.addColorStop(0, rgb(inner)); g.addColorStop(1, rgb(outer)); st2 = g; }
          fillPoly([[dx, 0, Z1], [dx, 0, Z1 + WT], [dx, DOOR[2], Z1 + WT], [dx, DOOR[2], Z1]], st2);
        });
        fillPoly([[DOOR[0], DOOR[2], Z1], [DOOR[1], DOOR[2], Z1], [DOOR[1], DOOR[2], Z1 + WT], [DOOR[0], DOOR[2], Z1 + WT]], rgb(shadeOf([.4, .28, .18], e3.map((v) => v * .5))));
        fillPoly([[DOOR[0], 0, Z1], [DOOR[1], 0, Z1], [DOOR[1], 0, Z1 + WT], [DOOR[0], 0, Z1 + WT]], rgb(shadeOf([.6, .48, .34], out)));
        const sun = mixc([1.3, 1.15, .9], [.1, .12, .2], night);
        fillPoly([[X0, WIN[2], WIN[0]], [X0, WIN[2], WIN[1]], [X0 - WT, WIN[2], WIN[1]], [X0 - WT, WIN[2], WIN[0]]], rgb(shadeOf([.62, .48, .34], sun)));
        fillPoly([[X0, WIN[2], WIN[1]], [X0, WIN[3], WIN[1]], [X0 - WT, WIN[3], WIN[1]], [X0 - WT, WIN[2], WIN[1]]], rgb(shadeOf([.6, .46, .32], sun.map((v) => v * .6))));
        fillPoly([[X0, WIN[2], WIN[0]], [X0, WIN[3], WIN[0]], [X0 - WT, WIN[3], WIN[0]], [X0 - WT, WIN[2], WIN[0]]], rgb(shadeOf([.6, .46, .32], sun.map((v) => v * .35))));
        fillPoly([[X0, WIN[3], WIN[0]], [X0, WIN[3], WIN[1]], [X0 - WT, WIN[3], WIN[1]], [X0 - WT, WIN[3], WIN[0]]], rgb(shadeOf([.36, .26, .16], sun.map((v) => v * .2))));
        // two palm sticks across the window
        c.strokeStyle = rgb(shadeOf([.3, .2, .12], AMB.map((v) => v * 4))); c.lineWidth = Math.max(1, .03 * F / Math.max(.5, (sc(X0, 1.85, .65) || [0, 0, 3])[2]));
        c.beginPath(); [.53, .77].forEach((z) => addLine([X0 - .1, WIN[2], z], [X0 - .1, WIN[3], z])); c.stroke(); }

      // ---------- the room shell: walls, floor and roof, then the light on them ----------
      const SURF = [
        { n: [0, 0, -1], o: [0, 0, Z1], u: [1, 0, 0], v: [0, 1, 0], pts: [[X0, 0, Z1], [X1, 0, Z1], [X1, HT, Z1], [X0, HT, Z1]], hole: doorPts, alb: [.64, .49, .34], side: 'b' },
        { n: [0, 0, 1], o: [0, 0, Z0], u: [1, 0, 0], v: [0, 1, 0], pts: [[X0, 0, Z0], [X0, HT, Z0], [X1, HT, Z0], [X1, 0, Z0]], alb: [.64, .49, .34], side: 'f' },
        { n: [1, 0, 0], o: [X0, 0, 0], u: [0, 0, 1], v: [0, 1, 0], pts: [[X0, 0, Z0], [X0, 0, Z1], [X0, HT, Z1], [X0, HT, Z0]], hole: winPts, alb: [.62, .48, .33], side: 'l' },
        { n: [-1, 0, 0], o: [X1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], pts: [[X1, 0, Z0], [X1, HT, Z0], [X1, HT, Z1], [X1, 0, Z1]], alb: [.62, .48, .33], side: 'r' },
        { n: [0, 1, 0], o: [0, 0, 0], u: [1, 0, 0], v: [0, 0, 1], pts: [[X0, 0, Z0], [X1, 0, Z0], [X1, 0, Z1], [X0, 0, Z1]], alb: [.44, .33, .22], floor: true },
        { n: [0, -1, 0], o: [0, HT, 0], u: [1, 0, 0], v: [0, 0, 1], pts: [[X0, HT, Z0], [X0, HT, Z1], [X1, HT, Z1], [X1, HT, Z0]], alb: [.36, .27, .17], roof: true },
      ];
      const poolOf = (l) => (l.k === 'lamp' ? st.lampPool : l.k === 'fire' ? st.firePool : l.k === 'day' ? st.dayPool : l.k === 'sky' ? st.skyPool : st.palePool);
      const glowOn = (s, l, gain) => {
        if (l.out) return;
        const d = (l.x - s.o[0]) * s.n[0] + (l.y - s.o[1]) * s.n[1] + (l.z - s.o[2]) * s.n[2];
        if (d <= 0) return;
        const dd = Math.max(d, .5), R = 1 + 3.4 * dd;
        planeSprite([l.x - s.n[0] * d, l.y - s.n[1] * d, l.z - s.n[2] * d], s.u, s.v, R, poolOf(l), gain * l.i / (.5 + dd * dd));
      };
      SURF.forEach((s) => {
        c.beginPath();
        if (!addPoly(s.pts)) return;
        if (s.hole) addPoly([...s.hole].reverse());
        const base = AMB.map((v) => v * (s.floor ? 1.5 : 1.7));
        c.fillStyle = rgb(shadeOf(s.alb, base));
        c.fill('evenodd');
        c.save(); c.clip('evenodd');
        if (s.roof) roofMat(); else if (!s.floor) wallDetails(s);
        c.globalCompositeOperation = 'lighter';
        L.forEach((l) => glowOn(s, l, s.floor ? .4 : s.roof ? .22 : l.k === 'day' ? .5 : .56));
        c.globalCompositeOperation = 'source-over';
        if (s.side === 'b') planeSprite([HEARTH[0] - .1, 1.75, Z1 - .01], [1, 0, 0], [0, 1, 0], 1.1, st.soot, .2 + .35 * smooth(seg(p, .26, .36)));
        if (s.side === 'r') planeSprite([X1 - .01, 1.8, HEARTH[1] + .1], [0, 0, 1], [0, 1, 0], 1.0, st.soot, .15 + .3 * smooth(seg(p, .26, .36)));
        if (s.floor) floorDetails();
        if (!s.floor && !s.roof) { // dark gathers under the roof
          const wx = s.n[0] ? s.o[0] : Math.min(X1, Math.max(X0, px)), wz = s.n[0] ? Math.min(Z1, Math.max(Z0, pz + 3)) : s.o[2];
          const a = sc(wx, HT, wz), b = sc(wx, 1.5, wz);
          if (a && b) { const g = c.createLinearGradient(a[0], a[1], b[0], b[1]); g.addColorStop(0, 'rgba(10,6,3,.55)'); g.addColorStop(1, 'rgba(10,6,3,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
        }
        c.restore();
      });
      beams();

      // ---------- the sun through the window: its patch on the floor (the shaft itself comes later, in the air) ----------
      const shaftA = day * (.55 + .45 * w[2]) * (1 - .4 * dusk);
      if (shaftA > .01) {
        c.globalCompositeOperation = 'lighter';
        fillPoly(PATCH.map(([x, , z]) => [x, .003, z]), `rgba(255,214,150,${(.32 * shaftA).toFixed(3)})`);
        planeSprite([PC[0], .004, PC[2]], [1, 0, 0], [0, 0, 1], .9, st.dayPool, .5 * shaftA);
        c.globalCompositeOperation = 'source-over';
      }

      // ---------- upright things, far to near ----------
      const items = [];
      const dist = (x, z, y = .4) => cs(x, y, z)[2];
      items.push([dist(JAR[0], JAR[1]), () => lathe(JAR[0], JAR[1], [[0, .14], [.12, .24], [.32, .27], [.52, .2], [.62, .1], [.66, .11]], [.5, .3, .18], { open: 1 })]);
      items.push([dist(BASIN[0], BASIN[1]) + .05, () => basin()]);
      items.push([dist(QB[0], QB[1], 1.3), () => waterskin()]);
      items.push([dist(QUERN[0], QUERN[1]), () => quern()]);
      items.push([dist(BASKET[0], BASKET[1]), () => { lathe(BASKET[0], BASKET[1], [[0, .15], [.16, .18], [.2, .185]], [.62, .48, .28], { open: 1, fill: shadeOf([.82, .62, .3], lit(BASKET[0], .2, BASKET[1], 0, 1, 0)) }); weave(BASKET[0], BASKET[1], .18, .2); }]);
      items.push([dist(BROOM[0], BROOM[1]), () => broom()]);
      items.push([dist(HEARTH[0], HEARTH[1]), () => hearth()]);
      items.push([dist(1.95, -.9), () => bolster(1.95, -.9)]);
      items.sort((a, b) => b[0] - a[0]);
      for (const [d, fn] of items) if (d > NEAR) fn();

      // ---------- the air: shaft, smoke, motes, lamp and fire halos ----------
      if (shaftA > .01) shaft(shaftA);
      smoke();
      c.globalCompositeOperation = 'lighter';
      L.forEach((l) => {
        if (l.k !== 'lamp' && l.k !== 'fire') return;
        const q = sc(l.x, l.y + .06, l.z); if (!q) return;
        halo(q[0], q[1], Math.min(H * .3, (l.k === 'fire' ? 1.1 : .6) * F / q[2]), st.fire, (l.k === 'fire' ? .32 : .3) * l.i);
      });
      c.fillStyle = 'rgba(255,214,160,1)';
      st.air.forEach(([x0, y0, z0, ph, m]) => { // dust turning slowly in the room
        const x = x0 + .25 * Math.sin(t * .13 + ph), y = y0 + .2 * Math.sin(t * .09 + ph * 2), z = z0 + .2 * Math.cos(t * .11 + ph);
        const q = sc(x, y, z); if (!q || q[2] > 9) return;
        let e = 0; for (const l of L) { if (l.out || l.k === 'sky') continue; const d2 = (l.x - x) ** 2 + (l.y - y) ** 2 + (l.z - z) ** 2; e += l.i / (1 + d2 / .7); }
        const a = Math.min(.45, e * .1 * m); if (a < .03) return;
        const s = Math.max(1, .01 * F / q[2]); c.globalAlpha = a; c.fillRect(q[0], q[1], s, s);
      });
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';

      // ---------- the three lights ----------
      holy(fp, .15, st.gold, 1, false);
      if (aliA > 0) holy(ap, .16, st.gold, aliA, ap[2] > Z1);
      if (proA > 0) holy(pp, .25, st.pale, proA * (1 + .3 * done), pp[2] > Z1);

      // ---------- the labels of the four tasks ----------
      labels();

      // ---------- grade ----------
      c.globalCompositeOperation = 'overlay';
      c.fillStyle = c.createPattern(st.noise, 'repeat');
      c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      const vg = c.createRadialGradient(CX, CY, Math.min(W, H) * .22, CX, CY, Math.hypot(W, H) * .66);
      vg.addColorStop(0, 'rgba(5,3,2,0)'); vg.addColorStop(1, `rgba(5,3,2,${(.42 + .18 * night).toFixed(3)})`);
      c.fillStyle = vg; c.fillRect(0, 0, W, H);

      // ================= helpers (closures over this frame) =================
      function halo(x, y, R, img, a) {
        if (a <= .01 || x + R < 0 || x - R > W || y + R < 0 || y - R > H) return;
        c.globalAlpha = Math.min(1, a); c.drawImage(img, x - R, y - R, R * 2, R * 2); c.globalAlpha = 1;
      }
      // a radial sprite laid on a plane through O spanned by unit vectors U, V (affine about the centre); a pool that runs
      // up to the lens, or is too foreshortened for one affine map, would smear toward the camera, so it shrinks until it fits
      function planeSprite(O, U, V, R, img, a) {
        if (a <= .004) return;
        const pa = sc(O[0] + U[0] * R, O[1] + U[1] * R, O[2] + U[2] * R), pb = sc(O[0] - U[0] * R, O[1] - U[1] * R, O[2] - U[2] * R);
        const pc2 = sc(O[0] + V[0] * R, O[1] + V[1] * R, O[2] + V[2] * R), pd = sc(O[0] - V[0] * R, O[1] - V[1] * R, O[2] - V[2] * R);
        if (!pa || !pb || !pc2 || !pd || Math.min(pa[2], pb[2], pc2[2], pd[2]) < .4 || Math.max(pa[2], pb[2], pc2[2], pd[2]) > 3 * Math.min(pa[2], pb[2], pc2[2], pd[2])) { if (R > .3) planeSprite(O, U, V, R * .6, img, a * .8); return; }
        const ux = (pa[0] - pb[0]) / 2, uy = (pa[1] - pb[1]) / 2, vx = (pc2[0] - pd[0]) / 2, vy = (pc2[1] - pd[1]) / 2;
        if (Math.abs(ux) + Math.abs(uy) > W * 6) return;
        c.globalAlpha = Math.min(1, a);
        c.setTransform(ux, uy, vx, vy, (pa[0] + pb[0] + pc2[0] + pd[0]) / 4, (pa[1] + pb[1] + pc2[1] + pd[1]) / 4);
        c.drawImage(img, -1, -1, 2, 2);
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.globalAlpha = 1;
      }
      function addLine(a3, b3) {
        let a = cs(...a3), b = cs(...b3);
        if (a[2] <= NEAR && b[2] <= NEAR) return false;
        if (a[2] <= NEAR) { const k = (NEAR - a[2]) / (b[2] - a[2]); a = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, NEAR]; }
        if (b[2] <= NEAR) { const k = (NEAR - b[2]) / (a[2] - b[2]); b = [b[0] + (a[0] - b[0]) * k, b[1] + (a[1] - b[1]) * k, NEAR]; }
        c.moveTo(SX(a), SY(a)); c.lineTo(SX(b), SY(b));
        return true;
      }
      // a turned shape standing at (x, z), prof = [[y, r], ...] from the foot up: its silhouette with the light across
      // it, shade at the foot, then the mouth (open, with o.fill for what is in it) or a flat top (o.top)
      function lathe(x, z, prof, alb, o = {}) {
        if (prof.length > 2) { const P0 = prof, m = P0.length - 1; prof = []; for (let i = 0; i < m; i++) for (let k = 0; k < 4; k++) { const u = k / 4, A = P0[Math.max(0, i - 1)], B = P0[i], C = P0[i + 1], D = P0[Math.min(m, i + 2)]; prof.push([0, 1].map((j) => .5 * (2 * B[j] + (C[j] - A[j]) * u + (2 * A[j] - 5 * B[j] + 4 * C[j] - D[j]) * u * u + (3 * B[j] - A[j] - 3 * C[j] + D[j]) * u * u * u))); } prof.push(P0[m]); }
        const rx = cyw, rz = -syw, fx = -syw, fz = -cyw;
        const at = (y, r, a) => [x + r * (Math.cos(a) * rx + Math.sin(a) * fx), y, z + r * (Math.cos(a) * rz + Math.sin(a) * fz)];
        const n = prof.length, [yb, rb] = prof[0], [yt, rt] = prof[n - 1];
        const pts = [];
        for (let k = 0; k <= 12; k++) pts.push(at(yb, rb, k / 12 * Math.PI));
        for (let i = 1; i < n; i++) pts.push(at(prof[i][0], prof[i][1], Math.PI));
        for (let k = 1; k < 12; k++) pts.push(at(yt, rt, Math.PI + k / 12 * Math.PI));
        for (let i = n - 1; i > 0; i--) pts.push(at(prof[i][0], prof[i][1], 0));
        let im = 0; prof.forEach(([, r], i) => { if (r > prof[im][1]) im = i; });
        const [ym, rm] = prof[im];
        c.beginPath(); if (!addPoly(pts)) return;
        const qa = sc(...at(ym, rm, Math.PI)), qb = sc(...at(ym, rm, 0));
        const cL = shadeOf(alb, lit(...at(ym, rm, Math.PI), -rx, 0, -rz)), cC = shadeOf(alb, lit(...at(ym, rm, Math.PI / 2), fx, 0, fz)), cR = shadeOf(alb, lit(...at(ym, rm, 0), rx, 0, rz));
        if (qa && qb) { const g = c.createLinearGradient(qa[0], qa[1], qb[0], qb[1]); g.addColorStop(0, rgb(cL.map((v) => v * .78))); g.addColorStop(.45, rgb(mixc(cC, cL, .2))); g.addColorStop(.62, rgb(mixc(cC, cR, .2))); g.addColorStop(1, rgb(cR.map((v) => v * .78))); c.fillStyle = g; } else c.fillStyle = rgb(cC);
        c.fill();
        const f0 = sc(x, yb, z), f1 = sc(x, mix(yb, yt, o.ao ?? .55), z);
        if (f0 && f1) { c.save(); c.clip(); const g = c.createLinearGradient(0, f0[1], 0, f1[1]); g.addColorStop(0, o.soot ? 'rgba(6,4,3,.85)' : 'rgba(8,5,3,.42)'); g.addColorStop(1, 'rgba(8,5,3,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore(); }
        const rim = []; for (let k = 0; k < 28; k++) rim.push(at(yt, rt, k / 28 * TAU));
        const eT = lit(x, yt, z, 0, 1, 0);
        if (o.top) fillPoly(rim, rgb(shadeOf(o.top, eT)));
        if (o.open) {
          fillPoly(rim, rgb(shadeOf(alb, eT.map((v) => v * .95))));
          fillPoly(rim.map(([a, b, d]) => [x + (a - x) * .8, b, z + (d - z) * .8]), o.fill ? rgb(o.fill) : 'rgba(16,10,6,1)');
        }
      }
      function weave(x, z, rr, h) { // the coils of a palm-leaf basket
        c.strokeStyle = 'rgba(40,26,12,.4)'; c.lineWidth = px1; c.beginPath();
        for (let y = .03; y < h; y += .035) { const r2 = rr * (.85 + .15 * y / h); for (let k = 0; k <= 14; k++) { const a = Math.PI + k / 14 * Math.PI, q = sc(x + Math.cos(a) * r2, y, z + Math.sin(a) * r2); if (q) (k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); } }
        c.stroke();
      }
      function wallDetails(s) {
        const P3 = (u, y) => (s.n[0] ? [s.o[0], y, u] : [u, y, s.o[2]]);
        const span = s.n[0] ? [Z0, Z1] : [X0, X1];
        // a darker dado of trodden plaster
        fillPoly([P3(span[0], 0), P3(span[1], 0), P3(span[1], .38), P3(span[0], .38)], 'rgba(22,13,6,.3)');
        // courses of mud brick under thin plaster, the plaster worn through in places
        c.strokeStyle = 'rgba(30,17,8,.14)'; c.lineWidth = px1;
        c.beginPath();
        let row = 0;
        for (let y = .38; y < HT - .2; y += .28, row++) {
          addLine(P3(span[0], y), P3(span[1], y));
          for (let u = span[0] + (row % 2) * .3 + ((row * 7) % 5) * .04; u < span[1]; u += .6 + ((row * 3 + u * 5 | 0) % 3) * .05) addLine(P3(u, y), P3(u, y + .28));
        }
        c.stroke();
        if (s.side === 'b') {
          // the lintel over the door: a split palm log
          fillPoly([[DOOR[0] - .22, DOOR[2], Z1 - .01], [DOOR[1] + .22, DOOR[2], Z1 - .01], [DOOR[1] + .22, DOOR[2] + .17, Z1 - .01], [DOOR[0] - .22, DOOR[2] + .17, Z1 - .01]], rgb(shadeOf([.34, .23, .14], lit(DCX, 2, Z1 - .1, 0, -.3, -1))));
          // the niche and its lamp
          const [nx, ny] = NICHE, arch = [];
          for (let k = 0; k <= 10; k++) { const a = Math.PI * k / 10; arch.push([nx + .2 * Math.cos(a), ny + .26 + .16 * Math.sin(a), Z1 - .005]); }
          const pts = [[nx + .2, ny - .12, Z1 - .005], ...arch, [nx - .2, ny - .12, Z1 - .005]], ctr = sc(nx, ny + .05, Z1);
          c.beginPath();
          if (ctr && addPoly(pts)) {
            const R = .42 * F / ctr[2], g = c.createRadialGradient(ctr[0], ctr[1], 0, ctr[0], ctr[1], R), e = lampOn * fl(4.1);
            g.addColorStop(0, `rgba(255,${(170 + 50 * e) | 0},110,${(.12 + .85 * e).toFixed(3)})`); g.addColorStop(.4, `rgba(${(60 + 140 * e) | 0},${(36 + 70 * e) | 0},20,${(.7 + .2 * e).toFixed(3)})`); g.addColorStop(1, 'rgba(22,12,6,.95)');
            c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(15,8,4,.5)'; c.lineWidth = Math.max(1, .025 * F / ctr[2]); c.stroke();
          }
          clayLamp(nx, ny - .12, Z1 - .12, 1, lampOn, 3);
          // the peg for the waterskin
          const pg = sc(QB[0], QB[2], Z1 - .02), pg2 = sc(QB[0], QB[2] + .02, Z1 - .14);
          if (pg && pg2) { c.strokeStyle = rgb(shadeOf([.32, .2, .12], lit(QB[0], QB[2], Z1 - .1, 0, 0, -1))); c.lineWidth = Math.max(2, .04 * F / pg[2]); c.lineCap = 'round'; c.beginPath(); c.moveTo(pg[0], pg[1]); c.lineTo(pg2[0], pg2[1]); c.stroke(); }
          curtain();
        }
        if (s.side === 'b') { // a shelf of palm wood in the corner by the hearth, two small jars on it
          const y = 1.42, x0 = 2.05, x1 = 2.68, e = lit(2.4, y, Z1 - .1, 0, 1, -.5);
          fillPoly([[x0, y, Z1 - .2], [x1, y, Z1 - .2], [x1, y, Z1], [x0, y, Z1]], rgb(shadeOf([.42, .3, .18], e)));
          fillPoly([[x0, y - .05, Z1 - .2], [x1, y - .05, Z1 - .2], [x1, y, Z1 - .2], [x0, y, Z1 - .2]], rgb(shadeOf([.3, .2, .12], e.map((v) => v * .7))));
          lathe(2.22, Z1 - .1, [[y, .05], [y + .08, .08], [y + .15, .05], [y + .18, .04]], [.5, .3, .18], { open: 1 });
          lathe(2.5, Z1 - .1, [[y, .04], [y + .05, .06], [y + .1, .05], [y + .12, .03]], [.6, .45, .3], { open: 1 });
        }
        if (s.side === 'r') { // a sieve hangs on its nail
          const q = sc(X1 - .02, 1.0, 1.95);
          if (q) { const s2 = F / q[2], e = shadeOf([.5, .38, .22], lit(X1 - .05, 1.0, 1.95, -1, 0, 0)); c.save(); c.translate(q[0], q[1]); c.scale(Math.max(.25, Math.abs(Math.sin(yaw))) , 1); c.strokeStyle = rgb(e); c.lineWidth = Math.max(1.5, .03 * s2); c.beginPath(); c.arc(0, 0, .17 * s2, 0, TAU); c.stroke(); c.strokeStyle = rgb(e, .35); c.lineWidth = px1; c.beginPath(); for (let k = -3; k <= 3; k++) { c.moveTo(k * .045 * s2, -.16 * s2); c.lineTo(k * .045 * s2, .16 * s2); c.moveTo(-.16 * s2, k * .045 * s2); c.lineTo(.16 * s2, k * .045 * s2); } c.stroke(); c.restore(); }
        }
      }
      function curtain() { // a woollen curtain drawn aside, hanging from a rod over the door
        const x0 = DOOR[1] - .08, x1 = DOOR[1] + .2, z = Z1 - .05, y1 = DOOR[2] + .06;
        const e = lit((x0 + x1) / 2, 1, z, 0, 0, -1), dark = shadeOf([.28, .12, .08], e.map((v) => v * .7)), mid = shadeOf([.42, .2, .12], e), stripe = shadeOf([.62, .5, .3], e);
        const sway = .02 * Math.sin(t * .8) + .015 * Math.sin(t * 1.9 + 1);
        const pts = [[x0, y1, z], [x1, y1, z], [x1 + .03 + sway, .02, z], [x0 - .04 + sway, .02, z]];
        const a = sc(x0, 1, z), b = sc(x1, 1, z);
        c.beginPath(); if (!addPoly(pts)) return;
        if (a && b) { const g = c.createLinearGradient(a[0], 0, b[0], 0); for (let k = 0; k <= 6; k++) g.addColorStop(k / 6, rgb(k % 2 ? dark : mid)); c.fillStyle = g; } else c.fillStyle = rgb(mid);
        c.fill();
        c.save(); c.clip(); c.strokeStyle = rgb(stripe, .5); c.lineWidth = Math.max(1, .02 * F / ((a || [0, 0, 3])[2])); c.beginPath(); [.35, .4, 1.5].forEach((y) => addLine([x0 - .05, y, z], [x1 + .05, y, z])); c.stroke(); c.restore();
        c.strokeStyle = rgb(shadeOf([.3, .2, .12], e)); c.lineWidth = Math.max(1.5, .03 * F / ((a || [0, 0, 3])[2])); c.beginPath(); addLine([DOOR[0] - .15, y1, z - .02], [x1 + .08, y1, z - .02]); c.stroke();
      }
      function roofMat() { // palm fronds laid over the beams: ribs running front to back
        c.strokeStyle = 'rgba(16,10,5,.32)'; c.lineWidth = px1; c.beginPath();
        for (let x = X0 + .04; x < X1; x += .07) addLine([x, HT, Z0], [x + .03, HT, Z1]);
        c.stroke();
        c.strokeStyle = 'rgba(170,130,80,.08)'; c.beginPath();
        for (let x = X0 + .07; x < X1; x += .14) addLine([x, HT - .002, Z0], [x + .02, HT - .002, Z1]);
        c.stroke();
      }
      function beams() { // round palm trunks across the room
        for (let z = Z0 + .35, k = 0; z < Z1; z += .6, k++) {
          const rr = .085 + .015 * Math.sin(k * 2.3), y = HT - rr;
          const a = sc(0, y, z); if (!a) continue;
          const e = lit(0, y - rr, z, 0, -1, 0), e1 = shadeOf([.36, .26, .16], e), e0 = shadeOf([.36, .26, .16], e.map((v) => v * .3));
          const top = sc(0, y + rr, z), bot = sc(0, y - rr, z);
          c.beginPath(); if (!addPoly([[X0, y - rr, z], [X1, y - rr, z], [X1, y + rr, z], [X0, y + rr, z]])) continue;
          if (top && bot) { const g = c.createLinearGradient(0, top[1], 0, bot[1]); g.addColorStop(0, rgb(e0)); g.addColorStop(.6, rgb(e1)); g.addColorStop(1, rgb(e0.map((v) => v * 1.4))); c.fillStyle = g; } else c.fillStyle = rgb(e1);
          c.fill();
          c.strokeStyle = 'rgba(14,8,4,.4)'; c.lineWidth = px1; c.beginPath();
          for (let x = X0 + .1 + (k % 3) * .05; x < X1; x += .23) addLine([x, y - rr * .9, z], [x + .05, y + rr * .4, z]);
          c.stroke();
        }
      }
      function floorDetails() {
        // packed earth: soft darker patches, the path worn from the door
        st.mottle.forEach(([x, z, r, a]) => planeSprite([x, .002, z], [1, 0, 0], [0, 0, 1], r, st.shadow, a));
        // the quern's leather mat and the flour on it
        const ring = (x, z, rx, rz, y, n = 36) => Array.from({ length: n }, (_, k) => { const a = k / n * TAU; return [x + Math.sin(a) * rx * (1 + .04 * Math.sin(a * 5)), y, z + Math.cos(a) * rz * (1 + .04 * Math.sin(a * 3 + 1))]; });
        const eq = lit(QUERN[0], .01, QUERN[1], 0, 1, 0);
        fillPoly(ring(QUERN[0], QUERN[1], .66, .6, .004), rgb(shadeOf([.38, .23, .13], eq)));
        fillPoly(ring(QUERN[0], QUERN[1], .6, .54, .005), rgb(shadeOf([.5, .32, .18], eq)));
        const fk = .45 + .55 * smooth(seg(p, .11, .2));
        c.globalCompositeOperation = 'lighter';
        planeSprite([QUERN[0], .006, QUERN[1]], [1, 0, 0], [0, 0, 1], .42 + .08 * fk, st.dust, .9 * fk);
        c.globalCompositeOperation = 'source-over';
        // a small heap of swept dust by the wall
        planeSprite([-1.6, .004, .6], [1, 0, 0], [0, 0, 1], .2 + .1 * smooth(seg(p, .2, .28)), st.shadow, .5);
        // the sheepskin they slept on, and its pillow of palm fibre
        const [sx, sz] = [BEAD[0], BEAD[1] + .05], es = lit(sx, .01, sz, 0, 1, 0);
        const lobe = (a, c0, wd) => Math.exp(-(((a - c0 + 3 * Math.PI) % TAU - Math.PI) ** 2) / (2 * wd * wd));
        const skin = st.edge.map((k, i) => { const a = i / st.edge.length * TAU, legs = [.7, -.7, Math.PI - .55, Math.PI + .55].reduce((m, c0) => m + .34 * lobe(a, c0, .13), 0) + .16 * lobe(a, 0, .2); return [sx + Math.sin(a) * .46 * (k + legs), .008, sz + Math.cos(a) * .66 * (k + legs)]; });
        const ek = es.map((v) => Math.min(v, .9) * .85), q0 = sc(sx, .01, sz), q1 = sc(sx + .5, .01, sz);
        c.beginPath();
        if (addPoly(skin)) {
          if (q0 && q1) { const g = c.createRadialGradient(q0[0], q0[1], 0, q0[0], q0[1], Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) * 1.25); g.addColorStop(0, rgb(shadeOf([.66, .56, .4], ek))); g.addColorStop(.7, rgb(shadeOf([.58, .49, .35], ek))); g.addColorStop(1, rgb(shadeOf([.44, .36, .25], ek))); c.fillStyle = g; } else c.fillStyle = rgb(shadeOf([.58, .49, .35], ek));
          c.fill();
        }
        c.strokeStyle = rgb(shadeOf([.7, .64, .52], ek), .5); c.lineWidth = px1; c.beginPath();
        st.tufts.forEach(([u, v, k]) => { const x = sx + u * .55, z = sz + v * .72; addLine([x, .012, z], [x + .025 * (k - .5), .012, z + .03]); });
        c.stroke();
        beads();
        // contact shadows
        [[JAR[0], JAR[1], .4], [BASIN[0], BASIN[1], .32], [QUERN[0], QUERN[1], .42], [BASKET[0], BASKET[1], .26], [HEARTH[0], HEARTH[1], .45]].forEach(([x, z, r]) => planeSprite([x, .006, z], [1, 0, 0], [0, 0, 1], r, st.shadow, .8));
      }
      function beads() { // a hundred on a cord in a ring on the fleece; each lights in its group's colour, in step with the counts
        const [bx, bz, br] = BEAD, list = [];
        for (let i = 0; i < 100; i++) {
          const a = Math.PI + (i + .5) / 100 * TAU, r = br * (1 + .05 * Math.sin(i * .37) + .03 * Math.sin(i * 1.3 + 2));
          const q = sc(bx + Math.sin(a) * r, .022, bz + Math.cos(a) * r); if (q) list.push([q, i, a]);
        }
        if (list.length < 2) return;
        const s0 = .012 * F / list[0][0][2];
        if (s0 < .6) return;
        c.strokeStyle = 'rgba(30,20,12,.7)'; c.lineWidth = Math.max(1, s0 * .25); c.beginPath(); list.forEach(([q], k) => (k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); c.stroke();
        { const q = sc(bx, .02, bz - br * 1.05), q2 = sc(bx + .02, .02, bz - br * 1.45); if (q && q2) { c.lineWidth = Math.max(1, s0 * .35); c.beginPath(); for (let k = -2; k <= 2; k++) { c.moveTo(q[0], q[1]); c.lineTo(q2[0] + k * s0 * .8, q2[1]); } c.stroke(); } } // the tassel
        list.sort((m, n) => n[0][2] - m[0][2]);
        const eb = shadeOf([.34, .24, .16], lit(bx, .05, bz, 0, 1, 0));
        list.forEach(([q, i]) => {
          const g = i < 34 ? 0 : i < 67 ? 1 : 2, k = beadK(i), s = .012 * F / q[2], col = BCOL[g];
          const cc = mixc(eb, col, k), hi = mixc(eb.map((v) => v * 1.5), [255, 250, 236], k * .8);
          const gr = c.createRadialGradient(q[0] - s * .35, q[1] - s * .4, 0, q[0], q[1], s * 1.1);
          gr.addColorStop(0, rgb(hi)); gr.addColorStop(.55, rgb(cc)); gr.addColorStop(1, rgb(cc.map((v) => v * .45)));
          c.fillStyle = gr; c.beginPath(); c.arc(q[0], q[1], s, 0, TAU); c.fill();
          if (k > .01) { c.globalCompositeOperation = 'lighter'; halo(q[0], q[1], s * (2.8 + .6 * done), st.beadG[g], (.26 + .08 * done) * k * (.85 + .15 * Math.sin(t * 2.2 + i * .7))); c.globalCompositeOperation = 'source-over'; }
        });
        if (done > 0) { c.globalCompositeOperation = 'lighter'; planeSprite([bx, .02, bz], [1, 0, 0], [0, 0, 1], br * 2.2, st.gold, .14 * done); c.globalCompositeOperation = 'source-over'; }
      }
      function basin() { // a clay basin under the skin, the drips ringing out on it
        lathe(BASIN[0], BASIN[1], [[0, .13], [.07, .2], [.12, .23]], [.52, .3, .18], { open: 1, fill: mixc(shadeOf([.2, .26, .3], lit(BASIN[0], .12, BASIN[1], 0, 1, 0)), [150, 170, 180], .15 * day) });
      }
      function waterskin() { // the qirba: a goatskin bag hanging by its cord, heavy and wet, swinging a little, dripping
        const [x, z, peg] = QB, top = sc(x, peg - .02, Z1 - .12); if (!top) return;
        const s = F / top[2], ang = .045 * Math.sin(t * 1.1) + .03 * Math.sin(t * 2.3 + 1) + .12 * Math.sin(p * 90) * smooth(seg(p, .03, .07)) * (1 - smooth(seg(p, .1, .14)));
        const eL = lit(x - .15, 1.35, z, -1, 0, -.4), eC = lit(x, 1.35, z - .15, 0, 0, -1), eR = lit(x + .15, 1.35, z, 1, 0, -.4);
        const alb = [.46, .29, .16], cl = shadeOf(alb, eL), cc = shadeOf(alb, eC), cr = shadeOf(alb, eR);
        c.save(); c.translate(top[0], top[1]); c.rotate(ang); c.scale(s, s);
        c.strokeStyle = rgb(shadeOf([.3, .2, .12], eC)); c.lineWidth = .014; c.beginPath(); c.moveTo(0, 0); c.lineTo(-.15, .19); c.moveTo(0, 0); c.lineTo(.13, .19); c.stroke();
        const bag = new Path2D();
        bag.moveTo(-.12, .2); bag.quadraticCurveTo(-.19, .17, -.18, .23); bag.bezierCurveTo(-.27, .33, -.3, .55, -.23, .7);
        bag.bezierCurveTo(-.2, .76, -.16, .8, -.11, .82); bag.bezierCurveTo(-.13, .87, -.15, .92, -.13, .96); bag.quadraticCurveTo(-.09, .97, -.07, .95);
        bag.bezierCurveTo(-.06, .9, -.04, .86, .01, .85); bag.bezierCurveTo(.17, .84, .28, .72, .27, .55); bag.bezierCurveTo(.27, .38, .2, .28, .14, .24);
        bag.quadraticCurveTo(.17, .19, .11, .18); bag.quadraticCurveTo(0, .24, -.12, .2); bag.closePath();
        const g = c.createLinearGradient(-.26, 0, .26, 0); g.addColorStop(0, rgb(cl)); g.addColorStop(.45, rgb(cc)); g.addColorStop(1, rgb(cr.map((v) => v * .8)));
        c.fillStyle = g; c.fill(bag);
        c.save(); c.clip(bag);
        const g2 = c.createLinearGradient(0, .2, 0, .9); g2.addColorStop(0, 'rgba(10,6,3,.35)'); g2.addColorStop(.4, 'rgba(10,6,3,0)'); g2.addColorStop(1, 'rgba(10,6,3,.45)'); c.fillStyle = g2; c.fillRect(-.4, 0, .8, 1);
        c.strokeStyle = 'rgba(20,12,6,.45)'; c.lineWidth = .006; c.beginPath(); c.moveTo(-.01, .23); c.bezierCurveTo(.04, .42, .06, .62, .02, .84); c.stroke(); // the seam
        c.strokeStyle = 'rgba(30,18,8,.22)'; c.lineWidth = .004; c.beginPath(); for (let k = 0; k < 26; k++) { const hx = -.2 + (k * .37 % 1) * .42, hy = .3 + (k * .61 % 1) * .48; c.moveTo(hx, hy); c.lineTo(hx + .012, hy + .03); } c.stroke(); // the grain of the hide
        c.globalCompositeOperation = 'lighter'; // a wet sheen on the side toward the door
        const sh = c.createRadialGradient(-.13, .42, 0, -.13, .42, .2); sh.addColorStop(0, `rgba(255,236,200,${(.18 + .1 * day).toFixed(3)})`); sh.addColorStop(1, 'rgba(255,236,200,0)'); c.fillStyle = sh; c.fillRect(-.4, 0, .8, 1);
        c.restore();
        c.strokeStyle = 'rgba(16,9,4,.55)'; c.lineWidth = .008; c.stroke(bag);
        c.strokeStyle = rgb(shadeOf([.62, .5, .32], eC)); c.lineWidth = .012; c.beginPath(); c.moveTo(-.14, .92); c.lineTo(-.07, .91); c.stroke(); // the tie at the neck
        c.restore();
        // drips from the leg of the skin into the basin, and their rings
        const tx0 = -.1, ty0 = .97, tip = sc(x + (tx0 * Math.cos(ang) - ty0 * Math.sin(ang)), peg - .02 - (tx0 * Math.sin(ang) + ty0 * Math.cos(ang)), Z1 - .12), wtr = sc(BASIN[0], .12, BASIN[1]);
        if (!tip || !wtr) return;
        c.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 3; k++) {
          const ph = (t * .55 + k / 3) % 1;
          if (ph < .62) { const u = ph / .62, y = mix(tip[1], wtr[1], u * u), r = Math.max(1, .008 * s); c.fillStyle = `rgba(200,225,240,${(.75 - .2 * u).toFixed(3)})`; c.beginPath(); c.ellipse(tip[0], y, r, r * (1.3 + u), 0, 0, TAU); c.fill(); }
          else { const v = (ph - .62) / .38, rx = (.02 + .12 * v) * F / wtr[2]; c.strokeStyle = `rgba(200,225,240,${(.45 * (1 - v)).toFixed(3)})`; c.lineWidth = px1; c.beginPath(); c.ellipse(tip[0], wtr[1], rx, rx * Math.abs(sp) * .9 + 1, 0, 0, TAU); c.stroke(); }
        }
        c.globalCompositeOperation = 'source-over';
      }
      function quern() { // two stones; the upper turns on its pin, flour at the lip
        const [x, z] = QUERN;
        lathe(x, z, [[0, .27], [.1, .27]], [.5, .47, .43], { top: [.56, .52, .47], ao: .9 });
        c.globalCompositeOperation = 'lighter';
        { c.strokeStyle = 'rgba(236,224,200,.3)'; c.lineWidth = Math.max(1, .01 * F / dist(x, z)); c.beginPath(); for (let k = 0; k <= 24; k++) { const a = k / 24 * Math.PI, q = sc(x + Math.cos(a) * .268 * cyw - Math.sin(a) * .268 * syw, .102, z - Math.cos(a) * .268 * syw - Math.sin(a) * .268 * cyw); if (q) (k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); } c.stroke(); }
        c.globalCompositeOperation = 'source-over';
        lathe(x, z, [[.104, .255], [.2, .25]], [.58, .55, .5], { top: [.62, .58, .52], ao: .8 });
        const fk = .5 + .5 * smooth(seg(p, .11, .2));
        lathe(x + .1, z - .33, [[0, .1 * fk], [.02, .08 * fk], [.04 * fk, .04 * fk], [.05 * fk, .005]], [2.2, 2.1, 1.9], { ao: 0 });
        const yt = .201, s = F / dist(x, z), P = (r, a) => sc(x + Math.cos(a) * r, yt, z + Math.sin(a) * r);
        c.lineCap = 'round'; c.strokeStyle = 'rgba(14,12,10,.18)'; c.lineWidth = Math.max(1, .003 * s); c.beginPath();
        st.marks.forEach(([rr, a0, l, b]) => { const a = a0 + theta, q1 = P(rr, a), q2 = sc(x + Math.cos(a) * rr + Math.cos(a + b) * l, yt, z + Math.sin(a) * rr + Math.sin(a + b) * l); if (q1 && q2) { c.moveTo(q1[0], q1[1]); c.lineTo(q2[0], q2[1]); } });
        c.stroke();
        { c.strokeStyle = 'rgba(10,8,6,.5)'; c.lineWidth = Math.max(1, .004 * s); c.beginPath(); for (let k = 0; k <= 8; k++) { const q = P(mix(.07, .24, k / 8), 1.2 + theta + .05 * Math.sin(k * 1.3)); if (q) (k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); } c.stroke(); }
        // the eye with grain in it, the grain drawn round with the stone
        { const e0 = sc(x, yt, z), e1 = sc(x + .05, yt, z), e2 = sc(x, yt, z + .05); if (e0 && e1 && e2) { c.fillStyle = '#120d08'; c.beginPath(); c.ellipse(e0[0], e0[1], Math.abs(e1[0] - e0[0]) + 1, Math.abs(e2[1] - e0[1]) + 1, 0, 0, TAU); c.fill(); } }
        c.fillStyle = rgb(shadeOf([.8, .62, .34], lit(x, yt, z, 0, 1, 0)));
        st.grain.forEach(([gx, gz, k]) => { const a = Math.atan2(gz, gx) + theta * (.92 + .08 * k), d = Math.hypot(gx, gz) * .55 + .045, q = P(d, a); if (!q) return; const r = Math.max(1, .006 * s); c.beginPath(); c.ellipse(q[0], q[1], r * .7, r * .45, a, 0, TAU); c.fill(); });
        // the handle peg, before or after the centre by depth
        const hr = .19, hx = x + Math.cos(theta) * hr, hz = z + Math.sin(theta) * hr, b0 = sc(hx, yt, hz), b1 = sc(hx + .015, yt + .19, hz);
        if (b0 && b1) { const wd = .035 * F / b0[2], e = lit(hx, .3, hz, -syw, 0, -cyw); c.strokeStyle = rgb(shadeOf([.48, .32, .18], e)); c.lineWidth = wd; c.beginPath(); c.moveTo(b0[0], b0[1]); c.lineTo(b1[0], b1[1]); c.stroke(); c.strokeStyle = rgb(shadeOf([.7, .5, .3], e), .5); c.lineWidth = wd * .3; c.beginPath(); c.moveTo(b0[0] - wd * .2, b0[1]); c.lineTo(b1[0] - wd * .2, b1[1]); c.stroke(); }
        // flour spilling from the seam at the front and puffing up while it turns
        c.globalCompositeOperation = 'lighter'; c.fillStyle = '#efe4cc';
        const q0 = Math.max(1, .0045 * s), act = .35 + .65 * w[1];
        st.fall.forEach(([a0, ph, spd]) => { const a = a0 + theta * .2; const u = (t * .35 * spd + ph) % 1, rr = .27 + .06 * u, y = .1 - .095 * u * u; const q = sc(x + Math.cos(a) * rr, y, z + Math.sin(a) * rr); if (!q) return; c.globalAlpha = .7 * (1 - u) * act; c.fillRect(q[0], q[1], q0, q0); });
        c.globalAlpha = 1;
        for (let k = 0; k < 5; k++) { const u = (t * .2 + k / 5) % 1, a = k * 1.7 + theta * .1, q = sc(x + Math.cos(a) * .3, .08 + .3 * u, z + Math.sin(a) * .3); if (q) halo(q[0], q[1], (.05 + .15 * u) * F / q[2], st.dust, .3 * act * Math.sin(Math.PI * u)); }
        c.globalCompositeOperation = 'source-over';
      }
      function broom() { // a short broom of palm-frond ribs, bound at the top, sweeping on its own in the patch of sun
        // out of its turn it leans against the wall under the window
        const k3 = smooth(seg(p, .18, .2)) * (1 - smooth(seg(p, .27, .29))), s1 = Math.sin(sweep) * k3, v1 = Math.cos(sweep) * k3;
        const bx = mix(X0 + .34, BROOM[0] + .16 * s1, k3), bz = mix(1.95, BROOM[1], k3);
        const T = [mix(X0 + .05, BROOM[0] - .32 - .04 * s1, k3), mix(.86, .74, k3), mix(1.92, BROOM[1] - .12, k3)], M = [mix(T[0], bx, .45), mix(T[1], .02, .45), mix(T[2], bz, .45)];
        const q0 = sc(...T), q1 = sc(...M); if (!q0 || !q1) return;
        const e = lit(...M, -syw, .3, -cyw), sun = c01(1 - Math.hypot(bx - PC[0], bz - PC[2]) / .5) * shaftA;
        const colB = shadeOf([.66, .52, .3], e.map((v) => v + 1.2 * sun)), colD = shadeOf([.4, .3, .16], e);
        // the ribs: a fan from the binding to the floor, trailing behind the stroke
        c.lineCap = 'round';
        for (let k = 0; k < 18; k++) {
          const u = k / 17 - .5, fx = bx + u * .04, fz = bz + u * .28, f = sc(fx, .004, fz), m2 = sc(M[0] + u * .02, M[1], M[2] + u * .05);
          const cm = sc(mix(M[0], fx, .55) - .07 * v1, mix(M[1], 0, .55) + .03, mix(M[2], fz, .55)); if (!f || !m2 || !cm) continue;
          c.strokeStyle = rgb(k % 3 ? colB : colD); c.lineWidth = Math.max(1, .008 * F / f[2]);
          c.beginPath(); c.moveTo(m2[0], m2[1]); c.quadraticCurveTo(cm[0], cm[1], f[0], f[1]); c.stroke();
        }
        // the bound grip
        c.strokeStyle = rgb(colD); c.lineWidth = Math.max(2, .05 * F / q0[2]); c.beginPath(); c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); c.stroke();
        c.strokeStyle = 'rgba(30,18,8,.7)'; c.lineWidth = Math.max(1, .008 * F / q0[2]); c.beginPath();
        for (let k = 1; k < 6; k++) { const m = sc(mix(T[0], M[0], k / 6), mix(T[1], M[1], k / 6), mix(T[2], M[2], k / 6)); if (m) { const d = .028 * F / m[2]; c.moveTo(m[0] - d, m[1] - d * .3); c.lineTo(m[0] + d, m[1] + d * .3); } }
        c.stroke();
        // dust kicked up at each stroke
        c.globalCompositeOperation = 'lighter';
        const kick = Math.abs(v1) * (.3 + .7 * w[2]);
        if (kick > .01)
        for (let k = 0; k < 6; k++) { const u = (t * .45 + k / 6) % 1, q = sc(bx + .18 * v1 * u + (k - 2.5) * .03, .02 + .25 * u, bz + (k - 2.5) * .05); if (q) halo(q[0], q[1], (.05 + .14 * u) * F / q[2], st.dust, (.2 + .6 * sun) * kick * Math.sin(Math.PI * u)); }
        c.globalCompositeOperation = 'source-over';
      }
      function hearth() { // three stones, the fire between them, the pot on top
        const [x, z] = HEARTH, behind = st.stones.map((s3) => [s3, cs(s3[0], .05, s3[1])[2]]).sort((a, b) => b[1] - a[1]);
        const stone = ([sx, sz, r]) => lathe(sx, sz, [[0, r], [r * .9, r * .95], [r * 1.5, r * .55], [r * 1.7, .01]], [.42, .36, .3], { ao: .6 });
        { const ash = []; for (let k = 0; k < 20; k++) { const a = k / 20 * TAU; ash.push([x + Math.cos(a) * .3, .004, z + Math.sin(a) * .26]); } fillPoly(ash, rgb(shadeOf([.3, .28, .26], lit(x, .01, z, 0, 1, 0).map((v) => v * .6)))); }
        lathe(x - .55, z + .3, [[0, .07], [.06, .12], [.08, .125]], [.42, .26, .15], { open: 1, fill: shadeOf([.8, .72, .55], lit(x - .55, .08, z + .3, 0, 1, 0)) });
        stone(behind[0][0]);
        // embers and flames, leaning and flickering
        const q = sc(x, .03, z); if (q) {
          const s = F / q[2];
          c.globalCompositeOperation = 'lighter';
          halo(q[0], q[1], .3 * s, st.fire, .7 * fireI);
          for (let k = 0; k < 5; k++) {
            const off = (k - 2) * .045, h = (.1 + .08 * fireI) * (1 + .3 * Math.sin(t * 9 + k * 2.1) * Math.sin(t * 5.7 + k)), lean = .03 * Math.sin(t * 3.1 + k), b = sc(x + off * cyw, .03, z - off * syw); if (!b) continue;
            const hw = .03 * s, hh = h * s;
            const g = c.createLinearGradient(0, b[1], 0, b[1] - hh); g.addColorStop(0, 'rgba(255,240,200,.95)'); g.addColorStop(.4, 'rgba(255,170,70,.75)'); g.addColorStop(1, 'rgba(220,80,20,0)');
            c.fillStyle = g; c.beginPath(); c.moveTo(b[0] - hw, b[1]); c.quadraticCurveTo(b[0] - hw * 1.1, b[1] - hh * .5, b[0] + lean * s, b[1] - hh); c.quadraticCurveTo(b[0] + hw * 1.1, b[1] - hh * .5, b[0] + hw, b[1]); c.closePath(); c.fill();
          }
          c.globalCompositeOperation = 'source-over';
        }
        stone(behind[1][0]);
        // the pot: round-bellied clay, blackened from the bottom up
        lathe(x, z, [[.13, .06], [.17, .15], [.25, .2], [.34, .18], [.39, .12], [.42, .135]], [.52, .32, .18], { open: 1, soot: 1, ao: .5, fill: [24, 14, 8] });
        stone(behind[2][0]);
        // a few sticks of firewood laid ready
        c.lineCap = 'round';
        [[.3, -.4, .62, -.2, .022], [.28, -.32, .66, -.3, .02], [.34, -.46, .58, -.06, .018], [.31, -.36, .6, -.12, .02]].forEach(([a, b, d, e2, r2], k) => { const qa = sc(x + a, r2 + (k > 2 ? .03 : 0), z + b), qb = sc(x + d, r2 + (k > 2 ? .03 : 0), z + e2); if (!qa || !qb) return; const e = lit(x + a, .1, z + b, 0, 1, -.5); c.strokeStyle = rgb(shadeOf([.3, .2, .12], e)); c.lineWidth = Math.max(1.5, 2 * r2 * F / qa[2]); c.beginPath(); c.moveTo(qa[0], qa[1]); c.lineTo(qb[0], qb[1]); c.stroke(); c.fillStyle = rgb(shadeOf([.62, .46, .28], e)); c.beginPath(); c.arc(qa[0], qa[1], Math.max(1, r2 * F / qa[2] * .8), 0, TAU); c.fill(); });
        if (q) { // flame tips licking up round the belly of the pot
          const s = F / q[2];
          c.globalCompositeOperation = 'lighter';
          [-1, 1].forEach((sd, k) => { const b = sc(x + sd * .17 * cyw, .12, z - sd * .17 * syw); if (!b) return; const hh = (.08 + .05 * Math.sin(t * 8 + k * 3)) * s * fireI; halo(b[0], b[1] - hh * .4, hh * .9, st.fire, .5); });
          c.globalCompositeOperation = 'source-over';
        }
      }
      function bolster(x, z) { // bedding rolled against the wall
        lathe(x, z, [[0, .3], [.16, .3]], [.48, .34, .22], { top: [.56, .42, .28], ao: .7 });
      }
      function clayLamp(x, y, z, sz, on, i) {
        const q = sc(x, y + .03, z); if (!q) return;
        const s = F / q[2] * sz;
        c.fillStyle = 'rgba(52,32,18,1)'; c.beginPath(); c.ellipse(q[0], q[1], .08 * s, .03 * s, 0, 0, TAU); c.fill();
        c.fillStyle = 'rgba(140,86,48,1)'; c.beginPath(); c.ellipse(q[0], q[1] - .01 * s, .066 * s, .02 * s, 0, 0, TAU); c.fill();
        if (on <= .02) return;
        const fx = q[0] + .06 * s, fy = q[1] - .025 * s, fh = (.07 + .015 * Math.sin(t * 9 + i * 3)) * s * on, lean = .05 * Math.sin(t * 3.1 + i);
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = `rgba(255,190,90,${(.9 * on).toFixed(3)})`;
        c.beginPath(); c.moveTo(fx - .015 * s, fy); c.quadraticCurveTo(fx - .02 * s, fy - fh * .5, fx + lean * fh, fy - fh); c.quadraticCurveTo(fx + .02 * s, fy - fh * .5, fx + .015 * s, fy); c.closePath(); c.fill();
        c.fillStyle = `rgba(255,245,215,${(.9 * on).toFixed(3)})`; c.beginPath(); c.ellipse(fx, fy - fh * .25, .006 * s, fh * .2, 0, 0, TAU); c.fill();
        halo(fx, fy - fh * .4, .5 * s, st.fire, .35 * on);
        c.globalCompositeOperation = 'source-over';
      }
      function shaft(a) { // the sun through the high window: a slanting column of light, motes turning in it
        const top = winPts.map((v) => sc(...v)), bot = PATCH.map((v) => sc(...v));
        if (top.some((q) => !q) || bot.some((q) => !q)) return;
        const all = [...top, ...bot].map((q) => [q[0], q[1]]);
        all.sort((m, n) => m[0] - n[0] || m[1] - n[1]);
        const cross = (o, m, n) => (m[0] - o[0]) * (n[1] - o[1]) - (m[1] - o[1]) * (n[0] - o[0]);
        const lo = [], hi = [];
        all.forEach((q) => { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); });
        [...all].reverse().forEach((q) => { while (hi.length > 1 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); });
        const hull = [...lo.slice(0, -1), ...hi.slice(0, -1)];
        const tc = top.reduce((m, q) => [m[0] + q[0] / 4, m[1] + q[1] / 4], [0, 0]), bc = bot.reduce((m, q) => [m[0] + q[0] / 4, m[1] + q[1] / 4], [0, 0]);
        const g = c.createLinearGradient(tc[0], tc[1], bc[0], bc[1]);
        g.addColorStop(0, `rgba(255,230,180,${(.2 * a).toFixed(3)})`); g.addColorStop(.7, `rgba(255,220,160,${(.09 * a).toFixed(3)})`); g.addColorStop(1, `rgba(255,214,150,${(.05 * a).toFixed(3)})`);
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = g; c.beginPath(); hull.forEach((q, k) => (k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,236,196,1)';
        st.motes.forEach(([u0, a0, b0, ph, m]) => {
          const u = (u0 + t * .006 * (1 + m)) % 1, y = mix(WIN[3], 0, u) + .06 * Math.sin(t * .4 + ph);
          const k = (WIN[2] + (WIN[3] - WIN[2]) * b0 - y) / -SUNV[1];
          const z0 = mix(WIN[0], WIN[1], a0) + .05 * Math.sin(t * .3 + ph * 2);
          const pt = [X0 + SUNV[0] * k, y, z0 + SUNV[2] * k]; if (pt[0] < X0 + .05) return;
          const q = sc(...pt); if (!q) return;
          const r = Math.max(1, .007 * F / q[2]);
          c.globalAlpha = Math.min(1, a * m * (.35 + .65 * w[2]) * (.6 + .4 * Math.sin(t * 1.7 + ph * 5)));
          c.fillRect(q[0] - r / 2, q[1] - r / 2, r, r);
        });
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
      }
      function smoke() { // from the fire up under the roof, drifting out along the fronds
        const [x, z] = HEARTH;
        for (let k = 0; k < 28; k++) {
          const u = (t * .05 + k / 28) % 1, y = .4 + u * (HT - .5), dr = u * u * .9;
          const q = sc(x + .1 * Math.sin(u * 6 + k * 1.7) - dr * .7, y, z + .07 * Math.cos(u * 5 + k * 2) + dr * .3); if (!q) continue;
          halo(q[0], q[1], (.07 + .4 * u) * F / q[2], st.smoke, .3 * Math.sin(Math.PI * c01(u * 1.2)) * (.5 + .5 * fireI) * (.6 + .4 * w[3]));
        }
        // steam off the pot
        c.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 8; k++) { const u = (t * .12 + k / 8) % 1, q = sc(x + .05 * Math.sin(k * 2.1 + u * 3), .44 + u * .5, z + .04 * Math.cos(k * 1.3)); if (q) halo(q[0], q[1], (.04 + .14 * u) * F / q[2], st.pale, .07 * Math.sin(Math.PI * u) * fireI); }
        c.globalCompositeOperation = 'source-over';
      }
      function holy(P3, R, img, a, outside) { // a light, never a figure; a pool of it on the floor beneath
        const q = sc(...P3); if (!q || a <= 0) return;
        const s = F / q[2], br = .94 + .06 * Math.sin(t * 1.3 + P3[0] * 3);
        c.save();
        if (outside) { c.beginPath(); if (!addPoly(doorPts)) { c.restore(); return; } c.clip(); }
        c.globalCompositeOperation = 'lighter';
        if (!outside) planeSprite([P3[0], .006, P3[2]], [1, 0, 0], [0, 0, 1], .55, img, .25 * a);
        halo(q[0], q[1], Math.min(H * .8, R * 14 * s), img, .1 * a * br);
        halo(q[0], q[1], Math.min(H * .5, R * 6 * s), img, .2 * a * br);
        halo(q[0], q[1], R * 2 * s, img, .55 * a * br);
        halo(q[0], q[1], R * .5 * s, st.glow, Math.min(1, .9 * a));
        c.restore();
      }
      function labels() { // the four tasks, each by its corner while it is lit
        const pos = [[QB[0], QB[2] + .28, Z1 - .15], [QUERN[0], .7, QUERN[1]], [BROOM[0] - .2, 1.15, BROOM[1]], [HEARTH[0], .85, HEARTH[1]]];
        const fs = Math.round(phone ? W * .048 : H * .027);
        c.font = `600 ${fs}px ${FONT.kufi}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'rtl';
        pos.forEach((P3, k) => {
          // only once the camera has settled on the corner, and never under the caption column
          const a = bump(p, [.04, .12, .2, .28][k] + .008, [.11, .19, .27, .35][k] - .008, .012); if (a <= .01) return;
          const q = sc(...P3); if (!q || (phone ? q[1] < H * .34 : q[0] > W * .58 && q[1] < H * .4)) return;
          c.globalAlpha = a;
          c.fillStyle = 'rgba(0,0,0,.55)'; c.fillText(LABELS[k], q[0] + 1, q[1] + 2);
          c.fillStyle = '#f3d98f'; c.fillText(LABELS[k], q[0], q[1]);
          c.strokeStyle = 'rgba(243,217,143,.55)'; c.lineWidth = px1; c.beginPath(); c.moveTo(q[0], q[1] + fs * .8); c.lineTo(q[0], q[1] + fs * 1.6); c.stroke();
          c.globalAlpha = 1;
        });
      }
      function court() { // the little court behind the house: its walls, the well, a palm; day, dusk, then night
        const sunDir = nrm([-.5, .78, -.4]), sunK = day * (1 - .35 * dusk), sunC = mixc([1.5, 1.38, 1.15], [1.5, 1.0, .62], dusk), amb = mixc(mixc([.42, .42, .46], [.3, .24, .26], dusk), [.06, .08, .15], night);
        const os = (alb, n) => { const d = Math.max(0, n[0] * sunDir[0] + n[1] * sunDir[1] + n[2] * sunDir[2]) * sunK; return [tone(alb[0] * (amb[0] + sunC[0] * d)), tone(alb[1] * (amb[1] + sunC[1] * d)), tone(alb[2] * (amb[2] + sunC[2] * d))]; };
        const hz = sc(DCX, CT.h, CT.z1), tp = sc(DCX, CT.h + 6, CT.z1);
        if (hz && tp) {
          const g = c.createLinearGradient(0, tp[1], 0, hz[1]);
          g.addColorStop(0, rgb(mixc(mixc([120, 152, 196], [86, 76, 110], dusk), [6, 10, 26], night))); g.addColorStop(1, rgb(mixc(mixc([236, 222, 196], [250, 168, 104], dusk), [22, 28, 54], night)));
          c.fillStyle = g; c.fillRect(0, 0, W, H);
        }
        if (night > .05) { c.fillStyle = '#f3ead2'; st.stars.forEach(([sx, sy, sz, k]) => { const q = sc(px + sx * 1e3, py + sy * 1e3, pz + sz * 1e3); if (!q) return; c.globalAlpha = night * (.3 + .6 * k) * (.75 + .25 * Math.sin(t * 2 + k * 40)); const r = k > .85 ? 2 * px1 : px1; c.fillRect(q[0], q[1], r, r); }); c.globalAlpha = 1; }
        // palms beyond the wall, dark against the sky
        st.far.forEach(([fx, fz, h, ph]) => palm(fx, CT.z1 + fz, h, ph, rgb(mixc(mixc([92, 96, 92], [80, 54, 50], dusk), [10, 12, 22], night))));
        // the court's walls and ground
        const wallA = [.66, .52, .36];
        fillPoly([[CT.x0, 0, CT.z1], [CT.x1, 0, CT.z1], [CT.x1, CT.h, CT.z1], [CT.x0, CT.h, CT.z1]], rgb(os(wallA, [0, 0, -1])));
        fillPoly([[CT.x0, 0, Z1], [CT.x0, 0, CT.z1], [CT.x0, CT.h, CT.z1], [CT.x0, CT.h, Z1]], rgb(os(wallA, [1, 0, 0])));
        fillPoly([[CT.x1, 0, Z1], [CT.x1, CT.h, Z1], [CT.x1, CT.h, CT.z1], [CT.x1, 0, CT.z1]], rgb(os(wallA, [-1, 0, 0])));
        fillPoly([[CT.x0, 0, Z1], [CT.x1, 0, Z1], [CT.x1, 0, CT.z1], [CT.x0, 0, CT.z1]], rgb(os([.7, .58, .42], [0, 1, 0])));
        c.strokeStyle = rgb(os([.4, .3, .2], [0, 0, -1]), .5); c.lineWidth = px1; c.beginPath(); addLine([CT.x0, CT.h, CT.z1], [CT.x1, CT.h, CT.z1]); c.stroke();
        // the shadow of the house across the near ground
        fillPoly([[CT.x0, .001, Z1], [CT.x1, .001, Z1], [CT.x1, .001, Z1 + 1.6], [CT.x0, .001, Z1 + 1.2]], `rgba(30,20,14,${(.35 * day).toFixed(3)})`);
        palm(PALM[0], PALM[1], 7.5, .7, null, os);
        // the well: a ring of stones, a frame of palm wood, a rope and a bucket
        const [wx, wz] = WELL, n = 26, ring = (r, y) => Array.from({ length: n }, (_, k) => [wx + Math.cos(k / n * TAU) * r, y, wz + Math.sin(k / n * TAU) * r]);
        const stoneA = [.58, .52, .44];
        { const pts = []; for (let k = 0; k <= 13; k++) { const a = Math.PI + k / 13 * Math.PI; pts.push([wx + Math.cos(a) * .62, 0, wz + Math.sin(a) * .62]); } for (let k = 13; k >= 0; k--) { const a = Math.PI + k / 13 * Math.PI; pts.push([wx + Math.cos(a) * .62, .62, wz + Math.sin(a) * .62]); } fillPoly(pts, rgb(os(stoneA, [0, 0, -1]))); }
        fillPoly(ring(.62, .62), rgb(os(stoneA, [0, 1, 0])));
        fillPoly(ring(.42, .621), 'rgba(10,8,8,1)');
        c.strokeStyle = rgb(os([.3, .24, .2], [0, 0, -1]), .6); c.lineWidth = px1; c.beginPath(); for (let y = .16; y < .62; y += .16) for (let k = 0; k < 14; k++) { const a = Math.PI + k / 13 * Math.PI; if (k) addLine([wx + Math.cos(a - Math.PI / 13) * .62, y, wz + Math.sin(a - Math.PI / 13) * .62], [wx + Math.cos(a) * .62, y, wz + Math.sin(a) * .62]); } c.stroke();
        const wood = rgb(os([.4, .28, .16], [0, 0, -1])), lw = (y) => { const q = sc(wx, y, wz); return q ? Math.max(1.5, .07 * F / q[2]) : 2; };
        c.strokeStyle = wood; c.lineCap = 'round';
        c.lineWidth = lw(1); c.beginPath(); addLine([wx - .72, 0, wz], [wx - .7, 1.7, wz]); addLine([wx + .72, 0, wz], [wx + .7, 1.7, wz]); c.stroke();
        c.lineWidth = lw(1.7) * .9; c.beginPath(); addLine([wx - .82, 1.68, wz], [wx + .82, 1.68, wz]); c.stroke();
        c.strokeStyle = rgb(os([.62, .52, .36], [0, 0, -1])); c.lineWidth = Math.max(1, lw(1) * .15); c.beginPath(); addLine([wx + .05, 1.66, wz], [wx + .05, .62 + .25, wz]); c.stroke();
        lathe(wx + .05, wz, [[.62, .1], [.84, .12], [.86, .125]], [.4, .26, .15], { open: 1 });
      }
      function palm(x, z, h, ph, col, os) { // a trunk and a crown of fronds; dark against the sky when col is given
        const b = sc(x, 0, z), tp = sc(x + .3 * Math.sin(ph), h, z); if (!b || !tp) return;
        const s = F / b[2], trunk = col || rgb(os([.42, .32, .22], [-.6, 0, -.8]));
        c.strokeStyle = trunk; c.lineCap = 'round'; c.lineWidth = Math.max(1, .3 * s);
        c.beginPath(); c.moveTo(b[0], b[1]); c.quadraticCurveTo((b[0] + tp[0]) / 2 + .2 * s * Math.sin(ph), (b[1] + tp[1]) / 2, tp[0], tp[1]); c.stroke();
        if (!col) { c.strokeStyle = 'rgba(30,20,12,.35)'; c.lineWidth = Math.max(1, .02 * s); c.beginPath(); for (let y = .3; y < h - .3; y += .35) { const q = sc(x + .3 * Math.sin(ph) * y / h, y, z); if (q) { c.moveTo(q[0] - .15 * s, q[1]); c.lineTo(q[0] + .15 * s, q[1] - .05 * s); } } c.stroke(); }
        c.strokeStyle = col || rgb(os([.3, .42, .24], [0, 1, 0])); c.lineWidth = Math.max(1, .12 * s);
        for (let f = 0; f < 10; f++) { const a = f / 10 * TAU + ph + .04 * Math.sin(t * .6 + x), l = 2.6 * s, dx = Math.cos(a) * l, dy = Math.sin(a) * l * .35 + l * .3 * Math.abs(Math.cos(a)); c.beginPath(); c.moveTo(tp[0], tp[1]); c.quadraticCurveTo(tp[0] + dx * .55, tp[1] - l * .22 + dy * .2, tp[0] + dx, tp[1] + dy * .9); c.stroke(); }
      }
    },
  };
})();
