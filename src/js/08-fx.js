// ============================================================
// FX: particles, banners, floating pops, shake/flash state, death shatter.
// Self-contained: driven from render() via fxUpdate(dt); sim talks to it only through fxEvent().
// Uses its own cosmetic RNG (never touches the sim RNG) and never throws without a DOM.
// ============================================================
const FX_MAX = 200;
const fx = {
  t: 0, last: 0, seed: 20240607,
  pool: [], cur: 0,
  banners: [], pops: [], cracks: [],
  shake: 0, chroma: 0, wipe: 0, wipeCol: '#ffffff', ef: { l: 0, r: 0, t: 0, b: 0 },
  hpShown: 1, hpPulse: 0, bezel: 0, bestFlash: 0, bestPassed: false,
  lastShards: 0, shardPulse: 0, deathT: -1, zonePulse: 0, inZone: true
};
for (let i = 0; i < FX_MAX; i++) fx.pool.push({ life: 0, max: 1, x: 0, y: 0, vx: 0, vy: 0, g: 0, s: 2, c: '#fff', k: 0, r: 0 });
function frnd() { fx.seed = (Math.imul(fx.seed, 1664525) + 1013904223) >>> 0; return fx.seed / 4294967296; }
function fr(a, b) { return a + frnd() * (b - a); }
function fxRM() { return !!game.reduceMotion; }

