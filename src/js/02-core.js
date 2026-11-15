// Canvas + sizing
// ============================================================
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
// Logical play field. Height 648 with width 450..1152 on landscape frames (fills 16:9), width 450 with height 648..800 on portrait.
// Physics units are the same everywhere; obstacle density is normalised by fieldK() (04-sim.js).
// Render quality steps (canvas resolution multiplier). 99-main.js steps down when frames stay slow; step 2 also drops glows.
const QUALITY = [1, 0.75, 0.58];
const START_Y = 0.42;   // ring/ball start height (fraction of the field)
const REF_W = 450, REF_H = 648, MAX_W = 1152, MAX_H = 800;
let W = REF_W, H = REF_H, DPR = 1, SCALE = 1, RS = 1, PH = REF_H, FH = 0, SAFE = { t: 0, r: 0, b: 0, l: 0 }; // PH = play-area height (footer starts at y=PH); RS = DPR*SCALE
const stageEl = document.getElementById('stage');
function fieldFor(vw, vh) {
  const a = vw / Math.max(1, vh);
  return a >= REF_W / REF_H ? { w: Math.round(clamp(REF_H * a, REF_W, MAX_W)), h: REF_H } : { w: REF_W, h: Math.round(clamp(REF_W / a, REF_H, MAX_H)) };
}
function safeInsets() { // env(safe-area-inset-*) via a probe element (CrazyGames app runs fullscreen under notches)
  try { const cs = getComputedStyle(document.getElementById('safe')); return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 }; } catch (e) { return { t: 0, r: 0, b: 0, l: 0 }; }
}
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  SAFE = safeInsets();
  const vw = Math.max(50, window.innerWidth - SAFE.l - SAFE.r), vh = Math.max(50, window.innerHeight - SAFE.t - SAFE.b);
  const f = fieldFor(vw, vh); W = f.w; H = f.h; PH = H; FH = 0;
  SCALE = Math.min(vw / W, vh / H);
  RS = Math.min(DPR * SCALE, 1920 / W, 1920 / H) * QUALITY[game.q || 0];   // backing store: at most 1920 px on the long side, scaled down further in low-effects modes
  stageEl.style.width = W + 'px'; stageEl.style.height = H + 'px';
  stageEl.style.transform = 'translate(' + (SAFE.l + (vw - W * SCALE) / 2) + 'px,' + (SAFE.t + (vh - H * SCALE) / 2) + 'px) scale(' + SCALE + ')';
  stageEl.style.setProperty('--s', SCALE); stageEl.style.setProperty('--oy', Math.round((H - REF_H) / 2) + 'px'); stageEl.classList.toggle('wide', W > 700);
  canvas.width = Math.round(W * RS); canvas.height = Math.round(H * RS);
  ctx.setTransform(RS, 0, 0, RS, 0, 0);
  if (game.target) { game.target.x = clamp(game.target.x, 0, W); game.target.y = clamp(game.target.y, 0, PH); }
  if (game.ball) { game.ball.x = clamp(game.ball.x, game.ball.r, W - game.ball.r); game.ball.y = clamp(game.ball.y, game.ball.r, PH - game.ball.r); }
  if (game.state !== 'play' && game.ball && game.target) { game.target.x = game.ball.x = W / 2; game.target.y = game.ball.y = PH * START_Y; }
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);

