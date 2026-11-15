# Bullseye: launch status at handoff

*Snapshot: 15 Nov 2026, commit `102334f` on `main`. Written for the agent taking the game to CrazyGames submission. Facts below were checked against the code and a live run on that date; re-verify anything you rely on.*

---

## 1. What the game is

A one-gesture neon arcade game. The player drags (touch), moves the mouse (desktop) or uses arrows/WASD to move a target ring, and keeps a drifting ball balanced in its centre while obstacles push it about. Score is time survived. Between runs, shards and XP buy upgrades, power-ups and cosmetic balls and trails.

- Design intent and pillars: [docs/brief.md](../brief.md) (§3 pillars are binding).
- CrazyGames requirements, targets and launch process: [crazygames-launch.md](../../crazygames-launch.md). Its §4 gap table describes prototype v0.4 and is **out of date**; use this file for current status.
- UX review and design direction: [docs/ux-design-review.md](../ux-design-review.md). Most of it is now implemented (see §3).
- Listing draft and docs findings: [docs/crazygames-listing.md](../crazygames-listing.md).

## 2. How the code is built and tested

| Item | Detail |
|---|---|
| Source | `src/` → plain concatenation, no dependencies. `src/js/NN-*.js` files are joined in sort order into one inline `<script>`. |
| Build | `node scripts/build.mjs` → `dist/web/` (playtest, dev UI on) and `dist/crazygames/` (dev UI removed, SDK v3 script tag). Each is a single `index.html` (~130 KB) + `privacy.html`. |
| Determinism test | `node tests/determinism.mjs`: same seed gives identical runs at 60/120/144/165 Hz. **Must stay green.** |
| Bot pacing test | `node tests/bot.mjs [n]`: four skill levels play simulated 10-minute sittings; reports first-run length, run length percentiles, runs per 10 min, level reached. |
| Local preview | `.claude/launch.json` defines `bullseye-web` (python http.server on :8765 serving `dist/web`). Add `?notel=1` to disable telemetry while testing. |
| Test hooks | `window.__TEST_HOOKS` exposes `game`, `meta`, `update`, `render`, `area()`, etc. for Playwright-style checks. |
| Playtest site | `node scripts/publish-play.mjs [--commit] [--push]` copies builds into `play/` (GitHub Pages: `/play/` and `/play/cg/`). |
| Telemetry | Supabase, per-run records (`src/js/07-telemetry.js`, `supabase/schema.sql`, `supabase/metrics.sql`). Kill switch `?notel=1` or `telemetry:false` in `scripts/build.mjs`. |
| Tooling on this Mac | Node 25, ffmpeg (`/opt/homebrew/bin/ffmpeg`), Playwright Chromium in `~/Library/Caches/ms-playwright` (use via `npx playwright`), python3. |

## 3. Implemented so far

- **Core:** fixed 450×800 stage, letterboxed; fixed 120 Hz sim step with seeded RNG; obstacles cost health (scales with level); edge contact drains health; distance drain off by default.
- **Input:** touch drag, desktop mouse-follow (no click needed; moving the mouse on the title starts a run), arrows/WASD by physical key, Space/Enter start/retry, 1–3 power-ups, M mute, pause on blur/visibility.
- **Onboarding:** run 1 has 8 s with no obstacles plus "keep the ball near the circle" and "dodge" hints; first runs ramp slower and take less damage (`assist()`).
- **Juice (`08-fx.js`):** hit-stop, shake, spark bursts, ring cracks, edge flashes, near-miss "CLOSE!" pop with slow-mo, stage wipe and banner, milestone banners, new-best confetti, death shatter, vibration, reduce-motion setting.
- **In-run pacing:** 8 named stages (CALM → BULLSEYE), 30 s each, 3.5 s breather after each stage change, milestone shard bonuses at 30/60/120/180 s, near-miss bonus shards.
- **Screens (`11-screens.js`):** title is the live scene with logo, "Drag to play", best, level badge; game-over shows time, best delta, stage reached, shards counting up, one highlight (unlock, level-up or quest) and a RETRY button (retry allowed 300 ms after death); icon rail (mute, collection, daily, settings, pause) with notification dots; settings sheet; daily streak card; desktop side panels with stats and controls.
- **Meta (`09-meta.js`, `05-cosmetics.js`):** shards, XP levels (`xpNeed = 60 + 30n`), 4 upgrades × 5 levels with SVG effect previews, 3 power-ups (120/200/300 shards), 7-day streak (`DAILY = [30…150]`), daily quests, interrupted-run banking. 8 balls and 6 trails with time/runs/near-miss/level/stage/sweet-spot unlocks.
- **Audio (`10-audio.js`):** procedural WebAudio SFX and music loop, stage "lift", iOS unlock on gesture.
- **Platform (`00-platform.js`):** CrazyGames SDK v3 `init`, `loadingStart/Stop`, `gameplayStart` on run start, `gameplayStop` on game over. `adBreak` is a stub. Progress is in `localStorage`.
- **Compliance done:** `user-select:none`, no custom fullscreen button, relative paths, single file, non-blocking privacy notice + `privacy.html`, dev UI stripped from the CrazyGames build.

## 4. Latest measurements (15 Nov 2026)

