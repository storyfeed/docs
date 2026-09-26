# FeedItem API

## Introduction

`Storyfeed\Support\FeedItem`, `Headline` and `Entity` read a page of the feed
through named methods. They read the [payload](/reference/payload) and never
change it. [Rendering](/basics/rendering) shows the common path.

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

`FeedItem::of($array)` reads an item you already hold as an array, such as
one from `items()`.

## FeedItem

### Item Methods

| Method | Returns | Payload Field |
|---|---|---|
| `kind()` | `activity`, `group`, or `null` for a digest phrase | `kind` |
| `isActivity()`, `isGroup()` | `bool` | `kind` |
| `isDigest()` | `bool`: a group with `axis` `summary` | `axis` |
| `id()` | `?string` | `id` |
| `verb()` | `?string`, `null` for a digest row that spans verbs | `verb` |
| `publishedAt()` | `?CarbonImmutable`, `null` for a digest phrase | `published_at` |
| `headline()` | `Headline` | `headline_template`, `headline` |
| `missingHeadline()` | `?Headline`: the verb's reading once the activity is redundant | `missing_headline_template`, `missing_headline` |
| `glyph()` | `?string` | `glyph` |
| `intent()` | `?string` | `glyph_intent` |
| `data()` | `Fluent` | `data` |
| `changes()` | `Collection` of `label`, `before`, `after` rows | `change.changes` |
| `thread()` | `?Fluent` with `text`, `by`, `kind`, `replies`, `truncated` | `thread` |
| `tombstoned()` | `array` of role names | `tombstoned` |
| `isRedundant()` | `bool` | `redundant` |
| `get($key, $default = null)` | any key, with dot notation: `get('object.label')` | any |
| `toArray()` | the item, as the payload has it | |

### Role Methods

| Method | Returns |
|---|---|
| `actor()`, `object()`, `target()`, `context()`, `origin()`, `result()`, `instrument()` | `?Entity` |
| `entity($role)` | `?Entity` for a role by name |
| `actors()`, `objects()`, `targets()`, `contexts()`, `origins()`, `results()`, `instruments()` | `Collection` of `Entity` |
| `entities($role)` | `Collection` of `Entity` for a role by name |
| `distinct($role)` | `int`: how many distinct entities hold the role |

On an activity, `actor()` is its actor, `actors()` holds that one entity or
none, and `distinct('actors')` is `1` or `0`. On a group, `actor()` is set
only when every member has the same actor, `actors()` is the group's sample,
and `distinct('actors')` is the true total. A role name may be singular or
plural: `distinct('actor')` and `distinct('actors')` are the same.

### Group Methods

| Method | Returns | Payload Field |
|---|---|---|
| `count()` | `int`: members, `1` for an activity | `count` |
| `children()` | `Collection` of `FeedItem`, newest first | `children` |
| `childrenTruncated()` | `bool`: `count()` is more than `children()` holds | `children_truncated` |
| `axis()` | `?string` | `axis` |
| `period()` | `?string`: `hour`, `day`, `week` or `month` on a digest row | `period` |
| `phrases()` | `Collection` of `FeedItem`, one per verb on a digest row | `phrases` |
| `phrasesTruncated()` | `bool` | `phrases_truncated` |

A digest phrase reads with the same methods: `verb()`, `count()`,
`headline()`, `glyph()` and the role methods.

### Array Access

A `FeedItem` also reads as the array it wraps, and JSON encodes as it:

```php
$item['verb'];
$item['sample']['actors'];
json_encode($item);
```

It is read-only: setting or unsetting a key throws a `LogicException`.

## Headline

| Method | Returns |
|---|---|
| `toHtml()`, or echoing the headline in Blade | the sentence as HTML: entity labels linked, text escaped |
| `toHtml(fn (Entity $entity) => …)` | the sentence, with each entity drawn by the closure |
| `toString()`, `(string)` | the sentence as plain text |
| `template()` | `?string`: `headline_template` |
| `isFallback()` | `bool`: the item has no sentence, and reads with Storyfeed's words |
| `segments()` | `Collection` of the sentence's parts |

### Tokens

| Token | Reads As |
|---|---|
| `:actor`, `:object`, … | the entity, linked when it has a `url`; on a group holding several, the list |
| `:actors`, `:objects`, … | the sample, joined, and the rest as a number: `Ana, Ben, Cy and 2 more` |
| `:count` | `count()` |
| `:others` | the actors not in the sample: `2 others` |
| any other token | itself |

### Items Without a Sentence

| Item | Reads As |
|---|---|
| a group | its count: `5 activities` |
| a digest row | the actor once, then the phrases joined: `Ana got a balloon and went on 3 rides` |
| a digest phrase | its verb and count: `ride (3)` |
| an activity | its actor, verb and object: `Dana confirm Order #1042` |

### Segments

`segments()` lists the sentence in order. Every segment has a `type` and the
plain `text` it reads as:

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
| `toString()`, `(string)` | its label, or Storyfeed's words when it has none | `label` |
| `label()` | `?string` | `label` |
| `url()` | `?string` | `url` |
| `type()` | `?string`: the morph alias | `type` |
| `id()` | `?string` | `id` |
| `role()` | `?string`: the role it was read from | |
| `attributes()` | `array` | `attributes` |
| `isModal()` | `bool` | `modal` |
| `data()` | `Fluent` | `data` |
| `media()` | `?Fluent` with `icon`, `image`, `preview`, `url`, `attachments` | `media` |
| `attachments()` | `Collection` | `media.attachments` |
| `bodies()` | `Collection` of bodies | `body` |
| `content()`, `mediaType()`, `attributedTo()` | `?string` | `content`, `mediaType`, `attributedTo` |
| `isDegraded()` | `bool`: no label yet, and not deleted | `label`, `tombstone` |
| `isTombstone()` | `bool`: the model was deleted | `tombstone` |
| `formerType()` | `?string`: the deleted model's morph alias | `tombstone.formerType` |
| `deletedAt()` | `?CarbonImmutable` | `tombstone.deleted` |

An `Entity` reads as its array too: `$entity['label']`, `get('media.preview.src')`.

## Translation Lines

The words the readers use are lines in `storyfeed::feed`, read in the current
locale. Publish them to `lang/vendor/storyfeed` to change them:

```bash
php artisan vendor:publish --tag=storyfeed-translations
```

| Key | English |
|---|---|
| `someone` | `Someone` |
| `something` | `Something` |
| `former` | `a former :type` |
| `removed` | `a removed :type` |
| `item` | `item`: the type of a deleted model nobody named |
| `and` | `and` |
| `more` | `:count more` |
| `others` | `:count other` / `:count others` |
| `activities` | `:count activity` / `:count activities` |
| `unnamed` | `:actor :verb[ :object]` |
| `phrase` | `:verb (:count)` |

`:type` is the former morph alias as words: `line_item` reads as `line item`.

## Helpers

`FeedItem`, `Headline` and `Entity` use Laravel's `Conditionable`, `Tappable`
and `Dumpable`, so `when()`, `unless()`, `tap()`, `dump()` and `dd()` work on
each.

### Adding Methods

Each is macroable. Register a method once, in a service provider's `boot`
method:

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

A method nobody registered throws `BadMethodCallException`.
