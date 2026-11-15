// ============================================================
// Screens: title / game-over / pause (canvas layer) + DOM chrome (icon rail, settings sheet, daily streak card,
// game-over buttons, privacy toast, desktop letterbox side panels). Gameplay stage stays 450x800.
// ============================================================
const STORE_RM = 'scrollgame.rm', STORE_STREAK = 'scrollgame.streakSeen';
const SCR = { seen: false, goKey: -1, lastShown: -1, tickAt: 0, lvlSfx: false, st: '', settingsOpen: false, streakOpen: false, streakChecked: false, sig: '', side: '' };
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

// Which input the copy and tutorial should describe: the one actually used; before any input, a pointer-type guess.
function inputKind() { return SCR.seen ? (lastPtr === 'touch' ? 'touch' : lastPtr === 'key' ? 'key' : 'mouse') : (scrFine() ? 'mouse' : 'touch'); }
const C_SHARD = '#ffd84d', C_UI = '#6ff', C_GOOD = '#7fff9a', C_DIM = '#9fb6cc';
function scrShard(x, y, r) { ctx.save(); ctx.fillStyle = C_SHARD; glow(C_SHARD, 6); ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.8, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.8, y); ctx.closePath(); ctx.fill(); ctx.restore(); }
// Wordmark: NEON (small, magenta) over BULLSEYE (large, cyan), fitted to the field width. Also used by the store covers.
function drawWordmark(cx, y, maxW) {
  ctx.save();
  ctx.font = '56px ' + FONT_DISPLAY; const w = ctx.measureText('BULLSEYE').width || 300, k = Math.min(1, maxW / w), sz = 56 * k;
  textAt('NEON', cx, y - sz * 0.78, Math.max(18, sz * 0.42), '#ff4de0', 16, { font: 'display', ls: sz * 0.5 });
  textAt('BULLSEYE', cx, y, sz, '#3ef0ff', 26, { font: 'display' });
  ctx.restore();
}

// ---- title ----
function drawTitle(pal) {
  const g = game, now = performance.now() / 1000, cy = PH * START_Y, cx = W / 2, kind = inputKind();
  drawWordmark(cx, cy - 122, Math.min(W - 70, 420));
  ctx.globalAlpha = 0.7 + 0.3 * Math.sin(now * 3.5);
  scrText(kind === 'touch' ? 'TAP TO PLAY' : kind === 'key' ? 'PRESS SPACE' : 'CLICK TO PLAY', cy + 126, 27, '#ffee66', 14, { font: 'display' });
  ctx.globalAlpha = 1;
  scrText('Keep the ball in the ring' + (kind === 'touch' ? '' : '  ·  mouse, arrows or WASD'), cy + 156, 15, '#cfe6f5', 0);
  let y = cy + 196;
  if (prog.runs > 0) { // returning player: best + level
    const li = lvlInfo(meta.xp);
    textAt('BEST ' + fmtTime(g.best) + 's', cx - 16, y, 18, '#ffffff', 6, { font: 'display', align: 'right' });
    textAt('LEVEL ' + li.lvl, cx + 16, y, 18, C_UI, 6, { font: 'display', align: 'left' });
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(cx + 16, y + 14, 86, 3); ctx.fillStyle = C_UI; ctx.fillRect(cx + 16, y + 14, 86 * li.into / li.need, 3);
    y += 42;
  }
  // Missions: always a named target for the next run
  const x0 = cx - 158;
  for (const m of MISSIONS) {
    const c = missionNow(m); if (!c) continue;
    scrShard(x0 + 5, y, 6);
    textAt(c.text, x0 + 18, y, 15, '#e6f6ff', 0, { align: 'left' });
    const f = clamp(c.v / c.target, 0, 1); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(cx + 62, y - 2, 50, 4); ctx.fillStyle = C_SHARD; ctx.fillRect(cx + 62, y - 2, 50 * f, 4);
    textAt('+' + c.reward, x0 + 316, y, 15, C_SHARD, 0, { align: 'right' });
    y += 25;
  }
  meta.notice.slice(0, 2).forEach((n, i) => scrText(n, y + 8 + i * 22, 14, C_SHARD, 4));
}

