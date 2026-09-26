# Computed Values in the Feed

<script setup>
import { scene } from '../.vitepress/theme/world'
</script>

A value can be stored when an activity is published, updated when its model
is saved, or computed when the feed is retrieved. Computing on retrieval
keeps values current even when changes to other models affect them.

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

## Storing a Value at Publication

Use `->data()` to store facts about the moment an activity was published.
For example, record the old and new prices when a menu item's price changes:

```php
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($staff)
    ->action('reprice', $menuItem)
    ->data(['old_price' => $oldPrice, 'new_price' => $menuItem->price]) // [!code highlight]
    ->publish();
```

The activity keeps those prices after later changes. Values in the model's
`toFeed()` snapshot instead update when that model is saved.

## Computing a Value When the Feed Is Retrieved

A menu item's order count changes when an order is placed, even if the menu
item itself is not saved. Return a closure body from `feedMedia()` to compute
the count when the feed is retrieved. Assuming the model defines an `orders`
relationship, pass it to `$context->model(withCount: ['orders'])`:

```php memo="app/Models/MenuItem.php"
use Storyfeed\Body\KeyValue;
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;

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
```

Models load once per model class for the page, with the requested counts
loaded together. The closure defers building the body until the payload needs
it. If a body resolver throws, Storyfeed reports the error and drops only
that body; the activity and its other bodies remain.

The menu item uses a `KeyValue` body to display its current order count:

<FeedExample :items="[scene.cookbook.computed]" />

## Choosing Between Them

Compute a value on retrieval when a stale value would mislead someone using
the page. For example, a page that lets people place orders should retrieve
the current order count. The displayed value updates the next time the feed
is retrieved.

Store a value in activity data when it describes history, such as the prices
before and after a change. Use `toFeed()` for the model's own current facts,
such as its name or description, which update with the model.
