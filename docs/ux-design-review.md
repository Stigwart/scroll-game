# Bullseye: UX & Design Review and Design Brief

*Draft v0.1 · 6 Nov 2026 · Reviewed against src v0.5.0-dev (code + docs, not a live playtest)*
*Benchmark set: CrazyGames arcade staples (Slope, Tunnel Rush, Drift Boss, Helix-style droppers, Geometry Dash-likes, Paper.io-style .io games). The category page was not fetched live for this review, so these benchmarks come from general knowledge of the platform.*

---

## 1. Verdict

The core mechanic is a strong one: one drag, an unstable balance, and obstacles. It is easy to read and has real skill depth. The game around it looks like a prototype, though. Text is drawn on canvas in a single style, the screens are thin, the meta layer sits behind a "Collection" button, and hits have little feedback. The best arcade games on CrazyGames win in the **first 10 seconds**, with **juice**, and with **"one more run" framing**. Bullseye is behind on all three, and none of the fixes need the mechanic to change.

**Top 5 changes, in priority order:**
1. **Instant-play title screen.** Make the first drag start the run, and let the ball and ring be the menu.
2. **Juice pass on hits, edges and milestones.** Add screen shake, hit-stop, particles, haptics and audio stingers.
3. **Replace "health" with a visible ring-integrity meter on the target.** Keep the player's eyes on the play area.
4. **Rebuild the game-over screen as a "one more run" screen.** Show progress to the next unlock, a near-miss stat, and a big retry button. Aim for a restart in under 1 second.
5. **Add named stages with a beat.** Turn the palette shifts into "Stage 3: OVERDRIVE" moments with music lifts, so the run has a sense of distance.

---

## 2. Benchmark: what best-in-class arcade games on CrazyGames do

| Pattern | Benchmark examples | Bullseye today | Gap |
|---|---|---|---|
| Gameplay within 1–3 s of load, no menu wall | Slope, Tunnel Rush | Title screen with "TAP TO START" (one tap) | Small. Remove the tap. |
| Restart in under 1 s, from any key or tap | Slope, Geometry Dash-likes | "TAP TO RETRY" after the game-over overlay | Medium. Restart may be gated by the summary. |
| Distance or speed shown as the score, always rising | Slope, Drift Boss | Time survived in small HUD text | Medium. Make the score the hero number. |
| Strong feedback on every event | Helix droppers, Drift Boss | Minimal (glow only) | **Large** |
| Clear sense of progression within a run | Tunnel Rush colour stages | 8 palettes, 30 s stages, no announcement | Medium |
| Meta layer shown on the end screen, not in a menu | Drift Boss (coins → cars), .io skins | Shards, XP, upgrades and daily quests behind the Collection button | **Large** |
| Fully readable at a glance in a landscape iframe | All | Portrait layout with a footer HUD band (19% of height) | Medium. Needs a landscape-first layout. |
| Thumbnail/cover that shows the mechanic | All top games | Not yet made | **Large for CTR** |

---

## 3. Findings by area

### 3.1 First-time experience (affects **Conversion**: ≥1 min of play)
- **Issue: first-run deaths under 60 s count as lost conversions.** A new player doesn't know that the ring repels and isn't a cup. That rule runs against intuition.
- **Fix: a 15-second "ghost tutorial" that happens while playing.** The first run starts with no obstacles for 8 s, and a faint arrow trail shows the ball being pushed out. Then show one line of copy: *"Keep it in the bullseye."* After that, one slow obstacle with *"Dodge!"*. Use no modal screens. The tutorial ends on its own after the first 20 s survived.
- **First run is protected:** drain is 50% for the first 45 s of run #1 only, so most new players pass the 1-minute mark. Track it with the "% of first sittings ≥ 1 min" metric already proposed in `crazygames-launch.md`.
- Remove the privacy bar from the play area on first load. Put it in the bottom corner, with no overlap on the ring's starting position.

