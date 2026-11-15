// Concatenation build (no deps): src/ -> dist/<target>/index.html
// Usage: node scripts/build.mjs [web|crazygames|all]
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
const T = {
  web:        { target: 'web',        devUI: true,  telemetry: true },
  crazygames: { target: 'crazygames', devUI: false, telemetry: false },  // decision 15 Nov 2026: no third-party stats in the CrazyGames build
};
const rd = p => readFileSync(new URL('../src/' + p, import.meta.url), 'utf8');
const font = readFileSync(new URL('../src/font.woff', import.meta.url)).toString('base64'); // own display face, built by scripts/font.py
const js = readdirSync(new URL('../src/js/', import.meta.url)).sort().map(f => rd('js/' + f)).join('\n');
function build(name) {
  const b = T[name];
  const hide = b.devUI ? '' :
    '\n  #gear, #panel { display:none !important; }  /* dev-only UI (hidden in this build) */';
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>Neon Bullseye</title>${b.target === 'crazygames' ? '\n<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>' : ''}
<style>
@font-face { font-family:"NB Display"; src:url(data:font/woff;base64,${font}) format("woff"); font-display:block; }
${rd('style.css')}${hide}
</style>
</head>
<body>
${rd('body.html')}
<script>
"use strict";
const BUILD = ${JSON.stringify(b)};
${js}
</script>
</body>
</html>
`;
  mkdirSync(new URL(`../dist/${name}/`, import.meta.url), { recursive: true });
  writeFileSync(new URL(`../dist/${name}/index.html`, import.meta.url), html);
  writeFileSync(new URL(`../dist/${name}/privacy.html`, import.meta.url), readFileSync(new URL('../src/privacy.html', import.meta.url), 'utf8'));
  console.log(name, (html.length / 1024).toFixed(1) + ' KB');
}
const a = process.argv[2] || 'all';
(a === 'all' ? Object.keys(T) : [a]).forEach(build);
