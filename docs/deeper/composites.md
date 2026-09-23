# Composites

<script setup>
import { who, dishes, group } from '../.vitepress/theme/samples'

const authored = group({
  id: 'cp1', verb: 'publish', axis: 'composite', count: 2, glyph: 'chef-hat',
  published_at: '2026-08-14T09:20:00.000000Z',
  headline_template: ':actor put :count dishes on the menu',
  actors: [who.cook],
  objects: [dishes.cutlets, dishes.roti],
  distinct: { actors: 1, objects: 2 },
})
</script>

A composite is one activity whose object is a **collection**: several dishes
put on the menu as a single activity, rather than several activities grouped.

## Recording One Yourself

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($cook)
    ->action('publish')
    ->objects($dishes)
    ->publish();
```

<FeedExample context :items="[authored]" />

This writes a parent activity and one activity per member. In `log()` the
members appear as ordinary rows; in the other modes the parent arrives as one
node with `axis: 'composite'`. Serialized to
[Activity Streams 2.0](/deeper/activity-streams), the object is an
`OrderedCollection`.

## Bundling a Burst Automatically

Mark a model `Bundleable` and a burst of activities on it becomes a composite:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Contracts\Bundleable;
use Storyfeed\Contracts\Feedable;

class MenuItem extends Model implements Feedable, Bundleable
{
    // …
}
```

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::bundleables(['menu_item']);
```

```php
// config/storyfeed.php
'grouping' => [
    'composite' => [
        'auto' => true,
        'min_objects' => 2,   // fewest distinct objects that make a composite
    ],
],
```

Bundling happens when the actor's **batch** closes. A single activity stays as
it is.

## Batches

A batch is a burst of activity by one actor. It stays open until the actor has
been quiet for `quiet_minutes`, and your recording code does nothing to make
one.

```php
// config/storyfeed.php
'grouping' => [
    'batch' => [
        'enabled' => true,
        'quiet_minutes' => 10,
    ],
],
```

Otherwise a batch closes at that actor's next publish. To close batches on
time, schedule the command:

```php
// routes/console.php
Schedule::command('storyfeed:close-batches')->everyFiveMinutes();
```

Closing fires `BatchClosed`, which you can listen to for digest emails or
batched notifications. A batch does not group the feed itself; it makes
composites when it closes.

## Grammar for Composites

Register both, as [Grammar](/deeper/grammar#composite-parents) explains:

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::aggregateGrammar(['composite.publish' => ':actor put :count dishes on the menu']);
Storyfeed::grammar(['*.publish' => ':actor put dishes on the menu']);
```

## Backfilling

`Bundleable` applies to new activity only. To bundle past activity:

```bash
php artisan storyfeed:bundle
php artisan storyfeed:bundle --window=30   # only batches closed in the last 30 days
```

It is safe to run twice. It regroups past days, so run it when few readers are
scrolling.
