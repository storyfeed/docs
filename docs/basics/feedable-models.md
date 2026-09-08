# Feedable models

Anything that appears in the feed — actor, object, target, or context —
implements `Feedable`:

```php
use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;

class Document extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: $this->name,
            data: ['id' => $this->id, 'project_id' => $this->project_id],
        );
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make(url: route('documents.show', $context->data('id')));
    }
}
```

<script setup>
import { who, where, doc, note, activity, group } from '../.vitepress/theme/samples'

// A project's own feed: activities where it is the target, and the one that
// created it — where it is the object, which a context-only filter would miss.
const scoped = [
  group({ id: 'f1', verb: 'upload', axis: 'repeat', count: 3, glyph: 'file-up',
    published_at: '2026-08-14T14:30:00.000000Z',
    headline_template: ':actor uploaded :count files to :target',
    actors: [who.ines], targets: [where.passwordCrackdown],
    objects: [doc.annualReportV3, doc.signagePlanRevB, doc.pricingTableFinal],
    distinct: { actors: 1, objects: 3, targets: 1 } }),
  activity({ id: 'f2', verb: 'comment', glyph: 'message-circle',
    published_at: '2026-08-14T14:28:00.000000Z',
    headline_template: ':actor commented on :target',
    actor: who.priya, object: note.overflow, target: doc.annualReportV3 }),
  activity({ id: 'f3', verb: 'create', glyph: 'folder',
    published_at: '2026-08-12T09:00:00.000000Z',
    headline_template: ':actor created the project :object',
    actor: who.jasper, object: where.passwordCrackdown }),
]
</script>


## Snapshots and links

The two methods split along the cache boundary:

| method | runs at | produces |
|---|---|---|
| `toFeed()` | publish time (refreshed on save) | the cached label, data, and optional body fields |
| `feedMedia()` | read time, statically, from the cached data | fresh links and media |

Reads use snapshots by default. URLs are regenerated at read time. A resolver
can opt into `$context->model()` when it needs live model data; those lookups
are batched by model class across the page.

::: tip
`feedMedia()` reads cached values through `$context->data()` — include the key
you need to build the URL in `toFeed()`. A thrown exception is reported,
and the entity degrades to `url: null` and `media: null`. One broken resolver never breaks a feed.
:::

`FeedMedia` carries more than a URL when you need it:

```php
FeedMedia::make(url: $url, attributes: ['target' => '_blank']);
FeedMedia::modal($url);   // hint the renderer to open as a modal
```

`InteractsWithFeed` supplies a `feedMedia()` that returns `null`. Override it
when the entity has a link or media to show.

`FeedEntity::make()` also accepts `content`, `mediaType`, and `attributedTo`
for authored text, its encoding, and the author's IRI. `FeedMedia::make()`
accepts `icon`, `image`, and `preview` image slots, plus an `attachment`
containing a `FeedResource` for a PDF or other non-image resource. See the
[payload contract](/reference/payload#entity-object).

## Keeping snapshots fresh

`InteractsWithFeed` wires the model events: saving refreshes the snapshot,
deleting soft-deletes activities involving the entity. Automatic snapshot
refreshes pause when recording is disabled.

| method | use |
|---|---|
| `updateFeedSnapshot()` | force a refresh outside a save |
| `deleteFromFeed()` | soft-delete every activity involving this model |
| `forceDeleteFromFeed()` | permanently delete every activity involving this model, including already soft-deleted activities, plus their grouping and participant rows; entity snapshots are retained |

For entities recorded before they had snapshots (imports, backfills), schedule
the trickle:

```php
Schedule::command('storyfeed:trickle')->everyMinute();
```

Un-snapshotted entities still appear — with `label: null`, `url: null` — and
renderers show a neutral placeholder. Activities are never hidden by the read
path.

## The model's own feed

The trait also gives the model a feed of everything it took part in:

```php
$project->storyfeed()->get();
```

That is the facade form with the argument filled in — identical, and the same
builder, so read modes, verbs, limits, cursors and
[`query()`](/basics/reading#anything-else-query) all apply:

```php
Storyfeed::feed()->involving($project)->get();
```

<FeedStream :items="scoped" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

Both need `feed_participants` populated. A fresh install gets it from the
migration; an existing one runs `php artisan storyfeed:participants` once, and
`storyfeed:doctor` says so until it has.

`storyfeed()` on a model is not the `storyfeed()` helper, which returns the
manager — or a pending activity, given a verb. Inside a model class both are
reachable: `storyfeed()` is the function, `$this->storyfeed()` is this.

## Morph aliases

Storyfeed stores morph aliases, never class names, so entities survive a
namespace refactor. Enforce a map:

```php
Relation::enforceMorphMap([
    'document' => Document::class,
    'project' => Project::class,
    // Aliases are permanent: an activity whose role alias no longer resolves
    // still shows, with a placeholder, and the trickle counts it as unresolved
    // rather than deleting it. Renaming a key means keeping the old one pointed
    // somewhere.
    'user' => User::class,
]);
```

Aliases can also be registered in `config/storyfeed.php` under `morph_map`,
which merges into the app's map at boot.

## Rich rendering

`FeedEntity` optionally names a frontend component and passes it props:

```php
FeedEntity::make(
    label: $this->name,
    component: 'Resource',
    data: ['status' => $this->status],
);
```

The payload carries `component` and `data` on the entity; what your renderer
does with them is yours.
