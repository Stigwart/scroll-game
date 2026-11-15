// Rendering
// ============================================================
const FONT_DISPLAY = '"NB Display","Trebuchet MS",system-ui,sans-serif';   // own display face (scripts/font.py), embedded by the build
const FONT_UI = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",sans-serif';
try { document.fonts.load('20px "NB Display"').then(() => { for (const k in _dw) delete _dw[k]; }); } catch (e) {}
function glow(color, blur) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
function noGlow() { ctx.shadowBlur = 0; }

// Text helper. opts: {font:'display'|'ui', align, alpha}
function textAt(str, x, y, size, color, blur, opts) {
  const o = opts || {};
  ctx.font = (o.font === 'display' ? '' : '600 ') + Math.round(Math.max(size, 12 / SCALE)) + 'px ' + (o.font === 'display' ? FONT_DISPLAY : FONT_UI);
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) ctx.letterSpacing = (o.ls || 0) + 'px';
  const pa = ctx.globalAlpha; if (o.alpha !== undefined) ctx.globalAlpha = pa * o.alpha;
  if (blur) glow(color, blur);
  ctx.fillStyle = color; ctx.fillText(str, x, y);
  if (blur) noGlow();
  ctx.globalAlpha = pa;
}
function textCenter(str, y, size, color, blur) { textAt(str, W / 2, y, size, color, blur || 12); }
// Big numbers: every digit gets the same advance so the readout never jitters
const _dw = {};
function monoText(str, cx, y, size, color, blur, alpha) {
  const px = Math.round(Math.max(size, 12 / SCALE));
  ctx.font = px + 'px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  let dw = _dw[px]; if (!dw) { dw = +ctx.measureText('0').width || px * 0.7; _dw[px] = dw; }
  const adv = ch => (ch === '.' || ch === ':') ? dw * 0.5 : dw;
  let tot = 0; for (let i = 0; i < str.length; i++) tot += adv(str[i]);
  let x = cx - tot / 2;
  const pa = ctx.globalAlpha; if (alpha !== undefined) ctx.globalAlpha = pa * alpha;
  glow(color, blur); ctx.fillStyle = color;
  for (let i = 0; i < str.length; i++) { const a = adv(str[i]); ctx.fillText(str[i], x + a / 2, y); x += a; }
  noGlow(); ctx.globalAlpha = pa;
}

// ---- Background: gradient, blobs, parallax geometry, grid ----
let PAR = null; // built lazily (08-fx.js consts are not ready at this file's load time)
function initPar() {
  PAR = [{ k: 0.14, sz: [90, 150], a: 0.05, sp: 0.03 }, { k: 0.3, sz: [50, 90], a: 0.07, sp: -0.05 }, { k: 0.55, sz: [24, 46], a: 0.09, sp: 0.08 }]
    .map(l => { l.sh = []; for (let i = 0; i < 6; i++) l.sh.push({ x: fr(0, 1), y: fr(0, 1), r: fr(l.sz[0], l.sz[1]), ph: fr(0, 6.283) }); return l; });
}
const STAGE_SIDES = [0, 4, 3, 6, 5, 8, 4, 3]; // shape language per stage: circles, diamonds, triangles, hexagons ...
function polyPath(x, y, r, n, rot) {
  if (!n) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.283); return; }
  for (let i = 0; i <= n; i++) { const a = rot + i * 6.283 / n; if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
}
function drawBackground(pal) {
  const g = game, sf = g.stageF();
  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, pal[0]); grd.addColorStop(1, pal[1]);
  ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
  // Soft drifting colour blobs
  ctx.globalCompositeOperation = 'lighter';
  for (const bl of g.blobs) {
    const x = bl.x * W, y = bl.y * H, r = bl.r * Math.max(W, H);
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    const c = bl.c ? pal[3] : pal[2];
    rg.addColorStop(0, rgba(c, 0.16 + 0.05 * sf)); rg.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = rg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  // Parallax geometry: 3 slow layers, shape type changes per stage
  if (!PAR) initPar();
  const sides = STAGE_SIDES[Math.min(7, Math.floor(sf))], bx = g.bgOff.x, by = g.bgOff.y;
  ctx.lineWidth = 1.5;
  for (const l of PAR) {
    const mw = W + 300, mh = PH + 300;
    ctx.strokeStyle = rgba(pal[3], l.a + 0.02 * Math.min(sf, 3)); ctx.beginPath();
    for (const s of l.sh) {
      const x = (((s.x * mw - bx * l.k) % mw) + mw) % mw - 150, y = (((s.y * mh - by * l.k * 1.4) % mh) + mh) % mh - 150;
      polyPath(x, y, s.r, sides, g.bgT * l.sp + s.ph);
    }
    ctx.stroke();
  }
  // Scrolling neon grid
  const cell = 64, ox = ((bx % cell) + cell) % cell, oy = ((by % cell) + cell) % cell;
  ctx.strokeStyle = rgba(pal[2], 0.10 + 0.04 * sf); ctx.lineWidth = 1; ctx.beginPath();
  for (let x = -ox; x < W + cell; x += cell) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = -oy; y < H + cell; y += cell) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
}

