# CrazyGames Launch: Requirements and Targets

*Status: Draft v0.1 · 4 November 2026 · Owner: Stuart*
*Source: CrazyGames developer docs (read 4 Nov 2026), checked against prototype v0.4.0. Nothing here is decided. Open decisions are in §6.*

---

## 1. How launching on CrazyGames works

| Stage | What happens | What is required |
|---|---|---|
| **Submit + initial QA** | The QA team plays the game for smoothness, quality and fun. Feedback usually takes 1–2 days. | Basic Implementation (§3.1) plus store listing assets (§3.3). |
| **Basic Launch** (soft launch) | Shown to a small segment of real players. No ads, no revenue. SDK optional. Updates go live instantly. | Same as above. |
| **Evaluation** | Lasts **at least 7 days and until the game reaches 500 plays**. If it never reaches 500 plays, it ends automatically **after 21 days**. Metrics are compared with other games on the platform. | — |
| **Outcome** | **All metrics at or above benchmark:** invited to Full Launch. **Some metrics:** may be invited to improve and run another Basic Launch. **Most metrics below:** cannot go to Full Launch; you would have to resubmit as a new game with significant improvements. | — |
| **Full Launch** | Global release. Second, full QA review. Monetisation switched on and revenue share starts. The Basic version stays live to its small audience while you integrate. | Full Implementation (§3.2), including the CrazyGames SDK. |

Not required: exclusivity. Publishing on the App Store, Google Play or elsewhere later does not affect eligibility. Payouts are monthly once the balance reaches €100.

## 2. Engagement targets for Basic Launch → Full Launch

CrazyGames judges three metrics. **It does not publish pass marks.** It benchmarks against other games, and gives the figures below as what strong or successful games achieve. Treat them as the targets.

