// ============================================================
// Cosmetics: balls, trails, unlock rules, Collection screen (no gameplay effect)
// ============================================================
const STORE_PROG = 'scrollgame.prog', STORE_UNLOCKS = 'scrollgame.unlocks', STORE_SEL = 'scrollgame.sel';
const TRAIL_LIFE = 0.5;
const circ = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, 6.283); };
function star4(c, x, y, s) { // 4-point sparkle
  c.beginPath(); c.moveTo(x, y - s); c.quadraticCurveTo(x, y, x + s, y); c.quadraticCurveTo(x, y, x, y + s);
  c.quadraticCurveTo(x, y, x - s, y); c.quadraticCurveTo(x, y, x, y - s); c.fill();
}
// unlock: null = available from start; {type:'time', v} = best survival >= v seconds; {type:'runs', v} = total runs >= v.
// Change these numbers/types freely; nothing else depends on them.
// draw(c, x, y, r, t, ang, col): c = context, t = seconds, ang = direction of travel, col = accent colour
const BALLS = [
  { id: 'orb', name: 'Neon Orb', unlock: null, draw(c, x, y, r, t, a, col) {
    c.shadowColor = '#fff'; c.shadowBlur = 22;
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
    g.addColorStop(0, '#fff'); g.addColorStop(1, col); c.fillStyle = g; circ(c, x, y, r); c.fill();
  } },
  { id: 'plasma', name: 'Plasma Core', unlock: { type: 'time', v: 10 }, draw(c, x, y, r, t) {
    const p = 0.5 + 0.5 * Math.sin(t * 6);
    c.shadowColor = '#ff3df0'; c.shadowBlur = 16 + 12 * p;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, '#fff'); g.addColorStop(0.45, '#ff7af5'); g.addColorStop(1, '#7a2bff');
    c.fillStyle = g; circ(c, x, y, r * (0.92 + 0.12 * p)); c.fill();
    c.shadowBlur = 0; c.strokeStyle = 'rgba(255,255,255,' + (0.3 + 0.4 * p) + ')'; c.lineWidth = 1.5;
    circ(c, x, y, r * (0.5 + 0.3 * p)); c.stroke();
  } },
  { id: 'pixel', name: 'Pixel', unlock: { type: 'runs', v: 3 }, draw(c, x, y, r, t, a, col) {
    const s = r * 1.7, u = s / 3, x0 = x - s / 2, y0 = y - s / 2;
    c.shadowColor = col; c.shadowBlur = 16; c.fillStyle = col; c.fillRect(x0, y0, s, s); c.shadowBlur = 0;
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(x0, y0, u, u); c.fillRect(x0 + u, y0, u, u); c.fillRect(x0, y0 + u, u, u);
    c.fillStyle = 'rgba(0,0,40,0.35)'; c.fillRect(x0 + 2 * u, y0 + 2 * u, u, u); c.fillRect(x0 + u, y0 + 2 * u, u, u); c.fillRect(x0 + 2 * u, y0 + u, u, u);
    c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.strokeRect(x0, y0, s, s);
  } },
  { id: 'eye', name: 'Eyeball', unlock: { type: 'runs', v: 5 }, draw(c, x, y, r, t, a) {
    const dx = Math.cos(a), dy = Math.sin(a);
    c.shadowColor = '#fff'; c.shadowBlur = 16; c.fillStyle = '#f4fbff'; circ(c, x, y, r); c.fill(); c.shadowBlur = 0;
    const ix = x + dx * r * 0.36, iy = y + dy * r * 0.36;
    const g = c.createRadialGradient(ix, iy, 1, ix, iy, r * 0.55); g.addColorStop(0, '#7dffb0'); g.addColorStop(1, '#0a9a6a');
    c.fillStyle = g; circ(c, ix, iy, r * 0.55); c.fill();
    c.fillStyle = '#05030d'; circ(c, ix + dx * r * 0.1, iy + dy * r * 0.1, r * 0.26); c.fill();
    c.fillStyle = '#fff'; circ(c, ix - r * 0.15, iy - r * 0.18, r * 0.11); c.fill();
    c.strokeStyle = 'rgba(255,120,160,0.6)'; c.lineWidth = 1; circ(c, x, y, r - 0.5); c.stroke();
  } },
  { id: 'planet', name: 'Planet', unlock: { type: 'level', v: 3 }, draw(c, x, y, r) {
    c.translate(x, y); c.rotate(-0.4); c.lineWidth = 2.5; c.strokeStyle = '#ffd27a';
    c.shadowColor = '#ffb040'; c.shadowBlur = 12;
    c.beginPath(); c.ellipse(0, 0, r * 1.75, r * 0.55, 0, Math.PI, 6.283); c.stroke();      // back half of ring
    const g = c.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
    g.addColorStop(0, '#ffe3b0'); g.addColorStop(0.55, '#ff8a3a'); g.addColorStop(1, '#7a2a6a');
    c.fillStyle = g; circ(c, 0, 0, r * 0.88); c.fill();
    c.beginPath(); c.ellipse(0, 0, r * 1.75, r * 0.55, 0, 0, Math.PI); c.stroke();           // front half of ring
  } },
  { id: 'bauble', name: 'Bauble', unlock: { type: 'level', v: 5 }, draw(c, x, y, r, t) {
    c.shadowColor = '#ff3050'; c.shadowBlur = 16;
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
    g.addColorStop(0, '#ffb0b8'); g.addColorStop(0.5, '#e0102a'); g.addColorStop(1, '#6a0014');
    c.fillStyle = g; circ(c, x, y, r * 0.9); c.fill(); c.shadowBlur = 0;
    c.fillStyle = '#ffd95a'; c.fillRect(x - r * 0.28, y - r * 1.12, r * 0.56, r * 0.32);
    c.strokeStyle = '#ffd95a'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y - r * 1.3, r * 0.22, Math.PI, 6.283 + 0.3); c.stroke();
    c.strokeStyle = 'rgba(255,217,90,0.8)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * 0.62, 0.3, 2.8); c.stroke();
    c.fillStyle = '#fff'; star4(c, x + r * 0.38, y - r * 0.38, r * (0.3 + 0.2 * Math.sin(t * 5)));
  } },
  { id: 'kitty', name: 'Kitty', unlock: { type: 'time', v: 30 }, draw(c, x, y, r, t) {
    c.shadowColor = '#ff8ae6'; c.shadowBlur = 14; c.fillStyle = '#ffd1f0';
    for (const s of [-1, 1]) { // ears
      c.beginPath(); c.moveTo(x + s * r * 0.95, y - r * 0.1); c.lineTo(x + s * r * 0.8, y - r * 1.3); c.lineTo(x + s * r * 0.1, y - r * 0.85); c.closePath(); c.fill();
    }
    circ(c, x, y, r); c.fill(); c.shadowBlur = 0;
    c.fillStyle = '#ff8ac8';
    for (const s of [-1, 1]) {
      c.beginPath(); c.moveTo(x + s * r * 0.8, y - r * 0.45); c.lineTo(x + s * r * 0.75, y - r * 1.0); c.lineTo(x + s * r * 0.35, y - r * 0.72); c.closePath(); c.fill();
    }
    const blink = (t % 3.2) > 3.05 ? 0.15 : 1;
    c.fillStyle = '#2a1030';
    for (const s of [-1, 1]) { c.beginPath(); c.ellipse(x + s * r * 0.38, y - r * 0.08, r * 0.12, r * 0.17 * blink, 0, 0, 6.283); c.fill(); }
    c.fillStyle = '#ff5aa8'; c.beginPath(); c.moveTo(x - r * 0.1, y + r * 0.15); c.lineTo(x + r * 0.1, y + r * 0.15); c.lineTo(x, y + r * 0.27); c.fill();
    c.strokeStyle = '#2a1030'; c.lineWidth = 1; c.beginPath();
    c.moveTo(x, y + r * 0.27); c.quadraticCurveTo(x - r * 0.1, y + r * 0.45, x - r * 0.25, y + r * 0.36);
    c.moveTo(x, y + r * 0.27); c.quadraticCurveTo(x + r * 0.1, y + r * 0.45, x + r * 0.25, y + r * 0.36);
    for (const s of [-1, 1]) { c.moveTo(x + s * r * 0.5, y + r * 0.2); c.lineTo(x + s * r * 1.15, y + r * 0.12); c.moveTo(x + s * r * 0.5, y + r * 0.32); c.lineTo(x + s * r * 1.12, y + r * 0.42); }
    c.stroke();
  } },
  { id: 'disco', name: 'Disco', unlock: { type: 'level', v: 8 }, draw(c, x, y, r, t) {
    c.shadowColor = '#fff'; c.shadowBlur = 18; c.fillStyle = '#9ab'; circ(c, x, y, r); c.fill(); c.shadowBlur = 0;
    c.save(); circ(c, x, y, r); c.clip();
    const n = 5, u = r * 2 / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const k = (i * 7 + j * 13 + Math.floor(t * 5 + i * j)) % 6;
      c.fillStyle = 'hsl(' + (200 + k * 28) + ',70%,' + (45 + k * 7) + '%)';
      c.fillRect(x - r + i * u + 0.5, y - r + j * u + 0.5, u - 1, u - 1);
    }
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.5; circ(c, x, y, r); c.stroke();
    c.fillStyle = '#fff'; c.shadowColor = '#fff'; c.shadowBlur = 8;
    const ga = t * 2.2; star4(c, x + Math.cos(ga) * r * 0.5, y + Math.sin(ga) * r * 0.5, r * (0.3 + 0.25 * Math.sin(t * 7)));
  } }
];
const TRAILS = [
  { id: 'classic', name: 'Classic Fade', unlock: null },
  { id: 'rainbow', name: 'Rainbow', unlock: { type: 'time', v: 15 } },
  { id: 'sparks', name: 'Sparks', unlock: { type: 'runs', v: 4 } },
  { id: 'ribbon', name: 'Ribbon', unlock: { type: 'level', v: 4 } },
  { id: 'bubbles', name: 'Bubbles', unlock: { type: 'runs', v: 6 } },
  { id: 'none', name: 'None', unlock: null }
];
const LISTS = { balls: BALLS, trails: TRAILS };
const LABELS = { balls: 'Balls', trails: 'Trails' };

