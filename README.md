# Neon Bullseye (repo: scroll-game)
A one-move neon arcade balancing game for desktop, tablet and mobile browsers. Built for a CrazyGames Basic Launch.

## Docs
- [Game brief](docs/brief.md) and design pillars
- [Launch status and handoff](docs/handoff/launch-status.md): start here
- [Play review, proposal and build checklist](docs/play-review.md)
- [QA record](docs/qa-record.md)
- [CrazyGames listing copy](docs/crazygames-listing.md) and [store assets](store/README.md)

## Build
- `node scripts/build.mjs` builds `dist/web` (playtest: dev UI, telemetry) and `dist/crazygames` (SDK, no dev UI, no telemetry). Source is `src/`, concatenated with no dependencies into a single `index.html`.
- `node scripts/package.mjs` builds and zips the CrazyGames upload into `store/`.
- `python3 scripts/font.py` rebuilds the game's own display font (`src/font.woff`); needs `pip install fonttools`. The built font is committed.
- Telemetry kill switch for the playtest build: add `?notel=1` to the URL.

## Tests
- `node tests/determinism.mjs`: same seed and scripted input give identical simulation at 60/120/144/165 Hz, with effects on or off, on portrait, wide and tall fields. Must stay green.
- `node tests/bot.mjs [n]`: bot pacing at four skill levels. `FIELD=1152x648` simulates the wide desktop field.
- Browser tests need Playwright (not a repo dependency): set `PW_DIR` to a folder containing `node_modules/playwright`.
  - `node tests/qa.mjs`: CrazyGames build checks (SDK events, pause paths, restricted keys, settings, banking, network).
  - `node tests/shots.mjs [web|crazygames] [outDir]`: plays with real input at every CrazyGames size and saves screenshots.
  - `node tests/perf.mjs [throttle] [w] [h]`: frame times under CPU throttling.
  - `node tests/audio-levels.mjs`: output levels for music and each sound effect.

## Playtest site
`node scripts/publish-play.mjs [--commit] [--push]` rebuilds, runs the determinism test and refreshes `play/` (GitHub Pages: `/play/` and `/play/cg/`).