// k: 0 spark (additive glow dot), 1 confetti (flipping rect), 2 shard (shrinking square)
function fxSpawn(x, y, vx, vy, life, size, color, kind, grav) {
  let p = null;
  for (let n = 0; n < FX_MAX; n++) { const q = fx.pool[(fx.cur + n) % FX_MAX]; if (q.life <= 0) { p = q; fx.cur = (fx.cur + n + 1) % FX_MAX; break; } }
  if (!p) { p = fx.pool[fx.cur]; fx.cur = (fx.cur + 1) % FX_MAX; } // pool full: recycle the oldest slot
  p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = p.max = life; p.s = size; p.c = color; p.k = kind; p.g = grav || 0; p.r = frnd() * 6.283;
}
function fxBurst(x, y, n, color, spMin, spMax, kind, grav, life) {
  for (let i = 0; i < n; i++) {
    const a = frnd() * 6.283, sp = fr(spMin, spMax);
    fxSpawn(x, y, Math.cos(a) * sp, Math.sin(a) * sp, fr(0.35, 1) * (life || 0.6), fr(1.5, 3.5), color, kind, grav);
  }
}
const FX_CONFETTI = ['#ffee00', '#ff2bd6', '#00e5ff', '#7dff7d', '#ffffff', '#ff9a1f'];
function fxConfetti(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = -1.571 + fr(-1.2, 1.2), sp = fr(120, 420);
    fxSpawn(x, y, Math.cos(a) * sp, Math.sin(a) * sp, fr(1.0, 2.0), fr(3, 6), FX_CONFETTI[(frnd() * FX_CONFETTI.length) | 0], 1, 420);
  }
}
function fxBanner(text, color, secs, size, cap) {
  if (fx.banners.length >= 2) fx.banners.shift();
  fx.banners.push({ text: String(text), color: color || '#ffffff', t: 0, max: secs || 1.6, size: size || 34, cap: cap || '' });
}
function fxPop(x, y, text, color, size, secs) {
  if (fx.pops.length >= 8) fx.pops.shift();
  fx.pops.push({ x, y, text: String(text), color: color || '#fff', t: 0, max: secs || 0.9, size: size || 22 });
}
function fxVibrate(p) {
  try { if (!fxRM() && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(p); } catch (e) {}
}
function fxSfx(n) { try { if (typeof Audio_ !== 'undefined') Audio_.sfx(n); } catch (e) {} }
function fxPlayRect() { return { w: typeof W === 'number' ? W : 450, h: typeof PH === 'number' ? PH : 520 }; }
function fxSide(x, y) { // nearest play-area edge to a point
  const a = fxPlayRect(), d = { l: x, r: a.w - x, t: y, b: a.h - y };
  let s = 'l'; for (const k in d) if (d[k] < d[s]) s = k;
  return s;
}

function fxEvent(type, d) {
  d = d || {};
  const g = game, rm = fxRM(), b = g.ball || { x: 225, y: 300 };
  const x = typeof d.x === 'number' ? d.x : b.x, y = typeof d.y === 'number' ? d.y : b.y;
  const pal = palette(g.stageF());
  switch (type) {
    case 'start':
      for (const p of fx.pool) p.life = 0;
      fx.banners.length = 0; fx.pops.length = 0; fx.cracks.length = 0;
      fx.shake = 0; fx.chroma = 0; fx.wipe = 0; fx.ef.l = fx.ef.r = fx.ef.t = fx.ef.b = 0;
      fx.hpShown = 1; fx.bestFlash = 0; fx.bestPassed = false; fx.lastShards = 0; fx.deathT = -1;
      break;
    case 'go':
      fxPop(x, y - 92, 'GO!', '#7fff9a', 30, 0.7); fxSfx('go');
      if (!g.tutRun) fxEvent('stage', { index: 0 });
      break;
    case 'shield':
      fxBanner('SECOND CHANCE', '#7fff9a', 1.8, 28, 'SHIELD');
      fxBurst(x, y, rm ? 10 : 36, '#7fff9a', 120, 420, 0, 0, 0.7); fx.wipe = 1; fx.wipeCol = '#7fff9a'; fx.hpShown = 0;
      fxSfx('power'); fxVibrate([20, 30, 20]);
      break;
    case 'tutGoal':
      fxPop(x, y - 30, d.last ? 'NICE!' : 'GOOD!', '#7fff9a', 26, 0.9); fxPop(x + 40, y - 6, '+5', '#ffd84d', 16, 0.8);
      fxBurst(x, y, rm ? 8 : 22, '#7fff9a', 80, 300, 0, 0, 0.6); fxSfx('milestone');
      break;
    case 'hit': {
      fxBurst(x, y, rm ? 6 : 16, d.color || pal[4], 90, 300, 0, 0, 0.55);
      if (!rm) fx.shake = Math.max(fx.shake, 5 + Math.min(1.5, (d.dmg || 0) / 10));
      const tg = g.target;
      fx.cracks.push({ a: tg ? Math.atan2(y - tg.y, x - tg.x) + fr(-0.6, 0.6) : fr(0, 6.283), t: 0, max: 0.9 });
      if (fx.cracks.length > 5) fx.cracks.shift();
      fx.hpPulse = 1; fxVibrate(20);
      break;
    }
    case 'edge': {
      const s = fxSide(x, y); fx.ef[s] = 1; fx.chroma = 1;
      const a = fxPlayRect(), ex = s === 'l' ? 0 : s === 'r' ? a.w : x, ey = s === 't' ? 0 : s === 'b' ? a.h : y;
      const nx = s === 'l' ? 1 : s === 'r' ? -1 : 0, ny = s === 't' ? 1 : s === 'b' ? -1 : 0;
      for (let i = 0; i < (rm ? 3 : 9); i++) { const sp = fr(60, 260), sd = fr(-1, 1); fxSpawn(ex, ey, nx * sp + (ny ? sd * sp : 0), ny * sp + (nx ? sd * sp : 0), fr(0.2, 0.5), fr(1.5, 3), '#ff8a8a', 0, 0); }
      fxVibrate(8);
      break;
    }
    case 'nearMiss':
      fxPop(x, y - 26, 'CLOSE!', pal[2], 24, 0.9);
      fxPop(x + 36, y - 6, '+2', '#ffd84d', 16, 0.8);
      fxBurst(x, y, rm ? 4 : 10, '#ffffff', 60, 160, 0, 0, 0.35);
      if (!rm) g.slowMo = Math.max(g.slowMo || 0, 0.1);
      fxSfx('nearMiss');
      break;
    case 'stage': {
      const idx = d.index | 0, name = d.name || (CONFIG.stageNames && CONFIG.stageNames[Math.min(idx, 7)]) || '', col = palette(idx)[2];
      fx.wipe = 1; fx.wipeCol = col;
      fxBanner(name, col, idx ? 1.6 : 1.2, 32, 'STAGE ' + (idx + 1));
      if (idx >= 1) { fxSfx('stage'); try { if (typeof Audio_ !== 'undefined' && Audio_.lift) Audio_.lift(); } catch (e) {} }
      break;
    }
    case 'milestone':
      fxBanner((d.secs || 0) + ' SECONDS', '#ffd84d', 1.6, 26, '+' + (d.shards || 0) + ' SHARDS');
      if (!rm) fxConfetti(W / 2, 60, 28);
      fxSfx('milestone');
      break;
    case 'newBestPassed':
      fxBanner('NEW BEST!', '#ffee00', 2.0, 34);
      if (!rm) fxConfetti(W / 2, 52, 70); else fxBurst(W / 2, 52, 10, '#ffee00', 60, 140, 0, 0, 0.6);
      fx.bestFlash = 1; fx.bestPassed = true;
      fxSfx('newBest'); fxVibrate([30, 40, 30]);
      break;
    case 'death':
      fxBurst(x, y, rm ? 14 : 44, pal[2], 90, 380, 2, 260, 0.95);
      fxBurst(x, y, rm ? 6 : 16, '#ffffff', 60, 220, 0, 0, 0.5);
      fx.deathT = 0; fx.banners.length = 0; fx.pops.length = 0; fxVibrate([40, 30, 70]);
      break;
  }
}

function fxUpdate(dt) {
  const g = game;
  fx.t += dt;
  const slow = g.state === 'over' && fx.deathT >= 0 && fx.deathT < 0.45 ? 0.45 : 1; // death shatter plays in slow motion
  if (fx.deathT >= 0) fx.deathT += dt;
  fx.shake *= Math.exp(-dt * 11); fx.chroma *= Math.exp(-dt * 7);
  fx.ef.l *= Math.exp(-dt * 6); fx.ef.r *= Math.exp(-dt * 6); fx.ef.t *= Math.exp(-dt * 6); fx.ef.b *= Math.exp(-dt * 6);
  fx.zonePulse *= Math.exp(-dt * 5);
  if (g.state === 'play' && g.ball && g.target && !g.hold && typeof sweetR === 'function') { // leaving the still zone is felt as well as seen
    const inside = Math.hypot(g.ball.x - g.target.x, g.ball.y - g.target.y) <= sweetR();
    if (fx.inZone && !inside) { fx.zonePulse = 1; fxSfx('zone'); }
    fx.inZone = inside;
  } else fx.inZone = true;
  fx.hpPulse *= Math.exp(-dt * 5); fx.bestFlash *= Math.exp(-dt * 1.5); fx.shardPulse *= Math.exp(-dt * 6);
  if (fx.wipe > 0) fx.wipe = Math.max(0, fx.wipe - dt / 0.8);
  // Ring health lags behind real health so a lost chunk is visible dropping away
  const hp = g.maxHealth ? clamp(g.health / g.maxHealth, 0, 1) : 1;
  if (fx.hpShown > hp) fx.hpShown = Math.max(hp, fx.hpShown - dt * 0.7); else fx.hpShown = hp;
  // Reticle bezel speeds up with difficulty
  const L = g.state === 'play' && typeof level === 'function' ? Math.min(level(), 4) : 0;
  fx.bezel += dt * (0.25 + 0.45 * L);
  for (const p of fx.pool) {
    if (p.life <= 0) continue;
    const pd = dt * slow;
    p.life -= pd; p.vy += p.g * pd; p.x += p.vx * pd; p.y += p.vy * pd;
    if (p.k !== 1) { const f = Math.exp(-pd * 2.2); p.vx *= f; if (!p.g) p.vy *= f; }
  }
  for (let i = fx.banners.length - 1; i >= 0; i--) { fx.banners[i].t += dt; if (fx.banners[i].t > fx.banners[i].max) fx.banners.splice(i, 1); }
  for (let i = fx.pops.length - 1; i >= 0; i--) { fx.pops[i].t += dt; if (fx.pops[i].t > fx.pops[i].max) fx.pops.splice(i, 1); }
  for (let i = fx.cracks.length - 1; i >= 0; i--) { fx.cracks[i].t += dt; if (fx.cracks[i].t > fx.cracks[i].max) fx.cracks.splice(i, 1); }
  // Shard counter pulse + a "+1" popping off the ball every few shards
  if (g.state === 'play' && typeof runShards === 'function') {
    const s = runShards();
    if (s > fx.lastShards) {
      fx.shardPulse = 1;
      if (g.ball && s % 4 === 0) fxPop(g.ball.x, g.ball.y - 24, '+1 ◆', '#ffd84d', 15, 0.8);
      fx.lastShards = s;
    }
  }
}

// Particles, drawn in world (shaken) space
function fxDrawWorld(c) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const p of fx.pool) {
    if (p.life <= 0 || p.k !== 0) continue;
    const a = clamp(p.life / p.max, 0, 1);
    c.globalAlpha = a; c.fillStyle = p.c;
    const s = p.s * (0.5 + a * 0.7);
    c.fillRect(p.x - s, p.y - s, s * 2, s * 2);
  }
  c.globalCompositeOperation = 'source-over';
  for (const p of fx.pool) {
    if (p.life <= 0 || p.k === 0) continue;
    const a = clamp(p.life / p.max, 0, 1);
    c.fillStyle = p.c;
    if (p.k === 1) { // confetti: width flips to fake rotation
      c.globalAlpha = Math.min(1, a * 2);
      const w = p.s * Math.cos(p.r + (p.max - p.life) * 9);
      c.fillRect(p.x - w, p.y - p.s * 0.6, w * 2, p.s * 1.2);
    } else {
      c.globalAlpha = a; const s = p.s * 1.6 * (0.4 + a * 0.6);
      c.fillRect(p.x - s, p.y - s, s * 2, s * 2);
    }
  }
  c.restore();
}

