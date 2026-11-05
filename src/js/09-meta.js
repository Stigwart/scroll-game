// ============================================================
// Meta progression: shards (currency), XP/levels, permanent upgrades, daily streak + quests, banking on interruption.
// All state lives in one versioned object (meta) so the CrazyGames Data module can store it as a single blob later.
// ============================================================
const STORE_META = 'scrollgame.meta';
const MOD = { sweet: 0, hp: 1, drift: 1, shard: 1, sweetTemp: 0, calm: 1 };   // permanent upgrade (and temporary power-up) modifiers read by the sim
// New-player assist: bigger sweet spot and slower health loss in the first two runs
const assist = () => { const r = typeof prog !== 'undefined' ? prog.runs : 9; return r < 1 ? 1 : r < 2 ? 0.5 : 0; };
const sweetR = () => T.sweet + MOD.sweet + MOD.sweetTemp + 10 * assist();
const UPG = [
  { id: 'sweet',  name: 'Sweet Spot',   desc: '+3 radius per level',  max: 5, base: 40, apply: l => { MOD.sweet = 3 * l; } },
  { id: 'hull',   name: 'Sturdy Hull',  desc: '+8% health per level', max: 5, base: 40, apply: l => { MOD.hp = 1 + 0.08 * l; } },
  { id: 'calm',   name: 'Calm Drift',   desc: '-6% drift per level',  max: 5, base: 50, apply: l => { MOD.drift = 1 - 0.06 * l; } },
  { id: 'magnet', name: 'Shard Magnet', desc: '+10% shards per level', max: 5, base: 60, apply: l => { MOD.shard = 1 + 0.1 * l; } }
];
const upgCost = (u, lvl) => Math.round(u.base * Math.pow(1.6, lvl));
const QUESTS = [
  { id: 'surv30', text: 'Survive 30s in one run', metric: 'best', target: 30, reward: 30 },
  { id: 'runs5', text: 'Play 5 runs', metric: 'runs', target: 5, reward: 30 },
  { id: 'surv60', text: 'Survive 60s in one run', metric: 'best', target: 60, reward: 60 },
  { id: 'earn120', text: 'Earn 120 shards', metric: 'shards', target: 120, reward: 40 },
  { id: 'runs8', text: 'Play 8 runs', metric: 'runs', target: 8, reward: 45 },
  { id: 'time180', text: 'Survive 180s in total', metric: 'time', target: 180, reward: 40 }
];
const DAILY = [30, 40, 50, 60, 80, 100, 150];
const dayKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const xpNeed = n => 60 + 30 * n;                                       // xp to go from level n to n+1
function lvlInfo(xp) { let n = 1; while (xp >= xpNeed(n)) { xp -= xpNeed(n); n++; } return { lvl: n, into: xp, need: xpNeed(n) }; }

const meta = Object.assign({ v: 1, shards: 0, xp: 0, upg: {}, streak: 0, lastDay: '', day: '', q: { runs: 0, best: 0, shards: 0, time: 0, done: {} }, pending: null, notice: [] },
  (function () { try { return JSON.parse(lsGet(STORE_META)) || {}; } catch (e) { return {}; } })());
function metaSave() { lsSet(STORE_META, JSON.stringify(meta)); }
const upgLvl = u => meta.upg[u.id] || 0;
function applyMods() { for (const u of UPG) u.apply(upgLvl(u)); }
const playerLvl = () => lvlInfo(meta.xp).lvl;
function todaysQuests() {
  const k = dayKey(new Date()); let h = 0; for (const c of k) h += c.charCodeAt(0);
  return [0, 1, 2].map(i => QUESTS[(h + i * 2) % QUESTS.length]);
}
// Add xp; returns shard reward for any level-ups
function addXp(n) { const before = playerLvl(); meta.xp += n; let reward = 0, lv = playerLvl(); for (let l = before; l < lv; l++) reward += 20 + 5 * (l + 1); return { reward, lvl: lv, up: lv > before }; }

(function dailyOpen() { // new day: streak + bonus, fresh quests; bank any interrupted run
  const now = new Date(), today = dayKey(now);
  if (meta.pending) { const p = meta.pending; meta.shards += p.shards; const lv = addXp(p.xp); meta.shards += lv.reward; meta.notice.push('Banked ' + p.shards + ' shards from your last run'); meta.pending = null; }
  if (meta.lastDay !== today) {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    meta.streak = meta.lastDay === dayKey(y) ? meta.streak + 1 : 1;
    const b = DAILY[(meta.streak - 1) % 7]; meta.shards += b; meta.lastDay = today;
    meta.notice.push('Daily bonus +' + b + ' shards (day ' + meta.streak + ')');
    meta.day = today; meta.q = { runs: 0, best: 0, shards: 0, time: 0, done: {} };
  }
  applyMods(); metaSave();
})();

