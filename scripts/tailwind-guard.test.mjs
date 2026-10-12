import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { scan, violations } from './tailwind-guard.mjs';

test('theme and components use Tailwind with exact reviewed exceptions', () => {
  assert.deepEqual(scan(), []);
});

test('rejects new CSS, style blocks and every style binding syntax', () => {
  for (const [file, source] of [
    ['new.css', ''], ['new.vue', '<STYLE scoped>p { color:red }</STYLE>'],
    ['new.vue', '<p style="color:red">'], ['new.vue', '<p :style="value">'],
    ['new.vue', '<p v-bind:style="value">'], ['new.tsx', '<p style={{color:"red"}}>'],
    ['new.vue', '{ style: value }'],
  ]) assert.notDeepEqual(violations(file, source), []);
});

test('exceptions accept CRLF but reject edits, additions, duplicates and removal', () => {
  const allowlist = JSON.parse(readFileSync(new URL('./tailwind-allowlist.json', import.meta.url)));
  for (const [file, entries] of Object.entries(allowlist)) {
    const source = readFileSync(file, 'utf8');
    assert.deepEqual(violations(file, source, allowlist), []);
    assert.deepEqual(violations(file, source.replaceAll('\n', '\r\n'), allowlist), []);
    assert.notDeepEqual(violations(file, source + '<p style="color:red">', allowlist), []);
    assert.notDeepEqual(violations(file, '', allowlist), []);
    if (file.endsWith('.css')) assert.notDeepEqual(violations(file, source + 'p { color:red }', allowlist), []);
    else for (const entry of entries) {
      assert.notDeepEqual(violations(file, source + entry.pattern, allowlist), []);
      assert.notDeepEqual(violations(file, source.replace(entry.pattern, entry.pattern.slice(0, -1) + 'CHANGED'), allowlist), []);
    }
  }
});
