// Rendering
// ============================================================
function glow(color, blur) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
function noGlow() { ctx.shadowBlur = 0; }

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
  // Scrolling perspective-less neon grid
  const cell = 64, ox = ((g.bgOff.x % cell) + cell) % cell, oy = ((g.bgOff.y % cell) + cell) % cell;
  ctx.strokeStyle = rgba(pal[2], 0.10 + 0.04 * sf); ctx.lineWidth = 1; ctx.beginPath();
  for (let x = -ox; x < W + cell; x += cell) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = -oy; y < H + cell; y += cell) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
}

function drawObstacle(o, pal) {
  const col = o.hue < 0.5 ? pal[4] : pal[3];
  ctx.save(); glow(col, 14);
  ctx.strokeStyle = col; ctx.fillStyle = rgba(col, 0.14); ctx.lineWidth = 2.5;
  if (o.kind === 'rect') {
    ctx.beginPath(); ctx.rect(o.x - o.w / 2, o.y - o.h / 2, o.w, o.h); ctx.fill(); ctx.stroke();
  } else if (o.kind === 'circle') {
    ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 6.283); ctx.fill(); ctx.stroke();
  } else {
    ctx.translate(o.x, o.y); ctx.rotate(o.rot); ctx.beginPath();
    for (let i = 0; i < 3; i++) { const a = i * 2.094 - 1.571; ctx.lineTo(Math.cos(a) * o.r, Math.sin(a) * o.r); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

function ringColor(ratio) { // green -> yellow -> red
  const r = clamp(ratio, 0, 1);
  const h = 120 - r * 120;
  return 'hsl(' + h + ',100%,55%)';
}

function drawTarget() {
  const g = game, tg = g.target, b = g.ball;
  const d = Math.hypot(b.x - tg.x, b.y - tg.y);
  const col = ringColor((d - T.sweet) / (CONFIG.ringRadius * 1.6));
  ctx.save();
  glow(col, 18); ctx.strokeStyle = col; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(tg.x, tg.y, CONFIG.ringRadius, 0, 6.283); ctx.stroke();
  // Sweet spot
  ctx.lineWidth = 2; ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.arc(tg.x, tg.y, T.sweet, 0, 6.283); ctx.fill(); ctx.stroke();
  ctx.setLineDash([]);
  noGlow(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(tg.x, tg.y, 2.5, 0, 6.283); ctx.fill();
  ctx.restore();
}

function drawBall(pal) {
  const g = game, b = g.ball;
  trailDraw(ctx, g.trailSt, selItem('trails').id, b.r, pal[2]);
  ballDraw(ctx, selItem('balls').id, b.x, b.y, b.r, g.bgT, Math.atan2(g.dirY, g.dirX), pal[2]);
}

function fmtTime(s) { return s.toFixed(1); }
function textCenter(str, y, size, color, blur) {
  ctx.font = 'bold ' + Math.round(Math.max(size, 12 / SCALE)) + 'px "Trebuchet MS", system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  glow(color, blur || 12); ctx.fillStyle = color; ctx.fillText(str, W / 2, y); noGlow();
}

function drawHUD(pal) {
  const g = game, inner = FH - SAFE_B;
  // Footer band
  ctx.fillStyle = '#030109'; ctx.fillRect(0, PH, W, FH);
  ctx.save(); glow(pal[2], 14); ctx.strokeStyle = pal[2]; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, PH + 1.5); ctx.lineTo(W, PH + 1.5); ctx.stroke(); ctx.restore();
  if (g.state !== 'play') return; // start / game-over: the footer becomes the action bar (DOM buttons sit on it); no timer, so the score is never shown twice
  const ts = Math.min(54, inner * 0.45);
  textCenter(fmtTime(g.t), PH + inner * 0.36, ts, '#ffffff', 16);
  const bw = Math.min(W - 40, 320), bx = (W - bw) / 2, bh = 12, by = PH + inner * 0.7, hp = clamp(g.health / CONFIG.startHealth, 0, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(bx, by, bw, bh);
  const hc = ringColor(1 - hp);
  ctx.save(); glow(hc, 10); ctx.fillStyle = hc; ctx.fillRect(bx, by, bw * hp, bh); ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
  ctx.font = Math.round(Math.max(13, 12 / SCALE)) + 'px "Trebuchet MS", system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillText('BEST ' + fmtTime(g.best), 14, PH + 18);
}

function drawOverlayScreens(pal) {
  const g = game;
  if (g.state === 'start') {
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
    textCenter('SCROLL GAME', H * 0.3, Math.min(48, W / 7.5), pal[2], 24);
    textCenter('Drag to keep the ball centred', H * 0.3 + 52, 18, '#dff', 6);
    const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 300);
    ctx.globalAlpha = pulse; textCenter('TAP TO START', H * 0.55, 28, '#ffee66', 14); ctx.globalAlpha = 1;
    textCenter('Best: ' + fmtTime(g.best) + 's', H * 0.55 + 50, 20, '#fff', 6);
  } else if (g.state === 'over') {
    // Fixed vertical layout (stage units): title 70 | time 140 | best 200 | new-best 240 | unlock list 296-380 | CTA 470 | rate 520-640 | footer 648+
    ctx.fillStyle = 'rgba(3,1,9,0.8)'; ctx.fillRect(0, 0, W, PH);
    textCenter('GAME OVER', 70, 40, '#ff3b5c', 22);
    textCenter(fmtTime(g.t) + 's', 140, 64, '#ffffff', 18);
    textCenter('Best: ' + fmtTime(g.best) + 's', 200, 22, '#9ff', 8);
    if (g.newBest) textCenter('NEW BEST!', 242, 30, '#ffee00', 20);
    const un = g.unlockedNow, shown = Math.min(un.length, 3);
    for (let i = 0; i < shown; i++) textCenter('Unlocked: ' + un[i] + '!', 296 + i * 28, 22, '#7fff9a', 12);
    if (un.length > 3) textCenter('+' + (un.length - 3) + ' more', 296 + 3 * 28, 18, '#7fff9a', 6);
    if (performance.now() - g.overAt > 600) {
      const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 300);
      ctx.globalAlpha = pulse; textCenter('TAP TO RETRY', 470, 26, '#ffffff', 12); ctx.globalAlpha = 1;
    }
  }
  if (g.paused && g.state === 'play' && !panelOpen) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
    textCenter('PAUSED', H * 0.4, 40, '#fff', 14);
    textCenter('Tap to resume', H * 0.4 + 46, 20, '#9ff', 6);
  }
}

