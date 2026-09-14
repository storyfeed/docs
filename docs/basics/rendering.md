# Rendering

Every node in the payload is self-describing: a sentence with the entities
already in it, a glyph, and whatever the app put in `data`. A renderer holds
no domain knowledge, so an activity type you add next year draws with no
frontend change. When you are done, one loop draws every feed your app reads.

<script setup>
import { who, where, orders, dishes, notes, activity, group, scenes } from '../.vitepress/theme/samples'

const at = '2026-08-14T14:30:00.000000Z'

const bare = { ...scenes.order, id: 'rn0', glyph: null }
const one = scenes.order

const grouped = group({ id: 'rn2', verb: 'placed', axis: 'actors', count: 5, glyph: 'shopping-bag',
  published_at: at,
  headline_template: ':actors placed :count orders with :target',
  actors: [who.regular, who.customer2, who.customer3, who.customer4], targets: [where.kitchen],
  objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 4, objects: 5, targets: 1 } })

const unnamed = group({ id: 'rn3', verb: 'noted', axis: 'targets', count: 6, glyph: 'message-circle',
  published_at: '2026-08-14T14:10:00.000000Z',
  headline_template: null, headline: null,
  actors: [who.regular, who.customer2], targets: [],
  distinct: { actors: 2, targets: 0 } })

const degraded = activity({ id: 'rn4', verb: 'placed', glyph: 'shopping-bag',
  published_at: '2026-08-14T14:05:00.000000Z',
  headline_template: ':actor placed :object with :target',
  actor: null, object: { ...orders.second, label: null, url: null }, target: where.kitchen })
</script>

::: headless it ships no renderer
The package ends at the payload, and drawing it is yours — which is what this
page is for. If you would rather not write one, `storyfeed/ui` draws these
nodes for Vue, Inertia and Blade, and `storyfeed/filament` is a Filament
plugin. Neither is required, and neither is documented here.
:::

## The Smallest Loop That Draws Something

A node's `headline_template` is a sentence with tokens where the entities go.
Substitute the entity labels and you have a row:

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

<FeedStream :items="[bare]" :grouped="false" />

That is a working feed. Everything below makes it better, one thing at a time.

## Linking the Entities

An entity carries its own `url`, minted at read time, so a link needs no route
knowledge:

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

<FeedStream :items="[one]" :grouped="false" />

The glyph on the node is a token your app registered. Map it to whatever icon
set you use; an unknown one falls back rather than failing.

## Degraded Entities

An entity whose snapshot has not been written yet arrives with `label: null`
and `url: null`. A null **actor** means the actor is genuinely unknown.
Neither withholds the activity:

<FeedStream :items="[degraded]" :grouped="false" />

That is what the fallbacks in the loop above are for. Give the unknown actor
your own word, conventionally "Someone".

## Groups

A group node says `kind: "group"` and carries a plural sentence. Its tokens
resolve differently: `:count` is the member count, and a plural token draws
the exemplars plus however many are not shown.

```blade
{{-- resources/views/feed.blade.php --}}
@php
    $list = function (array $node, string $role) use ($entity) {
        $shown = $node['exemplars'][$role] ?? [];
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

<FeedStream :items="[grouped]" :grouped="false" />

A **singular** token on a group is the one case worth care. A group carries
`node['actor']` only when the group really has one actor; otherwise the key is
absent, because there is no single answer. Recover one from the exemplars only
when `distinct` says there is exactly one, and otherwise draw the plural list,
which is true at every size. An unconditional `?? exemplars[0]` names one
person over a group of nine.

## A Group With No Sentence

Sometimes the server cannot summarise a group honestly, and **both**
`headline_template` and `headline` are null. That is information, not a gap:

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

<FeedStream :items="[unnamed]" :grouped="false" />

Draw the count, not prose assembled from the node's entities: a branch written
for single activities names one actor over a many-actor group. `headline` is
the pre-rendered fallback for grammar authored as a PHP closure; when the
template is present it is null, so support both and let the template win.

## What the App Put in `data`

Beneath the sentence, a row can carry an utterance or a
[detail](/basics/activity-content): a value in the app's own `data` with a
conventional form. A renderer finds one by walking `data` for a `$detail` key,
drawing the forms it recognises and **nothing** for the ones it does not.

That rule is what lets an app add a form without waiting for a renderer to
learn it, and it is the same rule the read path applies to an unknown verb.

## Verifying Your Renderer

Render every node your feed produces and count the fallback strings:

```
fallback leaks ("Someone"/"Something"): 0
```

A leak means a token resolved to nothing, and a headline containing "Someone"
reads well enough that the failure looks like an anonymous feed rather than a
bug. Run it across every read mode. Degraded entities are the exception: they
should render your placeholder.

## Feeds That Keep Moving

A static render is done. A feed that polls or accumulates pages needs three
more rules, because groups are not stable rows: a group of four becomes a
group of five with a new node id, and a client that merges a fresh head page
by id shows the same activities twice.

1. **Window rule.** A fresh head page supersedes accumulated nodes whose
   `published_at` falls inside the range it covers.
2. **Member identity.** Drop any accumulated node whose children a fresh node
   has claimed. `children` is capped by `grouping.children_limit`, so this is
   a strong signal rather than a total one.
3. **Sync token.** When the envelope's `sync_token` changes, settled history
   was rewritten: drop everything accumulated and refetch from the head.
   Equality compare only; `null` to non-null counts as a change.

All three are implemented in [Live Rendering](/basics/live-renderer).