// ---- Obstacles: dark outline + coloured stroke + inner stroke so they read on every palette ----
function obstacleColor(c, pal) { // pull near-white obstacle colours toward the accent so the ball stays the brightest thing
  const m = hex2rgb(c); return (m[0] + m[1] + m[2] > 690) ? rgbToHex(mixHex(c, pal[3], 0.45)) : c;
}
function obstaclePath(o, inset) {
  ctx.beginPath();
  if (o.kind === 'rect') ctx.rect(o.x - o.w / 2 + inset, o.y - o.h / 2 + inset, Math.max(1, o.w - inset * 2), Math.max(1, o.h - inset * 2));
  else if (o.kind === 'circle') ctx.arc(o.x, o.y, Math.max(1, o.r - inset), 0, 6.283);
  else {
    const r = Math.max(1, o.r - inset * 1.8);
    for (let i = 0; i < 3; i++) { const a = o.rot + i * 2.094 - 1.571; ctx.lineTo(o.x + Math.cos(a) * r, o.y + Math.sin(a) * r); }
    ctx.closePath();
  }
}
function drawObstacles(pal, alpha) {
  const g = game, cA = obstacleColor(pal[4], pal), cB = obstacleColor(pal[3], pal);
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineJoin = 'round';
  for (const o of g.obstacles) {
    const col = o.hue < 0.5 ? cA : cB;
    obstaclePath(o, 0);
    ctx.fillStyle = 'rgba(4,2,12,0.55)'; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.lineWidth = 6; ctx.stroke();            // dark outline
    ctx.fillStyle = rgba(col, 0.2); ctx.fill();
    glow(col, 9); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke(); noGlow(); // colour stroke
    obstaclePath(o, 5); ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1; ctx.stroke(); // inner stroke
  }
  ctx.restore();
}

function ringColor(ratio) { // green -> yellow -> red
  const r = clamp(ratio, 0, 1);
  const h = 120 - r * 120;
  return 'hsl(' + h + ',100%,55%)';
}

// ---- Reticle + ring-as-health ----
const RING_SEGS = 24;
function drawTarget() {
  const g = game, tg = g.target, b = g.ball, R = CONFIG.ringRadius;
  const d = Math.hypot(b.x - tg.x, b.y - tg.y), sr = sweetR();
  const col = ringColor((d - sr) / (CONFIG.ringRadius * 1.6));
  const hp = g.maxHealth ? clamp(g.health / g.maxHealth, 0, 1) : 1;
  const low = hp < 0.25 && g.state === 'play';
  const pulse = low ? 0.5 + 0.5 * Math.sin(fx.t * 11) : 0;
  ctx.save(); ctx.translate(tg.x, tg.y);
  // Rotating bezel: tick marks + counter-rotating arc dashes
  ctx.save(); ctx.rotate(fx.bezel);
  ctx.strokeStyle = col; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < 48; i++) {
    const a = i * 0.1309, big = i % 6 === 0, r0 = R + 9, r1 = R + (big ? 17 : 13), c = Math.cos(a), s = Math.sin(a);
    ctx.moveTo(c * r0, s * r0); ctx.lineTo(c * r1, s * r1);
  }
  ctx.stroke(); ctx.restore();
  ctx.save(); ctx.rotate(-fx.bezel * 0.6); ctx.strokeStyle = col; ctx.globalAlpha = 0.28; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < 3; i++) { ctx.moveTo(Math.cos(i * 2.094) * (R + 24), Math.sin(i * 2.094) * (R + 24)); ctx.arc(0, 0, R + 24, i * 2.094, i * 2.094 + 0.7); }
  ctx.stroke(); ctx.restore();
  // Health arc: segmented, drops segments, pulses red when low
  const lit = Math.ceil(hp * RING_SEGS - 1e-6), shown = Math.ceil(clamp(fx.hpShown, 0, 1) * RING_SEGS - 1e-6), span = 6.283 / RING_SEGS, gap = 0.07;
  ctx.lineCap = 'butt'; ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.beginPath();
  for (let i = lit; i < RING_SEGS; i++) { const a0 = -1.571 + i * span + gap; ctx.moveTo(Math.cos(a0) * R, Math.sin(a0) * R); ctx.arc(0, 0, R, a0, a0 + span - gap * 2); }
  ctx.stroke();
  if (shown > lit) { // segments just lost: flash white->red then fade
    ctx.strokeStyle = '#ff4060'; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(fx.t * 30); ctx.beginPath();
    for (let i = lit; i < shown; i++) { const a0 = -1.571 + i * span + gap; ctx.moveTo(Math.cos(a0) * R, Math.sin(a0) * R); ctx.arc(0, 0, R, a0, a0 + span - gap * 2); }
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  const hc = low ? '#ff2a3a' : ringColor(1 - hp);
  ctx.globalAlpha = low ? 0.55 + 0.45 * pulse : 1;
  glow(hc, low ? 10 + 12 * pulse : 14); ctx.strokeStyle = hc; ctx.beginPath();
  for (let i = 0; i < lit; i++) { const a0 = -1.571 + i * span + gap; ctx.moveTo(Math.cos(a0) * R, Math.sin(a0) * R); ctx.arc(0, 0, R, a0, a0 + span - gap * 2); }
  ctx.stroke(); noGlow(); ctx.globalAlpha = 1;
  // Hit cracks across the ring
  if (fx.cracks.length) {
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    for (const c of fx.cracks) {
      ctx.globalAlpha = 1 - c.t / c.max; const ca = Math.cos(c.a), sa = Math.sin(c.a);
      ctx.beginPath(); ctx.moveTo(ca * (R - 9), sa * (R - 9)); ctx.lineTo(ca * (R - 2) - sa * 4, sa * (R - 2) + ca * 4);
      ctx.lineTo(ca * (R + 3) + sa * 3, sa * (R + 3) - ca * 3); ctx.lineTo(ca * (R + 10), sa * (R + 10)); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  if (g.hold && g.state === 'play') { // opening hold: a ring closes on the reticle, then GO
    const p = g.tutRun ? 0.5 + 0.5 * Math.sin(fx.t * 5) : clamp(g.holdT / HOLD_S, 0, 1);
    ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.75; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, R + 44 - 30 * p, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1;
  }
  // Crosshair notches + sweet spot
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < 4; i++) { const c = Math.cos(i * 1.571), s = Math.sin(i * 1.571); ctx.moveTo(c * (R - 15), s * (R - 15)); ctx.lineTo(c * (R - 6), s * (R - 6)); }
  ctx.stroke();
  ctx.lineWidth = 2; ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.setLineDash([5, 5]);
  glow(col, 10); ctx.beginPath(); ctx.arc(0, 0, sr, 0, 6.283); ctx.fill(); ctx.stroke(); noGlow();
  ctx.setLineDash([]);
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, 6.283); ctx.fill();
  ctx.restore();
}

