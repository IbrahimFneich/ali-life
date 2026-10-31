// ليلة المبيت: Mecca at night seen from above. Torches from every clan ring one house; a calm light leaves
// through the ring; at dawn they rush in, the wool izar is thrown back and a single light rises from the bed.
// World in metres: x right (west), y up, z away from the camera (south). Zero-pitch camera with a shift lens,
// so verticals stay vertical and painter order is plain distance. Nobody is drawn: people are lights.
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
    const c = document.createElement('canvas');
    c.width = c.height = n;
    const g = c.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    stops.forEach(([o, col]) => gr.addColorStop(o, col));
    g.fillStyle = gr; g.fillRect(0, 0, n, n);
    return c;
  };
  // a polyline walked at constant speed; points are [x, z]
  const path = (pts) => { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, len: cum[cum.length - 1] }; };
  const walk = (P, u) => {
    const s = c01(u) * P.len;
    let i = 1;
    while (i < P.pts.length - 1 && P.cum[i] < s) i++;
    const a = P.pts[i - 1], b = P.pts[i], k = c01((s - P.cum[i - 1]) / ((P.cum[i] - P.cum[i - 1]) || 1));
    return [mix(a[0], b[0], k), mix(a[1], b[1], k)];
  };

  // camera: [p, x, height, z, target z on the ground, target row on screen, focal]. The reveal is a long lens from
  // low over the north wing: only a shallow line of sight passes under the eave of the open room to the bed.
  const CAM = [
    [-.05, 0, 84, -205, 16, .66, 1.22], [0, 0, 84, -203, 16, .66, 1.22], [.15, -3, 76, -188, 12, .65, 1.22], [.3, -1, 68, -166, 8, .64, 1.2],
    [.45, 2, 50, -118, 3, .63, 1.3], [.53, 5, 47, -110, 6, .62, 1.32], [.6, 5, 47, -112, 14, .6, 1.25], [.68, 2, 46, -108, 6, .62, 1.15], [.76, 0, 36, -96, 5, .62, 1.3],
    [.81, 0, 20, -44, 7, .6, 1.3], [.838, -.3, 8.6, -12, 9.4, .58, 1.32], [.855, -.3, 6.4, -6.6, 9.4, .58, 1.35], [.878, -.3, 6.3, -6.2, 9.3, .57, 1.36],
    [.9, 0, 11, -24, 7, .6, 1.25], [.93, 0, 26, -70, 7, .62, 1.15],
    [.97, 0, 46, -130, 10, .65, 1.2], [1, 0, 60, -168, 14, .67, 1.08], [1.05, 0, 60, -170, 14, .67, 1.08],
  ];
  const XS = [-152, -128, -104, -80, -58, -36, -14, 14, 36, 58, 82, 106, 130, 154];
  const ZS = [-150, -124, -100, -74, -48, -24, 15, 40, 64, 90, 118, 148, 182, 220, 262, 310];
  const valley = (z) => 104 + Math.max(0, z) * .16 + 14 * Math.sin(z * .029 + 1) + 8 * Math.sin(z * .071); // the city keeps to the valley floor
  const LANE = XS.map((x, i) => ({ a: Math.abs(x) < 20 ? 4 : 5 + ((i * 7919) % 13) * .5, f: .011 + ((i * 31) % 7) * .0016, ph: i * 2.3, hw: Math.abs(x) < 20 ? 2 : 1.5 + ((i * 17) % 5) * .22 }));
  const lane = (i, z) => XS[i] + LANE[i].a * Math.sin(z * LANE[i].f + LANE[i].ph) * smooth(c01((Math.abs(z) - 28) / 90));
  const JOG = (i, j) => (Math.abs(ZS[j]) < 52 ? 0 : (((i * 37 + j * 101) % 9) - 4) * 1.1);
  const run = (i, za, zb, dx = 0) => { const n = Math.max(1, Math.ceil(Math.abs(zb - za) / 6)), out = []; for (let k = 0; k <= n; k++) { const z = mix(za, zb, k / n); out.push([lane(i, z) + dx, z]); } return out; };
  const KAABA = { x: 66, z: 156, open: [38, 96, 122, 192] };
  const BED = { x: -.4, z: 9.72, hl: 1.05, hw: .52, y: .62 };
  const LAMP = [1.95, 1.18, 11.12];
  const DOOR_OUT = [0, -12.6], DOOR_IN = [0, -6.4];
  const PROPHET = path([[2.6, .6], [1.2, -2.6], [0, -6.4], [1.6, -10.4], [7.4, -14.6], [15.2, -10.5], ...run(7, 2, 240, 1.2)]);
  const TORCH = [
    { slot: [-8.5, -11.6], from: [...run(6, -150, -27), [-9, -16]] },
    { slot: [-3.2, -11.4], from: [[-160, -24], [-14, -24], [-5, -17]] },
    { slot: [3.2, -11.4], from: [...run(7, -150, -28), [5, -17]] },
    { slot: [8.6, -11.6], from: [[160, -48], ...run(8, -48, -24), [14, -24], [10, -16]] },
    { slot: [12.9, -2], from: [[160, -24], [14.5, -24], [13.6, -10]] },
    { slot: [12.9, 7], from: [...run(9, 210, 40), [14.5, 40], [14, 15]] },
    { slot: [7, 14.3], from: [...run(7, 290, 15)] },
    { slot: [0, 14.8], from: [...run(5, 250, 15), [-14, 15]] },
    { slot: [-7, 14.3], from: [...run(6, 180, 15)] },
    { slot: [-12.9, 7], from: [[-160, 40], [-14.5, 40], [-14, 15]] },
    { slot: [-12.9, -2], from: [...run(4, 130, -24), [-14.5, -24], [-13.6, -10]] },
  ];
  const AMB = { // ambient light per face direction: night, dawn
    top: [[.17, .21, .4], [.62, .58, .6]], front: [[.045, .055, .1], [.25, .26, .32]],
    east: [[.052, .064, .115], [.62, .44, .32]], west: [[.036, .046, .09], [.2, .22, .3]],
  };

  S.mabit = {
    init(el, st) {
      st.cv = el.querySelector('canvas');
      st.ctx = st.cv.getContext('2d');
      const r = rng(632);
      st.glow = sprite([[0, 'rgba(255,255,255,1)'], [.18, 'rgba(255,255,255,.55)'], [.45, 'rgba(255,255,255,.16)'], [1, 'rgba(255,255,255,0)']]);
      st.fire = sprite([[0, 'rgba(255,214,150,1)'], [.25, 'rgba(255,150,60,.55)'], [.6, 'rgba(220,90,30,.14)'], [1, 'rgba(200,70,20,0)']]);
      st.pale = sprite([[0, 'rgba(255,246,222,1)'], [.2, 'rgba(255,236,196,.5)'], [.55, 'rgba(240,214,160,.12)'], [1, 'rgba(240,214,160,0)']]);
      st.ao = document.createElement('canvas'); st.ao.width = 2; st.ao.height = 64;
      { const g = st.ao.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.85)'); g.fillStyle = gr; g.fillRect(0, 0, 2, 64); }
      st.noise = document.createElement('canvas');
      st.noise.width = st.noise.height = 160;
      const ng = st.noise.getContext('2d'), id = ng.createImageData(160, 160);
      for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 20; }
      ng.putImageData(id, 0, 0);
      // stars on the sphere around the south celestial pole, which sits under the southern horizon
      st.stars = Array.from({ length: 3600 }, () => {
        const band = r() < .4;
        const a = -Math.PI / 2 + (r() - .5) * 3.4, rad = .35 + r() * 1.25;
        return { a: band ? -Math.PI / 2 + .55 + (rad - 1) * .9 + (r() - .5) * .22 : a, r: rad, m: band ? .22 + r() * .32 : .3 + r() ** 3 * 1.7, ph: r() * 9 };
      });
      // ridges: [z, half extent]; heights rise at the valley walls and towards Thawr in the south
      // valley walls every 60 m along both sides, then hills closing the far end of the valley, then the ranges
      st.ridges = [[345, 1200, 26], [420, 1300, 34], [520, 1500, 44], [760, 1900, 62], [1150, 2700, 88], [1750, 3600, 110], [2600, 5200, 140]].map(([z, ext, base], li0) => {
        const li = li0 + 5;
        const xs = [], hs = [], ph = [r() * 9, r() * 9, r() * 9];
        const w = valley(z) + 6;
        for (let x = -ext; x <= ext; x += ext / 110) {
          const n = .55 + .22 * Math.sin(x * .011 + ph[0]) + .13 * Math.sin(x * .031 + ph[1]) + .07 * Math.abs(Math.sin(x * .083 + ph[2])) + .03 * Math.sin(x * .21 + ph[0] * 3);
          let h = Math.max(0, Math.abs(x) - w) * (.5 + .15 * li / 11) * n;
          h = Math.max(h, base * n);
          if (li === 11) h += 120 * Math.exp(-(((x - 140) / 240) ** 2)); // Jabal Thawr, in the south
          hs.push(Math.min(h, 150 + li * 16)); xs.push(x);
        }
        return { z, xs, hs, li };
      });
      // the valley sides as terrain: rows of height profiles every 20 m, drawn as strips far to near
      const hill = (x, z) => { const e = Math.abs(x) - valley(z) - 4; if (e <= 0) return 0; return Math.min(240, e * (.42 + .1 * Math.sin(z * .013 + (x > 0 ? 1 : 4))) * (.62 + .22 * Math.sin(x * .021 + z * .017) + .12 * Math.sin(x * .061 - z * .043) + .05 * Math.sin(x * .17 + z * .11))); };
      st.slopes = [];
      for (let z = -100; z <= 345; z += 15) {
        const row = [-1, 1].map((sd) => { const pts = []; for (let k = 0; k <= 34; k++) { const x = sd * (valley(z) + 4 + (k / 34) ** 1.6 * 700); pts.push([x, hill(x, z)]); } return pts; });
        st.slopes.push({ z, row });
      }
      // the city: blocks between the lanes, cut into lots, each lot a flat-roofed house
      const boxes = [];
      const box = (x0, x1, y0, y1, z0, z1, alb, extra = {}) => { const b = { x0, x1, y0, y1, z0, z1, alb, ...extra }; boxes.push(b); return b; };
      const clay = () => { const k = r(); return k < .1 ? [.8, .74, .62] : [.66 + r() * .14, .52 + r() * .1, .38 + r() * .08]; };
      const palms = [];
      const lot = (x0, x1, z0, z1) => {
        if (x1 - x0 < 2.5 || z1 - z0 < 2.5) return;
        const xc = (x0 + x1) / 2, zc = (z0 + z1) / 2, edge = Math.abs(xc) / valley(zc);
        const [ox0, ox1, oz0, oz1] = KAABA.open;
        if (xc > ox0 && xc < ox1 && zc > oz0 && zc < oz1) return;
        if (edge > 1 || (edge > .74 && r() < .6) || (zc > 250 && r() < (zc - 250) / 70)) return;
        const q = r();
        if (q < .06) { if (r() < .6) palms.push([xc + (r() - .5) * 3, zc, 7 + r() * 4, r() * 9]); return; }
        const s = () => r() * .45;
        const h = r() < .3 ? 6 + r() * 1.8 : 3.1 + r() * 1.6;
        const b = box(x0 + s(), x1 - s(), 0, h, z0 + s(), z1 - s(), clay(), { lit: r() < .035 });
        b.win = Array.from({ length: 1 + (r() * 3 | 0) }, () => { const u = .12 + r() * .66, v = .45 + r() * .3; return [u, v, u + .06 + r() * .05, v + .1 + r() * .08]; });
        if (r() < .7) b.door = [.15 + r() * .6];
        if (r() < .2 && b.x1 - b.x0 > 5) { // a room on the roof
          const kx = r() < .5, kz = r() < .5, wx = (b.x1 - b.x0) * (.35 + r() * .2), wz = (b.z1 - b.z0) * (.35 + r() * .2);
          const rx0 = kx ? b.x0 : b.x1 - wx, rz0 = kz ? b.z0 : b.z1 - wz;
          box(rx0, rx0 + wx, h, h + 2.5, rz0, rz0 + wz, b.alb, { up: b });
        }
      };
      for (let i = 0; i < XS.length - 1; i++) for (let j = 0; j < ZS.length - 1; j++) {
        const zA = ZS[j] + JOG(i, j) + 1.6, zB = ZS[j + 1] + JOG(i, j + 1) - 1.6;
        if (XS[i] < 0 && XS[i + 1] > 0 && zA < 0 && zB > 0) continue; // the house and its square
        const far = (zA + zB) / 2 > 150;
        for (let z0 = zA; z0 < zB - 2;) { // rows of houses following the lanes
          let z1 = Math.min(zB, z0 + (far ? 11 : 6.5) + r() * (far ? 8 : 6));
          if (zB - z1 < 4) z1 = zB;
          const xa = Math.max(lane(i, z0), lane(i, z1), lane(i, (z0 + z1) / 2)) + LANE[i].hw, xb = Math.min(lane(i + 1, z0), lane(i + 1, z1), lane(i + 1, (z0 + z1) / 2)) - LANE[i + 1].hw;
          for (let x0 = xa; x0 < xb - 2;) {
            let x1 = Math.min(xb, x0 + (far ? 9 : 5) + r() * (far ? 9 : 6));
            if (xb - x1 < 3) x1 = xb;
            lot(x0, x1, z0, z1);
            x0 = x1 + (r() < .14 ? 1.3 + r() * .8 : 0);
          }
          z0 = z1 + (r() < .22 ? 1.4 + r() * 1 : 0);
        }
      }
      st.kaaba = box(KAABA.x - 5.5, KAABA.x + 5.5, 0, 13, KAABA.z - 6, KAABA.z + 6, [.1, .1, .11], { kaaba: true });
      // the house: wings round an open courtyard; the far wing is an open room (iwan) with the bed
      const H = [.8, .66, .5];
      box(-12, -1.15, 0, 3.6, -9, -4.5, H); box(1.15, 12, 0, 3.6, -9, -4.5, H);
      box(-1.15, 1.15, 2.6, 3.6, -9, -4.5, H, { lintel: true });
      box(-12, -6.5, 0, 3.8, -4.5, 4.5, H); box(6.5, 12, 0, 3.4, -4.5, 4.5, H);
      box(8.6, 12, 3.4, 6.2, -4.5, -.4, H);
      box(-12, -3.6, 0, 3.9, 4.5, 11.2, H); box(3.6, 12, 0, 3.9, 4.5, 11.2, H);
      st.back = box(-12, 12, 0, 3.9, 11.2, 12.4, H, { niche: true });
      box(-3.6, 3.6, 3.3, 3.9, 4.5, 11.2, H, { slab: true });
      box(-3.6, 3.6, 0, .25, 4.5, 11.2, [.62, .5, .38], { plat: true });
      st.bedBox = box(BED.x - BED.hl - .06, BED.x + BED.hl + .06, .25, BED.y, BED.z - BED.hw - .05, BED.z + BED.hw + .05, [.36, .24, .16], { bed: true });
      palms.push([-17.5, -18, 9, 1], [18, -20, 8, 4], [-17, 18, 10, 2]);
      st.boxes = boxes;
      st.palms = palms.map(([x, z, h, ph]) => ({ x, z, h, ph, fr: Array.from({ length: 11 }, (_, k) => [k / 11 * TAU + r() * .3, .75 + r() * .4, r() * .5]) }));
      // torches: the way in (alley mouth → slot) and the rush (slot → courtyard)
      st.torch = TORCH.map((T, i) => {
        const a = .15 + i / TORCH.length * .11 + r() * .025;
        const corner = T.slot[1] > 12 ? (T.slot[0] >= 0 ? [[14, 14.6], [14, -12.6]] : [[-14, 14.6], [-14, -12.6]]) : Math.abs(T.slot[0]) > 12 ? [[Math.sign(T.slot[0]) * 13.6, -12.6]] : [];
        const side = i % 2 ? 1 : -1, spot = [side * (2.7 + ((i * 1.7) % 3.2)), .2 + ((i * 1.3) % 3.8)]; // two flanks, the bed left clear
        return {
          inn: path([...T.from, T.slot]), rush: path([T.slot, ...corner, DOOR_OUT, DOOR_IN, spot]), slot: T.slot,
          a, b: Math.min(.445, a + .15 + r() * .05), r0: .797 + (corner.length ? 0 : .01) + r() * .008, ph: r() * 9, out: [Math.sign(T.slot[0] || .3) * (3 + r() * 4), (T.slot[1] > 0 ? 1 : -1) * (3 + r() * 4)],
        };
      });
      st.cloth = Array.from({ length: 7 }, () => [r() * 2 - 1, r() * .6 + .2, r()]);
    },

    frame(p, t, el, st) {
      fit(st.cv);
      const c = st.ctx, W = st.cv.width, H = st.cv.height, W2 = W / 2;
      const [cx, cy, cz, tz, ys, kf] = spline(CAM, Math.min(1.05, Math.max(-.05, p)));
      const F = Math.min(H * 1.02, W * 1.9) * kf;
      const hy = ys * H - cy * F / (tz - cz);
      const X = (x, z) => W2 + (x - cx) * F / (z - cz);
      const Y = (y, z) => hy + (cy - y) * F / (z - cz);
      const dawn = .48 * smooth(seg(p, .58, .82)) + .52 * smooth(seg(p, .88, 1));
      const fogC = mixc([13, 17, 31], [168, 150, 152], dawn);
      const fogOf = (d) => 1 - Math.exp(-d / mix(1100, 820, dawn));
      const amb = {}; for (const k in AMB) amb[k] = mixc(AMB[k][0], AMB[k][1], dawn);

      // ---- beats, all from p ----
      const tight = smooth(seg(p, .6, .8));
      const cloak = smooth(seg(p, .849, .868));
      const rise = ease.out(seg(p, .853, .89));
      const ali = smooth(seg(p, .851, .874)) * (1 - .25 * seg(p, .93, 1));
      const recoil = ease.out(seg(p, .862, .9)), scatter = smooth(seg(p, .866, .925)), gone = seg(p, .92, 1);
      const pu = seg(p, .45, .6);
      const pr = walk(PROPHET, pu ** 1.75);
      const prA = 1 - smooth(seg(p, .565, .6));
      const torches = st.torch.map((T, i) => {
        let pos, al = 1, fl = 1 - .28 * tight;
        if (p < T.a) return null;
        const vin = smooth(seg(p, T.a, T.b));
        al = smooth(c01(vin / .06));
        pos = walk(T.inn, vin);
        if (p >= T.b) {
          pos = [T.slot[0] * (1 - .08 * tight), T.slot[1] + (T.slot[1] > 0 ? -1 : T.slot[1] < -9 ? 1 : 0) * .9 * tight];
          if (Math.abs(T.slot[0]) > 12) pos[0] = T.slot[0] - Math.sign(T.slot[0]) * .7 * tight;
          const v = ease.io(seg(p, T.r0, T.r0 + .05)) * (1 - recoil);
          if (v > 0) { const q = walk(T.rush, v); pos = [mix(pos[0], q[0], c01(v * 8)), mix(pos[1], q[1], c01(v * 8))]; fl = mix(fl, 1.05, c01(v * 4)); }
          pos[0] += T.out[0] * scatter * (1 - gone); pos[1] += T.out[1] * scatter * (1 - gone);
          if (gone > 0) { const q = walk(T.inn, 1 - ease.in(gone)); pos = [mix(pos[0], q[0], smooth(c01(gone * 3))), mix(pos[1], q[1], smooth(c01(gone * 3)))]; al = 1 - smooth(seg(gone, .35, .9)); fl *= 1 - .3 * gone; }
          fl *= 1 - .18 * recoil * (1 - scatter);
        }
        // a veil falls on the watchers as the calm light passes them
        const dpr = Math.hypot(pos[0] - pr[0], pos[1] - pr[1]);
        if (pu > 0 && pu < 1) fl *= 1 - .4 * Math.exp(-(dpr * dpr) / 60) * Math.sin(Math.PI * pu);
        return { x: pos[0], z: pos[1], y: 2.25 + .05 * Math.sin((pos[0] + pos[1]) * 1.3 + T.ph), al, fl, ph: T.ph, i };
      }).filter(Boolean);

      // ---- lights that shade the walls ----
      const L = [];
      torches.forEach((T) => { // crowding: a knot of torches is not eleven times as bright
        T.n = 1; torches.forEach((U) => { if (U !== T && Math.abs(U.x - T.x) + Math.abs(U.z - T.z) < 4) T.n += .6; });
        const fk = .82 + .18 * Math.sin(t * 9 + T.ph) * Math.sin(t * 5.3 + T.ph * 2);
        L.push({ x: T.x, y: T.y, z: T.z, c: [1, .52, .2], i: 1.9 * T.al * T.fl * fk / T.n ** .7, r2: 9 });
      });
      const lampF = .85 + .15 * Math.sin(t * 7.1) * Math.sin(t * 3.7 + 1);
      L.push({ x: LAMP[0], y: LAMP[1], z: LAMP[2] - .3, c: [1, .62, .3], i: 1.1 * lampF * (1 - .5 * ali), r2: 3.2 });
      const prY = 1.35;
      if (prA > 0) L.push({ x: pr[0], y: prY, z: pr[1], c: [1, .9, .7], i: 1.6 * prA, r2: 18 });
      const aliY = mix(.5, 1.9, rise);
      if (ali > 0) L.push({ x: BED.x, y: aliY, z: BED.z - .2, c: [1, .93, .8], i: 3.6 * ali, r2: 16 });
      L.forEach((l) => { l.cut2 = l.r2 * l.i * 40; });
      const shade = (alb, a, nx, ny, nz, px, py, pz) => {
        let R = a[0], G = a[1], B = a[2];
        for (let k = 0; k < L.length; k++) {
          const l = L[k], dx = l.x - px, dy = l.y - py, dz = l.z - pz, d2 = dx * dx + dy * dy + dz * dz;
          if (d2 > l.cut2) continue;
          const d = Math.sqrt(d2) || 1;
          const lam = ((nx * dx + ny * dy + nz * dz) / d + .15) / 1.15;
          if (lam <= 0) continue;
          const e = l.i * lam / (1 + d2 / l.r2);
          R += l.c[0] * e; G += l.c[1] * e; B += l.c[2] * e;
        }
        return [tone(alb[0] * R), tone(alb[1] * G), tone(alb[2] * B)];
      };
      const fogged = (col, d) => mixc(col, fogC, fogOf(d));

      // ---- sky ----
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
      if (hy > 0) {
        const sky = c.createLinearGradient(0, Math.min(0, hy - H * .7), 0, hy);
        sky.addColorStop(0, rgb(mixc([4, 7, 18], [48, 62, 100], dawn)));
        sky.addColorStop(.7, rgb(mixc([9, 13, 30], [120, 120, 146], dawn)));
        sky.addColorStop(1, rgb(mixc([20, 26, 46], [206, 180, 166], dawn)));
        c.fillStyle = sky; c.fillRect(0, 0, W, hy + 2);
        if (dawn > 0) { // the east is on the left: Abu Qubays catches the first light
          const gx = W2 - F * 1.1, g = c.createRadialGradient(gx, hy, 0, gx, hy, W * .95);
          g.addColorStop(0, `rgba(255,200,150,${(.42 * dawn * dawn).toFixed(3)})`); g.addColorStop(.5, `rgba(240,180,140,${(.12 * dawn).toFixed(3)})`); g.addColorStop(1, 'rgba(240,170,130,0)');
          c.fillStyle = g; c.fillRect(0, 0, W, hy + 2);
        }
        // the stars wheel round the pole as the night goes
        const rot = .5 * p, R = H * 1.5, px = W2 - cx * F * .002, py = hy + H * .62;
        const sa = 1 - .97 * dawn, sz = Math.max(1, H / 900);
        if (sa > .02) { // the Milky Way, a faint band that turns with the stars
          c.globalCompositeOperation = 'lighter';
          for (let k = 0; k < 18; k++) {
            const rad = .5 + k * .065, a = -Math.PI / 2 + .55 + (rad - 1) * .9 + rot;
            const x = px + Math.cos(a) * rad * R, y = py + Math.sin(a) * rad * R, q = R * (.1 + .05 * Math.sin(k * 1.7));
            if (y - q > hy) continue;
            c.globalAlpha = .07 * sa; c.drawImage(st.pale, x - q, y - q * .7, q * 2, q * 1.4);
          }
          c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        }
        if (sa > .02) {
          const bins = [[], [], [], [], [], [], [], []], bright = [];
          for (const s of st.stars) {
            const a = s.a + rot, x = px + Math.cos(a) * s.r * R, y = py + Math.sin(a) * s.r * R;
            if (y > hy || y < 0 || x < 0 || x > W) continue;
            const tw = .7 + .3 * Math.sin(t * (1.3 + s.ph * .2) + s.ph);
            const al = Math.min(1, s.m * tw * sa * (.35 + .65 * c01((hy - y) / (H * .25))));
            bins[Math.min(7, al * 8 | 0)].push(x, y, s.m > 1.2 ? 2 * sz : sz);
            if (s.m > 1.55 && al > .5) bright.push(x, y, al);
          }
          bins.forEach((b, k) => {
            if (!b.length) return;
            c.fillStyle = `rgba(232,226,212,${((k + .5) / 8).toFixed(3)})`; c.beginPath();
            for (let i = 0; i < b.length; i += 3) c.rect(b[i], b[i + 1], b[i + 2], b[i + 2]);
            c.fill();
          });
          c.globalCompositeOperation = 'lighter'; // the brightest stars get a small soft halo
          for (let i = 0; i < bright.length; i += 3) { const q = 7 * sz; c.globalAlpha = .35 * bright[i + 2]; c.drawImage(st.pale, bright[i] - q, bright[i + 1] - q, q * 2, q * 2); }
          c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        }
      }
      // ---- ground ----
      const g0 = Math.max(0, hy);
      const gg = c.createLinearGradient(0, g0, 0, H);
      gg.addColorStop(0, rgb(mixc(fogC, [10, 11, 18], .5 * (1 - dawn))));
      gg.addColorStop(Math.min(1, .25 * Math.max(.2, (H - g0) / H)), rgb(mixc(mixc([24, 22, 26], [92, 80, 72], dawn), fogC, .4)));
      gg.addColorStop(1, rgb(shade([.42, .36, .3], amb.top, 0, 1, 0, 0, -50, -1e3)));
      c.fillStyle = gg; c.fillRect(0, g0, W, H - g0);

      // ---- items, far to near ----
      const items = [];
      const dist = (x0, x1, z0, z1) => { const dx = cx < x0 ? x0 - cx : cx > x1 ? cx - x1 : 0, dz = cz < z0 ? z0 - cz : 0; return Math.hypot(dx, dz) + (z1 - z0) * .001; };
      st.ridges.forEach((rd) => items.push([rd.z - cz + 1e4, () => ridge(rd)]));
      for (let j = st.slopes.length - 1; j > 0; j--) { const A = st.slopes[j], B = st.slopes[j - 1]; if (B.z - cz > 1.5) items.push([A.z - cz + 20, () => slope(A, B)]); }
      for (const b of st.boxes) {
        if (b.z0 - cz < 1.2) continue;
        let k = dist(b.x0, b.x1, b.z0, b.z1);
        if (b.up) k = dist(b.up.x0, b.up.x1, b.up.z0, b.up.z1) - .01;
        if (b.slab) k -= .02;
        if (b.plat) k = dist(-12, 12, 11.2, 12.4) - .001;
        if (b.bed) k = dist(b.x0, b.x1, b.z0, b.z1) - .05;
        items.push([k, () => drawBox(b)]);
      }
      st.palms.forEach((pm) => items.push([Math.hypot(pm.x - cx, pm.z - cz), () => palm(pm)]));
      torches.forEach((T) => items.push([Math.hypot(T.x - cx, T.z - cz), () => torch(T)]));
      if (prA > 0) items.push([Math.hypot(pr[0] - cx, pr[1] - cz), () => orb(pr[0], prY, pr[1], .5, st.pale, .95 * prA)]);
      { const b = st.bedBox; items.push([dist(b.x0, b.x1, b.z0, b.z1) - .06, () => drawCloak()]); }
      items.sort((m, n) => n[0] - m[0]);

      // floors and pools of light lie under everything
      const ambOnly = (alb) => [tone(alb[0] * amb.top[0]), tone(alb[1] * amb.top[1]), tone(alb[2] * amb.top[2])];
      quad([[-6.5, -4.5], [6.5, -4.5], [6.5, 4.5], [-6.5, 4.5]], 0, ambOnly([.6, .5, .4]), .55);
      quad([[-12, -22], [12, -22], [12, -9], [-12, -9]], 0, ambOnly([.5, .43, .36]), .45);
      { const [a0, a1, b0, b1] = KAABA.open; quad([[a0, b0], [a1, b0], [a1, b1], [a0, b1]], 0, shade([.52, .46, .4], amb.top, 0, 1, 0, 0, 0, -1e3), .4); }
      c.globalCompositeOperation = 'lighter';
      torches.forEach((T) => pool(T.x, T.z, 7 * T.fl, st.fire, .34 * T.al * T.fl / T.n));
      if (prA > 0) pool(pr[0], pr[1], 10, st.pale, .35 * prA);
      if (ali > 0) pool(BED.x, BED.z - 2, 16 * ali, st.pale, .4 * ali);
      c.globalCompositeOperation = 'source-over';
      for (const [, fn] of items) if (fn) fn();

      // ---- air glow over everything ----
      c.globalCompositeOperation = 'lighter';
      { const ring = torches.reduce((m, T) => m + T.al * T.fl * (Math.abs(T.x) < 20 && Math.abs(T.z) < 20 ? 1 : 0), 0) / 11, d = 2 - cz;
        if (ring > .02) halo(X(0, 2), Y(4, 2), 34 * F / d, st.fire, .22 * ring); }
      torches.forEach((T) => {
        const d = T.z - cz; if (d < 1) return;
        const fk = .85 + .15 * Math.sin(t * 8 + T.ph);
        const R = 5.2 * F / d * T.fl, cap = H * .14; // near the lens a torch must not flood the frame
        halo(X(T.x, T.z), Y(T.y + .2, T.z), Math.min(R, cap), st.fire, .45 * T.al * fk / T.n * Math.min(1, (cap / R) ** .5));
      });
      const dl = LAMP[2] - cz;
      halo(X(LAMP[0], LAMP[2]), Y(LAMP[1], LAMP[2]), 2.6 * F / dl, st.fire, .55 * lampF * (1 - .6 * ali));
      if (prA > 0) {
        const d = pr[1] - cz;
        if (pu > 0) for (let k = 1; k <= 10; k++) { // the way he went, a fading wake
          const q = walk(PROPHET, Math.max(0, pu ** 1.75 - k * .012)), dq = q[1] - cz;
          if (dq > 2) halo(X(q[0], q[1]), Y(.6, q[1]), 3.2 * F / dq, st.pale, .2 * prA * (1 - k / 11) * c01(pu * 8));
        }
        halo(X(pr[0], pr[1]), Y(prY, pr[1]), 17 * F / d, st.pale, .42 * prA);
        halo(X(pr[0], pr[1]), Y(prY, pr[1]), 5 * F / d, st.pale, .6 * prA);
      }
      if (ali > 0) {
        const d = BED.z - cz, ax = X(BED.x, BED.z), ay = Y(aliY, BED.z);
        halo(ax, ay, 24 * F / d * (.6 + .4 * ali), st.pale, .3 * ali);
        halo(ax, ay, 3.6 * F / d, st.pale, .7 * ali);
        halo(ax, ay, 1 * F / d, st.glow, ali);
      }
      c.globalCompositeOperation = 'source-over';
      // grade: grain and vignette
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'overlay';
      c.fillStyle = c.createPattern(st.noise, 'repeat');
      c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      const hx = Math.min(W * .8, Math.max(W * .2, X(0, 2))), hyy = Math.min(H * .85, Math.max(H * .3, Y(0, 2)));
      const vg = c.createRadialGradient(hx, hyy, Math.min(W, H) * .22, hx, hyy, Math.hypot(W, H) * .7);
      vg.addColorStop(0, 'rgba(4,5,10,0)'); vg.addColorStop(1, `rgba(4,5,10,${(.58 - .25 * dawn).toFixed(3)})`);
      c.fillStyle = vg; c.fillRect(0, 0, W, H);

      // ---------- drawing helpers (closures over this frame's camera) ----------
      function poly(pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
      function quad(xz, y, col, fogK) {
        const pts = xz.map(([x, z]) => [X(x, z), Y(y, z)]);
        if (xz.some(([, z]) => z - cz < 1)) return;
        poly(pts); c.fillStyle = rgb(fogged(col, xz[0][1] - cz)); c.fill();
      }
      function pool(x, z, R, img, a, y = 0) {
        const d = z - cz; if (d < 2 || a <= .01) return;
        const sx = X(x, z), sy = Y(y, z), rx = R * F / d, ry = Math.max(2, (Y(y, Math.max(cz + 1, z - R)) - Y(y, z + R)) / 2);
        if (rx > W * .3) a *= W * .3 / rx;
        if (sx + rx < 0 || sx - rx > W || sy - ry > H || sy + ry < 0) return;
        c.globalAlpha = Math.min(1, a);
        c.drawImage(img, sx - rx, sy - ry, rx * 2, ry * 2);
        c.globalAlpha = 1;
      }
      function halo(x, y, R, img, a) {
        if (a <= .01 || x + R < 0 || x - R > W || y + R < 0 || y - R > H) return;
        c.globalAlpha = Math.min(1, a); c.drawImage(img, x - R, y - R, R * 2, R * 2); c.globalAlpha = 1;
      }
      function face(pts, cA, cB, ax, bx) {
        poly(pts);
        if (Math.abs(cA[0] - cB[0]) + Math.abs(cA[1] - cB[1]) + Math.abs(cA[2] - cB[2]) > 8 && Math.abs(bx - ax) > 2) {
          const g = c.createLinearGradient(ax, 0, bx, 0); g.addColorStop(0, rgb(cA)); g.addColorStop(1, rgb(cB)); c.fillStyle = g;
        } else c.fillStyle = rgb(cA);
        c.fill();
      }
      function drawBox(b) {
        const d0 = b.z0 - cz, d1 = b.z1 - cz;
        const xl0 = X(b.x0, b.z0), xr0 = X(b.x1, b.z0);
        if (xr0 < -50 && X(b.x1, b.z1) < -50) return;
        if (xl0 > W + 50 && X(b.x0, b.z1) > W + 50) return;
        const yb0 = Y(b.y0, b.z0), yt0 = Y(b.y1, b.z0), yt1 = Y(b.y1, b.z1);
        if (yt1 > H + 20 || yb0 < -20) return;
        const ym = (b.y0 + b.y1) / 2, f = fogOf(d0), alb = b.alb;
        const fc = (col) => mixc(col, fogC, f);
        const near = d0 < 160;
        // side wall
        if (cx > b.x1 || cx < b.x0) {
          const xs = cx > b.x1 ? b.x1 : b.x0, n = cx > b.x1 ? 1 : -1;
          const a = n > 0 ? amb.west : amb.east;
          const cA = fc(shade(alb, a, n, 0, 0, xs, ym, b.z0 + .3)), cB = fc(shade(alb, a, n, 0, 0, xs, ym, b.z1 - .3));
          const s0 = X(xs, b.z0), s1 = X(xs, b.z1);
          poly([[s0, yb0], [s1, Y(b.y0, b.z1)], [s1, yt1], [s0, yt0]]);
          if (near && Math.abs(cA[0] - cB[0]) + Math.abs(cA[1] - cB[1]) > 8) { const g = c.createLinearGradient(s0, 0, s1, 0); g.addColorStop(0, rgb(cA)); g.addColorStop(1, rgb(cB)); c.fillStyle = g; } else c.fillStyle = rgb(cA);
          c.fill();
        }
        // roof, with a lighter parapet lip round a sunken floor
        if (cy > b.y1) {
          const top = b.plat ? ambOnly(alb) : fc(shade(alb, amb.top, 0, 1, 0, (b.x0 + b.x1) / 2, b.y1, (b.z0 + b.z1) / 2));
          poly([[xl0, yt0], [xr0, yt0], [X(b.x1, b.z1), yt1], [X(b.x0, b.z1), yt1]]);
          c.fillStyle = rgb(top); c.fill();
          if (near && !b.bed && !b.plat && (b.x1 - b.x0) * F / d0 > 14) {
            const e = .32, yi0 = Y(b.y1, b.z0 + e), yi1 = Y(b.y1, b.z1 - e);
            poly([[X(b.x0 + e, b.z0 + e), yi0], [X(b.x1 - e, b.z0 + e), yi0], [X(b.x1 - e, b.z1 - e), yi1], [X(b.x0 + e, b.z1 - e), yi1]]);
            c.fillStyle = rgb(mixc(top, [0, 0, 0], .22)); c.fill();
          }
        }
        if (b.plat) {
          c.globalCompositeOperation = 'lighter';
          pool(LAMP[0], LAMP[2] - .8, 2.6, st.fire, .5 * lampF * (1 - .5 * ali), b.y1);
          if (ali > 0) pool(BED.x, BED.z, 9, st.pale, .75 * ali, b.y1);
          torches.forEach((T) => { if (T.z > 1 && Math.abs(T.x) < 7) pool(T.x, Math.max(4.6, T.z), 4.5, st.fire, .3 * T.al * T.fl / T.n, b.y1); });
          c.globalCompositeOperation = 'source-over';
        }
        // front wall
        const cA = fc(shade(alb, amb.front, 0, 0, -1, b.x0 + .3, ym, b.z0)), cB = fc(shade(alb, amb.front, 0, 0, -1, b.x1 - .3, ym, b.z0));
        face([[xl0, yb0], [xr0, yb0], [xr0, yt0], [xl0, yt0]], cA, cB, xl0, xr0);
        const fw = xr0 - xl0, hh = yb0 - yt0;
        if (near && hh > 6) {
          c.globalAlpha = .55; c.drawImage(st.ao, xl0, yb0 - hh * .45, fw, hh * .45); c.globalAlpha = 1;
          c.fillStyle = rgb(mixc(fc(shade(alb, amb.top, 0, .7, -.7, (b.x0 + b.x1) / 2, b.y1, b.z0)), [255, 255, 255], .06));
          c.fillRect(xl0, yt0, fw, Math.max(1, hh * .03));
          if (d0 < 110 && !b.kaaba && !b.plat && !b.bed) { // the ends of the palm-trunk beams that carry the roof
            const s = F / d0, step = .85 * s, by = yt0 + .45 * s, q = Math.max(1, .14 * s);
            if (step > 3) { c.fillStyle = 'rgba(8,6,8,.55)'; c.beginPath(); for (let x = xl0 + step * .6; x < xr0 - q; x += step) c.rect(x, by, q, q); c.fill(); }
          }
        }
        if (b.slab) return;
        if (near && fw > 10 && b.win) { // windows and doors, dark, a few lit from inside
          b.win.forEach(([u0, v0, u1, v1]) => {
            if (b.y1 - b.y0 < 5 && v0 > .6) return;
            c.fillStyle = b.lit ? `rgba(255,170,90,${(.7 * (1 - .8 * dawn)).toFixed(3)})` : rgb(mixc([10, 9, 12], fogC, f));
            c.fillRect(xl0 + u0 * fw, yb0 - v1 * hh, (u1 - u0) * fw, (v1 - v0) * hh);
          });
          if (b.door) { const dw = Math.min(fw * .14, 1.1 * F / d0), dh = Math.min(hh * .62, 2.1 * F / d0); c.fillStyle = rgb(mixc([12, 10, 12], fogC, f)); c.fillRect(xl0 + b.door[0] * fw, yb0 - dh, dw, dh); }
        }
        if (b.niche) niche();
        if (b.kaaba) { const yb = Y(8.6, b.z0), yb2 = Y(9.3, b.z0); c.fillStyle = `rgba(201,165,78,${(.55 + .3 * dawn).toFixed(3)})`; c.fillRect(xl0, yb2, fw, Math.max(1, yb - yb2)); }
      }
      function niche() {
        // the lamp in its niche at the back of the open room
        const z = 11.2, d = z - cz; if (d < 1) return;
        const x0 = X(LAMP[0] - .32, z), x1 = X(LAMP[0] + .32, z), y0 = Y(.95, z), y1 = Y(1.6, z);
        c.fillStyle = 'rgba(30,18,10,.9)'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1 + (x1 - x0) * .4); c.quadraticCurveTo((x0 + x1) / 2, y1 - (x1 - x0) * .2, x1, y1 + (x1 - x0) * .4); c.lineTo(x1, y0); c.fill();
        const lx = X(LAMP[0], z - .15), ly = Y(1.02, z - .15), s = F / d;
        c.fillStyle = '#6b4a2c'; c.beginPath(); c.ellipse(lx, ly, .16 * s, .05 * s, 0, 0, TAU); c.fill();
        const fh = .14 * s * lampF;
        c.fillStyle = '#ffd690'; c.beginPath(); c.moveTo(lx + .1 * s, ly - .02 * s); c.quadraticCurveTo(lx + .15 * s, ly - fh * .6, lx + .12 * s, ly - fh); c.quadraticCurveTo(lx + .08 * s, ly - fh * .5, lx + .1 * s, ly - .02 * s); c.fill();
      }
      function ridge(rd) {
        const d = rd.z - cz; if (d < 5) return;
        const k = F / d, base = Y(0, rd.z);
        if (base < -5) return;
        c.beginPath(); c.moveTo(X(rd.xs[0], rd.z), base);
        for (let i = 0; i < rd.xs.length; i++) c.lineTo(W2 + (rd.xs[i] - cx) * k, hy + (cy - rd.hs[i]) * k);
        c.lineTo(X(rd.xs[rd.xs.length - 1], rd.z), base); c.closePath();
        const near = mixc([7, 8, 14], [52, 50, 64], dawn), f = c01(.04 + rd.li * .06) * (1 - .25 * dawn);
        c.fillStyle = rgb(mixc(near, fogC, f)); c.fill();
      }
      function slope(A, B) { // one strip of the valley side between two rows, both sides of the city
        const dA = A.z - cz, dB = B.z - cz, k = c01((A.z + 100) / 445);
        for (let sd = 0; sd < 2; sd++) {
          const ra = A.row[sd], rb = B.row[sd];
          c.beginPath(); c.moveTo(X(rb[0][0], B.z), Y(rb[0][1], B.z));
          for (let i = 1; i < rb.length; i++) c.lineTo(X(rb[i][0], B.z), Y(rb[i][1], B.z));
          for (let i = ra.length - 1; i >= 0; i--) c.lineTo(X(ra[i][0], A.z), Y(ra[i][1], A.z));
          c.closePath();
          const lift = (ra[12][1] - rb[12][1]) > 0 ? 1.18 : .9; // slopes that rise away catch more sky
          c.fillStyle = rgb(mixc(mixc([12, 13, 21], [70, 64, 76], dawn).map((v) => v * lift), fogC, fogOf(dB) * .9 + .05 * k)); c.fill();
        }
      }
      function palm(pm) {
        const d = pm.z - cz; if (d < 2) return;
        const s = F / d, bx = X(pm.x, pm.z), by = Y(0, pm.z);
        if (bx < -12 * s || bx > W + 12 * s || by < 0) return;
        const lean = .06 * Math.sin(pm.ph), tx = bx + lean * pm.h * s, ty = Y(pm.h, pm.z);
        const col = rgb(mixc(mixc([20, 18, 16], [70, 62, 54], dawn), fogC, fogOf(d)));
        c.strokeStyle = col; c.lineCap = 'round';
        c.lineWidth = Math.max(1, .35 * s); c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx, (by + ty) / 2, tx, ty); c.stroke();
        c.lineWidth = Math.max(1, .16 * s);
        pm.fr.forEach(([a, l, dr]) => {
          const sw = Math.sin(t * .8 + pm.ph + a) * .04;
          const ex = tx + Math.cos(a + sw) * 3.2 * l * s, ey = ty - Math.sin(a + sw) * 1.1 * l * s + (1.2 + dr) * l * s;
          c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo((tx + ex) / 2, ty - 1.2 * l * s * (1 - Math.abs(Math.cos(a)) * .4), ex, ey); c.stroke();
        });
      }
      function torch(T) {
        const d = T.z - cz; if (d < 1.5 || T.al <= .01) return;
        const s = F / d, x = X(T.x, T.z), y = Y(T.y, T.z);
        if (x < -40 || x > W + 40 || y < -40 || y > H + 40) return;
        c.globalAlpha = T.al;
        if (s > 14) {
          c.strokeStyle = '#1e140c'; c.lineWidth = .055 * s; c.lineCap = 'butt'; c.beginPath(); c.moveTo(x, y + .42 * s); c.lineTo(x, y); c.stroke();
          c.fillStyle = '#2b1a0e'; c.beginPath(); c.ellipse(x, y - .04 * s, .07 * s, .11 * s, 0, 0, TAU); c.fill();
        }
        const fk = .85 + .15 * Math.sin(t * 11 + T.ph) * Math.sin(t * 6.7 + T.ph * 3);
        const fh = Math.max(2.5, .62 * s * T.fl * fk), fw = Math.max(1.5, .16 * s * T.fl);
        const tongue = (dx, hk, wk, col, ph) => {
          const sw = Math.sin(t * (3.1 + ph) + T.ph + ph * 2) * fw * .6, h = fh * hk * (.9 + .1 * Math.sin(t * 13 + ph * 5 + T.ph));
          c.fillStyle = col; c.beginPath(); c.moveTo(x + dx - fw * wk, y);
          c.bezierCurveTo(x + dx - fw * wk * 1.1, y - h * .45, x + dx + sw * .4 - fw * wk * .3, y - h * .7, x + dx + sw, y - h);
          c.bezierCurveTo(x + dx + sw * .4 + fw * wk * .3, y - h * .7, x + dx + fw * wk * 1.1, y - h * .45, x + dx + fw * wk, y);
          c.closePath(); c.fill();
        };
        tongue(-fw * .35, .72, .7, 'rgba(214,80,24,.85)', .7); tongue(fw * .4, .82, .65, 'rgba(226,92,28,.85)', 1.9);
        tongue(0, 1, .9, 'rgba(255,146,48,.92)', 0); tongue(0, .6, .55, 'rgba(255,206,120,.95)', 1.3); tongue(0, .34, .32, 'rgba(255,244,214,1)', 2.6);
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = T.al * .5; c.drawImage(st.fire, x - 1.1 * s, y - fh * .4 - 1.1 * s, 2.2 * s, 2.2 * s);
        for (let k = 0; k < 3; k++) { // embers
          const ph = (t * (.5 + k * .17) + T.ph + k * .33) % 1;
          c.globalAlpha = T.al * (1 - ph) * .9; c.fillStyle = '#ffb060';
          const q = Math.min(H / 450, Math.max(1, .05 * s));
          c.fillRect(x + Math.sin(T.ph * 7 + k * 2 + ph * 4) * .25 * s, y - fh - ph * 1.4 * s, q, q);
        }
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
      function orb(x, y, z, R, img, a) {
        const d = z - cz; if (d < 1 || a <= .01) return;
        const s = F / d;
        c.globalCompositeOperation = 'lighter';
        halo(X(x, z), Y(y, z), R * 3 * s, img, a);
        halo(X(x, z), Y(y, z), R * s, st.glow, a);
        c.globalCompositeOperation = 'source-over';
      }
      function drawCloak() {
        // the izar he slept under: undyed wool, a long soft heap with no shape in it, then thrown back
        const d = BED.z - cz; if (d < 1) return;
        const P = (u, v, h) => { const x = BED.x + u * BED.hl, z = BED.z + v * BED.hw; return [X(x, z), Y(BED.y + h, z)]; };
        const kk = cloak;
        const at = (u) => mix(u, .5 + .5 * (u + 1) / 2, kk); // cloth position along the bed
        const hgt = (u, v) => {
          const uu = at(u);
          const pv = Math.max(0, 1 - v * v) ** .6;
          const lie = .27 * (1 - u * u) ** .55 * pv * (.92 + .08 * Math.sin(u * 2.6 + .7));
          const roll = .36 * Math.sin(Math.PI * (u + 1) / 2) ** .7 * pv * (1 + .1 * Math.sin(u * 5 + v * 2));
          let h = mix(lie, roll, kk);
          h += Math.sin(Math.PI * kk) * .3 * Math.max(0, -u) ** 2 * pv; // the near edge lifts as it is thrown
          return [uu, h];
        };
        const lampDir = [LAMP[0] - BED.x, LAMP[1] - BED.y, LAMP[2] - BED.z], ln = Math.hypot(...lampDir);
        // the bare mattress first: vellum, lit by the light once the cloak is gone
        const mat = shade([.86, .8, .66], amb.top, 0, 1, 0, BED.x, BED.y, BED.z);
        poly([P(-1, -1, 0), P(1, -1, 0), P(1, 1, 0), P(-1, 1, 0)]); c.fillStyle = rgb(mat); c.fill();
        const NU = 14, NV = 6, wool = [.7, .6, .45]; // undyed wool
        for (let j = NV - 1; j >= 0; j--) {
          const v0 = 1 - 2 * j / NV, v1 = 1 - 2 * (j + 1) / NV;
          for (let i = 0; i < NU; i++) {
            const u0 = -1 + 2 * i / NU, u1 = -1 + 2 * (i + 1) / NU;
            const [a0, h00] = hgt(u0, v0), [a1, h10] = hgt(u1, v0), [, h11] = hgt(u1, v1), [, h01] = hgt(u0, v1);
            const nx = -(h10 - h00 + h11 - h01) / (2 * (a1 - a0 || .01) * BED.hl), nz = -(h01 - h00 + h11 - h10) / (2 * (v1 - v0) * BED.hw);
            const nl = Math.hypot(nx, 1, nz);
            const lit = Math.max(0, (nx * lampDir[0] + lampDir[1] + nz * lampDir[2]) / (nl * ln));
            const col = shade(wool, [amb.top[0] * .5 + .25 * lit * (1 - ali), amb.top[1] * .5 + .17 * lit * (1 - ali), amb.top[2] * .5 + .08 * lit * (1 - ali)], nx / nl, 1 / nl, nz / nl, BED.x + a0 * BED.hl, BED.y + h00, BED.z + v0 * BED.hw);
            poly([P(a0, v0, h00), P(a1, v0, h10), P(a1, v1, h11), P(a0, v1, h01)]);
            c.fillStyle = rgb(col); c.fill(); c.strokeStyle = rgb(col); c.lineWidth = 1; c.stroke();
          }
        }
        // the drape over the front edge
        const dr = [];
        for (let i = 0; i <= NU; i++) { const u = -1 + 2 * i / NU, [a] = hgt(u, -1); dr.push(P(a, -1.02, 0)); }
        for (let i = NU; i >= 0; i--) { const u = -1 + 2 * i / NU, [a] = hgt(u, -1); dr.push(P(a, -1.04, -.3 + .035 * Math.sin(u * 11 + 1) * (1 - kk))); }
        poly(dr); c.fillStyle = rgb(shade(wool, mixc(amb.front, [0, 0, 0], .3), 0, 0, -1, BED.x, BED.y - .15, BED.z - BED.hw)); c.fill();
        // fold highlights: the lamp catching the creases of the wool on the creases
        c.lineCap = 'round';
        st.cloth.forEach(([u, w, q], k) => {
          const pts = [];
          for (let s = 0; s <= 8; s++) { const v = -.85 + 1.7 * s / 8, uu = u * .8 + (q - .5) * 1.1 * v + .12 * Math.sin(v * 3 + k), [a, h] = hgt(uu, v); pts.push(P(a, v, h + .006)); }
          c.strokeStyle = `rgba(246,226,186,${((.16 + .2 * w) * (1 - .5 * ali)).toFixed(3)})`; c.lineWidth = Math.max(1, .022 * F / d);
          c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
          if (k % 2) { c.strokeStyle = 'rgba(30,20,10,.35)'; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x + 1.5, y + 1.5) : c.moveTo(x + 1.5, y + 1.5))); c.stroke(); }
        });
      }
    },
  };
})();
