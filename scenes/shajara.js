(() => {
// shajara: the children of Amir al-Mu'minin as a colossal tree of light over a night plain. Its root is Ali's
// light; its trunk is many strands of light twisting up out of it; each mother is a limb and her children are the
// lights at its end. Fatima's limb is the central, highest and brightest; al-Hasan and al-Husayn are gold with a
// halo. At the end threads of light run from the six who fell at Karbala, and from al-Husayn, down to Karbala on
// the horizon. The canvas draws light only; every word is DOM (names, mothers, caption, counter, tooltip).
//  p -.05–.12  the night plain; roots spread out of the light; the trunk rises and the camera tilts up with it
//  p .12–.80   one mother at a time: her limb grows, her children light up, the caption names them
//  p .80–1     the martyrs' rings brighten; threads of light run down to Karbala; the end quote
// World units are the CSS px of the rest frame; the camera only tilts (a vertical shift), so cached layers stay crisp.

const KIN = [ // mother, children, note, martyrs at Karbala (indexes), verified details [text, source]
  ['فاطمة البتول، سيّدة نساء العالمين', ['الحسن', 'الحسين', 'زينب الكبرى', 'زينب الصغرى (أمّ كلثوم)'], '', [], [
    ['الحسن «وُلد بالمدينة ليلة النصف من شهر رمضان سنة ثلاث من الهجرة»، والحسين «لخمس ليالٍ خلون من شعبان سنة أربع».', 'الإرشاد ٢:٥، ٢:٢٧'],
    ['وزينب في الكوفة بعد كربلاء: «الحمد لله والصلاة على أبي رسول الله، أمّا بعد يا أهل الكوفة، ويا أهل الختل والخذل…»', 'الأمالي للمفيد، المجلس ٣٨']]],
  ['خولة بنت جعفر بن قيس الحنفية', ['محمّد، أبو القاسم'], '', [], [['يوم الجمل: «وأعطى الراية محمد بن الحنفية ابنه».', 'الجمل للمفيد، ص٣٣٦']]],
  ['أمّ حبيب بنت ربيعة', ['عمر', 'رقيّة'], 'كانا توأمين', [], []],
  ['أمّ البنين بنت حزام', ['العبّاس', 'جعفر', 'عثمان', 'عبد الله'], '«الشهداء مع أخيهم الحسين بطفّ كربلاء»', [0, 1, 2, 3], [
    ['يوم كربلاء: «وأعطى رايته العبّاس أخاه».', 'الإرشاد ٢:٩٥'],
    ['وقال العبّاس لإخوته: «يا بني أمّي، تقدّموا حتى أراكم قد نصحتم لله ولرسوله».', 'الإرشاد ٢:١٠٩'],
    ['«فإنّه دُفن في موضع مقتله على المسنّاة بطريق الغاضرية، وقبره ظاهر».', 'الإرشاد ٢:١٢٦']]],
  ['ليلى بنت مسعود الدارمية', ['محمّد الأصغر، أبو بكر', 'عبيد الله'], '«الشهيدان مع أخيهما الحسين بالطفّ»', [0, 1], []],
  ['أسماء بنت عُميس الخثعمية', ['يحيى'], '', [], []],
  ['أمّ سعيد بنت عروة الثقفي', ['أمّ الحسن', 'رملة'], '', [], []],
  ['لأمّهاتٍ شتّى', ['نفيسة', 'زينب الصغرى', 'رقيّة الصغرى', 'أمّ هانئ', 'أمّ الكرام', 'جمانة', 'أمامة', 'أمّ سلمة', 'ميمونة', 'خديجة', 'فاطمة'], '', [], []],
];
const IMAM_KIDS = new Set(['الحسن', 'الحسين']);
const T_SHARED = 'لأمّهاتٍ شتّى';

// ---------- timing ----------
const AT = [.12, .25, .32, .385, .515, .585, .635, .685, .8]; // each mother's window; AT[8] closes the last
const growOf = (g) => [AT[g], AT[g] + Math.min(.045, (AT[g + 1] - AT[g]) * .5)];

// ---------- helpers ----------
const hash = (i, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const mk = (w, h) => { const o = document.createElement('canvas'); o.width = Math.max(1, Math.ceil(w)); o.height = Math.max(1, Math.ceil(h)); return o; };
const sprite = (stops, n = 64) => { const o = mk(n, n), g = o.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); stops.forEach(([q, c]) => gr.addColorStop(q, c)); g.fillStyle = gr; g.fillRect(0, 0, n, n); return o; };
const bez = (P, t) => { const m = 1 - t, a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t; return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]]; };
const vh2 = (i, j) => hash(i * 57.3 + j * 131.7, 7);
const vnoise = (x, y) => { const i = Math.floor(x), j = Math.floor(y), u = smooth(x - i), v = smooth(y - j); return mix(mix(vh2(i, j), vh2(i + 1, j), u), mix(vh2(i, j + 1), vh2(i + 1, j + 1), u), v); };
const fbm = (x, y) => .55 * vnoise(x, y) + .3 * vnoise(x * 2.07 + 5.1, y * 2.07 + 3.3) + .15 * vnoise(x * 4.3 + 9.7, y * 4.3 + 1.9);
const gauss = (R) => (R() + R() + R() - 1.5) * 2;
const px = (v) => `${v.toFixed(1)}px`;

// ---------- layout: two parameter sets of one function ----------
// br: one limb each: [mother, part, cx, cy (stage fractions), arc radius R (px at U = 1), arc span°, outward°]
const DESK = {
  hz: .775, base: [.395, .875], fork: [.395, .56], hw: 62, karb: [.865, .775], tilt: .26,
  safe: [18, 72, .715, .765], crown: [.39, .36, .36, .33],
  br: [
    [0, 0, .395, .3, 118, 150, 0],
    [1, 0, .215, .27, 26, 0, -45],
    [2, 0, .1, .385, 62, 80, -70],
    [3, 0, .585, .335, 96, 130, 42],
    [4, 0, .665, .475, 60, 90, 80],
    [5, 0, .065, .53, 26, 0, -95],
    [6, 0, .15, .635, 58, 80, -120],
    [7, 0, .275, .675, 104, 150, -160],
    [7, 1, .585, .64, 96, 140, 150],
  ],
};
const PHONE = {
  hz: .815, base: [.5, .878], fork: [.5, .7], hw: 30, karb: [.9, .815], tilt: .22,
  safe: [5, .285, .987, .8], crown: [.5, .5, .52, .24],
  br: [
    [0, 0, .5, .41, 62, 150, 0],
    [1, 0, .24, .42, 16, 0, -45],
    [2, 0, .12, .5, 34, 80, -70],
    [3, 0, .76, .43, 52, 130, 42],
    [4, 0, .86, .56, 34, 90, 80],
    [5, 0, .09, .6, 16, 0, -95],
    [6, 0, .2, .685, 34, 80, -120],
    [7, 0, .3, .735, 58, 150, -160],
    [7, 1, .74, .7, 52, 140, 150],
  ],
};

