# Store assets: Neon Bullseye

Everything here is generated from the game's own drawing code, so it always matches the build.

| File | Use | Spec |
|---|---|---|
| `cover-1920x1080.png` | Landscape cover | 16:9, 1920×1080 |
| `cover-800x1200.png` | Portrait cover | 2:3, 800×1200 |
| `cover-800x800.png` | Square cover | 1:1, 800×800 |
| `preview-1920x1080.mp4` | Landscape preview video | 1080p 16:9, about 17 s, 60 fps, H.264, no audio track |
| `preview-1080x1620.mp4` | Portrait preview video | 1080p 2:3, about 17 s, 60 fps, H.264, no audio track |
| `neon-bullseye-crazygames.zip` | Game upload | `index.html` at the root; made by `node scripts/package.mjs` |

## How they meet the CrazyGames rules (docs re-read 15 Nov 2026)

**Covers:** only the title as text; no border, icons, logos or "Play"/"New"; not a plain screenshot (a composed scene: enlarged reticle, ball and trail, a shape about to hit, the wordmark in the game's own typeface); same look across the three ratios; rendered at full size, not upscaled.

**Videos:** open on the static cover (0.8 s), then real gameplay captured one frame per simulated frame, so playback is real-time with no fast-forward; no cursor, no promo text, no black bars, no logo transitions, no sound. The landscape video fills 16:9; the portrait video fills 2:3. The on-camera player is a scripted steering routine using the normal controls path; its health is topped up so a run does not end mid-clip.

## Regenerate

```bash
node scripts/build.mjs
PW_DIR=<folder containing node_modules/playwright> node scripts/store-assets.mjs        # covers + videos
PW_DIR=<folder containing node_modules/playwright> node scripts/store-assets.mjs covers # covers only
node scripts/package.mjs                                                               # upload zip
```

Needs Playwright's Chromium and `ffmpeg` on the PATH. Neither is a dependency of the game.
