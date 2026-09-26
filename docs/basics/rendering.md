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

Storyfeed draws nothing itself: a page of the feed is data, and your frontend
renders it. For Blade, Storyfeed UI renders a page with one component, and its
views are yours to publish and change. To draw rows your own way, the rest of
this page builds the same components from scratch.

::: headless
:::

<a id="using-storyfeed-ui"></a>

## Using Storyfeed UI

### Installing Storyfeed UI

```bash
composer require storyfeed/ui
```

### Rendering a Page

Pass a page of the feed to your view, then render it with the `feed`
component. `@storyfeedStyles` adds the default look:

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function () {
    return view('feed', ['page' => Storyfeed::feed()->get()]);
});
```

```blade memo="resources/views/feed.blade.php"
@storyfeedStyles

<x-storyfeed::feed :page="$page" />
```

<FeedExample :items="[one, withKeyValue]" />

### Customizing the Views

To change the markup, publish the views:

```bash
php artisan vendor:publish --tag=storyfeed-views
```

They land in `resources/views/vendor/storyfeed`. A view there replaces the
package's, so you only keep the files you change.

### Styling the Feed

`@storyfeedStyles` inlines the stylesheet, so there's no build step. Set its
colors on an ancestor of the feed:

```css
.sf-feed {
    --sf-text-color: #111827;
    --sf-muted-color: #4b5563;
    --sf-line-color: #e5e7eb;
}
```

To serve or bundle the stylesheet yourself, publish it to
`public/vendor/storyfeed/storyfeed.css`:

```bash
php artisan vendor:publish --tag=storyfeed-assets
```

<a id="building-your-own"></a>

## Building Your Own Components

The rest of this page builds the same kind of components from scratch, for an
app that wants full control of its rows. The components carry no styling, so
they fit any design.

### Reading Feed Items

Looping over a page of the feed gives you each item as a
`Storyfeed\Support\FeedItem`. It reads the item's
[payload](/reference/payload) through named methods:

```blade memo="resources/views/feed.blade.php"
@foreach ($page as $item)
    {{ $item->headline() }}
    {{ $item->actor()?->label() }}
    {{ $item->publishedAt()->diffForHumans() }}
@endforeach
```

Echoing `$item->headline()` draws the sentence, with each entity's label as
a link to its `url`. The item also reads as the array it wraps, so
`$item['verb']` works, and `$page->items()` still returns the arrays.
[FeedItem API](/reference/feed-item) lists every method.

### Parts of a Row

| Part of a Row | Read With | Payload Fields |
|---|---|---|
| icon | `glyph()`, `intent()`, `actor()` | `glyph`, `glyph_intent`, `actor` |
| headline | `headline()` | `headline_template` or `headline`, the role keys |
| time | `publishedAt()` | `published_at` |
| quote | `thread()` | `thread` |
| media | `object()->media()` | `object.media` |
| body | `object()->bodies()` | an entity's `body` list |
| group pictures | `actors()`, `distinct('actors')` | a group's `sample`, `distinct` |
| group members | `children()`, `count()` | `children`, `count` |

A field with no value leaves its part out.

### Displaying the Feed

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

#### The Feed Components

`<x-feed>` is built from these anonymous components, in
`resources/views/components/feed`:

| Component | File | Draws |
|---|---|---|
| `<x-feed>` | `feed.blade.php` | the feed, and a link to older activity |
| `<x-feed.item>` | `item.blade.php` | one item, as an activity or a group |
| `<x-feed.activity>` | `activity.blade.php` | an activity row |
| `<x-feed.group>` | `group.blade.php` | a group row and its members |
| `<x-feed.glyph>` | `glyph.blade.php` | the icon |
| `<x-feed.time>` | `time.blade.php` | when it happened |
| `<x-feed.body>` | `body.blade.php`, `body/key-value.blade.php`, … | one body, by its type |
| `<x-feed.pager>` | `pager.blade.php` | the link to the next page |

`feed/feed.blade.php` renders as `<x-feed>`: Blade treats a file named after
its directory as that directory's
[root component](https://laravel.com/docs/13.x/blade#anonymous-index-components).
The sections below build the components, smallest first.

### Rendering Activities

<a id="rendering-a-headline"></a>

#### Headlines

`headline()` reads the item's sentence. Echo it:

```blade
{{ $activity->headline() }}
```

<FeedExample expanded :items="[bare]" />

The headline replaces each token in `headline_template`, such as `:actor`,
with that entity's label. An entity with a `url` becomes a link carrying the
entity's own attributes, such as `target`. An item with a finished `headline`
reads as that text. Everything else is escaped.

`toString()` reads the same sentence as plain text, for a page title or a
notification:

```blade
<title>{{ $activity->headline()->toString() }}</title>
```

<a id="linking-the-entities"></a>

#### Entity Links

Each role reads as a `Storyfeed\Support\Entity`, or `null` when the role is
empty. Echoing an entity draws its label, linked when it has a `url`:

```blade
{{ $activity->object() }}
```

Its parts are methods too, such as `label()`, `url()` and `type()`.

To draw the headline's entities your own way, pass a closure to `toHtml()`.
It receives each `Entity` and returns HTML, so escape what you print:

```blade
@use('Storyfeed\Support\Entity')

