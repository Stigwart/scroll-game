// ============================================================
// Input (relative drag)
// ============================================================
let drag = null; // {id, x, y}
function onDown(e) {
  if (e.target !== canvas) return;
  e.preventDefault();
  telTouch(); lastPtr = e.pointerType === 'touch' ? 'touch' : 'mouse';
  if (game.paused || panelOpen || collOpen) return;
  if (game.state === 'start') { startRun(); }
  else if (game.state === 'over') {
    if (performance.now() - game.overAt > 600) startRun();
    return;
  }
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
  try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
}
function onMove(e) {
  if (!drag || e.pointerId !== drag.id) return;
  e.preventDefault();
  if (game.state === 'play' && !game.paused && !panelOpen && game.target) {
    if (rs) rs.drag += Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
    game.target.x = clamp(game.target.x + (e.clientX - drag.x), 0, W);
    game.target.y = clamp(game.target.y + (e.clientY - drag.y), 0, PH);
  }
  drag.x = e.clientX; drag.y = e.clientY;
}
function onUp(e) { if (drag && e.pointerId === drag.id) drag = null; }
canvas.addEventListener('pointerdown', onDown);
window.addEventListener('pointermove', onMove, { passive: false });
window.addEventListener('pointerup', onUp);
window.addEventListener('pointercancel', onUp);
// Block page scroll / zoom / pull-to-refresh
document.addEventListener('touchmove', e => { if (!e.target.closest('#panel, #grid')) e.preventDefault(); }, { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
window.addEventListener('blur', autoPause);

// ============================================================
// Tuning panel
// ============================================================
let panelOpen = false;
const panel = document.getElementById('panel'), rowsEl = document.getElementById('rows');
const inputs = {};
function fmt(k, v) { const st = CONFIG.tune[k][3]; return v.toFixed(st < 1 ? (st < 0.1 ? 2 : 1) : 0); }
(function buildPanel() {
  for (const k in CONFIG.tune) {
    const [, mn, mx, st, label] = CONFIG.tune[k];
    const row = document.createElement('div'); row.className = 'row';
    row.innerHTML = '<label><span>' + label + '</span><b></b></label><input type="range">';
    const inp = row.querySelector('input'), val = row.querySelector('b');
    inp.min = mn; inp.max = mx; inp.step = st; inp.value = T[k]; val.textContent = fmt(k, T[k]);
    inp.addEventListener('input', () => {
      T[k] = parseFloat(inp.value); val.textContent = fmt(k, T[k]); saveTune();
    });
    inputs[k] = { inp, val };
    rowsEl.appendChild(row);
  }
})();
function saveTune() { lsSet(STORE_TUNE, JSON.stringify(T)); }
document.getElementById('reset').addEventListener('click', () => {
  for (const k in CONFIG.tune) {
    T[k] = CONFIG.tune[k][0]; inputs[k].inp.value = T[k]; inputs[k].val.textContent = fmt(k, T[k]);
  }
  saveTune();
});
document.getElementById('gear').addEventListener('click', () => {
  panelOpen = !panelOpen; panel.classList.toggle('open', panelOpen); drag = null;
  if (panelOpen && rs && game.state === 'play' && !game.paused) rs.paused++;
  telStat();
});
document.getElementById('gear').addEventListener('pointerdown', e => e.stopPropagation());

// ============================================================
// Obstacles
// ============================================================
function spawnObstacle() {
  const L = level(), r = srng();
  const kind = r < 0.4 ? 'circle' : r < 0.75 ? 'rect' : 'tri';
  const sizeMul = 1 + 0.5 * L;
  const speed = srand(45, 80) * (1 + 0.45 * L);
  // Enter from top, left or right; travel across the screen
  const side = srng();
  let x, y, ang;
  if (side < 0.5) { x = srand(0, W); y = -90; ang = Math.PI / 2 + srand(-0.6, 0.6); }
  else if (side < 0.75) { x = -90; y = srand(0, PH * 0.7); ang = srand(-0.3, 0.7); }
  else { x = W + 90; y = srand(0, PH * 0.7); ang = Math.PI - srand(-0.3, 0.7); }
  const o = { kind, x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, rot: srand(0, 6.28), spin: srand(-0.6, 0.6),
    seen: false, hue: srng() };
  if (kind === 'rect') { // wall (axis-aligned for collision)
    const horiz = srng() < 0.5, len = srand(90, 170) * sizeMul, th = srand(16, 24) * Math.min(sizeMul, 1.8);
    o.w = horiz ? len : th; o.h = horiz ? th : len; o.spin = 0; o.rot = 0;
  } else { o.r = srand(24, 42) * sizeMul; }
  game.obstacles.push(o);
}
function collideObstacle(b, o) {
  let nx, ny, pen;
  if (o.kind === 'rect') {
    const hw = o.w / 2, hh = o.h / 2;
    const cx = clamp(b.x, o.x - hw, o.x + hw), cy = clamp(b.y, o.y - hh, o.y + hh);
    let dx = b.x - cx, dy = b.y - cy, d2 = dx * dx + dy * dy;
    if (d2 > b.r * b.r) return false;
    if (d2 > 1e-6) { const d = Math.sqrt(d2); nx = dx / d; ny = dy / d; pen = b.r - d; }
    else { // centre inside rect: exit along shortest axis
      const px = hw - Math.abs(b.x - o.x), py = hh - Math.abs(b.y - o.y);
      if (px < py) { nx = Math.sign(b.x - o.x) || 1; ny = 0; pen = px + b.r; }
      else { nx = 0; ny = Math.sign(b.y - o.y) || 1; pen = py + b.r; }
    }
  } else {
    const rr = o.kind === 'tri' ? o.r * 0.8 : o.r;
    const dx = b.x - o.x, dy = b.y - o.y, d = Math.hypot(dx, dy);
    if (d > rr + b.r) return false;
    nx = d > 1e-6 ? dx / d : 0; ny = d > 1e-6 ? dy / d : -1; pen = rr + b.r - d;
  }
  b.x += nx * pen; b.y += ny * pen;
  // Impulse: reflect relative velocity + guaranteed shove
  const rvn = (b.vx - o.vx) * nx + (b.vy - o.vy) * ny;
  if (rvn < 0) { b.vx -= 1.5 * rvn * nx; b.vy -= 1.5 * rvn * ny; }
  b.vx += nx * 60; b.vy += ny * 60;
  return true;
}

