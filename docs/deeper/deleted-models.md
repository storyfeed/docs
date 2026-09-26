# Deleted Models

## Introduction

Activities remain in the feed when a model is deleted. Storyfeed replaces
the model with a tombstone, which identifies its former type and deletion
time without keeping its details. The activity still has a headline.

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

### Deleting Models

```php memo="app/Http/Controllers/OrderController.php" at="destroy()"
$order->delete();
```

With Laravel's `SoftDeletes` trait, `delete()` soft-deletes the model and
restoring it removes the tombstone. Without the trait, both the deletion and
tombstone are permanent.

Before deletion:

<FeedExample :items="[scene.order]" />

After deletion:

<FeedExample expanded :items="[afterDelete]" />

Every activity involving the order now refers to its tombstone. By default,
the tombstone contains only the model's former type and deletion time:

| Key | Value |
|---|---|
| `object.type` | `storyfeed.tombstone`, with `url: null` and `label: null` |
| `object.tombstone.formerType` | the deleted model's morph alias: `order` |
| `object.tombstone.deleted` | when it was deleted |
| `tombstoned` | the roles holding a tombstone: `["object"]` |

The full shape is in [The Payload Contract](/reference/payload#tombstones).

The activity keeps the headline, icon, and intent defined for `order.place`.

<a id="restoring-a-model"></a>

### Restoring Models

Restore a model that uses `SoftDeletes` to remove its tombstone and reconnect
its activities:

```php memo="app/Http/Controllers/OrderController.php" at="restore()"
$order->restore();
```

<FeedExample :items="[scene.order]" />

<a id="force-deleting-a-model"></a>

### Force Deleting Models

Force-deleting a model makes its tombstone permanent, whether or not the
model was soft-deleted first:

```php memo="app/Http/Controllers/OrderController.php" at="destroy()"
// the activities stay; the tombstone is now their object for good
$order->forceDelete();
```

<FeedExample :items="[afterDelete]" />

## Tombstones

<a id="keeping-the-label"></a>

### Keeping Labels

By default, tombstones omit the model's label. If the label is safe to keep,
such as a public menu dish's name, call `keepLabel()` in `describeFeed()`:

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

The tombstone keeps the label and removes the link.

<a id="groups-with-deleted-models"></a>

### Grouped Entities

Groups count tombstones per role in `distinct_tombstoned`. Here, one of three
orders has been deleted:

<FeedExample :items="[mixed]" expanded />

The group's tombstone keys are in
[The Payload Contract](/reference/payload#group-nodes).

## Configuring Verbs for Deleted Models

<a id="roles-that-determine-redundancy"></a>

### Redundant Roles

An activity is **redundant** when a role selected by its verb contains a
tombstone. By default, only the object determines redundancy. Call `missing()`
to choose the roles:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->headline(':actor placed :object with :target')
    ->missing('object', 'target');
```

With this declaration, deleting the shop also makes the activity redundant,
so the payload includes `redundant: true`:

<FeedExample :items="[shopGone]" expanded />

`missing()` replaces the default list; calling it without roles disables this
check. Set `Story::for(Order::class)->missing(...)` to apply the list to all
order verbs. A verb's own declaration takes precedence. On a Story class,
return the list from its `missing()` method.

### Removal Verbs

Removal verbs check no roles for redundancy by default, since their objects are
expected to be deleted:

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

Call `missingHeadline()` to define a headline for redundant activities:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->headline(':actor placed :object with :target')
    ->missingHeadline(':actor placed an order, since deleted');
```

<FeedExample :items="[readsGone]" expanded />

The payload includes the missing headline alongside the unchanged original:

| Key | Holds |
|---|---|
| `headline_template` | `:actor placed :object with :target`, as before the delete |
| `missing_headline_template` | the verb's `missingHeadline()`, while `redundant` is `true`; otherwise `null` |
| `missing_headline` | the same, pre-rendered, when it came from a closure; otherwise `null` |

Without `missingHeadline()`, both missing-headline fields are `null`.

<a id="forgetting-activities"></a>

### Forgetting Redundant Activities

Call `forgetWhenMissing()` to delete redundant activities after permanent
model deletion. For example, an order view may no longer be useful after the
order is deleted:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('view')
    ->headline(':actor viewed :object')
    ->forgetWhenMissing();
```

Other activities keep the order's tombstone. Set `forgetWhenMissing()` on
`Story::for(Order::class)->fallback()` to apply it to all order verbs.

| The Order Is | Its `view` Activities |
|---|---|
| soft-deleted | stay, so a restore brings them back |
| force-deleted, or deleted without `SoftDeletes` | are permanently deleted |

<a id="bulk-deletions"></a>

## Handling Bulk Deletions

Bulk deletion, such as `Order::whereKey($ids)->delete()`, dispatches no model
events. [Schedule](/reference/commands#scheduling-maintenance) `storyfeed:trickle`
every minute to find deleted models and create tombstones. These tombstones
are marked `approximate` because their deletion time is when Storyfeed found
them missing:

<FeedExample :items="[bulk]" expanded />

The command also reconnects activities after a bulk `restore()`. To create
tombstones immediately after bulk deletion:

```php memo="Where the rows are deleted: a controller, an action, a job"
use App\Models\Order;
use Storyfeed\Facades\Storyfeed;

Order::whereKey($ids)->delete();

Storyfeed::tombstone(Order::class, $ids);
```

Neither path has a model instance, so neither applies `keepLabel()`.
`forgetWhenMissing()` still applies to permanently deleted models. For a
non-Eloquent `Feedable`, pass its morph alias instead of a class.

<a id="removing-activities-entirely"></a>

## Removing Activities Explicitly

To remove a model's activities entirely, delete them before the model:

```php memo="app/Http/Controllers/AccountController.php" at="destroy()"
$user->forceDeleteFromFeed();   // every activity involving the user, permanently
$user->forceDelete();
```

Use `deleteFromFeed()` to soft-delete the activities. Models registered with
`Storyfeed::feedable()` have neither method; call the actions directly:

```php
(new \Storyfeed\Actions\DeleteFromFeed)($model);
(new \Storyfeed\Actions\ForceDeleteFromFeed)($model);
```

[Recording Deletions](/cookbook/activities-about-deletions) helps choose
between keeping a label, forgetting activities and removing them.
