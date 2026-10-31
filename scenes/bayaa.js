// البيعة: Medina, Dhu al-Hijja 35 AH. Late golden afternoon over flat mud roofs, palm groves and the black harra.
// From every lane a crowd of cloaked, faceless figures streams to the mosque and presses on one calm light in the
// courtyard, with the two ringed lights of al-Hasan and al-Husayn beside it. The camera comes down off the roofs
// into the press, then rises and turns west as the crowd sits in rings around him and the city goes to dusk.
// World in metres: x east, y up, z north. The mosque is centred on the origin: an enclosure of mud-brick walls, the
// roofed hall on the south (qibla) side, a shallow arcade on the north, an open courtyard. No minaret, no dome.
// Pinhole camera with eye/look keys; painter order by distance, with people and palms bucketed by distance.
(() => {
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const tone = (x) => 255 * (1 - Math.exp(-1.2 * x));
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const sprite = (stops, n = 128) => { const c = mk(n, n), g = c.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); stops.forEach(([o, s]) => gr.addColorStop(o, s)); g.fillStyle = gr; g.fillRect(0, 0, n, n); return c; };
  const hash = (i) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
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
    return A.slice(1).map((v, j) => mix(v, B[j + 1], k));
  };
  // a polyline [x, z] through Catmull-Rom, resampled to equal steps, with normals
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

  // ---------- the place ----------
  const WH = 5.2; // wall height
  const ALI = [0, -5]; // his light, in the courtyard before the roofed hall
  const IMAMS = [[-1.35, -.4], [1.35, -.4]]; // al-Hasan and al-Husayn, relative to him
  const GATES = [[0, 37.5, 0, 31.5], [42.5, 2, 36.5, 2], [-42.5, 2, -36.5, 2]]; // outer x z, inner x z
  const LANES = [ // [gate, points from the gate outwards]
    [0, [[0, 37.5], [2, 72], [-5, 125], [6, 190], [-2, 265], [-12, 345], [4, 450]]],
    [0, [[0, 37.5], [2, 72], [-34, 112], [-84, 156], [-142, 214], [-204, 282], [-262, 360]]],
    [0, [[0, 37.5], [2, 72], [42, 104], [94, 150], [152, 204], [222, 268], [300, 340]]],
    [1, [[42.5, 2], [82, 7], [132, -4], [192, 9], [262, 0], [342, 10], [450, 4]]],
    [1, [[42.5, 2], [74, 36], [114, 78], [166, 110], [234, 150], [322, 200]]],
    [1, [[42.5, 2], [66, -26], [66, -86], [58, -156], [68, -236], [60, -330], [70, -440]]],
    [2, [[-42.5, 2], [-82, -2], [-132, 8], [-202, 0], [-282, 6], [-362, -4], [-452, 2]]],
    [2, [[-42.5, 2], [-76, 44], [-122, 90], [-172, 140], [-242, 192], [-320, 246]]],
    [2, [[-42.5, 2], [-64, -30], [-72, -90], [-62, -152], [-76, -224], [-70, -306], [-82, -420]]],
  ];
  const N = 5200, NIN = 3500;
  const V = 1250; // walking speed, metres per unit of p
  // camera keys: p, eye xyz, look xyz. From high in the north, down into the courtyard facing south to the light and the
  // hall; then up and round to the east, looking west over the city into the afterglow.
  const CAM = [
    [-.05, -40, 172, 525, 10, 0, -60], [0, -40, 170, 520, 10, 0, -60], [.13, -30, 128, 350, 6, 0, -40], [.24, -15, 70, 170, 0, 0, -20],
    [.32, -4, 30, 70, 0, 0, -10], [.375, 2, 11, 26, -3, 1, -8], [.43, 4, 3, 9.5, -6, 1.3, -8], [.5, 3.2, 2.6, 6.9, -6.5, 1.3, -9],
    [.525, 3.6, 6.5, 10, -5.5, 1.1, -8.2], [.56, 4.4, 13.5, 17, -4, 1, -7], [.59, 18, 19, 34, -22, 4, -28],
    [.62, 45, 26, 55, -50, 17, -61], [.68, 130, 45, 55, -53, 25, -23], [.76, 215, 58, -10, -33, 31, 2],
    [.86, 250, 62, -80, 4, 34, -1], [1.05, 256, 64, -96, 14, 36, -5],
  ];
  const SUNH = [-.69, .72]; // the sun's bearing: west-north-west in early summer
  const TONES = [[.84, .8, .72], [.64, .54, .42], [.42, .33, .25], [.2, .18, .17], [.25, .26, .33]];
  // a cloaked figure, standing (pose 0) or seated (pose 1); units of its height, feet at the origin
  // hem, sleeve, shoulder, neck on the left; the same mirrored on the right
  const FS = [[-.18, 0], [-.2, -.45], [-.17, -.68], [-.165, -.775], [-.07, -.805], [.07, -.805], [.165, -.775], [.17, -.68], [.2, -.45], [.18, 0]];
  const FT = [[-.27, 0], [-.29, -.14], [-.19, -.3], [-.14, -.43], [-.06, -.47], [.06, -.47], [.14, -.43], [.19, -.3], [.29, -.14], [.27, 0]];
  const HEAD = [[0, -.885, .075], [0, -.545, .073]];
  function addFig(c, x, y, sx, sy, pose, sway, v = 0, wf = 1) {
    const q = (j) => [x + mix(FS[j][0], FT[j][0], pose) * sx * wf, y + mix(FS[j][1], FT[j][1], pose) * sy];
    const P0 = q(0), P1 = q(1), P2 = q(2), P3 = q(3), P4 = q(4), P5 = q(5), P6 = q(6), P7 = q(7), P8 = q(8), P9 = q(9);
    c.moveTo(P0[0] + sway * sx, P0[1]);
    c.quadraticCurveTo(P1[0], P1[1], P2[0], P2[1]); c.quadraticCurveTo(P3[0], P3[1], P4[0], P4[1]);
    c.lineTo(P5[0], P5[1]);
    c.quadraticCurveTo(P6[0], P6[1], P7[0], P7[1]); c.quadraticCurveTo(P8[0], P8[1], P9[0] + sway * sx * .6, P9[1]);
    c.closePath();
    const hy = y + mix(HEAD[0][1], HEAD[1][1], pose) * sy, hr = mix(HEAD[0][2], HEAD[1][2], pose) * sx;
    if (v === 2) { c.moveTo(x + hr * 1.18, hy - hr * .1); c.ellipse(x, hy - hr * .1, hr * 1.18, hr * .95, 0, 0, TAU); return; }
    c.moveTo(x + hr, hy); c.arc(x, hy, hr, 0, TAU);
    if (v === 1) { // a head-cloth falling to the shoulders
      const sy2 = y + mix(-.77, -.43, pose) * sy;
      c.moveTo(x - hr * .95, hy); c.lineTo(x + hr * .95, hy); c.lineTo(x + hr * 1.75 * wf, sy2); c.lineTo(x - hr * 1.75 * wf, sy2); c.closePath();
    }
  }

  S.bayaa = {
    init(el, st) {
      st.cv = el.querySelector('canvas');
      st.ctx = st.cv.getContext('2d');
      const R = rng(3535);
      st.pale = sprite([[0, 'rgba(255,246,222,1)'], [.2, 'rgba(255,236,196,.5)'], [.55, 'rgba(240,214,160,.12)'], [1, 'rgba(240,214,160,0)']]);
      st.glow = sprite([[0, 'rgba(255,255,255,1)'], [.18, 'rgba(255,255,255,.55)'], [.45, 'rgba(255,255,255,.16)'], [1, 'rgba(255,255,255,0)']]);
      st.warm = sprite([[0, 'rgba(255,196,120,1)'], [.3, 'rgba(255,160,80,.38)'], [1, 'rgba(255,140,60,0)']]);
      st.dust = sprite([[0, 'rgba(240,210,160,1)'], [.5, 'rgba(230,200,150,.4)'], [1, 'rgba(230,200,150,0)']], 64);
      st.noise = mk(160, 160);
      { const ng = st.noise.getContext('2d'), id = ng.createImageData(160, 160); for (let i = 0; i < id.data.length; i += 4) { const v = R() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 18; } ng.putImageData(id, 0, 0); }
      st.bloom = mk(8, 8); st.bc = st.bloom.getContext('2d');
      // ----- lanes and a hash of their centre lines for clearance tests -----
      st.lanes = LANES.map(([g, pts], i) => { const L = route(pts, 2); L.g = g; L.hw = 2.4 + (i % 3) * .35; return L; });
      const LH = new Map(), LC = 16, key = (a, b) => (a + 500) * 2000 + b + 500;
      st.lanes.forEach((L) => { for (let i = 0; i < L.n; i++) { const k = key(Math.floor(L.X[i] / LC), Math.floor(L.Z[i] / LC)); if (!LH.has(k)) LH.set(k, []); LH.get(k).push(L.X[i], L.Z[i], L.hw); } });
      const clear = (x, z) => {
        let m = 1e9; const gx = Math.floor(x / LC), gz = Math.floor(z / LC);
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const l = LH.get(key(gx + a, gz + b)); if (!l) continue; for (let i = 0; i < l.length; i += 3) m = Math.min(m, Math.hypot(l[i] - x, l[i + 1] - z) - l[i + 2]); }
        return m;
      };
      // ----- buildings -----
      const boxes = [];
      const clay = () => { const k = R(); return k < .12 ? [.8, .74, .62] : [.64 + R() * .12, .5 + R() * .09, .37 + R() * .07]; };
      const box = (x0, x1, y0, y1, z0, z1, alb, extra) => { const b = { x0, x1, y0, y1, z0, z1, alb, ...extra }; boxes.push(b); return b; };
      const split = (x0, x1, y0, y1, z0, z1, alb, extra, step = 8) => { // long walls and slabs in pieces, so painter order holds
        const nx = Math.max(1, Math.round((x1 - x0) / step)), nz = Math.max(1, Math.round((z1 - z0) / step));
        const gc = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
        for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) box(mix(x0, x1, i / nx), mix(x0, x1, (i + 1) / nx), y0, y1, mix(z0, z1, j / nz), mix(z0, z1, (j + 1) / nz), alb, { ...extra, piece: 1, gc });
      };
      const MUD = [.7, .58, .44], MUDL = [.76, .66, .52];
      // the mosque
      split(-40, -2.4, 0, WH, 34, 35, MUD, { wall: 1 }); split(2.4, 40, 0, WH, 34, 35, MUD, { wall: 1 });
      split(-40, 40, 0, WH, -35, -34, MUD, { wall: 1 });
      split(39, 40, 0, WH, -35, -.4, MUD, { wall: 1 }); split(39, 40, 0, WH, 4.4, 34, MUD, { wall: 1 });
      split(-40, -39, 0, WH, -35, -.4, MUD, { wall: 1 }); split(-40, -39, 0, WH, 4.4, 34, MUD, { wall: 1 });
      box(-2.4, 2.4, 3.7, WH, 34, 35, MUD, { wall: 1 }); box(39, 40, 3.7, WH, -.4, 4.4, MUD, { wall: 1 }); box(-40, -39, 3.7, WH, -.4, 4.4, MUD, { wall: 1 });
      split(-39, 39, 4.5, WH, -34, -16, MUDL, { slab: 1 }, 9); // the roofed hall
      split(-39, 39, 3.6, 4.1, 30.2, 34, MUDL, { slab: 1 }, 9); // the northern arcade
      [-16.6, -20.4, -24.2, -28, -31.8].forEach((z, row) => { for (let x = -36; x <= 36.1; x += 4) box(x - .3, x + .3, 0, 4.5, z - .3, z + .3, [.74, .68, .58], { col: 1, row }); });
      for (let x = -36; x <= 36.1; x += 4) if (Math.abs(x) > 3) box(x - .3, x + .3, 0, 3.6, 30.5, 31.1, [.72, .66, .56], { col: 1 });
      st.lamps = []; for (let x = -34; x <= 34.1; x += 4) st.lamps.push([x, 3.5, -16.9]); for (let x = -34; x <= 34.1; x += 8) st.lamps.push([x, 3, 30.9]);
      // the rooms on the east side of the hall
      [[40.4, 46, -34, -27.5], [40.4, 46, -27, -21], [40.4, 46, -20.5, -15]].forEach(([a, b, c0, d]) => box(a, b, 0, 3.4, c0, d, [.6, .5, .38], { win: [[.4, .3, .6, .75]] }));
      // the town: 12 m cells cut into lots; palm groves and gardens thin it out towards the edges
      const palms = [], gardens = [];
      for (let gx = -40; gx < 40; gx++) for (let gz = -40; gz < 40; gz++) {
        const x0 = gx * 12, z0 = gz * 12, xc = x0 + 6, zc = z0 + 6, r = Math.hypot(xc, zc * 1.08);
        if (r > 480) continue;
        if (xc > -55 && xc < 55 && zc > -50 && zc < 50) continue; // the open ground round the mosque
        const grove = r > 110 && R() < (r < 230 ? .05 : .42) + (zc < -150 ? .2 : 0);
        const pHouse = r < 230 ? .95 : Math.max(0, .55 - (r - 230) / 480);
        if (!grove && R() < pHouse) {
          const n = 1 + (R() * 2.7 | 0), alongX = R() < .5, cuts = [0];
          for (let k = 1; k < n; k++) cuts.push(k / n + (R() - .5) * .18);
          cuts.push(1);
          for (let k = 0; k < n; k++) {
            const s = () => .25 + R() * .9;
            let a0 = x0, a1 = x0 + 12, b0 = z0, b1 = z0 + 12;
            if (alongX) { a0 = x0 + cuts[k] * 12; a1 = x0 + cuts[k + 1] * 12; } else { b0 = z0 + cuts[k] * 12; b1 = z0 + cuts[k + 1] * 12; }
            a0 += s(); a1 -= s(); b0 += s(); b1 -= s();
            if (a1 - a0 < 2.6 || b1 - b0 < 2.6) continue;
            let ok = true;
            for (const [px, pz] of [[a0, b0], [a1, b0], [a0, b1], [a1, b1], [(a0 + a1) / 2, b0], [(a0 + a1) / 2, b1], [a0, (b0 + b1) / 2], [a1, (b0 + b1) / 2], [(a0 + a1) / 2, (b0 + b1) / 2]]) if (clear(px, pz) < .5) { ok = false; break; }
            if (!ok) continue;
            const far = r > 260, tower = far && R() < .06;
            if (tower) { const cxx = (a0 + a1) / 2, czz = (b0 + b1) / 2; box(cxx - 2.6, cxx + 2.6, 0, 9 + R() * 3, czz - 2.6, czz + 2.6, clay(), { win: [[.4, .55, .6, .7]], beams: 1 }); continue; }
            const h = far ? 3.1 + R() * 1.2 : R() < .27 ? 6 + R() * 1.6 : 3.3 + R() * 1.5;
            const b = box(a0, a1, 0, h, b0, b1, clay(), { lit: R() < .22, beams: 1 });
            b.win = Array.from({ length: 1 + (R() * 2.4 | 0) }, () => { const u = .12 + R() * .62, v = .42 + R() * .3; return [u, v, u + .07 + R() * .06, v + .1 + R() * .08]; });
            if (R() < .7) b.door = .12 + R() * .62;
            if (R() < .18 && a1 - a0 > 4.5) { const wx = (a1 - a0) * (.35 + R() * .2), wz = (b1 - b0) * (.35 + R() * .2), kx = R() < .5, kz = R() < .5; box(kx ? a0 : a1 - wx, kx ? a0 + wx : a1, h, h + 2.4, kz ? b0 : b1 - wz, kz ? b0 + wz : b1, b.alb, { up: 1 }); }
          }
        } else if (r > 100) {
          gardens.push([x0, x0 + 12, z0, z0 + 12, R()]);
          const n = 1 + (R() * 2.6 | 0);
          for (let k = 0; k < n; k++) { const x = x0 + 1 + R() * 10, z = z0 + 1 + R() * 10; if (clear(x, z) > 1.2) palms.push([x, z, 7 + R() * 7, (R() - .5) * .16, R() * TAU]); }
        }
      }
      // gardens merged into runs along each row of cells
      gardens.sort((m, n) => m[2] - n[2] || m[0] - n[0]);
      const runs = [];
      gardens.forEach((g) => { const l = runs[runs.length - 1]; if (l && l[2] === g[2] && Math.abs(l[1] - g[0]) < .01 && l[1] - l[0] < 60) l[1] = g[1]; else runs.push(g.slice()); });
      st.boxes = boxes; st.palms = palms; st.gardens = runs;
      // which boxes throw shade onto open ground: the shade inside the packed blocks is left to the dark alleys
      const OG = new Uint8Array(500 * 500), og = (x, z) => { const i = Math.floor((x + 500) / 2), j = Math.floor((z + 500) / 2); return i < 0 || j < 0 || i >= 500 || j >= 500 ? 0 : OG[j * 500 + i]; };
      boxes.forEach((b) => { if (b.y0 > 0) return; for (let x = b.x0 + .5; x < b.x1; x += 1) for (let z = b.z0 + .5; z < b.z1; z += 1) { const i = Math.floor((x + 500) / 2), j = Math.floor((z + 500) / 2); if (i >= 0 && j >= 0 && i < 500 && j < 500) OG[j * 500 + i] = 1; } });
      const dsx = -SUNH[0], dsz = -SUNH[1];
      boxes.forEach((b) => {
        if (b.wall || b.col || b.slab || Math.hypot((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2) > 236) { b.casts = 1; return; }
        const L = Math.min(30, b.y1 * 6);
        for (let u = 0; u <= 1 && !b.casts; u += .25) for (const [x0, z0] of [[b.x1, mix(b.z0, b.z1, u)], [mix(b.x0, b.x1, u), b.z0]]) { let run = 0; for (let d = 1; d < L; d += 1.5) { run = og(x0 + dsx * d, z0 + dsz * d) ? 0 : run + 1; if (run >= 5) { b.casts = 1; break; } } }
      });
      // the open streets as strips, laid over the dark ground of the packed town
      st.laneStrips = st.lanes.map((L) => { const a = [], b = []; for (let i = 0; i < L.n; i += 2) { const w = L.hw + .7; a.push([L.X[i] + L.NX[i] * w, L.Z[i] + L.NZ[i] * w]); b.push([L.X[i] - L.NX[i] * w, L.Z[i] - L.NZ[i] * w]); } return a.concat(b.reverse()); });
      st.core = Array.from({ length: 72 }, (_, i) => { const a = i / 72 * TAU, r = 236 + 8 * Math.sin(a * 5); return [Math.cos(a) * r, Math.sin(a) * r / 1.08]; });
      // harra: black lava on both sides; ridges on the far horizon
      const blob = (cx, cz, rx, rz, seed, sc = 1) => { const rr = rng(seed); const ph = Array.from({ length: 6 }, () => rr() * 9); return Array.from({ length: 140 }, (_, i) => { const a = i / 140 * TAU, k = sc * (1 + .16 * Math.sin(a * 3 + ph[0]) + .09 * Math.sin(a * 7 + ph[1]) + .06 * Math.sin(a * 13 + ph[2]) + .04 * Math.sin(a * 29 + ph[3]) + .025 * Math.sin(a * 53 + ph[4]) + .015 * Math.sin(a * 97 + ph[5])); return [cx + Math.cos(a) * rx * k, cz + Math.sin(a) * rz * k]; }); };
      st.harra = [[-1500, 300, 900, 2200, 4], [1550, -200, 950, 2400, 5], [-950, -1500, 450, 520, 6], [1150, 1600, 560, 480, 7]].map(([a, b, c0, d, e]) => [blob(a, b, c0, d, e, 1.06), blob(a, b, c0, d, e, .97), blob(a + c0 * .1, b, c0 * .8, d * .8, e + 20, .9)]);
      // dry wadis with scrub: al-Aqiq to the west, Qanat to the north
      st.wadis = [[[-760, -2600], [-820, -1400], [-700, -500], [-860, 300], [-760, 1200], [-900, 2400], [-820, 3600]], [[2600, 980], [1500, 860], [700, 1000], [0, 900], [-700, 1060], [-1400, 980], [-2600, 1100]]].map((pts) => {
        const Rt = route(pts, 30), L = [], Rr = [], sc = [];
        for (let i = 0; i < Rt.n; i++) { const w = 26 + 12 * Math.sin(i * .37); L.push([Rt.X[i] + Rt.NX[i] * w, Rt.Z[i] + Rt.NZ[i] * w]); Rr.push([Rt.X[i] - Rt.NX[i] * w, Rt.Z[i] - Rt.NZ[i] * w]); if (i % 2 === 0) for (let k2 = 0; k2 < 3; k2++) { const l = (R() - .5) * 120; sc.push([Rt.X[i] + Rt.NX[i] * l + (R() - .5) * 30, Rt.Z[i] + Rt.NZ[i] * l + (R() - .5) * 30, 1.4 + R() * 2.4]); } }
        return { poly: L.concat(Rr.reverse()), scrub: sc };
      });
      const prof = (seed, x0, x1, base, amp, z) => { const rr = rng(seed), ph = [rr() * 9, rr() * 9, rr() * 9], out = []; for (let x = x0; x <= x1; x += (x1 - x0) / 120) { const n = .5 + .3 * Math.sin(x * .0011 + ph[0]) + .14 * Math.sin(x * .0037 + ph[1]) + .06 * Math.abs(Math.sin(x * .011 + ph[2])); out.push([x, base + amp * n * smooth(c01((x - x0) / 900)) * smooth(c01((x1 - x) / 900))]); } return { z, pts: out }; };
      st.ranges = [prof(11, -9000, 9000, 60, 260, -9000), prof(12, -6000, 6000, 40, 330, -7600), prof(13, -9000, 9000, 50, 420, 7800), prof(14, -4200, 3000, 30, 380, 5200), prof(15, -9000, -2500, 40, 220, 2600), prof(16, 2500, 9000, 40, 200, -2600)];
      st.sal = (() => { const out = []; for (let i = 0; i <= 40; i++) { const u = i / 40 * 2 - 1, h = 130 * Math.max(0, 1 - u * u) ** .7 * (1 + .12 * Math.sin(u * 9 + 1)); out.push([-640 + u * 300, h]); } return { z: 820, pts: out }; })();
      // clouds
      st.clouds = Array.from({ length: 14 }, () => [R() * 2 - 1, .1 + R() * .5, .2 + R() * .4, .012 + R() * .02, R()]);
      st.stars = Array.from({ length: 260 }, () => [R(), R() ** 1.4, R()]);
      // ----- the crowd -----
      const A = (T) => new T(N);
      st.li = A(Uint8Array); st.g0 = A(Float32Array); st.lat = A(Float32Array); st.a = A(Float32Array); st.din = A(Float32Array); st.dg = A(Float32Array);
      st.sx = A(Float32Array); st.sz = A(Float32Array); st.qe = A(Float32Array); st.ex = A(Float32Array); st.ez = A(Float32Array);
      st.ph = A(Float32Array); st.tone = A(Uint8Array); st.var = A(Uint8Array); st.wf = A(Float32Array); st.hgt = A(Float32Array); st.ds = A(Float32Array); st.inn = A(Uint8Array);
      st.X = A(Float32Array); st.Z = A(Float32Array); st.pose = A(Float32Array); st.sw = A(Float32Array); st.lit = A(Float32Array);
      const LW = st.lanes.map((L) => L.L);
      const tw = [.22, .27, .24, .17, .1];
      for (let i = 0; i < N; i++) {
        let li = 0, q = R() * LW.reduce((s, v) => s + v, 0);
        while (q > LW[li]) { q -= LW[li]; li++; }
        li = Math.min(li, st.lanes.length - 1);
        const L = st.lanes[li];
        st.li[i] = li; st.g0[i] = 3 + R() ** .8 * (L.L - 3);
        st.lat[i] = (R() + R() - 1) * L.hw * .9;
        st.a[i] = R() * .05;
        st.ph[i] = R() * TAU;
        let k = 0, w = R(); while (w > tw[k] && k < 4) { w -= tw[k]; k++; }
        st.tone[i] = k;
        st.hgt[i] = 1.62 + R() * .2;
        st.var[i] = R() < .45 ? 1 : R() < .3 ? 2 : 0; st.wf[i] = .86 + R() * .3;
        st.ds[i] = R() * .035;
      }
      // courtyard slots: a jittered lattice, denser near him, kept off the camera's own path down
      const slots = [];
      for (let x = -38; x <= 38; x += .62) for (let z = -15.4; z <= 29.6; z += .62) {
        const px = x + (R() - .5) * .45, pz = z + (R() - .5) * .45, rr = Math.hypot(px - ALI[0], pz - ALI[1]);
        if (rr < 1.75) continue;
        if (Math.hypot(px - 4, pz - 9.5) < 1.3 || Math.hypot(px - 3.2, pz - 6.9) < 1.3) continue;
        if (R() < .3 + .7 * Math.exp(-rr / 13)) slots.push([px, pz, rr]);
      }
      slots.sort((m, n) => m[2] - n[2]);
      const nin = Math.min(NIN, slots.length);
      // arrival order decides who gets in and how near; each takes the free slot cheapest from his own gate
      const arr = Array.from({ length: N }, (_, i) => i).sort((m, n) => (st.a[m] + st.g0[m] / V) - (st.a[n] + st.g0[n] / V));
      const byGate = GATES.map(([, , ix, iz]) => slots.slice(0, nin).map((s, j) => [s[2] + .32 * Math.hypot(s[0] - ix, s[1] - iz), j]).sort((m, n) => m[0] - n[0]).map((e) => e[1]));
      const ptr = [0, 0, 0], taken = new Uint8Array(nin), qrank = new Array(st.lanes.length).fill(0);
      arr.forEach((i, order) => {
        const L = st.lanes[st.li[i]], g = L.g, [ox, oz, ix, iz] = GATES[g];
        if (order < nin) {
          const lst = byGate[g]; while (taken[lst[ptr[g]]]) ptr[g]++;
          const j = lst[ptr[g]]; taken[j] = 1;
          st.inn[i] = 1; st.sx[i] = slots[j][0]; st.sz[i] = slots[j][1];
          st.dg[i] = Math.hypot(ix - ox, iz - oz); st.din[i] = st.dg[i] + Math.hypot(slots[j][0] - ix, slots[j][1] - iz);
        } else {
          st.inn[i] = 0; st.qe[i] = 2 + qrank[st.li[i]]++ * .2; st.din[i] = 0;
        }
      });
      // seats for the settling: rows of arcs round him, matched to the press slots by radius, then by bearing
      const seats = [];
      for (let k = 0; seats.length < nin && k < 60; k++) {
        const r0 = 2.5 + k * .92, n = Math.floor(TAU * r0 / .74);
        for (let j = 0; j < n; j++) { const a = j / n * TAU, x = ALI[0] + Math.cos(a) * r0, z = ALI[1] + Math.sin(a) * r0; if (x < -38 || x > 38 || z < -15.3 || z > 29.6) continue; if (Math.hypot(x - 4, z - 9.5) < 1.3 || Math.hypot(x - 3.2, z - 6.9) < 1.3) continue; seats.push([x, z, r0, a]); }
      }
      const ins = []; for (let i = 0; i < N; i++) if (st.inn[i]) ins.push(i);
      ins.sort((m, n) => Math.hypot(st.sx[m] - ALI[0], st.sz[m] - ALI[1]) - Math.hypot(st.sx[n] - ALI[0], st.sz[n] - ALI[1]));
      const ang = (x, z) => Math.atan2(z - ALI[1], x - ALI[0]);
      for (let s = 0; s < ins.length; s += 90) {
        const ci = ins.slice(s, s + 90).sort((m, n) => ang(st.sx[m], st.sz[m]) - ang(st.sx[n], st.sz[n]));
        const cs = seats.slice(s, s + 90).sort((m, n) => m[3] - n[3]);
        ci.forEach((i, k) => { const e = cs[Math.min(k, cs.length - 1)] || [st.sx[i], st.sz[i]]; st.ex[i] = e[0]; st.ez[i] = e[1]; });
      }
      // lanes light: how far each lane runs towards the sun decides how much of it is in sun
      st.laneSun = st.lanes.map((L) => { const a = new Float32Array(L.n); for (let k = 0; k < L.n; k++) { const dx = -L.NZ[k], dz = L.NX[k]; a[k] = Math.abs(dx * SUNH[0] + dz * SUNH[1]); } return a; });
      // buckets by distance
      st.NB = 260; st.head = new Int32Array(st.NB); st.next = new Int32Array(N + palms.length);
      st.fx = new Float32Array(N); st.fy = new Float32Array(N); st.fs = new Float32Array(N); st.fh = new Float32Array(N); st.fd = new Float32Array(N); st.fk = new Uint8Array(N);
      st.px = new Float32Array(palms.length); st.py = new Float32Array(palms.length); st.ps = new Float32Array(palms.length); st.pt = new Float32Array(palms.length * 2);
      st.order = new Int32Array(boxes.length); st.bd = new Float32Array(boxes.length);
    },

    frame(p, t, el, st) {
      fit(st.cv);
      let c = st.ctx; const W = st.cv.width, H = st.cv.height, k = W / Math.max(1, st.cv.clientWidth);
      const port = H > W * 1.1;
      // ---------- camera ----------
      const cam = spline(CAM, p);
      let ex = cam[0], ey = cam[1], ez = cam[2];
      const lx = cam[3], ly = cam[4], lz = cam[5];
      if (port) { // a tall screen: further back over the town, nearer for the dusk view of the mosque
        const back = mix(mix(1.3, 1.08, smooth(seg(p, .36, .44))), .62, smooth(seg(p, .56, .72)));
        const ax = ex + (lx - ex) * .25, ay = ey + (ly - ey) * .25, az = ez + (lz - ez) * .25; // pivot a quarter of the way to the look point
        ex = ax + (ex - ax) * back; ey = ay + (ey - ay) * back; ez = az + (ez - az) * back;
      }
      let fx = lx - ex, fy = ly - ey, fz = lz - ez; { const l = Math.hypot(fx, fy, fz); fx /= l; fy /= l; fz /= l; }
      let rx = fz, rz = -fx; { const l = Math.hypot(rx, rz); rx /= l; rz /= l; }
      const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx; // up = fw × right
      const F = port ? W * 1.32 : Math.min(H * 1.12, W * 1.1), cx = W / 2, cy = H * (port ? .5 : .5);
      const NEAR = .4;
      // camera-space helpers
      const CX = (x, y, z) => (x - ex) * rx + (z - ez) * rz;
      const CY = (x, y, z) => (x - ex) * ux + (y - ey) * uy + (z - ez) * uz;
      const CZ = (x, y, z) => (x - ex) * fx + (y - ey) * fy + (z - ez) * fz;
      const hzx = fx, hzz = fz, hl = Math.hypot(hzx, hzz) || 1;
      const hy = cy - F * ((hzx * ux + hzz * uz) / hl) / ((hzx * fx + hzz * fz) / hl); // the horizon row
      // ---------- light ----------
      const [sunEl, dusk, warmth] = keyv([[-.05, 15, 0, 0], [0, 15, 0, 0], [.3, 10, 0, .3], [.46, 6, .05, .75], [.58, 1.5, .35, 1], [.68, -2, .72, .7], [.8, -5, .92, .4], [1.05, -8, 1, .3]], p);
      const se = Math.sin(sunEl * Math.PI / 180), ce = Math.cos(sunEl * Math.PI / 180);
      const sdx = SUNH[0] * ce, sdy = se, sdz = SUNH[1] * ce;
      const sunI = c01((sunEl + .5) / 5);
      const sunC = mixc([1.3, 1.05, .78], [1.35, .82, .5], warmth).map((v) => v * sunI);
      const ambT = mixc([.36, .4, .52], [.12, .12, .2], dusk), ambW = mixc([.24, .27, .38], [.085, .085, .14], dusk);
      const fogC = mixc(mixc([206, 184, 152], [218, 168, 120], warmth * .6), [58, 52, 74], dusk);
      const fogL = mix(mix(2600, 1700, warmth), 1100, dusk);
      const fog = (d) => 1 - Math.exp(-d / fogL);
      // paths are filled in small chunks: one path with thousands of sub-paths is many times slower to build
      let chunkM = 0, chunkS = false;
      const open = (style, stroke) => { chunkM = 0; chunkS = stroke; if (stroke) c.strokeStyle = style; else c.fillStyle = style; c.beginPath(); };
      const sub = () => { if (++chunkM % 24 === 0) { if (chunkS) c.stroke(); else c.fill(); c.beginPath(); } };
      const done = () => { if (chunkM % 24) { if (chunkS) c.stroke(); else c.fill(); } };
      const NB = st.NB, LB = 28;
      const bucket = (d) => Math.max(0, Math.min(NB - 1, Math.floor(Math.log(Math.max(1, d)) * LB)));

      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      // ---------- sky ----------
      const sunScr = (() => { const z = sdx * fx + sdy * fy + sdz * fz; const x = sdx * rx + sdz * rz, y = sdx * ux + sdy * uy + sdz * uz; return z > .02 ? [cx + F * x / z, cy - F * y / z] : [cx + Math.sign(x) * W * 2, hy]; })();
      if (hy > 0) {
        const top = mixc([58, 96, 150], [12, 16, 36], dusk), mid = mixc(mixc([132, 158, 184], [190, 164, 140], warmth * .5), [44, 44, 78], dusk), hor = mixc(mixc([234, 210, 172], [240, 180, 122], warmth * .7), [120, 84, 92], dusk);
        const sg = c.createLinearGradient(0, Math.min(0, hy - H * .6), 0, hy);
        sg.addColorStop(0, rgb(top)); sg.addColorStop(.62, rgb(mid)); sg.addColorStop(1, rgb(hor));
        c.fillStyle = sg; c.fillRect(0, 0, W, hy + 2);
        // the sun's side of the sky: gold by day, then the long red afterglow
        const sx = Math.max(-W, Math.min(W * 2, sunScr[0])), syy = Math.min(hy, sunScr[1]);
        const gR = W * mix(.8, 1.15, dusk);
        const g = c.createRadialGradient(sx, Math.max(syy, hy - H * .05), 0, sx, Math.max(syy, hy - H * .05), gR);
        const gc = mixc([255, 214, 150], [236, 110, 64], dusk);
        const ga = mix(.45, .62, warmth) * (1 - .55 * c01((dusk - .6) / .4));
        g.addColorStop(0, rgb(gc, ga)); g.addColorStop(.3, rgb(mixc(gc, [160, 70, 80], dusk * .6), ga * .4)); g.addColorStop(1, rgb(gc, 0));
        c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, 0, W, hy + 2); c.globalCompositeOperation = 'source-over';
        // high streaks of cloud catching the light
        const cl = mixc(mixc([255, 240, 214], [255, 170, 120], warmth), [150, 90, 110], dusk);
        st.clouds.forEach(([u, v, w, h, a]) => {
          const xx = (((u * 1.4 - Math.atan2(fx, fz) * .6 + t * .0004) % 2.8) + 2.8) % 2.8 - .9, X0 = xx * W, Y0 = hy - v * Math.max(H * .3, hy);
          if (Y0 < -H * .2) return;
          c.save(); c.translate(X0, Y0); c.scale(w * W, h * H);
          const gg = c.createRadialGradient(0, 0, 0, 0, 0, 1);
          gg.addColorStop(0, rgb(cl, (.12 + .2 * a) * (1 - .4 * dusk))); gg.addColorStop(1, rgb(cl, 0));
          c.fillStyle = gg; c.fillRect(-1, -1, 2, 2); c.restore();
        });
        const starA = c01((dusk - .7) / .3);
        if (starA > 0) { c.fillStyle = '#efe8d6'; st.stars.forEach(([x, y, b]) => { const Y0 = y * hy * .8; c.globalAlpha = starA * (.2 + .6 * b) * (.75 + .25 * Math.sin(t * 2 + b * 30)) * c01((hy - Y0) / (H * .3)); c.fillRect(x * W, Y0, b > .85 ? 1.6 * k : k, b > .85 ? 1.6 * k : k); }); c.globalAlpha = 1; }
      }
      // ---------- ground ----------
      const g0 = Math.max(0, hy);
      const groundNear = mixc(mixc([168, 136, 96], [182, 132, 86], warmth * .5), [42, 38, 46], dusk);
      const gg = c.createLinearGradient(0, g0, 0, H);
      gg.addColorStop(0, rgb(fogC)); gg.addColorStop(Math.min(1, .12 * (H / Math.max(1, H - g0))), rgb(mixc(groundNear, fogC, .55))); gg.addColorStop(1, rgb(groundNear));
      c.fillStyle = gg; c.fillRect(0, g0, W, H - g0);
      // mountains: far ranges first, then Sal' near the town
      const PX = (x, y, z) => { const zc = CZ(x, y, z); return [cx + F * CX(x, y, z) / zc, cy - F * CY(x, y, z) / zc, zc]; };
      const ridge = (rd, col) => { // the visible runs of a profile, each closed down to its own foot
        c.beginPath();
        let run = [];
        const close = () => {
          if (run.length > 1 && run.some(([x]) => x > -60 && x < W + 60)) {
            c.moveTo(run[0][0], run[0][2]); run.forEach(([x, y]) => c.lineTo(x, y)); for (let i = run.length - 1; i >= 0; i--) c.lineTo(run[i][0], run[i][2]); c.closePath();
          }
          run = [];
        };
        for (const [x, h] of rd.pts) { const q = PX(x, h, rd.z), b = PX(x, 0, rd.z); if (q[2] < 20) { close(); continue; } run.push([q[0], q[1], b[1] + 2]); }
        close();
        c.fillStyle = col; c.fill();
      };
      const mtnBase = mixc(mixc([120, 96, 84], [150, 96, 72], warmth), [40, 34, 52], dusk);
      st.ranges.map((rd) => [Math.hypot(ex - 0, ez - rd.z), rd]).sort((m, n) => n[0] - m[0]).forEach(([d, rd]) => ridge(rd, rgb(mixc(mtnBase, fogC, Math.min(.85, fog(d) * 1.05)))));
      // ---------- ground polygons (clipped at the near plane) ----------
      const SB = st.SB || (st.SB = new Float64Array(3 * 600)), IB = st.IB || (st.IB = new Float64Array(3 * 600));
      const polyIB = (n) => { // IB holds n world points x y z; adds the projected polygon to the current path
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
      const poly = (pts, y = 0) => { const n = Math.min(600, pts.length); for (let i = 0; i < n; i++) { IB[i * 3] = pts[i][0]; IB[i * 3 + 1] = y; IB[i * 3 + 2] = pts[i][1]; } return polyIB(n); };
      const rectG = (x0, x1, z0, z1, y = 0) => { IB[0] = x0; IB[1] = y; IB[2] = z0; IB[3] = x1; IB[4] = y; IB[5] = z0; IB[6] = x1; IB[7] = y; IB[8] = z1; IB[9] = x0; IB[10] = y; IB[11] = z1; return polyIB(4); };
      // dry wadis: a paler bed, scrub along it
      st.wadis.forEach((w) => { c.beginPath(); poly(w.poly); c.fillStyle = rgb(mixc(mixc(groundNear, [236, 222, 196], .22), fogC, .45)); c.fill(); });
      open(rgb(mixc(mixc([74, 78, 48], [30, 32, 30], dusk), fogC, .4)), false);
      st.wadis.forEach((w) => w.scrub.forEach(([x, z, r]) => { const zc = CZ(x, 0, z); if (zc < 30) return; const X0 = cx + F * CX(x, 0, z) / zc; if (X0 < -20 || X0 > W + 20) return; const Y0 = cy - F * CY(x, 0, z) / zc, rr = Math.max(.7 * k, r * F / zc); c.moveTo(X0 + rr, Y0); c.ellipse(X0, Y0, rr, rr * .45, 0, 0, TAU); sub(); }));
      done();
      // harra: black lava, its edges broken into the sand
      [[64, 56, 50, .3], [44, 38, 36, .34], [30, 27, 27, .38]].forEach(([r0, g0b, b0, f0], j) => {
        c.beginPath(); st.harra.forEach((h) => poly(h[j])); c.fillStyle = rgb(mixc(mixc([r0, g0b, b0], [r0 * 1.3, g0b * 1.1, b0 * .9], warmth * sunI), fogC, f0)); c.fill();
      });
      if (!st.basalt) { // a tile of broken basalt: dark grains, lighter sand caught between them
        const T = mk(192, 192), g = T.getContext('2d'), rr = rng(71);
        for (let i = 0; i < 2600; i++) { const v = rr(); g.fillStyle = v < .6 ? `rgba(12,10,10,${.25 + rr() * .35})` : `rgba(190,160,120,${.06 + rr() * .1})`; g.beginPath(); g.ellipse(rr() * 192, rr() * 192, 1 + rr() * 5, .6 + rr() * 2, 0, 0, TAU); g.fill(); }
        st.basalt = T;
      }
      { const pat = c.createPattern(st.basalt, 'repeat'), zc = Math.max(300, CZ(0, 0, 900)), sc = Math.max(.25, F * 6 / zc / 40);
        pat.setTransform(new DOMMatrix([sc, 0, 0, sc * .32, cx - F * CX(0, 0, 0) / zc * 0, hy]));
        c.globalAlpha = (1 - dusk * .7) * .9; c.fillStyle = pat; c.beginPath(); st.harra.forEach((h) => poly(h[1])); c.fill(); c.globalAlpha = 1; }
      // gardens under the palms
      [[104, 104, 62], [112, 108, 66], [98, 100, 60]].forEach((col, j) => {
        open(rgb(mixc(mixc(col, [30, 32, 30], dusk * .7), fogC, .16)), false); st.gardens.forEach(([a, b, z0, z1, q]) => { if ((q * 3 | 0) === j && rectG(a, b, z0, z1)) sub(); }); done();
      });
      // the packed town: alleys in their own shade, the streets open to the sky
      c.beginPath(); poly(st.core); c.fillStyle = rgb(mixc(mixc(groundNear, [40, 36, 56], .42 + .2 * (1 - dusk)), fogC, .12)); c.fill();
      c.beginPath(); st.laneStrips.forEach((l) => poly(l)); c.fillStyle = rgb(mixc(groundNear, fogC, .1)); c.fill();
      // the open ground round the mosque, the courtyard, the shade under the hall
      const lt = (alb, n = 1) => [tone(alb[0] * (ambT[0] + sunC[0] * se * n)), tone(alb[1] * (ambT[1] + sunC[1] * se * n)), tone(alb[2] * (ambT[2] + sunC[2] * se * n))];
      c.beginPath(); rectG(-56, 56, -50, 50); c.fillStyle = rgb(mixc(lt([.7, .6, .46], 2.2), fogC, .1)); c.fill();
      c.beginPath(); rectG(-39, 39, -34, 34); c.fillStyle = rgb(mixc(lt([.8, .72, .58], 2.4), fogC, .08)); c.fill();
      c.beginPath(); rectG(-39, 39, -34, -16); rectG(-39, 39, 30.2, 34); c.fillStyle = rgb(mixc(mixc(lt([.5, .44, .36], 0), [14, 11, 10], .72), fogC, .08)); c.fill();
      // pebbles in the courtyard when close
      if (ey < 40) {
        const rr = rng(9);
        c.fillStyle = rgb(mixc(lt([.6, .52, .4], 2), [0, 0, 0], .1), .5); c.beginPath();
        for (let i = 0; i < 1400; i++) { const x = -38 + rr() * 76, z = -15 + rr() * 45, zc = CZ(x, 0, z); if (zc < 1.5 || zc > 60) continue; const s = Math.max(1, .05 * F / zc); c.rect(cx + F * CX(x, 0, z) / zc, cy - F * CY(x, 0, z) / zc, s * 1.6, s); }
        c.fill();
      }
      // his light on the ground
      const pressA = smooth(seg(p, .33, .43)) * (1 - smooth(seg(p, .5, .58)));
      const settle = (i) => ease.io(seg(p, .54 + st.ds[i], .64 + st.ds[i]));
      const aliI = .55 + .45 * dusk;
      const groundPool = (x, z, R, img, a) => {
        const zc = CZ(x, 0, z); if (zc < 1 || a <= .01) return;
        const X0 = cx + F * CX(x, 0, z) / zc, Y0 = cy - F * CY(x, 0, z) / zc;
        const zf = CZ(x, 0, z + R), zn = CZ(x, 0, z - R);
        const yf = zf > NEAR ? cy - F * CY(x, 0, z + R) / zf : Y0 - R * F / zc, yn = zn > NEAR ? cy - F * CY(x, 0, z - R) / zn : Y0 + R * F / zc;
        const rx2 = R * F / zc, ry2 = Math.max(2, Math.abs(yn - yf) / 2);
        c.globalAlpha = Math.min(1, a); c.drawImage(img, X0 - rx2, Math.min(yf, yn), rx2 * 2, ry2 * 2); c.globalAlpha = 1;
      };
      c.globalCompositeOperation = 'lighter';
      groundPool(ALI[0], ALI[1], 9 + 17 * dusk, st.warm, .22 * aliI + .3 * dusk);
      groundPool(ALI[0], ALI[1], 4, st.pale, .25 * aliI);
      c.globalCompositeOperation = 'source-over';

      // ---------- the crowd: positions ----------
      const { X, Z, pose: PO, sw: SW, lit: LIT } = st;
      const jig = pressA;
      for (let i = 0; i < N; i++) {
        const L = st.lanes[st.li[i]], g = L.g, [ox, oz, ix, iz] = GATES[g];
        const D0 = st.g0[i] + st.din[i];
        let D = D0 - V * Math.max(0, p - st.a[i]);
        let x, z, lat = st.lat[i], sun = 0, ps = 0;
        const moving = D > (st.inn[i] ? 0 : st.qe[i] + st.din[i]);
        if (!st.inn[i]) D = Math.max(st.qe[i], D); else D = Math.max(0, D);
        if (D > st.din[i]) { // in the lane
          const gg2 = D - st.din[i], f = gg2 / L.ds, j = Math.min(L.n - 2, Math.floor(f)), u = f - j;
          const la = lat + .35 * Math.sin(gg2 * .05 + st.ph[i]);
          x = mix(L.X[j], L.X[j + 1], u) + L.NX[j] * la; z = mix(L.Z[j], L.Z[j + 1], u) + L.NZ[j] * la;
          sun = L.g === 0 && j < 20 ? .6 : st.laneSun[st.li[i]][j] ** 3 > hash(i) ? 1 : .15;
          if (!st.inn[i] && jig > 0) { x += jig * .25 * Math.sin(p * 210 + st.ph[i] * 3); z += jig * .25 * Math.sin(p * 170 + st.ph[i] * 5); }
        } else { // through the gate, then to the slot
          const s = st.din[i] - D, dg = st.dg[i];
          if (s < dg) { const f = s / dg; x = mix(ox, ix, f) + (g ? 0 : lat * .4); z = mix(oz, iz, f) + (g ? lat * .4 : 0); } else {
            const f = (s - dg) / Math.max(.01, st.din[i] - dg), w = f * f * (3 - 2 * f) * .35 + f * .65;
            x = mix(ix, st.sx[i], w); z = mix(iz, st.sz[i], w);
          }
          if (D <= 0) {
            // the press: everyone leans in on him, in surges
            const dx = x - ALI[0], dz = z - ALI[1], r = Math.hypot(dx, dz) || 1;
            if (jig > 0) {
              const pull = jig * (1.25 * (1 - Math.exp(-r / 4.5)) + .25), wave = jig * .42 * Math.sin(r * 1.25 - p * 260 + st.ph[i] * .7);
              const tng = jig * .3 * Math.sin(p * 190 + st.ph[i] * 4);
              const rr = r - pull + wave;
              x = ALI[0] + dx / r * rr - dz / r * tng; z = ALI[1] + dz / r * rr + dx / r * tng;
            }
            const sv = settle(i);
            if (sv > 0) { x = mix(x, st.ex[i], sv); z = mix(z, st.ez[i], sv); ps = smooth(seg(sv, .55, 1)); }
          }
          // sun in the courtyard unless a wall stands between
          sun = 1;
          if (sdx < 0) { const tt = (x + 39.5) / -sdx; if (1.5 + sdy * tt < WH && z + sdz * tt < 35) sun = .15; }
          if (sun > .5 && sdz > 0) { const tt = (34.5 - z) / sdz; if (1.5 + sdy * tt < WH && x + sdx * tt > -40) sun = .15; }
        }
        X[i] = x; Z[i] = z; PO[i] = ps; LIT[i] = sun;
        SW[i] = moving ? .02 * Math.sin((D0 - D) * 2 + st.ph[i]) : 0;
      }

      // ---------- shadows on the ground: one union path ----------
      const sh = sunI * (1 - dusk);
      if (sh > .02) {
        const ox2 = -sdx / Math.max(.03, sdy), oz2 = -sdz / Math.max(.03, sdy);
        const SL = st.shl || (st.shl = mk(8, 8)), main = c, SW2 = Math.max(8, Math.round(W / 2)), SH2 = Math.max(8, Math.round(H / 2));
        if (SL.width !== SW2 || SL.height !== SH2) { SL.width = SW2; SL.height = SH2; }
        c = SL.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, SW2, SH2); c.setTransform(SW2 / W, 0, 0, SH2 / H, 0, 0);
        open(rgb(mixc([34, 38, 66], [60, 44, 70], warmth)), false);
        // the sun stands in the west-north-west, so every shadow runs east-south-east: the union of a box's foot and its
        // foot moved by the shadow vector is the hexagon below
        const ol = Math.hypot(ox2, oz2);
        const hex = (x0, x1, z0, z1, sx, sz) => {
          const v = [x0, z1, x0, z0, x0 + sx, z0 + sz, x1 + sx, z0 + sz, x1 + sx, z1 + sz, x1, z1];
          for (let i = 0; i < 6; i++) { IB[i * 3] = v[i * 2]; IB[i * 3 + 1] = 0; IB[i * 3 + 2] = v[i * 2 + 1]; }
          polyIB(6);
        };
        for (const b of st.boxes) {
          if (!b.casts || (b.col && b.row > 0)) continue;
          const mx = (b.x0 + b.x1) / 2, mz = (b.z0 + b.z1) / 2, zc = CZ(mx, 0, mz); if (zc < -60) continue;
          const L = Math.min(b.y1 * 7, b.y1 * ol), sx = ox2 / ol * L, sz = oz2 / ol * L;
          const ze = CZ(mx + sx, 0, mz + sz);
          if (zc < NEAR && ze < NEAR) continue;
          if (zc > 0) { if (F * L / zc < 1.5 * k) continue; const X0 = cx + F * CX(mx, 0, mz) / zc, R0 = F * (L + 12) / zc; if (X0 < -R0 || X0 > W + R0) continue; const Y0 = cy - F * CY(mx, 0, mz) / zc; if (Y0 < -R0 || Y0 > H + R0) continue; }
          hex(b.x0, b.x1, b.z0, b.z1, sx, sz); sub();
        }
        if (ey > 3.2 && ey < 26) for (let i = 0; i < N; i++) { // people's long shadows, seen from above
          if (LIT[i] < .5) continue;
          const x = X[i], z = Z[i]; if (Math.abs(x - ex) + Math.abs(z - ez) > 75) continue;
          const h = st.hgt[i] * (1 - .45 * PO[i]), L = Math.min(9, h / Math.max(.05, sdy) * ce), w = .2, a = SUNH[0], b2 = SUNH[1];
          IB[0] = x - w * b2; IB[1] = 0; IB[2] = z + w * a; IB[3] = x + w * b2; IB[4] = 0; IB[5] = z - w * a;
          IB[6] = x + w * .5 * b2 - a * L; IB[7] = 0; IB[8] = z - w * .5 * a - b2 * L; IB[9] = x - w * .5 * b2 - a * L; IB[10] = 0; IB[11] = z + w * .5 * a - b2 * L;
          polyIB(4); sub();
        }
        done();
        c = main; c.globalAlpha = .5 * sh; c.drawImage(SL, 0, 0, W, H); c.globalAlpha = 1;
      }

      // ---------- project the crowd and the palms into distance buckets ----------
      const head = st.head; head.fill(-1);
      const next = st.next;
      const { fx: FX, fy: FY, fs: FSz, fh: FH, fd: FD, fk: FK } = st;
      for (let i = 0; i < N; i++) {
        const x = X[i], z = Z[i], zc = CZ(x, 0, z);
        if (zc < .9) continue;
        const h = st.hgt[i] * (1 - .45 * PO[i]);
        const sxp = cx + F * CX(x, 0, z) / zc, syp = cy - F * CY(x, 0, z) / zc;
        const s = F / zc;
        if (sxp < -s || sxp > W + s || syp < -2 || syp - s * 2 > H) continue;
        const zt = CZ(x, h, z), yt = cy - F * CY(x, h, z) / Math.max(.1, zt);
        FX[i] = sxp; FY[i] = syp; FSz[i] = s * h; FH[i] = Math.max(syp - yt, .55 * s * h * .5);
        const d = Math.hypot(x - ex, ey, z - ez); FD[i] = d;
        const r = Math.hypot(x - ALI[0], z - ALI[1]);
        FK[i] = st.tone[i] * 2 + (LIT[i] > .5 ? 1 : 0);
        const b = bucket(d); next[i] = head[b]; head[b] = i;
        if (r < 9 + 12 * dusk) FK[i] |= r < 4.5 + 4 * dusk ? 32 : 16;
      }
      const palms = st.palms, NP = palms.length;
      for (let j = 0; j < NP; j++) {
        const [x, z, h] = palms[j], zc = CZ(x, 0, z);
        if (zc < 2) continue;
        const s = F / zc, X0 = cx + F * CX(x, 0, z) / zc;
        if (X0 < -5 * s || X0 > W + 5 * s) continue;
        const Y0 = cy - F * CY(x, 0, z) / zc;
        if (Y0 < -2 || Y0 - (h + 4) * s > H) continue;
        st.px[j] = X0; st.py[j] = Y0; st.ps[j] = s;
        const tx = x + palms[j][3] * h, zt = CZ(tx, h, z);
        st.pt[j * 2] = cx + F * CX(tx, h, z) / zt; st.pt[j * 2 + 1] = cy - F * CY(tx, h, z) / zt;
        const d = Math.hypot(x - ex, ey - h * .5, z - ez), b = bucket(d);
        next[N + j] = head[b]; head[b] = N + j;
      }

      // ---------- colours shared by the drawing passes ----------
      const figCol = (tn, li2, d) => {
        const a = TONES[tn], s = li2 ? .85 : 0;
        return mixc([tone(a[0] * (ambW[0] + sunC[0] * s)), tone(a[1] * (ambW[1] + sunC[1] * s)), tone(a[2] * (ambW[2] + sunC[2] * s))], fogC, fog(d));
      };
      const rimCol = (d) => mixc(mixc([255, 214, 160], [255, 180, 110], warmth).map((v) => v * Math.min(1, sunI * 1.2)), fogC, fog(d));
      const aliCol = [255, 206, 140];
      const sunSide = Math.sign(sunScr[0] - cx) || 1;
      const aliScr = (() => { const zc = CZ(ALI[0], 1.5, ALI[1]); return zc > .5 ? cx + F * CX(ALI[0], 1.5, ALI[1]) / zc : cx; })();
      const flush = (b) => {
        const i = head[b]; if (i < 0) return;
        const dB = Math.exp((b + .5) / LB), fogB = fog(dB);
        // palms first: they stand on the ground among the houses
        const near = [];
        let any = false;
        for (let q = i; q >= 0; q = next[q]) if (q >= N) { any = true; const j = q - N; if (st.ps[j] * 3.2 > 26) near.push(j); }
        if (any) {
          const trunk = mixc(mixc([52, 40, 30], [26, 22, 22], dusk), fogC, fogB), crown = mixc(mixc(mixc([58, 70, 40], [96, 92, 52], sunI * .7), [22, 26, 24], dusk), fogC, fogB);
          c.lineWidth = Math.max(1, .3 * F / dB); c.lineCap = 'round';
          open(rgb(trunk), true);
          for (let q = i; q >= 0; q = next[q]) if (q >= N) { const j = q - N; if (st.ps[j] * 3.2 > 26) continue; c.moveTo(st.px[j], st.py[j]); c.lineTo(st.pt[j * 2], st.pt[j * 2 + 1]); sub(); }
          done();
          // crowns: drooping fronds, the ones on the sun's side lit
          const fronds = (lit) => {
            for (let q = i; q >= 0; q = next[q]) if (q >= N) {
              const j = q - N, s = st.ps[j]; if (s * 3.2 > 26) continue;
              const X0 = st.pt[j * 2], Y0 = st.pt[j * 2 + 1], ph = palms[j][4], l = Math.max(2 * k, 3.1 * s), far = l < 9 * k;
              for (let f = 0; f < (far ? 5 : 7); f++) {
                const a = ph + f * (far ? 1.257 : .898), ca = Math.cos(a);
                if (lit !== (Math.sign(ca) === sunSide && Math.abs(ca) > .25)) continue;
                const dx = ca * l, dy = Math.sin(a) * l * .3 + l * (.42 + .25 * Math.abs(ca));
                c.moveTo(X0, Y0);
                if (far) { c.lineTo(X0 + dx * .6, Y0 - l * .12); c.lineTo(X0 + dx, Y0 + dy * .7); } else c.quadraticCurveTo(X0 + dx * .55, Y0 - l * .32, X0 + dx, Y0 + dy * .7);
              }
              sub();
            }
          };
          c.lineWidth = Math.max(1, .42 * F / dB);
          open(rgb(crown), true); fronds(false); done();
          open(sunI > .05 ? rgb(mixc(mixc(mixc([120, 126, 66], [176, 146, 70], warmth), crown, 1 - sunI), fogC, fogB)) : rgb(crown), true); fronds(true); done();
          near.forEach((j) => palmNear(j, fogB));
        }
        // people, by distance: a dot, a body and a head, the silhouette, then the silhouette with its rims and feet
        const hpx = F / dB * 1.7;
        c.globalAlpha = c01((dB - 1.9) / 1.6);
        if (c.globalAlpha <= 0) { c.globalAlpha = 1; return; }
        const each = (sel, fn) => { for (let q = i; q >= 0; q = next[q]) if (q < N && sel(q)) { fn(q); sub(); } };
        const fig = (dx = 0, dy = 0) => (q) => addFig(c, FX[q] + dx * FSz[q], FY[q] + dy * FH[q], FSz[q], FH[q], PO[q], SW[q], st.var[q], st.wf[q]);
        if (hpx < 3.2 * k) {
          for (let key2 = 0; key2 < 10; key2++) { open(rgb(figCol(key2 >> 1, key2 & 1, dB)), false); each((q) => (FK[q] & 15) === key2, (q) => { const w = Math.max(.9 * k, FSz[q] * .32), hh = Math.max(1.1 * k, FH[q]); c.rect(FX[q] - w / 2, FY[q] - hh, w, hh); }); done(); }
          c.globalAlpha = 1; return;
        }
        if (hpx < 9 * k) {
          for (let key2 = 0; key2 < 10; key2++) { open(rgb(figCol(key2 >> 1, key2 & 1, dB)), false); each((q) => (FK[q] & 15) === key2, (q) => { const w = FSz[q] * .34 * st.wf[q], hh = FH[q], x = FX[q], y = FY[q]; c.rect(x - w / 2, y - hh * .8, w, hh * .8); c.rect(x - w * .24, y - hh * .97, w * .48, hh * .2); }); done(); }
          c.globalAlpha = 1; return;
        }
        const full = hpx >= 40 * k;
        if (full) {
          open(rgb(mixc([26, 22, 26], fogC, fogB), .45), false);
          each(() => true, (q) => { const w = FSz[q] * .2 * st.wf[q] * (1 + .4 * PO[q]); c.moveTo(FX[q] + w, FY[q]); c.ellipse(FX[q], FY[q], w, w * .3, 0, 0, TAU); });
          done();
          if (sunI > .05) { open(rgb(rimCol(dB)), false); each((q) => FK[q] & 1, fig(sunSide * .017, -.006)); done(); }
          [[32, .95], [16, .5]].forEach(([bit, a]) => {
            open(rgb(mixc(aliCol, fogC, fogB * .5), a * mix(.55, 1, dusk) * mix(1, .8, pressA)), false);
            each((q) => FK[q] & bit, (q) => fig((Math.sign(aliScr - FX[q]) || 1) * .022, -.008)(q)); done();
          });
        }
        for (let key2 = 0; key2 < 10; key2++) { open(rgb(figCol(key2 >> 1, key2 & 1, dB)), false); each((q) => (FK[q] & 15) === key2, fig()); done(); }
        if (!full) [[32, .9], [16, .5]].forEach(([bit, a]) => { open(rgb(mixc(aliCol, fogC, fogB * .5), a * mix(.25, .55, dusk)), false); each((q) => FK[q] & bit, fig()); done(); });
        c.globalAlpha = 1;
      };
      function palmNear(j, fogB) {
        const [x, z, h, lean, ph] = palms[j], s = st.ps[j], X0 = st.px[j], Y0 = st.py[j], tx = st.pt[j * 2], ty = st.pt[j * 2 + 1];
        const trunk = mixc(mixc([60, 46, 34], [26, 22, 22], dusk), fogC, fogB);
        c.strokeStyle = rgb(trunk); c.lineCap = 'round';
        c.lineWidth = Math.max(1, .38 * s); c.beginPath(); c.moveTo(X0, Y0); c.quadraticCurveTo(X0 + (tx - X0) * .3, (Y0 + ty) / 2, tx, ty); c.stroke();
        const lit = mixc(mixc(mixc([70, 84, 46], [130, 120, 60], warmth * sunI), [24, 28, 26], dusk), fogC, fogB), dark = mixc(mixc([30, 40, 26], [16, 20, 20], dusk), fogC, fogB);
        for (let f = 0; f < 13; f++) {
          const a = f / 13 * TAU + ph + Math.sin(t * .7 + x) * .03, l = (3 + 1.1 * hash(j * 13 + f)) * s, dx = Math.cos(a) * l, dy = Math.sin(a) * l * .4 + l * .32 * Math.abs(Math.cos(a)) * .8;
          const side = Math.sign(dx) === sunSide;
          c.fillStyle = rgb(side && sunI > .05 ? lit : dark);
          const mx = tx + dx * .5, my = ty - l * .28 + dy * .3, w = .28 * s;
          c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(mx - w * Math.sin(a), my - w, tx + dx, ty + dy); c.quadraticCurveTo(mx + w * Math.sin(a), my + w * .6, tx, ty); c.fill();
        }
      }

      // ---------- buildings, far to near, with the buckets flushed in between ----------
      const boxes = st.boxes, nb = boxes.length, order = st.order, bd = st.bd;
      let cnt = 0;
      for (let q = 0; q < nb; q++) {
        const b = boxes[q];
        const dx = ex < b.x0 ? b.x0 - ex : ex > b.x1 ? ex - b.x1 : 0, dy = ey < b.y0 ? b.y0 - ey : ey > b.y1 ? ey - b.y1 : 0, dz = ez < b.z0 ? b.z0 - ez : ez > b.z1 ? ez - b.z1 : 0;
        const d = Math.hypot(dx, dy, dz);
        const mx2 = (b.x0 + b.x1) / 2, mz2 = (b.z0 + b.z1) / 2, zc = CZ(mx2, (b.y0 + b.y1) / 2, mz2);
        const ext = Math.max(b.x1 - b.x0, b.z1 - b.z0, b.y1 - b.y0);
        if (zc < -ext) continue;
        if (zc > ext) { const X0 = cx + F * CX(mx2, b.y1, mz2) / zc, s = F * ext / zc; if (X0 < -s || X0 > W + s) continue; const Y0 = cy - F * CY(mx2, b.y1, mz2) / zc; if (Y0 > H + s || Y0 < -s * 2) continue; }
        bd[q] = d; order[cnt++] = q;
      }
      const ord = Array.from(order.subarray(0, cnt)).sort((m, n) => bd[n] - bd[m]);
      const fill3 = (pts, col) => { c.beginPath(); if (!polyY(pts)) return; c.fillStyle = col; c.fill(); };
      function polyY(pts) { // pts: [[x, y, z], ...]
        for (let i = 0; i < pts.length; i++) { IB[i * 3] = pts[i][0]; IB[i * 3 + 1] = pts[i][1]; IB[i * 3 + 2] = pts[i][2]; }
        return polyIB(pts.length);
      }
      const shade = (alb, amb, n) => { const l = Math.max(0, n); return [tone(alb[0] * (amb[0] + sunC[0] * l)), tone(alb[1] * (amb[1] + sunC[1] * l)), tone(alb[2] * (amb[2] + sunC[2] * l))]; };
      const winLit = dusk;
      const col3 = (alb, amb, l, f, sc = 1) => { // a shaded, fogged colour as a string
        const r = tone(alb[0] * sc * (amb[0] + sunC[0] * l)), g = tone(alb[1] * sc * (amb[1] + sunC[1] * l)), bb = tone(alb[2] * sc * (amb[2] + sunC[2] * l));
        return `rgb(${(r + (fogC[0] - r) * f) | 0},${(g + (fogC[1] - g) * f) | 0},${(bb + (fogC[2] - bb) * f) | 0})`;
      };
      const quad = (a0, a1, a2, b0, b1, b2, c0, c1, c2, d0, d1, d2, style) => {
        IB[0] = a0; IB[1] = a1; IB[2] = a2; IB[3] = b0; IB[4] = b1; IB[5] = b2; IB[6] = c0; IB[7] = c1; IB[8] = c2; IB[9] = d0; IB[10] = d1; IB[11] = d2;
        c.beginPath(); if (polyIB(4)) { c.fillStyle = style; c.fill(); }
      };
      const ambIn = mixc(ambW, [0, 0, 0], .8), ambUnder = mixc(ambW, [0, 0, 0], .6);
      function drawBox(b, d) {
        const f = b.gc ? fog(Math.hypot(b.gc[0] - ex, b.gc[1] - ey, b.gc[2] - ez)) : fog(d);
        const { x0, x1, y0, y1, z0, z1, alb } = b;
        const near = d < 170, tinyB = F * Math.max(x1 - x0, z1 - z0) / Math.max(1, d) < 3 * k, e = b.piece ? .05 : 0;
        if (ey > y1) { // roof, with a sunken floor inside the parapet when near
          quad(x0 - e, y1, z0 - e, x1 + e, y1, z0 - e, x1 + e, y1, z1 + e, x0 - e, y1, z1 + e, col3(alb, ambT, sdy, f, 1.04));
          if (near && !b.col && !b.wall && (x1 - x0) * F / Math.max(1, d) > 16) quad(x0 + .3, y1, z0 + .3, x1 - .3, y1, z0 + .3, x1 - .3, y1, z1 - .3, x0 + .3, y1, z1 - .3, col3(alb, ambT, sdy, f, .84));
        }
        if (b.slab && ey < y0) quad(x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z1, col3(alb, ambUnder, 0, f));
        if (tinyB) return;
        const under = b.col && b.row > 0, inHall = b.wall && Math.abs((x0 + x1) / 2) < 39.6;
        const face = (lam, fzc) => (under || (inHall && fzc < -16.25 && fzc > -34.5) ? col3(alb, ambIn, 0, f) : col3(alb, ambW, lam > 0 ? lam : 0, f));
        if (!near || b.col || b.slab) { // plain faces
          if (ex < x0) quad(x0, y0, z1 + e, x0, y0, z0 - e, x0, y1, z0 - e, x0, y1, z1 + e, face(-sdx, (z0 + z1) / 2));
          if (ex > x1) quad(x1, y0, z0 - e, x1, y0, z1 + e, x1, y1, z1 + e, x1, y1, z0 - e, face(sdx, (z0 + z1) / 2));
          if (ez < z0) quad(x0 - e, y0, z0, x1 + e, y0, z0, x1 + e, y1, z0, x0 - e, y1, z0, face(-sdz, z0));
          if (ez > z1) quad(x1 + e, y0, z1, x0 - e, y0, z1, x0 - e, y1, z1, x1 + e, y1, z1, face(sdz, z1));
          return;
        }
        const fc = (col) => rgb(mixc(col, fogC, f));
        const faces = [];
        if (ex < x0) faces.push([[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]], -sdx, 'x', z1, z0, x0);
        if (ex > x1) faces.push([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], sdx, 'x', z0, z1, x1);
        if (ez < z0) faces.push([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], -sdz, 'z', x0, x1, z0);
        if (ez > z1) faces.push([[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]], sdz, 'z', x1, x0, z1);
        for (let q = 0; q < faces.length; q += 6) {
          const pts = faces[q], lam = faces[q + 1], ax = faces[q + 2], u0 = faces[q + 3], u1 = faces[q + 4], w0 = faces[q + 5];
          const fzc = (pts[0][2] + pts[2][2]) / 2;
          const inner = under || (inHall && fzc < -16.25 && fzc > -34.5);
          const col = inner ? shade(alb, ambIn, 0) : shade(alb, ambW, lam > 0 ? lam : 0);
          if (b.piece) pts.forEach((pt) => { if (ax === 'x') pt[2] += pt[2] === Math.min(u0, u1) ? -e : e; else pt[0] += pt[0] === Math.min(u0, u1) ? -e : e; });
          fill3(pts, fc(col));
          if (b.wall) continue;
          const at = (u, v) => (ax === 'x' ? [w0, mix(y0, y1, v), mix(u0, u1, u)] : [mix(u0, u1, u), mix(y0, y1, v), w0]);
          // the wall's foot in its own shade, the beam ends under the roof, windows and the door
          const sz2 = F / Math.max(1, d);
          if ((y1 - y0) * sz2 > 10) {
            fill3([at(0, 0), at(1, 0), at(1, .1), at(0, .1)], fc(mixc(col, [0, 0, 0], .18)));
            if (b.beams && (y1 - y0) * sz2 > 24 && Math.abs(u1 - u0) * sz2 > 30) {
              open(fc(mixc(col, [20, 14, 10], .6)), false); const nB = Math.floor(Math.abs(u1 - u0) / .9);
              for (let m = 1; m < nB; m++) if (polyY([at(m / nB - .03, .86), at(m / nB + .03, .86), at(m / nB + .03, .9), at(m / nB - .03, .9)])) sub();
              done();
            }
            const lw = b.lit && winLit > .05;
            if (b.win) b.win.forEach(([a0, v0, a1, v1]) => fill3([at(a0, v0), at(a1, v0), at(a1, v1), at(a0, v1)], lw ? rgb(mixc(mixc(col, [16, 12, 12], .8), [255, 168, 90], winLit * .9)) : fc(mixc(col, [14, 10, 10], .78))));
            if (b.door !== undefined) { const dw = Math.min(.18, 1 / Math.abs(u1 - u0)), dh = Math.min(.66, 2.1 / (y1 - y0)); fill3([at(b.door, 0), at(b.door + dw, 0), at(b.door + dw, dh), at(b.door, dh)], fc(mixc(col, [12, 9, 8], .8))); }
          }
        }
      }
      let bcur = NB - 1;
      for (const q of ord) {
        const bb = bucket(bd[q]);
        while (bcur > bb) flush(bcur--);
        drawBox(boxes[q], bd[q]);
      }
      while (bcur >= 0) flush(bcur--);

      // ---------- lights ----------
      const bc = st.bc, BW = Math.max(8, Math.round(W / 5)), BH = Math.max(8, Math.round(H / 5));
      if (st.bloom.width !== BW || st.bloom.height !== BH) { st.bloom.width = BW; st.bloom.height = BH; }
      bc.setTransform(1, 0, 0, 1, 0, 0); bc.globalCompositeOperation = 'source-over'; bc.clearRect(0, 0, BW, BH);
      bc.setTransform(BW / W, 0, 0, BH / H, 0, 0);
      c.globalCompositeOperation = 'lighter';
      const halo = (x, y, R2, img, a) => { if (a <= .01 || x + R2 < 0 || x - R2 > W || y + R2 < 0 || y - R2 > H) return; c.globalAlpha = Math.min(1, a); c.drawImage(img, x - R2, y - R2, R2 * 2, R2 * 2); c.globalAlpha = 1; };
      // lamps in the colonnade and windows at dusk
      const lampA = c01((dusk - .25) / .5);
      if (lampA > 0) {
        st.lamps.forEach(([x, y, z]) => {
          if (z < 0 ? !(ez > z && ey - y < 1.05 * (ez - z)) : !(ez < z && ey - y < .8 * (z - ez))) return;
          const zc = CZ(x, y, z); if (zc < 1) return; const X0 = cx + F * CX(x, y, z) / zc, Y0 = cy - F * CY(x, y, z) / zc, s = F / zc; const spread = c01((4 * s - 7 * k) / (10 * k)); if (spread <= 0) return;
          halo(X0, Y0, Math.max(2.2 * k, 1.6 * s), st.warm, .7 * lampA * spread); bc.fillStyle = `rgba(255,170,90,${.5 * lampA * spread})`; bc.fillRect(X0 - 4 * k, Y0 - 4 * k, 8 * k, 8 * k); });
        c.fillStyle = `rgba(255,170,90,${.6 * lampA})`; c.beginPath();
        for (const b of boxes) {
          if (!b.lit) continue;
          const y = (b.y1 + b.y0) * .45;
          const [x, z] = ex > b.x1 ? [b.x1, (b.z0 + b.z1) / 2] : ez < b.z0 ? [(b.x0 + b.x1) / 2, b.z0] : ex < b.x0 ? [b.x0, (b.z0 + b.z1) / 2] : [(b.x0 + b.x1) / 2, b.z1];
          const zc = CZ(x, y, z); if (zc < 20) continue;
          const s = Math.max(k, .5 * F / zc); c.rect(cx + F * CX(x, y, z) / zc - s / 2, cy - F * CY(x, y, z) / zc - s / 2, s, s);
        }
        c.fill();
      }
      // the three lights: his, and the two beside him, ringed
      const ringA = 1;
      const imams = IMAMS.map(([dx, dz], j) => {
        const jx = jig * (.32 * Math.sin(p * 230 + j * 2.1) + .18 * Math.sin(p * 97 + j)), jz = jig * (.26 * Math.sin(p * 170 + j * 4) + .2);
        return [ALI[0] + dx * (1 - .25 * jig) + jx, 1.22, ALI[1] + dz + jz];
      });
      const lights = [[ALI[0], 1.5, ALI[1], 1.35, 1], ...imams.map((q) => [q[0], q[1], q[2], .8, 0])];
      const breathe = 1 + .04 * Math.sin(t * 1.3);
      lights.forEach(([x, y, z, sz, main], j) => {
        const zc = CZ(x, y, z); if (zc < .6) return;
        const X0 = cx + F * CX(x, y, z) / zc, Y0 = cy - F * CY(x, y, z) / zc, s = F / zc;
        const r = Math.max(1.5 * k, .105 * s) * sz * breathe; // the core
        const inner = Math.max(r * 3.4, (main ? .5 : .3) * s * sz), outer = Math.min(H * .5, Math.max(r * mix(11, 18, dusk), 2.6 * s * sz) * mix(1, 1.35, dusk));
        halo(X0, Y0, outer, st.warm, (main ? .32 : .2) * mix(.85, 1.15, dusk));
        halo(X0, Y0, inner, st.pale, main ? .62 : .5);
        halo(X0, Y0, r * 2.2, st.glow, .95);
        bc.fillStyle = main ? 'rgba(255,226,170,.9)' : 'rgba(255,230,190,.65)'; bc.beginPath(); bc.arc(X0, Y0, r * 2.6, 0, TAU); bc.fill();
        if (!main) { // the ring that marks an Imam
          c.globalCompositeOperation = 'source-over';
          const rr2 = Math.max(5.5 * k, .44 * s);
          c.strokeStyle = 'rgba(40,26,12,.35)'; c.lineWidth = Math.max(2.4 * k, .05 * s);
          c.beginPath(); c.arc(X0, Y0, rr2, 0, TAU); c.stroke();
          c.strokeStyle = `rgba(250,226,156,${.95 * ringA})`; c.lineWidth = Math.max(1.1 * k, .02 * s);
          c.beginPath(); c.arc(X0, Y0, rr2, 0, TAU); c.stroke();
          c.strokeStyle = `rgba(243,217,143,${.2 * ringA})`; c.lineWidth = Math.max(3 * k, .09 * s);
          c.beginPath(); c.arc(X0, Y0, rr2, 0, TAU); c.stroke();
          c.globalCompositeOperation = 'lighter';
        }
      });
      // dust in the low sun over the moving crowd
      const dustA = sunI * (1 - dusk) * (.5 + .5 * jig) * (1 - smooth(seg(p, .5, .6)));
      if (dustA > .01) {
        for (let i = 0; i < N; i += 61) {
          const zz = CZ(X[i], 1.2, Z[i]); if (zz < 3) continue;
          const X0 = cx + F * CX(X[i], 1.2, Z[i]) / zz, Y0 = cy - F * CY(X[i], 1.2, Z[i]) / zz, R2 = Math.min(H * .1, 6 * F / zz);
          halo(X0, Y0, R2, st.dust, .08 * dustA);
        }
      }
      c.globalAlpha = .85; c.drawImage(st.bloom, 0, 0, W, H); c.globalAlpha = 1;
      // the low sun across the air
      if (sunI > .02) {
        const sx = Math.max(-W * .3, Math.min(W * 1.3, sunScr[0])), g = c.createRadialGradient(sx, hy, 0, sx, hy, W * .9);
        g.addColorStop(0, rgb([255, 200, 140], .14 * sunI * (1 - dusk))); g.addColorStop(1, 'rgba(255,200,140,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      }
      c.globalCompositeOperation = 'source-over';
      // grade: grain and vignette
      c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(st.noise, 'repeat'); c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      const vg = c.createRadialGradient(W * .5, H * .55, Math.min(W, H) * .3, W * .5, H * .55, Math.hypot(W, H) * .62);
      vg.addColorStop(0, 'rgba(10,9,12,0)'); vg.addColorStop(1, `rgba(10,9,12,${.55 + .15 * dusk})`);
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
    },
  };
})();
