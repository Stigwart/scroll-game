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
// unlock: null = available from start; {type:'time', v} = best survival >= v seconds; {type:'runs', v} = total runs >= v;
// {type:'level', v}; skill unlocks: {type:'near', v} = v near misses in ONE run; {type:'stage', v} = reach stage number v (1-8); {type:'sweet', v} = v seconds in the sweet spot in ONE run.
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
  { id: 'eye', name: 'Eyeball', unlock: { type: 'near', v: 4 }, draw(c, x, y, r, t, a) {
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
  { id: 'bauble', name: 'Bauble', unlock: { type: 'stage', v: 5 }, draw(c, x, y, r, t) {
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
  } },
  { id: 'comet', name: 'Comet', unlock: { type: 'level', v: 5 }, draw(c, x, y, r, t, a, col) {
    c.translate(x, y); c.rotate(a);
    const L = r * (2.8 + 0.4 * Math.sin(t * 18)), g = c.createLinearGradient(0, 0, -L, 0);
    g.addColorStop(0, '#fff6c0'); g.addColorStop(0.35, '#ff9a3a'); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.moveTo(0, -r * 0.8); c.quadraticCurveTo(-L * 0.5, -r * 0.7, -L, 0);
    c.quadraticCurveTo(-L * 0.5, r * 0.7, 0, r * 0.8); c.closePath(); c.fill();
    c.shadowColor = '#fff'; c.shadowBlur = 18;
    const h = c.createRadialGradient(-r * 0.2, -r * 0.2, 1, 0, 0, r * 0.85);
    h.addColorStop(0, '#fff'); h.addColorStop(0.6, '#fffbe0'); h.addColorStop(1, '#ffc060');
    c.fillStyle = h; circ(c, 0, 0, r * 0.85); c.fill();
  } },
  { id: 'gem', name: 'Gem', unlock: { type: 'buy', v: 150 }, draw(c, x, y, r, t) {
    c.translate(x, y); c.rotate(t * 0.7);
    const P = (k, q) => [Math.cos(k * 1.0472) * r * q, Math.sin(k * 1.0472) * r * q];
    c.shadowColor = '#ff5ad0'; c.shadowBlur = 16;
    const g = c.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#ffd6fb'); g.addColorStop(0.5, '#ff4fd0'); g.addColorStop(1, '#6a1fd0');
    c.fillStyle = g; c.beginPath();
    for (let k = 0; k < 6; k++) { const p = P(k, 1); k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
    c.closePath(); c.fill(); c.shadowBlur = 0;
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.2; c.beginPath();
    for (let k = 0; k < 6; k++) { const p = P(k, 0.5), q = P(k, 1); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); k ? c.lineTo(P(k - 1, 0.5)[0], P(k - 1, 0.5)[1]) : 0; }
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.moveTo(P(4, 0.5)[0], P(4, 0.5)[1]); c.lineTo(P(5, 0.5)[0], P(5, 0.5)[1]); c.lineTo(0, 0); c.fill();
  } },
  { id: 'yinyang', name: 'Balance', unlock: { type: 'sweet', v: 20 }, draw(c, x, y, r, t) {
    c.translate(x, y); c.rotate(t * 2.2);
    c.shadowColor = '#9ff'; c.shadowBlur = 14; c.fillStyle = '#e8fdff'; circ(c, 0, 0, r); c.fill(); c.shadowBlur = 0;
    c.fillStyle = '#ff3df0'; c.beginPath(); c.arc(0, 0, r, -1.5708, 1.5708); c.fill();
    c.fillStyle = '#e8fdff'; circ(c, 0, -r / 2, r / 2); c.fill();
    c.fillStyle = '#ff3df0'; circ(c, 0, r / 2, r / 2); c.fill();
    c.fillStyle = '#ff3df0'; circ(c, 0, -r / 2, r * 0.14); c.fill();
    c.fillStyle = '#e8fdff'; circ(c, 0, r / 2, r * 0.14); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.2; circ(c, 0, 0, r - 0.5); c.stroke();
  } },
  { id: 'moon', name: 'Moon', unlock: { type: 'time', v: 60 }, draw(c, x, y, r) {
    c.shadowColor = '#b8c8ff'; c.shadowBlur = 20;
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, 1, x, y, r); g.addColorStop(0, '#fffdf0'); g.addColorStop(1, '#c9cfe6');
    c.fillStyle = g; circ(c, x, y, r); c.fill(); c.shadowBlur = 0;
    c.fillStyle = 'rgba(120,128,160,0.45)';
    circ(c, x - r * 0.35, y - r * 0.2, r * 0.25); c.fill(); circ(c, x + r * 0.35, y + r * 0.3, r * 0.2); c.fill();
    circ(c, x + r * 0.2, y - r * 0.5, r * 0.13); c.fill(); circ(c, x - r * 0.25, y + r * 0.5, r * 0.1); c.fill();
  } },
  { id: 'target', name: 'Bullseye', unlock: { type: 'stage', v: 7 }, draw(c, x, y, r, t, a, col) {
    c.shadowColor = col; c.shadowBlur = 14;
    c.fillStyle = '#fff'; circ(c, x, y, r); c.fill(); c.shadowBlur = 0;
    c.fillStyle = col; circ(c, x, y, r * 0.73); c.fill();
    c.fillStyle = '#fff'; circ(c, x, y, r * 0.47); c.fill();
    c.fillStyle = col; circ(c, x, y, r * 0.22); c.fill();
    c.strokeStyle = 'rgba(0,0,40,0.35)'; c.lineWidth = 1; circ(c, x, y, r * 0.73); c.stroke();
  } },
  { id: 'sun', name: 'Sun', unlock: { type: 'buy', v: 400 }, draw(c, x, y, r, t) {
    c.translate(x, y); c.rotate(t * 0.8);
    c.shadowColor = '#ffb020'; c.shadowBlur = 16;
    c.strokeStyle = '#ffd24a'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath();
    for (let k = 0; k < 10; k++) {
      const an = k * 0.6283, o = r * (1.2 + 0.28 * Math.sin(t * 6 + k * 1.3));
      c.moveTo(Math.cos(an) * r * 0.82, Math.sin(an) * r * 0.82); c.lineTo(Math.cos(an) * o, Math.sin(an) * o);
    }
    c.stroke(); c.shadowBlur = 0;
    const g = c.createRadialGradient(-r * 0.2, -r * 0.2, 1, 0, 0, r * 0.8); g.addColorStop(0, '#fffbd0'); g.addColorStop(0.6, '#ffd23a'); g.addColorStop(1, '#ff9a1a');
    c.fillStyle = g; circ(c, 0, 0, r * 0.75); c.fill();
  } },
  { id: 'atom', name: 'Atom', unlock: { type: 'level', v: 12 }, draw(c, x, y, r, t) {
    c.translate(x, y); c.rotate(t * 0.4);
    c.lineWidth = 1.2; c.shadowColor = '#7dffe0'; c.shadowBlur = 12;
    for (let i = 0; i < 3; i++) {
      c.strokeStyle = 'rgba(190,255,240,0.75)'; c.beginPath(); c.ellipse(0, 0, r * 1.15, r * 0.42, 0, 0, 6.283); c.stroke();
      const u = t * (3 + i) + i * 2; c.fillStyle = i === 1 ? '#ffe27a' : '#fff';
      circ(c, Math.cos(u) * r * 1.15, Math.sin(u) * r * 0.42, r * 0.17); c.fill();
      c.rotate(1.0472);
    }
    const g = c.createRadialGradient(-r * 0.1, -r * 0.1, 1, 0, 0, r * 0.45); g.addColorStop(0, '#fff'); g.addColorStop(1, '#ff6a9a');
    c.fillStyle = g; circ(c, 0, 0, r * 0.42); c.fill();
  } },
  { id: 'crown', name: 'Royal', unlock: { type: 'streak', v: 7 }, draw(c, x, y, r, t) {
    c.shadowColor = '#a24dff'; c.shadowBlur = 16;
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r); g.addColorStop(0, '#c88cff'); g.addColorStop(0.55, '#7a2be0'); g.addColorStop(1, '#2c0a66');
    c.fillStyle = g; circ(c, x, y + r * 0.1, r * 0.9); c.fill(); c.shadowBlur = 0;
    const w = r * 0.55, b = y - r * 0.55, h = r * 0.6;
    c.fillStyle = '#ffd24a'; c.strokeStyle = '#a86a00'; c.lineWidth = 1; c.beginPath();
    c.moveTo(x - w, b); c.lineTo(x - w, b - h * 0.75); c.lineTo(x - w * 0.5, b - h * 0.4); c.lineTo(x, b - h);
    c.lineTo(x + w * 0.5, b - h * 0.4); c.lineTo(x + w, b - h * 0.75); c.lineTo(x + w, b); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ff4a6a'; circ(c, x, b - h * 0.3, r * 0.1); c.fill();
    c.fillStyle = '#fff'; star4(c, x + r * 0.55, y + r * 0.1, r * (0.3 + 0.2 * Math.sin(t * 5)));
  } }
];
const TRAILS = [
  { id: 'classic', name: 'Classic Fade', unlock: null },
  { id: 'rainbow', name: 'Rainbow', unlock: { type: 'time', v: 15 } },
  { id: 'sparks', name: 'Sparks', unlock: { type: 'runs', v: 4 } },
  { id: 'ribbon', name: 'Ribbon', unlock: { type: 'stage', v: 3 } },
  { id: 'bubbles', name: 'Bubbles', unlock: { type: 'sweet', v: 10 } },
  { id: 'comet', name: 'Comet Tail', unlock: { type: 'near', v: 8 } },
  { id: 'stars', name: 'Stardust', unlock: { type: 'buy', v: 250 } },
  { id: 'pixels', name: 'Pixels', unlock: { type: 'level', v: 9 } },
  { id: 'echo', name: 'Echo', unlock: { type: 'time', v: 90 } },
  { id: 'none', name: 'None', unlock: null }
];
const THEMES = [
  { id: 'neon', name: 'Neon', unlock: null },
  { id: 'aurora', name: 'Aurora', unlock: { type: 'level', v: 6 }, fx: [-70, 1] },
  { id: 'ember', name: 'Ember', unlock: { type: 'buy', v: 500 }, fx: [150, 1.1] },
  { id: 'mono', name: 'Mono', unlock: { type: 'stage', v: 8 }, fx: [0, 0.12] }
];
const LISTS = { balls: BALLS, trails: TRAILS, themes: THEMES };
const LABELS = { balls: 'Balls', trails: 'Trails', themes: 'Themes' };
const TAB_ICON = { themes: '&#9641;', balls: '&#9679;', trails: '&#8779;', upgrades: '&#9650;', daily: '&#10003;' };

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
  } else if (active && id === 'stars') {
    st.acc += dt;
    while (st.acc > 0.06) { st.acc -= 0.06; st.parts.push({ x: x + rand(-6, 6), y: y + rand(-6, 6), vx: rand(-25, 25), vy: rand(-30, 10), life: 0, max: rand(0.6, 1.1), sz: rand(0.35, 0.6), ph: rand(0, 6.28) }); }
  } else if (active && id === 'echo') {
    st.acc += dt;
    while (st.acc > 0.1) { st.acc -= 0.1; st.parts.push({ x, y, vx: 0, vy: 0, life: 0, max: 0.55, sz: 1 }); }
  }
  for (let i = st.parts.length - 1; i >= 0; i--) {
    const p = st.parts[i]; p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.life > p.max) st.parts.splice(i, 1);
  }
  if (id !== 'sparks' && id !== 'bubbles' && id !== 'stars' && id !== 'echo') st.parts.length = 0;
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
  } else if (id === 'comet') {
    c.lineCap = 'round';
    for (let i = 1; i < pts.length; i++) {
      const f = pts[i].age / TRAIL_LIFE, a = 1 - f;
      c.strokeStyle = rgba(f < 0.3 ? '#ffffff' : col, 0.15 + 0.8 * a); c.lineWidth = Math.max(0.5, r * 1.4 * a * a);
      c.beginPath(); c.moveTo(pts[i - 1].x, pts[i - 1].y); c.lineTo(pts[i].x, pts[i].y); c.stroke();
    }
  } else if (id === 'stars') {
    c.shadowColor = '#fff'; c.shadowBlur = 6;
    for (const p of st.parts) {
      const a = 1 - p.life / p.max, tw = 0.6 + 0.4 * Math.sin(p.life * 22 + p.ph);
      c.fillStyle = rgba(p.ph > 3.14 ? '#ffffff' : '#fff2a8', a); star4(c, p.x, p.y, r * p.sz * (0.5 + a) * tw);
    }
  } else if (id === 'pixels') {
    c.fillStyle = col;
    for (const p of pts) {
      const a = 1 - p.age / TRAIL_LIFE, s = Math.max(1, Math.round(r * 0.9 * a / 2) * 2);
      c.globalAlpha = 0.3 + 0.7 * a; c.fillRect(Math.round(p.x / 4) * 4 - s / 2, Math.round(p.y / 4) * 4 - s / 2, s, s);
    }
  } else if (id === 'echo') {
    c.lineWidth = 2;
    for (const p of st.parts) {
      const f = p.life / p.max; c.strokeStyle = rgba(f < 0.3 ? '#ffffff' : col, (1 - f) * 0.8); circ(c, p.x, p.y, r * (0.4 + 1.5 * f)); c.stroke();
    }
  }
  c.restore();
}

