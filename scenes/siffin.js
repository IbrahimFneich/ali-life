// Siffin, 37 AH. A high oblique view over the plain on the west bank of the Euphrates. The Sham army holds the
// watering place; Ali's army takes it and opens a way for the others to drink; the days of battle and the fall of
// Ammar; the Night of al-Harir; the pages raised on spears at dawn; the freeze and the divide of the arbitration.
// World units: x to the right, z away from the camera, y up. The river runs across the back at z = ZR0..ZR1.
(() => {
  const ZR0 = 2150, ZR1 = 2780, BANK = 2080;
  const SH = [-155, 2125]; // the watering place (shari'a)
  const XF = -150, PUSH = 260, XFN = XF - PUSH; // the front, before and after the Night of al-Harir
  const NA = 2200, NS = 2600, N = NA + NS;
  const AMMAR_Z = 1180;
  // camera keys: p, x, height, z, horizon (fraction of screen height)
  const CAM = [
    [-.05, 300, 700, -260, .21], [0, 300, 700, -260, .21], [.15, 170, 660, 60, .21], [.27, -40, 600, 520, .22], [.36, -130, 600, 640, .22],
    [.46, -150, 800, -360, .2], [.56, -175, 790, -300, .2], [.68, -385, 740, -200, .21], [.78, -405, 780, -360, .21],
    [.9, -410, 860, -470, .2], [1.05, -410, 880, -500, .2],
  ];
  // light keys: p, sky top, horizon, far ground, near ground, water
  const LK = [
    [0, [34, 33, 34], [128, 110, 88], [84, 71, 56], [29, 24, 19], [58, 70, 72]],
    [.38, [34, 31, 31], [130, 104, 80], [80, 64, 50], [28, 22, 18], [58, 64, 64]],
    [.5, [30, 26, 30], [128, 84, 62], [68, 50, 40], [23, 18, 16], [52, 48, 48]],
    [.57, [8, 11, 20], [30, 36, 58], [24, 28, 38], [10, 11, 15], [16, 24, 38]],
    [.69, [8, 11, 20], [30, 36, 58], [24, 28, 38], [10, 11, 15], [16, 24, 38]],
    [.76, [28, 36, 56], [178, 150, 124], [72, 68, 68], [22, 22, 26], [96, 104, 118]],
    [.86, [40, 44, 54], [150, 142, 128], [80, 76, 70], [27, 27, 27], [98, 104, 110]],
    [1.05, [40, 44, 54], [150, 142, 128], [80, 76, 70], [27, 27, 27], [98, 104, 110]],
  ];
  const lightAt = (p) => {
    let i = 1;
    while (i < LK.length - 1 && p > LK[i][0]) i++;
    const A = LK[i - 1], B = LK[i], k = smooth(c01((p - A[0]) / (B[0] - A[0])));
    return A.slice(1).map((a, j) => a.map((v, q) => mix(v, B[j + 1][q], k)));
  };
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
  const mixc = (a, b, k) => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];
  const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const hash = (n) => { const v = Math.sin(n * 91.7) * 43758.5453; return v - Math.floor(v); };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const sprite = (stops) => { const c = mk(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); stops.forEach(([o, s]) => gr.addColorStop(o, s)); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; };

  S.siffin = {
    init(el, st) {
      st.cv = el.querySelector('canvas');
      st.ctx = st.cv.getContext('2d');
      st.bloom = mk(8, 8); st.bc = st.bloom.getContext('2d');
      st.puffD = sprite([[0, 'rgba(150,126,98,.9)'], [.5, 'rgba(150,126,98,.35)'], [1, 'rgba(150,126,98,0)']]);
      st.puffN = sprite([[0, 'rgba(150,84,46,.9)'], [.5, 'rgba(150,84,46,.35)'], [1, 'rgba(150,84,46,0)']]);
      st.mass = mk(8, 8); st.mc = st.mass.getContext('2d');
      const r = rng(657);
      const F32 = () => new Float32Array(N);
      st.x0 = F32(); st.z0 = F32(); st.x1 = F32(); st.z1 = F32(); st.x3 = F32(); st.z3 = F32();
      st.d1 = F32(); st.d3 = F32(); st.ph = F32(); st.dep = F32(); st.jx = F32(); st.jz = F32();
      st.X = F32(); st.Z = F32(); st.SX = F32(); st.SY = F32(); st.SZ = F32();
      st.tone = new Uint8Array(N);
      const gs = () => (r() + r() + r() - 1.5) / 1.5;
      for (let i = 0; i < N; i++) {
        const ali = i < NA;
        // K0: before the water. Sham on the left by the river with a guard on the shari'a; Ali on the dry plain to the right.
        if (ali) { // six blocks, ranks of 26
          const j = i, u = j % 6, m = Math.floor(j / 6), col = m % 26, row = Math.floor(m / 26);
          st.x0[i] = 260 + (u % 3) * 340 + col * 10 + r() * 3; st.z0[i] = 700 + Math.floor(u / 3) * 420 + row * 15 + r() * 4;
        } else if (r() < .14) {
          st.x0[i] = SH[0] - 120 + r() * 250; st.z0[i] = 1985 + r() * 110;
        } else { // eight blocks
          const j = i - NA, u = j % 8, m = Math.floor(j / 8), col = m % 24, row = Math.floor(m / 24);
          st.x0[i] = -1350 + (u % 4) * 300 + col * 10 + r() * 3; st.z0[i] = 1420 + Math.floor(u / 4) * 330 + row * 15 + r() * 4;
        }
        // K1: Ali holds the bank and the shari'a; Sham pushed back west.
        if (ali) {
          st.x1[i] = -330 + r() ** .9 * 900 + gs() * 20; st.z1[i] = 1620 + r() ** .7 * 440;
        } else {
          st.x1[i] = -1500 + r() * 820 + gs() * 30; st.z1[i] = 1480 + r() * 580;
        }
        // K3: two deep lines facing each other across the front, from the near plain to the river.
        const dep = 10 + Math.floor(r() ** 1.3 * (ali ? 26 : 30)) * 12 + r() * 3;
        st.dep[i] = dep;
        st.x3[i] = ali ? XF + dep : XF - dep;
        st.z3[i] = 470 + r() * 1580;
        st.d1[i] = (ali ? (1 - c01((st.x0[i] - 300) / 1000)) * .05 : .02 + r() * .05) + r() * .015;
        st.d3[i] = r() * .06;
        st.ph[i] = r() * TAU;
        st.jx[i] = gs(); st.jz[i] = gs();
        st.tone[i] = ali ? (r() < .62 ? 0 : 1) : (r() < .7 ? 2 : 3);
      }
      // the Sham army's drinkers: the ones nearest the bank, walking the corridor in single files
      const near = [];
      for (let i = NA; i < N; i++) near.push(i);
      near.sort((a, b) => (st.z1[b] + st.x1[b] * .4) - (st.z1[a] + st.x1[a] * .4));
      st.drink = near.slice(0, 380).map((i, k) => ({ i, s: .285 + (k / 380) * .055 + r() * .006, lane: (k % 4) * 9 - 13, wx: SH[0] - 90 + r() * 170 }));
      st.isDrinker = new Uint8Array(N); st.drink.forEach((d) => { st.isDrinker[d.i] = 1; });
      // the pages: carried by the front ranks of the Sham line
      const front = [];
      for (let i = NA; i < N; i++) if (st.dep[i] < 95) front.push(i);
      st.pages = front.slice(0, 560).map((i) => ({ i, a: .715 + .05 * (1 - (st.z3[i] - 470) / 1640) + r() * .03, f: r() * TAU }));
      // banners
      st.ban = [];
      for (let k = 0; k < 30; k++) st.ban.push({ i: Math.floor(r() * NA), c: k % 3 ? [46, 117, 88] : [201, 165, 78] });
      for (let k = 0; k < 34; k++) st.ban.push({ i: NA + Math.floor(r() * NS), c: k % 2 ? [112, 40, 34] : [66, 60, 58] });
      // the ground, the reeds, the far bank
      st.marks = Array.from({ length: 1400 }, () => [-2600 + r() * 5200, 120 + r() ** .8 * (BANK - 140), r()]);
      st.reeds = [];
      for (let x = -3000; x < 3000; x += 2.2 + r() * 3) {
        if (x > SH[0] - 135 && x < SH[0] + 125) continue;
        st.reeds.push([x, BANK + r() * 75, 5 + r() * 7, r() * TAU]);
      }
      st.far = Array.from({ length: 360 }, () => [-6000 + r() * 12000, ZR1 + 80 + r() ** 1.5 * 1500, 20 + r() * 60]);
      st.ridge = []; for (let x = -9000, h = 200; x <= 9000; x += 90) { h = mix(h, 150 + 160 * Math.sin(x * .0007 + 1) ** 2 + r() * 70, .35); st.ridge.push([x, h]); }
      st.clouds = Array.from({ length: 22 }, () => [r() * 1.6, .08 + r() * .85, .18 + r() * .4, .012 + r() * .03, .12 + r() * .2, .5 + r()]);
      st.grove = []; for (let x = -6000, h = 10; x < 6000; x += 14 + r() * 22) { const crown = Math.sin(x * .004) ** 2 > .25 ? 1 : .4; h = mix(h, (8 + r() * 20) * crown + 4, .55); st.grove.push([x, h]); }
      st.glints = Array.from({ length: 160 }, () => [-3500 + r() * 7000, ZR0 + 20 + r() * (ZR1 - ZR0 - 40), 20 + r() * 80, r() * TAU]);
      st.sparks = Array.from({ length: 320 }, () => [r(), r(), r() * 6 + 1, r()]);
      st.dust = Array.from({ length: 46 }, () => [r(), (r() - .5) * 140, 4 + r() * 10, 40 + r() * 70, r() * TAU]);
      st.stars = Array.from({ length: 140 }, () => [r(), r() ** 1.6, r()]);
    },

    frame(p, t, el, st) {
      fit(st.cv);
      const c = st.ctx, W = st.cv.width, H = st.cv.height, k = W / Math.max(1, st.cv.clientWidth);
      const port = H > W * 1.1;
      const [camX, camY0, camZ0, hyF] = spline(CAM, p);
      const camY = camY0 * (port ? 1.4 : 1), camZ = camZ0 + (port ? 260 : 0); // phones: closer and steeper so the plain fills the tall frame
      const hy = H * (port ? hyF - .01 : hyF), F = port ? W * .78 : Math.min(W * .62, H);
      const ox = W * .5;
      const [sky0, sky1, gFar, gNear, water] = lightAt(p);
      const night = keyv([[0, 0], [.52, 0], [.59, 1], [.69, 1], [.76, 0], [1, 0]], p)[0];
      const dawn = keyv([[0, 0], [.69, 0], [.75, 1], [.86, .45], [1, .3]], p)[0];
      const freeze = smooth(seg(p, .855, .95));
      const fogLen = mix(2600, 1900, keyv([[0, 0], [.4, .5], [.55, 1], [.7, 1], [.8, .3], [1, .3]], p)[0]);
      const fog = (zr) => 1 - Math.exp(-zr / fogLen);
      const PX = (x, zr) => ox + (x - camX) * F / zr, PY = (y, zr) => hy + (camY - y) * F / zr;

      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      // ---------- sky ----------
      const sg = c.createLinearGradient(0, 0, 0, hy);
      sg.addColorStop(0, css(sky0)); sg.addColorStop(1, css(sky1));
      c.fillStyle = sg; c.fillRect(0, 0, W, hy + 2);
      c.fillStyle = css(sky1); c.fillRect(0, hy + 1, W, H * .6);
      if (night > 0) {
        c.fillStyle = `rgba(230,226,210,${.7 * night})`;
        st.stars.forEach(([sx, sy, b]) => { const s = (.6 + b * .9) * k; c.globalAlpha = night * (.3 + .7 * b) * (.75 + .25 * Math.sin(t * 2 + b * 30)); c.fillRect(sx * W, sy * hy * .9, s, s); });
        c.globalAlpha = 1;
      }
      if (dawn > 0) {
        const dx = W * .78, g = c.createRadialGradient(dx, hy, 0, dx, hy, W * .7);
        g.addColorStop(0, `rgba(255,214,160,${.55 * dawn})`); g.addColorStop(.35, `rgba(240,180,140,${.16 * dawn})`); g.addColorStop(1, 'rgba(240,180,140,0)');
        c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, 0, W, hy + 2); c.globalCompositeOperation = 'source-over';
      }
      // ---------- far bank: hills and palm groves on the east side ----------
      // dust-laden sky: long soft streaks lit by whatever light the hour gives
      const cl = mixc(mixc(sky1, sky0, .35), [255, 236, 210], .12 * (1 - night) + .2 * dawn);
      st.clouds.forEach(([u, v, w, h, a, sp]) => {
        const x = ((u + t * sp * .004) % 1.6 - .3) * W, y = v * hy, rw = w * W, rh = h * H;
        c.save(); c.translate(x, y); c.scale(rw, rh);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
        g.addColorStop(0, css(cl, a * (1 - night * .6))); g.addColorStop(1, css(cl, 0));
        c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore();
      });
      const zb = ZR1 - camZ, ybk = PY(0, zb);
      // the far bank rises to a long bluff; haze thickens towards its crest
      const zq = ZR1 + 1700 - camZ;
      const top = Math.min(...st.ridge.map(([x, h]) => PY(h, zq)));
      const fb = c.createLinearGradient(0, top, 0, ybk);
      fb.addColorStop(0, css(mixc(gFar, sky1, .62))); fb.addColorStop(1, css(mixc(gFar, sky1, fog(zb) * .5)));
      c.fillStyle = fb;
      c.beginPath(); c.moveTo(-10, ybk + 1);
      st.ridge.forEach(([x, h]) => c.lineTo(PX(x, zq), PY(h, zq)));
      c.lineTo(W + 10, ybk + 1); c.closePath(); c.fill();
      c.strokeStyle = css(mixc(gFar, sky1, .2), .35); c.lineWidth = Math.max(1, k * .6);
      c.beginPath();
      st.far.forEach(([x, z, l]) => { const zr = z - camZ, X0 = PX(x, zr), Y0 = PY(0, zr), L = l * F / zr; if (X0 < -L || X0 > W + L) return; c.moveTo(X0 - L, Y0); c.lineTo(X0 + L, Y0); });
      c.stroke();
      if (night > 0 && p > .5) { // the battle lights the dust above the front
        const fx = PX(XF - PUSH * ease.io(seg(p, .575, .69)), 1400 - camZ), g = c.createRadialGradient(fx, hy, 0, fx, hy, W * .45);
        g.addColorStop(0, `rgba(190,96,44,${.28 * night})`); g.addColorStop(1, 'rgba(190,96,44,0)');
        c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, 0, W, ybk); c.globalCompositeOperation = 'source-over';
      }
      // the far shore: a dark band of palm groves, its crowns catching the light
      [[ZR1 + 50, .42, 1]].forEach(([z, fz, sc]) => {
        const zr = z - camZ, sp = F / zr, gc = mixc(mixc(gNear, [18, 24, 16], .45), sky1, Math.min(.9, fog(zr) * fz + .1));
        c.fillStyle = css(gc);
        c.beginPath(); c.moveTo(-10, PY(0, zr));
        st.grove.forEach(([x, h]) => { const X0 = PX(x * sc, zr); if (X0 < -60 || X0 > W + 60) return; c.lineTo(X0, PY(h * sc, zr)); });
        c.lineTo(W + 10, PY(0, zr)); c.closePath(); c.fill();
      });
      // ---------- the river ----------
      const zn = ZR0 - camZ, yn = PY(0, zn);
      const wg = c.createLinearGradient(0, ybk, 0, yn);
      wg.addColorStop(0, css(mixc(water, sky1, .45))); wg.addColorStop(1, css(mixc(water, [10, 14, 18], .25)));
      c.fillStyle = wg; c.fillRect(0, ybk, W, yn - ybk + 1);
      c.strokeStyle = css(mixc(sky1, [255, 255, 255], .3), .22 + .3 * dawn); c.lineWidth = Math.max(1, k * .8);
      c.beginPath();
      st.glints.forEach(([x, z, L, ph]) => {
        const zr = z - camZ, X0 = PX(x + Math.sin(t * .4 + ph) * 20 * (1 - freeze), zr), Y0 = PY(0, zr), l = L * F / zr * (.6 + .4 * Math.sin(t * 1.3 + ph) * (1 - freeze));
        c.moveTo(X0 - l / 2, Y0); c.lineTo(X0 + l / 2, Y0);
      });
      c.stroke();
      // ---------- the plain ----------
      const yb = PY(0, BANK - camZ);
      const gg = c.createLinearGradient(0, yn, 0, H);
      gg.addColorStop(0, css(mixc(gFar, sky1, fog(BANK - camZ) * .6))); gg.addColorStop(1, css(gNear));
      c.fillStyle = gg; c.fillRect(0, yn, W, H - yn);
      // the shari'a: a pale trodden ramp down to the water
      const ramp = [[SH[0] - 140, BANK - 30], [SH[0] + 130, BANK - 30], [SH[0] + 105, ZR0 + 6], [SH[0] - 115, ZR0 + 6]].map(([x, z]) => [PX(x, z - camZ), PY(0, z - camZ)]);
      c.fillStyle = css(mixc(mixc(gFar, [200, 180, 140], .3), sky1, fog(BANK - camZ) * .4), .75);
      c.beginPath(); ramp.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
      // ground marks: short strokes that carry the perspective
      c.lineWidth = Math.max(1, k * .7);
      [0, 1].forEach((pass) => {
        c.strokeStyle = pass ? css(mixc(gNear, [255, 236, 200], .12), .22) : css(mixc(gNear, [0, 0, 0], .35), .3);
        c.beginPath();
        st.marks.forEach(([x, z, q]) => {
          if ((q > .5) !== !!pass) return;
          const zr = z - camZ; if (zr < 60) return;
          const X0 = PX(x, zr), Y0 = PY(0, zr), l = (10 + q * 26) * F / zr;
          if (X0 < -l || X0 > W + l || Y0 > H + 2) return;
          c.moveTo(X0 - l / 2, Y0); c.lineTo(X0 + l / 2, Y0);
        });
        c.stroke();
      });
      // reeds along the near bank
      const rc = mixc(mixc(gNear, [52, 64, 34], .6), sky1, fog(BANK - camZ) * .5);
      c.strokeStyle = css(rc, .95); c.lineWidth = Math.max(1, k * .8);
      c.beginPath();
      st.reeds.forEach(([x, z, h, ph]) => {
        const zr = z - camZ; const X0 = PX(x, zr); if (X0 < -4 || X0 > W + 4) return;
        const sw = Math.sin(t * .9 + ph + x * .01) * .8 * (1 - freeze);
        c.moveTo(X0, PY(0, zr)); c.lineTo(PX(x + sw, zr), PY(h, zr));
      });
      c.stroke();

      // ---------- the armies ----------
      const { X, Z } = st;
      const fight = seg(p, .4, .45) * (1 - seg(p, .69, .73));
      const push = ease.io(seg(p, .575, .69));
      const brk = smooth(seg(p, .61, .71));
      const apart = ease.io(seg(p, .86, .97));
      const open = smooth(seg(p, .275, .3)) * (1 - smooth(seg(p, .365, .395)));
      const xf = XF - PUSH * push;
      const live = 1 - freeze;
      for (let i = 0; i < N; i++) {
        const ali = i < NA;
        const a1 = ease.io(seg(p, (ali ? .15 : .17) + st.d1[i], (ali ? .225 : .25) + st.d1[i]));
        let x = mix(st.x0[i], st.x1[i], a1), z = mix(st.z0[i], st.z1[i], a1);
        if (ali && open > 0 && x < 40 && z > 1880) { // Ali's left flank steps back from the bank: a corridor to the water
          const q = c01((z - 1880) / 240) * c01((40 - x) / 120);
          z -= q * 230 * open; x += q * 70 * open;
        }
        const a3 = ease.io(seg(p, .385 + st.d3[i], .47 + st.d3[i]));
        if (a3 > 0) {
          const dep = st.dep[i];
          let x3 = ali ? xf + dep : xf - dep * (1 + .35 * push);
          if (!ali && brk > 0 && dep > 120) { x3 -= brk * (40 + dep * .5) * (.4 + .6 * Math.abs(st.jx[i])); }
          x3 += apart * (ali ? 110 : -110);
          let z3 = st.z3[i] + (!ali && brk > 0 ? brk * st.jz[i] * 60 * c01(dep / 300) : 0);
          if (fight > 0 && dep < 70) x3 += (ali ? 1 : -1) * (Math.sin(p * 140 + st.ph[i]) * .5 + .5) * -9 * fight * live;
          x = mix(x, x3, a3); z = mix(z, z3, a3);
        }
        X[i] = x; Z[i] = z;
      }
      // the drinkers walk down to the water through the corridor and back
      let drinking = 0;
      st.drink.forEach((d) => {
        const q = seg(p, d.s, d.s + .05);
        if (q <= 0 || q >= 1) return;
        drinking++;
        const i = d.i, x0 = X[i], z0 = Z[i];
        const ex = -470, ez = 2025 + d.lane, wx = d.wx, wz = ZR0 + 4;
        const u = q < .5 ? q / .42 : (1 - q) / .42;
        const v = c01(u);
        let x, z;
        if (v < .45) { const w = smooth(v / .45); x = mix(x0, ex, w); z = mix(z0, ez, w); } else { const w = smooth((v - .45) / .55); x = mix(ex, wx, w); z = mix(ez, wz, w); }
        X[i] = x; Z[i] = z;
      });
      // project
      const SXa = st.SX, SYa = st.SY, SZa = st.SZ;
      for (let i = 0; i < N; i++) {
        const zr = Z[i] - camZ;
        if (zr < 40) { SZa[i] = 0; continue; }
        const ji = live * .6 * Math.sin(t * 2.2 + st.ph[i]);
        SXa[i] = PX(X[i] + ji, zr); SYa[i] = PY(1.6, zr); SZa[i] = zr;
      }
      // dots in four depth bands per colour so fog can tint them
      const COL = [
        mixc([232, 204, 128], [255, 236, 170], night * .5), mixc([150, 204, 160], [190, 236, 200], night * .5),
        mixc([184, 132, 122], [168, 70, 56], night), mixc([158, 140, 134], [132, 62, 52], night),
      ];
      const bands = [0, 700, 1200, 1800, 1e9];
      c.fillStyle = 'rgba(8,6,6,.3)'; c.beginPath();
      for (let i = NA; i < N; i++) { const zr = SZa[i]; if (!zr) continue; const x = SXa[i], y = SYa[i]; if (x < -6 || x > W + 6 || y < -6 || y > H + 6) continue; const s = Math.min(8 * k, Math.max(2 * k, 3.6 * F / zr)); c.rect(x - s / 2, y - s * .85, s, s); }
      c.fill();
      for (let tone = 0; tone < 4; tone++) {
        for (let b = 0; b < 4; b++) {
          const zm = Math.min(3000, (bands[b] + Math.min(3000, bands[b + 1])) / 2);
          const f = fog(zm) * (tone < 2 ? .45 * (1 - night) : .42);
          c.fillStyle = css(mixc(COL[tone], sky1, f), tone < 2 ? .95 : .9);
          c.beginPath();
          for (let i = tone < 2 ? 0 : NA, e = tone < 2 ? NA : N; i < e; i++) {
            if (st.tone[i] !== tone) continue;
            const zr = SZa[i]; if (zr <= 0 || zr < bands[b] || zr >= bands[b + 1]) continue;
            const x = SXa[i], y = SYa[i]; if (x < -6 || x > W + 6 || y < -6 || y > H + 6) continue;
            const s = Math.min(8 * k, Math.max(1.3 * k, (tone < 2 ? 2.6 : 3.2) * F / zr));
            c.rect(x - s / 2, y - s, s, s);
          }
          c.fill();
        }
      }
      // the Sham army's body: a dull low haze over its mass, so it reads at a distance without glowing
      {
        const mc = st.mc, MW = Math.max(8, Math.round(W / 6)), MH = Math.max(8, Math.round(H / 6));
        if (st.mass.width !== MW || st.mass.height !== MH) { st.mass.width = MW; st.mass.height = MH; }
        mc.setTransform(1, 0, 0, 1, 0, 0); mc.clearRect(0, 0, MW, MH); mc.setTransform(MW / W, 0, 0, MH / H, 0, 0);
        mc.fillStyle = css(mixc([128, 98, 92], [120, 44, 36], night), .5); mc.beginPath();
        for (let i = NA; i < N; i++) { const zr = SZa[i]; if (!zr) continue; const s = Math.max(5 * k, 7 * F / zr); mc.rect(SXa[i] - s / 2, SYa[i] - s, s, s); }
        mc.fill();
        c.globalCompositeOperation = 'screen'; c.globalAlpha = mix(.55, .4, night) * (1 - freeze * .3);
        c.drawImage(st.mass, 0, 0, W, H);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
      // banners on their poles
      st.ban.forEach(({ i, c: col }, j) => {
        const zr = SZa[i]; if (!zr) return;
        const x = SXa[i], s = F / zr, y0 = PY(1.6, zr), y1 = PY(10, zr);
        const f = fog(zr) * .7, fl = .8 + .2 * Math.sin(t * 3 + j) * live;
        c.strokeStyle = css(mixc([40, 32, 24], sky1, f), .9); c.lineWidth = Math.max(1, .3 * s);
        c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
        c.fillStyle = css(mixc(col, sky1, f)); c.fillRect(x, y1, 3.6 * s * fl * (j % 2 ? 1 : -1), 2.4 * s);
      });

      // ---------- the drinkers' ripples ----------
      if (drinking) {
        c.strokeStyle = css(mixc(sky1, [255, 255, 255], .3), .4); c.lineWidth = Math.max(1, k * .7);
        st.drink.forEach((d) => {
          const q = seg(p, d.s, d.s + .05); if (q < .42 || q > .6) return;
          const zr = ZR0 + 8 - camZ, X0 = PX(d.wx, zr), Y0 = PY(0, zr), rr = (2 + 5 * ((q - .42) / .18)) * F / zr;
          c.globalAlpha = 1 - (q - .42) / .18; c.beginPath(); c.ellipse(X0, Y0, rr, rr * .25, 0, 0, TAU); c.stroke();
        });
        c.globalAlpha = 1;
      }

      // ---------- dust and sparks over the front ----------
      const bc = st.bc, BW = Math.max(8, Math.round(W / 5)), BH = Math.max(8, Math.round(H / 5));
      if (st.bloom.width !== BW || st.bloom.height !== BH) { st.bloom.width = BW; st.bloom.height = BH; }
      bc.setTransform(1, 0, 0, 1, 0, 0); bc.globalCompositeOperation = 'source-over'; bc.clearRect(0, 0, BW, BH);
      bc.setTransform(BW / W, 0, 0, BH / H, 0, 0);
      const dustA = fight * (.1 + .08 * night) + .035 * seg(p, .15, .2) * (1 - seg(p, .3, .36));
      if (dustA > .005) {
        const puff = night > .5 ? st.puffN : st.puffD;
        st.dust.forEach(([u, dx, y, R, ph]) => {
          const z = 470 + u * 1640, zr = z - camZ; if (zr < 60) return;
          const cx0 = p < .36 ? mix(400, -100, seg(p, .15, .25)) + dx * 3 : xf;
          const X0 = PX(cx0 + dx + Math.sin(t * .2 + ph) * 20, zr), Y0 = PY(y, zr), r = R * F / zr;
          c.globalAlpha = dustA * (1 - fog(zr) * .5);
          c.drawImage(puff, X0 - r * 1.6, Y0 - r, r * 3.2, r * 2);
        });
        c.globalAlpha = 1;
      }
      if (fight > 0) {
        c.globalCompositeOperation = 'lighter';
        const dens = fight * (.25 + .55 * night) * live;
        c.lineCap = 'round';
        st.sparks.forEach(([u, jx, y, ph], j) => {
          const blink = hash(Math.floor(t * 9 + ph * 50) + j * 13.1);
          if (blink > dens) return;
          const z = 470 + u * 1640, zr = z - camZ; if (zr < 60) return;
          const X0 = PX(xf + (jx - .5) * 30, zr), Y0 = PY(y, zr), s = F / zr;
          const a = (1 - blink / Math.max(.01, dens)) * (.5 + .5 * night);
          c.strokeStyle = `rgba(255,${190 + 50 * hash(j)},${110 + 60 * hash(j + 1)},${a})`; c.lineWidth = Math.max(1, .35 * s);
          const ang = hash(j + 7) * TAU, L = (1.5 + 3 * hash(j + 3)) * s;
          c.beginPath(); c.moveTo(X0, Y0); c.lineTo(X0 + Math.cos(ang) * L, Y0 + Math.sin(ang) * L); c.stroke();
          bc.fillStyle = `rgba(255,190,110,${a * .7})`; bc.fillRect(X0 - 3 * k, Y0 - 3 * k, 6 * k, 6 * k);
        });
        c.globalCompositeOperation = 'source-over';
      }
      // Ali's lights in the bloom (torches at night)
      const glowA = .14 + .45 * night;
      bc.fillStyle = `rgba(240,200,120,${glowA})`; bc.beginPath();
      for (let i = 0; i < NA; i++) { const zr = SZa[i]; if (!zr) continue; const s = Math.max(2 * k, 4 * F / zr); bc.rect(SXa[i] - s, SYa[i] - s * 1.5, s * 2, s * 2); }
      bc.fill();

      // ---------- Ammar ----------
      {
        const fall = seg(p, .455, .485), fade = seg(p, .485, .545);
        const az = AMMAR_Z, zr = az - camZ;
        const stand = ease.io(seg(p, .4, .47));
        const ax = mix(XF + 420, XF + 22, stand) + (fight > 0 && fall === 0 ? -6 * fight : 0);
        if (zr > 40 && p > .36) {
          const X0 = PX(ax, zr), s = F / zr;
          const y = mix(2.2, .3, ease.in(fall)), Y0 = PY(y, zr);
          const I = (1 + 1.2 * Math.sin(Math.PI * fall)) * (1 - fade * .85) * seg(p, .36, .4);
          c.globalCompositeOperation = 'lighter';
          const R = Math.max(3 * k, 2.6 * s) * (1 + .4 * fall);
          const g = c.createRadialGradient(X0, Y0, 0, X0, Y0, R * 9);
          g.addColorStop(0, `rgba(248,244,228,${.55 * I})`); g.addColorStop(.25, `rgba(243,217,143,${.16 * I})`); g.addColorStop(1, 'rgba(243,217,143,0)');
          c.fillStyle = g; c.fillRect(X0 - R * 9, Y0 - R * 9, R * 18, R * 18);
          c.fillStyle = `rgba(255,252,240,${Math.min(1, I)})`; c.beginPath(); c.arc(X0, Y0, R * .55, 0, TAU); c.fill();
          bc.fillStyle = `rgba(255,248,226,${.6 * I})`; bc.beginPath(); bc.arc(X0, Y0, R * 2, 0, TAU); bc.fill();
          // the ring on the ground where he fell
          const ring = seg(p, .48, .56);
          if (ring > 0 && ring < 1) {
            const rr = 4 + 70 * ease.out(ring);
            c.strokeStyle = `rgba(243,226,170,${.6 * (1 - ring)})`; c.lineWidth = Math.max(1, 1.2 * k);
            c.beginPath();
            for (let a = 0; a <= 48; a++) { const an = a / 48 * TAU, wx = ax + Math.cos(an) * rr, wz = az + Math.sin(an) * rr, zz = wz - camZ; const px = PX(wx, zz), py = PY(0, zz); a ? c.lineTo(px, py) : c.moveTo(px, py); }
            c.stroke();
          }
          // the mark that stays
          if (fade > 0) {
            const m = fade * (1 - freeze * .5), Yg = PY(0, zr);
            const g2 = c.createRadialGradient(X0, Yg, 0, X0, Yg, 10 * s);
            g2.addColorStop(0, `rgba(243,226,170,${.35 * m})`); g2.addColorStop(1, 'rgba(243,226,170,0)');
            c.fillStyle = g2; c.fillRect(X0 - 10 * s, Yg - 10 * s, 20 * s, 20 * s);
            const lg = c.createLinearGradient(0, Yg, 0, PY(30, zr));
            lg.addColorStop(0, `rgba(243,226,170,${.4 * m})`); lg.addColorStop(1, 'rgba(243,226,170,0)');
            c.fillStyle = lg; c.fillRect(X0 - Math.max(.5, .25 * s), PY(30, zr), Math.max(1, .5 * s), Yg - PY(30, zr));
          }
          c.globalCompositeOperation = 'source-over';
        }
      }

      // ---------- the pages on the spears ----------
      if (p > .7) {
        const pc = [234, 224, 198];
        const list = [];
        st.pages.forEach((pg) => {
          const rise = ease.out(seg(p, pg.a, pg.a + .045));
          if (rise <= 0) return;
          const i = pg.i, zr = SZa[i]; if (!zr) return;
          list.push([zr, i, rise, pg.f]);
        });
        list.sort((a, b) => b[0] - a[0]);
        c.lineWidth = Math.max(1, .7 * k);
        list.forEach(([zr, i, rise, f]) => {
          const s = F / zr, x = SXa[i], yt = mix(3, 36 + 6 * Math.sin(i * 1.7), rise), fo = fog(zr) * .45;
          const y0 = PY(1.4, zr), y1 = PY(yt, zr);
          c.strokeStyle = css(mixc([58, 46, 36], sky1, fo), .9);
          c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
          const fl = live * Math.sin(t * 2.6 + f) * .18;
          const w = Math.min(7 * k, Math.max(1.4 * k, 5.6 * s)) * (1 - Math.abs(fl)), h = Math.min(9 * k, Math.max(1.8 * k, 7 * s));
          c.fillStyle = css(mixc(pc, sky1, fo), Math.min(1, rise * 3));
          c.fillRect(x - w / 2, y1 - h, w, h);
          c.fillStyle = css(mixc([150, 130, 100], sky1, fo), .7); c.fillRect(x - Math.max(.5, .06 * w), y1 - h, Math.max(1, .12 * w), h);
          if (dawn > .1) { bc.fillStyle = `rgba(255,244,220,${.1 * dawn})`; bc.fillRect(x - w, y1 - h * 1.2, w * 2, h * 1.4); }
        });
      }

      // ---------- bloom ----------
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = .85; c.drawImage(st.bloom, 0, 0, W, H); c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';

      // ---------- the divide ----------
      const dv = smooth(seg(p, .875, .95));
      if (dv > 0) {
        const xd = XFN, z0 = 420 - camZ, z1 = BANK - camZ;
        const pts = [[PX(xd, z0), PY(0, z0)], [PX(xd, z1), PY(0, z1)], [PX(xd, z1), PY(80, z1)], [PX(xd, z0), PY(80, z0)]];
        c.fillStyle = `rgba(220,220,214,${.06 * dv})`;
        c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
        const X0 = PX(xd, z1), lg = c.createLinearGradient(0, 0, 0, H);
        lg.addColorStop(0, 'rgba(232,230,222,0)'); lg.addColorStop(.25, `rgba(232,230,222,${.55 * dv})`); lg.addColorStop(.75, `rgba(232,230,222,${.55 * dv})`); lg.addColorStop(1, 'rgba(232,230,222,0)');
        c.fillStyle = lg; c.fillRect(X0 - Math.max(.5, .5 * k), 0, Math.max(1, k), H * dv + (1 - dv) * 0);
      }

      // ---------- grade: the freeze drains the colour ----------
      if (freeze > 0) {
        c.globalCompositeOperation = 'saturation'; c.fillStyle = `rgba(128,128,128,${.88 * freeze})`; c.fillRect(0, 0, W, H);
        c.globalCompositeOperation = 'source-over'; c.fillStyle = `rgba(20,20,20,${.18 * freeze})`; c.fillRect(0, 0, W, H);
      }
      const vg = c.createRadialGradient(W * .5, H * .55, Math.min(W, H) * .3, W * .5, H * .55, Math.hypot(W, H) * .6);
      vg.addColorStop(0, 'rgba(13,14,11,0)'); vg.addColorStop(1, 'rgba(13,14,11,.7)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
    },
  };
})();
