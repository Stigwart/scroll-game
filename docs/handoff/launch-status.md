# Neon Bullseye: launch status

*Updated 15 Nov 2026, build 1.0.0. Status: **submitted to CrazyGames for Basic Launch on 15 Nov 2026 and awaiting review.** Game ID 174300.*

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

## 6. Submission record

| Item | Value |
|---|---|
| Submitted | 15 Nov 2026, by Stuart, from developer.crazygames.com (Basic) |
| Game ID | 174300 |
| Status at submission | Awaiting review |
| Build | `dist/crazygames/index.html` 1.0.0 (commit `1edd496` source; 0.2 MB), uploaded as a single file |
| Progress save | LocalStorage. The portal notes that its Automatic Progress Save does not cover iframe games; cloud save needs the SDK Data module (Full Launch item). |
| Mobile | Supported, orientation Both |
| Not ticked | Online multiplayer; "supports CrazyGames muting audio through SDK" (not implemented) |
| Category / tags | Arcade / Ball, Skill, Avoid, Obstacle, Survival (tags come from a fixed list) |
| Tools declared | Claude |
| Covers | The three files in `store/` |
| Videos | 9 MB re-encodes of the two files in `store/` (same content, 1080p 60 fps 17 s). The full-quality originals can be swapped in from the game's Art tab. |
| QA preview | Ran in CrazyGames' QA tool: `sdkInit`, loading start/stop and `gameplayStart` logged; no warnings; total size 0.2 MB. |
| Declarations | The "Before you submit" list, the QA Results checklist, the Terms and the PEGI 12 box were all answered by Stuart. |

## 7. Open items

0. **Version 1.0.2 is built but not uploaded.** After the first playtest the target was redrawn as a repulsor and run 1 now teaches the push (see the last section of `docs/play-review.md`). The build under review at CrazyGames is still 1.0.0. To update: on the game's page choose "Submit new version", upload `dist/crazygames/index.html`, then replace the covers and videos on the Art tab and the description on Game Info with the regenerated files and the reworded listing.

1. **Load time in the QA tool read 15 seconds.** CrazyGames measures from its Play Now button to the first `gameplayStart`, so time spent on our title screen counts. The game loads in under a second; a player who hesitates before clicking shows as a slow load. Option if the dashboard shows a problem: drop first-time players straight into run 1 (the ball already waits until they move). Trade-off: a mouse player who never clicks gets no sound, because browsers only allow audio after a click or key press.
2. **An idle first run lasts a long time** (over a minute on the wide field in the QA preview) because of the new-player edge relief and shield. Good for conversion; revisit if first runs feel too safe.
3. **SDK mute support** (`muteAudio` setting) is not implemented. Small job; lets CrazyGames mute the game from its own UI.
4. **Device checks** still worth doing on a Chromebook, Safari and Edge: list in `docs/qa-record.md`.
5. **Name check** in the CrazyGames catalogue and trademark registers was never done beyond a web search.
6. `store/` adds about 43 MB of video to the repository.

## 8. What happens next

- **QA feedback:** usually 1–2 days. Fixes can be uploaded straight away.
- **Basic Launch:** at least 7 days and 500 plays; ends automatically at 21 days. No ads, no revenue. Updates go live at once and show in the next daily refresh.
- **Where to look:** developer.crazygames.com dashboard, refreshed daily; day-1 retention appears a day late.
- **What is scored:** average playtime (target 10+ min), day-1 retention (10–15%), conversion (80%+ play at least a minute) and, for launches starting on or after 23 Nov 2026, thumbnail click-through rate (top 20% of the category).
- **If a metric is weak:** conversion → look at first-run length and time to first input; playtime → runs per sitting and retry rate; D1 → mission and streak pacing; CTR → covers and the first two seconds of the video. The CrazyGames build has no telemetry of its own, so the dashboard is the only source.
- **Full Launch (only if invited):** save through the SDK Data module instead of `localStorage`; decide on ads (`PLATFORM.adBreak` is a stub; rules in `crazygames-launch.md` §3.2); optional username and locale.
