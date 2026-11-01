// Ali Life: the main session's scenes. Static builds first (they add data-fx before app.js collects layers),
// then the canvas scenes: cover, kaaba, freed, rush, jamal.
(() => {
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, css) => { const e = document.createElement(tag); if (cls) e.className = cls; if (css) e.style.cssText = css; return e; };
const f4 = (v) => v.toFixed(4);

// ---------- static builds ----------

// Childhood: a grown man's footprints cross the sand; then a child's prints land inside them, step for step.
(() => {
  const box = $('#prints');
  if (!box) return;
  const N = 16;
  for (let i = 0; i < N; i++) {
    const k = i / (N - 1);
    const x = 92 - k * 84;                       // right to left
    const y = 64 + Math.sin(k * 5.2) * 7 + (i % 2 ? 3.2 : -3.2);
    const rot = -90 - Math.cos(k * 5.2) * 18;
    const side = i % 2 ? ' fp-l' : '';   // walking leftwards: left foot on the lower side of the track
    const m = el('i', `fp fp-m${side}`, `left:${x}vw;top:${y}vh;--r:${rot}deg`);
    const a = .03 + k * .38;
    m.dataset.fx = `o 0 1 ${f4(a)} ${f4(a + .03)}`;
    const c = el('i', `fp fp-c${side}`, `left:${x}vw;top:${y}vh;--r:${rot}deg`);
    const b = .5 + k * .38;
    c.dataset.fx = `o 0 1 ${f4(b)} ${f4(b + .025)} | s 1.6 1 ${f4(b)} ${f4(b + .04)} out`;
    const g = el('i', 'fp fp-g', `left:${x}vw;top:${y}vh;--r:${rot}deg`);
    g.dataset.fx = `o 0 1 ${f4(b)} ${f4(b + .02)} | o 1 .25 ${f4(b + .03)} ${f4(b + .12)}`;
    box.append(m, g, c);
  }
})();

// Yawm al-Dar: forty of the clan around the host's light. Asked three times; one, the youngest, stands.
(() => {
  const box = $('#clan');
  if (!box) return;
  const rnd = rng(7);
  const ALI = 31;
  const pos = [];
  for (let i = 0; i < 40; i++) {
    const row = i < 22 ? 0 : 1;
    const j = row ? i - 22 : i;
    const n = row ? 18 : 22;
    const ang = Math.PI * (.12 + .76 * (j + .5) / n);
    const rx = row ? 30 : 40, ry = row ? 22 : 31;
    pos.push([50 + Math.cos(ang) * rx + (rnd() - .5) * 1.2, 36 + Math.sin(ang) * ry + (rnd() - .5) * 1.2]);
  }
  pos.forEach(([x, y], i) => {
    const d = el('i', i === ALI ? 'cl cl-ali' : 'cl', `left:${x}vw;top:${y}vh`);
    if (i === ALI) {
      const dx = 54.5 - x, dy = 27 - y;
      d.dataset.fx = ['y 0vh -3.2vh .44 .47 out', 'y -3.2vh 0vh .5 .53', 'y 0vh -3.2vh .58 .61 out', 'y -3.2vh 0vh .63 .66',
        'y 0vh -3.2vh .72 .75 out', `y -3.2vh ${dy}vh .86 .92 io`, `x 0vw ${dx}vw .86 .92 io`, 's 1 1.7 .44 .47', 's 1.7 1.2 .5 .53', 's 1.2 1.8 .58 .61', 's 1.8 1.2 .63 .66', 's 1.2 2 .72 .75'].join(' | ');
    } else {
      d.dataset.fx = `o .9 .3 .4 .44 | o .3 .9 .84 .9 | x 0vw ${f4((rnd() - .5) * .8)}vw .36 .9`;
    }
    box.append(d);
  });
})();

// Brotherhood: companions pair off two by two; the last two lights meet in the middle.
(() => {
  const box = $('#pairfield');
  if (!box) return;
  const rnd = rng(11);
  for (let k = 0; k < 17; k++) {
    const mx = 12 + rnd() * 76, my = 16 + rnd() * 70;
    const ang = rnd() * Math.PI;
    const ox = Math.cos(ang) * 1.6, oy = Math.sin(ang) * 2.6;
    const a = .08 + rnd() * .14;
    [[1, 1], [-1, -1]].forEach(([sx, sy]) => {
      const fx = mx + ox * sx, fy = my + oy * sy;
      const d = el('i', 'pd', `left:${f4(fx)}vw;top:${f4(fy)}vh`);
      d.dataset.fx = `x ${f4((rnd() - .5) * 40)}vw 0vw ${f4(a)} ${f4(a + .2)} io | y ${f4((rnd() - .5) * 40)}vh 0vh ${f4(a)} ${f4(a + .2)} io | o .9 .35 .5 .58`;
      box.append(d);
    });
    const ln = el('i', 'pl', `left:${f4(mx)}vw;top:${f4(my)}vh;--a:${f4(ang + Math.atan2(oy, ox) - ang)}rad`);
    ln.dataset.fx = `o 0 .7 ${f4(a + .2)} ${f4(a + .25)} | o .7 .2 .5 .58`;
    box.append(ln);
  }
  const p1 = el('i', 'pd pd-big', 'left:53vw;top:48vh'); p1.dataset.fx = 'x 30vw 0vw .3 .62 io';
  const p2 = el('i', 'pd pd-ali', 'left:47vw;top:48vh'); p2.dataset.fx = 'x -30vw 0vw .3 .62 io';
  const lk = el('i', 'pl pl-gold', 'left:50vw;top:48vh;--a:0rad'); lk.dataset.fx = 'o 0 1 .6 .66 | sx 0 1 .6 .68 out';
  box.append(lk, p1, p2);
})();

// Badr: seventy marks, one for each of the dead; the ones al-Mufid counts for Ali take the gold.
(() => {
  const box = $('#tally');
  if (!box) return;
  const gold = +(box.dataset.gold || 36);
  const rnd = rng(3);
  const order = [...Array(70).keys()].sort(() => rnd() - .5);
  const isGold = new Set(order.slice(0, gold));
  let gi = 0;
  for (let i = 0; i < 70; i++) {
    const m = el('i', 'tm', `--tilt:${f4((rnd() - .5) * 10)}deg`);
    const a = .06 + (i / 70) * .26;
    m.dataset.fx = `o 0 1 ${f4(a)} ${f4(a + .01)} | y -14px 0px ${f4(a)} ${f4(a + .02)} out`;
    if (isGold.has(i)) {
      const g = el('b', 'tg');
      const b = .38 + (gi++ / gold) * .3;
      g.dataset.fx = `o 0 1 ${f4(b)} ${f4(b + .012)}`;
      m.append(g);
    }
    box.append(m);
  }
})();

// Uhud: the ranks break and scatter; one light stays beside the Prophet's.
(() => {
  const box = $('#flee');
  if (!box) return;
  const rnd = rng(5);
  for (let i = 0; i < 90; i++) {
    const ang = rnd() * TAU, r = 6 + rnd() * 14;
    const x = 50 + Math.cos(ang) * r * 1.1, y = 50 + Math.sin(ang) * r;
    const d = el('i', 'fd', `left:${f4(x)}vw;top:${f4(y)}vh`);
    const far = 30 + rnd() * 50;
    const a = .08 + rnd() * .12;
    d.dataset.fx = `x 0vw ${f4(Math.cos(ang) * far)}vw ${f4(a)} ${f4(a + .16)} in | y 0vh ${f4(Math.sin(ang) * far * .7)}vh ${f4(a)} ${f4(a + .16)} in | o .85 0 ${f4(a + .08)} ${f4(a + .18)}`;
    box.append(d);
  }
  const ali = el('i', 'fd fd-ali', 'left:53.2vw;top:50vh');
  ali.dataset.fx = 's 1 1.6 .2 .3 | o 1 .25 .5 .56';
  box.append(ali);
  box.querySelector('.host-light').dataset.fx = 'o 1 .25 .5 .56';
})();

// The patience: birds rise toward the peak and fall back short of it.
(() => {
  const box = $('#birds');
  if (!box) return;
  const rnd = rng(9);
  for (let i = 0; i < 9; i++) {
    const x = 40 + rnd() * 22, top = 34 + rnd() * 12;
    const b = el('i', 'bd', `left:${f4(x)}vw;top:${f4(78 + rnd() * 10)}vh`);
    const a = .58 + rnd() * .1;
    b.dataset.fx = `o 0 1 ${f4(a)} ${f4(a + .02)} | y 0vh ${f4(-(78 - top - 18))}vh ${f4(a)} ${f4(a + .1)} out | y ${f4(-(78 - top - 18))}vh 6vh ${f4(a + .1)} ${f4(a + .18)} in | o 1 0 ${f4(a + .14)} ${f4(a + .18)}`;
    box.append(b);
  }
})();

// Nahrawan: two rows of ten places. Each fills toward ten and stops short of it; the tenth stays empty.
// No count is printed: the sources give only the prophecy, «fewer than ten», not the numbers.
(() => {
  ['#slots-a', '#slots-b'].forEach((id, r) => {
    const row = $(id);
    if (!row) return;
    const wrap = el('div', 'slot-cells');
    for (let i = 0; i < 10; i++) {
      const c = el('i', i < 9 ? 'sc' : 'sc sc-empty');
      const a = .22 + r * .2 + i * .016;
      c.dataset.fx = i < 9 ? `o .12 ${f4(1 - i * .07)} ${f4(a)} ${f4(a + .02)} | s .4 1 ${f4(a)} ${f4(a + .03)} out` : `o .12 1 ${f4(.62 + r * .04)} ${f4(.66 + r * .04)}`;
      wrap.append(c);
    }
    const num = el('b', 'slot-n');
    num.textContent = 'دون العشرة';
    num.dataset.fx = `o 0 1 ${f4(.38 + r * .2)} ${f4(.42 + r * .2)}`;
    row.append(wrap, num);
  });
})();

// Wisdom: the short sayings fly at the reader out of the dark, one after another.
(() => {
  const box = $('#hk-fly');
  const grid = $('#hk-grid');
  if (!box || !grid) return;
  const items = [...grid.children].slice(0, 16);
  const rnd = rng(21);
  const n = items.length;
  items.forEach((li, i) => {
    const c = el('div', 'hk-c');
    c.innerHTML = li.innerHTML;
    const x = (rnd() - .5) * 46, y = (rnd() - .5) * 40;
    c.style.cssText = `left:calc(50% + ${f4(x)}vw);top:calc(50% + ${f4(y)}vh)`;
    const a = .1 + (i / n) * .78, d = .16;
    c.dataset.fx = `s .2 2.6 ${f4(a)} ${f4(a + d)} in | o 0 1 ${f4(a)} ${f4(a + d * .3)} | o 1 0 ${f4(a + d * .72)} ${f4(a + d)} | x ${f4(-x * .2)}vw ${f4(x * 1.4)}vw ${f4(a)} ${f4(a + d)} in | y ${f4(-y * .2)}vh ${f4(y * 1.4)}vh ${f4(a)} ${f4(a + d)} in`;
    box.append(c);
  });
})();

// Letter 31: the father's epithets on one side, the son's on the other, one by one.
(() => {
  const stagger = (sel, a, b) => {
    const items = [...document.querySelectorAll(`${sel} li:not(.lt-h)`)];
    items.forEach((li, i) => {
      const s = a + (b - a) * (i / items.length);
      li.dataset.fx = `o 0 1 ${f4(s)} ${f4(s + .03)} | y 14px 0px ${f4(s)} ${f4(s + .04)} out`;
    });
  };
  stagger('.lt-from', .04, .28);
  stagger('.lt-to', .3, .62);
})();

// The Imams: a hero name per Imam on one side, the chain on the other, and «the book and the weapon»
// travelling down it. Years and resting places as al-Kafi / al-Irshad give them.
const IMAMS = [ // name, title, when he passed (al-Kafi), age, resting place
  ['عليّ بن أبي طالب', 'أمير المؤمنين', '٢١ رمضان ٤٠ هـ', 'ثلاث وستين سنة', 'الغريّ، النجف'],
  ['الحسن بن عليّ', 'المجتبى', 'آخر صفر ٤٩ هـ', 'سبع وأربعين سنة وأشهر', 'البقيع، المدينة'],
  ['الحسين بن عليّ', 'سيّد الشهداء', '١٠ محرّم ٦١ هـ', 'سبع وخمسين سنة وأشهر', 'كربلاء'],
  ['عليّ بن الحسين', 'زين العابدين، السجّاد', '٩٥ هـ', 'سبع وخمسين سنة', 'البقيع، المدينة'],
  ['محمد بن عليّ', 'الباقر', '١١٤ هـ', 'سبع وخمسين سنة', 'البقيع، المدينة'],
  ['جعفر بن محمد', 'الصادق', 'شوّال ١٤٨ هـ', 'خمس وستين سنة', 'البقيع، المدينة'],
  ['موسى بن جعفر', 'الكاظم', '٦ رجب ١٨٣ هـ', 'أربع أو خمس وخمسين سنة', 'مقابر قريش، بغداد'],
  ['عليّ بن موسى', 'الرضا', 'صفر ٢٠٣ هـ', 'خمس وخمسين سنة', 'طوس، سناباد'],
  ['محمد بن عليّ', 'الجواد', 'آخر ذي القعدة ٢٢٠ هـ', 'خمس وعشرين سنة', 'مقابر قريش، عند جدّه موسى'],
  ['عليّ بن محمد', 'الهادي', '٢٦ جمادى الآخرة ٢٥٤ هـ', 'إحدى وأربعين سنة ونصف', 'سُرّ من رأى، في داره'],
  ['الحسن بن عليّ', 'العسكري', '٨ ربيع الأوّل ٢٦٠ هـ', 'ثمان وعشرين سنة', 'سُرّ من رأى، بجنب أبيه'],
  ['محمد بن الحسن', 'المهديّ المنتظر، عجّل الله فرجه', 'وُلد للنصف من شعبان ٢٥٥ هـ', '', '«وله قبل قيامه غيبتان»'],
];
(() => {
  const chain = $('#ln-chain'), hero = $('#ln-hero'), token = $('#ln-token');
  if (!chain) return;
  const N = IMAMS.length, at = (i) => .05 + i * .072, narrow = innerWidth <= 640, rowH = narrow ? 4.6 : 6.2, top0 = narrow ? 40 : 12;
  IMAMS.forEach(([nm, tl, yr, age, pl], i) => {
    const a = at(i), b = i < N - 1 ? at(i + 1) : 1.2;
    const li = el('li', i === N - 1 ? 'ln-last' : '');
    li.innerHTML = `<b>${arNum(i + 1)}</b><span class="ln-nm">${nm}</span><span class="ln-dt">${i === N - 1 ? '٢٥٥ هـ' : yr.replace(/^.* (?=\S+ هـ$)/, '')}، ${pl.split('،')[0].replace('«وله قبل قيامه غيبتان»', 'الغيبة')}</span>`;
    li.dataset.fx = `o .3 1 ${f4(a - .01)} ${f4(a + .01)} | o 1 .62 ${f4(b - .01)} ${f4(b + .01)}`;
    li.lastChild.dataset.fx = `o 0 1 ${f4(a)} ${f4(a + .02)}`;
    chain.append(li);
    const h = el('div', 'ln-h');
    h.innerHTML = `<p class="ln-hn">${nm}</p><p class="ln-ht">${tl}</p><p class="ln-hd">${i === N - 1 ? yr : `مضى ${yr}، عن ${age}`}</p><p class="ln-hp">${pl}</p>`;
    h.dataset.fx = `o 0 1 ${f4(a - .012)} ${f4(a + .012)} | y 3vh 0vh ${f4(a - .012)} ${f4(a + .02)} out${i < N - 1 ? ` | o 1 0 ${f4(b - .02)} ${f4(b - .004)}` : ''}`;
    hero.append(h);
  });
  // an emblem for each Imam travels down the chain beside his name
  const EMB = [
    ['ذو الفقار', '<path class="ef" d="M52 12 C 46 30, 32 42, 10 48 L 17 42 L 6 45 C 28 38, 42 26, 48 10 Z"/><path d="M47 9 L56 17 M52 13 L59 6"/>'],
    ['الصلح', '<path d="M14 16 H46 a6 6 0 0 1 0 12 H18 a6 6 0 0 0 0 12 H50"/><path d="M20 22 H40 M22 34 H44"/><circle class="ef" cx="44" cy="47" r="6"/>'],
    ['راية كربلاء', '<path d="M18 58 V6"/><path class="ef-red" d="M18 8 C 30 4, 38 14, 52 10 V30 C 38 34, 30 24, 18 28 Z"/>'],
    ['المحراب', '<path d="M14 56 V30 C14 16, 32 6, 32 6 C32 6, 50 16, 50 30 V56"/><path d="M22 56 V34 C22 24, 32 16, 32 16 C32 16, 42 24, 42 34 V56"/><path d="M10 56 H54"/>'],
    ['باقر العلم', '<path class="ef" d="M8 46 C 20 40, 28 42, 32 48 C 36 42, 44 40, 56 46 V26 C 44 20, 36 22, 32 28 C 28 22, 20 20, 8 26 Z"/><path d="M32 28 V48 M32 20 V6 M25 18 L20 8 M39 18 L44 8"/>'],
    ['سراج العلم', '<path class="ef" d="M8 44 C 12 52, 38 52, 44 44 L 56 40 L 44 37 C 38 31, 14 31, 8 44 Z"/><path class="ef-fire" d="M54 35 C 51 28, 58 24, 56 16 C 63 24, 61 31, 57 35 Z"/>'],
    ['السجن', '<rect x="14" y="10" width="36" height="44" rx="3"/><path d="M23 10 V54 M32 10 V54 M41 10 V54 M14 32 H50"/>'],
    ['طوس', '<path d="M10 56 H54 M18 56 V42 H46 V56"/><path class="ef" d="M20 42 C 17 28, 30 22, 32 12 C 34 22, 47 28, 44 42 Z"/><path d="M32 12 V5"/>'],
    ['الجود', '<path d="M18 46 C 12 40, 12 30, 18 28 V18 a3 3 0 0 1 6 0 V28 V14 a3 3 0 0 1 6 0 V28 V16 a3 3 0 0 1 6 0 V30 L 39 25 a3 3 0 0 1 5 3 L 39 42 C 35 50, 25 52, 18 46 Z"/><circle class="ef" cx="46" cy="12" r="5"/>'],
    ['ملويّة سامرّاء', '<path d="M18 56 H46 L42 44 H22 Z M24 44 L27 32 H37 L40 44 M28 32 L30 20 H34 L36 32 M30 20 L31 10 H33 L34 20"/><path d="M32 10 V5"/>'],
    ['العسكر', '<path d="M22 56 L26 22 H38 L42 56 Z"/><path d="M22 22 H42 V15 H22 Z M24 15 V10 M32 15 V10 M40 15 V10"/><rect class="ef" x="29" y="30" width="6" height="8"/>'],
    ['الفجر المنتظر', '<path d="M6 46 H58"/><path class="ef" d="M17 46 A15 15 0 0 1 47 46 Z"/><path d="M32 24 V14 M19 31 L12 24 M45 31 L52 24"/>'],
  ];
  EMB.forEach(([lb, ic], i) => {
    const a = at(i), b = i < N - 1 ? at(i + 1) : 1.2;
    const em = el('span', 'em');
    em.innerHTML = `<svg viewBox="0 0 64 64">${ic}</svg><b>${lb}</b>`;
    em.dataset.fx = `o 0 1 ${f4(a - .02)} ${f4(a)}${i < N - 1 ? ` | o 1 0 ${f4(b - .03)} ${f4(b - .015)}` : ''}`;
    token.append(em);
  });
  // the emblem steps from row to row (vh), arriving at each Imam's window
  const tracks = [];
  for (let i = 1; i < N; i++) tracks.push(`y ${f4((i - 1) * rowH)}vh ${f4(i * rowH)}vh ${f4(at(i) - .03)} ${f4(at(i) - .005)} io`);
  token.style.top = `${top0}vh`;
  token.dataset.fx = tracks.join(' | ');
})();

// His children: a constellation around his light, group by group under each mother; at the end the six who
// fell with al-Husayn travel down to Karbala.
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
const KIN_AT = [.04, .15, .23, .31, .46, .56, .62, .68, .8];
// The tree: Ali is the trunk; each mother a branch; her children its fruit. The two Imams, al-Hasan and
// al-Husayn, are gold fruit with a halo. Branches grow with the scroll; the six who fell at Karbala get a red
// halo at the end. Every fruit names itself on hover (SVG <title>) and in the side panel.
const IMAM_KIDS = new Set(['الحسن', 'الحسين']);
const BR = [ // branch per KIN group: start, control 1, control 2, end (viewBox 1000 x 720)
  [[500, 470], [500, 380], [500, 250], [500, 70]],
  [[503, 420], [600, 360], [660, 240], [705, 165]],
  [[497, 420], [400, 360], [340, 240], [295, 165]],
  [[505, 450], [640, 430], [760, 360], [855, 280]],
  [[495, 450], [360, 430], [240, 360], [145, 280]],
  [[508, 505], [640, 525], [760, 475], [875, 425]],
  [[492, 505], [360, 525], [240, 475], [125, 425]],
  [[510, 565], [650, 605], [800, 585], [955, 545]],
  [[490, 565], [350, 605], [200, 585], [45, 545]],
];
const bez = ([a, b, c, d], t) => { const m = 1 - t; return [a[0] * m * m * m + 3 * b[0] * m * m * t + 3 * c[0] * m * t * t + d[0] * t * t * t, a[1] * m * m * m + 3 * b[1] * m * m * t + 3 * c[1] * m * t * t + d[1] * t * t * t]; };
const bezN = (B, t) => { const [x0, y0] = bez(B, Math.max(0, t - .01)), [x1, y1] = bez(B, Math.min(1, t + .01)); const l = Math.hypot(x1 - x0, y1 - y0) || 1; return [-(y1 - y0) / l, (x1 - x0) / l]; };
S.kin = {
  init(host, st) {
    st.n = $('#kin-n', host); st.cap = $('#kin-cap', host);
    st.order = [];
    const f = (v) => v.toFixed(1);
    let svg = `<svg class="tree-svg" viewBox="0 0 1000 720" preserveAspectRatio="xMidYMax meet" role="img" aria-label="شجرة أبناء أمير المؤمنين عليه السلام">
      <defs><radialGradient id="tr-crown" cx="50%" cy="20%" r="60%"><stop offset="0" stop-color="#f3d98f" stop-opacity=".28"/><stop offset="1" stop-color="#f3d98f" stop-opacity="0"/></radialGradient>
      <linearGradient id="tr-bark" x1="0" x2="1"><stop offset="0" stop-color="#5a4320"/><stop offset=".5" stop-color="#c9a54e"/><stop offset="1" stop-color="#5a4320"/></linearGradient></defs>
      <path class="tr-trunk" d="M462 718 C 478 640, 486 560, 488 470 L 512 470 C 514 560, 522 640, 538 718 Z" data-fx="o 0 1 .0 .06"/>
      <path class="tr-root" pathLength="1" d="M470 716 C 440 712, 410 716, 380 712 M530 716 C 560 712, 590 716, 620 712" data-fx="dash 1 0 .0 .06"/>
      <g class="tr-ali" data-fx="o 0 1 .0 .05"><circle cx="500" cy="690" r="30" class="tr-ali-glow"/><text x="500" y="676" class="tr-ali-t">عليّ عليه السلام</text></g>`;
    let fruits = '', labels = '';
    let bi = 0, mi = 0;
    KIN.forEach(([mo, kids, , mart], g) => {
      const a = KIN_AT[g], b = KIN_AT[g + 1];
      const parts = g === KIN.length - 1 ? [kids.slice(0, 6), kids.slice(6)] : [kids];
      let k0 = 0;
      parts.forEach((list) => {
        const B = BR[bi++];
        const d = `M${B[0]} C${B[1]} ${B[2]} ${B[3]}`;
        svg += `<path class="tr-br" pathLength="1" d="${d}" data-fx="dash 1 0 ${f4(a)} ${f4(a + .05)}"/>`;
        for (let q = 0; q < 3; q++) { // a few leaves along the branch
          const t = .35 + q * .25, [x, y] = bez(B, t), [nx, ny] = bezN(B, t), sd = q % 2 ? 1 : -1;
          svg += `<ellipse class="tr-leaf" cx="${f(x + nx * 14 * sd)}" cy="${f(y + ny * 14 * sd)}" rx="13" ry="5.5" transform="rotate(${f(Math.atan2(ny, nx) * 57.3 + 40 * sd)} ${f(x + nx * 14 * sd)} ${f(y + ny * 14 * sd)})" data-fx="o 0 .85 ${f4(a + .03)} ${f4(a + .06)}"/>`;
        }
        // the mother's name sits beyond the branch tip (the shared "others" branches: under the branch)
        const [ex, ey] = bez(B, 1), [px, py] = bez(B, .97), tl = Math.hypot(ex - px, ey - py) || 1, tx = (ex - px) / tl, ty = (ey - py) / tl;
        const shared = g === KIN.length - 1;
        const [mx, my] = shared ? bez(B, .55) : [ex + tx * 14, ey + ty * 14 - (Math.abs(tx) < .3 ? 10 : -5)];
        const manchor = shared || Math.abs(tx) < .3 ? 'middle' : tx > 0 ? 'start' : 'end';
        labels += `<text class="tr-mo${g === 0 ? ' tr-mo-f' : ''}" text-anchor="${manchor}" x="${f(mx)}" y="${f(shared ? my + 34 : my)}" data-fx="o 0 1 ${f4(a)} ${f4(a + .03)}">${shared ? 'لأمّهاتٍ شتّى' : mo.split('،')[0]}</text>`;
        list.forEach((nm, kk) => {
          const k = k0 + kk, n = list.length;
          const [t0r, t1r] = n > 4 ? [.3, .96] : n > 2 ? [.4, .94] : [.62, .94]; const t = t0r + (t1r - t0r) * (kk + .5) / n;
          const [x, y] = bez(B, t), [nx, ny] = bezN(B, t);
          const imam = g === 0 && IMAM_KIDS.has(nm), m = mart.includes(k);
          const tt = a + .03 + (kk / n) * Math.min(.06, b - a - .05);
          const r = imam ? 15 : 10.5;
          const cls = `fr${g === 0 ? ' fr-f' : ''}${imam ? ' fr-imam' : ''}${m ? ' fr-m' : ''}`;
          const label = imam ? `الإمام ${nm} عليه السلام` : nm, short = imam ? `الإمام ${nm}` : nm;
          fruits += `<g class="${cls}" tabindex="0" aria-label="${label}" data-fx="o 0 1 ${f4(tt)} ${f4(tt + .01)} | s .2 1 ${f4(tt)} ${f4(tt + .03)} out"><title>${label}</title>${imam ? `<circle cx="${f(x)}" cy="${f(y)}" r="23" class="fr-halo"/>` : ''}${m ? `<circle cx="${f(x)}" cy="${f(y)}" r="${r + 7}" class="fr-red" data-fx="o 0 1 .82 .88"/>` : ''}<circle cx="${f(x)}" cy="${f(y)}" r="${r}" class="fr-c"/></g>`;
          const sd = (kk % 2 ? 1 : -1) * (g === 0 ? 1 : 1);
          const off = imam ? 34 : 24;
          const side = nx * sd, anchor = side > .35 ? 'start' : side < -.35 ? 'end' : 'middle';
          labels += `<text class="tr-nm${imam ? ' tr-nm-imam' : ''}${m ? ' tr-nm-m' : ''}" text-anchor="${anchor}" x="${f(x + nx * off * sd)}" y="${f(y + ny * off * sd + 6)}" data-fx="o 0 1 ${f4(tt + .01)} ${f4(tt + .03)}">${short}</text>`;
          st.order.push(tt);
        });
        k0 += list.length;
      });
    });
    $('#kin-tree', host).innerHTML = `${svg}${fruits}${labels}</svg>`;
  },
  frame(p, t, host, st) {
    setText(st.n, arNum(st.order.filter((x) => x <= p).length));
    let g = KIN_AT.findIndex((a, i) => p >= a && p < (KIN_AT[i + 1] ?? 2));
    if (g < 0 || g >= KIN.length) g = p < .04 ? -1 : KIN.length;
    if (st.g === g) return;
    st.g = g;
    if (g < 0 || g >= KIN.length) { st.cap.innerHTML = ''; return; }
    const [mo, kids, note, , more] = KIN[g];
    const names = kids.map((nm) => (g === 0 && IMAM_KIDS.has(nm) ? `<span class="imam">الإمام ${nm} عليه السلام</span>` : nm)).join('، ');
    st.cap.innerHTML = `<p class="kick">أمّهم</p><p class="kin-cm">${mo}</p><p class="kin-kids">${names}</p>${note ? `<p class="cap kin-note">${note}</p>` : ''}${more.map(([tx, sr]) => `<p class="cap kin-more">${tx} <span class="src">${sr}</span></p>`).join('')}`;
  },
};

// In the Qur'an and the Sunna: a mushaf that turns its pages as you scroll. Two-page spread on wide screens
// (spine in the middle, leaves turn from left to right as Arabic books do); single pages on phones.
S.book = {
  init(host, st) {
    const inner = host.querySelector('#bk-in');
    const items = [...document.querySelectorAll('#vcards li')];
    st.narrow = innerWidth <= 760;
    host.classList.toggle('narrow', st.narrow);
    const page = (li, i) => `<div class="pg"><p class="pg-head">${li.dataset.head}</p><div class="pg-body">${li.innerHTML}</div><p class="pg-no">${arNum(i + 1)}</p></div>`;
    const title = '<div class="pg pg-title"><i class="pg-rose"></i><p class="pg-k">في القرآن والسنّة</p><p class="pg-t">ما نزل فيه، وما قيل فيه</p><i class="pg-rose"></i></div>';
    const colophon = '<div class="pg pg-title"><i class="pg-rose"></i><p class="pg-t pg-salawat">اللهمّ صلِّ على محمّدٍ وآل محمّد</p><i class="pg-rose"></i></div>';
    const blank = '<div class="pg pg-blank"></div>';
    const leaf = (front, back) => `<div class="leaf"><div class="face front">${front}<i class="shade"></i></div><div class="face back">${back}<i class="shade"></i></div></div>`;
    let html = `<div class="base base-l">${colophon}</div>`;
    let leaves = [];
    if (st.narrow) {
      leaves = [leaf(title, blank), ...items.map((li, i) => leaf(page(li, i), blank))];
    } else {
      html += `<div class="base base-r">${title}</div>`;
      for (let k = 0; k < items.length; k += 2) leaves.push(leaf(page(items[k], k), items[k + 1] ? page(items[k + 1], k + 1) : colophon));
    }
    inner.innerHTML = html + leaves.join('');
    st.leaves = [...inner.querySelectorAll('.leaf')].map((el) => ({ el, sh: [...el.querySelectorAll('.shade')], last: -1 }));
    const n = st.leaves.length, span = .84 / n;
    st.leaves.forEach((L, i) => { L.a = .08 + i * span; L.b = L.a + span * .78; });
  },
  frame(p, t, host, st) {
    const n = st.leaves.length;
    st.leaves.forEach((L, i) => {
      const k = ease.io(seg(p, L.a, L.b));
      if (k === L.last) return;
      L.last = k;
      const ang = 180 * k;
      L.el.style.transform = `rotateY(${ang.toFixed(2)}deg)`;
      L.el.style.zIndex = String(ang < 90 ? 100 + n - i : 200 + i);
      const sh = (Math.sin(k * Math.PI) * .38).toFixed(3);
      L.sh.forEach((s) => { s.style.opacity = sh; });
    });
  },
};

// The shrine at al-Ghari: the night burial, the hidden years, the grave made known, then the golden dome rising
// at dawn and pilgrims streaming in from every road. In the night burial al-Hasan and al-Husayn carry his bier: they
// are veiled figures with the gold disc behind the head (scenes/holy.js; no face is ever drawn), the bier is draped
// in green and the body is never drawn. The pilgrims are points of light.
S.shrine = {
  init(host, st) {
    st.cv = host.querySelector('canvas');
    const r = rng(77);
    st.stars = Array.from({ length: 300 }, () => [r(), r() * .72, r()]);
    st.pil = Array.from({ length: 700 }, () => ({ road: Math.floor(r() * 4), off: r(), jit: r() - .5, sp: .5 + r() * .8 }));
    st.houses = Array.from({ length: 60 }, () => ({ x: r(), w: .025 + r() * .05, h: .018 + r() * .05, d: r() }));
  },
  frame(p, t, host, st) {
    const cv = st.cv;
    fit(cv);
    const c = cv.getContext('2d'), W = cv.width, H = cv.height;
    const narrow = cv.clientWidth < 700;
    const u = Math.min(W / 1150, H * .00098), cx = W * (narrow ? .5 : .42), gy = H * .82;
    const dawn = seg(p, .46, .92);
    const sky = (a, b, cc) => (dawn < .5 ? mixC(a, b, dawn * 2) : mixC(b, cc, (dawn - .5) * 2));
    const g = c.createLinearGradient(0, 0, 0, gy);
    g.addColorStop(0, sky('#04060d', '#26324f', '#8fa9c4')); g.addColorStop(1, sky('#0d1222', '#c98d5e', '#f0e2c0'));
    c.fillStyle = g; c.fillRect(0, 0, W, gy + 1);
    const sa = 1 - c01(dawn * 1.7);
    if (sa > 0) st.stars.forEach(([x, y, m]) => {
      const xx = ((x + seg(p, .24, .44) * .35) % 1) * W;
      c.fillStyle = rgba(PAL.paper, sa * (.2 + .6 * m)); c.fillRect(xx, y * H, 1.2 + m * 1.4, 1.2 + m * 1.4);
    });
    const lit = .3 + .7 * dawn;
    // far ridge of the Najaf plateau, and the ground
    c.fillStyle = mixC('#07080a', '#6f5f45', lit * .8);
    c.beginPath(); c.moveTo(0, gy);
    for (let i = 0; i <= 24; i++) c.lineTo(i / 24 * W, gy - (10 + Math.sin(i * 1.7) * 6 + Math.sin(i * .6) * 8) * u);
    c.lineTo(W, gy); c.closePath(); c.fill();
    const gg = c.createLinearGradient(0, gy, 0, H);
    gg.addColorStop(0, mixC('#15120c', '#c9ad80', lit * .85)); gg.addColorStop(1, mixC('#0a0907', '#8f7a58', lit * .7));
    c.fillStyle = gg; c.fillRect(0, gy, W, H - gy);
    const glow = (x, y, rad, col, a) => { const q = c.createRadialGradient(x, y, 0, x, y, rad); q.addColorStop(0, rgba(col, a)); q.addColorStop(1, rgba(col, 0)); c.fillStyle = q; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
    // the bier: a litter on two poles, draped in green with a gold edge; under the cloth nothing is shown
    const bier = (x, y, len, fh, a) => {
      c.save(); c.globalAlpha = a;
      c.strokeStyle = '#2a1d12'; c.lineWidth = Math.max(1.5, fh * .03); c.beginPath(); c.moveTo(x - len / 2, y); c.lineTo(x + len / 2, y); c.stroke();
      const bl = len * .62, bh = fh * .16;
      c.beginPath(); c.moveTo(x - bl / 2, y); c.quadraticCurveTo(x - bl / 2, y - bh, x - bl * .3, y - bh); c.lineTo(x + bl * .3, y - bh * .9); c.quadraticCurveTo(x + bl / 2, y - bh * .9, x + bl / 2, y);
      c.lineTo(x + bl / 2 + fh * .02, y + bh * .45); c.lineTo(x - bl / 2 - fh * .02, y + bh * .45); c.closePath();
      const q = c.createLinearGradient(0, y - bh, 0, y + bh * .45); q.addColorStop(0, '#2c6a50'); q.addColorStop(1, '#123326'); c.fillStyle = q; c.fill();
      c.strokeStyle = 'rgba(226,184,80,.85)'; c.lineWidth = Math.max(1, fh * .012); c.beginPath(); c.moveTo(x - bl / 2 - fh * .02, y + bh * .45); c.lineTo(x + bl / 2 + fh * .02, y + bh * .45); c.stroke();
      c.restore();
    };
    // the night procession: al-Hasan in front, al-Husayn behind, the bier on their shoulders between them
    const pa = seg(p, .02, .06) * (1 - seg(p, .19, .24));
    if (pa > 0) {
      const go = ease.out(seg(p, .02, .15)), px = mix(W * 1.05, cx + 30 * u, go), fh = Math.max(36 * W / cv.clientWidth, 44 * u), half = fh * .62;
      c.globalCompositeOperation = 'lighter';
      glow(px, gy - fh * .6, 70 * u + fh, PAL.goldHi, .3 * pa);
      c.globalCompositeOperation = 'source-over';
      const bear = (who, x, sd) => Holy.draw(c, { who, pose: go < 1 ? 'walk' : 'stand', phase: go * 9 + (sd > 0 ? .5 : 0), x, y: gy + 2 * u, h: fh, t, amb: .3, alpha: pa, arms: [[sd * .12, -.84]] });
      const hb = bear('husayn', px + half, -1);
      bier(px, gy + 2 * u - fh * .84, half * 2.3, fh, pa);
      const ha = bear('hasan', px - half, 1);
      c.globalCompositeOperation = 'lighter';
      [ha, hb].forEach((hd) => hd && glow(hd.x, hd.y, hd.r * 5, PAL.goldHi, .35 * pa));
      c.globalCompositeOperation = 'source-over';
    }
    // the grave made known
    const rv = seg(p, .46, .52);
    if (rv > 0) { c.globalCompositeOperation = 'lighter'; glow(cx, gy - 6 * u, (60 + 80 * rv) * u, PAL.goldHi, .55 * rv * (1 - seg(p, .66, .8) * .6)); c.globalCompositeOperation = 'source-over'; }
    // the city of Najaf gathers around
    const gc = seg(p, .7, .86);
    if (gc > 0) st.houses.forEach((hs) => {
      const x = (hs.x * 1.3 - .15) * W, w = hs.w * W, h = hs.h * H * (.6 + .4 * hs.d);
      if (Math.abs(x + w / 2 - cx) < 300 * u) return;
      c.fillStyle = mixC('#1c1812', '#ad9670', lit * (.7 + .3 * hs.d));
      c.globalAlpha = gc; c.fillRect(x, gy - h, w, h); c.globalAlpha = 1;
    });
    // the shrine, rising part by part
    const stone = mixC('#2a261f', '#cdbb97', lit), tile = mixC('#0c2028', '#2f7189', lit), dark = mixC('#08070a', '#2a2112', lit);
    const gl = seg(p, .72, .84);
    const gold = (x0, x1) => { const q = c.createLinearGradient(x0, 0, x1, 0); q.addColorStop(0, mixC('#2a1f08', '#6e4f15', lit)); q.addColorStop(.35, mixC('#5a4a20', '#f7df8e', lit)); q.addColorStop(.6, mixC('#4a3a14', '#e2b850', lit)); q.addColorStop(1, mixC('#2a1f08', '#7a5718', lit)); return q; };
    const rise = (k, x0, y0, x1, draw) => { if (k <= 0) return; c.save(); c.beginPath(); c.rect(x0 - 2, gy - (gy - y0) * k - 2, x1 - x0 + 4, (gy - y0) * k + 4); c.clip(); draw(); c.restore(); };
    const fillPath = (pts, fill) => { c.beginPath(); pts(); c.fillStyle = fill; c.fill(); };
    const both = (fn) => { fn(stone, 1); if (gl > 0) { c.globalAlpha = gl; fn(null, gl); c.globalAlpha = 1; } };
    // dome and drum (behind the gate)
    const y0 = gy - 345 * u;
    rise(seg(p, .62, .74), cx - 170 * u, y0 - 330 * u, cx + 170 * u, () => {
      both((col) => { c.fillStyle = col || gold(cx - 120 * u, cx + 120 * u); c.fillRect(cx - 115 * u, y0, 230 * u, 80 * u); });
      for (let k = -3; k <= 3; k++) { c.fillStyle = dark; const wx = cx + k * 30 * u; c.fillRect(wx - 6 * u, y0 + 22 * u, 12 * u, 30 * u); }
      const dome = () => { c.moveTo(cx - 118 * u, y0); c.bezierCurveTo(cx - 168 * u, y0 - 60 * u, cx - 176 * u, y0 - 160 * u, cx - 62 * u, y0 - 222 * u); c.quadraticCurveTo(cx - 14 * u, y0 - 248 * u, cx, y0 - 282 * u); c.quadraticCurveTo(cx + 14 * u, y0 - 248 * u, cx + 62 * u, y0 - 222 * u); c.bezierCurveTo(cx + 176 * u, y0 - 160 * u, cx + 168 * u, y0 - 60 * u, cx + 118 * u, y0); c.closePath(); };
      both((col) => fillPath(dome, col || gold(cx - 170 * u, cx + 170 * u)));
      c.strokeStyle = rgba(PAL.goldHi, .5 * lit); c.lineWidth = 1.2 * u; c.beginPath(); c.moveTo(cx, y0 - 282 * u); c.lineTo(cx, y0 - 330 * u); c.stroke();
      c.fillStyle = gl > .5 ? '#f3d98f' : stone; c.beginPath(); c.arc(cx, y0 - 318 * u, 6 * u, 0, TAU); c.fill();
      if (gl > 0) { c.globalCompositeOperation = 'lighter'; glow(cx - 60 * u, y0 - 150 * u, 90 * u, '#fff3cf', .22 * gl * dawn); c.globalCompositeOperation = 'source-over'; }
    });
    // minarets
    [-1, 1].forEach((sd) => {
      const mx = cx + sd * 215 * u;
      rise(seg(p, .66, .78), mx - 30 * u, gy - 615 * u, mx + 30 * u, () => {
        c.fillStyle = stone; c.fillRect(mx - 15 * u, gy - 430 * u, 30 * u, 430 * u);
        c.fillStyle = tile; for (let k = 0; k < 6; k++) c.fillRect(mx - 15 * u, gy - (80 + k * 60) * u, 30 * u, 6 * u);
        both((col) => { c.fillStyle = col || gold(mx - 28 * u, mx + 28 * u); c.fillRect(mx - 27 * u, gy - 452 * u, 54 * u, 20 * u); c.fillRect(mx - 12 * u, gy - 540 * u, 24 * u, 90 * u);
          c.beginPath(); c.moveTo(mx - 13 * u, gy - 540 * u); c.bezierCurveTo(mx - 24 * u, gy - 556 * u, mx - 8 * u, gy - 574 * u, mx, gy - 588 * u); c.bezierCurveTo(mx + 8 * u, gy - 574 * u, mx + 24 * u, gy - 556 * u, mx + 13 * u, gy - 540 * u); c.closePath(); c.fill(); });
        c.strokeStyle = rgba(PAL.goldHi, .6); c.lineWidth = u; c.beginPath(); c.moveTo(mx, gy - 588 * u); c.lineTo(mx, gy - 612 * u); c.stroke();
      });
    });
    // the courtyard wall with its arcades
    rise(seg(p, .55, .62), cx - 560 * u, gy - 95 * u, cx + 560 * u, () => {
      c.fillStyle = stone; c.fillRect(cx - 560 * u, gy - 95 * u, 1120 * u, 95 * u);
      c.fillStyle = tile;
      for (let x = cx - 540 * u; x < cx + 540 * u; x += 46 * u) {
        if (Math.abs(x + 15 * u - cx) < 160 * u) continue;
        c.beginPath(); c.moveTo(x, gy - 10 * u); c.lineTo(x, gy - 55 * u); c.quadraticCurveTo(x + 15 * u, gy - 82 * u, x + 30 * u, gy - 55 * u); c.lineTo(x + 30 * u, gy - 10 * u); c.closePath(); c.fill();
      }
      c.fillStyle = mixC('#3a2f1a', '#c9a54e', lit); c.fillRect(cx - 560 * u, gy - 99 * u, 1120 * u, 5 * u);
    });
    // the great gate (iwan), gilded
    rise(seg(p, .58, .66), cx - 150 * u, gy - 272 * u, cx + 150 * u, () => {
      both((col) => { c.fillStyle = col || gold(cx - 150 * u, cx + 150 * u); c.fillRect(cx - 150 * u, gy - 272 * u, 300 * u, 272 * u); });
      c.fillStyle = dark;
      c.beginPath(); c.moveTo(cx - 72 * u, gy); c.lineTo(cx - 72 * u, gy - 150 * u); c.quadraticCurveTo(cx - 70 * u, gy - 215 * u, cx, gy - 236 * u); c.quadraticCurveTo(cx + 70 * u, gy - 215 * u, cx + 72 * u, gy - 150 * u); c.lineTo(cx + 72 * u, gy); c.closePath(); c.fill();
      c.globalCompositeOperation = 'lighter'; glow(cx, gy - 90 * u, 90 * u, PAL.goldHi, .35 + .3 * (1 - dawn)); c.globalCompositeOperation = 'source-over';
      c.strokeStyle = rgba(PAL.goldHi, .5 * lit + .2); c.lineWidth = 1.5 * u; c.strokeRect(cx - 140 * u, gy - 262 * u, 280 * u, 262 * u);
    });
    // pilgrims on every road
    const pp = seg(p, .76, .88);
    if (pp > 0) {
      const gx = cx, gyy = gy + 8 * u;
      const roads = [[-.05 * W, gy + .1 * H], [1.05 * W, gy + .08 * H], [.12 * W, H * 1.04], [.88 * W, H * 1.04]];
      c.fillStyle = rgba('#fff4d8', .85 * pp);
      for (const q of st.pil) {
        const f = (q.off + (p - .76) * q.sp * 3) % 1;
        const [sx, sy] = roads[q.road];
        const x = mix(sx, gx, f) + q.jit * 26 * u * (1 - f), y = mix(sy, gyy, f) + q.jit * 10 * u * (1 - f);
        const rr = (1.2 + 1.2 * (y - gy) / (H - gy)) * u * 1.4;
        c.globalAlpha = pp * (1 - f * .6); c.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      }
      c.globalAlpha = 1;
    }
  },
};

// The scenery behind each Imam's name: the place and the life, painted in a few silhouettes.
const SCENERY = (() => {
  const sky = (c, W, H, cols) => { const g = c.createLinearGradient(0, 0, 0, H * .78); cols.forEach((k, i) => g.addColorStop(i / (cols.length - 1), k)); c.fillStyle = g; c.fillRect(0, 0, W, H); };
  const stars = (c, W, H, n, seed, a) => { const r = rng(seed); for (let i = 0; i < n; i++) { const m = r(); c.fillStyle = `rgba(240,232,210,${(a * (.25 + .75 * m)).toFixed(3)})`; c.fillRect(r() * W, r() * H * .6, 1 + m * 1.6, 1 + m * 1.6); } };
  const ground = (c, W, H, y, col) => { c.fillStyle = col; c.fillRect(0, y, W, H - y); };
  const hills = (c, W, y, amp, col, seed) => { const r = rng(seed); c.fillStyle = col; c.beginPath(); c.moveTo(0, y + amp * 2); let v = 0; for (let i = 0; i <= 30; i++) { v = v * .7 + (r() - .5) * amp; c.lineTo(i / 30 * W, y - Math.abs(v) - amp * .3 * Math.sin(i * .5)); } c.lineTo(W, y + amp * 2); c.closePath(); c.fill(); };
  const palm = (c, x, y, h, col) => { c.strokeStyle = col; c.lineWidth = h * .035; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + h * .08, y - h * .5, x + h * .04, y - h); c.stroke(); c.fillStyle = col; for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * .5; c.beginPath(); c.moveTo(x + h * .04, y - h); c.quadraticCurveTo(x + h * .04 + Math.cos(a) * h * .3, y - h + Math.sin(a) * h * .3 - h * .05, x + h * .04 + Math.cos(a) * h * .45, y - h + Math.sin(a) * h * .45 + h * .12); c.quadraticCurveTo(x + h * .04 + Math.cos(a) * h * .25, y - h + Math.sin(a) * h * .2, x + h * .04, y - h + h * .02); c.fill(); } };
  const dome = (c, x, y, w, col) => { c.fillStyle = col; c.fillRect(x - w * .42, y - w * .25, w * .84, w * .25); c.beginPath(); c.moveTo(x - w * .42, y - w * .25); c.bezierCurveTo(x - w * .6, y - w * .55, x - w * .45, y - w * .9, x, y - w * 1.15); c.bezierCurveTo(x + w * .45, y - w * .9, x + w * .6, y - w * .55, x + w * .42, y - w * .25); c.closePath(); c.fill(); c.fillRect(x - 1, y - w * 1.32, 2, w * .2); };
  const minaret = (c, x, y, h, w, col) => { c.fillStyle = col; c.fillRect(x - w / 2, y - h, w, h); c.fillRect(x - w, y - h * .78, w * 2, h * .04); c.beginPath(); c.moveTo(x - w * .6, y - h); c.quadraticCurveTo(x, y - h * 1.12, x + w * .6, y - h); c.fill(); };
  const gold = (c, x0, x1) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#7a5718'); g.addColorStop(.4, '#f7df8e'); g.addColorStop(1, '#8a6320'); return g; };
  const glow = (c, x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
  const river = (c, W, y, h, top, bot) => { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, y, W, h); c.strokeStyle = 'rgba(255,240,210,.12)'; c.lineWidth = 1; for (let k = 0; k < 14; k++) { const yy = y + (k + .5) / 14 * h, x0 = ((k * 137) % 100) / 100 * W; c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 + W * .12, yy); c.stroke(); } };
  const arcade = (c, x0, x1, y, h, col, holeCol, n) => { c.fillStyle = col; c.fillRect(x0, y - h, x1 - x0, h); const w = (x1 - x0) / n; c.fillStyle = holeCol; for (let k = 0; k < n; k++) { const x = x0 + k * w + w * .2, ww = w * .6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h * .55); c.quadraticCurveTo(x + ww / 2, y - h * .9, x + ww, y - h * .55); c.lineTo(x + ww, y); c.closePath(); c.fill(); } };
  // each painter draws one Imam's place; u = H / 100
  return [
    (c, W, H, u) => { sky(c, W, H, ['#04060d', '#0f1628', '#1d2338']); stars(c, W, H, 220, 1, .9); ground(c, W, H, H * .74, '#120f0a'); const x = W * .3, y = H * .74; glow(c, x, y - 12 * u, 40 * u, 'rgba(243,217,143,A)', .35); dome(c, x, y, 14 * u, gold(c, x - 9 * u, x + 9 * u)); minaret(c, x - 12 * u, y, 22 * u, 1.6 * u, gold(c, x - 14 * u, x - 10 * u)); minaret(c, x + 12 * u, y, 22 * u, 1.6 * u, gold(c, x + 10 * u, x + 14 * u)); c.fillStyle = '#0b0906'; c.fillRect(x - 30 * u, y - 4 * u, 60 * u, 4 * u); },
    (c, W, H, u) => { sky(c, W, H, ['#1b1830', '#5a3a48', '#c07a50']); hills(c, W, H * .7, 3 * u, '#2a1d1e', 3); ground(c, W, H, H * .74, '#1b1412'); dome(c, W * .62, H * .72, 6 * u, '#2f6b52'); for (let k = 0; k < 7; k++) palm(c, W * (.05 + k * .13), H * .76, (14 + (k % 3) * 4) * u, '#120c0a'); c.fillStyle = '#2a201a'; c.fillRect(0, H * .74, W, 1.6 * u); for (let k = 0; k < 26; k++) { c.fillStyle = '#3a2d24'; c.fillRect(W * (.08 + k * .033), H * (.77 + (k % 3) * .02), 1.2 * u, 2.2 * u); } },
    (c, W, H, u) => { sky(c, W, H, ['#2a0806', '#7a1c12', '#d0512c', '#eaa25a']); glow(c, W * .35, H * .66, 30 * u, 'rgba(255,190,120,A)', .55); ground(c, W, H, H * .72, '#2a120c'); river(c, W, H * .72, 7 * u, '#3a2a3a', '#1a1220'); for (let k = 0; k < 6; k++) palm(c, W * (.04 + k * .17), H * .72, (16 + (k % 2) * 6) * u, '#1a0806'); c.fillStyle = '#1a0806'; for (let k = 0; k < 6; k++) { const x = W * (.12 + k * .1), y = H * .86; c.beginPath(); c.moveTo(x - 4 * u, y); c.lineTo(x, y - 6 * u); c.lineTo(x + 4 * u, y); c.closePath(); c.fill(); } c.strokeStyle = '#1a0806'; c.lineWidth = .5 * u; c.beginPath(); c.moveTo(W * .5, H * .86); c.lineTo(W * .5, H * .66); c.stroke(); c.fillStyle = '#5e1712'; c.beginPath(); c.moveTo(W * .5, H * .66); c.quadraticCurveTo(W * .53, H * .65, W * .56, H * .665); c.lineTo(W * .56, H * .7); c.quadraticCurveTo(W * .53, H * .69, W * .5, H * .7); c.fill(); },
    (c, W, H, u) => { sky(c, W, H, ['#03040a', '#0a0d1a', '#141826']); stars(c, W, H, 320, 4, 1); ground(c, W, H, H * .76, '#0a0908'); const x = W * .32, y = H * .76; c.fillStyle = '#16120c'; c.fillRect(x - 18 * u, y - 34 * u, 36 * u, 34 * u); c.fillStyle = '#2b2112'; c.beginPath(); c.moveTo(x - 9 * u, y); c.lineTo(x - 9 * u, y - 18 * u); c.quadraticCurveTo(x, y - 30 * u, x + 9 * u, y - 18 * u); c.lineTo(x + 9 * u, y); c.closePath(); c.fill(); glow(c, x, y - 14 * u, 16 * u, 'rgba(243,217,143,A)', .45); c.fillStyle = '#f3d98f'; c.beginPath(); c.arc(x, y - 22 * u, .8 * u, 0, TAU); c.fill(); },
    (c, W, H, u) => { sky(c, W, H, ['#8fa3b4', '#cdd5d2', '#efe2c2']); ground(c, W, H, H * .76, '#b9a37c'); for (let k = 0; k < 10; k++) { c.fillStyle = 'rgba(255,248,225,.16)'; c.beginPath(); c.moveTo(W * .3, H * .6); c.lineTo(W * (.3 + (k - 4.5) * .07), 0); c.lineTo(W * (.3 + (k - 4.2) * .07), 0); c.closePath(); c.fill(); } arcade(c, W * .02, W * .7, H * .76, 16 * u, '#a48c63', '#5a4a33', 9); glow(c, W * .3, H * .6, 14 * u, 'rgba(255,250,230,A)', .7); },
    (c, W, H, u) => { sky(c, W, H, ['#05060c', '#11131c', '#1e1a18']); ground(c, W, H, H * .78, '#0c0a08'); arcade(c, 0, W * .8, H * .78, 26 * u, '#1d1812', '#2e2416', 10); const r = rng(9); for (let k = 0; k < 60; k++) { const x = r() * W * .78, y = H * (.64 + r() * .12); glow(c, x, y, 1.3 * u, 'rgba(243,217,143,A)', .75); } },
    (c, W, H, u) => { c.fillStyle = '#0f0e0d'; c.fillRect(0, 0, W, H); for (let yy = 0; yy < H; yy += 6 * u) for (let xx = (yy / (6 * u)) % 2 ? 0 : -6 * u; xx < W; xx += 12 * u) { c.fillStyle = `rgba(60,52,44,${.35 + ((xx * 7 + yy * 3) % 10) / 40})`; c.fillRect(xx + .4 * u, yy + .4 * u, 11.2 * u, 5.2 * u); } const wx = W * .26, wy = H * .18, ww = 14 * u, wh = 10 * u; c.fillStyle = '#1b2a40'; c.fillRect(wx, wy, ww, wh); c.fillStyle = 'rgba(200,215,235,.10)'; c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + ww, wy); c.lineTo(wx + ww + 40 * u, H); c.lineTo(wx + 12 * u, H); c.closePath(); c.fill(); c.fillStyle = '#e8eef6'; c.beginPath(); c.arc(wx + ww * .7, wy + wh * .35, 1.6 * u, 0, TAU); c.fill(); c.fillStyle = '#0a0908'; for (let k = 1; k < 4; k++) c.fillRect(wx + k * ww / 4 - .4 * u, wy, .8 * u, wh); },
    (c, W, H, u) => { sky(c, W, H, ['#3a3f5e', '#b28aa0', '#f0c9a8']); const r = rng(5); c.fillStyle = '#4c5470'; c.beginPath(); c.moveTo(0, H * .7); for (let i = 0; i <= 12; i++) c.lineTo(i / 12 * W, H * (.42 + r() * .16)); c.lineTo(W, H * .7); c.closePath(); c.fill(); c.fillStyle = 'rgba(245,245,250,.6)'; ground(c, W, H, H * .72, '#2e3040'); const x = W * .34, y = H * .72; glow(c, x, y - 8 * u, 26 * u, 'rgba(243,217,143,A)', .4); dome(c, x, y, 9 * u, gold(c, x - 6 * u, x + 6 * u)); },
    (c, W, H, u) => { sky(c, W, H, ['#0d2a33', '#2f5c63', '#c79a6a']); ground(c, W, H, H * .7, '#14120e'); river(c, W, H * .7, 12 * u, '#3b5a5e', '#10222a'); const x = W * .3, y = H * .7; [-1, 1].forEach((sd) => { dome(c, x + sd * 6 * u, y, 7 * u, gold(c, x + sd * 6 * u - 5 * u, x + sd * 6 * u + 5 * u)); minaret(c, x + sd * 16 * u, y, 18 * u, 1.3 * u, gold(c, x + sd * 16 * u - 2 * u, x + sd * 16 * u + 2 * u)); }); for (let k = 0; k < 4; k++) palm(c, W * (.55 + k * .1), H * .7, 14 * u, '#0c0a08'); },
    (c, W, H, u) => { sky(c, W, H, ['#3b2410', '#b5622c', '#f0b26a']); ground(c, W, H, H * .78, '#2a1a0e'); const x = W * .16, y = H * .78, h = 30 * u; c.fillStyle = '#1e130a'; c.beginPath(); c.moveTo(x - 12 * u, y); c.lineTo(x - 3 * u, y - h); c.lineTo(x + 3 * u, y - h); c.lineTo(x + 12 * u, y); c.closePath(); c.fill(); c.strokeStyle = 'rgba(240,178,106,.5)'; c.lineWidth = .5 * u; for (let k = 0; k < 7; k++) { const t0 = k / 7, t1 = (k + .5) / 7; c.beginPath(); c.moveTo(x - 12 * u * (1 - t0) - 3 * u * t0, y - h * t0); c.lineTo(x + 12 * u * (1 - t1) + 3 * u * t1, y - h * t1); c.stroke(); } },
    (c, W, H, u) => { sky(c, W, H, ['#05060a', '#101320', '#1c1a1e']); stars(c, W, H, 160, 11, .7); ground(c, W, H, H * .76, '#0d0b09'); c.fillStyle = '#1a1612'; c.fillRect(0, H * .66, W * .8, 10 * u); for (let k = 0; k < 6; k++) { const x = W * (.05 + k * .14); c.fillRect(x - 2.5 * u, H * .56, 5 * u, 20 * u); for (let q = -1; q <= 1; q++) c.fillRect(x + q * 2 * u - .6 * u, H * .545, 1.2 * u, 1.5 * u); glow(c, x, H * .58, 5 * u, 'rgba(240,150,70,A)', .7); } },
    (c, W, H, u) => { sky(c, W, H, ['#050816', '#14204a', '#3b4f7a', '#9fb5c9']); stars(c, W, H, 200, 12, .8); glow(c, W * .34, H * .76, 60 * u, 'rgba(200,230,215,A)', .35); ground(c, W, H, H * .76, '#0b1018'); c.fillStyle = '#f2f4ea'; c.beginPath(); c.arc(W * .5, H * .2, 3 * u, 0, TAU); c.fill(); c.fillStyle = '#14204a'; c.beginPath(); c.arc(W * .5 + 1.2 * u, H * .2 - .6 * u, 2.7 * u, 0, TAU); c.fill(); },
  ];
})();
S.line = {
  init(host, st) { st.cv = host.querySelector('canvas'); st.cache = []; },
  frame(p, t, host, st) {
    const cv = st.cv;
    if (fit(cv, .6) || !st.cache.length) {
      st.cache = SCENERY.map((paint) => { const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; const c = o.getContext('2d'); paint(c, o.width, o.height, o.height / 100);
        const f = c.createLinearGradient(o.width * (innerWidth <= 640 ? .2 : .45), 0, o.width * .8, 0); f.addColorStop(0, 'rgba(13,14,11,0)'); f.addColorStop(1, 'rgba(13,14,11,.92)'); c.fillStyle = f; c.fillRect(0, 0, o.width, o.height);
        return o; });
    }
    const c = cv.getContext('2d');
    const N = SCENERY.length, at = (i) => .05 + i * .072;
    let i = 0; while (i < N - 1 && p >= at(i + 1) - .02) i++;
    const k = i > 0 ? smooth(seg(p, at(i) - .02, at(i) + .004)) : 1;
    c.globalAlpha = 1;
    c.drawImage(st.cache[Math.max(0, i - 1)], 0, 0);
    if (k < 1) c.globalAlpha = k;
    c.drawImage(st.cache[i], 0, 0);
    c.globalAlpha = 1;
  },
};