function ballDraw(c, id, x, y, r, t, ang, col) {
  const it = BALLS.find(b => b.id === id) || BALLS[0];
  c.save(); it.draw(c, x, y, r, t, ang, col); c.restore();
}

// ---- Trails: state is {pts, parts}; one code path for the game and the previews ----
function newTrailSt() { return { pts: [], parts: [], acc: 0 }; }
function trailUpdate(st, id, x, y, dt, active) {
  for (const p of st.pts) p.age += dt;
  while (st.pts.length && st.pts[0].age > TRAIL_LIFE) st.pts.shift();
  if (active) st.pts.push({ x, y, age: 0 });
  if (active && id === 'sparks') {
    for (let i = 0; i < 2; i++) st.parts.push({ x, y, vx: rand(-70, 70), vy: rand(-70, 70), life: 0, max: rand(0.35, 0.7), sz: rand(0.6, 1.4) });
  } else if (active && id === 'bubbles') {
    st.acc += dt;
    while (st.acc > 0.07) { st.acc -= 0.07; st.parts.push({ x: x + rand(-6, 6), y: y + rand(-6, 6), vx: rand(-10, 10), vy: rand(-45, -15), life: 0, max: rand(0.8, 1.4), sz: rand(0.2, 0.42) }); }
  }
  for (let i = st.parts.length - 1; i >= 0; i--) {
    const p = st.parts[i]; p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.life > p.max) st.parts.splice(i, 1);
  }
  if (id !== 'sparks' && id !== 'bubbles') st.parts.length = 0;
}
function trailDraw(c, st, id, r, col) {
  if (id === 'none') return;
  const pts = st.pts;
  c.save();
  if (id === 'classic') {
    for (const p of pts) {
      const a = 1 - p.age / TRAIL_LIFE; if (a < 0.03) continue;
      c.fillStyle = rgba('#ffffff', a * a * 0.35); circ(c, p.x, p.y, r * (0.4 + 0.5 * a)); c.fill();
    }
  } else if (id === 'rainbow') {
    const base = performance.now() / 4;
    for (const p of pts) {
      const a = 1 - p.age / TRAIL_LIFE;
      c.fillStyle = 'hsla(' + ((base - p.age * 500) % 360) + ',100%,62%,' + (a * 0.7) + ')'; circ(c, p.x, p.y, r * (0.3 + 0.55 * a)); c.fill();
    }
  } else if (id === 'ribbon') {
    c.lineCap = 'round'; c.shadowColor = col; c.shadowBlur = 10;
    for (let i = 1; i < pts.length; i++) {
      const a = 1 - pts[i].age / TRAIL_LIFE;
      c.strokeStyle = rgba(col, 0.15 + 0.6 * a); c.lineWidth = Math.max(0.5, r * 1.6 * a);
      c.beginPath(); c.moveTo(pts[i - 1].x, pts[i - 1].y); c.lineTo(pts[i].x, pts[i].y); c.stroke();
    }
  } else if (id === 'sparks') {
    c.shadowColor = '#ff9a1f'; c.shadowBlur = 8;
    for (const p of st.parts) {
      const a = 1 - p.life / p.max; c.fillStyle = rgba(a > 0.5 ? '#fff4b0' : '#ff9a1f', a); circ(c, p.x, p.y, (1 + 2 * a) * p.sz); c.fill();
    }
  } else if (id === 'bubbles') {
    for (const p of st.parts) {
      const a = 1 - p.life / p.max, br = r * p.sz * (1 + p.life * 1.5);
      c.fillStyle = rgba('#aef0ff', a * 0.12); c.strokeStyle = rgba('#aef0ff', a * 0.85); c.lineWidth = 1.5;
      circ(c, p.x, p.y, br); c.fill(); c.stroke();
      c.fillStyle = rgba('#ffffff', a * 0.8); circ(c, p.x - br * 0.35, p.y - br * 0.35, Math.max(0.8, br * 0.18)); c.fill();
    }
  }
  c.restore();
}

