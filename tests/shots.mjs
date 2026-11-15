// Play-review / QA capture: plays the built game with real input events at every CrazyGames size and saves screenshots.
// Needs Playwright (not a repo dependency): PW_DIR=<dir containing node_modules/playwright> node tests/shots.mjs [web|crazygames] [outDir] [filter]
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire((process.env.PW_DIR || process.cwd()) + '/');
const { chromium } = require('playwright');
const target = process.argv[2] || 'web', out = process.argv[3] || 'docs/play-review', filter = process.argv[4] || '';
const root = new URL(`../dist/${target}/`, import.meta.url);
mkdirSync(out, { recursive: true });
const srv = createServer((q, r) => { try { const p = q.url.split('?')[0]; const b = readFileSync(new URL('.' + (p === '/' ? '/index.html' : p), root)); r.writeHead(200, { 'content-type': 'text/html' }); r.end(b); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(r => srv.listen(0, r));
const URL_ = `http://localhost:${srv.address().port}/?notel=1`;

// name, w, h, input, full (extra screens)
const SIZES = [
  ['d-821x462', 821, 462, 'mouse', 1], ['d-907x510', 907, 510, 'mouse', 0], ['d-1077x606', 1077, 606, 'key', 0], ['d-1216x684', 1216, 684, 'mouse', 0],
  ['f-1280x720', 1280, 720, 'mouse', 0], ['f-1366x768', 1366, 768, 'key', 0], ['f-1536x864', 1536, 864, 'mouse', 0], ['f-1920x1080', 1920, 1080, 'mouse', 1],
  ['m-800x450', 800, 450, 'touch', 1], ['t-1080x607', 1080, 607, 'touch', 0], ['p-390x844', 390, 844, 'touch', 1],
].filter(s => s[0].includes(filter));
const browser = await chromium.launch();
const report = [];
for (const [name, w, h, input, full] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: input === 'touch', isMobile: input === 'touch' });
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); page.on('pageerror', e => errs.push(String(e)));
  const cdp = await ctx.newCDPSession(page);
  const shot = n => page.screenshot({ path: `${out}/${name}-${n}.jpg`, type: 'jpeg', quality: 82 });
  const t0 = Date.now(); await page.goto(URL_); await page.waitForFunction(() => window.__TEST_HOOKS); const loadMs = Date.now() - t0;
  await page.waitForTimeout(600);
  const modal = await page.evaluate(() => document.getElementById('streak').classList.contains('open'));
  if (modal) { await shot('0-firstload-modal'); const bb = await page.locator('#stOk').boundingBox(); if (input === 'touch') await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); else await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(300); }
  await shot('1-title');
  const st = () => page.evaluate(() => { const H = __TEST_HOOKS, g = H.game, r = document.getElementById('c').getBoundingClientRect(), k = r.width / 450;
    return { state: g.state, t: g.t, hp: g.health, k, bx: r.left + (g.ball.x + g.ball.vx * 0.12) * k, by: r.top + (g.ball.y + g.ball.vy * 0.12) * k, tx: r.left + g.target.x * k, ty: r.top + g.target.y * k, paused: g.paused }; });
  // frame-time sampler
  await page.evaluate(() => { window.__ft = []; let l = performance.now(); (function f(n) { __ft.push(n - l); l = n; requestAnimationFrame(f); })(l); });
  // start + play with real input, steering the ring onto the (slightly led) ball
  let s = await st(), finger = null; const startAt = Date.now(); let startDelay = 0;
  if (input === 'mouse') { await page.mouse.move(s.tx - 30, s.ty + 40); await page.mouse.move(s.tx, s.ty, { steps: 4 }); }
  else if (input === 'key') await page.keyboard.press('ArrowUp');
  else { finger = { x: w / 2, y: h * 0.75 }; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [finger] }); }
  const held = new Set(); const marks = [[3, '2-tutorial'], [11, '3-dodge'], [34, '4-stage2'], [50, '5-play50']]; let died = 0;
  const giveUp = full ? 62 : 38; // then stop steering so the run ends and the game-over screen can be captured
  for (;;) {
    s = await st();
    if (s.state === 'play' && !startDelay) startDelay = Date.now() - startAt;
    if (s.state === 'over') { died = s.t; break; }
    if (marks.length && s.t >= marks[0][0]) await shot(marks.shift()[1]);
    if (s.t < giveUp) {
      if (input === 'mouse') await page.mouse.move(s.bx, s.by);
      else if (input === 'touch') { finger = { x: Math.max(2, Math.min(w - 2, finger.x + (s.bx - s.tx))), y: Math.max(2, Math.min(h - 2, finger.y + (s.by - s.ty))) }; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [finger] }); }
      else { const want = new Set(); if (s.bx - s.tx > 6 * s.k) want.add('ArrowRight'); if (s.bx - s.tx < -6 * s.k) want.add('ArrowLeft'); if (s.by - s.ty > 6 * s.k) want.add('ArrowDown'); if (s.by - s.ty < -6 * s.k) want.add('ArrowUp');
        for (const k of held) if (!want.has(k)) { await page.keyboard.up(k); held.delete(k); } for (const k of want) if (!held.has(k)) { await page.keyboard.down(k); held.add(k); } }
    } else { for (const k of held) { await page.keyboard.up(k); } held.clear(); if (input === 'mouse') await page.mouse.move(w / 2, h * 0.1); }
    await page.waitForTimeout(16);
    if (Date.now() - startAt > 200000) break;
  }
  if (finger) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const ft = await page.evaluate(() => { const a = __ft.slice(30).sort((x, y) => x - y); return { n: a.length, p50: a[a.length >> 1], p95: a[Math.floor(a.length * 0.95)], p99: a[Math.floor(a.length * 0.99)] }; });
  await page.waitForTimeout(500); await shot('6-death'); await page.waitForTimeout(2200); await shot('7-gameover');
  if (full) {
    // retry latency, then pause, collection, settings
    const r0 = Date.now(); if (input === 'touch') await page.touchscreen.tap(w / 2, h * 0.3); else await page.keyboard.press('Space');
    await page.waitForFunction(() => __TEST_HOOKS.game.state === 'play'); const retryMs = Date.now() - r0;
    await page.waitForTimeout(1500); await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await page.waitForTimeout(300); await shot('8-paused');
    await page.evaluate(() => { __TEST_HOOKS.game.health = 0.01; __TEST_HOOKS.game.paused = false; }); await page.waitForFunction(() => __TEST_HOOKS.game.state === 'over'); await page.waitForTimeout(1200);
    await page.reload(); await page.waitForFunction(() => !!window.__TEST_HOOKS); await page.waitForTimeout(700); await shot('9-title-returning');
    for (const [id, n] of [['rCol', 'a-collection'], ['rDaily', 'c-daily'], ['rSet', 'd-settings']]) {
      await page.evaluate(i => document.getElementById(i).click(), id); await page.waitForTimeout(400); await shot(n);
      if (id === 'rCol') { await page.evaluate(() => document.querySelector('#tabs [data-k=upgrades]').click()); await page.waitForTimeout(300); await shot('b-upgrades'); }
      await page.evaluate(() => { const b = document.getElementById('collBack'); if (document.getElementById('coll').classList.contains('open')) b.click(); document.getElementById('setClose').click(); });
    }
    report.push({ name, retryMs });
  }
  // smallest rendered DOM text
  const dom = await page.evaluate(() => { const o = []; for (const e of document.querySelectorAll('#stage *, .side *')) { if (!e.offsetParent || !e.childNodes.length || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue; const r = e.getBoundingClientRect(), cs = getComputedStyle(e), sc = e.closest('#stage') ? +getComputedStyle(document.getElementById('stage')).getPropertyValue('--s') : 1; o.push([Math.round(parseFloat(cs.fontSize) * sc * 10) / 10, e.id || e.className || e.tagName, e.textContent.trim().slice(0, 24), Math.round(r.width)]); } return o.sort((a, b) => a[0] - b[0]).slice(0, 5); });
  report.push({ name, input, modalOnFirstLoad: modal, loadMs, startDelay, died: +died.toFixed(1), frameMs: ft, errs, smallestDomText: dom });
  console.log(JSON.stringify(report[report.length - 1]));
  await ctx.close();
}
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 1));
await browser.close(); srv.close();
