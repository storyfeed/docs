# Recording Activities

<script setup>
import { scene, role, entity } from '../.vitepress/theme/world'

// A price change draws no card: the item's details would show today's price, not the change.
const recorded = scene.basics.recording.priced
const priced = { ...recorded, object: { ...recorded.object, body: null }, data: { from: 275, to: 295 } }
// The same change, imported with a date from long ago.
const backdated = { ...priced, published_at: scene.distant.published_at }
// The order again, placed at the mall from the shop's app: a string names a party.
const app = entity('storyfeed.party', 'ios-app', 'iOS app', null, { data: { key: 'ios-app', type: 'Service' } })
const placedInApp = { ...scene.order, location: role.mall, generator: app }
// A delivery booked with a courier's API: an entity with no model behind it.
const delivery = entity('delivery', 'DL-4821', 'Delivery DL-4821', 'https://courier.example/track/DL-4821')
const booked = { ...scene.order, verb: 'book', headline_template: ':actor booked :result for :object',
  glyph: null, glyph_intent: null, actor: role.staff, target: null, result: delivery }
// The shop closed over a few days, a week after the closure was recorded.
const day = 24 * 60 * 60 * 1000
const iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, '.000000Z')
const recordedAt = Date.parse(scene.order.published_at)
const closed = { ...scene.order, verb: 'close', headline_template: ':actor closed :object',
  glyph: null, glyph_intent: null, actor: role.staff, object: role.shop, target: null,
  starts_at: iso(recordedAt + 7 * day), ends_at: iso(recordedAt + 9 * day) }
</script>

## Introduction

An activity records a verb and its participants. Publish it from the code that
handles the action, such as a controller, observer, or event listener.

<a id="the-builder"></a>

## Publishing Activities

<a id="fluent-recording"></a>

Assign the activity's roles and call the `publish` method:

::: code-group
<<< @/snippets/publish-from-controller.php {php memo="app/Http/Controllers/OrderController.php"} [Fluent Syntax]
<<< @/snippets/publish-from-controller.named-arguments.php {php memo="app/Http/Controllers/OrderController.php"} [Named Arguments]
:::

<FeedExample :items="[scene.order]" />

The first argument to the `action` method is the **verb**, a string describing
the action. This example records `place`. Define its headline in
[The Feed File](/basics/the-feed-file).

<a id="named-arguments"></a>

You may also call the `record` method on the `Storyfeed` facade, passing each
role as a named argument.

<a id="roles"></a>

## Assigning Roles

| Role | Meaning | Example |
|---|---|---|
| `actor` | who performed the action | the customer |
| `object` | the entity acted on | the order |
| `target` | the entity the action was directed at | the shop |
| `context` | the containing entity | the shop where the action occurred |
| `origin` | the source | the source of an accepted invitation |
| `result` | the entity produced | a receipt or generated file |
| `instrument` | the tool or service used | the device used to take an order |
| `location` | where the action happened | the mall the shop is in |
| `generator` | the app or agent that produced the activity | the app the order was placed from |

Containers above the object, target or context come from each model's
[`parent()` declaration](/deeper/distant-relations).

Choose the role based on the entity's involvement. A tablet is a `target` when
an order is sent to it, or an `instrument` when used to take the order.

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/OrderController.php" at="store(), after creating $order"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($order->customer)
    ->action('place', $order)
    ->to($order->shop)
    ->at($order->shop->mall)
    ->generator('iOS app')
    ->publish();