{!! $activity->headline()->toHtml(fn (Entity $entity) => '<strong>'.$entity->toHtml().'</strong>') !!}
```

#### Timestamps

`publishedAt()` reads `published_at` as a `CarbonImmutable`:

```blade memo="resources/views/components/feed/time.blade.php"
@props(['at'])

<time datetime="{{ $at->toAtomString() }}" {{ $attributes }}>
    {{ $at->diffForHumans() }}
</time>
```

#### Glyphs and Intents

`glyph()` is a token your app registered, such as `shopping-bag`. Keep one
icon view per token, with a fallback for a token you have no icon for:

```blade memo="resources/views/components/feed/glyph.blade.php"
@props(['glyph', 'intent' => null])

<span {{ $attributes->merge(['data-intent' => $intent]) }}>
    @includeFirst(["icons.{$glyph}", 'icons.activity'])
</span>
```

`intent()` sits beside the glyph and says what the shape means:

<FeedExample expanded :items="[complete, scene.order]" />

The value is **your** string, from the verb's
[`intent()`](/basics/the-feed-file#adding-an-icon). Storyfeed ships no intents
and no colours, and validates nothing: `success`, `pending` and `danger` are
this example's words. Map them onto colours your frontend owns, for example
with a `[data-intent="success"]` selector.

Most verbs have no intent. Their `intent()` is `null`, so the component
leaves `data-intent` out and the plain glyph is drawn, as it is for an intent
you have no colour for.

#### Activity Rows

An activity row puts the three together:

```blade memo="resources/views/components/feed/activity.blade.php"
@props(['activity'])

<article {{ $attributes }}>
    <x-feed.glyph :glyph="$activity->glyph()" :intent="$activity->intent()" />
    <div>{{ $activity->headline() }}</div>
    <x-feed.time :at="$activity->publishedAt()" />
</article>
```

<FeedExample :items="[one]" />

<a id="groups"></a>

### Rendering Groups

#### Group Rows

A [group](/basics/reading#groups) has `isGroup()` true and a plural
sentence; [Aggregation](/deeper/aggregation) covers which activities group and
the tokens a group headline may use. `children()` reads its members as feed
items, so the activity component draws them:

```blade memo="resources/views/components/feed/group.blade.php"
@props(['group'])

<article {{ $attributes }}>
    <x-feed.glyph :glyph="$group->glyph()" :intent="$group->intent()" />
    <div>{{ $group->headline() }}</div>
    <x-feed.time :at="$group->publishedAt()" />

    <details>
        <summary>{{ $group->count() }} activities</summary>

        @foreach ($group->children() as $child)
            <x-feed.activity :activity="$child" />
        @endforeach
    </details>
</article>
```

`count()` is the true member total. `children()` can hold fewer, and
`childrenTruncated()` is then `true`.

#### Plural Roles

A plural token such as `:actors` reads as the group's sample of entities,
joined, with the rest as a number: "Ana, Ben, Cy and 2 more". A singular
token such as `:actor` names one entity only when every member shares it,
and otherwise reads as the list. `:count` reads as `count()`.

<FeedExample :items="[grouped]" />

To draw the sample yourself, such as a stack of pictures, read the role's
entities and its true total:

```blade
@foreach ($group->actors() as $actor)
    <img src="{{ $actor->media()?->get('icon.src') }}" alt="{{ $actor->label() }}">
@endforeach

@if ($group->distinct('actors') > $group->actors()->count())
    +{{ $group->distinct('actors') - $group->actors()->count() }}
@endif
```

#### Groups Without Headlines

A group has no sentence when its verb declares no group headline and its
members' own headline can't be reused for several activities. Its headline
then reads as its count, "5 activities", and `isFallback()` is `true`:

```blade memo="resources/views/components/feed/group.blade.php" at="<article>"
<div @class(['muted' => $group->headline()->isFallback()])>{{ $group->headline() }}</div>
```

<FeedExample :items="[unnamed]" />

#### Digest Rows

A [digest](/basics/reading#summary) row's headline names the person once and
joins the per-verb phrases after it, each phrase starting at its verb. The
group component draws it with no change.
To lay the phrases out yourself, `phrases()` reads each one as a feed item
with its own `headline()` and `count()`.

<a id="activity-data-and-bodies"></a>

### Rendering Content

<a id="activity-data"></a>

#### Quoted Text

An activity that quotes what someone said carries it in `thread()`. Draw it
in the activity row:

```blade memo="resources/views/components/feed/activity.blade.php" at="<article>"
@if ($thread = $activity->thread())
    <blockquote>{{ $thread->text }}</blockquote>
