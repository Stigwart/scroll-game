// ============================================================
// Telemetry: per-run stats -> localStorage queue -> Supabase (best effort, never blocks play)
// ============================================================
const STORE_PID = 'scrollgame.pid', STORE_TQ = 'scrollgame.tq', STORE_TSENT = 'scrollgame.tsent',
  STORE_TON = 'scrollgame.telon', STORE_PLAYTIME = 'scrollgame.playtime', STORE_RUNNO = 'scrollgame.runno';
const TQ_MAX = 200, SESSION_GAP = 600000;
let rs = null;            // stats for the run in progress
let pending = null;       // finished run awaiting retry/rating: {rec, rating, overAt}
let lastPtr = 'mouse', flushing = false;
let tq = lsJSON(STORE_TQ, []); if (!Array.isArray(tq)) tq = [];
let tsent = parseInt(lsGet(STORE_TSENT), 10) || 0;
let telOn = () => TELEMETRY.enabled && lsGet(STORE_TON) !== '0';

function uuid() {
  try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
  const h = new Uint8Array(16);
  try { crypto.getRandomValues(h); } catch (e) { for (let i = 0; i < 16; i++) h[i] = Math.floor(Math.random() * 256); }
  h[6] = (h[6] & 15) | 64; h[8] = (h[8] & 63) | 128;
  return h.map((v, i) => (i === 4 || i === 6 || i === 8 || i === 10 ? '-' : '') + v.toString(16).padStart(2, '0')).join('');
}
let playerId = lsGet(STORE_PID);
if (!playerId || playerId.length < 8) { playerId = uuid(); lsSet(STORE_PID, playerId); }
let sessionId = uuid(), lastActive = Date.now();
function telTouch() { const n = Date.now(); if (n - lastActive > SESSION_GAP) sessionId = uuid(); lastActive = n; }
function deviceString() {
  const ua = navigator.userAgent || '';
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /CrOS/.test(ua) ? 'ChromeOS'
    : /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'Other';
  const br = /EdgA?\/|EdgiOS/.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /Firefox|FxiOS/.test(ua) ? 'Firefox'
    : /Chrome|CriOS/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'Other';
  const s = window.screen || {};
  return os + ' / ' + br + ', ' + (s.width || 0) + 'x' + (s.height || 0);
}
const r2 = v => isFinite(v) ? Math.round(v * 100) / 100 : 0;

function telStat() {
  const el = document.getElementById('telStat');
  if (el) el.textContent = 'Queued: ' + tq.length + ' · Sent: ' + tsent;
}
function telSave() { lsSet(STORE_TQ, JSON.stringify(tq)); lsSet(STORE_TSENT, String(tsent)); telStat(); }
(function () {
  const t = document.getElementById('telToggle');
  t.checked = telOn();
  t.addEventListener('change', () => { lsSet(STORE_TON, t.checked ? '1' : '0'); if (t.checked) flush(false); });
  telStat();
})();

