# CrazyGames listing draft (replace Bullseye once chosen)

**Title:** Bullseye
**Short description:** Drag your thumb to keep the glowing ball balanced in the ring. Survive escalating neon chaos, earn shards, unlock power-ups, balls and trails.
**Instructions / controls:** Mouse or touch: drag to move the ring. Keyboard: arrow keys / WASD to move, Space or Enter to start/retry, 1-3 for power-ups, M to mute (button top-left).
**Category suggestions:** Skill, Casual, Arcade
**Tags:** balance, one-touch, neon, arcade, endless, upgrades
**Orientation:** Portrait (fixed 9:16 stage, letterboxed)
**Devices:** Desktop + mobile (touch)
**Languages:** English
**Content rating:** PEGI 12-safe (no violence, text, or user content)

## Assets still to produce (need final name)
- Covers: 1920x1080, 800x1200, 800x800 (title text only, stylised)
- Preview videos: 15-20 s, silent, 1080p 16:9 and 2:3, no cursor, no promo text, <=50 MB

## Docs findings (read 5 Nov 2026)
- Physics must be refresh-rate independent: covered (fixed 120 Hz step + determinism test).
- Add `user-select:none` on body: done. Safe areas: handled by letterboxed stage; verify in CrazyGames app.
- Privacy/Terms notice for non-SDK personal data: non-blocking notice + privacy.html added.
- Portrait is allowed with black bars/background.
- SDK Basic integration: DONE (crazygames build only): SDK v3 script, init + loadingStart/Stop, gameplayStart on run start, gameplayStop on game over. No ads (disabled in Basic).
- Size limits: 50 MB initial (ours ~85 KB). Relative paths only: yes (single file).
- Quality Guidelines (docs.crazygames.com/requirements/quality/): restricted keys are Escape and Ctrl/Cmd+W - we use neither. Key bindings use physical key positions (WASD = ZQSD on AZERTY). Onboarding should be in-gameplay and skippable (recommended, we have none beyond the start screen - consider a brief hint).
- Basic Launch metrics (resources/basic-launch-metrics/): SDK NOT required for Basic (ads stay disabled if integrated); 7-21 days, ends at >=7 days AND >=500 plays; benchmarks 10+ min avg session, D1 10-15%, conversion 80%+; load <10 s, build <20 MB. Loading is measured up to gameplayStart.
