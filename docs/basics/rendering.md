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
const content = scene.basics.activityContent
const withThread = { ...content.note,
  thread: { text: content.note.object.label, by: content.note.actor.label, kind: 'note', replies: null, truncated: false } }
const withKeyValue = { ...content.confirmed,
  object: { ...content.confirmed.object, body: [{ $body: 'Storyfeed/Body/KeyValue', $v: 1,
    title: content.confirmed.object.label, items: [
    { key: 'Pickup', value: '12:10 pm', verbatim: false, missing: null },
    { key: 'Items', value: '1', verbatim: false, missing: null },
    { key: 'Reference', value: content.confirmed.object.id, verbatim: true, missing: null },
    { key: 'Table', value: null, verbatim: false, missing: 'not seated' },
  ] }] } }
</script>

## Introduction

A feed page reads a page of the feed and draws each node as a row. On this
page you build that as Blade components: one tag in your view, and a small
component for each part of a row. The components carry no styling, so they
fit any design.

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

## Displaying the Feed

Pass a page of the feed to a view. The cursor in the query string selects
[later pages](/basics/reading#pagination):

```php memo="routes/web.php"
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function (Request $request) {
    return view('feed', [
        'page' => Storyfeed::feed()->cursor($request->query('cursor'))->get(),
    ]);
});
```

The view draws the whole feed with one tag:

```blade memo="resources/views/feed.blade.php"
<x-feed :page="$page" />
```

<FeedExample :items="[grouped, complete, one]" />

### The Feed Components

`<x-feed>` is built from these components. The Blade files live in
`resources/views/components/feed`. The two components with PHP logic are
classes in `app/View/Components/Feed`:

| Component | Files | Draws |
|---|---|---|
| `<x-feed>` | `feed.blade.php` | the feed, and a link to older activity |
| `<x-feed.node>` | `node.blade.php` | one node, as an activity or a group |
| `<x-feed.activity>` | `activity.blade.php` | an activity row |
| `<x-feed.group>` | `group.blade.php` | a group row and its members |
| `<x-feed.digest>` | `digest.blade.php` | a digest row's actor and phrases |
| `<x-feed.headline>` | `Headline.php`, `headline.blade.php` | the sentence |
| `<x-feed.entity-link>` | `EntityLink.php` | one entity, linked |
| `<x-feed.entity-list>` | `entity-list.blade.php` | several entities, and how many more |
| `<x-feed.glyph>` | `glyph.blade.php` | the icon |
| `<x-feed.time>` | `time.blade.php` | when it happened |
| `<x-feed.body>` | `body.blade.php`, `body/key-value.blade.php`, … | one body, by its type |
| `<x-feed.pager>` | `pager.blade.php` | the link to the next page |

`feed/feed.blade.php` renders as `<x-feed>`: Blade treats a file named after
its directory as that directory's
[root component](https://laravel.com/docs/13.x/blade#anonymous-index-components).
The sections below build the components, smallest first.

## Rendering Activities

<a id="linking-the-entities"></a>

### Entity Links

Each entity carries its own `label` and `url`, so a link needs no route
knowledge. Choosing a label for an entity that has none is PHP logic, so the
link is a class component. Generate it with an inline view:

```bash
php artisan make:component Feed/EntityLink --inline
```

```php memo="app/View/Components/Feed/EntityLink.php"
<?php

namespace App\View\Components\Feed;

use Illuminate\View\Component;

class EntityLink extends Component
{
    /**
     * Create a new component instance.
     *
     * @param  array<string, mixed>|null  $entity
     */
    public function __construct(
        public ?array $entity,
        public string $fallback = 'Something',
    ) {}

    /**
     * The entity's label, or what to draw when it has none.
     */
    public function label(): string
    {
        if ($tombstone = $this->entity['tombstone'] ?? null) {
            return $this->entity['label'] ?? 'a removed '.$tombstone['formerType'];
        }

        return $this->entity['label'] ?? $this->fallback;
    }

    /**
     * Get the view that represents the component.
     */
    public function render(): string
    {
        // Inline, so no newline follows the link: a comma after it stays against the name.
        return <<<'blade'
            <a {{ $attributes->merge(['href' => $entity['url'] ?? null, ...($entity['attributes'] ?? [])]) }}>{{ $label() }}</a>
            blade;
    }
}
```

The view calls `$label()`, as it can call any public method on its component.
`$attributes->merge()` adds the entity's own link attributes, such as
`target`, and leaves `href` out when the entity has no `url`. An `<a>` without
an `href` reads as plain text.

<a id="rendering-a-headline"></a>

### Headlines

`headline_template` is the headline with its tokens, such as `:actor`, still
in it. `headline` is a finished sentence with nothing to substitute. At most
one of the two is set.

The headline component splits the template into text and tokens, and draws
each token as an entity link. Generate it with a view:

```bash
php artisan make:component Feed/Headline
```

```php memo="app/View/Components/Feed/Headline.php"
<?php

namespace App\View\Components\Feed;

use Closure;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Str;
use Illuminate\View\Component;

class Headline extends Component
{
    /**
     * The roles a token can name.
     */
    protected const ROLES = ['actor', 'object', 'target', 'context', 'origin', 'result', 'instrument'];

    /**
     * Create a new component instance.
     *
     * @param  array<string, mixed>  $node
     */
    public function __construct(public array $node) {}

    /**
     * Split the headline template into text and the entities its tokens name.
     *
     * @return list<array<string, mixed>>
     */
    public function parts(): array
    {
        $segments = preg_split('/(:[a-z]+)/', $this->node['headline_template'], flags: PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);

        return array_map($this->part(...), $segments);
    }

    /**
     * Turn one segment of the template into a part.
     *
     * @return array<string, mixed>
     */
    protected function part(string $segment): array
    {
        $role = Str::singular(ltrim($segment, ':'));

        if (! str_starts_with($segment, ':') || ! in_array($role, self::ROLES)) {
            return ['type' => 'text', 'text' => $segment];
        }

        return [
            'type' => 'entity',
            'entity' => $this->node[$role] ?? null,
            'fallback' => $role === 'actor' ? 'Someone' : 'Something',
        ];
    }

    /**
     * Get the view that represents the component.
     */
    public function render(): View|Closure|string
    {
        return view('components.feed.headline');
    }
}
```

The view draws the parts. A node with a finished `headline` draws it as it
is, and a node with neither draws the component's slot:

```blade memo="resources/views/components/feed/headline.blade.php"
<div {{ $attributes }}>
    @if ($node['headline_template'])
        @foreach ($parts() as $part)
            @switch ($part['type'])
                @case ('entity')
                    <x-feed.entity-link :entity="$part['entity']" :fallback="$part['fallback']" />
                    @break
                @default
                    {{ $part['text'] }}
            @endswitch
        @endforeach
    @elseif ($node['headline'])
        {{ $node['headline'] }}
    @else
        {{ $slot }}
    @endif
</div>
```

<FeedExample expanded :items="[bare]" />

### Timestamps

`published_at` is an ISO 8601 string:

```blade memo="resources/views/components/feed/time.blade.php"
@props(['at'])

@use('Illuminate\Support\Carbon')

<time datetime="{{ $at }}" {{ $attributes }}>
    {{ Carbon::parse($at)->diffForHumans() }}
</time>
```

### Glyphs and Intents

The node's `glyph` is a token your app registered, such as `shopping-bag`.
Keep one icon view per token, with a fallback for a token you have no icon
for:

```blade memo="resources/views/components/feed/glyph.blade.php"
@props(['glyph', 'intent' => null])

<span {{ $attributes->merge(['data-intent' => $intent]) }}>
    @includeFirst(["icons.{$glyph}", 'icons.activity'])
</span>
```

`glyph_intent` sits beside the glyph and says what the shape means:

<FeedExample expanded :items="[complete, scene.order]" />

The value is **your** string, from the verb's
[`intent()`](/basics/the-feed-file#adding-an-icon). Storyfeed ships no intents
and no colours, and validates nothing: `success`, `pending` and `danger` are
this example's words. Map them onto colours your frontend owns, for example
with a `[data-intent="success"]` selector.

Most verbs have no intent. Their `glyph_intent` is `null`, so the component
leaves `data-intent` out and the plain glyph is drawn, as it is for an intent
you have no colour for.

### Activity Rows

An activity row puts the three together:

```blade memo="resources/views/components/feed/activity.blade.php"
@props(['activity'])

<article {{ $attributes }}>
    <x-feed.glyph :glyph="$activity['glyph']" :intent="$activity['glyph_intent']" />
    <x-feed.headline :node="$activity" />
    <x-feed.time :at="$activity['published_at']" />
</article>
```

<FeedExample :items="[one]" />

<a id="groups"></a>

## Rendering Groups

### Group Rows

A [group](/basics/reading#groups) node has `kind: "group"` and a plural
sentence; [Aggregation](/deeper/aggregation) covers which activities group and
the tokens a group headline may use. Its `children` are activity nodes, so
the activity component draws them:

```blade memo="resources/views/components/feed/group.blade.php"
@props(['group'])

<article {{ $attributes }}>
    <x-feed.glyph :glyph="$group['glyph']" :intent="$group['glyph_intent']" />
    <x-feed.headline :node="$group">{{ $group['count'] }} activities</x-feed.headline>
    <x-feed.time :at="$group['published_at']" />

    <details>
        <summary>{{ $group['count'] }} activities</summary>

        @foreach ($group['children'] as $child)
            <x-feed.activity :activity="$child" />
        @endforeach
    </details>
</article>
```

`count` is the true member total. `children` can hold fewer, and
`children_truncated` is then `true`.

### Plural Roles

`:count` is the member count, and a plural token such as `:actors` draws the
group's `sample` plus how many are not shown. The full `part()` method handles
both:

```php memo="app/View/Components/Feed/Headline.php" at="part()"
protected function part(string $segment): array
{
    $role = Str::singular(ltrim($segment, ':'));

    if ($segment === ':count') { // [!code highlight:3]
        return ['type' => 'text', 'text' => $this->node['count']];
    }

    if (! str_starts_with($segment, ':') || ! in_array($role, self::ROLES)) {
        return ['type' => 'text', 'text' => $segment];
    }

    $shown = $this->node['sample'][$role.'s'] ?? []; // [!code highlight:4]
    $total = $this->node['distinct'][$role.'s'] ?? 1;

    // One entity: an activity's own, or the only one a group holds.
    if ($segment === ':'.$role && $total <= 1) {
        return [
            'type' => 'entity',
            'entity' => $this->node[$role] ?? $shown[0] ?? null, // [!code highlight]
            'fallback' => $role === 'actor' ? 'Someone' : 'Something',
        ];
    }

    return ['type' => 'list', 'entities' => $shown, 'total' => $total]; // [!code highlight]
}
```

A group fills a singular role, such as `actor`, only when every member shares
that one entity. So a **singular** token takes a name from the sample only
when `distinct` says there is one, and otherwise draws the plural list. An
unconditional `$shown[0]` names one person over a group of nine.

The list component joins the names and adds the rest as a number:

```blade memo="resources/views/components/feed/entity-list.blade.php"
@props(['entities', 'total'])

@foreach ($entities as $entity)
    <x-feed.entity-link :entity="$entity" />@if (! $loop->last), @endif
@endforeach

@if ($total > count($entities))
    and {{ $total - count($entities) }} more
@endif
```

Add a case for it to the headline view:

```blade memo="resources/views/components/feed/headline.blade.php" at="@switch"
@case ('list')
    <x-feed.entity-list :entities="$part['entities']" :total="$part['total']" />
    @break
```

<FeedExample :items="[grouped]" />

### Groups Without Headlines

A group has no sentence when its verb declares no group headline and its
members' own headline can't be reused for several activities. **Both**
`headline_template` and `headline` are then null, and the headline draws its
slot, the count:

```blade memo="resources/views/components/feed/group.blade.php" at="<article>"
<x-feed.headline :node="$group">{{ $group['count'] }} activities</x-feed.headline>
```

<FeedExample :items="[unnamed]" />

Don't assemble prose from the node's entities: a branch written for single
activities names one actor over a many-actor group.

### Digest Rows

For `axis: "summary"`, name the actor once and list the per-verb phrases.
Each phrase has its own `headline_template`, `sample` and `distinct`, so the
headline component draws it:

```blade memo="resources/views/components/feed/digest.blade.php"
@props(['group'])

@if ($group['actor'])
    <x-feed.entity-link :entity="$group['actor']" fallback="Someone" />
@else
    <x-feed.entity-list :entities="$group['sample']['actors']" :total="$group['distinct']['actors']" />
@endif

<ul>
    @foreach ($group['phrases'] as $phrase)
        <li>
            <x-feed.headline :node="$phrase">{{ $phrase['verb'] }} ({{ $phrase['count'] }})</x-feed.headline>
        </li>
    @endforeach

    @if ($group['phrases_truncated'])
        <li>and {{ $group['count'] - array_sum(array_column($group['phrases'], 'count')) }} more</li>
    @endif
</ul>
```

The digest goes in the group headline's slot, so an authored row headline
still wins:

```blade memo="resources/views/components/feed/group.blade.php" at="<article>"
<x-feed.headline :node="$group">
    @if ($group['axis'] === 'summary')
        <x-feed.digest :group="$group" />
    @else
        {{ $group['count'] }} activities
    @endif
</x-feed.headline>
```

A group on any other `axis` without a headline falls back to the count.

<a id="activity-data-and-bodies"></a>

## Rendering Content

<a id="activity-data"></a>

### Quoted Text

An activity that quotes what someone said carries it in `thread`. Draw it in
the activity row:

```blade memo="resources/views/components/feed/activity.blade.php" at="<article>"
@if ($activity['thread'])
    <blockquote>{{ $activity['thread']['text'] }}</blockquote>
@endif
```

<FeedExample :items="[withThread]" />

An activity's `data` holds the values supplied when recording it. Your
application decides which of them to display.

### Bodies

An entity's `body` list holds its structured content. Draw the object's
bodies in the activity row:

```blade memo="resources/views/components/feed/activity.blade.php" at="<article>"
@foreach ($activity['object']['body'] ?? [] as $body)
    <x-feed.body :body="$body" />
@endforeach
```

Each body names its type in `$body`, such as `Storyfeed/Body/KeyValue`. The
body component turns that into a component name, `feed.body.key-value`, and
draws it with `<x-dynamic-component>`. A type with no component of its own is
skipped:

```blade memo="resources/views/components/feed/body.blade.php"
@props(['body'])

@php
    $component = 'feed.body.'.Str::kebab(class_basename($body['$body']));
@endphp

@if (view()->exists("components.{$component}"))
    <x-dynamic-component :component="$component" :body="$body" />
@endif
```

Then add one component per body type you draw:

```blade memo="resources/views/components/feed/body/key-value.blade.php"
@props(['body'])

<dl {{ $attributes }}>
    @foreach ($body['items'] as $item)
        <dt>{{ $item['key'] }}</dt>
        <dd>{{ $item['value'] ?? $item['missing'] }}</dd>
    @endforeach
</dl>
```

<FeedExample :items="[withKeyValue]" />

```blade memo="resources/views/components/feed/body/excerpt.blade.php"
@props(['body'])

<blockquote {{ $attributes }}>{{ $body['text'] }}</blockquote>
```

[Activity Content](/basics/activity-content#available-body-types) lists every
body type and its keys, and [Custom Body Types](/deeper/body) covers writing
your own.

## Assembling the Feed

The node component chooses the row by `kind`. A node of any other kind draws
nothing:

```blade memo="resources/views/components/feed/node.blade.php"
@props(['node'])

@if ($node['kind'] === 'activity')
    <x-feed.activity :activity="$node" />
@elseif ($node['kind'] === 'group')
    <x-feed.group :group="$node" />
@endif
```

The feed component draws every node on the page, then the pager:

```blade memo="resources/views/components/feed/feed.blade.php"
@props(['page'])

<div role="feed" {{ $attributes }}>
    @foreach ($page->items() as $node)
        <x-feed.node :node="$node" />
    @endforeach
</div>

<x-feed.pager :cursor="$page->nextCursor()" />
```

Attributes on the tag, such as `<x-feed :page="$page" class="…" />`, land on
the feed's root element.

The pager links to the same URL with the next cursor. On the last page
`nextCursor()` is `null`, and there is no link:

```blade memo="resources/views/components/feed/pager.blade.php"
@props(['cursor'])

@if ($cursor)
    <nav {{ $attributes }}>
        <a href="{{ request()->fullUrlWithQuery(['cursor' => $cursor]) }}" rel="next">Older activity</a>
    </nav>
@endif
```

<a id="degraded-entities"></a>

## Handling Missing Values

An entity's `label` and `url` can be `null`. A null **actor** means the actor
is unknown. The activity is still in the feed:

<FeedExample :items="[degraded]" />

The [entity link](#entity-links) draws `Someone` for a missing actor and
`Something` for any other role, and a link with no `url` has no `href`. A
[deleted model](/deeper/deleted-models) reads as `a removed order`, from its
tombstone's `formerType`. For an unknown actor, a headline without an actor
token can describe the activity directly.

<a id="verifying-your-renderer"></a>

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

The page draws the feed with one component:

```vue memo="resources/js/pages/Home.vue"
<script setup lang="ts">
import Feed from '../components/feed/Feed.vue'

defineProps<{ feed: Record<string, any> }>()
</script>

<template>
    <Feed :page="feed" />
</template>
```

The components match the Blade ones. `Feed` keeps the nodes it has drawn, and
asks for the next page with a partial reload of the `feed` prop:

::: code-group
```vue [Feed.vue] memo="resources/js/components/feed/Feed.vue"
<script setup lang="ts">
import { router } from '@inertiajs/vue3'
import { ref } from 'vue'
import FeedNode from './FeedNode.vue'

type Page = { items: Record<string, any>[]; next_cursor: string | null; sync_token: string | null }

const props = defineProps<{ page: Page }>()

const items = ref([...props.page.items])
const nextCursor = ref(props.page.next_cursor)
const syncToken = props.page.sync_token
const loading = ref(false)

function loadMore() {
    router.reload({
        only: ['feed'],   // the page's prop
        data: { cursor: nextCursor.value },
        preserveUrl: true,
        onStart: () => (loading.value = true),
        onFinish: () => (loading.value = false),
        onSuccess: (response) => {
            const page = response.props.feed as Page

            if (page.sync_token !== syncToken) {
                router.visit(window.location.pathname)   // earlier pages changed: start again

                return
            }

            items.value.push(...page.items)
            nextCursor.value = page.next_cursor
        },
    })
}
</script>

<template>
    <div role="feed">
        <FeedNode v-for="node in items" :key="node.id" :node="node" />
    </div>

    <button v-if="nextCursor" :disabled="loading" @click="loadMore">
        Older activity
    </button>
</template>
```

```vue [FeedNode.vue] memo="resources/js/components/feed/FeedNode.vue"
<script setup lang="ts">
import FeedActivity from './FeedActivity.vue'
import FeedGroup from './FeedGroup.vue'

defineProps<{ node: Record<string, any> }>()
</script>

<template>
    <FeedActivity v-if="node.kind === 'activity'" :activity="node" />
    <FeedGroup v-else-if="node.kind === 'group'" :group="node" />
</template>
```

```vue [FeedActivity.vue] memo="resources/js/components/feed/FeedActivity.vue"
<script setup lang="ts">
import FeedHeadline from './FeedHeadline.vue'

defineProps<{ activity: Record<string, any> }>()
</script>

<template>
    <article>
        <FeedHeadline :node="activity" />
        <time :datetime="activity.published_at">
            {{ new Date(activity.published_at).toLocaleString() }}
        </time>
    </article>
</template>
```

```vue [FeedGroup.vue] memo="resources/js/components/feed/FeedGroup.vue"
<script setup lang="ts">
import FeedActivity from './FeedActivity.vue'
import FeedHeadline from './FeedHeadline.vue'

defineProps<{ group: Record<string, any> }>()
</script>

<template>
    <article>
        <FeedHeadline :node="group">{{ group.count }} activities</FeedHeadline>
        <time :datetime="group.published_at">
            {{ new Date(group.published_at).toLocaleString() }}
        </time>

        <details>
            <summary>{{ group.count }} activities</summary>
            <FeedActivity v-for="child in group.children" :key="child.id" :activity="child" />
        </details>
    </article>
</template>
```

```vue [FeedHeadline.vue] memo="resources/js/components/feed/FeedHeadline.vue"
<script setup lang="ts">
import { computed } from 'vue'
import EntityLink from './EntityLink.vue'
import EntityList from './EntityList.vue'

type Entity = Record<string, any>
type Part =
    | { type: 'text'; text: string }
    | { type: 'entity'; entity: Entity | null; fallback: string }
    | { type: 'list'; entities: Entity[]; total: number }

const props = defineProps<{ node: Record<string, any> }>()

const roles = ['actor', 'object', 'target', 'context', 'origin', 'result', 'instrument']

const parts = computed(() =>
    (props.node.headline_template ?? '')
        .split(/(:[a-z]+)/)
        .filter(Boolean)
        .map((segment: string): Part => {
            const role = segment.slice(1).replace(/s$/, '')

            if (segment === ':count') {
                return { type: 'text', text: String(props.node.count) }
            }

            if (!segment.startsWith(':') || !roles.includes(role)) {
                return { type: 'text', text: segment }
            }

            const shown: Entity[] = props.node.sample?.[`${role}s`] ?? []
            const total: number = props.node.distinct?.[`${role}s`] ?? 1

            // One entity: an activity's own, or the only one a group holds.
            if (segment === `:${role}` && total <= 1) {
                return {
                    type: 'entity',
                    entity: props.node[role] ?? shown[0] ?? null,
                    fallback: role === 'actor' ? 'Someone' : 'Something',
                }
            }

            return { type: 'list', entities: shown, total }
        }),
)
</script>

<template>
    <div>
        <template v-if="node.headline_template">
            <template v-for="(part, index) in parts" :key="index">
                <EntityLink v-if="part.type === 'entity'" :entity="part.entity" :fallback="part.fallback" />
                <EntityList v-else-if="part.type === 'list'" :entities="part.entities" :total="part.total" />
                <template v-else>{{ part.text }}</template>
            </template>
        </template>
        <template v-else-if="node.headline">{{ node.headline }}</template>
        <slot v-else />
    </div>
</template>
```

```vue [EntityList.vue] memo="resources/js/components/feed/EntityList.vue"
<script setup lang="ts">
import EntityLink from './EntityLink.vue'

defineProps<{ entities: Record<string, any>[]; total: number }>()
</script>

<template>
    <template v-for="(entity, index) in entities" :key="entity.id">
        <template v-if="index > 0">, </template>
        <EntityLink :entity="entity" />
    </template>
    <template v-if="total > entities.length"> and {{ total - entities.length }} more</template>
</template>
```

```vue [EntityLink.vue] memo="resources/js/components/feed/EntityLink.vue"
<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
    defineProps<{ entity: Record<string, any> | null; fallback?: string }>(),
    { fallback: 'Something' },
)

const label = computed(() => {
    const tombstone = props.entity?.tombstone

    return props.entity?.label ?? (tombstone ? `a removed ${tombstone.formerType}` : props.fallback)
})
</script>

<template>
    <a v-bind="entity?.attributes" :href="entity?.url ?? undefined">{{ label }}</a>
</template>
```
:::

A `null` `next_cursor` hides the button. When `sync_token` changes, earlier
pages were rewritten, so `Feed` starts again from the first page. Glyphs,
digest rows, quoted text and bodies follow the Blade components above, one
component each.
