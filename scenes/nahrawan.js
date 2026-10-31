// Nahrawan, 38 AH. The flat alluvial land east of the Tigris: a canal between raised spoil banks, a brick bridge,
// palms on the far bank. The Khawarij camp lies on the near bank beside the water; Ali's army comes across the plain;
// the battle is fought on the near side and never crosses the water; a few flee along the bank, a few of Ali's
// lights go down; at dusk a calm light walks slowly among the fallen.
// World units (about half a metre): x east (right), z north (away), y up. The canal runs across at z = ZC0..ZC1.
// The camera has yaw but no pitch or roll, so the horizon stays level.
(() => {
  const ZC0 = 1700, ZC1 = 1880, WL = -3; // canal banks and water level
  const BW = 15, BZ0 = ZC0 - 80, BZ1 = ZC1 + 95; // the bridge: half width, ends of its ramps
  const ZF = 1400; // the front
  const NA = 2000, NK = 1300, N = NA + NK;
  const NFLEE = 7, NDOWN = 5;
  // camera keys: p, x, height, z, horizon (fraction of screen height), yaw (radians, + turns right)
  const CAM = [
    [-.05, 430, 88, 1560, .5, -1.07], [0, 430, 88, 1560, .5, -1.07], [.1, 400, 98, 1536, .49, -1.04], [.17, 380, 160, 1360, .43, -.8],
    [.26, 380, 430, -60, .3, -.12], [.34, 360, 360, 200, .3, -.14], [.39, 540, 190, 950, .38, -.9], [.45, 540, 62, 1280, .46, -1.42], [.52, 470, 50, 1300, .47, -1.5],
    [.59, 320, 200, 1080, .37, -1.05], [.65, -1500, 110, 1480, .44, 1.45], [.71, -1800, 72, 1500, .46, 1.5],
    [.8, -500, 70, 1350, .47, 1.15], [.9, -330, 64, 1352, .47, 1.12], [1.05, -320, 62, 1352, .47, 1.12],
  ];
  // light keys: p, sky top, horizon, far ground, near ground, water
  const LK = [
    [0, [66, 78, 94], [206, 186, 156], [138, 120, 94], [70, 58, 45], [92, 104, 108]],
    [.3, [84, 90, 98], [214, 200, 176], [156, 136, 106], [84, 71, 55], [112, 120, 118]],
    [.56, [86, 86, 92], [206, 186, 156], [146, 124, 96], [78, 64, 50], [104, 108, 106]],
    [.7, [72, 70, 84], [220, 176, 128], [138, 108, 78], [64, 50, 38], [118, 106, 92]],
    [.79, [38, 38, 62], [204, 120, 78], [88, 64, 50], [36, 28, 24], [118, 80, 66]],
    [.88, [17, 21, 40], [112, 74, 72], [46, 38, 40], [20, 17, 17], [62, 52, 62]],
    [1.05, [11, 14, 28], [70, 52, 60], [32, 28, 32], [14, 12, 13], [40, 40, 52]],
  ];
  const keyv = (K, p) => {
    let i = 1;
    while (i < K.length - 1 && p > K[i][0]) i++;
    const A = K[i - 1], B = K[i], k = smooth(c01((p - A[0]) / (B[0] - A[0])));
    return A.slice(1).map((v, j) => (Array.isArray(v) ? v.map((q, m) => mix(q, B[j + 1][m], k)) : mix(v, B[j + 1], k)));
  };
  const spline = (K, p) => {
    const n = K.length;
    if (p <= K[0][0]) return K[0].slice(1);
    if (p >= K[n - 1][0]) return K[n - 1].slice(1);
    let i = 0;
    while (p > K[i + 1][0]) i++;
    const u = (p - K[i][0]) / (K[i + 1][0] - K[i][0]);
    const A = K[Math.max(0, i - 1)], B = K[i], Q = K[i + 1], D = K[Math.min(n - 1, i + 2)];
    return B.slice(1).map((_, j) => {
      const p0 = A[j + 1], p1 = B[j + 1], p2 = Q[j + 1], p3 = D[j + 1];
      return .5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (3 * p1 - p0 - 3 * p2 + p3) * u * u * u);
    });
  };
  const mixc = (a, b, k) => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];
  const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const hash = (n) => { const v = Math.sin(n * 91.7) * 43758.5453; return v - Math.floor(v); };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const sprite = (stops) => { const c = mk(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); stops.forEach(([o, s]) => gr.addColorStop(o, s)); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; };
  // the dusk search: the calm light walks among the fallen and stops
  const SEARCH = [[40, 1340], [-40, 1396], [-140, 1428], [-206, 1470], [-130, 1500], [-10, 1468], [80, 1488], [36, 1522]];
  const walkAt = (P, u) => {
    const n = P.length - 1, s = c01(u) * n, i = Math.min(n - 1, Math.floor(s)), k = smooth(s - i);
    return [mix(P[i][0], P[i + 1][0], k), mix(P[i][1], P[i + 1][1], k)];
  };

  S.nahrawan = {
    init(el, st) {
      st.cv = el.querySelector('canvas');
      st.ctx = st.cv.getContext('2d');
      st.bloom = mk(8, 8); st.bc = st.bloom.getContext('2d');
      st.puff = sprite([[0, 'rgba(170,150,122,.9)'], [.5, 'rgba(170,150,122,.35)'], [1, 'rgba(170,150,122,0)']]);
      st.smoke = sprite([[0, 'rgba(120,112,108,.7)'], [.6, 'rgba(120,112,108,.22)'], [1, 'rgba(120,112,108,0)']]);
      st.warm = sprite([[0, 'rgba(255,236,196,1)'], [.18, 'rgba(250,214,150,.5)'], [.5, 'rgba(240,190,120,.12)'], [1, 'rgba(240,190,120,0)']]);
      st.fire = sprite([[0, 'rgba(255,190,110,1)'], [.25, 'rgba(240,140,60,.35)'], [1, 'rgba(240,120,40,0)']]);
      const r = rng(3801);
      const F32 = () => new Float32Array(N);
      st.x0 = F32(); st.z0 = F32(); st.x1 = F32(); st.z1 = F32(); st.dep = F32(); st.d = F32(); st.ft = F32(); st.ph = F32(); st.fl = F32();
      st.SX = F32(); st.SY = F32(); st.SZ = F32();
      st.tone = new Uint8Array(N); st.role = new Uint8Array(N); // 1 flees, 2 falls on Ali's side
      const gs = () => (r() + r() + r() - 1.5) / 1.5;
      // the camp: low black goat-hair tents on the near bank, the road to the bridge kept clear
      st.tents = [];
      for (let k = 0; st.tents.length < 54 && k < 900; k++) {
        const x = -660 + r() * 980, z = 1490 + r() ** .8 * 140;
        if (Math.abs(x) < 46) continue;
        if (st.tents.some((q) => Math.abs(q.x - x) < 34 && Math.abs(q.z - z) < 26)) continue;
        st.tents.push({ x, z, w: 12 + r() * 9, d: 8 + r() * 5, h: 5.5 + r() * 3, pale: r() < .07 });
      }
      st.tents.sort((a, b) => b.z - a.z);
      st.fires = st.tents.filter(() => r() < .3).map((q) => ({ x: q.x + (r() - .5) * 20, z: q.z - 14 - r() * 6, ph: r() * TAU }));
      for (let i = 0; i < N; i++) {
        const ali = i < NA;
        st.ph[i] = r() * TAU;
        if (ali) {
          // staging on the plain to the south, in six columns; then a deep line facing north
          const u = i % 6, m = Math.floor(i / 6), col = m % 22, row = Math.floor(m / 22);
          st.x0[i] = -560 + u * 210 + col * 7.5 + r() * 3; st.z0[i] = -260 + row * 11 + r() * 4 - (u % 2) * 60;
          const dep = 14 + Math.floor(r() ** 1.25 * 22) * 11 + r() * 3;
          st.dep[i] = dep; st.x1[i] = -760 + r() * 1180 + gs() * 6; st.z1[i] = ZF - dep;
          st.d[i] = (1 - row / 16) * .05 + r() * .02;
          st.tone[i] = r() < .64 ? 0 : 1;
        } else {
          st.x0[i] = -660 + r() * 980 + gs() * 20; st.z0[i] = 1460 + r() ** .7 * 180;
          const dep = 12 + Math.floor(r() ** 1.15 * 14) * 10 + r() * 3;
          st.dep[i] = dep; st.x1[i] = -720 + r() * 1100 + gs() * 6; st.z1[i] = ZF + dep;
          st.d[i] = r() * .04;
          st.ft[i] = .44 + .12 * (dep / 150) + r() * .04;
          st.tone[i] = r() < .7 ? 2 : 3;
        }
      }
      // the few who flee: deep in the line at its west end
      const west = []; for (let i = NA; i < N; i++) if (st.x1[i] < -560 && st.dep[i] > 60) west.push(i);
      west.slice(0, NFLEE).forEach((i, k) => { st.role[i] = 1; st.ft[i] = 9; st.fl[i] = k; });
      // the few of Ali's who fall: scattered along the front rank
      const front = []; for (let i = 0; i < NA; i++) if (st.dep[i] < 26) front.push(i);
      front.sort((a, b) => st.x1[a] - st.x1[b]);
      for (let k = 0; k < NDOWN; k++) { const i = front[Math.floor((k + .5) / NDOWN * front.length)]; st.role[i] = 2; st.ft[i] = .5 + k * .012 + r() * .01; }
      st.ban = [];
      for (let k = 0; k < 22; k++) st.ban.push({ i: Math.floor(r() * NA), c: k % 3 ? [46, 117, 88] : [201, 165, 78] });
      for (let k = 0; k < 10; k++) st.ban.push({ i: NA + Math.floor(r() * NK), c: [70, 64, 60] });
      // land: ground strokes, reeds on both banks, palms on the banks and in the groves beyond
      st.marks = Array.from({ length: 1500 }, () => [-3200 + r() * 6400, -400 + r() ** .85 * (ZC0 - 500), r()]);
      st.reeds = [];
      for (let x = -3600; x < 3600; x += 2.4 + r() * 3.4) {
        if (Math.abs(x) < BW + 8) continue;
        st.reeds.push([x, ZC0 - 4 - r() * 14, 4 + r() * 6, r() * TAU]);
        if (r() < .7) st.reeds.push([x, ZC1 + 6 + r() * 16, 4 + r() * 6, r() * TAU]);
      }
      st.palms = [];
      for (let k = 0; k < 120; k++) { const x = -3400 + r() * 6800; if (Math.abs(x) < 50) continue; st.palms.push({ x, z: ZC1 + 40 + r() ** 1.6 * 420, h: 26 + r() * 16, l: (r() - .5) * 5, ph: r() * TAU }); }
      for (let k = 0; k < 34; k++) { const x = -3000 + r() * 6000; if (Math.abs(x) < 80 || (x > -700 && x < 340)) continue; st.palms.push({ x, z: ZC0 - 26 - r() * 26, h: 24 + r() * 14, l: (r() - .5) * 5, ph: r() * TAU }); }
      st.palms.sort((a, b) => b.z - a.z);
      st.FROND = Array.from({ length: 9 }, (_, j) => { const a = -Math.PI * .95 + j / 8 * Math.PI * .9 + (r() - .5) * .2, L = 7 + r() * 3; return [Math.cos(a) * L, Math.sin(a) * L * .45 - 1.5, Math.cos(a) * L * .6, -Math.abs(Math.sin(a)) * L * .55 - 3]; });
      st.grove = []; for (let x = -9000, h = 12; x < 9000; x += 18 + r() * 26) { const crown = Math.sin(x * .0031) ** 2 > .2 ? 1 : .35; h = mix(h, (10 + r() * 22) * crown + 3, .55); st.grove.push([x, h]); }
      st.fields = [];
      for (let k = 0; k < 150; k++) {
        const far = k < 50, w = 120 + r() * 300, d = 70 + r() * 170;
        const x = -3400 + r() * 6800, z = far ? ZC1 + 110 + r() * 1000 : -700 + r() * (ZC0 - 820);
        if (!far && x > -800 && x < 450 && z > 1050) continue; // keep the field of battle bare
        st.fields.push([x, z, w, d, r() < .35 ? 1 : 0, (r() - .5) * .14]);
      }
      st.glints = Array.from({ length: 170 }, () => [-3000 + r() * 6000, ZC0 + 10 + r() * (ZC1 - ZC0 - 20), 8 + r() * 30, r() * TAU]);
      st.dust = Array.from({ length: 44 }, () => [r(), (r() - .5) * 140, 4 + r() * 10, 40 + r() * 70, r() * TAU]);
      st.sparks = Array.from({ length: 240 }, () => [r(), r(), r() * 6 + 1, r()]);
      st.stars = Array.from({ length: 120 }, () => [r(), r() ** 1.6, r()]);
      st.torch = Array.from({ length: 4 }, (_, j) => ({ dx: [-26, 22, -14, 34][j], dz: [-18, -26, 20, 8][j], lag: .01 + j * .006, ph: r() * TAU }));
    },

    frame(p, t, el, st) {
      fit(st.cv);
      const c = st.ctx, W = st.cv.width, H = st.cv.height, k = W / Math.max(1, st.cv.clientWidth);
      const port = H > W * 1.1;
      let [camX, camY, camZ, hyF, yaw] = spline(CAM, p);
      if (port) { camY *= 1.35; camZ -= 120; hyF -= .02; } // phones: higher and further back so the bank fills the tall frame
      const F = port ? W * .9 : Math.min(W * .62, H * 1.05), hy = H * hyF, ox = W * .5;
      const cyw = Math.cos(yaw), syw = Math.sin(yaw);
      const [sky0, sky1, gFar, gNear, water] = keyv(LK, p);
      const dusk = smooth(seg(p, .72, .86)), night = smooth(seg(p, .84, 1));
      const fogLen = mix(2600, 1700, keyv([[0, .15], [.3, .4], [.45, 1], [.6, .7], [.75, .2], [1, .3]], p)[0]);
      const fog = (zr) => 1 - Math.exp(-zr / fogLen);
      // projection: returns screen x, y and depth; depth < 0 means behind the lens
      let PX = 0, PY = 0, PZ = 0;
      const pj = (x, y, z) => { const dx = x - camX, dz = z - camZ; PZ = dx * syw + dz * cyw; if (PZ < 8) return false; PX = ox + (dx * cyw - dz * syw) * F / PZ; PY = hy + (camY - y) * F / PZ; return true; };
      const depth = (x, z) => (x - camX) * syw + (z - camZ) * cyw;

      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      // ---------- sky ----------
      const sg = c.createLinearGradient(0, 0, 0, hy);
      sg.addColorStop(0, css(sky0)); sg.addColorStop(1, css(sky1));
      c.fillStyle = sg; c.fillRect(0, 0, W, hy + 2);
      if (night > 0) {
        c.fillStyle = 'rgb(232,228,214)';
        st.stars.forEach(([sx, sy, b]) => { const s = (.6 + b * .8) * k; c.globalAlpha = night * (.25 + .6 * b) * (.75 + .25 * Math.sin(t * 2 + b * 30)); c.fillRect(sx * W, sy * hy * .85, s, s); });
        c.globalAlpha = 1;
      }
      // the sun: morning in the east (right), evening in the west (left); placed by bearing, so it pans with the camera
      {
        const az = mix(1.15, -1.25, smooth(seg(p, .2, .8))), sx = ox + Math.tan(Math.max(-1.35, Math.min(1.35, az - yaw))) * F;
        const sa = mix(.32, .55, dusk) * (1 - night * .85), R = W * mix(.55, .75, dusk), sy = hy - F * .9 * Math.sin(Math.PI * smooth(seg(p, .08, .8)));
        const g = c.createRadialGradient(sx, sy, 0, sx, sy, R);
        g.addColorStop(0, `rgba(255,${mix(226, 170, dusk) | 0},${mix(178, 110, dusk) | 0},${sa})`); g.addColorStop(.3, `rgba(250,190,130,${sa * .3})`); g.addColorStop(1, 'rgba(250,190,130,0)');
        c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, 0, W, hy + 2); c.globalCompositeOperation = 'source-over';
      }
      // ---------- the land beyond: a flat plain to the horizon, groves of palms in the haze ----------
      { const lg = c.createLinearGradient(0, hy, 0, H); lg.addColorStop(0, css(mixc(gFar, sky1, .85))); lg.addColorStop(.35, css(mixc(gFar, sky1, .45))); lg.addColorStop(1, css(gNear)); c.fillStyle = lg; c.fillRect(0, hy, W, H - hy); }
      const band = (z, rows, col) => { // a grove silhouette at depth z
        c.fillStyle = col; c.beginPath(); let first = true;
        let x0 = 0, x1 = 0;
        for (const [x, h] of rows) { if (!pj(x, h, z)) continue; if (PX < -80 || PX > W + 80) continue; if (first) { x0 = x; c.moveTo(PX, PY); first = false; } else c.lineTo(PX, PY); x1 = x; }
        if (!first) { pj(x1, -2, z); c.lineTo(PX, PY); pj(x0, -2, z); c.lineTo(PX, PY); c.closePath(); c.fill(); }
      };
      band(ZC1 + 3400, st.grove.map(([x, h]) => [x, h * .6]), css(mixc([44, 54, 40], sky1, .9)));
      band(ZC1 + 1500, st.grove.map(([x, h], j) => [x * .7 + 333, h * (.8 + .4 * hash(j))]), css(mixc([36, 46, 32], sky1, .62)));
      // field patches between z0 and z1
      const fieldsIn = (z0, z1) => {
        st.fields.forEach(([x, z, w, d, green, v]) => {
          if (z < z0 || z > z1) return;
          const zr = depth(x + w / 2, z + d / 2); if (zr < 30) return;
          const base = mixc(mixc(gNear, gFar, c01(fog(zr) * 1.6)), sky1, fog(zr) * .45);
          const col = green ? mixc(base, [86, 96, 58], .3 * (1 - dusk * .6)) : mixc(base, v > 0 ? [255, 236, 200] : [0, 0, 0], Math.abs(v));
          c.beginPath(); let ok = true;
          [[x, z], [x + w, z], [x + w, z + d], [x, z + d]].forEach(([qx, qz], i) => { if (!pj(qx, 0, qz)) ok = false; else i ? c.lineTo(PX, PY) : c.moveTo(PX, PY); });
          if (!ok) return;
          c.fillStyle = css(col, z > ZC1 ? .28 : .4); c.fill();
          c.strokeStyle = css(mixc(base, [0, 0, 0], .25), .14); c.lineWidth = Math.max(.6, k * .6); c.stroke();
        });
      };
      // a world polygon [[x, y, z], ...], clipped at the near plane, as the current path; false when nothing is left
      const polyW = (pts) => {
        const cs = pts.map(([x, y, z]) => { const dx = x - camX, dz = z - camZ; return [dx * cyw - dz * syw, y, dx * syw + dz * cyw]; });
        const out = [], NZ = 8;
        for (let i = 0; i < cs.length; i++) {
          const a = cs[i], b = cs[(i + 1) % cs.length];
          if (a[2] >= NZ) out.push(a);
          if ((a[2] >= NZ) !== (b[2] >= NZ)) { const u = (NZ - a[2]) / (b[2] - a[2]); out.push([mix(a[0], b[0], u), mix(a[1], b[1], u), NZ]); }
        }
        if (out.length < 3) return false;
        c.beginPath();
        out.forEach(([rx, y, rz], i) => { const X0 = ox + rx * F / rz, Y0 = hy + (camY - y) * F / rz; i ? c.lineTo(X0, Y0) : c.moveTo(X0, Y0); });
        c.closePath();
        return true;
      };
      const XL = camX - 4e4, XR = camX + 4e4;
      // a ground strip along the canal between (z0, y0) and (z1, y1)
      const strip = (z0, y0, z1, y1, fill) => { if (polyW([[XL, y0, z0], [XR, y0, z0], [XR, y1, z1], [XL, y1, z1]])) { c.fillStyle = fill; c.fill(); } };
      const zrMid = (z) => Math.max(50, z - camZ);
      fieldsIn(ZC1 + 90, 1e9);
      // ---------- palms (a batch per depth band) ----------
      const palmsIn = (zlo, zhi, dir = 1, alpha = 1) => {
        const groups = new Map();
        for (const pm of st.palms) {
          if (pm.z < zlo || pm.z >= zhi) continue;
          const by0 = pm.z > ZC1 && pm.z < ZC1 + 72 ? 9 : pm.z < ZC0 && pm.z > ZC0 - 60 ? 3 : 0;
          if (!pj(pm.x, dir > 0 ? by0 : 2 * WL - by0, pm.z)) continue;
          const bx = PX, by = PY, zr = PZ, s = F / zr;
          if (bx < -60 * s || bx > W + 60 * s) continue;
          const key = Math.min(5, Math.floor(fog(zr) * 6));
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push([bx, by, s, pm]);
        }
        groups.forEach((list, key) => {
          const f = (key + .5) / 6, col = css(dir > 0 ? mixc(mixc(gNear, [22, 30, 18], .55), sky1, Math.min(.92, f * .95)) : mixc(mixc(water, [10, 14, 12], .5), sky1, f * .6), alpha);
          c.strokeStyle = col; c.lineCap = 'round';
          list.forEach(([bx, by, s, pm]) => {
            const tx = bx + pm.l * s, ty = by - pm.h * s * dir, sw = Math.sin(t * .8 + pm.ph) * .6 * s;
            c.lineWidth = Math.max(.8, .9 * s); c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + pm.l * .2 * s, by - pm.h * .5 * s * dir, tx, ty); c.stroke();
            c.lineWidth = Math.max(.7, .65 * s); c.beginPath();
            st.FROND.forEach(([ex, ey, qx, qy]) => { c.moveTo(tx, ty); c.quadraticCurveTo(tx + qx * s + sw * .3, ty + qy * s * dir, tx + ex * s + sw, ty - ey * s * dir); });
            c.stroke();
          });
        });
      };
      palmsIn(ZC1 + 30, 1e9);
      // far bank: the spoil bank's face towards the water, its crest
      const fbk = mixc(gFar, sky1, fog(zrMid(ZC1)) * .62);
      strip(ZC1 + 70, 9, ZC1 + 34, 10, css(mixc(fbk, [255, 240, 210], .05)));
      strip(ZC1 + 34, 10, ZC1, WL, css(mixc(fbk, [0, 0, 0], .12)));
      const ARCH = []; for (let a = 0; a < 5; a++) { const z0 = ZC0 + a * 38, z1 = z0 + 28; ARCH.push([z0, z1]); }
      const bridgeFace = (xs, mirror, fill) => {
        const Y = (y) => (mirror ? 2 * WL - y : y);
        c.beginPath();
        const out = [[BZ0, 8], [ZC0 - 30, 18], [ZC1 + 30, 18], [BZ1, 8], [BZ1, 0], [ZC1 + 6, WL], [ZC0 - 6, WL], [BZ0, 0]];
        let ok = true;
        out.forEach(([z, y], i) => { if (!pj(xs, Y(y), z)) ok = false; else i ? c.lineTo(PX, PY) : c.moveTo(PX, PY); });
        if (!ok) return;
        c.closePath();
        ARCH.forEach(([z0, z1]) => {
          const zc = (z0 + z1) / 2, R = (z1 - z0) / 2;
          pj(xs, Y(WL), z0); c.moveTo(PX, PY);
          for (let q = 0; q <= 12; q++) { const an = Math.PI - q / 12 * Math.PI; pj(xs, Y(1 + Math.sin(an) * R * .92), zc + Math.cos(an) * R); c.lineTo(PX, PY); }
          pj(xs, Y(WL), z1); c.lineTo(PX, PY); c.closePath();
        });
        c.fillStyle = fill; c.fill('evenodd');
        if (mirror) return;
        c.beginPath();
        ARCH.forEach(([z0, z1]) => {
          const zc = (z0 + z1) / 2, R = (z1 - z0) / 2;
          pj(xs, WL, z0); c.moveTo(PX, PY);
          for (let q = 0; q <= 12; q++) { const an = Math.PI - q / 12 * Math.PI; pj(xs, 1 + Math.sin(an) * R * .92, zc + Math.cos(an) * R); c.lineTo(PX, PY); }
          pj(xs, WL, z1); c.lineTo(PX, PY); c.closePath();
        });
        c.fillStyle = 'rgba(12,12,14,.42)'; c.fill();
        c.strokeStyle = 'rgba(20,14,10,.14)'; c.lineWidth = Math.max(.5, k * .5); c.beginPath();
        for (let y = 2; y < 18; y += 2.2) { let on = false; for (let z = ZC0 - 30; z <= ZC1 + 30; z += 20) { if (!pj(xs, y, z)) { on = false; continue; } on ? c.lineTo(PX, PY) : c.moveTo(PX, PY); on = true; } }
        c.stroke();
      };
      // ---------- the canal ----------
      {
        if (polyW([[XL, WL, ZC1], [XR, WL, ZC1], [XR, WL, ZC0], [XL, WL, ZC0]])) {
          const dn = Math.max(20, depth(camX, ZC0) * .9), ybot = Math.min(H, hy + (camY - WL) * F / dn);
          const wg = c.createLinearGradient(0, hy, 0, Math.max(hy + 4, ybot));
          wg.addColorStop(0, css(mixc(water, sky1, .7))); wg.addColorStop(.5, css(mixc(water, sky1, .3))); wg.addColorStop(1, css(mixc(water, [12, 16, 20], .35)));
          c.save(); c.fillStyle = wg; c.fill(); c.clip();
          palmsIn(ZC1 + 30, ZC1 + 260, -1, .45);
          const sd = camX > BW ? BW : camX < -BW ? -BW : 0;
          if (sd) { c.globalAlpha = .5; bridgeFace(sd, true, css(mixc(mixc([150, 118, 86], water, .5), [0, 0, 0], .25))); c.globalAlpha = 1; }
          c.restore();
        }
        // the sky's light on the water
        c.strokeStyle = css(mixc(sky1, [255, 250, 236], .4), .25 + .25 * dusk * (1 - night)); c.lineWidth = Math.max(1, k * .8);
        c.beginPath();
        st.glints.forEach(([x, z, L, ph]) => {
          if (!pj(x + Math.sin(t * .4 + ph) * 10, WL, z)) return;
          const l = L * F / PZ * (.6 + .4 * Math.sin(t * 1.3 + ph));
          c.moveTo(PX - l / 2, PY); c.lineTo(PX + l / 2, PY);
        });
        c.stroke();
      }
      // ---------- the bridge: brick piers and five arches, its reflection first ----------
      const bf = fog(zrMid(ZC0)) * .55;
      const brick = mixc(mixc([150, 118, 86], gFar, .35).map((v) => v * mix(1, .45, dusk)), sky1, bf);
      const side = camX > BW ? BW : camX < -BW ? -BW : 0;
      // deck: the road over the bridge, a pale worn band
      {
        const pts = [[-BW, BZ0, 8], [BW, BZ0, 8], [BW, ZC0 - 30, 18], [BW, ZC1 + 30, 18], [BW, BZ1, 8], [-BW, BZ1, 8], [-BW, ZC1 + 30, 18], [-BW, ZC0 - 30, 18]];
        c.beginPath(); let ok = true;
        pts.forEach(([x, z, y], i) => { if (!pj(x, y, z)) ok = false; else i ? c.lineTo(PX, PY) : c.moveTo(PX, PY); });
        if (ok && camY > 8) { c.closePath(); c.fillStyle = css(mixc(brick, [255, 244, 222], .12)); c.fill(); }
      }
      if (side) {
        bridgeFace(side, false, css(mixc(brick, [0, 0, 0], camX > 0 ? .12 : .3)));
        // the parapet's top edge catches the light
        c.strokeStyle = css(mixc(brick, [255, 240, 214], .25), .8); c.lineWidth = Math.max(1, .5 * F / Math.max(60, depth(side, ZC0)));
        c.beginPath(); [[BZ0, 8], [ZC0 - 30, 18], [ZC1 + 30, 18], [BZ1, 8]].forEach(([z, y], i) => { if (pj(side, y + 1.2, z)) i ? c.lineTo(PX, PY) : c.moveTo(PX, PY); }); c.stroke();
      }
      // ---------- near bank: the spoil bank, palms and reeds along it ----------
      const nbk = mixc(gFar, sky1, fog(zrMid(ZC0)) * .5);
      strip(ZC0, 3, ZC0 - 22, 3.5, css(mixc(nbk, [255, 240, 210], .06)));
      strip(ZC0 - 22, 3.5, ZC0 - 50, 0, css(mixc(mixc(nbk, gNear, .3), [0, 0, 0], .06)));
      palmsIn(-1e9, ZC1 + 30);
      const rc = mixc(mixc(gNear, [54, 64, 34], .55), sky1, fog(zrMid(ZC0)) * .5);
      c.strokeStyle = css(rc, .9); c.lineWidth = Math.max(1, k * .7);
      c.beginPath();
      st.reeds.forEach(([x, z, h, ph]) => {
        if (!pj(x, z < ZC0 ? 3 : 9, z)) return; const X0 = PX, Y0 = PY; if (X0 < -4 || X0 > W + 4) return;
        pj(x + Math.sin(t * .9 + ph + x * .01) * .8, (z < ZC0 ? 3 : 9) + h, z); c.moveTo(X0, Y0); c.lineTo(PX, PY);
      });
      c.stroke();
      // ---------- the plain ----------
      {
        if (polyW([[XL, 0, ZC0 - 50], [XR, 0, ZC0 - 50], [XR, 0, -4e4], [XL, 0, -4e4]])) {
          const gg = c.createLinearGradient(0, hy, 0, H);
          gg.addColorStop(0, css(mixc(gFar, sky1, .8))); gg.addColorStop(.12, css(mixc(gFar, sky1, .4))); gg.addColorStop(1, css(gNear));
          c.fillStyle = gg; c.fill();
        }
      }
      fieldsIn(-1e9, ZC0 - 60);
      c.lineWidth = Math.max(1, k * .7);
      [0, 1].forEach((pass) => {
        c.strokeStyle = pass ? css(mixc(gNear, [255, 236, 200], .14), .2) : css(mixc(gNear, [0, 0, 0], .35), .28);
        c.beginPath();
        st.marks.forEach(([x, z, q]) => {
          if ((q > .5) !== !!pass) return;
          if (!pj(x, 0, z) || PZ < 40) return;
          const l = (8 + q * 20) * F / PZ;
          if (PX < -l || PX > W + l || PY > H + 2) return;
          c.moveTo(PX - l / 2, PY); c.lineTo(PX + l / 2, PY);
        });
        c.stroke();
      });

      // ---------- the camp ----------
      const lum = c01(gNear[0] / 84), tentLit = mixc([60, 50, 40], [255, 236, 200], .08 * (1 - dusk)).map((v) => v * lum);
      st.tents.forEach((q) => {
        const f = fog(zrMid(q.z)) * .6;
        const body = mixc((q.pale ? [118, 102, 82] : [36, 30, 26]).map((v) => v * lum), sky1, f), roof = mixc(q.pale ? [150 * lum, 132 * lum, 106 * lum] : tentLit, sky1, f);
        const hw = q.w / 2;
        if (camY > q.h && pj(q.x - hw, q.h * .82, q.z + q.d)) { // the roof seen from above: ridged cloth between front and back
          c.beginPath(); c.moveTo(PX, PY); pj(q.x + hw, q.h * .82, q.z + q.d); c.lineTo(PX, PY); pj(q.x + hw, q.h * .82, q.z); c.lineTo(PX, PY); pj(q.x - hw, q.h * .82, q.z); c.lineTo(PX, PY);
          c.fillStyle = css(roof); c.fill();
        }
        if (!pj(q.x - hw, 0, q.z)) return;
        c.beginPath(); c.moveTo(PX, PY);
        pj(q.x - hw + 1, q.h * .8, q.z); c.lineTo(PX, PY); pj(q.x - hw * .3, q.h, q.z); c.lineTo(PX, PY); pj(q.x + hw * .3, q.h, q.z); c.lineTo(PX, PY);
        pj(q.x + hw - 1, q.h * .8, q.z); c.lineTo(PX, PY); pj(q.x + hw, 0, q.z); c.lineTo(PX, PY); c.closePath();
        c.fillStyle = css(body); c.fill();
        if (pj(q.x - hw * .18, 0, q.z) && F / PZ > .8) { const X0 = PX, Y0 = PY; pj(q.x + hw * .18, q.h * .62, q.z); c.fillStyle = css(mixc(body, [0, 0, 0], .5)); c.fillRect(X0, PY, PX - X0, Y0 - PY); }
      });
      // camp smoke: thin columns in the morning, again at dusk from the army's fires
      {
        const sA = .55 * (1 - seg(p, .3, .4)) + .4 * seg(p, .66, .8);
        if (sA > .01) st.fires.forEach((fq, j) => {
          for (let m = 0; m < 5; m++) {
            const u = ((t * .05 + m / 5 + hash(j)) % 1), y = 4 + u * 70, dr = u * u * 40;
            if (!pj(fq.x + dr + Math.sin(u * 6 + fq.ph) * 4, y, fq.z)) continue;
            const R = (6 + u * 22) * F / PZ;
            c.globalAlpha = sA * (1 - u) * .5 * (1 - fog(PZ) * .5); c.drawImage(st.smoke, PX - R, PY - R, R * 2, R * 2);
          }
        });
        c.globalAlpha = 1;
      }

      // ---------- the people ----------
      const march = (i) => ease.io(seg(p, .17 + st.d[i], .36 + st.d[i]));
      const form = (i) => ease.io(seg(p, .26 + st.d[i], .36 + st.d[i]));
      const charge = ease.in(seg(p, .41, .47));
      const press = smooth(seg(p, .47, .58));
      const fight = seg(p, .43, .47) * (1 - seg(p, .56, .61));
      const loosen = ease.io(seg(p, .63 + .0 , .76));
      const { SX, SY, SZ } = st;
      const posK = (i, q) => { // a Khawarij man at progress q
        const a = ease.io(seg(q, .26 + st.d[i], .36 + st.d[i]));
        let x = mix(st.x0[i], st.x1[i], a), z = mix(st.z0[i], st.z1[i], a);
        const ch = ease.in(seg(q, .41, .47));
        z -= ch * (st.dep[i] * .55 + 4);
        if (q > .43) x += Math.sin(q * 120 + st.ph[i]) * 3 * seg(q, .43, .47);
        return [x, z];
      };
      const fallen = [];
      for (let i = 0; i < N; i++) {
        SZ[i] = 0;
        let x, z, y = 1.6;
        if (i < NA) {
          const a = march(i);
          x = mix(st.x0[i], st.x1[i], a); z = mix(st.z0[i], st.z1[i], a) + press * 18;
          if (fight > 0 && st.dep[i] < 40) z += Math.sin(p * 150 + st.ph[i]) * 2.5 * fight;
          if (loosen > 0 && st.role[i] !== 2) { x = mix(x, -700 + hash(i + 3) * 1500, loosen); z = mix(z, 260 + hash(i + 5) ** .8 * 520, loosen); }
          if (st.role[i] === 2 && p > st.ft[i]) { const q = seg(p, st.ft[i], st.ft[i] + .03); y = mix(1.6, .2, ease.out(q)); const fz = mix(st.z0[i], st.z1[i], 1) + press * 18; z = fz; x = st.x1[i]; }
        } else if (st.role[i] === 1) { // the few who get away: along the foot of the bank, west, into the palms
          const q = seg(p, .585 + st.fl[i] * .005, .72 + st.fl[i] * .005);
          [x, z] = posK(i, Math.min(p, .585));
          if (q > 0) { const v = ease.in(q); x = mix(x, -2600 - st.fl[i] * 30, v); z = mix(z, ZC0 - 100 - (st.fl[i] % 3) * 14, smooth(c01(q * 2.2))); }
          if (q >= 1) continue;
        } else {
          if (p >= st.ft[i]) { const [fx, fz] = posK(i, st.ft[i]); fallen.push(fx + Math.sin(st.ph[i]) * 4, fz + Math.cos(st.ph[i]) * 4, st.ph[i]); continue; }
          [x, z] = posK(i, p);
        }
        const ji = .5 * Math.sin(t * 2.2 + st.ph[i]) * (1 - night * .6);
        if (!pj(x + ji, y, z) || PZ < 30) continue;
        SX[i] = PX; SY[i] = PY; SZ[i] = PZ;
      }
      // dust at the heels of the few who flee
      c.globalAlpha = 1;
      for (let i = NA; i < N; i++) {
        if (st.role[i] !== 1 || !SZ[i]) continue;
        const q = seg(p, .585 + st.fl[i] * .005, .72 + st.fl[i] * .005); if (q <= 0) continue;
        const s = F / SZ[i], R = 9 * s;
        c.globalAlpha = .6 * Math.sin(Math.PI * q); c.drawImage(st.puff, SX[i] - R * 1.5, SY[i] - R * .9, R * 3, R * 1.4);
      }
      c.globalAlpha = 1;
      // the fallen of the Khawarij: dark low shapes on the ground before the water
      if (fallen.length) {
        c.fillStyle = css(mixc([30, 24, 20], sky1, .1), .6 + .2 * dusk); c.beginPath();
        for (let j = 0; j < fallen.length; j += 3) {
          if (!pj(fallen[j], .4, fallen[j + 1])) continue;
          const s = F / PZ, w = Math.max(1.4 * k, 4.2 * s), h = Math.max(.8 * k, 1.1 * s);
          if (PX < -w || PX > W + w || PY > H + h) continue;
          const sl = Math.sin(fallen[j + 2] * 5) * .3;
          c.rect(PX - w / 2, PY - h / 2 + sl * h, w, h);
        }
        c.fill();
      }
      // dots in depth bands per tone, so fog can tint them
      const COL = [
        mixc([236, 210, 140], [255, 222, 150], dusk), mixc([168, 210, 172], [210, 226, 190], dusk),
        mixc([172, 132, 112], [104, 72, 64], dusk), mixc([150, 140, 132], [88, 78, 74], dusk),
      ];
      const bands = [0, 500, 900, 1400, 1e9], figs = [];
      for (let tone = 0; tone < 4; tone++) {
        for (let b = 0; b < 4; b++) {
          const zm = Math.min(2600, (bands[b] + Math.min(2600, bands[b + 1])) / 2);
          const f = fog(zm) * (tone < 2 ? .4 : .5) * (1 - night * .5);
          c.fillStyle = css(mixc(COL[tone], sky1, f), tone < 2 ? .95 - .35 * night : .9);
          c.beginPath();
          for (let i = tone < 2 ? 0 : NA, e = tone < 2 ? NA : N; i < e; i++) {
            if (st.tone[i] !== tone && !(tone === 3 && st.role[i] === 1)) continue;
            if (tone === 2 && st.role[i] === 1) continue;
            const zr = SZ[i]; if (zr <= 0 || zr < bands[b] || zr >= bands[b + 1]) continue;
            const x = SX[i], y = SY[i]; if (x < -6 || x > W + 6 || y < -6 || y > H + 6) continue;
            const s = Math.max(1.3 * k, 2.6 * F / zr);
            if (s < 4.2 * k && st.role[i] !== 1) c.rect(x - s / 2, y - s, s, s); else figs.push(x, y, Math.max(s, 4.2 * k), tone);
          }
          c.fill();
        }
      }
      // near figures: cloaked shapes, darker than the ground, a little of their side's colour on the shoulders
      if (figs.length) {
        for (let side = 0; side < 2; side++) {
          c.fillStyle = css(mixc(side ? [74, 52, 46] : [58, 54, 44], sky1, .12 * (1 - night)), .96); c.beginPath();
          for (let j = 0; j < figs.length; j += 4) {
            if ((figs[j + 3] > 1) !== !!side) continue;
            const x = figs[j], y = figs[j + 1], s = figs[j + 2], h = 1.55 * s, b = .34 * s, tp = .17 * s;
            c.moveTo(x - b, y); c.lineTo(x - tp, y - h * .82); c.lineTo(x - tp * .7, y - h); c.lineTo(x + tp * .7, y - h); c.lineTo(x + tp, y - h * .82); c.lineTo(x + b, y); c.closePath();
          }
          c.fill();
          c.fillStyle = css(mixc(side ? [150, 128, 112] : [214, 200, 170], [30, 26, 24], .6 * dusk), .9); c.beginPath();
          for (let j = 0; j < figs.length; j += 4) {
            if ((figs[j + 3] > 1) !== !!side) continue;
            const x = figs[j], y = figs[j + 1], s = figs[j + 2], h = 1.55 * s;
            c.rect(x - .15 * s, y - h - .02 * s, .3 * s, .2 * s);
          }
          c.fill();
        }
        c.strokeStyle = css(mixc([60, 52, 44], sky1, .2), .8); c.lineWidth = Math.max(.6, k * .6); c.beginPath();
        for (let j = 0; j < figs.length; j += 4) { if (j % 12) continue; const x = figs[j] + .22 * figs[j + 2], y = figs[j + 1]; c.moveTo(x, y - .2 * figs[j + 2]); c.lineTo(x + .1 * figs[j + 2], y - 2.6 * figs[j + 2]); }
        c.stroke();
      }
      // banners on their poles
      const live = 1 - night;
      st.ban.forEach(({ i, c: col }, j) => {
        const zr = SZ[i]; if (!zr) return;
        if (i >= NA && p > st.ft[i]) return;
        const x = SX[i], s = F / zr, y0 = SY[i], y1 = y0 - 9 * s;
        const f = fog(zr) * .6;
        c.strokeStyle = css(mixc([40, 32, 24], sky1, f), .9); c.lineWidth = Math.max(1, .3 * s);
        c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
        c.fillStyle = css(mixc(mixc(col, [20, 18, 24], .5 * dusk), sky1, f)); c.fillRect(x, y1, 3.4 * s * (.85 + .15 * Math.sin(t * 3 + j) * live) * (j % 2 ? 1 : -1), 2.2 * s);
      });

      // ---------- bloom: dust, sparks, lights ----------
      const bc = st.bc, BWd = Math.max(8, Math.round(W / 5)), BH = Math.max(8, Math.round(H / 5));
      if (st.bloom.width !== BWd || st.bloom.height !== BH) { st.bloom.width = BWd; st.bloom.height = BH; }
      bc.setTransform(1, 0, 0, 1, 0, 0); bc.clearRect(0, 0, BWd, BH); bc.setTransform(BWd / W, 0, 0, BH / H, 0, 0);
      const dustA = fight * .26 + .05 * seg(p, .18, .24) * (1 - seg(p, .34, .4)) + .04 * seg(p, .55, .58) * (1 - seg(p, .6, .68));
      if (dustA > .005) {
        st.dust.forEach(([u, dx, y, R, ph]) => {
          const marchD = p < .4;
          const x0 = marchD ? -700 + u * 1200 : -720 + u * 1100, z0 = marchD ? mix(100, ZF - 160, seg(p, .18, .36)) - dx : ZF + dx * .5;
          if (!pj(x0 + Math.sin(t * .2 + ph) * 20, y, z0) || PZ < 60) return;
          const r = R * F / PZ;
          c.globalAlpha = dustA * (1 - fog(PZ) * .5);
          c.drawImage(st.puff, PX - r * 1.6, PY - r, r * 3.2, r * 2);
        });
        c.globalAlpha = 1;
      }
      if (fight > 0) {
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        const dens = fight * .5;
        st.sparks.forEach(([u, jx, y, ph], j) => {
          const blink = hash(Math.floor(t * 9 + ph * 50) + j * 13.1);
          if (blink > dens) return;
          if (!pj(-720 + u * 1100, y, ZF + press * 18 + (jx - .5) * 16)) return;
          const s = F / PZ, a = (1 - blink / Math.max(.01, dens)) * .6;
          c.strokeStyle = `rgba(255,${190 + 50 * hash(j)},${120 + 60 * hash(j + 1)},${a})`; c.lineWidth = Math.max(1, .3 * s);
          const ang = hash(j + 7) * TAU, L = (1.5 + 3 * hash(j + 3)) * s;
          c.beginPath(); c.moveTo(PX, PY); c.lineTo(PX + Math.cos(ang) * L, PY + Math.sin(ang) * L); c.stroke();
          bc.fillStyle = `rgba(255,200,130,${a * .6})`; bc.fillRect(PX - 3 * k, PY - 3 * k, 6 * k, 6 * k);
        });
        c.globalCompositeOperation = 'source-over';
      }
      // Ali's army glows faintly in the bloom, and at dusk their torches
      bc.fillStyle = `rgba(240,200,120,${.1 + .35 * dusk})`; bc.beginPath();
      for (let i = 0; i < NA; i++) { const zr = SZ[i]; if (!zr || (i % 3 && dusk < .5)) continue; const s = Math.min(3 * k, Math.max(2 * k, 3.4 * F / zr)); bc.rect(SX[i] - s, SY[i] - s * 1.5, s * 2, s * 2); }
      bc.fill();
      c.globalCompositeOperation = 'lighter';
      // the fallen of Ali's side: a light lowered to the ground, a soft mark that stays
      for (let i = 0; i < NA; i++) {
        if (st.role[i] !== 2 || p < st.ft[i] || !SZ[i]) continue;
        const q = seg(p, st.ft[i], st.ft[i] + .04), s = F / SZ[i], X0 = SX[i], Y0 = SY[i];
        const I = (1 + 1.4 * Math.sin(Math.PI * q)) * (1 - .4 * night);
        const R = Math.max(3 * k, 7 * s);
        c.globalAlpha = Math.min(1, .45 * I); c.drawImage(st.warm, X0 - R * 2, Y0 - R, R * 4, R * 2);
        const lg = c.createLinearGradient(0, Y0, 0, Y0 - 12 * s);
        lg.addColorStop(0, `rgba(243,226,170,${.16 * I * c01(q * 3)})`); lg.addColorStop(1, 'rgba(243,226,170,0)');
        c.globalAlpha = 1; c.fillStyle = lg; c.fillRect(X0 - Math.max(.5, .3 * s), Y0 - 12 * s, Math.max(1, .6 * s), 12 * s);
      }
      // ---------- Ali: a calm warm light, larger than the rest ----------
      {
        const on = seg(p, .17, .22);
        let ax, az;
        if (p < .72) { const a = ease.io(seg(p, .17, .36)); ax = mix(-60, -90, a); az = mix(40, ZF - 70, a) + press * 16; }
        else { const u = ease.io(seg(p, .76, .9)); [ax, az] = walkAt(SEARCH, u); if (p < .76) { const a = smooth(seg(p, .72, .76)); ax = mix(-90, SEARCH[0][0], a); az = mix(ZF - 70 + 16, SEARCH[0][1], a); } }
        const found = smooth(seg(p, .895, .93));
        if (on > 0 && pj(ax, 2.4, az)) {
          const s = F / PZ, X0 = PX, Y0 = PY, I = on * (1 + .25 * dusk + .35 * found * (1 - .3 * Math.sin(Math.PI * seg(p, .9, .99))));
          const R = Math.max(5 * k, 3.4 * s);
          c.globalAlpha = Math.min(1, .5 * I); c.drawImage(st.warm, X0 - R * 9, Y0 - R * 9, R * 18, R * 18);
          c.globalAlpha = Math.min(1, .9 * I); c.drawImage(st.warm, X0 - R * 2.4, Y0 - R * 2.4, R * 4.8, R * 4.8);
          // the pool of light it throws on the ground
          if (pj(ax, 0, az)) { const gr = 44 * F / PZ; c.globalAlpha = .38 * I * (.4 + .6 * dusk); c.drawImage(st.warm, PX - gr, PY - gr * .3, gr * 2, gr * .6); }
          c.globalAlpha = 1;
          bc.fillStyle = `rgba(255,240,210,${.5 * I})`; bc.beginPath(); bc.arc(X0, Y0, Math.min(R * 3, 40 * k), 0, TAU); bc.fill();
          // torches that walk with him at dusk
          if (dusk > .05) st.torch.forEach((T) => {
            const u = ease.io(seg(p, .76 + T.lag, .9 + T.lag)), [tx, tz] = p < .76 ? [ax, az] : walkAt(SEARCH, u);
            if (!pj(tx + T.dx, 3.2, tz + T.dz)) return;
            const fk = .8 + .2 * Math.sin(t * 9 + T.ph) * Math.sin(t * 5.3 + T.ph * 2), R2 = Math.max(2.5 * k, 2.2 * F / PZ) * fk;
            c.globalAlpha = Math.min(1, .8 * dusk); c.drawImage(st.fire, PX - R2 * 4, PY - R2 * 4, R2 * 8, R2 * 8); c.globalAlpha = 1;
            bc.fillStyle = `rgba(255,170,90,${.4 * dusk})`; bc.beginPath(); bc.arc(PX, PY, Math.min(R2 * 3, 14 * k), 0, TAU); bc.fill();
          });
        }
      }
      // the army's fires at dusk, out on the plain
      if (dusk > .05) {
        for (let j = 0; j < 26; j++) {
          const x = -800 + hash(j + 2) * 1500, z = 300 + hash(j + 9) * 480;
          if (!pj(x, 1, z)) continue;
          const R = Math.max(2 * k, 3 * F / PZ) * (.85 + .15 * Math.sin(t * 7 + j));
          c.globalAlpha = .7 * dusk; c.drawImage(st.fire, PX - R * 3, PY - R * 3, R * 6, R * 6);
        }
        c.globalAlpha = 1;
      }
      c.globalAlpha = .85; c.drawImage(st.bloom, 0, 0, W, H); c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';

      // ---------- grade ----------
      if (fight > 0) { c.fillStyle = `rgba(170,140,100,${.08 * fight})`; c.fillRect(0, 0, W, H); }
      const vg = c.createRadialGradient(W * .5, H * .55, Math.min(W, H) * .3, W * .5, H * .55, Math.hypot(W, H) * .6);
      vg.addColorStop(0, 'rgba(13,14,11,0)'); vg.addColorStop(1, `rgba(13,14,11,${.55 + .2 * dusk})`);
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
    },
  };
})();
