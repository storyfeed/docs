# Feed Sources

<script setup>
import { WORLD_ANCHOR, activity, entity } from '../.vitepress/theme/world'

const day = 86_400_000
const at = (days, hours = 0) => new Date(WORLD_ANCHOR - days * day - hours * 3_600_000).toISOString().replace(/\.(\d{3})Z$/, '.$1000Z')
const party = (name, key) => entity('storyfeed.party', key, name, null, { data: { key, type: 'Service' } })
const storyfeed = party('Storyfeed', 'storyfeed')
const release = (version, over = {}) =>
  entity('release', version, version, `https://github.com/storyfeed/storyfeed/releases/tag/${version}`, over)
const ship = (id, version, published_at, over = {}) => activity({
  id, verb: 'ship', glyph: 'rocket', published_at,
  headline_template: ':actor shipped :object',
  actor: storyfeed, object: release(version, over), data: null,
})

const releases = [
  ship('4e96a044d0c2ce697e1051c891', 'v0.18.0', at(2, 3), {
    body: [{ $body: 'Storyfeed/Body/Prose', $v: 1, content: 'Feeds can read from sources other than the database.', mediaType: 'text/plain', verbatim: false, title: null }],
  }),
  ship('9e4fa6efad9aea89545d32b58c', 'v0.17.0', at(6)),
]
</script>

## Introduction

A **source** is where a feed reads its items: the database by default, or an
array, a config entry, or an API. A source's items read into the same payload
as recorded activities, ready for the same kits.

<span id="composing-a-feed"></span>
<span id="writing-headlines"></span>
<span id="adding-many-entries"></span>
<span id="dateless-entries"></span>
<span id="grouping-a-composed-feed"></span>
<span id="running-without-tables"></span>
<span id="composing-common-feeds"></span>
<span id="showcasing-projects"></span>
<span id="listing-talks"></span>
<span id="showing-a-record-s-progress"></span>

To build a feed by hand in PHP, from data your app already has, see
[Composing Feeds](/retrieving/composing-feeds).

<a id="reading-static-content"></a>

## Reading an Array

The `ArraySource` reads items you pass in as arrays:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Sources\ArraySource;

$json = file_get_contents(resource_path('releases.json'));

$releases = collect(json_decode($json, true))
    ->map(fn (array $release) => [
        'verb' => 'ship',
        'actor' => 'Storyfeed',
        'object' => [
            'type' => 'release',
            'label' => $release['version'],
            'url' => $release['url'],
        ],
        'published_at' => $release['published_at'],
        'body' => $release['summary'],
    ]);

Storyfeed::feed()->source(new ArraySource($releases))->get();
```

Give the verb a headline in your feed file, as you would for a model:

```php memo="routes/feed.php"
use Storyfeed\Facades\Story;

Story::for('release')
    ->verb('ship')
    ->headline(':actor shipped :object')
    ->icon('rocket');
```

<FeedExample :items="releases" />

The feed applies its headlines, bodies, Live and Log modes, `only()` and
`except()`, role filters, limits and cursors to these items, as it does to
stored activities. Unlike a composed feed, a source hides items dated in the
future, as the database hides scheduled activities.

<span id="keeping-your-order"></span>

To keep the items in the order given, pass `inOrder: true`:

```php memo="A controller, or wherever the feed is read"
Storyfeed::feed()
    ->source(new ArraySource($projects, inOrder: true))
    ->get();
```

<a id="items"></a>
## Defining Items

Each item is an array with these keys:

| Key | Value |
|---|---|
| `verb` | the verb, as a string or a verb enum |
| `headline` | the item's own headline, with role tokens filled from its roles |
| `published_at` | a date or date string; an item without one is dateless |
| `actor`, `object`, `target`, `context`, `origin`, `result`, `instrument`, `location`, `generator` | a role (see below) |
| `starts_at`, `ends_at` | the time range the activity describes |
| `data` | an array, carried as the activity's `data` |
| `body` | the object's body: a string, a body, or a list of bodies; an item with a `body` needs an `object` |
| `id` | the activity's payload `id`; derived from the item when absent |

Any other key throws an `InvalidArgumentException`.

A role may be any of these:

| Role Value | Example | In the Payload |
|---|---|---|
| a Feedable model | `$project` | the model's entity, from its `toFeed()` |
| a party name | `'Storyfeed'` | a party entity, `type: "storyfeed.party"` |
| an entity with no model | `['type' => 'release', 'label' => 'v0.18.0', 'url' => '…']` | an entity with that `type` and `label`, linked to the `url` |

An entity array may also carry an `id`, which defaults to its label, plus
`data` and a `body`.

It may also carry `media`, the pictures a model would give from its
`feedMedia()`: an `icon`, an `image` or a `preview`, each a URL or an array
with `src`, `alt`, `width` and `height`. An entity with an `icon` draws it as
its avatar:

```php memo="A controller, or wherever the feed is read"
$entry->by([
    'type' => 'product',
    'label' => 'InvoiceJam',
    'media' => ['icon' => 'https://teylabs.com/marks/invoicejam.svg'],
])->headline(':actor sends invoices');
```

An `Image` or `MediaObject` body that names a slot the entity doesn't declare,
such as `preview`, throws an `InvalidArgumentException` rather than drawing
nothing. Declare the picture in `media`, or give the body its own image.

To build items in PHP rather than as arrays, use `Entry::make()`, which takes
the same values as named arguments:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Sources\Entry;

Entry::make(
    verb: 'ship',
    publishedAt: $release['published_at'],
    actor: 'Storyfeed',
    object: [
        'type' => 'release',
        'label' => $release['version'],
        'url' => $release['url'],
    ],
    body: $release['summary'],
);
```

