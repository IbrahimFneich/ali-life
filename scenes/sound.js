// Ali Life: ambient sound, synthesised, no music. Off until the reader turns it on. One bed per section,
// cross-faded: night wind and crickets, desert wind, the distant noise of battle, a storm, the river, a crowd,
// lamp fire, the mosque at dawn, birds over the shrine. app.js calls Sound.chapter(name) as sections change.
window.Sound = {
  ctx: null, on: false, want: null, cur: null, nodes: null,
  toggle() {
    this.on = !this.on;
    if (this.on && !this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.on = false; return false; }
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = .55;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx) (this.on ? this.ctx.resume() : this.ctx.suspend()).catch(() => {});
    this.apply();
    return this.on;
  },
  chapter(name) { this.want = name || null; this.apply(); },
  apply() {
    if (!this.ctx) return;
    const next = this.on ? this.want : null;
    if (next === this.cur) return;
    this.stop();
    this.cur = next;
    if (next && this.beds[next]) this.nodes = this.beds[next].call(this, this.ctx);
  },
  stop() {
    if (!this.nodes) return;
    const n = this.nodes;
    n.out.gain.setTargetAtTime(0, this.ctx.currentTime, .5);
    setTimeout(() => n.kill(), 2500);
    this.nodes = null;
  },
  live() { return this.on && this.ctx && this.ctx.state === 'running'; },
  noise() {
    if (!this.nb) {
      const c = this.ctx, b = c.createBuffer(2, c.sampleRate * 3, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) b.getChannelData(ch).forEach((_, i, a) => { a[i] = Math.random() * 2 - 1; });
      this.nb = b;
    }
    return this.nb;
  },
  bed(level, build) {
    const c = this.ctx, out = c.createGain(), stops = [];
    out.gain.value = 0; out.gain.setTargetAtTime(level, c.currentTime, 1.2); out.connect(this.master);
    const k = {
      out,
      noise: (type, f, q, g, to = out) => { const s = c.createBufferSource(), fl = c.createBiquadFilter(), v = c.createGain(); s.buffer = this.noise(); s.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q; v.gain.value = g; s.connect(fl); fl.connect(v); v.connect(to); s.start(0, Math.random() * 2); stops.push(() => s.stop()); return [s, fl, v]; },
      osc: (type, f, g, to = out) => { const o = c.createOscillator(), v = c.createGain(); o.type = type; o.frequency.value = f; v.gain.value = g; o.connect(v); v.connect(to); o.start(); stops.push(() => o.stop()); return [o, v]; },
      lfo: (param, f, depth, type = 'sine') => { const o = c.createOscillator(), v = c.createGain(); o.type = type; o.frequency.value = f; v.gain.value = depth; o.connect(v); v.connect(param); o.start(); stops.push(() => o.stop()); },
      every: (ms, fn, jitter = 0) => { let id; const go = () => { id = setTimeout(() => { if (this.live()) fn(); go(); }, ms + Math.random() * jitter); }; go(); stops.push(() => clearTimeout(id)); },
    };
    build(k, c);
    return { out, kill: () => { stops.forEach((f) => { try { f(); } catch { /* already stopped */ } }); out.disconnect(); } };
  },
  burst(to, type, f, q, dur, g, pan = 0, t0 = this.ctx.currentTime) {
    const c = this.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), v = c.createGain(), p = c.createStereoPanner();
    s.buffer = this.noise(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; p.pan.value = pan;
    v.gain.setValueAtTime(.0001, t0); v.gain.exponentialRampToValueAtTime(g, t0 + .004); v.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    s.connect(fl); fl.connect(v); v.connect(p); p.connect(to); s.start(t0, Math.random() * 2); s.stop(t0 + dur + .05);
  },
  chirp(to, f0, f1, dur, g, pan = 0, t0 = this.ctx.currentTime) {
    const c = this.ctx, o = c.createOscillator(), v = c.createGain(), p = c.createStereoPanner();
    o.type = 'sine'; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur); p.pan.value = pan;
    v.gain.setValueAtTime(.0001, t0); v.gain.exponentialRampToValueAtTime(g, t0 + dur * .2); v.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(v); v.connect(p); p.connect(to); o.start(t0); o.stop(t0 + dur + .02);
  },
  beds: {
    // a near-silent room, for the reading bands
    still() { return this.bed(1, (k) => { k.noise('lowpass', 260, .5, .025); }); },
    // night in Mecca: a low wind and crickets
    night(c) {
      return this.bed(1, (k) => {
        const [, fl] = k.noise('bandpass', 420, .9, .05); k.lfo(fl.frequency, .05, 140);
        k.every(180, () => { const t0 = c.currentTime, pan = Math.random() * 1.6 - .8; for (let i = 0; i < 3; i++) this.chirp(k.out, 4300, 4200, .03, .012, pan, t0 + i * .06); }, 900);
      });
    },
    // open desert: gusting wind and blown sand
    desert() {
      return this.bed(1, (k) => {
        const [, fl, v] = k.noise('bandpass', 600, 1.1, .12); k.lfo(fl.frequency, .06, 320); k.lfo(v.gain, .11, .07);
        k.noise('highpass', 5200, .4, .012);
        k.noise('lowpass', 110, .5, .05);
      });
    },
    // a battle far off: the roar of men, hooves, the clink of iron
    battle(c) {
      return this.bed(1, (k) => {
        const [, fl, v] = k.noise('bandpass', 380, .7, .09); k.lfo(v.gain, .3, .05); k.lfo(fl.frequency, .09, 120);
        k.noise('lowpass', 90, .6, .09);
        k.every(260, () => this.burst(k.out, 'highpass', 3600 + Math.random() * 2400, 6, .07, .02 + Math.random() * .03, Math.random() * 1.6 - .8), 700);
        k.every(400, () => { const t0 = c.currentTime; for (let i = 0; i < 4; i++) this.burst(k.out, 'lowpass', 240, .8, .06, .05, -.4 + Math.random() * .8, t0 + i * .11); }, 2600);
      });
    },
    // the trench in winter: a storm getting up
    storm() {
      return this.bed(1, (k) => {
        const [, fl, v] = k.noise('bandpass', 300, .6, .2); k.lfo(fl.frequency, .08, 200); k.lfo(v.gain, .07, .1);
        k.noise('highpass', 3000, .5, .02);
        k.noise('lowpass', 70, .7, .12);
      });
    },
    // the Euphrates: water over stones, reeds in the wind
    river(c) {
      return this.bed(1, (k) => {
        k.noise('lowpass', 520, .7, .08);
        const [, fl] = k.noise('bandpass', 1300, 1.5, .03); k.lfo(fl.frequency, .4, 500);
        k.every(90, () => this.chirp(k.out, 900 + Math.random() * 900, 1500 + Math.random() * 900, .05, .006, Math.random() * 1.4 - .7), 160);
        const [, wf] = k.noise('bandpass', 2200, .8, .015); k.lfo(wf.frequency, .05, 600);
      });
    },
    // many people gathered: a murmur that rises and falls
    crowd() {
      return this.bed(1, (k) => {
        [320, 520, 780].forEach((f, i) => { const [, , v] = k.noise('bandpass', f, 2.2, .045); k.lfo(v.gain, .13 + i * .07, .025); });
        k.noise('lowpass', 150, .5, .04);
      });
    },
    // an oil lamp burning in a quiet room
    fire(c) {
      return this.bed(1, (k) => {
        k.noise('lowpass', 300, .5, .03);
        k.every(70, () => this.burst(k.out, 'bandpass', 2400 + Math.random() * 1800, 3, .02, .02 + Math.random() * .03, Math.random() * .4 - .2), 240);
      });
    },
    // a vast mosque before dawn: room tone, faint wind at the arcades, lamps
    mosque(c) {
      return this.bed(1, (k) => {
        k.noise('lowpass', 180, .6, .05);
        const [, fl] = k.noise('bandpass', 700, 1.4, .025); k.lfo(fl.frequency, .04, 200);
        k.every(140, () => this.burst(k.out, 'bandpass', 3000, 4, .015, .012, Math.random() * .6 - .3), 400);
      });
    },
    // dawn over the shrine: soft wind and birds
    shrine(c) {
      return this.bed(1, (k) => {
        const [, fl] = k.noise('bandpass', 500, .8, .04); k.lfo(fl.frequency, .05, 150);
        k.every(900, () => { const t0 = c.currentTime, pan = Math.random() * 1.6 - .8, f = 2600 + Math.random() * 1600; for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) this.chirp(k.out, f, f * 1.25, .09, .02, pan, t0 + i * .13); }, 2200);
      });
    },
    // a steady wind over open country, for the long years
    wind() {
      return this.bed(1, (k) => {
        const [, fl, v] = k.noise('bandpass', 380, .9, .09); k.lfo(fl.frequency, .035, 160); k.lfo(v.gain, .05, .04);
        k.noise('lowpass', 90, .5, .05);
      });
    },
  },
};
