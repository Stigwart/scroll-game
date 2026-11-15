// Store assets, rendered from the game itself in headless Chromium and encoded with ffmpeg.
//   covers: store/cover-1920x1080.png, cover-800x1200.png, cover-800x800.png  (title only, no borders or logos)
//   videos: store/preview-1920x1080.mp4, preview-1080x1620.mp4                (17 s, silent, real-time gameplay, opens on the cover)
// Usage: node scripts/build.mjs && PW_DIR=<dir with node_modules/playwright> node scripts/store-assets.mjs [covers|videos|all]
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const { chromium } = createRequire((process.env.PW_DIR || process.cwd()) + '/')('playwright');
const what = process.argv[2] || 'all', FF = process.env.FFMPEG || 'ffmpeg', TMP = process.env.ASSET_TMP || 'store/.tmp';
mkdirSync('store', { recursive: true });
const srv = createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end(readFileSync(new URL('../dist/crazygames/index.html', import.meta.url))); });
await new Promise(r => srv.listen(0, r));
const URL_ = `http://localhost:${srv.address().port}/`;
const browser = await chromium.launch();

async function open(w, h, store) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 }); const page = await ctx.newPage();
  await page.route('https://sdk.crazygames.com/**', r => r.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.addInitScript(s => { for (const k in s) localStorage.setItem(k, s[k]);
    const raf = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => window.__manual ? 0 : raf(cb); }, store || {});
  await page.goto(URL_); await page.waitForFunction(() => window.__TEST_HOOKS); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  // take over the loop: virtual clock, one update+render per captured frame
  await page.evaluate(() => { window.__manual = true; window.__vt = performance.now(); performance.now = () => window.__vt;
    window.__tick = n => { for (let i = 0; i < (n || 1); i++) { window.__vt += 1000 / 60; update(1 / 60); render(); syncPw(); syncScreens(); } }; });
  await page.waitForTimeout(120);   // let the last queued animation frame drain before drawing by hand
  return { ctx, page };
}

