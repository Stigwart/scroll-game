// ============================================================
// Screens: title / game-over / pause (canvas layer) + DOM chrome (icon rail, settings sheet, daily streak card,
// game-over buttons, privacy toast, desktop letterbox side panels). Gameplay stage stays 450x800.
// ============================================================
const STORE_RM = 'scrollgame.rm', STORE_STREAK = 'scrollgame.streakSeen';
const SCR = { goKey: -1, lastShown: -1, tickAt: 0, lvlSfx: false, st: '', settingsOpen: false, streakOpen: false, streakChecked: false, sig: '', side: '' };
const scrEl = id => document.getElementById(id);
const scrFine = () => { try { return typeof window.matchMedia === 'function' && !!window.matchMedia('(pointer:fine)').matches; } catch (e) { return false; } };

// ---- Reduce motion (SIM reads game.reduceMotion; this owns the stored setting) ----
function setReduceMotion(v) { game.reduceMotion = !!v; lsSet(STORE_RM, v ? '1' : '0'); }
(function () {
  const v = lsGet(STORE_RM); let pref = false;
  try { pref = typeof window.matchMedia === 'function' && !!window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  game.reduceMotion = v === '1' || (v === null && pref);
})();

// ---- canvas helpers ----
function scrText(str, y, size, color, blur, opts) { // FX's textAt when present, else textCenter
  if (typeof textAt === 'function') textAt(str, W / 2, y, size, color, blur, Object.assign({ align: 'center' }, opts)); else textCenter(str, y, size, color, blur);
}
function scrRR(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function scrBar(y, w, h, f, color) {
  const x = (W - w) / 2; ctx.fillStyle = 'rgba(255,255,255,0.15)'; scrRR(x, y, w, h, h / 2); ctx.fill();
  if (f > 0.001) { ctx.save(); glow(color, 8); ctx.fillStyle = color; scrRR(x, y, Math.max(h, w * clamp(f, 0, 1)), h, h / 2); ctx.fill(); ctx.restore(); }
}
const scrNames = () => CONFIG.stageNames || ['CALM', 'PULSE', 'HEAT', 'REDLINE', 'TOXIC', 'SOLAR', 'VOID', 'BULLSEYE'];
function scrStageIdx() {
  const n = scrNames().length, s = game.stats && typeof game.stats.stageMax === 'number' ? game.stats.stageMax : Math.floor(game.stageF());
  return clamp(s, 0, n - 1);
}
function scrQuest() { for (const q of todaysQuests()) if (!meta.q.done[q.id]) return { q, v: Math.min(q.target, Math.floor(meta.q[q.metric] || 0)) }; return null; }

// ---- title ----
function drawTitle(pal) {
  const g = game, now = performance.now() / 1000;
  scrText('BULLSEYE', 78, Math.min(54, W / 7.5), pal[2], 26, { font: 'display' });
  scrText('KEEP THE BALL IN THE RING', 112, 13, '#bde', 6);
  ctx.globalAlpha = 0.65 + 0.35 * Math.sin(now * 3.5);
  scrText('Drag to play', 350, 30, '#ffee66', 14, { font: 'display' });
  ctx.globalAlpha = 1;
  if (scrFine()) scrText('Mouse / arrows / WASD', 384, 16, '#bde', 6);
  if (g.best > 0) scrText('BEST ' + fmtTime(g.best) + 's', 440, 24, '#ffffff', 8, { font: 'display' });
  const li = lvlInfo(meta.xp);   // level badge
  ctx.save(); glow(pal[2], 8); ctx.strokeStyle = pal[2]; ctx.lineWidth = 1.5; ctx.fillStyle = 'rgba(5,3,13,0.55)'; scrRR(W / 2 - 62, 462, 124, 30, 15); ctx.fill(); ctx.stroke(); ctx.restore();
  scrText('LEVEL ' + li.lvl, 477, 15, '#9ff', 4);
  scrBar(498, 100, 5, li.into / li.need, '#6ff');
  const gi = metaGoalInfo();
  if (gi && gi.afford) scrText('◆ Upgrade ready: open the Collection', 540, 16, '#ffd84d', 8);
  meta.notice.slice(0, 2).forEach((n, i) => scrText(n, 574 + i * 24, 15, '#ffd84d', 6));
}

// ---- game over (brief 3.6) ----
function drawGameOver(pal) {
  const g = game, rs = g.runSum, el = performance.now() - g.overAt;
  if (SCR.goKey !== g.overAt) { SCR.goKey = g.overAt; SCR.lastShown = -1; SCR.lvlSfx = false; }
  const a = clamp((el - 450) / 300, 0, 1);      // death animation plays first; summary fades in, retry is never blocked
  if (a <= 0) return;
  ctx.fillStyle = 'rgba(3,1,9,' + (0.84 * a) + ')'; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a;
  // Option A: score, one result line, ONE highlight, retry (DOM button). Meta detail lives on the title screen / rail dots.
  scrText(fmtTime(g.t) + 's', 196, 84, '#ffffff', 20, { font: 'display' });
  if (g.newBest) { ctx.globalAlpha = a * (0.75 + 0.25 * Math.sin(performance.now() / 150)); scrText('NEW BEST!', 262, 30, '#ffee00', 20, { font: 'display' }); ctx.globalAlpha = a; }
  else scrText('\u2212' + fmtTime(Math.max(0, g.best - g.t)) + 's from best', 262, 22, '#9ff', 8);
  const names = scrNames(), idx = scrStageIdx();
  let shards = 0;
  if (rs) {
    const u = clamp((el - 750) / 900, 0, 1), e = 1 - Math.pow(1 - u, 3); shards = Math.round(rs.shards * e);
    if (shards !== SCR.lastShown) { SCR.lastShown = shards; if (performance.now() - SCR.tickAt > 45 && u < 1 && typeof Audio_ !== 'undefined') { SCR.tickAt = performance.now(); Audio_.sfx('tick'); } }
  }
  scrText('reached ' + names[idx] + '  \u00b7  +' + shards + ' \u25c6', 312, 20, pal[2], 8, { font: 'display' });
  // The single best thing that happened: unlock > level up > quest
  let hl = null;
  if (g.unlockedNow.length) hl = ['\u2726 Unlocked: ' + g.unlockedNow[0], '#7fff9a'];
  else if (rs && rs.up) hl = ['LEVEL UP!  Level ' + rs.lvl, '#6ff'];
  else if (rs) { const q = rs.lines.find(l => /^Quest/.test(l[0])); if (q) hl = [q[0], '#ffd84d']; }
  if (hl && el > 1700) {
    if (!SCR.lvlSfx) { SCR.lvlSfx = true; if (typeof Audio_ !== 'undefined') if (!g.unlockedNow.length && rs && rs.up) Audio_.sfx('levelUp'); }
    ctx.globalAlpha = a * clamp((el - 1700) / 200, 0, 1);
    scrText(hl[0], 384, 22, hl[1], 14, { font: 'display' });
  }
  ctx.globalAlpha = 1;
}

function drawOverlayScreens(pal) {
  const g = game;
  if (g.state === 'start') drawTitle(pal);
  else if (g.state === 'over') drawGameOver(pal);
  if (g.paused && g.state === 'play' && !panelOpen) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
    scrText('PAUSED', H * 0.4, 40, '#fff', 14, { font: 'display' });
    scrText('Click / tap / any key to resume', H * 0.4 + 46, 18, '#9ff', 6);
  }
}

// ============================================================
// DOM chrome
// ============================================================
const railEls = { col: scrEl('rCol'), daily: scrEl('rDaily'), set: scrEl('rSet'), pause: scrEl('rPause') };
const dotOf = b => b.querySelector('.dot');
for (const id of ['rCol', 'rDaily', 'rSet', 'rPause', 'retry', 'setRm', 'setLefty', 'setClose', 'stOk']) {
  const b = scrEl(id); for (const ev of ['pointerdown', 'pointerup', 'touchstart', 'mousedown']) b.addEventListener(ev, e => e.stopPropagation());
}
railEls.col.addEventListener('click', () => { Audio_.unlock(); openColl(); });
railEls.daily.addEventListener('click', () => { Audio_.unlock(); openCollTab('daily'); });
railEls.set.addEventListener('click', () => openSettings(true));
railEls.pause.addEventListener('click', () => { if (game.state === 'play' && !game.paused) autoPause(); });
scrEl('retry').addEventListener('click', () => { Audio_.unlock(); if (game.state === 'over' && performance.now() - game.overAt > 300) startRun(); });

// settings sheet
function openSettings(on) { SCR.settingsOpen = on; scrEl('settings').classList.toggle('open', on); if (on) syncSettings(); }
function syncSettings() { scrEl('setRm').textContent = game.reduceMotion ? 'ON' : 'OFF'; scrEl('setLefty').textContent = meta.lefty ? 'ON' : 'OFF'; }
scrEl('setRm').addEventListener('click', () => { setReduceMotion(!game.reduceMotion); syncSettings(); });
scrEl('setLefty').addEventListener('click', () => { meta.lefty = !meta.lefty; metaSave(); syncSettings(); });
scrEl('setClose').addEventListener('click', () => openSettings(false));

// daily streak card: once per day on first open
function openStreak(on) { SCR.streakOpen = on; scrEl('streak').classList.toggle('open', on); }
scrEl('stOk').addEventListener('click', () => openStreak(false));
scrEl('streak').addEventListener('click', e => { if (e.target === scrEl('streak')) openStreak(false); });
function checkStreakCard() {
  SCR.streakChecked = true;
  const today = dayKey(new Date());
  if (meta.lastDay !== today || lsGet(STORE_STREAK) === today) return;
  lsSet(STORE_STREAK, today);
  scrEl('stDays').innerHTML = streakHTML();
  scrEl('stTxt').textContent = 'Day ' + meta.streak + ' streak: +' + DAILY[(meta.streak - 1) % 7] + ' shards. Day 7 pays +' + DAILY[6] + '!';
  openStreak(true);
}
// keep Space/Enter/arrows from starting a run while a sheet is open
window.addEventListener('keydown', e => {
  if (!SCR.settingsOpen && !SCR.streakOpen) return;
  e.stopPropagation();
  if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (SCR.streakOpen) openStreak(false); else openSettings(false); }
}, true);