// The brotherhood: the courtyard of the Prophet's mosque in Medina, full of people. They pair off two by two
// until one is left standing alone, Ali; then the Prophet crosses the courtyard to him, stands beside him and takes his
// hand. The two are veiled figures with the gold disc behind the head (scenes/holy.js; no face is ever drawn).
S.pairs = {
  init(host, st) {
    st.cv = host.querySelector('canvas');
    const r = rng(19);
    const CLOAK = ['#efe6d2', '#e2d5b8', '#cdb994', '#b39a72', '#8f7451', '#6b5539', '#d8c7a4', '#a68d66'];
    const HEAD = ['#f4efe2', '#e9e1cc', '#3a2e22', '#f4efe2', '#d8ccb2'];
    const rows = 15, cols = 18, pairs = [];
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
      const D = 1.25 + (row / (rows - 1)) * 2.2 + (r() - .5) * .05;
      const X = -.95 + (col + .5) / cols * 1.9 + (r() - .5) * .03;
      if (Math.hypot(X + .55, (D - 1.62) * .5) < .12) continue; // Ali's place stays clear
      pairs.push([X, D]);
    }
    st.people = [];
    pairs.forEach(([X, D], k) => {
      const ang = (r() - .5) * .6, sep = .026 + r() * .008;
      const at = .1 + r() * .34;
      [-1, 1].forEach((sd) => st.people.push({
        x0: -1 + r() * 2, d0: 1.2 + r() * 2.3,
        x1: X + Math.cos(ang) * sep * sd, d1: D + Math.sin(ang) * sep * sd * 3,
        at, ph: r() * TAU, pair: k, h: .9 + r() * .22,
        cloak: CLOAK[Math.floor(r() * CLOAK.length)], head: HEAD[Math.floor(r() * HEAD.length)],
      }));
    });
    st.palms = Array.from({ length: 9 }, (_, i) => [-1.6 + i * .4 + (r() - .5) * .15, .8 + r() * .5]);
    st.ali = { x0: -.2, d0: 2.1, x1: -.55, d1: 1.62 };
    st.prophet = { x0: 0, d0: 3.55, x1: -.522, d1: 1.64 }; // he comes to stand at Ali's side, near enough to take his hand
  },
  frame(p, t, host, st) {
    const cv = st.cv;
    fit(cv);
    const c = cv.getContext('2d'), W = cv.width, H = cv.height;
    const narrow = cv.clientWidth < 700;
    const hy = H * .3, cx = W * (narrow ? .5 : .46), sc = W * (narrow ? 1 : .56), sy = H * .66;
    const proj = (X, D) => [cx + X * sc / D, hy + sy / D];
    const unit = Math.min(W / 1440, H / 900) * (narrow ? 1.15 : 1);
    // late-afternoon sky, and the sand of the courtyard in long light
    const g = c.createLinearGradient(0, 0, 0, hy + 10);
    g.addColorStop(0, '#5f7d96'); g.addColorStop(.7, '#d9c19a'); g.addColorStop(1, '#f0d7a8');
    c.fillStyle = g; c.fillRect(0, 0, W, hy + 2);
    const gg = c.createLinearGradient(0, hy, 0, H);
    gg.addColorStop(0, '#c9a974'); gg.addColorStop(1, '#7d6443');
    c.fillStyle = gg; c.fillRect(0, hy, W, H - hy);
    // palms behind the mosque
    const [bl, by] = proj(-1.25, 3.8), [br] = proj(1.25, 3.8);
    st.palms.forEach(([X, hh]) => { const [x] = proj(X, 3.9); const h = H * .2 * hh; c.strokeStyle = '#4a3a26'; c.lineWidth = 3 * unit; c.beginPath(); c.moveTo(x, by - H * .05); c.quadraticCurveTo(x + 6 * unit, by - h * .6, x + 3 * unit, by - h); c.stroke(); c.fillStyle = '#3e4a2c'; for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * .5; c.beginPath(); c.moveTo(x + 3 * unit, by - h); c.quadraticCurveTo(x + Math.cos(a) * 30 * unit, by - h + Math.sin(a) * 26 * unit - 8 * unit, x + Math.cos(a) * 46 * unit, by - h + Math.sin(a) * 40 * unit + 18 * unit); c.quadraticCurveTo(x + Math.cos(a) * 20 * unit, by - h + Math.sin(a) * 14 * unit, x + 3 * unit, by - h + 3 * unit); c.fill(); } });
    // the qibla portico: palm-trunk columns under a roof of fronds
    const ph = H * .17;
    c.fillStyle = '#3b2c1c'; c.fillRect(bl, by - ph * 1.08, br - bl, ph * .22);
    c.strokeStyle = 'rgba(20,14,6,.45)'; c.lineWidth = Math.max(1, unit);
    for (let x = bl; x < br; x += 6 * unit) { c.beginPath(); c.moveTo(x, by - ph * 1.08); c.lineTo(x + 4 * unit, by - ph * .86); c.stroke(); }
    c.fillStyle = '#241a10'; c.fillRect(bl, by - ph * .86, br - bl, ph * .86);
    for (let k = 0; k <= 16; k++) { const x = mix(bl, br, k / 16); c.fillStyle = '#8a6a44'; c.fillRect(x - 2.4 * unit, by - ph * .86, 4.8 * unit, ph * .86); c.fillStyle = 'rgba(255,230,180,.15)'; c.fillRect(x - 2.4 * unit, by - ph * .86, 1.4 * unit, ph * .86); }
    // low mud-brick side walls, receding
    [-1.25, 1.25].forEach((X) => {
      const [x1, y1] = proj(X, 3.8), [x2, y2] = proj(X, 1.02), wh = sy * .1;
      c.fillStyle = '#9c7f56'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1, y1 - wh / 3.8); c.lineTo(x2, y2 - wh / 1.02); c.lineTo(x2, y2); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,235,195,.35)'; c.lineWidth = 1.5 * unit; c.beginPath(); c.moveTo(x1, y1 - wh / 3.8); c.lineTo(x2, y2 - wh / 1.02); c.stroke();
    });
    // the people: milling, then pairing off
    const m = ease.io;
    const list = st.people.map((q) => { const k = m(seg(p, q.at, q.at + .09)); const sw = Math.sin(t * 1.3 + q.ph) * .004 * (1 - k * .5); return { q, X: mix(q.x0, q.x1, k) + sw, D: mix(q.d0, q.d1, k), k }; });
    const ak = m(seg(p, .02, .14)), aX = mix(st.ali.x0, st.ali.x1, ak), aD = mix(st.ali.d0, st.ali.d1, ak);
    const pk = m(seg(p, .5, .68)), pX = mix(st.prophet.x0, st.prophet.x1, pk), pD = mix(st.prophet.d0, st.prophet.d1, pk);
    list.push({ ali: true, X: aX, D: aD, k: ak, steps: 5 }, { prophet: true, X: pX, D: pD, k: pk, steps: 10 });
    // the bond: they take each other's hand, the sleeves meeting between them
    const bk = seg(p, .66, .74), [ax2] = proj(aX, aD), [px2] = proj(pX, pD), held = smooth(bk);
    const heads = [];
    list.sort((a2, b2) => b2.D - a2.D);
    const byPair = new Map();
    list.forEach((o) => {
      const [x, y] = proj(o.X, o.D);
      const s = unit * 1.9 / o.D;
      if (o.q) {
        const q = o.q, h = q.h;
        c.fillStyle = 'rgba(50,34,16,.3)'; c.beginPath(); c.ellipse(x + 12 * s, y + 1.5 * s, 13 * s, 3 * s, -.1, 0, TAU); c.fill();
        c.fillStyle = q.cloak; c.beginPath(); c.moveTo(x - 6.5 * s, y); c.quadraticCurveTo(x - 7.5 * s, y - 16 * s * h, x - 3.5 * s, y - 22 * s * h); c.lineTo(x + 3.5 * s, y - 22 * s * h); c.quadraticCurveTo(x + 7.5 * s, y - 16 * s * h, x + 6.5 * s, y); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,240,210,.18)'; c.fillRect(x - 5 * s, y - 20 * s * h, 2.2 * s, 18 * s * h);
        c.fillStyle = q.head; c.beginPath(); c.arc(x, y - 25.5 * s * h, 4.3 * s, 0, TAU); c.fill();
        const prev = byPair.get(q.pair);
        if (prev && o.k > .6) { const a = seg(o.k, .6, 1) * .6; const [x0, y0] = proj(prev.X, prev.D); c.strokeStyle = `rgba(243,217,143,${a.toFixed(3)})`; c.lineWidth = Math.max(1, 1.6 * s); c.beginPath(); c.moveTo(x0, y0 - 12 * s); c.lineTo(x, y - 12 * s); c.stroke(); }
        else byPair.set(q.pair, o);
      } else { // the Prophet or Ali: walking to his place, then standing; 1.85 / 1.8 m against the crowd's 1.7, never under 24 css px
        const h = Math.max(24 * W / cv.clientWidth, 30 * s * (o.prophet ? 1.09 : 1.06)), other = o.prophet ? ax2 : px2;
        c.fillStyle = 'rgba(50,34,16,.3)'; c.beginPath(); c.ellipse(x + 12 * s, y + 1.5 * s, 13 * s, 3 * s, -.1, 0, TAU); c.fill();
        const reach = held > 0 ? [[mix(Math.sign(other - x) * .1, (other - x) / 2 / h, held), mix(-.4, -.47, held)]] : [];
        heads.push(Holy.draw(c, { who: o.prophet ? 'prophet' : 'ali', pose: o.k > 0 && o.k < 1 ? 'walk' : 'stand', phase: o.k * o.steps, x, y, h, t, amb: .9, seed: o.prophet ? 2 : 0, arms: reach }));
      }
    });
    // a soft warm bloom at each disc, and a wider warmth round them so the two are found in the crowd
    c.globalCompositeOperation = 'lighter';
    heads.forEach((hd) => { if (!hd) return; [[hd.r * 5, .35], [hd.r * 16, .16]].forEach(([R, a]) => { const q = c.createRadialGradient(hd.x, hd.y, 0, hd.x, hd.y, R); q.addColorStop(0, `rgba(255,240,200,${a})`); q.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = q; c.fillRect(hd.x - R, hd.y - R, R * 2, R * 2); }); });
    c.globalCompositeOperation = 'source-over';
    // the bond between the Prophet and Ali
    if (bk > 0) {
      const [x1, y1] = proj(aX, aD), [x2, y2] = proj(pX, pD);
      c.globalCompositeOperation = 'lighter';
      const R = 150 * unit * bk, gl = c.createRadialGradient((x1 + x2) / 2, (y1 + y2) / 2 - 30 * unit, 0, (x1 + x2) / 2, (y1 + y2) / 2 - 30 * unit, R);
      gl.addColorStop(0, `rgba(243,217,143,${(.3 * bk).toFixed(3)})`); gl.addColorStop(1, 'rgba(243,217,143,0)');
      c.fillStyle = gl; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
    }
  },
};

