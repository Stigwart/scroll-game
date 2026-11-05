// Rebuild and refresh the committed playtest copies in play/ (served by GitHub Pages from main).
// Usage: node scripts/publish-play.mjs [--commit] [--push]
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync } from 'node:fs';
const sh = c => execSync(c, { stdio: 'inherit' });
sh('node scripts/build.mjs');
sh('node tests/determinism.mjs');
mkdirSync('play/cg', { recursive: true });
cpSync('dist/web', 'play', { recursive: true });
cpSync('dist/crazygames', 'play/cg', { recursive: true });
console.log('play/ refreshed');
const a = process.argv;
if (a.includes('--commit') || a.includes('--push')) {
  sh('git add play');
  try { execSync('git diff --cached --quiet'); console.log('no changes'); }
  catch { sh('git commit -m "Refresh playtest builds"'); if (a.includes('--push')) sh('git push origin main'); }
}