function render() {
  const g = game, pal = palette(g.stageF());
  ctx.setTransform(RS, 0, 0, RS, 0, 0);
  ctx.save();
  if (g.shake > 0.2) ctx.translate(rand(-g.shake, g.shake), rand(-g.shake, g.shake));
  drawBackground(pal);
  if (g.state === 'play') {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, PH); ctx.clip(); // play layer never draws over the footer
    for (const o of g.obstacles) drawObstacle(o, pal);
    drawTarget(); drawBall(pal);
    ctx.restore();
  } else if (g.state === 'start') {
    // idle demo ring
    ctx.save(); glow(pal[2], 18); ctx.strokeStyle = pal[2]; ctx.lineWidth = 3; ctx.beginPath();
    ctx.arc(W / 2, PH * 0.78, CONFIG.ringRadius, 0, 6.283); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
  // Edge flash vignette
  if (g.flash > 0.02) {
    const rg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    rg.addColorStop(0, 'rgba(255,0,0,0)'); rg.addColorStop(1, 'rgba(255,30,30,' + g.flash + ')');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  }
  drawHUD(pal);
  drawOverlayScreens(pal);
}

// Tap to resume after auto-pause
window.addEventListener('pointerdown', e => {
  if (game.paused && !panelOpen && e.target === canvas) { game.paused = false; telClearInProg(); }
}, true);

