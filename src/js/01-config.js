const TELEMETRY = { url: 'https://ahbfawcyytdrmmxepxjy.supabase.co/rest/v1/runs', key: 'sb_publishable_pWDVpRghWtIJLmDtPlQqag_lGzBQU3x', enabled: BUILD.telemetry && !/[?&]notel=1/.test(location.search) };
const GAME_VERSION = '0.5.0-dev' + (BUILD.target === 'web' ? '' : '+' + BUILD.target);
// ============================================================
// CONFIG: fixed constants + tunable params (exposed in panel)
// ============================================================
const CONFIG = {
  ballRadius: 13,
  ringRadius: 64,          // visual target ring radius
  startHealth: 100,
  step: 1 / 120,           // fixed physics timestep (s)
  maxFrame: 0.1,           // dt clamp (s)
  footerFrac: 0.19,        // footer HUD band height as fraction of viewport
  edgeLossBase: 1.0,       // edge loss = tuned lossRate*edgeMult*edgeLossBase per s
  stageSeconds: 30,        // seconds (at ramp 1) per background stage
  // Fixed force scalings (the sliders multiply these)
  repulsionUnit: 1.0,      // accel per px beyond sweet spot, per slider unit
  driftUnit: 20,           // px/s^2 per slider unit
  // Palette stages: [bgA, bgB, accent1, accent2, obstacleColour]
  palettes: [
    ['#06061a', '#14083a', '#00e5ff', '#9b5cff', '#2bd9ff'],
    ['#12041f', '#2a0640', '#ff2bd6', '#7a5cff', '#ff4de0'],
    ['#1c0407', '#3a0a0a', '#ff3b30', '#ff9a1f', '#ff6a2b'],
    ['#2a0000', '#000000', '#ff1a1a', '#ffee00', '#ffffff']
  ],
  // Tunables: key -> [default, min, max, step, label]
  tune: {
    sweet:   [24,  8,  60, 1,    'Sweet spot radius'],
    repel:   [4.5, 0,  14, 0.1,  'Repulsion strength'],
    pull:    [0.35, 0, 2,  0.05, 'Centre pull'],
    up:      [22,  0, 120, 1,    'Upward bias'],
    drift:   [3.0, 0, 10,  0.1,  'Random drift strength'],
    damp:    [1.3, 0.2, 4, 0.05, 'Damping'],
    loss:    [4.5, 0, 20,  0.1,  'Health loss rate'],
    edge:    [4,   1, 15,  0.5,  'Edge damage multiplier'],
    spawn:   [1.0, 0.2, 4, 0.05, 'Obstacle spawn rate'],
    ramp:    [1.0, 0, 3,   0.05, 'Difficulty ramp speed'],
    maxSpeed:[450, 100, 2000, 10, 'Max ball speed (px/s)'],
    bounce:  [0.8, 0.3, 1.2, 0.05, 'Edge bounciness'],
    kick:    [70,  0, 300, 5,    'Edge kick (min inward px/s)']
  }
};
const STORE_BEST = 'scrollgame.best', STORE_TUNE = 'scrollgame.tune';

// Tunable values (live)
const T = {};
for (const k in CONFIG.tune) T[k] = CONFIG.tune[k][0];
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
(function loadTune() {
  try {
    const s = JSON.parse(lsGet(STORE_TUNE) || '{}');
    for (const k in T) if (typeof s[k] === 'number' && isFinite(s[k])) T[k] = s[k];
  } catch (e) {}
})();

// ============================================================
