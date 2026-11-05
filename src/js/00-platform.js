// Platform adapter. 'web' = no-ops + localStorage. CrazyGames SDK is wired in here at Full Launch (Phase G) only.
const PLATFORM = {
  name: BUILD.target,
  locale: (navigator.language || 'en').slice(0, 2),
  gameplayStart() {}, gameplayStop() {},          // SDK: gameplayStart/gameplayStop
  adBreak(done) { done(); },                      // SDK: midgame ad after game over; always continues if no fill
};
