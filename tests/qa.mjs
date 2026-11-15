// QA checks on the CrazyGames build with a stub SDK: events, pause paths, restricted keys, settings, banking, network.
// PW_DIR=<dir with node_modules/playwright> node tests/qa.mjs
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
const { chromium } = createRequire((process.env.PW_DIR || process.cwd()) + '/')('playwright');
const root = new URL('../dist/crazygames/', import.meta.url);
const srv = createServer((q, r) => { try { const b = readFileSync(new URL('.' + (q.url.split('?')[0] === '/' ? '/index.html' : q.url.split('?')[0]), root)); r.writeHead(200, { 'content-type': 'text/html' }); r.end(b); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(r => srv.listen(0, r));
const URL_ = `http://localhost:${srv.address().port}/`;
const SDK = `window.__sdk=[];window.CrazyGames={SDK:{init:async()=>{__sdk.push('init')},game:{loadingStart(){__sdk.push('loadingStart')},loadingStop(){__sdk.push('loadingStop')},gameplayStart(){__sdk.push('gameplayStart')},gameplayStop(){__sdk.push('gameplayStop')}}}};`;
const browser = await chromium.launch();
let fails = 0; const res = [];
const ok = (name, cond, detail) => { res.push([cond ? 'PASS' : 'FAIL', name, detail || '']); if (!cond) fails++; };
async function open(w = 1280, h = 720, keep) {
  const ctx = keep || await browser.newContext({ viewport: { width: w, height: h } }); const page = await ctx.newPage();
  const errs = [], hosts = new Set();
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); page.on('pageerror', e => errs.push(String(e)));
  page.on('request', q => hosts.add(new URL(q.url()).host));
  await page.route('https://sdk.crazygames.com/**', r => r.fulfill({ contentType: 'application/javascript', body: SDK }));
  await page.goto(URL_); await page.waitForFunction(() => window.__TEST_HOOKS); await page.waitForTimeout(300);
  return { ctx, page, errs, hosts };
}
const G = (page, f) => page.evaluate(f);
const state = page => G(page, () => { const g = __TEST_HOOKS.game; return { s: g.state, t: g.t, paused: g.paused, hold: g.hold, tut: g.tutorial, hp: g.health, q: g.q }; });
const sdk = page => G(page, () => __sdk.slice());
const startByClick = async page => { await page.mouse.click(640, 300); await page.mouse.move(700, 330, { steps: 5 }); await page.mouse.move(560, 300, { steps: 5 }); await page.mouse.move(640, 300, { steps: 5 }); };
const alive = page => G(page, () => { window.__keep = setInterval(() => { const g = __TEST_HOOKS.game; if (g.state === 'play') { g.health = g.maxHealth; g.target.x = g.ball.x; g.target.y = g.ball.y; } }, 16); });

// ---- 1. first load, cleared storage ----
{
  const { page, errs, hosts, ctx } = await open();
  ok('no console errors on load', errs.length === 0, errs.join(' | '));
  ok('no dev UI in build', await G(page, () => !document.getElementById('gear') && !document.getElementById('panel')));
  ok('no privacy notice (no telemetry)', await G(page, () => !document.getElementById('priv')));
  ok('no modal on first load', await G(page, () => !document.querySelector('#streak.open, #settings.open, #coll.open')));
  ok('SDK init + loading events', JSON.stringify(await sdk(page)) === JSON.stringify(['init', 'loadingStart', 'loadingStop']), JSON.stringify(await sdk(page)));
  await page.mouse.move(600, 300); await page.mouse.move(700, 350, { steps: 10 }); await page.waitForTimeout(200);
  ok('moving the mouse does not start a run', (await state(page)).s === 'start');
  await page.mouse.click(640, 300); await page.waitForTimeout(150);
  let s = await state(page);
  ok('one click starts the run', s.s === 'play');
  ok('gameplayStart on run start', (await sdk(page)).at(-1) === 'gameplayStart');
  await page.waitForTimeout(2500); s = await state(page);
  ok('run 1 holds until the player moves (no timer, no damage)', s.hold && s.t === 0 && s.tut === 'move' && s.hp === 100, JSON.stringify(s));
  await page.mouse.move(760, 340, { steps: 8 }); await page.mouse.move(600, 300, { steps: 8 }); await page.waitForTimeout(900); s = await state(page);
  ok('moving releases the ball and starts the timer', !s.hold && s.t > 0 && s.tut === 'centre', JSON.stringify(s));
  await alive(page);
  // ---- 2. pause paths, each must send exactly one stop and one start ----
  const pauseCase = async (name, doPause, doResume) => {
    const n0 = (await sdk(page)).length; await doPause(); await page.waitForTimeout(250);
    const p = await state(page), ev1 = (await sdk(page)).slice(n0);
    await doResume(); await page.waitForTimeout(300); const mid = await state(page); await page.waitForTimeout(1100);
    const r = await state(page), ev2 = (await sdk(page)).slice(n0);
    ok(`pause via ${name}: stops, counts down, resumes`, p.paused && JSON.stringify(ev1) === '["gameplayStop"]' && mid.paused && !r.paused && JSON.stringify(ev2) === '["gameplayStop","gameplayStart"]', JSON.stringify({ ev1, ev2, mid: mid.paused, end: r.paused }));
  };
  await pauseCase('window blur', () => G(page, () => window.dispatchEvent(new Event('blur'))), () => page.keyboard.press('Space'));
  await pauseCase('tab hidden', () => G(page, () => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); }),
    async () => { await G(page, () => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); }); await page.mouse.click(640, 400); });
  await pauseCase('pause button', () => page.click('#rPause'), () => page.keyboard.press('KeyD'));
  await pauseCase('P key', () => page.keyboard.press('KeyP'), () => page.mouse.click(640, 400));
  // ---- 3. restricted keys ----
  let before = await state(page); await page.keyboard.press('Escape'); await page.waitForTimeout(150); let after = await state(page);
  ok('Escape does nothing during play', after.s === 'play' && !after.paused && before.s === 'play');
  // ---- 4. mute ----
  await page.keyboard.press('KeyM'); ok('M mutes', await G(page, () => Audio_.muted && document.getElementById('mute').classList.contains('off')));
  await page.keyboard.press('KeyM'); ok('M unmutes', await G(page, () => !Audio_.muted));
  await page.click('#mute'); ok('mute button mutes and run continues', await G(page, () => Audio_.muted) && (await state(page)).s === 'play');
  // ---- 5. banking an interrupted run ----
  await page.waitForTimeout(3500);
  const banked = await G(page, () => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); return JSON.parse(localStorage.getItem('scrollgame.meta')).pending; });
  ok('leaving mid-run banks shards and xp', banked && banked.shards >= 2 && banked.xp > 5, JSON.stringify(banked));
  const p2 = await open(1280, 720, ctx);
  const note = await G(p2.page, () => ({ notice: __TEST_HOOKS.meta.notice.join('|'), shards: __TEST_HOOKS.meta.shards, muted: Audio_.muted }));
  ok('next open confirms banked earnings', /Banked \d+ shards/.test(note.notice) && note.shards >= banked.shards, JSON.stringify(note));
  ok('mute setting persists', note.muted === true);
  // ---- 6. death, game over, retry ----
  const page3 = p2.page; await page3.mouse.click(640, 300); await page3.waitForTimeout(200);
  const n0 = (await sdk(page3)).length;
  await G(page3, () => { const g = __TEST_HOOKS.game; g.hold = false; g.shield = 0; g.health = 0.001; g.ball.x = 5; });
  await page3.waitForFunction(() => __TEST_HOOKS.game.state === 'over'); await page3.waitForTimeout(900);
  ok('gameplayStop on death', JSON.stringify((await sdk(page3)).slice(n0)) === '["gameplayStop"]', JSON.stringify((await sdk(page3)).slice(n0)));
  ok('retry button visible', await page3.isVisible('#retry'));
  const t0 = Date.now(); await page3.keyboard.press('Space'); await page3.waitForFunction(() => __TEST_HOOKS.game.state === 'play'); const dt = Date.now() - t0;
  ok('retry with Space is immediate', dt < 400, dt + ' ms');
  ok('gameplayStart on retry', (await sdk(page3)).at(-1) === 'gameplayStart');
  const seq = await sdk(page3); let alt = true; for (let i = 1; i < seq.length; i++) if (/gameplay/.test(seq[i]) && seq[i] === seq.slice(0, i).reverse().find(x => /gameplay/.test(x))) alt = false;
  ok('gameplay events strictly alternate', alt, seq.join(','));
  // ---- 7. settings: Escape, reduce motion, left-handed ----
  await G(page3, () => { const g = __TEST_HOOKS.game; g.hold = false; g.shield = 0; g.health = 0.001; g.ball.x = 5; });
  await page3.waitForFunction(() => __TEST_HOOKS.game.state === 'over'); await page3.waitForTimeout(700);
  await page3.click('#rSet'); await page3.keyboard.press('Escape'); await page3.waitForTimeout(100);
  ok('Escape is not bound in menus', await G(page3, () => document.getElementById('settings').classList.contains('open')));
  await page3.click('#setRm'); await page3.click('#setLefty');
  ok('reduce motion on', await G(page3, () => __TEST_HOOKS.game.reduceMotion === true && localStorage.getItem('scrollgame.rm') === '1'));
  ok('Space with a sheet open does not start a run', await (async () => { await page3.click('#setClose'); await page3.click('#rSet'); await page3.keyboard.press('Space'); await page3.waitForTimeout(150); return (await state(page3)).s === 'over'; })());
  await G(page3, () => { __TEST_HOOKS.meta.pw.recentre = 1; }); await page3.keyboard.press('Space'); await page3.waitForTimeout(300);
  ok('left-handed mode moves power-up buttons to the right edge', await G(page3, () => { const r = document.querySelector('#pw button').getBoundingClientRect(); return document.getElementById('pw').classList.contains('r') && r.left > innerWidth / 2; }));
  await G(page3, () => { const g = __TEST_HOOKS.game; g.hold = false; g.health = g.maxHealth; g.ball.x = g.target.x + 40; }); await page3.keyboard.press('Digit1'); await page3.waitForTimeout(80);
  ok('power-up key 1 works (recentre)', await G(page3, () => __TEST_HOOKS.game.pw.cd.recentre > 0));
  await G(page3, () => { const g = __TEST_HOOKS.game; for (let i = 0; i < 6; i++) fxEvent('hit', { x: g.ball.x, y: g.ball.y, dmg: 5 }); }); await page3.waitForTimeout(60);
  ok('reduce motion: no shake, hit-stop or slow-mo', await G(page3, () => { const g = __TEST_HOOKS.game; return g.shake === 0 && g.hitStop <= 0 && g.slowMo <= 0 && fx.shake === 0; }));
  ok('no requests to other hosts', [...p2.hosts, ...hosts].every(h => /^localhost|^sdk\.crazygames\.com$/.test(h)), [...new Set([...p2.hosts, ...hosts])].join(','));
  ok('no console errors through the session', errs.length + p2.errs.length === 0, [...errs, ...p2.errs].join(' | '));
  await ctx.close();
}
// ---- 8. touch + keyboard starts, portrait ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const { page, errs } = await open(390, 844, ctx);
  await page.touchscreen.tap(195, 600); await page.waitForTimeout(200);
  ok('touch: one tap starts', (await state(page)).s === 'play');
  ok('portrait field fills the width', await G(page, () => { const r = document.getElementById('c').getBoundingClientRect(); return Math.abs(r.width - innerWidth) < 2; }));
  ok('touch: no console errors', errs.length === 0, errs.join('|')); await ctx.close();
  const k = await open(1077, 606); await k.page.keyboard.press('KeyW'); await k.page.waitForTimeout(150);
  ok('keyboard: W starts and steers', (await state(k.page)).s === 'play'); await k.ctx.close();
}
for (const r of res) console.log(r[0], r[1], r[0] === 'FAIL' ? '-> ' + r[2] : '');
console.log(fails ? `${fails} FAILED` : `all ${res.length} checks passed`);
await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
