# Keeping the Latest Activity

## Introduction

`keepLatest()` keeps the latest matching activity in the feed and removes
earlier ones, including from `log()`.

<script setup>
import { scene, logOf } from '../.vitepress/theme/world'
const timeline = logOf(scene.cookbook.transitions.timeline)
// keepLatest removes the earlier placement before a reader groups the rows.
const latest = timeline.filter((row, index) => timeline.findIndex((other) =>
  other.verb === row.verb && other.object.id === row.object.id) === index)
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

Publish as usual. The declaration applies wherever you publish this verb:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/OrderController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateOrderRequest;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class OrderController extends Controller
{
    public function update(UpdateOrderRequest $request, Order $order): RedirectResponse
    {
        $order->update($request->validated());

        Storyfeed::activity()
            ->by($request->user())
            ->action('save', $order)
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/OrderController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateOrderRequest;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class OrderController extends Controller
{
    public function update(UpdateOrderRequest $request, Order $order): RedirectResponse
    {
        $order->update($request->validated());

        Storyfeed::record(
            verb: 'save',
            object: $order,
            actor: $request->user(),
        );

        return back();
    }
}
```
:::

After several saves of the same order, the feed contains only the latest:

<FeedExample :items="[saved]" />

Activities for other objects and verbs remain.

<span id="choosing-a-storage-policy"></span>
<span id="choosing-which-occurrences-to-keep"></span>
<span id="keeping-every-occurrence-or-the-latest"></span>

## Choosing Every Occurrence or the Latest

Suppose an order is placed, confirmed, amended, and placed again:

| Request | Every Occurrence | `keepLatest()` |
|---|---|---|
| first placement | append `placed` | replace `placed` |
| confirmation | append `confirmed` | replace `confirmed` |
| placed again after an amendment | append another `placed` | replace the earlier `placed` |
| visible rows afterward | first placement, confirmation, second placement | confirmation, second placement |

<span id="keeping-every-occurrence"></span>

Without a policy, the order's log keeps every placement:

<FeedExample :items="timeline" />

<span id="keeping-the-latest-occurrence"></span>

With `keepLatest()` on each verb, it keeps the latest activity for each verb:

<FeedExample :items="latest" />

Replaced activities disappear from every feed. Keep every activity if any
page needs the full timeline.

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

The feed keeps each actor's latest save of each order. Pass one role name or
an array to `per`; the verb is always part of the match. An activity replaces
nothing if a matching role is empty. For example, an anonymous save has no
recorded actor, so it replaces nothing under `per: ['object', 'actor']`.

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
`published_at` are considered. Older saves outside the window remain.
`within` accepts a positive interval string or a `DateInterval`.

| Declaration | Matching Activities |
|---|---|
| `keepLatest()` | same object and verb, without a time limit |
| `keepLatest(per: ['object', 'actor'])` | same object, actor and verb |
| `keepLatest(within: '10 minutes')` | same object and verb, within ten minutes |
| no declaration | every activity remains |

## Deleting Superseded Activities

By default, superseded activities are soft-deleted. They leave the feed but
remain in the activities table until [pruning](/maintenance/retention#pruning-activities).
To delete them permanently as they are superseded:

```php memo="config/storyfeed.php"
'keep_latest' => [
    'delete' => 'force',
],
```

| Value | Superseded Activities |
|---|---|
| `'soft'` | soft-deleted; the default |
| `'force'` | deleted |

Storyfeed keeps the latest `published_at`, regardless of arrival order.
A backdated activity older than a matching one is stored as soft-deleted, or
discarded under `'force'`.

<a id="queue-uniqueness-and-read-filtering"></a>

## Comparing With Unique Stories

[`ShouldBeUnique`](/recording/publishing-story-classes#queueing-stories) keeps the first pending
publication. `keepLatest()` replaces matching stored activities after publication.
