# Feed Sources

<script setup>
import { WORLD_ANCHOR, activity, entity } from '../.vitepress/theme/world'

const day = 86_400_000
const at = (days, hours = 0) => new Date(WORLD_ANCHOR - days * day - hours * 3_600_000).toISOString().replace(/\.(\d{3})Z$/, '.$1000Z')
const storyfeed = entity('storyfeed.party', 'storyfeed', 'Storyfeed', null, { data: { key: 'storyfeed', type: 'Service' } })
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

A feed reads its activities from your database. A **source** gives a feed
activities from somewhere else, such as a changelog file or a GitHub
repository, and the feed returns the same payload, ready for the same kits.

## Reading Static Content

The `ArraySource` reads activities you pass in. Nothing is stored:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Sources\ArraySource;

$releases = collect(json_decode(file_get_contents(resource_path('releases.json')), true))
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
`except()`, role filters, limits and cursors to these activities, as it does
to stored ones.

<a id="items"></a>
## Defining Items

Each item is an array with these keys:

| Key | Value |
|---|---|
| `verb` | the verb, as a string or a verb enum (required) |
| `published_at` | a date or date string (required) |
| `actor`, `object`, `target`, `context`, `origin`, `result`, `instrument` | a role (see below) |
| `starts_at`, `ends_at` | the time range the activity describes |
| `data` | an array, carried as the activity's `data` |
| `body` | the object's body: a string, a body, or a list of bodies |
| `id` | the activity's payload `id`; derived from the item when absent |

Any other key throws an `InvalidArgumentException`.

A role may be any of these:

| Role Value | Example | In the Payload |
|---|---|---|
| a model | `$project` | the model's entity, from its `toFeed()` |
| a party name | `'Storyfeed'` | a party entity, `type: "storyfeed.party"` |
| an entity with no model | `['type' => 'release', 'label' => 'v0.18.0', 'url' => '…']` | an entity with that `type` and `label`, linked to the `url` |

An entity array may also carry an `id`, which defaults to its label, plus
`data` and a `body`.

To build items in PHP rather than as arrays, use `SourceItem::make()`, which
takes the same values as named arguments:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Sources\SourceItem;

SourceItem::make(
    verb: 'ship',
    publishedAt: $release['published_at'],
    actor: 'Storyfeed',
    object: ['type' => 'release', 'label' => $release['version'], 'url' => $release['url']],
    body: $release['summary'],
);
```

## Naming Sources

Name a source in `config/storyfeed.php`, as you name a filesystem disk. The
`array` driver reads the items listed under `items`:

```php memo="config/storyfeed.php"
'sources' => [
    'database' => ['driver' => 'database'],

    'releases' => [
        'driver' => 'array',
        'items' => json_decode(file_get_contents(resource_path('releases.json')), true),
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
`items` method returns the source's items, as arrays or `SourceItem`s.
This driver reads a repository's releases from GitHub:

```php memo="app/Sources/GitHubSource.php"
<?php

namespace App\Sources;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Storyfeed\Contracts\FeedSource;
use Storyfeed\Sources\SourceItem;

class GitHubSource implements FeedSource
{
    public function __construct(protected array $config) {}

    public function items(): iterable
    {
        $releases = Cache::remember("github.releases.{$this->config['repo']}", 3600, fn () => Http::withToken($this->config['token'])
            ->get("https://api.github.com/repos/{$this->config['repo']}/releases")
            ->throw()
            ->json());

        foreach ($releases as $release) {
            yield SourceItem::make(
                verb: 'ship',
                publishedAt: $release['published_at'],
                actor: $release['author']['login'],
                object: ['type' => 'release', 'label' => $release['name'], 'url' => $release['html_url']],
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

Storyfeed::extend('github', fn ($app, array $config) => new GitHubSource($config));
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

A source other than the database reads its items in memory. These need stored
history, so they behave differently:

| Call or Key | On Another Source |
|---|---|
| `involving()`, `involvingDirectly()`, `involvingType()` | throws `FeedMisconfigured` |
| `query()` | throws `FeedMisconfigured` |
| `members()` | throws `FeedMisconfigured` |
| `sync_token` | always `null` on a paginated page |

Filter a source by role instead: `actor()`, `object()`, `target()`,
`context()`, `origin()`, `result()`, `instrument()` and their `*Type()`
forms all work, and `actor('Storyfeed')` matches the items whose actor is
that party name.

Live groups are worked out from all of the source's items each time the feed
is read, with the same axes, thresholds and burst windows as stored activities.

## Rendering a Payload You Build Yourself

A source's page renders like any other. Hand it to the Blade kit:

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/releases', fn () => view('releases', [
    'page' => Storyfeed::feed()->source('releases')->log()->get(),
]));
```

```blade memo="resources/views/releases.blade.php"
<x-storyfeed::feed :page="$page" />
```

<FeedExample :items="releases" />
