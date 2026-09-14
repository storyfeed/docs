# Feedable API

Everything a `Feedable` model can put on the feed, and everything it can read
back at render time. [Feedable Models](/basics/feedable-models) shows the
common path; this page lists all of it.

## The Contract

```php
<?php

namespace Storyfeed\Contracts;

interface Feedable
{
    public function toFeed(): FeedEntity;

    public static function feedMedia(FeedContext $context): ?FeedMedia;
}
```

| Method | Runs At | Produces |
|---|---|---|
| `toFeed()` | publish time, and again on every save | the snapshot: label, data, and the optional body fields |
| `feedMedia()` | read time, statically, from the snapshot | links and media, fresh on every read |

`InteractsWithFeed` supplies a `feedMedia()` that returns `null`, the model
events that refresh the snapshot, and the methods below. `toFeed()` has no
default.

## `FeedEntity::make()`

| Argument | Type | On the Payload |
|---|---|---|
| `label` | `?string` | `entity.label` |
| `data` | `array` or `Arrayable` | `entity.data` — what `feedMedia()` reads back |
| `component` | `?string` | `entity.component` — a frontend component the renderer resolves |
| `content` | `?string` | authored text, for comments and posts |
| `mediaType` | `?string` | the encoding of `content` |
| `attributedTo` | `?string` | the author's IRI |

Payload shape: [entity object](/reference/payload#entity-object).

## `FeedContext`

What `feedMedia()` receives. A resolver runs for every entity with a snapshot
on a page, including group exemplars a renderer never draws as links, so it is
a pure function of the context: no writes, and no query except `model()`.

| Accessor | Returns |
|---|---|
| `$context->type()` | the morph alias, as stored on the activity |
| `$context->id()` | the entity's key |
| `$context->label()` | the cached label |
| `$context->data()` | the `data` array `toFeed()` cached |
| `$context->data('id')` | one value from it; a missing key reads as `null`, or as the second argument |
| `$context->feed()` | the registered name of the feed being read, or `null` on an ad-hoc feed and in the Activity Streams serializer |
| `$context->model()` | the live model, or `null` |

A thrown exception is reported, and the entity degrades to `url: null` and
`media: null`. One broken resolver never breaks a feed.

### `$context->model()`

```php
$document = $context->model(with: ['project'], withTrashed: true);
```

The one database call a resolver may make: one query per class per page,
however many entities ask. `null` when the row is gone, soft-deleted, or
`storyfeed.hydration.enabled` is `false`, so the null branch is not optional.

| Argument | Effect |
|---|---|
| `with: ['project']` | eager loads the relation across the whole batch; nested access without it is an N+1 |
| `withTrashed: true` | includes soft-deleted rows, on models that soft-delete |

## `FeedMedia`

```php
FeedMedia::make(url: $url, attributes: ['target' => '_blank']);
FeedMedia::make(url: $url, label: $label);   // replaces the snapshot label on the node
FeedMedia::modal($url);                      // hint the renderer to open as a modal
FeedMedia::make($url)->preview($thumb)->icon($avatar);
```

| Slot | Type | On the Payload |
|---|---|---|
| `url` | string, or a `FeedImage` when the resource is an image | `entity.url` |
| `label` | string | replaces `entity.label` |
| `attributes` | array | `entity.attributes` |
| `modal` | bool | `entity.modal` |
| `icon`, `preview`, `image` | `FeedImage`, or a bare src string | `entity.media` |
| `attachments` | `FeedResource` list, for a PDF or other non-image resource | `entity.media.attachments` |

### Image Slots

The slots are Activity Streams 2.0's property names, and the slot is the
meaning:

| Slot | Holds |
|---|---|
| `icon` | small and representational, about 32×32 and square: an avatar, a logo |
| `preview` | a preview of the resource: the thumbnail a dense feed paints |
| `image` | a larger visual representation of a non-image resource: a hero shot |
| `url` | a `FeedImage` in place of a string when the resource itself is an image |

```php
// app/Models/Document.php
use Storyfeed\FeedImage;

public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return FeedMedia::make(
        url: route('documents.show', $context->id()),
        preview: FeedImage::make(
            src: route('documents.thumbnail', $context->id()),  // minted here, at read time
            mediaType: $context->data('mediaType'),             // the intrinsic facts come from the snapshot
            width: $context->data('width'),
            height: $context->data('height'),
            alt: $context->label(),
        ),
    );
}
```

| `FeedImage::make()` | Type |
|---|---|
| `src` | string |
| `mediaType` | `?string` |
| `width`, `height` | `?int`; a zero or negative value reads as `null` |
| `alt` | `?string` |

| `FeedResource::make()` | Type |
|---|---|
| `href` | string |
| `mediaType` | `?string` |
| `name` | `?string` |
| `type` | string, default `Document` |

Payload shape: [entity media](/reference/payload#entity-media).

## Snapshot Maintenance

`InteractsWithFeed` wires the model events: saving refreshes the snapshot,
deleting soft-deletes activities involving the entity. Automatic refreshes
pause while recording is disabled.

| Method | Use |
|---|---|
| `updateFeedSnapshot()` | force a refresh outside a save |
| `deleteFromFeed()` | soft-delete every activity involving this model |
| `forceDeleteFromFeed()` | permanently delete every activity involving this model, including already soft-deleted ones, plus their grouping and participant rows; entity snapshots are retained |

Entities recorded before they had a snapshot (imports, backfills) are
snapshotted by [`storyfeed:trickle`](/reference/commands). Until then they
render with `label: null` and `url: null`, and renderers show a neutral
placeholder. Activities are never hidden by the read path.

## The Model's Own Feed

```php
// a controller, or wherever the feed is read
$project->storyfeed()->get();
```

Identical to `Storyfeed::feed()->involving($project)->get()`, and the same
builder, so read modes, verbs, limits, cursors and `query()` all apply.

Both read `feed_participants`. A fresh install gets it from the migration; an
existing one runs [`storyfeed:participants`](/reference/commands) once.

`storyfeed()` on a model is not the `storyfeed()` helper, which returns the
manager, or a pending activity when given a verb. Inside a model class both are
reachable: `storyfeed()` is the function, `$this->storyfeed()` is this.

## Morph Aliases

Storyfeed stores morph aliases, never class names. Register them with
`Relation::enforceMorphMap()` or under `morph_map` in `config/storyfeed.php`,
which merges into the app's map at boot. Aliases are permanent: an activity
whose role alias no longer resolves still shows, with a placeholder, and the
trickle counts it as unresolved rather than deleting it. Renaming a key means
keeping the old one pointed somewhere.

## Rich Rendering

```php
FeedEntity::make(
    label: $this->name,
    component: 'Resource',
    data: ['status' => $this->status],
);
```

The payload carries `component` and `data` on the entity; what your renderer
does with them is yours.