function layout(W, H) {
  const nar = W < 700 || W < H, P = nar ? PHONE : DESK; // portrait screens take the phone set
  // wide screens: the tree keeps left of the caption column (right: 4vw, 22rem); narrower landscapes squeeze it
  const col = W * .96 - 22 * 16 + 4, Wa = nar ? W : Math.min(W, col / P.safe[2]);
  const U = nar ? Math.min(W / 390, H / 844) : Math.min(Wa / 1440, H / 900);
  const X = (f) => f * Wa, Y = (f) => f * H;
  const L = {
    W, H, nar, U, hz: Y(P.hz), base: [X(P.base[0]), Y(P.base[1])], fork: [X(P.fork[0]), Y(P.fork[1])], hw: P.hw * U,
    karb: [P.karb[0] * W, Y(P.karb[1])], tilt: Y(P.tilt), WH: Y(1 + P.tilt) + 2,
    crown: [X(P.crown[0]), Y(P.crown[1]), X(P.crown[2]), Y(P.crown[3])],
    safe: [P.safe[0], P.safe[1] < 1 ? Y(P.safe[1]) : P.safe[1], X(P.safe[2]), Y(P.safe[3])], br: [], kids: [],
  };
  const first = []; let n0 = 0;
  KIN.forEach((G, g) => { first[g] = n0; n0 += G[1].length; });
  P.br.forEach(([g, part, cx, cy, R, span, out], bi) => {
    const [mo, kids, , mart] = KIN[g];
    const shared = g === KIN.length - 1;
    const js = shared ? (part ? kids.map((_, j) => j).slice(6) : kids.map((_, j) => j).slice(0, 6)) : kids.map((_, j) => j);
    const c = [X(cx), Y(cy)], a = out * Math.PI / 180, sp = span * Math.PI / 180, Rr = R * U;
    const dxf = c[0] - L.fork[0];
    const P0 = [L.fork[0] + Math.max(-1, Math.min(1, dxf / (W * .25))) * L.hw * .8, L.fork[1] + L.hw * .9];
    const dx = c[0] - P0[0], dy = c[1] - P0[1], up = Math.max(-dy, 0);
    const P1 = [P0[0] + dx * .1, P0[1] - up * .45 - L.hw * 1.2];
    const P2 = [P0[0] + dx * .6, c[1] - Math.abs(dx) * .08 + (dy > 0 ? -L.hw * 1.5 : up * .1)];
    const B = { bi, g, part, c, a, Rr, P: [P0, P1, P2, c], mo: shared ? T_SHARED : mo.split('،')[0], fat: g === 0, kids: [] };
    // arc order: the first child sits at the clockwise end; Fatima's arc puts the two Imams in the middle,
    // al-Husayn on the side of Karbala
    const ord = g === 0 ? [2, 1, 0, 3] : js;
    const n = ord.length;
    ord.forEach((j, q) => {
      const ang = a + (n > 1 ? sp * (.5 - q / (n - 1)) : 0), nm = kids[j];
      const imam = g === 0 && IMAM_KIDS.has(nm), m = mart.includes(j);
      const label = imam ? `الإمام ${nm} عليه السلام` : nm, short = imam ? `الإمام ${nm}` : nm;
      const r = (imam ? 6.2 : g === 0 ? 4.6 : 3.8) * U * (nar ? 1.05 : 1);
      const K = { k: first[g] + j, g, j, bi, nm, imam, fat: g === 0 && !imam, mart: m, label, short, r, ang,
        x: c[0] + Math.sin(ang) * Rr, y: c[1] - Math.cos(ang) * Rr };
      B.kids.push(K); L.kids.push(K);
    });
    L.br.push(B);
  });
  L.kids.sort((p, q) => p.k - q.k);
  // reveal times: each mother's children light up in order across her window
  L.kids.forEach((K) => {
    const a = AT[K.g], b = AT[K.g + 1], n = KIN[K.g][1].length;
    K.t0 = a + .035 + (n > 1 ? K.j / (n - 1) : 0) * Math.max(0, b - a - .065);
  });
  // Karbala threads: the six martyrs and al-Husayn
  L.threads = L.kids.filter((K) => K.mart || (K.imam && K.nm === [...IMAM_KIDS][1])).map((K, i) => {
    const s = [K.x, K.y], e = L.karb;
    const C = K.imam ? [s, [s[0] + (e[0] - s[0]) * .7, s[1] - 130 * U], [e[0] + 20 * U, e[1] - (e[1] - s[1]) * .65], e] : [s, [s[0] + (e[0] - s[0]) * .45, s[1] - 10 * U], [e[0], e[1] - (e[1] - s[1]) * .55], e];
    return { K, i, pts: Array.from({ length: 48 }, (_, q) => bez(C, q / 47)) };
  });
  return L;
}

