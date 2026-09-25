// Fails when a raw colour literal appears in src/ outside the generated token files.
// Colours come from design/tokens.json through src/ui/tokens.css (CSS variables)
// or src/game/palette.ts (P, S, hexString). A line containing "tokens-allow"
// is skipped, for the rare literal that is not a palette colour (bit masks,
// rgba() shadows documented in docs/art-direction.md).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ALLOW = new Set(['src/ui/tokens.css', 'src/game/palette.ts']);
// CSS: any #rgb, #rgba, #rrggbb, #rrggbbaa not followed by a word character.
const HEX_CSS = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/g;
// TS/TSX: 0xRRGGBB numbers, and '#rgb' / '#rrggbb' / '#rrggbbaa' inside quotes or backticks.
const HEX_NUM = /\b0x[0-9a-fA-F]{6}\b/g;
const HEX_QUOTED = /['"`]#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})['"`]/g;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|css)$/.test(name)) out.push(p.replace(/\\/g, '/'));
  }
  return out;
}

let bad = 0;
for (const file of walk('src')) {
  if (ALLOW.has(file)) continue;
  const patterns = file.endsWith('.css') ? [HEX_CSS] : [HEX_NUM, HEX_QUOTED];
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (line.includes('tokens-allow')) return;
      const hits = patterns.flatMap((re) => line.match(re) ?? []);
      if (hits.length) {
        bad++;
        console.error(`${file}:${i + 1}: raw colour ${hits.join(', ')} — use a token from design/tokens.json`);
      }
    });
}
if (bad) {
  console.error(`${bad} raw colour literal(s) found.`);
  process.exit(1);
}
console.log('check:tokens ok');