// ============================================================
// Helpers
// ============================================================
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);            // cosmetic randomness only
let _seed = (Math.random() * 4294967296) >>> 0;                 // simulation RNG (mulberry32): seedable for deterministic tests
function seedSim(s) { _seed = s >>> 0; }
function srng() { _seed = (_seed + 0x6D2B79F5) >>> 0; let t = _seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const srand = (a, b) => a + srng() * (b - a);
function hex2rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function mixHex(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',') + ')';
}
function rgba(h, a) { const c = hex2rgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
// Palette (smoothly interpolated) for a fractional stage value
function palette(stageF) {
  const P = CONFIG.palettes, i = Math.min(P.length - 1, Math.floor(stageF)), j = Math.min(P.length - 1, i + 1);
  const t = clamp(stageF - i, 0, 1), s = t * t * (3 - 2 * t);
  const out = P[i].map((c, n) => mixHex(c, P[j][n], s)).map(rgbToHex);
  const th = typeof selItem === 'function' ? selItem('themes') : null;
  return th && th.fx ? out.map(c => themeColor(c, th.fx)) : out;
}
// Background themes (cosmetic): fx = [hue shift in degrees, saturation multiplier] applied to every stage palette
function themeColor(hex, fx) {
  const m = hex2rgb(hex).map(v => v / 255), mx = Math.max(...m), mn = Math.min(...m), l = (mx + mn) / 2, d = mx - mn;
  let h = 0, s = 0;
  if (d > 1e-6) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === m[0] ? ((m[1] - m[2]) / d) % 6 : mx === m[1] ? (m[2] - m[0]) / d + 2 : (m[0] - m[1]) / d + 4; h *= 60; }
  h = ((h + fx[0]) % 360 + 360) % 360; s = clamp(s * fx[1], 0, 1);
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), k = l - c / 2, r = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + r.map(v => Math.round((v + k) * 255).toString(16).padStart(2, '0')).join('');
}
function rgbToHex(s) {
  const m = s.match(/\d+/g).map(Number);
  return '#' + m.map(v => v.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// Game state
// ============================================================
const game = {
  state: 'start',            // start | play | over
  q: 0, lowFx: false, paused: false, resumeT: 0,  // visibility/panel pause; resumeT > 0 = 3-2-1 countdown before play continues
  t: 0,                      // survival time
  health: CONFIG.startHealth, maxHealth: CONFIG.startHealth, runSum: null,
  best: parseFloat(lsGet(STORE_BEST)) || 0,
  newBest: false,
  ball: null, target: null, obstacles: [], trailSt: null, unlockedNow: [], dirX: 0, dirY: -1,
  drift: { x: 0, y: 0, tx: 0, ty: 0, timer: 0 },
  spawnTimer: 1.5,
  shake: 0, flash: 0, edgeTouch: false,
  overAt: 0, acc: 0,
  bgT: 0, bgOff: { x: 0, y: 0 }, blobs: [],
  stats: { nearMiss: 0, bonusShards: 0, sweetTime: 0, hits: 0, stageMax: 0, milestones: 0 },
  shield: 0, safeUntil: 0, hold: false, holdT: 0, holdMove: 0, hitStop: 0, slowMo: 0,     // frame-time seconds (cosmetic pacing; never affects sim results)
  reduceMotion: lsGet('scrollgame.rm') === '1',
  tutorial: '', tutSpawnAt: -1, breatherUntil: 0, stageSeen: 0, bestPassed: false, prevBest: 0, msDone: 0,
  mouseGoal: null, tutRun: false
};
game.stageName = () => CONFIG.stageNames[Math.min(7, Math.floor(game.stageF()))];
game.stageF = () => game.state === 'play' || game.state === 'over' ? diffTime() / CONFIG.stageSeconds : 0.0;
// Effective "difficulty time" (seconds scaled by ramp speed)
// First-run easing: runs 1-2 ramp slower so new players reach the 60s mark
function easeF() { const r = typeof prog !== 'undefined' ? prog.runs : 9; return r < 1 ? 0.6 : r < 2 ? 0.75 : r < 4 ? 0.9 : 1; }
function diffTime() { return game.t * T.ramp * easeF(); }
// Difficulty level: 0 at start, ~1 at 60s with ramp 1
function level() { return diffTime() / 60; }

function initBlobs() {
  game.blobs = [];
  for (let i = 0; i < 7; i++) game.blobs.push({ x: Math.random(), y: Math.random(), r: rand(0.25, 0.6),
    vx: rand(-0.02, 0.02), vy: rand(-0.02, 0.02), c: i % 2 });
}
initBlobs();

function resetRun() {
  game.pw = newPw(); game.pwUsed = 0; MOD.sweetTemp = 0; MOD.calm = 1; game.t = 0; game.maxHealth = CONFIG.startHealth * MOD.hp; game.health = game.maxHealth; game.newBest = false;
  game.stats = { nearMiss: 0, bonusShards: 0, sweetTime: 0, hits: 0, stageMax: 0, milestones: 0 };
  game.shield = typeof prog !== 'undefined' && prog.runs < SHIELD_RUNS ? 1 : 0; game.safeUntil = 0; game.hold = true; game.holdT = 0; game.holdMove = 0; game.hitStop = 0; game.slowMo = 0; game.tutorial = ''; game.tutSpawnAt = -1; game.breatherUntil = 0; game.stageSeen = 0;
  game.bestPassed = false; game.prevBest = game.best; game.msDone = 0; game.mouseGoal = null; game.tutRun = typeof prog !== 'undefined' && prog.runs === 0;
  game.obstacles = []; game.trailSt = newTrailSt(); game.unlockedNow = []; game.spawnTimer = 1.5;
  game.shake = 0; game.flash = 0; game.acc = 0;
  game.paused = false; game.resumeT = 0;
  game.target = { x: W / 2, y: PH * START_Y };
  game.ball = { x: W / 2, y: PH * START_Y, vx: 0, vy: 0, r: CONFIG.ballRadius };
  game.drift = { x: 0, y: 0, tx: 0, ty: 0, timer: 0 };
}
function fxe(type, data) { if (typeof fxEvent === 'function') fxEvent(type, data || {}); }
function startRun() {
  meta.notice = []; meta.pending = null; telRunStart(); resetRun(); game.state = 'play'; telBegin(); PLATFORM.gameplayStart(); Audio_.sfx('start'); Audio_.music(true);
  fxe('start');
}
function endRun() {
  fxe('death', { x: game.ball ? game.ball.x : 0, y: game.ball ? game.ball.y : 0 });
  game.tutorial = ''; game.hitStop = 0;
  game.state = 'over'; game.overAt = performance.now(); PLATFORM.gameplayStop(); Audio_.music(false); Audio_.sfx('over');
  const s = game.t;
  if (s > game.best) { game.best = s; game.newBest = true; lsSet(STORE_BEST, String(s)); }
  game.unlockedNow = recordRun(s); game.runSum = metaOnRunEnd(s, game.newBest); if (game.unlockedNow.length || game.runSum.lines.length) setTimeout(() => Audio_.sfx('unlock'), 500);
  telEnd();
}

