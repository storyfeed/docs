# Deleted Models

When a model is deleted, the activities it took part in stay in the feed.
Storyfeed puts a tombstone in the model's place: the activity still reads as a
sentence, and the deleted model's details are gone from the feed's tables.

<script setup>
import { who, where, orders, dishes, activity, group, tombstone, scenes } from '../.vitepress/theme/samples'

const deleted = '2026-08-14T15:05:00.000000Z'
const removedOrder = tombstone('order', '17', deleted)

const afterDelete = activity({ ...scenes.order, id: 'dm1', object: removedOrder })

const voided = activity({ id: 'dm2', verb: 'void', glyph: 'x-circle',
  published_at: deleted,
  headline_template: ':actor voided :object',
  actor: who.owner, object: removedOrder, redundant: false })

const keptDish = tombstone('menu_item', '18', deleted, { label: dishes.lassi.label })

const keptLabel = activity({ id: 'dm3', verb: 'publish', glyph: 'chef-hat',
  published_at: '2026-08-14T09:00:00.000000Z',
  headline_template: ':actor put :object on the menu',
  actor: who.cook, object: keptDish })

const removedKitchen = tombstone('kitchen', '19', deleted)

const kitchenGone = activity({ ...scenes.order, id: 'dm4', target: removedKitchen, redundant: true })

const bulk = activity({ ...scenes.order, id: 'dm5',
  object: tombstone('order', '20', '2026-08-15T03:00:00.000000Z', { approximate: true }) })

const mixed = group({ id: 'dm6', verb: 'place', axis: 'repeat', count: 3, glyph: 'shopping-bag',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor placed :count orders',
  actors: [who.regular], objects: [orders.second, orders.third, removedOrder],
  distinct: { actors: 1, objects: 3 } })
</script>

## Deleting a Model

```php
// app/Http/Controllers/OrderController.php, destroy()
$order->delete();
```

Before the delete:

<FeedExample context :items="[scenes.order]" />

After it:

<FeedExample context expanded :items="[afterDelete]" />

Every activity that named the order now names its tombstone instead. A
tombstone keeps only the kind of thing the model was and when it went, as
Activity Streams 2.0 recommends. The payload says so:

| Key | What it says |
|---|---|
| `object.type` | `storyfeed.tombstone`, with `url: null` and `label: null` |
| `object.tombstone.formerType` | the deleted model's morph alias: `order` |
| `object.tombstone.deleted` | when it was deleted |
| `tombstoned` | the roles holding a tombstone: `["object"]` |
| `redundant` | `true`: the activity was about the order, and the order is gone |

What `redundant` means, and how a verb changes it, is in
[What a Verb Is About](#what-a-verb-is-about). The full shape is in
[The Payload Contract](/reference/payload).

A deleted order's headline, icon and intent are still the ones defined for
`order.place`.

## Restoring a Model

On a model that soft-deletes, restoring it points every activity back at it,
and the tombstone goes:

```php
// app/Http/Controllers/OrderController.php, restore()
$order->restore();
```

<FeedExample :items="[scenes.order]" />

## Force Deleting a Model

A force delete can't be undone, so its tombstone is permanent:

```php
// app/Http/Controllers/OrderController.php, destroy()
$order->forceDelete();   // the activities stay; the tombstone is now their object for good
```

<FeedExample :items="[afterDelete]" />

## Keeping the Label

A tombstone drops the model's label. A model whose label is safe to keep after
deletion, such as a dish on a public menu, says so in `describeFeed()`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    public function describeFeed(): void
    {
        $this->feedEntity()
            ->label("{$this->code} {$this->name}")
            ->tombstone(fn ($tombstone) => $tombstone->keepLabel()); // [!code focus]
    }
}
```

<FeedExample :items="[keptLabel]" expanded />

The label stays, and the link goes.

## Forgetting Activities

`forgetActivities()` deletes the activities a deleted model made redundant, the
ones where it fills a role the verb is about. Its other activities stay, naming
its tombstone:

```php
// app/Models/Order.php, describeFeed()
$this->feedEntity()
    ->label("Order #{$this->reference}")
    ->tombstone(fn ($tombstone) => $tombstone->keepLabel()->forgetActivities()); // [!code focus]
```

It applies on a force delete only. A soft-deleted model forgets its activities
when it is force-deleted, so a restore can always undo a soft delete.

## What a Verb Is About

An activity is **redundant** when a role its verb is about holds a tombstone.
By default, a verb is about its object. `->missing()` names the roles instead:

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->headline(':actor placed :object with :target')
    ->missing('object', 'target'); // [!code focus]
```

Once the kitchen is deleted, placing an order with it is redundant too:

<FeedExample :items="[kitchenGone]" expanded />

`->missing()` replaces the default, and `->missing()` with no roles means the
verb is about none of them. On `Story::for(Order::class)->missing(...)`, it
applies to every verb on orders; a verb's own call wins. In the array form it
is a `'missing'` key, and on a story class a `missing()` method returning the
list.

## Removal Verbs

A verb that records a removal is about nothing by default, because its
object being gone is expected:

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('void')
    ->headline(':actor voided :object')
    ->type(ActivityType::Remove); // [!code focus]
```

<FeedExample :items="[voided]" expanded />

A removal verb is one whose Activity Streams type is `Delete`, `Remove`,
`Undo` or `Reject`. A verb from Storyfeed's own [vocabulary](/reference/verbs)
with one of those types counts even when it is recorded as a plain string,
such as `delete`, `discard` or `undo`. `Story::resource()` declares its
`delete` and `restore` verbs as removals.

## Groups with a Deleted Model

A group counts its tombstones per role, beside `distinct`:

<FeedExample :items="[mixed]" expanded />

`distinct_tombstoned.objects` is `1`: one of the three orders is gone. The
group's `sample` lists live entities before tombstones. `redundant` on a group
is `true` only when every member is redundant.

## Deleting Many at Once

A query that deletes rows directly, such as `Order::whereKey($ids)->delete()`,
fires no model events. `storyfeed:trickle` finds those models on its next run
and tombstones them, and marks each tombstone `approximate`, because the
deletion time is when it was found:

<FeedExample :items="[bulk]" expanded />

It restores them the same way when a bulk `restore()` brings them back. To
tombstone them straight away:

```php
// where the rows are deleted: a controller, an action, a job
use App\Models\Order;
use Storyfeed\Facades\Storyfeed;

Order::whereKey($ids)->delete();

Storyfeed::tombstone(Order::class, $ids); // [!code focus]
```

Neither path has a model to ask, so `keepLabel()` and `forgetActivities()` are
not applied. For a `Feedable` that isn't an Eloquent model, pass its morph
alias in place of the class.

## Removing Activities Entirely

When the activities themselves must go, remove them before the model:

```php
// app/Http/Controllers/AccountController.php, destroy()
$user->forceDeleteFromFeed();   // every activity involving the user, permanently
$user->forceDelete();
```

`deleteFromFeed()` soft-deletes them instead. Neither runs on its own: a
deleted model leaves a tombstone, and only these two calls remove activities.
[Recording Deletions](/cookbook/activities-about-deletions) covers choosing
between them.
