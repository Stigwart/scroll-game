// Canvas + sizing
// ============================================================
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W = 360, H = 640, DPR = 1, PH = 520, FH = 120, SAFE_B = 0; // PH = play-area height (footer starts at y=PH)
function measureSafe() {
  try {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;padding-bottom:env(safe-area-inset-bottom)';
    document.body.appendChild(d); SAFE_B = parseFloat(getComputedStyle(d).paddingBottom) || 0; d.remove();
  } catch (e) { SAFE_B = 0; }
}
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 3);
  W = window.innerWidth; H = window.innerHeight;
  measureSafe(); FH = Math.round(H * CONFIG.footerFrac + SAFE_B); PH = H - FH;
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (game.target) { game.target.x = clamp(game.target.x, 0, W); game.target.y = clamp(game.target.y, 0, PH); }
  if (game.ball) { game.ball.x = clamp(game.ball.x, game.ball.r, W - game.ball.r); game.ball.y = clamp(game.ball.y, game.ball.r, PH - game.ball.r); }
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
  return P[i].map((c, n) => mixHex(c, P[j][n], s)).map(rgbToHex);
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
  paused: false,             // visibility/panel pause
  t: 0,                      // survival time
  health: CONFIG.startHealth,
  best: parseFloat(lsGet(STORE_BEST)) || 0,
  newBest: false,
  ball: null, target: null, obstacles: [], trailSt: null, unlockedNow: [], dirX: 0, dirY: -1,
  drift: { x: 0, y: 0, tx: 0, ty: 0, timer: 0 },
  spawnTimer: 1.5,
  shake: 0, flash: 0, edgeTouch: false,
  overAt: 0, acc: 0,
  bgT: 0, bgOff: { x: 0, y: 0 }, blobs: []
};
game.stageF = () => game.state === 'play' || game.state === 'over' ? diffTime() / CONFIG.stageSeconds : 0.0;
// Effective "difficulty time" (seconds scaled by ramp speed)
function diffTime() { return game.t * T.ramp; }
// Difficulty level: 0 at start, ~1 at 60s with ramp 1
function level() { return diffTime() / 60; }

function initBlobs() {
  game.blobs = [];
  for (let i = 0; i < 7; i++) game.blobs.push({ x: Math.random(), y: Math.random(), r: rand(0.25, 0.6),
    vx: rand(-0.02, 0.02), vy: rand(-0.02, 0.02), c: i % 2 });
}
initBlobs();

function resetRun() {
  game.t = 0; game.health = CONFIG.startHealth; game.newBest = false;
  game.obstacles = []; game.trailSt = newTrailSt(); game.unlockedNow = []; game.spawnTimer = 1.5;
  game.shake = 0; game.flash = 0; game.acc = 0;
  game.target = { x: W / 2, y: PH * 0.32 };
  game.ball = { x: W / 2, y: PH * 0.32, vx: 0, vy: 0, r: CONFIG.ballRadius };
  game.drift = { x: 0, y: 0, tx: 0, ty: 0, timer: 0 };
}
function startRun() { telRunStart(); resetRun(); game.state = 'play'; telBegin(); PLATFORM.gameplayStart(); }
function endRun() {
  game.state = 'over'; game.overAt = performance.now(); PLATFORM.gameplayStop();
  const s = game.t;
  if (s > game.best) { game.best = s; game.newBest = true; lsSet(STORE_BEST, String(s)); }
  game.unlockedNow = recordRun(s);
  telEnd();
}

