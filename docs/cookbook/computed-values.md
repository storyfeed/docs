# Computed Values in the Feed

<script setup>
import { scene } from '../.vitepress/theme/world'
</script>

A menu item's order count changes when an order is placed, even if the menu
item itself is not saved. Compute the count when the feed is retrieved, so
the feed shows the current value.

<a id="recording-counts"></a>
<a id="choosing-counts-to-resolve"></a>
<a id="choosing-fixed-or-live-counts"></a>
<a id="recording-a-count"></a>
<a id="recording-a-fixed-count"></a>
<a id="resolving-a-live-count"></a>
<a id="leaving-the-stored-count-empty"></a>
<a id="loading-counts-for-the-page"></a>
<a id="selecting-which-counts-to-display"></a>
<a id="healing-recorded-counts"></a>
<a id="handling-previously-recorded-counts"></a>

<span id="computing-a-value-when-the-feed-is-retrieved"></span>

## Computing a Count When the Feed Is Retrieved

Return a closure body from `feedMedia()`. Pass the model's `orders`
relationship to `$context->model(withCount: ['orders'])`:

::: code-group
```php [Fluent Syntax] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Storyfeed\Body\KeyValue;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    public function orders(): BelongsToMany
    {
        return $this->belongsToMany(Order::class);
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make()
            ->body(
                function () use ($context): KeyValue {
                    $menuItem = $context->model(withCount: ['orders']); // [!code highlight]

                    return KeyValue::make()
                        ->title($menuItem?->name)
                        ->items('Orders', $menuItem?->orders_count);
                },
            );
    }
}
```

```php [Named Arguments] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Storyfeed\Body\KeyValue;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    public function orders(): BelongsToMany
    {
        return $this->belongsToMany(Order::class);
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make(
            body: function () use ($context): KeyValue {
                $menuItem = $context->model(withCount: ['orders']); // [!code highlight]

                return KeyValue::make(
                    items: ['Orders' => $menuItem?->orders_count],
                    title: $menuItem?->name,
                );
            },
        );
    }
}
```
:::

Models load once per model class for the page, with the requested counts
loaded together. See
[Deferring Body Construction](/deeper/resolving-bodies#deferring-body-construction)
for what happens when a body resolver throws.

The menu item uses a `KeyValue` body to display its current order count:

<FeedExample :items="[scene.cookbook.computed]" />

<span id="storing-a-value-at-publication"></span>
<span id="choosing-between-them"></span>

## Choosing Stored or Computed Values

Compute a value on retrieval when a stale value would mislead someone using
the page. For example, a page that lets people place orders should retrieve
the current order count. The displayed value updates the next time the feed
is retrieved.

Store a value in activity data when it describes history, such as a menu
item's prices before and after a change. Use `toFeed()` for the model's own
current facts, such as its name or description, which update with the model.
See [Choosing Stored or Current Values](/deeper/resolving-bodies#choosing-stored-or-current-values).
