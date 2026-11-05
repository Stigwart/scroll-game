// ============================================================
// Simulation
// ============================================================
function step(dt) {
  const g = game, b = g.ball, tg = g.target, L = level();
  g.t += dt; pwTick(g, dt);
  const kd = kbDir(); if (kd.x || kd.y) { const n = Math.hypot(kd.x, kd.y); tg.x = clamp(tg.x + kd.x / n * KSPEED * dt, 0, W); tg.y = clamp(tg.y + kd.y / n * KSPEED * dt, 0, PH); }

  // Smooth random drift: lerp toward a periodically re-rolled target vector
  const dr = g.drift;
  dr.timer -= dt;
  if (dr.timer <= 0) {
    dr.timer = srand(0.8, 2.2) / (1 + 0.4 * L);
    const a = srand(0, 6.283); dr.tx = Math.cos(a); dr.ty = Math.sin(a) * 0.8;
  }
  const k = 1 - Math.exp(-dt * 1.6);
  dr.x += (dr.tx - dr.x) * k; dr.y += (dr.ty - dr.y) * k;

  // Forces on the ball (accelerations)
  let ax = 0, ay = 0;
  const dx = b.x - tg.x, dy = b.y - tg.y, d = Math.hypot(dx, dy) || 1e-6;
  const excess = Math.max(0, d - sweetR());
  const repel = T.repel * MOD.calm * (1 + 0.55 * L) * CONFIG.repulsionUnit * excess;   // (a) away from target
  ax += dx / d * repel; ay += dy / d * repel;
  ax += (W / 2 - b.x) * T.pull; ay += (PH * 0.5 - b.y) * T.pull;             // (b) towards screen centre
  ay -= T.up;                                                                // (c) upward bias
  const ds = T.drift * MOD.drift * MOD.calm * (1 + 0.6 * L) * CONFIG.driftUnit;                     // (d) drift
  ax += dr.x * ds; ay += dr.y * ds;
  b.vx += ax * dt; b.vy += ay * dt;
  const damp = Math.exp(-T.damp * dt); b.vx *= damp; b.vy *= damp;
  b.x += b.vx * dt; b.y += b.vy * dt;

  // Obstacles (e): move, collide, cull
  g.spawnTimer -= dt;
  if (g.spawnTimer <= 0) { spawnObstacle(); g.spawnTimer = srand(1.4, 2.4) / (T.spawn * (1 + 0.7 * L)); }
  for (let i = g.obstacles.length - 1; i >= 0; i--) {
    const o = g.obstacles[i];
    o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.spin * dt;
    const m = (o.kind === 'rect' ? Math.max(o.w, o.h) : o.r) + 140;
    if (o.x < -m || o.x > W + m || o.y < -m || o.y > PH + m) {
      if (o.seen || o.age > 8) { g.obstacles.splice(i, 1); continue; }
    }
    o.age = (o.age || 0) + dt;
    if (o.x > -20 && o.x < W + 20 && o.y > -20 && o.y < PH + 20) o.seen = true;
    if (collideObstacle(b, o)) { g.shake = Math.max(g.shake, 3); telHit(o); Audio_.sfx('hit'); }
  }

  // Play-area edges: mirror overshoot, reflect with restitution, guarantee a minimum inward speed
  let edge = false; const e = T.bounce, kick = T.kick;
  const x0 = b.r, x1 = W - b.r, y0 = b.r, y1 = PH - b.r;
  if (b.x < x0) { b.x = Math.min(x1, x0 + (x0 - b.x)); b.vx = Math.max(Math.abs(b.vx) * e, kick); edge = true; }
  else if (b.x > x1) { b.x = Math.max(x0, x1 - (b.x - x1)); b.vx = -Math.max(Math.abs(b.vx) * e, kick); edge = true; }
  if (b.y < y0) { b.y = Math.min(y1, y0 + (y0 - b.y)); b.vy = Math.max(Math.abs(b.vy) * e, kick); edge = true; }
  else if (b.y > y1) { b.y = Math.max(y0, y1 - (b.y - y1)); b.vy = -Math.max(Math.abs(b.vy) * e, kick); edge = true; }
  const newContact = edge && !g.edgeTouch;
  g.edgeTouch = edge; if (newContact) Audio_.sfx('edge');
  // Hard speed cap (not affected by escalation), applied after all forces, pushes and bounces
  const sp = Math.hypot(b.vx, b.vy);
  if (sp > T.maxSpeed) { const f = T.maxSpeed / sp; b.vx *= f; b.vy *= f; }

  // Health: none in sweet spot, grows with distance, much faster on edge
  const lossD = T.loss * (excess / 40) * (1 + 0.5 * L);
  let lossE = 0;
  const edgeRate = T.loss * T.edge * CONFIG.edgeLossBase * 1.5 + 6;
  if (edge) { lossE = edgeRate + (newContact ? 0.15 * edgeRate / dt : 0); g.shake = Math.max(g.shake, 4); g.flash = Math.min(0.35, g.flash + dt * 2); }
  const loss = lossD + lossE;
  if (loss > 0) { const f = Math.min(g.health, loss * dt) / loss; telStep(dt, d, edge, lossD * f, lossE * f); }
  else telStep(dt, d, edge, 0, 0);
  g.health -= loss * dt;
  if (g.health <= 0) { g.health = 0; endRun(); }
}

function update(frameDt) {
  const g = game;
  g.bgT += frameDt; Audio_.setIntensity(Math.min(3, Math.floor(g.stageF())));
  // Background always drifts
  const sf = g.stageF();
  g.bgOff.x += Math.cos(g.bgT * 0.17) * 22 * frameDt * (1 + sf);
  g.bgOff.y += (14 + Math.sin(g.bgT * 0.11) * 10) * frameDt * (1 + sf);
  for (const bl of g.blobs) {
    bl.x += bl.vx * frameDt * (1 + sf); bl.y += bl.vy * frameDt * (1 + sf);
    if (bl.x < -0.2 || bl.x > 1.2) bl.vx *= -1;
    if (bl.y < -0.2 || bl.y > 1.2) bl.vy *= -1;
  }
  g.shake *= Math.exp(-frameDt * 10); g.flash *= Math.exp(-frameDt * 6);
  if (g.state === 'play' && !g.paused && !panelOpen) {
    g.acc += frameDt;
    while (g.acc >= CONFIG.step && g.state === 'play') { step(CONFIG.step); g.acc -= CONFIG.step; }
  }
  if (g.ball) { // cosmetic: smoothed travel direction + trail
    const sp = Math.hypot(g.ball.vx, g.ball.vy), k = 1 - Math.exp(-frameDt * 10);
    if (sp > 8) { g.dirX += (g.ball.vx / sp - g.dirX) * k; g.dirY += (g.ball.vy / sp - g.dirY) * k; }
    trailUpdate(g.trailSt, selItem('trails').id, g.ball.x, g.ball.y, frameDt, g.state === 'play' && !g.paused && !panelOpen);
  }
}

