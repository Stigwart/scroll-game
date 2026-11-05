// Dev-only UI is removed from the DOM entirely in builds without devUI
if (!BUILD.devUI) ['gear', 'panel', 'rate'].forEach(i => { const n = document.getElementById(i); if (n && n.parentNode) n.parentNode.removeChild(n); });
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
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, CONFIG.maxFrame); last = now;
  update(dt); render(); syncCollBtn(); syncPw(); telSyncRate();
  requestAnimationFrame(frame);
}
resize();
resetRun();
window.__TEST_HOOKS = { meta, usePw, render, update, game, T, area: () => ({ W, H, PH, FH }), prog, tel: { get queue() { return tq; }, get pending() { return pending; }, get rs() { return rs; }, get sent() { return tsent; }, flush } }; // test-only hook (Playwright)
requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
