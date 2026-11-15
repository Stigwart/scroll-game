// Measures the mix: peak and RMS (dBFS) at the output for music per stage and for each SFX. PW_DIR=<dir with playwright> node tests/audio-levels.mjs
import { createRequire } from 'node:module'; const { chromium } = createRequire((process.env.PW_DIR || process.cwd()) + '/')('playwright'); import { createServer } from 'node:http'; import { readFileSync } from 'node:fs';
const srv = createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end(readFileSync(new URL('../dist/web/index.html', import.meta.url))); }); await new Promise(r => srv.listen(0, r));
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage();
await p.addInitScript(() => { const oc = AudioNode.prototype.connect; window.__an = null;
  AudioNode.prototype.connect = function (d, ...a) { if (d === this.context.destination && this instanceof DynamicsCompressorNode) { window.__ctx = this.context; const an = this.context.createAnalyser(); an.fftSize = 2048; window.__an = an; oc.call(this, an); oc.call(an, d); return d; } return oc.call(this, d, ...a); };
  window.__meas = ms => new Promise(res => { const an = window.__an, buf = new Float32Array(an.fftSize); let pk = 0, sq = 0, n = 0; const t0 = performance.now(); const iv = setInterval(() => { an.getFloatTimeDomainData(buf); for (const v of buf) { pk = Math.max(pk, Math.abs(v)); sq += v * v; n++; } if (performance.now() - t0 > ms) { clearInterval(iv); res([+(20 * Math.log10(pk + 1e-9)).toFixed(1), +(10 * Math.log10(sq / n + 1e-12)).toFixed(1)]); } }, 20); }); });
await p.goto(`http://localhost:${srv.address().port}/?notel=1`); await p.waitForTimeout(400);
await p.mouse.click(640, 300); await p.waitForTimeout(300);
console.log('ctx', await p.evaluate(() => window.__ctx && [__ctx.state, __ctx.sampleRate, __ctx.currentTime]));
const out = await p.evaluate(async () => { const r = {}; const g = __TEST_HOOKS.game; const hold = setInterval(() => { g.health = g.maxHealth; g.hold = false; g.target.x = g.ball.x; g.target.y = g.ball.y; g.obstacles.length = 0; }, 10);
  __TEST_HOOKS.prog.runs = 9; for (const st of [0, 1, 2, 3, 5, 7]) { g.t = st * 30 + 2; await new Promise(q => setTimeout(q, 700)); r['music stage ' + (st + 1)] = await __meas(2500); }
  clearInterval(hold); Audio_.music(false); await new Promise(q => setTimeout(q, 600));
  for (const n of ['hit', 'edge', 'nearMiss', 'start', 'go', 'over', 'stage', 'milestone', 'newBest', 'unlock', 'levelUp', 'buy', 'power', 'tick']) { const m = __meas(700); Audio_.sfx(n); r['sfx ' + n] = await m; await new Promise(q => setTimeout(q, 250)); }
  return r; });
for (const k in out) console.log(k.padEnd(18), 'peak', String(out[k][0]).padStart(6), 'dB   rms', String(out[k][1]).padStart(6), 'dB');
await b.close(); srv.close();
