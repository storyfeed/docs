// The UI reference check (scripts/ui-reference.mjs) on component source
// written the way each kit writes it. These run without the ui checkout; the
// build runs the real kits wherever they are present.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bladeComponent, vueComponent, reactComponents, check, unknownNames } from './ui-reference.mjs'

const blade = `{{-- A page's feed; the cursor's name isn't fixed. --}}
@props(['page' => null, 'cursorName' => 'cursor', 'dividers' => [], 'dividerStyle' => 'dot'])
<div>{{ $empty ?? 'Nothing' }} @if (isset($footer)) {{ $footer }} @endif {{ $slot }}</div>`

const vue = `<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        items?: FeedNode[];
        /** The kit's rail; see \`rail.ts\`. */
        rail?: Rail | RailName | null;
        onPick?: (id: string) => void;
        dividers?: Record<string, string>;
    }>(),
    { rail: null, dividers: () => ({}) },
);
const emit = defineEmits<{ loadMore: [] }>();
</script>
<template><slot name="empty">None</slot><slot name="time" :node="item" /></template>`

const react = `export interface NodeProps { rail?: RailName; time?: (props: { node: FeedNode }) => ReactNode }
export interface StreamProps extends NodeProps { items?: FeedNode[]; dividerStyle?: 'dot' | 'branch' }
export default function FeedStream({ items, dividerStyle = 'dot', ...props }: StreamProps) { return null }
function Divider({ label }: { label: string }) { return null }`

test('reads Blade props, defaults and slots', () => {
    const component = bladeComponent(blade)
    assert.deepEqual([...component.props.keys()], ['page', 'cursorName', 'dividers', 'dividerStyle'])
    assert.equal(component.props.get('dividerStyle'), "'dot'")
    assert.deepEqual([...component.slots].sort(), ['default', 'empty', 'footer'])
})

test('reads Vue props, defaults, slots and events', () => {
    const component = vueComponent(vue)
    assert.deepEqual([...component.props.keys()], ['items', 'rail', 'onPick', 'dividers'])
    assert.equal(component.props.get('dividers'), '() => ({})')
    assert.deepEqual([...component.slots], ['empty', 'time'])
    assert.deepEqual([...component.events], ['loadMore'])
})

test('reads React props through extended interfaces', () => {
    const components = reactComponents(react, new Map([
        ['NodeProps', { members: ['rail', 'time'], parents: [] }],
        ['StreamProps', { members: ['items', 'dividerStyle'], parents: ['NodeProps'] }],
    ]))
    assert.deepEqual([...components.keys()], ['FeedStream'])
    assert.deepEqual([...components.get('FeedStream').props.keys()].sort(), ['dividerStyle', 'items', 'rail', 'time'])
    assert.equal(components.get('FeedStream').props.get('dividerStyle'), "'dot'")
})

const kit = {
    components: new Map([['<x-storyfeed::feed>', bladeComponent(blade)]]),
    renderers: new Set(['time']),
    seams: new Set(),
    name: (name) => name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
}

test('passes a page that documents what the kit has', () => {
    const page = `### \`<x-storyfeed::feed>\`

| Attribute | Default | Accepts |
|---|---|---|
| \`page\` | \`null\` | a page |
| \`cursor-name\` | \`'cursor'\` | a key |
| \`dividers\` | \`[]\` | labels |

| Slot | Replaces |
|---|---|
| \`empty\`, \`footer\` | text |

## Renderers

| Renderer | Receives |
|---|---|
| \`time\` | the item |
`
    assert.deepEqual(check(page, kit).failures, [])
})

test('fails a documented name the kit does not have, and a wrong default', () => {
    const page = `### \`<x-storyfeed::feed>\`

| Attribute | Default | Accepts |
|---|---|---|
| \`divider-style\` | \`'branch'\` | a style |
| \`spacing\` | \`null\` | a size |

| Slot | Replaces |
|---|---|
| \`header\` | text |

### \`<x-storyfeed::sidebar>\`

| Attribute | Accepts |
|---|---|
| \`page\` | a page |
`
    assert.deepEqual(check(page, kit, 'p').failures, [
        "p:5: <x-storyfeed::feed> divider-style defaults to 'dot', not 'branch'",
        'p:6: <x-storyfeed::feed> has no attribute spacing',
        'p:10: <x-storyfeed::feed> has no slot header',
        'p: <x-storyfeed::sidebar> is not a component in the kit',
    ])
})

test('ignores tables in code fences and tables of other kinds', () => {
    const page = `### \`<x-storyfeed::feed>\`

| Body Type | Component |
|---|---|
| \`Storyfeed/Body/Prose\` | \`<x-storyfeed::body.prose>\` |

\`\`\`md
| Attribute | Accepts |
|---|---|
| \`missing\` | nothing |
\`\`\`
`
    assert.deepEqual(check(page, kit).failures, [])
})

test('fails a CSS variable or seam the kits never mention', () => {
    const source = 'var(--sf-gap) FEED_LINK'
    assert.deepEqual(unknownNames('`--sf-gap`, `FEED_LINK`, `--sf-margin`, `FEED_THEME`', source, 'p'), [
        'p: --sf-margin is not in the kits',
        'p: FEED_THEME is not in the kits',
    ])
})
