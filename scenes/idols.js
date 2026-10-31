// فتح مكة: the Kaaba in hazy morning light, ringed by 360 idols. A calm light goes round (tawaf) and the idols
// fall forward on their faces as it passes; a smaller light hands it a palmful of pebbles, they are thrown, the
// rest go down, and the broken idols are carried out. World in metres: x west (right), y up, z south (away).
// Nobody is drawn: the Prophet and Ali are lights, the crowd is massed dots. Idols are crude pillars, no faces.
(() => {
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const tone = (x) => 255 * (1 - Math.exp(-1.15 * x));
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
  const D2R = Math.PI / 180;
  // Sutherland–Hodgman against a horizontal cut: the part of a silhouette below (or above) height `cut`
  const clipV = (pts, cut, below) => {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const A = pts[i], B = pts[(i + 1) % pts.length], ia = below ? A[1] <= cut : A[1] >= cut, ib = below ? B[1] <= cut : B[1] >= cut;
      if (ia) out.push(A);
      if (ia !== ib) out.push([A[0] + (B[0] - A[0]) * (cut - A[1]) / (B[1] - A[1]), cut]);
    }
    return out;
  };
  // camera: [p, yaw°, distance, height, target row on screen, focal, target x, target z]
  const CAM = [
    [-.05, -16, 74, 27, .6, 1.22, 0, 0], [0, -16, 74, 27, .6, 1.22, 0, 0], [.35, -9, 72, 26, .6, 1.24, 0, 0], [.62, -3, 70, 25, .6, 1.26, -1, 0],
    [.7, 0, 60, 21, .6, 1.4, -5, 1], [.755, 3, 44, 15.5, .6, 1.62, -9.5, 1.5], [.8, 5, 47, 16.5, .6, 1.58, -9, -1],
    [.86, 6, 62, 21, .61, 1.35, -3, 0], [.92, 8, 64, 21, .61, 1.34, 0, 0], [1, 11, 62, 20, .62, 1.38, 0, 0], [1.05, 11, 62, 20, .62, 1.38, 0, 0],
  ];
  const ROWS = [[16.5, 108], [20, 120], [23.5, 132]];
  const WAVE = .75; // share of the ring felled before the pebbles are thrown
  const A0 = -Math.PI / 2 - .25; // the Black Stone corner side: the round starts near the camera, on the left
  const SUN = (() => { const el = 17 * D2R; const v = [-Math.cos(el) * .9, Math.sin(el), Math.cos(el) * .42]; const l = Math.hypot(...v); return v.map((x) => x / l); })();
  const KA = { hw: 5.6, hd: 4.9, h: 13.1, rot: Math.PI / 4 }; // corners towards the four directions

  S.idols = {
    init(el, st) {
      st.cv = el.querySelector('canvas');
      st.ctx = st.cv.getContext('2d');
      st.n = el.querySelector('.idols-n');
      const r = rng(360);
      st.glow = sprite([[0, 'rgba(255,255,255,1)'], [.2, 'rgba(255,255,255,.5)'], [.5, 'rgba(255,255,255,.12)'], [1, 'rgba(255,255,255,0)']]);
      st.pale = sprite([[0, 'rgba(255,246,220,1)'], [.22, 'rgba(255,236,196,.5)'], [.55, 'rgba(240,214,160,.12)'], [1, 'rgba(240,214,160,0)']]);
      st.dust = sprite([[0, 'rgba(226,206,170,.75)'], [.5, 'rgba(214,192,156,.32)'], [1, 'rgba(206,184,150,0)']]);
      st.noise = document.createElement('canvas');
      st.noise.width = st.noise.height = 160;
      const ng = st.noise.getContext('2d'), id = ng.createImageData(160, 160);
      for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 18; }
      ng.putImageData(id, 0, 0);
      // the idols: three rows round the Kaaba; each a crude pillar (stone or wood) with no face
      const STONE = [[.58, .54, .48], [.34, .32, .3], [.66, .56, .43], [.46, .42, .38], [.44, .32, .22]];
      const shape = (k, w, h) => {
        const a = w / 2;
        if (k === 0) { const p = [[-a, 0], [a, 0], [a * .92, h * .78]]; for (let i = 1; i < 8; i++) { const t = i / 8 * Math.PI; p.push([Math.cos(t) * a * .92, h * .78 + Math.sin(t) * h * .22]); } p.push([-a * .92, h * .78]); return p; }
        if (k === 1) return [[-a, 0], [a, 0], [a * .55, h * .9], [0, h], [-a * .55, h * .9]];
        if (k === 2) return [[-a, 0], [a, 0], [a, h * .36], [a * .62, h * .4], [a * .6, h], [-a * .6, h], [-a * .62, h * .4], [-a, h * .36]];
        if (k === 3) { const p = []; for (let i = 0; i <= 8; i++) { const t = i / 8; p.push([mix(a, -a, t) * (1 - .25 * Math.sin(t * Math.PI)) + (r() - .5) * a * .2, i === 0 || i === 8 ? 0 : h * (.82 + .18 * Math.sin(t * Math.PI)) + (r() - .5) * h * .1]); } p.splice(1, 0, [a, h * .7]); p.push([-a, h * .66]); return p; }
        return [[-a, 0], [a, 0], [a * .96, h], [-a * .96, h]];
      };
      st.idols = [];
      ROWS.forEach(([R, n], row) => {
        for (let i = 0; i < n; i++) {
          const a = A0 + (i + r() * .4 + row * .33) / n * TAU;
          const f = ((A0 - a) % TAU + TAU) % TAU / TAU; // share of the round before the light reaches it (tawaf runs this way)
          const fr = 1 - f;
          const h = 1.1 + r() ** 1.4 * 2.4 + row * .15, w = .45 + r() * .55 + (h > 2.6 ? .25 : 0);
          const k = r() * 5 | 0;
          let s0;
          if (fr < WAVE) s0 = .1 + fr / WAVE * .6 + row * .005 + r() * .004;
          else s0 = .8 + (fr - WAVE) / (1 - WAVE) * .045 + row * .003 + r() * .006;
          const dur = .014 + r() * .006;
          const sil = shape(k, w, h), brk = .38 + r() * .2;
          st.idols.push({ a, R: R + (r() - .5) * .9, h, w, t: .3 + r() * .3, sil, lo: clipV(sil, h * brk, true), hi: clipV(sil, h * brk, false), alb: STONE[r() * STONE.length | 0].map((v) => v * (.9 + r() * .2)), s0, s1: s0 + dur, brk, gap: .3 + r() * .8, tw: (r() - .5) * .9, out: .88 + r() * .04, row });
        }
      });
      st.idols.forEach((d, i) => { const e = st.idols[i + 1]; if (e && e.row === d.row && r() < .14) d.tie = e; });
      st.land = st.idols.map((d) => d.s1).sort((m, n) => m - n);
      // the town round the sanctuary, kept out of the camera's way
      st.boxes = [];
      for (let i = 0; i < 300; i++) {
        const ang = r() * TAU, rad = 47 + r() ** .9 * 80;
        const near = Math.cos(ang + Math.PI / 2); // 1 = towards the camera (north)
        if (near > .45 && rad < 100) continue;
        const big = rad > 90, x = Math.cos(ang) * rad, z = Math.sin(ang) * rad, w = (big ? 8 : 5) + r() * 6, d = (big ? 8 : 5) + r() * 6;
        st.boxes.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, h: 3.4 + r() * 3.4 + (r() < .25 ? 3 : 0), alb: [.7 + r() * .12, .58 + r() * .1, .44 + r() * .07], door: r() });
      }
      // the crowd of the conquest, massed dots at the edge of the court
      st.crowd = Array.from({ length: 2200 }, () => { const ang = r() * TAU, rad = 32 + r() ** .7 * 12; return [Math.cos(ang) * rad, Math.sin(ang) * rad, r() * 3 | 0]; });
      st.ridges = [[260, 1400, 40], [520, 2200, 90], [900, 3200, 150]].map(([z, ext, hh], li) => {
        const xs = [], hs = [], ph = [r() * 9, r() * 9, r() * 9];
        for (let x = -ext; x <= ext; x += ext / 80) { const n = .55 + .25 * Math.sin(x * .012 + ph[0]) + .13 * Math.sin(x * .034 + ph[1]) + .07 * Math.abs(Math.sin(x * .09 + ph[2])); xs.push(x); hs.push(hh * n + (x < -150 && li === 0 ? 70 * Math.exp(-(((x + 330) / 160) ** 2)) : 0)); }
        return { z, xs, hs, li };
      });
      st.sparks = Array.from({ length: 9 }, () => [r(), r(), r()]);
    },

    frame(p, t, el, st) {
      fit(st.cv);
      const c = st.ctx, W = st.cv.width, H = st.cv.height, W2 = W / 2;
      const pp = Math.min(1.05, Math.max(-.05, p));
      const [yawD, dist, ch, ys, kf, tx, tz] = spline(CAM, pp);
      const yaw = yawD * D2R, fx = -Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = Math.sin(yaw);
      const cxw = tx - dist * fx, czw = tz - dist * fz;
      const tall = W < H * .8; // a phone: the ring sits higher so the counter has the foot of the screen
      const F = Math.min(H * 1.25, W * (tall ? 1.65 : 1.9)) * kf;
      const hy = (ys - (tall ? .15 : 0)) * H - (ch - 4) * F / dist;
      const PJ = (x, y, z) => { const dx = x - cxw, dz = z - czw, zc = dx * fx + dz * fz; return [W2 + (dx * rx + dz * rz) * F / zc, hy + (ch - y) * F / zc, zc]; };
      const zOf = (x, z) => (x - cxw) * fx + (z - czw) * fz;
      const clear = smooth(seg(p, .88, 1));
      const haze = .7 - .52 * clear;
      const dustAir = Math.min(1, .25 + 1.6 * Math.max(0, seg(p, .1, .5) * .5 + smooth(seg(p, .78, .86)) * .6 - smooth(seg(p, .9, 1)) * 1.1));
      const sunK = .95 + .45 * clear;
      const skyTop = mixc([146, 156, 170], [86, 124, 166], clear), skyHor = mixc([224, 204, 172], [240, 216, 178], clear);
      const fogC = mixc([212, 192, 160], [226, 206, 172], clear);
      const fogOf = (zc) => c01((1 - Math.exp(-Math.max(0, zc - 30) / mix(260, 560, clear))) * (.6 + .4 * haze));
      const lit = (alb, nx, ny, nz, amb = .42) => {
        const sd = Math.max(0, nx * SUN[0] + ny * SUN[1] + nz * SUN[2]);
        const sky = amb * (.5 + .4 * ny);
        return [tone(alb[0] * (sky * .78 + sd * 1.3 * sunK)), tone(alb[1] * (sky * .9 + sd * 1.06 * sunK)), tone(alb[2] * (sky * 1.18 + sd * .74 * sunK))];
      };
      const fg = (col, zc) => mixc(col, fogC, fogOf(zc));
      function poly(pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }

      // ---- the round: where the two lights are ----
      const roundK = seg(p, .1, .7);
      const ang = A0 + TAU * WAVE * roundK + .12 * seg(p, .7, .8); // anticlockwise seen from above
      const PR = 12.4;
      const proph = [Math.cos(ang) * PR, 2.3, Math.sin(ang) * PR];
      const meet = smooth(seg(p, .7, .745)) * (1 - smooth(seg(p, .8, .86)));
      const aa = ang - mix(.24, .15, meet);
      const ali = [Math.cos(aa) * (PR - 1.4 * meet), 1.5, Math.sin(aa) * (PR - 1.4 * meet)];
      const lightA = 1 - .35 * smooth(seg(p, .9, 1));

      // ---- sky, far hills, ground ----
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      if (hy > 0) {
        const g = c.createLinearGradient(0, 0, 0, hy);
        g.addColorStop(0, rgb(skyTop)); g.addColorStop(1, rgb(skyHor));
        c.fillStyle = g; c.fillRect(0, 0, W, hy + 1);
        const sx = W2 + (-.9 * rx + .42 * rz) * F * 2.2, sun = c.createRadialGradient(sx, hy - H * .05, 0, sx, hy - H * .05, W * .8);
        sun.addColorStop(0, `rgba(255,236,196,${(.55 + .2 * clear).toFixed(3)})`); sun.addColorStop(1, 'rgba(255,230,190,0)');
        c.fillStyle = sun; c.fillRect(0, 0, W, hy + 1);
      }
      st.ridges.slice().reverse().forEach((rd) => {
        const b0 = PJ(rd.xs[0], 0, rd.z), b1 = PJ(rd.xs[rd.xs.length - 1], 0, rd.z);
        c.beginPath(); c.moveTo(b0[0], b0[1]);
        for (let i = 0; i < rd.xs.length; i++) { const q = PJ(rd.xs[i], rd.hs[i], rd.z); c.lineTo(q[0], q[1]); }
        c.lineTo(b1[0], b1[1]); c.closePath();
        c.fillStyle = rgb(mixc([132, 120, 112], fogC, .45 + .18 * (2 - rd.li) + .2 * haze - .2)); c.fill();
      });
      const g0 = Math.max(0, hy);
      const gg = c.createLinearGradient(0, g0, 0, H);
      gg.addColorStop(0, rgb(fogC)); gg.addColorStop(.35, rgb(fg(lit([.7, .6, .46], 0, 1, 0), 120))); gg.addColorStop(1, rgb(lit([.66, .56, .43], 0, 1, 0)));
      c.fillStyle = gg; c.fillRect(0, g0, W, H - g0);
      // the paved court round the House, a shade lighter
      { const pts = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; const q = PJ(Math.cos(a) * 28, 0, Math.sin(a) * 28); if (q[2] < 1) { pts.length = 0; break; } pts.push(q); }
        if (pts.length) { poly(pts); c.fillStyle = rgb(fg(lit([.78, .68, .54], 0, 1, 0), dist), .55); c.fill(); } }

      // ---- shadows: one pass, so overlapping shadows don't stack ----
      const kc = KA.rot;
      const kcorner = [[-KA.hw, -KA.hd], [KA.hw, -KA.hd], [KA.hw, KA.hd], [-KA.hw, KA.hd]].map(([x, z]) => [x * Math.cos(kc) - z * Math.sin(kc), x * Math.sin(kc) + z * Math.cos(kc)]);
      const shadowOf = (x, y, z) => PJ(x - SUN[0] * y / SUN[1], 0, z - SUN[2] * y / SUN[1]);
      c.beginPath();
      { // the Kaaba's long morning shadow
        const pts = []; kcorner.forEach(([x, z]) => pts.push(PJ(x, 0, z))); kcorner.forEach(([x, z]) => pts.push(shadowOf(x, KA.h, z)));
        hull(pts).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
      }
      const pose = st.idols.map((d) => idolPose(d));
      pose.forEach((q) => {
        if (!q || q.th > 1.2 || q.al < .3) return;
        const pts = q.sil.map((P) => shadowOf(P[0], P[1], P[2]));
        pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
      });
      c.fillStyle = `rgba(52,46,52,${(.34 + .14 * clear).toFixed(3)})`; c.fill();

      // ---- items, far to near ----
      const items = [];
      st.boxes.forEach((b) => { const q = PJ((b.x0 + b.x1) / 2, b.h, (b.z0 + b.z1) / 2); if (q[2] > 4 && q[0] > -60 * F / q[2] * .2 - 40 && q[0] < W + 40 && q[1] < H + 20) items.push([q[2], () => box(b)]); });
      items.push([zOf(0, 0), () => kaaba()]);
      items.push([zOf((kcorner[0][0] + kcorner[1][0]) / 2 * 1.6, (kcorner[0][1] + kcorner[1][1]) / 2 * 1.6), () => hijr()]);
      pose.forEach((q) => { if (q) items.push([q.zc, () => idol(q)]); });
      [[proph, .8, st.pale], [ali, .42, st.pale]].forEach(([P, R, img], k) => items.push([zOf(P[0], P[2]) - .1, () => orb(P, R, img, k)]));
      items.sort((m, n) => n[0] - m[0]);
      // crowd far half first, near half after the items
      crowd(false);
      for (const [, fn] of items) fn();
      crowd(true);

      // ---- dust: a puff where each idol lands, then the air of the whole court ----
      st.idols.forEach((d, i) => {
        const k = seg(p, d.s1 - .002, d.s1 + .03);
        if (k <= 0 || k >= 1) return;
        const q = pose[i]; if (!q) return;
        const [x, y, zc] = PJ(q.tip[0], .4, q.tip[2]); if (zc < 2) return;
        const R = (1.2 + 3 * ease.out(k)) * F / zc;
        c.globalAlpha = .55 * (1 - k) * (1 - .5 * clear); c.drawImage(st.dust, x - R, y - R * .7, R * 2, R * 1.2);
      });
      c.globalAlpha = 1;
      if (dustAir > .02) {
        const [x, y] = PJ(0, 2, 0), R = 46 * F / dist;
        c.globalAlpha = .38 * dustAir; c.drawImage(st.dust, x - R * 1.4, y - R * .55, R * 2.8, R * 1.1); c.globalAlpha = 1;
      }
      // pebbles: handed over (.745–.775), then thrown at the idols still standing (.775–.81)
      c.globalCompositeOperation = 'lighter';
      const hand = seg(p, .742, .776), throwK = seg(p, .776, .815);
      if (hand > 0 && throwK < 1) st.sparks.forEach(([a, b, q], k) => {
        let P;
        if (throwK <= 0) { const u = ease.io(hand); P = [mix(ali[0], proph[0], u) + (a - .5) * .25, mix(ali[1], proph[1], u) + Math.sin(u * Math.PI) * .9 + (b - .5) * .2, mix(ali[2], proph[2], u) + (q - .5) * .25]; }
        else {
          const ta = A0 + TAU * (WAVE + (1 - WAVE) * (.12 + .8 * a)), tr = 16 + 8 * b, u = ease.out(throwK);
          P = [mix(proph[0], Math.cos(ta) * tr, u), proph[1] + Math.sin(u * Math.PI) * 2.5 - u * 1.5, mix(proph[2], Math.sin(ta) * tr, u)];
        }
        const [x, y, zc] = PJ(...P); if (zc < 1) return;
        const R = .3 * F / zc, al = (throwK > 0 ? 1 - throwK * throwK : c01(hand * 6)) * .95;
        if (throwK > 0) for (let j = 1; j < 5; j++) { // a short trail behind each thrown pebble
          const u = ease.out(Math.max(0, throwK - j * .03)), ta = A0 + TAU * (WAVE + (1 - WAVE) * (.12 + .8 * a)), tr = 16 + 8 * b;
          const Q = PJ(mix(proph[0], Math.cos(ta) * tr, u), proph[1] + Math.sin(u * Math.PI) * 2.5 - u * 1.5, mix(proph[2], Math.sin(ta) * tr, u));
          c.globalAlpha = al * (1 - j / 5) * .6; c.drawImage(st.glow, Q[0] - R * .7, Q[1] - R * .7, R * 1.4, R * 1.4);
        }
        c.globalAlpha = al;
        c.drawImage(st.glow, x - R, y - R, R * 2, R * 2);
      });
      // the two calm lights glow over everything
      [[proph, 9, .3, .45], [ali, 4.5, .26, .4]].forEach(([P, R, a1, a2]) => {
        const [x, y, zc] = PJ(...P); if (zc < 1) return;
        halo(x, y, R * F / zc, st.pale, a1 * lightA); halo(x, y, R * .3 * F / zc, st.pale, a2 * lightA);
      });
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      { const sx = PJ(cxw - 400 * SUN[0] / Math.hypot(SUN[0], SUN[2]) * -1, 60, czw + 400 * SUN[2] / Math.hypot(SUN[0], SUN[2]))[0];
        const g = c.createRadialGradient(Math.min(W * .1, sx), hy, 0, Math.min(W * .1, sx), hy, W * 1.1);
        c.globalCompositeOperation = 'lighter';
        g.addColorStop(0, `rgba(255,214,150,${(.16 + .1 * clear).toFixed(3)})`); g.addColorStop(.45, `rgba(255,200,140,${(.05 + .04 * clear).toFixed(3)})`); g.addColorStop(1, 'rgba(255,200,140,0)');
        c.fillStyle = g; c.fillRect(0, 0, W * .8, H); c.globalCompositeOperation = 'source-over'; }
      // morning haze lying over the far court, lifting at the end
      if (hy > -H) {
        const hz = c.createLinearGradient(0, Math.max(0, hy), 0, Math.max(0, hy) + H * .45);
        hz.addColorStop(0, rgb(fogC, .55 * haze)); hz.addColorStop(1, rgb(fogC, 0));
        c.fillStyle = hz; c.fillRect(0, 0, W, Math.max(0, hy) + H * .45);
      }
      c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(st.noise, 'repeat'); c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      const vg = c.createRadialGradient(W2, H * .56, Math.min(W, H) * .3, W2, H * .56, Math.hypot(W, H) * .68);
      vg.addColorStop(0, 'rgba(30,20,12,0)'); vg.addColorStop(1, 'rgba(30,20,12,.5)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);

      // the counter: idols still standing (not yet landed)
      let lo = 0, hi = st.land.length;
      while (lo < hi) { const m = (lo + hi) >> 1; if (st.land[m] <= p) lo = m + 1; else hi = m; }
      setText(st.n, arNum(st.land.length - lo));

      // ---------- helpers ----------
      function idolPose(d) {
        const k = seg(p, d.s0, d.s1), th = Math.PI / 2 * k * k; // falls forward, faster as it goes
        const out = smooth(seg(p, d.out, d.out + .07));
        const al = 1 - smooth(seg(out, .55, 1));
        if (al <= 0) return null;
        const ca = Math.cos(d.a), sa = Math.sin(d.a);
        const N = [ca, sa], T = [-sa, ca];
        const brk = k >= 1 ? ease.out(seg(p, d.s1, d.s1 + .012)) : 0;
        const bx = ca * d.R + N[0] * out * 26, bz = sa * d.R + N[1] * out * 26;
        const cu = Math.cos(th), su = Math.sin(th);
        const at = (s, v, piece) => {
          const g = piece ? d.gap * brk : 0, tw = piece ? d.tw * brk : 0;
          const vv = piece ? v - d.h * d.brk : v, ss = s;
          // the upper piece slides on and turns a little once broken
          const sx = ss * Math.cos(tw) - vv * Math.sin(tw) * (piece ? 1 : 0), sv = piece ? vv * Math.cos(tw) + ss * Math.sin(tw) + d.h * d.brk + g : v;
          return [bx + T[0] * sx + N[0] * su * sv, cu * sv, bz + T[1] * sx + N[1] * su * sv];
        };
        const sil = d.sil.map(([s, v]) => at(s, v, 0));
        const tip = [bx + N[0] * su * d.h * .6, 0, bz + N[1] * su * d.h * .6];
        return { d, th, k, sil, brk, at, al, tip, N, zc: zOf(bx + N[0] * su * d.h * .4, bz + N[1] * su * d.h * .4) };
      }
      function idol(q) {
        const { d } = q;
        // the slab faces outwards; as it falls its face turns to the ground and its back to the sky
        const n = [q.N[0] * Math.cos(q.th), -Math.sin(q.th), q.N[1] * Math.cos(q.th)];
        const back = (P) => [P[0] - n[0] * d.t, P[1] - n[1] * d.t, P[2] - n[2] * d.t];
        const toCam = (P) => (cxw - P[0]) * n[0] + (ch - P[1]) * n[1] + (czw - P[2]) * n[2];
        const pieces = q.brk > 0 ? [[d.lo, 0], [d.hi, 1]] : [[d.sil, 0]];
        c.globalAlpha = q.al;
        pieces.forEach(([sil, pc]) => {
          const P = sil.map(([s, v]) => q.at(s, v, pc));
          const front = toCam(P[0]) > 0;
          const A = front ? P.map(back) : P, B = front ? P : P.map(back);
          const nB = front ? n : [-n[0], -n[1], -n[2]];
          const pa = A.map((v) => PJ(...v)), pb = B.map((v) => PJ(...v));
          if (pa.some((v) => v[2] < 1)) return;
          const zc = pb[0][2];
          poly(pa); c.fillStyle = rgb(fg(mixc(lit(d.alb, nB[0], nB[1], nB[2], .3), [20, 14, 10], .45), zc)); c.fill();
          poly(pb); c.fillStyle = rgb(fg(lit(d.alb, nB[0], nB[1], nB[2]), zc)); c.fill();
          if (q.th < .7 && pc === 0) { // the low sun catches one edge
            const side = (-Math.sin(d.a) * SUN[0] + Math.cos(d.a) * SUN[2]) > 0 ? 1 : -1;
            const e = []; sil.forEach(([sv], i) => { if (sv * side > d.w * .05) e.push(pb[i]); });
            if (e.length > 1) { c.strokeStyle = `rgba(255,226,170,${((.35 + .3 * clear) * (1 - q.th)).toFixed(3)})`; c.lineWidth = Math.max(1, .07 * F / zc); c.beginPath(); e.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
          }
          if (q.brk > 0) { // the broken edge, raw and pale
            const cut = d.h * d.brk, e = sil.map(([, v], i) => (Math.abs(v - cut) < 1e-6 ? i : -1)).filter((i) => i >= 0);
            if (e.length === 2) { c.strokeStyle = rgb(fg(lit(d.alb.map((v) => v * 1.35), 0, 1, 0), zc), .85); c.lineWidth = Math.max(1, .06 * F / zc); c.beginPath(); c.moveTo(pb[e[0]][0], pb[e[0]][1]); c.lineTo(pb[e[1]][0], pb[e[1]][1]); c.stroke(); }
          }
        });
        if (d.tie && q.k <= 0 && p < d.tie.s0) { // lead straps binding neighbours
          const a = PJ(...q.at(0, d.h * .5, 0)), ca = Math.cos(d.tie.a), sa = Math.sin(d.tie.a);
          const b = PJ(ca * d.tie.R, Math.min(d.h, d.tie.h) * .5, sa * d.tie.R);
          if (a[2] > 1 && b[2] > 1) { c.strokeStyle = 'rgba(96,98,104,.9)'; c.lineWidth = Math.max(1, .14 * F / a[2]); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
        }
        c.globalAlpha = 1;
      }
      function face(pts3, n, alb, zc) {
        const pts = pts3.map((v) => PJ(...v)); if (pts.some((v) => v[2] < 1)) return null;
        poly(pts); c.fillStyle = rgb(fg(lit(alb, ...n), zc)); c.fill(); return pts;
      }
      function box(b) {
        const zc = zOf((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2); if (zc < 4) return;
        const { x0, x1, z0, z1, h, alb } = b;
        const sides = [[[x0, z0], [x1, z0], [0, 0, -1]], [[x1, z0], [x1, z1], [1, 0, 0]], [[x1, z1], [x0, z1], [0, 0, 1]], [[x0, z1], [x0, z0], [-1, 0, 0]]];
        sides.forEach(([[ax, az], [bx2, bz], n]) => {
          if ((cxw - (ax + bx2) / 2) * n[0] + (czw - (az + bz) / 2) * n[2] <= 0) return;
          const pts = face([[ax, 0, az], [bx2, 0, bz], [bx2, h, bz], [ax, h, az]], n, alb, zc);
          if (pts && zc < 105) {
            const u = .3 + b.door * .4, q = [[u, 0], [u + .14, 0], [u + .14, 2.1 / h], [u, 2.1 / h]].map(([k, v]) => PJ(mix(ax, bx2, k), v * h, mix(az, bz, k)));
            poly(q); c.fillStyle = rgb(fg([40, 30, 24], zc), .8); c.fill();
          }
        });
        const top = face([[x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1]], [0, 1, 0], alb, zc);
        if (top && zc < 120) { c.strokeStyle = rgb(fg(lit(alb.map((v) => v * 1.12), 0, 1, 0), zc)); c.lineWidth = Math.max(1, .3 * F / zc); poly(top); c.stroke(); }
      }
      function kaaba() {
        const zc = zOf(0, 0);
        const alb = [.075, .07, .072];
        for (let i = 0; i < 4; i++) {
          const [ax, az] = kcorner[i], [bx2, bz] = kcorner[(i + 1) % 4];
          const nx = (bz - az), nz = -(bx2 - ax), nl = Math.hypot(nx, nz), n = [nx / nl, 0, nz / nl];
          if ((cxw - (ax + bx2) / 2) * n[0] + (czw - (az + bz) / 2) * n[2] <= 0) continue;
          const pts = face([[ax, 0, az], [bx2, 0, bz], [bx2, KA.h, bz], [ax, KA.h, az]], n, alb, zc);
          if (!pts) continue;
          const sd = Math.max(0, n[0] * SUN[0] + n[2] * SUN[2]);
          // the sheen of the cloth, brighter towards the sunlit corner
          const g = c.createLinearGradient(pts[0][0], 0, pts[1][0], 0);
          g.addColorStop(0, `rgba(255,236,200,${(.04 + .16 * sd * sunK).toFixed(3)})`); g.addColorStop(1, `rgba(255,236,200,${(.01 + .04 * sd).toFixed(3)})`);
          poly(pts); c.fillStyle = g; c.fill();
          // the gold band two-thirds up, and the door on the north-east face
          const yb = [8.3, 9.25];
          const band = [[ax, yb[0], az], [bx2, yb[0], bz], [bx2, yb[1], bz], [ax, yb[1], az]].map((v) => PJ(...v));
          poly(band); c.fillStyle = rgb(fg(mixc([150, 118, 52], [246, 214, 140], .25 + .65 * sd * sunK), zc)); c.fill();
          c.strokeStyle = `rgba(255,232,170,${(.25 + .4 * sd).toFixed(3)})`; c.lineWidth = Math.max(1, .06 * F / zc);
          c.beginPath(); c.moveTo(band[0][0], band[0][1]); c.lineTo(band[1][0], band[1][1]); c.stroke();
          const m0 = PJ(ax, (yb[0] + yb[1]) / 2, az), m1 = PJ(bx2, (yb[0] + yb[1]) / 2, bz), bw = Math.abs(band[3][1] - band[0][1]);
          if (bw > 4) { c.setLineDash([bw * .5, bw * .22, bw * .15, bw * .3]); c.strokeStyle = `rgba(60,40,10,${(.4 - .2 * sd).toFixed(3)})`; c.lineWidth = bw * .4; c.beginPath(); c.moveTo(m0[0], m0[1]); c.lineTo(m1[0], m1[1]); c.stroke(); c.setLineDash([]); }
          if (i === 3) {
            const u0 = .2, u1 = .37, dy0 = 2.1, dy1 = 5.2;
            const dp = [[u0, dy0], [u1, dy0], [u1, dy1], [u0, dy1]].map(([u, y]) => PJ(mix(ax, bx2, u), y, mix(az, bz, u)));
            poly(dp); c.fillStyle = rgb(fg(mixc([120, 92, 40], [236, 200, 120], .3 + .6 * sd * sunK), zc)); c.fill();
          }
        }
        const top = kcorner.map(([x, z]) => PJ(x, KA.h, z));
        if (top.every((v) => v[2] > 1)) { poly(top); c.fillStyle = rgb(fg(lit([.16, .15, .15], 0, 1, 0), zc)); c.fill(); }
      }
      function hijr() {
        // the low white wall of Hijr Ismail, a half-ring off the north-west face
        const [ax, az] = kcorner[0], [bx2, bz] = kcorner[1];
        const mx = (ax + bx2) / 2, mz = (az + bz) / 2, ox = bz - az, oz = -(bx2 - ax), ol = Math.hypot(ox, oz);
        const outer = [], inner = [];
        for (let i = 0; i <= 18; i++) {
          const t = i / 18 * Math.PI, u = Math.cos(t), v = Math.sin(t);
          const px = mx + (bx2 - ax) / 2 * u * 1.02 + ox / ol * v * 7.6, pz = mz + (bz - az) / 2 * u * 1.02 + oz / ol * v * 7.6;
          outer.push([px, pz]); inner.push([mx + (px - mx) * .93, mz + (pz - mz) * .93]);
        }
        const zc = zOf(mx, mz);
        const top = [...outer.map(([x, z]) => PJ(x, 1.3, z)), ...inner.reverse().map(([x, z]) => PJ(x, 1.3, z))];
        const wall = [...outer.map(([x, z]) => PJ(x, 0, z)), ...outer.slice().reverse().map(([x, z]) => PJ(x, 1.3, z))];
        if (wall.some((v) => v[2] < 1)) return;
        poly(wall); c.fillStyle = rgb(fg(lit([.8, .76, .68], 0, 0, -1), zc)); c.fill();
        poly(top); c.fillStyle = rgb(fg(lit([.84, .8, .72], 0, 1, 0), zc)); c.fill();
      }
      function crowd(nearHalf) {
        const cols = [[58, 48, 40], [92, 80, 66], [124, 110, 92]];
        const s = Math.max(1.2, .26 * F / dist);
        cols.forEach((col, k) => {
          c.fillStyle = rgb(fg(col, dist)); c.beginPath();
          for (const [x, z, ci] of st.crowd) {
            if (ci !== k) continue;
            const zc = zOf(x, z); if ((zc < dist) !== nearHalf) continue;
            const [sx, sy] = PJ(x, .9, z); const q = Math.max(1.2, s * dist / zc);
            c.rect(sx - q / 2, sy - q, q, q * 1.8);
          }
          c.fill();
        });
      }
      function orb(P, R, img, k) {
        const [x, y, zc] = PJ(...P); if (zc < 1) return;
        c.globalCompositeOperation = 'lighter';
        halo(x, y, R * 2.4 * F / zc, img, .7 * lightA); halo(x, y, R * .7 * F / zc, st.glow, .9 * lightA);
        c.globalCompositeOperation = 'source-over';
      }
      function halo(x, y, R, img, a) {
        if (a <= .01 || x + R < 0 || x - R > W || y + R < 0 || y - R > H) return;
        c.globalAlpha = Math.min(1, a); c.drawImage(img, x - R, y - R, R * 2, R * 2); c.globalAlpha = 1;
      }
      function hull(pts) { // convex hull (monotone chain) of projected points
        const P = pts.map((v) => [v[0], v[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
        const lo = [], up = [];
        for (const v of P) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], v) <= 0) lo.pop(); lo.push(v); }
        for (const v of P.reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], v) <= 0) up.pop(); up.push(v); }
        return lo.slice(0, -1).concat(up.slice(0, -1));
      }
    },
  };
})();