// ---- first-run tutorial: one animated control glyph + three words, matched to the input in use ----
function drawTutorial() {
  const g = game, tut = g.tutorial; if (!tut || g.state !== 'play' || g.paused) return;
  const kind = inputKind(), t = fx.t, cx = W / 2, y = Math.min(PH - 62, Math.max(g.target.y + 150, PH * 0.74));
  const head = tut === 'move' ? 'MOVE THE RING' : tut === 'centre' ? 'KEEP THE BALL CENTRED' : 'DODGE THE SHAPES';
  const sub = tut === 'move' ? (kind === 'touch' ? 'Drag anywhere' : kind === 'key' ? 'Arrow keys or WASD' : 'Move your mouse')
    : tut === 'centre' ? 'It gets pushed away when it leaves the middle' : 'Hits break the ring';
  ctx.save();
  if (tut === 'move') {
    const iy = y - 50, sway = Math.sin(t * 3) * 24; ctx.strokeStyle = '#dffcff'; ctx.fillStyle = '#dffcff'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; glow('#6ff', 8);
    if (kind === 'key') {
      const on = Math.floor(t * 2) % 4, K = [[0, -30, -1.571], [-32, 0, 3.1416], [0, 0, 1.571], [32, 0, 0]];
      K.forEach((k, i) => { ctx.globalAlpha = i === on ? 1 : 0.5; scrRR(cx + k[0] - 13, iy + k[1] - 13 + 8, 26, 26, 6); ctx.stroke();
        ctx.save(); ctx.translate(cx + k[0], iy + k[1] + 8); ctx.rotate(k[2]); ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-3, -5); ctx.lineTo(-3, 5); ctx.closePath(); ctx.fill(); ctx.restore(); });
    } else if (kind === 'touch') {
      ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(cx + sway, iy, 11, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(cx + sway, iy, 19, 0, 6.283); ctx.stroke();
      ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.moveTo(cx - 34, iy); ctx.lineTo(cx + 34, iy); ctx.stroke();
    } else {
      ctx.globalAlpha = 0.95; scrRR(cx + sway - 12, iy - 18, 24, 36, 12); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + sway, iy - 11); ctx.lineTo(cx + sway, iy - 3); ctx.stroke();
      ctx.globalAlpha = 0.5; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + d * 44, iy - 6); ctx.lineTo(cx + d * 52, iy); ctx.lineTo(cx + d * 44, iy + 6); ctx.stroke(); }
    }
    noGlow(); ctx.globalAlpha = 1;
  }
  const wT = 0.75 + 0.25 * Math.sin(t * 4);
  ctx.fillStyle = 'rgba(3,1,9,0.5)'; scrRR(cx - 190, y - 20, 380, 62, 14); ctx.fill();
  textAt(head, cx, y, 21, '#eaffff', 10, { font: 'display', alpha: wT });
  textAt(sub, cx, y + 26, 15, '#cfe6f5', 0);
  ctx.restore();
}