// ---- Persistence + unlock rules ----
function lsJSON(k, def) { try { const v = JSON.parse(lsGet(k)); return v == null ? def : v; } catch (e) { return def; } }
const prog = { runs: 0, best: 0, nearMissBest: 0, stageMax: 0, sweetBest: 0 };   // last three: best single-run skill stats, used by skill unlocks
(function () { const s = lsJSON(STORE_PROG, {}); prog.runs = +s.runs || 0; prog.best = Math.max(+s.best || 0, game.best); prog.nearMissBest = +s.nearMissBest || 0; prog.stageMax = +s.stageMax || 0; prog.sweetBest = +s.sweetBest || 0; })();
const unlocked = new Set((function () { const a = lsJSON(STORE_UNLOCKS, []); return Array.isArray(a) ? a : []; })());
const sel = { balls: 'orb', trails: 'classic', themes: 'neon' };
(function () { const s = lsJSON(STORE_SEL, {}); for (const k in sel) if (typeof s[k] === 'string') sel[k] = s[k]; })();
const ukey = (kind, it) => kind + ':' + it.id;
const isUnlocked = (kind, it) => !it.unlock || unlocked.has(ukey(kind, it));
function selItem(kind) { const l = LISTS[kind], it = l.find(i => i.id === sel[kind]); return it && isUnlocked(kind, it) ? it : l[0]; }
function unlockText(it) {
  const u = it.unlock;
  if (u.type === 'buy') return 'Buy  \u25c6 ' + u.v; if (u.type === 'streak') return u.v + '-day streak reward';
  return u.type === 'level' ? 'Reach level ' + u.v : u.type === 'time' ? 'Survive ' + u.v + 's' : u.type === 'near' ? u.v + ' near misses in one run'
    : u.type === 'stage' ? 'Reach Stage ' + u.v + (CONFIG.stageNames && CONFIG.stageNames[u.v - 1] ? ' (' + CONFIG.stageNames[u.v - 1] + ')' : '')
    : u.type === 'sweet' ? u.v + 's in the sweet spot, one run' : 'Play ' + u.v + ' runs';
}
function unlockMet(it) {
  const u = it.unlock; if (!u) return true;
  if (u.type === 'buy') return false;                       // bought with shards in the collection
  if (u.type === 'streak') return meta.streak >= u.v;
  return u.type === 'level' ? playerLvl() >= u.v : u.type === 'time' ? prog.best >= u.v : u.type === 'near' ? prog.nearMissBest >= u.v
    : u.type === 'stage' ? prog.stageMax + 1 >= u.v : u.type === 'sweet' ? prog.sweetBest >= u.v : prog.runs >= u.v;
}
function saveCosm() {
  lsSet(STORE_PROG, JSON.stringify(prog)); lsSet(STORE_UNLOCKS, JSON.stringify(Array.from(unlocked))); lsSet(STORE_SEL, JSON.stringify(sel));
}
function countUnlocked(kind) { return LISTS[kind].filter(it => isUnlocked(kind, it)).length; }
// Called at game over: updates stats, returns names of newly unlocked items
function recordRun(seconds) {
  prog.runs++; prog.best = Math.max(prog.best, seconds);
  const st = game.stats;
  if (st) { prog.nearMissBest = Math.max(prog.nearMissBest, st.nearMiss || 0); prog.stageMax = Math.max(prog.stageMax, st.stageMax || 0); prog.sweetBest = Math.max(prog.sweetBest, st.sweetTime || 0); }
  const fresh = []; // every unlock earned this run is announced on the game-over screen
  for (const kind in LISTS) for (const it of LISTS[kind]) {
    if (!isUnlocked(kind, it) && unlockMet(it)) { unlocked.add(ukey(kind, it)); fresh.push(it.name); }
  }
  saveCosm(); return fresh;
}
function unlockAll() { for (const kind in LISTS) for (const it of LISTS[kind]) if (it.unlock) unlocked.add(ukey(kind, it)); saveCosm(); if (collOpen) renderColl(); }
function resetUnlocks() {
  unlocked.clear(); prog.runs = 0; prog.best = 0; prog.nearMissBest = 0; prog.stageMax = 0; prog.sweetBest = 0; sel.balls = 'orb'; sel.trails = 'classic'; sel.themes = 'neon'; saveCosm(); if (collOpen) renderColl();
}
document.getElementById('unlockAll').addEventListener('click', unlockAll);
document.getElementById('resetUnlocks').addEventListener('click', resetUnlocks);