// Called from endRun: bank shards/xp, advance quests; returns a summary for the game-over screen
function metaOnRunEnd(t, newBest) {
  const s = { shards: Math.floor(t * 0.7 * MOD.shard) + (newBest ? 10 : 0), lines: [] };
  const xp = addXp(Math.floor(t) + 5);
  s.lvl = xp.lvl; s.xpInfo = lvlInfo(meta.xp);
  meta.shards += s.shards; meta.q.runs++; meta.q.best = Math.max(meta.q.best, t); meta.q.shards += s.shards; meta.q.time += t;
  if (xp.up) { s.lines.push(['Level ' + xp.lvl + '! +' + xp.reward + ' shards', '#6ff']); meta.shards += xp.reward; s.shards += xp.reward; }
  for (const q of todaysQuests()) if (!meta.q.done[q.id] && meta.q[q.metric] >= q.target) {
    meta.q.done[q.id] = true; meta.shards += q.reward; s.shards += q.reward; s.lines.push(['Quest: ' + q.text + ' +' + q.reward, '#ffd84d']);
  }
  meta.pending = null; metaSave(); return s;
}
function metaNextGoal() { // cheapest not-maxed upgrade
  let best = null; for (const u of UPG) { const l = upgLvl(u); if (l < u.max) { const c = upgCost(u, l); if (!best || c < best.c) best = { u, c }; } }
  if (!best) return '';
  return meta.shards >= best.c ? 'Upgrade ready: ' + best.u.name + '!' : best.u.name + ' upgrade in ' + (best.c - meta.shards) + ' shards';
}
// Bank a running run if the page is hidden/closed (brief 5.7): restored next open
function metaPend() { if (game.state === 'play' && game.t > 1) { meta.pending = { shards: Math.floor(game.t * 0.7 * MOD.shard), xp: Math.floor(game.t) + 5 }; metaSave(); } }
document.addEventListener('visibilitychange', () => { if (document.hidden) metaPend(); });
window.addEventListener('pagehide', metaPend);

// ---- Collection tabs: Upgrades + Daily (DOM rows in #grid) ----
function metaHead(el) {
  const li = lvlInfo(meta.xp), d = document.createElement('div'); d.className = 'mhead';
  d.innerHTML = '<span>&#9670; <b>' + meta.shards + '</b> shards</span><span>Level <b>' + li.lvl + '</b> <i style="width:' + Math.round(100 * li.into / li.need) + '%"></i></span>';
  el.appendChild(d);
}
function renderMeta(el, tab) {
  metaHead(el);
  if (tab === 'upgrades') for (const u of UPG) {
    const l = upgLvl(u), cost = l < u.max ? upgCost(u, l) : 0, r = document.createElement('div'); r.className = 'mrow';
    r.innerHTML = '<div class="tx"><b></b><small></small><em>' + '&#9679;'.repeat(l) + '<s>' + '&#9679;'.repeat(u.max - l) + '</s></em></div><button></button>';
    r.querySelector('b').textContent = u.name; r.querySelector('small').textContent = u.desc;
    const b = r.querySelector('button'); b.textContent = l >= u.max ? 'MAX' : '◆ ' + cost; b.disabled = l >= u.max || meta.shards < cost;
    b.addEventListener('click', () => { if (meta.shards >= cost && l < u.max) { meta.shards -= cost; meta.upg[u.id] = l + 1; applyMods(); metaSave(); if (typeof Audio_ !== 'undefined') Audio_.sfx('buy'); renderColl(); } });
    el.appendChild(r);
    renderPwShop(el);
  } else {
    const h = document.createElement('div'); h.className = 'mrow';
    h.innerHTML = '<div class="tx"><b></b><small></small></div>'; h.querySelector('b').textContent = 'Day ' + meta.streak + ' streak';
    h.querySelector('small').textContent = 'Come back tomorrow: +' + DAILY[meta.streak % 7] + ' shards'; el.appendChild(h);
    for (const q of todaysQuests()) {
      const v = Math.min(q.target, Math.floor(meta.q[q.metric] || 0)), done = !!meta.q.done[q.id], r = document.createElement('div'); r.className = 'mrow' + (done ? ' done' : '');
      r.innerHTML = '<div class="tx"><b></b><small></small></div><button disabled></button>'; r.querySelector('b').textContent = q.text;
      r.querySelector('small').textContent = done ? 'Complete' : v + ' / ' + q.target; r.querySelector('button').textContent = '◆ ' + q.reward; el.appendChild(r);
    }
  }
}

