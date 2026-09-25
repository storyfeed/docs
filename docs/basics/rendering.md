# Rendering

<script setup>
import { who, where, orders, dishes, notes, activity, group, scenes } from '../.vitepress/theme/samples'

const at = '2026-08-14T14:30:00.000000Z'

const bare = { ...scenes.order, id: 'rn0', glyph: null }
const one = scenes.order

const grouped = group({ id: 'rn2', verb: 'place', axis: 'actors', count: 5, glyph: 'shopping-bag',
  published_at: at,
  headline_template: ':actors ordered from :target',
  actors: [who.regular, who.customer2, who.customer3, who.customer4], targets: [where.kitchen],
  objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 4, objects: 5, targets: 1 } })

const unnamed = group({ id: 'rn3', verb: 'note', axis: 'targets', count: 6, glyph: 'message-circle',
  published_at: '2026-08-14T14:10:00.000000Z',
  headline_template: null, headline: null,
  actors: [who.regular, who.customer2], targets: [],
  distinct: { actors: 2, targets: 0 } })

const complete = activity({ id: 'rn5', verb: 'complete', glyph: 'receipt',
  published_at: '2026-08-14T14:35:00.000000Z',
  headline_template: ':actor completed :object',
  actor: who.cook, object: orders.first })

const degraded = activity({ id: 'rn4', verb: 'place', glyph: 'shopping-bag',
  published_at: '2026-08-14T14:05:00.000000Z',
  headline_template: ':actor placed :object with :target',
  actor: null, object: { ...orders.second, label: null, url: null }, target: where.kitchen })
</script>

## Introduction

A renderer turns each node of the payload into a row. Every node carries its
headline fields, entities, glyph and the app's `data`. Your frontend chooses
how to display them.

::: headless
:::

## Rendering Activities

<a id="rendering-a-headline"></a>

### Headlines

This activity names three roles. Substitute their labels into its template:


```blade memo="resources/views/feed.blade.php"
{{-- This example draws the activity above; groups use the section below. --}}
@foreach ($page['items'] as $node)
    <article>
        {{ strtr($node['headline_template'] ?? $node['headline'] ?? '', [
            ':actor' => $node['actor']['label'] ?? 'Someone',
            ':object' => $node['object']['label'] ?? 'Something',
            ':target' => $node['target']['label'] ?? 'Something',
        ]) }}

        <time datetime="{{ $node['published_at'] }}">
            {{ \Carbon\Carbon::parse($node['published_at'])->diffForHumans() }}
        </time>
    </article>
@endforeach
```

<FeedExample expanded context :items="[bare]" />

<a id="linking-the-entities"></a>

### Entity Links

Each entity carries its own `url`, so a link needs no route knowledge:

```blade memo="resources/views/feed.blade.php"
@php
    $entity = fn (?array $e, string $fallback) => $e === null
        ? e($fallback)
        : ($e['url']
            ? '<a href="'.e($e['url']).'">'.e($e['label'] ?? $fallback).'</a>'
            : e($e['label'] ?? $fallback));
@endphp

{!! strtr(e($node['headline_template'] ?? $node['headline'] ?? ''), [
    ':actor' => $entity($node['actor'], 'Someone'),
    ':object' => $entity($node['object'], 'Something'),
    ':target' => $entity($node['target'], 'Something'),
]) !!}
```

<FeedExample :items="[one]" />

### Glyphs and Intents

The node's `glyph` is a token your app registered. Map it to your icon set,
with a fallback icon for a token you don't recognise. `glyph_intent` sits
beside it and says what the shape means:

```json
{
  "verb": "complete",
  "glyph": "receipt",
  "glyph_intent": "success"
}
```

<FeedExample :items="[complete, scenes.order]" />

The value is **your** string, from the verb's
[`intent()`](/basics/the-feed-file#adding-an-icon). Storyfeed ships no intents
and no colours, and validates nothing: `success`, `pending` and `danger` are
this example's words. Map them onto colours your frontend owns.

Most verbs have no intent. Their `glyph_intent` is `null`: draw the plain
glyph, as you would for an intent you have no colour for.

<a id="groups"></a>

## Rendering Groups

### Plural Roles

A group node has `kind: "group"` and a plural sentence. `:count` is the member
count, and a plural token draws the sample plus how many are not shown:

```blade memo="resources/views/feed.blade.php"
@php
    $list = function (array $node, string $role) use ($entity) {
        $shown = $node['sample'][$role] ?? [];
        $more = max(($node['distinct'][$role] ?? 0) - count($shown), 0);

        return implode(', ', array_map(fn ($e) => $entity($e, 'Something'), $shown))
            .($more ? " and {$more} more" : '');
    };
@endphp

{!! strtr(e($node['headline_template'] ?? $node['headline'] ?? ''), [
    ':actor' => $entity($node['actor'], 'Someone'),
    ':target' => $entity($node['target'], 'Something'),
    ':actors' => $list($node, 'actors'),
    ':targets' => $list($node, 'targets'),
    ':count' => $node['count'],
]) !!}
```

<FeedExample :items="[grouped]" />

A group fills a singular role only when the grouping axis fixes that role and the
group has exactly one entity in it. For a
**singular** token, take a name from the sample only when `distinct` says
there is one, and otherwise draw the plural list. An unconditional
`?? sample[0]` names one person over a group of nine.

### Groups Without Headlines

Some groups have no sentence: **both** `headline_template` and `headline` are
null. Draw the count:

```blade memo="resources/views/feed.blade.php"
@if ($node['headline_template'])
    {{-- the sentence, as above --}}
@elseif ($node['headline'])
    {{ $node['headline'] }}
@else
    {{ $node['count'] }} activities
@endif
```

<FeedExample :items="[unnamed]" />

Don't assemble prose from the node's entities: a branch written for single
activities names one actor over a many-actor group. `headline` is the
pre-rendered sentence for grammar written as a PHP closure, and is null when
the template is present.

<a id="activity-data-and-bodies"></a>

## Rendering Content

### Activity Data

An activity’s `data` contains values supplied when recording it. Your application decides which values to display. Quoted text is in `thread`; see [Activity Content](/basics/activity-content).

### Bodies

Structured entity content is in the entity’s `body` list. Each body identifies its type with `$body` and version with `$v`. Match the types your frontend supports; see [Activity Body Content](/deeper/body).

<a id="degraded-entities"></a>

## Handling Missing Values

An entity whose snapshot has not been written yet arrives with `label: null`
and `url: null`. A null **actor** means the actor is unknown. The activity is
still in the feed:

<FeedExample :items="[degraded]" />

The example uses placeholders for missing labels. For an unknown actor, a
headline without an actor token can describe the activity directly.

<a id="verifying-your-renderer"></a>

The headline example above uses `Someone` and `Something` when a label is missing. Apply a fallback where you read a nullable value. See [Testing](/deeper/testing) for testing activity publication.