@endif
```

<FeedExample :items="[withThread]" />

`data()` holds the values supplied when recording the activity. Your
application decides which of them to display.

#### Bodies

`bodies()` reads an entity's structured content. Draw the object's bodies in
the activity row:

```blade memo="resources/views/components/feed/activity.blade.php" at="<article>"
@foreach ($activity->object()?->bodies() ?? [] as $body)
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

### Assembling the Feed

The item component chooses the row by kind:

```blade memo="resources/views/components/feed/item.blade.php"
@props(['item'])

@if ($item->isActivity())
    <x-feed.activity :activity="$item" />
@elseif ($item->isGroup())
    <x-feed.group :group="$item" />
@endif
```

The feed component draws every item on the page, then the pager:

```blade memo="resources/views/components/feed/feed.blade.php"
@props(['page'])

<div role="feed" {{ $attributes }}>
    @foreach ($page as $item)
        <x-feed.item :item="$item" />
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

### Handling Missing Values

An entity's `label` and `url` can be `null`. A null **actor** means the actor
is unknown. The activity is still in the feed, and its headline reads with a
placeholder:

<FeedExample :items="[degraded]" />

| The Entity | Reads As | Tell It With |
|---|---|---|
| a null actor | `Someone` | `actor()` is `null` |
| no label yet | `Someone` for the actor, `Something` for any other role | `isDegraded()` |
| a [deleted model](/deeper/deleted-models) | `a removed order`, `a former customer`, from its former type | `isTombstone()`, `formerType()` |
| a group with no headline | `5 activities` | `headline()->isFallback()` |

An entity with no `url` reads as plain text. For an unknown actor, a headline
without an actor token can describe the activity directly.

The words are Storyfeed's translation lines, read in the current locale.
Publish them to change them:

```bash
php artisan vendor:publish --tag=storyfeed-translations
```

The lines land in `lang/vendor/storyfeed/en/feed.php`.

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

The browser receives the payload's arrays, so the Vue components read the
fields themselves: `FeedHeadline` splits the template into text and entities,
as `headline()` does in PHP. `Feed` keeps the items it has drawn, and asks for
the next page with a partial reload of the `feed` prop:

::: code-group
```vue [Feed.vue] memo="resources/js/components/feed/Feed.vue"
<script setup lang="ts">
import { router } from '@inertiajs/vue3'
import { ref } from 'vue'
import FeedItem from './FeedItem.vue'

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
        <FeedItem v-for="item in items" :key="item.id" :item="item" />
    </div>

    <button v-if="nextCursor" :disabled="loading" @click="loadMore">
        Older activity
    </button>
</template>
```

```vue [FeedItem.vue] memo="resources/js/components/feed/FeedItem.vue"
<script setup lang="ts">
import FeedActivity from './FeedActivity.vue'
import FeedGroup from './FeedGroup.vue'

defineProps<{ item: Record<string, any> }>()
</script>

<template>
    <FeedActivity v-if="item.kind === 'activity'" :activity="item" />
    <FeedGroup v-else-if="item.kind === 'group'" :group="item" />
</template>
```

```vue [FeedActivity.vue] memo="resources/js/components/feed/FeedActivity.vue"
<script setup lang="ts">
import FeedHeadline from './FeedHeadline.vue'

defineProps<{ activity: Record<string, any> }>()
</script>

<template>
    <article>
        <FeedHeadline :item="activity" />
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
        <FeedHeadline :item="group">{{ group.count }} activities</FeedHeadline>
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

const props = defineProps<{ item: Record<string, any> }>()

const roles = ['actor', 'object', 'target', 'context', 'origin', 'result', 'instrument']

const parts = computed(() =>
    (props.item.headline_template ?? '')
        .split(/(:[a-z]+)/)
        .filter(Boolean)
        .map((segment: string): Part => {
            const role = segment.slice(1).replace(/s$/, '')

            if (segment === ':count') {
                return { type: 'text', text: String(props.item.count) }
            }

            if (!segment.startsWith(':') || !roles.includes(role)) {
                return { type: 'text', text: segment }
            }

            const shown: Entity[] = props.item.sample?.[`${role}s`] ?? []
            const total: number = props.item.distinct?.[`${role}s`] ?? 1

            // One entity: an activity's own, or the only one a group holds.
            if (segment === `:${role}` && total <= 1) {
                return {
                    type: 'entity',
                    entity: props.item[role] ?? shown[0] ?? null,
                    fallback: role === 'actor' ? 'Someone' : 'Something',
                }
            }

            return { type: 'list', entities: shown, total }
        }),
)
</script>

<template>
    <div>
        <template v-if="item.headline_template">
            <template v-for="(part, index) in parts" :key="index">
                <EntityLink v-if="part.type === 'entity'" :entity="part.entity" :fallback="part.fallback" />
                <EntityList v-else-if="part.type === 'list'" :entities="part.entities" :total="part.total" />
                <template v-else>{{ part.text }}</template>
            </template>
        </template>
        <template v-else-if="item.headline">{{ item.headline }}</template>
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
