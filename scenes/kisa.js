// المباهلة والكساء. Part one: a morning plain outside Medina; the delegation of Najran waits before its camp,
// banners up. The Prophet comes out holding Ali by the hand, al-Hasan and al-Husayn walking in front, Fatima
// behind. The delegation wavers and draws back to its tents. Part two: the house of Umm Salama; a woven Yemeni
// cloak settles over the five, seated, their heads and discs above it, and their light fills the room.
// World in metres: x right, y up, z forward (towards the camp in part one, towards the back wall in part two).
// People of the delegation are faceless cloaked figures; the five are veiled figures with a gold disc behind the
// head (scenes/holy.js); no face is drawn.
(() => {
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
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
  const pool = (r, g, b) => sprite(Array.from({ length: 11 }, (_, k) => { const s = k / 10; return [s, `rgba(${r},${g},${b},${((1 + 12 * s * s) ** -1.5 * (1 - s * s)).toFixed(4)})`]; }), 256);

  // ---------- part one: the plain ----------
  const SUN = (() => { const v = [-.6, .095, 1]; const n = Math.hypot(...v); return v.map((q) => q / n); })();
  const HAZE = [226, 172, 118], SKYTOP = [30, 46, 80];
  const gz = (p) => mix(-36, 38, ease.io(seg(p, .015, .43))); // the five walk out to a halt before the delegation
  // the five: offset across, offset along the walk, head height standing (m), bloom radius (m), colour
  const FIVE = [
    { dx: -.62, dz: 2.2, y: 1.06, r: .17, c: [255, 214, 130] },
    { dx: .62, dz: 2.2, y: 1.02, r: .17, c: [255, 214, 130] },
    { dx: -.5, dz: 0, y: 1.68, r: .26, c: [255, 246, 222] },
    { dx: .5, dz: 0, y: 1.64, r: .2, c: [255, 232, 186] },
    { dx: 0, dz: -2.0, y: 1.5, r: .2, c: [255, 238, 222] },
  ];
  const WHO = ['hasan', 'husayn', 'prophet', 'ali', 'fatima'], HM = [1.2, 1.15, 1.85, 1.8, 1.65]; // standing heights (m): the two Imams are children
  const ORDER = [2, 3, 4, 0, 1]; // the labels: the Prophet, Ali, Fatima, al-Hasan, al-Husayn
  const SPR = (st, i) => (i === 2 ? st.pale : st.gold);
  // the tracking shot rides alongside the walk, a little behind and to the right, so the order reads across the frame
  const TRK = (p) => [p, 4.74, 1.6, gz(p) - 4.33, -.4, 1.0, gz(p) + 1.8, 1.0, .42];
  const CAM1 = [
    [-.05, -14, 13, -66, 2, 2, 58, 1.0, .4],
    [.1, -11, 10.5, -56, 2, 1.5, 58, 1.04, .4],
    [.165, -3, 4.2, -38, 0, 1, -16, 1.0, .42],
    ...[.21, .25, .29, .33, .37, .405].map(TRK),
    [.445, 2.2, 1.75, 29.6, .2, 1.4, 62, 1.0, .42],
    [.505, 1.9, 1.7, 30.6, .2, 1.45, 62, 1.06, .42],
    [.575, -7, 7.5, 21, 3, .2, 58, 1.0, .42],
    [.625, -5, 4, 27, 0, .9, 40, 1.05, .45],
    [.665, -.2, 1.35, 35.6, 0, 1.1, 39.5, 1.5, .5],
  ];
  // ---------- part two: the house of Umm Salama ----------
  const RX0 = -2.9, RX1 = 2.9, RZ0 = -1.2, RZ1 = 5.9, RH = 2.95;
  const CURT = [.4, 1.45, 2.05]; // curtained doorway in the left wall: z0, z1, height
  const WIN = [1.0, 1.5, 1.95, 2.4]; // window in the back wall: x0, x1, y0, y1
  const SEAT = [ // the five gathered on the mat: x, y, z (same order as FIVE)
    [-.33, .5, 3.7], [.33, .5, 3.7], [0, .8, 4.62], [.66, .74, 4.34], [-.66, .7, 4.34],
  ];
  const CLOTH = { x0: -1.45, x1: 1.45, z0: 2.8, z1: 5.62, nu: 40, nv: 38, ox: 0, oz: 4.66 };
  const CAM2 = [
    [.665, -1.9, 1.4, .5, 0, .8, 4.3, 1.0, .5],
    [.72, -1.45, 1.22, 1.35, .05, .74, 4.3, 1.05, .45],
    [.79, -1.0, 1.08, 1.5, .05, .62, 4.3, 1.08, .4],
    [.86, .35, 1.3, 1.25, -.1, .7, 4.3, 1.04, .38],
    [.94, 1.1, 1.72, .2, -.25, .74, 4.4, 1.0, .38],
    [1.05, 1.15, 1.75, .1, -.25, .74, 4.4, 1.0, .38],
  ];

  S.kisa = {
    init(el, st) {
      st.cv = el.querySelector('canvas');
      st.ctx = st.cv.getContext('2d');
      st.names = [...el.querySelectorAll('.kx-names li')];
      const r = rng(61);
      st.glow = sprite([[0, 'rgba(255,255,255,1)'], [.18, 'rgba(255,255,255,.55)'], [.45, 'rgba(255,255,255,.16)'], [1, 'rgba(255,255,255,0)']]);
      st.pale = sprite([[0, 'rgba(255,246,222,1)'], [.2, 'rgba(255,236,196,.5)'], [.55, 'rgba(240,214,160,.12)'], [1, 'rgba(240,214,160,0)']]);
      st.gold = sprite([[0, 'rgba(255,240,200,1)'], [.2, 'rgba(250,214,140,.5)'], [.55, 'rgba(230,180,100,.12)'], [1, 'rgba(230,180,100,0)']]);
      st.sun = sprite([[0, 'rgba(255,250,232,1)'], [.06, 'rgba(255,240,200,.9)'], [.2, 'rgba(255,214,150,.3)'], [.5, 'rgba(255,200,140,.08)'], [1, 'rgba(255,190,130,0)']], 256);
      st.dust = sprite([[0, 'rgba(214,190,150,.5)'], [.5, 'rgba(214,190,150,.2)'], [1, 'rgba(214,190,150,0)']], 64);
      st.shadow = sprite([[0, 'rgba(40,28,16,.5)'], [.6, 'rgba(40,28,16,.2)'], [1, 'rgba(40,28,16,0)']], 64);
      st.goldPool = pool(255, 210, 140);
      st.dayPool = pool(230, 226, 214);
      st.noise = document.createElement('canvas');
      st.noise.width = st.noise.height = 160;
      { const ng = st.noise.getContext('2d'), id = ng.createImageData(160, 160);
        for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 20; }
        ng.putImageData(id, 0, 0); }
      // ---- the plain ----
      st.ridges = [[900, 30, .7, [96, 70, 64]], [1600, 70, .45, [134, 100, 90]], [2800, 140, .3, [176, 134, 110]]].map(([d, h, f, col], li) => {
        const pts = [];
        for (let k = 0; k <= 90; k++) { const a = -2.3 + k / 90 * 3.4, n = .45 + .3 * Math.sin(k * .29 * f * 3 + li * 2) + .17 * Math.sin(k * .83 * f * 2 + li) + .08 * Math.abs(Math.sin(k * 2.7 + li * 5)); pts.push([Math.sin(a) * d, h * n * (li === 0 && a < -.6 && a > -1.3 ? 2.2 : 1), 40 + Math.cos(a) * d]); }
        return { pts, col };
      });
      st.palms = [];
      const grove = (x0, x1, z0, z1, n) => { for (let k = 0; k < n; k++) st.palms.push({ x: mix(x0, x1, r()), z: mix(z0, z1, r()), h: 7 + r() * 7, lean: (r() - .5) * .25, ph: r() * 9, fr: Array.from({ length: 9 }, (_, j) => [j / 9 * TAU + r() * .3, .8 + r() * .4]) }); };
      grove(-150, -55, -30, 70, 70); grove(55, 170, -60, 20, 50); grove(-260, 260, 230, 300, 60); grove(-110, -60, -120, -60, 24);
      st.scrub = Array.from({ length: 900 }, () => { const x = (r() - .5) * 240, z = -60 + r() ** 1.3 * 220; return [x, z, .2 + r() * .5, r()]; }).filter(([x, z]) => !(Math.abs(x) < 3 && z < 50 && z > -40));
      // the delegation: leaders in front, the crowd behind; robes dark and pale
      const ROBE = [[.12, .1, .1], [.16, .13, .16], [.62, .58, .5], [.42, .3, .2], [.28, .22, .26]];
      st.crowd = [];
      for (let k = 0; k < 11; k++) st.crowd.push({ x: (k - 5) * 1.25 + (r() - .5) * .3, z: 52 + (r() - .5) * .5, h: 1.74 + r() * .08, robe: k % 3 === 1 ? 2 : 0, cap: k % 2 === 0, lead: true, ph: r() * 9, d: r() * .04 });
      for (let k = 0; k < 430; k++) {
        const z = 54 + r() ** .8 * 22, w = 10 + (z - 54) * 1.3, x = (r() - .5) * 2 * w * (.55 + .45 * r());
        st.crowd.push({ x, z, h: 1.58 + r() * .2, robe: (r() * 5) | 0, cap: false, lead: false, ph: r() * 9, d: .02 + r() * .1 });
      }
      st.crowd.forEach((f) => { f.back = 16 + r() * 12 + (f.z - 52) * .4; f.side = (r() - .5) * 4; f.alb = ROBE[f.robe]; f.head = r() < .5 ? [.66, .62, .54] : f.alb.map((q) => q * .9); });
      st.banners = [[-9, 55.5], [-4.5, 53.6], [4.2, 53.6], [9.5, 55.8], [-15, 60], [15, 60.5], [0, 58], [-21, 66], [21, 66]].map(([x, z], i) => ({ x, z, h: 4.6 + r() * .8, col: [[.48, .14, .12], [.66, .52, .3], [.8, .76, .66], [.2, .22, .34], [.48, .14, .12], [.66, .52, .3], [.8, .76, .66], [.2, .22, .34], [.48, .14, .12]][i], ph: r() * 9, d: r() * .05 }));
      st.tents = [];
      for (let k = 0; k < 15; k++) { const x = -48 + k * 6.8 + (r() - .5) * 3, z = 86 + (r() - .5) * 10 + (k % 2) * 8; st.tents.push({ x, z, w: 3 + r() * 2.5, d: 2.2 + r() * 1.4, h: 1.9 + r() * .8, col: [[.32, .24, .18], [.7, .62, .5], [.54, .3, .2], [.6, .54, .44]][k % 4], rot: (r() - .5) * .3 }); }
      st.beasts = Array.from({ length: 22 }, (_, k) => ({ x: -55 + r() * 110, z: 80 + r() * 26, kind: k < 15 ? (r() < .55 ? 'ck' : 'cs') : 'h', dir: r() < .5 ? -1 : 1, s: .9 + r() * .2, col: k < 15 ? [.52, .4, .28] : [[.3, .2, .14], [.5, .42, .36], [.2, .16, .14]][k % 3] }));
      // ---- the room and the cloak ----
      st.rafters = []; for (let x = RX0 + .3; x < RX1; x += .55) st.rafters.push([x + (r() - .5) * .05, .07 + r() * .03]);
      st.motes = Array.from({ length: 320 }, () => [RX0 + r() * (RX1 - RX0), .2 + r() * 2.7, RZ0 + r() * (RZ1 - RZ0), r() * 9, .3 + r() * .7]);
      st.threadJ = Array.from({ length: (CLOTH.nu + 1) * (CLOTH.nv + 1) }, () => r());
    },

    frame(p, t, el, st) {
      fit(st.cv);
      const c = st.ctx, W = st.cv.width, H = st.cv.height;
      const phone = st.cv.clientWidth < 700;
      const inside = p >= .665;
      const pc = Math.min(1.05, Math.max(-.05, p));
      let [px, py, pz, tx, ty, tz, zoom, sxk] = spline(inside ? CAM2 : CAM1, pc);
      if (phone && !inside) { // a narrow screen walks closer alongside the five
        const w = smooth(seg(p, .17, .215)) * (1 - smooth(seg(p, .405, .44)));
        px = mix(px, tx + (px - tx) * .5, w); pz = mix(pz, tz + (pz - tz) * .5, w); py = mix(py, 1.25, w);
      }
      const dx0 = tx - px, dy0 = ty - py, dz0 = tz - pz;
      const yaw = Math.atan2(dx0, dz0), pitch = Math.atan2(dy0, Math.hypot(dx0, dz0));
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const F = (phone ? W * 1.02 : Math.min(H * .98, W * .62)) * zoom;
      const CX = phone ? W * .5 : W * sxk, CY = phone ? H * .58 : H * .52;
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
      const addLine = (a0, b0) => {
        let a = cs(...a0), b = cs(...b0);
        if (a[2] <= NEAR && b[2] <= NEAR) return;
        if (a[2] <= NEAR) { const k = (NEAR - a[2]) / (b[2] - a[2]); a = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, NEAR]; }
        if (b[2] <= NEAR) { const k = (NEAR - b[2]) / (a[2] - b[2]); b = [b[0] + (a[0] - b[0]) * k, b[1] + (a[1] - b[1]) * k, NEAR]; }
        c.moveTo(SX(a), SY(a)); c.lineTo(SX(b), SY(b));
      };
      const halo = (x, y, R, img, a) => {
        if (a <= .01 || x + R < 0 || x - R > W || y + R < 0 || y - R > H) return;
        c.globalAlpha = Math.min(1, a); c.drawImage(img, x - R, y - R, R * 2, R * 2); c.globalAlpha = 1;
      };
      const planeSprite = (O, U, V, R, img, a) => {
        if (a <= .004) return;
        const pa = sc(O[0] + U[0] * R, O[1] + U[1] * R, O[2] + U[2] * R), pb = sc(O[0] - U[0] * R, O[1] - U[1] * R, O[2] - U[2] * R);
        const pc2 = sc(O[0] + V[0] * R, O[1] + V[1] * R, O[2] + V[2] * R), pd = sc(O[0] - V[0] * R, O[1] - V[1] * R, O[2] - V[2] * R);
        if (!pa || !pb || !pc2 || !pd) { if (R > .3) planeSprite(O, U, V, R * .6, img, a * .8); return; }
        const ux = (pa[0] - pb[0]) / 2, uy = (pa[1] - pb[1]) / 2, vx = (pc2[0] - pd[0]) / 2, vy = (pc2[1] - pd[1]) / 2;
        if (Math.abs(ux) + Math.abs(uy) > W * 6) return;
        c.globalAlpha = Math.min(1, a);
        c.setTransform(ux, uy, vx, vy, (pa[0] + pb[0] + pc2[0] + pd[0]) / 4, (pa[1] + pb[1] + pc2[1] + pd[1]) / 4);
        c.drawImage(img, -1, -1, 2, 2);
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.globalAlpha = 1;
      };
      // one of the five: a veiled figure (scenes/holy.js) on its ground point, sheared to keep the view's verticals, never
      // under 22 css px; m is the standing height in metres; hands are 3D points turned into holy.js arm targets;
      // clipY keeps only what is above that screen line (the head, veil and disc over the cloak)
      const figure = (i, x, z, o, hands, clipY) => {
        const a = sc(x, 0, z), b = sc(x, 1, z); if (!a || !b) return null;
        const kx = (b[0] - a[0]) / ((b[1] - a[1]) || -1), h = Math.max(22 * W / (st.cv.clientWidth || W), HM[i] * Math.hypot(b[0] - a[0], b[1] - a[1]));
        const arms = hands && hands.map((P) => { const q = sc(...P); return q ? [(q[0] - kx * (q[1] - a[1]) - a[0]) / h, (q[1] - a[1]) / h] : [.1, -.4]; });
        c.save();
        if (clipY !== undefined) { c.beginPath(); c.rect(0, 0, W, clipY); c.clip(); }
        c.setTransform(1, 0, kx, 1, -kx * a[1], 0);
        const hd = Holy.draw(c, { who: WHO[i], x: a[0], y: a[1], h, t, child: i < 2, ...o, arms });
        c.restore();
        return hd && { x: hd.x + kx * (hd.y - a[1]), y: hd.y, r: hd.r };
      };
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;

      if (!inside) plain(); else room();

      // the two parts meet in a bloom that grows out of the five lights, so the cut is never seen
      const bloom = smooth(seg(p, .628, .665)) * (1 - smooth(seg(p, .665, .695)));
      if (bloom > .002) {
        const o = inside ? sc(0, .94, 4.62) : sc(FIVE[2].dx, FIVE[2].y, gz(p) + FIVE[2].dz), bx = o ? o[0] : CX, by = o ? o[1] : CY; // from the Prophet's disc
        const R = Math.hypot(W, H) * mix(.12, 1.25, bloom ** .7), g = c.createRadialGradient(bx, by, 0, bx, by, R), a = .98 * bloom ** .6;
        g.addColorStop(0, `rgba(255,244,222,${a.toFixed(3)})`); g.addColorStop(.55, `rgba(255,236,204,${(a * bloom ** 2).toFixed(3)})`); g.addColorStop(1, 'rgba(255,230,196,0)');
        c.globalCompositeOperation = bloom > .8 ? 'source-over' : 'lighter'; c.fillStyle = g; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
      }
      // grade
      c.globalCompositeOperation = 'overlay';
      c.fillStyle = c.createPattern(st.noise, 'repeat');
      c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      const vg = c.createRadialGradient(CX, CY, Math.min(W, H) * .3, CX, CY, Math.hypot(W, H) * .7);
      vg.addColorStop(0, 'rgba(10,7,4,0)'); vg.addColorStop(1, `rgba(10,7,4,${inside ? .55 : .35})`);
      c.fillStyle = vg; c.fillRect(0, 0, W, H);

      // ================= part one =================
      function plain() {
        const G = gz(p);
        const hz = CY + F * Math.tan(pitch);
        const fog = (d) => 1 - Math.exp(-d / 520);
        const hazed = (col, d) => mixc(col, HAZE, fog(d));
        // sky and the low sun
        const sky = c.createLinearGradient(0, hz - F * .9, 0, hz);
        sky.addColorStop(0, rgb(SKYTOP)); sky.addColorStop(.55, rgb([104, 108, 126])); sky.addColorStop(.85, rgb([206, 150, 108])); sky.addColorStop(1, rgb([240, 186, 126]));
        c.fillStyle = sky; c.fillRect(0, 0, W, Math.max(0, hz) + 2);
        const sq = cs(px + SUN[0] * 1e4, py + SUN[1] * 1e4, pz + SUN[2] * 1e4);
        if (sq[2] > 0) { c.globalCompositeOperation = 'lighter'; halo(SX(sq), SY(sq), F * .9, st.sun, .4); halo(SX(sq), SY(sq), F * .045, st.glow, .9); c.globalCompositeOperation = 'source-over'; }
        // far hills in haze
        for (let k = st.ridges.length - 1; k >= 0; k--) {
          const rd = st.ridges[k];
          c.beginPath(); let ok = false, first = true;
          for (const [x, y, z] of rd.pts) { const q = cs(x, y, z); if (q[2] <= 1) { first = true; continue; } const X = SX(q), Y = SY(q); if (first) { c.moveTo(X, H * 2); c.lineTo(X, Y); first = false; } else c.lineTo(X, Y); ok = true; }
          if (!ok) continue;
          c.lineTo(W * 3, H * 2); c.closePath();
          c.fillStyle = rgb(rd.col); c.fill();
        }
        // the ground
        const gg = c.createLinearGradient(0, hz, 0, H);
        gg.addColorStop(0, rgb([214, 160, 108])); gg.addColorStop(.18, rgb([164, 118, 78])); gg.addColorStop(1, rgb([82, 58, 40]));
        c.fillStyle = gg; c.fillRect(0, Math.max(0, hz), W, H);
        // scrub and stones, long shadows
        const shx = -SUN[0] / SUN[1] * .7, shz = -SUN[2] / SUN[1] * .7;
        c.fillStyle = 'rgba(50,34,22,.35)'; c.beginPath();
        for (const [x, z, s] of st.scrub) { const a = sc(x, 0, z), b = sc(x + shx * s * 1.6, 0, z + shz * s * 1.6); if (!a || !b || a[2] > 220 || a[2] < 3) continue; const k = s * .6 * F / a[2]; if (k < .3) continue; c.moveTo(a[0] - k, a[1]); c.lineTo(b[0], b[1]); c.lineTo(a[0] + k, a[1]); c.closePath(); }
        c.fill();
        c.fillStyle = 'rgba(58,48,28,.85)'; c.beginPath();
        for (const [x, z, s, v] of st.scrub) { const q = sc(x, s * .35, z); if (!q || q[2] > 220 || q[2] < 3) continue; const k = s * .55 * F / q[2]; if (k < .35) continue; c.moveTo(q[0] + k, q[1]); c.ellipse(q[0], q[1], k, k * .55, 0, 0, TAU); c.moveTo(q[0] + k * .2 + k * .55, q[1] - k * .25); c.ellipse(q[0] + k * .2, q[1] - k * .25, k * .55, k * .45, 0, 0, TAU); c.moveTo(q[0] - k * .45 + k * .5, q[1] - k * .1); c.ellipse(q[0] - k * .45, q[1] - k * .1, k * .5, k * .4, 0, 0, TAU); }
        c.fill();
        c.fillStyle = 'rgba(236,180,110,.35)'; c.beginPath();
        for (const [x, z, s] of st.scrub) { const q = sc(x, s * .35, z); if (!q || q[2] > 120 || q[2] < 3) continue; const k = s * .55 * F / q[2]; if (k < .8) continue; c.moveTo(q[0] + k * .9, q[1] - k * .4); c.ellipse(q[0] + k * .1, q[1] - k * .45, k * .7, k * .22, 0, 0, TAU); }
        c.fill();
        // the delegation, its camp and its beasts, the palms and the five: far to near
        const items = [];
        const wd = smooth(seg(p, .515, .6)), hes = Math.sin(Math.PI * seg(p, .445, .53));
        st.palms.forEach((pm) => { const q = cs(pm.x, 4, pm.z); if (q[2] > 2) items.push([q[2], () => palm(pm, q[2])]); });
        st.tents.forEach((tn) => { const q = cs(tn.x, 1, tn.z); if (q[2] > 2) items.push([q[2] + 2, () => tent(tn, q[2])]); });
        st.beasts.forEach((b) => { const q = cs(b.x, 1, b.z); if (q[2] > 2) items.push([q[2], () => beast(b, q[2])]); });
        const crowdNow = st.crowd.map((f) => {
          const e = smooth(seg(wd, f.d * 2, 1));
          const lean = hes * (f.lead ? .9 : .35) * (.5 + .5 * Math.sin(f.ph));
          return [f.x + f.side * e, f.z + lean + f.back * e, f];
        });
        crowdNow.forEach(([x, z, f]) => { const q = cs(x, 1, z); if (q[2] > 1.5) items.push([q[2], () => person(x, z, f, q[2])]); });
        st.banners.forEach((b) => { const e = smooth(seg(wd, b.d, 1)); const x = b.x, z = b.z + e * (20 + b.d * 40); const q = cs(x, 2, z); if (q[2] > 1.5) items.push([q[2] - .05, () => banner(b, x, z, e, q[2])]); });
        const lights = FIVE.map((L, i) => {
          const walking = 1 - seg(p, .41, .44);
          const bob = .025 * Math.sin((G + L.dz) * 4.1 + i) * walking;
          return { x: L.dx, y: L.y + bob, z: G + L.dz, L, i };
        });
        // all five walk to the halt, then stand; the Prophet holds Ali by the hand: each reaches to the point between them
        const held = [(lights[2].x + lights[3].x) / 2, .98 + lights[2].y - FIVE[2].y, lights[2].z], heads = [];
        lights.forEach((l) => { const q = cs(l.x, 0, l.z); if (q[2] > NEAR) items.push([q[2], () => { heads[l.i] = figure(l.i, l.x, l.z, { pose: p < .43 ? 'walk' : 'stand', phase: (G + l.L.dz) / 1.3 + l.i * .23, amb: .95 }, l.i === 2 || l.i === 3 ? [held] : undefined); }]); });
        items.sort((a, b) => b[0] - a[0]);
        // shadows and pools on the ground first
        c.globalCompositeOperation = 'source-over';
        crowdNow.forEach(([x, z, f]) => { const q = cs(x, 0, z); if (q[2] < 1.5 || q[2] > 160) return; planeSprite([x + shx * f.h * .5, .01, z + shz * f.h * .5], [1, 0, 0], [0, 0, 1], f.h * .8, st.shadow, .55); });
        c.globalCompositeOperation = 'lighter';
        lights.forEach((l) => planeSprite([l.x, .01, l.z], [1, 0, 0], [0, 0, 1], 2 + l.L.r * 4, st.goldPool, .18));
        c.globalCompositeOperation = 'source-over';
        for (const [, fn] of items) fn();
        // dust raised as the delegation draws back
        if (wd > 0 && wd < 1) {
          c.globalCompositeOperation = 'source-over';
          for (let k = 0; k < 40; k++) {
            const x = -26 + (k * 37 % 52), z = 56 + (k * 13 % 18) + wd * 12, q = sc(x, 1.2 + (k % 3), z); if (!q) continue;
            halo(q[0], q[1], (3 + (k % 4)) * F / q[2], st.dust, .35 * Math.sin(Math.PI * wd));
          }
        }
        // morning haze over the far ground
        const hg = c.createLinearGradient(0, hz - F * .06, 0, hz + F * .12);
        hg.addColorStop(0, 'rgba(226,210,180,0)'); hg.addColorStop(.45, 'rgba(226,210,180,.35)'); hg.addColorStop(1, 'rgba(226,210,180,0)');
        c.fillStyle = hg; c.fillRect(0, 0, W, H);
        // a soft warm bloom at each disc in the morning light
        c.globalCompositeOperation = 'lighter';
        heads.forEach((q, i) => { if (q) halo(q.x, q.y, Math.min(H * .7, 6 * q.r), SPR(st, i), .16); });
        c.globalCompositeOperation = 'source-over';
        // labels follow the five while they walk: above the disc, or for the two Imams in front, below their feet (the
        // head of a child is 9.86 r above its ground point), clear of the delegation on the horizon
        const la = c01(Math.min(seg(p, .22, .26), 1 - seg(p, .36, .4)));
        st.names.forEach((li, k) => {
          const q = heads[ORDER[k]];
          if (!q || la <= 0 || phone) { li.style.opacity = 0; return; }
          const css = st.cv.clientWidth / W, y = k > 2 ? (q.y + q.r * 9.86) * css + 14 : (q.y - q.r * 2.9) * css - 14;
          li.style.opacity = la.toFixed(3);
          li.style.transform = `translate(${(q.x * css).toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
        });

        // --- drawers ---
        function palm(pm, d) {
          const b = sc(pm.x, 0, pm.z), tp = sc(pm.x + pm.lean * pm.h, pm.h, pm.z); if (!b || !tp) return;
          const s = F / d, col = rgb(hazed([58, 62, 40], d));
          c.strokeStyle = rgb(hazed([66, 54, 38], d)); c.lineWidth = Math.max(1, .32 * s);
          c.beginPath(); c.moveTo(b[0], b[1]); c.quadraticCurveTo(b[0], (b[1] + tp[1]) / 2, tp[0], tp[1]); c.stroke();
          c.strokeStyle = col; c.lineWidth = Math.max(1, .22 * s);
          c.beginPath();
          pm.fr.forEach(([a, l]) => { const sw = .12 * Math.sin(t * .8 + pm.ph + a); const ex = Math.cos(a + sw) * 3.2 * l, ey = (Math.sin(a + sw) * .8 - .9) * l; c.moveTo(tp[0], tp[1]); c.quadraticCurveTo(tp[0] + ex * .6 * s, tp[1] - (1.1 * l) * s, tp[0] + ex * s, tp[1] - ey * s); });
          c.stroke();
        }
        function tent(tn, d) {
          const ca = Math.cos(tn.rot), sa = Math.sin(tn.rot);
          const P = (u, y, v) => [tn.x + u * ca + v * sa, y, tn.z - u * sa + v * ca];
          const w = tn.w / 2, dd = tn.d / 2;
          const faces = [
            { pts: [P(-w, 0, -dd), P(w, 0, -dd), P(w, tn.h, 0), P(-w, tn.h, 0)], n: [0, dd, -tn.h] },
            { pts: [P(w, 0, dd), P(-w, 0, dd), P(-w, tn.h, 0), P(w, tn.h, 0)], n: [0, dd, tn.h] },
            { pts: [P(-w, 0, dd), P(-w, 0, -dd), P(-w, tn.h, 0)], n: [-1, 0, 0] },
            { pts: [P(w, 0, -dd), P(w, 0, dd), P(w, tn.h, 0)], n: [1, 0, 0] },
          ];
          faces.forEach((f) => {
            const nn = Math.hypot(...f.n), n = [(f.n[0] * ca + f.n[2] * sa) / nn, f.n[1] / nn, (-f.n[0] * sa + f.n[2] * ca) / nn];
            const m = f.pts[0];
            if ((px - m[0]) * n[0] + (py - m[1]) * n[1] + (pz - m[2]) * n[2] <= 0) return;
            const lam = Math.max(0, n[0] * SUN[0] + n[1] * SUN[1] + n[2] * SUN[2]);
            fillPoly(f.pts, rgb(hazed(shadeOf(tn.col, [.55 + 1.3 * lam, .52 + 1.2 * lam, .5 + 1 * lam]), d)));
          });
        }
        function beast(b, d) {
          const q = sc(b.x, 0, b.z); if (!q) return;
          const s = F / d * b.s, k = b.dir;
          c.fillStyle = rgb(hazed(shadeOf(b.col, [.75, .7, .66]), d));
          c.beginPath();
          if (b.kind === 'ck') { // a camel kneeling, legs folded under
            c.moveTo(q[0] - 1.3 * k * s, q[1]); c.bezierCurveTo(q[0] - 1.4 * k * s, q[1] - .9 * s, q[0] - .2 * k * s, q[1] - 1.55 * s, q[0] + .5 * k * s, q[1] - 1.0 * s);
            c.quadraticCurveTo(q[0] + 1.0 * k * s, q[1] - 1.2 * s, q[0] + 1.25 * k * s, q[1] - 1.75 * s); c.lineTo(q[0] + 1.6 * k * s, q[1] - 1.7 * s); c.lineTo(q[0] + 1.55 * k * s, q[1] - 1.55 * s);
            c.quadraticCurveTo(q[0] + 1.15 * k * s, q[1] - .8 * s, q[0] + .9 * k * s, q[1] - .3 * s); c.lineTo(q[0] + .95 * k * s, q[1]); c.closePath();
          } else if (b.kind === 'cs') { // standing
            c.moveTo(q[0] - 1.1 * k * s, q[1] - 1.2 * s); c.bezierCurveTo(q[0] - 1.2 * k * s, q[1] - 1.9 * s, q[0] - .1 * k * s, q[1] - 2.5 * s, q[0] + .55 * k * s, q[1] - 1.75 * s);
            c.quadraticCurveTo(q[0] + 1.05 * k * s, q[1] - 1.9 * s, q[0] + 1.25 * k * s, q[1] - 2.45 * s); c.lineTo(q[0] + 1.6 * k * s, q[1] - 2.42 * s); c.lineTo(q[0] + 1.55 * k * s, q[1] - 2.27 * s);
            c.quadraticCurveTo(q[0] + 1.15 * k * s, q[1] - 1.6 * s, q[0] + .8 * k * s, q[1] - 1.25 * s); c.closePath();
            [-.85, -.6, .45, .65].forEach((u) => c.rect(q[0] + u * k * s - .06 * s, q[1] - 1.3 * s, .12 * s, 1.3 * s));
          } else { // a horse
            c.moveTo(q[0] - .8 * k * s, q[1] - .85 * s); c.bezierCurveTo(q[0] - .9 * k * s, q[1] - 1.45 * s, q[0] + .4 * k * s, q[1] - 1.45 * s, q[0] + .6 * k * s, q[1] - 1.3 * s);
            c.lineTo(q[0] + .95 * k * s, q[1] - 1.75 * s); c.lineTo(q[0] + 1.15 * k * s, q[1] - 1.55 * s); c.lineTo(q[0] + .75 * k * s, q[1] - 1.0 * s); c.closePath();
            [-.7, -.5, .4, .55].forEach((u) => c.rect(q[0] + u * k * s - .04 * s, q[1] - .95 * s, .08 * s, .95 * s));
          }
          c.fill();
        }
        function person(x, z, f, d) {
          const q = sc(x, 0, z), tq = sc(x, f.h, z); if (!q || !tq) return;
          const s = F / d, hh = q[1] - tq[1];
          if (hh < 1.2) { c.fillStyle = rgb(hazed(shadeOf(f.alb, [.5, .48, .46]), d)); c.fillRect(q[0] - .2 * s, tq[1], Math.max(1, .4 * s), hh); return; }
          const k = hh / f.h, wb = .27 * s, ws = .2 * s, hw = .1 * s;
          c.beginPath();
          c.moveTo(q[0] - wb, q[1]);
          c.quadraticCurveTo(q[0] - wb * 1.05, q[1] - .8 * k, q[0] - ws, q[1] - 1.38 * k);
          c.quadraticCurveTo(q[0] - ws * .7, q[1] - 1.47 * k, q[0] - hw * .9, q[1] - 1.5 * k);
          c.bezierCurveTo(q[0] - hw * 1.3, q[1] - (f.h - .02) * k, q[0] + hw * 1.3, q[1] - (f.h - .02) * k, q[0] + hw * .9, q[1] - 1.5 * k);
          c.quadraticCurveTo(q[0] + ws * .7, q[1] - 1.47 * k, q[0] + ws, q[1] - 1.38 * k);
          c.quadraticCurveTo(q[0] + wb * 1.05, q[1] - .8 * k, q[0] + wb, q[1]);
          c.closePath();
          c.fillStyle = rgb(hazed(shadeOf(f.alb, [.36, .32, .3]), d)); c.fill();
          // the low sun behind them rims the cloaks
          c.strokeStyle = `rgba(255,200,130,${(.4 * (1 - fog(d))).toFixed(3)})`; c.lineWidth = Math.max(.8, .035 * s); c.stroke();
          c.fillStyle = rgb(hazed(shadeOf(f.head, [.42, .38, .34]), d));
          c.beginPath(); c.ellipse(q[0], q[1] - 1.6 * k, hw * 1.05, .12 * k, 0, 0, TAU);
          if (!f.cap) { c.moveTo(q[0] - hw * 1.05, q[1] - 1.6 * k); c.quadraticCurveTo(q[0] - hw * 1.5, q[1] - 1.45 * k, q[0] - ws * .9, q[1] - 1.36 * k); c.lineTo(q[0] + ws * .9, q[1] - 1.36 * k); c.quadraticCurveTo(q[0] + hw * 1.5, q[1] - 1.45 * k, q[0] + hw * 1.05, q[1] - 1.6 * k); }
          c.fill();
          if (f.cap) { c.fillStyle = rgb(hazed([24, 20, 24], d)); c.fillRect(q[0] - hw * .95, q[1] - (f.h + .2) * k, hw * 1.9, .26 * k); }
          c.fillStyle = `rgba(255,214,150,${(.5 * (1 - fog(d))).toFixed(3)})`; c.fillRect(q[0] - hw * .7, q[1] - (f.h + (f.cap ? .2 : 0)) * k, hw * 1.4, Math.max(1, .03 * s));
        }
        function banner(b, x, z, e, d) {
          const tilt = e * .9; // lowered as they draw back
          const top = [x - Math.sin(tilt) * b.h * .4, b.h * Math.cos(tilt * .6), z + Math.sin(tilt) * b.h * .7];
          const q0 = sc(x, 0, z), q1 = sc(...top); if (!q0 || !q1) return;
          c.strokeStyle = rgb(hazed([60, 44, 30], d)); c.lineWidth = Math.max(1, .06 * F / d);
          c.beginPath(); c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); c.stroke();
          const N = 8, L = 1.5, Hh = .95, pts = [], pts2 = [];
          for (let k = 0; k <= N; k++) {
            const u = k / N, w = Math.sin(u * 5 - t * 3.2 + b.ph) * .14 * u + Math.sin(u * 9 - t * 5 + b.ph) * .05 * u;
            pts.push([top[0] + u * L, top[1] - .05 - u * .12 * (1 + e), top[2] + w]);
            pts2.push([top[0] + u * L, top[1] - Hh - u * .2 * (1 + e), top[2] + w * 1.2]);
          }
          for (let k = 0; k < N; k++) {
            const sh = .78 + .3 * Math.sin(k * 5 / N * 1.2 - t * 3.2 + b.ph);
            fillPoly([pts[k], pts[k + 1], pts2[k + 1], pts2[k]], rgb(hazed(shadeOf(b.col, [sh, sh * .96, sh * .9]), d)));
          }
        }
      }

      // ================= part two: the room =================
      function room() {
        // the Prophet sits wrapped in the cloak; he spreads it and brings the four in under it; then their light fills the room
        const spread = ease.io(seg(p, .7, .8));
        const sc0 = mix(.34, 1, spread);
        const glowUp = smooth(seg(p, .79, .92));
        const ext = { x0: CLOTH.ox + (CLOTH.x0 - CLOTH.ox) * sc0, x1: CLOTH.ox + (CLOTH.x1 - CLOTH.ox) * sc0, z0: CLOTH.oz + (CLOTH.z0 - CLOTH.oz) * sc0, z1: CLOTH.oz + (CLOTH.z1 - CLOTH.oz) * sc0 };
        const P5 = SEAT.map((sv, i) => {
          const m = Math.min(sv[0] - ext.x0, ext.x1 - sv[0], sv[2] - ext.z0, ext.z1 - sv[2]);
          return { x: sv[0], y: sv[1], z: sv[2], L: FIVE[i], i, cover: smooth(c01((m - .05) / .3)) };
        });
        const L = [
          { x: (WIN[0] + WIN[1]) / 2, y: 2.15, z: RZ1 - .25, c: [.92, .94, 1], i: 1.25 * (1 - .55 * glowUp), r2: 5, k: 'day' },
          { x: RX0 + .25, y: 1.1, z: (CURT[0] + CURT[1]) / 2, c: [1, .88, .72], i: .8, r2: 3, k: 'day' },
        ];
        P5.forEach((l) => L.push({ x: l.x, y: l.y, z: l.z, c: [1, .8, .5], i: (l.i === 2 ? .8 : .5) * (1 - .35 * l.cover) * (1 - glowUp) + (l.i === 2 ? 1.1 : .8) * glowUp, r2: 1.6 + 1.8 * glowUp, k: 'holy' }));
        const AMB = [.05, .05, .06];
        const lit = (x, y, z, nx, ny, nz) => {
          let R = AMB[0], Gg = AMB[1], B = AMB[2];
          for (let k = 0; k < L.length; k++) {
            const l = L[k], ddx = l.x - x, ddy = l.y - y, ddz = l.z - z, d2 = ddx * ddx + ddy * ddy + ddz * ddz, d = Math.sqrt(d2) || 1;
            const lam = ((nx * ddx + ny * ddy + nz * ddz) / d + .3) / 1.3;
            if (lam <= 0) continue;
            const e = l.i * lam / (1 + d2 / l.r2);
            R += l.c[0] * e; Gg += l.c[1] * e; B += l.c[2] * e;
          }
          return [R, Gg, B];
        };
        c.fillStyle = '#0e0a07'; c.fillRect(0, 0, W, H);
        const SURF = [
          { n: [0, 0, -1], o: [0, 0, RZ1], u: [1, 0, 0], v: [0, 1, 0], pts: [[RX0, 0, RZ1], [RX1, 0, RZ1], [RX1, RH, RZ1], [RX0, RH, RZ1]], alb: [.66, .54, .4], hole: [[WIN[0], WIN[2], RZ1], [WIN[0], WIN[3], RZ1], [WIN[1], WIN[3], RZ1], [WIN[1], WIN[2], RZ1]] },
          { n: [0, 0, 1], o: [0, 0, RZ0], u: [1, 0, 0], v: [0, 1, 0], pts: [[RX0, 0, RZ0], [RX0, RH, RZ0], [RX1, RH, RZ0], [RX1, 0, RZ0]], alb: [.66, .54, .4] },
          { n: [1, 0, 0], o: [RX0, 0, 0], u: [0, 0, 1], v: [0, 1, 0], pts: [[RX0, 0, RZ0], [RX0, 0, RZ1], [RX0, RH, RZ1], [RX0, RH, RZ0]], alb: [.64, .52, .38], hole: [[RX0, 0, CURT[0]], [RX0, CURT[2], CURT[0]], [RX0, CURT[2], CURT[1]], [RX0, 0, CURT[1]]] },
          { n: [-1, 0, 0], o: [RX1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], pts: [[RX1, 0, RZ0], [RX1, RH, RZ0], [RX1, RH, RZ1], [RX1, 0, RZ1]], alb: [.64, .52, .38] },
          { n: [0, 1, 0], o: [0, 0, 0], u: [1, 0, 0], v: [0, 0, 1], pts: [[RX0, 0, RZ0], [RX1, 0, RZ0], [RX1, 0, RZ1], [RX0, 0, RZ1]], alb: [.42, .32, .22], floor: true },
          { n: [0, -1, 0], o: [0, RH, 0], u: [1, 0, 0], v: [0, 0, 1], pts: [[RX0, RH, RZ0], [RX0, RH, RZ1], [RX1, RH, RZ1], [RX1, RH, RZ0]], alb: [.28, .2, .13] },
        ];
        // the morning outside the window
        c.save(); c.beginPath();
        if (addPoly(SURF[0].hole)) { c.clip(); const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#bcd2e2'); g.addColorStop(1, '#f6e8c8'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
        c.restore();
        SURF.forEach((s) => {
          c.beginPath();
          if (!addPoly(s.pts)) return;
          if (s.hole) addPoly(s.hole);
          const wb = lit(s.n[0] ? s.o[0] : 0, s.n[1] ? s.o[1] : 1.2, s.n[2] ? s.o[2] : 3.8, ...s.n).map((v, k) => AMB[k] * 1.5 + (v - AMB[k]) * .45 * glowUp);
          c.fillStyle = rgb(shadeOf(s.alb, wb)); c.fill('evenodd');
          c.save(); c.clip('evenodd');
          if (s.n[1] === 0) {
            const P3 = (u, y) => (s.n[0] ? [s.o[0], y, u] : [u, y, s.o[2]]), span = s.n[0] ? [RZ0, RZ1] : [RX0, RX1];
            fillPoly([P3(span[0], 0), P3(span[1], 0), P3(span[1], .32), P3(span[0], .32)], 'rgba(30,18,8,.28)');
            c.strokeStyle = 'rgba(40,24,10,.12)'; c.lineWidth = Math.max(1, H / 1100); c.beginPath();
            let row = 0;
            for (let y = .32; y < RH - .2; y += .27, row++) { addLine(P3(span[0], y), P3(span[1], y)); for (let u = span[0] + (row % 2) * .29 + ((row * 7) % 5) * .03; u < span[1]; u += .58) addLine(P3(u, y), P3(u, y + .27)); }
            c.stroke();
          }
          c.globalCompositeOperation = 'lighter';
          L.forEach((l) => {
            const d = (l.x - s.o[0]) * s.n[0] + (l.y - s.o[1]) * s.n[1] + (l.z - s.o[2]) * s.n[2];
            if (d <= 0) return;
            const dd = Math.max(d, .6), R = 1 + 3.4 * dd;
            planeSprite([l.x - s.n[0] * d, l.y - s.n[1] * d, l.z - s.n[2] * d], s.u, s.v, R, l.k === 'day' ? st.dayPool : st.goldPool, (s.floor ? .32 : s.n[1] < 0 ? .22 : .4) * l.i / (.5 + dd * dd));
          });
          c.globalCompositeOperation = 'source-over';
          if (s.n[1] === 0) { // shade gathers under the roof
            const wx = s.n[0] ? s.o[0] : Math.min(RX1, Math.max(RX0, px)), wz = s.n[0] ? Math.min(RZ1, Math.max(RZ0, pz + 3)) : s.o[2];
            const a = sc(wx, RH, wz), b = sc(wx, 1.5, wz);
            if (a && b) { const g = c.createLinearGradient(a[0], a[1], b[0], b[1]); g.addColorStop(0, 'rgba(12,7,3,.5)'); g.addColorStop(1, 'rgba(12,7,3,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
          }
          c.restore();
        });
        // the curtain in the doorway, the sun behind it, its folds
        c.beginPath();
        if (addPoly([[RX0 + .03, 0, CURT[0]], [RX0 + .03, CURT[2], CURT[0]], [RX0 + .03, CURT[2], CURT[1]], [RX0 + .03, 0, CURT[1]]])) {
          const a = sc(RX0, 1, CURT[0]), b = sc(RX0, 1, CURT[1]);
          if (a && b) { const g = c.createLinearGradient(a[0], 0, b[0], 0); for (let k = 0; k <= 10; k++) { const v = .78 + .22 * Math.sin(k * 2.2 + .5); g.addColorStop(k / 10, `rgb(${(240 * v) | 0},${(206 * v) | 0},${(156 * v) | 0})`); } c.fillStyle = g; } else c.fillStyle = '#d8b88a';
          c.fill();
        }
        // a niche with an unlit lamp; a waterskin on its peg
        { const pts = []; for (let k = 0; k <= 8; k++) { const a = Math.PI * k / 8; pts.push([RX1 - .01, 1.75 + .16 * Math.sin(a), 2.6 + .2 * Math.cos(a)]); } fillPoly([[RX1 - .01, 1.3, 2.8], ...pts, [RX1 - .01, 1.3, 2.4]], rgb(shadeOf([.3, .22, .15], lit(RX1, 1.5, 2.6, -1, 0, 0).map((v) => v * .5)))); }
        { const q = sc(RX0 + .08, 1.35, 3.3), q2 = sc(RX0 + .08, 1.9, 3.3); if (q && q2) { const s = F / q[2], e = lit(RX0 + .1, 1.3, 3.3, 1, 0, 0); c.strokeStyle = 'rgba(30,20,10,.8)'; c.lineWidth = Math.max(1, .015 * s); c.beginPath(); c.moveTo(q2[0], q2[1]); c.lineTo(q[0], q[1] - .25 * s); c.stroke(); c.fillStyle = rgb(shadeOf([.44, .3, .18], e)); c.beginPath(); c.ellipse(q[0], q[1], .16 * s, .24 * s, .15, 0, TAU); c.fill(); } }
        // roof
        [1.4, 4.0].forEach((z) => fillPoly([[RX0, RH - .3, z - .14], [RX1, RH - .3, z - .14], [RX1, RH - .3, z + .14], [RX0, RH - .3, z + .14]], rgb(shadeOf([.32, .22, .14], lit(0, RH - .4, z, 0, -1, 0)))));
        st.rafters.forEach(([x, rr]) => {
          const e = lit(x, RH - .3, 3, 0, -1, 0);
          fillPoly([[x - rr, RH - .08, RZ0], [x + rr, RH - .08, RZ0], [x + rr, RH - .08, RZ1], [x - rr, RH - .08, RZ1]], rgb(shadeOf([.36, .26, .17], e)));
        });
        // the reed mat
        const mat = [[-2.0, .006, 1.9], [2.0, .006, 1.9], [2.0, .006, 5.7], [-2.0, .006, 5.7]];
        fillPoly(mat, rgb(shadeOf([.56, .44, .26], lit(0, 0, 4, 0, 1, 0).map((v) => v * .55))));
        c.strokeStyle = 'rgba(50,32,14,.3)'; c.lineWidth = Math.max(1, H / 1100); c.beginPath();
        for (let z = 1.96; z < 5.7; z += .1) addLine([-1.98, .007, z], [1.98, .007, z]);
        c.stroke();
        c.strokeStyle = 'rgba(40,24,10,.55)'; c.lineWidth = Math.max(1, H / 700); c.beginPath(); addLine([-1.98, .007, 1.92], [1.98, .007, 1.92]); addLine([-1.98, .007, 5.68], [1.98, .007, 5.68]); c.stroke();
        // pools of light on the floor: the window's patch, the five
        c.save(); c.beginPath();
        if (addPoly(SURF[4].pts)) {
          c.clip();
          c.globalCompositeOperation = 'lighter';
          planeSprite([WIN[0] - .25, .01, 2.6], [1, 0, 0], [0, 0, 1], .9, st.dayPool, .55);
          P5.forEach((l) => planeSprite([l.x, .01, l.z], [1, 0, 0], [0, 0, 1], .8 + 2.4 * glowUp, st.goldPool, .18 + .12 * glowUp));
        }
        c.restore();
        c.globalCompositeOperation = 'source-over';
        jar(2.2, 5.3); jar(2.5, 4.85, .78);
        // the five seated, far to near; the cloak over them; then each one again above the cloth from the shoulders up
        // (the whole figure while the cloak has not reached it), so the heads, veils and discs show over the cloak
        const order = P5.slice().sort((a, b) => cs(b.x, b.y, b.z)[2] - cs(a.x, a.y, a.z)[2]), heads = [];
        const seated = { pose: 'sit', amb: .6 };
        order.forEach((l) => figure(l.i, l.x, l.z, { ...seated, glow: 0 }));
        cloak(P5, sc0, glowUp);
        order.forEach((l) => { const g = sc(l.x, 0, l.z), sh = sc(l.x, .4 * HM[l.i], l.z); if (g && sh) heads[l.i] = figure(l.i, l.x, l.z, seated, undefined, mix(g[1], sh[1], l.cover)); });
        // the air of the room: the window's shaft, the radiance, motes
        c.globalCompositeOperation = 'lighter';
        { const a = sc((WIN[0] + WIN[1]) / 2, (WIN[2] + WIN[3]) / 2, RZ1), b = sc(WIN[0] - .25, .05, 2.6);
          if (a && b) [[1, .05], [.7, .05], [.45, .06]].forEach(([w, al]) => { const g = c.createLinearGradient(a[0], a[1], b[0], b[1]); g.addColorStop(0, `rgba(255,248,230,${al})`); g.addColorStop(1, 'rgba(255,248,230,0)'); c.fillStyle = g; const w1 = .28 * w * F / a[2], w2 = .9 * w * F / b[2]; c.beginPath(); c.moveTo(a[0] - w1, a[1]); c.lineTo(a[0] + w1, a[1]); c.lineTo(b[0] + w2, b[1]); c.lineTo(b[0] - w2, b[1]); c.closePath(); c.fill(); }); }
        P5.forEach((l) => { // their light fills the room, from each disc
          const q = sc(l.x, l.y, l.z), hd = heads[l.i]; if (!q) return;
          const R = l.L.r * F / q[2];
          halo(hd ? hd.x : q[0], hd ? hd.y : q[1], Math.min(H * .55, R * (5 + 6 * glowUp)), SPR(st, l.i), (.08 + .04 * glowUp) * (1 - .4 * l.cover * (1 - glowUp)));
        });
        st.motes.forEach(([x0, y0, z0, ph, m]) => {
          const x = x0 + .2 * Math.sin(t * .12 + ph), y = y0 + .15 * Math.sin(t * .08 + ph * 2), z = z0 + .15 * Math.cos(t * .1 + ph);
          const q = sc(x, y, z); if (!q) return;
          let e = 0; for (const l of L) { const d2 = (l.x - x) ** 2 + (l.y - y) ** 2 + (l.z - z) ** 2; e += l.i / (1 + d2 / (l.k === 'day' ? .4 : 1)); }
          const a = Math.min(.55, e * .09 * m); if (a < .03) return;
          const s = Math.max(1, .012 * F / q[2]);
          c.globalAlpha = a; c.fillStyle = 'rgba(255,226,180,1)'; c.fillRect(q[0], q[1], s, s);
        });
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
        st.names.forEach((li) => { li.style.opacity = 0; });

        function jar(x, z, k = 1) {
          const a = sc(x, 0, z), b = sc(x, .7 * k, z); if (!a || !b) return;
          const s = F / a[2] * k, hh = a[1] - b[1];
          const e = lit(x, .4, z, -syw, 0, -cyw), eL = lit(x, .4, z, -cyw, 0, syw), eR = lit(x, .4, z, cyw, 0, -syw);
          const g = c.createLinearGradient(a[0] - .25 * s, 0, a[0] + .25 * s, 0);
          g.addColorStop(0, rgb(shadeOf([.6, .38, .22], eL.map((v) => v * .6)))); g.addColorStop(.45, rgb(shadeOf([.6, .38, .22], e))); g.addColorStop(1, rgb(shadeOf([.6, .38, .22], eR.map((v) => v * .6))));
          c.fillStyle = g; c.beginPath();
          c.moveTo(a[0] - .08 * s, a[1]); c.bezierCurveTo(a[0] - .32 * s, a[1] - hh * .3, a[0] - .3 * s, a[1] - hh * .75, a[0] - .08 * s, a[1] - hh * .9); c.lineTo(a[0] - .09 * s, a[1] - hh); c.lineTo(a[0] + .09 * s, a[1] - hh); c.lineTo(a[0] + .08 * s, a[1] - hh * .9);
          c.bezierCurveTo(a[0] + .3 * s, a[1] - hh * .75, a[0] + .32 * s, a[1] - hh * .3, a[0] + .08 * s, a[1]); c.closePath(); c.fill();
        }
        // the woven cloak: a cloth grid draped over the five; threads follow every fold
        function cloak(P5, k0, glowUp) {
          const { x0, x1, z0, z1, nu, nv, ox, oz } = CLOTH;
          const domes = P5.map((l) => [l.x, l.z, .4 * HM[l.i] * (.3 + .7 * l.cover), l.i === 2 ? .66 : .6]); // up to each one's shoulders
          const V = [], dom = [];
          for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
            const u = i / nu, v = j / nv;
            const x = ox + (mix(x0, x1, u) - ox) * k0, z = oz + (mix(z0, z1, v) - oz) * k0;
            // soft humps over the lights it covers, merged into one mass; the hem comes down to the mat
            let sum = 0, best = -1, bi = 0;
            domes.forEach(([dx, dz, h, sg], n) => {
              const d = Math.hypot(x - dx, z - dz), hh = h * Math.exp(-((d / sg) ** 2.6));
              sum += hh ** 4; if (hh > best) { best = hh; bi = n; }
            });
            const edge = Math.min(x - (ox + (x0 - ox) * k0), (ox + (x1 - ox) * k0) - x, z - (oz + (z0 - oz) * k0), (oz + (z1 - oz) * k0) - z);
            let y = sum ** .25 * smooth(c01(edge / .3));
            // folds run down off each peak; the hem pools in soft ripples on the mat
            const [dx, dz, h] = domes[bi], d = Math.hypot(x - dx, z - dz), th = Math.atan2(z - dz, x - dx);
            const slope = smooth(c01((d - .12) / .3)) * c01(y / .07);
            y += (.05 * Math.abs(Math.sin(th * 3.5 + bi * 1.7 + d * 1.6)) - .03) * slope * (1 + c01(1 - y / (h + .01)));
            y += .012 * Math.sin(u * 37 + v * 11) * c01(1 - y / .2);
            y = Math.max(.014 + .018 * Math.sin(u * 29 + 1) * Math.sin(v * 23), y);
            V.push([x, y, z]); dom.push(bi);
          }
          const idx = (i, j) => j * (nu + 1) + i;
          const col = V.map((v, n) => {
            const i = n % (nu + 1), j = (n / (nu + 1)) | 0;
            const a = V[idx(Math.min(nu, i + 1), j)], b = V[idx(Math.max(0, i - 1), j)], cc = V[idx(i, Math.min(nv, j + 1))], dd = V[idx(i, Math.max(0, j - 1))];
            const ux = a[0] - b[0], uy = a[1] - b[1], uz = a[2] - b[2], vx = cc[0] - dd[0], vy = cc[1] - dd[1], vz = cc[2] - dd[2];
            let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
            if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
            // deep madder wool; indigo and saffron bands woven along the borders
            const bu = Math.min(i / nu, 1 - i / nu) * (x1 - x0), bv = Math.min(j / nv, 1 - j / nv) * (z1 - z0), bd = Math.min(bu, bv);
            let alb = [.38, .1, .07];
            if (bd < .045) alb = [.16, .1, .08]; else if (bd < .09) alb = [.58, .4, .14]; else if (bd < .15) alb = [.1, .1, .2]; else if (bd < .18) alb = [.58, .4, .14]; else if (Math.abs(bv - .32) < .02) alb = [.5, .34, .12];
            const jit = .88 + .24 * st.threadJ[n];
            const e = lit(v[0], v[1], v[2], nx, ny, nz);
            let gl = 0; P5.forEach((l) => { const d2 = (v[0] - l.x) ** 2 + (v[1] - l.y) ** 2 + (v[2] - l.z) ** 2; gl += l.cover * (l.i === 2 ? 1 : .75) / (1 + d2 / .04); });
            gl *= .25 + .35 * glowUp;
            return [Math.min(255, tone(alb[0] * e[0] * jit) + 230 * gl), Math.min(255, tone(alb[1] * e[1] * jit) + 150 * gl), Math.min(255, tone(alb[2] * e[2] * jit) + 70 * gl)];
          });
          const S2 = V.map((v) => cs(...v));
          const quads = [];
          for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
            const a = idx(i, j), b = idx(i + 1, j), cc = idx(i + 1, j + 1), d = idx(i, j + 1);
            if (S2[a][2] < NEAR || S2[b][2] < NEAR || S2[cc][2] < NEAR || S2[d][2] < NEAR) continue;
            quads.push([(S2[a][2] + S2[b][2] + S2[cc][2] + S2[d][2]) / 4, a, b, cc, d]);
          }
          quads.sort((m, n) => n[0] - m[0]);
          c.lineWidth = 1; c.lineJoin = 'round';
          for (const [, a, b, cc, d] of quads) {
            const k1 = col[a], k2 = col[b], k3 = col[cc], k4 = col[d];
            const s = `rgb(${((k1[0] + k2[0] + k3[0] + k4[0]) / 4) | 0},${((k1[1] + k2[1] + k3[1] + k4[1]) / 4) | 0},${((k1[2] + k2[2] + k3[2] + k4[2]) / 4) | 0})`;
            c.beginPath(); c.moveTo(SX(S2[a]), SY(S2[a])); c.lineTo(SX(S2[b]), SY(S2[b])); c.lineTo(SX(S2[cc]), SY(S2[cc])); c.lineTo(SX(S2[d]), SY(S2[d])); c.closePath();
            c.fillStyle = s; c.fill(); c.strokeStyle = s; c.stroke();
          }
          // the weave: three threads to a cell each way, laid along the cloth's own lines so they ride the folds
          const sp2 = (q) => [SX(q), SY(q)];
          const P2 = S2.map((q) => (q[2] > NEAR ? sp2(q) : null));
          const weave = (al, sub, light) => {
            c.strokeStyle = light ? `rgba(255,220,170,${al})` : `rgba(18,6,3,${al})`; c.lineWidth = Math.max(.7, H / 1500);
            c.beginPath();
            for (let j = 0; j < nv; j++) for (let s = 0; s < sub; s++) {
              const f = (s + (light ? .5 : 0)) / sub; let on = false;
              for (let i = 0; i <= nu; i++) { const A = P2[idx(i, j)], B = P2[idx(i, j + 1)]; if (!A || !B) { on = false; continue; } const x = A[0] + (B[0] - A[0]) * f, y = A[1] + (B[1] - A[1]) * f; on ? c.lineTo(x, y) : c.moveTo(x, y); on = true; }
            }
            for (let i = 0; i < nu; i++) for (let s = 0; s < sub; s++) {
              const f = (s + (light ? .5 : 0)) / sub; let on = false;
              for (let j = 0; j <= nv; j++) { const A = P2[idx(i, j)], B = P2[idx(i + 1, j)]; if (!A || !B) { on = false; continue; } const x = A[0] + (B[0] - A[0]) * f, y = A[1] + (B[1] - A[1]) * f; on ? c.lineTo(x, y) : c.moveTo(x, y); on = true; }
            }
            c.stroke();
          };
          weave(.15, 3, false);
          weave(.06, 3, true);
          // fringe on the two short ends
          c.strokeStyle = 'rgba(60,30,14,.75)'; c.lineWidth = Math.max(1, H / 1000); c.beginPath();
          for (const j of [0, nv]) for (let i = 0; i <= nu; i++) { const v = V[idx(i, j)], q = sc(...v), q2 = sc(v[0] + .01 * Math.sin(i * 3), Math.max(.004, v[1] - .05), v[2] + (j ? .08 : -.08) * k0); if (q && q2) { c.moveTo(q[0], q[1]); c.lineTo(q2[0], q2[1]); } }
          c.stroke();
          // light escaping at the hem onto the mat
          c.globalCompositeOperation = 'lighter';
          P5.forEach((l) => { const q = sc(l.x, .06, l.z); if (q) halo(q[0], q[1], (.8 + 1.2 * glowUp) * F / q[2], st.gold, .1 * l.cover * (.5 + glowUp)); });
          c.globalCompositeOperation = 'source-over';
        }
      }
    },
  };
})();
