import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync(new URL('../docs/maintenance/updating-dependencies.md', import.meta.url), 'utf8')
const section = page.split('## Run Core\'s New Migrations')[1] ?? ''

test('the upgrade guide lists each schema release with its migrations', () => {
  for (const [release, migration] of [
    ['v0.17', 'add_time_range_to_feed_activities_table'],
    ['v0.18', 'change_feed_references_to_strings'],
    ['v0.19', 'add_featured_to_feed_activities_table'],
    ['v0.20.6', 'add_keep_latest_index_to_feed_activities_table'],
    ['v0.24', 'add_bindings_to_feed_activities_table'],
  ]) {
    assert.match(section, new RegExp(`\\| ${release.replace(/\./g, '\\.')} \\|[^\\n]*${migration}`))
  }
})

test('the upgrade guide publishes, migrates and checks with the doctor', () => {
  for (const step of ['vendor:publish --tag=storyfeed-migrations', 'php artisan migrate', 'php artisan storyfeed:doctor']) {
    assert.ok(section.includes(step), step)
  }
})

test('the payload contract documents page() and the per-read inline overrides', () => {
  const contract = readFileSync(new URL('../docs/reference/payload-contract.md', import.meta.url), 'utf8')
  for (const term of ['page()', 'Storyfeed\\FeedResult', 'inlineEntities(bool)', 'inlineMedia(bool)']) {
    assert.ok(contract.includes(term), term)
  }
})

test('recording docs lead with domain events and warn off business listeners', () => {
  const read = (p) => readFileSync(new URL(`../docs/${p}`, import.meta.url), 'utf8')
  for (const p of ['cookbook/choosing-when-to-publish.md', 'recording/publishing-from-events.md', 'basics/recording-activities.md']) {
    const intro = read(p).split('## Introduction')[1].split('\n## ')[0]
    assert.match(intro, /side\s+effect,\s+never\s+the\s+source[\s\S]*PublishesToFeed/, p)
  }
  for (const p of ['recording/publishing-from-events.md', 'reference/storage-architecture.md']) {
    assert.match(read(p), /> \[!WARNING\]\n> Never put business logic[\s\S]*?recording is off[\s\S]*?Storyfeed::fake\(\)[\s\S]*?idempotent duplicate/, p)
  }
  const config = read('.vitepress/config.ts')
  const recording = config.split("text: 'Recording in Depth'")[1]
  assert.match(recording, /^[\s\S]*?items: \[\s*\{ text: 'Choosing When to Publish'/)
})

test('adoption notes: listener order, deletions without SerializesModels, owner role for migrations', () => {
  const read = (p) => readFileSync(new URL(`../docs/${p}`, import.meta.url), 'utf8')
  const events = read('recording/publishing-from-events.md')
  assert.match(events, /must not use `SerializesModels`/)
  assert.match(events, /registered on the `PublishesToFeed` interface/)
  assert.match(section, /role that owns the Storyfeed tables[\s\S]*must be owner of table/)
})
