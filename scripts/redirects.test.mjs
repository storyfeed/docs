import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { REDIRECTS, redirectPage } from '../docs/.vitepress/redirects.ts';

const page = (path) => existsSync(`docs${path.split('#')[0]}.md`);

test('every redirect lands on a page, in one hop', () => {
  for (const [from, to] of Object.entries(REDIRECTS)) {
    assert.ok(page(to), `${from} → ${to}: no such page`);
    assert.ok(!(to.split('#')[0] in REDIRECTS), `${from} → ${to} redirects again`);
  }
});

test('no page sits at an old URL', () => {
  for (const from of Object.keys(REDIRECTS)) assert.ok(!page(from), `${from} is still a page`);
});

test('the redirect page keeps the reader\'s anchor, else the target\'s', () => {
  const html = redirectPage('/deeper/aggregation#registering-a-group-headline', 'Aggregation');
  assert.match(html, /location\.replace\("\/deeper\/aggregation" \+ \(location\.hash \|\| "#registering-a-group-headline"\)\)/);
  assert.match(html, /<link rel="canonical" href="https:\/\/docs\.storyfeed\.dev\/deeper\/aggregation">/);
  assert.match(html, /content="0; url=\/deeper\/aggregation#registering-a-group-headline"/);
});
