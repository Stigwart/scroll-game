// Main loop
// ============================================================
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, CONFIG.maxFrame); last = now;
  update(dt); render(); syncCollBtn(); telSyncRate();
  requestAnimationFrame(frame);
}
resize();
resetRun();
window.__TEST_HOOKS = { game, T, area: () => ({ W, H, PH, FH }), prog, tel: { get queue() { return tq; }, get pending() { return pending; }, get rs() { return rs; }, get sent() { return tsent; }, flush } }; // test-only hook (Playwright)
requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