// ---- game over: result, how far you got, what you earned, what to go for next. Retry is never blocked. ----
function scrGoalLine() { const gi = metaGoalInfo(); return gi && !gi.afford ? gi : null; }
function drawGameOver(pal) {
  const g = game, rs = g.runSum, el = performance.now() - g.overAt, cx = W / 2, oy = (H - REF_H) / 2;
  if (SCR.goKey !== g.overAt) { SCR.goKey = g.overAt; SCR.lastShown = -1; SCR.lvlSfx = false; }
  const a = clamp((el - 450) / 300, 0, 1);      // death animation plays first; summary fades in
  if (a <= 0) return;
  ctx.fillStyle = 'rgba(3,1,9,' + (0.86 * a) + ')'; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a;
  monoText(fmtTime(g.t), cx - 14, oy + 104, 76, '#ffffff', 18);
  ctx.font = '76px ' + FONT_DISPLAY; const tw = (fmtTime(g.t).length - 0.5) * (+ctx.measureText('0').width || 50);
  textAt('S', cx - 14 + tw / 2 + 20, oy + 118, 28, '#ffffff', 8, { font: 'display', alpha: 0.7 });
  const gap = Math.max(0, g.best - g.t);
  if (g.newBest) scrText('NEW BEST!', oy + 160, 26, '#ffee00', 18, { font: 'display', alpha: 0.75 + 0.25 * Math.sin(performance.now() / 150) });
  else if (gap <= 3) scrText('SO CLOSE!  ' + fmtTime(gap) + 's OFF YOUR BEST', oy + 160, 18, '#ffee66', 10, { font: 'display' });
  else scrText('BEST ' + fmtTime(g.best) + 's', oy + 160, 17, C_DIM, 0, { font: 'display' });
  // stage strip
  const names = scrNames(), idx = scrStageIdx(), sx = cx - 140, sy = oy + 204;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 280, sy); ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const x = sx + i * 40, col = palette(i)[2], on = i <= idx;
    ctx.beginPath(); ctx.arc(x, sy, i === idx ? 9 : 6, 0, 6.283);
    if (on) { ctx.save(); glow(col, i === idx ? 14 : 6); ctx.fillStyle = col; ctx.fill(); ctx.restore(); }
    else { ctx.fillStyle = '#0b0920'; ctx.fill(); ctx.strokeStyle = i === idx + 1 ? col : 'rgba(255,255,255,0.3)'; ctx.lineWidth = i === idx + 1 ? 2 : 1.5; ctx.stroke(); }
  }
  scrText('STAGE ' + (idx + 1) + ' · ' + names[idx] + (idx < 7 ? '      NEXT: ' + names[idx + 1] : ''), sy + 27, 14, '#dff', 0, { font: 'display', alpha: 0.9 });
  // shards earned (counts up)
  let shards = 0;
  if (rs) {
    const u = clamp((el - 750) / 900, 0, 1), e = 1 - Math.pow(1 - u, 3); shards = Math.round(rs.shards * e);
    if (shards !== SCR.lastShown) { SCR.lastShown = shards; if (performance.now() - SCR.tickAt > 45 && u < 1 && typeof Audio_ !== 'undefined') { SCR.tickAt = performance.now(); Audio_.sfx('tick'); } }
  }
  ctx.font = '30px ' + FONT_DISPLAY; const sw = ctx.measureText('+' + shards).width;
  textAt('+' + shards, cx + 12, oy + 278, 30, C_SHARD, 10, { font: 'display' }); scrShard(cx - sw / 2 - 6, oy + 277, 10);
  // what happened: every unlock, level-up, mission and quest (up to three lines)
  const hl = [];
  for (const n of g.unlockedNow) hl.push(['UNLOCKED: ' + n, C_GOOD]);
  if (rs) { if (rs.up) hl.push(['LEVEL UP! LEVEL ' + rs.lvl, C_UI]); for (const l of rs.lines) if (!/^Level/.test(l[0])) hl.push([l[0].replace(/^(Mission|Quest): /, '$1 done: '), C_SHARD]); }
  if (hl.length > 3) { const more = hl.length - 2; hl.length = 2; hl.push(['+ ' + more + ' more rewards', C_DIM]); }
  if (hl.length && el > 1500) {
    if (!SCR.lvlSfx) { SCR.lvlSfx = true; if (typeof Audio_ !== 'undefined' && rs && rs.up && !g.unlockedNow.length) Audio_.sfx('levelUp'); }
    hl.forEach((h, i) => { const k = clamp((el - 1500 - i * 160) / 200, 0, 1); if (k > 0) textAt(h[0], cx, oy + 322 + i * 25 + (1 - k) * 6, 15, h[1], 6, { font: i < g.unlockedNow.length || /LEVEL UP/.test(h[0]) ? 'display' : 'ui', alpha: k }); });
  }
  // next goal: progress towards the cheapest upgrade (the UPGRADE button replaces this when it is affordable)
  const gl = scrGoalLine();
  if (gl) {
    scrText('Next upgrade: ' + gl.u.name + '  ·  ' + Math.floor(meta.shards) + ' / ' + gl.c, oy + 440, 14, '#e6f6ff', 0);
    scrBar(oy + 456, 240, 6, gl.frac, C_SHARD);
  }
  scrText(inputKind() === 'touch' ? 'or tap anywhere' : 'Space, Enter or click anywhere', oy + 586, 13, C_DIM, 0);
  ctx.globalAlpha = 1;
}

