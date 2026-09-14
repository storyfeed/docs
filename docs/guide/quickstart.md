# Quickstart

Three steps until your app is recording activities, and a look at what comes
back. The example is a customer placing an order with a kitchen.

<script setup>
import { scenes } from '../.vitepress/theme/samples'
</script>

## 1. Make the Models Feedable

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

## 2. Give the Verb a Headline

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::grammar([
    'order.placed' => ':actor placed :object with :target',
]);
```

## 3. Publish an Activity

<<< @/snippets/publish.php

That is the activity, and this is it on a feed:

<FeedStream :items="[scenes.order]" :grouped="false" />

Call it wherever the fact becomes true: an action, an observer, an event
listener.

## 4. See the Feed

One call returns everything the kitchen took part in:

```php
// a controller, or wherever the feed is read
$page = Storyfeed::feed()->involving($kitchen)->get();
```

<FeedStream :items="[scenes.order]" :grouped="false" />

Each node carries its own sentence with the entities already in it, so drawing
one needs no knowledge of your app. [Reading Feeds](/basics/reading) covers
what else that call can ask for, and [Rendering](/basics/rendering) covers
drawing it.

::: details What the markup looks like

A page hands the payload to a composable and the composable to the stream.
This is a production call site, with the names changed:

```vue
<!-- resources/js/Pages/Kitchen/Feed.vue -->
<script setup lang="ts">
import { usePoll } from '@inertiajs/vue3'
import { toRef } from 'vue'
import FeedStream from '@/components/feed/FeedStream.vue'
import { useFeedStream } from '@/composables/useFeedStream'

const props = defineProps<{ feed: FeedPayload }>()

const { items, nextCursor, loadingMore, loadMore } = useFeedStream(
    toRef(() => props.feed),
    (cursor) => feedPage.url({ query: { kitchen: props.kitchen.id, cursor } }),
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

Nothing there knows what an order is. The composable holds the paging and the
reconciliation rules, the stream draws nodes, and the page supplies a payload
and a URL to ask for more of it.
:::


## Check Your Work

```bash
php artisan storyfeed:doctor
```

Doctor reads your registries and your actual traffic, and names each problem
with its fix: a verb with no headline, a group that would arrive unnamed, a
model in the feed that nothing publishes about.

## Where to Go Next

Your app is recording. Everything else is a choice you have not had to make
yet: which activities each surface shows, how bursts of them collapse into one
line, what a row carries beneath its sentence, and how any of it is drawn.
[The Basics](/basics/feedable-models) takes them in order.
