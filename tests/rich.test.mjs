// Unit test for the inline emphasis helper: node tests/rich.test.mjs (Node 23+ runs the .ts import directly)
import assert from 'node:assert/strict';
import { rich, plain } from '../src/data/rich.ts';
assert.equal(rich('a **b** c'), 'a <strong>b</strong> c');
assert.equal(rich('==1 of 16== and **UAB**'), '<mark>1 of 16</mark> and <strong>UAB</strong>');
assert.equal(rich('<script>x</script> & "q"'), '&lt;script&gt;x&lt;/script&gt; &amp; &quot;q&quot;');
assert.equal(rich('**<b>**'), '<strong>&lt;b&gt;</strong>');
assert.equal(rich('no marks, 2 * 3 = 6'), 'no marks, 2 * 3 = 6');
assert.equal(plain('**a** ==b== c'), 'a b c');
console.log('rich tests passed');
