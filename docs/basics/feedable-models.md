# Feedable models

Anything that appears in the feed — actor, object, target, context, origin, result, or instrument —
implements `Feedable`:

```php
use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
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
        // Reads what toFeed() cached above; a key it did not cache reads as null.
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


## Snapshots and media

The two methods split along the cache boundary:

| method | runs at | produces |
|---|---|---|
| `toFeed()` | publish time (refreshed on save) | the cached label, data, and optional body fields |
| `feedMedia()` | read time, statically, from the cached snapshot | fresh links and media |

Reads use snapshots by default. URLs are regenerated at read time. A resolver
can opt into `$context->model()` when it needs live model data; those lookups
are batched by model class across the page.

`feedMedia(FeedContext): ?FeedMedia` is required by `Feedable`;
`InteractsWithFeed` supplies a `feedMedia()` that returns `null`. Override it
when the entity has a link or media to show. An unlinked entity still renders
at full weight. `toFeed()` has no default. The old `toFeedLink()` method is gone.

A resolver runs for every entity with a snapshot on a page, including the group
exemplars a renderer never draws as links, so it is a pure function of the
context: no writes, and no query except `$context->model()`.

::: tip
`feedMedia()` reads cached values through `$context->data()` — include the key
you need to build the URL in `toFeed()`. A thrown exception is reported,
and the entity degrades to `url: null` and `media: null`. One broken resolver never breaks a feed.
:::

`FeedEntity::make()` also accepts `content`, `mediaType`, and `attributedTo`
for authored text, its encoding, and the author's IRI. See the
[payload contract](/reference/payload#entity-object).

### The context

| accessor | returns |
|---|---|
| `$context->type()` | the morph alias, as stored on the activity |
| `$context->id()` | the entity's key |
| `$context->label()` | the cached label |
| `$context->data()` | the `data` array `toFeed()` cached |
| `$context->data('id')` | one value from it; a missing key reads as null, or as the second argument |
| `$context->feed()` | the registered name of the feed being read, or null |
| `$context->model()` | the live model, or null |

### What `FeedMedia` carries

```php
FeedMedia::make(url: $url, attributes: ['target' => '_blank']);
FeedMedia::make(url: $url, label: $label);   // replaces the snapshot label on the node
FeedMedia::modal($url);                      // hint the renderer to open as a modal
```

| slot | type | on the payload |
|---|---|---|
| `url` | string, or a `FeedImage` when the resource is an image | `entity.url` |
| `label` | string | replaces `entity.label` |
| `attributes` | array | `entity.attributes` |
| `modal` | bool | `entity.modal` |
| `icon`, `preview`, `image` | `FeedImage`, or a bare src string | `entity.media` |
| `attachment` | `FeedResource` for a PDF or other non-image resource | `entity.media.attachment` |

### A URL per feed

`$context->feed()` is the name a [named feed](/basics/named-feeds) was
registered under, so one snapshot can resolve to a different URL on each
surface:

```php
public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return match ($context->feed()) {
        // Correct on the 'admin' feed and on no other: a payload built for one
        // feed is never cached or forwarded as another's.
        'admin' => FeedMedia::make(url: route('admin.documents.show', $context->id())),
        // Ad-hoc feeds and the Activity Streams serializer report null here.
        // Without this arm the match throws and the entity arrives unlinked.
        default => FeedMedia::make(url: route('documents.show', $context->id())),
    };
}
```

The name is stamped by the registry, never read from the request, so the same
snapshot resolves the same way in a queued digest, in the console and in a
test. A class feed reports its registered key however it was entered;
`AdminFeed::name()` returns that key, so a resolver can compare against the
class instead of a literal. The [payload contract](/reference/payload#one-payload-one-feed)
states what the URL is authority for.

### The live model

```php
public static function feedMedia(FeedContext $context): ?FeedMedia
{
    // The one database call a resolver may make: one query per class per
    // page, however many entities ask. Null when the row is gone, soft-deleted,
    // or storyfeed.hydration.enabled is false, so the null branch is not optional.
    $document = $context->model();

    if ($document === null) {
        return null;
    }

    return FeedMedia::make(
        url: route('documents.show', $document),
        label: $document->name,   // the snapshot label may predate a rename; this one is live
    );
}
```

Use it for what the snapshot cannot carry: a policy check, a relation, a value
that changes too often to trickle. What `toFeed()` cached is already in
`$context->data()`.

| argument | effect |
|---|---|
| `with: ['project']` | eager loads the relation across the whole batch; nested access without it is an N+1 |
| `withTrashed: true` | includes soft-deleted rows, on models that soft-delete |

### Images

```php
use Storyfeed\FeedImage;

public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return FeedMedia::make(
        url: route('documents.show', $context->id()),
        preview: FeedImage::make(
            // The src is minted here. The snapshot carries the intrinsic facts.
            src: route('documents.thumbnail', $context->id()),
            mediaType: $context->data('mediaType'),
            width: $context->data('width'),
            height: $context->data('height'),
            alt: $context->label(),
        ),
    );
}
```

The slots are Activity Streams 2.0's property names, and the slot is the
meaning:

| slot | holds |
|---|---|
| `icon` | small and representational, about 32×32 and square: an avatar, a logo |
| `preview` | a preview of the resource: the thumbnail a dense feed paints |
| `image` | a larger visual representation of a non-image resource: a hero shot |
| `url` | a `FeedImage` in place of a string when the resource itself is an image |

Each slot takes a `FeedImage` or a bare src string, by named argument or
fluently: `FeedMedia::make($url)->preview($thumb)->icon($avatar)`. The payload
shape is [`entity.media`](/reference/payload#entity-media).

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
