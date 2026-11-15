// Headless sim test (no browser). Same seed + same scripted input => identical simulation at any display refresh rate,
// with effects on or off. Covers steering, obstacles, stage changes and power-ups (not just an idle run).
// Usage: node scripts/build.mjs && node tests/determinism.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync(new URL('../dist/web/index.html', import.meta.url), 'utf8');
const code = html.match(/<script>([\s\S]*)<\/script>/)[1];
function stub() {
  const f = function () {};
  return new Proxy(f, {
    get(_, k) { if (k === Symbol.toPrimitive) return () => 0; if (typeof k === 'symbol' || k === 'then') return undefined;
      if (k === 'length') return 0; if (k === 'checked') return true; return stub(); },
    set() { return true; }, apply() { return stub(); }, construct() { return stub(); } });
}
function load() {
  const store = {};
  const win = { innerWidth: 450, innerHeight: 800, devicePixelRatio: 1, addEventListener() {}, screen: { width: 450, height: 800 },
    requestAnimationFrame() {}, location: { search: '' } };
  const ctx = vm.createContext({ window: win, document: { getElementById: stub, createElement: stub, querySelectorAll: () => [], querySelector: stub,
      addEventListener() {}, body: stub(), hidden: false }, navigator: { userAgent: 'node' }, performance: { now: () => 0 },
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => delete store[k] },
    getComputedStyle: stub, requestAnimationFrame() {}, fetch: () => Promise.reject(new Error('no net')), location: { search: '?notel=1' },
    crypto: { getRandomValues: a => a }, console, Math, JSON, Date, setTimeout() {}, setInterval() {}, clearTimeout() {} });
  Object.assign(ctx, win, { window: ctx });
  // Wrap step() so scripted input is applied per SIM step (the same instants at every refresh rate) and checkpoints are exact.
  vm.runInContext(code + `
;globalThis.__t = { game, update, resetRun, seedSim, meta, usePw, PWS, prog, log: [], script: null };
{ const _step = step; let n = 0;
  step = function (dt) { const T_ = globalThis.__t; if (T_.script) T_.script(game, n); _step(dt); n++;
    if (n % 1200 === 0) T_.log.push([n, game.ball.x, game.ball.y, game.health, game.obstacles.length, game.stats.hits, game.stats.nearMiss].map(v => +v.toFixed(6)).join(','));
  };
  globalThis.__t.reset = () => { n = 0; globalThis.__t.log.length = 0; };
}`, ctx);
  return ctx.__t;
}
// mode 'idle': no input. mode 'play': the ring chases the ball at a capped speed and fires each power-up on a schedule.
function run(hz, seed, secs, mode, reduceMotion, veteran) {
  const H = load(), g = H.game;
  if (veteran) H.prog.runs = 9;                     // skip new-player assists so the plain sim is covered too
  for (const p of H.PWS) H.meta.pw[p.id] = 1;
  g.reduceMotion = !!reduceMotion;
  H.seedSim(seed); H.resetRun(); H.reset(); g.state = 'play';
  if (mode === 'play') H.script = (gm, n) => {
    const tg = gm.target, b = gm.ball, dx = b.x + b.vx * 0.1 - tg.x, dy = b.y + b.vy * 0.1 - tg.y, d = Math.hypot(dx, dy), m = Math.min(d, 520 / 120);
    if (d > 1e-9) { tg.x += dx / d * m; tg.y += dy / d * m; }
    if (n === 1500) H.usePw('surge'); if (n === 3000) H.usePw('recentre'); if (n === 4500) H.usePw('calm');
    if (gm.health < 30 && n < 120 * secs) gm.health = gm.maxHealth;   // keep the run alive so every stage is exercised
  };
  const dt = 1 / hz; let n = 0;
  while (g.state === 'play' && g.t < secs && n++ < 1e6) H.update(dt);
  return { t: g.t, state: g.state, log: H.log.join('|') };
}
let bad = 0;
const HZ = [60, 120, 144, 165];
function check(label, seed, secs, mode, veteran) {
  const rs = HZ.map(hz => run(hz, seed, secs, mode, false, veteran));
  const rm = run(60, seed, secs, mode, true, veteran);
  // Checkpoints (every 10 s of sim time) must match exactly; the end time may differ by the final partial frame only.
  const n = Math.min(...rs.map(r => r.log.split('|').length), rm.log.split('|').length);
  const cut = r => r.log.split('|').slice(0, n).join('|');
  const okHz = rs.every(r => cut(r) === cut(rs[0]) && r.state === rs[0].state && Math.abs(r.t - rs[0].t) <= 1 / 60 + 1e-6);
  const okRm = cut(rm) === cut(rs[0]);
  console.log(label.padEnd(16), 'seed', seed, okHz ? 'OK  ' : 'FAIL', okRm ? 'fx-off OK  ' : 'fx-off FAIL', `${rs[0].state}@${rs[0].t.toFixed(2)}s`, `checkpoints ${n}${rs[0].log ? '' : ' (none)'}`);
  if (!okHz || !okRm) bad++;
}
for (const seed of [1, 2, 3]) check('idle', seed, 60, 'idle', false);
for (const seed of [1, 2, 3]) check('play new player', seed, 95, 'play', false);
for (const seed of [4, 5, 6]) check('play veteran', seed, 125, 'play', true);
process.exit(bad ? 1 : 0);
