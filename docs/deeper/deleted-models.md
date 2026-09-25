# Deleted Models

## Introduction

When a model is deleted, the activities it took part in stay in the feed.
Storyfeed puts a tombstone in the model's place: the activity still reads as a
sentence, and the deleted model's details are gone from the feed's tables.

<script setup>
import { scene, role, activity, group, tombstone, liveOf, WORLD_ANCHOR } from '../.vitepress/theme/world'
// Hypothetical deletion states of the same catalogue entities.
const deleted = new Date(WORLD_ANCHOR - 60 * 60 * 1000).toISOString()
const removedOrder = tombstone(scene.order.object.type, scene.order.object.id, deleted)
const afterDelete = activity({ ...scene.order, object: removedOrder })
const voided = activity({ ...scene.order, verb: 'void', glyph: 'x-circle', published_at: deleted,
  headline_template: ':actor voided :object', actor: role.staff, object: removedOrder, missing: [] })
const keptDish = tombstone(role.product.type, role.product.id, deleted, { label: role.product.label })
const keptLabel = activity({ ...scene.question, verb: 'publish', glyph: 'chef-hat',
  headline_template: ':actor put :object on the menu', actor: role.staff, object: keptDish, target: null })
const removedShop = tombstone(role.shop.type, role.shop.id, deleted)
const shopGone = activity({ ...scene.order, target: removedShop, missing: ['object', 'target'] })
const bulk = activity({ ...scene.order,
  object: tombstone(scene.order.object.type, scene.order.object.id, deleted, { approximate: true }) })
const readsGone = activity({ ...scene.order, object: removedOrder,
  missing_headline_template: ':actor placed an order, since deleted' })
const members = scene.deeper.aggregation.orders
const children = members.map((row, i) => i === 0
  ? activity({ ...row, object: tombstone(row.object.type, row.object.id, deleted) }) : row)
const mixed = group({ ...liveOf(members)[0], objects: children.map(row => row.object), children })
</script>

Use `InteractsWithFeed` on an Eloquent `Feedable` model to attach the deletion
and restoration hooks. [Feedable Models](/basics/feedable-models) covers setup.

## Deleting Feedable Models

<a id="deleting-a-model"></a>

### Soft Deletions

```php memo="app/Http/Controllers/OrderController.php" at="destroy()"
$order->delete();
```

Before the delete:

<FeedExample :items="[scene.order]" />

After it:

