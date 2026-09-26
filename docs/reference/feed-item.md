# FeedItem API

## Introduction

`Storyfeed\Support\FeedItem`, `Headline`, and `Entity` provide named methods
for accessing the [payload](/reference/payload) without changing it.
See [Rendering](/basics/rendering) for examples.

```blade
@foreach ($page as $item)
    {{ $item->headline() }}
@endforeach
```

## Reading a Page

| Method | Returns |
|---|---|
| `foreach ($page as $item)` | each item as a `FeedItem` |
| `$page->collect()` | the items as a `Collection` of `FeedItem` |
| `$page->items()` | the items as the payload's arrays |
| `$page->nextCursor()` | the cursor of the next page, or `null` |

Call `FeedItem::of($array)` to wrap an existing array, such as one returned
by `items()`.

## FeedItem

### Item Methods

| Method | Returns | Payload Field |
|---|---|---|
| `kind()` | `activity`, `group`, or `null` for a summary phrase | `kind` |
| `isActivity()`, `isGroup()` | `bool` | `kind` |
| `isDigest()` | `bool`: a group with `axis` `summary` | `axis` |
| `id()` | `?string` | `id` |
| `verb()` | `?string`, `null` for a summary row that spans verbs | `verb` |
| `publishedAt()` | `?CarbonImmutable`, `null` for a summary phrase | `published_at` |
| `headline()` | `Headline` | `headline_template`, `headline` |
| `missingHeadline()` | `?Headline`: the verb's headline when the activity is redundant | `missing_headline_template`, `missing_headline` |
| `glyph()` | `?string` | `glyph` |
| `intent()` | `?string` | `glyph_intent` |
| `data()` | `Fluent` | `data` |
| `changes()` | `Collection` of `label`, `before`, `after` entries | `change.changes` |
| `thread()` | `?Fluent` with `text`, `by`, `kind`, `replies`, `truncated` | `thread` |
| `tombstoned()` | `array` of role names | `tombstoned` |
| `isRedundant()` | `bool` | `redundant` |
| `get($key, $default = null)` | any key, with dot notation: `get('object.label')` | any |
| `toArray()` | the original payload array | |

### Role Methods

| Method | Returns |
|---|---|
| `actor()`, `object()`, `target()`, `context()`, `origin()`, `result()`, `instrument()` | `?Entity` |
| `entity($role)` | `?Entity` for a role by name |
| `actors()`, `objects()`, `targets()`, `contexts()`, `origins()`, `results()`, `instruments()` | `Collection` of `Entity` |
| `entities($role)` | `Collection` of `Entity` for a role by name |
| `distinct($role)` | `int`: how many distinct entities hold the role |

For an activity, `actor()` returns its actor, `actors()` contains that entity
or is empty, and `distinct('actors')` returns `1` or `0`. For a group, `actor()`
is set only when all members share it, `actors()` returns the sample, and
`distinct('actors')` returns the full total. Singular and plural role names
are equivalent: `distinct('actor')` and `distinct('actors')` return the same value.

### Group Methods

| Method | Returns | Payload Field |
|---|---|---|
| `count()` | `int`: members, `1` for an activity | `count` |
| `children()` | `Collection` of `FeedItem`, newest first | `children` |
| `childrenTruncated()` | `bool`: `count()` is more than `children()` holds | `children_truncated` |
| `axis()` | `?string` | `axis` |
| `period()` | `?string`: `hour`, `day`, `week` or `month` on a summary row | `period` |
| `phrases()` | `Collection` of `FeedItem`, one per verb on a summary row | `phrases` |
| `phrasesTruncated()` | `bool` | `phrases_truncated` |

Summary phrases support the same methods: `verb()`, `count()`, `headline()`,
`glyph()`, and role methods.

### Array Access

`FeedItem` supports array access and JSON encoding of its underlying payload:

```php
$item['verb'];
$item['sample']['actors'];
json_encode($item);
```

Setting or unsetting a key throws `LogicException`; the wrapper is immutable.

## Headline

| Method | Returns |
|---|---|
| `toHtml()`, or echoing the headline in Blade | the headline as HTML: entity labels linked, text escaped |
| `toHtml(fn (Entity $entity) => …)` | the headline, with each entity rendered by the closure |
| `toString()`, `(string)` | the headline as plain text |
| `template()` | `?string`: `headline_template` |
| `isFallback()` | `bool`: the item has no headline and uses Storyfeed's fallback text |
| `segments()` | `Collection` of the headline's parts |

