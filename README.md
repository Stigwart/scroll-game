# scroll-game
A one-thumb neon arcade balancing game for mobile (working title).

## Docs
- [Game brief](docs/brief.md)

## Build
- `node scripts/build.mjs` builds `dist/web` (playtest, dev UI) and `dist/crazygames` (dev UI hidden). Source is `src/` (plain concatenation, no dependencies).
- `node tests/determinism.mjs` checks the sim gives the same result at 60/120/144/165 Hz.
- Telemetry kill switch: add `?notel=1` to the URL, or set `telemetry:false` in `scripts/build.mjs`.
- `prototype/index.html` is the frozen v0.4 single file still served by GitHub Pages until we switch deploys to `dist/web`.

## Tests
- `node tests/determinism.mjs` - refresh-rate determinism (60/120/144/165 Hz).
- `node tests/bot.mjs [n]` - bot pacing/economy simulation at four skill levels.
- `supabase/metrics.sql` - launch-gate queries (run in Supabase).
- CI: `.github/workflows/pages.yml` publishes `dist/web` at the site root, the CrazyGames build at `/cg/`, and the frozen prototype at `/prototype/`.