// ============================================================
// Power-ups: bought once (Upgrades tab), used in-run via left-edge buttons / keys 1-3, cooldown-based.
// State lives in game.pw and is advanced inside step() so it stays deterministic.
// ============================================================
const PWS = [
  { id: 'recentre', name: 'Recentre', glyph: '◎', desc: 'Snap the ball to the target centre', cost: 120, cd: 18 },
  { id: 'surge',    name: 'Wide Spot', glyph: '⊕', desc: 'Bigger sweet spot for 5s',          cost: 200, cd: 24, dur: 5 },
  { id: 'calm',     name: 'Calm',      glyph: '≋', desc: 'Halve destabilising forces for 6s', cost: 300, cd: 30, dur: 6 }
];
meta.pw = meta.pw || {}; meta.lefty = !!meta.lefty;
const newPw = () => ({ cd: { recentre: 0, surge: 0, calm: 0 }, surge: 0, calm: 0 });
function pwTick(g, dt) { // called at the top of step()
  const p = g.pw; for (const k in p.cd) p.cd[k] = Math.max(0, p.cd[k] - dt);
  p.surge = Math.max(0, p.surge - dt); p.calm = Math.max(0, p.calm - dt);
  MOD.sweetTemp = p.surge > 0 ? 18 : 0; MOD.calm = p.calm > 0 ? 0.5 : 1;
}
function usePw(id) {
  const g = game, def = PWS.find(p => p.id === id);
  if (!def || g.state !== 'play' || g.paused || panelOpen || collOpen || !meta.pw[id] || g.pw.cd[id] > 0) return;
  g.pw.cd[id] = def.cd; if (def.dur) g.pw[id] = def.dur;
  if (id === 'recentre') { g.ball.x = g.target.x; g.ball.y = g.target.y; g.ball.vx = g.ball.vy = 0; g.flash = Math.max(g.flash, 0.2); }
  g.pwUsed = (g.pwUsed || 0) + 1; Audio_.sfx('power');
}
const pwEl = document.getElementById('pw'), pwBtns = {};
for (const d of PWS) {
  const b = document.createElement('button'); b.innerHTML = '<span>' + d.glyph + '</span><kbd>' + (PWS.indexOf(d) + 1) + '</kbd><i></i>'; b.setAttribute('aria-label', d.name);
  for (const ev of ['pointerdown', 'pointerup', 'touchstart', 'mousedown']) b.addEventListener(ev, e => e.stopPropagation());
  b.addEventListener('click', e => { e.stopPropagation(); usePw(d.id); });
  pwEl.appendChild(b); pwBtns[d.id] = b;
}
let pwSig = '';
function syncPw() { // cheap per-frame: only touches the DOM when something changed
  const g = game, show = g.state === 'play' && !collOpen, sig = [show, meta.lefty, ...PWS.map(d => meta.pw[d.id] ? Math.ceil(g.pw.cd[d.id] * 10) : -1)].join();
  if (sig === pwSig) return; pwSig = sig;
  pwEl.style.display = show ? 'flex' : 'none'; pwEl.classList.toggle('r', meta.lefty);
  for (const d of PWS) { const b = pwBtns[d.id], own = !!meta.pw[d.id], cd = own ? g.pw.cd[d.id] : 0; b.style.display = own ? 'block' : 'none'; b.classList.toggle('cd', cd > 0); b.lastChild.style.height = own ? Math.round(100 * cd / d.cd) + '%' : '0'; }
}
// Shop rows (appended to the Upgrades tab)
function renderPwShop(el) {
  for (const d of PWS) {
    const own = !!meta.pw[d.id], r = document.createElement('div'); r.className = 'mrow' + (own ? ' done' : '');
    r.innerHTML = '<div class="tx"><b></b><small></small></div><button></button>'; r.querySelector('b').textContent = d.glyph + ' ' + d.name + '  [' + (PWS.indexOf(d) + 1) + ']';
    r.querySelector('small').textContent = d.desc + ' · ' + d.cd + 's cooldown';
    const b = r.querySelector('button'); b.textContent = own ? 'OWNED' : '◆ ' + d.cost; b.disabled = own || meta.shards < d.cost;
    b.addEventListener('click', () => { if (!own && meta.shards >= d.cost) { meta.shards -= d.cost; meta.pw[d.id] = 1; metaSave(); Audio_.sfx('buy'); renderColl(); } });
    el.appendChild(r);
  }
  const r = document.createElement('div'); r.className = 'mrow'; r.innerHTML = '<div class="tx"><b>Left-hand mode</b><small>Power-up buttons on the right edge</small></div><button></button>';
  const b = r.querySelector('button'); b.textContent = meta.lefty ? 'ON' : 'OFF'; b.addEventListener('click', () => { meta.lefty = !meta.lefty; metaSave(); renderColl(); }); el.appendChild(r);
}
