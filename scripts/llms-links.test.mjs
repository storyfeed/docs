// Runs after the build: every page llms.txt and llms-full.txt name must be a
// file the site serves. The .md copies once 404ed for weeks, unseen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'docs/.vitepress/dist';
const site = 'https://docs.storyfeed.dev';
const served = (url) => {
  const path = url.slice(site.length).split('#')[0];
  return [path, `${path}.html`, join(path, 'index.html')].some((p) => p !== '' && existsSync(join(dist, p)));
};
const links = (file) => [...readFileSync(join(dist, file), 'utf8').matchAll(/https:\/\/docs\.storyfeed\.dev[^\s)\]]*/g)].map((m) => m[0]);

for (const file of ['llms.txt', 'llms-full.txt']) {
  test(`every link in ${file} is served`, () => {
    const found = links(file);
    assert.ok(found.length > 50, `${file} has only ${found.length} links`);
    assert.deepEqual([...new Set(found.filter((url) => !served(url)))], []);
  });
}

test('a page\'s .md copy is its text, not the page\'s HTML', () => {
  const copy = readFileSync(join(dist, 'basics/retrieving-feeds.md'), 'utf8');
  assert.match(copy, /^# Retrieving Feeds/m);
  assert.doesNotMatch(copy, /<script setup>|<html/);
});
