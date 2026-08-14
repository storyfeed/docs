# Feedable models

Anything that appears in the feed — actor, object, target, or context —
implements `Feedable`:

```php
use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;
use Storyfeed\FeedLink;

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

    public static function toFeedLink(array $data): ?FeedLink
    {
        return FeedLink::make(url: route('documents.show', $data['id']));
    }
}
```

<script setup>
import { who, where, doc, note, activity, group } from '../.vitepress/theme/samples'

// A project's own feed: activities where it is the target, and the one that
// created it — where it is the object, which a context-only filter would miss.
const scoped = [
  group({ id: 'f1', verb: 'upload', axis: 'repeat', count: 3, icon: 'file-up',
    published_at: '2026-08-14T14:30:00.000000Z',
    headline_template: ':actor uploaded :count files to :target',
    actors: [who.ines], targets: [where.passwordCrackdown],
    objects: [doc.annualReportV3, doc.signagePlanRevB, doc.pricingTableFinal],
    distinct: { actors: 1, objects: 3, targets: 1 } }),
  activity({ id: 'f2', verb: 'comment', icon: 'message-circle',
    published_at: '2026-08-14T14:28:00.000000Z',
    headline_template: ':actor commented on :target',
    actor: who.priya, object: note.overflow, target: doc.annualReportV3 }),
  activity({ id: 'f3', verb: 'create', icon: 'folder',
    published_at: '2026-08-12T09:00:00.000000Z',
    headline_template: ':actor created the project :object',
    actor: who.jasper, object: where.passwordCrackdown }),
]
</script>


## Snapshots and links

The two methods split along the cache boundary:

| method | runs at | produces |
|---|---|---|
| `toFeed()` | publish time (refreshed on save) | the cached snapshot: label + data |
| `toFeedLink()` | read time, statically, from the cached data | a fresh URL |

Reads never touch your domain tables — a feed page is served entirely from
snapshots. URLs are regenerated live so they never go stale.

::: tip
`toFeedLink()` receives exactly what `toFeed()` put in `data` — include the key
you need to build the URL. Throwing inside it is safe: the failure is reported
and the entity degrades to `url: null`. One broken link never breaks a feed.
:::

`FeedLink` carries more than a URL when you need it:

```php
FeedLink::make(url: $url, attributes: ['target' => '_blank']);
FeedLink::modal($url);   // hint the renderer to open as a modal
```

## Keeping snapshots fresh

`InteractsWithFeed` wires the model events: saving refreshes the snapshot,
deleting removes the entity's feed presence.

| method | use |
|---|---|
| `updateFeedSnapshot()` | force a refresh outside a save |
| `deleteFromFeed()` | remove feed presence (soft) |
| `forceDeleteFromFeed()` | remove permanently |

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
    // Aliases are permanent: an activity whose role alias no longer resolves is
    // treated as an orphan and deleted by the scheduled trickle. Renaming a key
    // means keeping the old one pointed somewhere.
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