// ---- cover: big reticle, ball off-centre with a trail, a shape about to hit, the wordmark. Drawn with the game's own functions. ----
const compose = ({ ring, mark, zoom, markZoom, shapes }) => {
  const g = game; document.getElementById('rail').style.display = 'none';
  g.state = 'play'; g.hold = false; g.t = 41; g.tutorial = ''; g.paused = false; g.health = g.maxHealth * 0.84; fx.hpShown = 0.84; fx.banners.length = 0; fx.pops.length = 0; fx.wipe = 0; g.flash = 0; g.shake = 0;
  g.stageF = () => 0.12; const pal = palette(0.12), palO = palette(1);
  ctx.setTransform(RS, 0, 0, RS, 0, 0); drawBackground(pal);
  const [rx, ry] = ring; g.target = { x: 0, y: 0 }; g.ball = { x: 30, y: -22, vx: 160, vy: -120, r: CONFIG.ballRadius }; g.dirX = 0.8; g.dirY = -0.6;
  g.trailSt = newTrailSt(); for (let i = 16; i >= 0; i--) g.trailSt.pts.push({ x: 30 - i * 6.5 - i * i * 0.12, y: -22 + i * 4.6 + i * i * 0.2, age: i * 0.028 });
  sel.trails = 'ribbon'; unlocked.add('trails:ribbon');
  g.obstacles = shapes.map(o => Object.assign({ rot: 0, hue: 0.2 }, o, o.pulse ? { r0: o.r / 1.1 } : {}));
  fx.cracks.length = 0; fx.cracks.push({ a: -0.5, t: 0.1, max: 0.9 }); fx.bezel = 0.4; fx.t = 0.3;
  for (const p of fx.pool) p.life = 0; fx.seed = 7; fxBurst(70, -52, 16, '#ffffff', 60, 240, 0, 0, 0.9); fxBurst(70, -52, 12, palO[2], 80, 300, 0, 0, 0.9); for (let i = 0; i < 9; i++) fxUpdate(1 / 60);
  ctx.save(); ctx.translate(rx, ry); ctx.scale(zoom, zoom);
  drawObstacles(palO, 1); drawTarget(); drawBall(pal); fxDrawWorld(ctx); ctx.restore();
  // soft vignette so the title and reticle carry the frame at thumbnail size
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, 'rgba(3,1,12,0)'); v.addColorStop(1, 'rgba(3,1,12,0.72)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(mark[0], mark[1]); ctx.scale(markZoom, markZoom); drawWordmark(0, 0, 1000); ctx.restore();
};
const TRI = { kind: 'tri', x: 116, y: -86, r: 44, rot: 0.5, hue: 0.9 };   // the shape about to hit, same place in every layout
const COVERS = { // viewport -> layout in field units (the field is 1152x648, 450x675 or 648x648 for these three ratios); shapes are relative to the ring
  '1920x1080': { ring: [812, 336], zoom: 1.7, mark: [316, 352], markZoom: 1.55, shapes: [TRI, { kind: 'circle', x: -42, y: 150, r: 34 }, { kind: 'rect', x: -60, y: -150, w: 150, h: 22, hue: 0.9 }, { kind: 'rect', x: 180, y: 86, w: 22, h: 120 }, { kind: 'circle', x: 196, y: -150, r: 24, hue: 0.9, pulse: 1 }] },
  // CrazyGames overlays a label in the top-left corner (about 40% x 12% on portrait, 35% x 30% on square): keep the title out of it
  '800x1200': { ring: [225, 440], zoom: 1.16, mark: [225, 170], markZoom: 1.08, shapes: [TRI, { kind: 'circle', x: -128, y: 132, r: 36 }, { kind: 'rect', x: 96, y: 168, w: 130, h: 22, hue: 0.9 }, { kind: 'rect', x: -158, y: -70, w: 22, h: 110, hue: 0.9 }, { kind: 'circle', x: 150, y: 60, r: 22, pulse: 1 }] },
  '800x800': { ring: [336, 262], zoom: 1.16, mark: [324, 552], markZoom: 1.5, shapes: [TRI, { kind: 'circle', x: -200, y: 120, r: 36 }, { kind: 'rect', x: 206, y: 96, w: 22, h: 120, hue: 0.9 }, { kind: 'rect', x: -206, y: -96, w: 110, h: 22, hue: 0.9 }, { kind: 'circle', x: 232, y: -56, r: 24, pulse: 1 }] },
};
COVERS['1080x1620'] = COVERS['800x1200'];   // portrait video intro frame
async function cover(size, path) {
  const [w, h] = size.split('x').map(Number); const { ctx, page } = await open(w, h);
  await page.evaluate(compose, COVERS[size]); await page.waitForTimeout(200); await page.evaluate(compose, COVERS[size]);   // drawn twice: a late resize event clears the canvas
  if (await page.evaluate(() => { const d = ctx.getImageData(canvas.width >> 1, canvas.height >> 3, 1, 1).data; return d[0] + d[1] + d[2] < 30; })) throw new Error('cover rendered blank: ' + size);
  console.log('  px', await page.evaluate(() => [canvas.width, canvas.height, W, H, RS, [...ctx.getImageData(canvas.width >> 1, canvas.height >> 1, 1, 1).data].join()].join(' ')));
  await page.screenshot({ path }); await ctx.close(); console.log('cover', path);
}

