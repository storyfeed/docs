# Composites

<script setup>
import { who, dishes, group } from '../.vitepress/theme/samples'

const authored = group({
  id: 'cp1', verb: 'menu.dish_live', axis: 'composite', count: 2, glyph: 'chef-hat',
  published_at: '2026-08-14T09:20:00.000000Z',
  headline_template: ':actor put :count dishes on the menu',
  actors: [who.cook],
  objects: [dishes.cutlets, dishes.roti],
  distinct: { actors: 1, objects: 2 },
})
</script>

A composite is one authored story whose object is a **collection** — several
dishes put on the menu as a single activity, not several grouped ones.

## Recording One Yourself

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($cook)
    ->action('menu.dish_live')
    ->objects($dishes)
    ->publish();
```

<FeedExample context :items="[authored]" />

This writes a parent activity plus its atomic members. In `log()` the members
appear as an ordinary timeline; in aggregated modes the parent arrives as one
node with `axis: 'composite'`. Serialized to
[Activity Streams 2.0](/deeper/activity-streams), the object is an
`OrderedCollection`.

## Bundling a Burst Automatically

Mark a model `Bundleable` and runs of it bundle themselves:

```php
<?php

namespace App\Models;

use Storyfeed\Contracts\Bundleable;

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
'composite' => [
    'auto' => true,
    'min_objects' => 2,   // smallest distinct object count that mints a story
],
```

Bundling happens when the actor's **batch** closes. Singles stay atomic.

## Batches

A batch is a burst of activity by one actor, inferred by a sliding quiet
window — recorded automatically, invisible to your recording code.

```php
// config/storyfeed.php
'batch' => [
    'enabled' => true,
    'quiet_minutes' => 10,
],
```

A stale batch closes lazily at that actor's next publish. Schedule the command
so it closes promptly instead:

```php
// routes/console.php
Schedule::command('storyfeed:close-batches')->everyFiveMinutes();
```

Closing fires `BatchClosed`, which is the hook for digest emails and
notification batching. Batches never group the feed directly — they mint
composites at close.

::: tip
Composites are bursts by construction, so a composite's span is minutes. This
is the mechanism that turns "10 dish rows" into one readable story.
:::

## Grammar for Composites

Two registries, both required — see
[Grammar](/deeper/grammar#composite-parents):

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::aggregateGrammar(['composite.menu.dish_live' => ':actor put :count dishes on the menu']);
Storyfeed::grammar(['*.menu.dish_live' => ':actor put dishes on the menu']);
```

The parent has no object of its own, so it resolves through `*.{verb}`.

## Backfilling

Adopting `Bundleable` affects future activity only. To bundle history:

```bash
php artisan storyfeed:bundle
php artisan storyfeed:bundle --window=30
```

Idempotent, day-partitioned, and it knowingly reshuffles settled days — run it
when readers aren't mid-scroll. A feed that was born composited mints zero.
