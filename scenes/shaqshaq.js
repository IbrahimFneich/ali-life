// الشقشقية (Sermon 3): two places joined by one point of light.
// World A — a dim mud-brick room in Medina by day. A stone quern turns on its own (the scroll turns it) round a
// wooden axle that glows: «محلّ القطب من الرحى». A shaft of sun from a high window, flour dust in it. The camera
// pushes in on the axle, then pulls back while the flour rises and fills the air.
// World B — out of that dust, a towering granite massif at storm light; the glowing axle becomes the light on its
// summit at the same point of the screen. Torrents pour down its gullies onto the plain («ينحدر عنّي السيل»), a
// flock of birds climbs and falls back far short of the top («ولا يرقى إليّ الطير»). Then a long held shot: wind and
// dust, day and night turning five times while the years run from 11 to 35 AH, and the last quote over it.
// Both worlds: metres, x right, y up, z away from the camera; zero-pitch camera with a shift lens (as in mabit and
// kufa). Nobody is drawn; Ali is only the light at the axle and on the summit.
(() => {
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const tone = (x) => 255 * (1 - Math.exp(-1.1 * x));
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
    const c = document.createElement('canvas'); c.width = c.height = n;
    const g = c.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, n, n);
    return c;
  };
  const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const hull = (pts) => { // monotone chain on screen points
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of pts) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = pts.length - 1; i >= 0; i--) { const q = pts[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  };
  const CUT = .41; // the frame where the dust is thickest and one world gives way to the other

  // ======================= World A: the room =======================
  const RX = 2.3, RZ0 = -3.6, RZ1 = 1.7, RH = 2.85;
  const AXLE = [0, .29, 0];
  const WIN = { x0: -1.38, x1: -.92, y0: 1.62, y1: 2.04 };
  const DOOR = { x0: .88, x1: 1.62, y1: 1.86 };
  const SUN = norm3([.42, -.78, -.6]); // the way the sun's light travels: in through the window, down to the floor
  const CAMA = [ // [p, x, height, z, focal, axle screen x, axle screen y]
    [-.05, .5, 1.32, -2.95, 1, .4, .64], [0, .5, 1.32, -2.95, 1, .4, .64], [.1, .38, 1.12, -2.1, 1.02, .4, .63],
    [.22, .16, .82, -1.12, 1.06, .4, .61], [.29, .1, .74, -.92, 1.08, .4, .6], [.34, .2, 1.25, -1.9, 1, .41, .58],
    [.41, .32, 2.1, -3.15, .95, .42, .56], [.45, .36, 2.3, -3.4, .95, .42, .56],
  ];

  // ======================= World B: the mountain =======================
  const PX = 0, PZ = 5200;
  const GULLY = [ // [mean angle round the peak, bend, phase, depth]; -π/2 points straight at the camera
    [-2.28, .16, 1, 120], [-1.86, .1, 2.1, 80], [-1.42, .13, .4, 135], [-1.02, .11, 3, 90], [-.62, .15, 1.7, 115],
  ];
  // value noise and a ridged sum of it, for the granite
  const hsh = (i, j) => { let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const vn = (x, y) => {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hsh(i, j), b = hsh(i + 1, j), c = hsh(i, j + 1), d = hsh(i + 1, j + 1);
    return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
  };
  const ridged = (x, y, oct) => { let s = 0, amp = .55, w = 1; for (let o = 0; o < oct; o++) { let n = 1 - Math.abs(vn(x, y)); n *= n * w; w = Math.min(1, n * 1.8); s += n * amp; amp *= .5; x *= 2.07; y *= 2.07; } return s; };
  const hgt = (x, z) => {
    const dx = x - PX, dz = (z - PZ) * 1.12;
    const r = Math.sqrt(dx * dx + dz * dz) + 1e-6;
    const plain = 7 * Math.sin(x * .0042 + 1) * Math.sin(z * .0031) + 3 * Math.sin(x * .013 + z * .009) + 1.6 * Math.sin(x * .041 - z * .033);
    if (r > 7600) return plain;
    const th = Math.atan2(dz, dx);
    // a broad massif, a steep summit block, and spurs that run out from the top
    const wx = x + 420 * vn(x * .00031, z * .00031), wz = z + 420 * vn(x * .00031 + 9.1, z * .00031 + 4.3);
    const spur = ridged(th * 2.6 + 11, r * .00105 + vn(th * 3, r * .0004) * .5, 3);
    const crag = ridged(wx * .00072, wz * .00072, 4);
    const big = 880 * Math.exp(-((r / 2450) ** 1.8)), top = 1150 * Math.exp(-((r / 1080) ** 1.5));
    let h = big * (.62 + .55 * spur) + top * (.88 + .2 * crag) + Math.exp(-((r / 3400) ** 2)) * (170 * crag - 60) * (1 - .6 * Math.exp(-((r / 500) ** 2)));
    // a lower shoulder to the left and a far peak to the right, so the skyline is not a cone
    const d1 = Math.hypot(x + 1900, (z - 6100) * 1.2), d2 = Math.hypot(x - 2700, (z - 7300) * 1.1);
    h = Math.max(h, 1180 * Math.exp(-((d1 / 1100) ** 1.5)) * (.8 + .3 * crag), 940 * Math.exp(-((d2 / 1000) ** 1.5)) * (.8 + .35 * crag));
    for (const [a, b, ph, d] of GULLY) {
      let da = th - (a + b * Math.sin(r / 800 + ph));
      if (da > Math.PI) da -= TAU; else if (da < -Math.PI) da += TAU;
      const e = da * r / (45 + r * .05);
      if (e * e < 9) h -= d * Math.min(1, r / 380) * Math.exp(-r / 4200) * Math.exp(-e * e);
    }
    return h + plain;
  };
  const gullyAt = (g, r) => { // a point on the floor of gully g, r metres from the peak
    const [a, b, ph] = GULLY[g], th = a + b * Math.sin(r / 800 + ph);
    return [PX + Math.cos(th) * r, PZ + Math.sin(th) * r / 1.12];
  };
  const CAMB = [ // [p, x, height, z, focal, summit screen x, summit screen y]
    [CUT - .01, -60, 1700, 2350, 1, .42, .56], [CUT, -60, 1700, 2350, 1, .42, .56], [.44, -20, 1380, 1450, 1, .43, .42],
    [.49, 120, 330, 760, 1, .44, .2], [.55, 210, 42, 1080, 1, .44, .12], [.6, 205, 44, 1100, 1.02, .44, .12],
    [.66, 170, 55, 1030, 1, .45, .13], [.72, 110, 62, 880, .98, .45, .15], [.79, 0, 30, -1440, 1.04, .45, .38],
    [.9, 0, 28, -1490, 1.04, .45, .38], [1.05, 0, 27, -1530, 1.04, .45, .38],
  ];
  const ROWZ = (() => { // terrain rows, far to near: dense on the plain and the face, sparse behind the peak
    const z = [];
    for (let v = 30000; v > 12500; v -= 1500) z.push(v);
    for (let v = 12500; v > 7000; v -= 300) z.push(v);
    for (let v = 7000; v > 2000; v -= 45) z.push(v);
    for (let v = 2000; v > 600; v -= 32) z.push(v);
    for (let v = 600; v >= -1640; v -= 40) z.push(v);
    return z;
  })();
  const DX = 50, X0 = -32000;

  S.shaqshaq = {
    init(el, st) {
      st.cv = el.querySelector('canvas');
      st.ctx = st.cv.getContext('2d');
      st.axis = el.querySelector('.sq-axis');
      st.yr = el.querySelector('.sq-yr b');
      const r = rng(303);
      st.glow = sprite([[0, 'rgba(255,255,255,1)'], [.18, 'rgba(255,255,255,.55)'], [.45, 'rgba(255,255,255,.16)'], [1, 'rgba(255,255,255,0)']]);
      st.gold = sprite([[0, 'rgba(255,236,190,1)'], [.2, 'rgba(255,206,120,.55)'], [.55, 'rgba(230,160,70,.13)'], [1, 'rgba(220,140,60,0)']]);
      st.sun = sprite([[0, 'rgba(255,240,214,1)'], [.3, 'rgba(255,226,180,.5)'], [1, 'rgba(255,220,170,0)']]);
      st.puff = sprite([[0, 'rgba(255,255,255,.9)'], [.4, 'rgba(255,255,255,.55)'], [.75, 'rgba(255,255,255,.14)'], [1, 'rgba(255,255,255,0)']], 96);
      st.noise = document.createElement('canvas'); st.noise.width = st.noise.height = 160;
      { const g = st.noise.getContext('2d'), id = g.createImageData(160, 160); for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 20; } g.putImageData(id, 0, 0); }
      st.mottle = document.createElement('canvas'); st.mottle.width = st.mottle.height = 256; // plaster and packed earth
      { const g = st.mottle.getContext('2d'); for (let i = 0; i < 900; i++) { const x = r() * 256, y = r() * 256, q = 2 + r() ** 2 * 26; g.fillStyle = `rgba(${r() < .5 ? '0,0,0' : '255,240,220'},${(.025 + r() * .05).toFixed(3)})`; g.beginPath(); g.ellipse(x, y, q, q * (.5 + r() * .6), r() * 3, 0, TAU); g.fill(); } }
      st.thatch = document.createElement('canvas'); st.thatch.width = 256; st.thatch.height = 64;
      { const g = st.thatch.getContext('2d'); g.fillStyle = '#1c130c'; g.fillRect(0, 0, 256, 64); for (let i = 0; i < 260; i++) { const x = r() * 256, y = r() * 64, l = 20 + r() * 60, a = -.4 + r() * .8; g.strokeStyle = `rgba(${90 + r() * 50 | 0},${64 + r() * 30 | 0},${36 + r() * 20 | 0},${(.25 + r() * .4).toFixed(2)})`; g.lineWidth = .6 + r() * 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * .3); g.stroke(); } }
      st.tints = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = c.height = 96; return c; });
      st.cloud = (() => { // a cloud mass: many soft lobes, for the sky deck and the band on the slopes
        const c = document.createElement('canvas'); c.width = 256; c.height = 128;
        const g = c.getContext('2d');
        for (let i = 0; i < 46; i++) { const x = 40 + r() * 176, y = 50 + r() * 50 - (Math.abs(x - 128) < 60 ? 18 * r() : 0), q = 14 + r() * 30; g.globalAlpha = .18 + r() * .2; g.drawImage(st.puff, x - q, y - q, q * 2, q * 2); }
        return c;
      })();
      st.streak = (() => { // rain
        const c = document.createElement('canvas'); c.width = 128; c.height = 256;
        const g = c.getContext('2d'); g.strokeStyle = 'rgba(255,255,255,.5)';
        for (let i = 0; i < 160; i++) { const x = r() * 140, y = r() * 256, l = 20 + r() * 60; g.globalAlpha = .2 + r() * .5; g.lineWidth = .6 + r() * .8; g.beginPath(); g.moveTo(x, y); g.lineTo(x - l * .12, y + l); g.stroke(); }
        return c;
      })();
      // ---- World A ----
      st.marks = Array.from({ length: 220 }, () => [.06 + r() ** .7 * .18, r() * TAU, .004 + r() * .01, r() * TAU, r()]);
      st.grains = Array.from({ length: 46 }, () => [.055 + r() * .06, r() * TAU, r()]);
      st.motes = Array.from({ length: 300 }, () => [r(), r(), r() ** .8, r() * 9, .5 + r()]);
      st.dust = Array.from({ length: 140 }, () => [(r() - .5) * 1.6, r() ** 1.6 * .9, (r() - .5) * 1.4, r() * 9, .4 + r()]);
      st.fall = Array.from({ length: 70 }, () => [r() * TAU, r(), .6 + r() * .8]);
      st.chips = Array.from({ length: 12 }, () => [r() * TAU, .05 + r() * .12]);
      st.cracks = Array.from({ length: 7 }, () => { let x = -2 + r() * 4, y = .3 + r() * 2.2; const pts = [[x, y]]; for (let k = 0; k < 6; k++) { x += (r() - .5) * .22; y -= .05 + r() * .12; pts.push([x, y]); } return pts; });
      st.bricks = Array.from({ length: 5 }, () => [-2 + r() * 3.6, .25 + r() * 2.2, .3 + r() * .5, .18 + r() * .3]);
      // ---- World B: things that do not need the terrain grid ----
      st.stars = Array.from({ length: 700 }, () => [r() * 2 - 1, r() ** 1.3, .3 + r() ** 3 * 1.6, r() * 9]);
      st.ranges = [[16000, 34000, 520], [22000, 46000, 760], [31000, 64000, 980]].map(([z, ext, amp], li) => {
        const xs = [], hs = [], ph = [r() * 9, r() * 9, r() * 9];
        for (let x = -ext; x <= ext; x += ext / 90) {
          const n = .5 + .25 * Math.sin(x * .0004 + ph[0]) + .15 * Math.sin(x * .0011 + ph[1]) + .1 * Math.abs(Math.sin(x * .0029 + ph[2]));
          xs.push(x); hs.push(amp * n * (li === 0 ? .7 : 1));
        }
        return { z, xs, hs, li };
      });
      st.deck = Array.from({ length: 64 }, (_, i) => ({ x: (r() - .5) * 36000, y: 2600 + r() * 2600, z: 9000 + r() * 22000, w: 3000 + r() * 5000, ph: r() * 9, i }));
      st.band = Array.from({ length: 46 }, () => { // cloud on the slopes, hugging the massif
        const th = -Math.PI * (.02 + r() * 1.06) + (r() < .35 ? Math.PI : 0), y = 820 + r() * 520;
        let rr = 400; while (rr < 3800 && hgt(PX + Math.cos(th) * rr, PZ + Math.sin(th) * rr / 1.12) > y) rr += 60;
        rr += 80 + r() * 260;
        return { x: PX + Math.cos(th) * rr, z: PZ + Math.sin(th) * rr / 1.12, y, w: 420 + r() * 520, ph: r() * 9 };
      }).filter((b) => b.z > 2600);
      st.curtains = [[-5200, 8200, 2200], [3600, 9600, 2600], [7800, 7600, 1800], [-9000, 11000, 3000]];
      st.stones = Array.from({ length: 520 }, (_, i) => { const z = i % 2 ? -1500 + r() ** 1.6 * 2600 : 1110 + r() ** 1.6 * 1500, x = (r() - .5) * (i % 2 ? 300 + (z + 1550) * 1.7 : 260 + (z - 1080) * 1.7) + (i % 2 ? 0 : 200); return { x, z, gy: hgt(x, z), w: 1 + r() ** 3 * 11, k: .4 + r() * .5, sh: Array.from({ length: 9 }, () => .72 + r() * .45) }; });
      st.shrubs = Array.from({ length: 34 }, () => { const z = -1450 + r() ** 1.3 * 2600, x = (r() - .5) * (260 + (z + 1700) * 1.7); return { x, z, gy: hgt(x, z), w: 3 + r() * 5, ph: r() * 9 }; });
      st.shrubs.push({ x: -44, z: -1452, gy: hgt(-44, -1452), w: 11, ph: 1 }); // one acacia near the lens for the held shot
      st.birds = Array.from({ length: 34 }, () => ({ ph: r() * TAU, rad: 25 + r() * 70, top: .72 + r() * .32, s: r(), fl: r() * 9, dir: r() < .5 ? 1 : -1 }));
      st.flood = GULLY.map((_, g) => { // gully floors from high on the face to the plain, then a wadi towards the camera
        const pts = [];
        for (let rr = 240; rr <= 3900; rr += 50) { const [x, z] = gullyAt(g, rr); pts.push([x, z, 0, 0]); }
        const nm = pts.length;
        let [x, z] = pts[nm - 1];
        const wob = r() * 9, drift = (r() - .5) * 120;
        for (let k = 0; k < 2; k++) { z -= 60; x += drift * .05 + 24 * Math.sin(z * .004 + wob); pts.push([x, z, 0, 1]); }
        pts.forEach((q) => { q[2] = hgt(q[0], q[1]); });
        return pts;
      });
      st.wind = Array.from({ length: 50 }, () => [r(), r(), .4 + r(), r() * 9]);
      st.rows = []; st.rowK = 0; st.rowsDone = false;
    },

    frame(p, t, el, st) {
      fit(st.cv);
      const c = st.ctx, W = st.cv.width, H = st.cv.height;
      const port = H > W * 1.1;
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      // the terrain grid is built a few rows per frame while the room is on screen, all at once if needed now
      if (!st.rowsDone) buildRows(st, p > CUT - .03 ? 1e9 : 3);
      let anchor;
      if (p < CUT) anchor = room(c, W, H, port, p, t, st); else anchor = mountain(c, W, H, port, p, t, st);
      // ---- the dust that joins the two worlds ----
      const vA = smooth(seg(p, .335, CUT)), vB = 1 - smooth(seg(p, CUT, .475));
      const veil = p < CUT ? .97 * vA : .97 * vB;
      if (veil > .005) {
        const warm = p < CUT ? [124, 100, 70] : mixc([124, 100, 70], [70, 72, 78], seg(p, CUT, .45));
        const g = c.createRadialGradient(anchor[0], anchor[1], 0, anchor[0], anchor[1], Math.hypot(W, H) * .8);
        g.addColorStop(0, rgb(mixc(warm, [255, 230, 180], .35), veil)); g.addColorStop(1, rgb(mixc(warm, [10, 8, 6], .4), veil));
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 14; k++) { // billows in the dust, drifting
          const a = k * 2.4 + t * .05, R = Math.hypot(W, H) * (.18 + .1 * Math.sin(k * 1.7));
          const x = anchor[0] + Math.cos(a) * W * (.15 + .25 * ((k * .37) % 1)), y = anchor[1] + Math.sin(a * 1.3) * H * .3 - (p - .3) * H * (k % 3);
          c.globalAlpha = .07 * veil; c.drawImage(st.cloud, x - R, y - R * .5, R * 2, R);
        }
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
      // the light of the axle / the summit, kept on top of the dust so the eye carries it across the cut
      {
        const k = Math.max(veil, 0);
        if (k > .01) {
          c.globalCompositeOperation = 'lighter';
          const R = Math.min(W, H);
          halo(anchor[0], anchor[1], R * .45, st.gold, .5 * k); halo(anchor[0], anchor[1], R * .1, st.gold, .9 * k); halo(anchor[0], anchor[1], R * .025, st.glow, k);
          c.globalCompositeOperation = 'source-over';
        }
      }
      // grade: grain and vignette
      c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(st.noise, 'repeat'); c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      const vg = c.createRadialGradient(W * .5, H * .5, Math.min(W, H) * .3, W * .5, H * .5, Math.hypot(W, H) * .72);
      vg.addColorStop(0, 'rgba(4,4,6,0)'); vg.addColorStop(1, `rgba(4,4,6,${p < CUT ? .7 : .5})`);
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
      // ---- DOM: the axle's name under the axle; the years ----
      const dpr = W / st.cv.clientWidth;
      if (st.axis && p < CUT && st.lab) { st.axis.style.left = `${(st.lab[0] / dpr).toFixed(1)}px`; st.axis.style.top = `${Math.min(st.cv.clientHeight - 40, st.lab[1] / dpr).toFixed(1)}px`; st.axis.style.translate = port ? '-50% .3rem' : ''; }
      if (st.yr) setText(st.yr, arNum(Math.min(35, 11 + Math.floor(24 * seg(p, .77, .955) + 1e-6))));

      function halo(x, y, R, img, a) {
        if (a <= .01 || x + R < 0 || x - R > W || y + R < 0 || y - R > H) return;
        c.globalAlpha = Math.min(1, a); c.drawImage(img, x - R, y - R, R * 2, R * 2); c.globalAlpha = 1;
      }
    },
  };

  // build terrain rows (heights first; normals, hollows and materials once a row's neighbours exist)
  function buildRows(st, ms) {
    const t0 = performance.now();
    while (st.rowK < ROWZ.length) {
      const z = ROWZ[st.rowK++];
      const half = Math.min(31800, .98 * (z + 1700) + 900);
      const i0 = Math.max(0, Math.floor((-half - X0) / DX)), i1 = Math.min(Math.floor(-X0 * 2 / DX), Math.ceil((half - X0) / DX)), n = i1 - i0 + 1;
      const h = new Float32Array(n);
      for (let i = 0; i < n; i++) h[i] = hgt(X0 + (i0 + i) * DX, z);
      st.rows.push({ z, i0, n, h });
      if (st.rows.length > 1) finish(st.rows, st.rows.length - 2);
      if (performance.now() - t0 > ms) break;
    }
    if (st.rowK === ROWZ.length && !st.rowsDone) { finish(st.rows, st.rows.length - 1); st.rowsDone = true; }
  }
  function finish(rows, j) {
    const R = rows[j], Fr = rows[j - 1] || R, Nr = rows[j + 1] || R, n = R.n;
    const at = (Q, i, x) => { const k = i - Q.i0; return k >= 0 && k < Q.n ? Q.h[k] : hgt(x, Q.z); };
    R.nx = new Float32Array(n); R.ny = new Float32Array(n); R.nz = new Float32Array(n); R.ao = new Float32Array(n); R.mat = new Float32Array(n); R.v = new Float32Array(n);
    const span = (Fr.z - Nr.z) || 1;
    for (let k = 0; k < n; k++) {
      const i = R.i0 + k, x = X0 + i * DX, hh = R.h[k];
      const hl = k > 0 ? R.h[k - 1] : hgt(x - DX, R.z), hr = k < n - 1 ? R.h[k + 1] : hgt(x + DX, R.z);
      const hf = Fr === R ? hh : at(Fr, i, x), hn = Nr === R ? hh : at(Nr, i, x);
      const gx = (hr - hl) / (2 * DX), gz = (hf - hn) / span, l = Math.hypot(gx, 1, gz);
      R.nx[k] = -gx / l; R.ny[k] = 1 / l; R.nz[k] = -gz / l;
      R.ao[k] = Math.max(.4, Math.min(1.2, 1 - ((hl + hr + hf + hn) / 4 - hh) * .01));
      const rr = Math.hypot(x - PX, (R.z - PZ) * 1.12);
      R.mat[k] = c01((rr - 3500) / 1600) * (.5 + .5 * Math.sin(x * .0023 + R.z * .0017) ** 2);
      R.v[k] = R.z > 6900 && rr > 4200 ? .97 : .82 + .2 * vn(x * .004, R.z * .004) + (rr < 4000 ? .1 : .03) * vn(x * .03, R.z * .02);
    }
  }

  // =============================== World A ===============================
  function room(c, W, H, port, p, t, st) {
    let [cx, cy, cz, kf, tx, ty] = spline(CAMA, Math.max(-.05, Math.min(CUT + .04, p)));
    if (port) { tx = .5; ty += .08; }
    const F = (port ? W * 1.5 : Math.min(H * 1.1, W * 1.55)) * kf;
    const dz0 = AXLE[2] - cz;
    const ox = tx * W - (AXLE[0] - cx) * F / dz0, hy = ty * H - (cy - AXLE[1]) * F / dz0;
    const NEAR = .08;
    const P = (x, y, z) => { const d = z - cz; return [ox + (x - cx) * F / d, hy + (cy - y) * F / d]; };
    const clip = (pts) => {
      const zc = cz + NEAR, out = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length], ia = a[2] >= zc, ib = b[2] >= zc;
        if (ia) out.push(a);
        if (ia !== ib) { const k = (zc - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, zc]); }
      }
      return out;
    };
    const path3 = (pts) => { const q = clip(pts); if (q.length < 3) return false; c.beginPath(); q.forEach((v, i) => { const [x, y] = P(v[0], v[1], v[2]); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); return true; };
    const pathS = (pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };

    // ---- beats ----
    const theta = -p * 46; // the upper stone turns with the scroll
    const push = smooth(seg(p, .1, .27)), back = smooth(seg(p, .3, CUT));
    const axI = .85 + .55 * push + .6 * back;
    const sunI = 1 + .7 * back;
    // ---- lights ----
    const L = [
      { p: [AXLE[0], AXLE[1] + .02, AXLE[2]], c: [1, .74, .38], i: .75 * axI, r2: .22 },
      { p: [-.2, .45, .32], c: [1, .86, .66], i: .55 * sunI, r2: 2.4 }, // the sunlit floor throws light back up
      { p: [-1.15, 1.8, 1.45], c: [.8, .86, 1], i: .32, r2: 1.2 }, // the window
      { p: [1.25, .9, 1.55], c: [1, .9, .74], i: .45, r2: 1.6 }, // the doorway
      { p: [.6, .8, -1.5], c: [1, .84, .64], i: .5, r2: 3 }, // light from the court behind us
    ];
    const AMB = [.075, .064, .056];
    const inBeam = (x, y, z) => { // soft test: does the sun's shaft reach this point?
      const s = (z - RZ1) / SUN[2]; if (s < 0) return 0;
      const qx = x - s * SUN[0], qy = y - s * SUN[1];
      const ex = Math.min(qx - WIN.x0, WIN.x1 - qx), ey = Math.min(qy - WIN.y0, WIN.y1 - qy);
      return c01(Math.min(ex, ey) / .06 + .5);
    };
    const shade = (alb, nx, ny, nz, x, y, z, sunK = 1) => {
      let R = AMB[0], G = AMB[1], B = AMB[2];
      for (const l of L) {
        const dx = l.p[0] - x, dy = l.p[1] - y, dz = l.p[2] - z, d2 = dx * dx + dy * dy + dz * dz, d = Math.sqrt(d2) || 1;
        const lam = ((nx * dx + ny * dy + nz * dz) / d + .2) / 1.2; if (lam <= 0) continue;
        const e = l.i * lam / (1 + d2 / l.r2); R += l.c[0] * e; G += l.c[1] * e; B += l.c[2] * e;
      }
      if (sunK > 0) { const lam = -(nx * SUN[0] + ny * SUN[1] + nz * SUN[2]); if (lam > 0) { const e = 2.4 * sunI * lam * inBeam(x, y, z) * sunK; R += e; G += .9 * e; B += .74 * e; } }
      return [tone(alb[0] * R), tone(alb[1] * G), tone(alb[2] * B)];
    };
    const PLASTER = [.74, .6, .44], EARTH = [.56, .44, .32];

    // ---- floor ----
    if (path3([[-RX, 0, RZ0], [RX, 0, RZ0], [RX, 0, RZ1], [-RX, 0, RZ1]])) {
      const yF = P(0, 0, RZ1)[1];
      const g = c.createLinearGradient(0, yF, 0, H);
      g.addColorStop(0, rgb(shade(EARTH, 0, 1, 0, 0, 0, RZ1 - .1, 0))); g.addColorStop(.5, rgb(shade(EARTH, 0, 1, 0, 0, 0, .3, 0))); g.addColorStop(1, rgb(shade(EARTH, 0, 1, 0, cx, 0, cz + 1, 0)));
      c.fillStyle = g; c.fill();
      c.save(); c.clip(); c.globalCompositeOperation = 'multiply'; c.fillStyle = c.createPattern(st.mottle, 'repeat'); c.fillRect(0, yF, W, H - yF); c.restore();
    }
    // ---- the roof: palm fronds over palm trunks ----
    if (cy < RH && path3([[-RX, RH, RZ0], [RX, RH, RZ0], [RX, RH, RZ1], [-RX, RH, RZ1]])) {
      c.save(); c.clip(); c.fillStyle = '#100b07'; c.fillRect(0, 0, W, H);
      c.globalAlpha = .7; c.fillStyle = c.createPattern(st.thatch, 'repeat'); c.fillRect(0, 0, W, H); c.globalAlpha = 1;
      c.globalCompositeOperation = 'lighter';
      { const [wx, wy] = P(-1.15, RH, RZ1 - .4); halo(wx, wy, 1.6 * F / Math.max(.3, RZ1 - .4 - cz), st.sun, .12 * sunI); }
      c.globalCompositeOperation = 'source-over'; c.restore();
      for (let z = RZ1 - .3; z > cz + .2; z -= .46) {
        if (!path3([[-RX, RH, z - .1], [RX, RH, z - .1], [RX, RH - .13, z], [-RX, RH - .13, z]])) continue;
        const col = shade([.45, .32, .2], 0, -1, -.4, 0, RH - .1, z, 0);
        const [, ya] = P(0, RH, z - .1), [, yb] = P(0, RH - .13, z), g = c.createLinearGradient(0, ya, 0, yb);
        g.addColorStop(0, rgb(mixc(col, [0, 0, 0], .6))); g.addColorStop(1, rgb(col)); c.fillStyle = g; c.fill();
      }
    }
    // ---- walls ----
    const wallFill = (n, a0, a1, fixed, axis) => { // a horizontal gradient of the lit plaster along the wall
      const pts = [], N = 9;
      for (let i = 0; i <= N; i++) { const u = mix(a0, a1, i / N); const q = axis === 'x' ? [u, 1.1, fixed] : [fixed, 1.1, u]; if (q[2] - cz > NEAR) pts.push([P(q[0], q[1], q[2])[0], shade(PLASTER, n[0], n[1], n[2], q[0], q[1], q[2], 0)]); }
      if (pts.length < 2) return rgb(shade(PLASTER, n[0], n[1], n[2], 0, 1.1, fixed, 0));
      pts.sort((m, q) => m[0] - q[0]);
      const g = c.createLinearGradient(pts[0][0], 0, pts[pts.length - 1][0], 0);
      pts.forEach(([x, col]) => g.addColorStop(c01((x - pts[0][0]) / (pts[pts.length - 1][0] - pts[0][0] || 1)), rgb(col)));
      return g;
    };
    const wallTex = (yTop, yBot) => {
      c.save(); c.clip();
      c.globalCompositeOperation = 'multiply'; c.fillStyle = c.createPattern(st.mottle, 'repeat'); c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      const v = c.createLinearGradient(0, yTop, 0, yBot); v.addColorStop(0, 'rgba(6,4,3,.55)'); v.addColorStop(.45, 'rgba(6,4,3,.1)'); v.addColorStop(.88, 'rgba(6,4,3,.05)'); v.addColorStop(1, 'rgba(6,4,3,.5)');
      c.fillStyle = v; c.fillRect(0, Math.min(yTop, yBot), W, Math.abs(yBot - yTop));
      c.restore();
    };
    if (path3([[-RX, 0, RZ0], [-RX, 0, RZ1], [-RX, RH, RZ1], [-RX, RH, RZ0]])) { c.fillStyle = wallFill([1, 0, 0], RZ0, RZ1, -RX, 'z'); c.fill(); wallTex(P(-RX, RH, RZ1)[1], P(-RX, 0, RZ1)[1]); }
    if (path3([[RX, 0, RZ0], [RX, 0, RZ1], [RX, RH, RZ1], [RX, RH, RZ0]])) { c.fillStyle = wallFill([-1, 0, 0], RZ0, RZ1, RX, 'z'); c.fill(); wallTex(P(RX, RH, RZ1)[1], P(RX, 0, RZ1)[1]); }
    const [bx0, byT] = P(-RX, RH, RZ1), [bx1, byB] = P(RX, 0, RZ1), bs = F / (RZ1 - cz);
    c.fillStyle = wallFill([0, 0, -1], -RX, RX, RZ1, 'x'); c.fillRect(bx0, byT, bx1 - bx0, byB - byT);
    pathS([[bx0, byT], [bx1, byT], [bx1, byB], [bx0, byB]]); wallTex(byT, byB);
    // bare brick where the plaster has fallen, and cracks
    c.save(); pathS([[bx0, byT], [bx1, byT], [bx1, byB], [bx0, byB]]); c.clip();
    st.bricks.forEach(([x, y, w, h]) => {
      const [sx, sy] = P(x, y, RZ1), sw = w * bs, sh = h * bs;
      c.fillStyle = 'rgba(40,24,14,.22)'; c.beginPath(); c.ellipse(sx, sy, sw * .5, sh * .5, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(30,18,10,.35)'; c.lineWidth = Math.max(1, .006 * bs); c.beginPath();
      for (let yy = -sh * .45; yy < sh * .45; yy += .1 * bs) { const hw = sw * .5 * Math.sqrt(Math.max(0, 1 - (yy / (sh * .5)) ** 2)); c.moveTo(sx - hw, sy + yy); c.lineTo(sx + hw, sy + yy); for (let xx = -hw + ((yy / (.1 * bs)) & 1) * .2 * bs; xx < hw; xx += .4 * bs) { c.moveTo(sx + xx, sy + yy); c.lineTo(sx + xx, sy + yy + .1 * bs); } }
      c.stroke();
    });
    c.strokeStyle = 'rgba(28,18,10,.4)'; c.lineWidth = Math.max(1, .004 * bs);
    st.cracks.forEach((pts) => { c.beginPath(); pts.forEach(([x, y], i) => { const [sx, sy] = P(x, y, RZ1); i ? c.lineTo(sx, sy) : c.moveTo(sx, sy); }); c.stroke(); });
    c.restore();
    // the high window: deep reveal, bright sky
    {
      const zo = RZ1 + .45, q = (x, y, z) => P(x, y, z);
      const i00 = q(WIN.x0, WIN.y0, RZ1), i10 = q(WIN.x1, WIN.y0, RZ1), i11 = q(WIN.x1, WIN.y1, RZ1), i01 = q(WIN.x0, WIN.y1, RZ1);
      const o00 = q(WIN.x0, WIN.y0, zo), o10 = q(WIN.x1, WIN.y0, zo), o11 = q(WIN.x1, WIN.y1, zo), o01 = q(WIN.x0, WIN.y1, zo);
      pathS([i00, i10, i11, i01]); c.fillStyle = rgb(shade(PLASTER, 0, 0, -1, -1.15, 1.8, RZ1, 0)); c.fill();
      pathS([o00, o10, o11, o01]); { const g = c.createLinearGradient(0, o01[1], 0, o00[1]); g.addColorStop(0, '#fff6e0'); g.addColorStop(1, '#ffe7b8'); c.fillStyle = g; c.fill(); }
      pathS([i00, i10, o10, o00]); c.fillStyle = 'rgba(255,214,160,.85)'; c.fill(); // the sill, in the sun
      pathS([i01, i11, o11, o01]); c.fillStyle = 'rgba(70,48,30,.9)'; c.fill();
      pathS([i00, i01, o01, o00]); c.fillStyle = 'rgba(120,86,56,.9)'; c.fill();
      pathS([i10, i11, o11, o10]); c.fillStyle = 'rgba(200,150,100,.8)'; c.fill();
      c.globalCompositeOperation = 'lighter'; const [wx, wy] = P((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, RZ1); halo(wx, wy, .7 * bs, st.sun, .35 * sunI); c.globalCompositeOperation = 'source-over';
    }
    // the lamp niche (unlit by day)
    {
      const [nx0, ny0] = P(-.42, 1.12, RZ1), [nx1, ny1] = P(-.14, 1.42, RZ1), rr = (nx1 - nx0) / 2;
      c.fillStyle = 'rgba(26,16,10,.85)'; c.beginPath(); c.moveTo(nx0, ny0); c.lineTo(nx0, ny1 + rr); c.arc(nx0 + rr, ny1 + rr, rr, Math.PI, 0); c.lineTo(nx1, ny0); c.closePath(); c.fill();
      c.fillStyle = '#5a3f26'; c.beginPath(); c.ellipse((nx0 + nx1) / 2, ny0 - .025 * bs, rr * .6, .022 * bs, 0, 0, TAU); c.fill();
    }
    // the doorway to the sunlit court, and its curtain
    {
      const [dx0, dyT] = P(DOOR.x0, DOOR.y1, RZ1), [dx1, dyB] = P(DOOR.x1, 0, RZ1);
      const g = c.createLinearGradient(0, dyT, 0, dyB); g.addColorStop(0, '#f6e6c4'); g.addColorStop(.55, '#e9cf9d'); g.addColorStop(.62, '#cfa774'); g.addColorStop(1, '#e2c08c');
      c.fillStyle = g; c.fillRect(dx0, dyT, dx1 - dx0, dyB - dyT);
      c.fillStyle = 'rgba(70,52,36,.75)'; c.fillRect(dx0 + (dx1 - dx0) * .62, dyT, (dx1 - dx0) * .07, (dyB - dyT) * .64); // a palm trunk across the court
      c.fillStyle = 'rgba(120,94,64,.35)'; c.fillRect(dx0, dyT + (dyB - dyT) * .5, dx1 - dx0, (dyB - dyT) * .08);
      const cw = (dx1 - dx0) * .58, sag = .02 * bs; // the curtain, drawn aside to the left
      c.beginPath(); c.moveTo(dx0 - 3, dyT - 2); c.lineTo(dx0 + cw, dyT - 2); c.quadraticCurveTo(dx0 + cw * .7, (dyT + dyB) / 2, dx0 + cw * .82, dyB); c.lineTo(dx0 - 3, dyB); c.closePath();
      const cg = c.createLinearGradient(dx0, 0, dx0 + cw, 0);
      for (let k = 0; k <= 8; k++) cg.addColorStop(k / 8, k % 2 ? 'rgb(30,26,34)' : 'rgb(46,38,44)');
      cg.addColorStop(1, 'rgb(120,90,70)'); c.fillStyle = cg; c.fill();
      c.fillStyle = 'rgba(40,26,16,.9)'; c.fillRect(dx0 - .05 * bs, dyT - sag - .03 * bs, dx1 - dx0 + .1 * bs, .03 * bs);
      c.globalCompositeOperation = 'lighter'; // spill on the floor
      floorPool(1.3, .35, .9, .6, [255, 214, 160], .16);
      c.globalCompositeOperation = 'source-over';
    }
    // ---- the shaft of sun: from the window to the floor ----
    const wc = [[WIN.x0, WIN.y0], [WIN.x1, WIN.y0], [WIN.x1, WIN.y1], [WIN.x0, WIN.y1]];
    const patch = wc.map(([x, y]) => { const s = y / -SUN[1]; return [x + s * SUN[0], 0, RZ1 + s * SUN[2]]; });
    // the patch on the floor, soft edged
    c.globalCompositeOperation = 'lighter';
    [[1.25, .1], [1.1, .18], [1, .5]].forEach(([g, a]) => {
      const cxp = patch.reduce((m, q) => m + q[0], 0) / 4, czp = patch.reduce((m, q) => m + q[2], 0) / 4;
      if (path3(patch.map(([x, y, z]) => [cxp + (x - cxp) * g, .002, czp + (z - czp) * g]))) { c.fillStyle = `rgba(255,226,170,${(a * sunI).toFixed(3)})`; c.fill(); }
    });
    c.globalCompositeOperation = 'source-over';
    // furniture behind the quern: the jar, the bedding roll
    jar(-1.72, 1.2, .3, .86); jar(-1.25, 1.42, .2, .56);
    boxA(1.55, 2.3, 0, .42, -.6, 1.7, [.7, .56, .4], false); boxA(1.62, 2.25, .42, .5, .2, 1.3, [.42, .2, .14], false);
    basket(.78, .3);
    // ---- the quern ----
    quern();
    // the beam itself, drawn over everything it passes through
    {
      const pts = [];
      wc.forEach(([x, y]) => pts.push(P(x, y, RZ1)));
      patch.forEach(([x, y, z]) => { if (z - cz > NEAR) pts.push(P(x, y, z)); });
      if (pts.length > 4) {
        const hp = hull(pts), [ax0, ay0] = P(-1.15, 1.83, RZ1), pc = P(-.2, 0, .3);
        c.globalCompositeOperation = 'lighter';
        pathS(hp);
        const g = c.createLinearGradient(ax0, ay0, pc[0], pc[1]);
        g.addColorStop(0, `rgba(255,236,196,${(.2 * sunI).toFixed(3)})`); g.addColorStop(.7, `rgba(255,226,180,${(.1 * sunI).toFixed(3)})`); g.addColorStop(1, `rgba(255,220,170,${(.05 * sunI).toFixed(3)})`);
        c.fillStyle = g; c.fill();
        // a brighter core
        const core = wc.map(([x, y]) => [mix(-1.15, x, .55), mix(1.83, y, .55)]);
        const cp = []; core.forEach(([x, y]) => cp.push(P(x, y, RZ1))); core.forEach(([x, y]) => { const s = y / -SUN[1], z = RZ1 + s * SUN[2]; if (z - cz > NEAR) cp.push(P(x + s * SUN[0], 0, z)); });
        if (cp.length > 4) { pathS(hull(cp)); c.fillStyle = g; c.globalAlpha = .7; c.fill(); c.globalAlpha = 1; }
        // motes turning in the sun
        const sz = Math.max(1, H / 900);
        for (const [a, b, u, ph, m] of st.motes) {
          const x0 = mix(WIN.x0, WIN.x1, a), y0 = mix(WIN.y0, WIN.y1, b), s = y0 / -SUN[1] * u;
          const x = x0 + s * SUN[0] + .05 * Math.sin(t * .23 + ph), y = y0 + s * SUN[1] + .04 * Math.sin(t * .17 + ph * 2) + .02 * ((t * .02 + ph) % 1), z = RZ1 + s * SUN[2] + .05 * Math.cos(t * .19 + ph);
          if (z - cz < .2) continue;
          const [sx, sy] = P(x, y, z), tw = .5 + .5 * Math.sin(t * (.8 + m) + ph * 3);
          c.globalAlpha = Math.min(1, (.25 + .6 * tw) * m * .7 * (1 + .6 * back)); c.fillStyle = '#fff2d8';
          const q = Math.min(2.6 * sz, sz * (m > 1.2 ? 1.8 : 1.2) * Math.min(2, 1.6 / (z - cz)));
          c.beginPath(); c.arc(sx, sy, q * .6, 0, TAU); c.fill();
        }
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
    }
    // the flour that rises as the camera draws back
    if (back > .01) {
      c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 16; k++) {
        const a = k * 2.39, rr = .2 + back * (.5 + .4 * Math.sin(k)), y = .2 + back * (.3 + .9 * ((k * .618) % 1)) + .05 * Math.sin(t * .3 + k);
        const x = Math.cos(a + t * .03) * rr, z = Math.sin(a + t * .03) * rr * .8;
        if (z - cz < .3) continue;
        const [sx, sy] = P(x, y, z), R = (.35 + .5 * back) * F / (z - cz);
        c.globalAlpha = .12 * back; c.drawImage(st.cloud, sx - R, sy - R * .5, R * 2, R);
      }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    const ax = P(AXLE[0], AXLE[1], AXLE[2]);
    st.lab = port ? P(0, .0, -.36) : P(-.31, .2, -.06); // the axle's name sits off the stone: to its left, or below it on a phone
    return ax;

    // ---------- helpers that use this frame's camera ----------
    function halo(x, y, R, img, a) { if (a <= .01 || x + R < 0 || x - R > W || y + R < 0 || y - R > H) return; c.globalAlpha = Math.min(1, a); c.drawImage(img, x - R, y - R, R * 2, R * 2); c.globalAlpha = 1; }
    function floorPool(x, z, rx, rz, col, a) {
      if (z - rz - cz < NEAR) return;
      const [sx, sy] = P(x, 0, z), [, y0] = P(x, 0, z - rz), [, y1] = P(x, 0, z + rz), R = rx * F / (z - cz);
      c.save(); c.translate(sx, sy); c.scale(1, Math.max(.05, (y0 - y1) / 2 / R));
      const g = c.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, rgb(col, a)); g.addColorStop(1, rgb(col, 0));
      c.fillStyle = g; c.fillRect(-R, -R, R * 2, R * 2); c.restore();
    }
    function ring(x, y, z, rr, N = 40) { const out = []; for (let i = 0; i < N; i++) { const a = i / N * TAU; out.push([x + Math.cos(a) * rr, y, z + Math.sin(a) * rr]); } return out; }
    function cyl(x, z, rr, y0, y1, alb, topCol, sunK = 1) {
      // side: the half that faces the camera, shaded across; then the top
      const N = 40, side = [];
      for (let i = 0; i <= N; i++) { const a = Math.PI + i / N * Math.PI; side.push(a); } // the near half (z smaller)
      const pts = side.map((a) => P(x + Math.cos(a) * rr, y0, z + Math.sin(a) * rr)).concat(side.slice().reverse().map((a) => P(x + Math.cos(a) * rr, y1, z + Math.sin(a) * rr)));
      pathS(pts);
      const l = P(x - rr, y0, z), rgt = P(x + rr, y0, z);
      const g = c.createLinearGradient(l[0], 0, rgt[0], 0);
      for (let i = 0; i <= 8; i++) { const a = Math.PI + i / 8 * Math.PI, n = [Math.cos(a), 0, Math.sin(a)]; g.addColorStop(i / 8, rgb(shade(alb, n[0], 0, n[2], x + n[0] * rr, (y0 + y1) / 2, z + n[2] * rr, sunK))); }
      c.fillStyle = g; c.fill();
      pathS(ring(x, y1, z, rr).map((q) => P(q[0], q[1], q[2])));
      c.fillStyle = topCol || rgb(shade(alb, 0, 1, 0, x, y1, z, sunK)); c.fill();
    }
    function jar(x, z, rr, h) {
      const prof = [[0, .35], [.08, .7], [.28, .98], [.5, 1], [.68, .84], [.8, .55], [.86, .44], [.92, .5]];
      const left = prof.map(([y, k]) => P(x - rr * k, y * h, z)), right = prof.map(([y, k]) => P(x + rr * k, y * h, z)).reverse();
      pathS(left.concat(right));
      const l = P(x - rr, h * .5, z), rg = P(x + rr, h * .5, z), g = c.createLinearGradient(l[0], 0, rg[0], 0);
      for (let i = 0; i <= 6; i++) { const a = Math.PI + i / 6 * Math.PI; g.addColorStop(i / 6, rgb(shade([.62, .4, .26], Math.cos(a), .1, Math.sin(a), x + Math.cos(a) * rr, h * .5, z + Math.sin(a) * rr))); }
      c.fillStyle = g; c.fill();
      const [mx, my] = P(x, h * .92, z), [ex] = P(x + rr * .5, h * .92, z), ey = Math.abs(P(x, h * .92, z + rr * .5)[1] - my);
      c.fillStyle = 'rgba(14,9,6,.95)'; c.beginPath(); c.ellipse(mx, my, ex - mx, Math.max(1, ey), 0, 0, TAU); c.fill();
      c.strokeStyle = rgb(shade([.7, .48, .32], 0, 1, -.3, x, h, z), .9); c.lineWidth = Math.max(1, .02 * F / (z - cz)); c.stroke();
    }
    function boxA(x0, x1, y0, y1, z0, z1, alb, stripes) {
      const top = [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
      if (cx < x0 && path3([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]])) { c.fillStyle = rgb(shade(alb, -1, 0, 0, x0, (y0 + y1) / 2, (z0 + z1) / 2)); c.fill(); }
      if (path3([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]])) { c.fillStyle = rgb(shade(alb, 0, 0, -1, (x0 + x1) / 2, (y0 + y1) / 2, z0)); c.fill(); }
      if (path3(top)) {
        c.fillStyle = rgb(shade(alb, 0, 1, 0, (x0 + x1) / 2, y1, (z0 + z1) / 2)); c.fill();
        if (stripes) { c.save(); c.clip(); c.lineWidth = Math.max(1, .03 * F / (z1 - cz)); for (let z = z0 + .15; z < z1; z += .22) { const a = P(x0, y1, z), b = P(x1, y1, z); c.strokeStyle = 'rgba(160,110,60,.35)'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); } c.restore(); }
      }
    }
    function basket(x, z) {
      cyl(x, z, .19, 0, .24, [.62, .48, .28]);
      const s = F / (z - cz);
      c.strokeStyle = 'rgba(40,26,12,.45)'; c.lineWidth = Math.max(1, .006 * s); c.beginPath();
      for (let y = .03; y < .24; y += .035) { for (let i = 0; i <= 16; i++) { const a = Math.PI + i / 16 * Math.PI, [sx, sy] = P(x + Math.cos(a) * .19, y, z + Math.sin(a) * .19); i ? c.lineTo(sx, sy) : c.moveTo(sx, sy); } }
      c.stroke();
      const [gx, gy] = P(x, .25, z), [ex] = P(x + .17, .25, z), ey = Math.abs(P(x, .25, z + .17)[1] - gy);
      const g = c.createRadialGradient(gx - (ex - gx) * .2, gy - ey * .3, 0, gx, gy, ex - gx);
      g.addColorStop(0, rgb(shade([.86, .66, .34], 0, 1, 0, x, .27, z))); g.addColorStop(1, rgb(shade([.6, .44, .22], 0, 1, 0, x, .25, z)));
      c.fillStyle = g; c.beginPath(); c.ellipse(gx, gy - ey * .3, ex - gx, ey * 1.3, 0, 0, TAU); c.fill();
    }
    function quern() {
      const s = F / (0 - cz), acc = seg(p, 0, CUT);
      // the leather mat, dusted with flour
      pathS(ring(0, .004, 0, .66, 48).map((q) => P(q[0], q[1], q[2])));
      { const [mx, my] = P(0, .004, 0), [ex] = P(.66, .004, 0), g = c.createRadialGradient(mx, my, 0, mx, my, ex - mx);
        g.addColorStop(0, rgb(shade([.45, .3, .2], 0, 1, 0, 0, .004, 0))); g.addColorStop(1, rgb(shade([.3, .2, .13], 0, 1, 0, .6, .004, -.3))); c.fillStyle = g; c.fill(); }
      { // flour lying round the stones, more as it turns
        const [mx, my] = P(0, .01, 0), [ex] = P(.27 + .2 * acc + .12, .01, 0), ry = Math.abs(P(0, .01, -(.39 + .2 * acc))[1] - my);
        c.save(); c.translate(mx, my); c.scale(1, ry / (ex - mx));
        const g = c.createRadialGradient(0, 0, (ex - mx) * .55, 0, 0, ex - mx); g.addColorStop(0, `rgba(236,226,206,${(.55 + .3 * acc).toFixed(3)})`); g.addColorStop(1, 'rgba(236,226,206,0)');
        c.fillStyle = g; c.beginPath(); c.arc(0, 0, ex - mx, 0, TAU); c.fill(); c.restore();
      }
      // the lower stone, a seam of flour, the upper stone
      cyl(0, 0, .272, .01, .112, [.5, .47, .43]);
      c.globalCompositeOperation = 'lighter';
      { const pts = []; for (let i = 0; i <= 24; i++) { const a = Math.PI + i / 24 * Math.PI; pts.push(P(Math.cos(a) * .268, .114, Math.sin(a) * .268)); } c.strokeStyle = 'rgba(230,214,186,.22)'; c.lineWidth = Math.max(1, .005 * s); c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
      c.globalCompositeOperation = 'source-over';
      const handle = [Math.cos(theta) * .2, Math.sin(theta) * .2];
      cyl(0, 0, .258, .116, .218, [.6, .56, .5]);
      // the dressing on the top face: pick marks that show the turning
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(14,12,10,.14)'; c.lineWidth = Math.max(1, .003 * s); c.beginPath();
      st.marks.forEach(([rr, a0, l, b]) => { const a = a0 + theta, x = Math.cos(a) * rr, z = Math.sin(a) * rr, [sx, sy] = P(x, .219, z), [ex, ey] = P(x + Math.cos(a + b) * l, .219, z + Math.sin(a + b) * l); c.moveTo(sx, sy); c.lineTo(ex, ey); });
      c.stroke();
      c.strokeStyle = 'rgba(240,226,200,.08)'; c.beginPath();
      st.marks.forEach(([rr, a0, l, b, w], i) => { if (i % 3) return; const a = a0 + theta + .03, x = Math.cos(a) * rr, z = Math.sin(a) * rr, [sx, sy] = P(x, .219, z), [ex, ey] = P(x + Math.cos(a + b) * l, .219, z + Math.sin(a + b) * l); c.moveTo(sx, sy); c.lineTo(ex, ey); });
      c.stroke();
      { // a crack and a pale vein in the stone, turning with it
        const seg3 = (r0, r1, a0, bend, col, w) => { c.strokeStyle = col; c.lineWidth = Math.max(1, w * s); c.beginPath(); for (let k = 0; k <= 8; k++) { const rr = mix(r0, r1, k / 8), a = a0 + theta + bend * Math.sin(k * 1.3), [sx, sy] = P(Math.cos(a) * rr, .219, Math.sin(a) * rr); k ? c.lineTo(sx, sy) : c.moveTo(sx, sy); } c.stroke(); };
        seg3(.07, .255, 1.2, .05, 'rgba(10,8,6,.55)', .004);
        seg3(.12, .25, 3.6, .12, 'rgba(226,214,190,.13)', .012);
      }
      // a worn ring near the rim
      c.strokeStyle = 'rgba(220,206,180,.1)'; c.lineWidth = Math.max(1, .02 * s); pathS(ring(0, .219, 0, .235, 40).map((q) => P(q[0], q[1], q[2]))); c.stroke();
      // the eye, grain about it
      { const [ex0, ey0] = P(0, .219, 0), [ex1] = P(.05, .219, 0), ry = Math.abs(P(0, .219, .05)[1] - ey0);
        c.fillStyle = '#0d0a07'; c.beginPath(); c.ellipse(ex0, ey0, ex1 - ex0, ry, 0, 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(176,140,80,.75)';
      st.grains.forEach(([rr, a0, k]) => { const a = a0 + theta * (.9 + .1 * k), rk = rr - .02 * ((t * .05 + k) % 1); const [sx, sy] = P(Math.cos(a) * rk, .222, Math.sin(a) * rk); const q = Math.max(1, Math.min(4 * H / 900, .005 * s)); c.beginPath(); c.ellipse(sx, sy, q * .6, q * .4, a, 0, TAU); c.fill(); });
      // the handle, before or after the axle by depth
      const drawHandle = () => {
        const [hx, hz] = handle, [bx, by] = P(hx, .218, hz), [tx2, ty2] = P(hx + .01, .37, hz), w = .036 * F / (hz - cz);
        const g = c.createLinearGradient(bx - w / 2, 0, bx + w / 2, 0);
        g.addColorStop(0, rgb(shade([.5, .34, .2], -1, 0, 0, hx - .02, .3, hz))); g.addColorStop(.6, rgb(shade([.5, .34, .2], 0, 0, -1, hx, .3, hz - .02))); g.addColorStop(1, rgb(shade([.5, .34, .2], 1, 0, 0, hx + .02, .3, hz)));
        c.strokeStyle = g; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx2, ty2); c.stroke();
      };
      if (handle[1] > 0) drawHandle();
      // the axle: a wooden pin standing in the eye, its head alight
      { const [bx, by] = P(0, .2, 0), [tx2, ty2] = P(0, AXLE[1], 0), w = .04 * s;
        c.strokeStyle = '#7a5a30'; c.lineWidth = w; c.lineCap = 'butt'; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx2, ty2); c.stroke();
        c.globalCompositeOperation = 'lighter';
        const pulse = 1 + .04 * Math.sin(t * 1.3);
        const R0 = Math.min(W * .32, .9 * s) * pulse;
        halo(tx2, ty2, R0, st.gold, .3 * axI * Math.min(1, (W * .2 / R0) ** .5));
        halo(tx2, ty2, Math.min(W * .1, .24 * s), st.gold, .62 * axI);
        halo(tx2, ty2, Math.min(W * .03, .06 * s), st.glow, .95);
        // light on the stone's face round the axle
        const [mx, my] = P(0, .219, 0), [ex] = P(.24, .219, 0), ry = Math.abs(P(0, .219, .24)[1] - my);
        c.save(); c.translate(mx, my); c.scale(1, ry / (ex - mx)); const g = c.createRadialGradient(0, 0, 0, 0, 0, ex - mx);
        g.addColorStop(0, `rgba(255,200,120,${(.2 * axI).toFixed(3)})`); g.addColorStop(1, 'rgba(255,190,110,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, ex - mx, 0, TAU); c.fill(); c.restore();
        c.globalCompositeOperation = 'source-over'; }
      if (handle[1] <= 0) drawHandle();
      // flour falling from the seam at the front, and dust in the air about the stones, lit gold by the axle
      c.globalCompositeOperation = 'lighter';
      const q = Math.max(1, .0045 * s);
      c.fillStyle = '#efe4cc';
      st.fall.forEach(([a0, ph, sp]) => { const a = a0 + theta * .2; if (Math.sin(a) > -.2) return; const u = (t * .35 * sp + ph) % 1, rr = .27 + .05 * u, y = .113 - .1 * u * u; const [sx, sy] = P(Math.cos(a) * rr, y, Math.sin(a) * rr); c.globalAlpha = .7 * (1 - u); c.fillRect(sx, sy, q, q); });
      st.dust.forEach(([x0, y0, z0, ph, m]) => {
        const x = x0 * .6 + .04 * Math.sin(t * .2 + ph), y = .05 + y0 * .6 + .03 * Math.sin(t * .15 + ph * 2), z = z0 * .5 + .04 * Math.cos(t * .17 + ph);
        if (z - cz < .2) return;
        const d2 = x * x + (y - AXLE[1]) ** 2 + z * z, k = 1 / (1 + d2 / .08);
        const [sx, sy] = P(x, y, z); c.globalAlpha = Math.min(1, k * m * .6 * axI); c.fillStyle = '#ffd890'; const qq = Math.min(2.4 * H / 900, q * (m > 1.1 ? 1.4 : 1) * .7); c.beginPath(); c.arc(sx, sy, qq, 0, TAU); c.fill();
      });
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
  }

  // =============================== World B ===============================
  function mountain(c, W, H, port, p, t, st) {
    let [cx, cy, cz, kf, tx, ty] = spline(CAMB, Math.min(1.05, p));
    cy += Math.max(0, hgt(cx, cz)); // heights in the keys are above the ground under the camera
    if (port) { tx = .5; ty = Math.min(.62, ty + .1); }
    const F = (port ? W * 1.45 : Math.min(H * 1.05, W * 1.5)) * kf;
    const SUM = st.summit || (st.summit = (() => { let best = [0, 0, PZ]; for (let x = -600; x <= 600; x += 10) for (let z = PZ - 600; z <= PZ + 600; z += 10) { const h = hgt(x, z); if (h > best[1]) best = [x, h, z]; } return [best[0], best[1] + 12, best[2]]; })());
    const ds = SUM[2] - cz;
    const ox = tx * W - (SUM[0] - cx) * F / ds, hy = ty * H - (cy - SUM[1]) * F / ds;
    const X = (x, z) => ox + (x - cx) * F / (z - cz), Y = (y, z) => hy + (cy - y) * F / (z - cz);

    // ---- the light: a storm late in the afternoon, then the days and nights of the held shot ----
    // four days and nights, nearly even in speed (no cycle squeezed into a flicker), ending in the last light
    const hu = seg(p, .765, .965), hold = hu + (smooth(hu) - hu) * .3;
    const phi = .7 + 4.06 * hold;
    const A = TAU * (phi - .25), sinA = Math.sin(A);
    const sunDir = norm3([Math.cos(A), .78 * sinA, -.62 * sinA - .1]);
    const e = sunDir[1];
    const storm = 1 - .65 * smooth(seg(p, .74, .86));
    const day = smooth(c01((e + .06) / .26)), tw = Math.exp(-(((e + .01) / .11) ** 2));
    const sunUp = c01((e + .02) / .07);
    const sunCol = mixc([2.3, 1.3, .66], [1.75, 1.62, 1.42], c01(e / .5)).map((v) => v * sunUp);
    // night is kept no darker than about 40% of day: the stars and the summit's light say it is night
    const skyTop = mixc(mixc([30, 36, 58], [80, 88, 104], day), [44, 46, 56], .55 * storm);
    const skyHor = mixc(mixc([46, 50, 72], [154, 150, 140], day), [222, 140, 80], .8 * tw);
    const amb = mixc([.15, .16, .23], [.44, .46, .52], day).map((v, i) => v * (1 - .32 * storm) + [.14, .07, .03][i] * tw);
    const fogC = mixc(skyHor, skyTop, .3);
    const fogD = mix(11000, 15000, day);
    const fogOf = (d) => 1 - Math.exp(-d / fogD);
    const glowK = .55 + .6 * (1 - day);
    const sunX = sunDir[0] < 0 ? -1 : 1;
    const wind = .2 + .8 * smooth(seg(p, .72, .82));
    const flow = seg(p, .44, .56), wet = 1 - smooth(seg(p, .78, .9));

    // ---- sky ----
    const sky = c.createLinearGradient(0, Math.min(0, hy - H), 0, hy);
    sky.addColorStop(0, rgb(skyTop)); sky.addColorStop(.62, rgb(mixc(skyTop, skyHor, .45))); sky.addColorStop(1, rgb(skyHor));
    c.fillStyle = sky; c.fillRect(0, 0, W, Math.max(0, hy) + 2);
    if (hy < H) { c.fillStyle = rgb(mixc(fogC, skyHor, .5)); c.fillRect(0, Math.max(0, hy), W, H - Math.max(0, hy)); } // the far plain under the haze
    const breakX = W * (.5 + .55 * sunX * Math.min(1, Math.abs(sunDir[0]) * 1.15));
    { // the break under the clouds on the sun's side
      const k = c01(1 - Math.abs(e) * 2.6) * (.4 + .6 * Math.max(day, tw));
      if (k > .01) {
        const g = c.createRadialGradient(breakX, hy, 0, breakX, hy, W * .85);
        g.addColorStop(0, `rgba(255,200,140,${(.7 * k).toFixed(3)})`); g.addColorStop(.3, `rgba(240,160,100,${(.24 * k).toFixed(3)})`); g.addColorStop(1, 'rgba(240,150,100,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, Math.max(0, hy) + 2);
      }
    }
    { // stars when the sky is dark and clear enough
      const sa = (1 - day) * (1 - .85 * storm) * (1 - tw * .7);
      if (sa > .02 && hy > 0) {
        c.fillStyle = 'rgb(232,228,214)';
        const sz = Math.max(1, H / 900);
        for (const [u, v, m, ph] of st.stars) {
          const x = W * .5 + u * W * .62, y = hy - v * H * 1.2; if (y < 0 || y > hy) continue;
          c.globalAlpha = Math.min(1, m * sa * (.7 + .3 * Math.sin(t * 1.4 + ph)) * c01((hy - y) / (H * .15)) * .85);
          c.fillRect(x, y, m > 1.2 ? 2 * sz : sz, m > 1.2 ? 2 * sz : sz);
        }
        c.globalAlpha = 1;
      }
    }
    // ---- clouds: this frame's tints for their shadowed bodies and lit edges ----
    const cloudShade = mixc(mixc([16, 18, 28], [92, 94, 102], day), [20, 20, 26], .6 * storm);
    const cloudLit = mixc(mixc([44, 48, 70], [222, 216, 204], day), [255, 176, 110], .75 * tw);
    tint(st.tints[0], st.cloud, cloudShade); tint(st.tints[1], st.cloud, cloudLit);
    const deck = st.deck.slice().sort((m, n) => n.z - m.z);
    for (const d of deck) {
      const dz = d.z - cz, sx = X(d.x + 500 * Math.sin(t * .01 + d.ph) - 900 * hold, d.z), sy = Y(d.y, d.z), w = d.w * F / dz;
      if (sx + w < 0 || sx - w > W || sy - w * .5 > Math.max(0, hy) + w * .2) continue;
      const k = (.3 + .65 * storm) * (1 - .25 * fogOf(dz));
      const lit = c01(1 - Math.abs(sx - breakX) / W);
      c.globalAlpha = k; c.drawImage(st.tints[0], sx - w, sy - w * .5, w * 2, w);
      c.globalAlpha = k * (.1 + .75 * lit * lit * Math.max(tw, day * .5)); c.drawImage(st.tints[1], sx - w, sy - w * .5 + w * .09, w * 2, w * .96);
    }
    c.globalAlpha = 1;
    // far ranges
    for (let li = st.ranges.length - 1; li >= 0; li--) {
      const rd = st.ranges[li], d = rd.z - cz, k = F / d;
      c.beginPath(); c.moveTo(X(rd.xs[0], rd.z), Y(0, rd.z) + 2);
      for (let i = 0; i < rd.xs.length; i++) c.lineTo(ox + (rd.xs[i] - cx) * k, hy + (cy - rd.hs[i]) * k);
      c.lineTo(X(rd.xs[rd.xs.length - 1], rd.z), Y(0, rd.z) + 2); c.closePath();
      c.fillStyle = rgb(mixc(mixc([26, 26, 34], [116, 110, 108], day), fogC, .5 + .13 * li)); c.fill();
    }
    // god rays through the break, onto the flank of the mountain
    if (storm > .4 && tw + day > .3) {
      c.globalCompositeOperation = 'lighter';
      const k = (storm - .4) / .6 * Math.min(1, tw + day * .6), ox2 = breakX + sunX * W * .1, oy2 = Math.min(hy, 0) - H * .25;
      for (let i = 0; i < 6; i++) {
        const tx2 = X(SUM[0] + (-1800 + i * 520) * (sunX < 0 ? 1 : -1), SUM[2] - 900), ty2 = Y(200, SUM[2] - 900), w2 = W * (.02 + .015 * (i % 3));
        const g = c.createLinearGradient(ox2, oy2, tx2, ty2); g.addColorStop(0, 'rgba(255,214,160,0)'); g.addColorStop(.5, `rgba(255,214,160,${(.05 * k).toFixed(3)})`); g.addColorStop(1, `rgba(255,200,140,${(.02 * k).toFixed(3)})`);
        c.fillStyle = g; c.beginPath(); c.moveTo(ox2 - w2 * .2, oy2); c.lineTo(ox2 + w2 * .2, oy2); c.lineTo(tx2 + w2, ty2); c.lineTo(tx2 - w2, ty2); c.closePath(); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    }
    // ---- items placed among the terrain rows by depth ----
    const items = [];
    st.curtains.forEach(([x, z, w]) => items.push([z, () => curtain(x, z, w)]));
    st.band.forEach((b) => items.push([b.z, () => bandPuff(b)]));
    st.stones.forEach((s) => { if (s.z - cz > 3) items.push([s.z, () => stone(s)]); });
    st.shrubs.forEach((s) => { if (s.z - cz > 4) items.push([s.z, () => shrub(s)]); });
    if (flow > 0 && wet > 0) st.flood.forEach((pts, g) => {
      const n = Math.max(2, Math.floor(pts.length * flow));
      for (let a = 0; a < n - 1; a += 5) { const b = Math.min(n - 1, a + 5); items.push([Math.min(pts[a][1], pts[b][1]) - 1, () => torrent(pts, g, a, b)]); }
    });
    const birdU = seg(p, .565, .745);
    if (birdU > 0 && birdU < 1) items.push([1180, () => birds()]);
    items.sort((m, n) => n[0] - m[0]);

    // ---- the terrain, far to near ----
    const GL = { p: SUM, c: [1, .74, .4], i: 3 * glowK, r2: 260 * 260 };
    const rows = st.rows, lastRow = rows.length - 1;
    let ii = 0;
    const flush = (z) => { while (ii < items.length && items[ii][0] >= z) items[ii++][1](); };
    const ROCK = [.52, .38, .29], SAND = [.46, .39, .3], HARRA = [.2, .19, .19];
    for (let k = 0; k < lastRow; k++) {
      const Ar = rows[k], Br = rows[k + 1];
      flush(Ar.z);
      if (Br.z - cz < 2) break;
      const dA = Ar.z - cz, dB = Br.z - cz;
      const xl = cx - ox * dA / F - 2 * DX, xr = cx + (W - ox) * dA / F + 2 * DX;
      const lo = Math.max(Ar.i0, Br.i0, Math.floor((xl - X0) / DX)), hi = Math.min(Ar.i0 + Ar.n - 1, Br.i0 + Br.n - 1, Math.ceil((xr - X0) / DX));
      if (hi - lo < 1) continue;
      const kA = F / dA, kB = F / dB, last = k + 1 === lastRow || rows[k + 2].z - cz < 2;
      c.beginPath();
      for (let i = lo; i <= hi; i++) { const x = X0 + i * DX, yy = hy + (cy - Ar.h[i - Ar.i0]) * kA; i === lo ? c.moveTo(ox + (x - cx) * kA, yy) : c.lineTo(ox + (x - cx) * kA, yy); }
      if (last) { c.lineTo(W + 10, H + 10); c.lineTo(-10, H + 10); } else for (let i = hi; i >= lo; i--) { const x = X0 + i * DX; c.lineTo(ox + (x - cx) * kB, hy + (cy - Br.h[i - Br.i0]) * kB + 1.5); }
      c.closePath();
      const f = fogOf(dA), g = c.createLinearGradient(0, 0, W, 0), step = Math.max(1, Math.round((hi - lo) / 72));
      let prev = -1;
      for (let i = lo; i <= hi; i += step) {
        const j = i - Ar.i0, x = X0 + i * DX, sx = (ox + (x - cx) * kA) / W;
        if (sx < -.03 && i + step <= hi && (ox + (x + step * DX - cx) * kA) / W < 0) continue;
        const pos = c01(sx); if (pos <= prev) continue;
        const nx = Ar.nx[j], ny = Ar.ny[j], nz = Ar.nz[j], hh = Ar.h[j], m = Ar.mat[j], v = Ar.v[j];
        const ground = m > 0 ? mixc(SAND, HARRA, c01((.95 - v) * 2.5)) : SAND;
        const alb = mixc(ROCK.map((q) => q * v), ground, m);
        const lam = nx * sunDir[0] + ny * sunDir[1] + nz * sunDir[2];
        let sk = 0;
        if (lam > 0 && sunUp > 0) {
          const patch = c01(.5 + 2.2 * vn(x * .00032 + t * .004 + p * 1.5, Ar.z * .00032 - t * .002));
          sk = lam * mix(1, patch, .55 * storm);
        }
        const hemi = (.5 + .5 * ny) * Ar.ao[j];
        let R = amb[0] * hemi + sunCol[0] * sk, G = amb[1] * hemi + sunCol[1] * sk, B = amb[2] * hemi + sunCol[2] * sk;
        { const ddx = GL.p[0] - x, ddy = GL.p[1] - hh, ddz = GL.p[2] - Ar.z, d2 = ddx * ddx + ddy * ddy + ddz * ddz; if (d2 < GL.r2 * 12) { const d = Math.sqrt(d2), lm = Math.max(0, (nx * ddx + ny * ddy + nz * ddz) / d + .2); const ee = GL.i * lm / (1 + d2 / GL.r2); R += GL.c[0] * ee; G += GL.c[1] * ee; B += GL.c[2] * ee; } }
        g.addColorStop(pos, rgb(mixc([tone(alb[0] * R), tone(alb[1] * G), tone(alb[2] * B)], fogC, f)));
        prev = pos;
        if (sx > 1.03) break;
      }
      c.fillStyle = prev < 0 ? rgb(fogC) : g; c.fill();
    }
    flush(-1e9);

    // ---- the light on the summit ----
    {
      const sx = X(SUM[0], SUM[2]), sy = Y(SUM[1], SUM[2]), s = F / ds;
      c.globalCompositeOperation = 'lighter';
      const pulse = 1 + .04 * Math.sin(t * 1.1);
      halo(sx, sy, Math.min(W * .45, 480 * s) * pulse, st.gold, .26 * glowK);
      halo(sx, sy, Math.min(W * .16, 110 * s), st.gold, .6 * glowK);
      halo(sx, sy, Math.max(H * .006, Math.min(W * .04, 20 * s)), st.glow, .95);
      c.globalCompositeOperation = 'source-over';
    }
    // ---- wind and dust over the plain ----
    {
      const yh = Math.max(0, hy), dc = mixc(mixc([70, 62, 56], [200, 172, 132], day), [255, 176, 110], .5 * tw);
      tint(st.tints[2], st.cloud, dc);
      c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 6; k++) { // low dust banks streaming left
        const y = yh + (H - yh) * (k * .2 - .05), w = W * (1.3 + .25 * k), xo = (t * (16 + 10 * k) * (W / 1440) + k * 333) % w;
        c.globalAlpha = .07 * wind * (1 - k * .1);
        for (let q = 0; q <= 1; q++) c.drawImage(st.tints[2], W - xo - w * .4 + q * w - w * .5, y - (H - yh) * .14, w, (H - yh) * .28);
      }
      c.globalAlpha = 1;
      const q = Math.max(1, H / 760);
      c.lineCap = 'round';
      st.wind.forEach(([u, v, m, ph]) => { // grit in the air, streaked by its speed
        const sp = (.22 + .22 * m) * W, x = W * 1.15 - ((u * W * 1.3 + t * sp) % (W * 1.3)), y = yh + (H - yh) * v ** 1.3 + Math.sin(t + ph) * 5;
        c.strokeStyle = rgb(dc, .08 * wind * m); c.lineWidth = q * m * .6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 14 * q * m * wind, y + q); c.stroke();
      });
      c.globalCompositeOperation = 'source-over';
    }
    return [X(SUM[0], SUM[2]), Y(SUM[1], SUM[2])];

    // ---------- helpers that use this frame's camera ----------
    function halo(x, y, R, img, a) { if (a <= .01 || x + R < 0 || x - R > W || y + R < 0 || y - R > H) return; c.globalAlpha = Math.min(1, a); c.drawImage(img, x - R, y - R, R * 2, R * 2); c.globalAlpha = 1; }
    function tint(dst, src, col) { const g = dst.getContext('2d'); if (dst.width !== src.width || dst.height !== src.height) { dst.width = src.width; dst.height = src.height; } g.globalCompositeOperation = 'copy'; g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = rgb(col); g.fillRect(0, 0, dst.width, dst.height); g.globalCompositeOperation = 'source-over'; }
    function bandPuff(b) {
      const dz = b.z - cz; if (dz < 60) return;
      const sx = X(b.x + 60 * Math.sin(t * .02 + b.ph), b.z), sy = Y(b.y, b.z), w = b.w * F / dz;
      if (sx + w < 0 || sx - w > W || sy + w < 0 || sy - w > H) return;
      const k = (.1 + .32 * storm) * (1 - .3 * fogOf(dz)) * (1 - c01((p - .72) / .08));
      c.globalAlpha = k; c.drawImage(st.tints[0], sx - w, sy - w * .5, w * 2, w);
      c.globalAlpha = k * .5 * Math.max(tw, day * .6); c.drawImage(st.tints[1], sx - w + sunX * w * .08, sy - w * .56, w * 2, w);
      c.globalAlpha = 1;
    }
    function curtain(x, z, w) {
      const dz = z - cz; if (dz < 100) return;
      const k = storm * .32 * (1 - .4 * fogOf(dz)); if (k < .01) return;
      const x0 = X(x - w / 2, z), x1 = X(x + w / 2, z), y0 = Y(2700, z), y1 = Y(0, z);
      if (x1 < 0 || x0 > W) return;
      c.save(); c.globalAlpha = k;
      const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, rgb(cloudShade, 0)); g.addColorStop(.25, rgb(mixc(cloudShade, fogC, .5), .8)); g.addColorStop(1, rgb(fogC, .5));
      c.fillStyle = g; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y0); c.lineTo(x1 - (x1 - x0) * .15, y1); c.lineTo(x0 - (x1 - x0) * .1, y1); c.closePath(); c.fill();
      c.clip(); c.globalAlpha = k * .5; const sh = (y1 - y0), off = (t * 400 * F / dz) % sh;
      c.drawImage(st.streak, x0 - (x1 - x0) * .1, y0 + off - sh, (x1 - x0) * 1.25, sh); c.drawImage(st.streak, x0 - (x1 - x0) * .1, y0 + off, (x1 - x0) * 1.25, sh);
      c.restore();
    }
    function groundLight(ny) { const sk = Math.max(0, .3 * sunDir[0] * 0 + sunDir[1] * .8 + .2) * sunUp; return [amb[0] * (.5 + .5 * ny) + sunCol[0] * sk, amb[1] * (.5 + .5 * ny) + sunCol[1] * sk, amb[2] * (.5 + .5 * ny) + sunCol[2] * sk]; }
    function stone(s) {
      const dz = s.z - cz, k = F / dz, w = s.w * k;
      if (w < 1.5) return;
      const sx = ox + (s.x - cx) * k; if (sx + w < 0 || sx - w > W) return;
      const gy = hy + (cy - s.gy) * k, hh = w * s.k * .55; if (gy - hh > H) return;
      const f = fogOf(dz);
      c.beginPath();
      for (let i = 0; i < 9; i++) { const a = Math.PI + i / 8 * Math.PI, rr = s.sh[i]; c.lineTo(sx + Math.cos(a) * w * .5 * rr, gy + Math.sin(a) * hh * rr); }
      c.closePath();
      const Lt = groundLight(1), Ls = groundLight(0), side = Math.max(0, -sunDir[0] * .6) * sunUp;
      const top = [tone(.22 * Lt[0]), tone(.2 * Lt[1]), tone(.19 * Lt[2])], bot = [tone(.1 * Ls[0]), tone(.095 * Ls[1]), tone(.09 * Ls[2])];
      const g = c.createLinearGradient(sx - w * .5 * sunX, gy - hh, sx + w * .3 * sunX, gy);
      g.addColorStop(0, rgb(mixc(mixc(top, [255, 200, 150], .12 * side), fogC, f))); g.addColorStop(1, rgb(mixc(bot, fogC, f)));
      c.fillStyle = g; c.fill();
      if (w > 6) { c.fillStyle = rgb(mixc([6, 6, 8], fogC, f), .45); c.beginPath(); c.ellipse(sx - sunX * w * .25, gy, w * .7, Math.max(1, hh * .14), 0, 0, TAU); c.fill(); }
    }
    function shrub(s) {
      const dz = s.z - cz, k = F / dz, w = s.w * k; if (w < 2) return;
      const sx = ox + (s.x - cx) * k, gy = hy + (cy - s.gy) * k; if (sx + w < 0 || sx - w > W || gy - w > H) return;
      const col = rgb(mixc(mixc([12, 11, 11], [54, 52, 42], day * .6), fogC, fogOf(dz)));
      const sway = Math.sin(t * 1.3 + s.ph) * w * .015 * (1 + 2 * wind);
      c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round';
      c.lineWidth = Math.max(1, w * .045); c.beginPath(); c.moveTo(sx, gy); c.quadraticCurveTo(sx - w * .04, gy - w * .25, sx + w * .03 + sway, gy - w * .42);
      c.moveTo(sx - w * .01, gy - w * .2); c.quadraticCurveTo(sx - w * .15, gy - w * .3, sx - w * .25 + sway, gy - w * .4); c.stroke();
      c.beginPath(); c.ellipse(sx + sway, gy - w * .47, w * .52, w * .11, 0, 0, TAU); c.ellipse(sx - w * .22 + sway, gy - w * .43, w * .25, w * .07, 0, 0, TAU); c.fill();
    }
    function torrent(pts, g, a, b) {
      const sp = [], ws = [], L2 = [];
      for (let i = a; i <= b; i++) {
        const [x, z, y, pl] = pts[i], dz = z - cz; if (dz < 4) continue;
        const k = F / dz;
        if (pl) { // the torrent spreads out where it reaches the plain
          if (i % 2 || 1) continue;
          const wd = 10 + 9 * Math.abs(Math.sin(i * .9 + g * 2)), ln = 26 + 14 * Math.sin(i * 1.7 + g);
          if (z - ln - cz < 4) continue;
          L2.push([X(x, z), Y(y + .2, z), wd * k, Math.abs(Y(y, z - ln) - Y(y, z + ln)) / 2]);
        } else { sp.push([ox + (x - cx) * k, hy + (cy - y - 2) * k]); ws.push(Math.min(11, 3 + i * .12) * k); }
      }
      const f = fogOf(pts[a][1] - cz), al = wet * (1 - .55 * f);
      const white = mixc(mixc([110, 122, 142], [228, 230, 228], day), [255, 214, 170], .5 * tw), refl = mixc(mixc(skyHor, skyTop, .3), [255, 255, 255], .08);
      c.lineJoin = 'round'; c.lineCap = 'round';
      if (L2.length) {
        c.fillStyle = rgb(mixc(refl, fogC, f * .5), .42 * al); c.beginPath();
        L2.forEach(([x, y, rx, ry]) => { c.moveTo(x + rx, y); c.ellipse(x, y, rx, Math.max(1, ry * .35), 0, 0, TAU); }); c.fill();
        c.globalCompositeOperation = 'lighter'; c.fillStyle = rgb(refl, .1 * al); c.beginPath();
        L2.forEach(([x, y, rx, ry]) => { c.moveTo(x + rx * .5, y); c.ellipse(x, y - ry * .05, rx * .5, Math.max(.5, ry * .12), 0, 0, TAU); }); c.fill(); c.globalCompositeOperation = 'source-over';
      }
      if (sp.length < 2) return;
      const line = () => { c.beginPath(); sp.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); };
      const wm = Math.min(H * .012, ws.reduce((m, v) => m + v, 0) / ws.length);
      c.globalCompositeOperation = 'lighter';
      line(); c.strokeStyle = rgb(white, .05 * al); c.lineWidth = Math.max(3, wm * 3.4); c.stroke();
      line(); c.strokeStyle = rgb(white, .22 * al); c.lineWidth = Math.max(1.2, wm); c.stroke();
      c.lineCap = 'butt';
      c.setLineDash([Math.max(2, wm * 1.6), Math.max(3, wm * 2.6)]); c.lineDashOffset = -t * Math.max(20, wm * 9) - g * 11;
      line(); c.strokeStyle = rgb(white, .26 * al); c.lineWidth = Math.max(1, wm * .5); c.stroke();
      c.setLineDash([Math.max(1, wm * .6), Math.max(4, wm * 4.3)]); c.lineDashOffset = -t * Math.max(26, wm * 13) - g * 5;
      line(); c.strokeStyle = rgb([255, 255, 255], .3 * al); c.lineWidth = Math.max(1, wm * .3); c.stroke();
      c.setLineDash([]); c.globalCompositeOperation = 'source-over';
      if (pts[b + 1] && pts[b + 1][3] && !pts[b][3]) { const [x, y] = sp[sp.length - 1]; c.globalCompositeOperation = 'lighter'; halo(x, y, wm * 10, st.puff, .16 * al); c.globalCompositeOperation = 'source-over'; }
    }
    function birds() {
      // they climb towards the summit on the screen, and every one of them gives out before half the height
      const C = [-20, 0, 1720], sumY = Y(SUM[1], SUM[2]);
      st.birds.forEach((b) => {
        const u = c01((birdU - b.s * .25) / .75); if (u <= 0 || u >= 1) return;
        const climb = u < .6 ? ease.out(u / .6) : 1 - .7 * ease.in((u - .6) / .4);
        const a = b.ph + b.dir * u * 7, rr = b.rad * (1 + (u > .6 ? (u - .6) * 2 : 0));
        const x = C[0] + Math.cos(a) * rr + (u > .6 ? b.dir * 120 * (u - .6) : 0), z = C[2] + Math.sin(a) * rr * .7;
        const dz = z - cz; if (dz < 20) return;
        const s = F / dz, sx = ox + (x - cx) * s, gy = hy + (cy - hgt(x, z)) * s;
        const sy = mix(gy - H * .02, sumY, .5 * b.top * climb);
        const span = 4 * 2.6 * s * (.8 + .4 * b.top), flap = (u < .6 ? 1 : .3) * Math.sin(t * (u < .6 ? 9 : 4) + b.fl), al = c01(u * 8) * c01((1 - u) * 6);
        const lift = span * .42 * flap, sweep = span * .18, th = span * .07;
        c.fillStyle = rgb(mixc([44, 42, 48], [206, 200, 190], .3 + .7 * day), .92 * al);
        c.beginPath(); c.moveTo(sx, sy);
        c.quadraticCurveTo(sx - span * .45, sy - span * .2 - lift * .6, sx - span, sy - lift + sweep * .3);
        c.quadraticCurveTo(sx - span * .5, sy - lift * .3 + th, sx - span * .08, sy + span * .07);
        c.lineTo(sx + span * .08, sy + span * .07);
        c.quadraticCurveTo(sx + span * .5, sy - lift * .3 + th, sx + span, sy - lift + sweep * .3);
        c.quadraticCurveTo(sx + span * .45, sy - span * .2 - lift * .6, sx, sy);
        c.fill();
      });
    }
  }
})();
