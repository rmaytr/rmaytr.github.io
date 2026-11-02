// Unit test for the CV helpers: node tests/cv.test.mjs (Node 23+ runs the .ts import directly)
import assert from 'node:assert/strict';
import { mdBullets, shortUrl } from '../src/data/cv.ts';
const body = `## The problem

Prose that is not a bullet.
- A constraint, part of the brief, not something done.

## What I built

- Built a **thing** with [a link](https://x.dev) and \`code\`.
1. **Step one:** does a part.
- (Teammate: did the other part.)
| a | b |
**Safety layer:** a bold-led paragraph.
<!-- TODO: a comment -->`;
assert.deepEqual(mdBullets(body), [
  'Built a **thing** with a link and code.',
  '**Step one:** does a part.',
  '**Safety layer:** a bold-led paragraph.',
]);
assert.deepEqual(mdBullets('Only prose here.'), []);
assert.equal(shortUrl('https://www.azrussianrealtor.com/'), 'azrussianrealtor.com');
assert.equal(shortUrl('https://github.com/rmaytr/HackUAB'), 'github.com/rmaytr/HackUAB');
console.log('cv tests passed');