<FeedExample expanded :items="[afterDelete]" />

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
[Redundant Roles](#redundant-roles). The full shape is in
[The Payload Contract](/reference/payload).

A deleted order's headline, icon and intent are still the ones defined for
`order.place`.

<a id="restoring-a-model"></a>

### Restoring Models

On a model that soft-deletes, restoring it points every activity back at it,
and the tombstone goes:

```php memo="app/Http/Controllers/OrderController.php" at="restore()"
$order->restore();
```

<FeedExample :items="[scene.order]" />

<a id="force-deleting-a-model"></a>

### Permanent Deletions

A force delete can't be undone, so its tombstone is permanent:

```php memo="app/Http/Controllers/OrderController.php" at="destroy()"
// the activities stay; the tombstone is now their object for good
$order->forceDelete();
```

<FeedExample :items="[afterDelete]" />

## Tombstones

<a id="keeping-the-label"></a>

### Keeping Labels

A tombstone drops the model's label. A model whose label is safe to keep after
deletion, such as a dish on a public menu, says so in `describeFeed()`:

```php memo="app/Models/MenuItem.php"
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
            ->tombstone(fn ($tombstone) => $tombstone->keepLabel());
    }
}
```

<FeedExample :items="[keptLabel]" expanded />

The label stays, and the link goes.

<a id="groups-with-deleted-models"></a>

### Grouped Entities

A group counts its tombstones per role, beside `distinct`:

<FeedExample :items="[mixed]" expanded />

`distinct_tombstoned.objects` is `1`: one of the three orders is gone. The
group's `sample` lists live entities before tombstones. `redundant` on a group
is `true` only when every member is redundant.

## Defining Missing-Model Behaviour

<a id="roles-that-determine-redundancy"></a>

### Redundant Roles

An activity is **redundant** when a role its verb is about holds a tombstone.
By default, a verb is about its object. `->missing()` names the roles instead:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->headline(':actor placed :object with :target')
    ->missing('object', 'target');
```

Once the shop is deleted, placing an order with it is redundant too:

<FeedExample :items="[shopGone]" expanded />

`->missing()` replaces the default, and `->missing()` with no roles means the
verb is about none of them. On `Story::for(Order::class)->missing(...)`, it
applies to every verb on orders; a verb's own call wins. On a class that extends `Story`, a `missing()` method returns the list.

### Removal Verbs

A verb that records a removal is about nothing by default, because its
object being gone is expected:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('void')
    ->headline(':actor voided :object')
    ->type(ActivityType::Remove);
```

<FeedExample :items="[voided]" expanded />

A removal verb is one whose Activity Streams type is `Delete`, `Remove`,
`Undo` or `Reject`. A verb from Storyfeed's own [vocabulary](/reference/verbs)
with one of those types counts even when it is recorded as a plain string,
such as `delete`, `discard` or `undo`. `Story::resource()` declares its
`delete` and `restore` verbs as removals.

<a id="headlines-for-deleted-objects"></a>

### Missing Headlines

`->missingHeadline()` gives a verb its own sentence for once it is redundant:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->headline(':actor placed :object with :target')
    ->missingHeadline(':actor placed an order, since deleted');
```

<FeedExample :items="[readsGone]" expanded />

The payload carries it beside the headline, which does not change:

| Key | Holds |
|---|---|
| `headline_template` | `:actor placed :object with :target`, as before the delete |
| `missing_headline_template` | the verb's `missingHeadline()`, while `redundant` is `true`; otherwise `null` |
| `missing_headline` | the same, pre-rendered, when it came from a closure; otherwise `null` |

A verb with no `missingHeadline()` has `null` in both.

<a id="forgetting-activities"></a>

### Forgetting Redundant Activities

`->forgetWhenMissing()` deletes a verb's activities once they are redundant and
the deletion is permanent. A viewed order is no news once the order is gone:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('view')
    ->headline(':actor viewed :object')
    ->forgetWhenMissing();
```

The order's other activities stay, naming its tombstone. On
`Story::for(Order::class)->fallback()` it applies to every verb on orders.

| The Order Is | Its `view` Activities |
|---|---|
| soft-deleted | stay, so a restore brings them back |
| force-deleted | are permanently deleted |
| deleted by a query, then passed to `Storyfeed::tombstone()` | are permanently deleted, when the rows are gone for good |
| found deleted by `storyfeed:trickle` | are permanently deleted, when the rows are gone for good |

<a id="bulk-deletions"></a>

## Handling Bulk Deletions

A query that deletes rows directly, such as `Order::whereKey($ids)->delete()`,
fires no model events. `storyfeed:trickle` finds those models on its next run
and tombstones them, and marks each tombstone `approximate`, because the
deletion time is when it was found:

<FeedExample :items="[bulk]" expanded />

It restores them the same way when a bulk `restore()` brings them back. To
tombstone them straight away:

```php memo="Where the rows are deleted: a controller, an action, a job"
use App\Models\Order;
use Storyfeed\Facades\Storyfeed;

Order::whereKey($ids)->delete();

Storyfeed::tombstone(Order::class, $ids);
```

Neither path has a model to ask, so `keepLabel()` is not applied. A verb's
`forgetWhenMissing()` is. For a `Feedable` that isn't an Eloquent model, pass
its morph alias in place of the class.

<a id="removing-activities-entirely"></a>

## Removing Activities Explicitly

When the activities themselves must go, remove them before the model:

```php memo="app/Http/Controllers/AccountController.php" at="destroy()"
$user->forceDeleteFromFeed();   // every activity involving the user, permanently
$user->forceDelete();
```

`deleteFromFeed()` soft-deletes them instead. These are explicit calls. A deleted model normally leaves a tombstone; a
verb with `forgetWhenMissing()` also removes activities after permanent deletion.
A model registered with `Storyfeed::feedable()` has neither method; call the
actions instead:

```php
(new \Storyfeed\Actions\DeleteFromFeed)($model);
(new \Storyfeed\Actions\ForceDeleteFromFeed)($model);
```

[Recording Deletions](/cookbook/activities-about-deletions) helps choose
between keeping a label, forgetting activities and removing them.
