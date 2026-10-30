// Fails when a page shows a figure (a number with a unit, a percentage, "N of M") that contents.md never states.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const norm = (s) => s.replace(/[  ]/g, ' ').replace(/[–—]/g, '-').replace(/\s+/g, ' ');
const source = norm(readFileSync('contents.md', 'utf8'));
const PATTERN = /(?:~|\$)?\d[\d,.]*\+?\s?(?:%|KB|MB|ms|s|J\/cm²|hrs\/week|students|pages|videos|tests|works)\b|\b\d+ of \d+\b/g;
// Figures that are not claims: years, dates and this site's own numbers.
const ALLOW = [/^20\d\d$/, /^\d{1,2} s$/];

function* html(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* html(p);
    else if (p.endsWith('.html')) yield p;
  }
}

export function check(text, src = source) {
  const missing = new Set();
  for (const m of norm(text).matchAll(PATTERN)) {
    const fig = m[0].trim();
    if (ALLOW.some((r) => r.test(fig))) continue;
    const bare = fig.replace(/^~/, '');
    // measured units must match with the unit; counted nouns ("students") only need the number
    const num = bare.match(/^\$?[\d,.]+\+?/)?.[0] ?? bare;
    const counted = /(students|pages|videos|tests|works|hrs\/week)$/.test(bare) || / of /.test(bare);
    const ok = counted ? src.includes(num) && (!/ of /.test(bare) || src.includes(bare)) : src.includes(bare) || src.includes(bare.replace(/\s/, ''));
    if (!ok) missing.add(fig);
  }
  return [...missing];
}

// Phrases contents.md rules out, whatever the numbers say.
const BANNED = /\bpresenting at AVS|University Ambassador|1 of 24|\bowns? the (?:official )?USGA|\(\d{3}\)\s?\d{3}-\d{4}|passionate|cutting-edge|world-class|leveraging/i;

if (process.argv[1]?.endsWith('check-facts.mjs')) {
  let bad = 0;
  for (const f of html('dist')) {
    const text = readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
    const miss = check(text);
    const banned = norm(text).match(BANNED);
    if (banned) miss.push(`banned phrase: "${banned[0]}"`);
    if (miss.length) { bad++; console.log(`${f}: ${miss.join(' | ')}`); }
  }
  if (bad) { console.log(`\n${bad} page(s) show figures not found in contents.md`); process.exit(1); }
  console.log('check-facts: every figure on every page is in contents.md');
}
