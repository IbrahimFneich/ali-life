// The Great Mosque of Kufa before dawn, 19 Ramadan 40 AH. Ali, a veiled figure with the gold disc behind the head
// (scenes/holy.js; no face is ever drawn), leaves a house in the sleeping town, enters the mosque, wakes the sleepers
// as he passes, crosses the courtyard and walks down the nave of the columned hall to the mihrab. He stands in
// prayer, bows, prostrates; in the prostration, one red-gold flash and a crack of light; a dark shape at the edge,
// never a figure. He is lowered to sit, still bright; no wound is shown. A faint Kaaba appears in the niche. Dawn
// comes into the hall from the courtyard.
// World in metres: x right (west), y up, z away from the camera (towards the qibla). Zero-pitch camera with a shift
// lens, as in the Mabit scene. Above the roof line the town and the mosque are boxes; below it, the hall is drawn
// row by row from the qibla wall forward, so columns hide what is behind them.
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
  const lerpKeys = (K, p) => { // piecewise-linear keys [p, v]
    if (p <= K[0][0]) return K[0][1];
    for (let i = 1; i < K.length; i++) if (p <= K[i][0]) { const a = K[i - 1], b = K[i]; return mix(a[1], b[1], smooth((p - a[0]) / (b[0] - a[0]))); }
    return K[K.length - 1][1];
  };
  // a polyline walked at constant speed; points are [x, z]
  const path = (pts) => { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, len: cum[cum.length - 1] }; };
  const walkS = (P, s) => {
    s = Math.max(0, Math.min(P.len, s));
    let i = 1;
    while (i < P.pts.length - 1 && P.cum[i] < s) i++;
    const a = P.pts[i - 1], b = P.pts[i], k = c01((s - P.cum[i - 1]) / ((P.cum[i] - P.cum[i - 1]) || 1));
    return [mix(a[0], b[0], k), mix(a[1], b[1], k)];
  };

  // ---- the mosque ----
  const WX = 54.8, ZN = .2, ZQ = 109.8, ZH = 78, WALL = 8, CEIL = 7.2, COLH = 6.3, CR = .3;
  const ROWS = [103.5, 97.5, 91.5, 85.5, 79.5]; // far to near
  const COLX = []; for (let i = 0; i < 9; i++) COLX.push(-3 - 6 * i, 3 + 6 * i);
  const LAMPS = []; [106.5, 94.5, 82.5].forEach((z) => [0, -12, 12, -24, 24, -36, 36].forEach((x) => LAMPS.push({ x, z, y: 4.6 })));
  const NICHE = { w: 1.15, spring: 2.7, top: 3.85 };
  const HOUSE = [-37, -54];
  const WALK = path([HOUSE, [-37, -13], [-6, -9], [0, -5], [0, 2], [0, 40], [0, ZH], [0, 108.1]]);
  const WALK_T = [[.02, 0], [.205, 81], [.3, 157.5], [.345, WALK.len]]; // p → metres walked
  // camera: [p, x, height, z, target z on the ground, target row on screen, focal]
  const CAM = [
    [-.05, -12, 62, -150, 30, .62, 1.05], [0, -12, 62, -150, 30, .62, 1.05], [.08, -18, 48, -128, 6, .62, 1.1], [.15, -8, 22, -58, -6, .64, 1.2],
    [.2, 0, 14, -24, 6, .64, 1.2], [.235, 0, 13, -10, 30, .64, 1.15], [.26, 0, 7, 14, 42, .63, 1.15], [.285, 0, 3, 40, 86, .63, 1.15], [.31, 0, 2.3, 68, 104, .62, 1.2],
    [.345, 0, 2, 88, 108, .6, 1.3], [.37, 0, 1.85, 95.5, 109, .58, 1.42], [.42, 0, 1.9, 93, 109, .6, 1.38], [.6, 0, 2.1, 87, 109, .6, 1.3],
    [.72, 0, 1.75, 98.5, 110, .57, 1.55], [.8, 0, 1.9, 92, 110, .59, 1.4], [.88, 0, 2.4, 72, 108, .61, 1.2], [.96, 0, 2.7, 50, 104, .62, 1.12],
    [1.05, 0, 2.75, 47, 104, .62, 1.1],
  ];
  const AMB = { // ambient light per face: night, dawn
    top: [[.2, .24, .46], [.56, .54, .6]], front: [[.06, .075, .14], [.42, .38, .42]],
    east: [[.07, .085, .15], [1.15, .76, .46]], west: [[.05, .06, .12], [.26, .28, .36]],
  };

  S.kufa = {
    init(el, st) {
      st.cv = el.querySelector('canvas');
      st.ctx = st.cv.getContext('2d');
      const r = rng(4019);
      st.glow = sprite([[0, 'rgba(255,255,255,1)'], [.18, 'rgba(255,255,255,.55)'], [.45, 'rgba(255,255,255,.16)'], [1, 'rgba(255,255,255,0)']]);
      st.fire = sprite([[0, 'rgba(255,214,150,1)'], [.25, 'rgba(255,150,60,.5)'], [.6, 'rgba(220,90,30,.12)'], [1, 'rgba(200,70,20,0)']]);
      st.pale = sprite([[0, 'rgba(255,246,222,1)'], [.2, 'rgba(255,236,196,.5)'], [.55, 'rgba(240,214,160,.12)'], [1, 'rgba(240,214,160,0)']]);
      st.red = sprite([[0, 'rgba(255,226,170,1)'], [.15, 'rgba(255,150,90,.7)'], [.45, 'rgba(200,50,36,.25)'], [1, 'rgba(160,30,24,0)']]);
      st.dark = sprite([[0, 'rgba(4,3,6,.95)'], [.5, 'rgba(4,3,6,.7)'], [1, 'rgba(4,3,6,0)']]);
      st.ao = document.createElement('canvas'); st.ao.width = 2; st.ao.height = 64;
      { const g = st.ao.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.85)'); g.fillStyle = gr; g.fillRect(0, 0, 2, 64); }
      st.noise = document.createElement('canvas'); st.noise.width = st.noise.height = 160;
      { const ng = st.noise.getContext('2d'), id = ng.createImageData(160, 160); for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 18; } ng.putImageData(id, 0, 0); }
      st.stars = Array.from({ length: 900 }, () => [r() * 2 - 1, r() ** 1.4, .3 + r() ** 3 * 1.6, r() * 9]);
      // ---- boxes for the view from above: houses, the walls and their towers, the hall ----
      const boxes = [];
      const box = (x0, x1, y0, y1, z0, z1, alb, extra = {}) => { const b = { x0, x1, y0, y1, z0, z1, alb, ...extra }; boxes.push(b); return b; };
      const clay = () => (r() < .12 ? [.74, .68, .58] : [.6 + r() * .14, .5 + r() * .1, .38 + r() * .08]);
      const lots = (xa, xb, za, zb) => {
        for (let z0 = za; z0 < zb - 3;) {
          const z1 = Math.min(zb, z0 + 6 + r() * 7);
          for (let x0 = xa; x0 < xb - 3;) {
            const x1 = Math.min(xb, x0 + 5 + r() * 7);
            if (r() < .07) { if (r() < .7) st.palms.push({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, h: 8 + r() * 5, ph: r() * 9 }); } else {
              const s = () => r() * .5, h = r() < .25 ? 5.5 + r() * 1.5 : 3 + r() * 1.6;
              const b = box(x0 + s(), x1 - s(), 0, h, z0 + s(), z1 - s(), clay(), { lit: r() < .06 });
              b.win = r() < .6 ? [[.2 + r() * .5, .5 + r() * .2]] : [];
            }
            x0 = x1 + (r() < .12 ? 1.2 : 0);
          }
          z0 = z1 + (r() < .2 ? 1.2 : 0);
        }
      };
      st.palms = [];
      const XL = [-150, -94, -66, -40, -34, -14, 14, 34, 62, 92, 150], ZL = [-140, -96, -66, -40, -16];
      for (let i = 0; i < XL.length - 1; i++) for (let j = 0; j < ZL.length - 1; j++) {
        const xa = XL[i] + 2.2, xb = XL[i + 1] - 2.2, za = ZL[j] + 2.2, zb = ZL[j + 1] - 2.2;
        if (xb - xa < 4) continue;
        lots(xa, xb, za, zb);
      }
      [[-150, -66], [64, 150]].forEach(([xa, xb]) => [[-10, 24], [28, 60], [64, 96], [100, 132]].forEach(([za, zb]) => lots(xa, xb, za, zb)));
      lots(-150, -30, 116, 170); lots(30, 150, 116, 170);
      box(-26, 26, 0, 10, 116, 158, [.62, .52, .4]); // the governor's house behind the qibla wall
      st.house = boxes.find((b) => b.x0 < HOUSE[0] && b.x1 > HOUSE[0] - 9 && b.z1 < HOUSE[1] + 1 && b.z1 > HOUSE[1] - 9) || null;
      const BR = [.66, .56, .44]; // fired brick and mud plaster
      box(-WX - 1.2, -2.3, 0, WALL, -1, ZN, BR, { wall: 1 }); box(2.3, WX + 1.2, 0, WALL, -1, ZN, BR, { wall: 1 });
      box(-2.3, 2.3, 5, WALL, -1, ZN, BR, { wall: 1 });
      box(-WX - 1.2, -WX, 0, WALL, ZN, ZQ, BR, { wall: 1 }); box(WX, WX + 1.2, 0, WALL, ZN, ZQ, BR, { wall: 1 });
      box(-WX - 1.2, WX + 1.2, 0, WALL, ZQ, ZQ + 1.2, BR, { wall: 1 });
      for (let k = -4; k <= 4; k++) { if (!k) continue; const x = k * 11.6; box(x - 1.1, x + 1.1, 0, WALL + .5, -2.5, -1, BR, { wall: 1 }); }
      for (let z = 8; z < ZQ; z += 11.6) { box(-WX - 2.7, -WX - 1.2, 0, WALL + .5, z - 1.1, z + 1.1, BR, { wall: 1 }); box(WX + 1.2, WX + 2.7, 0, WALL + .5, z - 1.1, z + 1.1, BR, { wall: 1 }); }
      st.hall = box(-WX, WX, 0, WALL - .2, ZH, ZQ, [.5, .42, .34], { hall: 1 });
      st.boxes = boxes;
      st.grove = []; for (let x = -3000, h = 10; x < 3000; x += 14 + r() * 20) { h = mix(h, 6 + r() * 16 + (x < 0 ? 6 : 0), .5); st.grove.push([x, h]); }
      // sleepers: in the courtyard and the hall, lights that kindle as he passes
      st.sleep = Array.from({ length: 58 }, (_, i) => {
        const hall = i > 41, x = (r() < .5 ? -1 : 1) * (2.4 + r() ** 1.3 * (hall ? 40 : 46)), z = hall ? 81 + r() * 21 : 8 + r() * 66;
        return { x, z, ph: r() * 9, a: .55 + r() * .45 };
      });
      st.crack = []; for (let k = 0, x = -.04, y = 0; k <= 46; k++) { st.crack.push([x, y + (k % 2 ? 1 : -1) * (.002 + r() * .01)]); x += .02 + r() * .012; y += .006 * (r() - .5); }
    },

    frame(p, t, el, st) {
      fit(st.cv);
      const c = st.ctx, W = st.cv.width, H = st.cv.height, W2 = W / 2;
      const pc = Math.min(1.05, Math.max(-.05, p));
      let [cx, cy, cz, tz, ys, kf] = spline(CAM, pc);
      // ---- beats, all from p ----
      const strike = seg(p, .371, .374), flash = p < .371 ? 0 : Math.exp(-(p - .371) / .009);
      const shake = p > .371 && p < .4 ? (1 - seg(p, .371, .4)) * .05 : 0;
      cx += shake * Math.sin(p * 1300); cy += shake * Math.cos(p * 1700);
      const port = H > W * 1.1;
      const F = (port ? W * 1.55 : Math.min(H * 1.02, W * 1.9)) * kf;
      const hy = ys * H - cy * F / (tz - cz);
      const X = (x, z) => W2 + (x - cx) * F / (z - cz);
      const Y = (y, z) => hy + (cy - y) * F / (z - cz);
      const dawn = smooth(seg(p, .76, .99)), predawn = .12 * smooth(seg(p, .4, .76));
      const fogC = mixc([12, 15, 30], [150, 136, 140], dawn);
      const fogOf = (d) => 1 - Math.exp(-d / mix(700, 900, dawn));
      const amb = {}; for (const k in AMB) amb[k] = mixc(AMB[k][0], AMB[k][1], Math.min(1, dawn + predawn));
      const fallen = smooth(seg(p, .376, .405));
      const kaabaA = smooth(seg(p, .64, .74));
      // Ali: walking, then at prayer in the mihrab; after the blow, lowered, still bright. The light at (ax, ay, az)
      // stays as the warmth he carries: it shades the hall, its pools lie on the floor, the flash comes from it
      const sW = lerpKeys(WALK_T, p);
      const [ax, az] = walkS(WALK, sW);
      const ay = mix(1.55, .62, fallen), aliI = 1 - .28 * fallen + .5 * strike * (1 - fallen);
      const aliOn = smooth(seg(p, -.02, .03));
      // the dark shape: comes from behind a column, gone soon after
      const shapeA = smooth(seg(p, .352, .368)) * (1 - smooth(seg(p, .385, .41)));
      const shapeX = mix(-2.9, -1.05, smooth(seg(p, .355, .371))) - 4 * smooth(seg(p, .38, .41)), shapeZ = 106.6;
      const swing = p > .371 ? .32 * (1 - seg(p, .371, .5)) * Math.sin((p - .371) * 140) : 0;
      const lampK = mix(1, .55, dawn) * (1 - .5 * flash) * (1 - .35 * seg(p, .371, .39) * (1 - seg(p, .6, .76)));

      // ---- lights ----
      const L = [];
      if (aliOn > 0 && cy < 7.8) L.push({ x: ax, y: ay, z: az, c: [1, .9, .72], i: 1.5 * aliOn * aliI, r2: 6 });
      const lamps = LAMPS.map((l, j) => {
        const sw = swing * (1 - j % 3 * .2) * (j % 2 ? 1 : -.8);
        const fk = .88 + .12 * Math.sin(t * 7.3 + j * 2.1) * Math.sin(t * 3.1 + j);
        return { x: l.x + Math.sin(sw) * 2.4, y: l.y + (1 - Math.cos(sw)) * 2.4, z: l.z, fk, j };
      });
      if (cy < 7.8) lamps.forEach((l) => L.push({ x: l.x, y: l.y - .1, z: l.z, c: [1, .6, .28], i: 1.05 * l.fk * lampK, r2: 7 }));
      if (flash > .02) L.push({ x: ax, y: 1.6, z: az - .3, c: [1, .45, .22], i: 9 * flash, r2: 60 });
      L.forEach((l) => { l.cut2 = l.r2 * l.i * 50; });
      const shade = (alb, a, nx, ny, nz, px, py, pz) => {
        let R = a[0], G = a[1], B = a[2];
        for (let k = 0; k < L.length; k++) {
          const l = L[k], dx = l.x - px, dy = l.y - py, dz = l.z - pz, d2 = dx * dx + dy * dy + dz * dz;
          if (d2 > l.cut2) continue;
          const d = Math.sqrt(d2) || 1, lam = ((nx * dx + ny * dy + nz * dz) / d + .15) / 1.15;
          if (lam <= 0) continue;
          const e = l.i * lam / (1 + d2 / l.r2);
          R += l.c[0] * e; G += l.c[1] * e; B += l.c[2] * e;
        }
        return [tone(alb[0] * R), tone(alb[1] * G), tone(alb[2] * B)];
      };
      const fogged = (col, d) => mixc(col, fogC, fogOf(d));
      // inside the hall the sky's light comes only from the courtyard, and fades with depth
      const sunA = smooth(seg(p, .8, 1)), sunX = mix(WX + 2, -6, sunA);
      const yard = (z) => (z <= ZH ? 1 : .28 + .72 * Math.exp(-(z - ZH) / 8));
      const ambAt = (a, z, extra = 0) => { const k = yard(z) + extra; return [a[0] * k, a[1] * k, a[2] * k]; };
      // the deep blue of the sky before dawn, coming in from the courtyard onto every face that looks back at it
      const coolK = (z) => (z <= ZH ? 1 : .26 + .74 * Math.exp(-(z - ZH) / 13)) * (1 - .55 * dawn);
      const front = (z) => { const a = ambAt(amb.front, z), k = coolK(z); return [a[0] + .1 * k, a[1] + .17 * k, a[2] + .42 * k]; };

      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      // ---- sky ----
      {
        const top = Math.min(0, hy - H * .8);
        const sky = c.createLinearGradient(0, top, 0, hy);
        sky.addColorStop(0, rgb(mixc([5, 8, 20], [52, 68, 108], dawn)));
        sky.addColorStop(.65, rgb(mixc([10, 15, 34], [118, 122, 150], dawn)));
        sky.addColorStop(1, rgb(mixc([22, 28, 50], [214, 178, 156], dawn)));
        c.fillStyle = sky; c.fillRect(0, 0, W, Math.max(0, hy) + 2);
        if (dawn > 0) { // the east is on the left
          const gx = W2 - F * .9, g = c.createRadialGradient(gx, hy, 0, gx, hy, W * 1.3);
          g.addColorStop(0, `rgba(255,190,130,${.75 * dawn * dawn})`); g.addColorStop(.5, `rgba(240,170,130,${.14 * dawn})`); g.addColorStop(1, 'rgba(240,170,130,0)');
          c.fillStyle = g; c.fillRect(0, 0, W, Math.max(0, hy) + 2);
        }
        const sa = 1 - .95 * dawn;
        if (sa > .02 && hy > 0) {
          c.fillStyle = 'rgb(232,228,214)';
          const sz = Math.max(1, H / 900);
          for (const [u, v, m, ph] of st.stars) {
            const x = W2 + u * W * .9, y = hy - v * H * 1.1; if (y < 0 || y > hy) continue;
            c.globalAlpha = Math.min(1, m * sa * (.7 + .3 * Math.sin(t * 1.4 + ph)) * c01((hy - y) / (H * .2)) * .8);
            c.fillRect(x, y, m > 1.2 ? 2 * sz : sz, m > 1.2 ? 2 * sz : sz);
          }
          c.globalAlpha = 1;
          // the moon of the nineteenth night: past full, high in the south-west, lit from the east (left)
          const mx = W2 + F * .08, my = hy - F * .17, mr = Math.max(4, F * .011);
          if (my > -mr && mx < W + mr) {
            c.globalCompositeOperation = 'lighter';
            c.globalAlpha = .35 * sa; c.drawImage(st.pale, mx - mr * 9, my - mr * 9, mr * 18, mr * 18);
            c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
            c.fillStyle = rgb(mixc([236, 230, 210], [200, 206, 220], dawn), sa); c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill();
            c.fillStyle = rgb(mixc([14, 18, 36], [120, 124, 150], dawn), .82 * sa); c.beginPath(); // the dark limb on the west side
            c.ellipse(mx + mr * .02, my, mr * .55, mr, 0, -Math.PI / 2, Math.PI / 2); c.arc(mx, my, mr, Math.PI / 2, -Math.PI / 2, true); c.fill();
          }
        }
      }
      // ---- helpers ----
      const poly = (pts) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };
      const quadXZ = (x0, x1, z0, z1, y, col) => { // a horizontal quad, clipped to stay in front of the lens
        z0 = Math.max(z0, cz + .3); if (z1 <= z0) return;
        poly([[X(x0, z0), Y(y, z0)], [X(x1, z0), Y(y, z0)], [X(x1, z1), Y(y, z1)], [X(x0, z1), Y(y, z1)]]);
        c.fillStyle = col; c.fill();
      };
      const halo = (x, y, R, img, a) => { if (a <= .01 || x + R < 0 || x - R > W || y + R < 0 || y - R > H) return; c.globalAlpha = Math.min(1, a); c.drawImage(img, x - R, y - R, R * 2, R * 2); c.globalAlpha = 1; };
      const pool = (x, z, R, img, a, y = 0) => {
        const d = z - cz; if (d < 1 || a <= .01) return;
        const sx = X(x, z), sy = Y(y, z), rx = R * F / d, ry = Math.max(2, Math.abs(Y(y, Math.max(cz + .6, z - R)) - Y(y, z + R)) / 2);
        if (sx + rx < 0 || sx - rx > W || sy - ry > H || sy + ry < 0) return;
        c.globalAlpha = Math.min(1, a * Math.min(1, W * .35 / rx)); c.drawImage(img, sx - rx, sy - ry, rx * 2, ry * 2); c.globalAlpha = 1;
      };
      const ambOnly = (alb, a) => [tone(alb[0] * a[0]), tone(alb[1] * a[1]), tone(alb[2] * a[2])];
      const wakeOf = (s) => { const reach = s.z < ZH ? az - s.z + 3 : (az > s.z - 4 ? az - s.z + 4 : -1); return c01(reach / 5) * (sW > 70 ? 1 : 0); };
      // Ali as a veiled figure (scenes/holy.js), 1.8 m, never under 22 css px: he walks (the stride fitted so the
      // last step lands with the cloak still), then qiyam, ruku, qiyam, sujud in the mihrab, facing right with his
      // back to the dark shape; the blow comes in the sujud, and as he falls he is lowered to sit (two draws crossfaded)
      const PRAY = [[.345, 'stand'], [.352, 'ruku'], [.358, 'stand'], [.3615, 'sujud']];
      const steps = Math.round(WALK.len / 1.5);
      let aliHead = null;
      const aliFig = () => {
        const d = az - cz; if (d < .6 || aliOn <= 0) return;
        const h = Math.max(22 * W / st.cv.clientWidth, 1.8 * F / d), x = X(ax, az), y = Y(0, az);
        if (x < -h || x > W + h || y - h > H || y < 0) return;
        const draw = (pose, a) => (a > .01 ? Holy.draw(c, { who: 'ali', pose, phase: sW / WALK.len * steps, x, y, h, t, amb: .28 + .5 * dawn, alpha: aliOn * a }) : null);
        if (p < PRAY[0][0]) { aliHead = draw('walk', 1); return; }
        let i = PRAY.length - 1; while (i > 0 && p < PRAY[i][0]) i--;
        const k = c01((p - PRAY[i][0]) / .0015), was = i ? PRAY[i - 1][1] : 'walk';
        const a = draw(was, (1 - k) * (1 - fallen)), b = draw(PRAY[i][1], k * (1 - fallen)), s = draw('sit', fallen);
        aliHead = fallen > .5 ? s : k > .5 ? b : a;
      };

      if (cy >= 7.8) exterior(); else interior();

      // ---- air glow ----
      c.globalCompositeOperation = 'lighter';
      if (aliOn > 0 && az - cz > .8) {
        const d = az - cz, sx = X(ax, az), sy = Y(ay, az), s = F / d;
        if (sW < WALK.len - .5 && sW > 0 && cy > 7.8) for (let k = 1; k <= 9; k++) { // his way through the lanes, a fading wake
          const [qx, qz] = walkS(WALK, sW - k * 2.2), dq = qz - cz;
          if (dq > 2) halo(X(qx, qz), Y(.5, qz), 2.8 * F / dq, st.pale, .18 * (1 - k / 10) * aliOn);
        }
        if (aliHead) { // the warmth he carries, and a soft bloom at the disc, more at night
          const big = Math.min(W * .3, 9 * s);
          halo(aliHead.x, aliHead.y, big, st.pale, .22 * aliOn * aliI * Math.min(1, W * .12 / big));
          halo(aliHead.x, aliHead.y, Math.max(8, aliHead.r * 6), st.pale, (.3 + .2 * (1 - dawn)) * aliOn * aliI);
        }
        if (flash > .01) { halo(sx, sy, Math.min(W * 1.2, 30 * s), st.red, .9 * flash); halo(sx, sy, Math.min(W * .4, 6 * s), st.glow, flash); }
      }
      c.globalCompositeOperation = 'source-over';
      // the crack of light: one jagged line through the frame at the blow, fading to a thin red trace
      const ck = seg(p, .371, .375), cf = p < .371 ? 0 : (1 - seg(p, .376, .405)) * .85 + .15 * (1 - seg(p, .39, .43));
      if (ck > 0 && cf > .01 && aliOn > 0) {
        const ox = X(ax, az), oy = Y(ay + .3, az), ang = -.38, L2 = Math.hypot(W, H) * .75;
        const pts = st.crack.map(([u, v]) => { const s0 = (u - .5) * 2 * L2 * ck, n = v * H; return [ox + Math.cos(ang) * s0 - Math.sin(ang) * n, oy + Math.sin(ang) * s0 + Math.cos(ang) * n]; });
        c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round';
        [[40, `rgba(170,40,30,${.22 * cf})`], [14, `rgba(230,80,50,${.45 * cf})`], [5, `rgba(255,170,110,${.8 * cf})`], [2, `rgba(255,246,230,${cf})`]].forEach(([w, col]) => {
          c.strokeStyle = col; c.lineWidth = w * H / 900; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
        });
        c.globalCompositeOperation = 'source-over';
      }
      // grade: the red wash after the blow, grain, vignette
      const wash = flash * .55 + .28 * seg(p, .371, .38) * (1 - seg(p, .4, .55));
      if (wash > .01) {
        const g = c.createRadialGradient(W2, H * .5, 0, W2, H * .5, Math.hypot(W, H) * .6);
        g.addColorStop(0, `rgba(164,50,43,${.25 * wash})`); g.addColorStop(1, `rgba(60,6,6,${.85 * wash})`);
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      }
      c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(st.noise, 'repeat'); c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      const vg = c.createRadialGradient(W2, H * .52, Math.min(W, H) * .25, W2, H * .52, Math.hypot(W, H) * .7);
      vg.addColorStop(0, 'rgba(4,5,10,0)'); vg.addColorStop(1, `rgba(4,5,10,${.62 - .28 * dawn})`);
      c.fillStyle = vg; c.fillRect(0, 0, W, H);

      // ================= the view from above: the town and the mosque as boxes =================
      function exterior() {
        const g0 = Math.max(0, hy);
        const gg = c.createLinearGradient(0, g0, 0, H);
        gg.addColorStop(0, rgb(mixc(fogC, [8, 9, 14], .4))); gg.addColorStop(1, rgb(ambOnly([.36, .31, .26], amb.top)));
        c.fillStyle = gg; c.fillRect(0, g0, W, H - g0);
        { // a far line of palm groves
          const zg = 900; c.fillStyle = rgb(mixc([6, 8, 14], fogC, .55)); c.beginPath(); c.moveTo(0, Y(0, zg));
          for (const [x, h] of st.grove) { const sx = X(x - 400, zg); if (sx < -20 || sx > W + 20) continue; c.lineTo(sx, Y(h, zg)); }
          c.lineTo(W, Y(0, zg)); c.closePath(); c.fill();
        }
        yardFloor();
        const items = [];
        const dist = (b) => { const dx = cx < b.x0 ? b.x0 - cx : cx > b.x1 ? cx - b.x1 : 0, dz = cz < b.z0 ? b.z0 - cz : 0; return Math.hypot(dx, dz) + (b.z1 - b.z0) * .001; };
        for (const b of st.boxes) { if (b.z0 - cz < 1.2) continue; items.push([dist(b), b]); }
        st.palms.forEach((pm) => items.push([Math.hypot(pm.x - cx, pm.z - cz), pm]));
        items.sort((m, n) => n[0] - m[0]);
        c.globalCompositeOperation = 'lighter';
        st.sleep.forEach((s) => { const w = wakeOf(s); if (w > 0 && s.z < ZH) pool(s.x, s.z, 2.4, st.fire, .25 * w); });
        if (aliOn > 0) pool(ax, az, 12, st.pale, .3 * aliOn);
        c.globalCompositeOperation = 'source-over';
        for (const [, b] of items) (b.h ? palm(b) : drawBox(b));
        aliFig(); // over the roofs: from this height the lanes would hide him, as they never hid the light
        // the sleepers who wake in the courtyard: small lights at the floor
        c.globalCompositeOperation = 'lighter';
        st.sleep.forEach((s) => { const w = wakeOf(s); if (w <= 0 || s.z > ZH) return; const d = s.z - cz; if (d < 2) return; halo(X(s.x, s.z), Y(.5 + .4 * w, s.z), Math.max(2, .9 * F / d), st.fire, .7 * w * s.a); });
        c.globalCompositeOperation = 'source-over';
      }
      function palm(pm) {
        const d = pm.z - cz; if (d < 2) return;
        const s = F / d, bx = X(pm.x, pm.z), by = Y(0, pm.z);
        if (bx < -12 * s || bx > W + 12 * s || by < 0) return;
        const tx = bx + .06 * Math.sin(pm.ph) * pm.h * s, ty = Y(pm.h, pm.z);
        c.strokeStyle = rgb(mixc(mixc([10, 11, 16], [60, 56, 50], dawn), fogC, fogOf(d))); c.lineCap = 'round';
        c.lineWidth = Math.max(1, .35 * s); c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx, (by + ty) / 2, tx, ty); c.stroke();
        c.lineWidth = Math.max(1, .16 * s); c.beginPath();
        for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + pm.ph, ex = tx + Math.cos(a) * 3 * s, ey = ty - Math.sin(a) * s + 1.6 * s; c.moveTo(tx, ty); c.quadraticCurveTo((tx + ex) / 2, ty - 1.1 * s, ex, ey); }
        c.stroke();
      }
      function drawBox(b) {
        const d0 = b.z0 - cz;
        const xl0 = X(b.x0, b.z0), xr0 = X(b.x1, b.z0);
        if ((xr0 < -50 && X(b.x1, b.z1) < -50) || (xl0 > W + 50 && X(b.x0, b.z1) > W + 50)) return;
        const yb0 = Y(b.y0, b.z0), yt0 = Y(b.y1, b.z0), yt1 = Y(b.y1, b.z1);
        if (yt1 > H + 20 || yb0 < -20) return;
        const f = fogOf(d0), ym = (b.y0 + b.y1) / 2, fc = (col) => mixc(col, fogC, f);
        if (cx > b.x1 || cx < b.x0) {
          const xs = cx > b.x1 ? b.x1 : b.x0, n = cx > b.x1 ? 1 : -1;
          const col = fc(shade(b.alb, n > 0 ? amb.west : amb.east, n, 0, 0, xs, ym, (b.z0 + b.z1) / 2));
          poly([[X(xs, b.z0), yb0], [X(xs, b.z1), Y(b.y0, b.z1)], [X(xs, b.z1), yt1], [X(xs, b.z0), yt0]]); c.fillStyle = rgb(col); c.fill();
        }
        if (cy > b.y1) {
          const top = fc(shade(b.alb, amb.top, 0, 1, 0, (b.x0 + b.x1) / 2, b.y1, (b.z0 + b.z1) / 2));
          poly([[xl0, yt0], [xr0, yt0], [X(b.x1, b.z1), yt1], [X(b.x0, b.z1), yt1]]); c.fillStyle = rgb(top); c.fill();
          if (b.hall) { // the roof of the hall: palm-trunk beams under packed earth, their lines running to the qibla
            c.strokeStyle = rgb(mixc(top, [0, 0, 0], .2), .5); c.lineWidth = 1; c.beginPath();
            for (let x = b.x0 + 3; x < b.x1; x += 6) { c.moveTo(X(x, b.z0), yt0); c.lineTo(X(x, b.z1), yt1); }
            c.stroke();
          } else if (!b.wall && d0 < 160 && (b.x1 - b.x0) * F / d0 > 12) {
            const e = .3, yi0 = Y(b.y1, b.z0 + e), yi1 = Y(b.y1, b.z1 - e);
            poly([[X(b.x0 + e, b.z0 + e), yi0], [X(b.x1 - e, b.z0 + e), yi0], [X(b.x1 - e, b.z1 - e), yi1], [X(b.x0 + e, b.z1 - e), yi1]]);
            c.fillStyle = rgb(mixc(top, [0, 0, 0], .2)); c.fill();
          }
        }
        const cA = fc(shade(b.alb, amb.front, 0, 0, -1, b.x0 + .3, ym, b.z0)), cB = fc(shade(b.alb, amb.front, 0, 0, -1, b.x1 - .3, ym, b.z0));
        poly([[xl0, yb0], [xr0, yb0], [xr0, yt0], [xl0, yt0]]);
        if (Math.abs(cA[0] - cB[0]) + Math.abs(cA[1] - cB[1]) > 8 && xr0 - xl0 > 2) { const g = c.createLinearGradient(xl0, 0, xr0, 0); g.addColorStop(0, rgb(cA)); g.addColorStop(1, rgb(cB)); c.fillStyle = g; } else c.fillStyle = rgb(cA);
        c.fill();
        const fw = xr0 - xl0, hh = yb0 - yt0;
        if (hh > 6 && d0 < 200) { c.globalAlpha = .5; c.drawImage(st.ao, xl0, yb0 - hh * .45, fw, hh * .45); c.globalAlpha = 1; }
        if (b.hall) { // the open front of the hall: dark bays between the columns, warm with the lamps inside
          const s = F / d0;
          for (let x = -WX + .2; x < WX - 1; x += 6) {
            const x0 = X(x + .35 + ((x + 3) % 6 === 0 ? 0 : 0), b.z0), x1 = X(x + 5.65, b.z0);
            const y0 = Y(0, b.z0), y1 = Y(COLH, b.z0);
            c.fillStyle = rgb(mixc([16, 11, 10], fogC, f * .6)); c.fillRect(x0, y1, x1 - x0, y0 - y1);
          }
          c.globalCompositeOperation = 'lighter';
          for (let x = -48; x <= 48; x += 12) halo(X(x, b.z0 + 1), Y(4, b.z0 + 1), 3.2 * s, st.fire, .4 * lampK);
          c.globalCompositeOperation = 'source-over';
        }
        if (!b.wall && !b.hall && b.win && fw > 8 && d0 < 220) {
          b.win.forEach(([u, v]) => { c.fillStyle = b.lit ? 'rgba(255,170,90,.75)' : rgb(mixc([10, 9, 12], fogC, f)); c.fillRect(xl0 + u * fw, yb0 - (v + .14) * hh, Math.max(1, .07 * fw), Math.max(1, .16 * hh)); });
        }
        if (b === st.house) { // his door, open, the lamp-light behind it
          const s = F / d0, dx = X(HOUSE[0], b.z0);
          c.globalCompositeOperation = 'lighter'; halo(dx, Y(1, b.z0), 3 * s, st.fire, .35 * (1 - seg(p, .06, .14))); c.globalCompositeOperation = 'source-over';
        }
      }

      // ================= inside: the courtyard and the columned hall =================
      function interior() {
        const nz = cz + .35;
        // side walls of the courtyard and the hall (inner faces), and the courtyard floor
        const wallCol = (n, z) => fogged(shade([.66, .56, .44], ambAt(n > 0 ? amb.west : amb.east, z, z > ZH ? 0 : .3).map((v) => v * (n < 0 ? 1 : 1 - .75 * dawn * c01((ZH - z) / 20 + .2))), n, 0, 0, n > 0 ? -WX : WX, 3, z), z - cz);
        [[-WX, 1], [WX, -1]].forEach(([xw, n]) => {
          const segs = [[Math.max(ZN, nz), ZH, WALL], [Math.max(ZH, nz), ZQ, CEIL]];
          segs.forEach(([z0, z1, h]) => {
            if (z1 <= z0) return;
            const cA = wallCol(n, z0), cB = wallCol(n, z1), x0 = X(xw, z0), x1 = X(xw, z1);
            poly([[x0, Y(0, z0)], [x1, Y(0, z1)], [x1, Y(h, z1)], [x0, Y(h, z0)]]);
            const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, rgb(cA)); g.addColorStop(1, rgb(cB)); c.fillStyle = g; c.fill();
          });
        });
        // floors: the courtyard under the sky, the hall's floor of reed mats
        if (nz < ZH) yardFloor();
        {
          const z0 = Math.max(ZH, nz);
          const g = c.createLinearGradient(0, Y(0, ZQ), 0, Y(0, z0));
          g.addColorStop(0, rgb(ambOnly([.62, .5, .34], ambAt(amb.front, ZQ)))); g.addColorStop(1, rgb(ambOnly([.62, .5, .34], ambAt(amb.top, z0, .1))));
          quadXZ(-WX, WX, z0, ZQ, 0, g);
          c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; c.beginPath(); // the seams of the mats
          for (let z = Math.ceil(z0); z < ZQ; z += 1.6) { c.moveTo(X(-WX, z), Y(0, z)); c.lineTo(X(WX, z), Y(0, z)); }
          c.stroke();
          if (ZH + 18 > z0) { // blue from the courtyard lies on the first bays of the floor
            const k = coolK(z0), yA = Y(0, Math.max(z0, ZH)), yB = Y(0, Math.max(z0 + .5, ZH + 18));
            const cg = c.createLinearGradient(0, yA, 0, yB);
            cg.addColorStop(0, `rgba(70,104,180,${.3 * k})`); cg.addColorStop(1, 'rgba(70,104,180,0)');
            c.globalCompositeOperation = 'lighter'; quadXZ(-WX, WX, z0, ZH + 18, 0, cg); c.globalCompositeOperation = 'source-over';
          }
        }
        // light on the floor
        c.globalCompositeOperation = 'lighter';
        lamps.forEach((l) => pool(l.x, l.z, 6, st.fire, .5 * l.fk * lampK));
        if (aliOn > 0) pool(ax, az, 8, st.pale, .75 * aliOn * aliI);
        if (flash > .02) pool(ax, az, 22, st.red, .9 * flash);
        if (dawn > .01 && nz < ZH) {
          const sun = sunA, xs = sunX;
          if (xs < WX) {
            const g = c.createLinearGradient(X(xs, 40), 0, X(WX, 40), 0);
            g.addColorStop(0, `rgba(255,160,90,${.3 * sun})`); g.addColorStop(.03, `rgba(255,186,120,${.4 * sun})`); g.addColorStop(1, `rgba(255,210,160,${.3 * sun})`);
            c.globalCompositeOperation = 'lighter'; quadXZ(xs, WX, Math.max(ZN, nz), ZH, 0, g); c.globalCompositeOperation = 'source-over';
          }
        }
        c.globalCompositeOperation = 'source-over';
        // the ceiling: timber laid on beams, seen from below
        if (cy < CEIL) {
          const z0 = Math.max(ZH, nz), top = ambOnly([.36, .27, .2], ambAt(amb.front, (z0 + ZQ) / 2, .05));
          quadXZ(-WX, WX, z0, ZQ, CEIL, rgb(top));
          c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1; c.beginPath();
          for (let x = -WX + 1.5; x < WX; x += 1.5) { c.moveTo(X(x, z0), Y(CEIL, z0)); c.lineTo(X(x, ZQ), Y(CEIL, ZQ)); }
          c.stroke();
          c.globalCompositeOperation = 'lighter';
          lamps.forEach((l) => pool(l.x, l.z, 4, st.fire, .22 * l.fk * lampK, CEIL));
          if (aliOn > 0 && az > ZH) pool(ax, az, 7, st.pale, .2 * aliOn, CEIL);
          c.globalCompositeOperation = 'source-over';
        }
        // the qibla wall and the mihrab
        qibla();
        // rows of columns from the qibla wall forward; lights and lamps fall between them
        const items = [];
        lamps.forEach((l) => items.push([l.z, () => lamp(l)]));
        st.sleep.forEach((s) => { const w = wakeOf(s); if (w > 0) items.push([s.z, () => sleeper(s, w)]); });
        if (shapeA > 0) items.push([shapeZ, () => shadowShape()]);
        if (aliOn > 0) items.push([az, aliFig]);
        items.sort((m, n) => n[0] - m[0]);
        let ii = 0;
        for (const rz of ROWS) {
          while (ii < items.length && items[ii][0] > rz) items[ii++][1]();
          if (rz - cz > .5) row(rz);
        }
        while (ii < items.length) items[ii++][1]();
        // the front edge of the roof, seen from the courtyard
        if (ZH - cz > .5) {
          const col = rgb(fogged(shade([.5, .42, .34], amb.front, 0, 0, -1, 0, 7.6, ZH), ZH - cz));
          c.fillStyle = col; c.fillRect(X(-WX, ZH), Y(WALL - .2, ZH), X(WX, ZH) - X(-WX, ZH), Y(CEIL - .4, ZH) - Y(WALL - .2, ZH));
        }
      }
      function yardFloor() {
        const g = c.createLinearGradient(0, Y(0, ZH), 0, H);
        g.addColorStop(0, rgb(fogged(ambOnly([.6, .54, .46], mixc(amb.top, amb.front, .3)), ZH - cz))); g.addColorStop(1, rgb(ambOnly([.62, .56, .48], amb.top)));
        quadXZ(-WX, WX, ZN, ZH, 0, g);
        c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = .6; c.fillStyle = c.createPattern(st.noise, 'repeat'); c.fill(); c.fill(); c.restore();
        st.sleep.forEach((s) => { // reed mats
          if (s.z > ZH || s.z - cz < 1) return;
          const w = wakeOf(s), x0 = s.x - .5, x1 = s.x + .5, z0 = s.z - .9, z1 = s.z + .9;
          const col = ambOnly([.5, .42, .3], mixc(amb.top, [1.4, .9, .5], .25 * w));
          if (z0 - cz > .5) { poly([[X(x0, z0), Y(.02, z0)], [X(x1, z0), Y(.02, z0)], [X(x1, z1), Y(.02, z1)], [X(x0, z1), Y(.02, z1)]]); c.fillStyle = rgb(fogged(col, s.z - cz)); c.fill(); }
        });
      }
      function row(rz) {
        const d = rz - cz, s = F / d, f = fogOf(d);
        const xs = COLX.filter((x) => { const sx = X(x, rz); return sx > -2 * s && sx < W + 2 * s; }).sort((a, b) => Math.abs(b - cx) - Math.abs(a - cx));
        const yb = Y(0, rz), yt = Y(COLH, rz);
        for (const x of xs) {
          const x0 = X(x - CR, rz), x1 = X(x + CR, rz);
          const a = front(rz), ae = ambAt(amb.east, rz), aw = ambAt(amb.west, rz);
          const marble = [.86, .82, .74];
          const cl = mixc(shade(marble, ae, -1, 0, 0, x - CR, 2.4, rz), fogC, f), cm = mixc(shade(marble, a, 0, 0, -1, x, 2.4, rz - CR), fogC, f), cr = mixc(shade(marble, aw, 1, 0, 0, x + CR, 2.4, rz), fogC, f);
          const sk = rz < 80 ? sunA * c01((x - sunX) / 3) : 0;
          const g = c.createLinearGradient(x0, 0, x1, 0);
          if (sk > 0) { cl[0] = mix(cl[0], 255, .6 * sk); cl[1] = mix(cl[1], 196, .6 * sk); cl[2] = mix(cl[2], 130, .6 * sk); }
          g.addColorStop(0, rgb(mixc(cl, [0, 0, 0], .25 * (1 - sk)))); g.addColorStop(.3, rgb(mixc(cl, cm, .6))); g.addColorStop(.6, rgb(cm)); g.addColorStop(1, rgb(mixc(cr, [0, 0, 0], .25)));
          c.fillStyle = g; c.fillRect(x0, yt, x1 - x0, yb - yt);
          // base and capital, a little wider
          const w = (x1 - x0) * .32, bh = .35 * s, ch = .4 * s;
          c.fillStyle = rgb(mixc(cm, [0, 0, 0], .2)); c.fillRect(x0 - w, yb - bh, x1 - x0 + 2 * w, bh);
          c.fillStyle = rgb(mixc(cm, [0, 0, 0], .1)); c.fillRect(x0 - w * 1.2, yt, x1 - x0 + 2.4 * w, ch);
          if (yb - yt > 8) { c.globalAlpha = .45; c.drawImage(st.ao, x0, yb - (yb - yt) * .3, x1 - x0, (yb - yt) * .3); c.globalAlpha = 1; }
        }
        // the beam that runs along the row on the column heads
        if (cy < CEIL) {
          const under = mixc(shade([.42, .3, .2], ambAt(amb.front, rz), 0, -1, 0, cx, COLH, rz), fogC, f);
          poly([[X(-WX, rz - .22), Y(COLH, rz - .22)], [X(WX, rz - .22), Y(COLH, rz - .22)], [X(WX, rz + .22), Y(COLH, rz + .22)], [X(-WX, rz + .22), Y(COLH, rz + .22)]]);
          c.fillStyle = rgb(under); c.fill();
        }
        const fr = mixc(shade([.42, .3, .2], front(rz), 0, 0, -1, cx, 6.7, rz - .22), fogC, f);
        c.fillStyle = rgb(fr); c.fillRect(X(-WX, rz - .22), Y(CEIL, rz - .22), X(WX, rz - .22) - X(-WX, rz - .22), Y(COLH, rz - .22) - Y(CEIL, rz - .22));
      }
      function qibla() {
        const z = ZQ, d = z - cz; if (d < .5) return;
        const f = fogOf(d), plaster = [.7, .6, .48];
        const g = c.createLinearGradient(X(-WX, z), 0, X(WX, z), 0);
        const xa = Math.max(-WX, cx - (W2 / F) * d * 1.1), xb = Math.min(WX, cx + (W2 / F) * d * 1.1);
        for (let i = 0; i <= 16; i++) { const x = mix(xa, xb, i / 16); g.addColorStop(c01((X(x, z) - X(-WX, z)) / (X(WX, z) - X(-WX, z))), rgb(mixc(shade(plaster, ambAt(amb.front, z), 0, 0, -1, x, 2.2, z), fogC, f))); }
        c.fillStyle = g; c.fillRect(X(-WX, z), Y(CEIL, z), X(WX, z) - X(-WX, z), Y(0, z) - Y(CEIL, z));
        { const v = c.createLinearGradient(0, Y(CEIL, z), 0, Y(0, z)); v.addColorStop(0, 'rgba(8,6,8,.55)'); v.addColorStop(.35, 'rgba(8,6,8,0)'); v.addColorStop(.85, 'rgba(8,6,8,0)'); v.addColorStop(1, 'rgba(8,6,8,.45)'); c.fillStyle = v; c.fillRect(X(-WX, z), Y(CEIL, z), X(WX, z) - X(-WX, z), Y(0, z) - Y(CEIL, z)); }
        // the niche: a recess in the wall, round-headed, deeper in shadow
        const s = F / d, nx0 = X(-NICHE.w, z), nx1 = X(NICHE.w, z), ny0 = Y(0, z), nys = Y(NICHE.spring, z), R = NICHE.w * s;
        const nichePath = (grow = 0) => { c.beginPath(); c.moveTo(nx0 - grow, ny0); c.lineTo(nx0 - grow, nys); c.arc((nx0 + nx1) / 2, nys, R + grow, Math.PI, 0); c.lineTo(nx1 + grow, ny0); c.closePath(); };
        nichePath(.18 * s); c.fillStyle = rgb(mixc(shade(plaster, ambAt(amb.front, z, .1), 0, 0, -1, 0, 2, z - .3), [255, 240, 210], .06)); c.fill();
        nichePath();
        const ng = c.createLinearGradient(0, nys - R, 0, ny0);
        const inner = shade([.5, .42, .34], ambAt(amb.front, z, -.05), 0, 0, -1, 0, 1.6, z + .6);
        ng.addColorStop(0, rgb(mixc(inner, [0, 0, 0], .55))); ng.addColorStop(1, rgb(mixc(inner, [0, 0, 0], .2)));
        c.fillStyle = ng; c.fill();
        if (kaabaA > 0) { // the Kaaba, faint, deep in the niche
          const kw = .62 * s, kh = .66 * s, kx = (nx0 + nx1) / 2, ky = Y(1.15, z);
          c.save(); nichePath(); c.clip();
          c.globalCompositeOperation = 'lighter'; halo(kx, ky - kh * .5, kw * 2.6, st.pale, .5 * kaabaA); c.globalCompositeOperation = 'source-over';
          c.globalAlpha = .85 * kaabaA; c.fillStyle = '#060506'; c.fillRect(kx - kw / 2, ky - kh, kw, kh);
          c.fillStyle = 'rgba(232,196,110,.9)'; c.fillRect(kx - kw / 2, ky - kh * .78, kw, Math.max(1, kh * .07));
          c.strokeStyle = 'rgba(243,217,143,.35)'; c.lineWidth = Math.max(1, s * .012); c.strokeRect(kx - kw / 2, ky - kh, kw, kh);
          c.globalAlpha = 1; c.restore();
        }
      }
      function lamp(l) {
        const d = l.z - cz; if (d < .6) return;
        const s = F / d, x = X(l.x, l.z), y = Y(l.y, l.z), top = Y(CEIL, l.z), ax0 = X(LAMPS[l.j].x, l.z);
        if (x < -40 || x > W + 40) return;
        const f = fogOf(d);
        c.strokeStyle = rgb(mixc([40, 30, 20], fogC, f), .8); c.lineWidth = Math.max(.6, .025 * s);
        c.beginPath(); c.moveTo(ax0, top); c.lineTo(x, y - .12 * s); c.stroke();
        c.fillStyle = rgb(mixc([90, 64, 34], fogC, f)); c.beginPath(); c.ellipse(x, y, .16 * s, .07 * s, 0, 0, Math.PI); c.fill();
        c.globalCompositeOperation = 'lighter';
        halo(x, y - .08 * s, Math.max(3, .9 * s), st.fire, .85 * l.fk * lampK);
        halo(x, y - .06 * s, Math.max(1.5, .14 * s), st.glow, .9 * lampK);
        halo(x, y, Math.min(W * .3, 3 * s), st.fire, .1 * l.fk * lampK);
        c.globalCompositeOperation = 'source-over';
      }
      function sleeper(s, w) {
        const d = s.z - cz; if (d < .6) return;
        c.globalCompositeOperation = 'lighter';
        halo(X(s.x, s.z), Y(.35 + .45 * w, s.z), Math.max(2, .55 * F / d), st.fire, .6 * w * s.a * (1 - .5 * dawn));
        c.globalCompositeOperation = 'source-over';
      }
      function shadowShape() {
        const d = shapeZ - cz; if (d < .6) return;
        const s = F / d, x = X(shapeX, shapeZ), y = Y(1.05, shapeZ);
        c.globalAlpha = .9 * shapeA; c.drawImage(st.dark, x - .55 * s, y - 1.2 * s, 1.1 * s, 2.4 * s); c.globalAlpha = 1;
      }
    },
  };
})();