// Wisdom: a saying for today (the same for everyone on a given day), copy, next; and a search over the sayings
// by word (ignoring vowel marks and hamza forms) or by number (Arabic-Indic or Western digits).
(() => {
  const grid = $('#hk-grid'); if (!grid) return;
  const items = [...grid.children];
  const plain = (s) => s.replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
  let at = day % items.length;
  const show = () => { const li = items[at]; $('#hk-t').textContent = li.querySelector('p').textContent; $('#hk-s').textContent = `نهج البلاغة، ${li.querySelector('span').textContent}`; };
  show();
  $('#hk-next').addEventListener('click', () => { at = (at + 1) % items.length; show(); $('#hk-msg').textContent = ''; });
  $('#hk-copy').addEventListener('click', async () => {
    const txt = `«${$('#hk-t').textContent}»\n— الإمام عليّ عليه السلام، ${$('#hk-s').textContent}`;
    try { await navigator.clipboard.writeText(txt); $('#hk-msg').textContent = 'نُسخت الحكمة'; }
    catch { const r = document.createRange(); r.selectNodeContents($('#hk-card')); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); $('#hk-msg').textContent = 'حدِّد النصّ وانسخه'; }
  });
  const index = items.map((li) => plain(li.textContent));
  const count = $('#hk-count');
  $('#hk-q').addEventListener('input', (e) => {
    const q = plain(e.target.value.trim());
    let n = 0;
    items.forEach((li, i) => { const hit = !q || (/^\d+$/.test(q) ? new RegExp(`(^|\\D)${q}(\\D|$)`).test(index[i]) : index[i].includes(q)); li.hidden = !hit; if (hit) n++; });
    count.textContent = q ? (n ? `${arNum(n)} من ${arNum(items.length)}` : 'لا حكمة بهذا اللفظ في هذه المختارات') : '';
  });
})();

