// العتق: an oasis farm at dawn, the years he worked the land with his own hands. A well with its frame and trough,
// channels that fill from it and catch the sky, plots of barley, date palms along the paths. A thousand stand bound in
// rows by one cord; one by one the cord falls from them and they walk out along the palm-lined paths into the sunrise.
// The DOM counter is the number whose release has come: each of the thousand has its own release p, set in init.
// World in metres: x right, y up, z east (towards the sunrise). Pinhole camera; people and palms bucketed by distance.
// Ali works the well: a veiled figure with a gold disc behind the head (scenes/holy.js); no face is ever drawn. The
// thousand are faceless silhouettes.
(() => {
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const tone = (x) => 255 * (1 - Math.exp(-1.2 * x));
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const sprite = (stops, n = 128) => { const c = mk(n, n), g = c.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); stops.forEach(([o, s]) => gr.addColorStop(o, s)); g.fillStyle = gr; g.fillRect(0, 0, n, n); return c; };
  const spline = (K, p) => {
    const n = K.length;
    if (p <= K[0][0]) return K[0].slice(1);
    if (p >= K[n - 1][0]) return K[n - 1].slice(1);
    let i = 0;
    while (p > K[i + 1][0]) i++;
    const u = (p - K[i][0]) / (K[i + 1][0] - K[i][0]);
    const A = K[Math.max(0, i - 1)], B = K[i], Q = K[i + 1], D = K[Math.min(n - 1, i + 2)];
    return B.slice(1).map((_, j) => { const p0 = A[j + 1], p1 = B[j + 1], p2 = Q[j + 1], p3 = D[j + 1]; return .5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (3 * p1 - p0 - 3 * p2 + p3) * u * u * u); });
  };
  const keyv = (K, p) => {
    let i = 1;
    while (i < K.length - 1 && p > K[i][0]) i++;
    const A = K[i - 1], B = K[i], k = smooth(c01((p - A[0]) / (B[0] - A[0])));
    return A.slice(1).map((v, j) => (Array.isArray(v) ? mixc(v, B[j + 1], k) : mix(v, B[j + 1], k)));
  };
  const cr = (a, b, c, d, u) => [0, 1].map((j) => .5 * (2 * b[j] + (c[j] - a[j]) * u + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * u * u + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * u * u * u));
  function route(pts, ds) {
    const P = [];
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], d = pts[Math.min(pts.length - 1, i + 2)]; for (let k = 0; k < 16; k++) P.push(cr(a, b, c, d, k / 16)); }
    P.push(pts[pts.length - 1]);
    const acc = [0];
    for (let i = 1; i < P.length; i++) acc.push(acc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const L = acc[acc.length - 1], n = Math.ceil(L / ds) + 1;
    const X = new Float32Array(n), Z = new Float32Array(n), NX = new Float32Array(n), NZ = new Float32Array(n);
    for (let k = 0, j = 0; k < n; k++) {
      const s = Math.min(L, k * ds);
      while (j < acc.length - 2 && acc[j + 1] < s) j++;
      const f = (s - acc[j]) / ((acc[j + 1] - acc[j]) || 1);
      X[k] = mix(P[j][0], P[j + 1][0], f); Z[k] = mix(P[j][1], P[j + 1][1], f);
    }
    for (let k = 0; k < n; k++) { const a = Math.max(0, k - 2), b = Math.min(n - 1, k + 2), dx = X[b] - X[a], dz = Z[b] - Z[a], d = Math.hypot(dx, dz) || 1; NX[k] = -dz / d; NZ[k] = dx / d; }
    return { X, Z, NX, NZ, n, L, ds };
  }
  const along = (R, s, l, o) => { const f = Math.max(0, s) / R.ds, i = Math.min(R.n - 2, Math.floor(f)), u = Math.min(1.5, f - i); o[0] = mix(R.X[i], R.X[i + 1], u) + R.NX[i] * l; o[1] = mix(R.Z[i], R.Z[i + 1], u) + R.NZ[i] * l; return o; };

  // ---------- the place ----------
  const NF = 1000, ROWS = 25, COLS = 40, GX0 = 3.2, GZ0 = 11, DX = .62, DZ = 1.25;
  const WELL = [-4.8, 9.4], LIGHT = [-3.1, 1.45, 8.1], HUT = [-15, -10.5, 15, 19];
  const PX0 = .9; // the central path
  const PATHS = [
    [[PX0, -40], [PX0, 64], [-1, 300], [2, 700], [0, 1500]],
    [[PX0, -40], [PX0, 64], [-22, 170], [-64, 430], [-128, 820], [-210, 1400]],
    [[PX0, -40], [PX0, 64], [26, 176], [72, 430], [146, 830], [236, 1400]],
    [[PX0, -40], [PX0, 64], [-52, 136], [-168, 340], [-344, 660], [-560, 1150]],
    [[PX0, -40], [PX0, 64], [58, 142], [176, 346], [352, 668], [570, 1160]],
  ];
  const SUNH = [-.1, .995];
  const TONES = [[.84, .8, .72], [.64, .54, .42], [.42, .33, .25], [.2, .18, .17], [.25, .26, .33]];
  // camera keys: p, eye xyz, look xyz. Low beside the bound rows, then up and back until the whole oasis lies open.
  const CAM = [
    [-.05, -1.4, 1.5, -2.6, -5.6, 1.3, 16], [0, -1.3, 1.5, -2.2, -5.4, 1.3, 16], [.075, .4, 1.0, 3.2, 7.5, 1.85, 16], [.15, .9, .95, 4.4, 8.5, 1.9, 17],
    [.22, -.4, 1.6, 1, 3.6, 1.4, 36],
    [.33, -3, 5.5, -13, 2.6, 1, 64], [.46, -8, 17, -33, 1.5, 0, 160], [.6, -7, 30, -52, 0, 0, 300], [.8, -6, 40, -62, 0, 2, 420], [1.05, -5, 44, -66, 0, 4, 470],
  ];
  // a cloaked figure; bow 1 = head down, shoulders rounded (bound); units of its height, feet at the origin
  const FS = [[-.18, 0], [-.2, -.45], [-.17, -.68], [-.165, -.775], [-.07, -.805], [.07, -.805], [.165, -.775], [.17, -.68], [.2, -.45], [.18, 0]];
  const FB = [[-.18, 0], [-.205, -.43], [-.175, -.64], [-.15, -.735], [-.06, -.77], [.08, -.77], [.17, -.73], [.18, -.63], [.2, -.43], [.18, 0]];
  function addFig(c, x, y, sx, sy, bow, sway, v, wf, dir) {
    const q = (j) => [x + mix(FS[j][0], FB[j][0] * dir, bow) * sx * wf, y + mix(FS[j][1], FB[j][1], bow) * sy];
    const P0 = q(0), P1 = q(1), P2 = q(2), P3 = q(3), P4 = q(4), P5 = q(5), P6 = q(6), P7 = q(7), P8 = q(8), P9 = q(9);
    c.moveTo(P0[0] + sway * sx, P0[1]);
    c.quadraticCurveTo(P1[0], P1[1], P2[0], P2[1]); c.quadraticCurveTo(P3[0], P3[1], P4[0], P4[1]);
    c.lineTo(P5[0], P5[1]);
    c.quadraticCurveTo(P6[0], P6[1], P7[0], P7[1]); c.quadraticCurveTo(P8[0], P8[1], P9[0] + sway * sx * .6, P9[1]);
    c.closePath();
    const hy = y + (-.885 + .07 * bow) * sy, hx = x + .045 * bow * dir * sx, hr = .075 * sx;
    if (v === 2) { c.moveTo(hx + hr * 1.18, hy - hr * .1); c.ellipse(hx, hy - hr * .1, hr * 1.18, hr * .95, 0, 0, TAU); return; }
    c.moveTo(hx + hr, hy); c.arc(hx, hy, hr, 0, TAU);
    if (v === 1) { const sy2 = y + (-.77 + .03 * bow) * sy; c.moveTo(hx - hr * .95, hy); c.lineTo(hx + hr * .95, hy); c.lineTo(x + hr * 1.75 * wf, sy2); c.lineTo(x - hr * 1.75 * wf, sy2); c.closePath(); }
  }

  S.itq = {
    init(el, st) {
      st.cv = el.querySelector('canvas');
      st.ctx = st.cv.getContext('2d');
      st.n = el.querySelector('#itq-n');
      const R = rng(1000);
      st.pale = sprite([[0, 'rgba(255,246,222,1)'], [.2, 'rgba(255,236,196,.5)'], [.55, 'rgba(240,214,160,.12)'], [1, 'rgba(240,214,160,0)']]);
      st.glow = sprite([[0, 'rgba(255,255,255,1)'], [.18, 'rgba(255,255,255,.55)'], [.45, 'rgba(255,255,255,.16)'], [1, 'rgba(255,255,255,0)']]);
      st.warm = sprite([[0, 'rgba(255,196,120,1)'], [.3, 'rgba(255,160,80,.38)'], [1, 'rgba(255,140,60,0)']]);
      st.mist = sprite([[0, 'rgba(255,255,255,1)'], [.5, 'rgba(255,255,255,.45)'], [1, 'rgba(255,255,255,0)']], 64);
      st.noise = mk(160, 160);
      { const ng = st.noise.getContext('2d'), id = ng.createImageData(160, 160); for (let i = 0; i < id.data.length; i += 4) { const v = R() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 16; } ng.putImageData(id, 0, 0); }
      st.bloom = mk(8, 8); st.bc = st.bloom.getContext('2d');
      st.paths = PATHS.map((pts) => route(pts, 3));
      // ----- the bound: rows of forty, one cord through each row -----
      const A = (T) => new T(NF);
      st.sx = A(Float32Array); st.sz = A(Float32Array); st.rel = A(Float32Array); st.lat = A(Float32Array); st.pk = A(Uint8Array);
      st.tone = A(Uint8Array); st.var = A(Uint8Array); st.wf = A(Float32Array); st.hgt = A(Float32Array); st.ph = A(Float32Array);
      st.X = A(Float32Array); st.Z = A(Float32Array); st.bow = A(Float32Array); st.swg = A(Float32Array); st.dir = A(Float32Array); st.gone = A(Uint8Array);
      const tw = [.24, .27, .22, .17, .1];
      for (let i = 0; i < NF; i++) {
        const r = Math.floor(i / COLS), cI = i % COLS;
        st.sx[i] = GX0 + cI * DX + (R() - .5) * .18 + (r % 2) * .2; st.sz[i] = GZ0 + r * DZ + (R() - .5) * .2;
        let k = 0, w = R(); while (w > tw[k] && k < 4) { w -= tw[k]; k++; }
        st.tone[i] = k; st.var[i] = R() < .45 ? 1 : R() < .3 ? 2 : 0; st.wf[i] = .88 + R() * .26; st.hgt[i] = 1.6 + R() * .2; st.ph[i] = R() * TAU;
        st.lat[i] = (R() - .5) * 1.6;
        const q = R(); st.pk[i] = q < .3 ? 0 : q < .5 ? 1 : q < .7 ? 2 : q < .85 ? 3 : 4;
      }
      // release order: the first dozen from the front row nearest the path, slowly; then the rows unzip from the path side
      const first = Array.from({ length: 12 }, (_, k) => k);
      const rest = Array.from({ length: NF }, (_, i) => i).filter((i) => i >= 12).map((i) => [i, st.sx[i] + R() * 3.2 + (i % COLS < 3 ? -1 : 0)]).sort((a, b) => a[1] - b[1]).map((e) => e[0]);
      first.forEach((i, k) => { st.rel[i] = .088 + k * .0102; st.pk[i] = k % 3 === 1 ? 1 : k % 3 === 2 ? 2 : 0; });
      rest.forEach((i, k) => { st.rel[i] = .212 + .575 * (k / (rest.length - 1)) ** .85; });
      st.sorted = Float32Array.from(st.rel).sort();
      // cords: each row, figure to figure; [a, b] by index
      st.cords = [];
      for (let r = 0; r < ROWS; r++) for (let cI = 0; cI < COLS - 1; cI++) st.cords.push([r * COLS + cI, r * COLS + cI + 1, R()]);
      // ----- the land -----
      // plots between the channels, with their crops
      st.plots = [];
      const ZL = []; for (let z = 50; z < 1200; z += 40 + (z > 400 ? 20 : 0)) ZL.push(z);
      const XL = [-3, 3.5]; for (let x = 40; x < 700; x += 36 + (x > 300 ? 24 : 0)) { XL.push(x); XL.unshift(-x); }
      st.XL = XL; st.ZL = ZL;
      for (let z = ZL[ZL.length - 1]; z < 3200; z += 150) for (let x = -1400; x < 1400; x += 90) { const q = R(); st.plots.push([x + 2, x + 88, z + 3, z + 147, q < .42 ? 0 : q < .62 ? 1 : q < .82 ? 2 : 3]); }
      for (let i = 0; i < XL.length - 1; i++) for (let j = 0; j < ZL.length - 1; j++) {
        if (XL[i] === -3) continue; // the path and its channel
        const q = R();
        st.plots.push([XL[i] + .8, XL[i + 1] - .8, ZL[j] + .8, ZL[j + 1] - .8, q < .42 ? 0 : q < .62 ? 1 : q < .82 ? 2 : 3]);
      }
      // channels: segments of 10 m with their distance from the well along the network
      st.chan = [];
      const seg10 = (x0, z0, x1, z1, d0) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 10)); for (let k = 0; k < n; k++) st.chan.push([mix(x0, x1, k / n), mix(z0, z1, k / n), mix(x0, x1, (k + 1) / n), mix(z0, z1, (k + 1) / n), d0 + L * k / n, d0 + L * (k + 1) / n]); };
      seg10(WELL[0] + 1.4, WELL[1], -3, WELL[1], 0); // from the trough to the main channel
      seg10(-3, WELL[1], -3, ZL[ZL.length - 1], 2);
      ZL.forEach((z) => { seg10(-3, z, XL[0], z, z - WELL[1] + 2); seg10(-3, z, XL[XL.length - 1], z, z - WELL[1] + 2); });
      XL.forEach((x) => { if (x === -3 || x === 3.5) return; seg10(x, ZL[0], x, ZL[ZL.length - 1], ZL[0] - WELL[1] + Math.abs(x + 3)); });
      // palms along every path, and groves round the farm and on the far edges
      st.palms = [];
      st.paths.forEach((P, k) => { for (let s = (k ? 110 : 96); s < P.L - 40; s += 8 + R() * 3) { if (k === 0 && s > 470 && R() < .4) continue; [-1, 1].forEach((sd) => { const q = along(P, s, sd * (4.6 + R() * 1.2), [0, 0]); st.palms.push([q[0], q[1], 8 + R() * 6, (R() - .5) * .14, R() * TAU]); }); } });
      [[-30, 30, 14], [-60, 20, 22], [44, 70, 26], [-140, 120, 60], [150, 110, 60], [-400, 500, 140], [420, 460, 140], [-90, 700, 50], [110, 760, 60], [0, 1300, 200]].forEach(([gx, gz, rad]) => { for (let k = 0; k < rad * 1.6; k++) { const a = R() * TAU, r = rad * Math.sqrt(R()); const x = gx + Math.cos(a) * r, z = gz + Math.sin(a) * r * .7; if (Math.abs(x - PX0) < 6 && z < 140) continue; st.palms.push([x, z, 7 + R() * 7, (R() - .5) * .16, R() * TAU]); } });
      // a line of far palms and dunes on the horizon
      st.far = []; for (let x = -9000, h = 12; x <= 9000; x += 25 + R() * 40) { h = mix(h, (R() < .65 ? 10 + R() * 14 : 2), .6); st.far.push([x, h]); }
      const prof = (seed, z, amp, base) => { const rr = rng(seed), ph = [rr() * 9, rr() * 9, rr() * 9], out = []; for (let x = -16000; x <= 16000; x += 260) out.push([x, base + amp * (.5 + .3 * Math.sin(x * .0007 + ph[0]) + .15 * Math.sin(x * .0023 + ph[1]) + .05 * Math.sin(x * .009 + ph[2]))]); return { z, pts: out }; };
      st.hills = [prof(3, 9000, 260, 30), prof(4, 6000, 140, 10), prof(5, 3200, 60, 0)];
      st.stars = Array.from({ length: 220 }, () => [R(), R() ** 1.5, R()]);
      st.birds = Array.from({ length: 7 }, (_, k) => [R() * 2 - 1, .1 + R() * .12, R() * TAU, .7 + R() * .6, k]);
      st.clouds = Array.from({ length: 10 }, () => [R() * 2 - 1, .15 + R() * .5, .15 + R() * .3, .01 + R() * .015, R()]);
      // buckets by distance
      st.NB = 240; st.head = new Int32Array(st.NB); st.next = new Int32Array(NF + st.palms.length + st.cords.length);
      st.fx = new Float32Array(NF); st.fy = new Float32Array(NF); st.fs = new Float32Array(NF); st.fh = new Float32Array(NF);
      st.pp = new Float32Array(st.palms.length * 5);
      st.cp = new Float32Array(st.cords.length * 6);
    },

    frame(p, t, el, st) {
      fit(st.cv);
      let c = st.ctx; const W = st.cv.width, H = st.cv.height, k = W / Math.max(1, st.cv.clientWidth);
      const port = H > W * 1.1;
      // ---------- camera ----------
      const cam = spline(CAM, p);
      let ex = cam[0], ey = cam[1], ez = cam[2];
      const lx = cam[3], ly = cam[4], lz = cam[5];
      if (port) { const back = mix(1, 1.12, smooth(seg(p, .3, .6))); ex = lx + (ex - lx) * back; ey = ly + (ey - ly) * back; ez = lz + (ez - lz) * back; }
      let fx = lx - ex, fy = ly - ey, fz = lz - ez; { const l = Math.hypot(fx, fy, fz); fx /= l; fy /= l; fz /= l; }
      let rx = fz, rz = -fx; { const l = Math.hypot(rx, rz); rx /= l; rz /= l; }
      const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx;
      const F = port ? W * 1.3 : Math.min(H * 1.12, W * 1.1), cx = W / 2, cy = H * (port ? .62 : .52);
      const NEAR = .3;
      const CX = (x, y, z) => (x - ex) * rx + (z - ez) * rz;
      const CY = (x, y, z) => (x - ex) * ux + (y - ey) * uy + (z - ez) * uz;
      const CZ = (x, y, z) => (x - ex) * fx + (y - ey) * fy + (z - ez) * fz;
      const hl = Math.hypot(fx, fz) || 1;
      const hy = cy - F * ((fx * ux + fz * uz) / hl) / ((fx * fx + fz * fz) / hl);
      // ---------- light: from the last of the night to the sun over the fields ----------
      const [sunEl, warm, day] = keyv([[-.05, -7, 0, 0], [0, -7, 0, 0], [.25, -4, .25, 0], [.42, -1.6, .7, .15], [.55, .8, 1, .45], [.7, 2.6, .8, .7], [1.05, 6, .55, 1]], p);
      const se = Math.sin(sunEl * Math.PI / 180), ce = Math.cos(sunEl * Math.PI / 180), sdx = SUNH[0] * ce, sdy = se, sdz = SUNH[1] * ce;
      const sunI = c01((sunEl + .4) / 3.5);
      const skyTop = keyv([[0, [10, 16, 40]], [.3, [22, 34, 70]], [.55, [56, 84, 132]], [1, [72, 112, 168]]], p)[0];
      const skyMid = keyv([[0, [34, 44, 84]], [.3, [80, 84, 126]], [.55, [178, 160, 168]], [1, [168, 184, 200]]], p)[0];
      const skyHor = keyv([[0, [120, 84, 82]], [.3, [214, 132, 90]], [.55, [255, 204, 146]], [1, [246, 222, 186]]], p)[0];
      const fogC = keyv([[0, [44, 52, 84]], [.3, [96, 90, 112]], [.55, [226, 190, 156]], [1, [214, 206, 190]]], p)[0];
      const amb = keyv([[0, [.14, .17, .3]], [.3, [.22, .24, .36]], [.55, [.42, .4, .44]], [1, [.6, .58, .56]]], p)[0];
      const sunC = mixc([1.5, .9, .5], [1.35, 1.1, .82], day).map((v) => v * sunI);
      const fogL = mix(900, 2200, day);
      const fog = (d) => 1 - Math.exp(-d / fogL);
      let chunkM = 0, chunkS = false;
      const open = (style, stroke) => { chunkM = 0; chunkS = stroke; if (stroke) c.strokeStyle = style; else c.fillStyle = style; c.beginPath(); };
      const sub = () => { if (++chunkM % 24 === 0) { if (chunkS) c.stroke(); else c.fill(); c.beginPath(); } };
      const done = () => { if (chunkM % 24) { if (chunkS) c.stroke(); else c.fill(); } };
      const SB = st.SB || (st.SB = new Float64Array(3 * 600)), IB = st.IB || (st.IB = new Float64Array(3 * 600));
      const polyIB = (n) => {
        let allIn = true, anyIn = false;
        for (let i = 0, o = 0; i < n; i++, o += 3) {
          const dx = IB[o] - ex, dy = IB[o + 1] - ey, dz = IB[o + 2] - ez, zc = dx * fx + dy * fy + dz * fz;
          SB[o] = dx * rx + dz * rz; SB[o + 1] = dx * ux + dy * uy + dz * uz; SB[o + 2] = zc;
          if (zc < NEAR) allIn = false; else anyIn = true;
        }
        if (!anyIn) return false;
        if (allIn) {
          c.moveTo(cx + F * SB[0] / SB[2], cy - F * SB[1] / SB[2]);
          for (let o = 3; o < n * 3; o += 3) c.lineTo(cx + F * SB[o] / SB[o + 2], cy - F * SB[o + 1] / SB[o + 2]);
          c.closePath(); return true;
        }
        const out = [];
        for (let i = 0; i < n; i++) {
          const a = i * 3, b = ((i + 1) % n) * 3, ina = SB[a + 2] >= NEAR, inb = SB[b + 2] >= NEAR;
          if (ina) out.push(SB[a], SB[a + 1], SB[a + 2]);
          if (ina !== inb) { const f = (NEAR - SB[a + 2]) / (SB[b + 2] - SB[a + 2]); out.push(mix(SB[a], SB[b], f), mix(SB[a + 1], SB[b + 1], f), NEAR); }
        }
        if (out.length < 9) return false;
        c.moveTo(cx + F * out[0] / out[2], cy - F * out[1] / out[2]);
        for (let o = 3; o < out.length; o += 3) c.lineTo(cx + F * out[o] / out[o + 2], cy - F * out[o + 1] / out[o + 2]);
        c.closePath(); return true;
      };
      const rectG = (x0, x1, z0, z1, y = 0) => { IB[0] = x0; IB[1] = y; IB[2] = z0; IB[3] = x1; IB[4] = y; IB[5] = z0; IB[6] = x1; IB[7] = y; IB[8] = z1; IB[9] = x0; IB[10] = y; IB[11] = z1; return polyIB(4); };
      const quadW = (a0, a1, a2, b0, b1, b2, c0, c1, c2, d0, d1, d2) => { IB[0] = a0; IB[1] = a1; IB[2] = a2; IB[3] = b0; IB[4] = b1; IB[5] = b2; IB[6] = c0; IB[7] = c1; IB[8] = c2; IB[9] = d0; IB[10] = d1; IB[11] = d2; return polyIB(4); };
      const stripG = (x0, z0, x1, z1, w) => { const L = Math.hypot(x1 - x0, z1 - z0) || 1, nx = -(z1 - z0) / L * w / 2, nz = (x1 - x0) / L * w / 2; return quadW(x0 + nx, 0, z0 + nz, x1 + nx, 0, z1 + nz, x1 - nx, 0, z1 - nz, x0 - nx, 0, z0 - nz); };
      const pr = (x, y, z, o) => { const zc = CZ(x, y, z); if (zc < NEAR) return 0; o[0] = cx + F * CX(x, y, z) / zc; o[1] = cy - F * CY(x, y, z) / zc; return zc; };
      const T0 = [0, 0], T1 = [0, 0];

      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      // ---------- sky ----------
      const sunScr = (() => { const z = sdx * fx + sdy * fy + sdz * fz; return z > .02 ? [cx + F * (sdx * rx + sdz * rz) / z, cy - F * (sdx * ux + sdy * uy + sdz * uz) / z] : [cx, hy + H]; })();
      const sunHx = (() => { const z = SUNH[0] * fx + SUNH[1] * fz; return cx + F * (SUNH[0] * rx + SUNH[1] * rz) / Math.max(.05, z); })(); // where the sun sits on the horizon line
      if (hy > 0) {
        const sg = c.createLinearGradient(0, Math.min(0, hy - H * .7), 0, hy);
        sg.addColorStop(0, rgb(skyTop)); sg.addColorStop(.6, rgb(skyMid)); sg.addColorStop(1, rgb(skyHor));
        c.fillStyle = sg; c.fillRect(0, 0, W, hy + 2);
        // the glow of the coming sun, wide and low
        c.globalCompositeOperation = 'lighter';
        const gA = mix(.22, .58, warm) * (1 - .3 * day);
        const g = c.createRadialGradient(sunHx, hy, 0, sunHx, hy, W * mix(.55, .9, warm));
        g.addColorStop(0, rgb([255, 190, 120], gA)); g.addColorStop(.25, rgb([240, 140, 90], gA * .45)); g.addColorStop(1, 'rgba(240,140,90,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, hy + 2);
        c.globalCompositeOperation = 'source-over';
        const starA = 1 - smooth(seg(p, .08, .4));
        if (starA > 0) { c.fillStyle = '#efe8d6'; st.stars.forEach(([x, y, b]) => { const Y0 = y * hy * .85; c.globalAlpha = starA * (.2 + .7 * b) * (.75 + .25 * Math.sin(t * 2 + b * 30)) * c01((hy - Y0) / (H * .35)) * (1 - .7 * Math.exp(-(((x * W - sunHx) / (W * .25)) ** 2))); c.fillRect(x * W, Y0, b > .85 ? 1.6 * k : k, b > .85 ? 1.6 * k : k); }); c.globalAlpha = 1; }
        // thin cloud lit from below
        const cl = mixc(mixc([120, 100, 130], [255, 170, 120], warm), [255, 236, 214], day);
        st.clouds.forEach(([u, v, w, h, a]) => {
          const X0 = sunHx + u * W * .8 + t * .2 * k, Y0 = hy - v * Math.max(H * .35, hy);
          c.save(); c.translate(X0, Y0); c.scale(w * W, h * H);
          const gg = c.createRadialGradient(0, 0, 0, 0, 0, 1);
          gg.addColorStop(0, rgb(cl, (.1 + .22 * a) * (.4 + .6 * warm))); gg.addColorStop(1, rgb(cl, 0));
          c.fillStyle = gg; c.fillRect(-1, -1, 2, 2); c.restore();
        });
        // the sun itself, rising behind the far line
        if (sunEl > -1.2) {
          const r = Math.max(9 * k, Math.min(W, H) * .028), y0 = sunScr[1] > hy + H ? hy + r : sunScr[1];
          c.globalCompositeOperation = 'lighter';
          const sg2 = c.createRadialGradient(sunHx, y0, 0, sunHx, y0, r * 9);
          sg2.addColorStop(0, `rgba(255,236,190,${.55 * c01((sunEl + 1.2) / 2)})`); sg2.addColorStop(.2, `rgba(255,200,130,${.22 * c01((sunEl + 1.2) / 2)})`); sg2.addColorStop(1, 'rgba(255,190,120,0)');
          c.fillStyle = sg2; c.fillRect(sunHx - r * 9, y0 - r * 9, r * 18, r * 18);
          c.globalCompositeOperation = 'source-over';
          c.fillStyle = `rgba(255,${mix(196, 240, day) | 0},${mix(130, 200, day) | 0},${c01((sunEl + 1.2) / 1.5)})`;
          c.beginPath(); c.arc(sunHx, y0, r, 0, TAU); c.fill();
        }
      }
      // ---------- far land: hills, then a line of distant palms ----------
      st.hills.forEach((h, j) => {
        const zr = h.z, col = mixc(mixc([40, 40, 70], [150, 110, 100], warm * .8), fogC, .55 + .12 * (2 - j));
        c.fillStyle = rgb(col); c.beginPath(); let started = false;
        for (const [x, y] of h.pts) { if (!pr(x, y, zr, T0)) continue; if (T0[0] < -200 || T0[0] > W + 200) continue; if (!started) { c.moveTo(T0[0], hy + 2); started = true; } c.lineTo(T0[0], T0[1]); }
        if (started) { c.lineTo(c.canvas ? T0[0] : 0, hy + 2); c.closePath(); c.fill(); }
      });
      // ---------- ground ----------
      const g0 = Math.max(0, hy);
      const gNear = mixc(mixc([30, 32, 44], [96, 76, 60], warm * .7), [140, 116, 86], day);
      const gg = c.createLinearGradient(0, g0, 0, H);
      gg.addColorStop(0, rgb(mixc(fogC, skyHor, .3))); gg.addColorStop(Math.min(1, .1 * H / Math.max(1, H - g0)), rgb(mixc(gNear, fogC, .6))); gg.addColorStop(1, rgb(gNear));
      c.fillStyle = gg; c.fillRect(0, g0, W, H - g0);
      { // distant palms on the horizon line
        const zr = 4200, col = mixc(mixc([24, 28, 40], [90, 70, 70], warm * .6), fogC, .5);
        c.fillStyle = rgb(col); c.beginPath(); let started = false, lastX = 0;
        for (const [x, h] of st.far) { if (!pr(x, h, zr, T0)) continue; if (T0[0] < -50 || T0[0] > W + 50) continue; if (!started) { c.moveTo(T0[0], hy + 3); started = true; } c.lineTo(T0[0], T0[1]); lastX = T0[0]; }
        if (started) { c.lineTo(lastX, hy + 3); c.closePath(); c.fill(); }
      }
      // fields: young barley, clover, the tilled earth, the ripening grain
      const crop = [[64, 92, 50], [46, 72, 44], [104, 80, 58], [136, 122, 72]];
      const shadeG = (alb) => [tone(alb[0] / 255 * (amb[0] + sunC[0] * se * 2.2)), tone(alb[1] / 255 * (amb[1] + sunC[1] * se * 2.2)), tone(alb[2] / 255 * (amb[2] + sunC[2] * se * 2.2))];
      crop.forEach((col, j) => { open(rgb(mixc(shadeG(col.map((v) => v * 1.7)), fogC, .12)), false); st.plots.forEach(([a, b, z0, z1, q]) => { if (q === j && rectG(a, b, z0, z1)) sub(); }); done(); });
      // furrows in the near plots
      c.lineWidth = Math.max(1, .7 * k);
      [[0, [0, 0, 0], .22], [1, [255, 240, 210], .1]].forEach(([pass, col, a]) => {
        open(rgb(col, a * (pass ? .3 + .7 * sunI : 1)), true);
        st.plots.forEach(([a0, b0, z0, z1]) => {
          if (z0 > 170 || Math.abs((a0 + b0) / 2) > 140) return;
          for (let x = a0 + .6 + pass * .3; x < b0; x += 1.2) { if (!pr(x, 0, z0, T0) || !pr(x, 0, z1, T1)) continue; c.moveTo(T0[0], T0[1]); c.lineTo(T1[0], T1[1]); sub(); }
        });
        done();
      });
      // the yard: packed earth round the well, the hut and the rows
      c.beginPath(); quadW(-17, 0, -12, 32, 0, -12, 32, 0, 46, -17, 0, 46); c.fillStyle = rgb(mixc(shadeG([170, 140, 104]), fogC, .05)); c.fill();
      // pebbles, straw and hoof-prints in the yard, near the lens
      if (ey < 8) {
        if (!st.yard) { const rr = rng(77); st.yard = Array.from({ length: 1400 }, () => [-17 + rr() * 49, -12 + rr() * 58, rr(), rr()]); }
        [[0, [40, 32, 28], .55], [1, [214, 190, 150], .35]].forEach(([pass, col, a]) => {
          open(rgb(mixc(shadeG(col), fogC, .05), a), false);
          st.yard.forEach(([x, z, q, w]) => { if ((q > .62) !== !!pass) return; const zc = CZ(x, 0, z); if (zc < 1 || zc > 40) return; const X0 = cx + F * CX(x, 0, z) / zc; if (X0 < -10 || X0 > W + 10) return; const Y0 = cy - F * CY(x, 0, z) / zc, rr = Math.max(.6 * k, (.03 + .06 * w) * F / zc); c.moveTo(X0 + rr, Y0); c.ellipse(X0, Y0, rr, rr * .4, 0, 0, TAU); sub(); });
          done();
        });
      }
      // paths: pale beaten earth
      open(rgb(mixc(shadeG([196, 166, 124]), fogC, .08)), false);
      st.paths.forEach((P, k2) => { for (let i = k2 ? Math.floor(104 / P.ds) : 0; i < P.n - 1; i += 2) { const j = Math.min(P.n - 1, i + 2); if (stripG(P.X[i], P.Z[i], P.X[j], P.Z[j], k2 ? 2.4 : 3.2)) sub(); } });
      done();
      // fallen cord on the ground
      const DROP = .014;
      { const cr2 = mixc([150, 124, 84], [50, 44, 40], .55 - .4 * day); c.lineWidth = Math.max(1, .03 * F / 12); open(rgb(cr2, .9), true);
        st.cords.forEach(([a, b, q]) => { const ta = st.rel[a] + DROP, tb = st.rel[b] + DROP; if (p < ta || p < tb) return; const xa = st.sx[a] + .1, za = st.sz[a] - .2 + q * .2, xb = st.sx[b] - .1, zb = st.sz[b] - .25 + q * .25; if (!pr(xa, 0, za, T0) || !pr(xb, 0, zb, T1)) return; c.moveTo(T0[0], T0[1]); c.quadraticCurveTo((T0[0] + T1[0]) / 2, (T0[1] + T1[1]) / 2 + (q - .5) * 6 * k, T1[0], T1[1]); sub(); });
        done(); }

      // ---------- water: the channels fill from the well and take the colour of the sky ----------
      const reach = 6 + 1150 * smooth(seg(p, .03, .7)) ** 1.3;
      const wb = (d) => mixc(mixc(skyMid, skyHor, c01(d / 260)), gNear, .32);
      const wBands = [0, 30, 80, 180, 400, 1e9];
      for (let bI = 0; bI < 5; bI++) {
        const dm = Math.min(800, (wBands[bI] + Math.min(1200, wBands[bI + 1])) / 2);
        open(rgb(mixc(wb(dm), fogC, fog(dm) * .35)), false);
        st.chan.forEach(([x0, z0, x1, z1, d0, d1]) => {
          if (d0 > reach) return;
          const d = Math.hypot((x0 + x1) / 2 - ex, (z0 + z1) / 2 - ez); if (d < wBands[bI] || d >= wBands[bI + 1]) return;
          const f = c01((reach - d0) / Math.max(.01, d1 - d0));
          if (stripG(x0, z0, mix(x0, x1, f), mix(z0, z1, f), Math.max(.6, d * .0021))) sub();
        });
        done();
      }
      // the sun's road across the water
      if (warm > .2) {
        c.globalCompositeOperation = 'lighter';
        const gl = (.25 + .6 * sunI) * warm;
        open(rgb([255, 214, 160], gl), false);
        st.chan.forEach(([x0, z0, x1, z1, d0, d1]) => {
          if (d0 > reach) return;
          const zc = CZ((x0 + x1) / 2, 0, (z0 + z1) / 2); if (zc < 2) return;
          const X0 = cx + F * CX((x0 + x1) / 2, 0, (z0 + z1) / 2) / zc; if (Math.abs(X0 - sunHx) > W * .09) return;
          const f = c01((reach - d0) / Math.max(.01, d1 - d0)); if (stripG(x0, z0, mix(x0, x1, f), mix(z0, z1, f), Math.max(.6, zc * .0021))) sub();
        });
        done();
        c.globalCompositeOperation = 'source-over';
      }

      // ---------- long shadows towards us, once the sun is up ----------
      const shA = sunI * .5;
      if (shA > .02) {
        const L = Math.min(70, 1 / Math.max(.02, Math.tan(sunEl * Math.PI / 180)));
        open(rgb(mixc([30, 34, 56], [60, 50, 60], warm * .5), shA), false);
        st.palms.forEach(([x, z, h]) => { const zc = CZ(x, 0, z); if (zc < 2 || zc > 900) return; if (stripG(x, z, x - SUNH[0] * Math.min(70, h * L), z - SUNH[1] * Math.min(70, h * L), .9)) sub(); });
        done();
      }

      // ---------- the bound and the freed: positions ----------
      const { X, Z, bow: BOW, swg: SWG, dir: DIR } = st;
      let count = 0;
      const O = [0, 0];
      for (let i = 0; i < NF; i++) {
        const r = st.rel[i], tau = p - r;
        let x = st.sx[i], z = st.sz[i], bw = 1, sw = 0, dir = -1;
        st.gone[i] = 0;
        if (tau >= 0) {
          count++;
          bw = 1 - smooth(c01(tau / .008));
          const ex2 = PX0 + st.lat[i] * .5, Lx = Math.max(0, x - ex2), t1 = Lx / 520, wait = .006;
          if (tau > wait) {
            const u = tau - wait;
            if (u < t1) { x = mix(st.sx[i], ex2, u / t1); sw = .022 * Math.sin((st.sx[i] - x) * 2.1 + st.ph[i]); } else {
              const u2 = u - t1, s = (z + 40) + 300 * u2 + 300 * u2 * u2;
              along(st.paths[st.pk[i]], s, st.lat[i] * (1 + Math.min(1.2, u2 * 6)), O);
              x = O[0]; z = O[1]; sw = .022 * Math.sin(s * 1.9 + st.ph[i]); dir = 1;
              if (s > st.paths[st.pk[i]].L - 20) st.gone[i] = 1;
            }
          }
        } else {
          // the bound stand and shift their weight, a little
          x += .03 * Math.sin(t * .4 + st.ph[i]);
        }
        X[i] = x; Z[i] = z; BOW[i] = bw; SWG[i] = sw; DIR[i] = dir;
      }
      setText(st.n, arNum(count));
      // the walkers' long shadows reach back towards us
      if (shA > .02) {
        const L = Math.min(9, 1.7 / Math.max(.02, Math.tan(sunEl * Math.PI / 180)));
        open(rgb(mixc([30, 34, 56], [60, 50, 60], warm * .5), shA * .9), false);
        for (let i = 0; i < NF; i++) { if (DIR[i] < 0 || st.gone[i]) continue; const x = X[i], z = Z[i]; if (stripG(x, z, x - SUNH[0] * L, z - SUNH[1] * L, .42)) sub(); }
        done();
      }

      // ---------- buckets: people, palms, hanging cords ----------
      const NB = st.NB, LB = 26, head = st.head, next = st.next; head.fill(-1);
      const bucket = (d) => Math.max(0, Math.min(NB - 1, Math.floor(Math.log(Math.max(1, d)) * LB)));
      const { fx: FX, fy: FY, fs: FSz, fh: FH } = st;
      for (let i = 0; i < NF; i++) {
        if (st.gone[i]) continue;
        const x = X[i], z = Z[i], zc = CZ(x, 0, z); if (zc < .8) continue;
        const h = st.hgt[i] * (1 - .05 * BOW[i]), s = F / zc, X0 = cx + F * CX(x, 0, z) / zc, Y0 = cy - F * CY(x, 0, z) / zc;
        if (X0 < -s * 2 || X0 > W + s * 2 || Y0 < -2 || Y0 - s * h > H) continue;
        const zt = CZ(x, h, z), yt = cy - F * CY(x, h, z) / Math.max(.1, zt);
        FX[i] = X0; FY[i] = Y0; FSz[i] = s * h; FH[i] = Math.max(Y0 - yt, .35 * s * h);
        const b = bucket(Math.hypot(x - ex, ey - 1, z - ez)); next[i] = head[b]; head[b] = i;
      }
      const palms = st.palms, PP = st.pp;
      for (let j = 0; j < palms.length; j++) {
        const [x, z, h, lean] = palms[j], zc = CZ(x, 0, z); if (zc < 1.5) continue;
        const s = F / zc, X0 = cx + F * CX(x, 0, z) / zc; if (X0 < -5 * s || X0 > W + 5 * s) continue;
        const Y0 = cy - F * CY(x, 0, z) / zc; if (Y0 < -2) continue;
        const tx = x + lean * h, zt = CZ(tx, h, z); if (zt < .5) continue;
        PP[j * 5] = X0; PP[j * 5 + 1] = Y0; PP[j * 5 + 2] = s; PP[j * 5 + 3] = cx + F * CX(tx, h, z) / zt; PP[j * 5 + 4] = cy - F * CY(tx, h, z) / zt;
        const b = bucket(Math.hypot(x - ex, ey - h * .5, z - ez)); next[NF + j] = head[b]; head[b] = NF + j;
      }
      const cords = st.cords, CP = st.cp, NC = NF + palms.length;
      for (let q = 0; q < cords.length; q++) {
        const [a, b, rr] = cords[q], ta = st.rel[a], tb = st.rel[b];
        if (p >= ta + DROP && p >= tb + DROP) continue; // lying on the ground: drawn with the ground
        const ha = (k2, tt) => { const f = ease.in(c01((p - tt) / DROP)); return [st.sx[k2] + (k2 === a ? .1 : -.1) * f, mix(1.0, .02, f), st.sz[k2] - .18 - .05 * f]; };
        const A2 = p < ta ? [X[a] + .12, .98, st.sz[a] - .18] : ha(a, ta), B2 = p < tb ? [X[b] - .12, .98, st.sz[b] - .18] : ha(b, tb);
        if (!pr(A2[0], A2[1], A2[2], T0) || !pr(B2[0], B2[1], B2[2], T1)) continue;
        const sag = (A2[1] > .5 && B2[1] > .5 ? .12 : .04) + .03 * rr;
        pr((A2[0] + B2[0]) / 2, Math.max(.02, (A2[1] + B2[1]) / 2 - sag), (A2[2] + B2[2]) / 2, O);
        CP[q * 6] = T0[0]; CP[q * 6 + 1] = T0[1]; CP[q * 6 + 2] = O[0]; CP[q * 6 + 3] = O[1]; CP[q * 6 + 4] = T1[0]; CP[q * 6 + 5] = T1[1];
        const bI = bucket(Math.hypot((A2[0] + B2[0]) / 2 - ex, ey - .9, (A2[2] + B2[2]) / 2 - ez) - .3); next[NC + q] = head[bI]; head[bI] = NC + q;
      }

      // ---------- colours and drawing passes ----------
      const sunSide = Math.sign(sunHx - cx) || 1;
      const lightScr = [0, 0]; pr(LIGHT[0], LIGHT[1], LIGHT[2], lightScr);
      const figCol = (tn, d) => { const a = TONES[tn], s2 = .2 * sunI; return mixc([tone(a[0] * (amb[0] + sunC[0] * s2)), tone(a[1] * (amb[1] + sunC[1] * s2)), tone(a[2] * (amb[2] + sunC[2] * s2))], fogC, fog(d)); };
      const rimCol = (d) => mixc(mixc([200, 170, 170], [255, 214, 160], warm), fogC, fog(d) * .6);
      const fig = (q, dx = 0, dy = 0) => addFig(c, FX[q] + dx * FSz[q], FY[q] + dy * FH[q], FSz[q], FH[q], BOW[q], SWG[q], st.var[q], st.wf[q], DIR[q]);
      function palmNear(j, fogB) {
        const [x, , , , ph] = palms[j], s = PP[j * 5 + 2], X0 = PP[j * 5], Y0 = PP[j * 5 + 1], tx = PP[j * 5 + 3], ty = PP[j * 5 + 4];
        const trunk = mixc(mixc([24, 22, 30], [60, 44, 36], warm * .4 + day * .4), fogC, fogB);
        c.strokeStyle = rgb(trunk); c.lineCap = 'round'; c.lineWidth = Math.max(1, .36 * s);
        c.beginPath(); c.moveTo(X0, Y0); c.quadraticCurveTo(X0 + (tx - X0) * .3, (Y0 + ty) / 2, tx, ty); c.stroke();
        if (sunI > .05 || warm > .3) { c.strokeStyle = rgb(mixc([255, 190, 120], fogC, fogB), .35 * warm); c.lineWidth = Math.max(1, .08 * s); c.beginPath(); c.moveTo(X0 + sunSide * .14 * s, Y0); c.quadraticCurveTo(X0 + (tx - X0) * .3 + sunSide * .13 * s, (Y0 + ty) / 2, tx + sunSide * .1 * s, ty); c.stroke(); }
        const dark = mixc(mixc([20, 26, 30], [44, 52, 36], day), fogC, fogB), lit = mixc(mixc([120, 90, 70], [190, 150, 80], day), fogC, fogB);
        for (let f = 0; f < 14; f++) {
          const a = f / 14 * TAU + ph + Math.sin(t * .7 + x) * .03, l = (3 + 1.1 * Math.abs(Math.sin(j * 7.1 + f * 3.3))) * s, dx = Math.cos(a) * l, dy = Math.sin(a) * l * .4 + l * .3 * Math.abs(Math.cos(a)) * .8;
          const w = .26 * s, mx = tx + dx * .5, my = ty - l * .28 + dy * .3;
          c.fillStyle = rgb(dark);
          c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(mx - w * Math.sin(a), my - w, tx + dx, ty + dy); c.quadraticCurveTo(mx + w * Math.sin(a), my + w * .6, tx, ty); c.fill();
          if (warm > .2 && Math.sin(a) < .2) { c.strokeStyle = rgb(lit, .55 * warm); c.lineWidth = Math.max(1, .05 * s); c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(mx - w * Math.sin(a), my - w, tx + dx, ty + dy); c.stroke(); }
        }
      }
      const flush = (b) => {
        const i0 = head[b]; if (i0 < 0) return;
        const dB = Math.exp((b + .5) / LB), fogB = fog(dB);
        // palms
        const near = []; let any = false;
        for (let q = i0; q >= 0; q = next[q]) if (q >= NF && q < NC) { any = true; const j = q - NF; if (PP[j * 5 + 2] * 3 > 30 * k) near.push(j); }
        if (any) {
          const trunk = mixc(mixc([22, 22, 30], [56, 44, 38], warm * .4 + day * .4), fogC, fogB), crown = mixc(mixc([18, 24, 30], [40, 54, 38], day), fogC, fogB);
          c.lineCap = 'round'; c.lineWidth = Math.max(1, .3 * F / dB);
          open(rgb(trunk), true);
          for (let q = i0; q >= 0; q = next[q]) if (q >= NF && q < NC) { const j = q - NF; if (PP[j * 5 + 2] * 3 > 30 * k) continue; c.moveTo(PP[j * 5], PP[j * 5 + 1]); c.lineTo(PP[j * 5 + 3], PP[j * 5 + 4]); sub(); }
          done();
          c.lineWidth = Math.max(1, .42 * F / dB);
          open(rgb(crown), true);
          for (let q = i0; q >= 0; q = next[q]) if (q >= NF && q < NC) {
            const j = q - NF, s = PP[j * 5 + 2]; if (s * 3 > 30 * k) continue;
            const X0 = PP[j * 5 + 3], Y0 = PP[j * 5 + 4], ph = palms[j][4], l = Math.max(2 * k, 3.1 * s), far = l < 9 * k;
            for (let f = 0; f < (far ? 5 : 8); f++) { const a = ph + f * (far ? 1.257 : .785), ca = Math.cos(a), dx = ca * l, dy = Math.sin(a) * l * .3 + l * (.42 + .25 * Math.abs(ca)); c.moveTo(X0, Y0); if (far) { c.lineTo(X0 + dx * .6, Y0 - l * .12); c.lineTo(X0 + dx, Y0 + dy * .7); } else c.quadraticCurveTo(X0 + dx * .55, Y0 - l * .32, X0 + dx, Y0 + dy * .7); }
            sub();
          }
          done();
          near.forEach((j) => palmNear(j, fogB));
        }
        // people
        const hpx = F / dB * 1.7;
        const each = (sel, fn) => { for (let q = i0; q >= 0; q = next[q]) if (q < NF && sel(q)) { fn(q); sub(); } };
        if (hpx < 4 * k) {
          for (let tn = 0; tn < 5; tn++) { open(rgb(figCol(tn, dB)), false); each((q) => st.tone[q] === tn, (q) => { const w = Math.max(1.3 * k, FSz[q] * .32), hh = Math.max(2.4 * k, FH[q]); c.rect(FX[q] - w / 2, FY[q] - hh, w, hh); }); done(); }
          if (warm > .3) { open(rgb(rimCol(dB), .5 * warm), false); each(() => true, (q) => { const w = Math.max(1.3 * k, FSz[q] * .32); c.rect(FX[q] - w / 2, FY[q] - Math.max(2.4 * k, FH[q]) - .6 * k, w, .9 * k); }); done(); }
        } else {
          if (hpx > 30 * k) { open(rgb(mixc([16, 14, 20], fogC, fogB), .4), false); each(() => true, (q) => { const w = FSz[q] * .2 * st.wf[q]; c.moveTo(FX[q] + w, FY[q]); c.ellipse(FX[q], FY[q], w, w * .28, 0, 0, TAU); }); done(); }
          // the rim: dawn behind them, so a thin bright edge over the head and on the sun's side
          open(rgb(rimCol(dB), .3 + .6 * warm), false); each(() => true, (q) => fig(q, sunSide * .016, -.011)); done();
          // the warm light of his disc on the side that faces him
          open(rgb([255, 206, 140], .7 * (1 - .4 * day)), false);
          each((q) => Math.hypot(X[q] - LIGHT[0], Z[q] - LIGHT[2]) < 9, (q) => fig(q, (Math.sign(lightScr[0] - FX[q]) || 1) * .02, -.004)); done();
          for (let tn = 0; tn < 5; tn++) { open(rgb(figCol(tn, dB)), false); each((q) => st.tone[q] === tn, (q) => fig(q)); done(); }
        }
        // hanging cords
        let anyC = false; for (let q = i0; q >= 0; q = next[q]) if (q >= NC) { anyC = true; break; }
        if (anyC) {
          c.lineWidth = Math.max(.8 * k, .035 * F / dB); c.lineCap = 'round';
          open(rgb(mixc(mixc([120, 100, 74], [214, 178, 120], warm * .6 + day * .3), fogC, fogB)), true);
          for (let q = i0; q >= 0; q = next[q]) if (q >= NC) { const o = (q - NC) * 6; c.moveTo(CP[o], CP[o + 1]); c.quadraticCurveTo(CP[o + 2] * 2 - (CP[o] + CP[o + 4]) / 2, CP[o + 3] * 2 - (CP[o + 1] + CP[o + 5]) / 2, CP[o + 4], CP[o + 5]); sub(); }
          done();
        }
      };

      // ---------- the farm: hut, well, a low wall, drawn among the buckets by distance ----------
      const items = [], lift = .5 + .5 * Math.sin(p * 46); // the well's bucket, up and down with the scroll
      let aliHead = null;
      const dist = (x, y, z) => Math.hypot(x - ex, y - ey, z - ez);
      items.push([dist((HUT[0] + HUT[1]) / 2, 1.3, HUT[3]), () => hut()]);
      items.push([dist(WELL[0], .5, WELL[1] - 1), () => well()]);
      items.push([dist(LIGHT[0], .9, LIGHT[2]), () => ali()]);
      [[-17, -12, -17, 46], [-17, 46, -3, 46]].forEach(([x0, z0, x1, z1]) => { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 6); for (let q = 0; q < n; q++) { const a = mix(x0, x1, q / n), b = mix(z0, z1, q / n), a2 = mix(x0, x1, (q + 1) / n), b2 = mix(z0, z1, (q + 1) / n); items.push([dist((a + a2) / 2, .6, (b + b2) / 2), () => wallSeg(a, b, a2, b2)]); } });
      items.sort((m, n) => n[0] - m[0]);
      const shadeW = (alb, n) => { const l = Math.max(0, n); return [tone(alb[0] * (amb[0] + sunC[0] * l)), tone(alb[1] * (amb[1] + sunC[1] * l)), tone(alb[2] * (amb[2] + sunC[2] * l))]; };
      function boxF(x0, x1, y0, y1, z0, z1, alb) {
        const f = fog(dist((x0 + x1) / 2, y1, (z0 + z1) / 2)), fc = (col) => rgb(mixc(col, fogC, f));
        if (ey > y1) { c.beginPath(); if (quadW(x0, y1, z0, x1, y1, z0, x1, y1, z1, x0, y1, z1)) { c.fillStyle = fc(shadeW(alb, sdy)); c.fill(); } }
        if (ex < x0) { c.beginPath(); if (quadW(x0, y0, z1, x0, y0, z0, x0, y1, z0, x0, y1, z1)) { c.fillStyle = fc(shadeW(alb.map((v) => v * .8), -sdx)); c.fill(); } }
        if (ex > x1) { c.beginPath(); if (quadW(x1, y0, z0, x1, y0, z1, x1, y1, z1, x1, y1, z0)) { c.fillStyle = fc(shadeW(alb.map((v) => v * .8), sdx)); c.fill(); } }
        if (ez < z0) { c.beginPath(); if (quadW(x0, y0, z0, x1, y0, z0, x1, y1, z0, x0, y1, z0)) { c.fillStyle = fc(shadeW(alb.map((v) => v * .7), -sdz)); c.fill(); } }
      }
      function hut() {
        const [x0, x1, z0, z1] = HUT, alb = [.62, .5, .38];
        boxF(x0, x1, 0, 2.5, z0, z1, alb);
        // the palm-frond roof edge, and a doorway with a lamp still burning
        c.beginPath(); if (quadW(x0 - .3, 2.5, z0 - .3, x1 + .3, 2.5, z0 - .3, x1 + .3, 2.75, z0 - .3, x0 - .3, 2.75, z0 - .3)) { c.fillStyle = rgb(mixc([30, 26, 22], fogC, .05)); c.fill(); }
        c.beginPath(); if (quadW(x0 + 2.4, 0, z0 - .01, x0 + 3.3, 0, z0 - .01, x0 + 3.3, 1.8, z0 - .01, x0 + 2.4, 1.8, z0 - .01)) { c.fillStyle = rgb(mixc([14, 10, 10], [255, 160, 80], .45 * (1 - day))); c.fill(); }
      }
      function wallSeg(x0, z0, x1, z1) {
        const alb = [.58, .47, .36], h = .9, w = .25, L = Math.hypot(x1 - x0, z1 - z0), nx = -(z1 - z0) / L * w, nz = (x1 - x0) / L * w;
        c.beginPath(); if (quadW(x0 - nx, h, z0 - nz, x1 - nx, h, z1 - nz, x1 + nx, h, z1 + nz, x0 + nx, h, z0 + nz)) { c.fillStyle = rgb(mixc(shadeW(alb, sdy), fogC, .05)); c.fill(); }
        const sdn = (nx * ex + nz * ez) - (nx * x0 + nz * z0) > 0 ? 1 : -1;
        c.beginPath(); if (quadW(x0 + nx * sdn, 0, z0 + nz * sdn, x1 + nx * sdn, 0, z1 + nz * sdn, x1 + nx * sdn, h, z1 + nz * sdn, x0 + nx * sdn, h, z0 + nz * sdn)) { c.fillStyle = rgb(mixc(shadeW(alb.map((v) => v * .75), sdn * (nx * sdx + nz * sdz) / w), fogC, .05)); c.fill(); }
      }
      function well() {
        // a ring of stone, its dark mouth, the frame with the pulley, the rope and the bucket, the trough beside it
        const [wx, wz] = WELL, rI = .85, rO = 1.15, h = .85, n = 28;
        if (CZ(wx, 1, wz) < 3.5) return; // behind or beside the lens
        const ring = (r, y) => { const pts = []; for (let i = 0; i <= n; i++) { const a = i / n * TAU; pr(wx + Math.cos(a) * r, y, wz + Math.sin(a) * r, O); pts.push([O[0], O[1]]); } return pts; };
        const top = ring(rO, h), bot = ring(rO, 0), inn = ring(rI, h);
        const stone = mixc(shadeW([.56, .5, .44], .3), fogC, .03), stoneD = mixc(stone, [0, 0, 0], .35);
        c.fillStyle = rgb(stoneD); c.beginPath(); top.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); for (let i = bot.length - 1; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1]); c.fill();
        c.fillStyle = rgb(stone); c.beginPath(); top.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
        c.fillStyle = rgb(mixc(skyHor, [6, 6, 10], .82)); c.beginPath(); inn.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
        // courses of stone
        c.strokeStyle = rgb(mixc(stoneD, [0, 0, 0], .3), .6); c.lineWidth = Math.max(1, .6 * k);
        [.3, .58].forEach((yy) => { const r2 = ring(rO, yy); c.beginPath(); r2.forEach(([x, y], i) => { const a = i / n * TAU; if (Math.sin(a) > .1) return; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); });
        // frame
        const wood = rgb(mixc(mixc([40, 30, 24], [96, 70, 48], day * .6 + warm * .3), fogC, .03));
        const post = (x) => { pr(x, 0, wz, O); const a = [O[0], O[1]]; pr(x, 2.7, wz, O); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(O[0], O[1]); c.stroke(); };
        c.strokeStyle = wood; c.lineCap = 'butt'; c.lineWidth = Math.max(1.5 * k, .16 * F / Math.max(1, dist(wx, 1.4, wz))); post(wx - rO - .1); post(wx + rO + .1);
        pr(wx - rO - .3, 2.6, wz, T0); pr(wx + rO + .3, 2.6, wz, T1); c.beginPath(); c.moveTo(T0[0], T0[1]); c.lineTo(T1[0], T1[1]); c.stroke();
        const s = F / Math.max(1, dist(wx, 2.3, wz));
        pr(wx, 2.32, wz, O); c.lineWidth = Math.max(1, .06 * s); c.beginPath(); c.arc(O[0], O[1], .22 * s, 0, TAU); c.stroke();
        // the bucket is drawn up as he hauls on the rope (ali() draws his side of it)
        const by = mix(.2, 1.5, lift);
        c.strokeStyle = rgb(mixc([150, 124, 84], fogC, .05)); c.lineWidth = Math.max(1, .02 * s);
        pr(wx - .22, 2.32, wz, T0); pr(wx - .22, by + .4, wz, T1); c.beginPath(); c.moveTo(T0[0], T0[1]); c.lineTo(T1[0], T1[1]); c.stroke();
        pr(wx - .22, by + .2, wz, O); c.fillStyle = rgb(mixc([70, 50, 36], fogC, .05)); c.beginPath(); c.ellipse(O[0], O[1], .2 * s, .2 * s, 0, 0, TAU); c.fill();
        // the trough
        boxF(wx + 1.3, wx + 3.1, 0, .45, wz - .5, wz + .5, [.5, .45, .4]);
        c.beginPath(); if (quadW(wx + 1.45, .43, wz - .35, wx + 2.95, .43, wz - .35, wx + 2.95, .43, wz + .35, wx + 1.45, .43, wz + .35)) { c.fillStyle = rgb(mixc(skyHor, [40, 50, 70], .35)); c.fill(); }
      }
      // Ali at the well, hauling the rope over the pulley: his hands come down as the bucket comes up
      function ali() {
        const [ax, , az] = LIGHT, zg = CZ(ax, 0, az); if (zg < .5) return;
        const gx = cx + F * CX(ax, 0, az) / zg, gy = cy - F * CY(ax, 0, az) / zg, h = Math.max(22 * k, 1.8 * F / zg);
        const ux = (WELL[0] - ax) * .16, uz = (WELL[1] - az) * .16, hy = mix(1.72, 1.08, lift); // a step toward the well
        const H1 = [ax + ux, hy, az + uz], H2 = [ax + ux * .7, hy - .26, az + uz * .7], hand = [[0, 0], [0, 0]];
        if (!pr(H1[0], H1[1], H1[2], hand[0]) || !pr(H2[0], H2[1], H2[2], hand[1])) return;
        // the rope: off the pulley, through both hands, its tail slack to the ground
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        c.strokeStyle = rgb(mixc([150, 124, 84], fogC, .05)); c.lineWidth = Math.max(1, .02 * F / zg); c.lineCap = 'round';
        if (pr(WELL[0] + .22, 2.32, WELL[1], T0) && pr(ax + ux * .4, .02, az + uz * .4, T1)) {
          c.beginPath(); c.moveTo(T0[0], T0[1]); c.lineTo(hand[0][0], hand[0][1]); c.lineTo(hand[1][0], hand[1][1]);
          c.quadraticCurveTo(hand[1][0], T1[1], T1[0], T1[1]); c.stroke();
        }
        const arms = hand.map(([x, y], i) => [i ? Math.max((x - gx) / h, .03) : Math.min((x - gx) / h, -.03), (y - gy) / h]); // one hand per shoulder
        aliHead = Holy.draw(c, { who: 'ali', pose: 'stand', x: gx, y: gy, h, t, amb: mix(.3, 1, Math.min(1, day * .8 + warm * .2)), arms });
      }
      let bcur = NB - 1;
      for (const [d, fn] of items) { const bb = bucket(d); while (bcur > bb) flush(bcur--); fn(); }
      while (bcur >= 0) flush(bcur--);

      // ---------- light and air ----------
      const bc = st.bc, BW = Math.max(8, Math.round(W / 5)), BH = Math.max(8, Math.round(H / 5));
      if (st.bloom.width !== BW || st.bloom.height !== BH) { st.bloom.width = BW; st.bloom.height = BH; }
      bc.setTransform(1, 0, 0, 1, 0, 0); bc.globalCompositeOperation = 'source-over'; bc.clearRect(0, 0, BW, BH); bc.setTransform(BW / W, 0, 0, BH / H, 0, 0);
      c.globalCompositeOperation = 'lighter';
      const halo = (x, y, R2, img, a) => { if (a <= .01 || x + R2 < 0 || x - R2 > W || y + R2 < 0 || y - R2 > H) return; c.globalAlpha = Math.min(1, a); c.drawImage(img, x - R2, y - R2, R2 * 2, R2 * 2); c.globalAlpha = 1; };
      // mist lying on the fields, lit from the east
      const mistA = (.35 + .65 * warm) * (1 - .75 * day);
      if (mistA > .02) {
        const mc = mixc(mixc([120, 130, 170], [255, 200, 150], warm), [255, 240, 220], day);
        [[60, .9], [140, .7], [300, .55], [600, .45]].forEach(([zw, a], j) => {
          const zc = CZ(ex, 0, ez + zw); if (zc < 5) return;
          const Y0 = cy - F * CY(ex, 1.5 + j, ez + zw) / zc, hh = Math.max(H * .02, 5 * F / zc);
          if (Y0 - hh > H || Y0 + hh < 0) return;
          c.globalAlpha = .14 * a * mistA;
          c.drawImage(st.mist, -W * .3, Y0 - hh, W * 1.6, hh * 2);
          const g = c.createRadialGradient(sunHx, Y0, 0, sunHx, Y0, W * .35); g.addColorStop(0, rgb(mc, 1)); g.addColorStop(1, rgb(mc, 0));
          c.globalAlpha = .16 * a * mistA * warm; c.fillStyle = g; c.fillRect(0, Y0 - hh, W, hh * 2);
        });
        c.globalAlpha = 1;
      }
      // rays of the rising sun through the haze
      const rayA = sunI * (1 - day) * .6;
      if (rayA > .02) {
        for (let j = 0; j < 9; j++) {
          const a = -Math.PI / 2 + (j - 4) * .2 + .03 * Math.sin(t * .1 + j), L2 = H * (1.2 + .3 * Math.sin(j * 2.3));
          const g = c.createLinearGradient(sunHx, hy, sunHx + Math.cos(a) * L2, hy + Math.sin(a) * L2);
          g.addColorStop(0, `rgba(255,214,160,${.06 * rayA})`); g.addColorStop(1, 'rgba(255,214,160,0)');
          c.fillStyle = g; c.beginPath(); c.moveTo(sunHx, hy); c.lineTo(sunHx + Math.cos(a - .045) * L2, hy + Math.sin(a - .045) * L2); c.lineTo(sunHx + Math.cos(a + .045) * L2, hy + Math.sin(a + .045) * L2); c.fill();
        }
      }
      // his disc by the well: a soft warm bloom in the last of the night, and its light on the ground
      if (aliHead) {
        const night = 1 - day * .6, R = Math.max(6 * k, aliHead.r * 3);
        halo(aliHead.x, aliHead.y, R * 5, st.warm, .12 * night);
        bc.fillStyle = `rgba(255,226,170,${.18 * night})`; bc.beginPath(); bc.arc(aliHead.x, aliHead.y, R * 1.4, 0, TAU); bc.fill();
        const zg = CZ(LIGHT[0], 0, LIGHT[2]);
        if (zg > .5) { const gx = cx + F * CX(LIGHT[0], 0, LIGHT[2]) / zg, gy = cy - F * CY(LIGHT[0], 0, LIGHT[2]) / zg, R2 = 7 * F / zg; c.globalAlpha = .2 * night; c.drawImage(st.warm, gx - R2, gy - R2 * .3, R2 * 2, R2 * .6); c.globalAlpha = 1; }
      }
      // the lamp in the hut's door, burning down
      { const zc = CZ(HUT[0] + 2.85, 1.2, HUT[2] - .1); if (zc > 1) { const X0 = cx + F * CX(HUT[0] + 2.85, 1.2, HUT[2] - .1) / zc, Y0 = cy - F * CY(HUT[0] + 2.85, 1.2, HUT[2] - .1) / zc; halo(X0, Y0, Math.max(3 * k, 1.4 * F / zc), st.warm, .55 * (1 - day)); } }
      // the sun in the bloom
      if (sunEl > -1.5) { bc.fillStyle = `rgba(255,214,160,${.7 * c01((sunEl + 1.5) / 2.5)})`; bc.beginPath(); bc.arc(sunHx, Math.min(sunScr[1], hy + 10 * k), H * .05, 0, TAU); bc.fill(); }
      c.globalAlpha = .85; c.drawImage(st.bloom, 0, 0, W, H); c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
      // birds crossing the light
      const birdA = smooth(seg(p, .45, .55)) * (1 - smooth(seg(p, .92, 1)));
      if (birdA > 0) {
        c.strokeStyle = `rgba(30,24,30,${.8 * birdA})`; c.lineWidth = Math.max(1, 1.2 * k); c.lineCap = 'round';
        st.birds.forEach(([u, v, ph, sp, j]) => {
          const x = sunHx + (u * .5 + (p - .45) * sp * 1.6 - .3) * W, y = hy - v * H - (p - .45) * H * .08 * (j % 2 ? 1 : -1), s = (6 + j % 3 * 2) * k, fl = Math.sin(t * 5 * sp + ph) * .5;
          if (x < -20 || x > W + 20) return;
          c.beginPath(); c.moveTo(x - s, y - s * (.2 + fl * .5)); c.quadraticCurveTo(x - s * .4, y - s * .35, x, y); c.quadraticCurveTo(x + s * .4, y - s * .35, x + s, y - s * (.2 + fl * .5)); c.stroke();
        });
      }
      // grade
      c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(st.noise, 'repeat'); c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      const vg = c.createRadialGradient(W * .5, H * .55, Math.min(W, H) * .3, W * .5, H * .55, Math.hypot(W, H) * .62);
      vg.addColorStop(0, 'rgba(8,10,16,0)'); vg.addColorStop(1, `rgba(8,10,16,${.6 - .25 * day})`);
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
    },
  };
})();
