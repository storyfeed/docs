import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { parse } from '@vue/compiler-dom';
import { createMarkdownRenderer } from 'vitepress';
import config from '../docs/.vitepress/config.ts';

const md = await createMarkdownRenderer(resolve('docs'), config.markdown);
const render = (source) => md.renderAsync(source, { path: resolve('docs/test.md') });

// The text a reader sees once Vue has compiled the page's template.
const text = (node) => node.type === 2 ? node.content : (node.children ?? []).map(text).join('');

test('an example header keeps the space between two attributes', async () => {
  const html = await render('`rail="actor" child-rail="activity-only"`{attrs}');
  const code = parse(html).children[0].children.find((node) => node.tag === 'code');
  assert.equal(text(code), 'rail="actor" child-rail="activity-only"');
});

test('bound attributes keep their spaces too', async () => {
  const html = await render('`:interactive="false" :collapsed="true"`{attrs}');
  const code = parse(html).children[0].children.find((node) => node.tag === 'code');
  assert.equal(text(code), ':interactive="false" :collapsed="true"');
});

test('inline CSS keeps its spaces', async () => {
  const html = await render('`.sf-feed { --sf-gap: 2rem; }`{css}');
  const code = parse(html).children[0].children.find((node) => node.tag === 'code');
  assert.equal(text(code), '.sf-feed { --sf-gap: 2rem; }');
});