// Two lives side by side, right to left in time: the Prophet's line and Ali's. Threads join them where they were
// together; after 11 AH Ali's line runs on alone. The track slides under a fixed playhead as you scroll.
const LIVES = {
  span: [[-53, -23, .5], [-23, -13, .9], [-13, 1, 1], [1, 11, 2.6], [11, 35, .55], [35, 40, 2.2]],
  P: [[-53, 'ولادته في عام الفيل'], [-13, 'البعثة في ٢٧ رجب، وله أربعون سنة'], [1, 'الهجرة إلى المدينة'], [11, 'رحيله، ٢٨ صفر، وله ثلاث وستون سنة']],
  A: [[-23, 'ولادته في جوف الكعبة'], [-13, 'أوّل من آمن، وله عشر سنين'], [-10, 'يوم الدار'], [1, 'ليلة المبيت'], [2, 'بدر'], [3, 'أُحد'], [5, 'الخندق'], [7, 'خيبر'], [8, 'الفتح وحُنين'], [9, 'تبوك والمباهلة'], [10, 'غدير خمّ'], [11, 'رحيل النبي، وله ثلاث وثلاثون'], [35, 'البيعة'], [36, 'الجمل'], [37, 'صفّين'], [38, 'النهروان'], [40, 'الشهادة، وله ثلاث وستون']],
  shared: [-13, -10, 1, 2, 3, 5, 7, 8, 9, 10, 11],
};
const lvUnits = LIVES.span.reduce((a, [y0, y1, w]) => a + (y1 - y0) * w, 0);
const lvX = (y) => { let u = 0; for (const [y0, y1, w] of LIVES.span) { if (y <= y1) return (u + (Math.max(y, y0) - y0) * w) / lvUnits; u += (y1 - y0) * w; } return 1; };
const LV_W = 340; // track width in vw
S.lives = {
  init(host, st) {
    const tr = $('#lv-track', host);
    const at = (y) => .04 + lvX(y) * .9; // scroll position when the playhead reaches year y
    const pos = (y) => 50 + lvX(y) * (LV_W - 100); // vw from the track's right edge
    let html = `<i class="lv-lane lv-lane-p" style="right:${pos(-53)}vw;width:${pos(11) - pos(-53)}vw"></i><i class="lv-lane lv-lane-a" style="right:${pos(-23)}vw;width:${pos(40) - pos(-23)}vw"></i>`;
    LIVES.shared.forEach((y) => { html += `<i class="lv-thread" style="right:${pos(y)}vw" data-fx="o 0 1 ${f4(at(y) - .01)} ${f4(at(y) + .01)} | sx 0 1 ${f4(at(y) - .01)} ${f4(at(y) + .01)}"></i>`; });
    const mk = (lane, list) => list.forEach(([y, t], i) => {
      const row = lane === 'p' ? i % 2 : i % 3;
      html += `<div class="lv-ev lv-${lane} r${row}" style="right:${pos(y)}vw" data-fx="o .25 1 ${f4(at(y) - .015)} ${f4(at(y) + .005)}"><i></i><b>${y < 0 ? `${arNum(-y)} ق.هـ` : `${arNum(y)} هـ`}</b><span>${t}</span></div>`;
    });
    mk('p', LIVES.P); mk('a', LIVES.A);
    html += `<p class="lv-alone" style="right:${(pos(11) + pos(35)) / 2}vw" data-fx="o 0 1 ${f4(at(16))} ${f4(at(20))}">أربعٌ وعشرون سنةً وأشهر «ممنوعاً من التصرّف على أحكامها» <span class="src">الإرشاد ١:٩</span></p>`;
    tr.innerHTML = html;
    tr.style.width = `${LV_W}vw`;
    tr.dataset.fx = `x 0vw ${LV_W - 100}vw .04 .94`;
    st.y = $('#lv-y', host);
    st.cv = host.querySelector('canvas'); st.eras = null;
  },
  frame(p, t, host, st) {
    const k = c01((p - .04) / .9);
    let y = -53;
    for (let lo = -53, hi = 40, it = 0; it < 30; it++) { const mid = (lo + hi) / 2; if (lvX(mid) < k) lo = mid; else hi = mid; y = mid; }
    const yr = Math.round(y);
    // the place behind the two lines: Mecca before the Hijra, Medina after it, Kufa from 36 AH
    const cv = st.cv;
    if (fit(cv, .6) || !st.eras) st.eras = [lvMecca, lvMedina, lvKufa].map((paint) => { const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; paint(o.getContext('2d'), o.width, o.height); return o; });
    const c = cv.getContext('2d');
    const w1 = smooth(c01((y - .2) / 1.6)), w2 = smooth(c01((y - 34.5) / 1.5));
    c.globalAlpha = 1; c.drawImage(st.eras[0], 0, 0);
    if (w1 > 0) { c.globalAlpha = w1; c.drawImage(st.eras[1], 0, 0); }
    if (w2 > 0) { c.globalAlpha = w2; c.drawImage(st.eras[2], 0, 0); }
    c.globalAlpha = 1;
    setText(st.y, yr < 0 ? `${arNum(-yr)} ق.هـ` : yr === 0 ? 'الهجرة' : `${arNum(yr)} هـ`);
  },
};


