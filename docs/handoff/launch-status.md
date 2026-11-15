# Neon Bullseye: launch status

*Updated 15 Nov 2026, build 1.0.0. Status: **ready to submit, waiting for Stuart's review of the store assets and a go-ahead.** Nothing has been pushed or submitted.*

---

## 1. What the game is

A one-move neon arcade game. The player moves a target ring (mouse, arrow keys/WASD, or touch drag) to keep a drifting ball centred while shapes push it about. Score is time survived. Between runs, shards buy upgrades, power-ups and cosmetics; missions, daily quests and a seven-day streak give reasons to return.

- Design pillars: [docs/brief.md](../brief.md) §3 (binding).
- What was reviewed, proposed and built: [docs/play-review.md](../play-review.md).
- QA evidence and what still needs a human: [docs/qa-record.md](../qa-record.md).
- Listing copy: [docs/crazygames-listing.md](../crazygames-listing.md). Store assets: [store/](../../store/README.md).
- CrazyGames process and targets: [crazygames-launch.md](../../crazygames-launch.md) (its §4 table describes the old prototype).

## 2. Build and test

| Item | Detail |
|---|---|
| Source | `src/` → plain concatenation, no dependencies, one `index.html` per build (about 165 KB). |
| Builds | `node scripts/build.mjs` → `dist/web` (playtest: dev tuning UI, Supabase telemetry, privacy notice) and `dist/crazygames` (SDK v3, no dev UI, no telemetry, no links). |
| Upload | `node scripts/package.mjs` → `store/neon-bullseye-crazygames.zip`, with checks on paths and external URLs. |
| Tests | `tests/determinism.mjs` (must stay green), `tests/bot.mjs`, and browser tests `tests/qa.mjs`, `tests/shots.mjs`, `tests/perf.mjs`, `tests/audio-levels.mjs` (need Playwright via `PW_DIR`). |
| Store assets | `scripts/store-assets.mjs` renders covers and videos from the game; needs Playwright and ffmpeg. |
| Font | `scripts/font.py` builds the game's own typeface into `src/font.woff` (needs `fonttools`; output is committed). |
| Local preview | `.claude/launch.json` → `bullseye-web` on port 8765. Add `?notel=1` to stop telemetry in the playtest build. |

## 3. Decisions taken (15 Nov 2026)

| Decision | Answer |
|---|---|
| Name | **Neon Bullseye** (Stuart). Web search found no game with that exact title; not checked against the CrazyGames catalogue or trademark registers. |
| Telemetry in the CrazyGames build | Off (recommended; not objected to). Still on in `dist/web`. |
| Launch path | Basic Launch, no ads (recommended; not objected to). |
| Music | Procedural, with a measured mix pass (recommended; not objected to). |
| Click/tap/key to start; first-runs shield | Yes (Stuart). |
| Nice-to-haves N1–N4 | Included before submission (Stuart). |
| Full-frame play area on desktop and tablet | Investigated, playable, included (Stuart asked for this). |

## 4. What changed in this pass

- **Full-frame play field.** The field is 648 units high and 450–1152 wide, so it fills any frame from 9:16 to 16:9 (portrait phones get up to 800 high). Obstacle count scales with field area. No footer band, no side panels.
- **First minute.** No modal on a first session; one click, tap or key starts; the ball rides the ring until GO (run 1 waits for the player to move); input-matched animated tutorial; a one-off "second chance" shield on a player's first three runs; softer edge damage on runs 1–2.
- **Identity.** Own display typeface (NB Display), wordmark, inline SVG icons with labels, fixed colour roles.
- **Screens.** Title with missions; HUD; stage banners on a plate in the top third; game over with stage strip, every unlock, next-upgrade progress and an inline upgrade button; pause with a 3-2-1 resume.
- **Content.** 16 balls, 10 trails, 4 colour themes (some bought with shards, one from the day-7 streak); three mission ladders; pulsing circles from stage 3 and gated wall pairs from stage 5; a music layer per stage.
- **Platform.** `gameplayStop`/`Start` around every pause; Escape unbound; M mutes, P pauses; safe-area insets; adaptive render quality.
- **Audio.** Levels measured and balanced, output limiter, music ducking.

## 5. Measurements

See [docs/qa-record.md](../qa-record.md). Headlines: 38 of 38 automated QA checks pass; determinism holds at 60/120/144/165 Hz; 60 fps at 1920×1080 with software rendering; novice bots pass 60 s on their first run 100% of the time in portrait and 60% on the wide desktop field (17% before).

## 6. Open items

1. **Stuart to review** the three covers and two videos in `store/`, then say whether to submit.
2. **Device checks** nobody has done yet: list in `docs/qa-record.md` ("Not tested here"). The iPhone and Chromebook checks matter most.
3. **Listen to the audio.** Levels are measured, not heard.
4. **Name check** in the CrazyGames catalogue.
5. `store/` adds about 43 MB of video to the repository. If that is unwelcome, remove the two `.mp4` files from git and regenerate them when needed.
6. Not pushed. `play/` (GitHub Pages copy) has not been refreshed; run `node scripts/publish-play.mjs --commit` when you want testers on the new build.

## 7. Submission steps (developer.crazygames.com, Stuart's account)

Stuart signs in. The agent does not enter passwords, accept terms or create accounts, and presses Submit only after an explicit yes.

1. New game → upload `store/neon-bullseye-crazygames.zip` (HTML5; `index.html` at the root).
2. Fill the form from `docs/crazygames-listing.md`: title, description, controls, category, tags, orientation, devices.
3. Upload `cover-1920x1080.png`, `cover-800x1200.png`, `cover-800x800.png`, `preview-1920x1080.mp4`, `preview-1080x1620.mp4`.
4. Use the portal's preview to play one run and confirm the SDK events register.
5. Stuart reviews the completed form, then submit.

## 8. After submission

- **QA feedback:** usually 1–2 days. Fixes can be uploaded straight away.
- **Basic Launch:** at least 7 days and 500 plays; ends automatically at 21 days. No ads, no revenue. Updates go live at once and show in the next daily refresh.
- **Where to look:** developer.crazygames.com dashboard, refreshed daily; day-1 retention appears a day late.
- **What is scored:** average playtime (target 10+ min), day-1 retention (10–15%), conversion (80%+ play at least a minute) and, for launches starting on or after 23 Nov 2026, thumbnail click-through rate (top 20% of the category).
- **If a metric is weak:** conversion → look at first-run length and time to first input; playtime → runs per sitting and retry rate; D1 → mission and streak pacing; CTR → covers and the first two seconds of the video. The CrazyGames build has no telemetry of its own, so the dashboard is the only source.
- **Full Launch (only if invited):** save through the SDK Data module instead of `localStorage`; decide on ads (`PLATFORM.adBreak` is a stub; rules in `crazygames-launch.md` §3.2); optional username and locale.
