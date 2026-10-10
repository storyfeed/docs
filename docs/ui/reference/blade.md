---
kit: blade
---

# Blade Components

Every component the Blade kit registers, with its attributes and slots.
Each one is an anonymous component in the `storyfeed::` namespace, so it
renders on its own as well as inside `<x-storyfeed::feed>`.

```blade
<x-storyfeed::feed :page="$page" rail="actor" />
```

Attributes not listed below, such as `class`, land on the component's root
element. Pass a value that isn't a string with a colon: `:grouped="false"`.

## The Feed

### `<x-storyfeed::feed>`

A page of the feed: day headings, each item, then a link to older activity.

| Attribute | Default | Accepts |
|---|---|---|
| `page` | `null` | any [page shape](/ui/reference/options#page-shapes): a collection, a paginator, a `FeedPage`, or their JSON decoded as an array |
| `items` | `null` | the items to draw, in place of `page` |
| `next-cursor` | `null` | the cursor for the pager when you pass `items`; a string or a `Cursor` |
| `cursor-name` | `'cursor'` | the query-string key the pager writes the cursor to |
| `grouped` | `true` | `false` hides the day headings |
| `rail` | `null` | a [rail](/ui/reference/options#rails); `null` draws `actor-only` |
| `child-rail` | `null` | the rail for expanded group members; `null` inherits the group's |
| `dividers` | `[]` | labels keyed by item id, drawn on the rail before those items |
| `divider-style` | `'dot'` | how a divider meets the rail: `dot` or `branch` |
| `interactive` | `true` | `false` draws groups without a disclosure control |
| `collapsed` | `null` | the initial group state; see [Group State](/ui/reference/options#group-state) |
| `timezone` | `null` | the zone for day headings, timestamps and time ranges; `null` uses the app's |
| `renderers` | `[]` | [renderer callbacks](#renderers) for every row and group member |

| Slot | Replaces |
|---|---|
| `empty` | the "No activity yet." text on an empty page |
| `footer` | the pager |

```blade
<x-storyfeed::feed :page="$page">
    <x-slot:empty>Nothing has happened yet.</x-slot:empty>
</x-storyfeed::feed>
```

### `<x-storyfeed::item>`

One item. It draws `<x-storyfeed::activity>` or `<x-storyfeed::group>`,
whichever the item is.

| Attribute | Default | Accepts |
|---|---|---|
| `item` | | a `FeedItem`, or a node as an array |
| `last` | `false` | `true` ends the rail at this row |
| `rail` | `null` | a [rail](/ui/reference/options#rails) |
| `child-rail` | `null` | the rail for a group's expanded members |
| `interactive` | `true` | `false` draws a group without a disclosure control |
| `collapsed` | `null` | a group's initial state |
| `timezone` | `null` | the display zone |
| `renderers` | `[]` | [renderer callbacks](#renderers) |

| Slot | Replaces |
|---|---|
| `default` | nothing; added to the row after its bodies |

### `<x-storyfeed::pager>`

The link to older activity: the current URL with the next cursor. It draws
nothing when the cursor is `null`.

| Attribute | Default | Accepts |
|---|---|---|
| `cursor` | | the encoded next cursor, or `null` |
| `name` | `'cursor'` | the query-string key |

### `<x-storyfeed::divider>`

A label on the rail, drawn like a day heading.

| Attribute | Default | Accepts |
|---|---|---|
| `label` | | the text |
| `divider-style` | `'dot'` | `dot` or `branch` |

## Rows

### `<x-storyfeed::activity>`

An activity row: rail, headline, meta line, bodies.

| Attribute | Default | Accepts |
|---|---|---|
| `activity` | | a `FeedItem`, or an activity node as an array |
| `last` | `false` | `true` ends the rail at this row |
| `dense` | `false` | `true` draws the compact row used for group members |
| `rail` | `null` | a [rail](/ui/reference/options#rails) |
| `timezone` | `null` | the display zone |
| `renderers` | `[]` | [renderer callbacks](#renderers) |
| `removed` | `null` | a line of text under the meta line, such as "This order was deleted." |

| Slot | Replaces |
|---|---|
| `default` | nothing; added after the `body` renderer, before the bodies |
| `time` | the timestamp |
| `annotations` | nothing; added at the end of the row |

### `<x-storyfeed::group>`

A group row: headline, meta line, the strip of member pictures and the
members behind a disclosure.

| Attribute | Default | Accepts |
|---|---|---|
| `group` | | a `FeedItem`, or a group node as an array |
| `last` | `false` | `true` ends the rail at this row |
| `rail` | `null` | a [rail](/ui/reference/options#rails) |
| `child-rail` | `null` | the rail for expanded members |
| `interactive` | `true` | `false` draws no disclosure control |
| `collapsed` | `null` | the initial state |
| `timezone` | `null` | the display zone |
| `renderers` | `[]` | [renderer callbacks](#renderers) |
| `removed` | `null` | a line of text under the meta line |
| `media-tiles` | `null` | the strip's tiles; `null` builds them from the members |
| `media-overflow` | `0` | the "+N" count when you pass `media-tiles` |

| Slot | Replaces |
|---|---|
| `default` | nothing; added after the `body` renderer |
| `time` | the timestamp |
| `annotations` | nothing; added before the strip |

### `<x-storyfeed::headline>`

A headline, each entity in it linked.

| Attribute | Default | Accepts |
|---|---|---|
| `headline` | | a `Storyfeed\Support\Headline` |

### `<x-storyfeed::meta>`

The line under a headline: the time, a time range and the roles the headline
does not name.

| Attribute | Default | Accepts |
|---|---|---|
| `item` | | a `FeedItem`, or a node as an array |
| `headline` | `null` | the headline the row draws; `null` reads the item's |
| `timezone` | `null` | the display zone |
| `time-renderer` | `null` | a callback that receives the `FeedItem` and returns the time's HTML |

| Slot | Replaces |
|---|---|
| `default` | the timestamp |

### `<x-storyfeed::time>`

When it happened: relative today, a date after that, the full time on hover.

| Attribute | Default | Accepts |
|---|---|---|
| `at` | | a `CarbonInterface`, or `null` to draw nothing |
| `timezone` | `null` | the display zone |
| `label` | `null` | text in place of the computed label |
| `title` | `null` | the hover text in place of the full time |

## The Rail

### `<x-storyfeed::rail>`

The column on the left of a row: the disc, its badge and the line to the
next row.

| Attribute | Default | Accepts |
|---|---|---|
| `item` | | a `FeedItem` |
| `rail` | `null` | a [rail](/ui/reference/options#rails) |
| `dense` | `false` | `true` drops the badge |
| `last` | `false` | `true` ends the line here |
| `renderers` | `[]` | the `glyph` and `avatar` [renderers](#renderers) |

### `<x-storyfeed::glyph>`

The activity's icon, in a disc or as a badge.

| Attribute | Default | Accepts |
|---|---|---|
| `glyph` | `null` | the payload's glyph token, such as `shopping-bag`; draws `icons/{token}`, else `icons/activity` |
| `intent` | `null` | your app's word, written to `data-sf-intent` |
| `variant` | `'disc'` | `disc` or `badge` |
| `renderer` | `null` | a callback that receives the token and variant and returns the icon's HTML |

### `<x-storyfeed::avatar>`

An entity's face: its `media.icon`, else its initials on its colour.

| Attribute | Default | Accepts |
|---|---|---|
| `entity` | | a `Storyfeed\Support\Entity` |
| `size` | `'md'` | `md`, `sm`, `pair`, `tile` or `badge` |

## Pictures

### `<x-storyfeed::media>`

One picture, its box reserved from its declared width and height.

| Attribute | Default | Accepts |
|---|---|---|
| `image` | | an image array: `src`, `alt`, `width`, `height` |
| `href` | `null` | a link around the picture |
| `link-attributes` | `[]` | attributes for that link; `href` and event handlers are dropped |
| `renderer` | `null` | the [`media` renderer](#renderers) |

### `<x-storyfeed::media-strip>`

A group's strip: one square tile per member, then a "+N" tile.

| Attribute | Default | Accepts |
|---|---|---|
| `tiles` | `[]` | tiles from `Storyfeed\Ui\Support\Strip::of($group)['tiles']`, or your own `{image, href}` arrays |
| `overflow` | `0` | the "+N" count |
| `renderer` | `null` | the [`media` renderer](#renderers) |
| `toggle` | `null` | `{expanded, controls, label}`: the "+N" tile opens and closes the element with id `controls` |

## Bodies

### `<x-storyfeed::body>`

One body, drawn by the component for its type. A type without a component
draws its `$fallback` line, or nothing.

| Attribute | Default | Accepts |
|---|---|---|
| `body` | | the body as an array, as it appears in the payload |
| `entity` | `null` | the entity the body belongs to |
| `renderer` | `null` | the [`form` renderer](#renderers) |
| `media-renderer` | `null` | the [`media` renderer](#renderers) |
| `file-labeller` | `null` | the [`fileLabel` renderer](#renderers) |

Each built-in body type has a component under `body.`:

| Body Type | Component |
|---|---|
| `Storyfeed/Body/CallToAction` | `<x-storyfeed::body.call-to-action>` |
| `Storyfeed/Body/Component` | `<x-storyfeed::body.component>` |
| `Storyfeed/Body/Excerpt` | `<x-storyfeed::body.excerpt>` |
| `Storyfeed/Body/FileAttachment`, `Storyfeed/Body/File` | `<x-storyfeed::body.file-attachment>` |
| `Storyfeed/Body/Image` | `<x-storyfeed::body.image>` |
| `Storyfeed/Body/ItemList` | `<x-storyfeed::body.item-list>` |
| `Storyfeed/Body/KeyValue` | `<x-storyfeed::body.key-value>` |
| `Storyfeed/Body/MediaObject` | `<x-storyfeed::body.media-object>` |
| `Storyfeed/Body/Prose` | `<x-storyfeed::body.prose>` |
| `Storyfeed/Body/Table` | `<x-storyfeed::body.table>` |

Any other type maps segment by segment: `Acme/Shipment` draws
`<x-storyfeed::body.acme.shipment>`, a view you add under
`resources/views/vendor/storyfeed/components/body/acme/shipment.blade.php`.

### `<x-storyfeed::body.call-to-action>`, `<x-storyfeed::body.component>`, `<x-storyfeed::body.excerpt>`, `<x-storyfeed::body.item-list>`, `<x-storyfeed::body.key-value>`, `<x-storyfeed::body.prose>`, `<x-storyfeed::body.table>`

| Attribute | Default | Accepts |
|---|---|---|
| `body` | | the body as an array |
| `entity` | `null` | the entity the body belongs to |

### `<x-storyfeed::body.file-attachment>`

| Attribute | Default | Accepts |
|---|---|---|
| `body` | | the body as an array |
| `entity` | `null` | the entity the body belongs to |
| `labeller` | `null` | a callback that receives `{name, mediaType}` and returns a label, or `null` for the built-in MIME labels |

### `<x-storyfeed::body.image>`

| Attribute | Default | Accepts |
|---|---|---|
| `body` | | the body as an array |
| `entity` | `null` | the entity whose media slot the body names |
| `media-renderer` | `null` | the [`media` renderer](#renderers) |

### `<x-storyfeed::body.media-object>`

| Attribute | Default | Accepts |
|---|---|---|
| `body` | | the body as an array |
| `entity` | `null` | the entity the body belongs to |
| `media-renderer` | `null` | the [`media` renderer](#renderers) |
| `image-placement` | `'beside'` | `beside` or `below` the text |

## Renderers

`renderers` takes an array of callbacks. `<x-storyfeed::feed>` passes it to
every row and every group member.

```blade
<x-storyfeed::feed :page="$page" :renderers="[
    'time' => fn ($item) => view('feed.time', ['item' => $item])->render(),
    'fileLabel' => fn (array $file) => $file['mediaType'] === 'application/vnd.apple.keynote' ? 'Keynote' : null,
]" />
```

| Renderer | Receives | Returns |
|---|---|---|
| `time` | the `FeedItem` | the timestamp's HTML |
| `glyph` | the glyph token, `disc` or `badge` | the icon's HTML, drawn inside the kit's disc |
| `avatar` | the `Entity`, `md`, `pair` or `badge` | the avatar's HTML |
| `body` | the `FeedItem` | HTML added before the row's bodies |
| `annotations` | the `FeedItem` | HTML added at the end of the row |
| `removed` | the `FeedItem` | the removal line's text, or `null` |
| `fileLabel` | `['name' => …, 'mediaType' => …]` | a file-kind label, or `null` for the built-in MIME labels |
| `form` | the body array, the owning `Entity` or `null` | the body's HTML, or `null` for the kit's component |
| `mediaTiles` | the group's `FeedItem` | the strip's tiles |
| `mediaOverflow` | the group's `FeedItem` | the "+N" count |
| `media` | `['image' => …, 'href' => …, 'attributes' => …]`, a class string | the picture's HTML, for every picture: tiles, Image and MediaObject bodies |

The HTML a renderer returns is drawn as it is, without sanitizing.

## Registered Components

`Storyfeed\Ui\Support\BodyComponents` maps a Component body's name to an app
Blade component:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Ui\Support\BodyComponents;

app(BodyComponents::class)->register('App/Message', 'feed.message');
```

A `Storyfeed/Body/Component` named `App/Message` renders `<x-feed.message>`
with the body's `props` as its attributes. A name that isn't registered
draws nothing.

## Views and Words

| Path under `resources/views/vendor/storyfeed` | Draws |
|---|---|
| `components/{name}.blade.php` | the component of that name |
| `components/body/{type}.blade.php` | a body type, its segments in kebab case |
| `icons/{token}.blade.php` | a glyph token |
| `icons/activity.blade.php` | a token with no view of its own |

Publish the views with `php artisan vendor:publish --tag=storyfeed-views`.

| Words | Where |
|---|---|
| "No activity yet.", "Older activity", "Show all :count", "Show less", "Today", "Yesterday" | `lang/{locale}.json` |
| the role words after the time, "from" and "until" | `lang/vendor/storyfeed-ui/{locale}/meta.php` |
