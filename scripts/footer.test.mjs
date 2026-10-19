// The footer, pinned to the brand's two lines (teylabs/brand README):
// "Storyfeed", then the credit, whose "Tey Labs" opens teylabs.com in a new tab.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('the footer carries the brand lines', () => {
  const config = readFileSync(new URL('../docs/.vitepress/config.ts', import.meta.url), 'utf8')
  const line = config.match(/copyright: '(.*)',/)?.[1]

  assert.equal(
    line,
    'Storyfeed<br>Built by <a href="https://teylabs.com" target="_blank" rel="noopener">Tey Labs</a>.',
  )
})
