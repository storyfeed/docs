# Entry API

## Introduction

`Storyfeed::compose()` builds a feed from entries, and a source's `items()`
returns them. `Storyfeed\Sources\Entry` is one entry, in three forms: fluent,
named arguments, or an array. See [Composing Feeds](/basics/composing-feeds)
and [Feed Sources](/basics/feed-sources) for setup.

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

$feed = Storyfeed::compose()
    ->add(fn ($entry) => $entry->by($order->customer)->action('place', $order))
    ->get();
```

## Composed Feeds

`Storyfeed::compose()` returns a `Storyfeed\ComposedFeed`, a feed builder with
these methods of its own:

| Method | Does |
|---|---|
| `add(Closure\|Entry $entry)` | adds one entry; a closure receives a new `Entry` |
| `addMany(iterable $items, Closure $callback)` | adds an entry for each item; the callback receives the item, a new `Entry` and the item's key |
| `inOrder()` | keeps the entries in the order added; cursors page by position, and nothing groups |
| `source($source)` | throws a `LogicException`: a composed feed reads its own entries |

The reads are a feed's: `get()`, `cursorPaginate()` and `simplePaginate()`,
narrowed by `only()`, `except()`, the role filters and `limit()`. These differ:

| Call | On a Composed Feed |
|---|---|
| read mode | Log, whatever `grouping.default` says |
| `live()` | groups dated entries that have a verb; throws an `InvalidArgumentException` when read with `inOrder()` |
| order | newest first, dateless entries last in the order added; with `inOrder()`, the order added |
| entries dated in the future | shown |
| `involving()`, `query()`, `members()` | throw `FeedMisconfigured`. See [Source Limitations](/basics/feed-sources#source-limitations) |

## Entry Methods

| Method | Sets |
|---|---|
| `verb($verb, $object = null)`, `action($verb, $object = null)` | the verb, a string or a verb enum, without a dot; and the object, when given |
| `headline(string $headline, array $replace = [])` | the entry's own headline. See [Headline Replacements](#headline-replacements) |
| `actor()`, `by()` | the actor |
| `object()` | the object |
| `target()`, and its aliases `to()`, `on()`, `in()`, `for()`, `with()`, `into()` | the target |
| `context()` | the context |
| `origin()` | the origin |
| `result()`, `resulting()` | the result |
| `instrument()`, `using()` | the instrument |
| `location()`, `at()` | the location |
| `generator()` | the generator |
| `data(array\|Arrayable $data)` | the entry's `data` |
| `body($body)` | the object's body: a string, a body, or a list of bodies |
| `id(string $id)` | the payload `id`; without it, one is derived from the entry and stays the same between reads |
| `publishedAt($date)` | the date; without it, the entry is dateless |
| `startsAt($date)`, `endsAt($date)` | the time range the entry describes |

Each role method takes a role value. An entry has no `from()` target alias:
`Entry::from()` reads the array form.

### Role Values

| Value | Example | In the Payload |
|---|---|---|
| a Feedable model | `$project` | the model's entity, from `toFeed()` and `feedMedia()` when the feed is read |
| a party name | `'Storyfeed'` | a party entity, `type: "storyfeed.party"` |
| an entity with no model | `['type' => 'release', 'label' => 'v0.18.0']` | an entity with that `type` and `label` |

A model that is not Feedable throws an `InvalidArgumentException`. An entity
array takes these keys; any other throws:

| Key | Value |
|---|---|
| `type` | the entity's type; required |
| `label` | the entity's label; required |
| `id` | the entity's id; defaults to the label |
| `url` | the entity's link |
| `data` | values carried with the entity |
| `body` | the entity's bodies |
| `media` | `icon`, `image` and `preview`, each a URL, a `FeedImage` or its array form (`src`, `mediaType`, `width`, `height`, `alt`); and `initials` and `color` for its avatar |

An `Image` or `MediaObject` body that names a slot the entity's `media`
doesn't declare throws an `InvalidArgumentException` when the entry is added.

### Headline Replacements

A replacement whose key names a role sets that role, as its method would:
`['actor' => $user]` is `->by($user)`. Any other key is replaced in the text
when the entry is added, as `:key`, `:Key` or `:KEY`.

| Mistake | Result |
|---|---|
| a model under a key that is not a role | `InvalidArgumentException` |
| a headline naming a role the entry leaves empty, outside an optional `[ ]` segment | `InvalidArgumentException` |

An entry's own headline wins over the feed file's. An entry with a verb and
no headline reads the verb's headline from the feed file.

## Named Arguments

`Entry::make()` takes the same values as named arguments:

```php memo="app/Sources/GitHubSource.php" at="items()"
use Storyfeed\Sources\Entry;

yield Entry::make(
    verb: 'ship',
    publishedAt: $release['published_at'],
    actor: 'Storyfeed',
    object: ['type' => 'release', 'label' => $release['tag_name']],
);
```

| Argument | Matches |
|---|---|
| `verb`, `publishedAt` | `verb()`, `publishedAt()`; both optional |
| `actor`, `object`, `target`, `context`, `origin`, `result`, `instrument`, `location`, `generator` | the role methods |
| `data`, `body`, `id` | `data()`, `body()`, `id()` |
| `startsAt`, `endsAt` | `startsAt()`, `endsAt()` |

`Entry::make()` takes no headline: call `headline()` on the entry it returns.

## Array Form

`Entry::from($array)` reads an entry from an array, as an
[array source](/basics/feed-sources#reading-an-array) does for each item:

| Key | Matches |
|---|---|
| `verb`, `headline`, `published_at` | `verb()`, `headline()` with no replacements, `publishedAt()`; all optional |
| `actor`, `object`, `target`, `context`, `origin`, `result`, `instrument`, `location`, `generator` | the role methods |
| `data`, `body`, `id` | `data()`, `body()`, `id()` |
| `starts_at`, `ends_at` | `startsAt()`, `endsAt()` |

Any other key throws an `InvalidArgumentException`.
