# Quickstart

One activity on the feed, in five steps. A customer places an order with a
kitchen.

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
    '*.order.placed' => ':actor placed :object with :target',
]);
```

## 3. Publish an Activity

<<< @/snippets/publish.php

## 4. Read It Back

```php
// a controller, or wherever the feed is read
$page = Storyfeed::feed()->involving($kitchen)->limit(20)->get();
```

`$page` is the payload envelope, and it is `Responsable`, so an endpoint is
one line:

```php
// routes/web.php
Route::get('/feed', fn () => Storyfeed::feed()->limit(20)->get());
```

## 5. Show It

Every node carries its own sentence with the entities already in it, so
drawing one needs no knowledge of your app:

<FeedStream :items="[scenes.order]" :grouped="false" />

How you draw it is open. A few lines of Blade, a Vue component, Livewire,
React, or a renderer package that draws it for you.
[Rendering](/basics/rendering) starts with the smallest loop that produces the
row above.

## Check Your Work

```bash
php artisan storyfeed:doctor
```

Doctor reads your registries and your actual traffic, and names each problem
with its fix: a verb with no headline, a group that would arrive unnamed, a
model in the feed that nothing publishes about.

That is a working feed. [The Basics](/basics/feedable-models) takes each of
these five steps in turn: linking an entity, the roles an activity can carry,
what a row can show beneath its sentence, reading modes and audiences, and
drawing it all.
