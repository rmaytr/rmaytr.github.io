// Unit test for the fact checker: node tests/check-facts.test.mjs
import assert from 'node:assert/strict';
import { check } from '../scripts/check-facts.mjs';
const src = 'JavaScript ~1,060 KB → 58 KB, 60+ student course, 1 of 16 new Ambassadors, 76% smaller';
assert.deepEqual(check('JS 58 KB and 60+ students', src), []);
assert.deepEqual(check('1 of 16 Ambassadors, 76% smaller', src), []);
assert.deepEqual(check('JS 59 KB', src), ['59 KB']);
assert.deepEqual(check('1 of 24 Ambassadors', src), ['1 of 24']);
console.log('check-facts tests passed');