// letterbox: neon side panels on wide viewports
function layoutSides() {
  const vw = window.innerWidth, lb = Math.max(0, (vw - STAGE_W * SCALE) / 2);
  document.body.style.setProperty('--lb', lb + 'px');
  const on = lb >= 150; scrEl('sideL').classList.toggle('on', on); scrEl('sideR').classList.toggle('on', on);
}
window.addEventListener('resize', layoutSides);
layoutSides();

function anyUpgradeAffordable() {
  for (const u of UPG) { const l = upgLvl(u); if (l < u.max && meta.shards >= upgCost(u, l)) return true; }
  for (const d of PWS) if (!meta.pw[d.id] && meta.shards >= d.cost) return true;
  return false;
}
// Called every frame (99-main): only touches the DOM when something changed
function syncScreens() {
  const g = game, st = g.state;
  if (st !== SCR.st) { SCR.st = st; stageEl.dataset.st = st; }
  if (!SCR.streakChecked && st === 'start') checkStreakCard();
  if (SCR.streakOpen && st !== 'start') openStreak(false);
  const el = performance.now() - g.overAt, gi = metaGoalInfo();
  const showGo = st === 'over' && el > 450 && !collOpen && !SCR.settingsOpen;
  const sig = [showGo, !!(gi && gi.afford), gi ? gi.u.id : '', anyUpgradeAffordable(), dailyDone() > (meta.dq || 0), Math.floor(meta.shards), Math.floor(g.best * 10), playerLvl()].join();
  if (sig === SCR.sig) return; SCR.sig = sig;
  scrEl('retry').classList.toggle('show', showGo);
  dotOf(railEls.col).classList.toggle('on', anyUpgradeAffordable());
  dotOf(railEls.daily).classList.toggle('on', dailyDone() > (meta.dq || 0));
  const li = lvlInfo(meta.xp);
  const left = '<h3>BULLSEYE</h3><div><div class="k">BEST</div><div class="v">' + fmtTime(g.best) + 's</div></div><div><div class="k">LEVEL</div><div class="v">' + li.lvl + '</div></div><div><div class="k">SHARDS</div><div class="v">&#9670; ' + Math.floor(meta.shards) + '</div></div>';
  const right = '<div class="k">CONTROLS</div><div>Move: <kbd>Mouse</kbd></div><div><kbd>&larr;</kbd><kbd>&uarr;</kbd><kbd>&darr;</kbd><kbd>&rarr;</kbd> or <kbd>WASD</kbd></div><div>Retry: <kbd>Space</kbd></div><div>Power-ups: <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd></div><div class="k">Keep the ball in the bullseye</div>';
  if (left !== SCR.side) { SCR.side = left; scrEl('sideL').innerHTML = left; scrEl('sideR').innerHTML = right; }
}
