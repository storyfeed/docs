# Feedable Models

Anything that could participate in the feed, directly or indirectly, as an
actor, object, target or context, implements `Feedable`. When you are done, the
model has a label the feed can print and a link the feed can follow.

<script setup>
import { who, where, orders, dishes, notes, activity, group } from '../.vitepress/theme/samples'

const unlinked = { ...orders.first, url: null }
const at = '2026-08-14T14:30:00.000000Z'

const withSnapshot = [
  activity({ id: 'fm1', verb: 'placed', glyph: 'shopping-bag', published_at: at,
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: unlinked, target: where.kitchen }),
]

const withLink = [
  activity({ id: 'fm2', verb: 'placed', glyph: 'shopping-bag', published_at: at,
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.first, target: where.kitchen }),
]

// The kitchen's own feed: orders placed with it, and the dish it put live.
const scoped = [
  group({ id: 'fm3', verb: 'placed', axis: 'actors', count: 3, glyph: 'shopping-bag', published_at: at,
    headline_template: ':actors placed :count orders with :target',
    actors: [who.regular, who.customer2, who.customer3], targets: [where.kitchen],
    objects: [orders.first, orders.second, orders.third],
    distinct: { actors: 3, objects: 3, targets: 1 } }),
  activity({ id: 'fm4', verb: 'discussion.asked', glyph: 'message-circle',
    published_at: '2026-08-14T14:28:00.000000Z',
    headline_template: ':actor asked about :target',
    actor: who.customer4, object: notes.spice, target: dishes.chickenCurry }),
  activity({ id: 'fm5', verb: 'menu.dish_live', glyph: 'chef-hat',
    published_at: '2026-08-14T09:00:00.000000Z',
    headline_template: ':actor put :object on the menu',
    actor: who.cook, object: dishes.chickenCurry }),
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

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity // [!code focus]
    { // [!code focus]
        return FeedEntity::make( // [!code focus]
            label: "Order #{$this->reference}", // [!code focus]
            data: ['ulid' => $this->ulid], // [!code focus]
        ); // [!code focus]
    } // [!code focus]
}
```

<FeedExample :items="withSnapshot" />

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

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: "Order #{$this->reference}",
            data: ['ulid' => $this->ulid],
        );
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia // [!code focus]
    { // [!code focus]
        // Reads what toFeed() stored; a key it did not store reads as null. // [!code focus]
        return FeedMedia::make(url: route('orders.show', $context->data('ulid'))); // [!code focus]
    } // [!code focus]
}
```

<FeedExample :items="withLink" />

It is static because there is no model: `$context` carries the snapshot, and
the URL is minted fresh on every read. A route that changes never leaves a
stale link in the feed.

## A Link per Feed

`$context->feed()` is the name the feed was
[registered](/basics/named-feeds) under, so one snapshot can link somewhere
different on each surface, or nowhere. The kitchen's ticket and the
customer's status page are different pages about the same order:

```php
public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return match ($context->feed()) { // [!code focus]
        'kitchen' => FeedMedia::make(url: route('kitchen.ticket', $context->data('ulid'))), // [!code focus]
        'customer' => FeedMedia::make(url: route('orders.status', $context->data('ulid'))), // [!code focus]
        default => null, // an ad-hoc feed reports no name; without this arm the match throws // [!code focus]
    }; // [!code focus]
}
```

On the `kitchen` feed:

<FeedExample :items="withLink" />

On a feed with no name:

<FeedExample :items="withSnapshot" />

The name is stamped by the registry, never read from the request, so the same
snapshot resolves the same way in a queued digest, in the console and in a
test.

## The Model's Own Feed

`InteractsWithFeed` also gives the model a feed of everything it took part in:

```php
// a controller, or wherever the feed is read
$kitchen->storyfeed()->get();
```

<FeedExample :items="scoped">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedExample>

That is `Storyfeed::feed()->involving($kitchen)->get()` with the argument
filled in: the same builder, so everything in
[Reading Feeds](/basics/reading) applies.

## Morph Aliases

Storyfeed stores morph aliases, never class names, so entities survive a
namespace refactor. Enforce a map:

```php
// app/Providers/AppServiceProvider.php, boot()
Relation::enforceMorphMap([
    'order' => Order::class,
    'menu_item' => MenuItem::class,
    'kitchen' => Kitchen::class,
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

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: "{$this->code} {$this->name}",   // how the kitchen names a dish
            data: [
                'id' => $this->id,
                'mediaType' => $this->photo_mime,    // the intrinsic facts a thumbnail needs,
                'width' => $this->photo_width,       // stored once, read on every render
                'height' => $this->photo_height,
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
            'kitchen' => FeedMedia::make(url: route('kitchen.menu.edit', $id)),
            'customer' => FeedMedia::make(
                url: route('menu.show', $id),
                preview: FeedImage::make(
                    src: route('menu.photo', $id),
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

<FeedExample :items="[scoped[2]]" />

::: headless it makes no images
`FeedImage` carries a location and its dimensions. Generating a thumbnail,
storing it, and knowing its URL are your app's, exactly as they were before
the feed existed — the resolver just says where the current one is.
:::

Images, attachments, the live model, and every argument each method accepts
are in the [Feedable API](/reference/feedable) reference.
