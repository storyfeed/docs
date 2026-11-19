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
