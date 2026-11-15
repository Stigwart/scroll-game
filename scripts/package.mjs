// Build and package the CrazyGames upload: store/neon-bullseye-crazygames.zip with index.html at the root.
// Verifies size, file count, relative paths and that nothing but the CrazyGames SDK is loaded from another host.
// Usage: node scripts/package.mjs
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, mkdirSync, rmSync } from 'node:fs';
const sh = c => execSync(c, { stdio: 'inherit' });
sh('node scripts/build.mjs crazygames');
const dir = 'dist/crazygames', files = readdirSync(dir), out = 'store/neon-bullseye-crazygames.zip';
const html = readFileSync(dir + '/index.html', 'utf8');
const fail = m => { console.error('FAIL: ' + m); process.exit(1); };
if (!files.includes('index.html')) fail('index.html missing');
const ext = [...html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)].map(m => m[1]).filter(u => /^(https?:)?\/\//.test(u));
const bad = ext.filter(u => !/^https:\/\/sdk\.crazygames\.com\//.test(u));
if (bad.length) fail('external URLs: ' + bad.join(', '));
if (/(?:src|href)\s*=\s*["']\//.test(html)) fail('absolute path found');
if (/supabase/i.test(html) && /"telemetry":true/.test(html)) fail('telemetry is on in the CrazyGames build');
if (/id="gear"|id="panel"/.test(html) && !/devUI":false/.test(html)) fail('dev UI present');
mkdirSync('store', { recursive: true }); rmSync(out, { force: true });
sh(`cd ${dir} && zip -q -X -r ../../${out} . -x '.*'`);
const total = files.reduce((s, f) => s + statSync(dir + '/' + f).size, 0);
console.log(`OK  ${out}: ${files.length} file(s) [${files.join(', ')}], ${(total / 1024).toFixed(1)} KB unpacked, ${(statSync(out).size / 1024).toFixed(1)} KB zipped; external: ${ext.join(', ') || 'none'}`);
