// Platform adapter. 'web' = no-ops + localStorage. 'crazygames' = SDK v3 (Basic Launch: init + gameplayStart/Stop only; no ads).
const _cg = () => { try { return BUILD.target === 'crazygames' && window.CrazyGames && window.CrazyGames.SDK; } catch (e) { return null; } };
const PLATFORM = {
  name: BUILD.target,
  locale: (navigator.language || 'en').slice(0, 2),
  ready: false,
  init() { const s = _cg(); if (!s) return; try { Promise.resolve(s.init()).then(() => { PLATFORM.ready = true; try { s.game.loadingStart(); s.game.loadingStop(); if (PLATFORM.playing) s.game.gameplayStart(); } catch (e) {} }).catch(() => {}); } catch (e) {} },
  playing: false,
  gameplayStart() { PLATFORM.playing = true; const s = _cg(); if (s && PLATFORM.ready) try { s.game.gameplayStart(); } catch (e) {} },
  gameplayStop() { PLATFORM.playing = false; const s = _cg(); if (s && PLATFORM.ready) try { s.game.gameplayStop(); } catch (e) {} },
  adBreak(done) { done(); },                      // Full Launch only: midgame ad after game over; always continues if no fill
};
PLATFORM.init();
