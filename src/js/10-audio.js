/* 10-audio.js: procedural WebAudio (SFX blips + synthwave loop). No audio assets. */
const Audio_ = (() => {
  const MUTE_KEY = 'scrollgame.mute';
  const SIX = 60 / 124 / 4;            // one 16th note at 124 BPM (s)
  const LOOK = 0.15, TICK = 25;        // scheduler lookahead (s) and interval (ms)
  // [bass root Hz, semitone arpeggio] per bar: Am, F, C, G
  const CHORDS = [
    [110.0, [0, 3, 7, 12]], [87.31, [0, 4, 7, 12]],
    [130.81, [0, 4, 7, 12]], [98.0, [0, 4, 7, 12]]
  ];
  const DIV = [4, 2, 2, 1];            // arp note every N sixteenths, by intensity
  const CUT = [900, 1300, 1800, 2600]; // lowpass cutoff by intensity
  const MIN_GAP = { edge: 80, hit: 80 };

  let ctx = null, master = null, bus = null, lp = null, noise = null;
  let timer = null, nextT = 0, step = 0, intensity = 0;
  let wanted = false, paused = false, unlocked = false, muted = false;
  const lastAt = {};
  try { muted = lsGet(MUTE_KEY) === '1'; } catch (e) {}

  // Lazily build the AudioContext and graph; returns null if WebAudio is missing.
  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      const c = new AC();
      master = c.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(c.destination);
      lp = c.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = CUT[intensity]; lp.Q.value = 0.7;
      lp.connect(master);
      bus = c.createGain(); bus.gain.value = 0;
      bus.connect(lp);
      ctx = c;
    } catch (e) { ctx = null; }
    return ctx;
  }

  // One enveloped oscillator; f1 (if set) is a pitch-sweep target.
  function voice(out, type, f0, f1, t, a, d, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + d + 0.05);
  }

  // Short filtered noise tick for hi-hats.
  function hat(t, vol) {
    if (!noise) {
      noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; hp.type = 'highpass'; hp.frequency.value = 7000;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    s.connect(hp); hp.connect(g); g.connect(bus);
    s.start(t); s.stop(t + 0.05);
  }

  // Pad: triangle triad one octave above the bass, held for one bar.
  function pad(ch, t) {
    [0, ch[1][1], ch[1][2]].forEach(semi =>
      voice(bus, 'triangle', ch[0] * 2 * Math.pow(2, semi / 12), 0, t, 0.3, 16 * SIX, 0.035));
  }

  function playStep(s, t) {
    const ch = CHORDS[(s >> 4) & 3], lvl = intensity, div = DIV[lvl];
    if (s % 16 === 0) pad(ch, t);
    if (s % div === 0) {
      const k = (s / div) % 4;
      voice(bus, 'sawtooth', ch[0] * Math.pow(2, ch[1][k] / 12), 0, t, 0.005, div * SIX * 0.9, 0.12);
    }
    if (s % 2 === 1) hat(t, lvl ? 0.05 : 0.03);
    if (lvl >= 2 && s % 4 === 2) {
      voice(bus, 'square', ch[0] * 4 * Math.pow(2, ch[1][(s >> 2) % 4] / 12), 0, t, 0.003, SIX * 1.5, 0.035);
    }
  }

  // Lookahead scheduler: queues steps up to LOOK seconds ahead.
  function schedule() {
    if (!ctx || ctx.state !== 'running') return;
    if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.02; // recover after throttling
    while (nextT < ctx.currentTime + LOOK) {
      playStep(step, nextT);
      nextT += SIX;
      step = (step + 1) % 64;
    }
  }

  // Start or stop the music loop to match wanted/muted/paused state.
  function syncMusic() {
    if (!ctx) return;
    const on = wanted && !muted && !paused, now = ctx.currentTime;
    if (on && !timer) {
      if (ctx.state !== 'running') return; // retried after resume()
      nextT = now + 0.05; step = 0;
      timer = setInterval(schedule, TICK);
      bus.gain.setTargetAtTime(0.8, now, 0.1); // ~0.3s fade in
      schedule();
    } else if (!on && timer) {
      clearInterval(timer); timer = null;
      bus.gain.setTargetAtTime(0, now, 0.1);   // ~0.3s fade out
    }
  }

  function setMuted(v) {
    muted = !!v;
    try { lsSet(MUTE_KEY, muted ? '1' : '0'); } catch (e) {}
    if (ctx) master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.02);
    syncMusic();
  }

  // Sound effects: each takes (output node, start time).
  const SFX = {
    start:  (o, t) => { voice(o, 'sawtooth', 220, 880, t, 0.01, 0.25, 0.2); voice(o, 'square', 440, 1320, t + 0.12, 0.01, 0.2, 0.08); },
    hit:    (o, t) => voice(o, 'square', 180, 60, t, 0.005, 0.12, 0.25),
    edge:   (o, t) => voice(o, 'triangle', 1200, 900, t, 0.003, 0.05, 0.15),
    over:   (o, t) => { voice(o, 'sawtooth', 440, 55, t, 0.01, 0.35, 0.3); voice(o, 'triangle', 330, 110, t + 0.12, 0.01, 0.22, 0.15); },
    unlock: (o, t) => [523.25, 659.25, 783.99].forEach((f, i) => voice(o, 'sine', f, 0, t + i * 0.06, 0.005, 0.12, 0.2)),
    buy:    (o, t) => { voice(o, 'square', 660, 0, t, 0.005, 0.1, 0.12); voice(o, 'square', 990, 0, t + 0.07, 0.005, 0.14, 0.12); },
    power:  (o, t) => voice(o, 'sawtooth', 300, 1500, t, 0.02, 0.3, 0.18),
    tick:   (o, t) => voice(o, 'sine', 1800, 0, t, 0.002, 0.03, 0.15)
  };

  return {
    // Call from any pointerdown/keydown. Safe to repeat.
    unlock() {
      const c = ensure();
      if (!c) return;
      try {
        if (!unlocked) { // iOS: play a silent buffer inside the gesture
          unlocked = true;
          const s = c.createBufferSource();
          s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0);
        }
        if (c.state !== 'running') {
          const p = c.resume();
          if (p && p.then) p.then(syncMusic, () => {});
        }
      } catch (e) {}
      syncMusic();
    },
    sfx(name) {
      const c = ensure(), f = SFX[name];
      if (!c || !f || muted || c.state !== 'running') return;
      if (MIN_GAP[name]) {
        const now = performance.now();
        if (now - (lastAt[name] || 0) < MIN_GAP[name]) return;
        lastAt[name] = now;
      }
      try { f(master, c.currentTime); } catch (e) {}
    },
    music(on) { wanted = !!on; syncMusic(); },
    setIntensity(n) {
      intensity = Math.max(0, Math.min(3, Math.floor(+n || 0)));
      if (ctx) lp.frequency.setTargetAtTime(CUT[intensity], ctx.currentTime, 0.4);
    },
    get muted() { return muted; },
    setMuted(v) { setMuted(v); },
    toggleMute() { setMuted(!muted); return muted; },
    pause() {
      paused = true;
      syncMusic();
      if (ctx) try { ctx.suspend(); } catch (e) {}
    },
    resume() {
      paused = false;
      if (!ensure()) return;
      try {
        const p = ctx.resume();
        if (p && p.then) p.then(syncMusic, () => {});
      } catch (e) {}
      syncMusic();
    }
  };
})();

(function () { // mute button (top-left)
  const b = document.getElementById('mute');
  const sync = () => { b.textContent = Audio_.muted ? '\u{1F507}' : '\u{1F50A}'; };
  for (const ev of ['pointerdown', 'pointerup', 'touchstart', 'mousedown']) b.addEventListener(ev, e => e.stopPropagation());
  b.addEventListener('click', e => { e.stopPropagation(); Audio_.unlock(); Audio_.toggleMute(); sync(); });
  sync();
})();