## Naming Sources

Name a source in `config/storyfeed.php`, as you name a filesystem disk. The
`array` driver reads the items listed under `items`, and `in_order` keeps
their order:

```php memo="config/storyfeed.php"
'sources' => [
    'database' => ['driver' => 'database'],

    'releases' => [
        'driver' => 'array',
        'items' => json_decode(
            file_get_contents(resource_path('releases.json')),
            true,
        ),
    ],
],
```

Pass the name to `source`:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->source('releases')->live()->get();
```

The `database` source is the default. A feed that never calls `source` reads
the database.

## Writing a Custom Driver

A driver is a class that implements `Storyfeed\Contracts\FeedSource`. Its
`items` method returns the source's items, as arrays, `Entry` instances or
`Storyfeed\Models\Activity` models.
This driver reads a repository's releases from GitHub:

```php memo="app/Sources/GitHubSource.php"
<?php

namespace App\Sources;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Storyfeed\Contracts\FeedSource;
use Storyfeed\Sources\Entry;

class GitHubSource implements FeedSource
{
    public function __construct(protected array $config) {}

    public function items(): iterable
    {
        $repo = $this->config['repo'];

        $releases = Cache::remember(
            "github.releases.{$repo}",
            3600,
            fn () => Http::withToken($this->config['token'])
                ->get("https://api.github.com/repos/{$repo}/releases")
                ->throw()
                ->json(),
        );

        foreach ($releases as $release) {
            yield Entry::make(
                verb: 'ship',
                publishedAt: $release['published_at'],
                actor: $release['author']['login'],
                object: [
                    'type' => 'release',
                    'label' => $release['name'] ?: $release['tag_name'],
                    'url' => $release['html_url'],
                ],
                body: $release['body'],
            );
        }
    }
}
```

Register the driver with `Storyfeed::extend` in a service provider's `boot`
method. The closure receives the application and the source's configuration:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use App\Sources\GitHubSource;
use Storyfeed\Facades\Storyfeed;

Storyfeed::extend('github', fn ($app, array $config) => (
    new GitHubSource($config)
));
```

Then name a source that uses it:

```php memo="config/storyfeed.php"
'sources' => [
    'releases' => [
        'driver' => 'github',
        'repo' => 'storyfeed/storyfeed',
        'token' => env('GITHUB_TOKEN'),
    ],
],
```

`Storyfeed::source('releases')` returns the source. It is built the first
time it is used and reused after that.

<a id="what-other-sources-do-not-support"></a>
## Source Limitations

A composed feed or a source other than the database reads its items in
memory. These need stored history, so they behave differently:

| Call or Key | On a Composed Feed or Another Source |
|---|---|
| `involving()`, `involvingDirectly()`, `involvingType()` | throws `FeedMisconfigured` |
| `query()` | throws `FeedMisconfigured` |
| `members()` | throws `FeedMisconfigured` |
| `sync_token` | always `null` on a paginated page |

Filter by role instead: `actor()`, `object()`, `target()`, `context()`,
`origin()`, `result()`, `instrument()`, `location()`, `generator()` and their
`*Type()` forms all work, and `actor('Storyfeed')` matches the items whose
actor is that party name.

Live groups are worked out from all of the items each time the feed is read,
with the same axes, thresholds and burst windows as stored activities.

<span id="rendering-a-payload-you-build-yourself"></span>
<span id="rendering-a-composed-feed"></span>

A source's page renders like any other: hand it to the kit, as in
[Rendering a Composed Feed](/retrieving/composing-feeds#rendering-a-composed-feed).
