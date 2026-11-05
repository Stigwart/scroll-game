// Pacing/economy simulation: bot players of several skill levels play 10-minute sittings.
// Usage: node scripts/build.mjs && node tests/bot.mjs [sittings=6]
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync(new URL('../dist/web/index.html', import.meta.url), 'utf8');
const code = html.match(/<script>([\s\S]*)<\/script>/)[1];
function stub() { const f = function () {}; return new Proxy(f, { get(_, k) { if (k === Symbol.toPrimitive) return () => 0; if (typeof k === 'symbol' || k === 'then') return undefined; if (k === 'length') return 0; if (k === 'checked') return true; return stub(); }, set() { return true; }, apply() { return stub(); }, construct() { return stub(); } }); }
function load() {
  const store = {};
  const win = { innerWidth: 450, innerHeight: 800, devicePixelRatio: 1, addEventListener() {}, screen: { width: 450, height: 800 }, requestAnimationFrame() {}, location: { search: '' } };
  const ctx = vm.createContext({ window: win, document: { getElementById: stub, createElement: stub, querySelectorAll: () => [], querySelector: stub, addEventListener() {}, body: stub(), hidden: false }, navigator: { userAgent: 'node' }, performance: { now: () => 0 },
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => delete store[k] }, getComputedStyle: stub, requestAnimationFrame() {}, fetch: () => Promise.reject(), location: { search: '?notel=1' }, crypto: { getRandomValues: a => a }, console, Math, JSON, Date, setTimeout() {}, setInterval() {}, clearTimeout() {} });
  Object.assign(ctx, win, { window: ctx });
  vm.runInContext(code + '\n;globalThis.__t={game,update,resetRun,seedSim,meta,UPG,upgCost,applyMods,playerLvl,prog};', ctx);
  return ctx.__t;
}
// skill: finger speed (px/s), reaction delay (s), aim noise (px), lead (s)
const SKILLS = { novice: { sp: 140, delay: 0.4, noise: 45, lead: 0.05 }, casual: { sp: 260, delay: 0.28, noise: 22, lead: 0.1 }, average: { sp: 420, delay: 0.18, noise: 12, lead: 0.15 }, good: { sp: 650, delay: 0.1, noise: 6, lead: 0.2 } };
function play(H, sk, rnd) {
  const { game: g, update, resetRun } = H; resetRun(); g.state = 'play';
  const hist = []; const dt = 1 / 60; let n = 0;
  while (g.state === 'play' && g.t < 900 && n++ < 1e6) {
    const b = g.ball; hist.push([b.x, b.y, b.vx, b.vy]); if (hist.length > 60) hist.shift();
    const h = hist[Math.max(0, hist.length - 1 - Math.round(sk.delay * 60))];
    const tx = h[0] + h[2] * sk.lead + (rnd() - 0.5) * 2 * sk.noise, ty = h[1] + h[3] * sk.lead + (rnd() - 0.5) * 2 * sk.noise;
    const tg = g.target, dx = tx - tg.x, dy = ty - tg.y, d = Math.hypot(dx, dy), m = Math.min(d, sk.sp * dt);
    if (d > 1e-6) { tg.x += dx / d * m; tg.y += dy / d * m; }
    update(dt);
  }
  return g.t;
}
function buy(H) { // greedy: cheapest affordable upgrade
  for (;;) { let best = null; for (const u of H.UPG) { const l = H.meta.upg[u.id] || 0; if (l < u.max) { const c = H.upgCost(u, l); if (!best || c < best.c) best = { u, c, l }; } }
    if (!best || H.meta.shards < best.c) return; if (globalThis.LOG) LOG.push(best.u.id + best.l); H.meta.shards -= best.c; H.meta.upg[best.u.id] = best.l + 1; H.applyMods(); }
}
const N = +process.argv[2] || 6; let seed = 1;
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(q * (s.length - 1))]; };
for (const [name, sk] of Object.entries(SKILLS)) {
  const first = [], runs = [], lens = [], firstUnlock = [], lvls = [], lastRunLens = [];
  for (let i = 0; i < N; i++) {
    const H = load(); let s = seed++ * 7919; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    H.seedSim(seed); let clock = 0, k = 0, unl = 0;
    while (clock < 600) { const t = play(H, sk, rnd); if (k === 0) first.push(t); lens.push(t); k++; clock += t + 6; globalThis.LOG = []; buy(H); if (globalThis.LOG.length && process.env.ECON) console.log(name, 'after run', k, 'bought', LOG.join(',')); if (!unl && (H.prog.runs >= 1) ) unl = k; }
    runs.push(k); lvls.push(H.playerLvl()); lastRunLens.push(lens[lens.length - 1]);
  }
  console.log(`${name.padEnd(8)} first-run>=60s ${Math.round(100 * first.filter(t => t >= 60).length / N)}%  first-run median ${pct(first, .5).toFixed(0)}s  run len p10/p50/p90 ${pct(lens, .1).toFixed(0)}/${pct(lens, .5).toFixed(0)}/${pct(lens, .9).toFixed(0)}s  runs/10min ${(runs.reduce((a, b) => a + b) / N).toFixed(1)}  lvl@10min ${(lvls.reduce((a, b) => a + b) / N).toFixed(1)}`);
}