```

```php [Named Arguments] memo="app/Http/Controllers/OrderController.php" at="store(), after creating $order"
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'place',
    object: $order,
    actor: $order->customer,
    target: $order->shop,
    location: $order->shop->mall,
    generator: 'iOS app',
);
```
:::

<FeedExample :items="[placedInApp]" />

> [!NOTE]
> A role names a participant: a model, a party, or an
> [entity without a model](#entities-without-a-model). A nonempty string
> passed to a role method creates or reuses a named party.
> Store names, email addresses, amounts, dates, and settings in activity data.
> Use a [dynamic headline](/basics/the-feed-file#dynamic-headlines) to display
> those values. [Recording Value Changes](/cookbook/recording-value-changes)
> compares the roles, data, and party queries for a rename.

These roles come from [W3C Activity Streams 2.0](/deeper/activity-streams).

<a id="reading-as-a-sentence"></a>

### Role Aliases

Each role has a method with the same name, such as `actor` or `object`.
The `verb` method sets the verb. You may also use these aliases:

| Alias | Sets | Meaning |
|---|---|---|
| `->by()` | `actor` | who performed the action |
| `->action()` | `verb` and `object` | the action and affected entity |
| `->using()` | `instrument` | the tool or service used |
| `->at()` | `location` | where the action happened |
| `->resulting()` | `result` | the entity produced |
| `->to()` `->for()` `->on()` `->with()` `->into()` `->in()` `->from()` | `target` | the entity the action was directed at |

### Entities Without a Model

To fill a role with something your application has no model for, such as a
delivery booked through a courier's API, pass an array with a `type` and a
`label`:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/BookDeliveryController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Storyfeed\Facades\Storyfeed;

class BookDeliveryController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $delivery = Http::post('https://courier.example/deliveries', [
            'reference' => $order->reference,
        ])->json();

        Storyfeed::activity()
            ->by($request->user())
            ->action('book', $order)
            ->resulting([
                'type' => 'delivery',
                'id' => $delivery['id'],
                'label' => "Delivery {$delivery['id']}",
                'url' => $delivery['tracking_url'],
            ])
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/BookDeliveryController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Storyfeed\Facades\Storyfeed;

class BookDeliveryController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $delivery = Http::post('https://courier.example/deliveries', [
            'reference' => $order->reference,
        ])->json();

        Storyfeed::record(
            verb: 'book',
            object: $order,
            actor: $request->user(),
            result: [
                'type' => 'delivery',
                'id' => $delivery['id'],
                'label' => "Delivery {$delivery['id']}",
                'url' => $delivery['tracking_url'],
            ],
        );

        return back();
    }
}
```
:::

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('book')->headline(':actor booked :result for :object');
```

<FeedExample :items="[booked]" />

| Key | Holds |
|---|---|
| `type` | the entity's type; required |
| `label` | the entity's label; required |
| `id` | an identifier of up to 36 characters |
| `url` | the entity's link |
| `data` | values stored with the entity |
| `body` | the entity's [bodies](/basics/activity-content) |

Storyfeed stores the entity with the activity, exactly as recorded: nothing
refreshes it later. The activity's `inlineEntity` method returns the stored
array for a role, such as `$activity->inlineEntity('result')`, or `null` when
the role holds a model, a party, or nothing. See
[Entities](/reference/payload#entities) for its payload.

<a id="the-actor"></a>

## Assigning the Actor

The actor is the user or model that performed the activity. You may specify
the actor using the `by` method:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/OrderController.php" at="store(), after creating $order"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($order->customer)
    ->action('place', $order)
    ->to($order->shop)
    ->publish();
```

```php [Named Arguments] memo="app/Http/Controllers/OrderController.php" at="store(), after creating $order"
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'place',
    object: $order,
    actor: $order->customer,
    target: $order->shop,
);
```
:::

<FeedExample :items="[scene.order]" />

