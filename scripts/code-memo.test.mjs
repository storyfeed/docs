import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { createMarkdownRenderer } from 'vitepress';
import config from '../docs/.vitepress/config.ts';

const md = await createMarkdownRenderer(resolve('docs'), config.markdown);
const render = (source) => md.renderAsync(source, { path: resolve('docs/test.md') });
const block = (info, code = 'echo "hello";') => `\`\`\`${info}\n${code}\n\`\`\``;

test('memo is escaped literal text outside copied code, with language and highlights intact', async () => {
  const html = await render(block('php {1} memo="<b>& {{ value }} $& [context]"'));
  assert.match(html, /class="language-php sf-code-memo"/);
  assert.match(html, /class="sf-code-memo__bar" v-pre><span class="sf-code-memo__file">&lt;b&gt;&amp; \{\{ value \}\} \$&amp; \[context\]<\/span><\/div>/);
  assert.match(html, /class="line highlighted"/);
  // The actual VitePress handler copies button.nextElementSibling.nextElementSibling.
  assert.match(html, /<button[^>]*class="copy"><\/button><span class="lang">php<\/span><pre[^>]*>/);
  assert.doesNotMatch(html.match(/<pre[\s\S]*?<\/pre>/)[0], /value|context|memo/);
});

test('each tab keeps its label, active state and own memo', async () => {
  const html = await render(`::: code-group\n${block('php [First] memo="one [note]"')}\n${block('php memo="two" [Second]')}\n:::`);
  assert.match(html, /data-title="First"/);
  assert.match(html, /data-title="Second"/);
  assert.match(html, /language-php active sf-code-memo/);
  assert.equal((html.match(/sf-code-memo__bar/g) || []).length, 2);
});

test('imported snippets preserve code and support memo metadata', async () => {
  const html = await render('<<< @/snippets/publish-from-controller.php {php memo="app/Http/Controllers/OrderController.php"} [Controller]');
  assert.match(html, /sf-code-memo__bar/);
  assert.match(html, /OrderController/);
  assert.match(html, /namespace/);
});

test('at="…" draws the placement on the right of the memo, outside copied code', async () => {
  const html = await render(block('php memo="app/Providers/AppServiceProvider.php" at="boot()"'));
  assert.match(html, /<span class="sf-code-memo__file">app\/Providers\/AppServiceProvider\.php<\/span><span class="sf-code-memo__at">boot\(\)<\/span><\/div>/);
  assert.doesNotMatch(html.match(/<pre[\s\S]*?<\/pre>/)[0], /boot/);
  for (const info of ['php at="boot()"', 'php memo="x" at=""', 'php memo="x" at="a" at="b"']) {
    await assert.rejects(() => render(block(info)), /at/i, info);
  }
});

test('plain fences are unchanged and malformed memos fail', async () => {
  assert.doesNotMatch(await render(block('php')), /sf-code-memo/);
  for (const info of ['php memo=""', 'php memo="   "', 'php memo="unfinished', 'php memo=unquoted', 'php memo="one" memo="two"']) {
    await assert.rejects(() => render(block(info)), /memo/i, info);
  }
});
