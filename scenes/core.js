// Ali Life: helpers shared by every scenes/*.js file. Loads first, then each scene file, then app.js.
// A scene registers S.name = { init(el, st), frame(p, t, el, st) }. app.js calls frame with the pinned-scene
// progress p (about -0.05 → 1.05) and time t in seconds while the scene is on screen. With reduced motion it
// calls frame once with p = data-rest and t = 0. Everything a frame draws must follow from p (scroll runs both
// ways); t is only for ambient flicker. People are never drawn as figures: they are points of light.
window.SCENES = {};
const S = window.SCENES;
const TAU = Math.PI * 2;
const c01 = (v) => Math.min(1, Math.max(0, v));
const seg = (p, a, b) => c01((p - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
const ease = {
  out: (t) => 1 - (1 - t) ** 3,
  in: (t) => t * t * t,
  io: (t) => (t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
};
const mix = (a, b, k) => a + (b - a) * k;
const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const SVGNS = 'http://www.w3.org/2000/svg';
const reduced = !document.documentElement.classList.contains('fx-on');

// Size a canvas backing store to its CSS box (DPR capped at 2). Returns true when it changed.
function fit(cv, mul = 1) {
  const d = Math.min(2, devicePixelRatio || 1) * mul;
  const w = Math.max(1, Math.round(cv.clientWidth * d));
  const h = Math.max(1, Math.round(cv.clientHeight * d));
  if (cv.width === w && cv.height === h) return false;
  cv.width = w; cv.height = h;
  return true;
}
const setText = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };

// Palette: the same values as the CSS tokens in styles.css.
const PAL = {
  ink: '#0d0e0b', ink2: '#16180f', night: '#070b16', dusk: '#1b2440',
  paper: '#e6dcc3', paperDim: '#b9ad90',
  gold: '#c9a54e', goldHi: '#f3d98f',
  green: '#2e7558', greenHi: '#79c9a2',
  blood: '#a4322b', sand: '#c2a576', clay: '#8a6a45',
};
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};
const FONT = {
  kufi: '"Reem Kufi", "Noto Kufi Arabic", sans-serif',
  naskh: 'Amiri, "Noto Naskh Arabic", serif',
  ui: '"IBM Plex Sans Arabic", system-ui, sans-serif',
};
// Arabic-Indic digits for any number a scene prints.
const arNum = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