// ---- video: a skilled in-page player steers; frames are captured one sim-frame at a time (real-time speed when played back) ----
const VETERAN = { 'scrollgame.prog': JSON.stringify({ runs: 40, best: 214.6, nearMissBest: 9, stageMax: 6, sweetBest: 30 }), 'scrollgame.best': '214.6',
  'scrollgame.unlocks': JSON.stringify(['balls:sun', 'balls:comet', 'trails:ribbon', 'trails:stars', 'trails:comet']), 'scrollgame.sel': JSON.stringify({ balls: 'orb', trails: 'ribbon', themes: 'neon' }),
  'scrollgame.meta': JSON.stringify({ v: 1, shards: 180, xp: 900, upg: { sweet: 2, hull: 2 }, streak: 3, lastDay: new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'), day: '', q: { runs: 0, best: 0, shards: 0, time: 0, done: {} }, pw: {}, ms: { surv: 9, stage: 5, skill: 6 } }),
  'scrollgame.streakSeen': new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0') };
const pilot = () => { // called before every frame: smooth pursuit with look-ahead and obstacle avoidance; never lets the run end on camera
  const g = game; if (g.state !== 'play') return; const b = g.ball, tg = g.target; g.hold = false;
  let tx = b.x + b.vx * 0.16, ty = b.y + b.vy * 0.16, ox = 0, oy = 0;
  for (const o of g.obstacles) { const rr = (o.kind === 'rect' ? Math.max(o.w, o.h) / 2 : o.r) + 64, ex = b.x + b.vx * 0.3 - o.x, ey = b.y + b.vy * 0.3 - o.y, d = Math.hypot(ex, ey) || 1; if (d < rr) { ox += ex / d * (rr - d); oy += ey / d * (rr - d); } }
  tx -= ox * 0.55; ty -= oy * 0.55;
  const dx = tx - tg.x, dy = ty - tg.y, d = Math.hypot(dx, dy), m = Math.min(d, 560 / 60) * 0.85; if (d > 1e-6) { tg.x = Math.max(0, Math.min(W, tg.x + dx / d * m)); tg.y = Math.max(0, Math.min(PH, tg.y + dy / d * m)); }
  if (g.health < g.maxHealth * 0.5) g.health += window.__skip ? 5 : 0.6;
};
async function video(w, h, out, coverPng) {
  const dir = `${TMP}/${w}x${h}`; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  let n = 0; const shot = async page => { await page.screenshot({ path: `${dir}/f${String(n++).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 96 }); };
  const cov = readFileSync(coverPng); for (let i = 0; i < 48; i++) writeFileSync(`${dir}/f${String(n++).padStart(5, '0')}.png`, cov);   // 0.8 s on the static cover
  const clip = async (seed, look, skipTo, frames) => {
    const { ctx, page } = await open(w, h, Object.assign({}, VETERAN, { 'scrollgame.sel': JSON.stringify(look) }));
    await page.evaluate(([s, skipTo, pilotSrc]) => { seedSim(s); fx.seed = s; window.__pilot = new Function('return (' + pilotSrc + ')')(); startRun(); const g = game; g.hold = false; g.mouseGoal = null;
      window.__frame = k => { for (let i = 0; i < k; i++) { __pilot(); __tick(1); } };
      window.__skip = true; let guard = 0; while (g.t < skipTo && g.state === 'play' && guard++ < 60 * 400) { __pilot(); window.__vt += 1000 / 60; update(1 / 60); fxUpdate(1 / 60); } window.__skip = false; g.health = g.maxHealth * 0.8; render(); }, [seed, skipTo, pilot.toString()]);
    for (let i = 0; i < frames; i++) { await page.evaluate(() => __frame(1)); await shot(page); }
    const st = await page.evaluate(() => ({ s: game.state, t: game.t })); console.log('  clip', seed, 'ended at', st.t.toFixed(1), st.s); if (st.s !== 'play') throw new Error('run ended on camera'); await ctx.close();
  };
  await clip(11, { balls: 'orb', trails: 'ribbon', themes: 'neon' }, 52.5, 600);       // 10 s: CALM/PULSE into HEAT, stage banner, near misses
  await clip(23, { balls: 'sun', trails: 'stars', themes: 'neon' }, 87.5, 372);        // 6.2 s: HEAT into REDLINE, another ball and trail
  // mixed png/jpg frames: normalise through two inputs is fiddly, so convert the cover frames to jpg first
  execSync(`cd ${dir} && for f in *.png; do ${FF} -loglevel error -y -i "$f" -q:v 1 "\${f%.png}.jpg" && rm "$f"; done`, { shell: '/bin/zsh' });
  execSync(`${FF} -loglevel error -y -framerate 60 -i ${dir}/f%05d.jpg -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart -an -vf "scale=${w}:${h}:flags=lanczos:in_range=pc:out_range=tv,format=yuv420p" -color_range tv ${out}`);
  rmSync(dir, { recursive: true, force: true }); console.log('video', out, n, 'frames', (n / 60).toFixed(1) + ' s');
}

if (what === 'intro') { await cover('1080x1620', process.env.ASSET_TMP + '/intro-test.png'); await browser.close(); srv.close(); process.exit(0); }
if (what !== 'videos') for (const s of ['1920x1080', '800x1200', '800x800']) await cover(s, `store/cover-${s}.png`);
if (what !== 'covers') {
  mkdirSync(TMP, { recursive: true }); await cover('1080x1620', `${TMP}/intro-1080x1620.png`);
  await video(1920, 1080, 'store/preview-1920x1080.mp4', 'store/cover-1920x1080.png');
  await video(1080, 1620, 'store/preview-1080x1620.mp4', `${TMP}/intro-1080x1620.png`);
  rmSync(TMP, { recursive: true, force: true });
}
await browser.close(); srv.close();
