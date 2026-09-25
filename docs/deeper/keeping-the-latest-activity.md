# Keeping the Latest Activity

## Introduction

`keepLatest()` leaves the latest activity for a verb in the feed.
Earlier matching activities are removed from the feed, including `log()`.

<script setup>
import { scene } from '../.vitepress/theme/world'
const [earlier, saved, otherActor] = scene.deeper.keepingLatest.saves.map(row => ({ ...row, data: null, glyph: null }))
</script>

<a id="declaring-the-policy"></a>

## Replacing Earlier Activities

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('save')
    ->headline(':actor saved :object')
    ->keepLatest(); // Earlier saves of this order are removed from log() too.
```

Publish normally. The verb's declaration applies at every call site:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/SaveOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class SaveOrderController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $order->update($request->validate(['notes' => ['nullable', 'string']]));

        Storyfeed::activity()->by($request->user())->action('save', $order)->publish();

        return to_route('orders.show', $order);
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/SaveOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class SaveOrderController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $order->update($request->validate(['notes' => ['nullable', 'string']]));

        Storyfeed::record(
            verb: 'save',
            object: $order,
            actor: $request->user(),
        );

        return to_route('orders.show', $order);
    }
}
```
:::

After successive saves of the same order, the feed contains the latest save:

<FeedExample :items="[saved]" />

Other objects and other verbs keep their activities.

<a id="keeping-the-latest-per-actor"></a>

## Choosing Matching Roles

Replace the original `save` declaration with this one:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('save')
    ->headline(':actor saved :object')
    ->keepLatest(per: ['object', 'actor']);
```

<FeedExample :items="[otherActor, saved]" />

The feed keeps each actor's latest save of each order. `per` takes one role name
or an array of role names. The verb is always part of the match. An activity
with an empty role in the match, such as an anonymous save under
`per: ['object', 'actor']`, replaces nothing.

## Limiting the Time Window

Add a time window to that declaration:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('save')
    ->headline(':actor saved :object')
    ->keepLatest(per: ['object', 'actor'], within: '10 minutes');
```

<FeedExample :items="[saved, earlier]" />

Only matching activities within ten minutes of the new activity's
`published_at` compete. Older saves outside that window remain in the feed.
`within` accepts a positive interval string or a `DateInterval`.

| Declaration | Matching Activities |
|---|---|
| `keepLatest()` | same object and verb, without a time limit |
| `keepLatest(per: ['object', 'actor'])` | same object, actor and verb |
| `keepLatest(within: '10 minutes')` | same object and verb, within ten minutes |
| no declaration | every activity remains |

## Deleting Superseded Activities

Superseded activities are soft-deleted by default. They leave the feed but
stay in the activities table until [pruning](/deeper/retention#pruning-activities)
removes them with the rest. To delete them as they are superseded:

```php memo="config/storyfeed.php"
'keep_latest' => [
    'delete' => 'force',
],
```

| Value | Superseded Activities |
|---|---|
| `'soft'` | soft-deleted; the default |
| `'force'` | deleted |

The latest `published_at` wins, regardless of arrival order. A backdated
activity older than a matching one is stored already soft-deleted, or not
stored at all under `'force'`.

<a id="queue-uniqueness-and-read-filtering"></a>

## Comparing With Unique Stories

[`ShouldBeUnique`](/deeper/stories#queueing-stories) keeps the first pending publish.
`keepLatest()` supersedes matching stored activities after publication.
