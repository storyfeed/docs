# Rendering

<script setup>
import { scene, liveOf } from '../.vitepress/theme/world'

const bare = { ...scene.order, glyph: null }
const one = scene.order
const grouped = liveOf(scene.busyPlace)[0]
// Remove presentation fields to show the renderer's fallback, keeping real members.
const unnamed = { ...grouped, headline_template: null, headline: null }
const complete = scene.basics.feedFile.completed
const degraded = { ...scene.order, actor: null,
  object: { ...scene.order.object, label: null, url: null } }
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

<FeedExample expanded :items="[bare]" />

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

<FeedExample :items="[complete, scene.order]" />

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

## Rendering With Vue

With Inertia, pass the feed to the page as a prop,
`Inertia::render('Home', ['feed' => Storyfeed::feed()->get()])`, and the page
hands it to the app's own composable and stream component:

```vue memo="resources/js/Pages/Home.vue"
<script setup lang="ts">
import { usePoll } from '@inertiajs/vue3'
import { toRef } from 'vue'
import FeedStream from '@/feed/FeedStream.vue'   // the app's own component
import { useFeed } from '@/feed/useFeed'         // the app's own composable
import type { FeedPayload } from '@/feed/types'

const props = defineProps<{ feed: FeedPayload }>()

const { items, nextCursor, loadingMore, loadMore } = useFeed(
    toRef(() => props.feed),
    (cursor) => `/?cursor=${cursor}`,
)

usePoll(10_000, { only: ['feed'] })
</script>

<template>
    <FeedStream
        :items="items"
        :next-cursor="nextCursor"
        :loading-more="loadingMore"
        @load-more="loadMore"
    />
</template>
```

The composable holds the paging, the stream draws nodes, and the page supplies
the payload and the URL of the next page. None of it knows what an order is.