// ---------- trunk cords: twisting up out of the light; the limbs take over where the trunk fades ----------
const rProf = (s) => 1 + 1.25 * (1 - c01(s / .24)) ** 2.2 - .22 * c01((s - .66) / .34) ** 1.5;
const DARK = [40, 28, 12], GOLD = [208, 152, 66], PALE = [255, 238, 200];
const rgb = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`;
const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
function strands(L) {
  const R = rng(4242), N = L.nar ? 26 : 42;
  return Array.from({ length: N }, (_, i) => ({ th: (i / N) * TAU + (R() - .5) * .5, tw: .5 + R() * .45, wob: R() * 9, rf: .72 + R() * .34, w: .12 + .15 * R() ** 2 }));
}
function strandPt(L, S, s) {
  const th = S.th + S.tw * Math.max(0, s) ** 1.35 * TAU, r = rProf(s) * S.rf * (1 + .08 * Math.sin(s * 9 + S.wob));
  return [L.base[0] + L.hw * r * Math.sin(th), mix(L.base[1], L.fork[1], s), Math.cos(th)];
}
function cordSegs(g, cords, M, wOf, dark, U, br = 1) { // tube-shaded cords, painted back to front
  const segs = []; g.lineCap = 'butt';
  cords.forEach((pts, j) => { for (let i = 1; i <= M; i++) segs.push([j, i, (pts[i][2] + pts[i - 1][2]) / 2]); });
  segs.sort((p, q) => p[2] - q[2]);
  const ln = (a, b, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
  segs.forEach(([j, i, z]) => {
    const a = cords[j][i - 1], b = cords[j][i], lt = (z + 1) / 2, w = wOf(j, i, lt);
    ln(a, b, w, rgb(mixc(dark, GOLD, (.06 + .56 * lt ** 1.6) * br), .97));
    ln(a, b, w * .45, rgb(mixc(GOLD, PALE, lt * .7), (.08 + .5 * lt ** 2) * br));
    ln(a, b, Math.max(.55 * U, w * .12), rgb(PALE, (.05 + .65 * lt ** 3) * br));
  });
}

// ---------- baking ----------
function bakeBg(st) {
  const L = st.L, d = st.d, o = mk(L.W * d, L.WH * d), g = o.getContext('2d'), U = L.U, R = rng(311);
  g.scale(d, d);
  const sk = g.createLinearGradient(0, 0, 0, L.hz);
  sk.addColorStop(0, '#020309'); sk.addColorStop(.45, '#050816'); sk.addColorStop(.85, '#0b1020'); sk.addColorStop(1, '#171b28');
  g.fillStyle = sk; g.fillRect(0, 0, L.W, L.hz + 1);
  const n = L.nar ? 300 : 700;
  for (let i = 0; i < n; i++) {
    const x = R() * L.W, y = R() ** 1.3 * (L.hz - 6), m = R(), a = (.12 + .7 * m ** 3) * (1 - .55 * y / L.hz), s = (.45 + 1.1 * m ** 2) * U;
    g.fillStyle = `rgba(${200 + m * 50 | 0},${210 + m * 35 | 0},255,${a.toFixed(3)})`; g.fillRect(x, y, s, s);
  }
  const star = sprite([[0, 'rgba(230,236,255,.9)'], [.2, 'rgba(200,214,255,.25)'], [1, 'rgba(180,200,255,0)']], 32);
  for (let i = 0; i < (L.nar ? 10 : 22); i++) { const x = R() * L.W, y = R() * L.hz * .7, s = (5 + R() * 7) * U; g.drawImage(star, x - s, y - s, 2 * s, 2 * s); }
  // far ridges and the haze on the horizon
  [['#0c0f18', 26, .45], ['#090b12', 15, .9], ['#06070b', 7, 1.8]].forEach(([col, hgt, fq], q) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, L.hz + 1);
    for (let i = 0; i <= 90; i++) { const x = i / 90 * L.W; g.lineTo(x, L.hz - (2 + hgt * fbm(i * .09 * fq + q * 7, q * 3)) * U); }
    g.lineTo(L.W, L.hz + 1); g.closePath(); g.fill();
  });
  const hzG = g.createLinearGradient(0, L.hz - 46 * U, 0, L.hz + 14 * U);
  hzG.addColorStop(0, 'rgba(110,118,150,0)'); hzG.addColorStop(.78, 'rgba(120,124,150,.08)'); hzG.addColorStop(1, 'rgba(110,118,150,0)');
  g.fillStyle = hzG; g.fillRect(0, L.hz - 46 * U, L.W, 60 * U);
  // the plain
  const pl = g.createLinearGradient(0, L.hz, 0, L.WH);
  pl.addColorStop(0, '#0d0f14'); pl.addColorStop(.25, '#08090c'); pl.addColorStop(1, '#030304');
  g.fillStyle = pl; g.fillRect(0, L.hz, L.W, L.WH - L.hz);
  for (let i = 0; i < (L.nar ? 700 : 1900); i++) {
    const q = R() ** 2.1, y = L.hz + 2 + q * (L.WH - L.hz), x = R() * L.W, len = (2 + 12 * q + R() * 6) * U;
    g.fillStyle = `rgba(150,138,112,${(.02 + R() * .04).toFixed(3)})`; g.fillRect(x, y, len, Math.max(.5, q * 1.5) * U);
  }
  st.bg = o;
}

function bakeHalo(st) { // quarter resolution: the crown's halo, the light column, the pool on the plain
  const L = st.L, q = st.d * .25, o = mk(L.W * q, L.WH * q), g = o.getContext('2d'), [cx, cy, rx, ry] = L.crown;
  g.scale(q, q); g.globalCompositeOperation = 'lighter';
  const rad = (x, y, r, sx, stops) => { g.save(); g.translate(x, y); g.scale(sx, 1); const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); stops.forEach(([s, c]) => gr.addColorStop(s, c)); g.fillStyle = gr; g.fillRect(-r, -r, 2 * r, 2 * r); g.restore(); };
  const big = Math.max(rx, ry) * 1.75;
  rad(cx, cy, big * 1.1, rx / ry > 1.4 ? 1.25 : 1, [[0, 'rgba(255,214,140,.32)'], [.3, 'rgba(240,180,100,.16)'], [.62, 'rgba(170,110,60,.055)'], [1, 'rgba(120,80,50,0)']]);
  rad(cx, cy - ry * .15, Math.max(rx, ry) * 1.05, 1.15, [[0, 'rgba(255,232,180,.16)'], [.5, 'rgba(255,210,140,.06)'], [1, 'rgba(255,200,120,0)']]);
  rad(L.base[0], mix(L.base[1], L.fork[1], .5), (L.base[1] - L.fork[1]) * .9, .55, [[0, 'rgba(255,214,150,.09)'], [1, 'rgba(255,200,120,0)']]);
  rad(L.base[0], L.hz + (L.base[1] - L.hz) * .7, L.W * (L.nar ? .55 : .42), 1, [[0, 'rgba(255,200,120,.0)'], [.01, 'rgba(255,196,120,.1)'], [.5, 'rgba(220,160,90,.035)'], [1, 'rgba(200,140,80,0)']]);
  // dither: the faint gradients band in 8 bits
  const id = g.getImageData(0, 0, o.width, o.height), D = id.data, R = rng(9);
  for (let i = 0; i < D.length; i += 4) if (D[i + 3]) { const n = (R() - .5) * 3; D[i] += n; D[i + 1] += n; D[i + 2] += n; D[i + 3] += (R() - .5) * 3; }
  g.putImageData(id, 0, 0);
  st.halo = o;
}

function bakeRoots(st) {
  const L = st.L, d = st.d, U = L.U, y0 = L.hz - 4, o = mk(L.W * d, (L.WH - y0) * d), g = o.getContext('2d'), R = rng(97);
  g.setTransform(d, 0, 0, d, 0, -y0 * d); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  const [bx, by] = L.base;
  const root = (x, y, a, len, w, depth) => {
    const pts = [[x, y]], steps = 22;
    for (let i = 1; i <= steps; i++) {
      a += (R() - .5) * .32;
      x += Math.sin(a) * len / steps; y += Math.cos(a) * len / steps * .3;
      if (y < L.hz + 2) { y = L.hz + 2; a = Math.sign(a || 1) * Math.min(Math.abs(a), 1.7); }
      pts.push([x, y]);
      if (depth < 2 && i > 4 && i < steps - 3 && R() < .1) root(x, y, a + (R() < .5 ? -1 : 1) * (.5 + R() * .6), len * (.3 + R() * .3), w * .55, depth + 1);
    }
    for (let i = 1; i < pts.length; i++) {
      const f = i / steps, pz = .45 + .9 * c01((pts[i][1] - L.hz) / (by - L.hz + 1e-3)), ww = w * (1 - f) ** .8 * pz;
      g.strokeStyle = `rgba(230,170,80,${(.05 * (1 - f) * pz).toFixed(3)})`; g.lineWidth = ww * 5 + 2 * U;
      g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1]); g.lineTo(pts[i][0], pts[i][1]); g.stroke();
      g.strokeStyle = `rgba(255,214,140,${(.34 * (1 - f) ** 1.3 * pz).toFixed(3)})`; g.lineWidth = Math.max(.5 * U, ww);
      g.stroke();
    }
  };
  const n = L.nar ? 13 : 19;
  for (let i = 0; i < n; i++) {
    const a = mix(-2.5, 2.5, (i + .5) / n) + (R() - .5) * .25, len = (Math.abs(Math.sin(a)) * .9 + .25) * L.W * (L.nar ? .5 : .32) * (.7 + R() * .5);
    root(bx + Math.sin(a) * L.hw * 2.2, by - L.hw * .1, a, len, (2.2 + R() * 1.6) * U, 0);
  }
  st.roots = o; st.rootsY = y0;
}

function bakeTrunk(st) {
  const L = st.L, d = st.d, U = L.U, S0 = st.S0, M = 110;
  const P = S0.map((S) => Array.from({ length: M + 1 }, (_, i) => strandPt(L, S, -.05 + 1.05 * i / M)));
  let x0 = 1e9, x1 = -1e9, y0 = 1e9;
  P.forEach((pts) => pts.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); }));
  const pad = L.hw * .7, y1 = L.base[1] + L.hw * .7;
  x0 -= pad; x1 += pad; y0 -= pad;
  const o = mk((x1 - x0) * d, (y1 - y0) * d), g = o.getContext('2d');
  g.setTransform(d, 0, 0, d, -x0 * d, -y0 * d); g.lineCap = 'round';
  // the body under the cords: the envelope, dark bronze
  const env = Array.from({ length: M + 1 }, (_, i) => { let a = 1e9, b = -1e9; P.forEach((pts) => { a = Math.min(a, pts[i][0]); b = Math.max(b, pts[i][0]); }); return [a + L.hw * .1, b - L.hw * .1, P[0][i][1]]; });
  g.beginPath(); env.forEach(([a, , y], i) => (i ? g.lineTo(a, y) : g.moveTo(a, y))); for (let i = M; i >= 0; i--) g.lineTo(env[i][1], env[i][2]); g.closePath();
  // the body glows: light seen between the cords, brightest low down where the trunk leaves Ali's light
  const bod = g.createLinearGradient(L.base[0] - L.hw * 2.2, 0, L.base[0] + L.hw * 2.2, 0);
  bod.addColorStop(0, '#120c05'); bod.addColorStop(.3, '#4a3212'); bod.addColorStop(.5, '#9a6c2c'); bod.addColorStop(.7, '#4a3212'); bod.addColorStop(1, '#120c05');
  g.fillStyle = bod; g.fill();
  const up = g.createLinearGradient(0, L.base[1], 0, L.fork[1]);
  up.addColorStop(0, 'rgba(255,220,150,.55)'); up.addColorStop(.45, 'rgba(255,200,120,.12)'); up.addColorStop(1, 'rgba(255,200,120,0)');
  g.globalCompositeOperation = 'lighter'; g.fillStyle = up; g.fill(); g.globalCompositeOperation = 'source-over';
  cordSegs(g, P, M, (j, i, lt) => { const s = i / M; return S0[j].w * L.hw * (1 + .5 * (1 - c01(s / .24))) * (.7 + .3 * lt) * (1 - .7 * c01((s - .7) / .3)); }, DARK, U);
  // light from within, strongest low on the trunk where it rises out of the light
  g.globalCompositeOperation = 'lighter';
  const core = g.createLinearGradient(0, L.fork[1], 0, L.base[1]);
  core.addColorStop(0, 'rgba(255,214,150,.03)'); core.addColorStop(1, 'rgba(255,214,150,.16)');
  g.fillStyle = core; g.beginPath(); env.forEach(([a, , y], i) => (i ? g.lineTo(a, y) : g.moveTo(a, y))); for (let i = M; i >= 0; i--) g.lineTo(env[i][1], env[i][2]); g.closePath(); g.fill();
  // sink the foot into the plain and melt the top into the limbs
  g.globalCompositeOperation = 'destination-out';
  const fade = (ya, yb) => { const q = g.createLinearGradient(0, ya, 0, yb); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = q; g.fillRect(x0, Math.min(ya, yb) - (yb < ya ? 400 : 0), x1 - x0, Math.abs(yb - ya) + 400); };
  fade(L.base[1] - L.hw * .45, L.base[1] + L.hw * .35);
  fade(L.fork[1] + L.hw * 1.6, L.fork[1] - L.hw * .1);
  st.trunk = { o, x0, y0, w: x1 - x0, h: y1 - y0 };
}

function bakeBranches(st) {
  const L = st.L, d = st.d, U = L.U, R = rng(777), sc = L.nar ? .72 : 1;
  const dot = sprite([[0, 'rgba(255,246,220,1)'], [.35, 'rgba(255,220,150,.55)'], [1, 'rgba(255,200,120,0)']], 16);
  const blob = sprite([[0, 'rgba(255,206,130,.5)'], [.45, 'rgba(236,170,90,.17)'], [1, 'rgba(220,150,80,0)']], 64);
  const blobF = sprite([[0, 'rgba(255,230,180,.46)'], [.45, 'rgba(255,210,140,.18)'], [1, 'rgba(240,190,120,0)']], 64);
  const [cx, cy, rx, ry] = L.crown;
  L.br.forEach((B) => { B.samp = Array.from({ length: 25 }, (_, i) => bez(B.P, .35 + .65 * i / 24)); });
  const near = (x, y) => { let best = null, bd = 1e18; L.br.forEach((B) => B.samp.forEach(([sx, sy], i) => { const dd = ((x - sx) ** 2 + (y - sy) ** 2) * (1.6 - i / 40); if (dd < bd) { bd = dd; best = B; } })); return best; };
  // keep a clear patch of night round each Imam's light so his ring reads
  const imams = L.kids.filter((K) => K.imam), clear = (x, y) => imams.every((K) => Math.hypot(x - K.x, y - K.y) > K.r * 4.2);
  const trunkZone = (x, y) => y > L.fork[1] - L.hw * 1.3 && Math.abs(x - L.fork[0]) < L.hw * 2.4 + Math.max(0, y - L.fork[1]) * .6;
  const inDome = () => { const a = R() * TAU, rr = Math.sqrt(R()); return [cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr, rr]; };
  L.br.forEach((B) => { B.clumps = []; B.dots = []; B.blobs = []; B.lines = []; });
  // the crown: clumps of leaf-light over the whole dome, clustered by noise, each owned by the nearest limb
  const nC = L.nar ? 150 : 340;
  for (let tries = 0, n = 0; n < nC && tries < nC * 14; tries++) {
    const [x, y, rr] = inDome();
    if (trunkZone(x, y) || fbm(x / (120 * U), y / (120 * U)) < .44) continue;
    near(x, y).clumps.push([x, y, (13 + R() * 24) * U * sc * (1.15 - .3 * rr)]); n++;
  }
  L.br.forEach((B) => {
    const out = [Math.sin(B.a), -Math.cos(B.a)], sz = B.Rr + 34 * U * sc;
    // Fatima's clumps crown her arc from above, so the two Imams stay the brightest points
    const lift = B.fat ? 1.25 : .5;
    for (let i = 0; i < (B.fat ? (L.nar ? 6 : 10) : 7); i++) B.clumps.push([B.c[0] + out[0] * B.Rr * lift + gauss(R) * sz * .5, B.c[1] + out[1] * B.Rr * lift + gauss(R) * sz * .4, (16 + R() * 22) * U * sc]);
  });
  for (let i = 0; i < (L.nar ? 380 : 900); i++) { const [x, y] = inDome(); if (!trunkZone(x, y)) near(x, y).dots.push([x, y, (.4 + R() * .7) * U, .12 + R() * .3]); }
  L.br.forEach((B) => {
    const samp = B.samp, bf = B.fat ? 1.25 : 1;
    B.clumps.forEach(([x, y, rc]) => {
      let bi = 0, bd = 1e18;
      samp.forEach(([sx, sy], i) => { const dd = (sx - x) ** 2 + (sy - y) ** 2; if (dd < bd) { bd = dd; bi = i; } });
      const [sx, sy] = samp[bi];
      B.lines.push([sx, sy, (sx + x) / 2 + (R() - .5) * Math.abs(y - sy) * .4, Math.min(sy, y) - Math.abs(x - sx) * .1, x, y, .8 * U, 0]);
      const n = Math.round(rc / U * (L.nar ? 1.35 : 1.35) * bf);
      for (let i = 0; i < n; i++) B.dots.push([x + gauss(R) * rc * .5, y + gauss(R) * rc * .42, (.45 + R() * 1.15) * U, .3 + R() * .6]);
      B.blobs.push([x, y, rc * 2.1, .5 + R() * .3]);
    });
    B.kids.forEach((K) => {
      const mx = (B.c[0] + K.x) / 2, my = (B.c[1] + K.y) / 2, nx = -(K.y - B.c[1]) * .18, ny = (K.x - B.c[0]) * .18;
      B.lines.push([B.c[0], B.c[1], mx + nx, my + ny, K.x, K.y, 1.4 * U, 1]);
    });
    // the limb: a bundle of cords twisting along the curve, thick at the fork
    const nS = B.fat ? 6 : L.nar ? 3 : 4, lw = L.hw * (B.fat ? .46 : .3), M = 64;
    const cords = Array.from({ length: nS }, (_, j) => {
      const ph = j / nS * TAU + R() * .4, tw = .9 + R() * .6, wf = .8 + R() * .4;
      return Array.from({ length: M + 1 }, (_, i) => {
        const t = i / M, [x, y] = bez(B.P, t), [xa, ya] = bez(B.P, Math.max(0, t - .01)), [xb, yb] = bez(B.P, Math.min(1, t + .01));
        const ll = Math.hypot(xb - xa, yb - ya) || 1, an = ph + t * TAU * tw, w = lw * (1 - .65 * t) * Math.sin(an);
        return [x - (yb - ya) / ll * w, y + (xb - xa) / ll * w, Math.cos(an), lw * .5 * wf * (1 - .62 * t)];
      });
    });
    // bake into the limb's own box
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const grow = (x, y, r) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
    B.dots.forEach(([x, y, s]) => grow(x, y, s * 3)); B.blobs.forEach(([x, y, r]) => grow(x, y, r)); B.lines.forEach(([a, b, , , e, f]) => { grow(a, b, 4); grow(e, f, 4); });
    cords.forEach((pts) => pts.forEach(([x, y, , w]) => grow(x, y, w + 2)));
    x0 = Math.max(x0, -40); x1 = Math.min(x1, L.W + 40); y0 = Math.max(y0, -40);
    const o = mk((x1 - x0) * d, (y1 - y0) * d), g = o.getContext('2d');
    g.setTransform(d, 0, 0, d, -x0 * d, -y0 * d); g.lineCap = 'round'; g.globalCompositeOperation = 'lighter';
    const bs = B.fat ? blobF : blob;
    B.blobs.forEach(([x, y, r, a]) => { g.globalAlpha = .5 * a * (clear(x, y) ? 1 : .5); g.drawImage(bs, x - r, y - r, 2 * r, 2 * r); });
    g.globalAlpha = 1;
    B.lines.forEach(([a, b, mx, my, e, f, w, tw]) => {
      g.strokeStyle = tw ? 'rgba(255,226,160,.55)' : 'rgba(230,176,90,.2)'; g.lineWidth = w;
      g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(mx, my, e, f); g.stroke();
    });
    g.globalCompositeOperation = 'source-over';
    cordSegs(g, cords, M, (j, i, lt) => cords[j][i][3] * (.75 + .25 * lt), [60, 40, 16], U, B.fat ? .95 : .8);
    // the limb comes out of the trunk: no hard start
    g.globalCompositeOperation = 'destination-out';
    { const r = L.hw * .9, q = g.createRadialGradient(B.P[0][0], B.P[0][1], 0, B.P[0][0], B.P[0][1], r); q.addColorStop(0, 'rgba(0,0,0,.95)'); q.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = q; g.fillRect(B.P[0][0] - r, B.P[0][1] - r, 2 * r, 2 * r); }
    g.globalCompositeOperation = 'lighter';
    B.dots.forEach(([x, y, s, a]) => { if (!clear(x, y)) return; g.globalAlpha = Math.min(1, a * bf); const r = s * 2.4; g.drawImage(dot, x - r, y - r, 2 * r, 2 * r); });
    g.globalAlpha = 1;
    let rmax = 0; const [p0x, p0y] = B.P[0];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(([x, y]) => { rmax = Math.max(rmax, Math.hypot(x - p0x, y - p0y)); });
    B.layer = { o, x0, y0, w: x1 - x0, h: y1 - y0, rmax };
    B.ld = Array.from({ length: 41 }, (_, i) => { const [x, y] = bez(B.P, i / 40); return [x, y, Math.hypot(x - p0x, y - p0y)]; });
  });
}

function bake(st) {
  st.L = layout(st.W, st.H);
  st.S0 = strands(st.L);
  bakeBg(st); bakeHalo(st); bakeRoots(st); bakeTrunk(st); bakeBranches(st);
  // falling leaves and motes: they start inside the crown
  const R = rng(55), L = st.L, all = L.br.flatMap((B) => B.dots);
  st.motes = Array.from({ length: L.nar ? 80 : 170 }, () => {
    const [x, y] = all[(R() * all.length) | 0] || L.crown;
    return { x, y, T: 26 + R() * 40, ph: R(), amp: (6 + R() * 22) * L.U, dr: (R() - .5) * 60 * L.U, sz: (R() < .3 ? 4.4 : 1.8) * L.U * (.7 + R() * .6), fl: 1 + R() * 2 };
  });
  // leaves that catch the light now and then
  st.twk = Array.from({ length: L.nar ? 50 : 110 }, () => { const B = L.br[(R() * L.br.length) | 0], q = B.dots[(R() * B.dots.length) | 0] || B.c; return { x: q[0], y: q[1], bi: B.bi, ph: R() * 40, sp: .5 + R() * 1.2 }; });
  st.pulses = Array.from({ length: L.nar ? 16 : 30 }, () => ({ i: (R() * st.S0.length) | 0, sp: .05 + R() * .05, ph: R() }));
}

// ---------- labels: greedy placement with no overlaps ----------
function place(st) {
  const L = st.L, [sx0, sy0, sx1, sy1] = L.safe, boxes = [], pad = L.nar ? 2 : 4;
  const free = (r) => r[0] >= sx0 && r[2] <= sx1 && r[1] >= sy0 && r[3] <= sy1 && !boxes.some((b) => r[0] < b[2] + pad && r[2] + pad > b[0] && r[1] < b[3] + pad && r[3] + pad > b[1]);
  const set = (el, r) => { boxes.push(r); el.style.left = px(r[0]); el.style.top = px(r[1]); el.style.visibility = ''; };
  L.kids.forEach((K) => { const q = K.r * (K.imam ? 2.3 : 1.7); boxes.push([K.x - q, K.y - q, K.x + q, K.y + q]); });
  const around = (x, y, q, w, h, al) => {
    const out = [];
    for (const dd of [0, 5, 12, 22, 36, 54]) for (const da of [0, 30, -30, 60, -60, 90, -90, 120, -120, 150, -150, 180]) {
      const a = (al + da) * Math.PI / 180, sx = Math.sin(a), sy = -Math.cos(a);
      out.push([x + sx * (q + dd * L.U + w / 2), y + sy * (q + dd * L.U + h / 2)]);
    }
    return out;
  };
  const put = (el, cands) => {
    const w = el.offsetWidth, h = el.offsetHeight;
    let best = null;
    for (const [cx, cy] of cands) { const r = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]; if (free(r)) { best = r; break; } }
    if (!best) { const [cx, cy] = cands[0]; best = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]; st.miss = (st.miss || 0) + 1; }
    set(el, best);
  };
  // fixed: Ali under his light, Karbala under its point
  const fix = (el, x, y) => { const w = el.offsetWidth, h = el.offsetHeight; set(el, [x - w / 2, y, x + w / 2, y + h]); };
  st.miss = 0;
  fix(st.aliEl, L.base[0], L.base[1] + 14 * L.U);
  if (st.karbEl) fix(st.karbEl, L.karb[0], L.karb[1] + 10 * L.U);
  const order = L.kids.slice().sort((p, q) => (q.imam - p.imam) || (q.fat - p.fat) || (p.k - q.k));
  order.forEach((K) => {
    const B = L.br[K.bi], al = B.kids.length > 1 ? Math.atan2(K.x - B.c[0], -(K.y - B.c[1])) * 180 / Math.PI : B.a * 180 / Math.PI;
    const w = K.lab.offsetWidth, h = K.lab.offsetHeight;
    put(K.lab, around(K.x, K.y, K.r * (K.imam ? 2.3 : 1.7), w, h, al));
  });
  L.br.forEach((B) => {
    const el = B.moEl, w = el.offsetWidth, h = el.offsetHeight, cands = [];
    [.74, .62, .84, .5, .92, .4].forEach((t) => {
      const [x, y] = bez(B.P, t), [x2, y2] = bez(B.P, t + .02), nrm = Math.atan2(-(y2 - y), -(x2 - x)) * 180 / Math.PI;
      cands.push(...around(x, y, L.hw * .4, w, h, (Math.cos(nrm * Math.PI / 180) < 0 ? nrm + 180 : nrm)).slice(0, 36));
    });
    put(el, cands);
  });
}

// ---------- drawing ----------
const SPR = {};
function sprites(U) {
  SPR.glow = sprite([[0, 'rgba(255,236,190,1)'], [.18, 'rgba(255,210,140,.5)'], [.5, 'rgba(240,170,90,.12)'], [1, 'rgba(220,150,80,0)']]);
  SPR.core = sprite([[0, 'rgba(255,255,248,1)'], [.4, 'rgba(255,244,214,.85)'], [1, 'rgba(255,230,180,0)']], 32);
  SPR.gold = sprite([[0, 'rgba(255,240,190,1)'], [.25, 'rgba(243,200,110,.6)'], [.6, 'rgba(201,150,60,.15)'], [1, 'rgba(180,120,40,0)']]);
  SPR.green = sprite([[0, 'rgba(220,255,236,1)'], [.25, 'rgba(121,201,162,.55)'], [.6, 'rgba(60,140,100,.12)'], [1, 'rgba(46,117,88,0)']]);
  SPR.red = sprite([[0, 'rgba(255,190,150,1)'], [.25, 'rgba(224,71,60,.55)'], [.6, 'rgba(164,50,43,.14)'], [1, 'rgba(120,20,15,0)']]);
  SPR.ali = sprite([[0, 'rgba(255,252,240,1)'], [.08, 'rgba(255,240,200,.9)'], [.25, 'rgba(255,210,140,.35)'], [.6, 'rgba(240,170,90,.08)'], [1, 'rgba(220,150,80,0)']], 256);
  SPR.leaf = sprite([[0, 'rgba(255,236,170,1)'], [.3, 'rgba(250,200,110,.5)'], [1, 'rgba(230,170,80,0)']], 16);
}

S.shajara = {
  init(el, st) {
    st.cv = el.querySelector('canvas.cv');
    st.lay = el.querySelector('.shj-lay');
    st.n = el.querySelector('#shj-n');
    st.cap = el.querySelector('#shj-cap');
    st.aliEl = el.querySelector('.shj-ali');
    st.karbEl = el.querySelector('.shj-karb');
    st.tip = el.querySelector('.shj-tip');
    st.g = null; st.tipK = -1; st.hov = -1;
    // one label per mother's limb, one label and one button per child (built once; only moved on resize)
    const first = []; let n0 = 0;
    KIN.forEach((G, g) => { first[g] = n0; n0 += G[1].length; });
    const proto = layout(1440, 900);
    st.kidEls = []; st.moEls = [];
    proto.br.forEach((B) => {
      const m = document.createElement('b');
      m.className = `shj-mo${B.fat ? ' shj-mo-f' : ''}`; m.setAttribute('aria-hidden', 'true'); m.textContent = B.mo; m.style.visibility = 'hidden';
      st.lay.append(m); st.moEls[B.bi] = m;
    });
    proto.kids.forEach((K) => {
      const lab = document.createElement('b');
      lab.className = `shj-nm${K.imam ? ' imam' : ''}${K.fat ? ' shj-f' : ''}${K.mart ? ' shj-m' : ''}`;
      lab.setAttribute('aria-hidden', 'true'); lab.textContent = K.short; lab.style.visibility = 'hidden';
      const hit = document.createElement('button');
      hit.type = 'button'; hit.className = 'shj-hit'; hit.dataset.i = String(K.k); hit.setAttribute('aria-label', K.label); hit.style.visibility = 'hidden';
      st.lay.append(lab, hit);
      st.kidEls[K.k] = { lab, hit, label: K.label };
    });
    const show = (k) => {
      if (st.tipK === k) return;
      hide();
      st.tipK = k; st.tip.textContent = st.kidEls[k].label; st.tip.hidden = false; st.kidEls[k].lab.classList.add('on');
      st.tipPos = true;
    };
    const hide = () => { if (st.tipK < 0) return; st.kidEls[st.tipK].lab.classList.remove('on'); st.tipK = -1; st.tip.hidden = true; };
    st.hide = hide;
    const hitOf = (e) => e.target.closest?.('.shj-hit');
    st.lay.addEventListener('pointerover', (e) => { const b = hitOf(e); if (b && e.pointerType === 'mouse') show(+b.dataset.i); });
    st.lay.addEventListener('pointerout', (e) => { const b = hitOf(e); if (b && e.pointerType === 'mouse' && !b.contains(e.relatedTarget)) hide(); });
    st.lay.addEventListener('click', (e) => { const b = hitOf(e); if (b) show(+b.dataset.i); });
    st.lay.addEventListener('focusin', (e) => { const b = hitOf(e); if (b && b.matches(':focus-visible')) show(+b.dataset.i); });
    st.lay.addEventListener('focusout', (e) => { if (hitOf(e)) hide(); });
    document.addEventListener('pointerdown', (e) => { if (!e.target.closest?.('.shj-hit')) hide(); }, { passive: true });
    document.fonts?.ready.then(() => { if (st.L) place(st); });
  },

  frame(p, t, el, st) {
    const cv = st.cv;
    const resized = fit(cv);
    const W = cv.clientWidth, H = cv.clientHeight;
    if (resized || !st.L || st.W !== W || st.H !== H) {
      st.W = W; st.H = H; st.d = cv.width / W;
      if (!SPR.glow) sprites();
      bake(st);
      st.L.br.forEach((B) => { B.moEl = st.moEls[B.bi]; });
      st.L.kids.forEach((K) => { K.lab = st.kidEls[K.k].lab; K.hit = st.kidEls[K.k].hit; });
      st.lay.style.setProperty('--u', st.L.U.toFixed(3)); st.lay.classList.toggle('nar', st.L.nar);
      place(st);
      const hs = Math.max(26, Math.min(34, 30 * st.L.U));
      st.L.kids.forEach((K) => { const nd = Math.min(...st.L.kids.filter((q) => q !== K).map((q) => Math.hypot(q.x - K.x, q.y - K.y))), s = Math.min(K.imam ? hs * 1.2 : hs, nd - 2); Object.assign(K.hit.style, { width: px(s), height: px(s), left: px(K.x - s / 2), top: px(K.y - s / 2) }); });
    }
    const L = st.L, c = cv.getContext('2d'), d = st.d, U = L.U;
    // ---- state from p ----
    const off = L.tilt * (1 - ease.io(seg(p, 0, .125)));
    const gRoot = ease.out(seg(p, -.04, .08)), gTrunk = ease.io(seg(p, .012, .118));
    const gb = L.br.map((B) => ease.out(seg(p, ...growOf(B.g))));
    const G = gb.reduce((a, b) => a + b, 0) / gb.length;
    const endK = smooth(seg(p, .8, .845)), dim = 1 - .16 * smooth(seg(p, .82, .88));
    // ---- canvas ----
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    c.setTransform(d, 0, 0, d, 0, -off * d);
    c.drawImage(st.bg, 0, 0, L.W, L.WH);
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = (.18 + .82 * (.25 * gTrunk + .75 * G)) * dim; c.drawImage(st.halo, 0, 0, L.W, L.WH);
    c.globalAlpha = 1;
    if (gRoot > 0) {
      const rw = st.roots.width / d, rh = st.roots.height / d;
      if (gRoot < 1) { c.save(); c.beginPath(); c.ellipse(L.base[0], L.base[1], L.W * 1.1 * gRoot, (L.WH - L.hz) * 1.3 * gRoot, 0, 0, TAU); c.clip(); }
      c.drawImage(st.roots, 0, st.rootsY, rw, rh);
      if (gRoot < 1) c.restore();
    }
    // the trunk rises out of the light
    if (gTrunk > 0) {
      const T = st.trunk, top = mix(L.base[1] + L.hw, T.y0 - 4, gTrunk);
      c.globalCompositeOperation = 'source-over';
      c.save(); c.beginPath(); c.rect(T.x0, top, T.w, T.y0 + T.h - top); c.clip();
      c.drawImage(T.o, T.x0, T.y0, T.w, T.h); c.restore();
      c.globalCompositeOperation = 'lighter';
      if (gTrunk < 1) { const r = L.hw * 2.4; c.globalAlpha = .7; c.drawImage(SPR.glow, L.base[0] - r * 1.4, top - r * .7, r * 2.8, r * 1.4); c.globalAlpha = 1; }
    }
    // limbs and their crowns
    L.br.forEach((B, i) => {
      const k = gb[i]; if (k <= 0) return;
      const Ly = B.layer, a = smooth(c01(k * 1.4)) * dim * (B.fat ? 1 : .92);
      if (k < 1) { c.save(); c.beginPath(); c.arc(B.P[0][0], B.P[0][1], Ly.rmax * (k ** .85) * 1.02, 0, TAU); c.clip(); }
      c.globalAlpha = a; c.drawImage(Ly.o, Ly.x0, Ly.y0, Ly.w, Ly.h);
      if (k < 1) c.restore();
      c.globalAlpha = 1;
      if (k < 1) { const rc = Ly.rmax * (k ** .85) * 1.02, q = B.ld.find((v) => v[2] >= rc) || B.ld[40], r = 30 * U; c.globalAlpha = .9 * (1 - k); c.drawImage(SPR.glow, q[0] - r, q[1] - r, 2 * r, 2 * r); c.globalAlpha = 1; }
    });
    // Ali's light at the root
    {
      const br = 1 + .04 * Math.sin(t * .8), r = (L.nar ? 120 : 170) * U * br;
      c.globalAlpha = .55; c.drawImage(SPR.ali, L.base[0] - r, L.base[1] - r * .5, 2 * r, r);
      const r2 = 30 * U; c.globalAlpha = .85; c.drawImage(SPR.ali, L.base[0] - r2, L.base[1] - r2, 2 * r2, 2 * r2);
      const r3 = 9 * U; c.drawImage(SPR.core, L.base[0] - r3, L.base[1] - r3, 2 * r3, 2 * r3);
    }
    // light rising up the strands
    if (gTrunk > .05) st.pulses.forEach((q) => {
      const u = (t * q.sp + q.ph) % 1, s = u; if (s > gTrunk) return;
      const [x, y, z] = strandPt(L, st.S0[q.i], s), a = Math.sin(u * Math.PI) * (.35 + .45 * Math.max(0, z)), r = 9 * U;
      c.globalAlpha = a; c.drawImage(SPR.gold, x - r, y - r, 2 * r, 2 * r);
    });
    c.globalAlpha = 1;
    // the children
    L.kids.forEach((K) => {
      const kb = c01((p - K.t0) / .012); if (kb <= 0) return;
      const s = ease.out(kb), r = K.r, hv = st.tipK === K.k;
      const spr = K.imam ? SPR.gold : K.fat ? SPR.green : SPR.glow;
      const gr = r * (K.imam ? 6.5 : K.fat ? 6 : 5.5) * s;
      c.globalAlpha = (K.imam ? .95 : .75) * (hv ? 1.3 : 1); c.drawImage(spr, K.x - gr, K.y - gr, 2 * gr, 2 * gr);
      const cr = r * 1.5 * s; c.globalAlpha = 1; c.drawImage(SPR.core, K.x - cr, K.y - cr, 2 * cr, 2 * cr);
      c.lineWidth = 1.2 * U;
      if (K.imam) {
        const sh = .75 + .25 * Math.sin(t * 1.3 + K.j);
        c.globalCompositeOperation = 'source-over'; c.lineWidth = 4 * U; c.strokeStyle = `rgba(20,12,4,${(.55 * s).toFixed(3)})`; c.beginPath(); c.arc(K.x, K.y, r * 2.15, 0, TAU); c.stroke(); c.globalCompositeOperation = 'lighter';
        c.lineWidth = 1.7 * U; c.strokeStyle = `rgba(243,217,143,${(.95 * s * sh).toFixed(3)})`; c.beginPath(); c.arc(K.x, K.y, r * 2.15, 0, TAU); c.stroke(); c.lineWidth = 1.2 * U;
        c.strokeStyle = `rgba(243,217,143,${(.3 * s).toFixed(3)})`; c.beginPath(); c.arc(K.x, K.y, r * 3.1, 0, TAU); c.stroke();
      }
      if (K.mart) {
        const mk2 = (.3 + .7 * endK) * s;
        c.strokeStyle = `rgba(232,86,70,${(.95 * mk2).toFixed(3)})`; c.lineWidth = 1.6 * U; c.beginPath(); c.arc(K.x, K.y, r * 2.3, 0, TAU); c.stroke();
        if (endK > 0) { const rr = r * 7; c.globalAlpha = .6 * endK; c.drawImage(SPR.red, K.x - rr, K.y - rr, 2 * rr, 2 * rr); c.globalAlpha = 1; }
      }
      if (hv) { c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.4 * U; c.beginPath(); c.arc(K.x, K.y, r * (K.imam ? 3.6 : 2.9), 0, TAU); c.stroke(); }
    });
    c.globalAlpha = 1;
    // to Karbala
    const kl = smooth(seg(p, .84, .9));
    if (kl > 0) { const r = 60 * U; c.globalAlpha = kl * .8; c.drawImage(SPR.red, L.karb[0] - r, L.karb[1] - r * .5, 2 * r, r); const r2 = 10 * U; c.globalAlpha = kl; c.drawImage(SPR.core, L.karb[0] - r2, L.karb[1] - r2, 2 * r2, 2 * r2); c.globalAlpha = 1; }
    L.threads.forEach((th) => {
      const f = ease.io(seg(p, .83 + th.i * .007, .895 + th.i * .007)); if (f <= 0) return;
      const n = th.pts.length - 1, e = f * n, i1 = Math.floor(e), fr = e - i1, pts = th.pts;
      const gold = th.K.imam;
      [[4.5 * U, gold ? 'rgba(243,190,110,.16)' : 'rgba(224,71,60,.2)'], [1.3 * U, gold ? 'rgba(255,230,170,.85)' : 'rgba(255,170,140,.8)']].forEach(([w, col]) => {
        c.lineWidth = w; c.strokeStyle = col; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i <= i1; i++) c.lineTo(pts[i][0], pts[i][1]);
        if (i1 < n) c.lineTo(mix(pts[i1][0], pts[i1 + 1][0], fr), mix(pts[i1][1], pts[i1 + 1][1], fr));
        c.stroke();
      });
      if (f < 1) { const q = pts[Math.min(n, i1 + 1)], r = 14 * U; c.drawImage(SPR.red, q[0] - r, q[1] - r, 2 * r, 2 * r); }
      else for (let m = 0; m < 3; m++) { const u = (t * .09 + m / 3 + th.i * .13) % 1, q = pts[Math.floor(u * n)], r = 7 * U; c.globalAlpha = Math.sin(u * Math.PI); c.drawImage(gold ? SPR.gold : SPR.red, q[0] - r, q[1] - r, 2 * r, 2 * r); }
      c.globalAlpha = 1;
    });
    st.twk.forEach((w) => {
      const a = Math.max(0, Math.sin(t * w.sp + w.ph)) ** 8 * c01(gb[w.bi] * 2 - 1) * dim; if (a < .02) return;
      const r = 7 * U; c.globalAlpha = a; c.drawImage(SPR.leaf, w.x - r, w.y - r, 2 * r, 2 * r); const r2 = 2.2 * U; c.drawImage(SPR.core, w.x - r2, w.y - r2, 2 * r2, 2 * r2);
    });
    // leaves and motes drifting down
    if (G > 0) st.motes.forEach((m) => {
      const u = (t / m.T + m.ph) % 1, y = m.y + u * (L.hz + 30 * U - m.y), x = m.x + Math.sin(t * .35 + m.ph * 17) * m.amp + u * m.dr;
      const a = Math.sin(u * Math.PI) * (.35 + .65 * Math.abs(Math.sin(t * m.fl + m.ph * 40))) * G, r = m.sz * 2.2;
      c.globalAlpha = a; c.drawImage(SPR.leaf, x - r, y - r, 2 * r, 2 * r);
    });
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // ---- DOM ----
    st.lay.style.transform = off > .5 ? `translate3d(0,${(-off).toFixed(1)}px,0)` : '';
    const op = (e, v) => { const s = v >= .999 ? '1' : v <= .001 ? '0' : v.toFixed(3); if (e.style.opacity !== s) e.style.opacity = s; };
    op(st.aliEl, smooth(seg(p, -.02, .04)));
    if (st.karbEl) op(st.karbEl, kl);
    L.br.forEach((B, i) => op(B.moEl, smooth(c01((gb[i] - .5) * 2.5))));
    let cnt = 0;
    L.kids.forEach((K) => {
      const v = smooth(seg(p, K.t0 + .006, K.t0 + .02));
      if (p >= K.t0) cnt++;
      op(K.lab, v);
      const on = v > .5;
      if (K.on !== on) { K.on = on; K.hit.style.visibility = on ? '' : 'hidden'; if (!on && st.tipK === K.k) st.hide(); }
    });
    setText(st.n, arNum(cnt));
    if (st.tipK >= 0 && st.tipPos !== false) {
      const K = L.kids.find((q) => q.k === st.tipK), tp = st.tip, w = tp.offsetWidth, h = tp.offsetHeight;
      const x = Math.max(w / 2 + 6, Math.min(L.W - w / 2 - 6, K.x)), above = K.y - K.r * 3 - h - 6 > off + 8;
      tp.style.left = px(x - w / 2); tp.style.top = px(above ? K.y - K.r * 3 - h - 6 : K.y + K.r * 3 + 6);
      st.tipPos = false;
    }
    // ---- caption: one mother at a time ----
    let g = AT.findIndex((a, i) => p >= a && p < (AT[i + 1] ?? 2));
    if (g < 0 || g >= KIN.length) g = p < AT[0] ? -1 : KIN.length;
    if (st.g === g) return;
    st.g = g;
    if (g < 0 || g >= KIN.length) { st.cap.innerHTML = ''; st.cap.classList.add('empty'); return; }
    st.cap.classList.remove('empty');
    const [mo, kids, note, , more] = KIN[g];
    const names = kids.map((nm) => (g === 0 && IMAM_KIDS.has(nm) ? `<span class="imam">الإمام ${nm} عليه السلام</span>` : nm)).join('، ');
    st.cap.innerHTML = `<p class="kick">أمّهم</p><p class="shj-cm">${mo}</p><p class="shj-kids">${names}</p>${note ? `<p class="cap shj-note">${note}</p>` : ''}${more.map(([tx, sr]) => `<p class="cap shj-more">${tx} <span class="src">${sr}</span></p>`).join('')}`;
  },
};
})();
