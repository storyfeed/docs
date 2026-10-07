import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
const server = await createServer({ configFile: false, plugins: [vue()], server: { middlewareMode: true, watch: null, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } })
after(() => server.close())
const base = '/docs/.vitepress/theme/feed'
const { formatTimestamp } = await server.ssrLoadModule(`${base}/timestamp.ts`)
const entity = (label) => ({ type: 'person', id: label, label, url: `/${label}`, media: null })
const item = { kind: 'activity', id: 'a', verb: 'posted', published_at: '2026-10-07T12:00:00Z', headline_template: ':actor posted', actor: entity('Ada'), object: null, target: null, context: null, instrument: entity('Claude') }
async function render(node, slot) {
 const { default: Component } = await server.ssrLoadModule(`${base}/${node.kind === 'group' ? 'FeedGroup' : 'FeedItem'}.vue`)
 return (await renderToString(createSSRApp({ render: () => h(Component, { item: node }, slot ? { time: () => slot } : undefined) }))).replace(/<!--[\s\S]*?-->/g, '')
}
for (const kind of ['activity', 'group']) {
 const node = kind === 'activity' ? item : { ...item, kind, count: 2, children: [], sample: { actors: [item.actor] }, distinct: { actors: 1 }, axis: 'actor' }
 test(`${kind} puts time after the headline and links leftover instrument`, async () => {
  const html = await render(node)
  assert.match(html, /class="sf-head">[\s\S]*?<\/div>\s*<div class="sf-meta"><time datetime=/)
  assert.doesNotMatch(html.match(/class="sf-head">([\s\S]*?)<\/div>/)[1], /<time/)
  assert.match(html, / · <span class="sf-meta__role">via <a[^>]*href="\/Claude"[^>]*>Claude<\/a>/)
  assert.match(html, /<time[^>]*title="[^"]+"/)
  assert.match(await render(node, 'October 2026'), /October 2026/)
 })
 test(`${kind} consumes singular instrument and context tokens`, async () => {
  const html = await render({ ...node, headline_template: ':actor posted via :instrument in :context', context: entity('Sprint') })
  assert.match(html, /Claude/)
  assert.doesNotMatch(html.split('class="sf-meta"')[1], /Claude|Sprint/)
 })
}
test('plural group roles join and preserve sample remainder without repetition', async () => {
 const node = { ...item, kind: 'group', instrument: null, count: 4, children: [], sample: { actors: [item.actor], instruments: [entity('Claude'), entity('Codex')] }, distinct: { actors: 1, instruments: 4 } }
 assert.match(await render(node), /Claude<\/a>, <a[^>]*>Codex<\/a> and 2 more/)
 const html = await render({ ...node, headline_template: ':instruments posted' })
 assert.match(html, /Claude/)
 assert.doesNotMatch(html.split('class="sf-meta"')[1], /Claude|Codex/)
})
test('digest consumes only displayed phrase tokens; redundant activity uses its missing grammar', async () => {
 const node = { ...item, kind: 'group', headline_template: null, count: 2, children: [], sample: { actors: [item.actor] }, distinct: { actors: 1 }, phrases: [{ verb: 'post', count: 2, headline_template: 'posted via :instrument', sample: { instruments: [item.instrument] }, distinct: { instruments: 1 } }] }
 assert.doesNotMatch((await render(node)).split('class="sf-meta"')[1], /Claude/)
 assert.match(await render({ ...item, headline_template: ':instrument posted', redundant: true, missing_headline_template: ':actor posted' }), /sf-meta__role">via /)
})
test('fixed role order, context never on the meta line, absent roles, and token boundaries', async () => {
 const html = await render({ ...item, headline_template: ':actor posted :instrumental', origin: entity('Backlog'), result: entity('Report'), context: entity('Sprint'), location: entity('Toronto'), generator: entity('Bot') })
 const meta = html.split('class="sf-meta"')[1]
 for (const [before, next] of [['Claude', 'Backlog'], ['Backlog', 'Report'], ['Report', 'Toronto'], ['Toronto', 'Bot']]) assert.ok(meta.indexOf(before) < meta.indexOf(next))
 assert.doesNotMatch(meta, /Sprint/)
 assert.doesNotMatch((await render({ ...item, instrument: null })).split('class="sf-meta"')[1], /via /)
})
test('calendar ladder covers today, yesterday across midnight, this year, older and year boundary', () => {
 const now = new Date(2026, 9, 7, 15, 42).getTime()
 const format = (year, month, day, hour = 15) => formatTimestamp(new Date(year, month, day, hour, 42).toISOString(), now, 'en-US')
 assert.equal(format(2026, 9, 7, 13), '2 hours ago')
 assert.equal(format(2026, 9, 7), 'just now')
 assert.equal(format(2026, 9, 6), 'Yesterday, 3:42 PM')
 assert.equal(format(2026, 9, 5), 'Mon 5 Oct, 3:42 PM')
 assert.equal(format(2025, 9, 6), '6 Oct 2025, 3:42 PM')
 assert.equal(formatTimestamp(new Date(2025, 11, 31, 23, 59).toISOString(), new Date(2026, 0, 1, 0, 1).getTime(), 'en-US'), 'Yesterday, 11:59 PM')
})
