# Handoff prompt: Bullseye to CrazyGames submission

*Paste everything below the line into a new Claude Code session opened in `/Users/stuartdavis/repos/scroll-game`.*

---

You are taking over **Bullseye**, a small HTML5 arcade game in this repo, and your job is to take it all the way to a high-quality finished game and a submitted **CrazyGames Basic Launch**. I want something that looks and feels like a game a professional studio would release, built with simple, focused improvements rather than new systems for their own sake.

## Read first (in this order)
1. `docs/handoff/launch-status.md`: current state, test results, known gaps, decisions only I can make, submission mechanics. This is the source of truth for where things stand.
2. `docs/brief.md`: the design brief. The pillars in §3 are binding.
3. `crazygames-launch.md`: CrazyGames requirements (§3), engagement targets (§2) and open decisions (§6). Its §4 table is out of date.
4. `docs/ux-design-review.md`: the design direction already mostly implemented.
5. `docs/crazygames-listing.md`: listing draft and notes from the CrazyGames docs.
6. Then the code: `src/js/*.js` (concatenated in order by `scripts/build.mjs`), `src/body.html`, `src/style.css`, `tests/`.

Re-check the live CrazyGames developer docs (docs.crazygames.com: requirements, quality guidelines, game covers, Basic Launch guide) before relying on anything in our notes; they were last read in early November 2026.

## Goal and quality bar
"Done" means all of the following are true:
- Every Basic Implementation requirement in `crazygames-launch.md` §3.1 is met and checked, with evidence (screenshots at each listed size, device notes).
- The game is readable, responsive and bug-free at every CrazyGames size (desktop 821×462 up to 1920×1080, mobile 800×450, portrait phone), with mouse, keyboard and touch.
- It holds 60 fps on modest hardware with all effects on.
- It reads as one coherent, professional product: consistent visual identity and type, a clean audio mix, satisfying feedback on every event, no placeholder text, no dead or confusing UI, clear first-minute onboarding, and a game-over screen that makes "one more run" the obvious choice.
- It is set up to hit CrazyGames' targets: conversion 80%+ (players reaching 1 minute), average playtime 10+ minutes, D1 retention 10–15%.
- Store assets (3 covers, 2 preview videos) and listing copy are finished and meet the CrazyGames rules.
- The submission is made (or fully prepared for me to click submit).

## How to work: phases and checkpoints

**Phase 1: Play review.** Build (`node scripts/build.mjs`), run `node tests/determinism.mjs` and `node tests/bot.mjs`, then actually play the game in a browser at every CrazyGames size with mouse, keyboard and touch emulation. Play several full runs, including a first-time run with cleared storage. Judge it the way a CrazyGames QA reviewer and a studio creative director would: first 10 seconds, feel, readability, clarity, juice, pacing, progression, polish, and compliance. Write `docs/play-review.md` with screenshots, findings ranked by severity and by which metric they affect (conversion, playtime, D1, thumbnail CTR), and what already works well.

**Phase 2: Improvement proposal.** In the same doc, propose the improvements that take it to studio quality. Favour simple, high-leverage changes: polish, clarity, feel, pacing, content depth for D1, readability. For each item give the metric it moves, effort, and risk. Include the known gaps in `launch-status.md` §5.1 and §5.2. Group into "must before submission" and "nice to have". **Stop and check in with me here**: I approve the list, and I answer the decisions in `launch-status.md` §6 (final name, telemetry, launch path, music). Ask them as one concise set of questions with your recommendation for each.

**Phase 3: Build it.** Work through the approved list in small, self-contained commits on `main` (that is how this repo works). After each change: rebuild, keep `tests/determinism.mjs` green, re-run `tests/bot.mjs` when balance or pacing changes, and check it in the browser at a small and a large size. Keep a running checklist in `docs/play-review.md` so progress is visible. Don't push without asking me.

**Phase 4: QA pass.** Go through `crazygames-launch.md` §3.1 line by line and the current CrazyGames quality guidelines, and record pass/fail with evidence. Test first-run experience from cleared storage, pause/resume and tab switching, the SDK events (`gameplayStart`/`gameplayStop` around every pause and menu), reduce-motion, left-handed mode, mute, interrupted-run banking, and high refresh rate. List anything you could not test yourself (e.g. a real iPhone, a Chromebook, the CrazyGames app) and tell me exactly what to check.

**Phase 5: Store assets and listing.** Produce the 3 covers and 2 preview videos from the game itself: render title art and scenes in the browser and capture with Playwright, then encode with ffmpeg (both are installed; see `launch-status.md` §2). Follow the cover rules (title only, stylised font, no borders, logos, "New" or "Play now", not a plain screenshot) and video rules (15–20 s, silent, 1080p, open on the static cover, no cursor, no promo text, no fast-forward, no black bars). Save them under `store/` with a short README. Finalise the listing copy in `docs/crazygames-listing.md`. **Check in with me** with the assets before submission.

**Phase 6: Submit.** Build `dist/crazygames/`, zip it with `index.html` at the root, and verify the zip (size, file count, relative paths, loads from a plain static server with no console errors). Then guide the submission in the CrazyGames developer portal. I will sign in myself. Don't enter passwords, accept terms or create accounts for me. Fill in the form from the finished listing, then show me the completed form and wait for my explicit yes before you press submit. After submitting, tell me what to expect next (QA feedback, Basic Launch window, which metrics to watch and where), and write that up in `docs/handoff/launch-status.md`.

## Constraints
- **Design pillars hold** (brief §3): dragging is the whole game; anything extra stays optional. Balls and trails stay cosmetic only. Losing must feel fair.
- **Original work only.** Don't copy the name, art, music or look of any existing game.
- **Stay light.** Keep the no-dependency single-file build and a tiny download. Self-host and subset any font; no CDNs in the CrazyGames build other than the CrazyGames SDK.
- **No custom fullscreen button, no Escape or Ctrl/Cmd+W bindings, no external or app-store links**, PEGI 12-safe, not aimed at children.
- **Don't break determinism.** Cosmetic effects must not touch the sim RNG or change sim results.
- Basic Launch has no ads. Don't add ad calls unless I choose the Full Launch path; if I do, follow `crazygames-launch.md` §3.2.
- Keep `dist/web` (playtest build with dev UI and telemetry) working alongside `dist/crazygames`.

## Communicating with me
- Keep updates short: what changed, what's verified, what's next.
- Check in only at the Phase 2 and Phase 5 checkpoints, before submitting, or when a decision genuinely changes the design. Otherwise use your judgement and keep moving.
- When something can't be verified from here, say so plainly rather than assuming it works.