// ---- run lifecycle ----
function telBegin() {
  try {
    telTouch(); telClearInProg();
    const n = (parseInt(lsGet(STORE_RUNNO), 10) || 0) + 1; lsSet(STORE_RUNNO, String(n));
    const cfg = CONFIG, set = Object.assign({}, T, { mods: Object.assign({}, MOD), plvl: playerLvl(), ring_radius: cfg.ringRadius, ball_radius: cfg.ballRadius, start_health: cfg.startHealth,
      footer_h: FH, edge_loss_base: cfg.edgeLossBase, stage_seconds: cfg.stageSeconds });
    rs = { playedAt: new Date().toISOString(), session: sessionId, runNo: n, settings: set, setStr: JSON.stringify(T),
      ball: selItem('balls').id, trail: selItem('trails').id, vw: window.innerWidth, vh: window.innerHeight, input: lastPtr,
      zS: 0, zI: 0, zO: 0, zX: 0, distSum: 0, tAcc: 0, coll: 0, edgeN: 0, edgeT: 0, lostD: 0, lostE: 0,
      drag: 0, paused: 0, bk: {}, lastEdge: -9, done: false };
  } catch (e) { rs = null; }
}
function telStep(dt, d, edge, lD, lE) {
  const r = rs; if (!r) return;
  const R = CONFIG.ringRadius;
  if (d <= sweetR()) r.zS += dt; else if (d <= R * 0.5) r.zI += dt; else if (d <= R) r.zO += dt; else r.zX += dt;
  r.distSum += d * dt; r.tAcc += dt; r.lostD += lD; r.lostE += lE;
  const k = Math.floor(game.t * 4), b = r.bk[k] || (r.bk[k] = { t: 0, d: 0, e: 0, c: 0 });
  b.t += dt; b.d += d * dt;
  if (edge) {
    r.edgeT += dt; b.e += dt;
    if (game.t - r.lastEdge > 0.15) { r.edgeN++; }
    r.lastEdge = game.t;
  }
}
function telHit(o) { // a distinct contact = not touching the same shape within the last 0.15s
  const r = rs; if (!r) return;
  if (game.t - (o.lastHit === undefined ? -9 : o.lastHit) > 0.15) { r.coll++; const b = r.bk[Math.floor(game.t * 4)]; if (b) b.c++; else r.bk[Math.floor(game.t * 4)] = { t: 0, d: 0, e: 0, c: 1 }; }
  o.lastHit = game.t;
}
function buildRecord(endedBy, noCommit) {
  const r = rs, g = game, dur = g.t, R = CONFIG.ringRadius, ta = r.tAcc || 1e-9;
  const life = (parseFloat(lsGet(STORE_PLAYTIME)) || 0) + dur; if (!noCommit) lsSet(STORE_PLAYTIME, String(life));
  let wt = 0, wd = 0, we = 0, wc = 0;
  const from = Math.floor(Math.max(0, dur - 5) * 4);
  for (const k in r.bk) if (+k >= from) { const b = r.bk[k]; wt += b.t; wd += b.d; we += b.e; wc += b.c; }
  const avg = r.distSum / ta;
  return {
    played_at: r.playedAt, player_id: playerId, session_id: r.session, game_version: GAME_VERSION, device: deviceString(),
    run_number: r.runNo, settings: r.settings,
    stats: {
      duration: r2(dur), lifetime_play_time: r2(life), run_number: r.runNo, stage_reached: Math.floor(g.t * T.ramp / CONFIG.stageSeconds) + 1,
      time_in_sweet_spot: r2(r.zS), time_in_inner: r2(r.zI), time_in_outer: r2(r.zO), time_outside_target: r2(r.zX),
      avg_distance_from_centre_px: r2(avg), avg_distance_from_centre_frac: r2(avg / R),
      shape_collisions: r.coll, edge_touches: r.edgeN, edge_contact_time: r2(r.edgeT),
      health_lost_distance: r2(r.lostD), health_lost_edge: r2(r.lostE),
      last5s: { avg_distance_frac: r2(wt > 0 ? wd / wt / R : 0), edge_contact_time: r2(we), shape_collisions: wc },
      drag_distance_px: r2(r.drag), retry_delay_s: null, paused_count: r.paused,
      viewport: { w: r.vw, h: r.vh }, input: r.input, ball: r.ball, trail: r.trail,
      tuned_mid_run: JSON.stringify(T) !== r.setStr
    },
    fun_rating: null, ended_by: endedBy
  };
}
function telRunStart() { // next run is starting: finalise the previous one with its retry delay
  try { telTouch(); telFinalize(true); } catch (e) {}
}
function telEnd() {
  try {
    telTouch();
    if (!rs || rs.done) return;
    rs.done = true; telClearInProg();
    pending = { rec: buildRecord('death'), rating: null, overAt: game.overAt };
    rateUI();
  } catch (e) {}
}
function telFinalize(retried, keepalive) {
  const p = pending; if (!p) return;
  pending = null;
  try {
    if (p.rating) p.rec.fun_rating = p.rating;
    if (retried) p.rec.stats.retry_delay_s = r2((performance.now() - p.overAt) / 1000);
    enqueue(p.rec, keepalive);
  } catch (e) {}
  rateUI();
}
document.addEventListener('visibilitychange', () => { document.hidden ? Audio_.pause() : Audio_.resume(); });
function autoPause() {
  if (rs && game.state === 'play' && !game.paused && !panelOpen) rs.paused++;
  game.paused = true;
}
const STORE_INPROG = 'scrollgame.inProgressRun';
function telClearInProg() { try { localStorage.removeItem(STORE_INPROG); } catch (e) {} }
function telHide(unload) {
  try {
    if (game.state === 'play' && rs && !rs.done) {
      if (unload) { rs.done = true; telClearInProg(); enqueue(buildRecord('quit'), true); }
      else lsSet(STORE_INPROG, JSON.stringify(buildRecord('quit', true))); // brief app switch: keep a local copy only
    } else if (pending) telFinalize(false, true);
    else flush(true);
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (document.hidden) telHide(false); });
window.addEventListener('pagehide', () => telHide(true));