### Tokens

| Token | Displays |
|---|---|
| `:actor`, `:object`, … | the entity, linked when it has a `url`; on a group holding several, the list |
| `:actors`, `:objects`, … | the sample, joined, and the rest as a number: `Ana, Ben, Cy and 2 more` |
| `:count` | `count()` |
| `:others` | the actors not in the sample: `2 others` |
| any other token | itself |

<a id="items-without-a-sentence"></a>

### Items Without a Headline

| Item | Displays |
|---|---|
| a group | its count: `5 activities` |
| a summary row | the actor once, then the phrases joined: `Ana got a balloon and went on 3 rides` |
| a summary phrase | its verb and count: `ride (3)` |
| an activity | its actor, verb and object: `Dana confirm Order #1042` |

### Segments

`segments()` returns headline parts in order, each with a `type` and plain `text`:

| `type` | Also Has |
|---|---|
| `text` | |
| `entity` | `role`, and `entity`: an `Entity`, or `null` when the role is empty |
| `entities` | `role`, `entities`: a `Collection` of `Entity`, and `total` |

```blade
@foreach ($item->headline()->segments() as $segment)
    @if ($segment['type'] === 'entity' && $segment['entity'])
        <x-avatar :entity="$segment['entity']" />
    @endif
    {{ $segment['text'] }}
@endforeach
```

## Entity

| Method | Returns | Payload Field |
|---|---|---|
| `toHtml()`, or echoing the entity in Blade | a link when it has a `url`, with its `attributes`; the escaped label otherwise | |
| `toString()`, `(string)` | its label, or fallback text when absent | `label` |
| `label()` | `?string` | `label` |
| `url()` | `?string` | `url` |
| `type()` | `?string`: the morph alias | `type` |
| `id()` | `?string` | `id` |
| `role()` | `?string`: the role containing the entity | |
| `attributes()` | `array` | `attributes` |
| `isModal()` | `bool` | `modal` |
| `data()` | `Fluent` | `data` |
| `media()` | `?Fluent` with `icon`, `image`, `preview`, `url`, `files` | `media` |
| `files()` | `Collection` | `media.files` |
| `bodies()` | `Collection` of bodies | `body` |
| `content()`, `mediaType()`, `attributedTo()` | `?string` | `content`, `mediaType`, `attributedTo` |
| `isDegraded()` | `bool`: no label yet, and not deleted | `label`, `tombstone` |
| `isTombstone()` | `bool`: the model was deleted | `tombstone` |
| `formerType()` | `?string`: the deleted model's morph alias | `tombstone.formerType` |
| `deletedAt()` | `?CarbonImmutable` | `tombstone.deleted` |

`Entity` also supports array access: `$entity['label']` or `get('media.preview.src')`.

## Translation Lines

Fallback text comes from `storyfeed::feed` in the current locale. Publish the
translations to `lang/vendor/storyfeed` to customise them:

```bash
php artisan vendor:publish --tag=storyfeed-translations
```

| Key | English |
|---|---|
| `someone` | `Someone` |
| `something` | `Something` |
| `former` | `a former :type` |
| `removed` | `a removed :type` |
| `item` | `item`: fallback type for an unnamed deleted model |
| `and` | `and` |
| `more` | `:count more` |
| `others` | `:count other` / `:count others` |
| `activities` | `:count activity` / `:count activities` |
| `unnamed` | `:actor :verb[ :object]` |
| `phrase` | `:verb (:count)` |

`:type` uses the former morph alias with spaces: `line_item` becomes `line item`.

## Helpers

`FeedItem`, `Headline`, and `Entity` support `when()`, `unless()`, `tap()`,
`dump()`, and `dd()` through Laravel's `Conditionable`, `Tappable`, and `Dumpable`.

### Adding Methods

Each class supports macros. Register methods in a service provider's `boot` method:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Support\FeedItem;

FeedItem::macro('isPlacement', function (): bool {
    return $this->verb() === 'place';
});
```

```blade
@if ($item->isPlacement())
    …
@endif
```

Calling an unregistered method throws `BadMethodCallException`.