// ---- Persistence + unlock rules ----
function lsJSON(k, def) { try { const v = JSON.parse(lsGet(k)); return v == null ? def : v; } catch (e) { return def; } }
const prog = { runs: 0, best: 0 };
(function () { const s = lsJSON(STORE_PROG, {}); prog.runs = +s.runs || 0; prog.best = Math.max(+s.best || 0, game.best); })();
const unlocked = new Set((function () { const a = lsJSON(STORE_UNLOCKS, []); return Array.isArray(a) ? a : []; })());
const sel = { balls: 'orb', trails: 'classic' };
(function () { const s = lsJSON(STORE_SEL, {}); for (const k in sel) if (typeof s[k] === 'string') sel[k] = s[k]; })();
const ukey = (kind, it) => kind + ':' + it.id;
const isUnlocked = (kind, it) => !it.unlock || unlocked.has(ukey(kind, it));
function selItem(kind) { const l = LISTS[kind], it = l.find(i => i.id === sel[kind]); return it && isUnlocked(kind, it) ? it : l[0]; }
function unlockText(it) { return it.unlock.type === 'level' ? 'Reach level ' + it.unlock.v : it.unlock.type === 'time' ? 'Survive ' + it.unlock.v + 's' : 'Play ' + it.unlock.v + ' runs'; }
function unlockMet(it) { const u = it.unlock; return !u || (u.type === 'level' ? playerLvl() >= u.v : u.type === 'time' ? prog.best >= u.v : prog.runs >= u.v); }
function saveCosm() {
  lsSet(STORE_PROG, JSON.stringify(prog)); lsSet(STORE_UNLOCKS, JSON.stringify(Array.from(unlocked))); lsSet(STORE_SEL, JSON.stringify(sel));
}
function countUnlocked(kind) { return LISTS[kind].filter(it => isUnlocked(kind, it)).length; }
// Called at game over: updates stats, returns names of newly unlocked items
function recordRun(seconds) {
  prog.runs++; prog.best = Math.max(prog.best, seconds);
  const fresh = [];
  for (const kind in LISTS) for (const it of LISTS[kind]) {
    if (!isUnlocked(kind, it) && unlockMet(it)) { unlocked.add(ukey(kind, it)); fresh.push(it.name); }
  }
  saveCosm(); return fresh;
}
function unlockAll() { for (const kind in LISTS) for (const it of LISTS[kind]) if (it.unlock) unlocked.add(ukey(kind, it)); saveCosm(); if (collOpen) renderColl(); }
function resetUnlocks() {
  unlocked.clear(); prog.runs = 0; prog.best = 0; sel.balls = 'orb'; sel.trails = 'classic'; saveCosm(); if (collOpen) renderColl();
}
document.getElementById('unlockAll').addEventListener('click', unlockAll);
document.getElementById('resetUnlocks').addEventListener('click', resetUnlocks);

