import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

// Exercise the actual Vue templates, including the entity URL passed by FeedItem.
const server = await createServer({
  configFile: false,
  plugins: [vue()],
  server: { middlewareMode: true, watch: null },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
})
after(() => server.close())
const { default: FeedItem } = await server.ssrLoadModule('/docs/.vitepress/theme/feed/FeedItem.vue')
const render = (body, url = '/notices/1', data = {}) => renderToString(createSSRApp({
  render: () => h(FeedItem, { item: {
    kind: 'activity', id: 'test', published_at: '2026-09-26T12:00:00Z',
    actor: null, target: null, context: null, verb: 'publish', headline_template: null, headline: 'A notice was published', data,
    object: { type: 'notice', id: '1', label: 'Notice', url, body },
  } }),
})).then(html => html.replace(/<!--[\s\S]*?-->/g, ''))
const media = (subject, footnote) => ({ $body: 'Storyfeed/Body/MediaObject', $v: 1, subject, footnote })
const list = (items, more) => ({ $body: 'Storyfeed/Body/ItemList', $v: 1, items, more, totalItems: 5 })

test('MediaObject preserves a matching title and resolves null-href subject and footnote links', async () => {
  const html = await render([media({ label: 'Notice', href: null }, { label: 'Details', href: null })])
  assert.match(html, /href="\/notices\/1">Notice<\/a>/)
  assert.match(html, /href="\/notices\/1">Details<\/a>/)
})

test('MediaObject keeps explicit destinations and leaves strings and missing destinations unlinked', async () => {
  const html = await render([media({ label: 'Guide', href: '/guide' }, 'Credit')])
  assert.match(html, /href="\/guide">Guide<\/a>/)
  assert.doesNotMatch(html, /<a[^>]*>Credit<\/a>/)
  const plain = await render([media('Notice', { label: 'Credit', href: null })], null)
  assert.match(plain, /sf-media-object__subject[^>]*>Notice/)
  assert.doesNotMatch(plain, /<a\b/)
})

test('ItemList resolves item and more links without turning plain items into links', async () => {
  const html = await render([list([
    { label: 'This notice', href: null }, { label: 'Guide', href: '/guide' }, 'Plain item',
  ], { label: 'Notice', href: null })])
  assert.match(html, /href="\/notices\/1"[^>]*>This notice<\/a>/)
  assert.match(html, /href="\/guide"[^>]*>Guide<\/a>/)
  assert.match(html, /href="\/notices\/1"[^>]*>Notice<\/a>/)
  assert.doesNotMatch(html, /<a[^>]*>Plain item<\/a>/)
  assert.match(html, /2 more/)
})

test('ItemList renders labels without anchors when the owning entity has no URL', async () => {
  const html = await render([list([{ label: 'Item', href: null }], { label: 'Rest', href: null })], null)
  assert.match(html, /Item/)
  assert.match(html, /Rest/)
  assert.doesNotMatch(html, /<a\b/)
})

test('activity data does not borrow the object URL for an unattributed body', async () => {
  const html = await render([], '/notices/1', { notice: media({ label: 'Unattributed', href: null }, null) })
  assert.match(html, /Unattributed/)
  assert.doesNotMatch(html, /<a\b/)
})

test('FileAttachment and stored File tokens render the same file details', async () => {
  const body = { $body: 'Storyfeed/Body/FileAttachment', $v: 1, name: 'archive.zip', size: 512, mediaType: 'application/zip' }
  const current = await render([body])
  const stored = await render([{ ...body, $body: 'Storyfeed/Body/File' }])
  assert.equal(stored, current)
  assert.match(stored, /archive.zip/)
  assert.match(stored, /512 B/)
})

test('KeyValue upgrades stored placeholders and preserves explicit null over the default', async () => {
  for (const version of [1, 2]) {
    const key = version === 1 ? 'missing' : 'placeholder'
    const html = await render([{ $body: 'Storyfeed/Body/KeyValue', $v: version,
      [version === 1 ? 'missing' : 'defaultPlaceholder']: 'Unknown', items: [
        { key: 'Seat', value: null, [key]: 'Not seated' },
        { key: 'Silent', value: null, [key]: null },
        { key: 'Default', value: null },
        { key: 'Explicit null', value: null, missing: 'Old', placeholder: null },
      ] }])
    assert.match(html, /Not seated/)
    assert.match(html, /Unknown/)
    assert.doesNotMatch(html, /Silent|Explicit null|Old/)
  }
})

test('MediaObject renders stored attachments and current files with new-key precedence', async () => {
  for (const version of [1, 2]) {
    const html = await render([{ $body: 'Storyfeed/Body/MediaObject', $v: version,
      [version === 1 ? 'attachments' : 'files']: [{ href: '/old.pdf', name: 'Stored file' }] }])
    assert.match(html, /href="\/old.pdf"/)
    assert.match(html, /Stored file/)
  }
  const html = await render([{ $body: 'Storyfeed/Body/MediaObject', $v: 1,
    attachments: [{ href: '/old.pdf', name: 'Old' }], files: [] }])
  assert.doesNotMatch(html, /old.pdf/)
})

const prose = (content, mediaType, verbatim = false) => ({
  $body: 'Storyfeed/Body/Prose', $v: 1, title: 'System notes', content, mediaType, verbatim,
})

test('Prose renders Markdown and HTML while removing executable markup and unsafe links', async () => {
  const markdown = await render([prose('## Check\n\n**Ready**\n\n- First\n- Second', 'text/markdown')])
  assert.match(markdown, /<h2>Check<\/h2>/)
  assert.match(markdown, /<strong>Ready<\/strong>/)
  assert.match(markdown, /<li>First<\/li>/)
  const html = await render([prose('<p onclick="alert(1)"><strong>Ready</strong></p><script>alert(2)</script><img src=x onerror="alert(3)"><a href="javascript:alert(4)">Bad</a><a href="https://example.com">Good</a>', 'text/html')])
  assert.match(html, /<strong>Ready<\/strong>/)
  assert.match(html, /href="https:\/\/example.com"/)
  assert.doesNotMatch(html, /onclick|onerror|<script|<img|javascript:|alert\(/)
})

test('Prose preserves escaped source for verbatim, plain and unknown formats', async () => {
  for (const [format, verbatim] of [['text/html', true], ['text/markdown', true], ['text/plain', false], ['application/x-custom', false]]) {
    const html = await render([prose('<strong>literal</strong>\n  **source**', format, verbatim)])
    assert.match(html, /&lt;strong&gt;literal&lt;\/strong&gt;\n  \*\*source\*\*/)
    assert.doesNotMatch(html, /<strong>literal/)
    if (verbatim) assert.match(html, /<pre[^>]*tabindex="0"/)
    assert.match(html, /System notes/)
  }
})