// painted places behind the two lives
const lvSky = (c, W, H, cols) => { const g = c.createLinearGradient(0, 0, 0, H); cols.forEach((k, i) => g.addColorStop(i / (cols.length - 1), k)); c.fillStyle = g; c.fillRect(0, 0, W, H); };
const lvPalm = (c, x, y, h, col) => { c.strokeStyle = col; c.lineWidth = h * .035; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + h * .08, y - h * .5, x + h * .04, y - h); c.stroke(); c.fillStyle = col; for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * .5; c.beginPath(); c.moveTo(x + h * .04, y - h); c.quadraticCurveTo(x + h * .04 + Math.cos(a) * h * .3, y - h + Math.sin(a) * h * .3 - h * .05, x + h * .04 + Math.cos(a) * h * .45, y - h + Math.sin(a) * h * .45 + h * .12); c.quadraticCurveTo(x + h * .04 + Math.cos(a) * h * .25, y - h + Math.sin(a) * h * .2, x + h * .04, y - h + h * .02); c.fill(); } };
const lvShade = (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(13,14,11,.55)'); g.addColorStop(.3, 'rgba(13,14,11,.25)'); g.addColorStop(.75, 'rgba(13,14,11,.45)'); g.addColorStop(1, 'rgba(13,14,11,.9)'); c.fillStyle = g; c.fillRect(0, 0, W, H); };
function lvMecca(c, W, H) {
  lvSky(c, W, H, ['#0a0d1c', '#2a2440', '#6a4a4a']);
  const r = rng(31); for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(240,232,210,${(.2 + r() * .6).toFixed(2)})`; c.fillRect(r() * W, r() * H * .45, 1.4, 1.4); }
  [[.78, '#1d1a24', 40], [.84, '#141219', 26]].forEach(([y, col, amp], n) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (let i = 0; i <= 20; i++) c.lineTo(i / 20 * W, H * y - Math.abs(Math.sin(i * 1.3 + n) * amp + Math.sin(i * .4) * amp * .6) * H / 400); c.lineTo(W, H); c.closePath(); c.fill(); });
  const x = W * .5, y = H * .86, s = H / 90; c.fillStyle = '#060606'; c.fillRect(x - 5 * s, y - 8 * s, 10 * s, 8 * s); c.fillStyle = '#b8913a'; c.fillRect(x - 5 * s, y - 6.4 * s, 10 * s, .9 * s);
  lvShade(c, W, H);
}
function lvMedina(c, W, H) {
  lvSky(c, W, H, ['#4d6a84', '#c9a77a', '#e6c99a']);
  c.fillStyle = '#7c6446'; c.fillRect(0, H * .84, W, H * .16);
  for (let i = 0; i < 14; i++) lvPalm(c, W * (i / 13), H * .86, H * (.12 + (i % 3) * .03), '#2c3220');
  c.fillStyle = '#3a2c1c'; c.fillRect(W * .38, H * .78, W * .24, H * .06); for (let k = 0; k <= 10; k++) { c.fillStyle = '#8a6a44'; c.fillRect(W * (.38 + k * .024), H * .79, W * .004, H * .05); }
  lvShade(c, W, H);
}
function lvKufa(c, W, H) {
  lvSky(c, W, H, ['#1c1830', '#7a3e2e', '#d08a4a']);
  c.fillStyle = '#20160e'; c.fillRect(0, H * .82, W, H * .18);
  const g = c.createLinearGradient(0, H * .86, 0, H * .92); g.addColorStop(0, '#5a4a52'); g.addColorStop(1, '#241a20'); c.fillStyle = g; c.fillRect(0, H * .86, W, H * .05);
  const r = rng(17); for (let i = 0; i < 40; i++) { const w = W * (.02 + r() * .04), h = H * (.02 + r() * .04), x = r() * W; c.fillStyle = '#1a120c'; c.fillRect(x, H * .82 - h, w, h); }
  for (let i = 0; i < 9; i++) lvPalm(c, W * (.05 + i * .12), H * .84, H * (.1 + (i % 2) * .04), '#120c08');
  lvShade(c, W, H);
}

// The muttaqin, clause by clause: each line comes up bright over the lamplit niche, the list climbs, and the
// earlier lines stay behind, dimmer, so the whole portrait builds as you scroll.
S.mtq = {
  init(host, st) {
    st.cv = host.querySelector('canvas'); st.bg = null;
    const items = [...host.querySelectorAll('#mtq-list li')], n = items.length;
    items.forEach((li, i) => { const a = .04 + (i / n) * .9; li.dataset.fx = `o 0 1 ${f4(a)} ${f4(a + .012)} | o 1 .42 ${f4(a + .9 / n)} ${f4(a + 1.6 / n)} | y 18px 0px ${f4(a)} ${f4(a + .02)} out`; });
    const list = host.querySelector('#mtq-list');
    list.dataset.fx = `y 0% -${((n - 4) / n * 100).toFixed(2)}% .04 .94`;
  },
  frame(p, t, host, st) {
    const cv = st.cv;
    if (fit(cv, .6) || !st.bg) { st.bg = document.createElement('canvas'); st.bg.width = cv.width; st.bg.height = cv.height; SCENERY[3](st.bg.getContext('2d'), cv.width, cv.height, cv.height / 100); }
    const c = cv.getContext('2d');
    c.drawImage(st.bg, 0, 0);
    const g = c.createLinearGradient(cv.width, 0, cv.width * .35, 0); g.addColorStop(0, 'rgba(10,9,8,.86)'); g.addColorStop(1, 'rgba(10,9,8,.2)');
    c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
  },
};

// Yemen: terraced mountains at sunrise. The Prophet's prayer for him comes as a wash of light from the north,
// then Ali walks the mountain road down to the valley towns, a veiled figure with the gold disc behind the head
// (scenes/holy.js; no face is ever drawn), the warm light round him.
S.yemen = {
  init(host, st) {
    st.cv = host.querySelector('canvas'); st.bg = null;
    const r = rng(52);
    st.towers = Array.from({ length: 26 }, () => [r(), r(), r()]);
  },
  frame(p, t, host, st) {
    const cv = st.cv;
    const W = cv.width, H = cv.height;
    if (fit(cv) || !st.bg || st.bg.width !== cv.width) {
      const W2 = cv.width, H2 = cv.height;
      st.bg = document.createElement('canvas'); st.bg.width = W2; st.bg.height = H2;
      const c = st.bg.getContext('2d');
      const g = c.createLinearGradient(0, 0, 0, H2 * .7); g.addColorStop(0, '#26304e'); g.addColorStop(.55, '#c8835a'); g.addColorStop(1, '#f2c98e'); c.fillStyle = g; c.fillRect(0, 0, W2, H2);
      const layers = [[.42, '#7a6a7a', 70, 3], [.52, '#5e5060', 90, 5], [.64, '#4a3c34', 110, 7], [.78, '#33281e', 130, 9]];
      layers.forEach(([base, col, amp, seed], li) => {
        const q = rng(seed), pts = []; let v = 0;
        for (let i = 0; i <= 40; i++) { v = v * .75 + (q() - .5) * amp; pts.push([i / 40 * W2, H2 * base - Math.abs(v) * H2 / 900 - Math.sin(i * .3 + seed) * amp * H2 / 1600]); }
        c.fillStyle = col; c.beginPath(); c.moveTo(0, H2); pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(W2, H2); c.closePath(); c.fill();
        // terraces: contour steps that follow the ridge, greener in front
        c.save(); c.clip();
        for (let k = 1; k < 9; k++) {
          c.strokeStyle = li > 1 ? `rgba(120,150,80,${(.18 + li * .04).toFixed(2)})` : 'rgba(255,230,200,.06)'; c.lineWidth = Math.max(1, H2 / 500);
          c.beginPath(); pts.forEach(([x, y], i) => { const yy = y + k * H2 * .018 + Math.sin(i * .7 + k) * H2 * .002; i ? c.lineTo(x, yy) : c.moveTo(x, yy); }); c.stroke();
        }
        c.restore();
        // tower houses on the nearer ridges
        if (li >= 2) st.towers.forEach(([tx, ty, th], i) => { if (i % 2 !== li % 2) return; const x = tx * W2, top = pts[Math.round(tx * 40)][1]; const h = (H2 * .03 + th * H2 * .04) * (li === 3 ? 1.3 : .8), w = h * .45; c.fillStyle = li === 3 ? '#6e5a44' : '#7d6a56'; c.fillRect(x - w / 2, top - h + H2 * .01, w, h); c.fillStyle = 'rgba(245,240,225,.85)'; c.fillRect(x - w / 2, top - h + H2 * .01, w, h * .08); for (let wy = 0; wy < 3; wy++) c.fillRect(x - w * .18, top - h * (.82 - wy * .25) + H2 * .01, w * .36, h * .06); });
      });
    }
    const c = cv.getContext('2d');
    c.drawImage(st.bg, 0, 0);
    // the prayer: a wash of light from the north
    const pr = seg(p, .34, .42) * (1 - seg(p, .55, .68));
    if (pr > 0) { c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(W * .2, -H * .1, 0, W * .2, -H * .1, H * 1.4); g.addColorStop(0, `rgba(255,244,214,${(.55 * pr).toFixed(3)})`); g.addColorStop(1, 'rgba(255,244,214,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
    // the road: from the northern pass down to the valley
    const road = [[.12, .4], [.3, .5], [.22, .6], [.45, .66], [.62, .74], [.5, .84]];
    const k = seg(p, .42, .95) * (road.length - 1), i = Math.min(road.length - 2, Math.floor(k)), f = k - i;
    const [x0, y0] = road[i], [x1, y1] = road[i + 1];
    const x = mix(x0, x1, f) * W, y = mix(y0, y1, f) * H, s = H / 900;
    c.strokeStyle = 'rgba(243,217,143,.35)'; c.lineWidth = 2 * s; c.setLineDash([6 * s, 8 * s]); c.beginPath(); road.forEach(([rx, ry], n) => (n ? c.lineTo(rx * W, ry * H) : c.moveTo(rx * W, ry * H))); c.stroke(); c.setLineDash([]);
    // Ali on the road: walking while he travels it (the stride fitted to each stretch), standing at either end
    const fh = 30 * s, moving = k > 0 && k < road.length - 1;
    c.globalCompositeOperation = 'lighter';
    const gl = c.createRadialGradient(x, y - fh * .5, 0, x, y - fh * .5, 60 * s); gl.addColorStop(0, 'rgba(255,240,200,.45)'); gl.addColorStop(.3, 'rgba(243,217,143,.22)'); gl.addColorStop(1, 'rgba(243,217,143,0)');
    c.fillStyle = gl; c.fillRect(x - 60 * s, y - fh * .5 - 60 * s, 120 * s, 120 * s);
    c.globalCompositeOperation = 'source-over';
    const hd = Holy.draw(c, { who: 'ali', pose: moving ? 'walk' : 'stand', phase: k * 4, x, y, h: fh, t, amb: .85 });
    if (hd) { c.globalCompositeOperation = 'lighter'; const q = c.createRadialGradient(hd.x, hd.y, 0, hd.x, hd.y, hd.r * 5); q.addColorStop(0, 'rgba(255,226,170,.35)'); q.addColorStop(1, 'rgba(255,226,170,0)'); c.fillStyle = q; c.fillRect(hd.x - hd.r * 5, hd.y - hd.r * 5, hd.r * 10, hd.r * 10); c.globalCompositeOperation = 'source-over'; }
  },
};

// His companions: a small painted place for each, drawn once.
(() => {
  const P = {
    nile: (c, W, H) => { lvSky(c, W, H, ['#3a3150', '#c06a48', '#f0b070']); const g = c.createLinearGradient(0, H * .62, 0, H); g.addColorStop(0, '#6a5a6a'); g.addColorStop(1, '#2a2030'); c.fillStyle = g; c.fillRect(0, H * .62, W, H * .38); for (let i = 0; i < 6; i++) lvPalm(c, W * (.06 + i * .17), H * .64, H * (.34 + (i % 2) * .1), '#1c120c'); c.fillStyle = '#1c120c'; c.beginPath(); c.moveTo(W * .55, H * .8); c.lineTo(W * .72, H * .8); c.lineTo(W * .68, H * .86); c.lineTo(W * .58, H * .86); c.fill(); c.beginPath(); c.moveTo(W * .63, H * .8); c.lineTo(W * .63, H * .4); c.lineTo(W * .76, H * .78); c.closePath(); c.fill(); },
    siffin: (c, W, H) => { lvSky(c, W, H, ['#2a0c0a', '#8a2a1c', '#e09a5a']); c.fillStyle = '#2a1410'; c.fillRect(0, H * .7, W, H * .3); const g = c.createLinearGradient(0, H * .74, 0, H * .84); g.addColorStop(0, '#4a3a44'); g.addColorStop(1, '#1a1018'); c.fillStyle = g; c.fillRect(0, H * .74, W, H * .1); c.strokeStyle = '#1a0806'; c.lineWidth = 2; for (let i = 0; i < 40; i++) { const x = (i / 40) * W; c.beginPath(); c.moveTo(x, H * .72); c.lineTo(x + 4, H * .35 + (i % 5) * 6); c.stroke(); } },
    night: (c, W, H) => { lvSky(c, W, H, ['#03040a', '#0e1222', '#1c1a26']); const r = rng(8); for (let i = 0; i < 220; i++) { c.fillStyle = `rgba(240,232,210,${(.2 + r() * .7).toFixed(2)})`; c.fillRect(r() * W, r() * H * .75, 1.3, 1.3); } c.fillStyle = '#0a0908'; c.fillRect(0, H * .8, W, H * .2); const x = W * .7, y = H * .72, gl = c.createRadialGradient(x, y, 0, x, y, H * .35); gl.addColorStop(0, 'rgba(243,217,143,.55)'); gl.addColorStop(1, 'rgba(243,217,143,0)'); c.fillStyle = gl; c.fillRect(0, 0, W, H); },
    palm: (c, W, H) => { lvSky(c, W, H, ['#1d2440', '#8a6a6a', '#e8c49a']); c.fillStyle = '#2a2016'; c.fillRect(0, H * .82, W, H * .18); lvPalm(c, W * .5, H * .84, H * .7, '#120c08'); },
    meadow: (c, W, H) => { lvSky(c, W, H, ['#22304a', '#6a7a6a', '#c8b98a']); c.fillStyle = '#2e3a22'; c.beginPath(); c.moveTo(0, H); c.lineTo(0, H * .7); c.quadraticCurveTo(W * .5, H * .6, W, H * .72); c.lineTo(W, H); c.fill(); c.fillStyle = '#1a2414'; for (let i = 0; i < 7; i++) { const x = W * (.08 + i * .14), h = H * (.3 + (i % 3) * .08); c.beginPath(); c.moveTo(x, H * .74); c.quadraticCurveTo(x - h * .12, H * .74 - h * .5, x, H * .74 - h); c.quadraticCurveTo(x + h * .12, H * .74 - h * .5, x, H * .74); c.fill(); } },
    door: (c, W, H) => { c.fillStyle = '#1a1510'; c.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 14) for (let x = (y / 14) % 2 ? 0 : -14; x < W; x += 28) { c.fillStyle = `rgba(90,72,52,${(.4 + ((x + y) % 7) / 30).toFixed(2)})`; c.fillRect(x + 1, y + 1, 26, 12); } const x = W * .5, w = W * .26, top = H * .22; c.fillStyle = '#0b0805'; c.beginPath(); c.moveTo(x - w / 2, H); c.lineTo(x - w / 2, top + w * .4); c.quadraticCurveTo(x, top - w * .1, x + w / 2, top + w * .4); c.lineTo(x + w / 2, H); c.fill(); const gl = c.createRadialGradient(x, H * .6, 0, x, H * .6, w); gl.addColorStop(0, 'rgba(243,217,143,.55)'); gl.addColorStop(1, 'rgba(243,217,143,0)'); c.fillStyle = gl; c.fillRect(0, 0, W, H); },
  };
  const paint = () => document.querySelectorAll('canvas[data-paint]').forEach((cv) => { fit(cv); const c = cv.getContext('2d'); P[cv.dataset.paint]?.(c, cv.width, cv.height); });
  paint();
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(paint, 200); });
})();

// ---------- canvas scenes ----------
const ctxOf = (cv) => cv.getContext('2d');

// Cover: a twelve-fold rosette in gold thread, turning with the scroll, over a field of stars.
S.cover = {
  init(host, st) {
    st.cv = host.querySelector('canvas');
    const r = rng(1);
    st.stars = Array.from({ length: 260 }, () => [r(), r(), r() * .9 + .1, r() * TAU]);
    // Hero art: the three painted heroes (proto/hero-1..3.html) in a shuffled order, the next one every 14 s
    // with a 1.6 s crossfade. Hidden (so the page stops painting) once the cover has faded it out.
    const art = st.art = host.querySelector('.hero-art'), pages = [1, 2, 3].sort(() => Math.random() - .5);
    let i = 0, cur = null;
    const show = () => {
      const f = document.createElement('iframe');
      f.src = `proto/hero-${pages[i++ % 3]}.html?embed`; f.tabIndex = -1; f.title = 'عليّ';
      f.onload = () => { requestAnimationFrame(() => f.classList.add('on')); const old = cur; cur = f; if (old) setTimeout(() => old.remove(), 1700); };
      art.append(f);
    };
    show();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(() => { if (!document.hidden && !art.hidden) show(); }, 14000);
  },
  frame(p, t, host, st) {
    st.art.hidden = p > .68;
    const cv = st.cv;
    fit(cv);
    const c = ctxOf(cv), W = cv.width, H = cv.height, s = W / cv.clientWidth;
    c.fillStyle = PAL.ink; c.fillRect(0, 0, W, H);
    st.stars.forEach(([x, y, m, ph]) => {
      c.fillStyle = rgba(PAL.paper, (.15 + .35 * m) * (.75 + .25 * Math.sin(t * 1.3 + ph)));
      c.fillRect(x * W, y * H, s * m * 1.6, s * m * 1.6);
    });
    const cx = W / 2, cy = H * .5, R = Math.min(W, H) * .43;
    const fade = 1 - seg(p, .66, .9);
    c.save();
    c.translate(cx, cy);
    c.rotate(p * .9 + t * .01);
    c.lineWidth = s;
    for (let ring = 0; ring < 3; ring++) {
      const rr = R * (1 - ring * .26);
      const n = 12;
      c.strokeStyle = rgba(PAL.gold, (.34 - ring * .08) * fade);
      c.beginPath();
      for (let k = 0; k <= n; k++) {
        const a1 = (k / n) * TAU, a2 = ((k + 5) / n) * TAU;
        c.moveTo(Math.cos(a1) * rr, Math.sin(a1) * rr);
        c.lineTo(Math.cos(a2) * rr, Math.sin(a2) * rr);
      }
      c.stroke();
      c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.stroke();
      c.rotate(TAU / 24);
    }
    c.restore();
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, R * 1.25);
    g.addColorStop(0, rgba(PAL.ink, .0)); g.addColorStop(.55, rgba(PAL.ink, .25)); g.addColorStop(1, rgba(PAL.ink, .95));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const k = seg(p, .78, 1);
    if (k > 0) {
      const gr = c.createRadialGradient(cx, cy, 0, cx, cy, R * (.05 + k * .5));
      gr.addColorStop(0, rgba(PAL.goldHi, .9 * k)); gr.addColorStop(1, rgba(PAL.goldHi, 0));
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
    }
  },
};

// Birth: the sky over the Kaaba. Night, the wall opens; three days pass as a time-lapse; the fourth dawn.
// «ثم خرجت بعد الرابع وبيدها أمير المؤمنين»: the orb that comes out of the wall shows Fatima bint Asad with the newborn
// in her arms, painted once into the orb's background: she is a faceless dark silhouette (not one of the five); he is
// a white swaddled bundle, the face wrapped, a small gold disc behind his head in the colours of scenes/holy.js.
function kbNewborn() {
  const n = 512, o = document.createElement('canvas'); o.width = o.height = n;
  const c = o.getContext('2d'), x = n / 2, y = n * .86, h = n * .66, hy = y - h * .9;
  const halo = c.createRadialGradient(x, n * .5, 0, x, n * .5, n * .5);
  halo.addColorStop(0, 'rgba(255,246,222,.85)'); halo.addColorStop(.3, 'rgba(243,217,143,.55)'); halo.addColorStop(.68, 'rgba(243,217,143,0)');
  c.fillStyle = halo; c.fillRect(0, 0, n, n);
  c.beginPath(); c.moveTo(x - h * .05, hy - h * .07); // her chador, from the head to the ground
  c.quadraticCurveTo(x - h * .12, hy - h * .05, x - h * .13, hy + h * .1);
  c.bezierCurveTo(x - h * .2, y - h * .45, x - h * .22, y - h * .15, x - h * .24, y);
  c.quadraticCurveTo(x, y + h * .02, x + h * .24, y);
  c.bezierCurveTo(x + h * .22, y - h * .15, x + h * .2, y - h * .45, x + h * .13, hy + h * .1);
  c.quadraticCurveTo(x + h * .12, hy - h * .05, x + h * .05, hy - h * .07);
  c.quadraticCurveTo(x, hy - h * .1, x - h * .05, hy - h * .07); c.closePath();
  const q = c.createLinearGradient(x - h * .24, 0, x + h * .24, 0); q.addColorStop(0, '#120e14'); q.addColorStop(1, '#2c2129');
  c.fillStyle = q; c.fill(); c.strokeStyle = 'rgba(255,224,170,.7)'; c.lineWidth = n * .006; c.stroke();
  const bx = x + h * .01, by = y - h * .57, hx = bx + h * .13, hb = by - h * .045, R = h * .09; // the bundle, his head to the right
  const dq = c.createRadialGradient(hx, hb, 0, hx, hb, R); dq.addColorStop(0, '#f8e6a8'); dq.addColorStop(.72, '#d9ad52'); dq.addColorStop(1, '#a87c2c');
  c.beginPath(); c.arc(hx, hb, R, 0, TAU); c.fillStyle = dq; c.fill(); c.strokeStyle = '#fbe7ad'; c.lineWidth = R * .06; c.stroke();
  c.strokeStyle = 'rgba(120,85,30,.45)'; c.lineWidth = R * .02; c.beginPath(); c.arc(hx, hb, R * .84, 0, TAU); c.stroke();
  const wq = c.createLinearGradient(0, by - h * .06, 0, by + h * .06); wq.addColorStop(0, '#fbf6ea'); wq.addColorStop(1, '#d8cfbc'); c.fillStyle = wq;
  c.beginPath(); c.ellipse(bx, by, h * .17, h * .06, -.28, 0, TAU); c.fill();
  c.beginPath(); c.arc(hx, hb, h * .052, 0, TAU); c.fill(); // the wrapped head
  c.strokeStyle = 'rgba(150,135,110,.5)'; c.lineWidth = n * .003; c.beginPath();
  for (let k = -1; k <= 1; k++) { c.moveTo(bx - h * .05 + k * h * .045, by - h * .04); c.quadraticCurveTo(bx - h * .035 + k * h * .045, by, bx - h * .055 + k * h * .045, by + h * .04); }
  c.stroke();
  c.fillStyle = '#251b22'; c.beginPath(); c.ellipse(bx - h * .02, by + h * .045, h * .18, h * .035, -.2, 0, Math.PI); c.fill(); // her sleeves under him
  return o.toDataURL();
}
S.kaaba = {
  init(host, st) {
    st.cv = host.querySelector('canvas');
    st.day = host.querySelector('#kb-day');
    st.seam = host.querySelector('.kb-seam');
    st.orb = host.querySelector('.kb-orb');
    if (st.orb) st.orb.style.background = `url(${kbNewborn()}) center / contain no-repeat`;
    const r = rng(4);
    st.stars = Array.from({ length: 320 }, () => [r(), r() * .7, r()]);
    const ridge = (seed, base, amp) => { const q = rng(seed); let v = 0; return Array.from({ length: 41 }, (_, i) => { v += (q() - .5) * amp; v *= .8; return base + v + Math.sin(i * .45 + seed) * amp * .5; }); };
    st.hills = [ridge(2, .6, .05), ridge(5, .64, .04), ridge(8, .69, .03)];
  },
  frame(p, t, host, st) {
    const cv = st.cv;
    fit(cv);
    const c = ctxOf(cv), W = cv.width, H = cv.height;
    // time of day: 0 midnight, .5 noon. Four days run over p .36–.70 («ثم خرجت بعد الرابع»); then the dawn after.
    let tod, dayN = p >= .7 ? 4 : 1;
    if (p < .36) tod = .08 + p * .1;
    else if (p < .7) { const ph = seg(p, .36, .7) * 4; dayN = Math.min(4, Math.floor(ph) + 1); tod = (ph % 1 + .12) % 1; if (ph >= 4) tod = .12; }
    else tod = mix(.12, .3, seg(p, .7, .95));
    setText(st.day, arNum(dayN));
    const sun = Math.sin((tod - .25) * TAU);            // -1 midnight … 1 noon
    const lit = c01(sun * 1.1 + .25);
    host.style.setProperty('--lit', lit.toFixed(3));
    const skyTop = lit > .5 ? mixC('#3b4a6b', '#9fb2c4', (lit - .5) * 2) : mixC('#05070f', '#3b4a6b', lit * 2);
    const skyBot = lit > .5 ? mixC('#c9875a', '#e6dcc3', (lit - .5) * 2) : mixC('#0b1020', '#c9875a', lit * 2);
    const g = c.createLinearGradient(0, 0, 0, H * .7);
    g.addColorStop(0, skyTop); g.addColorStop(1, skyBot);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const sa = 1 - c01(lit * 1.6);
    if (sa > 0) st.stars.forEach(([x, y, m]) => { c.fillStyle = rgba(PAL.paper, sa * (.25 + .6 * m) * (.8 + .2 * Math.sin(t * 2 + m * 9))); c.fillRect(x * W, y * H, 1.4 * m + .6, 1.4 * m + .6); });
    // the sun and the moon on opposite sides of one arc
    const ang = (tod - .25) * TAU;
    const ax = W * .5, ay = H * .72, rx = W * .48, ry = H * .6;
    const body = (a, col, rad, glow) => {
      const x = ax + Math.cos(a) * rx, y = ay - Math.sin(a) * ry;
      if (y > H * .72) return;
      const gg = c.createRadialGradient(x, y, 0, x, y, rad * glow);
      gg.addColorStop(0, col); gg.addColorStop(.2, rgba(PAL.goldHi, .25)); gg.addColorStop(1, rgba(PAL.goldHi, 0));
      c.fillStyle = gg; c.fillRect(x - rad * glow, y - rad * glow, rad * glow * 2, rad * glow * 2);
      c.fillStyle = col; c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill();
    };
    const m = Math.min(W, H);
    body(ang, '#fff4d0', m * .028, 9);
    body(ang + Math.PI, 'rgba(235,228,205,.9)', m * .02, 4);
    // the hills of Mecca
    st.hills.forEach((pts, i) => {
      const shade = .5 + i * .2;
      c.fillStyle = mixC(mixC('#050608', '#2a2318', lit * .9), '#0d0e0b', 1 - shade * .7);
      c.beginPath(); c.moveTo(0, H);
      pts.forEach((v, k) => c.lineTo((k / (pts.length - 1)) * W, v * H));
      c.lineTo(W, H); c.closePath(); c.fill();
    });
    // the courtyard floor
    const fg = c.createLinearGradient(0, H * .7, 0, H);
    fg.addColorStop(0, mixC('#16140f', '#b9ad90', lit * .55)); fg.addColorStop(1, mixC('#0a0a08', '#8f8670', lit * .4));
    c.fillStyle = fg; c.fillRect(0, H * .72, W, H * .28);
    // light from inside the House while the wall is open
    const open = Math.max(seg(p, .15, .22) * (1 - seg(p, .28, .36)), seg(p, .7, .78));
    const cr = cv.getBoundingClientRect(), sr = st.seam.getBoundingClientRect();
    const sx = (sr.left + sr.width * .45 - cr.left), sy = (sr.top + sr.height * .55 - cr.top);
    st.orb.style.left = `${sx}px`; st.orb.style.top = `${sy}px`;
    if (open > 0) {
      const x = sx * (W / cv.clientWidth), y = sy * (H / cv.clientHeight);
      const gg = c.createRadialGradient(x, y, 0, x, y, m * .7);
      gg.addColorStop(0, rgba(PAL.goldHi, .8 * open)); gg.addColorStop(.25, rgba(PAL.goldHi, .25 * open)); gg.addColorStop(1, rgba(PAL.goldHi, 0));
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = gg; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
    }
  },
};
function mixC(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(mix((pa >> s) & 255, (pb >> s) & 255, c01(k)));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

// A thousand freed: each bound point loses its link and rises as gold.
S.freed = {
  init(host, st) {
    st.cv = host.querySelector('canvas');
    st.n = host.querySelector('#fr-n');
    const r = rng(12);
    const N = 1000, cols = 40;
    st.d = Array.from({ length: N }, (_, i) => ({ c: i % cols, r: Math.floor(i / cols), at: 0, ph: r() * TAU, dx: (r() - .5), up: .5 + r() }));
    const order = [...Array(N).keys()].sort(() => r() - .5);
    order.forEach((idx, k) => { st.d[idx].at = .06 + (k / N) * .8 + r() * .01; });
    st.sorted = st.d.map((d) => d.at).sort((a, b) => a - b);
  },
  frame(p, t, host, st) {
    const cv = st.cv;
    fit(cv);
    const c = ctxOf(cv), W = cv.width, H = cv.height, s = W / cv.clientWidth;
    c.fillStyle = PAL.ink; c.fillRect(0, 0, W, H);
    const narrow = cv.clientWidth < 700;
    const gw = narrow ? W * .9 : W * .52, gh = narrow ? H * .42 : H * .62;
    const ox = narrow ? W * .05 : W * .06, oy = narrow ? H * .5 : H * .2;
    const dx = gw / 40, dy = gh / 25, rad = Math.min(dx, dy) * .2;
    let freed = 0;
    for (const d of st.d) {
      const x = ox + (d.c + .5) * dx, y = oy + (d.r + .5) * dy;
      const k = seg(p, d.at, d.at + .05);
      if (k <= 0) {
        c.fillStyle = 'rgba(150,140,120,.55)';
        c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        c.strokeStyle = 'rgba(120,112,96,.5)'; c.lineWidth = s * .8;
        c.beginPath(); c.arc(x, y + rad * 2.2, rad * 1.1, 0, TAU); c.stroke();
      } else {
        freed++;
        const lift = smooth(k) * dy * 3 * d.up + seg(p, d.at + .05, 1.2) * dy * 4 * d.up;
        const yy = y - lift, xx = x + Math.sin(t * .8 + d.ph) * rad * .6 * k + d.dx * lift * .2;
        const gg = c.createRadialGradient(xx, yy, 0, xx, yy, rad * 2.6);
        gg.addColorStop(0, rgba(PAL.goldHi, .55)); gg.addColorStop(1, rgba(PAL.gold, 0));
        c.fillStyle = gg; c.fillRect(xx - rad * 2.6, yy - rad * 2.6, rad * 5.2, rad * 5.2);
        c.fillStyle = PAL.goldHi; c.fillRect(xx - rad * .55, yy - rad * .55, rad * 1.1, rad * 1.1);
        if (k < 1) { // the broken link, two halves flying apart
          c.strokeStyle = rgba(PAL.paperDim, .7 * (1 - k)); c.lineWidth = s;
          c.beginPath(); c.arc(x - k * rad * 4, y + rad * 2.2 + k * rad * 3, rad, Math.PI * .5, Math.PI * 1.5); c.stroke();
          c.beginPath(); c.arc(x + k * rad * 4, y + rad * 2.2 + k * rad * 3, rad, -Math.PI * .5, Math.PI * .5); c.stroke();
        }
      }
    }
    setText(st.n, arNum(freed));
  },
};

// The pledge: people pour in from every side like the thick mane of a hyena.
S.rush = {
  init(host, st) {
    st.cv = host.querySelector('canvas');
    const r = rng(33);
    st.q = Array.from({ length: 2600 }, () => {
      const a = r() * TAU;
      const r0 = 1.05 + r() * .5, r1 = .07 + Math.pow(r(), .7) * .34;
      return { a, r0, r1, curl: (r() - .5) * 1.1, t0: r() * .32, len: .18 + r() * .2, w: .6 + r() * 1.2 };
    });
  },
  frame(p, t, host, st) {
    const cv = st.cv;
    fit(cv);
    const c = ctxOf(cv), W = cv.width, H = cv.height, s = W / cv.clientWidth;
    c.fillStyle = PAL.ink; c.fillRect(0, 0, W, H);
    const cx = W * (cv.clientWidth < 700 ? .5 : .38), cy = H * .56, R = Math.hypot(W, H) * .5;
    const dim = 1 - .6 * seg(p, .55, .66);
    const at = (q, pp) => {
      const k = ease.out(seg(pp, q.t0, q.t0 + q.len));
      const rr = mix(q.r0, q.r1, k) * R;
      const a = q.a + q.curl * (1 - k) * .9;
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .78];
    };
    c.lineCap = 'round';
    for (const q of st.q) {
      if (p < q.t0 - .02) continue;
      const [x1, y1] = at(q, p), [x0, y0] = at(q, p - .035);
      const moving = Math.hypot(x1 - x0, y1 - y0);
      c.strokeStyle = rgba(moving > 2 * s ? PAL.sand : PAL.paperDim, (.25 + .35 * Math.min(1, moving / (8 * s))) * dim);
      c.lineWidth = q.w * s;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 + .5, y1 + .5); c.stroke();
    }
    const glow = (x, y, rad, a) => { const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, rgba(PAL.goldHi, a)); g.addColorStop(1, rgba(PAL.goldHi, 0)); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
    const m = Math.min(W, H);
    glow(cx, cy, m * .09, .9);
    glow(cx - m * .045, cy + m * .035, m * .035, .7);
    glow(cx + m * .045, cy + m * .035, m * .035, .7);
  },
};

// The Camel: the howdah fills with arrows until it bristles like a hedgehog; then the camel goes down.
S.jamal = {
  init(host, st) {
    st.cv = host.querySelector('canvas');
    const r = rng(36);
    st.arrows = Array.from({ length: 340 }, (_, i) => {
      const side = r() < .5 ? -1 : 1;
      const u = r(), v = r();
      return { u, v, at: .32 + Math.pow(i / 340, .85) * .5, ang: (side < 0 ? Math.PI : 0) + (r() - .5) * 1.1 + (v - .5) * .6, len: .1 + r() * .07 };
    });
    st.dust = Array.from({ length: 50 }, () => [r(), r(), r()]);
  },
  frame(p, t, host, st) {
    const cv = st.cv;
    fit(cv);
    const c = ctxOf(cv), W = cv.width, H = cv.height, s = W / cv.clientWidth;
    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#2a2218'); sky.addColorStop(.7, '#5a4630'); sky.addColorStop(1, '#2b2116');
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    for (const [x, y, m] of st.dust) {
      const xx = ((x + t * .01 * (m + .3)) % 1) * W, yy = (y * .8 + .1) * H;
      const rr = (30 + 90 * m) * s, g = c.createRadialGradient(xx, yy, 0, xx, yy, rr);
      g.addColorStop(0, rgba(PAL.sand, .05 + .05 * m)); g.addColorStop(1, rgba(PAL.sand, 0));
      c.fillStyle = g; c.fillRect(xx - rr, yy - rr, rr * 2, rr * 2);
    }
    const m = Math.min(W, H);
    const fall = ease.in(seg(p, .82, .88));
    const narrow = cv.clientWidth < 700;
    const cx = W * (narrow ? .5 : .42), base = H * (narrow ? .7 : .78) + fall * H * .12;
    const hw = m * (narrow ? .46 : .4), hh = hw * .62;
    c.save();
    c.translate(cx, base);
    c.rotate(-fall * .14);
    // the camel's back beneath
    c.fillStyle = '#1a140d';
    c.beginPath(); c.ellipse(0, hh * .2, hw * 1.15, hh * .5, 0, Math.PI, TAU); c.fill();
    // howdah: box, dome, cloth folds, gold trim
    const top = -hh * 1.25;
    const shape = () => { c.beginPath(); c.moveTo(-hw * .55, 0); c.lineTo(-hw * .55, -hh * .7); c.quadraticCurveTo(-hw * .55, top, 0, top); c.quadraticCurveTo(hw * .55, top, hw * .55, -hh * .7); c.lineTo(hw * .55, 0); c.closePath(); };
    const cloth = c.createLinearGradient(-hw * .55, 0, hw * .55, 0);
    cloth.addColorStop(0, '#3d0f0c'); cloth.addColorStop(.45, '#7a231d'); cloth.addColorStop(1, '#2e0b09');
    shape(); c.fillStyle = cloth; c.fill();
    c.save(); shape(); c.clip();
    for (let k = -6; k <= 6; k++) { c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = hw * .03; c.beginPath(); c.moveTo(k * hw * .085, 0); c.quadraticCurveTo(k * hw * .07, -hh * .7, k * hw * .02, top); c.stroke(); }
    c.restore();
    c.strokeStyle = rgba(PAL.gold, .8); c.lineWidth = 2 * s; shape(); c.stroke();
    c.fillStyle = rgba(PAL.gold, .85); c.fillRect(-hw * .58, -hh * .08, hw * 1.16, hh * .08);
    // arrows, lodged where they struck
    for (const a of st.arrows) {
      if (p < a.at) continue;
      const x = (a.u - .5) * hw * 1.02;
      const yMax = Math.abs(x) < hw * .3 ? top + hh * .12 : -hh * .7 - (1 - Math.abs(x) / (hw * .55)) * hh * .4;
      const y = mix(-hh * .06, yMax, a.v);
      const L = a.len * hw * (1 + .2 * ease.out(seg(p, a.at, a.at + .01)));
      const ex = x + Math.cos(a.ang) * L, ey = y + Math.sin(a.ang) * L * .6 - L * .25;
      c.strokeStyle = '#c8b48a'; c.lineWidth = 1.2 * s;
      c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke();
      const fa = Math.atan2(ey - y, ex - x);
      c.strokeStyle = '#e9e1cc'; c.lineWidth = 1 * s;
      for (const sgn of [-1, 1]) { c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex - Math.cos(fa + sgn * .5) * L * .14, ey - Math.sin(fa + sgn * .5) * L * .14); c.stroke(); }
    }
    c.restore();
    // ground
    c.fillStyle = '#1f180f'; c.fillRect(0, H * .86, W, H * .14);
  },
};
})();
