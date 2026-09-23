# Quickstart

Recording an activity takes three things: models that say how they read in a
feed, a headline for the verb, and one call where the fact happens. The example
is a customer placing an order with a kitchen.

<script setup>
import { who, where, orders, dishes, party, scenes, activity } from '../.vitepress/theme/samples'

// The homepage feed a few minutes later: the order from the previous step,
// with what the kitchen did around it.
const row = (id, time, verb, glyph, headline_template, roles) => activity({
  id, verb, glyph, headline_template,
  published_at: `2026-08-14T${time}.000000Z`, ...roles,
})

const homepage = [
  row('hp1', '14:52:00', 'ready', 'utensils', ':actor marked :object ready', { actor: who.cook, object: orders.first }),
  row('hp2', '14:41:00', 'pay', 'credit-card', ':actor marked :object paid', { actor: party.service, object: orders.first }),
  row('hp3', '14:34:00', 'confirm', 'circle-check', ':actor confirmed :object', { actor: who.cook, object: orders.first }),
  scenes.order,
  row('hp4', '14:12:00', 'place', 'shopping-bag', ':actor placed :object with :target', { actor: who.customer2, object: orders.second, target: where.kitchen }),
  row('hp5', '14:05:00', 'publish', 'chef-hat', ':actor put :object on the menu', { actor: who.cook, object: dishes.lassi }),
]
</script>

## Making the Models Feedable

A model that appears in the feed says how it should read:

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

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(label: "Order #{$this->reference}");
    }
}
```

`Kitchen` and `User` get the same treatment, each returning its own label.

## Giving the Verb a Headline

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::grammar([
    'order.place' => ':actor placed :object with :target', // [!code highlight]
    'order.confirm' => ':actor confirmed :object',
    'order.pay' => ':actor marked :object paid',
    'order.ready' => ':actor marked :object ready',
    'menu_item.publish' => ':actor put :object on the menu',
]);
```

## Publishing an Activity

<<< @/snippets/publish.php

On the feed:

<FeedExample context :items="[scenes.order]" />

## Rendering the Feed

Return the feed from a route:

```php
// routes/web.php
Route::get('/', function () {
    return Storyfeed::feed()->get();
});
```

The response is the following JSON:

<FeedExample payload :items="homepage" />

### How the Frontend Might Render It

Each node carries its sentence with the entities already in it. The order from
the previous step lands among everything else the app recorded:

<FeedExample :items="homepage">
  <template #annotations="{ node }">
    <Annotation v-if="node.id === scenes.order.id" label="Published above">The activity from the previous step</Annotation>
  </template>
</FeedExample>

### A Hypothetical Implementation in Vue

With Inertia, pass the same feed as a prop instead,
`Inertia::render('Home', ['feed' => Storyfeed::feed()->get()])`, and the page
hands it to the app's own composable and stream component:

```vue
<!-- resources/js/Pages/Home.vue -->
<script setup lang="ts">
import { usePoll } from '@inertiajs/vue3'
import { toRef } from 'vue'
import FeedStream from '@/feed/FeedStream.vue'   // the app's own component
import { useFeed } from '@/feed/useFeed'         // the app's own composable
import type { FeedPayload } from '@/feed/types'

const props = defineProps<{ feed: FeedPayload }>()

const { items, nextCursor, loadingMore, loadMore } = useFeed(
    toRef(() => props.feed),
    (cursor) => `/?cursor=${cursor}`,
)

usePoll(10_000, { only: ['feed'] })
</script>

<template>
    <FeedStream
        :items="items"
        :next-cursor="nextCursor"
        :loading-more="loadingMore"
        @load-more="loadMore"
    />
</template>
```

The composable holds the paging, the stream draws nodes, and the page supplies
the payload and the URL of the next page. None of it knows what an order is.

::: headless
:::