| Metric | How CrazyGames measures it | Target | Main levers (CrazyGames' own guidance) |
|---|---|---|---|
| **Average playtime** | Average time a player spends in the game in a single session | **10+ minutes** | Rewarding core loop; clear goals; introduce new mechanics gradually; difficulty challenging but fair |
| **Day 1 retention (D1)** | % of players who come back the day after their first session | **10–15%** | Progression (levels, unlocks, upgrades); daily incentives (login bonus, daily quests); saved progress; fix bugs and rough edges |
| **Conversion** | % of players who play for at least 1 minute after starting the game | **80%+** | Load in under 10 seconds; build under 20 MB; reach gameplay within seconds (short or no intro) |

The FAQ also mentions click-through rate (CTR) on the game's thumbnail, which depends on the covers in §3.3.

### 2.1 What this means for Scroll Game

- **Playtime is the hardest target.** The brief designs for sessions of 1–5 minutes. To reach 10+ minutes, a player would need roughly 7–10 one-minute runs per sitting. Your existing *repeatability* metrics (retry within 10s, runs per sitting) are the right early signals.
- **Conversion should be strong.** The game is about 58 KB and lands in play after one tap. The risk is players dying in under a minute on their first run, which counts as not converting. Watch first-run length.
- **D1 depends on Phase 2 features.** Today's only between-run hooks are the best score and placeholder ball unlocks. CrazyGames' D1 levers (progression, daily incentives, saved progress) map to currency, power-ups, XP and the collection in brief §6.

### 2.2 Suggested pre-launch tracking in Supabase

Your current metrics already cover most of this. Two additions would let you compare directly with CrazyGames' dashboard:

| CrazyGames metric | Your current metric | Add |
|---|---|---|
| Average playtime | Minutes per sitting | — (use the same definition: one sitting = one session) |
| Conversion | Median run length | **% of first sittings lasting ≥ 1 minute** |
| D1 retention | DAU | **% of new players who return the next calendar day** |

Caveat: friends-and-family numbers will be optimistic and the sample is small. Use them for direction, not as a forecast.

## 3. Requirements checklist

### 3.1 Basic Implementation (needed to submit)

**Technical**
- [ ] Initial download ≤ 50 MB (≤ **20 MB** to be eligible for the mobile homepage); total ≤ 250 MB; ≤ 1,500 files
- [ ] Relative file paths only; game starts from `index.html` at the root of the upload
- [ ] Works on Chrome and Edge. Games that run badly on Safari are disabled there; games that don't run smoothly on a 4 GB RAM Chromebook are disabled on ChromeOS
- [ ] Mouse and keyboard support, plus touch if mobile is supported
- [ ] Playable in a landscape window on desktop. Portrait games are allowed, with black bars or a background at the sides
- [ ] `user-select: none` on the body (stops magnifier and long-press menus on mobile)
- [ ] Works fullscreen in the CrazyGames app and respects device safe areas
- [ ] If there is audio: resume a suspended AudioContext inside a tap/click (iOS)
- [ ] If personal data is collected beyond the SDK: a simple, non-blocking privacy/terms notice for new players
- [ ] If the SDK is used, ads must be off and the game must still run smoothly

**Gameplay**
- [ ] Text and images readable at device pixel ratio 1 and at these sizes: desktop 907×510, 1216×684, 1077×606, **821×462**; fullscreen 1366×768, 1920×1080, 1536×864, 1280×720; mobile 800×450; tablet 1080×607
- [ ] Physics behaves the same at high refresh rates (e.g. 144 Hz, 165 Hz)
- [ ] English supported; any translations accurate; use the SDK locale with English fallback
- [ ] Loads quickly, no errors or crashes
- [ ] Original name, assets and content (not easily confused with another game)
- [ ] **No custom fullscreen button** (CrazyGames provides it)
- [ ] No cross-promotion (community links on the menu are allowed; app store links never)
- [ ] PEGI 12 compliant; audience 13+; **not aimed at children**

### 3.2 Full Implementation (needed for Full Launch)

Everything in §3.1, plus:
- [ ] CrazyGames SDK integrated
- [ ] `gameplayStart` / `gameplayStop` events (start fires when the player reaches a playable state)
- [ ] Progress saved through the SDK **Data module** (stored to the CrazyGames account; guest progress syncs on login). Automatic Progress Save is an alternative only if there are no in-game purchases
- [ ] Players land directly in gameplay, or at most **one click** before play
- [ ] Optional but recommended: CrazyGames username and avatar; load start/stop events
- [ ] If ads are used: midgame ads only at natural breaks (e.g. after game over), never on menu buttons; SDK caps them at one every 3 minutes; pause and mute while an ad plays; continue normally if no ad fills; rewarded ads optional, never on the active gameplay screen, never offered on every death; banners never during gameplay; adblock users must still be able to play

### 3.3 Store listing assets

- [ ] Description and controls text
- [ ] Three covers: landscape 1920×1080, portrait 800×1200, square 800×800. Title only (no "New", "Play now"), no borders, no icons or store logos, not a plain gameplay screenshot, stylised font
- [ ] Preview videos, 15–20 seconds, ≤ 50 MB, silent, both 1080p landscape (16:9) and 1080p portrait (2:3). Start on the static cover; no black bars, no mouse cursor, no promo text, no fast-forwarding

## 4. Gap check: prototype v0.4.0

| Area | Status | Notes |
|---|---|---|
| File size and load time | ✅ Pass | ~58 KB, single file. Far below 20 MB. |
| One click to play | ✅ Pass | "Tap to start" is one click, which is the maximum allowed. |
| No custom fullscreen button | ✅ Pass | None present. |
| `user-select: none`, safe areas | ✅ Pass | Already in the CSS. |
| Mouse input | ✅ Likely pass | Uses pointer events, so mouse drag should work. Test on desktop. |
| Desktop landscape / small window | ⚠️ Needs work | The game fills the whole window, so on a 16:9 desktop iframe the play area becomes wide and short (821×462 is the smallest). Either letterbox to portrait or rebalance for landscape, then check text readability. |
| Physics at 144/165 Hz | ⚠️ Test | Uses a variable frame step (capped). Run the same run at 60 Hz and 144 Hz and compare. |
| Dev-only UI | ❌ Remove | Tuning gear/panel and the "How fun was that?" rating need removing or hiding in the CrazyGames build. |
| Telemetry to Supabase | ⚠️ Decide | Sends run data with a persistent random player ID. Needs a privacy notice if kept, or switch off in the CrazyGames build (§6). |
| Progress save | ⚠️ Full Launch | Currently `localStorage`. Needs the SDK Data module for Full Launch. |
| SDK events | ⚠️ Full Launch | Not yet integrated. |
| Audio | — | None yet. When added, handle the iOS AudioContext resume. |
| Name and originality | ⚠️ Open | "Scroll Game" is a working title. Needs a distinctive final name. |
| Repo `index.html` | ⚠️ Packaging | The root page redirects to `prototype/`. The CrazyGames upload should have the game itself as `index.html`. |
| Progression for D1 | ⚠️ Gap | Only placeholder unlocks today (see §2.1). |

## 5. Not yet confirmed

These CrazyGames pages could not be loaded on 4 Nov 2026, so their contents are not reflected above: the **Quality Guidelines** (including restricted keys) and the **Basic Launch Guide**. Read them before submitting.

## 6. Decisions for Stuart

### 6.1 Monetisation at launch
The brief says *no monetisation at launch*. Full Launch requires the SDK and is where monetisation is switched on; CrazyGames' revenue share comes from ads (and optional purchases).

| Option | For | Against |
|---|---|---|
| **A. Go to Full Launch with ads, as CrazyGames intends** (midgame ad after game over only) | Earns revenue share; matches the brief's "ads between runs only" future plan; aligned with how CrazyGames promotes games | Reverses a brief decision; ads after deaths may cut runs per sitting and playtime |
| **B. Basic Launch only, as a free playtest** | No ads; gets real player metrics against platform benchmarks; costs little | No revenue; Basic Launch is time-limited and its audience small |
| **C. Full Launch with the SDK but no ad calls** | Keeps the no-ads stance | Not confirmed as allowed in the docs; likely reduces CrazyGames' interest in promoting it. Check with CrazyGames first |

### 6.2 Session length vs the 10-minute playtime target

| Option | For | Against |
|---|---|---|
| **A. Keep 1–5 min sessions, rely on fast retries** | True to the design pillar; repeat runs add up | Needs 7–10 runs per sitting to hit 10 min; hard without strong meta-progression |
| **B. Build Phase 2 progression before submitting** | Strongest levers for both playtime and D1 | Delays launch; more work on the HTML version you planned to rebuild in an engine |
| **C. Submit early, then iterate during Basic Launch** | Updates go live instantly; real data sooner | If most metrics fall below benchmark, the game can't proceed and must come back as a "new game" |

### 6.3 Role of the web version
The roadmap treats HTML as an MVP before an engine rebuild for iPhone. A CrazyGames launch makes the web version a product in its own right.

| Option | For | Against |
|---|---|---|
| **A. Treat CrazyGames as the real-player test for the concept** | Cheap validation with benchmarked metrics before investing in the engine build | Effort goes into web-specific work (SDK, desktop layout) that may not carry over |
| **B. Launch on CrazyGames as a long-term web product** | Revenue and audience independent of app stores | Two codebases to maintain once the engine version exists |
| **C. Wait and launch the engine build's web export** | One codebase | Unity web builds are disabled on iOS by default on CrazyGames and are much heavier than the current file |

### 6.4 Telemetry in the CrazyGames build

| Option | For | Against |
|---|---|---|
| **A. Keep Supabase telemetry, add a short privacy notice** | Keeps your detailed per-run data and balance-testing loop | Needs a privacy policy; more to maintain; extra network calls |
| **B. Turn it off; rely on the CrazyGames dashboard** | Simplest; no personal-data handling | Lose per-run detail (run length, deaths, fun signals) |

## 7. Sources

- [CrazyGames: Introduction and launch process](https://docs.crazygames.com)
- [Basic Launch metrics](https://docs.crazygames.com/resources/basic-launch-metrics/)
- [Requirements overview](https://docs.crazygames.com/requirements/intro/)
- [Technical requirements](https://docs.crazygames.com/requirements/technical/)
- [Gameplay requirements](https://docs.crazygames.com/requirements/gameplay/)
- [Ads requirements](https://docs.crazygames.com/requirements/ads/)
- [Account integration and progress save](https://docs.crazygames.com/requirements/account-integration/)
- [Game covers](https://docs.crazygames.com/requirements/game-covers/)
- [FAQ](https://docs.crazygames.com/faq/)
