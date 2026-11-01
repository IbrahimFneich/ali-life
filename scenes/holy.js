// Ali Life: the five of the Kisa (the Prophet ﷺ, Ali, Fatima, al-Hasan, al-Husayn) as veiled figures, the
// convention of the Persian miniatures: the face is never drawn, a white veil hangs from under the turban (Fatima:
// from under the chador) to the chest, and a flat gold disc stands behind the head ("B1", the user's pick on
// 2026-11-01, replacing the balls of light). Everyone else stays a faceless silhouette, as before.
//
// Holy.draw(g, o) draws one person in one pose. Origin (o.x, o.y) is the ground point under the figure; o.h is the
// STANDING height in px for every pose, so a seated or lying figure keeps the same scale as a standing one.
//   who    'prophet' | 'ali' | 'fatima' | 'hasan' | 'husayn'
//   pose   'stand' | 'walk' | 'sit' | 'lie' | 'sujud' | 'ruku' | 'fight' | 'ride' | 'above' (a map: upright on its shadow)
//   t      seconds (cloth sway, walking, the mount's legs); phase 0..1 (walk cycle, the sword's swing)
//   flip   mirror (side poses face right by default); amb 0..1 cloth lighting (1 day, ~.25 night)
//   alpha  fade; glow 0..1 the disc's light on the dark (default from amb); child: a child's proportions
//   arms   [[dx, dy], ...] hand targets in units of h from the origin (dy < 0 is up): sleeves, no hands
//   sword  true: Dhul-Fiqar hangs at the side; fight pose draws it in the swing
//   raise  0..1 lifts the head and shoulders of 'lie' (a head on a lap); mount 'mule' | 'horse' for 'ride'
// Holy.head(o) returns {x, y, r}: the head centre and radius in px, for blooms and pools of light in a scene.
(() => {
  const TAU = Math.PI * 2;
  const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const NIGHT = [6, 7, 12];
  const PAL = {
    prophet: { cloak: ['#173a2d', '#2f6e52'], robe: '#e9e2d0', turban: '#f2ede1', disc: 1.12 },
    ali: { cloak: ['#33251a', '#5e4631'], robe: '#d9cfb8', turban: '#2e7558', disc: 1 },
    fatima: { cloak: ['#141726', '#2b3150'], robe: '#3a3f5c', chador: true, disc: 1 },
    hasan: { cloak: ['#1c4038', '#33695c'], robe: '#e2dac6', turban: '#f2ede1', disc: 1 },
    husayn: { cloak: ['#4a1a18', '#83352a'], robe: '#e2dac6', turban: '#f2ede1', disc: 1 },
  };
  const MOUNT = { mule: ['#cfc7b8', '#9d968a'], horse: ['#4a3324', '#2a1d14'] };

  // the person's colours under this light
  function tones(o) {
    const P = PAL[o.who] || PAL.ali, amb = o.amb ?? 1, k = 1 - Math.max(.18, Math.min(1, amb));
    const sh = (s) => mix(hex(s), NIGHT, k * .9);
    return {
      P, k, c0: sh(P.cloak[0]), c1: sh(P.cloak[1]), robe: sh(P.robe), turban: mix(hex(P.turban || P.cloak[1]), NIGHT, k * (P.turban && P.turban > '#c' ? .45 : .9)),
      veil: mix([247, 242, 230], [200, 190, 170], k * .45),
      glow: o.glow ?? Math.min(1, k * 1.1),
    };
  }
  const geo = (o) => { const r = o.h * (o.child ? .09 : .072); return { r, sw: o.h * (o.child ? .118 : .125) * 1.14, hw: o.h * .175 * 1.14 }; };

  // ---------- parts ----------
  function disc(g, x, y, r, T, o) {
    const R = r * 2.5 * T.P.disc;
    if (T.glow > 0) {
      g.globalCompositeOperation = 'lighter';
      const q = g.createRadialGradient(x, y, R * .5, x, y, R * 2.4);
      q.addColorStop(0, `rgba(255,214,150,${.32 * T.glow})`); q.addColorStop(1, 'rgba(255,214,150,0)');
      g.fillStyle = q; g.fillRect(x - R * 2.4, y - R * 2.4, R * 4.8, R * 4.8);
      g.globalCompositeOperation = 'source-over';
    }
    const q = g.createRadialGradient(x, y, 0, x, y, R);
    q.addColorStop(0, '#f8e6a8'); q.addColorStop(.72, '#d9ad52'); q.addColorStop(1, '#a87c2c');
    g.beginPath(); g.arc(x, y, R, 0, TAU); g.fillStyle = q; g.fill();
    g.strokeStyle = '#fbe7ad'; g.lineWidth = Math.max(.8, R * .04); g.stroke();
    if (R > 6) {
      g.strokeStyle = 'rgba(120,85,30,.45)'; g.lineWidth = Math.max(.5, R * .015);
      g.beginPath(); g.arc(x, y, R * .84, 0, TAU); g.stroke();
      if (R > 14) for (let i = 0; i < 60; i++) { const a = i / 60 * TAU; g.beginPath(); g.moveTo(x + Math.cos(a) * R * .87, y + Math.sin(a) * R * .87); g.lineTo(x + Math.cos(a) * R * .96, y + Math.sin(a) * R * .96); g.stroke(); }
    }
  }
  // the veil hangs from under the turban to the chest; tilt turns it with the head (side poses)
  function veil(g, x, y, r, T, tilt = 0, top = -.35) {
    g.save(); g.translate(x, y); g.rotate(tilt);
    g.beginPath();
    g.moveTo(-r * 1.05, r * top); g.lineTo(r * 1.05, r * top);
    g.bezierCurveTo(r * 1.2, r * 1.2, r * 1.7, r * 2.4, r * 1.55, r * 3.3);
    g.quadraticCurveTo(0, r * 3.9, -r * 1.55, r * 3.3);
    g.bezierCurveTo(-r * 1.7, r * 2.4, -r * 1.2, r * 1.2, -r * 1.05, r * top);
    const q = g.createLinearGradient(-r * 1.5, 0, r * 1.5, 0), v = T.veil;
    q.addColorStop(0, css(mix(v, [0, 0, 0], .13))); q.addColorStop(.5, css(v)); q.addColorStop(1, css(mix(v, [0, 0, 0], .17)));
    g.fillStyle = q; g.fill();
    if (r > 4) {
      g.strokeStyle = 'rgba(140,130,110,.4)'; g.lineWidth = Math.max(.5, r * .05); g.beginPath();
      g.moveTo(-r * .45, 0); g.quadraticCurveTo(-r * .6, r * 1.9, -r * .5, r * 3.4);
      g.moveTo(r * .4, 0); g.quadraticCurveTo(r * .55, r * 1.9, r * .45, r * 3.4); g.stroke();
    }
    g.restore();
  }
  function turban(g, x, y, r, T, tilt = 0) {
    g.save(); g.translate(x, y); g.rotate(tilt);
    g.beginPath(); g.ellipse(0, -r * .42, r * 1.25, r * .8, 0, 0, TAU); g.fillStyle = css(T.turban); g.fill();
    if (r > 4) {
      g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = Math.max(.5, r * .05);
      for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(0, -r * (.75 - k * .28), r * (1.05 + k * .08), r * .32, -.12, .2, Math.PI - .2); g.stroke(); }
    }
    g.restore();
  }
  // Fatima: the chador covers the head and falls over the shoulders; the veil hangs inside it
  function hood(g, x, y, r, T, tilt = 0, inner = true) {
    g.save(); g.translate(x, y); g.rotate(tilt);
    g.beginPath(); g.moveTo(-r * 1.75, r * 2.6);
    g.bezierCurveTo(-r * 1.8, r * .2, -r * 1.3, -r * 1.55, 0, -r * 1.6);
    g.bezierCurveTo(r * 1.3, -r * 1.55, r * 1.8, r * .2, r * 1.75, r * 2.6); g.closePath();
    const q = g.createLinearGradient(-r * 1.7, 0, r * 1.7, 0); q.addColorStop(0, css(T.c0)); q.addColorStop(1, css(T.c1));
    g.fillStyle = q; g.fill();
    g.restore();
    if (inner) veil(g, x, y, r * .86, T, tilt, -.7);
  }
  // hang: a bowed head (ruku, sujud). The turban or chador turns with the head; the veil hangs straight down from
  // the face side, as cloth does, instead of lying along the chest
  function headGroup(g, x, y, r, T, o, tilt = 0, hang = false) {
    const fx = x + Math.sin(tilt) * r * .45, fy = y + Math.cos(tilt) * r * .2;
    if (T.P.chador) { hood(g, x, y, r, T, tilt, !hang); if (hang) veil(g, fx, fy, r * .7, T, 0, -.3); }
    else if (hang) { veil(g, fx, fy, r * .78, T, 0, -.3); turban(g, x, y, r, T, tilt); }
    else { veil(g, x, y, r, T, tilt); turban(g, x, y, r, T, tilt); }
  }
  function rim(g, T) { if (T.glow > 0) { g.strokeStyle = `rgba(255,214,150,${.5 * T.glow})`; g.lineWidth = Math.max(.8, g.lineWidth); g.stroke(); } }
  function fillCloak(g, x0, x1, T) {
    const q = g.createLinearGradient(x0, 0, x1, 0); q.addColorStop(0, css(T.c0)); q.addColorStop(1, css(T.c1));
    g.fillStyle = q; g.fill();
  }
  // a sleeve from the shoulder to a hand point: tapered, a pale cuff, no hand
  function sleeve(g, sx, sy, ex, ey, w, T) {
    const dx = ex - sx, dy = ey - sy, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    g.beginPath();
    g.moveTo(sx + nx * w / 2, sy + ny * w / 2); g.lineTo(ex + nx * w * .36, ey + ny * w * .36);
    g.arc(ex, ey, w * .36, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI);
    g.lineTo(sx - nx * w / 2, sy - ny * w / 2); g.closePath();
    g.fillStyle = css(mix(T.c1, T.c0, .4)); g.fill();
    g.beginPath(); g.arc(ex, ey, w * .3, 0, TAU); g.fillStyle = css(T.robe); g.fill();
  }
  // Dhul-Fiqar: the forked, curved blade of the site's Uhud scene (its SVG paths), grip at (gx, gy), blade along ang
  const ZF = typeof Path2D === 'function' ? {
    blade: new Path2D('M912 166 C 770 222, 520 252, 340 220 C 270 206, 205 160, 170 100 C 200 150, 250 210, 300 245 C 220 220, 110 170, 40 124 C 120 196, 300 292, 520 298 C 700 302, 852 254, 936 212 Z'),
    grip: new Path2D('M948 162 C 1010 142, 1068 118, 1108 104 C 1134 95, 1160 108, 1158 132 C 1156 152, 1138 162, 1122 153 C 1078 166, 1020 186, 962 202 Z'),
    guard: new Path2D('M902 150 C 890 146, 874 138, 870 124 C 866 108, 884 100, 894 110 C 902 118, 902 132, 916 146 L 944 160 C 950 186, 946 214, 952 240 C 956 256, 968 262, 966 276 C 964 292, 940 294, 936 278 C 932 262, 944 252, 938 236 C 930 214, 926 196, 918 186 Z'),
  } : null;
  function sword(g, gx, gy, ang, len, T, mirror) {
    if (!ZF) return;
    g.save(); g.translate(gx, gy); g.rotate(ang - Math.PI); if (mirror) g.scale(1, -1); g.scale(len / 1000, len / 1000); g.translate(-1000, -175);
    const q = g.createLinearGradient(0, 100, 0, 300); q.addColorStop(0, '#fff3cf'); q.addColorStop(.4, '#d9c27e'); q.addColorStop(.75, '#8a7038'); q.addColorStop(1, '#f3d98f');
    g.fillStyle = q; g.fill(ZF.blade); g.strokeStyle = `rgba(255,240,200,${.6 + .4 * T.glow})`; g.lineWidth = 6; g.stroke(ZF.blade);
    g.fillStyle = '#9c7a34'; g.fill(ZF.grip); g.fillStyle = '#e3c674'; g.fill(ZF.guard);
    g.restore();
  }

  // ---------- poses ----------
  // standing, front: a cloak from the shoulders to the ground; walk swings the hem and bobs
  function stand(g, o, T) {
    const { x, h } = o, { r, sw, hw } = geo(o), t = o.t || 0;
    const walk = o.pose === 'walk' ? Math.sin((o.phase ?? t * .9) * TAU) : 0;
    const y = o.y - Math.abs(walk) * h * .012, sway = Math.sin(t * .9 + (o.seed || 0)) * h * .012 + walk * h * .035;
    const hy = y - h + r * 1.25, ny = y - h + r * 2.35;
    disc(g, x, hy - r * .2, r, T, o);
    g.beginPath();
    g.moveTo(x - r * .6, ny);
    g.quadraticCurveTo(x - sw * .85, ny + r * .15, x - sw, ny + r * 1.1);
    g.bezierCurveTo(x - sw * 1.1, y - h * .42, x - hw + sway, y - h * .16, x - hw + sway * 1.2, y);
    g.quadraticCurveTo(x + sway, y + h * .018, x + hw + sway * 1.2, y);
    g.bezierCurveTo(x + hw + sway, y - h * .16, x + sw * 1.1, y - h * .42, x + sw, ny + r * 1.1);
    g.quadraticCurveTo(x + sw * .85, ny + r * .15, x + r * .6, ny);
    g.closePath();
    fillCloak(g, x - hw, x + hw, T); g.lineWidth = Math.max(.8, h * .005); rim(g, T);
    if (h > 40) {
      g.save(); g.clip();
      g.fillStyle = css(T.robe, .22); g.beginPath(); g.moveTo(x - h * .012, y - h * .74); g.lineTo(x + h * .012, y - h * .74); g.lineTo(x + h * .035 + sway, y); g.lineTo(x - h * .03 + sway, y); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = Math.max(.7, h * .006); g.beginPath();
      g.moveTo(x - h * .05, y - h * .66); g.quadraticCurveTo(x - h * .07, y - h * .3, x - h * .1 + sway, y);
      g.moveTo(x + h * .05, y - h * .64); g.quadraticCurveTo(x + h * .08, y - h * .3, x + h * .11 + sway, y); g.stroke();
      g.restore();
    }
    const sh = [[x - sw * .92, ny + r * 1.3], [x + sw * .92, ny + r * 1.3]];
    if (o.sword && o.pose !== 'fight') sword(g, x + sw * 1.05, y - h * .5, Math.PI / 2 + .1, h * .62, T);
    if (o.pose === 'fight') {
      const ph = o.phase ?? (t * .6) % 1, a = -2.3 + Math.pow(Math.sin(ph * Math.PI), 2) * 2.9; // from raised behind to struck forward
      const s = sh[1], L = h * .34, ex = s[0] + Math.cos(a) * L, ey = s[1] + Math.sin(a) * L;
      sword(g, ex, ey, a, h * .62, T, true);
      sleeve(g, s[0], s[1], ex, ey, r * 1.6, T);
    }
    (o.arms || []).forEach(([dx, dy], i) => { const s = sh[dx < 0 ? 0 : 1] || sh[i % 2]; sleeve(g, s[0], s[1], x + dx * h, o.y + dy * h, r * 1.2, T); });
    headGroup(g, x, hy, r, T, o);
    return { x, y: hy, r };
  }
  // seated cross-legged, front: the head at 0.6 of the standing height; the knees spread wide under the cloak
  function sit(g, o, T) {
    const { x, y, h } = o, { r, sw } = geo(o), hs = h * .6, hy = y - hs + r * 1.25, ny = y - hs + r * 2.35;
    disc(g, x, hy - r * .2, r, T, o);
    g.beginPath();
    g.moveTo(x - r * .6, ny);
    g.quadraticCurveTo(x - sw * .85, ny + r * .15, x - sw, ny + r * 1.1);
    g.bezierCurveTo(x - sw * 1.12, y - h * .26, x - h * .2, y - h * .13, x - h * .3, y - h * .05);
    g.quadraticCurveTo(x - h * .34, y, x - h * .26, y + h * .005);
    g.quadraticCurveTo(x, y + h * .025, x + h * .26, y + h * .005);
    g.quadraticCurveTo(x + h * .34, y, x + h * .3, y - h * .05);
    g.bezierCurveTo(x + h * .2, y - h * .13, x + sw * 1.12, y - h * .26, x + sw, ny + r * 1.1);
    g.quadraticCurveTo(x + sw * .85, ny + r * .15, x + r * .6, ny);
    g.closePath();
    fillCloak(g, x - h * .3, x + h * .3, T); g.lineWidth = Math.max(.8, h * .005); rim(g, T);
    if (h > 40) {
      g.save(); g.clip(); g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = Math.max(.7, h * .006); g.beginPath();
      g.moveTo(x - h * .25, y - h * .04); g.quadraticCurveTo(x - h * .1, y - h * .1, x + h * .02, y - h * .06);
      g.moveTo(x + h * .25, y - h * .04); g.quadraticCurveTo(x + h * .1, y - h * .1, x - h * .02, y - h * .06); g.stroke(); g.restore();
    }
    const sh = [[x - sw * .92, ny + r * 1.3], [x + sw * .92, ny + r * 1.3]];
    (o.arms || []).forEach(([dx, dy], i) => { const s = sh[dx < 0 ? 0 : 1] || sh[i % 2]; sleeve(g, s[0], s[1], x + dx * h, y + dy * h, r * 1.2, T); });
    headGroup(g, x, hy, r, T, o);
    return { x, y: hy, r };
  }
  // lying on the back, side view, head to the left (flip: to the right); raise lifts the head and shoulders
  function lie(g, o, T) {
    const { x, y, h } = o, { r } = geo(o), L = h * .95, x0 = x - L / 2, up = (o.raise || 0) * h * .14;
    const hx = x0 + r * 1.3, hy = y - r * 1.15 - up;
    disc(g, hx, hy, r * .92, T, o);
    g.beginPath();
    g.moveTo(x0 + r * 2.1, y);
    g.lineTo(x0 + r * 2.1, hy + r * .5);
    g.bezierCurveTo(x0 + L * .24, y - h * .17 - up * .5, x0 + L * .4, y - h * .16, x0 + L * .55, y - h * .115);
    g.bezierCurveTo(x0 + L * .66, y - h * .1, x0 + L * .74, y - h * .13, x0 + L * .82, y - h * .115);
    g.quadraticCurveTo(x0 + L * .95, y - h * .1, x0 + L, y - h * .1);
    g.quadraticCurveTo(x0 + L * 1.02, y - h * .03, x0 + L * .97, y);
    g.closePath();
    fillCloak(g, x0, x0 + L, T); g.lineWidth = Math.max(.8, h * .005); rim(g, T);
    // the head, turned up, under the veil: the veil lies over the face toward the chest
    g.save(); g.translate(hx, hy); g.rotate(-Math.PI / 2 + .1 + (o.raise || 0) * .5); g.translate(-hx, -hy);
    if (T.P.chador) hood(g, hx, hy, r, T); else { veil(g, hx, hy, r, T); turban(g, hx, hy, r, T); }
    g.restore();
    return { x: hx, y: hy, r };
  }
  // sujud: kneeling, side view, forehead to the ground, facing right
  function sujud(g, o, T) {
    const { x, y, h } = o, { r } = geo(o), hx = x + h * .31, hy = y - r * 1.05;
    g.save(); g.beginPath(); g.rect(x - h, y - h * 2, h * 2, h * 2); g.clip(); disc(g, hx, hy, r, T, o); g.restore();
    g.beginPath();
    g.moveTo(x - h * .29, y);
    g.quadraticCurveTo(x - h * .3, y - h * .06, x - h * .24, y - h * .1);
    g.bezierCurveTo(x - h * .26, y - h * .26, x - h * .16, y - h * .36, x - h * .06, y - h * .33);
    g.bezierCurveTo(x + h * .06, y - h * .29, x + h * .16, y - h * .22, x + h * .23, y - h * .15);
    g.quadraticCurveTo(x + h * .27, y - h * .06, x + h * .3, y);
    g.closePath();
    fillCloak(g, x - h * .3, x + h * .3, T); g.lineWidth = Math.max(.8, h * .005); rim(g, T);
    sleeve(g, x + h * .17, y - h * .17, x + h * .25, y - r * .3, r * 1.15, T);
    g.save(); g.beginPath(); g.rect(x - h, y - h * 2, h * 2, h * 2); g.clip(); headGroup(g, hx, hy, r, T, o, 1.6, true); g.restore();
    return { x: hx, y: hy, r };
  }
  // ruku: bowing, side view, hands on the knees, facing right
  function ruku(g, o, T) {
    const { x, y, h } = o, { r } = geo(o), hx = x + h * .4, hy = y - h * .53;
    disc(g, hx, hy, r, T, o);
    g.beginPath();
    g.moveTo(x - h * .13, y);
    g.bezierCurveTo(x - h * .13, y - h * .2, x - h * .14, y - h * .42, x - h * .1, y - h * .52);
    g.quadraticCurveTo(x + h * .1, y - h * .6, x + h * .32, y - h * .57);
    g.quadraticCurveTo(x + h * .36, y - h * .5, x + h * .3, y - h * .45);
    g.quadraticCurveTo(x + h * .15, y - h * .45, x + h * .08, y - h * .4);
    g.bezierCurveTo(x + h * .1, y - h * .25, x + h * .11, y - h * .1, x + h * .12, y);
    g.closePath();
    fillCloak(g, x - h * .13, x + h * .34, T); g.lineWidth = Math.max(.8, h * .005); rim(g, T);
    sleeve(g, x + h * .26, y - h * .5, x + h * .11, y - h * .28, r * 1.15, T);
    headGroup(g, hx, hy, r, T, o, 1.3, true);
    return { x: hx, y: hy, r };
  }
  // riding, side view facing right: the mount walks; the rider sits upright, the cloak over its flank
  function ride(g, o, T) {
    const { x, y, h } = o, { r, sw } = geo(o), t = o.t || 0, m = o.mount || (o.who === 'prophet' ? 'mule' : 'horse');
    const M = MOUNT[m].map((s) => mix(hex(s), NIGHT, T.k * .9)), wh = h * (m === 'mule' ? .78 : .86), bob = Math.sin(t * 5) * h * .008;
    const bx = x, by = y - wh * .72 + bob, bl = wh * .62, bt = wh * .2;
    // legs (far pair darker), walking
    [[-.36, 0, .6], [.3, Math.PI, .6], [-.3, Math.PI, 1], [.36, 0, 1]].forEach(([u, ph, k]) => {
      const lx = bx + u * bl, sw2 = Math.sin(t * 5 + ph) * wh * .1;
      g.strokeStyle = css(mix(M[1], NIGHT, (1 - k) * .5)); g.lineWidth = wh * .07; g.lineCap = 'round';
      g.beginPath(); g.moveTo(lx, by + bt * .5); g.quadraticCurveTo(lx + sw2 * .3, y - wh * .3, lx + sw2, y - wh * .02); g.stroke();
    });
    g.lineCap = 'butt';
    // body, neck, head, tail
    g.beginPath(); g.ellipse(bx, by, bl / 2 + wh * .05, bt, 0, 0, TAU);
    g.moveTo(bx + bl * .38, by - bt * .5); g.quadraticCurveTo(bx + bl * .55, by - wh * .45, bx + bl * .62, by - wh * .5);
    g.lineTo(bx + bl * .8, by - wh * .32); g.quadraticCurveTo(bx + bl * .78, by - wh * .24, bx + bl * .72, by - wh * .26);
    g.quadraticCurveTo(bx + bl * .6, by - wh * .1, bx + bl * .45, by + bt * .2);
    let q = g.createLinearGradient(0, by - wh * .5, 0, by + bt); q.addColorStop(0, css(M[0])); q.addColorStop(1, css(M[1]));
    g.fillStyle = q; g.fill();
    g.beginPath(); m === 'mule' ? g.ellipse(bx + bl * .63, by - wh * .56, wh * .025, wh * .09, -.3, 0, TAU) : g.ellipse(bx + bl * .64, by - wh * .53, wh * .02, wh * .05, -.3, 0, TAU); g.fill();
    g.strokeStyle = css(M[1]); g.lineWidth = wh * .03; g.beginPath(); g.moveTo(bx - bl * .5, by - bt * .4); g.quadraticCurveTo(bx - bl * .62, by + bt, bx - bl * .58 + Math.sin(t * 2) * wh * .02, by + bt * 2.2); g.stroke();
    // saddle cloth
    g.beginPath(); g.moveTo(bx - bl * .22, by - bt * .9); g.lineTo(bx + bl * .14, by - bt * .9); g.lineTo(bx + bl * .12, by + bt * .5); g.lineTo(bx - bl * .2, by + bt * .5); g.closePath();
    g.fillStyle = css(mix([150, 40, 34], NIGHT, T.k * .9)); g.fill();
    // the rider: the torso upright over the saddle, the cloak falling over the flank
    const sx = bx - bl * .04, sy = by - bt * .8, ny = sy - h * .36, hy = ny - r * 1.1;
    disc(g, sx, hy - r * .2, r, T, o);
    g.beginPath();
    g.moveTo(sx - r * .6, ny); g.quadraticCurveTo(sx - sw * .85, ny + r * .15, sx - sw * .9, ny + r * 1.1);
    g.bezierCurveTo(sx - sw, sy - h * .1, sx - sw * .9, sy, sx - sw * 1.1, sy + h * .2);
    g.quadraticCurveTo(sx, sy + h * .26, sx + sw * 1.3, sy + h * .2);
    g.bezierCurveTo(sx + sw * 1.1, sy, sx + sw, sy - h * .1, sx + sw * .9, ny + r * 1.1);
    g.quadraticCurveTo(sx + sw * .85, ny + r * .15, sx + r * .6, ny); g.closePath();
    fillCloak(g, sx - sw, sx + sw, T); g.lineWidth = Math.max(.8, h * .005); rim(g, T);
    if (o.sword) sword(g, sx + sw * 1.1, sy + h * .02, Math.PI / 2 + .25, h * .55, T);
    (o.arms || []).forEach(([dx, dy]) => sleeve(g, sx + sw * .8, ny + r * 1.3, x + dx * h, y + dy * h, r * 1.2, T));
    headGroup(g, sx, hy, r, T, o);
    return { x: sx, y: hy, r };
  }
  // on a map seen from above: a small upright figure on its shadow, like a pin, so it never reads as a flat mark
  function above(g, o, T) {
    g.beginPath(); g.ellipse(o.x, o.y, o.h * .2, o.h * .065, 0, 0, TAU); g.fillStyle = 'rgba(0,0,0,.3)'; g.fill();
    return stand(g, { ...o, pose: 'stand' }, T);
  }
  const POSES = { stand, walk: stand, fight: stand, sit, lie, sujud, ruku, ride, above };

  function draw(g, o) {
    if (!(o.h > 0) || (o.alpha ?? 1) <= 0) return null;
    const T = tones(o), f = POSES[o.pose] || stand;
    g.save();
    g.globalAlpha *= Math.min(1, o.alpha ?? 1); g.globalCompositeOperation = 'source-over';
    if (o.flip) { g.translate(o.x, 0); g.scale(-1, 1); g.translate(-o.x, 0); }
    const at = f(g, o, T);
    g.restore();
    return at && o.flip ? { ...at, x: 2 * o.x - at.x } : at;
  }
  // the head centre without drawing (same arithmetic as the poses)
  function head(o) {
    const { r } = geo(o), { x, y, h } = o;
    let at;
    switch (o.pose) {
      case 'sit': at = { x, y: y - h * .6 + r * 1.25 }; break;
      case 'lie': at = { x: x - h * .475 + r * 1.3, y: y - r * 1.15 - (o.raise || 0) * h * .14 }; break;
      case 'sujud': at = { x: x + h * .31, y: y - r * 1.05 }; break;
      case 'ruku': at = { x: x + h * .4, y: y - h * .53 }; break;
      case 'ride': {
        const wh = h * ((o.mount || (o.who === 'prophet' ? 'mule' : 'horse')) === 'mule' ? .78 : .86), by = y - wh * .72, bl = wh * .62, bt = wh * .2;
        at = { x: x - bl * .04, y: by - bt * .8 - h * .36 - r * 1.1 }; break;
      }
      default: at = { x, y: y - h + r * 1.25 };
    }
    if (o.flip) at.x = 2 * x - at.x;
    return { ...at, r };
  }
  const api = { draw, head, PAL };
  if (typeof window !== 'undefined') window.Holy = api;
})();
