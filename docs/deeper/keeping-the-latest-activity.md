# Keeping the Latest Activity

## Introduction

`keepLatest()` leaves the latest activity for a verb in the feed.
Earlier matching activities leave every read mode, including `log()`.

<script setup>
import { activity, who, orders } from '../.vitepress/theme/samples'
const saved = { ...activity({ id: 'latest-save', verb: 'save', glyph: null,
  published_at: '2026-08-14T14:32:00.000000Z',
  headline_template: ':actor saved :object', actor: who.regular, object: orders.first }), data: null }
const otherActor = { ...saved, id: 'latest-save-other', actor: who.cook,
  published_at: '2026-08-14T14:33:00.000000Z' }
const earlier = { ...saved, id: 'earlier-save',
  published_at: '2026-08-14T14:00:00.000000Z' }
</script>

<a id="declaring-the-policy"></a>

## Keeping the Latest Activity

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('save')
    ->headline(':actor saved :object')
    ->keepLatest(); // Earlier saves of this order leave log() too.
```

After successive saves of the same order, the feed contains the latest save:

<FeedExample :items="[saved]" />

Publish normally. The verb's declaration applies at every call site:

::: code-group
```php [Fluent Syntax]
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

```php [Named Arguments]
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

<FeedExample :items="[saved]" />

The latest `published_at` wins, regardless of arrival order. A backdated activity
older than a matching live activity is stored already superseded. Other objects
and other verbs keep their activities.

<a id="keeping-the-latest-per-actor"></a>

## Choosing Matching Roles

Replace the original `save` declaration with this one:

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('save')
    ->headline(':actor saved :object')
    ->keepLatest(per: ['object', 'actor']);
```

<FeedExample :items="[otherActor, saved]" />

The feed keeps each actor's latest save of each order. `per` takes one role name
or an array of role names. The verb is always part of the match.

## Limiting the Time Window

Add a time window to that declaration:

```php
// routes/feed.php
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

Superseded activities are soft-deleted by default. The
`storyfeed.keep_latest.delete` setting controls their deletion mode.

## Queue Uniqueness and Read Filtering

[`ShouldBeUnique`](/deeper/queues#unique-stories) keeps the first pending publish.
`keepLatest()` supersedes matching stored activities after publication.
[`latestPer()`](/deeper/latest-per-object) filters one feed's results while
keeping every activity stored.

Story classes do not support `#[DebounceFor]`. Use `keepLatest(within:)` when
successive publications should supersede earlier stored activities within a
window.
