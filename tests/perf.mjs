// Frame-time check in headless Chromium with CPU throttling and a busy late-game scene.
// PW_DIR=<dir with node_modules/playwright> node tests/perf.mjs [throttle=4] [w=1920] [h=1080] [dpr=1]
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
const require = createRequire((process.env.PW_DIR || process.cwd()) + '/');
const { chromium } = require('playwright');
const [rate, w, h, dpr] = [+process.argv[2] || 4, +process.argv[3] || 1920, +process.argv[4] || 1080, +process.argv[5] || 1];
const root = new URL('../dist/web/', import.meta.url);
const srv = createServer((q, r) => { try { r.writeHead(200, { 'content-type': 'text/html' }); r.end(readFileSync(new URL('./index.html', root))); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(r => srv.listen(0, r));
const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr }); const p = await c.newPage();
await p.goto(`http://localhost:${srv.address().port}/?notel=1`); await p.waitForTimeout(500);
const cdp = await c.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
await p.mouse.click(w / 2, h * 0.42);
await p.evaluate(() => { const H = __TEST_HOOKS; setInterval(() => { const g = H.game; if (g.state === 'play') { g.hold = false; g.health = g.maxHealth; g.target.x += (g.ball.x - g.target.x) * 0.5; g.target.y += (g.ball.y - g.target.y) * 0.5; if (g.t < 150) g.t = 150; } }, 16); });
await p.waitForTimeout(4000);
await p.evaluate(() => { window.__ft = []; let l = performance.now(); (function f(n) { __ft.push(n - l); l = n; requestAnimationFrame(f); })(l); });
await p.waitForTimeout(10000);
console.log(`throttle x${rate} ${w}x${h}@${dpr}`, await p.evaluate(() => { const a = __ft.slice(5).sort((x, y) => x - y); return { fps: +(1000 / (a.reduce((s, v) => s + v, 0) / a.length)).toFixed(1), p50: +a[a.length >> 1].toFixed(1), p95: +a[Math.floor(a.length * .95)].toFixed(1), obstacles: __TEST_HOOKS.game.obstacles.length, low: !!__TEST_HOOKS.game.lowFx }; }));
await b.close(); srv.close();