With the default configuration and no scoped or verb-specific actor, omitting
`by` records the authenticated user, or no actor when nobody is signed in.
Other sources can supply the actor; see
[Role Precedence](/deeper/activity-scopes#role-precedence).

Use `by(null)` to bypass default actor selection explicitly. An
[anonymous activity](/deeper/parties#recording-anonymous-activities) has no
recorded actor.

## Adding Activity Data

Use the `data` method to store arbitrary values on an activity. Storyfeed
returns them in the activity’s `data` field:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/MenuItemPriceController.php"
<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class MenuItemPriceController extends Controller
{
    public function update(Request $request, MenuItem $menuItem): RedirectResponse
    {
        $from = $menuItem->price;

        $menuItem->update(['price' => $request->integer('price')]);

        Storyfeed::activity()
            ->by($request->user())
            ->action('reprice', $menuItem)
            ->data(['from' => $from, 'to' => $menuItem->price])
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/MenuItemPriceController.php"
<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class MenuItemPriceController extends Controller
{
    public function update(Request $request, MenuItem $menuItem): RedirectResponse
    {
        $from = $menuItem->price;

        $menuItem->update(['price' => $request->integer('price')]);

        Storyfeed::record(
            verb: 'reprice',
            object: $menuItem,
            actor: $request->user(),
            data: ['from' => $from, 'to' => $menuItem->price],
        );

        return back();
    }
}
```
:::

<FeedExample :items="[priced]" expanded />

> [!NOTE]
> On MySQL, JSON object key order may differ from the order you wrote because
> native JSON columns normalise it.

Declare the verb and its headline in `routes/feed.php`:

```php memo="routes/feed.php"
use App\Models\MenuItem;
use Storyfeed\Facades\Story;

Story::for(MenuItem::class)->verb('reprice')
    ->headline(':actor changed the price of :object');
```

## Setting the Publication Time

To set an earlier publication time, such as when importing records, call the
`publishedAt` method:

::: code-group
```php [Fluent Syntax] memo="app/Console/Commands/ImportPriceHistory.php"
<?php

namespace App\Console\Commands;

use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Console\Command;
use Storyfeed\Facades\Storyfeed;

class ImportPriceHistory extends Command
{
    protected $signature = 'menu:import-prices {file}';

    public function handle(): void
    {
        $rows = json_decode(file_get_contents($this->argument('file')), true);

        foreach ($rows as $row) {
            Storyfeed::activity()
                ->by(User::findOrFail($row['user_id']))
                ->action('reprice', MenuItem::findOrFail($row['menu_item_id']))
                ->data(['from' => $row['from'], 'to' => $row['to']])
                ->publishedAt($row['changed_at'])
                ->publish();
        }
    }
}
```

```php [Named Arguments] memo="app/Console/Commands/ImportPriceHistory.php"
<?php

namespace App\Console\Commands;

use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Console\Command;
use Storyfeed\Facades\Storyfeed;

class ImportPriceHistory extends Command
{
    protected $signature = 'menu:import-prices {file}';

    public function handle(): void
    {
        $rows = json_decode(file_get_contents($this->argument('file')), true);

        foreach ($rows as $row) {
            Storyfeed::record(
                verb: 'reprice',
                object: MenuItem::findOrFail($row['menu_item_id']),
                actor: User::findOrFail($row['user_id']),
                data: ['from' => $row['from'], 'to' => $row['to']],
                publishedAt: $row['changed_at'],
            );
        }
    }
}
```
:::

<FeedExample :items="[backdated]" />

## Recording a Time Range

When an activity describes something that spans a period, such as a closure
or a meeting, record its start and end with the `startsAt` and `endsAt`
methods:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/CloseShopController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class CloseShopController extends Controller
{
    public function __invoke(Request $request, Shop $shop): RedirectResponse
    {
        $request->validate([
            'from' => ['required', 'date'],
            'until' => ['required', 'date', 'after_or_equal:from'],
        ]);

        Storyfeed::activity()
            ->by($request->user())
            ->action('close', $shop)
            ->startsAt($request->date('from'))
            ->endsAt($request->date('until'))
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/CloseShopController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class CloseShopController extends Controller
{
    public function __invoke(Request $request, Shop $shop): RedirectResponse
    {
        $request->validate([
            'from' => ['required', 'date'],
            'until' => ['required', 'date', 'after_or_equal:from'],
        ]);

        Storyfeed::record(
            verb: 'close',
            object: $shop,
            actor: $request->user(),
            startsAt: $request->date('from'),
            endsAt: $request->date('until'),
        );

        return back();
    }
}
```
:::

```php memo="routes/feed.php"
use App\Models\Shop;
use Storyfeed\Facades\Story;

Story::for(Shop::class)->verb('close')->headline(':actor closed :object');
```

<FeedExample :items="[closed]" />

Storyfeed returns the range in the activity's `starts_at` and `ends_at` fields.
It is stored beside `published_at`, which still orders the feed. Either end
may be left out for an open range, and an end before the start throws an
`InvalidArgumentException`.

<a id="recording-many-objects-at-once"></a>

## Recording Multiple Objects

To record an activity involving multiple objects, call the `objects` method.
Storyfeed stores a parent activity and one activity per object. Define the verb once; the same definition covers the parent activity:

```php memo="routes/feed.php"
use Storyfeed\Facades\Story;

Story::verb('upload')->headline(':actor uploaded :object');
```

Then publish the photos:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/PhotoController.php"
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Storyfeed\Facades\Storyfeed;

class PhotoController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $photos = collect($request->file('photos'))->map(
            fn (UploadedFile $file) => $request->user()->photos()->create([
                'path' => $file->store('photos'),
            ]),
        );

        Storyfeed::activity()
            ->by($request->user())
            ->verb('upload')
            ->objects($photos)
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/PhotoController.php"
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Storyfeed\Facades\Storyfeed;

class PhotoController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $photos = collect($request->file('photos'))->map(
            fn (UploadedFile $file) => $request->user()->photos()->create([
                'path' => $file->store('photos'),
            ]),
        );

        Storyfeed::record(
            verb: 'upload',
            objects: $photos,
            actor: $request->user(),
        );

        return back();
    }
}
```
:::

See [Composites](/deeper/composites) for how these activities appear in the feed
and how to define their headlines.
