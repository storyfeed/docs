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

Use Storyfeed UI to render a feed in Blade, or build the custom Blade and Vue
components shown below.

::: headless
:::

<a id="using-storyfeed-ui"></a>

## Using Storyfeed UI

### Installing Storyfeed UI

```bash
composer require storyfeed/ui
```

Storyfeed UI uses Tailwind CSS v4 and its Typography plugin. Install the plugin:

```bash
npm install -D @tailwindcss/typography
```

Register the plugin and the package's views in your application's
`resources/css/app.css` file:

```css
@source "../../vendor/storyfeed/ui/resources/views";
@plugin "@tailwindcss/typography";
```

Compile your application's CSS with `npm run build`. Your layout must load
the compiled CSS, for example with `@vite('resources/css/app.css')`.

If your application does not use Tailwind, see [Building Your Own Components](#building-your-own).

### Rendering a Page

Pass the feed page to your view and render it with the `feed` component:

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function () {
    return view('feed', ['page' => Storyfeed::feed()->get()]);
});
```

```blade memo="resources/views/feed.blade.php"
<x-storyfeed::feed :page="$page" />
```

<FeedExample :items="[one, withKeyValue]" />

### Customizing the Views

To change the markup, publish the views:

```bash
php artisan vendor:publish --tag=storyfeed-views
```

The command publishes views to `resources/views/vendor/storyfeed`. Published
views override the package's views, so retain only those you customize.

### Customizing the Styles

The components use Tailwind's zinc palette for text, borders, and surfaces,
and indigo for links. To change these styles, publish the views and edit their
utility classes. You may also customize Tailwind's existing theme variables,
such as `--color-indigo-700` and `--color-indigo-300`, in your application's
`@theme` block. These changes apply to every component using those colours.
The kit defines no additional theme variables. ItemList, Prose, and Excerpt use the
Typography plugin's `prose` styles.

The components include `dark:` variants and follow your application's
[Tailwind dark mode configuration](https://tailwindcss.com/docs/dark-mode).

Prose bodies render Markdown and HTML with sanitization at render time. Plain
text, unknown media types, and verbatim content are escaped. Verbatim content
preserves whitespace inside a code block.

Icon intents are application-defined strings exposed through `data-sf-intent`.
To assign colours to your intent values, add the corresponding Tailwind
utilities to the published `components/glyph.blade.php` view.

<a id="building-your-own"></a>

## Building Your Own Components

The following examples build custom Blade components without styling. They
are your application's own anonymous components in
`resources/views/components/feed`, so Blade names them `<x-feed>`,
`<x-feed.item>`, and so on, separately from Storyfeed UI's
`<x-storyfeed::feed>`.

### Reading Feed Items

Iterating over a feed page returns each item as a `Storyfeed\Support\FeedItem`.
Use its methods to access the [payload](/reference/payload):

```blade memo="resources/views/feed.blade.php"
@foreach ($page as $item)
    {{ $item->headline() }}
    {{ $item->actor()?->label() }}
    {{ $item->publishedAt()->diffForHumans() }}
@endforeach
```

Echo `$item->headline()` to render the headline with linked entity labels.
Items also support array access, such as `$item['verb']`. The `$page->items()`
method on a `FeedPage` returns the underlying arrays. On a
`FeedPaginator`, it returns `FeedItem` instances; use `toArray()['items']`
for the payload arrays. See [FeedItem API](/reference/feed-item)
for all methods.

### Parts of a Row

| Part of a Row | Methods | Payload Fields |
|---|---|---|
| icon | `glyph()`, `intent()`, `actor()` | `glyph`, `glyph_intent`, `actor` |
| headline | `headline()` | `headline_template` or `headline`, the role keys |
| time | `publishedAt()` | `published_at` |
| quote | `thread()` | `thread` |
| media | `object()->media()` | `object.media` |
| body | `object()->bodies()` | an entity's `body` list |
| group images | `actors()`, `distinct('actors')` | a group's `sample`, `distinct` |
| group members | `children()`, `count()` | `children`, `count` |

Omit elements whose corresponding fields are empty.

### Displaying the Feed

Pass a paginator to the view. The `cursorPaginate` method retrieves the
current request's cursor for [subsequent pages](/basics/reading#pagination):

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function () {
    return view('feed', [
        'page' => Storyfeed::feed()->cursorPaginate(15)->withQueryString(),
    ]);
});
```

Render the feed with the `x-feed` component:

```blade memo="resources/views/feed.blade.php"
<x-feed :page="$page" />
```

<FeedExample :items="[grouped, complete, one]" />

#### The Feed Components

Create these anonymous Blade components in `resources/views/components/feed`:

