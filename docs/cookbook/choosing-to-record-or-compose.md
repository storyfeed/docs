# Choosing to Record or Compose

## Introduction

A menu item's page should show its price history, and the shop's feed should
show what staff did today. The app already keeps a `price_changes` table.
Recording every price change as an activity would store the same history
twice, but composing the shop feed at read time would miss events the app
never stored. Each need has a better fit.

<script setup>
import { priceHistory } from '../.vitepress/theme/recipes/record-or-compose'
</script>

Record an activity when it happens, or compose a feed from what your app
already stores when the page is read.

## Choosing

| Need | Use |
|---|---|
| the event appears in other feeds, such as the shop's | record |
| `involving()` finds it from any entity it names | record |
| the value it describes is overwritten later, such as a status or a price | record: its `data` keeps the value at the time |
| busy activity groups across records in Live | record |
| the app already stores each step, in a table or in timestamps | compose |
| it belongs on one record's page | compose |

## Composing From a History Table

A menu item's page shows its price changes from the app's own
`price_changes` table. Nothing is recorded:

```php memo="app/Http/Controllers/MenuItemController.php" at="show()"
use App\Models\PriceChange;
use Illuminate\Support\Number;
use Storyfeed\Facades\Storyfeed;

return view('menu-items.show', [
    'item' => $item,
    'prices' => Storyfeed::compose()
        ->addMany($item->priceChanges, fn (PriceChange $change, $entry) => $entry
            ->headline(':actor changed the price of :object to :price', [
                'actor' => $change->user,
                'object' => $item,
                'price' => Number::currency($change->price),
            ])
            ->publishedAt($change->created_at))
        ->get(),
]);
```

<FeedExample :items="priceHistory" />

The entries read newest first. Each headline is its own, so the entries need
no verb and no feed file definition.

## Knowing the Limits

- A composed feed reads only the entries you add: it can't include recorded
  activities.
- It reads as Log unless you call `live()`.
- `involving()`, `query()` and `members()` throw. See
  [Source Limitations](/retrieving/feed-sources#source-limitations).

To show both on one page, record the events and compose the rest into a
separate feed.
