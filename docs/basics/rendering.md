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

## Payload Fields in a Row

| Part of a Row | Payload Fields | Holds |
|---|---|---|
| icon | `glyph`, `glyph_intent`, `actor` | the verb's icon and the actor's picture |
| headline | `headline_template` or `headline`, the role keys | the sentence, with entity labels substituted in |
| time | `published_at` | when the activity happened |
| quote | `thread` | what someone said, quoted on this activity |
| media | `object.media.preview`, `object.media.url` | the object's picture |
| body | an entity's `body` list | structured content, one [body type](/basics/activity-content) at a time |
| group pictures | a group's `sample`, `distinct` | a few members' pictures, and how many more there are |
| group members | `children`, `count` | the group's own activities, when a reader opens it |

A field with no value leaves its part out.

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
  "glyph": "square-check",
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

A [group](/basics/reading#groups) node has `kind: "group"` and a plural
sentence; [Aggregation](/deeper/aggregation) covers which activities group and
the tokens a group headline may use. `:count` is the member
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

A group fills a singular role, such as `actor`, only when every member shares
that one entity. For a
**singular** token, take a name from the sample only when `distinct` says
there is one, and otherwise draw the plural list. An unconditional
`?? sample[0]` names one person over a group of nine.

### Digest Rows

For `axis: "summary"`, name the actor once and join the per-verb phrases.
Using `$entity` and `$list` from the examples above:

```blade memo="resources/views/feed.blade.php"
@if ($node['axis'] === 'summary')
    {!! $node['actor'] ? $entity($node['actor'], 'Someone') : $list($node, 'actors') !!}
    @foreach ($node['phrases'] as $phrase)
        @php
            $tokens = [':count' => $phrase['count']];
            foreach (['actor', 'object', 'target', 'context', 'origin', 'result', 'instrument'] as $role) {
                $plural = $role.'s';
                $tokens[':'.$plural] = $list($phrase, $plural);
                $tokens[':'.$role] = ($phrase['distinct'][$plural] ?? 0) === 1
                    ? $entity($phrase['sample'][$plural][0] ?? null, 'Something')
                    : $list($phrase, $plural);
            }
        @endphp
        {!! strtr(e($phrase['headline_template'] ?? $phrase['headline'] ?? $phrase['verb'].' ('.$phrase['count'].')'), $tokens) !!}{{ $loop->last ? '' : ', ' }}
    @endforeach
    @if ($node['phrases_truncated'])
        and {{ $node['count'] - array_sum(array_column($node['phrases'], 'count')) }} more
    @endif
@endif
```

An authored row headline can use the group renderer above instead. For an
unknown `axis` value without a headline, fall back to “N activities”.

### Groups Without Headlines

Some groups have no sentence: **both** `headline_template` and `headline` are
null. After handling digest phrases, draw the count:

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
finished sentence for a headline written as a PHP closure, and is null when
the template is present.

<a id="activity-data-and-bodies"></a>

## Rendering Content

### Activity Data

An activity’s `data` contains values supplied when recording it. Your application decides which values to display. Quoted text is in `thread`; see [Activity Content](/basics/activity-content).

### Bodies

Structured entity content is in the entity’s `body` list. Each body identifies its type with `$body` and version with `$v`. Match the types your frontend supports; see [Activity Content](/basics/activity-content) and [Custom Body Types](/deeper/body).

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

With Inertia, pass the feed to the page as a prop. The route reads the cursor
from the query string, so the same route serves every page:

```php memo="routes/web.php"
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function (Request $request) {
    return Inertia::render('Home', [
        'feed' => Storyfeed::feed()->cursor($request->query('cursor'))->get(),
    ]);
});
```

The page keeps the nodes it has drawn, and asks for the next page with a
partial reload of the `feed` prop:

```vue memo="resources/js/pages/Home.vue"
<script setup lang="ts">
import { router } from '@inertiajs/vue3'
import { ref } from 'vue'

type FeedNode = Record<string, any>
type Feed = { items: FeedNode[]; next_cursor: string | null; sync_token: string | null }

const props = defineProps<{ feed: Feed }>()

const items = ref<FeedNode[]>([...props.feed.items])
const nextCursor = ref(props.feed.next_cursor)
const syncToken = props.feed.sync_token
const loading = ref(false)

const tokens = /:(actors|objects|targets|contexts|origins|results|instruments|actor|object|target|context|origin|result|instrument|count)\b/g

function headline(node: FeedNode): string {
    if (!node.headline_template) {
        return node.headline ?? `${node.count} activities`
    }

    return node.headline_template.replace(tokens, (_: string, name: string) => {
        if (name === 'count') {
            return String(node.count)
        }

        if (name.endsWith('s')) {
            const shown: FeedNode[] = node.sample?.[name] ?? []
            const more = (node.distinct?.[name] ?? 0) - shown.length

            return shown.map((e) => e.label ?? 'Something').join(', ')
                + (more > 0 ? ` and ${more} more` : '')
        }

        return node[name]?.label ?? (name === 'actor' ? 'Someone' : 'Something')
    })
}

function loadMore() {
    router.reload({
        only: ['feed'],
        data: { cursor: nextCursor.value },
        preserveUrl: true,
        onStart: () => (loading.value = true),
        onFinish: () => (loading.value = false),
        onSuccess: (page) => {
            const feed = page.props.feed as Feed

            if (feed.sync_token !== syncToken) {
                router.visit(window.location.pathname)   // earlier pages changed: start again

                return
            }

            items.value.push(...feed.items)
            nextCursor.value = feed.next_cursor
        },
    })
}
</script>

<template>
    <article v-for="node in items" :key="node.id">
        {{ headline(node) }}
        <time :datetime="node.published_at">
            {{ new Date(node.published_at).toLocaleString() }}
        </time>
    </article>

    <button v-if="nextCursor" :disabled="loading" @click="loadMore">
        Load more
    </button>
</template>
```

`headline()` follows the Blade examples above, with labels as plain text: the
sample and how many more for a plural token, and the count for a group with no
sentence. A `null` `next_cursor` hides the button. Digest phrases, links and
bodies are drawn as the sections above describe.