// Overlay layer (screen space, not shaken): stage wipe, pops, banners
function fxDraw(c) {
  const g = game, rm = fxRM();
  if (fx.wipe > 0) {
    const t = 1 - fx.wipe; // 0 -> 1
    c.save(); c.fillStyle = fx.wipeCol;
    c.globalAlpha = fx.wipe * 0.16; c.fillRect(0, 0, W, PH);
    if (!rm) { // a bright band sweeping down the play area
      const y = t * (PH + 160) - 80;
      c.globalAlpha = fx.wipe * 0.5; c.fillRect(0, y - 4, W, 8);
      c.globalAlpha = fx.wipe * 0.18; c.fillRect(0, y - 40, W, 80);
    }
    c.restore();
  }
  for (const p of fx.pops) {
    const k = p.t / p.max, e = 1 - Math.pow(1 - Math.min(1, k * 4), 2);
    textAt(p.text, p.x, p.y - k * 28, p.size * (rm ? 1 : 0.7 + 0.3 * e), p.color, 12, { font: 'display', alpha: clamp(1.6 - k * 1.6, 0, 1) });
  }
  // Banners: top third, on a dark plate, small caption above the main line (clear of the reticle's usual area)
  let by = 128;
  for (const bn of fx.banners) {
    const k = bn.t / bn.max, inT = Math.min(1, bn.t / 0.18), outA = clamp((1 - k) / 0.25, 0, 1), al = Math.min(inT, outA);
    const sc = rm ? 1 : 1 + 0.25 * Math.pow(1 - inT, 2), hgt = bn.size + (bn.cap ? 30 : 12);
    c.font = bn.size + 'px ' + FONT_DISPLAY; const tw = Math.min(W - 40, Math.max(170, c.measureText(bn.text).width + 56));
    c.save(); c.translate(W / 2, by + hgt / 2); c.scale(sc, sc); c.translate(-W / 2, -(by + hgt / 2));
    c.globalAlpha = al * 0.62; c.fillStyle = '#04020c'; scrRR(W / 2 - tw / 2, by, tw, hgt, 12); c.fill();
    c.globalAlpha = al * 0.8; c.strokeStyle = bn.color; c.lineWidth = 1.5; c.stroke(); c.globalAlpha = 1;
    if (bn.cap) textAt(bn.cap, W / 2, by + 15, 12, '#ffffff', 0, { font: 'display', alpha: al * 0.8, ls: 2 });
    textAt(bn.text, W / 2, by + hgt - bn.size / 2 - 7, bn.size, bn.color, 14, { font: 'display', alpha: al });
    c.restore();
    by += hgt + 8;
  }
}
