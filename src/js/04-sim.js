// ============================================================
// Simulation
// ============================================================
const MILESTONES = [[30, 10], [60, 20], [120, 40], [180, 60]];
// Distance between ball edge and obstacle edge (<= 0 means contact); mirrors collideObstacle geometry
function obstacleGap(b, o) {
  if (o.kind === 'rect') {
    const hw = o.w / 2, hh = o.h / 2, cx = clamp(b.x, o.x - hw, o.x + hw), cy = clamp(b.y, o.y - hh, o.y + hh);
    return Math.hypot(b.x - cx, b.y - cy) - b.r;
  }
  return Math.hypot(b.x - o.x, b.y - o.y) - (o.kind === 'tri' ? o.r * 0.8 : o.r) - b.r;
}
// Obstacle density stays constant when the play field is larger than the 450x648 reference (wide layout)
const fieldK = () => (W * PH) / (REF_W * REF_H) * lerp(1, 0.8, clamp((W - REF_W) / (MAX_W - REF_W), 0, 1));
// Opening hold: the ball rides in the ring until GO, so every run starts from control (run 1 waits for the player to move)
const HOLD_S = 0.8, HOLD_TUT_MAX = 8;
function step(dt) {
  const g = game, b = g.ball, tg = g.target, L = level();
  if (g.hold) {
    const px = tg.x, py = tg.y, kd0 = kbDir();
    if (kd0.x || kd0.y) { const n = Math.hypot(kd0.x, kd0.y); tg.x = clamp(tg.x + kd0.x / n * KSPEED * dt, 0, W); tg.y = clamp(tg.y + kd0.y / n * KSPEED * dt, 0, PH); }
    g.holdMove += Math.hypot(tg.x - (g.holdPx === undefined ? px : g.holdPx), tg.y - (g.holdPy === undefined ? py : g.holdPy)); g.holdPx = tg.x; g.holdPy = tg.y;
    const k0 = 1 - Math.exp(-dt * 16); b.x += (clamp(tg.x, b.r, W - b.r) - b.x) * k0; b.y += (clamp(tg.y, b.r, PH - b.r) - b.y) * k0; b.vx = b.vy = 0;
    g.holdT += dt; if (g.tutRun) g.tutorial = 'move';
    if (g.holdT >= (g.tutRun ? HOLD_TUT_MAX : HOLD_S) || (g.tutRun && g.holdT >= HOLD_S && g.holdMove > 90)) { g.hold = false; g.holdPx = g.holdPy = undefined; fxe('go'); }
    return;
  }
  g.t += dt; pwTick(g, dt);
  const rm = g.reduceMotion;
  // Stage tracking, milestones, new-best crossing (events are cosmetic; no RNG)
  const si = Math.min(7, Math.floor(g.stageF()));
  if (si > g.stageSeen) {
    g.stageSeen = si; g.stats.stageMax = si; g.breatherUntil = g.t + 3.5;
    fxe('stage', { index: si, name: CONFIG.stageNames[si] });
  }
  while (g.msDone < MILESTONES.length && g.t >= MILESTONES[g.msDone][0]) {
    const m = MILESTONES[g.msDone++]; g.stats.bonusShards += m[1]; g.stats.milestones++;
    fxe('milestone', { secs: m[0], shards: m[1] });
  }
  if (!g.bestPassed && g.prevBest > 0 && g.t > g.prevBest) { g.bestPassed = true; fxe('newBestPassed'); }
  if (g.tutRun) {
    if (g.t < 8) g.tutorial = 'centre';
    else if (g.tutSpawnAt >= 0 && g.t - g.tutSpawnAt < 4) g.tutorial = 'dodge';
    else g.tutorial = '';
  }
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
  if (d <= sweetR()) g.stats.sweetTime += dt;
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
  if (!(g.tutRun && g.t < 8)) g.spawnTimer -= g.t < g.breatherUntil ? dt * 0.25 : dt;
  if (g.spawnTimer <= 0) {
    spawnObstacle();
    if (g.tutRun && g.tutSpawnAt < 0) { // first obstacle of run 1: gentle, and flagged for the 'dodge' hint
      g.tutSpawnAt = g.t; const fo = g.obstacles[g.obstacles.length - 1]; fo.vx *= 0.7; fo.vy *= 0.7;
    }
    g.spawnTimer = srand(1.4, 2.4) / (T.spawn * (1 + 0.7 * L) * fieldK()); }
  for (let i = g.obstacles.length - 1; i >= 0; i--) {
    const o = g.obstacles[i];
    o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.spin * dt;
    const m = (o.kind === 'rect' ? Math.max(o.w, o.h) : o.r) + 140;
    if (o.x < -m || o.x > W + m || o.y < -m || o.y > PH + m) {
      if (o.seen || o.age > 8) { g.obstacles.splice(i, 1); continue; }
    }
    o.age = (o.age || 0) + dt;
    if (o.x > -20 && o.x < W + 20 && o.y > -20 && o.y < PH + 20) o.seen = true;
    if (!o.hit && !o.nmDone) { // near miss: closest approach within 10 px of the ball edge, no contact
      const gap = obstacleGap(b, o);
      if (o.nmMin === undefined) o.nmMin = 1e9;
      if (gap < o.nmMin) o.nmMin = gap;
      else if (o.nmMin < 10 && gap > o.nmMin + 0.5) {
        o.nmDone = true; g.stats.nearMiss++; g.stats.bonusShards += 2; fxe('nearMiss', { x: b.x, y: b.y });
      }
    }
    if (collideObstacle(b, o)) {
      o.hit = true;
      if (!rm) g.shake = Math.max(g.shake, 3); telHit(o); Audio_.sfx('hit');
      if (g.t - (o.dmgAt === undefined ? -9 : o.dmgAt) > 0.6) { // one damage tick per obstacle contact
        o.dmgAt = g.t; const dmg = T.hit * (1 + 0.2 * L) * (1 - 0.4 * assist());
        g.health -= dmg; g.stats.hits++; if (!rm) g.hitStop = 0.06;
        fxe('hit', { x: b.x, y: b.y, dmg }); g.flash = Math.min(0.35, g.flash + 0.25);
      }
    }
  }

  // Play-area edges: mirror overshoot, reflect with restitution, guarantee a minimum inward speed
  let edge = false, eSide = ''; const e = T.bounce, kick = T.kick;
  const x0 = b.r, x1 = W - b.r, y0 = b.r, y1 = PH - b.r;
  if (b.x < x0) { b.x = Math.min(x1, x0 + (x0 - b.x)); b.vx = Math.max(Math.abs(b.vx) * e, kick); edge = true; eSide = 'left'; }
  else if (b.x > x1) { b.x = Math.max(x0, x1 - (b.x - x1)); b.vx = -Math.max(Math.abs(b.vx) * e, kick); edge = true; eSide = 'right'; }
  if (b.y < y0) { b.y = Math.min(y1, y0 + (y0 - b.y)); b.vy = Math.max(Math.abs(b.vy) * e, kick); edge = true; eSide = eSide || 'top'; }
  else if (b.y > y1) { b.y = Math.max(y0, y1 - (b.y - y1)); b.vy = -Math.max(Math.abs(b.vy) * e, kick); edge = true; eSide = eSide || 'bottom'; }
  const newContact = edge && !g.edgeTouch;
  g.edgeTouch = edge; if (newContact) { Audio_.sfx('edge'); fxe('edge', { x: b.x, y: b.y, side: eSide }); }
  // Hard speed cap (not affected by escalation), applied after all forces, pushes and bounces
  const sp = Math.hypot(b.vx, b.vy);
  if (sp > T.maxSpeed) { const f = T.maxSpeed / sp; b.vx *= f; b.vy *= f; }

  // Health: none in sweet spot, grows with distance, much faster on edge
  const lossD = T.loss * (excess / 40) * (1 + 0.5 * L) * (1 - 0.4 * assist());
  let lossE = 0;
  const edgeRate = (CONFIG.edgeBase * T.edge * CONFIG.edgeLossBase * 1.5 + 6) * (1 - 0.4 * assist());
  if (edge) { lossE = edgeRate + (newContact ? 0.15 * edgeRate / dt : 0); if (!rm) g.shake = Math.max(g.shake, 4); g.flash = Math.min(0.35, g.flash + dt * 2); }
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
  if (g.reduceMotion) { g.shake = 0; g.hitStop = 0; g.slowMo = 0; }
  if (g.state === 'play' && !g.paused && !panelOpen) {
    { const kd = kbDir(); if (kd.x || kd.y) g.mouseGoal = null; }
    if (g.mouseGoal && g.target) { // desktop mouse-follow: ring chases the cursor at a capped speed
      const mx = g.mouseGoal.x - g.target.x, my = g.mouseGoal.y - g.target.y, md = Math.hypot(mx, my), mv = Math.min(md, 1600 * frameDt);
      if (md > 0.01) { g.target.x += mx / md * mv; g.target.y += my / md * mv; }
    }
    let ft = frameDt;
    if (g.hitStop > 0) { g.hitStop -= frameDt; ft = 0; }
    else if (g.slowMo > 0) { g.slowMo -= frameDt; ft = frameDt * 0.35; }
    g.acc += ft;
    while (g.acc >= CONFIG.step && g.state === 'play') { step(CONFIG.step); g.acc -= CONFIG.step; }
  }
  if (g.ball) { // cosmetic: smoothed travel direction + trail
    const sp = Math.hypot(g.ball.vx, g.ball.vy), k = 1 - Math.exp(-frameDt * 10);
    if (sp > 8) { g.dirX += (g.ball.vx / sp - g.dirX) * k; g.dirY += (g.ball.vy / sp - g.dirY) * k; }
    trailUpdate(g.trailSt, selItem('trails').id, g.ball.x, g.ball.y, frameDt, g.state === 'play' && !g.paused && !panelOpen);
  }
}

