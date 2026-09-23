# Recording Activities

An activity is a verb plus the entities in its roles. You record one with an
explicit call, wherever the fact happens: an action, an observer, an event
listener.

<script setup>
import { who, where, orders, dishes, party, activity, scenes } from '../.vitepress/theme/samples'

const paid = activity({
  id: 'r2', verb: 'pay', glyph: 'credit-card',
  published_at: '2026-08-14T14:32:00.000000Z',
  headline_template: ':actor marked :object paid',
  actor: party.service, object: orders.first,
})

const priced = activity({
  id: 'r3', verb: 'reprice', glyph: 'tag',
  published_at: '2026-08-14T09:10:00.000000Z',
  headline_template: ':actor changed the price of :object',
  actor: who.cook, object: dishes.kottu,
})
</script>

## The Builder

Record an activity where the fact happens. The builder reads in the order of
the headline it produces:

::: code-group
<<< @/snippets/publish-from-controller.php [Fluent Syntax]
<<< @/snippets/publish-from-controller.named-arguments.php [Named Arguments]
:::

<FeedExample context :items="[scenes.order]" />

The first argument to `action()` is the **verb**: a plain string naming what
happened. `place` is this app's own word, not one the package knows. Nothing
is registered first; the package stores the string and hands it back.

`Storyfeed::record()` records the same activity in one call, with each role as
a named argument. Every recording example on this site shows both forms.

## Roles

| Role | Question It Answers | Example |
|---|---|---|
| `actor` | who did it | the customer |
| `object` | what it was done to | the order |
| `target` | what the act was directed at | the kitchen |
| `context` | where it happened | the surrounding container |
| `origin` | where it came from | the source of an accepted invitation |
| `result` | what it produced | a receipt, a generated artifact |
| `instrument` | what it happened via | the device an order was taken on |

Direction decides the role. The same tablet is a `target` for an order sent
**to** it and an `instrument` for an order taken **on** it.

## Reading as a Sentence

Each role has a setter named for it: `actor()`, `object()`, `target()`,
`context()`, `origin()`, `result()` and `instrument()`; `verb()` sets the verb.
Aliases let the call site read as the sentence:

| Alias | Sets | Reads As |
|---|---|---|
| `->by()` | `actor` | who acted |
| `->action()` | `verb` and `object` | what they did, to what |
| `->using()` | `instrument` | what they acted via |
| `->resulting()` | `result` | what they produced |
| `->to()` `->for()` `->on()` `->with()` `->into()` `->in()` `->from()` | `target` | what it was aimed at |

An alias and its setter record identical rows. `context` is set only by
`->context()`; `->in()` and `->from()` set the target, not the container.

## The Actor

Omit the actor and the authenticated user is recorded. When a webhook or a
job records the fact, there is no authenticated user, so name the actor:

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Storyfeed\Facades\Storyfeed;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $order = Order::where('payment_intent', $request->input('data.object.id'))
            ->firstOrFail();

        $order->update(['paid_at' => now()]);

        Storyfeed::activity()
            ->by('Stripe')
            ->action('pay', $order)
            ->publish();

        return response()->noContent();
    }
}
```

```php [Named Arguments]
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Storyfeed\Facades\Storyfeed;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $order = Order::where('payment_intent', $request->input('data.object.id'))
            ->firstOrFail();

        $order->update(['paid_at' => now()]);

        Storyfeed::record(
            verb: 'pay',
            object: $order,
            actor: 'Stripe',
        );

        return response()->noContent();
    }
}
```
:::

<FeedExample :items="[paid]" />

A string actor is a [party](/deeper/parties): a named participant with no
model. When nothing names an actor, the activity has none, and the actor is
unknown.

## Extra Data and Backdating

`->data()` adds values to the activity itself. They arrive in its node:

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePriceRequest;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class MenuItemPriceController extends Controller
{
    public function update(
        UpdatePriceRequest $request,
        MenuItem $dish,
    ): RedirectResponse {
        $from = $dish->price;

        $dish->update(['price' => $request->integer('price')]);

        Storyfeed::activity()
            ->by($request->user())
            ->action('reprice', $dish)
            ->data(['from' => $from, 'to' => $dish->price])
            ->publish();

        return back();
    }
}
```

```php [Named Arguments]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePriceRequest;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class MenuItemPriceController extends Controller
{
    public function update(
        UpdatePriceRequest $request,
        MenuItem $dish,
    ): RedirectResponse {
        $from = $dish->price;

        $dish->update(['price' => $request->integer('price')]);

        Storyfeed::record(
            verb: 'reprice',
            object: $dish,
            actor: $request->user(),
            data: ['from' => $from, 'to' => $dish->price],
        );

        return back();
    }
}
```
:::

<FeedExample :items="[priced]" />

`->publishedAt()` backdates an activity, for imports and backfills:

::: code-group
```php [Fluent Syntax]
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

```php [Named Arguments]
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

## Replacing Instead of Appending

A price edited five times before the menu goes live is one fact.
`->replace()` supersedes the earlier row with the same object and verb, so
each edit leaves one row:

::: code-group
```php [Fluent Syntax]
// app/Http/Controllers/MenuItemPriceController.php, update()
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($request->user())
    ->action('reprice', $dish)
    ->data(['from' => $from, 'to' => $dish->price])
    ->replace() // [!code highlight]
    ->publish();
```

```php [Named Arguments]
// app/Http/Controllers/MenuItemPriceController.php, update()
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'reprice',
    object: $dish,
    actor: $request->user(),
    data: ['from' => $from, 'to' => $dish->price],
    replace: true, // [!code highlight]
);
```
:::

<FeedExample :items="[priced]" />

`data` is not part of the key. Which verbs should replace is in
[Repeating Activities](/cookbook/repeating-activities).

## Recording Many Objects at Once

`->objects()` records one activity about many objects:

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class PublishMenuController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $dishes = MenuItem::whereIn('id', $request->input('dishes'))->get();

        $dishes->each->update(['published_at' => now()]);

        Storyfeed::activity()
            ->by($request->user())
            ->verb('publish')
            ->objects($dishes)
            ->publish();

        return back();
    }
}
```

```php [Named Arguments]
<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class PublishMenuController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $dishes = MenuItem::whereIn('id', $request->input('dishes'))->get();

        $dishes->each->update(['published_at' => now()]);

        Storyfeed::record(
            verb: 'publish',
            objects: $dishes,
            actor: $request->user(),
        );

        return back();
    }
}
```
:::

[Composites](/deeper/composites) covers how that activity reads and groups.