// ---- Collection screen ----
const collEl = document.getElementById('coll'), gridEl = document.getElementById('grid'), collBtn = document.getElementById('collBtn');
const tabBtns = Array.from(document.querySelectorAll('#tabs button'));
let collOpen = false, collTab = 'balls', tiles = [], previewLast = 0;
const LOCK_SVG = '<svg class="lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" fill="#cfe"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="#cfe" stroke-width="2.4"/></svg>';
function openColl() {
  if (collOpen) return;
  collOpen = true; drag = null; collEl.classList.add('open'); renderColl();
  previewLast = performance.now(); requestAnimationFrame(previewFrame);
}
function closeColl() { collOpen = false; collEl.classList.remove('open'); tiles = []; }
function renderColl() {
  const top = gridEl.scrollTop;
  tabBtns.forEach(b => {
    const k = b.dataset.k; b.textContent = LISTS[k] ? LABELS[k] + ' ' + countUnlocked(k) + '/' + LISTS[k].length : k === 'upgrades' ? 'Upgrades' : 'Daily';
    b.classList.toggle('on', k === collTab);
  });
  gridEl.innerHTML = ''; tiles = [];
  if (!LISTS[collTab]) { renderMeta(gridEl, collTab); gridEl.scrollTop = top; return; }
  const kind = collTab, chosen = selItem(kind);
  for (const it of LISTS[kind]) {
    const un = isUnlocked(kind, it), on = un && chosen === it;
    const b = document.createElement('button');
    b.className = 'tile' + (on ? ' sel' : '') + (un ? '' : ' locked');
    b.innerHTML = '<div class="pv"><canvas></canvas>' + (un ? '' : LOCK_SVG) + '</div><div class="nm"></div><div class="st"></div>';
    b.querySelector('.nm').textContent = it.name;
    b.querySelector('.st').textContent = on ? 'Selected' : un ? 'Tap to select' : unlockText(it);
    b.addEventListener('click', () => { if (un) { sel[kind] = it.id; saveCosm(); renderColl(); } });
    gridEl.appendChild(b);
    tiles.push({ cv: b.querySelector('canvas'), kind, it, st: newTrailSt() });
  }
  for (const tl of tiles) { // size after layout so the grid columns are final
    const w = tl.cv.clientWidth || 140, h = tl.cv.clientHeight || 76;
    tl.cv.width = Math.round(w * RS); tl.cv.height = Math.round(h * RS);
    tl.c = tl.cv.getContext('2d'); tl.w = w; tl.h = h;
  }
  gridEl.scrollTop = top;
}
function drawTile(tl, t, dt) {
  const c = tl.c, w = tl.w, h = tl.h, trail = tl.kind === 'trails', col = '#00e5ff';
  c.setTransform(RS, 0, 0, RS, 0, 0); c.clearRect(0, 0, w, h);
  const A = w * (trail ? 0.3 : 0.1), B = h * (trail ? 0.26 : 0.08);
  const x = w / 2 + Math.sin(t * 1.9) * A, y = h / 2 + Math.sin(t * 3.1) * B;
  const ang = Math.atan2(Math.cos(t * 3.1) * 3.1 * B, Math.cos(t * 1.9) * 1.9 * A);
  if (trail) {
    trailUpdate(tl.st, tl.it.id, x, y, dt, true); trailDraw(c, tl.st, tl.it.id, 10, col);
    ballDraw(c, selItem('balls').id, x, y, 10, t, ang, col);
  } else ballDraw(c, tl.it.id, x, y, 18, t, ang, col);
}
function previewFrame(now) {
  if (!collOpen) return;
  const dt = Math.min((now - previewLast) / 1000, 0.05); previewLast = now;
  for (const tl of tiles) drawTile(tl, now / 1000, dt);
  requestAnimationFrame(previewFrame);
}
collBtn.addEventListener('click', openColl);
document.getElementById('collBack').addEventListener('click', closeColl);
tabBtns.forEach(b => b.addEventListener('click', () => { collTab = b.dataset.k; gridEl.scrollTop = 0; renderColl(); }));
// Collection button only on start / game-over screens
let collBtnShown = false;
function syncCollBtn() {
  const g = game, show = !collOpen && !panelOpen && (g.state === 'start' || (g.state === 'over' && performance.now() - g.overAt > 600));
  if (show !== collBtnShown) { collBtnShown = show; collBtn.style.display = show ? 'block' : 'none'; }
}

// ============================================================
