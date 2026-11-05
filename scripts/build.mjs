// Concatenation build (no deps): src/ -> dist/<target>/index.html
// Usage: node scripts/build.mjs [web|crazygames|all]
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
const T = {
  web:        { target: 'web',        devUI: true,  telemetry: true },
  crazygames: { target: 'crazygames', devUI: false, telemetry: true },   // telemetry stays on for now; flip to false if consent not given
};
const rd = p => readFileSync(new URL('../src/' + p, import.meta.url), 'utf8');
const js = readdirSync(new URL('../src/js/', import.meta.url)).sort().map(f => rd('js/' + f)).join('\n');
function build(name) {
  const b = T[name];
  const hide = b.devUI ? '' :
    '\n  #gear, #panel, #rate { display:none !important; }  /* dev-only UI (hidden in this build) */';
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>Scroll Game</title>
<style>
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
  console.log(name, (html.length / 1024).toFixed(1) + ' KB');
}
const a = process.argv[2] || 'all';
(a === 'all' ? Object.keys(T) : [a]).forEach(build);
