(() => {
// muttaqin: Nahj al-Balagha, sermon 193, the description of the God-fearing. One place and one camera: Kufa, from a
// late afternoon to the next morning, keyed to the 26 clauses in the column on the right.
//  0–4   the square before the mosque's north gate: a few slow, bowed, plainly dressed figures cross a hurrying,
//        laden crowd to a ring of listeners round Ali, who stands among them in the shade of the gate.
//  5–9   the camera lifts until the sky is vast and the town small; sunset; a cool green light over the river
//        groves in the east, then, after the afterglow has gone, a far ember on the rim of the west.
//  10–18 dusk in the market street: lamps are lit, the stalls glitter; the glitter reaches for three figures and
//        falls away from them, closes round one of them and drops; they leave the market light for the gate.
//  19–21 night in the courtyard: rows form and stand, a faint light rising from the recitation in front of each.
//  22–25 dawn from the east: first light on the rows, the rows disperse into the town, morning over Kufa.
// People are faceless silhouettes. Ali, standing among them in the gate, is a veiled figure with the gold disc behind
// the head (scenes/holy.js; no face is ever drawn), and carries the warm light. No text is drawn.
// World: metres, x right (west), y up, z away from the camera (south, toward the qibla). Zero-pitch camera with a
// shift lens, as in kufa and mabit: the horizon row moves instead of the camera tilting.

// ---------- helpers ----------
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const tone = (x) => 255 * (1 - Math.exp(-1.35 * x));
const bump = (p, a, b, c, d) => smooth(seg(p, a, b)) * (1 - smooth(seg(p, c, d)));
const hash = (i, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const f4 = (v) => v.toFixed(4);
const spline = (K, p) => { // Catmull-Rom through keys [p, ...values]
  const n = K.length;
  if (p <= K[0][0]) return K[0].slice(1);
  if (p >= K[n - 1][0]) return K[n - 1].slice(1);
  let i = 0; while (p > K[i + 1][0]) i++;
  const u = (p - K[i][0]) / (K[i + 1][0] - K[i][0]), A0 = K[Math.max(0, i - 1)], B = K[i], C = K[i + 1], D = K[Math.min(n - 1, i + 2)];
  return B.slice(1).map((_, j) => { const p0 = A0[j + 1], p1 = B[j + 1], p2 = C[j + 1], p3 = D[j + 1]; return .5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (3 * p1 - p0 - 3 * p2 + p3) * u * u * u); });
};
const keys = (K, p) => { if (p <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (p <= K[i][0]) { const a = K[i - 1], b = K[i]; return mix(a[1], b[1], smooth((p - a[0]) / (b[0] - a[0]))); } return K[K.length - 1][1]; };
const lin = (K, p) => { if (p <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (p <= K[i][0]) { const a = K[i - 1], b = K[i]; return mix(a[1], b[1], (p - a[0]) / (b[0] - a[0])); } return K[K.length - 1][1]; };
const ckeys = (K, p) => { if (p <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (p <= K[i][0]) { const a = K[i - 1], b = K[i]; return mixc(a[1], b[1], smooth((p - a[0]) / (b[0] - a[0]))); } return K[K.length - 1][1]; };
const mk = (w, h) => { const o = document.createElement('canvas'); o.width = w; o.height = h; return o; };
const sprite = (stops, n = 128) => { const o = mk(n, n), g = o.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); stops.forEach(([q, s]) => gr.addColorStop(q, s)); g.fillStyle = gr; g.fillRect(0, 0, n, n); return o; };

// ---------- the clauses: start of each window, weighted by length, with holds on the sky, the night and the dawn ----------
const WGT = [1.24, 1.24, 1.24, 1.72, 1.72, 2.08, 3.04, 2.58, 1.96, 1.96, 1.24, 1.24, 1.24, 1.24, 1.24, 1.72, 1.6, 1.48, 1.48, 3.08, 2.24, .9, 2.12, 1.6, 1.96, 2.02];
const A = (() => { const sum = WGT.reduce((a, b) => a + b, 0); let acc = 0; return WGT.map((w) => { const a = .04 + .915 * acc / sum; acc += w; return a; }); })();

// ---------- the world ----------
const MW = 36, MN = 40, MQ = 112, WT = 1.2, WH = 7.2, HZ = 88, RF = 7, GW = 2.3, SGZ = 60; // the mosque
const STR = 4.4, ST0 = -150, ST1 = -8; // the market street: half-width, extent in z
const ALI = [0, .95, 38.2]; // where he stands in the shade of the gate (x, z), and the height of the warmth he carries
const ROWZ = [70.5, 69, 67.5, 66, 64.5, 63]; // the rows, front (qibla side) first
const COLX = [-33, -27, -21, -15, -9, -3, 3, 9, 15, 21, 27, 33];
const BAYX = [-30, -24, -18, -12, -6, 0, 6, 12, 18, 24, 30];
const HLAMPZ = [89.6, 95.5, 101.5, 107.5];

// camera keys: p, x, height, z, horizon row (fraction of H), focal
const CAM = [
  [-.06, 7.5, 1.65, 0, .58, .98], [0, 7.5, 1.65, 1, .58, .98], [.07, 6.2, 1.65, 5.5, .57, 1.02], [.13, 4.8, 1.68, 10.5, .56, 1.08],
  [.175, 3.6, 1.75, 15, .555, 1.14], [.2, 2.8, 3.2, 13, .56, 1.08], [.235, 1.2, 18, -12, .6, .94], [.28, 0, 62, -112, .65, .84],
  [.33, -6, 104, -185, .67, .8], [.39, -6, 98, -186, .66, .8], [.43, 0, 15, -112, .55, .94], [.455, .3, 2.1, -95, .52, 1],
  [.5, .3, 2.0, -79, .52, 1], [.6, .2, 2.0, -38, .52, 1], [.64, 0, 2.0, -27.5, .52, 1], [.657, 0, 2.05, -26.5, .52, 1.02],
  [.672, 0, 2.6, -16, .52, 1], [.688, 0, 15, 27, .5, .96], [.701, 0, 10, 41, .51, 1], [.716, 0, 4.6, 49.5, .53, 1.04],
  [.78, 0, 4.2, 52.5, .53, 1.08], [.815, -.5, 3.4, 54, .53, 1.08], [.85, -2.5, 2.3, 56.5, .54, 1.1], [.874, -2, 3.2, 55, .53, 1.06], [.91, -2, 10, 42, .48, .94],
  [.96, -3, 17, 30, .45, .9], [1, -3.5, 21, 24, .44, .9], [1.06, -3.5, 21.5, 23, .44, .9],
];
// the three in the dusk market: they slow as the glitter reaches for them, stand while it holds one, then go on
const MTZ = [[.43, -88], [.613, -25], [.64, -20.5], [.646, -19.8], [.657, -19.6], [.672, -12], [.7, 46]];
// sky: p, zenith, middle, horizon
const SKY = [
  [-.1, [58, 86, 128], [150, 160, 170], [236, 200, 150]], [.15, [52, 76, 118], [146, 146, 150], [240, 184, 124]],
  [.25, [44, 58, 98], [140, 120, 124], [246, 156, 96]], [.31, [30, 40, 78], [112, 90, 104], [236, 124, 74]],
  [.37, [22, 30, 62], [62, 62, 92], [160, 90, 70]], [.43, [16, 24, 54], [40, 46, 80], [104, 70, 74]],
  [.53, [12, 18, 44], [28, 34, 62], [70, 54, 66]], [.6, [9, 12, 30], [18, 22, 42], [40, 34, 48]], [.67, [5, 7, 18], [10, 13, 28], [20, 22, 38]],
  [.785, [5, 7, 18], [10, 13, 28], [20, 22, 38]], [.815, [12, 17, 40], [36, 40, 70], [110, 84, 96]],
  [.855, [30, 46, 86], [110, 112, 140], [236, 170, 128]], [.9, [52, 78, 124], [150, 154, 170], [246, 206, 160]],
  [1.06, [70, 104, 152], [170, 180, 192], [236, 220, 190]],
];
const SUN = [[-.1, 68, 18], [.18, 64, 12], [.25, 40, 6.5], [.3, 26, 3], [.338, 23, 0], [.37, 22, -4], [.5, 39, -14], [.75, -80, -14], [.8, -80, -7], [.836, -80, 0], [.9, -96, 6], [1.06, -122, 17]];
const AMB = [[-.1, [.46, .48, .56]], [.2, [.42, .41, .47]], [.3, [.3, .26, .3]], [.37, [.17, .16, .23]], [.45, [.1, .105, .16]], [.53, [.075, .08, .13]], [.62, [.045, .05, .085]], [.68, [.035, .04, .07]], [.785, [.035, .04, .07]], [.82, [.08, .09, .14]], [.86, [.24, .23, .27]], [.92, [.4, .4, .45]], [1.06, [.5, .5, .55]]];
const SUNC = [[-.1, [1.6, 1.3, .92]], [.2, [1.65, 1.15, .7]], [.3, [1.6, .85, .42]], [.335, [1.3, .52, .25]], [.83, [1.3, .55, .3]], [.88, [1.6, .95, .55]], [1.06, [1.65, 1.3, .9]]];
const LAMPK = [[.24, 0], [.4, .35], [.47, 1], [.82, 1], [.87, .35], [.95, 0]];
const STARK = [[.34, 0], [.42, .25], [.55, .6], [.66, 1], [.79, 1], [.825, .35], [.86, 0]];
const FOGD = [[0, 700], [.3, 600], [.45, 380], [.7, 330], [.85, 520], [1, 1300]];

// silhouettes (local metres, u right, v up), as in qada
const MAN = [[-.27, 0], [-.245, .4], [-.205, .86], [-.22, 1.16], [-.245, 1.39], [-.19, 1.47], [-.075, 1.505], [-.07, 1.545], [-.112, 1.6], [-.116, 1.7], [-.07, 1.77], [0, 1.79]];
const WOMAN = [[-.3, 0], [-.27, .32], [-.215, .72], [-.2, 1.02], [-.215, 1.24], [-.205, 1.37], [-.155, 1.47], [-.12, 1.59], [-.06, 1.66], [0, 1.68]];
const MAN2 = [[-.31, 0], [-.29, .35], [-.24, .8], [-.235, 1.12], [-.25, 1.36], [-.2, 1.46], [-.08, 1.5], [-.075, 1.54], [-.125, 1.58], [-.13, 1.66], [-.11, 1.74], [-.05, 1.78], [0, 1.785]]; // a turban
const MAN3 = [[-.25, 0], [-.23, .45], [-.2, .9], [-.21, 1.18], [-.235, 1.38], [-.17, 1.5], [-.12, 1.56], [-.115, 1.66], [-.08, 1.74], [0, 1.77]]; // a shawl over the head
const KNEEL = [[-.36, 0], [-.4, .1], [-.36, .3], [-.27, .52], [-.2, .7], [-.12, .8], [-.02, .85], [.08, .84], [.16, .78], [.2, .7], [.16, .58], [.26, .44], [.36, .24], [.4, .08], [.36, 0]];
function figPts(base, o) { // mirror a half profile, then thin, lean, bow, sway
  const pts = base === KNEEL ? KNEEL.map((q) => [q[0] * (o.dir || 1), q[1]]) : base.concat(base.slice(0, -1).reverse().map(([u, v]) => [-u, v]));
  const piv = o.piv ?? .95, th = o.thin ?? 1, ln = o.lean || 0, sw = o.sway || 0, rk = o.ruku || 0;
  return pts.map(([u, v]) => {
    let x = u * th + ln * v, y = v;
    if (sw && v < .7) x += sw * (.7 - v) * .1;
    if (o.bow && v > piv) { const a = o.bow * (o.bowMax ?? .5) * (o.dir || 1), dx = x - ln * piv, dy = v - piv; x = ln * piv + dx * Math.cos(a) + dy * Math.sin(a); y = piv - dx * Math.sin(a) + dy * Math.cos(a); }
    if (rk && v > .92) { y = .92 + (v - .92) * (1 - .78 * rk); x *= 1 + .18 * rk * c01((v - .92) * 3); } // a bow seen from behind
    return [x, y];
  });
}
function smoothPath(g, pts) {
  const n = pts.length;
  g.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
  g.closePath();
}
const path2 = (pts) => { const pa = new Path2D(); smoothPath(pa, pts); return pa; };

S.muttaqin = {
  init(el, st) {
    st.cv = el.querySelector('canvas');
    st.c = st.cv.getContext('2d');
    st.list = el.querySelector('#mtq-list');
    st.items = st.list ? [...st.list.querySelectorAll('li')] : [];
    // each clause: in at its start, dimmer as the next arrives, gone three clauses later
    st.items.forEach((li, i) => {
      const a = A[i], n1 = A[i + 1] ?? 3, n2 = A[i + 2] ?? 3, n3 = A[i + 3] ?? 3;
      li.dataset.fx = `o 0 1 ${f4(a - .004)} ${f4(a + .01)} | y 22px 0px ${f4(a - .004)} ${f4(a + .016)} out | o 1 .44 ${f4(n1)} ${f4(n1 + .012)} | o .44 .18 ${f4(n2)} ${f4(n2 + .012)} | o .18 0 ${f4(n3)} ${f4(n3 + .012)}`;
    });
    const R = rng(1931);
    st.warm = sprite([[0, 'rgba(255,214,150,1)'], [.25, 'rgba(255,170,90,.45)'], [.6, 'rgba(240,130,60,.1)'], [1, 'rgba(240,120,50,0)']]);
    st.core = sprite([[0, 'rgba(255,252,240,1)'], [.3, 'rgba(255,236,200,.6)'], [1, 'rgba(255,220,170,0)']]);
    st.ali = sprite([[0, 'rgba(255,250,236,1)'], [.12, 'rgba(255,236,196,.8)'], [.35, 'rgba(255,206,140,.3)'], [.7, 'rgba(240,170,100,.07)'], [1, 'rgba(240,160,90,0)']], 256);
    st.pool = sprite([[0, 'rgba(255,190,120,1)'], [.4, 'rgba(255,170,100,.45)'], [1, 'rgba(255,150,80,0)']]);
    st.soft = sprite([[0, 'rgba(255,255,255,1)'], [.3, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]);
    st.book = sprite([[0, 'rgba(255,240,205,1)'], [.2, 'rgba(255,222,170,.55)'], [.55, 'rgba(250,200,140,.12)'], [1, 'rgba(240,190,130,0)']]);
    st.green = sprite([[0, 'rgba(150,235,190,1)'], [.35, 'rgba(110,205,160,.4)'], [1, 'rgba(80,170,130,0)']], 256);
    st.ember = sprite([[0, 'rgba(255,120,60,1)'], [.3, 'rgba(200,50,24,.45)'], [1, 'rgba(140,20,10,0)']], 256);
    st.noise = mk(192, 192);
    { const ng = st.noise.getContext('2d'), id = ng.createImageData(192, 192); for (let i = 0; i < id.data.length; i += 4) { const v = R() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 20; } ng.putImageData(id, 0, 0); }
    // palm silhouettes for the far groves
    st.palmS = [0, 1, 2].map((k) => {
      const o = mk(192, 256), g = o.getContext('2d'), q = rng(70 + k);
      g.strokeStyle = '#000'; g.fillStyle = '#000'; g.lineCap = 'round';
      const tx = 96 + (q() - .5) * 30, ty = 62;
      g.lineWidth = 6; g.beginPath(); g.moveTo(96, 256); g.quadraticCurveTo(96 + (tx - 96) * .15, 150, tx, ty); g.stroke();
      for (let j = 0; j < 15; j++) {
        const a = (j / 15) * TAU + q() * .3, len = 52 + q() * 22, ca = Math.cos(a), up = Math.sin(a);
        const ex = tx + ca * len, ey = ty + 14 + 30 * Math.abs(ca) - up * 16, mx = tx + ca * len * .5, my = ty - 14 - up * 12;
        g.lineWidth = 2.4; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
        g.lineWidth = 1.3; g.beginPath();
        for (let u = .18; u < 1; u += .09) { const bx = (1 - u) ** 2 * tx + 2 * (1 - u) * u * mx + u * u * ex, by = (1 - u) ** 2 * ty + 2 * (1 - u) * u * my + u * u * ey, l = 12 * (1 - u * .6); g.moveTo(bx, by); g.lineTo(bx + ca * l * .3 - .4 * l, by + l); g.moveTo(bx, by); g.lineTo(bx + ca * l * .3 + .4 * l, by + l); }
        g.stroke();
      }
      g.beginPath(); g.ellipse(tx, ty + 4, 7, 9, 0, 0, TAU); g.fill();
      return o;
    });
    // ---- boxes: the town, the mosque ----
    const boxes = []; st.palms = []; st.far = [];
    const box = (x0, x1, y0, y1, z0, z1, alb, extra = {}) => { const b = { x0, x1, y0, y1, z0, z1, alb, ...extra }; boxes.push(b); return b; };
    const clay = () => (R() < .12 ? [.72, .66, .56] : [.6 + R() * .12, .5 + R() * .08, .38 + R() * .07]);
    const lots = (xa, xb, za, zb) => {
      for (let z0 = za; z0 < zb - 3;) {
        const z1 = Math.min(zb, z0 + 7 + R() * 8);
        for (let x0 = xa; x0 < xb - 3;) {
          const x1 = Math.min(xb, x0 + 6 + R() * 8);
          if (R() < .06) st.palms.push({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, h: 8 + R() * 6, ph: R() * 9, k: R() * 3 | 0 });
          else {
            const s = () => R() * .4, h = R() < .22 ? 5.6 + R() * 1.6 : 3.2 + R() * 1.5;
            const b = box(x0 + s(), x1 - s(), 0, h, z0 + s(), z1 - s(), clay(), { lit: R() < .3 });
            b.win = R() < .7 ? [[.2 + R() * .55, .45 + R() * .2]] : [];
            b.door = R() < .5 ? .15 + R() * .6 : -1;
            if (R() < .22 && x1 - x0 > 7) { const hx = x0 + 1 + R() * (x1 - x0 - 4), hz = z0 + 1 + R() * (z1 - z0 - 4); box(hx, hx + 2.2, h, h + 2.1, hz, hz + 2.2, b.alb, { lit: false }); }
          }
          x0 = x1 + (R() < .1 ? 1.4 : 0);
        }
        z0 = z1 + (R() < .18 ? 1.4 : 0);
      }
    };
    const XL = [-176, -136, -100, -70, -42, -8.2]; // west of the street mirrored to the east
    const ZL = [-236, -196, -156, -116, -78, -40, -8];
    for (let i = 0; i < XL.length - 1; i++) for (let j = 0; j < ZL.length - 1; j++) {
      [1, -1].forEach((sg) => {
        let xa = XL[i] + 2.2, xb = XL[i + 1] - 2.2; if (i === XL.length - 2) xb = XL[i + 1];
        if (sg < 0) [xa, xb] = [-xb, -xa];
        lots(xa, xb, ZL[j] + 2.2, ZL[j + 1] - 2.2);
      });
    }
    [[-176, -96], [96, 176]].forEach(([xa, xb]) => lots(xa + 2, xb - 2, -6, 38));
    [[-176, -44], [44, 176]].forEach(([xa, xb]) => [[42, 78], [82, 118]].forEach(([za, zb]) => lots(xa + 2, xb - 2, za, zb)));
    [[-176, -100], [-96, -40], [-36, 36], [40, 96], [100, 176]].forEach(([xa, xb]) => [[122, 160], [164, 204], [208, 250], [254, 296]].forEach(([za, zb]) => lots(xa + 2, xb - 2, za, zb)));
    // the mosque: brick and plaster, walls cut in segments so the painter's order holds inside the courtyard
    const BR = [.68, .58, .45];
    const wallZ = (x0, x1, za, zb) => { for (let z = za; z < zb - .01; z += 6) box(x0, x1, 0, WH, z, Math.min(zb, z + 6), BR, { wall: 1, crenel: 1 }); };
    wallZ(-MW - WT, -MW, MN, SGZ - 2); wallZ(-MW - WT, -MW, SGZ + 2, MQ + WT); wallZ(MW, MW + WT, MN, SGZ - 2); wallZ(MW, MW + WT, SGZ + 2, MQ + WT);
    box(-MW - WT, -MW, 4.6, WH, SGZ - 2, SGZ + 2, BR, { wall: 1 }); box(MW, MW + WT, 4.6, WH, SGZ - 2, SGZ + 2, BR, { wall: 1 });
    for (let x = -MW - WT; x < -GW - .01; x += 6) box(x, Math.min(-GW, x + 6), 0, WH, MN, MN + WT, BR, { wall: 1, crenel: 1 });
    for (let x = GW; x < MW + WT - .01; x += 6) box(x, Math.min(MW + WT, x + 6), 0, WH, MN, MN + WT, BR, { wall: 1, crenel: 1 });
    box(-GW, GW, 4.7, WH, MN, MN + WT, BR, { wall: 1, crenel: 1, lintel: 1 });
    for (let x = -MW - WT; x < MW + WT - .01; x += 6) box(x, Math.min(MW + WT, x + 6), 0, WH, MQ, MQ + WT, BR, { wall: 1 });
    [-4.3, 4.3].forEach((x) => box(x - 1.6, x + 1.6, 0, 8.4, MN - 1.6, MN, BR, { wall: 1, tower: 1 }));
    [-30, -18, 18, 30].forEach((x) => box(x - .9, x + .9, 0, 7.8, MN - 1.2, MN, BR, { wall: 1, tower: 1 }));
    [[-MW - WT, MN], [MW + WT, MN], [-MW - WT, MQ + WT], [MW + WT, MQ + WT]].forEach(([x, z]) => box(x - 1.4, x + 1.4, 0, 8.4, z - 1.4, z + 1.4, BR, { wall: 1, tower: 1 }));
    st.boxes = boxes;
    // market stalls along the street, both sides
    st.stalls = [];
    for (let z = ST0; z < ST1 - 2; z += 3.4) [-1, 1].forEach((sg) => {
      if (R() < .1) return;
      const hue = [[.62, .2, .16], [.22, .26, .46], [.7, .52, .22], [.72, .66, .54], [.3, .42, .3], [.5, .16, .2]][R() * 6 | 0];
      st.stalls.push({ sg, z0: z + .2, z1: z + 3.1, aw: hue, gold: R() < .3, lamp: R() < .7, ph: R() * 9, goods: Array.from({ length: 4 }, () => [R(), R(), R()]) });
    });
    // groves between the town and the river (east), and south beyond the town
    for (let i = 0; i < 520; i++) {
      const east = i < 330, x = east ? -200 - R() ** .7 * 420 : -360 + R() * 760, z = east ? -260 + R() * 1700 : 320 + R() * 900;
      st.far.push({ x, z, h: 9 + R() * 8, k: R() * 3 | 0 });
    }
    for (let i = 0; i < 180; i++) st.far.push({ x: -800 - R() * 500, z: -200 + R() * 2400, h: 9 + R() * 7, k: R() * 3 | 0 }); // across the river
    st.grove = []; for (let x = -4000, h = 10; x < 4000; x += 12 + R() * 22) { h = mix(h, 5 + R() * 15, .5); st.grove.push([x, h]); }
    [[-19, 23, 11], [-31, 31, 13], [17, 25, 10], [29, 33.5, 12.5], [-47, 26, 12], [46, 21, 11], [-58, 33, 13], [60, 30, 12]].forEach(([x, z, h], i) => st.palms.push({ x, z, h, ph: i * 1.7, k: i % 3 }));
    st.fleck = Array.from({ length: 1100 }, (_, i) => i < 720 ? [-60 + R() * 120, -4 + R() * 41.5, .03 + R() ** 3 * .14, R()] : [(R() - .5) * 8.4, ST0 + R() * (ST1 - ST0 + 4), .04 + R() ** 2 * .16, R()]);
    st.mw = mk(1024, 384);
    { const g = st.mw.getContext('2d'), sp = sprite([[0, 'rgba(200,210,255,.5)'], [1, 'rgba(200,210,255,0)']], 64);
      for (let i = 0; i < 260; i++) { const u = R(), n = (R() + R() + R() - 1.5) * 50, x = u * 1024, y = 330 - u * 280 + n, r = 20 + R() * 46; g.globalAlpha = .05 + R() * .08; g.drawImage(sp, x - r, y - r, 2 * r, 2 * r); }
      g.globalAlpha = 1; g.fillStyle = '#fff';
      for (let i = 0; i < 4200; i++) { const u = R(), n = (R() + R() + R() + R() - 2) * 34, x = u * 1024, y = 330 - u * 280 + n; g.globalAlpha = .12 + R() * .5; g.fillRect(x, y, R() < .1 ? 2 : 1, 1); }
      g.globalAlpha = 1; g.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 90; i++) { const u = .1 + R() * .8, x = u * 1024, y = 330 - u * 280 + (R() - .3) * 16, r = 8 + R() * 22; g.globalAlpha = .1 + R() * .14; g.drawImage(sp, x - r, y - r * .6, 2 * r, 1.2 * r); }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    { // the plain round the town, 4 m a pixel: x -2048..2048, z -1024..3072
      const T = st.gtex = mk(1024, 1024), g = T.getContext('2d'), tx = (x) => (x + 2048) / 4, tz = (z) => (z + 1024) / 4;
      g.fillStyle = 'rgb(112,94,70)'; g.fillRect(0, 0, 1024, 1024);
      for (let i = 0; i < 1400; i++) { // fields
        const x = (R() - .5) * 4000, z = -1000 + R() * 4000; if (Math.abs(x) < 200 && z > -260 && z < 320) continue;
        const w = 5 + R() * 18, h = 4 + R() * 14, col = [[74, 88, 48], [96, 100, 56], [120, 100, 62], [100, 84, 60], [84, 92, 54]][R() * 5 | 0];
        g.fillStyle = `rgb(${col.map((v) => v + (R() - .5) * 14 | 0).join(',')})`; g.fillRect(tx(x), tz(z), w, h);
      }
      const grove = (cxw, czw, rx, rz, n) => { for (let i = 0; i < n; i++) { const a = R() * TAU, r = Math.sqrt(R()); const x = cxw + Math.cos(a) * r * rx, z = czw + Math.sin(a) * r * rz; g.fillStyle = R() < .5 ? 'rgb(34,44,28)' : 'rgb(46,56,34)'; g.fillRect(tx(x), tz(z), 1 + (R() < .3), 1 + (R() < .3)); } };
      for (let i = 0; i < 70; i++) grove(-260 - R() * 520, -500 + R() * 3400, 40 + R() * 120, 60 + R() * 180, 500);   // the east, toward the river
      for (let i = 0; i < 60; i++) grove(-1000 - R() * 900, -800 + R() * 3600, 50 + R() * 140, 60 + R() * 200, 500);  // across it
      for (let i = 0; i < 70; i++) grove((R() - .5) * 2600, 360 + R() * 2600, 40 + R() * 140, 40 + R() * 140, 380);  // the south
      for (let i = 0; i < 26; i++) grove(260 + R() * 1400, -600 + R() * 1200, 30 + R() * 90, 30 + R() * 90, 220);    // a few in the west
      g.fillStyle = 'rgb(140,118,88)'; g.fillRect(tx(-184), tz(-244), 368 / 4, 548 / 4);                                    // the town's ground
      g.strokeStyle = 'rgba(40,50,58,.8)'; g.lineWidth = 1;
      for (let i = 0; i < 9; i++) { g.beginPath(); let x = -700, z = -800 + i * 420; g.moveTo(tx(x), tz(z)); for (let j = 0; j < 14; j++) { x += 120 + R() * 140; z += (R() - .4) * 90; g.lineTo(tx(x), tz(z)); } g.stroke(); }
      g.fillStyle = 'rgb(58,68,76)'; g.beginPath(); [[-760, -1024], [-700, 200], [-640, 900], [-700, 1700], [-620, 3072]].forEach(([x, z], i) => (i ? g.lineTo(tx(x - 140), tz(z)) : g.moveTo(tx(x - 140), tz(z)))); [[-620, 3072], [-700, 1700], [-640, 900], [-700, 200], [-760, -1024]].forEach(([x, z]) => g.lineTo(tx(x + 140), tz(z))); g.fill();
    }
    st.stars = Array.from({ length: 760 }, () => [(R() - .5) * 5, R() ** 1.25 * 1.7 + .015, .25 + R() ** 3 * 1.7, R() * 9]);
    st.clouds = Array.from({ length: 9 }, () => [(R() - .5) * 3.2, .05 + R() * .32, .25 + R() * .5, .012 + R() * .02, R()]);
    // ---- people ----
    const cloak = () => [MAN, MAN, MAN2, MAN3][R() * 4 | 0];
    const garb = () => [[96, 50, 38], [42, 46, 74], [110, 84, 44], [70, 60, 52], [58, 72, 56], [92, 40, 46], [64, 52, 44]][R() * 7 | 0];
    // the afternoon square: a hurrying crowd crossing, both ways
    st.sq = Array.from({ length: 52 }, (_, i) => ({ x0: -40 + R() * 80, z: 16.5 + R() * 20, v: (R() < .5 ? -1 : 1) * (150 + R() * 90), base: R() < .3 ? WOMAN : cloak(), alb: garb(), load: R() < .4 ? (R() < .5 ? 1 : 2) : 0, gold: R() < .35, ph: R() * 9, i }));
    // the few: slow, bowed, plain undyed wool; they cross to the ring
    st.mt1 = [[8.6, 17.6, -1.6, 35.9], [10.8, 19.2, .2, 35.5], [7.2, 20.4, 1.8, 35.8]].map(([x0, z0, x1, z1], i) => ({ x0, z0, x1, z1, i }));
    // the ring of listeners round the light in the gate
    st.ring = Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (1.1 + i / 8 * .8); return { x: ALI[0] + 2.7 * Math.cos(a), z: ALI[2] + 1.9 * Math.sin(a), dir: Math.cos(a) < 0 ? 1 : -1, alb: garb().map((v) => v * .8) }; });
    // the dusk market: people at the stalls, walkers both ways
    st.mk = [];
    st.stalls.forEach((s, j) => { if (R() < .55) st.mk.push({ kind: 'stand', x: s.sg * (STR - .55 - R() * .5), z: mix(s.z0, s.z1, R()), base: R() < .3 ? WOMAN : cloak(), alb: garb(), load: R() < .25 ? 2 : 0, dir: s.sg, ph: R() * 9, j }); });
    for (let i = 0; i < 44; i++) st.mk.push({ kind: 'walk', x: (R() - .5) * 2 * (STR - 1.2), z0: ST0 + R() * (ST1 - ST0), v: (R() < .5 ? -1 : 1) * (120 + R() * 120), base: R() < .3 ? WOMAN : cloak(), alb: garb(), load: R() < .45 ? (R() < .5 ? 1 : 2) : 0, ph: R() * 9 });
    st.mt3 = [[-.7, 0], [.75, -1.1], [-.1, -2.3]].map(([x, dz], i) => ({ x, dz, i }));
    // the glitter of the market: on the counters, then reaching for the three
    st.glit = Array.from({ length: 220 }, (_, i) => { const s = st.stalls[(R() * st.stalls.length) | 0]; return { s, x: s.sg * (STR + .2 + R() * 1.6), y: .95 + R() * .5, z: mix(s.z0, s.z1, R()), ph: R() * 9, r: R(), m: i % 3, ring: i < 60 }; });
    // the rows: front row first, from the middle outward; each walks in from a side gate or out of the hall
    st.rows = [];
    ROWZ.forEach((z, r) => { const n = 31; for (let k = 0; k < n; k++) { const x = (k - (n - 1) / 2) * .92; st.rows.push({ x: x + (R() - .5) * .12, z: z + (R() - .5) * .1, r, ord: r * 100 + Math.abs(x), ph: R() * 9, h: .93 + R() * .12, w: .9 + R() * .2, v: R() * 3 | 0, alb: [[70, 62, 54], [60, 56, 54], [78, 68, 56], [56, 54, 60]][R() * 4 | 0] }); } });
    st.rows.sort((a, b) => a.ord - b.ord);
    st.rows.forEach((f, k) => {
      const u = k / st.rows.length;
      f.tIn = .676 + .036 * u ** .9 + R() * .004;
      f.from = Math.abs(f.x) > 7 ? [Math.sign(f.x) * (MW - .5), SGZ + (R() - .5) * 3] : [f.x * .6, HZ - 1];
      f.tOut = R() < .045 ? 9 : .878 + R() * .05; // a few stay
      f.to = R() < .4 ? [0, MN + .6] : [Math.sign(f.x || 1) * (MW - .3), SGZ + (R() - .5) * 3];
    });
    st.motes = Array.from({ length: 140 }, () => [R(), R(), R(), R()]);
    st.dust = Array.from({ length: 120 }, () => [R(), R(), R(), R()]);
    // templates for the rows (seen from behind): standing, and three steps of a bow
    st.rowT = [MAN, MAN2, MAN3].map((b) => path2(figPts(b, {})));
  },

  frame(p, t, el, st) {
    fit(st.cv);
    const { c, cv } = st;
    const W = cv.width, H = cv.height, phone = W < H * .8, k = W / Math.max(1, cv.clientWidth);
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    const pc = Math.min(1.05, Math.max(-.05, p));

    // ---------- the column of clauses: the current one at a fixed line ----------
    if (!reduced && st.list) {
      const L = st.list, lw = L.clientWidth, lh = L.offsetHeight;
      if (lw !== st.lw || lh !== st.lh || !st.tops) { st.lw = lw; st.lh = lh; st.tops = st.items.map((li) => li.offsetTop); }
      let i = 0; while (i < A.length - 1 && p >= A[i + 1] - .004) i++;
      const kk = i === 0 ? 1 : smooth(seg(p, A[i] - .004, A[i] + .014));
      const y = mix(st.tops[Math.max(0, i - 1)], st.tops[i], kk);
      const v = `translate3d(0,${(-y).toFixed(1)}px,0)`;
      if (L.style.transform !== v) L.style.transform = v;
    }

    // ---------- beats ----------
    const b1 = 1 - smooth(seg(p, .3, .36));              // the square is still worth drawing
    const mkt = bump(p, .36, .42, .69, .72);               // the market crowd
    const night = smooth(seg(p, .64, .69));                // inside the courtyard
    const ringOn = 1 - smooth(seg(p, .3, .36));             // the listeners in the gate
    const aliK = (.55 + .45 * smooth(seg(p, A[4] - .01, A[4] + .015))) * ringOn; // the warmth he carries, brighter as the few arrive
    const lampK = keys(LAMPK, p);
    const starK = keys(STARK, p);
    const greenK = bump(p, A[8] - .005, A[8] + .02, A[9] - .006, A[9] + .012);
    const emberK = bump(p, A[9] + .002, A[9] + .02, A[10] - .01, A[10] + .02);
    const lapse = smooth(seg(p, A[21] - .006, A[22] + .004)); // the cut «…»: the night passes

    // ---------- camera ----------
    let [cx, cy, cz, hyF, kf] = spline(CAM, pc);
    const first = bump(p, A[23] - .012, A[23] + .006, A[24] + .012, A[24] + .035) * smooth(seg(spline(SUN, pc)[1], -1.5, 3)); // the first light
    const mtZ = lin(MTZ, p);
    const follow = bump(p, .45, .48, .64, .665);
    cz = mix(cz, mtZ - 8.5, follow);
    if (phone) { cx *= .45; hyF = Math.min(.8, hyF + .1); }
    const F = (phone ? W * 1.45 * (1 + .35 * (1 - smooth(seg(p, .17, .24)))) : Math.min(H * 1.12, W * .82)) * kf;
    const sx0 = W * (phone ? .5 : .42), hy = H * hyF;
    const X = (x, z) => sx0 + (x - cx) * F / (z - cz);
    const Y = (y, z) => hy + (cy - y) * F / (z - cz);
    const NEAR = .35;

    // ---------- light ----------
    const [az, el0] = spline(SUN, pc), ar = az * Math.PI / 180, er = el0 * Math.PI / 180;
    const sun = [Math.cos(er) * Math.sin(ar), Math.sin(er), Math.cos(er) * Math.cos(ar)];
    const sunVis = smooth(seg(el0, -1.5, 3)), topWrap = smooth(seg(el0, 3, 12));
    const sunC = ckeys(SUNC, p).map((v) => v * sunVis);
    const amb = ckeys(AMB, p);
    const [zen, mid, hor] = [1, 2, 3].map((j) => { let i = 0; while (i < SKY.length - 2 && p > SKY[i + 1][0]) i++; const a = SKY[i], b = SKY[i + 1]; return mixc(a[j], b[j], smooth(c01((p - a[0]) / (b[0] - a[0])))); });
    const fogC = mixc(mixc(hor, mid, .45), [0, 0, 0], keys([[.2, .12], [.3, .32], [.42, .25], [.8, .15], [.9, .1]], p)), fogD = keys(FOGD, p);
    const fogOf = (d) => 1 - Math.exp(-Math.max(0, d) / fogD);
    // point lights near the camera: lamps of the hall, the market, the gate
    const Ls = [];
    const addL = (x, y, z, col, i, r2) => { if (i > .01 && Math.abs(z - cz) < 90 && Math.abs(x - cx) < 70) Ls.push({ x, y, z, c: col, i, r2, cut: r2 * i * 60 }); };
    if (aliK > 0) addL(ALI[0], ALI[1] + .4, ALI[2], [1, .82, .58], 1.5 * aliK, 5);
    const gateK = lampK * smooth(seg(p, .5, .56)) * (1 - smooth(seg(p, .8, .86)));
    if (gateK > 0) addL(0, 3.6, MN - .4, [1, .62, .3], 1.4 * gateK, 6);
    if (lampK > 0 && cz > 20) { BAYX.forEach((x) => addL(x, 4.2, HLAMPZ[0], [1, .6, .3], 1.2 * lampK, 9)); addL(0, 2.2, MQ - .5, [1, .62, .3], 1.2 * lampK, 6); }
    st._stallI = st._stallI || [];
    if (lampK > 0 && mkt > 0) st.stalls.forEach((s, j) => { if (!s.lamp) return; const on = smooth(seg(p, .4 + hash(j, 3) * .08, .41 + hash(j, 3) * .08)); st._stallI[j] = on * lampK; if (on > 0) addL(s.sg * (STR - .1), 2.2, (s.z0 + s.z1) / 2, [1, .6, .28], 1.25 * on * lampK * (.9 + .1 * Math.sin(t * 6 + j)), 4); });
    const shade = (alb, nx, ny, nz, px, py, pz, lk = 1) => {
      const up = ny > .5 ? 1.1 : .62;
      let r = amb[0] * up, g = amb[1] * up, b = amb[2] * up;
      let sl = nx * sun[0] + ny * sun[1] + nz * sun[2];
      if (ny > .5) sl = Math.max(sl, .2 * sunVis * topWrap);
      if (sl > 0 && sunVis > 0) { r += sunC[0] * sl; g += sunC[1] * sl; b += sunC[2] * sl; }
      for (let i = 0; i < Ls.length; i++) {
        const l = Ls[i], dx = l.x - px, dy = l.y - py, dz = l.z - pz, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > l.cut) continue;
        const d = Math.sqrt(d2) || 1, lam = ((nx * dx + ny * dy + nz * dz) / d + .2) / 1.2; if (lam <= 0) continue;
        const e = lk * l.i * lam / (1 + d2 / l.r2); r += l.c[0] * e; g += l.c[1] * e; b += l.c[2] * e;
      }
      return [tone(alb[0] * r), tone(alb[1] * g), tone(alb[2] * b)];
    };
    const fogged = (col, d) => mixc(col, fogC, fogOf(d));
    const glow = (x, y, r, img, a) => { if (a <= .004 || r < .4 || x + r < 0 || x - r > W || y + r < 0 || y - r > H) return; c.globalAlpha = Math.min(1, a); c.drawImage(img, x - r, y - r, r * 2, r * 2); c.globalAlpha = 1; };
    const pool = (x, z, R, img, a, y = 0) => { // a light lying on the ground
      const d = z - cz; if (d < 1 || a <= .005) return;
      const sx = X(x, z), sy = Y(y, z), rx = R * F / d, ry = Math.max(1.5, Math.abs(Y(y, Math.max(cz + .6, z - R)) - Y(y, z + R)) / 2);
      if (sx + rx < 0 || sx - rx > W || sy - ry > H || sy + ry < 0) return;
      c.globalAlpha = Math.min(1, a); c.drawImage(img, sx - rx, sy - ry, rx * 2, ry * 2); c.globalAlpha = 1;
    };
    // a polygon in the world, clipped in front of the lens
    const poly3 = (pts) => {
      let q = pts;
      if (pts.some((v) => v[2] - cz < NEAR)) {
        q = [];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length], ia = a[2] - cz >= NEAR, ib = b[2] - cz >= NEAR;
          if (ia) q.push(a);
          if (ia !== ib) { const f = (cz + NEAR - a[2]) / (b[2] - a[2]); q.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, cz + NEAR]); }
        }
        if (q.length < 3) return false;
      }
      c.beginPath(); q.forEach((v, i) => { const x = X(v[0], v[2]), y = Y(v[1], v[2]); if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.closePath();
      return true;
    };

    // ================= sky =================
    const sunX = sun[2] > .05 ? sx0 + F * sun[0] / sun[2] : null, sunY = sun[2] > .05 ? hy - F * sun[1] / sun[2] : null;
    {
      const top = hy - F * 1.15;
      const g = c.createLinearGradient(0, top, 0, hy);
      g.addColorStop(0, rgb(zen)); g.addColorStop(.62, rgb(mid)); g.addColorStop(1, rgb(hor));
      c.fillStyle = g; c.fillRect(0, 0, W, Math.min(H, Math.max(0, hy) + 2));
      c.globalCompositeOperation = 'lighter';
      // the sun's side of the sky: west in the evening (right), east at dawn (left)
      const sideW = keys([[-.1, .55], [.26, .9], [.33, .6], [.4, 0], [.8, 0], [.85, .8], [.92, .5], [1.06, .3]], p);
      if (sideW > 0) {
        const gx = sunX ?? (sun[0] > 0 ? W * 1.3 : -W * .3), gy = hy;
        const gr = c.createRadialGradient(gx, gy, 0, gx, gy, F * 1.15);
        const col = mixc(sunC.every((v) => v === 0) ? [255, 150, 90] : [255, 170, 100], hor, .3);
        gr.addColorStop(0, rgb(col, .42 * sideW)); gr.addColorStop(.35, rgb(col, .12 * sideW)); gr.addColorStop(1, rgb(col, 0));
        c.fillStyle = gr; c.fillRect(0, 0, W, Math.min(H, Math.max(0, hy) + 2));
      }
      // stars and the band of the galaxy, wheeling a little during the cut
      if (starK > .01 && hy > 0) {
        const rot = lapse * .32, pu = 0, pv = -1.3, cr = Math.cos(rot), sr = Math.sin(rot);
        c.save(); c.translate(sx0 + pu * F, hy - pv * F); c.rotate(-rot); c.translate(-(sx0 + pu * F), -(hy - pv * F));
        c.globalAlpha = .55 * starK * starK; c.drawImage(st.mw, sx0 - 2.2 * F, hy - 1.55 * F, 4.4 * F, 1.65 * F); c.restore(); c.globalAlpha = 1;
        c.fillStyle = 'rgb(236,232,220)';
        const sz = Math.max(1, k * .9);
        for (const [u0, v0, m, ph] of st.stars) {
          const du = u0 - pu, dv = v0 - pv, u = pu + du * cr - dv * sr, v = pv + du * sr + dv * cr;
          if (v < .01) continue;
          const x = sx0 + u * F, y = hy - v * F; if (y < 0 || y > hy || x < 0 || x > W) continue;
          const a = m * starK * (.72 + .28 * Math.sin(t * 1.3 + ph)) * c01(v * 7) * .7; if (a < .03) continue;
          c.globalAlpha = Math.min(1, a); c.fillRect(x, y, m > 1.3 ? 2 * sz : sz, m > 1.3 ? 2 * sz : sz);
          if (lapse > 0 && lapse < 1 && m > .9) { c.globalAlpha = Math.min(1, a) * .35; c.fillRect(x - lapse * 6 * k, y, lapse * 6 * k, sz); }
        }
        c.globalAlpha = 1;
      }
      // the young crescent, low in the west at dusk
      const moonA = bump(p, .4, .46, .62, .67);
      if (moonA > 0) {
        const mx = sx0 + F * .48, my = hy - F * .13, mr = Math.max(3, F * .012);
        glow(mx, my, mr * 7, st.soft, .06 * moonA);
        c.fillStyle = `rgba(244,232,200,${.92 * moonA})`; c.beginPath(); c.arc(mx, my, mr, -Math.PI / 2, Math.PI / 2); c.ellipse(mx, my, mr * .55, mr, 0, Math.PI / 2, -Math.PI / 2, true); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
      // thin clouds lit from below by the low sun
      const cloudA = keys([[-.1, .55], [.3, .8], [.4, .5], [.5, .2], [.8, .2], [.86, .7], [1.06, .5]], p);
      st.clouds.forEach(([u, v, w, h, r]) => {
        const x = sx0 + u * F, y = hy - v * F, rw = w * F, rh = Math.max(1.5, h * F);
        if (y > hy || x + rw < 0 || x - rw > W) return;
        const lit = sunVis > 0 ? mixc(sunC.map((q) => Math.min(255, q * 150)), hor, .35) : mixc(mid, zen, .5);
        const col = mixc(mixc(mid, [255, 255, 255], .1), lit, .55 + .3 * r);
        st._cl = st._cl || {}; const key = col.map((q) => q >> 3).join(); let spr = st._cl[key];
        if (!spr) { spr = st._cl[key] = sprite([[0, rgb(col, 1)], [.45, rgb(col, .55)], [1, rgb(col, 0)]], 64); if (Object.keys(st._cl).length > 400) st._cl = {}; }
        c.globalAlpha = cloudA * (.3 + .35 * r);
        for (let q = 0; q < 3; q++) c.drawImage(spr, x - rw * (1 - q * .22) + q * rw * .3 * (r - .5), y - rh * (2.2 - q * .4), rw * 2 * (1 - q * .22), rh * (4.4 - q * .8));
        c.globalAlpha = 1;
      });
      // the sun itself
      if (sunX !== null && el0 > -1 && sunY < hy + 4) {
        c.save(); c.beginPath(); c.rect(0, 0, W, hy); c.clip();
        c.fillStyle = 'rgb(255,246,226)'; c.beginPath(); c.arc(sunX, sunY, Math.max(3, F * .011), 0, TAU); c.fill();
        c.globalCompositeOperation = 'lighter';
        glow(sunX, sunY, F * .45, st.warm, .22 * sunVis);
        glow(sunX, sunY, F * .045, st.core, .35 * sunVis);
        c.restore(); c.globalCompositeOperation = 'source-over';
      }
      // a cool green light over the river groves (east), then a far ember on the western rim

      if (emberK > 0) {
        c.globalCompositeOperation = 'lighter';
        const ex = phone ? W * .7 : W * .78, fl = .82 + .1 * Math.sin(t * 1.7) + .08 * Math.sin(t * 4.3);
        c.setTransform(1, 0, 0, .3, 0, hy * .7); glow(ex, hy, F * .36, st.ember, .85 * emberK * fl); c.setTransform(1, 0, 0, 1, 0, 0);
        glow(ex, hy, F * .05, st.ember, .5 * emberK * fl);
        c.fillStyle = `rgba(255,150,80,${.6 * emberK * fl})`; c.fillRect(ex - F * .07, hy - Math.max(1, k), F * .14, Math.max(1, 1.4 * k));
        c.globalCompositeOperation = 'source-over';
      }
      // the cool green over the river groves in the east: a haze of colour behind the far trees
      if (greenK > 0) {
        c.save(); c.translate(phone ? W * .2 : sx0 - F * .48, hy + F * .02); c.scale(1, .2);
        const gr = c.createRadialGradient(0, 0, 0, 0, 0, F * .7); gr.addColorStop(0, `rgba(96,196,146,${.5 * greenK})`); gr.addColorStop(.5, `rgba(70,160,120,${.22 * greenK})`); gr.addColorStop(1, 'rgba(60,140,110,0)');
        c.fillStyle = gr; c.fillRect(-F, -F, 2 * F, 2 * F); c.restore();
      }
      // the far line of palm groves
      {
        const zg = 1600, col = mixc(fogC, [10, 12, 14], .55 - .2 * smooth(seg(p, .85, 1)));
        c.fillStyle = rgb(col); c.beginPath(); c.moveTo(0, Y(0, zg) + 2);
        for (const [x, h] of st.grove) { const sx = X(x, zg); if (sx < -30 || sx > W + 30) continue; c.lineTo(sx, Y(h * (1 + .6 * c01(cy / 100)), zg)); }
        c.lineTo(W, Y(0, zg) + 2); c.closePath(); c.fill();
        if (greenK > 0) { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(60,140,100,${.18 * greenK})`; c.fill(); c.globalCompositeOperation = 'source-over'; }
      }
    }

    // ================= ground =================
    {
      const g0 = Math.max(0, hy);
      if (g0 < H) {
        const near = shade([.6, .5, .38], 0, 1, 0, cx, 0, cz + 8);
        const gg = c.createLinearGradient(0, g0, 0, H);
        gg.addColorStop(0, rgb(mixc(fogC, near, .15))); gg.addColorStop(Math.min(.6, .12 + cy / 200), rgb(mixc(fogC, near, .55))); gg.addColorStop(1, rgb(near));
        c.fillStyle = gg; c.fillRect(0, g0, W, H - g0);
        if (cy > 5) { // the plain, in perspective strips
          const dN = Math.max(4, cy * F / Math.max(1, H - hy)), dF = 4200;
          let d0 = dN;
          c.imageSmoothingEnabled = true;
          while (d0 < dF) {
            const d1 = d0 * 1.07, y0 = hy + cy * F / d1, y1 = hy + cy * F / d0, dm = (d0 + d1) / 2;
            const xw0 = cx - sx0 * dm / F, sw = W * dm / F / 4, v = (cz + dm + 1024) / 4;
            if (v > 0 && v < 1024 && y1 - y0 > .2) c.drawImage(st.gtex, (xw0 + 2048) / 4, v, sw, Math.max(1, (d1 - d0) / 4), 0, y0, W, y1 - y0 + .6);
            d0 = d1;
          }
          const E = [amb[0] * 1.1 + sunC[0] * Math.max(sun[1], .2 * sunVis * topWrap), amb[1] * 1.1 + sunC[1] * Math.max(sun[1], .2 * sunVis * topWrap), amb[2] * 1.1 + sunC[2] * Math.max(sun[1], .2 * sunVis * topWrap)];
          c.globalCompositeOperation = 'multiply'; c.fillStyle = rgb(E.map((q) => Math.min(255, 255 * (1 - Math.exp(-1.6 * q))))); c.fillRect(0, g0, W, H - g0);
          c.globalCompositeOperation = 'source-over';
          const yN = hy + cy * F / 900, fg = c.createLinearGradient(0, g0, 0, Math.min(H, Math.max(g0 + 4, yN)));
          fg.addColorStop(0, rgb(fogC, .92)); fg.addColorStop(.35, rgb(fogC, .45)); fg.addColorStop(1, rgb(fogC, .08)); c.fillStyle = fg; c.fillRect(0, g0, W, Math.min(H, Math.max(g0 + 4, yN)) - g0);
        }
      }
      // the cool green light over the river groves in the east
      if (greenK > 0) {
        const gx = sx0 - F * .5, ry = F * .16;
        c.save(); c.translate(gx, hy); c.scale(1, .3);
        const gr = c.createRadialGradient(0, 0, 0, 0, 0, F * .85); gr.addColorStop(0, `rgba(70,190,130,${.55 * greenK})`); gr.addColorStop(.45, `rgba(50,150,110,${.22 * greenK})`); gr.addColorStop(1, 'rgba(40,120,90,0)');
        c.globalCompositeOperation = 'screen'; c.fillStyle = gr; c.fillRect(-F, -F, 2 * F, 2 * F); c.restore();
        c.globalCompositeOperation = 'source-over'; void ry;
      }
      // the river, east, mirror of the sky
      if (cy > 6) {
        const rv = [[-760, -600], [-700, 200], [-640, 900], [-700, 1700], [-620, 2600]], wv = 140;
        c.beginPath();
        rv.forEach(([x, z], i) => { const d = z - cz; if (d < 5) return; const px = X(x - wv, z), py = Y(0, z); if (i) c.lineTo(px, py); else c.moveTo(px, py); });
        for (let i = rv.length - 1; i >= 0; i--) { const [x, z] = rv[i]; const d = z - cz; if (d < 5) continue; c.lineTo(X(x + wv, z), Y(0, z)); }
        c.closePath();
        c.fillStyle = rgb(mixc(mixc(hor, mid, .5), [0, 0, 0], .25 + .3 * (1 - lampK * 0))); c.fill();
        if (greenK > 0) { c.globalCompositeOperation = 'screen'; c.fillStyle = `rgba(60,150,110,${.35 * greenK})`; c.fill(); c.globalCompositeOperation = 'source-over'; }
      }
      // the courtyard: packed gravel, a shade paler
      if (poly3([[-MW, 0, Math.max(MN + WT, cz + NEAR)], [MW, 0, Math.max(MN + WT, cz + NEAR)], [MW, 0, HZ], [-MW, 0, HZ]])) { c.fillStyle = rgb(fogged(shade([.7, .62, .5], 0, 1, 0, 0, 0, 64), 64 - cz), .55); c.fill(); }
      // the street: worn darker down the middle
      if (cz < ST1 + 10 && poly3([[-2.2, 0, Math.max(ST0, cz + NEAR)], [2.2, 0, Math.max(ST0, cz + NEAR)], [2.2, 0, MN], [-2.2, 0, MN]])) { c.fillStyle = 'rgba(30,20,12,.16)'; c.fill(); }
      // stones and ruts in the square and the street
      if (cz < 30 && cy < 12) {
        const gc = shade([.6, .5, .38], 0, 1, 0, cx, 0, cz + 10);
        [[mixc(gc, [0, 0, 0], .22), 0], [mixc(gc, [255, 240, 210], .14), 1]].forEach(([col, kind]) => {
          c.fillStyle = rgb(col, .45); c.beginPath();
          for (const [x, z, r, w] of st.fleck) { if ((w > .62) !== !!kind) continue; const d = z - cz; if (d < 1.2 || d > 70) continue; const sx = X(x, z); if (sx < -20 || sx > W + 20) continue; const rr = r * F / d; if (rr < .6) continue; const sy = Y(0, z); c.moveTo(sx + rr, sy); c.ellipse(sx, sy, rr, Math.max(.5, rr * cy / d * 1.2), 0, 0, TAU); }
          c.fill();
        });
      }
      // reed mats for the rows
      if (cz > 20) ROWZ.forEach((z) => {
        if (poly3([[-14.8, .01, z - .62], [14.8, .01, z - .62], [14.8, .01, z + .5], [-14.8, .01, z + .5]])) { c.fillStyle = rgb(fogged(shade([.46, .3, .2], 0, 1, 0, 0, 0, z), z - cz)); c.fill(); }
        const d = z + .5 - cz; if (d > 1) { c.strokeStyle = rgb(fogged(shade([.7, .52, .34], 0, 1, 0, 0, 0, z), d), .8); c.lineWidth = Math.max(1, .03 * F / d); c.beginPath(); c.moveTo(X(-14.8, z + .5), Y(.012, z + .5)); c.lineTo(X(14.8, z + .5), Y(.012, z + .5)); c.stroke(); }
      });
    }

    // ================= shadows on the ground (one path, one fill) =================
    const shadowK = sunVis * (1 - smooth(seg(el0, 14, 30)));
    if (shadowK > .02 && sun[1] > .02) {
      const sdx = -sun[0] / sun[1], sdz = -sun[2] / sun[1], cap = 60;
      c.beginPath();
      const add = (pts) => { // convex hull of ground points, clipped to the lens
        if (pts.every((q) => q[1] - cz < NEAR)) return;
        const P = pts.map((q) => [q[0], 0, q[1]]).filter(() => true);
        P.sort((a, b) => a[0] - b[0] || a[2] - b[2]);
        const cr = (o, a, b) => (a[0] - o[0]) * (b[2] - o[2]) - (a[2] - o[2]) * (b[0] - o[0]);
        const lo = [], up = [];
        for (const q of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
        for (let i = P.length - 1; i >= 0; i--) { const q = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
        const hull = lo.slice(0, -1).concat(up.slice(0, -1));
        let q = hull;
        if (hull.some((v) => v[2] - cz < NEAR)) { q = []; for (let i = 0; i < hull.length; i++) { const a = hull[i], b = hull[(i + 1) % hull.length], ia = a[2] - cz >= NEAR, ib = b[2] - cz >= NEAR; if (ia) q.push(a); if (ia !== ib) { const f = (cz + NEAR - a[2]) / (b[2] - a[2]); q.push([a[0] + (b[0] - a[0]) * f, 0, cz + NEAR]); } } }
        if (q.length < 3) return;
        q.forEach((v, i) => { const x = X(v[0], v[2]), y = Y(0, v[2]); if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.closePath();
      };
      const lx = (h) => Math.max(-cap, Math.min(cap, sdx * h)), lz = (h) => Math.max(-cap, Math.min(cap, sdz * h));
      for (const b of st.boxes) {
        if (b.z1 < cz - 60 || b.z0 - cz > 420 || b.y0 > 0 || (b.wall && p > .78 && p < .9)) continue;
        if (Math.abs((b.x0 + b.x1) / 2 - cx) > 60 + (b.z0 - cz) * 1.2) continue;
        const h = b.y1, ox = lx(h), oz = lz(h);
        add([[b.x0, b.z0], [b.x1, b.z0], [b.x1, b.z1], [b.x0, b.z1], [b.x0 + ox, b.z0 + oz], [b.x1 + ox, b.z0 + oz], [b.x1 + ox, b.z1 + oz], [b.x0 + ox, b.z1 + oz]]);
      }
      st._figShadow = (x, z, h) => { const ox = Math.max(-26, Math.min(26, sdx * h)), oz = Math.max(-26, Math.min(26, sdz * h)); add([[x - .2, z - .05], [x + .2, z + .05], [x + ox + .08, z + oz], [x + ox - .08, z + oz]]); };
      st._shadowPath = true;
      st._shadowFill = () => { c.fillStyle = `rgba(${mixc([20, 18, 30], amb.map((q) => q * 80), .5).map((q) => q | 0).join(',')},${.5 * shadowK})`; c.fill(); };
    } else st._figShadow = null;

    // ================= people: where everyone is at p =================
    const people = []; // {x, z, o}
    const lit = (x, y, z) => { // the strongest light at a figure, and on which side of it on screen
      let best = 0, side = 0, col = [255, 200, 140];
      if (sunVis > .05) { best = sunVis * 1.2; side = Math.sign(sun[0]) || 1; col = sunC.map((q) => Math.min(255, q * 180)); }
      for (const l of Ls) { const d2 = (l.x - x) ** 2 + (l.y - y) ** 2 + (l.z - z) ** 2, f = l.i / (1 + d2 / l.r2); if (f > best) { best = f; side = Math.sign(X(l.x, l.z) - X(x, z)) || 1; col = [255, 200 * l.c[1] / .62 | 0, 140 * l.c[2] / .3 | 0]; } }
      return { best, side, col };
    };
    // the square
    if (b1 > 0 && p < .36) {
      const s0 = c01(p / .2);
      st.sq.forEach((f) => {
        const x = f.x0 + f.v * (p + .05) * .9, xx = ((x + 46) % 92 + 92) % 92 - 46; // they loop out of sight at the edges
        people.push({ x: xx, z: f.z, o: { base: f.base, alb: f.alb, load: f.load, dir: Math.sign(f.v), lean: .035 * Math.sign(f.v), sway: Math.sin((xx + f.ph) * 3.2), bob: Math.abs(Math.sin((xx + f.ph) * 3.2)) * .03, gold: f.gold, a: c01((46 - Math.abs(xx)) / 4) * (f.z - cz > 4 ? 1 : 0) * b1 } });
        void s0;
      });
      st.mt1.forEach((m) => {
        const u = seg(p, -.03 + m.i * .008, A[4] + .012 + m.i * .006), sit = smooth(seg(p, A[4] + .006 + m.i * .006, A[4] + .022 + m.i * .006));
        const x = mix(m.x0, m.x1, u), z = mix(m.z0, m.z1, u), bowed = .4 + .4 * smooth(seg(p, A[3] - .005, A[3] + .015));
        if (sit < .5) people.push({ x, z, o: { base: MAN, alb: [120, 108, 88], thin: .86, dir: -1, bow: bowed, bowMax: .55, sway: u > 0 && u < 1 ? Math.sin(x * 3) * .6 : 0, bob: u > 0 && u < 1 ? Math.abs(Math.sin(x * 3)) * .02 : 0, a: 1, few: 1 } });
        else people.push({ x: m.x1, z: m.z1, o: { base: KNEEL, alb: [120, 108, 88], dir: m.x1 < 0 ? 1 : -1, a: 1, few: 1 } });
      });
      if (ringOn > 0) st.ring.forEach((r) => { if (Math.abs(r.x - ALI[0]) > .5) people.push({ x: r.x, z: r.z, o: { base: KNEEL, alb: r.alb, dir: r.dir, a: ringOn } }); }); // the ring stays open toward us
      if (ringOn > 0) people.push({ x: ALI[0], z: ALI[2], o: { holy: 1, a: ringOn } }); // Ali, standing, speaking to the ring
    }
    // the market
    if (mkt > 0) {
      st.mk.forEach((f) => {
        if (f.kind === 'stand') { if (f.z - cz > 140 || f.z - cz < 3) return; people.push({ x: f.x + .05 * Math.sin(t * .5 + f.ph), z: f.z, o: { base: f.base, alb: f.alb, load: f.load, dir: -f.dir, bow: .2, a: mkt } }); return; }
        const z = ST0 + (((f.z0 - ST0) + f.v * p * .35) % (ST1 - ST0) + (ST1 - ST0)) % (ST1 - ST0);
        people.push({ x: f.x, z, o: { base: f.base, alb: f.alb, load: f.load, dir: 1, sway: Math.sin((z + f.ph) * 3.2), bob: Math.abs(Math.sin((z + f.ph) * 3.2)) * .03, a: mkt * c01((ST1 + 4 - z) / 4) * c01((z - ST0) / 4) * (z - cz > 4.5 ? 1 : 0) } });
      });
    }
    if (p > .41 && p < .72) {
      st.mt3.forEach((m) => {
        const z = mtZ + m.dz, gone = smooth(seg(z, MN - 4, MN - .5));
        people.push({ x: m.x, z, o: { base: MAN, alb: [118, 106, 88], thin: .84, dir: 1, bow: .4, bowMax: .5, sway: Math.sin(z * 3 + m.i) * .5, bob: Math.abs(Math.sin(z * 3 + m.i)) * .02, a: smooth(seg(p, .41, .44)) * (1 - gone), few: 1 } });
      });
    }
    // the rows
    if (p > .665) {
      st.rows.forEach((f) => {
        const uin = seg(p, f.tIn - .02, f.tIn), uout = seg(p, f.tOut, f.tOut + .03);
        if (uin <= 0) return;
        let x, z, a = smooth(c01(uin * 6)), still = uin >= 1 && uout <= 0;
        if (uin < 1) { const e = smooth(uin); x = mix(f.from[0], f.x, e); z = mix(f.from[1], f.z, e); } else if (uout > 0) { const e = smooth(uout); x = mix(f.x, f.to[0], e); z = mix(f.z, f.to[1], e); a *= 1 - smooth(seg(uout, .75, 1)); } else { x = f.x; z = f.z; }
        const book = smooth(seg(p, f.tIn + .004, f.tIn + .02)) * (1 - smooth(seg(p, .815, .86)));
        people.push({ x, z, o: { row: f, tpl: f.v, w: f.w, base: [MAN, MAN2, MAN3][f.v], alb: f.alb, h: f.h, a, book, walk: !still, sway: still ? 0 : Math.sin((x + z) * 3 + f.ph), bob: still ? 0 : Math.abs(Math.sin((x + z) * 3)) * .02 } });
      });
    }
    if (st._figShadow) people.forEach((q) => { if (q.o.a > .3) st._figShadow(q.x, q.z, q.o.base === KNEEL ? .85 : 1.75); });
    if (st._figShadow) st._shadowFill();

    // ================= ground lights =================
    c.globalCompositeOperation = 'lighter';
    if (aliK > 0) pool(ALI[0], ALI[2] - .6, 5, st.pool, .45 * aliK);
    if (gateK > 0) pool(0, MN - 2.5, 5.5, st.pool, .5 * gateK);
    if (lampK > 0 && cz > 20) { BAYX.forEach((x) => { pool(x, HZ - 1.5, 4.5, st.pool, .3 * lampK); }); }
    if (mkt > 0) st.stalls.forEach((s, j) => { const I = st._stallI[j] || 0; if (I > .01) pool(s.sg * (STR - .4), (s.z0 + s.z1) / 2, 3.2, st.pool, .5 * I * mkt); });
    if (p > .68) people.forEach((q) => { if (q.o.book > .01) pool(q.x, q.z + .45, .9, st.book, .22 * q.o.book * q.o.a); });
    if (first > .01 && cz > 20 && Math.abs(sun[0]) > .1) { const dz = 2 * MW * sun[2] / sun[0]; if (poly3([[-MW, .02, SGZ - 2], [-MW, .02, SGZ + 2], [MW, .02, SGZ + 2 + dz], [MW, .02, SGZ - 2 + dz]])) { c.fillStyle = `rgba(255,190,120,${.2 * first})`; c.fill(); } }
    c.globalCompositeOperation = 'source-over';

    // ================= objects, far to near =================
    const items = [];
    const maxD = keys([[.2, 420], [.27, 1400], [.4, 1400], [.46, 360], [.86, 360], [.95, 900]], p);
    for (const b of st.boxes) {
      if (b.z1 - cz < NEAR || b.z0 - cz > maxD) continue;
      const dz = Math.max(0, b.z0 - cz), dx = cx < b.x0 ? b.x0 - cx : cx > b.x1 ? cx - b.x1 : 0;
      const sxL = X(b.x0, Math.max(b.z0, cz + 2)), sxR = X(b.x1, Math.max(b.z0, cz + 2));
      if (b.z0 > cz + 2 && (sxR < -40 || sxL > W + 40) && ((cx < b.x0 && sxL > W + 40) || (cx > b.x1 && sxR < -40))) continue;
      items.push({ d: Math.hypot(dx, dz) + .001 * (b.z1 - b.z0), b });
    }
    if (mkt > 0 || (p > .38 && p < .75)) st.stalls.forEach((s, j) => { const z = s.z0; if (z - cz < -3 || z - cz > 260) return; items.push({ d: Math.hypot(Math.max(0, z - cz), Math.abs(s.sg * STR - cx)) - .3, s, j }); });
    st.palms.forEach((pm) => { const d = pm.z - cz; if (d > 2 && d < maxD) items.push({ d: Math.hypot(pm.x - cx, d), pm }); });
    for (const q of people) items.push({ d: Math.hypot(q.x - cx, q.z - cz) - .2, q });
    if (HZ - cz > 1) items.push({ d: Math.hypot(0, HZ - cz) + .5, hall: 1 });
    items.sort((m, n) => n.d - m.d);

    // far groves first: sprites, faded by the air
    {
      c.globalAlpha = 1;
      const pc0 = mixc([8, 12, 10], fogC, .1);
      st.far.forEach((f) => {
        const d = f.z - cz; if (d < 30 || d > 3200) return;
        const s = F / d, x = X(f.x, f.z), y = Y(0, f.z), hpx = f.h * s;
        if (x < -hpx || x > W + hpx || y < 0 || y - hpx > H || hpx < 1.5) return;
        const fo = fogOf(d);
        c.globalAlpha = (1 - fo) * .95; c.drawImage(st.palmS[f.k], x - hpx * .375, y - hpx, hpx * .75, hpx);
      });
      c.globalAlpha = 1; void pc0;
    }

    const crenel = (b, col, d0) => {
      const s = F / d0; if (s < 2) return;
      c.fillStyle = col;
      const y0 = Y(b.y1, b.z0), y1 = Y(b.y1 + .65, b.z0);
      c.beginPath();
      for (let x = b.x0 + .25; x < b.x1 - .5; x += 1.6) { const xa = X(x, b.z0), xb = X(x + .9, b.z0); if (xb < 0 || xa > W) continue; c.rect(xa, y1, xb - xa, y0 - y1 + 1); }
      c.fill();
    };
    const drawBox = (b) => {
      const fz = b.z0 - cz >= NEAR, d0 = Math.max(.5, b.z0 - cz), f = fogOf(d0), ym = (b.y0 + b.y1) / 2, zc = (b.z0 + b.z1) / 2, fc = (col) => mixc(col, fogC, f);
      // side face
      if (cx > b.x1 || cx < b.x0) {
        const xs = cx > b.x1 ? b.x1 : b.x0, n = cx > b.x1 ? 1 : -1;
        if (poly3([[xs, b.y0, b.z0], [xs, b.y0, b.z1], [xs, b.y1, b.z1], [xs, b.y1, b.z0]])) {
          c.fillStyle = rgb(fc(shade(b.alb, n, 0, 0, xs, ym, Math.max(zc, cz + 2)))); c.fill();
        }
      }
      // top
      if (cy > b.y1 && poly3([[b.x0, b.y1, b.z0], [b.x1, b.y1, b.z0], [b.x1, b.y1, b.z1], [b.x0, b.y1, b.z1]])) {
        const top = fc(shade(b.alb, 0, 1, 0, (b.x0 + b.x1) / 2, b.y1, zc)); c.fillStyle = rgb(top); c.fill();
        if (!b.wall && fz && d0 < 260 && (b.x1 - b.x0) * F / d0 > 14 && b.z1 - b.z0 > 6) { // the house's own courtyard, open to the sky
          const e = 1.6; if (poly3([[b.x0 + e, b.y1, b.z0 + e], [b.x1 - e, b.y1, b.z0 + e], [b.x1 - e, b.y1, b.z1 - e], [b.x0 + e, b.y1, b.z1 - e]])) { c.fillStyle = rgb(mixc(top, [10, 8, 10], .38)); c.fill(); }
        }
      }
      if (!fz) return;
      if (b.lit && lampK > .05 && d0 > 60) { const x = X((b.x0 + b.x1) / 2, b.z0), y = Y(b.y1 * .45, b.z0); if (x > 0 && x < W && y > 0 && y < H) { c.fillStyle = `rgba(255,${176 + 30 * hash(b.x0) | 0},100,${Math.min(1, .9 * lampK * (1 - f * .7))})`; const sz = Math.max(1, Math.min(2.4 * k, .6 * F / d0)); c.fillRect(x - sz / 2, y, sz, sz); } }
      // front face
      const xl = X(b.x0, b.z0), xr = X(b.x1, b.z0), yb = Y(b.y0, b.z0), yt = Y(b.y1, b.z0);
      if (xr < 0 || xl > W || yt > H || yb < 0) return;
      const cA = fc(shade(b.alb, 0, 0, -1, b.x0 + .3, ym, b.z0)), cB = fc(shade(b.alb, 0, 0, -1, b.x1 - .3, ym, b.z0));
      if (Math.abs(cA[0] - cB[0]) + Math.abs(cA[1] - cB[1]) > 6 && xr - xl > 3) { const g = c.createLinearGradient(xl, 0, xr, 0); g.addColorStop(0, rgb(cA)); g.addColorStop(1, rgb(cB)); c.fillStyle = g; } else c.fillStyle = rgb(cA);
      c.fillRect(xl, yt, xr - xl, yb - yt);
      const fw = xr - xl, hh = yb - yt;
      if (hh > 5 && d0 < 300) { const g = c.createLinearGradient(0, yb - hh * .4, 0, yb); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${.28 * (1 - f)})`); c.fillStyle = g; c.fillRect(xl, yb - hh * .4, fw, hh * .4); }
      if (b.tower && fw > 6) { // a half-round buttress: shade it as a drum
        const g = c.createLinearGradient(xl, 0, xr, 0);
        [-1.2, -.6, 0, .6, 1.2].forEach((a, q) => g.addColorStop(q / 4, rgb(fc(shade(b.alb, Math.sin(a), 0, -Math.cos(a), (b.x0 + b.x1) / 2, ym, b.z0)))));
        c.fillStyle = g; c.fillRect(xl, yt, fw, hh);
      }
      if (b.wall && hh > 40 && d0 < 90) {
        c.strokeStyle = `rgba(30,18,10,${.1 * (1 - f)})`; c.lineWidth = Math.max(1, .6 * k); c.beginPath();
        for (let y = .35; y < b.y1; y += .38) { const yy = Y(y, b.z0); c.moveTo(xl, yy); c.lineTo(xr, yy); }
        c.stroke();
        c.fillStyle = `rgba(255,236,200,${.03 * (1 - f)})`;
        for (let q = 0; q < 5; q++) { const u = hash(b.x0 * 3 + q, b.z0), v = hash(q, b.x0 + 7), w = .8 + hash(q + 9, b.x0) * 2.4; c.fillRect(mix(xl, xr, u), Y(v * (b.y1 - 1), b.z0), w * F / d0, .9 * F / d0); }
      }
      if (b.crenel) crenel(b, rgb(mixc(cA, [0, 0, 0], .06)), d0);
      if (b.lintel) { c.fillStyle = rgb(mixc(cA, [0, 0, 0], .3)); c.fillRect(xl, Y(4.7, b.z0) - 2 * k, fw, 2 * k); }
      if (b.win && fw > 6 && d0 < 240) {
        const nightW = lampK * (b.lit ? 1 : 0) * (1 - night * .2);
        if (b.door >= 0 && fw > 12) { const dx = xl + b.door * fw, dw = Math.max(1, Math.min(fw * .22, 1.1 * F / d0)), dh = Math.min(hh * .62, 2.1 * F / d0); c.fillStyle = rgb(mixc([14, 10, 9], fogC, f)); c.fillRect(dx, yb - dh, dw, dh); }
        b.win.forEach(([u, v]) => { const wx = xl + u * fw, wy = yb - (v + .14) * hh, ww = Math.max(1, .5 * F / d0), wh = Math.max(1, .6 * F / d0); c.fillStyle = nightW > .05 ? `rgba(255,${170 + 20 * hash(u * 99) | 0},90,${.85 * nightW * (1 - f)})` : rgb(mixc([16, 12, 12], fogC, f)); c.fillRect(wx, wy, ww, wh); });
      }
    };
    const palmNear = (pm) => {
      const d = pm.z - cz, s = F / d, bx = X(pm.x, pm.z), by = Y(0, pm.z);
      if (bx < -10 * s || bx > W + 10 * s || by < -pm.h * s) return;
      const f = fogOf(d), col = mixc(mixc([22, 20, 14], amb.map((q) => q * 60), .5), fogC, f);
      if (s * pm.h < 40) { c.globalAlpha = 1 - f * .9; const hp = pm.h * s; c.drawImage(st.palmS[pm.k], bx - hp * .375, by - hp, hp * .75, hp); c.globalAlpha = 1; return; }
      const tx = bx + .08 * Math.sin(pm.ph) * pm.h * s + Math.sin(t * .6 + pm.ph) * .05 * s, ty = Y(pm.h, pm.z);
      c.strokeStyle = rgb(col); c.lineCap = 'round';
      c.lineWidth = Math.max(1, .38 * s); c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx, (by + ty) / 2, tx, ty); c.stroke();
      c.lineWidth = Math.max(1, .1 * s);
      c.beginPath(); for (let y = 1; y < pm.h - .5; y += .45) { const yy = Y(y, pm.z), xx = mix(bx, tx, y / pm.h); c.moveTo(xx - .2 * s, yy); c.lineTo(xx + .2 * s, yy - .1 * s); } c.strokeStyle = rgb(mixc(col, [0, 0, 0], .3)); c.stroke();
      c.strokeStyle = rgb(col);
      for (let j = 0; j < 13; j++) {
        const a = j / 13 * TAU + pm.ph + .05 * Math.sin(t * .8 + j), ex = tx + Math.cos(a) * 3.6 * s, ey = ty - Math.sin(a) * 1.1 * s + 1.9 * s * Math.abs(Math.cos(a));
        c.lineWidth = Math.max(1, .14 * s); c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo((tx + ex) / 2, ty - 1.3 * s, ex, ey); c.stroke();
        if (s > 9) { c.lineWidth = Math.max(.6, .04 * s); c.beginPath(); for (let q = .2; q < 1; q += .12) { const mx = mix(tx, ex, q), my = mix(ty, ey, q) - (1 - (2 * q - 1) ** 2) * .9 * s; c.moveTo(mx, my); c.lineTo(mx + Math.cos(a + 1.3) * .5 * s, my + .55 * s); c.moveTo(mx, my); c.lineTo(mx + Math.cos(a - 1.3) * .5 * s, my + .55 * s); } c.stroke(); }
      }
    };
    const drawStall = (sv, j) => {
      const sg = sv.sg, xf = sg * STR, xb = sg * (STR + 2.6), z0 = sv.z0, z1 = sv.z1;
      const I = (st._stallI[j] || 0) * mkt, d0 = Math.max(.5, z0 - cz), f = fogOf(d0);
      // the counter
      drawBox({ x0: Math.min(xf, xb) + (sg > 0 ? .1 : .4), x1: Math.max(xf, xb) - (sg > 0 ? .4 : .1), y0: 0, y1: .92, z0, z1, alb: [.5, .38, .26] });
      // goods on it
      sv.goods.forEach(([u, v, w], q) => { const gx = sg * (STR + .3 + u * 1.6), gz = mix(z0 + .3, z1 - .3, v); if (gz - cz < 1) return; const s = F / (gz - cz), x = X(gx, gz), y = Y(.92, gz), hh = (.15 + w * .3) * s; c.fillStyle = rgb(fogged(shade(q % 2 ? [.55, .42, .2] : sv.aw, 0, 0, -1, gx, 1.1, gz), gz - cz)); c.beginPath(); c.ellipse(x, y - hh * .5, hh * .7, hh * .5, 0, 0, TAU); c.fill(); });
      // posts and the awning
      const ya = 2.55, yb2 = 2.95;
      [z0 + .05, z1 - .05].forEach((z) => { if (z - cz < NEAR) return; const x = X(xf, z); c.strokeStyle = rgb(fogged([30, 22, 16], z - cz)); c.lineWidth = Math.max(1, .07 * F / (z - cz)); c.beginPath(); c.moveTo(x, Y(0, z)); c.lineTo(x, Y(ya, z)); c.stroke(); });
      if (poly3([[xf - sg * .4, ya, z0], [xb, yb2, z0], [xb, yb2, z1], [xf - sg * .4, ya, z1]])) {
        const under = cy < ya, base = shade(sv.aw, 0, under ? -1 : 1, 0, xf, ya, (z0 + z1) / 2);
        const glowU = under ? [I * 120, I * 70, I * 30] : [0, 0, 0];
        c.fillStyle = rgb(fogged([base[0] + glowU[0], base[1] + glowU[1], base[2] + glowU[2]].map((v) => Math.min(255, v)), d0)); c.fill();
        if (z0 - cz > 1.5 && F / d0 > 6) { c.strokeStyle = rgb(fogged(mixc(base, [0, 0, 0], .35), d0)); c.lineWidth = Math.max(1, .05 * F / d0); c.beginPath(); for (let q = 1; q < 6; q++) { const z = mix(z0, z1, q / 6); c.moveTo(X(xf - sg * .4, z), Y(ya, z)); c.lineTo(X(xb, z), Y(yb2, z)); } c.stroke(); }
      }
      // the valance along the front
      if (poly3([[xf - sg * .4, ya, z0], [xf - sg * .4, ya, z1], [xf - sg * .4, ya - .28, z1], [xf - sg * .4, ya - .28, z0]])) { c.fillStyle = rgb(fogged(mixc(shade(sv.aw, -sg, 0, 0, xf, ya, z0), [0, 0, 0], .15), d0)); c.fill(); }
      void f;
    };
    // the prayer hall, seen from the courtyard or from above
    const drawHall = () => {
      const inside = lampK * .9 + amb[0] * .25;
      const dB = MQ - cz;
      // the qibla wall inside, the ceiling, the floor of mats
      if (poly3([[-MW, 0, MQ], [MW, 0, MQ], [MW, RF, MQ], [-MW, RF, MQ]])) { c.fillStyle = rgb(fogged([tone(.5 * inside * .5), tone(.36 * inside * .5), tone(.26 * inside * .5)], dB)); c.fill(); }
      if (cy < RF && poly3([[-MW, RF, HZ], [MW, RF, HZ], [MW, RF, MQ], [-MW, RF, MQ]])) { c.fillStyle = rgb(fogged([tone(.4 * inside * .3), tone(.3 * inside * .3), tone(.22 * inside * .3)], HZ - cz)); c.fill(); }
      if (poly3([[-MW, 0, HZ], [MW, 0, HZ], [MW, 0, MQ], [-MW, 0, MQ]])) { c.fillStyle = rgb(fogged([tone(.55 * inside * .45), tone(.42 * inside * .45), tone(.28 * inside * .45)], HZ - cz)); c.fill(); }
      c.globalCompositeOperation = 'lighter';
      HLAMPZ.forEach((z) => BAYX.forEach((x) => pool(x, z, 3.2, st.pool, .3 * lampK)));
      pool(0, MQ - 1.2, 2.2, st.pool, .5 * lampK);
      c.globalCompositeOperation = 'source-over';
      // the mihrab
      { const zz = MQ - .02; if (zz - cz > 1) { const s = F / (zz - cz), x = X(0, zz), yb = Y(0, zz); c.fillStyle = rgb(fogged([tone(.6 * inside), tone(.42 * inside), tone(.26 * inside)], dB)); c.beginPath(); c.moveTo(x - .75 * s, yb); c.lineTo(x - .75 * s, yb - 2.2 * s); c.arc(x, yb - 2.2 * s, .75 * s, Math.PI, 0); c.lineTo(x + .75 * s, yb); c.closePath(); c.fill(); } }
      // columns inside, far rows first; lamps hang between them
      [106, 100, 94].forEach((z, ri) => {
        const d = z - cz; if (d < 1) return;
        const col = fogged([tone(.62 * inside * (.28 + .1 * ri)), tone(.52 * inside * (.28 + .1 * ri)), tone(.42 * inside * (.28 + .1 * ri))], d);
        c.fillStyle = rgb(col);
        COLX.forEach((x) => { const xa = X(x - .3, z), xb = X(x + .3, z); if (xb < 0 || xa > W) return; c.fillRect(xa, Y(RF, z), xb - xa, Y(0, z) - Y(RF, z)); });
        const zl = z + 3;
        c.strokeStyle = rgb(mixc(col, [0, 0, 0], .3)); c.lineWidth = Math.max(1, .6 * k); c.beginPath(); BAYX.forEach((x) => { c.moveTo(X(x, zl), Y(RF, zl)); c.lineTo(X(x, zl), Y(4.4, zl)); }); c.stroke();
        c.globalCompositeOperation = 'lighter';
        BAYX.forEach((x, j) => { const zz = zl, s = F / (zz - cz), I = lampK * (.88 + .12 * Math.sin(t * 6.5 + j * 2 + ri)); glow(X(x, zz), Y(4.3, zz), s * 2.2, st.warm, .3 * I); glow(X(x, zz), Y(4.3, zz), s * .3, st.core, .8 * I); });
        c.globalCompositeOperation = 'source-over';
      });
      // the front: lamps in the first bays, the columns, the beam over them
      const d = HZ - cz, s = F / d, fo = fogOf(d);
      c.strokeStyle = 'rgba(20,14,10,.8)'; c.lineWidth = Math.max(1, .6 * k); c.beginPath(); BAYX.forEach((x) => { c.moveTo(X(x, HLAMPZ[0]), Y(RF, HLAMPZ[0])); c.lineTo(X(x, HLAMPZ[0]), Y(4.4, HLAMPZ[0])); }); c.stroke();
      c.globalCompositeOperation = 'lighter';
      BAYX.forEach((x, j) => { const z = HLAMPZ[0], ss = F / (z - cz), I = lampK * (.88 + .12 * Math.sin(t * 7 + j * 3)); glow(X(x, z), Y(4.2, z), ss * 3, st.warm, .34 * I); glow(X(x, z), Y(4.2, z), ss * .55, st.warm, .55 * I); glow(X(x, z), Y(4.25, z), ss * .14, st.core, I); });
      { const ss = F / Math.max(1, MQ - .6 - cz); glow(X(0, MQ - .6), Y(1.6, MQ - .6), ss * 2.4, st.warm, .45 * lampK); glow(X(0, MQ - .6), Y(1.6, MQ - .6), ss * .3, st.core, .8 * lampK); }
      c.globalCompositeOperation = 'source-over';
      COLX.forEach((x) => {
        const xa = X(x - .38, HZ), xb = X(x + .38, HZ); if (xb < -5 || xa > W + 5) return;
        const cL = fogged(shade([.66, .58, .48], 0, 0, -1, x - .3, 3, HZ), d), cR = fogged(shade([.66, .58, .48], 0, 0, -1, x + .3, 3, HZ), d);
        const g = c.createLinearGradient(xa, 0, xb, 0); g.addColorStop(0, rgb(cL)); g.addColorStop(.5, rgb(mixc(cL, cR, .5).map((v) => v * 1.08))); g.addColorStop(1, rgb(mixc(cR, [0, 0, 0], .2))); c.fillStyle = g;
        c.fillRect(xa, Y(5.5, HZ), xb - xa, Y(0, HZ) - Y(5.5, HZ));
        c.fillStyle = rgb(mixc(cL, [0, 0, 0], .25)); c.fillRect(xa - .12 * s, Y(.35, HZ), xb - xa + .24 * s, Y(0, HZ) - Y(.35, HZ)); c.fillRect(xa - .14 * s, Y(5.5, HZ), xb - xa + .28 * s, .3 * s);
      });
      const bc = fogged(shade([.66, .56, .44], 0, 0, -1, cx, 6.2, HZ), d);
      c.fillStyle = rgb(bc); c.fillRect(X(-MW, HZ), Y(RF, HZ), X(MW, HZ) - X(-MW, HZ), Y(5.5, HZ) - Y(RF, HZ));
      c.fillStyle = rgb(mixc(bc, [0, 0, 0], .3)); c.fillRect(X(-MW, HZ), Y(5.62, HZ), X(MW, HZ) - X(-MW, HZ), Math.max(1, .1 * s));
      if (cy > RF && poly3([[-MW, RF, HZ], [MW, RF, HZ], [MW, RF, MQ], [-MW, RF, MQ]])) {
        const top = fogged(shade([.62, .52, .4], 0, 1, 0, 0, RF, 100), 100 - cz); c.fillStyle = rgb(top); c.fill();
        c.strokeStyle = rgb(mixc(top, [0, 0, 0], .18), .6); c.lineWidth = 1; c.beginPath(); for (let x = -MW + 3; x < MW; x += 6) { c.moveTo(X(x, HZ), Y(RF, HZ)); c.lineTo(X(x, MQ), Y(RF, MQ)); } c.stroke();
      }
      void fo;
    };
    // one person
    const figure = (x, z, o) => {
      const d = z - cz; if (d < .9 || o.a <= .01) return;
      if (o.holy) { // Ali: a veiled figure (scenes/holy.js), 1.8 m, never under 20 css px, sorted with the ring
        const h = Math.max(20 * k, 1.8 * F / d);
        st._aliHead = Holy.draw(c, { who: 'ali', pose: 'stand', x: X(x, z), y: Y(0, z), h, t, amb: mix(.45, .85, sunVis), alpha: o.a });
        return;
      }
      const s = F / d * (o.h || 1), bx = X(x, z), by = Y(0, z) - (o.bob || 0) * s;
      if (bx < -s || bx > W + s || by < 0 || by - 2.1 * s > H) return;
      const fo = fogOf(d), L = lit(x, 1.2, z);
      const body = fogged(shade(o.alb.map((v) => v / 255), 0, 0, -1, x, 1.2, z, .35), d);
      if (o.book > .01) { // the light of the recitation in front of him: it shows round his shoulders and rises a little
        c.globalCompositeOperation = 'lighter';
        const br = .9 + .1 * Math.sin(t * 1.3 + o.row.ph);
        const ga = Math.min(1, .55 * o.book * o.a * br * (1 - fo)), rx = 1.05 * s, ry = .62 * s; // flat, so it stays inside the gap between rows
        if (ga > .004) { c.globalAlpha = ga; c.drawImage(st.book, bx - rx, by - 1.15 * s - ry, 2 * rx, 2 * ry); c.globalAlpha = 1; }
        glow(bx, by - 1.05 * s, .32 * s, st.core, .3 * o.book * o.a * (1 - fo));
        c.globalCompositeOperation = 'source-over';
      }
      c.globalAlpha = o.a;
      c.setTransform(s * (o.w || 1), 0, 0, -s, bx, by);
      let pa;
      if (o.tpl !== undefined && !o.walk) pa = st.rowT[o.tpl];
      else { pa = new Path2D(); smoothPath(pa, figPts(o.base, o)); }
      if (s > 26) {
        const side = L.side, rc = L.col, ra = Math.min(.9, .15 + L.best * .45) * (1 - fo);
        const g = c.createLinearGradient(-side * .3, 0, side * .3, 0);
        g.addColorStop(0, rgb(mixc(body, [0, 0, 0], .25))); g.addColorStop(.62, rgb(body)); g.addColorStop(1, rgb(mixc(body, rc, Math.min(.65, ra))));
        c.fillStyle = g;
      } else c.fillStyle = rgb(body);
      c.fill(pa);
      if (o.load === 1) { c.beginPath(); c.ellipse(0, 1.86, .2, .1, 0, 0, TAU); c.fill(); }
      if (o.load === 2) { c.beginPath(); c.ellipse(-.17 * (o.dir || 1), 1.18, .13, .2, -.2 * (o.dir || 1), 0, TAU); c.fill(); }
      if (o.gold && sunVis > .2 && s > 14) { c.fillStyle = `rgba(255,214,120,${.55 * (1 - fo)})`; c.fillRect(-.25, .07, .5, .025); }
      // the rim of the strongest light
      if (s > 18 && L.best > .2) {
        c.globalCompositeOperation = 'lighter';
        const dawnRim = 1 + 2.2 * first;
        const ra = Math.min(.9, L.best * .35 * dawnRim) * (1 - fo), rg = c.createLinearGradient(0, 1.8, 0, .1), rc = mixc(L.col.map((v) => v * .5), [255, 214, 160], .9 * first);
        rg.addColorStop(0, rgb(rc, Math.min(1, ra * (1 + .3 * first)))); rg.addColorStop(.5, rgb(rc, ra * .6)); rg.addColorStop(1, rgb(rc, ra * .15 * first));
        c.lineWidth = .045 * (1 + .5 * first); c.strokeStyle = rg;
        c.save(); c.clip(pa); c.translate(-L.side * .035, 0); c.stroke(pa); c.restore();
        c.globalCompositeOperation = 'source-over';
      }
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
    };

    for (const it of items) {
      if (it.b) drawBox(it.b);
      else if (it.s) drawStall(it.s, it.j);
      else if (it.pm) palmNear(it.pm);
      else if (it.q) figure(it.q.x, it.q.z, it.q.o);
      else if (it.hall) drawHall();
    }

    // ================= lights in the air =================
    c.globalCompositeOperation = 'lighter';
    // the warmth Ali carries, larger than every other light, in the shade of the gate; a soft bloom at the disc
    const hd = aliK > 0 && ALI[2] - cz > 1 ? st._aliHead : null;
    if (hd) {
      const s = F / (ALI[2] - cz), br = .94 + .06 * Math.sin(t * 1.1);
      glow(hd.x, hd.y, Math.min(W * .5, s * 5.5), st.ali, .24 * aliK * br);
      glow(hd.x, hd.y, Math.max(6 * k, hd.r * 5), st.ali, .3 * aliK * br);
    }
    st._aliHead = null;
    if (gateK > 0 && MN - .4 - cz > 1) { const d = MN - .4 - cz, ss = F / d, x = X(0, MN - .4), y = Y(3.6, MN - .4), fl = .9 + .1 * Math.sin(t * 6.1); glow(x, y, ss * 3, st.warm, .35 * gateK * fl); glow(x, y, ss * .45, st.warm, .6 * gateK * fl); glow(x, y, Math.max(1.5, ss * .1), st.core, gateK); }
    // stall lamps
    if (mkt > 0) st.stalls.forEach((s, j) => {
      const I = (st._stallI[j] || 0) * mkt; if (I < .01) return;
      const z = (s.z0 + s.z1) / 2, d = z - cz; if (d < 1.2) return;
      const ss = F / d, x = X(s.sg * (STR - .1), z), y = Y(2.2, z), fl = .9 + .1 * Math.sin(t * 7 + j * 2);
      glow(x, y, ss * 2.4, st.warm, .3 * I * fl); glow(x, y, ss * .4, st.warm, .55 * I * fl); glow(x, y, ss * .1, st.core, .9 * I);
    });
    // the glitter of the market, and how it reaches for the three
    if (mkt > 0) {
      const pullS = A[17], capS = A[18];
      const at = (m, pp) => [st.mt3[m].x, lin(MTZ, pp) + st.mt3[m].dz];
      st.glit.forEach((g, i) => {
        let gx = g.x, gy = g.y, gz = g.z, a = .55 + .45 * Math.sin(t * (2 + g.r * 3) + g.ph);
        a *= .6 + .4 * hash(i, Math.floor(t * 3 + g.ph));
        if (!g.ring) { // it reaches the place where he is, he walks on, it drops where he was
          const ts = pullS + g.r * .016, ta = ts + .011, u = smooth(seg(p, ts, ta)), fall = smooth(seg(p, ta + .002, ta + .012));
          if (u > 0) { const tgt = at(g.m, Math.min(p, ta)), ang = g.ph * 7, tx = tgt[0] + Math.cos(ang) * .5, tz = tgt[1] + Math.sin(ang) * .3; gx = mix(g.x, tx, u); gz = mix(g.z, tz, u); gy = mix(g.y, 1.25 + .35 * Math.sin(ang * 3), u) + .25 * Math.sin(u * Math.PI); a = Math.max(a, u); }
          if (fall > 0) { gy *= 1 - fall; a *= 1 - .88 * fall; }
        } else { // it closes round one of them, holds, and drops as he steps out of it
          const ts = capS + g.r * .004, u = smooth(seg(p, ts, ts + .006)), brk = smooth(seg(p, A[18] + .014 + g.r * .003, A[18] + .022 + g.r * .003));
          if (u > 0) { const c0 = at(0, Math.min(p, A[18] + .014)), ang = g.ph * 7 + t * (.5 + g.r * .6) * (1 - brk), rr = mix(1.5, .5, u); gx = mix(g.x, c0[0] + Math.cos(ang) * rr, u); gz = mix(g.z, c0[1] + Math.sin(ang) * rr * .55, u); gy = mix(g.y, .5 + g.r * 1.3, u); a = Math.max(a, u * .95); }
          if (brk > 0) { gy *= 1 - brk; a *= 1 - .9 * brk; }
        }
        const d = gz - cz; if (d < 1) return;
        const s = F / d, x = X(gx, gz), y = Y(gy, gz);
        if (x < 0 || x > W || y < 0 || y > H) return;
        const sz = Math.max(1, s * .035);
        c.fillStyle = `rgba(255,216,130,${Math.min(1, a * mkt)})`; c.fillRect(x - sz / 2, y - sz / 2, sz, sz);
        if (s > 30 && a > .7) glow(x, y, s * .16, st.warm, .25 * a * mkt);
      });
    }
    // longing: faint motes lifting from the few as the camera rises
    {
      const lift = bump(p, A[6] - .01, A[6] + .01, A[7], A[7] + .02);
      if (lift > 0) st.motes.forEach(([u, v, w, r], i) => {
        const src = st.mt1[i % 3], x0 = src.x1 + (u - .5) * 1.6, z0 = src.z1 + (v - .5) * .8, hgt = ((t * .05 + w) % 1) * 30 + 1;
        const d = z0 - cz; if (d < 2) return; const x = X(x0 + Math.sin(t * .4 + i) * .5, z0), y = Y(hgt, z0);
        c.fillStyle = `rgba(255,236,200,${.5 * lift * (1 - hgt / 31)})`; c.fillRect(x, y, Math.max(1, 1.2 * k), Math.max(1, 1.2 * k));
      });
    }
    // the recitation: light motes rising slowly over the rows
    {
      const rise = smooth(seg(p, .69, .72)) * (1 - smooth(seg(p, .81, .85)));
      if (rise > 0) st.motes.forEach(([u, v, w, r], i) => {
        const x0 = (u - .5) * 28, z0 = ROWZ[i % 6] + .4, hgt = 1.3 + ((t * .045 + w) % 1) * 6;
        const d = z0 - cz; if (d < 2) return; const x = X(x0 + Math.sin(t * .3 + i) * .3, z0), y = Y(hgt, z0);
        c.fillStyle = `rgba(255,226,170,${.55 * rise * (1 - (hgt - 1.3) / 6) * (.5 + .5 * r)})`; c.fillRect(x, y, Math.max(1, 1.3 * k), Math.max(1, 1.3 * k));
      });
    }
    // the first light: thin shafts through the merlons of the east wall, over the rows; a beam through the east gate
    if (first > .01 && cz > 20) {
      const hz = Math.hypot(sun[0], sun[2]) || 1, dzx = -sun[2] / -sun[0], dyx = sun[1] / hz;
      const run = 2 * MW, dz = run * sun[2] / sun[0], dy = run * dyx; void dzx;
      const ray = (z, ya, yb, a) => {
        if (!poly3([[-MW, yb, z], [-MW, ya, z], [MW, ya - dy, z + dz], [MW, yb - dy, z + dz]])) return;
        const A0 = [X(-MW, Math.max(z, cz + 1)), Y(ya, Math.max(z, cz + 1))], B0 = [X(MW, Math.max(z + dz, cz + 1)), Y(ya - dy, Math.max(z + dz, cz + 1))];
        const g = c.createLinearGradient(A0[0], A0[1], B0[0], B0[1]); g.addColorStop(0, `rgba(255,200,130,${a})`); g.addColorStop(1, 'rgba(255,190,120,0)');
        c.fillStyle = g; c.fill();
      };
      c.globalCompositeOperation = 'lighter';
      ray(SGZ, 4.5, .02, .06 * first);
      c.globalCompositeOperation = 'source-over';
    }
    // dust in the afternoon sun
    if (b1 > 0 && sunVis > 0) st.dust.forEach(([u, v, w, r], i) => {
      const z = 16 + v * 22, x = cx - 14 + u * 28 + ((t * .25 + r * 9) % 3), y = .3 + w * 6 + Math.sin(t * .3 + i) * .2;
      const d = z - cz; if (d < 1.5) return;
      c.fillStyle = `rgba(255,226,170,${.22 * b1 * sunVis * (.4 + .6 * Math.sin(t * .8 + i))})`; c.fillRect(X(x, z), Y(y, z), Math.max(1, 1.4 * k), Math.max(1, 1.4 * k));
    });
    c.globalCompositeOperation = 'source-over';
    // sun shafts in the square
    const shaftK = 1 - smooth(seg(p, .17, .21));
    if (shaftK > 0 && sunVis > .3 && sunX !== null) {
      c.globalCompositeOperation = 'lighter';
      for (let j = 0; j < 5; j++) {
        const ex = W * (.05 + j * .16 + .02 * Math.sin(j * 7)), ey = H, w0 = W * .012, w1 = W * (.05 + .02 * (j % 2));
        const g = c.createLinearGradient(sunX, sunY, ex, ey); g.addColorStop(0, `rgba(255,214,150,${.07 * sunVis * shaftK})`); g.addColorStop(1, 'rgba(255,214,150,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(sunX - w0, sunY); c.lineTo(sunX + w0, sunY); c.lineTo(ex + w1, ey); c.lineTo(ex - w1, ey); c.closePath(); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    }

    // ================= grade =================
    const goldK = .32 * (1 - smooth(seg(p, .2, .33))) * sunVis;
    if (goldK > .01) { c.globalCompositeOperation = 'soft-light'; c.fillStyle = `rgba(255,176,90,${goldK})`; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
    if (!st.pat) st.pat = c.createPattern(st.noise, 'repeat');
    c.globalCompositeOperation = 'overlay'; c.fillStyle = st.pat; c.save(); c.translate((t * 37 % 1) * 192 | 0, (t * 53 % 1) * 192 | 0); c.fillRect(-192, -192, W + 384, H + 384); c.restore(); c.globalCompositeOperation = 'source-over';
    const vg = c.createRadialGradient(W * .45, H * .55, Math.min(W, H) * .3, W * .45, H * .55, Math.hypot(W, H) * .65);
    vg.addColorStop(0, 'rgba(5,5,9,0)'); vg.addColorStop(1, 'rgba(4,4,8,.6)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    // a darker field behind the column of clauses
    if (phone) { const g = c.createLinearGradient(0, 0, 0, H * .52); g.addColorStop(0, 'rgba(5,5,9,.78)'); g.addColorStop(.6, 'rgba(5,5,9,.45)'); g.addColorStop(1, 'rgba(5,5,9,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H * .52); }
    else {
      c.save(); c.translate(W * .86, H * .32); c.scale(1, .95);
      const r = W * .42, g = c.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, 'rgba(5,5,9,.6)'); g.addColorStop(.45, 'rgba(5,5,9,.34)'); g.addColorStop(.8, 'rgba(5,5,9,.08)'); g.addColorStop(1, 'rgba(5,5,9,0)');
      c.fillStyle = g; c.fillRect(-r, -r, 2 * r, 2 * r); c.restore();
    }
  },
};
})();
