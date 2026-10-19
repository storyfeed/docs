// The footer credit line, pinned to the brand's wording (teylabs/brand
// README): © names the legal owner, and "Tey Labs" opens teylabs.com in a new tab.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('the footer carries the brand credit line', () => {
  const config = readFileSync(new URL('../docs/.vitepress/config.ts', import.meta.url), 'utf8')
  const line = config.match(/copyright: `(.*)`,/)?.[1]

  assert.equal(
    line,
    '© ${new Date().getFullYear()} Tey Labs Inc. · Built by <a href="https://teylabs.com" target="_blank" rel="noopener">Tey Labs</a>.',
  )
})