| Component | File | Renders |
|---|---|---|
| `<x-feed>` | `feed.blade.php` | the feed and pagination link |
| `<x-feed.item>` | `item.blade.php` | an activity or group |
| `<x-feed.activity>` | `activity.blade.php` | an activity row |
| `<x-feed.group>` | `group.blade.php` | a group row and its members |
| `<x-feed.glyph>` | `glyph.blade.php` | the icon |
| `<x-feed.time>` | `time.blade.php` | the publication time |
| `<x-feed.body>` | `body.blade.php`, `body/key-value.blade.php`, … | a body using its type |
| `<x-feed.pager>` | `pager.blade.php` | the next-page link |

Blade renders `feed/feed.blade.php` as `<x-feed>` because the file name matches
its directory. See Laravel's
[anonymous index components](https://laravel.com/docs/13.x/blade#anonymous-index-components).

### Rendering Activities

<a id="rendering-a-headline"></a>

#### Headlines

To render a headline in Blade, echo the value returned by the `headline` method:

```blade
{{ $activity->headline() }}
```

<FeedExample expanded :items="[bare]" />

The headline replaces role tokens in `headline_template` with entity labels.
Entities with a `url` render as links with their attributes, such as `target`.
If the item contains a completed `headline`, that text is displayed. Other text
is escaped.

Use the `toString` method to return plain text for a page title or notification:

```blade
<title>{{ $activity->headline()->toString() }}</title>
```

<a id="linking-the-entities"></a>

#### Entity Links

Each role method returns a `Storyfeed\Support\Entity`, or `null` for an empty
role. Echo the entity to display its label, linked when it has a URL:

```blade
{{ $activity->object() }}
```

Use the `label`, `url`, and `type` methods to access individual values.

To customize entity markup, pass a closure to the `toHtml` method. It receives
each `Entity` and returns HTML. Escape values included in that HTML:

```blade
@use('Storyfeed\Support\Entity')

{!! $activity->headline()->toHtml(fn (Entity $entity) => '<strong>'.$entity->toHtml().'</strong>') !!}
```

#### Timestamps

The `publishedAt` method returns `published_at` as a `CarbonImmutable` instance:

```blade memo="resources/views/components/feed/time.blade.php"
@props(['at'])

<time datetime="{{ $at->toAtomString() }}" {{ $attributes }}>
    {{ $at->diffForHumans() }}
</time>
```

#### Icons and Intents {#glyphs-and-intents}

The `glyph` method returns the registered icon identifier, such as
`shopping-bag`. Provide a view for each icon and a fallback for unknown values:

```blade memo="resources/views/components/feed/glyph.blade.php"
@props(['glyph', 'intent' => null])

<span {{ $attributes->merge(['data-intent' => $intent]) }}>
    @includeFirst(["icons.{$glyph}", 'icons.activity'])
</span>
```

The `intent` method returns the application-defined value used to style the icon:

<FeedExample expanded :items="[complete, scene.order]" />

Define intent values with the verb's
[`intent` method](/basics/the-feed-file#adding-an-icon). Storyfeed provides no
default values or colours and does not validate these strings. Map values such
as `success`, `pending`, and `danger` to your CSS, for example with a
`[data-intent="success"]` selector.

If no intent is defined, the method returns `null` and the component omits
`data-intent`. Undefined colours leave the icon's default styling unchanged.

#### Activity Rows

Combine the icon, headline, and timestamp in the activity component:

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

Use the `isGroup` method to identify a [group](/basics/reading#groups).
The `children` method returns its members as feed items for the activity
component to render. See [Aggregation](/deeper/aggregation) for grouping rules
and headline tokens.

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

The `count` method returns the total member count. If `children` contains fewer
members, `childrenTruncated` returns `true`.

#### Plural Roles

Plural tokens such as `:actors` display the sampled entities and a count of the
remainder: "Ana, Ben, Cy and 2 more". A singular token such as `:actor` displays
one entity when all members share it, or the list otherwise. The `:count` token
displays the group's activity count.

<FeedExample :items="[grouped]" />

To render the sample as images, get the role's entities and total count:

```blade
@foreach ($group->actors() as $actor)
    <img src="{{ $actor->media()?->get('icon.src') }}" alt="{{ $actor->label() }}">
@endforeach

@if ($group->distinct('actors') > $group->actors()->count())
    +{{ $group->distinct('actors') - $group->actors()->count() }}
@endif
```

#### Groups Without Headlines

If neither a group headline nor the single-activity headline applies,
Storyfeed displays the count, such as "5 activities". The headline's
`isFallback` method returns `true`:

```blade memo="resources/views/components/feed/group.blade.php" at="<article>"
<div @class(['muted' => $group->headline()->isFallback()])>{{ $group->headline() }}</div>
```

<FeedExample :items="[unnamed]" />

#### Summary Rows {#digest-rows}

A [summary row](/basics/reading#summary) displays the actors followed by per-verb
phrases. The group component renders it without changes. To render each phrase
separately, use the `phrases` method. It returns feed items with their own
`headline` and `count` methods.

<a id="activity-data-and-bodies"></a>

### Rendering Content

<a id="activity-data"></a>

#### Quoted Text

Use the `thread` method to display recorded quoted text in the activity row:

```blade memo="resources/views/components/feed/activity.blade.php" at="<article>"
@if ($thread = $activity->thread())
    <blockquote>{{ $thread->text }}</blockquote>
@endif
```

<FeedExample :items="[withThread]" />

The `data` method returns values stored with the activity. Choose which values
to display.

#### Bodies

The `bodies` method returns an entity's structured content. Render the object's
bodies in the activity row:

```blade memo="resources/views/components/feed/activity.blade.php" at="<article>"
@foreach ($activity->object()?->bodies() ?? [] as $body)
    <x-feed.body :body="$body" />
@endforeach
```

Each body's `$body` field identifies its type, such as `Storyfeed/Body/KeyValue`.
The body component maps it to `feed.body.key-value` and renders it with
`<x-dynamic-component>`. Types without a matching component are skipped:

```blade memo="resources/views/components/feed/body.blade.php"
@props(['body'])

@php
    $component = 'feed.body.'.Str::kebab(class_basename($body['$body']));
@endphp

@if (view()->exists("components.{$component}"))
    <x-dynamic-component :component="$component" :body="$body" />
@endif
```

Add a component for each body type you render:

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

<figure {{ $attributes }}>
    <blockquote>{{ $body['text'] }}@if ($body['truncated'])…@endif</blockquote>

    @if ($body['from'])
        <figcaption>{{ $body['from'] }}</figcaption>
    @endif
</figure>
```

See [Activity Content](/basics/activity-content#available-body-types) for body
types and fields, or [Custom Body Types](/deeper/body) to define your own.

### Assembling the Feed

The item component selects the component matching the item's kind:

```blade memo="resources/views/components/feed/item.blade.php"
@props(['item'])

@if ($item->isActivity())
    <x-feed.activity :activity="$item" />
@elseif ($item->isGroup())
    <x-feed.group :group="$item" />
@endif
```

The feed component renders each item, followed by the pagination link:

```blade memo="resources/views/components/feed/feed.blade.php"
@props(['page'])

<div role="feed" {{ $attributes }}>
    @foreach ($page as $item)
        <x-feed.item :item="$item" />
    @endforeach
</div>

{{ $page->links() }}
```

Attributes such as `<x-feed :page="$page" class="…" />` are applied to the
feed's root element.

The `links` method renders Laravel's simple pagination view. You may customize
it through Laravel's pagination views. Feeds support forward pagination only;
the previous-page link is disabled and no links appear on the last page.

<a id="degraded-entities"></a>

### Handling Missing Values

An entity's `label` and `url` may be `null`. An anonymous activity has no
recorded actor and uses a placeholder in its headline:

<FeedExample :items="[degraded]" />

| Condition | Display | Check |
|---|---|---|
| an anonymous actor | `Someone` | `actor()` is `null` |
| a missing label | `Someone` for the actor, `Something` for another role | `isDegraded()` |
| a [deleted model](/deeper/deleted-models) | `a removed order`, `a former customer`, based on its former type | `isTombstone()`, `formerType()` |
| a group without a headline | `5 activities` | `headline()->isFallback()` |

An entity without a URL is displayed as plain text. For anonymous activities,
you may use a headline without an actor token.

Placeholders use Storyfeed's translation strings for the current locale.
Publish the language file to customize them:

```bash
php artisan vendor:publish --tag=storyfeed-translations
```

The command publishes `lang/vendor/storyfeed/en/feed.php`.

<a id="verifying-your-renderer"></a>

## Rendering With Vue

With Inertia, pass the feed to the page as a prop. Use the query string's cursor
to retrieve subsequent pages through the same route:

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

Render the feed with the `Feed` component:

```vue memo="resources/js/pages/Home.vue"
<script setup lang="ts">
import Feed from '../components/feed/Feed.vue'

defineProps<{ feed: Record<string, any> }>()
</script>

<template>
    <Feed :page="feed" />
</template>
```

Vue receives the payload as arrays. The `FeedHeadline` component separates the
template into text and entities. The `Feed` component retains loaded items and
retrieves the next page with a partial reload of the `feed` prop:

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

When `next_cursor` is `null`, the button is hidden. If `sync_token` changes,
`Feed` discards loaded items and retrieves the first page again. Render icons,
summary rows, quoted text, and bodies using components equivalent to the Blade
examples.
