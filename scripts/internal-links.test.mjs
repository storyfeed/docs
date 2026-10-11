// Every internal link must land on a page that exists. Pages move freely
// before v1 and the site keeps no redirects, so a moved page's old URL is a
// 404: the link has to follow the page. VitePress catches dead links in
// markdown; this also covers the sidebar, the nav and the theme's components.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const docs = 'docs';
const skip = new Set(['node_modules', 'dist', 'cache', 'llms', 'briefs', 'rnd', 'public']);

const walk = (dir, keep) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  if (skip.has(name)) return [];
  return statSync(path).isDirectory() ? walk(path, keep) : keep(path) ? [path] : [];
});

const pages = walk(docs, (p) => p.endsWith('.md') && !p.includes('.vitepress'));
const theme = walk(join(docs, '.vitepress/theme'), (p) => /\.(vue|ts|js)$/.test(p));
const sources = [...pages, ...theme, join(docs, '.vitepress/config.ts')];

// Markdown links, href attributes and sidebar/nav `link:` values that start at the root.
const patterns = [/\]\((\/[^)\s]*)\)/g, /href="(\/[^"]*)"/g, /link: '(\/[^']*)'/g];

const resolves = (url) => {
  const path = url.split(/[#?]/)[0].replace(/\/$/, '');
  if (path === '') return true;
  if (/\.[a-z0-9]+$/i.test(path)) return existsSync(join(docs, 'public', path)) || existsSync(join(docs, path));
  if (path.startsWith('/rnd/')) return true; // local-only R&D pages, never built
  return existsSync(join(docs, `${path}.md`)) || existsSync(join(docs, path, 'index.md'));
};

test('every internal link lands on a page that exists', () => {
  const dead = [];
  for (const file of sources) {
    const text = readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      for (const [, url] of text.matchAll(pattern)) {
        if (!resolves(url)) dead.push(`${relative('.', file)} → ${url}`);
      }
    }
  }
  assert.ok(pages.length > 60, `found only ${pages.length} pages`);
  assert.deepEqual(dead, []);
});