### 3.2 Title / menu
- **The ball and ring should be the menu.** On load the ball is already floating with the ring under it, and the BULLSEYE logo sits above. **The first drag starts the run**, and the subtitle reads *"Drag to play"* (keyboard: arrows/WASD or mouse). The tap step goes away.
- The secondary actions (Collection, Daily, Mute, Settings) go in a compact **icon rail** along the top edge. Each has a notification dot, e.g. "upgrade affordable" or "daily quest done".
- Show **BEST** and the **player level badge** on the title screen, so there is a goal before the first move.

### 3.3 In-run HUD
- **The score should be the hero.** Show a large centred time at the top in a monospaced neon font with tabular digits, so it doesn't jitter. Add a small "BEST" ghost marker that **flashes and chimes when you pass it**, the single biggest "one more run" hook in benchmark games.
- **Show health on the ring, not in the footer.** Draw the target ring as a segmented arc that loses segments as health drops, and pulses red under 25%. Players already look at the ring, so a footer bar forces their eyes away from the action. This keeps the mechanic and only moves the information.
- **Make the edge danger readable:** add a red vignette that builds as the ball nears the screen edge, *before* edge damage starts.
- **Shards earned in-run:** a small counter top-right that ticks up, with a +1 popping off the ball every few seconds. This makes "every run earns something" (pillar 3) visible.
- Drop the 19% footer band in landscape, where it wastes space. Use the full playfield and overlay the HUD.

### 3.4 Juice and feel (the biggest gap)
| Event | Add |
|---|---|
| Obstacle hit | 60 ms hit-stop, 4–6 px screen shake, spark burst in the obstacle colour, ring segment cracks, low "thud" SFX, `navigator.vibrate(20)` on mobile |
| Ball in sweet spot | Soft bloom on the ball, faint hum and a slowly building "focus" glow. Rewards precision without new rules |
| Near miss (obstacle passes within ~8 px) | "CLOSE!" text pop, slow-mo for 100 ms, bonus shards. Gives skilled play a reward and a highlight moment |
| Edge contact | Edge flashes, crackle SFX, small chromatic-aberration pulse |
| Stage change | Full-screen colour wipe, stage name card ("STAGE 3 · OVERDRIVE"), music layer added |
| New best | Confetti burst from the score, "NEW BEST" banner, distinct stinger |
| Death | Ball shatters into particles, 400 ms slow-mo, desaturate, then the summary slides in |

Add a **reduced-motion / reduced-shake toggle** in settings.

### 3.5 In-run progression and pacing (affects **Playtime**)
- Name the 8 palette stages (e.g. *Calm → Pulse → Heat → Redline → Toxic → Solar → Void → Bullseye*). Announce each one and give it a **visual signature** beyond colour, such as a different background shape language and obstacle silhouette. The run becomes a journey, and "I reached Void" is something to tell friends.
- Keep the 30 s stage length but **add a 3–4 s breather after each stage card** with fewer obstacles. Benchmark games pace in waves, and this one ramps flat-out. A breather lowers frustration and lengthens runs.
- **Milestone shard bonuses** at 30/60/120/180 s.

### 3.6 Game-over screen (affects **Playtime** and **D1**)
Order, top to bottom:
1. **Time** (huge) + **NEW BEST** or "−4.2 s from best".
2. **Stage reached** with a progress strip through all 8 stages, and the next one shown as a silhouette.
3. **Earnings:** shards counting up, XP bar filling, level-up burst if it happens.
4. **One next goal**, already computed by `metaNextGoal()`: *"Sturdy Hull upgrade in 12 shards"* with a progress bar. If it's affordable, show an **Upgrade now** button inline.
5. **Daily quest progress**, if a quest moved this run.
6. **RETRY** as a big primary button. Space, Enter, click or a drag *anywhere* also restarts. Target: playing again **<1 s** after death, and the summary must never block the retry.

Move the fun-rating emoji prompt so it shows **only every 5th run**, in playtest builds only. Leave it out of the CrazyGames build.

