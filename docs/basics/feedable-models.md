# Feedable Models

Anything that could participate in the feed, directly or indirectly, as an
actor, object, target or context, implements `Feedable`. When you are done, the
model has a label the feed can print and a link the feed can follow.

<script setup>
import { who, where, doc, note, activity, group } from '../.vitepress/theme/samples'

const unlinked = { ...doc.report, url: null }

const withSnapshot = [
  activity({ id: 'fm1', verb: 'upload', glyph: 'file-up',
    published_at: '2026-08-14T14:30:00.000000Z',
    headline_template: ':actor uploaded :object to :target',
    actor: who.designer, object: unlinked, target: where.main }),
]

const withLink = [
  activity({ id: 'fm2', verb: 'upload', glyph: 'file-up',
    published_at: '2026-08-14T14:30:00.000000Z',
    headline_template: ':actor uploaded :object to :target',
    actor: who.designer, object: doc.report, target: where.main }),
]

// The project's own feed: activities where it is the target, and the one that
// created it, where it is the object.
const scoped = [
  group({ id: 'fm3', verb: 'upload', axis: 'repeat', count: 3, glyph: 'file-up',
    published_at: '2026-08-14T14:30:00.000000Z',
    headline_template: ':actor uploaded :count files to :target',
    actors: [who.designer], targets: [where.main],
    objects: [doc.report, doc.signage, doc.pricing],
    distinct: { actors: 1, objects: 3, targets: 1 } }),
  activity({ id: 'fm4', verb: 'comment', glyph: 'message-circle',
    published_at: '2026-08-14T14:28:00.000000Z',
    headline_template: ':actor commented on :target',
    actor: who.reviewer, object: note.second, target: doc.report }),
  activity({ id: 'fm5', verb: 'create', glyph: 'folder',
    published_at: '2026-08-12T09:00:00.000000Z',
    headline_template: ':actor created the project :object',
    actor: who.owner, object: where.main }),
]
</script>

## The Snapshot

`toFeed()` returns what the feed stores about the model: a label, and the data
a link will need later.

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Document extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity // [!code focus]
    { // [!code focus]
        return FeedEntity::make( // [!code focus]
            label: $this->name, // [!code focus]
            data: ['id' => $this->id, 'project_id' => $this->project_id], // [!code focus]
        ); // [!code focus]
    } // [!code focus]
}
```

<FeedStream :items="withSnapshot" :grouped="false" />

The snapshot is taken when an activity is published and refreshed every time
the model saves. The feed reads the snapshot, never the model, so a page of a
hundred activities is a page of a hundred labels and no model queries. The
entity renders at full weight with no link.

## The Link

`feedMedia()` runs at read time, from the snapshot, and returns where the
entity links.

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext; // [!code focus]
use Storyfeed\FeedEntity;
use Storyfeed\FeedMedia; // [!code focus]

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

    public static function feedMedia(FeedContext $context): ?FeedMedia // [!code focus]
    { // [!code focus]
        // Reads what toFeed() stored; a key it did not store reads as null. // [!code focus]
        return FeedMedia::make(url: route('documents.show', $context->data('id'))); // [!code focus]
    } // [!code focus]
}
```

<FeedStream :items="withLink" :grouped="false" />

It is static because there is no model: `$context` carries the snapshot, and
the URL is minted fresh on every read. A route that changes never leaves a
stale link in the feed.

## A Link per Feed

`$context->feed()` is the name the feed was
[registered](/basics/named-feeds) under, so one snapshot can link somewhere
different on each surface, or nowhere.

```php
// app/Models/Document.php
public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return match ($context->feed()) { // [!code focus]
        'admin' => FeedMedia::make(url: route('admin.documents.show', $context->data('id'))), // [!code focus]
        'client' => FeedMedia::make(url: route('documents.show', $context->data('id'))), // [!code focus]
        default => null, // an ad-hoc feed reports no name; without this arm the match throws // [!code focus]
    }; // [!code focus]
}
```

On the `admin` feed:

<FeedStream :items="withLink" :grouped="false" />

On a feed with no name:

<FeedStream :items="withSnapshot" :grouped="false" />

The name is stamped by the registry, never read from the request, so the same
snapshot resolves the same way in a queued digest, in the console and in a
test.

## The Model's Own Feed

`InteractsWithFeed` also gives the model a feed of everything it took part in:

```php
// a controller, or wherever the feed is read
$project->storyfeed()->get();
```

<FeedStream :items="scoped" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

That is `Storyfeed::feed()->involving($project)->get()` with the argument
filled in: the same builder, so everything in
[Reading Feeds](/basics/reading) applies.

## Morph Aliases

Storyfeed stores morph aliases, never class names, so entities survive a
namespace refactor. Enforce a map:

```php
// app/Providers/AppServiceProvider.php, boot()
Relation::enforceMorphMap([
    'document' => Document::class,
    'project' => Project::class,
    // Aliases are permanent: an activity whose alias no longer resolves still
    // shows, with a placeholder. Renaming a key means keeping the old one
    // pointed somewhere.
    'user' => User::class,
]);
```

## A Complete Model

Everything above in one class, the shape a production model takes: the
snapshot carries the key and the facts a link needs, and the resolver links
per surface and never throws.

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedImage;
use Storyfeed\FeedMedia;

class Document extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: $this->name,
            data: [
                'id' => $this->id,
                'project_id' => $this->project_id,
                'mediaType' => $this->mime_type,   // the intrinsic facts a thumbnail needs,
                'width' => $this->width,           // stored once, read on every render
                'height' => $this->height,
            ],
        );
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        $id = $context->data('id');

        if ($id === null) {
            return null;   // a snapshot taken before this key existed still renders, unlinked
        }

        return match ($context->feed()) {
            'admin' => FeedMedia::make(url: route('admin.documents.show', $id)),
            'client' => FeedMedia::make(
                url: route('documents.show', $id),
                preview: FeedImage::make(
                    src: route('documents.thumbnail', $id),
                    mediaType: $context->data('mediaType'),
                    width: $context->data('width'),
                    height: $context->data('height'),
                    alt: $context->label(),
                ),
            ),
            default => null,
        };
    }
}
```

<FeedStream :items="withLink" :grouped="false" />

Images, attachments, the live model, and every argument each method accepts
are in the [Feedable API](/reference/feedable) reference.