function drawBall(pal) {
  const g = game, b = g.ball;
  trailDraw(ctx, g.trailSt, selItem('trails').id, b.r, pal[2]);
  ctx.save(); glow('#ffffff', 22); ctx.fillStyle = 'rgba(255,255,255,0.16)'; // halo keeps the ball the brightest object
  ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 1.25, 0, 6.283); ctx.fill(); ctx.restore();
  ballDraw(ctx, selItem('balls').id, b.x, b.y, b.r, g.bgT, Math.atan2(g.dirY, g.dirX), pal[2]);
}

function fmtTime(s) { return s.toFixed(1); }

// ---- Edge danger / flash vignette (cached gradients) ----
let _eg = null;
function edgeGrads() {
  const key = W + 'x' + PH;
  if (_eg && _eg.key === key) return _eg;
  const Z = 70, mk = (x0, y0, x1, y1) => { const q = ctx.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, 'rgba(255,30,40,0.85)'); q.addColorStop(1, 'rgba(255,30,40,0)'); return q; };
  _eg = { key, Z, t: mk(0, 0, 0, Z), b: mk(0, PH, 0, PH - Z), l: mk(0, 0, Z, 0), r: mk(W, 0, W - Z, 0) };
  return _eg;
}
function drawEdgeDanger() {
  const g = game, b = g.ball, e = edgeGrads(), Z = e.Z, play = g.state === 'play';
  const fl = clamp(g.flash * 1.6, 0, 0.7);
  const prox = (dist) => play ? Math.pow(clamp(1 - dist / Z, 0, 1), 1.5) * 0.8 : 0;
  const A = {
    l: Math.max(prox(b.x - b.r), fx.ef.l * 0.9, fl), r: Math.max(prox(W - b.x - b.r), fx.ef.r * 0.9, fl),
    t: Math.max(prox(b.y - b.r), fx.ef.t * 0.9, fl), b: Math.max(prox(PH - b.y - b.r), fx.ef.b * 0.9, fl)
  };
  ctx.save();
  if (A.t > 0.02) { ctx.globalAlpha = A.t; ctx.fillStyle = e.t; ctx.fillRect(0, 0, W, Z); }
  if (A.b > 0.02) { ctx.globalAlpha = A.b; ctx.fillStyle = e.b; ctx.fillRect(0, PH - Z, W, Z); }
  if (A.l > 0.02) { ctx.globalAlpha = A.l; ctx.fillStyle = e.l; ctx.fillRect(0, 0, Z, PH); }
  if (A.r > 0.02) { ctx.globalAlpha = A.r; ctx.fillStyle = e.r; ctx.fillRect(W - Z, 0, Z, PH); }
  if (fx.chroma > 0.05 && !game.reduceMotion) { // chromatic-aberration pulse on the contacted edge
    ctx.globalAlpha = fx.chroma * 0.8;
    if (fx.ef.l > 0.1) { ctx.fillStyle = '#00e5ff'; ctx.fillRect(0, 0, 3, PH); ctx.fillStyle = '#ff2040'; ctx.fillRect(3, 0, 3, PH); }
    if (fx.ef.r > 0.1) { ctx.fillStyle = '#00e5ff'; ctx.fillRect(W - 3, 0, 3, PH); ctx.fillStyle = '#ff2040'; ctx.fillRect(W - 6, 0, 3, PH); }
    if (fx.ef.t > 0.1) { ctx.fillStyle = '#00e5ff'; ctx.fillRect(0, 0, W, 3); ctx.fillStyle = '#ff2040'; ctx.fillRect(0, 3, W, 3); }
    if (fx.ef.b > 0.1) { ctx.fillStyle = '#00e5ff'; ctx.fillRect(0, PH - 3, W, 3); ctx.fillStyle = '#ff2040'; ctx.fillRect(0, PH - 6, W, 3); }
  }
  ctx.restore();
}