### 3.7 Meta / Collection (affects **D1**)
- The systems already exist (shards, XP/levels, 4 upgrades, daily streak and quests, cosmetics), but they're hidden. **Show them on the title and game-over screens.** Don't make them a separate destination players have to find.
- **Daily streak:** a calendar strip with day 7 shown as a big reward, such as an exclusive ball. Show it once per day on first open, as a dismissible card.
- **Collection grid:** show locked items as glowing silhouettes with their unlock condition ("Reach Stage 5", "Level 8"). Unlock conditions tied to *skill moments* (near misses, stage reached, 10 s in the sweet spot) create goals for the next run.
- **Upgrades:** show the effect visually, e.g. a preview of the bigger sweet-spot ring. "+3 radius" alone means little to a player.
- The tab buttons have no text in `body.html` (filled by JS). Make sure each has an icon **and** a label.

### 3.8 Visual identity
- Today: canvas text in one sans font, flat glow, simple shapes. It's fine for a prototype, but it isn't distinctive.
- **Direction: "neon instrument".** The ring looks like a precision targeting reticle, with tick marks, a rotating outer bezel that speeds up with difficulty, and crosshair notches. The ball is a glowing core. This adds personality and fits the name.
- **Type:** one display face for the logo, stage names and big numbers (geometric, wide, e.g. Orbitron/Audiowide-style; self-host and subset it to stay small), plus a clean UI sans. Use tabular numerals for all scores.
- **Background:** add parallax depth (2–3 layers of slow geometry) and a subtle grid that warps around obstacles. Keep contrast so the ball is **always** the brightest object on screen. Check this against the white and yellow accents in palette 4 and the white/pink palette 8, where obstacles may compete with the ball.
- **Accessibility:** obstacle colour must never be the only signal. Give obstacles a consistent outline or shape language so colour-blind players can read them across all 8 palettes.

### 3.9 Platform fit (CrazyGames)
- **Landscape-first layout.** Most CrazyGames sessions are desktop landscape iframes. Use the full width for the playfield, and put the HUD in the corners.
- **Mouse and keyboard parity:** mouse-move (no click needed) moves the ring, and arrows/WASD move it with acceleration. Show the hint on desktop.
- **Pause on blur / visibility change**, with a "Click to resume" overlay. Use the CrazyGames SDK `gameplayStart/Stop` hooks around runs and menus.
- **Hide dev UI** (tuning gear, unlock-all) in the CG build. This is already handled by `BUILD.target`; confirm in QA.
- **Store assets:** the cover should show the mechanic in one frame: a big glowing reticle, the ball off-centre, an obstacle about to hit, and the BULLSEYE wordmark. Make a 15 s gameplay video that opens on a near miss.

---

## 4. What stays the same

- The drag-the-ring control and the repulsion / centre-pull / up-bias / drift forces.
- Obstacle hits cost health and difficulty ramps over time. Score = time survived.
- Balls and trails stay cosmetic only.
- No new required inputs. Power-ups, if added, stay optional, per pillar 1.

---

## 5. Roadmap

| Phase | Scope | Metric it targets | Effort |
|---|---|---|---|
| **P0 – before Basic Launch** | Drag-to-start, instant retry, ring health meter, juice pass (hit, death, new best), game-over rebuild, landscape layout, pause on blur, cover art | Conversion, Playtime, CTR | ~1 week |
| **P1 – during Basic Launch** | Named stages + cards + breathers, near-miss system, first-run tutorial and protection, edge vignette | Conversion, Playtime | ~1 week |
| **P2 – before Full Launch** | Meta on the title screen, daily streak calendar, skill-based unlock conditions, reticle art direction, display font, music layers per stage | D1, Playtime | ~2 weeks |

## 6. Success measures
- First-run length: median **≥ 60 s**; ≥ 80% of first sittings last ≥ 1 min.
- Death → next run start: median **< 1.5 s**.
- Runs per sitting **≥ 7** (to reach 10+ min playtime).
- D1 **≥ 12%** once P2 ships.
- Retry rate within 10 s of death **≥ 70%**.

## 7. Open questions for Stuart
1. Ring-as-health-meter vs. keeping a separate bar. *Recommendation: ring.*
2. Should near misses give shards (a new reward rule) or only feedback?
3. Breathers between stages soften the ramp. Is that OK, or should difficulty stay relentless?
4. Portrait mobile vs. landscape desktop: which layout is primary for CrazyGames?
