// الوداع: the night of 28 Safar 11 AH in Medina. The mosque's courtyard under the stars, the palm portico on the
// qibla side, and in the east wall the doors of the Prophet's rooms; one of them is lit. The camera crosses the
// courtyard and goes in. A low room of mud brick under a roof of palm trunks and fronds; a small clay lamp in a niche.
// The Prophet ﷺ and Ali are veiled figures with the gold disc behind the head (scenes/holy.js); no face is ever
// drawn. The Prophet lies on the bed, his head raised and held by Ali, who sits at his head. The lamp burns lower as
// the words come. At «سالت نفسه في كفّي» a column of light rises from where he lies, softly, up through the roof,
// and his figure fades from the bed as it goes; the body does not rise. The room dims; Ali stays seated. The camera
// draws back out through the door: the courtyard has filled with small lights, people come in the night. A thin old
// moon is rising in the east.
// World in metres: x right (south, the qibla side), y up, z away from the camera (east). Zero-pitch camera with a
// shift lens, as in mabit and kufa. The people in the courtyard are points of light.
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
    const c = document.createElement('canvas'); c.width = c.height = n;
    const g = c.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, n, n);
    return c;
  };

  // ---- the place ----
  const RX0 = -1.9, RX1 = 1.9, RZ = 4.4, RH = 2.55, WT = .4; // the room: inner box, front wall from z = -WT to 0
  const DX0 = -.58, DX1 = .58, DH = 1.92; // its door
  const WALLH = 3.05; // the mosque's east wall, in which the doors stand
  const DOORS = [-8.4, -4.2, 4.2, 8.4]; // the other rooms' doors, curtained
  const BED = { x0: -1.45, x1: .5, z0: 2.9, z1: 3.78, y: .07 };
  const PRO = [-.35, .42, 3.36]; // the warmth over the Prophet's bed, and where the column rises
  const ALI = [-.8, .58, 3.26]; // the warmth at his head, where Ali holds him
  const PRO_AT = [-.494, 3.36], ALI_AT = [-1.45, 3.62]; // the figures' ground points [x, z]: his head on the pillow, Ali behind it
  const LAMP = [1.15, .98, RZ - .12];
  const T = [-.45, .4, 3.35]; // the camera's aim
  const CAM = [ // [p, x, height, z, focal, aim screen x, aim screen y]
    [-.05, -2.4, 1.6, -19.5, 1, .44, .64], [0, -2.4, 1.6, -19.5, 1, .44, .64], [.12, -.35, 1.56, -10.5, .95, .4, .66],
    [.2, -.1, 1.5, -3.6, .88, .38, .69], [.25, .1, 1.45, -.55, .8, .36, .71], [.3, .45, 1.4, .62, .74, .34, .73],
    [.45, .7, 1.35, 1, .73, .34, .73], [.56, .76, 1.3, 1.15, .71, .34, .75], [.68, .72, 1.3, 1.1, .71, .34, .75],
    [.76, .42, 1.4, .45, .76, .36, .72], [.83, .1, 1.5, -1.3, .84, .38, .68], [.93, .8, 1.62, -10, .96, .42, .64],
    [1.05, 1, 1.66, -12.5, 1, .42, .63],
  ];
  const ZULLA = { x: [3.6, 6.9, 10.2], z0: -15.2, z1: -1.6, dz: 3.4, h: 3.2 };

  S.wada = {
    init(el, st) {
      st.cv = el.querySelector('canvas');
      st.ctx = st.cv.getContext('2d');
      const r = rng(1128);
      st.glow = sprite([[0, 'rgba(255,255,255,1)'], [.18, 'rgba(255,255,255,.55)'], [.45, 'rgba(255,255,255,.16)'], [1, 'rgba(255,255,255,0)']]);
      st.warm = sprite([[0, 'rgba(255,240,210,1)'], [.2, 'rgba(255,218,160,.55)'], [.55, 'rgba(240,180,110,.13)'], [1, 'rgba(230,170,100,0)']]);
      st.fire = sprite([[0, 'rgba(255,214,150,1)'], [.25, 'rgba(255,150,60,.5)'], [.6, 'rgba(220,90,30,.12)'], [1, 'rgba(200,70,20,0)']]);
      st.cool = sprite([[0, 'rgba(170,190,230,1)'], [.4, 'rgba(150,170,220,.35)'], [1, 'rgba(140,160,210,0)']]);
      st.noise = document.createElement('canvas'); st.noise.width = st.noise.height = 160;
      { const g = st.noise.getContext('2d'), id = g.createImageData(160, 160); for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 20; } g.putImageData(id, 0, 0); }
      st.mottle = document.createElement('canvas'); st.mottle.width = st.mottle.height = 256;
      { const g = st.mottle.getContext('2d'); for (let i = 0; i < 900; i++) { const x = r() * 256, y = r() * 256, q = 2 + r() ** 2 * 24; g.fillStyle = `rgba(${r() < .5 ? '0,0,0' : '255,240,220'},${(.012 + r() * .03).toFixed(3)})`; g.beginPath(); g.ellipse(x, y, q, q * (.5 + r() * .6), r() * 3, 0, TAU); g.fill(); } }
      st.thatch = document.createElement('canvas'); st.thatch.width = 256; st.thatch.height = 64; // palm fronds laid over the beams
      { const g = st.thatch.getContext('2d'); g.fillStyle = '#20160e'; g.fillRect(0, 0, 256, 64); for (let i = 0; i < 260; i++) { const x = r() * 256, y = r() * 64, l = 20 + r() * 60, a = -.4 + r() * .8; g.strokeStyle = `rgba(${90 + r() * 50 | 0},${64 + r() * 30 | 0},${36 + r() * 20 | 0},${(.25 + r() * .4).toFixed(2)})`; g.lineWidth = .6 + r() * 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * .3); g.stroke(); } }
      st.stars = Array.from({ length: 1400 }, () => { const az = (r() - .5) * 2.6, alt = Math.asin(r() * .98); return [az, alt, .3 + r() ** 3 * 1.7, r() * 9]; });
      st.palms = Array.from({ length: 26 }, (_, i) => ({ x: -26 + i * 2.1 + (r() - .5) * 1.5 + (i > 12 ? 4 : 0), z: 5 + r() * 26, h: 8 + r() * 6, ph: r() * 9, fr: Array.from({ length: 12 }, (_, k) => [k / 12 * TAU + r() * .3, .7 + r() * .4, r() * .5]) }));
      st.palms.push({ x: -17, z: -14, h: 11, ph: 2, fr: Array.from({ length: 12 }, (_, k) => [k / 12 * TAU + r() * .3, .7 + r() * .4, r() * .5]) });
      st.peb = Array.from({ length: 700 }, () => [-15 + r() * 30, -30 + r() * 29.5, .02 + r() ** 2 * .07, r()]);
      // the people who come in the night: small groups of lights, sitting in the court and under the portico
      st.crowd = []; st.groups = [];
      for (let g = 0; g < 78; g++) {
        const under = g % 5 === 0, gx = under ? 4.5 + r() * 7 : (r() - .5) * 22, gz = under ? -10 + r() * 8 : -2.8 - r() ** 1.2 * 7.5;
        if (!under && Math.abs(gx) < 1.6 && gz > -4.5) continue; // the way to the door stays open
        const a0 = .72 + c01((Math.hypot(gx, gz + 2) - 2) / 14) * .2 + r() * .03, n = 3 + (r() * 7 | 0);
        for (let k = 0; k < n; k++) {
          const sit = r() < .7, x = gx + (r() - .5) * 2.2, z = gz + (r() - .5) * 1.6;
          st.crowd.push({ x, z, y: sit ? .5 + r() * .12 : 1.05 + r() * .2, a: a0 + r() * .015, ph: r() * 9, k: .55 + r() * .45, fromX: x + (r() - .5) * 2, fromZ: z - 2.5 - r() * 3, g: st.groups.length });
        }
        st.groups.push([gx, gz, a0]);
      }
      st.beam = (() => { // a soft vertical column: gaussian across, fading towards the top
        const c = document.createElement('canvas'); c.width = 64; c.height = 256;
        const g = c.getContext('2d'), id = g.createImageData(64, 256);
        for (let y = 0; y < 256; y++) for (let x = 0; x < 64; x++) {
          const u = (x - 31.5) / 13, v = y / 255, a = Math.exp(-u * u) * (.35 + .65 * v) * Math.min(1, (1 - v) * 12 + .02);
          const i = (y * 64 + x) * 4; id.data[i] = 255; id.data[i + 1] = 240; id.data[i + 2] = 214; id.data[i + 3] = a * 255;
        }
        g.putImageData(id, 0, 0); return c;
      })();
      st.beams = Array.from({ length: 9 }, (_, i) => ({ z: .3 + i * .5 + (r() - .5) * .06, r: .09 + r() * .03, sag: r() * .03 }));
      st.gaps = Array.from({ length: 7 }, () => [-1.4 + r() * 2.6, .6 + r() * 3.4, .1 + r() * .25]);
    },

    frame(p, t, el, st) {
      fit(st.cv);
      const c = st.ctx, W = st.cv.width, H = st.cv.height, W2 = W / 2;
      const port = H > W * 1.1;
      let [cx, cy, cz, kf, tx, ty] = spline(CAM, Math.max(-.05, Math.min(1.05, p)));
      if (port) { tx = .5; ty = Math.max(.42, ty - .2); }
      const F = (port ? W * 1.35 : Math.min(H * 1.08, W * 1.45)) * kf;
      const dT = T[2] - cz;
      const ox = tx * W - (T[0] - cx) * F / dT, hy = ty * H - (cy - T[1]) * F / dT;
      const NEAR = .06;
      const P = (x, y, z) => { const d = z - cz; return [ox + (x - cx) * F / d, hy + (cy - y) * F / d]; };
      const X = (x, z) => ox + (x - cx) * F / (z - cz), Y = (y, z) => hy + (cy - y) * F / (z - cz);
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
      const halo = (x, y, R, img, a) => { if (a <= .01 || x + R < 0 || x - R > W || y + R < 0 || y - R > H) return; c.globalAlpha = Math.min(1, a); c.drawImage(img, x - R, y - R, R * 2, R * 2); c.globalAlpha = 1; };

      // ---- beats, all from p ----
      const lampK = mix(1, .3, smooth(seg(p, .18, .8))) * (1 - .5 * smooth(seg(p, .86, 1)));
      const lampF = .86 + .14 * Math.sin(t * 7.1) * Math.sin(t * 3.7 + 1);
      const rise = smooth(seg(p, .5, .64)), gone = smooth(seg(p, .6, .72));
      const proI = 1 - gone;
      const proY = mix(PRO[1], 2.9, ease.io(rise));
      const col = Math.sin(Math.PI * c01((p - .53) / .24)) * (1 - smooth(seg(p, .7, .9))); // the column of light
      const dim = smooth(seg(p, .64, .78));
      const aliI = 1 - .25 * dim;
      const crowdU = seg(p, .7, .98);
      const inside = cz > -WT - .02;

      // ---- lights for shading ----
      const L = [];
      L.push({ p: [LAMP[0], LAMP[1] + .08, LAMP[2] - .15], c: [1, .62, .3], i: 1.1 * lampK * lampF, r2: 2.2 });
      if (proI > .01) L.push({ p: [PRO[0], proY + .25, PRO[2] - .2], c: [1, .9, .74], i: 1.5 * proI * (1 + .4 * rise), r2: 2.4 });
      L.push({ p: [ALI[0], ALI[1], ALI[2] - .1], c: [1, .86, .64], i: .9 * aliI, r2: 1.4 });
      if (col > .01) L.push({ p: [PRO[0], 2, PRO[2]], c: [1, .94, .82], i: 1.2 * col, r2: 4 });
      const AMB_IN = [.035, .03, .03], AMB_OUT = [.1, .12, .2];
      const shade = (alb, amb, nx, ny, nz, x, y, z, Ls = L) => {
        let R = amb[0], G = amb[1], B = amb[2];
        for (const l of Ls) {
          const dx = l.p[0] - x, dy = l.p[1] - y, dz = l.p[2] - z, d2 = dx * dx + dy * dy + dz * dz, d = Math.sqrt(d2) || 1;
          const lam = ((nx * dx + ny * dy + nz * dz) / d + .2) / 1.2; if (lam <= 0) continue;
          const e = l.i * lam / (1 + d2 / l.r2); R += l.c[0] * e; G += l.c[1] * e; B += l.c[2] * e;
        }
        return [tone(alb[0] * R), tone(alb[1] * G), tone(alb[2] * B)];
      };
      const PLASTER = [.74, .6, .45], EARTH = [.54, .44, .33], SAND = [.62, .55, .44];

      c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      if (inside) {
        room(true);
        if (cz < 0) jambs();
      } else {
        exterior();
      }
      // grade: grain and vignette
      c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(st.noise, 'repeat'); c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      const [vx, vy] = inside ? P(PRO[0], .6, PRO[2]) : [W * .45, H * .55];
      const vg = c.createRadialGradient(Math.min(W * .8, Math.max(W * .2, vx)), Math.min(H * .8, Math.max(H * .3, vy)), Math.min(W, H) * .22, W2, H * .5, Math.hypot(W, H) * .72);
      vg.addColorStop(0, 'rgba(3,4,8,0)'); vg.addColorStop(1, `rgba(3,4,8,${inside ? .72 : .55})`);
      c.fillStyle = vg; c.fillRect(0, 0, W, H);

      // ================= the room =================
      function room(full) {
        const wallGrad = (n, pts) => { // pts: world points along the face, sampled for a horizontal gradient
          const sp = pts.filter((q) => q[2] - cz > NEAR).map((q) => [P(q[0], q[1], q[2])[0], shade(PLASTER, AMB_IN, n[0], n[1], n[2], q[0], q[1], q[2])]).sort((a, b) => a[0] - b[0]);
          if (sp.length < 2) return rgb(sp.length ? sp[0][1] : [20, 14, 10]);
          const g = c.createLinearGradient(sp[0][0], 0, sp[sp.length - 1][0], 0);
          sp.forEach(([x, col2]) => g.addColorStop(c01((x - sp[0][0]) / (sp[sp.length - 1][0] - sp[0][0] || 1)), rgb(col2)));
          return g;
        };
        const tex = (yTop, yBot, a = 1) => {
          c.save(); c.clip();
          c.globalCompositeOperation = 'multiply'; c.globalAlpha = a; c.fillStyle = c.createPattern(st.mottle, 'repeat'); c.fillRect(0, 0, W, H);
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
          const v = c.createLinearGradient(0, yTop, 0, yBot); v.addColorStop(0, 'rgba(5,3,2,.5)'); v.addColorStop(.4, 'rgba(5,3,2,.05)'); v.addColorStop(.85, 'rgba(5,3,2,.05)'); v.addColorStop(1, 'rgba(5,3,2,.45)');
          c.fillStyle = v; c.fillRect(0, Math.min(yTop, yBot), W, Math.abs(yBot - yTop));
          c.restore();
        };
        // ceiling: fronds, then the palm trunks that carry them
        if (path3([[RX0, RH, 0], [RX1, RH, 0], [RX1, RH, RZ], [RX0, RH, RZ]])) {
          c.save(); c.clip();
          const [, y0] = P(0, RH, RZ), [, y1] = P(0, RH, Math.max(cz + .3, 0));
          c.fillStyle = '#120c08'; c.fillRect(0, 0, W, H);
          c.globalAlpha = .9; c.fillStyle = c.createPattern(st.thatch, 'repeat'); c.translate(0, y0); c.fillRect(0, y1 - y0 - H, W, H * 2); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
          // light on the underside of the roof
          c.globalCompositeOperation = 'lighter';
          const pl = (x, y, z, R, img, a) => { const d = z - cz; if (d < .2) return; const [sx, sy] = P(x, RH, z); halo(sx, sy, Math.min(W * .6, R * F / d), img, a); };
          pl(LAMP[0], RH, LAMP[2], 1.6, st.fire, .25 * lampK);
          if (proI > .01) pl(PRO[0], RH, PRO[2], 2.6, st.warm, (.16 + .5 * rise) * proI);
          pl(ALI[0], RH, ALI[2], 1.5, st.warm, .12 * aliI);
          // gaps between the fronds: starlight, then the column's light going out through them
          st.gaps.forEach(([x, z, w]) => { const d = z - cz; if (d < .3) return; const [sx, sy] = P(x, RH, z), q = w * F / d; c.fillStyle = `rgba(${(140 + 115 * col) | 0},${(150 + 90 * col) | 0},${(190 + 30 * col) | 0},${(.12 + .7 * col * Math.exp(-(((x - PRO[0]) ** 2 + (z - PRO[2]) ** 2) / 2.5))).toFixed(3)})`; c.fillRect(sx - q / 2, sy - q * .04, q, Math.max(1, q * .08)); });
          c.globalCompositeOperation = 'source-over';
          c.restore();
          st.beams.forEach((b) => { // palm trunks spanning the room
            if (b.z - cz < .15) return;
            const yb = RH - b.r;
            if (!path3([[RX0, RH, b.z - b.r], [RX1, RH, b.z - b.r], [RX1, yb - b.sag, b.z], [RX0, yb, b.z]])) return;
            const [, ya] = P(0, RH, b.z), [, ybb] = P(0, yb, b.z);
            const g = c.createLinearGradient(0, ya, 0, ybb);
            const lit = shade([.5, .36, .24], AMB_IN, 0, -1, -.3, (RX0 + RX1) / 2, yb, b.z);
            g.addColorStop(0, rgb(mixc(lit, [0, 0, 0], .6))); g.addColorStop(1, rgb(lit));
            c.fillStyle = g; c.fill();
            c.strokeStyle = 'rgba(10,6,4,.35)'; c.lineWidth = 1; c.beginPath(); for (let x = RX0; x < RX1; x += .17) { const [a1, a2] = P(x, yb, b.z), [b1, b2] = P(x + .06, RH, b.z - b.r * .6); c.moveTo(a1, a2); c.lineTo(b1, b2); } c.stroke();
          });
        }
        // walls
        const zs = [0, .8, 1.6, 2.4, 3.2, RZ];
        if (path3([[RX0, 0, 0], [RX0, 0, RZ], [RX0, RH, RZ], [RX0, RH, 0]])) { c.fillStyle = wallGrad([1, 0, 0], zs.map((z) => [RX0, 1, z])); c.fill(); tex(P(RX0, RH, RZ)[1], P(RX0, 0, RZ)[1]); }
        if (path3([[RX1, 0, 0], [RX1, 0, RZ], [RX1, RH, RZ], [RX1, RH, 0]])) { c.fillStyle = wallGrad([-1, 0, 0], zs.map((z) => [RX1, 1, z])); c.fill(); tex(P(RX1, RH, RZ)[1], P(RX1, 0, RZ)[1]); }
        if (path3([[RX0, 0, RZ], [RX1, 0, RZ], [RX1, RH, RZ], [RX0, RH, RZ]])) { c.fillStyle = wallGrad([0, 0, -1], [-1.9, -1.2, -.5, .2, .9, 1.5, 1.9].map((x) => [x, 1, RZ])); c.fill(); tex(P(0, RH, RZ)[1], P(0, 0, RZ)[1]); }
        // mud-brick courses showing through the plaster
        c.lineWidth = Math.max(1, H / 1100); c.strokeStyle = 'rgba(20,12,6,.16)'; c.beginPath();
        for (let k = 1, y = .13; y < RH; y += .13, k++) {
          for (const [xa, za, xb, zb] of [[RX0, RZ, RX1, RZ], [RX0, Math.max(0, cz + .2), RX0, RZ], [RX1, Math.max(0, cz + .2), RX1, RZ]]) {
            if (za >= zb && xa === xb) continue;
            const [p1, p2] = P(xa, y, za), [q1, q2] = P(xb, y, zb); c.moveTo(p1, p2); c.lineTo(q1, q2);
            const n = xa === xb ? Math.floor((zb - za) / .38) : Math.floor((xb - xa) / .38);
            for (let j = 0; j <= n; j++) { const u = (j + (k % 2) * .5) * .38, x = xa === xb ? xa : xa + u, z = xa === xb ? za + u : za; if ((xa === xb ? z : x) > (xa === xb ? zb : xb)) break; const [m1, m2] = P(x, y, z), [n1, n2] = P(x, y - .13, z); c.moveTo(m1, m2); c.lineTo(n1, n2); }
          }
        }
        c.stroke();
        // the niche and its lamp
        niche();
        // a water jug by the wall, a waterskin on a peg
        { const z = RZ - .35, d = z - cz; if (d > .3) { const s = F / d, [jx, jy] = P(1.55, 0, z);
          const prof = [[0, .5], [.15, .95], [.3, 1], [.42, .78], [.5, .45], [.56, .5]], rr = .17 * s;
          c.beginPath(); prof.forEach(([y, k], i) => (i ? c.lineTo(jx - k * rr, jy - y * s) : c.moveTo(jx - k * rr, jy - y * s))); for (let i = prof.length - 1; i >= 0; i--) c.lineTo(jx + prof[i][1] * rr, jy - prof[i][0] * s); c.closePath();
          const g = c.createLinearGradient(jx - rr, 0, jx + rr, 0); g.addColorStop(0, rgb(shade([.5, .32, .2], AMB_IN, -1, 0, -.3, 1.4, .25, z))); g.addColorStop(.4, rgb(shade([.5, .32, .2], AMB_IN, 0, 0, -1, 1.55, .25, z - .15))); g.addColorStop(1, rgb(shade([.5, .32, .2], AMB_IN, 1, 0, -.3, 1.7, .25, z)));
          c.fillStyle = g; c.fill(); } }
        { const z = 2.6, d = RX1 - .05; const [qx, qy] = P(d, 1.5, z), s = F / (z - cz); if (z - cz > .3) {
          c.fillStyle = '#2a1c10'; c.fillRect(qx - .015 * s, qy - .03 * s, .03 * s, .05 * s);
          c.beginPath(); c.moveTo(qx, qy); c.quadraticCurveTo(qx - .12 * s, qy + .15 * s, qx - .07 * s, qy + .34 * s); c.quadraticCurveTo(qx + .01 * s, qy + .42 * s, qx + .06 * s, qy + .3 * s); c.quadraticCurveTo(qx + .07 * s, qy + .12 * s, qx, qy); c.closePath();
          const g = c.createLinearGradient(qx - .2 * s, 0, qx + .12 * s, 0); g.addColorStop(0, rgb(shade([.38, .26, .16], AMB_IN, -1, 0, 0, d - .1, 1.2, z))); g.addColorStop(1, rgb(shade([.38, .26, .16], AMB_IN, -1, 0, 0, d, 1.2, z + .1), 1));
          c.fillStyle = g; c.fill(); } }
        // floor
        if (path3([[RX0, 0, 0], [RX1, 0, 0], [RX1, 0, RZ], [RX0, 0, RZ]])) {
          const [, yF] = P(0, 0, RZ);
          const g = c.createLinearGradient(0, yF, 0, H);
          g.addColorStop(0, rgb(shade(EARTH, AMB_IN, 0, 1, 0, -.3, 0, RZ - .3))); g.addColorStop(1, rgb(shade(EARTH, AMB_IN, 0, 1, 0, cx, 0, cz + .8)));
          c.fillStyle = g; c.fill(); tex(yF, H, .9);
          c.save(); c.clip();
          c.globalCompositeOperation = 'lighter';
          floorPool(PRO[0], PRO[2] - .3, 2.2, 1.4, [255, 220, 170], .3 * proI);
          floorPool(LAMP[0], LAMP[2] - .4, 1.3, .9, [255, 170, 90], .22 * lampK);
          floorPool(ALI[0], ALI[2] - .2, 1, .7, [255, 214, 160], .2 * aliI);
          // starlight from the door behind us
          floorPool(0, .7, .9, .9, [120, 140, 200], .14 * (1 - .3 * proI));
          c.globalCompositeOperation = 'source-over'; c.restore();
        }
        // the woven mat and the low bed on it
        mat();
        // the Prophet and Ali, veiled figures: Ali sits behind his head with his sleeves to it; the Prophet lies with his
        // head raised against him. At the passing his figure fades from the bed as the column rises (the body does not
        // rise), and Ali's hands come back to his lap
        const fig = (x, z, m) => { const d = z - cz; if (d < .3) return null; const [sx, sy] = P(x, BED.y, z); return { x: sx, y: sy, h: m * F / d }; };
        const fA = fig(ALI_AT[0], ALI_AT[1], 1.8), fP = fig(PRO_AT[0], PRO_AT[1], 1.85);
        const oP = fP && { who: 'prophet', pose: 'lie', raise: 1, x: fP.x, y: fP.y, h: fP.h, t, amb: .75, alpha: proI };
        let hP = null, hA = null;
        if (fA) {
          const hd = oP ? Holy.head(oP) : null, k = hd ? gone : 1, tx = hd ? (hd.x - fA.x) / fA.h : 0, ty = hd ? (hd.y - fA.y) / fA.h : -.1;
          const arms = [[mix(tx - .035, -.1, k), mix(ty + .015, -.1, k)], [mix(tx + .05, .1, k), mix(ty - .01, -.1, k)]];
          hA = Holy.draw(c, { who: 'ali', pose: 'sit', x: fA.x, y: fA.y, h: fA.h, t, amb: .75, arms });
        }
        if (oP && proI > .01) hP = Holy.draw(c, oP);
        c.globalCompositeOperation = 'lighter';
        if (hP) halo(hP.x, hP.y, Math.min(W * .3, hP.r * 7), st.warm, .3 * proI); // a soft warm bloom at each disc
        if (hA) halo(hA.x, hA.y, Math.min(W * .25, hA.r * 6), st.warm, .22 * aliI);
        if (col > .01) { // the column: soft, from where he lay up through the roof
          const [bx, by] = P(PRO[0], .3, PRO[2]), [, ty2] = P(PRO[0], RH + 4, PRO[2]), s = F / (PRO[2] - cz), w = .55 * s;
          const top = Math.max(-H * .5, ty2), hh = by - top;
          c.globalAlpha = Math.min(1, .55 * col); c.drawImage(st.beam, bx - w * 2.2, top, w * 4.4, hh);
          c.globalAlpha = Math.min(1, .5 * col); c.drawImage(st.beam, bx - w * .9, top, w * 1.8, hh);
          c.globalAlpha = 1;
          for (let k = 0; k < 26; k++) { // motes carried up in it
            const u = ((t * .05 + k * .618) % 1), y = mix(.4, RH + .3, u), x = PRO[0] + .25 * Math.sin(k * 2.3 + t * .3), z = PRO[2] + .2 * Math.cos(k * 1.7);
            const [mx, my] = P(x, y, z); halo(mx, my, Math.max(1.5, .025 * s), st.glow, .5 * col * Math.sin(Math.PI * u));
          }
        }
        c.globalCompositeOperation = 'source-over';
        if (!full) return;
        // the room going dim
        if (dim > .01) { c.fillStyle = `rgba(4,3,6,${(.35 * dim).toFixed(3)})`; c.fillRect(0, 0, W, H); }
      }
      function floorPool(x, z, rx, rz, colr, a) {
        if (a <= .01 || z - rz - cz < NEAR) return;
        const [sx, sy] = P(x, 0, z), [, y0] = P(x, 0, z - rz), [, y1] = P(x, 0, z + rz), R = rx * F / (z - cz);
        c.save(); c.translate(sx, sy); c.scale(1, Math.max(.05, (y0 - y1) / 2 / R));
        const g = c.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, rgb(colr, a)); g.addColorStop(1, rgb(colr, 0));
        c.fillStyle = g; c.fillRect(-R, -R, R * 2, R * 2); c.restore();
      }
      function niche() {
        const z = RZ, d = z - cz; if (d < .2) return;
        const s = F / d, [x0, y0] = P(LAMP[0] - .22, .82, z), [x1, y1] = P(LAMP[0] + .22, 1.3, z), rr = (x1 - x0) / 2;
        c.fillStyle = rgb(shade([.3, .2, .12], AMB_IN, 0, 0, -1, LAMP[0], 1, z + .1)); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1 + rr); c.arc(x0 + rr, y1 + rr, rr, Math.PI, 0); c.lineTo(x1, y0); c.closePath(); c.fill();
        const [lx, ly] = P(LAMP[0], LAMP[1] - .1, LAMP[2]);
        c.fillStyle = '#6b4a2c'; c.beginPath(); c.ellipse(lx, ly, .11 * s, .035 * s, 0, 0, TAU); c.fill();
        c.fillStyle = '#4a321e'; c.beginPath(); c.ellipse(lx + .1 * s, ly - .012 * s, .04 * s, .016 * s, 0, 0, TAU); c.fill();
        // the flame, lower as the night goes
        const fh = .15 * s * lampK * lampF, fx = lx + .12 * s, fy = ly - .02 * s;
        c.fillStyle = '#ffd690'; c.beginPath(); c.moveTo(fx - .022 * s, fy); c.quadraticCurveTo(fx - .03 * s, fy - fh * .5, fx + .004 * s * Math.sin(t * 3), fy - fh); c.quadraticCurveTo(fx + .03 * s, fy - fh * .5, fx + .022 * s, fy); c.closePath(); c.fill();
        c.fillStyle = '#fff6e0'; c.beginPath(); c.ellipse(fx, fy - fh * .25, .008 * s, fh * .2, 0, 0, TAU); c.fill();
        c.globalCompositeOperation = 'lighter';
        halo(fx, fy - fh * .4, Math.min(W * .3, .9 * s), st.fire, .5 * lampK * lampF);
        halo(fx, fy - fh * .4, Math.max(2, .1 * s), st.glow, .7 * lampK);
        c.globalCompositeOperation = 'source-over';
      }
      function mat() {
        // palm-leaf mat
        if (path3([[-1.75, .006, 2.4], [1, .006, 2.4], [1, .006, 4.25], [-1.75, .006, 4.25]])) {
          c.fillStyle = rgb(shade([.44, .35, .22], AMB_IN, 0, 1, 0, -.4, 0, 3.2)); c.fill();
          c.save(); c.clip(); c.strokeStyle = 'rgba(30,18,8,.28)'; c.lineWidth = 1; c.beginPath();
          for (let x = -1.75; x < 1; x += .07) { const [a1, a2] = P(x, .006, 2.4), [b1, b2] = P(x, .006, 4.25); c.moveTo(a1, a2); c.lineTo(b1, b2); }
          c.stroke(); c.restore();
        }
        // the bed: a thin leather pad stuffed with fibre, lying on the mat
        const b = BED;
        if (path3([[b.x0, .02, b.z0], [b.x1, .02, b.z0], [b.x1, .02, b.z1], [b.x0, .02, b.z1]])) {
          const [ax, ay] = P(b.x0, .02, b.z0), [bx2] = P(b.x1, .02, b.z0);
          const g = c.createLinearGradient(ax, 0, bx2, 0);
          g.addColorStop(0, rgb(shade([.32, .22, .15], AMB_IN, 0, 1, 0, b.x0 + .2, .05, (b.z0 + b.z1) / 2))); g.addColorStop(.5, rgb(shade([.32, .22, .15], AMB_IN, 0, 1, 0, (b.x0 + b.x1) / 2, .05, (b.z0 + b.z1) / 2))); g.addColorStop(1, rgb(shade([.32, .22, .15], AMB_IN, 0, 1, 0, b.x1 - .2, .05, (b.z0 + b.z1) / 2)));
          c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(12,8,5,.5)'; c.lineWidth = Math.max(1, H / 500); c.stroke();
        }
        // the pillow at the head
        const [qx, qy] = P(b.x0 + .25, .06, (b.z0 + b.z1) / 2), s = F / ((b.z0 + b.z1) / 2 - cz);
        c.fillStyle = rgb(shade([.36, .26, .18], AMB_IN, 0, .6, -.8, b.x0 + .25, .1, b.z0 + .3)); c.beginPath(); c.ellipse(qx, qy, .2 * s, .05 * s, 0, 0, TAU); c.fill();
      }
      function jambs() { // the thickness of the door when the camera stands in it
        const sides = [[[DX0, 0, -WT], [DX0, 0, 0], [DX0, DH, 0], [DX0, DH, -WT]], [[DX1, 0, -WT], [DX1, 0, 0], [DX1, DH, 0], [DX1, DH, -WT]], [[DX0, DH, -WT], [DX1, DH, -WT], [DX1, DH, 0], [DX0, DH, 0]]];
        sides.forEach((q, i) => { if (path3(q)) { c.fillStyle = rgb(shade(PLASTER, AMB_IN, i === 0 ? 1 : i === 1 ? -1 : 0, i === 2 ? -1 : 0, 0, 0, 1, -.2), 1); c.fill(); } });
        // and the wall round the door, if it shows
        if (path3([[-6, 0, 0], [DX0, 0, 0], [DX0, RH + .3, 0], [-6, RH + .3, 0]])) { c.fillStyle = '#1a120c'; c.fill(); }
        if (path3([[DX1, 0, 0], [6, 0, 0], [6, RH + .3, 0], [DX1, RH + .3, 0]])) { c.fillStyle = '#1a120c'; c.fill(); }
        if (path3([[DX0, DH, 0], [DX1, DH, 0], [DX1, RH + .3, 0], [DX0, RH + .3, 0]])) { c.fillStyle = '#1a120c'; c.fill(); }
      }

      // ================= the courtyard =================
      function exterior() {
        const crowdN = st.crowd.filter((m) => crowdU > 0 && p > m.a - .02).length / st.crowd.length;
        // lights that reach the walls and the ground outside: our door, and the crowd as a few broad glows
        const doorI = (.55 * lampK + .9 * proI + .3 * aliI) * (1 - .4 * dim);
        const LO = [{ p: [0, 1.1, -.6], c: [1, .76, .46], i: .8 * doorI, r2: 6 }];
        if (crowdN > 0) [[-4, -5], [3, -4], [0, -9], [8, -9]].forEach(([x, z]) => LO.push({ p: [x, 1, z], c: [1, .7, .4], i: .32 * crowdN, r2: 18 }));
        // sky
        const g0 = c.createLinearGradient(0, Math.min(0, hy - H), 0, hy);
        g0.addColorStop(0, '#04060f'); g0.addColorStop(.7, '#0a0f22'); g0.addColorStop(1, '#18203a');
        c.fillStyle = g0; c.fillRect(0, 0, W, Math.max(0, hy) + 2);
        { // a little of the dawn still far off in the east, ahead
          const g = c.createRadialGradient(X(-6, 400), hy, 0, X(-6, 400), hy, W * .6);
          g.addColorStop(0, 'rgba(70,74,110,.35)'); g.addColorStop(1, 'rgba(70,74,110,0)'); c.fillStyle = g; c.fillRect(0, 0, W, Math.max(0, hy) + 2);
        }
        { // stars
          const sz = Math.max(1, H / 900), bins = [[], [], [], [], [], []];
          for (const [az, alt, m, ph] of st.stars) {
            const x = W2 + (ox - W2) * .02 + az * F * 1.2, y = hy - Math.tan(Math.min(1.3, alt)) * F * .9;
            if (y < 0 || y > hy || x < 0 || x > W) continue;
            const al = Math.min(1, m * (.7 + .3 * Math.sin(t * 1.3 + ph)) * c01((hy - y) / (H * .12)) * .8);
            bins[Math.min(5, al * 6 | 0)].push(x, y, m > 1.3 ? 2 * sz : sz);
          }
          bins.forEach((b, k) => { if (!b.length) return; c.fillStyle = `rgba(232,228,214,${((k + .5) / 6).toFixed(3)})`; c.beginPath(); for (let i = 0; i < b.length; i += 3) c.rect(b[i], b[i + 1], b[i + 2], b[i + 2]); c.fill(); });
        }
        { // the old moon: a thin crescent low in the east, lit from below where the sun will rise
          const mx = X(-38, 160), my = Y(17, 160), mr = Math.max(3, F * .006);
          if (mx > -20 && mx < W + 20) {
            c.globalCompositeOperation = 'lighter'; halo(mx, my, mr * 14, st.cool, .16); c.globalCompositeOperation = 'source-over';
            c.save(); c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.clip();
            c.fillStyle = 'rgba(60,64,86,.35)'; c.fillRect(mx - mr, my - mr, mr * 2, mr * 2); // earthshine
            c.fillStyle = '#e8e4d2'; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill();
            c.fillStyle = '#0b1024'; c.beginPath(); c.arc(mx - mr * .28, my - mr * .32, mr * .98, 0, TAU); c.fill();
            c.fillStyle = 'rgba(60,64,86,.3)'; c.beginPath(); c.arc(mx - mr * .28, my - mr * .32, mr * .98, 0, TAU); c.fill();
            c.restore();
          }
        }
        // ground
        const gy0 = Math.max(0, hy);
        { const g = c.createLinearGradient(0, gy0, 0, H); g.addColorStop(0, '#0d0f18'); g.addColorStop(.3, rgb(shade(SAND, AMB_OUT, 0, 1, 0, 0, 0, -12, LO))); g.addColorStop(1, rgb(shade(SAND, AMB_OUT, 0, 1, 0, cx, 0, cz + 3, LO))); c.fillStyle = g; c.fillRect(0, gy0, W, H - gy0);
          c.save(); c.beginPath(); c.rect(0, gy0, W, H - gy0); c.clip(); c.globalCompositeOperation = 'multiply'; c.fillStyle = c.createPattern(st.mottle, 'repeat'); c.fillRect(0, gy0, W, H - gy0); c.restore(); }
        c.globalCompositeOperation = 'lighter';
        floorPoolOut(0, -2.4, 3.2, 2.6, [255, 200, 140], .3 * doorI);
        c.globalCompositeOperation = 'source-over';
        // palms beyond the wall
        st.palms.filter((pm) => pm.z > 0).sort((a, b) => b.z - a.z).forEach(palm);
        // the east wall with the doors of the rooms
        eastWall(LO);
        // the portico of palm trunks on the qibla side, and everything in front of the wall, far to near
        const items = [];
        for (const x of ZULLA.x) for (let z = ZULLA.z0; z <= ZULLA.z1 + .01; z += ZULLA.dz) items.push([Math.hypot(x - cx, z - cz), () => column(x, z, LO)]);
        st.palms.filter((pm) => pm.z <= 0).forEach((pm) => items.push([Math.hypot(pm.x - cx, pm.z - cz), () => palm(pm)]));
        st.crowd.forEach((m) => { if (crowdU > 0 && p > m.a - .02) items.push([Math.hypot(m.x - cx, m.z - cz), () => person(m)]); });
        items.sort((a, b) => b[0] - a[0]);
        zullaRoof(LO);
        pebbles();
        c.globalCompositeOperation = 'lighter';
        st.groups.forEach(([gx, gz, a0]) => { const k = smooth(c01((p - a0) / .04)); if (k > 0) floorPool(gx, gz, 2.2, 1.6, [255, 170, 90], .1 * k); });
        c.globalCompositeOperation = 'source-over';
        for (const [, fn] of items) fn();
        // the column of light seen from outside, going up over the roofs into the stars
        if (col > .01) {
          c.globalCompositeOperation = 'lighter';
          const [bx, by] = P(PRO[0], WALLH, PRO[2]), [, ty2] = P(PRO[0], 40, PRO[2]), s = F / (PRO[2] - cz);
          const g = c.createLinearGradient(0, by, 0, ty2); g.addColorStop(0, `rgba(255,236,200,${(.3 * col).toFixed(3)})`); g.addColorStop(1, 'rgba(255,240,214,0)');
          c.fillStyle = g; c.beginPath(); c.ellipse(bx, (by + ty2) / 2, .7 * s, Math.abs(by - ty2) / 2, 0, 0, TAU); c.fill();
          halo(bx, by, 2.5 * s, st.warm, .25 * col);
          c.globalCompositeOperation = 'source-over';
        }
      }
      function floorPoolOut(x, z, rx, rz, colr, a) { floorPool(x, z, rx, rz, colr, a); }
      function eastWall(LO) {
        const z = -WT, d = z - cz; if (d < NEAR) return;
        const xa = -15, xb = 15;
        const pts = [-15, -10, -6, -3, -1, 0, 1, 3, 6, 10, 15];
        const sp = pts.map((x) => [X(x, z), shade(PLASTER, AMB_OUT, 0, 0, -1, x, 1.2, z, LO)]);
        const g = c.createLinearGradient(sp[0][0], 0, sp[sp.length - 1][0], 0);
        sp.forEach(([x, col2]) => g.addColorStop(c01((x - sp[0][0]) / (sp[sp.length - 1][0] - sp[0][0])), rgb(col2)));
        const [x0, yT] = P(xa, WALLH, z), [x1, yB] = P(xb, 0, z);
        c.fillStyle = g; c.fillRect(x0, yT, x1 - x0, yB - yT);
        c.save(); c.beginPath(); c.rect(x0, yT, x1 - x0, yB - yT); c.clip(); c.globalCompositeOperation = 'multiply'; c.fillStyle = c.createPattern(st.mottle, 'repeat'); c.fillRect(x0, yT, x1 - x0, yB - yT);
        c.globalCompositeOperation = 'source-over';
        const v = c.createLinearGradient(0, yT, 0, yB); v.addColorStop(0, 'rgba(4,4,8,.3)'); v.addColorStop(.3, 'rgba(4,4,8,0)'); v.addColorStop(1, 'rgba(4,4,8,.35)'); c.fillStyle = v; c.fillRect(x0, yT, x1 - x0, yB - yT);
        // palm-trunk beam ends under the parapet
        const s = F / d; c.fillStyle = 'rgba(8,6,8,.5)'; c.beginPath(); for (let x = xa + .3; x < xb; x += .8) { const [bx2, by2] = P(x, WALLH - .35, z); c.rect(bx2, by2, .14 * s, .14 * s); } c.fill();
        c.restore();
        // the other doors, curtained
        DOORS.forEach((dx2, i) => {
          const [a1, a2] = P(dx2 - .55, DH, z), [b1, b2] = P(dx2 + .55, 0, z);
          c.fillStyle = '#0a0809'; c.fillRect(a1, a2, b1 - a1, b2 - a2);
          const cg = c.createLinearGradient(a1, 0, b1, 0); for (let k = 0; k <= 6; k++) cg.addColorStop(k / 6, k % 2 ? 'rgb(24,20,26)' : 'rgb(36,30,34)');
          c.fillStyle = cg; c.fillRect(a1 + (b1 - a1) * .04, a2, (b1 - a1) * .92, b2 - a2);
          if (i === 1 || i === 2) { c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,170,90,.12)'; c.fillRect(a1 + (b1 - a1) * .46, a2, (b1 - a1) * .05, b2 - a2); c.globalCompositeOperation = 'source-over'; }
        });
        // our door: the room seen through it
        const [d0x, d0y] = P(DX0, DH, 0), [d1x, d1y] = P(DX1, 0, 0);
        c.save(); c.beginPath(); c.rect(d0x, d0y, d1x - d0x, d1y - d0y); c.clip(); room(false); c.restore();
        // the reveal of the door, and a curtain drawn aside
        const jl = [[DX0, 0, -WT], [DX0, 0, 0], [DX0, DH, 0], [DX0, DH, -WT]], jr = [[DX1, 0, -WT], [DX1, 0, 0], [DX1, DH, 0], [DX1, DH, -WT]], jt = [[DX0, DH, -WT], [DX1, DH, -WT], [DX1, DH, 0], [DX0, DH, 0]];
        [[jl, 1], [jr, -1]].forEach(([q, n]) => { if ((n > 0 && cx > DX0) || (n < 0 && cx < DX1)) if (path3(q)) { c.fillStyle = rgb(shade(PLASTER, AMB_IN, n, 0, 0, n > 0 ? DX0 : DX1, 1, -.1)); c.fill(); } });
        if (cy < DH && path3(jt)) { c.fillStyle = rgb(shade(PLASTER, AMB_IN, 0, -1, 0, 0, DH, -.2)); c.fill(); }
        const [c0x, c0y] = P(DX0 - .1, DH + .05, -WT - .02), [c1x, c1y] = P(DX0 + .32, 0, -WT - .02);
        c.beginPath(); c.moveTo(c0x, c0y); c.lineTo(c1x, c0y); c.quadraticCurveTo(c1x - (c1x - c0x) * .3, (c0y + c1y) / 2, c1x - (c1x - c0x) * .1, c1y); c.lineTo(c0x, c1y); c.closePath();
        const cg = c.createLinearGradient(c0x, 0, c1x, 0); for (let k = 0; k <= 6; k++) cg.addColorStop(k / 7, k % 2 ? 'rgb(16,13,14)' : 'rgb(27,22,22)'); cg.addColorStop(1, rgb(mixc([30, 24, 22], [160, 110, 70], .55 * doorIOf())));
        c.fillStyle = cg; c.fill();
        // spill of warm light out of the door, on the wall's foot
        c.globalCompositeOperation = 'lighter'; halo((d0x + d1x) / 2, d1y, (d1x - d0x) * 1.6, st.fire, .25 * doorIOf()); c.globalCompositeOperation = 'source-over';
      }
      function doorIOf() { return (.55 * lampK + .9 * proI + .3 * aliI) * (1 - .4 * dim) / 1.75; }
      function zullaRoof(LO) { // the portico's roof of fronds on trunks, seen from below
        const x0 = ZULLA.x[0] - 1.7, x1 = 16, z0 = ZULLA.z0 - 1.6, z1 = ZULLA.z1 + 1.2, y = ZULLA.h;
        if (cy >= y) return;
        if (path3([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]])) {
          c.save(); c.clip(); c.fillStyle = '#0c0907'; c.fillRect(0, 0, W, H);
          c.globalAlpha = .22; c.fillStyle = c.createPattern(st.thatch, 'repeat'); c.fillRect(0, 0, W, H); c.globalAlpha = 1;
          c.globalCompositeOperation = 'lighter';
          LO.slice(1).forEach((l) => { const [sx, sy] = P(l.p[0], y, Math.max(l.p[2], cz + .5)); halo(sx, sy, 8 * F / Math.max(1, l.p[2] - cz), st.fire, .3 * l.i); });
          c.globalCompositeOperation = 'source-over';
          c.restore();
        }
        // the front edge of the roof
        if (path3([[x0, y, z0], [x1, y, z0], [x1, y + .35, z0], [x0, y + .35, z0]])) { c.fillStyle = rgb(shade([.4, .3, .2], AMB_OUT, 0, 0, -1, x0 + 2, y, z0, LO)); c.fill(); }
        // the beams that run along the rows
        ZULLA.x.forEach((x) => { if (path3([[x - .14, y - .05, z0], [x + .14, y - .05, z0], [x + .14, y - .05, z1], [x - .14, y - .05, z1]])) { c.fillStyle = '#17100a'; c.fill(); } });
      }
      function column(x, z, LO) { // a palm trunk
        const d = z - cz; if (d < .3) return;
        const s = F / d, [sx, yb] = P(x, 0, z), [, yt] = P(x, ZULLA.h, z), w = .32 * s;
        if (sx + w < 0 || sx - w > W) return;
        const cl = shade([.46, .36, .26], AMB_OUT, -1, 0, -.3, x - .15, 1.4, z, LO), cr = shade([.46, .36, .26], AMB_OUT, 1, 0, -.3, x + .15, 1.4, z, LO);
        const g = c.createLinearGradient(sx - w / 2, 0, sx + w / 2, 0);
        g.addColorStop(0, rgb(mixc(cl, [70, 84, 120], .35))); g.addColorStop(.18, rgb(cl)); g.addColorStop(.6, rgb(mixc(cl, cr, .5))); g.addColorStop(1, rgb(mixc(cr, [0, 0, 0], .4)));
        c.fillStyle = g; c.fillRect(sx - w / 2, yt, w, yb - yt);
        if (w > 5) { c.strokeStyle = 'rgba(6,5,4,.4)'; c.lineWidth = Math.max(1, w * .05); c.beginPath(); for (let y = yt + w * .3; y < yb; y += w * .32) { c.moveTo(sx - w / 2, y + w * .06); c.quadraticCurveTo(sx, y - w * .04, sx + w / 2, y + w * .06); } c.stroke(); }
      }
      function palm(pm) {
        const d = pm.z - cz; if (d < 1) return;
        const s = F / d, bx = X(pm.x, pm.z), by = Y(0, pm.z);
        if (bx < -12 * s || bx > W + 12 * s) return;
        const tx2 = bx + .05 * Math.sin(pm.ph) * pm.h * s, ty2 = Y(pm.h, pm.z);
        c.strokeStyle = 'rgb(9,10,16)'; c.fillStyle = 'rgb(9,10,16)'; c.lineCap = 'round';
        c.lineWidth = Math.max(1, .38 * s); c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx, (by + ty2) / 2, tx2, ty2); c.stroke();
        pm.fr.forEach(([a, l, dr]) => { // a frond: a tapering feather that bends and droops
          const sw = Math.sin(t * .7 + pm.ph + a) * .05;
          const ex = tx2 + Math.cos(a + sw) * 3.3 * l * s, ey = ty2 - Math.sin(a + sw) * 1.1 * l * s + (1.3 + dr) * l * s;
          const mx = (tx2 + ex) / 2, my = ty2 - 1.2 * l * s * (1 - Math.abs(Math.cos(a)) * .4);
          const nx = -(ey - ty2), ny = ex - tx2, nl = Math.hypot(nx, ny) || 1, w = .5 * l * s;
          c.beginPath(); c.moveTo(tx2, ty2);
          c.quadraticCurveTo(mx + nx / nl * w, my + ny / nl * w, ex, ey);
          c.quadraticCurveTo(mx - nx / nl * w * .5, my - ny / nl * w * .5, tx2, ty2);
          c.fill();
        });
        c.beginPath(); c.ellipse(tx2, ty2 + .2 * s, .45 * s, .35 * s, 0, 0, TAU); c.fill();
      }
      function pebbles() {
        c.fillStyle = 'rgba(10,9,12,.45)';
        c.beginPath();
        for (const [x, z, w] of st.peb) { const d = z - cz; if (d < .5) continue; const s = F / d, q = w * s; if (q < .8) continue; const sx = X(x, z), sy = Y(0, z); if (sx < 0 || sx > W || sy > H) continue; c.rect(sx - q / 2, sy - q * .3, q, q * .4); }
        c.fill();
      }
      function person(m) { // one who has come: a small light, a lamp or a face lit by one, never a figure
        const d = m.z - cz; if (d < .6) return;
        const arrive = smooth(c01((p - m.a + .02) / .03));
        const x = mix(m.fromX, m.x, arrive), z = mix(m.fromZ, m.z, arrive), dd = z - cz; if (dd < .6) return;
        const s = F / dd, sx = X(x, z), sy = Y(m.y, z);
        if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) return;
        const fl = .85 + .15 * Math.sin(t * 6 + m.ph) * Math.sin(t * 3.3 + m.ph * 2);
        c.globalCompositeOperation = 'lighter';
        halo(sx, Y(0, z), Math.min(W * .08, 1.2 * s), st.fire, .05 * arrive * m.k);
        halo(sx, sy, Math.min(W * .04, .38 * s), st.fire, .3 * arrive * fl * m.k);
        halo(sx, sy, Math.max(1.2, Math.min(W * .008, .04 * s)), st.glow, .8 * arrive * m.k);
        c.globalCompositeOperation = 'source-over';
      }
    },
  };
})();