// ---- queue + network ----
function enqueue(rec, keepalive) {
  if (!telOn()) return;
  tq.push(rec); while (tq.length > TQ_MAX) tq.shift();
  telSave(); flush(keepalive);
}
async function flush(keepalive) {
  if (!telOn() || flushing || !tq.length || typeof fetch !== 'function') return;
  flushing = true;
  try {
    while (tq.length && telOn()) {
      const batch = tq.slice(0, keepalive ? 20 : 50);
      let res;
      try {
        res = await fetch(TELEMETRY.url, { method: 'POST', keepalive: !!keepalive, body: JSON.stringify(batch),
          headers: { apikey: TELEMETRY.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' } });
      } catch (e) { break; }
      if (!res || !res.ok) break;
      tq = tq.filter(x => batch.indexOf(x) < 0); tsent += batch.length; telSave();
    }
  } catch (e) {}
  flushing = false;
}
window.addEventListener('online', () => flush(false));
setInterval(() => flush(false), 30000);
(function () { // a run left in progress by a killed tab (no pagehide): record it as abandoned
  try {
    const rec = lsJSON(STORE_INPROG, null); telClearInProg();
    if (rec && rec.stats && rec.player_id) {
      rec.ended_by = 'abandoned';
      const lt = parseFloat(lsGet(STORE_PLAYTIME)) || 0; if (rec.stats.lifetime_play_time > lt) lsSet(STORE_PLAYTIME, String(rec.stats.lifetime_play_time));
      enqueue(rec, false);
    }
  } catch (e) {}
})();
flush(false);

// ---- fun rating UI (DOM, above the canvas; its taps never reach the retry handler) ----
const rateEl = document.getElementById('rate'), thxEl = document.getElementById('rateThx');
const rateBtns = Array.from(document.querySelectorAll('#rateRow button'));
function rateUI() {
  const v = pending ? pending.rating : null;
  rateBtns.forEach(b => b.classList.toggle('on', +b.dataset.v === v));
  thxEl.classList.toggle('show', !!v);
}
rateBtns.forEach(b => {
  for (const ev of ['pointerdown', 'pointerup', 'touchstart', 'mousedown']) b.addEventListener(ev, e => e.stopPropagation());
  b.addEventListener('click', e => { e.stopPropagation(); if (pending) { pending.rating = +b.dataset.v; rateUI(); } });
});
let rateShown = false;
function telSyncRate() {
  const g = game, show = BUILD.devUI && !!pending && g.state === 'over' && !collOpen && !panelOpen && performance.now() - g.overAt > 600;
  if (show !== rateShown) { rateShown = show; rateEl.classList.toggle('show', show); if (show) rateUI(); }
}

// ============================================================
