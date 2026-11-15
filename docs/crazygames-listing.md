# CrazyGames listing: Neon Bullseye

*Final copy for the developer portal form. Rules re-checked against docs.crazygames.com on 15 Nov 2026.*

| Field | Value |
|---|---|
| **Title** | Neon Bullseye |
| **Category** | Casual (alternative if offered: Skill / Arcade) |
| **Tags** | arcade, skill, balance, ball, neon, endless, mouse, 1 player, upgrade, reflex |
| **Orientation, desktop** | Landscape (the play field fills the 16:9 frame) |
| **Orientation, mobile** | Portrait and landscape both work; choose **portrait** if only one is allowed |
| **Devices** | Desktop, tablet, mobile |
| **Languages** | English |
| **Players** | Single player |
| **Age rating** | Suitable for PEGI 12 and under: no violence, no text chat, no user content, no purchases |
| **SDK** | CrazyGames SDK v3: loading and gameplay start/stop events. No ads (Basic Launch). |
| **Data collected** | None beyond the SDK. Progress is saved in the browser's local storage. |

## Description

Neon Bullseye is a one-move arcade game about pushing without touching. Your ring repels the glowing ball: rest it in the calm centre and it stays put, slide the ring behind it and it shoots away. Use that push to steer the ball clear of the neon shapes drifting in to knock it about.

Every second you survive counts. Runs climb through eight named stages, from CALM to BULLSEYE, each faster and brighter than the last, with pulsing circles and closing gates joining in as you go deeper. A near miss pays bonus shards. A clean hit cracks your ring.

Between runs, spend shards on upgrades and power-ups, complete missions and daily quests, and build a collection of 16 balls, 10 trails and 4 colour themes. Every run earns something, and the next unlock is never far away.

- One control: move the ring. Nothing else to learn.
- Eight stages with rising speed, new hazards and a music layer for each.
- Upgrades, three power-ups, missions, daily quests and a seven-day streak.
- 30 cosmetics to unlock by skill, level or shards.
- Plays full screen on desktop and in portrait or landscape on phones and tablets.

## Controls

**Desktop**
- Click to start. Move the mouse to steer the ring. The ring pushes the ball away from its centre, so put the ring behind the ball to send it where you want.
- Or use the arrow keys / WASD.
- Space or Enter: start and retry.
- 1, 2, 3: use power-ups. P: pause. M: mute.

**Mobile and tablet**
- Tap to start. Drag anywhere on the screen to move the ring; the ring pushes the ball away from its centre.
- Tap the buttons at the screen edge to use power-ups.

## Assets

See [store/README.md](../store/README.md): three covers (1920×1080, 800×1200, 800×800) and two preview videos (1920×1080 and 1080×1620, 15–20 s, silent).

## Upload

`store/neon-bullseye-crazygames.zip`: `index.html` at the root, single file, relative paths only. Built by `node scripts/package.mjs`.