// ---- Collection screen ----
const collEl = document.getElementById('coll'), gridEl = document.getElementById('grid');
const tabBtns = Array.from(document.querySelectorAll('#tabs button'));
let collOpen = false, collTab = 'balls', tiles = [], previewLast = 0;
const LOCK_SVG = '<svg class="lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" fill="#cfe"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="#cfe" stroke-width="2.4"/></svg>';
function openColl() {
  if (collOpen) return;
  collOpen = true; drag = null; collEl.classList.add('open'); renderColl();
  previewLast = performance.now(); requestAnimationFrame(previewFrame);
}
function openCollTab(k) { collTab = k; gridEl.scrollTop = 0; if (collOpen) renderColl(); else openColl(); }
function closeColl() { collOpen = false; collEl.classList.remove('open'); tiles = []; }
function renderColl() {
  const top = gridEl.scrollTop;
  tabBtns.forEach(b => {
    const k = b.dataset.k, lab = LISTS[k] ? LABELS[k] + ' ' + countUnlocked(k) + '/' + LISTS[k].length : k === 'upgrades' ? 'Upgrades' : 'Daily';
    b.innerHTML = '<span class="ti">' + (TAB_ICON[k] || '') + '</span><span class="tl"></span>'; b.lastChild.textContent = lab;
    b.classList.toggle('on', k === collTab);
  });
  document.getElementById('collTitle').textContent = collTab === 'upgrades' ? 'UPGRADES' : collTab === 'daily' ? 'DAILY' : 'COLLECTION';
  gridEl.innerHTML = ''; tiles = [];
  if (!LISTS[collTab]) { renderMeta(gridEl, collTab); gridEl.scrollTop = top; return; }
  metaHead(gridEl);
  const kind = collTab, chosen = selItem(kind);
  for (const it of LISTS[kind]) {
    const un = isUnlocked(kind, it), on = un && chosen === it;
    const b = document.createElement('button');
    b.className = 'tile' + (on ? ' sel' : '') + (un ? '' : ' locked');
    b.innerHTML = '<div class="pv"><canvas></canvas>' + (un ? '' : LOCK_SVG) + '</div><div class="nm"></div><div class="st"></div>';
    b.querySelector('.nm').textContent = it.name;
    b.querySelector('.st').textContent = on ? 'Selected' : un ? 'Tap to select' : unlockText(it);
    if (!un) b.querySelector('.st').classList.add('need');
    const buyable = !un && it.unlock.type === 'buy';
    if (buyable && meta.shards >= it.unlock.v) b.classList.add('can');
    b.addEventListener('click', () => {
      if (un) { sel[kind] = it.id; saveCosm(); renderColl(); }
      else if (buyable && meta.shards >= it.unlock.v) { meta.shards -= it.unlock.v; metaSave(); unlocked.add(ukey(kind, it)); sel[kind] = it.id; saveCosm(); Audio_.sfx('buy'); renderColl(); }
    });
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
  if (tl.kind === 'themes') { // swatches: the eight stage accents under this theme
    const sw = (w - 16) / 8; for (let i = 0; i < 8; i++) { const cc = CONFIG.palettes[i][2]; c.fillStyle = tl.it.fx ? themeColor(cc, tl.it.fx) : cc; c.fillRect(8 + i * sw + 1, h / 2 - 16, sw - 2, 32); }
    return;
  }
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
document.getElementById('collBack').addEventListener('click', closeColl);
tabBtns.forEach(b => b.addEventListener('click', () => { collTab = b.dataset.k; gridEl.scrollTop = 0; renderColl(); }));

// ============================================================