// ---- HUD ----
function drawHero() {
  const g = game, passed = g.best > 0 && g.t > g.best;
  const pulse = 1 + (game.reduceMotion ? 0 : 0.06 * fx.bestFlash);
  monoText(fmtTime(g.t), W / 2, 38, 46 * pulse, passed ? '#ffee66' : '#ffffff', passed ? 18 : 12);
  if (g.best > 0) {
    if (passed) {
      textAt('NEW BEST', W / 2, 74, 13, '#ffee00', 8 + 10 * fx.bestFlash, { font: 'display', alpha: 0.75 + 0.25 * Math.sin(fx.t * 6) });
    } else {
      textAt('BEST ' + fmtTime(g.best), W / 2, 74, 12, '#ffffff', 0, { font: 'display', alpha: 0.5 });
      const bw = 120, bx = (W - bw) / 2, p = clamp(g.t / g.best, 0, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(bx, 86, bw, 3);
      ctx.fillStyle = p > 0.85 ? '#ffee66' : 'rgba(255,255,255,0.6)'; ctx.fillRect(bx, 86, bw * p, 3);
      ctx.fillStyle = '#ffee66'; ctx.fillRect(bx + bw - 1, 83, 2, 9); // ghost marker at the best time
    }
  }
  // In-run shards, top right (below the dev gear in playtest builds)
  if (typeof runShards === 'function') {
    const sc = 1 + (game.reduceMotion ? 0 : 0.25 * fx.shardPulse), y = BUILD.devUI ? 72 : 34, str = String(runShards());
    ctx.font = Math.round(20 * sc) + 'px ' + FONT_DISPLAY; const w = ctx.measureText(str).width;
    textAt(str, W - 16, y, 20 * sc, '#ffd84d', 8, { font: 'display', align: 'right' }); scrShard(W - 16 - w - 14, y - 1, 8);
  }
}

function render() {
  const g = game, pal = palette(g.stageF());
  const now = performance.now(), fdt = fx.last ? Math.min(0.05, Math.max(0, (now - fx.last) / 1000)) : 0; fx.last = now;
  fxUpdate(g.paused ? 0 : fdt);
  const over = g.state === 'over', dT = over ? now - g.overAt : 0;
  g.deathFx = over && dT < 450;
  ctx.setTransform(RS, 0, 0, RS, 0, 0);
  ctx.save();
  const sh = g.reduceMotion ? 0 : Math.max(g.shake, fx.shake);
  if (sh > 0.2) ctx.translate(rand(-sh, sh), rand(-sh, sh));
  drawBackground(pal);
  if (g.ball && g.target) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, PH); ctx.clip(); // play layer never draws over the footer
    if (g.state === 'play') drawObstacles(pal, 1);
    else if (over) drawObstacles(pal, clamp(1 - dT / 600, 0.12, 1));
    if (!over) { drawTarget(); drawBall(pal); }
    fxDrawWorld(ctx);
    ctx.restore();
  }
  ctx.restore();
  if (g.ball && (g.state === 'play' || g.state === 'start')) drawEdgeDanger();
  if (over && dT < 2000) { // desaturate on death
    const k = dT < 450 ? dT / 450 : 1;
    ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = 0.75 * k; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, PH); ctx.restore();
  }
  if (g.state === 'play') drawHero();
  fxDraw(ctx);
  drawOverlayScreens(pal);
}