function drawOverlayScreens(pal) {
  const g = game;
  if (g.state === 'start') drawTitle(pal);
  else if (g.state === 'over') drawGameOver(pal);
  else drawTutorial();
  if (g.paused && g.state === 'play' && !panelOpen) {
    ctx.fillStyle = 'rgba(3,1,9,0.62)'; ctx.fillRect(0, 0, W, H);
    if (g.resumeT > 0) scrText(String(Math.max(1, Math.ceil(g.resumeT / (RESUME_S / 3)))), H * 0.42, 84, '#fff', 20, { font: 'display' });
    else {
      scrText('PAUSED', H * 0.4, 44, '#fff', 14, { font: 'display' });
      const k = inputKind();
      scrText(k === 'touch' ? 'Tap to resume' : k === 'key' ? 'Press any key to resume' : 'Click or press any key to resume', H * 0.4 + 46, 17, '#cfe6f5', 0);
    }
  }
}

// ============================================================
// DOM chrome
// ============================================================
const railEls = { shop: scrEl('rShop'), col: scrEl('rCol'), daily: scrEl('rDaily'), set: scrEl('rSet'), pause: scrEl('rPause') };
const dotOf = b => b.querySelector('.dot');
for (const id of ['rShop', 'goUp', 'rCol', 'rDaily', 'rSet', 'rPause', 'retry', 'setRm', 'setLefty', 'setClose', 'stOk']) {
  const b = scrEl(id); for (const ev of ['pointerdown', 'pointerup', 'touchstart', 'mousedown']) b.addEventListener(ev, e => e.stopPropagation());
}
railEls.shop.addEventListener('click', () => { Audio_.unlock(); openCollTab('upgrades'); });
scrEl('goUp').addEventListener('click', () => { Audio_.unlock(); openCollTab('upgrades'); });
railEls.col.addEventListener('click', () => { Audio_.unlock(); openCollTab('balls'); });
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
  if (prog.runs < 1) { lsSet(STORE_STREAK, today); meta.notice = meta.notice.filter(n => !/^Daily bonus/.test(n)); return; } // first session is play only: no card, no bonus line
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
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (SCR.streakOpen) openStreak(false); else openSettings(false); }
}, true);

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
  if (st === 'play') SCR.seen = true;
  const up = showGo && gi && gi.afford;
  const sig = [showGo, up, gi ? gi.u.id + gi.c : '', anyUpgradeAffordable(), dailyDone() > (meta.dq || 0)].join();
  if (sig === SCR.sig) return; SCR.sig = sig;
  scrEl('retry').classList.toggle('show', showGo);
  const gb = scrEl('goUp'); gb.classList.toggle('show', !!up); if (up) gb.textContent = 'UPGRADE READY: ' + gi.u.name.toUpperCase() + '  \u25c6 ' + gi.c;
  dotOf(railEls.shop).classList.toggle('on', anyUpgradeAffordable());
  dotOf(railEls.daily).classList.toggle('on', dailyDone() > (meta.dq || 0));
}
