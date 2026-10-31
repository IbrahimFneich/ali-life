// Ghadir Khumm, 18 Dhu al-Hijja 10 AH. A top-down map of the desert near al-Juhfa at noon: the caravans come up
// the road from Mecca, the front reaches the fork, the halt, the gathering at the pond, the ring around the pulpit
// of saddles, the two lights, the wave of the pledge, and the gold carried out along every road.
// World units: x east, y south; the fork is at (0, 0), the pulpit at C. Heights (h) are in the same units.
(() => {
  const C = [0, 210];
  const R0 = 62, R1 = 310;
  const N = 4200;
  const MAIN = [[90, 3500], [60, 2900], [-50, 2200], [70, 1550], [-40, 980], [25, 560], [0, 300], [0, 210], [0, 0]];
  const BR = [
    [[0, 0], [-15, -300], [30, -800], [-35, -1400], [20, -2000], [0, -2900], [-30, -3500]], // Medina, north
    [[0, 0], [180, -140], [620, -420], [1150, -700], [1800, -1100], [2800, -1650], [3500, -2050]], // Iraq, north-east
    [[0, 0], [-180, -110], [-620, -330], [-1150, -560], [-1800, -850], [-2800, -1300], [-3500, -1620]], // Egypt and Sham, north-west
  ];
  const WADI = [
    [[-2800, 900], [-1900, 760], [-1200, 820], [-700, 640], [-300, 520], [-170, 330], [-150, 176]],
    [[2800, 300], [2000, 420], [1300, 300], [700, 380], [300, 300], [60, 230]],
    [[-2600, -1900], [-1700, -1500], [-1000, -1250], [-500, -900], [-200, -500]],
    [[1400, 2800], [1100, 2100], [600, 1700], [300, 1300], [150, 900]],
    [[-2800, 2300], [-2000, 2000], [-1400, 1800], [-900, 1900], [-500, 1700]],
  ];
  const TREES = [[-48, 160, 13], [46, 152, 12], [-44, 268, 12], [52, 272, 13], [-168, 126, 10], [-206, 206, 11], [-104, 228, 9], [10, 116, 9]];
  const POND = [-150, 176];
  // camera keys: p, cx, cy, span (world units across the short side), tilt (1 = straight down), look height, x anchor (landscape)
  const CAM = [
    [-.05, 0, 470, 1120, 1, 0, .42], [0, 0, 440, 1100, 1, 0, .42], [.1, 0, 260, 1200, 1, 0, .42], [.2, 0, 110, 1380, 1, 0, .42],
    [.34, 0, 200, 1060, .97, 0, .42], [.48, 0, 208, 800, .84, 2, .4], [.58, 0, 210, 470, .68, 8, .38],
    [.66, 0, 212, 240, .57, 15, .36], [.74, 0, 212, 330, .6, 13, .36], [.84, 0, 210, 980, .78, 4, .38],
    [.92, 0, 140, 2100, .95, 0, .42], [1, 0, 60, 3250, 1, 0, .42], [1.05, 0, 60, 3300, 1, 0, .42],
  ];
  const keyv = (K, p) => {
    let i = 1;
    while (i < K.length - 1 && p > K[i][0]) i++;
    const A = K[i - 1], B = K[i], k = smooth(c01((p - A[0]) / (B[0] - A[0])));
    return A.slice(1).map((v, j) => mix(v, B[j + 1], k));
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
  const cr = (a, b, c, d, u) => [0, 1].map((j) => .5 * (2 * b[j] + (c[j] - a[j]) * u + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * u * u + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * u * u * u));
  // A polyline through control points, resampled to equal arc steps, with normals.
  function route(pts, ds = 4) {
    const P = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], d = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < 24; k++) P.push(cr(a, b, c, d, k / 24));
    }
    P.push(pts[pts.length - 1]);
    const acc = [0];
    for (let i = 1; i < P.length; i++) acc.push(acc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const L = acc[acc.length - 1], n = Math.ceil(L / ds) + 1;
    const X = new Float32Array(n), Y = new Float32Array(n), NX = new Float32Array(n), NY = new Float32Array(n);
    for (let k = 0, j = 0; k < n; k++) {
      const s = Math.min(L, k * ds);
      while (j < acc.length - 2 && acc[j + 1] < s) j++;
      const f = (s - acc[j]) / ((acc[j + 1] - acc[j]) || 1);
      X[k] = mix(P[j][0], P[j + 1][0], f); Y[k] = mix(P[j][1], P[j + 1][1], f);
    }
    for (let k = 0; k < n; k++) {
      const a = Math.max(0, k - 2), b = Math.min(n - 1, k + 2), dx = X[b] - X[a], dy = Y[b] - Y[a], d = Math.hypot(dx, dy) || 1;
      NX[k] = -dy / d; NY[k] = dx / d;
    }
    return { X, Y, NX, NY, n, L, ds };
  }
  const O = [0, 0];
  const at = (R, u, l) => { // position on a route at arc u with lateral offset l; extrapolates past both ends
    const f = u / R.ds, i = Math.min(R.n - 2, Math.max(0, Math.floor(f))), k = f - i;
    O[0] = R.X[i] + (R.X[i + 1] - R.X[i]) * k + R.NX[i] * l;
    O[1] = R.Y[i] + (R.Y[i + 1] - R.Y[i]) * k + R.NY[i] * l;
    return O;
  };
  const nearest = (R, x, y) => { let b = 0, bd = 1e18; for (let i = 0; i < R.n; i++) { const d = (R.X[i] - x) ** 2 + (R.Y[i] - y) ** 2; if (d < bd) { bd = d; b = i; } } return b * R.ds; };
  // value noise for the baked sand
  const hash = (x, y) => { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const vn = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y, o) => { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * vn(x * f + i * 17.3, y * f - i * 9.1); f *= 2.03; a *= .5; } return s / (1 - .5 ** o); };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // ---------- the baked ground: tone at low resolution, then two layers (whole map, and the ring) ----------
  function bake(st) {
    const E = 3500, TS = 10, tw = Math.round(2 * E / TS);
    const tone = mk(tw, tw), tc = tone.getContext('2d'), img = tc.createImageData(tw, tw), D = img.data;
    const hgt = (x, y) => {
      const rx = x * .8 + y * .6, ry = -x * .6 + y * .8;
      return (1 - Math.abs(2 * fbm(rx / 560, ry / 190, 3) - 1)) ** 1.6 * 60 + fbm(x / 1300, y / 1300, 2) * 90;
    };
    for (let j = 0; j < tw; j++) for (let i = 0; i < tw; i++) {
      const x = -E + i * TS, y = -E + j * TS;
      const h = hgt(x, y), hx = (hgt(x + TS, y) - h) / TS, hy = (hgt(x, y + TS) - h) / TS;
      const nl = Math.hypot(hx, hy, 1), sh = (.62 * hx + .45 * hy + .64) / nl; // light from the north-west, high
      const big = fbm(x / 1100, y / 1100, 3);
      const harra = c01((fbm(x / 700 + 40, y / 700, 4) - .5) * 5) * c01((x - 700) / 600);
      const hills = c01((fbm(x / 500 - 30, y / 500 + 7, 4) - .56) * 6) * c01((-x - 1000) / 700);
      const lit = .66 + .48 * sh;
      let r = mix(122, 168, big) * lit, g = mix(88, 126, big) * lit, b = mix(54, 80, big) * (lit * .9 + .1);
      const dk = Math.max(harra * .8, hills * .6);
      const spk = hash(i, j) * .25;
      r = mix(r, 42 + spk * 30, dk); g = mix(g, 36 + spk * 26, dk); b = mix(b, 32 + spk * 22, dk);
      const o = (j * tw + i) * 4;
      D[o] = r; D[o + 1] = g; D[o + 2] = b; D[o + 3] = 255;
    }
    tc.putImageData(img, 0, 0);
    const grain = mk(256, 256), gc = grain.getContext('2d'), gi = gc.createImageData(256, 256), r = rng(77);
    for (let i = 0; i < gi.data.length; i += 4) { const v = r() * 255; gi.data[i] = gi.data[i + 1] = gi.data[i + 2] = v; gi.data[i + 3] = 255; }
    gc.putImageData(gi, 0, 0);
    const layer = (x0, y0, w, s) => {
      const cv = mk(Math.round(w * s), Math.round(w * s)), c = cv.getContext('2d');
      c.imageSmoothingQuality = 'high';
      c.drawImage(tone, (x0 + E) / TS, (y0 + E) / TS, w / TS, w / TS, 0, 0, cv.width, cv.height);
      c.setTransform(s, 0, 0, s, -x0 * s, -y0 * s);
      // wadis: soft dark beds with a pale dry channel and scrub
      WADI.forEach((pts, wi) => {
        const R = route(pts, 12);
        const line = (lw, col) => { c.beginPath(); for (let i = 0; i < R.n; i++) { const x = R.X[i] + Math.sin(i * .21 + wi) * 6, y = R.Y[i]; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.lineWidth = lw; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); };
        line(170, 'rgba(60,44,26,.10)'); line(90, 'rgba(56,40,24,.12)'); line(40, 'rgba(50,36,22,.14)');
        const rr = rng(300 + wi);
        [-9, 0, 11].forEach((o, q) => { c.beginPath(); for (let i = 0; i < R.n; i++) { const l = o + Math.sin(i * .37 + q * 2) * 7, x = R.X[i] + R.NX[i] * l, y = R.Y[i] + R.NY[i] * l; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.lineWidth = 2.2; c.strokeStyle = 'rgba(46,32,18,.26)'; c.stroke(); });
        c.fillStyle = 'rgba(62,72,40,.5)';
        for (let i = 0; i < R.n; i++) if (rr() < .5) { const l = (rr() - .5) * 70, x = R.X[i] + R.NX[i] * l, y = R.Y[i] + R.NY[i] * l; c.beginPath(); c.arc(x, y, 1.5 + rr() * 3, 0, TAU); c.fill(); }
      });
      // wind ripples on the sand
      const rr = rng(Math.round(x0 + 9000));
      const cnt = Math.round(w * w / 900 * Math.min(1, s * 1.6));
      c.lineCap = 'round';
      for (let i = 0; i < cnt; i++) {
        const x = x0 + rr() * w, y = y0 + rr() * w, L = 14 + rr() * 50, a = -.35 + (rr() - .5) * .3;
        const dx = Math.cos(a) * L, dy = Math.sin(a) * L, bend = (rr() - .5) * L * .5;
        c.beginPath(); c.moveTo(x - dx / 2, y - dy / 2); c.quadraticCurveTo(x - dy / L * bend, y + dx / L * bend, x + dx / 2, y + dy / 2);
        c.lineWidth = 1.6 / s; c.strokeStyle = rr() < .5 ? 'rgba(70,50,28,.10)' : 'rgba(255,240,205,.09)'; c.stroke();
      }
      // stones and lone thorn bushes
      for (let i = 0; i < cnt / 6; i++) {
        const x = x0 + rr() * w, y = y0 + rr() * w;
        c.fillStyle = rr() < .7 ? 'rgba(60,46,32,.35)' : 'rgba(54,62,36,.5)';
        c.beginPath(); c.arc(x, y, (.8 + rr() * 2.4) / Math.min(1, s * 1.4), 0, TAU); c.fill();
      }
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'overlay'; c.globalAlpha = .16;
      c.fillStyle = c.createPattern(grain, 'repeat'); c.fillRect(0, 0, cv.width, cv.height);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      return { cv, x0, y0, w, s };
    };
    st.LA = layer(-E, -E, 2 * E, .17);
    st.LB = layer(-1150, -1150, 2300, .74);
  }

  function drawLayer(c, L, cam, W, H, amp, t) {
    const wx0 = cam.cx + (0 - cam.ox) / cam.z, wx1 = cam.cx + (W - cam.ox) / cam.z;
    const zt = cam.z * cam.tilt, wy0 = cam.cy + (0 - cam.oy) / zt, wy1 = cam.cy + (H - cam.oy) / zt;
    const x0 = Math.max(L.x0, wx0 - 8), x1 = Math.min(L.x0 + L.w, wx1 + 8), y0 = Math.max(L.y0, wy0 - 8), y1 = Math.min(L.y0 + L.w, wy1 + 8);
    if (x1 <= x0 || y1 <= y0) return;
    const n = amp > .3 ? 44 : 1, dy = (y1 - y0) / n;
    for (let k = 0; k < n; k++) {
      const ya = y0 + k * dy, sy = cam.oy + (ya - cam.cy) * zt;
      const sh = n > 1 ? amp * (Math.sin(sy * .021 + t * 2.3) + .6 * Math.sin(sy * .057 - t * 3.7 + k)) : 0;
      c.drawImage(L.cv, (x0 - L.x0) * L.s, (ya - L.y0) * L.s, (x1 - x0) * L.s, dy * L.s,
        cam.ox + (x0 - cam.cx) * cam.z + sh, sy, (x1 - x0) * cam.z, dy * zt + 1);
    }
  }

  S.ghadir = {
    init(el, st) {
      st.cv = el.querySelector('canvas');
      st.ctx = st.cv.getContext('2d');
      st.bloom = mk(8, 8); st.bc = st.bloom.getContext('2d');
      st.dust = mk(64, 64); { const g = st.dust.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(236,216,176,1)'); gr.addColorStop(.5, 'rgba(226,204,160,.45)'); gr.addColorStop(1, 'rgba(226,204,160,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
      st.R = BR.map((b) => route(MAIN.concat(b.slice(1))));
      st.LM = nearest(st.R[0], 0, 0);
      st.uC = st.R.map((R) => nearest(R, C[0], C[1]));
      const r = rng(1810);
      const A = (T) => new T(N);
      st.rt = A(Uint8Array); st.u0 = A(Float32Array); st.l = A(Float32Array); st.sp = A(Float32Array); st.kind = A(Uint8Array);
      st.gu = A(Float32Array); st.bd = A(Float32Array); st.cd = A(Float32Array);
      st.sx = A(Float32Array); st.sy = A(Float32Array); st.sr = A(Float32Array);
      st.dr = A(Uint8Array); st.dd = A(Float32Array); st.dist = A(Float32Array); st.tw = A(Float32Array);
      st.X = A(Float32Array); st.Y = A(Float32Array); st.G = A(Float32Array);
      // caravans: clumps strung along the road, front just short of the fork
      const dens = (u) => .18 + .82 * smooth(c01(Math.sin(u / 90) + .6 * Math.sin(u / 31 + 2) + .2));
      for (let i = 0; i < N; i++) {
        let u;
        do u = st.LM - 60 - r() * 3600; while (r() > dens(u));
        st.u0[i] = u;
        const g = (r() + r() + r() - 1.5) / 1.5;
        st.l[i] = g * 30 + (r() < .1 ? (r() - .5) * 90 : 0);
        st.sp[i] = .9 + r() * .2;
        st.kind[i] = r() < .28 ? 1 : 0;
        const q = r();
        st.rt[i] = q < .42 ? 0 : q < .71 ? 1 : 2;
        st.bd[i] = r() * .045;
        st.cd[i] = r() * .085;
        st.tw[i] = r() * TAU;
      }
      // ring slots: an annulus around the pulpit, kept out of the pond
      const sl = [];
      while (sl.length < N) {
        const a = r() * TAU, rr = R0 + (R1 - R0) * r() ** 1.45 + (r() - .5) * 12;
        const x = C[0] + Math.cos(a) * rr, y = C[1] + Math.sin(a) * rr;
        if (((x - POND[0]) / 60) ** 2 + ((y - POND[1]) / 42) ** 2 < 1) continue;
        sl.push([x, y, rr]);
      }
      // gather spot along the road, then match slots by latitude and side so everyone steps sideways into the ring
      const idx = Array.from({ length: N }, (_, i) => i);
      for (let i = 0; i < N; i++) st.gu[i] = st.uC[st.rt[i]] + (r() - .55) * 300;
      idx.sort((a, b) => st.gu[b] - st.gu[a]);
      sl.sort((a, b) => a[1] - b[1]);
      const CH = 70;
      for (let s = 0; s < N; s += CH) {
        const di = idx.slice(s, s + CH).sort((a, b) => (st.l[a] * st.R[0].NX[0]) - (st.l[b] * st.R[0].NX[0]));
        const ss = sl.slice(s, s + CH).sort((a, b) => a[0] - b[0]);
        di.forEach((d, k) => { st.sx[d] = ss[k][0]; st.sy[d] = ss[k][1]; st.sr[d] = ss[k][2]; });
      }
      // dispersal: by bearing from the pulpit, out along the three branches
      for (let i = 0; i < N; i++) {
        const a = Math.atan2(st.sy[i] - C[1], st.sx[i] - C[0]), s = Math.sin(a), co = Math.cos(a);
        const th = s > .5 ? .15 : .42; // the three branches past the pond; the south of the ring takes the nearest
        st.dr[i] = co < -th ? 2 : co > th ? 1 : 0;
        st.dd[i] = r() * .1;
        st.dist[i] = 1500 + r() * 1700;
      }
      // the pond's shore and the scrub around it
      const pr = rng(5);
      st.pond = Array.from({ length: 48 }, (_, i) => { const a = i / 48 * TAU, k = 1 + (vn(Math.cos(a) * 2 + 9, Math.sin(a) * 2) - .5) * .35; return [POND[0] + Math.cos(a) * 46 * k, POND[1] + Math.sin(a) * 29 * k]; });
      st.reed = Array.from({ length: 90 }, () => { const a = pr() * TAU, k = 1.02 + pr() * .22; return [POND[0] + Math.cos(a) * 46 * k, POND[1] + Math.sin(a) * 29 * k, .8 + pr() * 1.6]; });
      st.trees = TREES.map(([x, y, R], i) => { const tr = rng(40 + i); return { x, y, R, puffs: Array.from({ length: 11 }, () => [(tr() - .5) * R * 1.2, (tr() - .5) * R * 1.1, R * (.3 + tr() * .3)]), th: Array.from({ length: 14 }, () => [tr() * TAU, R * (.75 + tr() * .3), R * (.2 + tr() * .25)]) }; });
      // the pulpit: saddles stacked in four courses
      st.sad = [[-9.5, -6, 0], [9.5, -6, 0], [-9.5, 6, 0], [9.5, 6, 0], [-4, -4, 1], [5, 4, 1], [0, -1, 2], [0, 0, 3]];
      bake(st);
    },

    frame(p, t, el, st) {
      fit(st.cv);
      const c = st.ctx, W = st.cv.width, H = st.cv.height, k = W / Math.max(1, st.cv.clientWidth);
      const port = H > W * 1.1;
      // ---------- camera ----------
      const [cx, cy, span, tilt, look, axL] = spline(CAM, p);
      const z = Math.min(W, H) / (span * (port ? .82 : 1));
      const sn = Math.sqrt(Math.max(0, 1 - tilt * tilt));
      const cam = { cx, cy, z, tilt, ox: W * (port ? .5 : axL), oy: H * (port ? .4 : .5) + look * z * sn };
      const SX = (x) => cam.ox + (x - cx) * z, SY = (y, h = 0) => cam.oy + (y - cy) * z * tilt - h * z * sn;
      const zc = z / k; // css px per unit
      // ---------- light and heat ----------
      const heat = keyv([[0, .45], [.2, .6], [.38, 1], [.58, 1], [.68, .25], [.8, 0], [1, 0]], p)[0];
      const dim = keyv([[0, 0], [.58, 0], [.68, .42], [.8, .56], [.9, .7], [1, .74]], p)[0];
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      c.fillStyle = PAL.ink; c.fillRect(0, 0, W, H);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'low';
      const amp = heat * 1.5 * k;
      const B = st.LB, vx0 = cx - cam.ox / z, vx1 = cx + (W - cam.ox) / z, vy0 = cy - cam.oy / (z * tilt), vy1 = cy + (H - cam.oy) / (z * tilt);
      if (!(vx0 > B.x0 && vx1 < B.x0 + B.w && vy0 > B.y0 && vy1 < B.y0 + B.w)) drawLayer(c, st.LA, cam, W, H, amp, t);
      drawLayer(c, B, cam, W, H, amp, t);

      // ---------- roads: a worn band and its ruts ----------
      const lw = Math.max(1, k * .9);
      const roadPath = (R, u0, u1, l) => {
        const s0 = Math.max(0, Math.floor(u0 / R.ds)), s1 = Math.min(R.n - 1, Math.ceil(u1 / R.ds)), st2 = z < .4 * k ? 3 : 1;
        c.beginPath();
        for (let i = s0; i <= s1; i += st2) { const x = SX(R.X[i] + R.NX[i] * l), y = SY(R.Y[i] + R.NY[i] * l); i === s0 ? c.moveTo(x, y) : c.lineTo(x, y); }
      };
      c.lineJoin = 'round'; c.lineCap = 'round';
      st.R.forEach((R, ri) => {
        const u0 = ri ? st.LM - 120 : 0;
        roadPath(R, u0, R.L, 0); c.strokeStyle = `rgba(232,212,168,${.16 * (1 - dim)})`; c.lineWidth = Math.max(2 * k, 16 * z); c.stroke();
        c.strokeStyle = `rgba(244,230,196,${.32 * (1 - .8 * dim)})`; c.lineWidth = lw;
        [-5, 4].forEach((l) => { roadPath(R, u0, R.L, l); c.stroke(); });
      });

      // ---------- the pond ----------
      const pondPath = (sc) => { c.beginPath(); st.pond.forEach(([x, y], i) => { const X = SX(POND[0] + (x - POND[0]) * sc), Y = SY(POND[1] + (y - POND[1]) * sc); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); };
      pondPath(1.3); c.fillStyle = 'rgba(52,40,24,.35)'; c.fill();
      pondPath(1.1); c.fillStyle = 'rgba(48,56,34,.6)'; c.fill();
      pondPath(1);
      const pg = c.createRadialGradient(SX(POND[0]), SY(POND[1]), 0, SX(POND[0]), SY(POND[1]), 48 * z);
      pg.addColorStop(0, '#1d2c25'); pg.addColorStop(.7, '#16211b'); pg.addColorStop(1, '#3a3d2a');
      c.fillStyle = pg; c.fill();
      c.save(); c.clip();
      c.globalCompositeOperation = 'lighter';
      const gl = c.createRadialGradient(SX(POND[0] + 10), SY(POND[1] - 6), 0, SX(POND[0] + 10), SY(POND[1] - 6), 12 * z);
      gl.addColorStop(0, `rgba(255,246,220,${(.22 + .1 * Math.sin(t * 3.1)) * (.3 + heat * .7)})`); gl.addColorStop(1, 'rgba(255,246,220,0)');
      c.fillStyle = gl; c.fillRect(0, 0, W, H);
      c.restore();
      c.fillStyle = 'rgba(46,62,34,.85)';
      c.beginPath(); st.reed.forEach(([x, y, s]) => { c.rect(SX(x), SY(y), s * zc * k * .9, s * zc * k * .9); }); c.fill();

      // ---------- tree shadows (noon: small and straight down) ----------
      c.fillStyle = 'rgba(30,20,10,.38)';
      st.trees.forEach((tr) => { c.beginPath(); c.ellipse(SX(tr.x + 1.5), SY(tr.y + 1), tr.R * .85 * z, tr.R * .85 * z * tilt, 0, 0, TAU); c.fill(); });

      // ---------- the people ----------
      const { X, Y, G } = st;
      const pA = seg(p, 0, .2), aA = mix(pA, ease.out(pA), .45);
      const wv = mix(15, R1 + 80, seg(p, .7, .86));
      for (let i = 0; i < N; i++) {
        const R = st.R[st.rt[i]];
        let u = st.u0[i] + 600 * st.sp[i] * aA, l = st.l[i];
        if (p > .2) { const b = ease.io(seg(p, .2 + st.bd[i], .37)); u = mix(u, st.gu[i], b); l *= mix(1, 2.4, b); }
        at(R, u, l);
        let x = O[0], y = O[1];
        if (p > .32) { const w = ease.io(seg(p, .32 + st.cd[i], .49 + st.cd[i])); x = mix(x, st.sx[i], w); y = mix(y, st.sy[i], w); }
        if (p > .855) {
          const e = seg(p, .855 + st.dd[i], 1.02);
          if (e > 0) {
            const d = st.dr[i];
            at(st.R[d], st.uC[d] + st.dist[i] * e ** 1.35, st.l[i] * 1.3);
            const w = smooth(seg(e, 0, .24));
            x = mix(x, O[0], w); y = mix(y, O[1], w);
          }
        }
        if (p < .86) { const qx = (x - POND[0]) / 58, qy = (y - POND[1]) / 40, d = qx * qx + qy * qy; if (d < 1) { const m = 1 / Math.sqrt(d + 1e-6); x = POND[0] + qx * m * 58; y = POND[1] + qy * m * 40; } }
        X[i] = x; Y[i] = y;
        G[i] = p > .7 ? c01((wv - st.sr[i]) / 36) : 0;
      }
      const ds = Math.min(2.8, Math.max(1, Math.sqrt(zc / .55))) * k;
      const dotPass = (sel, col, w, h, ox = 0, oy = 0) => {
        c.fillStyle = col; c.beginPath();
        for (let i = 0; i < N; i++) {
          if (!sel(i)) continue;
          const x = SX(X[i]), y = SY(Y[i]);
          if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
          c.rect(x - w / 2 + ox, y - h / 2 + oy, w, h);
        }
        c.fill();
      };
      // dust kicked up by the moving caravans
      const mv = (1 - seg(p, .36, .44)) * (p < .2 ? 1 : .85) * (1 - dim);
      if (mv > 0) {
        const R = Math.max(6 * k, 22 * z);
        c.globalAlpha = .07 * mv;
        for (let i = 0; i < N; i += 9) { const x = SX(X[i]), y = SY(Y[i]); if (x < -R || y < -R || x > W + R || y > H + R) continue; c.drawImage(st.dust, x - R, y - R * .8, R * 2, R * 1.6); }
        c.globalAlpha = 1;
      }
      const nong = (i) => G[i] < .5;
      dotPass(nong, 'rgba(24,16,8,.42)', ds * 1.7, ds * 1.7, .5 * ds, .7 * ds);
      dotPass((i) => st.kind[i] === 1 && G[i] < .5, 'rgba(46,30,16,.95)', ds * 1.9, ds * 1.3);
      dotPass((i) => st.kind[i] === 0 && G[i] < .5, 'rgba(246,238,218,.95)', ds * 1.2, ds * 1.2);

      // ---------- the pulpit of saddles ----------
      const build = seg(p, .38, .54);
      const SW = 18, SD = 10, SHt = 4;
      const box = (x, y, h0, a, j) => { // a pack saddle: wooden frame, wool pad, a woven band
        const xl = SX(x - SW / 2), xr = SX(x + SW / 2), yt = SY(y - SD / 2, h0 + SHt), yb = SY(y + SD / 2, h0 + SHt), yf = SY(y + SD / 2, h0);
        const w = xr - xl, rr = Math.min(w * .22, (yb - yt) * .5);
        c.globalAlpha = a;
        c.fillStyle = '#2e1f12'; c.beginPath(); c.roundRect(xl, yt + (yb - yt) * .4, w, yf - yt - (yb - yt) * .4, rr); c.fill();
        c.fillStyle = j % 2 ? '#6b4a2c' : '#5d3f25'; c.beginPath(); c.roundRect(xl, yt, w, yb - yt, rr); c.fill();
        c.fillStyle = 'rgba(122,36,30,.75)'; c.fillRect(xl + w * .3, yt, w * .4, yb - yt);
        c.fillStyle = 'rgba(201,165,78,.55)'; c.fillRect(xl + w * .3, yt, w * .4, Math.max(1, (yb - yt) * .12)); c.fillRect(xl + w * .3, yb - Math.max(1, (yb - yt) * .12), w * .4, Math.max(1, (yb - yt) * .12));
        c.fillStyle = 'rgba(30,18,8,.55)'; c.fillRect(xl + w * .08, yt + (yb - yt) * .2, Math.max(1, w * .05), (yb - yt) * .6); c.fillRect(xr - w * .13, yt + (yb - yt) * .2, Math.max(1, w * .05), (yb - yt) * .6);
        c.globalAlpha = 1;
      };
      if (build > 0) {
        c.fillStyle = `rgba(30,20,10,${.3 * build})`;
        c.beginPath(); c.ellipse(SX(C[0]), SY(C[1]), 20 * z, 13 * z * tilt, 0, 0, TAU); c.fill();
        st.sad.forEach(([dx, dy, lv], j) => {
          const a = seg(build, j / 8 * .85, j / 8 * .85 + .2);
          if (a <= 0) return;
          box(C[0] + dx, C[1] + dy, lv * SHt + (1 - ease.out(a)) * 8, a, j);
        });
      }
      const top = 4 * SHt;

      // ---------- the trees, standing above their shadows ----------
      st.trees.forEach((tr) => {
        const hgt = 8;
        c.strokeStyle = 'rgba(52,36,22,.9)'; c.lineWidth = Math.max(1, 1.4 * zc * k * .5);
        c.beginPath(); c.moveTo(SX(tr.x), SY(tr.y)); c.lineTo(SX(tr.x), SY(tr.y, hgt)); c.stroke();
        c.strokeStyle = 'rgba(46,40,24,.7)'; c.lineWidth = Math.max(1, k * .6);
        c.beginPath(); tr.th.forEach(([a, r1, r2]) => { const x1 = tr.x + Math.cos(a) * r1, y1 = tr.y + Math.sin(a) * r1; c.moveTo(SX(x1), SY(y1, hgt)); c.lineTo(SX(x1 + Math.cos(a) * r2), SY(y1 + Math.sin(a) * r2, hgt)); }); c.stroke();
        tr.puffs.forEach(([dx, dy, r], j) => {
          c.fillStyle = j % 3 ? 'rgba(58,68,40,.92)' : 'rgba(86,96,58,.9)';
          c.beginPath(); c.ellipse(SX(tr.x + dx), SY(tr.y + dy, hgt), r * z, r * z * tilt, 0, 0, TAU); c.fill();
        });
      });

      // ---------- noon glare, then the dimming ----------
      c.globalCompositeOperation = 'soft-light';
      const gx = SX(C[0]), gy = SY(C[1]);
      const hg = c.createRadialGradient(gx, gy, 0, gx, gy, Math.max(W, H) * .75);
      hg.addColorStop(0, `rgba(255,240,210,${.85 * heat})`); hg.addColorStop(.55, `rgba(255,226,170,${.35 * heat})`); hg.addColorStop(1, 'rgba(255,226,170,0)');
      c.fillStyle = hg; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      if (dim > 0) { // the world falls quiet around the pulpit: a pool of light, darker towards the edges
        const R = Math.max(W, H) * .8, dg = c.createRadialGradient(gx, gy - top * z * sn, 0, gx, gy - top * z * sn, R);
        dg.addColorStop(0, `rgba(9,10,8,${dim * .25})`); dg.addColorStop(.25, `rgba(9,10,8,${dim * .8})`); dg.addColorStop(1, `rgba(9,10,8,${Math.min(.95, dim * 1.15)})`);
        c.fillStyle = dg; c.fillRect(0, 0, W, H);
      }

      // ---------- the nearest of the crowd catch the light of the pulpit ----------
      const catchL = seg(p, .56, .64) * (1 - seg(p, .84, .9));
      if (catchL > 0) {
        c.globalCompositeOperation = 'lighter';
        for (let band = 0; band < 3; band++) {
          const r0 = R0 + band * 45, r1 = r0 + 45;
          c.fillStyle = `rgba(255,226,170,${(.55 - band * .16) * catchL})`; c.beginPath();
          for (let i = 0; i < N; i++) { const rr = st.sr[i]; if (rr < r0 || rr >= r1 || G[i] >= .5) continue; const x = SX(X[i]), y = SY(Y[i]); c.rect(x - ds * .6, y - ds * .6, ds * 1.2, ds * 1.2); }
          c.fill();
        }
        c.globalCompositeOperation = 'source-over';
      }
      // ---------- gold threads along the roads ----------
      const bc = st.bc, BW = Math.max(8, Math.round(W / 5)), BH = Math.max(8, Math.round(H / 5));
      if (st.bloom.width !== BW || st.bloom.height !== BH) { st.bloom.width = BW; st.bloom.height = BH; }
      bc.setTransform(1, 0, 0, 1, 0, 0); bc.globalCompositeOperation = 'source-over'; bc.clearRect(0, 0, BW, BH);
      const reach = 3000 * ease.io(seg(p, .87, 1.02));
      if (reach > 0) {
        c.globalCompositeOperation = 'lighter';
        for (let d = 0; d < 3; d++) {
          const R = st.R[d], u0 = st.uC[d];
          roadPath(R, u0, u0 + reach, 0);
          c.strokeStyle = 'rgba(201,165,78,.22)'; c.lineWidth = Math.max(3 * k, 10 * z); c.stroke();
          c.strokeStyle = 'rgba(243,217,143,.55)'; c.lineWidth = Math.max(1, k * 1.1); c.stroke();
        }
        c.globalCompositeOperation = 'source-over';
      }

      // ---------- the pledge: gold dots, and the crest of the wave ----------
      c.globalCompositeOperation = 'lighter';
      const gold = (i) => G[i] >= .5;
      dotPass(gold, 'rgba(226,182,88,.9)', ds * 1.3, ds * 1.3);
      if (p > .7 && p < .9) {
        c.fillStyle = 'rgba(255,226,156,.5)'; c.beginPath();
        for (let i = 0; i < N; i++) { const f = 1 - Math.abs(wv - st.sr[i]) / 18; if (f <= 0) continue; const s = ds * (1.1 + .6 * f); c.rect(SX(X[i]) - s / 2, SY(Y[i]) - s / 2, s, s); }
        c.fill();
        const ew = (r, a, w) => { c.beginPath(); c.ellipse(SX(C[0]), SY(C[1]), r * z, r * z * tilt, 0, 0, TAU); c.strokeStyle = `rgba(243,217,143,${a})`; c.lineWidth = w; c.stroke(); };
        const fade = 1 - seg(p, .84, .9);
        ew(wv, .5 * fade, Math.max(1.5 * k, 3 * z)); ew(wv, .12 * fade, Math.max(8 * k, 22 * z)); ew(wv * .82, .14 * fade, Math.max(1, 1.5 * z)); ew(wv * .64, .07 * fade, Math.max(1, z));
      }
      c.globalCompositeOperation = 'source-over';
      // bloom source: gold dots at one fifth size
      bc.setTransform(BW / W, 0, 0, BH / H, 0, 0);
      bc.fillStyle = 'rgba(214,168,72,.38)'; bc.beginPath();
      for (let i = 0; i < N; i++) { if (G[i] < .5) continue; const x = SX(X[i]), y = SY(Y[i]); if (x < 0 || y < 0 || x > W || y > H) continue; bc.rect(x - 2.5 * k, y - 2.5 * k, 5 * k, 5 * k); }
      bc.fill();

      // ---------- the two lights ----------
      let ux = 0, uy = 0;
      const lights = [];
      {
        const u = st.uC[0] - 300 * (1 - ease.out(seg(p, 0, .2))) - 18;
        at(st.R[0], u, -3); const px0 = O[0], py0 = O[1];
        at(st.R[0], u - 12, 7); const ax0 = O[0], ay0 = O[1];
        const m = ease.io(seg(p, .44, .53)), climb = ease.io(seg(p, .52, .58)), raise = ease.io(seg(p, .63, .72));
        const px = mix(px0, C[0] - 5, m), py = mix(py0, C[1], m), ax = mix(ax0, C[0] + 5, m) - raise * 2, ay = mix(ay0, C[1] + 1, m);
        lights.push([px, py, climb * top + raise * 1.5, 1, [255, 246, 222], [243, 217, 143], 1.25]);
        lights.push([ax, ay, climb * top + raise * 10, 1 + raise * 1.1, [243, 217, 143], [121, 201, 162], 1]);
        ux = ax; uy = ay;
      }
      const breathe = 1 + .05 * Math.sin(t * 1.3);
      c.globalCompositeOperation = 'lighter';
      lights.forEach(([x, y, h, I, core, halo, sz]) => {
        const X0 = SX(x), Y0 = SY(y, h), r = Math.max(1.8 * k, Math.min(8 * k, 1.5 * z)) * sz * breathe * Math.sqrt(I);
        const g1 = c.createRadialGradient(X0, Y0, 0, X0, Y0, r * 14);
        g1.addColorStop(0, `rgba(${halo},${.42 * I})`); g1.addColorStop(.18, `rgba(${halo},${.15 * I})`); g1.addColorStop(.5, `rgba(${halo},${.045 * I})`); g1.addColorStop(1, `rgba(${halo},0)`);
        c.fillStyle = g1; c.fillRect(X0 - r * 14, Y0 - r * 14, r * 28, r * 28);
        const g0 = c.createRadialGradient(X0, Y0, 0, X0, Y0, r * 40);
        g0.addColorStop(0, `rgba(${halo},${.1 * I * (.3 + dim)})`); g0.addColorStop(1, `rgba(${halo},0)`);
        c.fillStyle = g0; c.fillRect(X0 - r * 40, Y0 - r * 40, r * 80, r * 80);
        const g2 = c.createRadialGradient(X0, Y0, 0, X0, Y0, r * 1.6);
        g2.addColorStop(0, `rgba(${core},1)`); g2.addColorStop(.45, `rgba(${core},.85)`); g2.addColorStop(1, `rgba(${core},0)`);
        c.fillStyle = g2; c.fillRect(X0 - r * 2, Y0 - r * 2, r * 4, r * 4);
        bc.fillStyle = `rgba(${halo},.5)`; bc.beginPath(); bc.arc(X0, Y0, r * 1.6, 0, TAU); bc.fill();
      });
      const rz = seg(p, .62, .7) * (1 - seg(p, .84, .92));
      if (rz > 0) {
        const [a, b] = lights, ax = SX(a[0]), ay = SY(a[1], a[2]), bx = SX(b[0]), by = SY(b[1], b[2]);
        const lg = c.createLinearGradient(ax, ay, bx, by);
        lg.addColorStop(0, `rgba(255,246,222,${.5 * rz})`); lg.addColorStop(1, `rgba(243,217,143,${.5 * rz})`);
        c.strokeStyle = lg; c.lineWidth = Math.max(1.2 * k, .8 * z); c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
      }
      const pool = seg(p, .55, .64) * (1 - seg(p, .88, 1));
      if (pool > 0) {
        const X0 = SX(C[0]), Y0 = SY(C[1]), R = 90 * z;
        c.save(); c.translate(X0, Y0); c.scale(1, tilt);
        const pg2 = c.createRadialGradient(0, 0, 0, 0, 0, R);
        pg2.addColorStop(0, `rgba(255,226,160,${.22 * pool})`); pg2.addColorStop(.4, `rgba(243,200,120,${.08 * pool})`); pg2.addColorStop(1, 'rgba(243,200,120,0)');
        c.fillStyle = pg2; c.fillRect(-R, -R, 2 * R, 2 * R); c.restore();
      }
      // the raised light throws a column of soft light down to the pulpit
      const rs = seg(p, .63, .72) * (1 - seg(p, .9, 1));
      if (rs > 0) {
        const X0 = SX(ux), Y0 = SY(uy, top + 10), Y1 = SY(uy, 0);
        const cg = c.createLinearGradient(0, Y0, 0, Y1);
        cg.addColorStop(0, `rgba(243,217,143,${.22 * rs})`); cg.addColorStop(1, 'rgba(243,217,143,0)');
        c.fillStyle = cg; c.fillRect(X0 - 2.5 * z, Y0, 5 * z, Y1 - Y0);
      }
      // bloom
      c.globalAlpha = .8; c.drawImage(st.bloom, 0, 0, W, H); c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';

      // ---------- heat haze over the noon ground, and the frame ----------
      if (heat > .05) {
        c.globalCompositeOperation = 'lighter';
        for (let j = 0; j < 5; j++) {
          const hx = W * (.5 + .45 * Math.sin(t * .05 + j * 2.1)), hy = H * (.5 + .4 * Math.cos(t * .043 + j * 1.3)), hr = Math.max(W, H) * (.18 + .05 * j);
          const g = c.createRadialGradient(hx, hy, 0, hx, hy, hr);
          g.addColorStop(0, `rgba(255,240,210,${.05 * heat})`); g.addColorStop(1, 'rgba(255,240,210,0)');
          c.fillStyle = g; c.fillRect(hx - hr, hy - hr, hr * 2, hr * 2);
        }
        c.globalCompositeOperation = 'source-over';
      }
      const vg = c.createRadialGradient(W * .5, H * .5, Math.min(W, H) * .25, W * .5, H * .5, Math.hypot(W, H) * .58);
      vg.addColorStop(0, 'rgba(13,14,11,0)'); vg.addColorStop(1, `rgba(13,14,11,${.72 + dim * .2})`);
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
    },
  };
})();
