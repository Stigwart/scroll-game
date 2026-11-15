// Dev-only UI is removed from the DOM entirely in builds without devUI
if (!BUILD.devUI) ['gear', 'panel'].forEach(i => { const n = document.getElementById(i); if (n && n.parentNode) n.parentNode.removeChild(n); });
// Non-blocking first-run privacy notice
(function () {
  const el = document.getElementById('priv'), ok = document.getElementById('privOk');
  if (!BUILD.telemetry || !el || lsGet('scrollgame.priv') === '1') { if (el) el.remove(); return; }
  el.style.display = 'block';
  const close = () => { lsSet('scrollgame.priv', '1'); el.remove(); };
  ok.addEventListener('click', close); setTimeout(() => { if (el.parentNode) close(); }, 20000);
})();
// iOS: resume audio inside a click/touchend gesture too
['touchend', 'click'].forEach(ev => document.addEventListener(ev, () => Audio_.unlock(), { capture: true, passive: true }));
// Main loop
// ============================================================
let last = performance.now(), _ema = 16, _slow = 0;
function frame(now) {
  const dt = Math.min((now - last) / 1000, CONFIG.maxFrame); last = now;
  // Adaptive quality: if frames stay slow (EMA > 21 ms for ~1.5 s of play), step the render resolution down; step 2 also drops glows
  if (game.state === 'play' && !game.paused && dt < 0.1) { _ema += (dt * 1000 - _ema) * 0.05; if (_ema > 21) { if ((_slow += dt) > 1.5 && game.q < QUALITY.length - 1) { game.q++; game.lowFx = game.q >= 2; _slow = 0; _ema = 16; resize(); } } else _slow = 0; }
  update(dt); render(); syncPw(); syncScreens();
  requestAnimationFrame(frame);
}
resize();
resetRun();
window.__TEST_HOOKS = { meta, usePw, render, update, game, T, area: () => ({ W, H, PH, FH }), prog, tel: { get queue() { return tq; }, get pending() { return pending; }, get rs() { return rs; }, get sent() { return tsent; }, flush } }; // test-only hook (Playwright)
requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
