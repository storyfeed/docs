# Rendering

A renderer turns each node of the payload into a row. Every node carries its
own sentence, its entities, a glyph and the app's `data`, so one loop draws
every feed your app reads, and a verb you add later draws with no frontend
change.

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

::: headless
:::

## The Smallest Loop That Draws Something

Substitute the entity labels into `headline_template` and you have a row:

```blade
{{-- resources/views/feed.blade.php --}}
@foreach ($page['items'] as $node)
    <article>
        {{ strtr($node['headline_template'], [
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

## Linking the Entities

Each entity carries its own `url`, so a link needs no route knowledge:

```blade
{{-- resources/views/feed.blade.php --}}
@php
    $entity = fn (?array $e, string $fallback) => $e === null
        ? e($fallback)
        : ($e['url']
            ? '<a href="'.e($e['url']).'">'.e($e['label'] ?? $fallback).'</a>'
            : e($e['label'] ?? $fallback));
@endphp

{!! strtr($node['headline_template'], [
    ':actor' => $entity($node['actor'], 'Someone'),
    ':object' => $entity($node['object'], 'Something'),
    ':target' => $entity($node['target'], 'Something'),
]) !!}
```

<FeedExample :items="[one]" />

## What a Glyph Means

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

## Degraded Entities

An entity whose snapshot has not been written yet arrives with `label: null`
and `url: null`. A null **actor** means the actor is unknown. The activity is
still in the feed:

<FeedExample :items="[degraded]" />

The fallbacks in the loop above cover both. "Someone" is the usual word for an
unknown actor.

## Groups

A group node has `kind: "group"` and a plural sentence. `:count` is the member
count, and a plural token draws the sample plus how many are not shown:

```blade
{{-- resources/views/feed.blade.php --}}
@php
    $list = function (array $node, string $role) use ($entity) {
        $shown = $node['sample'][$role] ?? [];
        $more = max(($node['distinct'][$role] ?? 0) - count($shown), 0);

        return implode(', ', array_map(fn ($e) => $entity($e, 'Something'), $shown))
            .($more ? " and {$more} more" : '');
    };
@endphp

{!! strtr($node['headline_template'], [
    ':actors' => $list($node, 'actors'),
    ':targets' => $list($node, 'targets'),
    ':count' => $node['count'],
]) !!}
```

<FeedExample :items="[grouped]" />

A group carries `node['actor']` only when it has exactly one actor. For a
**singular** token, take a name from the sample only when `distinct` says
there is one, and otherwise draw the plural list. An unconditional
`?? sample[0]` names one person over a group of nine.

## A Group With No Sentence

Some groups have no sentence: **both** `headline_template` and `headline` are
null. Draw the count:

```blade
{{-- resources/views/feed.blade.php --}}
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

## What the App Put in `data`

Beneath the sentence, a row can carry an utterance or a
[body](/basics/activity-content): a value in the app's own `data` with a known
body type. Find one by walking `data` for a `$body` key. Draw the body types
you recognise and **nothing** for the rest.

## Verifying Your Renderer

Render every node your feed produces and count the fallback strings:

```
fallback leaks ("Someone"/"Something"): 0
```

A leak means a token resolved to nothing, and it reads like an anonymous
actor rather than a bug. Run it across every read mode. Degraded entities are
the exception: they should render your placeholder.

