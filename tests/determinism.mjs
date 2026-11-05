// Headless sim test (no browser): same seed + no input => identical result at any display refresh rate.
// Usage: node scripts/build.mjs && node tests/determinism.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync(new URL('../dist/web/index.html', import.meta.url), 'utf8');
const code = html.match(/<script>([\s\S]*)<\/script>/)[1];
function stub() {
  const f = function () {};
  const p = new Proxy(f, {
    get(_, k) { if (k === Symbol.toPrimitive) return () => 0; if (typeof k === 'symbol' || k === 'then') return undefined;
      if (k === 'length') return 0; if (k === 'checked') return true; return stub(); },
    set() { return true; }, apply() { return stub(); }, construct() { return stub(); } });
  return p;
}
function run(hz, seed, secs) {
  const store = {};
  const win = { innerWidth: 450, innerHeight: 800, devicePixelRatio: 1, addEventListener() {}, screen: { width: 450, height: 800 },
    requestAnimationFrame() {}, location: { search: '' } };
  const ctx = vm.createContext({ window: win, document: { getElementById: stub, createElement: stub, querySelectorAll: () => [], querySelector: stub,
      addEventListener() {}, body: stub(), hidden: false }, navigator: { userAgent: 'node' }, performance: { now: () => 0 },
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => delete store[k] },
    getComputedStyle: stub, requestAnimationFrame() {}, fetch: () => Promise.reject(new Error('no net')), location: { search: '?notel=1' },
    crypto: { getRandomValues: a => a }, console, Math, JSON, Date, setTimeout() {}, setInterval() {}, clearTimeout() {} });
  Object.assign(ctx, win, { window: ctx });
  vm.runInContext(code + '\n;globalThis.__t={game,update,resetRun,seedSim};', ctx);
  const { game, update, resetRun, seedSim } = ctx.__t;
  seedSim(seed); resetRun(); game.state = 'play';
  const dt = 1 / hz; let n = 0;
  while (game.state === 'play' && game.t < secs && n++ < 1e6) update(dt);
  return { t: +game.t.toFixed(3), state: game.state, hp: +game.health.toFixed(2), obs: game.obstacles.length, bx: +game.ball.x.toFixed(1), by: +game.ball.y.toFixed(1) };
}
let bad = 0;
for (const seed of [1, 2, 3]) {
  const rs = [60, 120, 144, 165].map(hz => ({ hz, ...run(hz, seed, 60) }));
  const ref = JSON.stringify({ ...rs[0], hz: 0 });
  // Tolerance: the final partial step (<= 1/120 s) can differ, so compare death time within one sim step
  const ok = rs.every(r => Math.abs(r.t - rs[0].t) <= 1 / 120 + 1e-6 && r.state === rs[0].state);
  console.log('seed', seed, ok ? 'OK ' : 'FAIL', rs.map(r => `${r.hz}Hz:${r.state}@${r.t}s`).join('  '));
  if (!ok) bad++;
}
process.exit(bad ? 1 : 0);