**Determinism:** pass at 60/120/144/165 Hz (3 seeds).

**Bot simulation** (`node tests/bot.mjs`, default sittings):

| Skill | First run ≥ 60 s | First-run median | Run length p10/p50/p90 | Runs per 10 min | Level at 10 min |
|---|---|---|---|---|---|
| novice | **17%** | 42 s | 21 / 35 / 47 s | 15.7 | 5 |
| casual | 83% | 83 s | 40 / 61 / 82 s | 9.0 | 5 |
| average | 100% | 107 s | 50 / 74 / 97 s | 7.7 | 5 |
| good | 100% | 87 s | 47 / 71 / 98 s | 8.2 | 5 |

The bot is a proxy, not a forecast. Treat "novice" as the low end of real first-time players.

**Live check at 821×462** (CrazyGames' smallest desktop iframe): no console errors; game starts and plays; the stage renders about 255 px wide with neon side panels either side.

## 5. Known gaps and findings (not yet fixed)

### 5.1 Blocking for Basic Launch submission
1. **Store assets not started.** 3 covers (1920×1080, 800×1200, 800×800) and 2 preview videos (15–20 s, silent, 1080p 16:9 and 2:3). Rules in `crazygames-launch.md` §3.3.
2. **Name not cleared.** "Bullseye" is a common game name (darts games especially). CrazyGames requires an original, non-confusable name. Search the CrazyGames catalogue and app stores before producing covers. Stuart decides the final name.
3. **Small-window readability.** At 821×462 secondary text (title hint "Mouse / arrows / WASD", tutorial sub-line, privacy toast) is roughly 8–9 px on screen. The empty footer band (`CONFIG.footerFrac = 0.19`, 152 of 800 px) still takes stage height during play and shows nothing. Requirement: readable at DPR 1 at all sizes in `crazygames-launch.md` §3.1.
4. **Tutorial copy is touch-only.** It says "drag anywhere to steer" even on desktop, where the ring follows the mouse. Copy should match the active input.
5. **Escape is used** to close the settings and streak sheets (`src/js/11-screens.js:136`). CrazyGames lists Escape as a restricted key (it exits fullscreen). Remove it.
6. **SDK gameplay events around pauses.** `autoPause()` (`src/js/07-telemetry.js:124`) and opening the collection or settings mid-run do not call `PLATFORM.gameplayStop()` / `gameplayStart()` on resume.
7. **Telemetry decision outstanding** (`crazygames-launch.md` §6.4): the CrazyGames build still sends Supabase stats behind the privacy notice. Keep it (and check `privacy.html` covers it) or turn it off for that build.
8. **Device testing not done:** Safari/iOS (audio unlock, safe areas, CrazyGames app fullscreen), touch on Android, a low-end Chromebook (60 fps with particles), 144 Hz monitor, CrazyGames' developer preview/QA tool.

### 5.2 Engagement risks
- **Conversion (target 80%+ play ≥ 1 min):** novice bots survive 60 s on run 1 only 17% of the time. A death under 60 s on the first run is a lost conversion.
- **D1 retention (target 10–15%):** the content ladder is short. 8 balls + 6 trails, highest unlock at level 8, bots reach level 5 in 10 minutes. Most of the collection is gone within two sittings, so there is little to come back for on day 2.
- **Playtime (target 10+ min):** bots reach 8–9 runs per 10 minutes at a 60–75 s median, which is on target only if retry stays instant and every run feels like progress.
- **Game-over screen is minimal** ("Option A"): it does not show progress to the next upgrade or unlock, which the UX review recommended as the main "one more run" hook.

### 5.3 Full Launch only (after Basic Launch metrics pass)
- Progress save through the CrazyGames SDK **Data module** (currently `localStorage`).
- Ads decision (`crazygames-launch.md` §6.1): midgame ad after game over via `PLATFORM.adBreak`, pause and mute during it, continue if no fill; rewarded ad optional.
- Optional: CrazyGames username/avatar; SDK locale (game is English-only).

## 6. Decisions only Stuart can make

| Decision | Options / context | Default if no answer |
|---|---|---|
| Final game name | Must be original and searchable; covers depend on it | Do not produce final covers until decided |
| Telemetry in CrazyGames build | Keep with notice, or off and rely on CrazyGames dashboard | Keep (current behaviour) |
| Launch path | Basic Launch as playtest only, or aim for Full Launch with ads | Basic Launch first; Full Launch work after metrics |
| Music | Keep procedural, or licensed royalty-free tracks (check licences/attribution) | Keep procedural |
| Anything that changes a design pillar | Brief §3 | Don't |

## 7. Submission mechanics

- Submission is through the CrazyGames **developer portal**, under Stuart's account. Stuart does the sign-in; the agent must not enter passwords or accept terms for Stuart.
- Upload: a zip of `dist/crazygames/` with `index.html` at the root (relative paths only, ≤ 1,500 files).
- The form needs: title, description, controls, category and tags, orientation, devices, covers, videos. Draft copy is in `docs/crazygames-listing.md`.
- After submission: QA feedback usually in 1–2 days, then Basic Launch (7–21 days, ≥ 500 plays). Updates during Basic Launch go live instantly.
