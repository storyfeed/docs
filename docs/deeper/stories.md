# Story Classes

A Story class says what each of a model's verbs reads as, one method per verb.
Call sites never touch it: they name the verb, the way a link names a route.

<script setup>
import { who, where, orders, dishes, party, activity, tombstone, scenes } from '../.vitepress/theme/samples'

const completed = activity({ id: 'sc1', verb: 'complete', glyph: null,
  published_at: '2026-08-14T14:52:00.000000Z',
  headline_template: ':actor completed :object',
  actor: who.cook, object: orders.first })

const paid = activity({ id: 'sc2', verb: 'confirm_payment', glyph: 'credit-card',
  published_at: '2026-08-14T14:34:00.000000Z',
  headline_template: ':actor confirmed payment for :object',
  actor: party.service, object: orders.first })

const placedWithoutTarget = activity({ id: 'sc3', verb: 'place', glyph: 'shopping-bag',
  published_at: '2026-08-14T14:32:00.000000Z',
  headline_template: ':actor placed :object',
  actor: who.customer2, object: orders.second })

const gone = activity({ ...scenes.order, id: 'sc4',
  object: tombstone('order', '31', '2026-08-14T15:05:00.000000Z'),
  missing_headline_template: ':actor placed an order that is no longer available' })

const live = activity({ id: 'sc5', verb: 'publish', glyph: 'chef-hat',
  published_at: '2026-08-14T09:00:00.000000Z',
  headline_template: ':actor put :object on the menu',
  actor: who.cook, object: dishes.kottu })
</script>

## Binding a Story Class

```php
// routes/feed.php
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class);
```

`routes/feed.php` binds the class to the model once, as a route file binds a
resource controller. Everything about each verb lives in the class.

## Writing a Story Class

```php
<?php

namespace App\Stories;

use Illuminate\Http\Request;
use Storyfeed\Stories\Verb;

class OrderStory
{
    public function place(Verb $verb): Verb // [!code focus]
    { // [!code focus]
        return $verb // [!code focus]
            ->headline(':actor placed :object[ with :target]') // [!code focus]
            ->icon('shopping-bag') // [!code focus]
            ->missingHeadline(':actor placed an order that is no longer available'); // [!code focus]
    } // [!code focus]

    public function complete(): string // [!code focus]
    { // [!code focus]
        return ':actor completed :object'; // [!code focus]
    } // [!code focus]

    public function confirmPayment(Verb $verb, Request $request): Verb // [!code focus]
    { // [!code focus]
        return $verb // [!code focus]
            ->headline(':actor confirmed payment for :object') // [!code focus]
            ->icon('credit-card') // [!code focus]
            ->actor($request->hasHeader('Paddle-Signature') ? 'Paddle' : 'Stripe'); // [!code focus]
    } // [!code focus]

    protected function reference(): string
    {
        return 'order';   // a helper: protected, so it is not a verb
    }
}
```

<FeedExample context :items="[completed, paid, placedWithoutTarget]" />

The class extends nothing. Every public method is a verb, and it receives a
`Storyfeed\Stories\Verb` to fill in: the same definition `Story::verb()`
returns in `routes/feed.php`, with the same methods.

| Method | Stored Verb | Headline |
|---|---|---|
| `place()` | `place` | `:actor placed :object[ with :target]` |
| `complete()` | `complete` | `:actor completed :object` |
| `confirmPayment()` | `confirm_payment` | `:actor confirmed payment for :object` |
| none | `create`, `update`, `delete`, `restore` | the [defaults](/basics/the-feed-file#a-model-s-everyday-verbs) |

To add a verb, add a method. Nothing else names it.

### Verbs From Method Names

The method name is the verb, snake-cased when it has more than one word:

| Method | Stored Verb |
|---|---|
| `pay()` | `pay` |
| `store()` | `store` |
| `confirmPayment()` | `confirm_payment` |
| `markAsPaid()` | `mark_as_paid` |

Nothing else is mapped: `store()` records `store`, and `create()` records
`create`.

### What an Action Returns

Each method declares its return type:

| Return Type | The Method Returns |
|---|---|
| `Storyfeed\Stories\Verb` | the definition it received, filled in |
| `string` | the headline, and nothing else |
| `array` | the definition as an array, one key per `Verb` method |

```php
// app/Stories/OrderStory.php
public function refund(): array
{
    return [
        'headline' => ':actor refunded :object',
        'icon' => 'rotate-ccw',
    ];
}
```

A public method with another return type, or none, stops the definitions from
compiling:

```txt
[App\Stories\OrderStory@total] is a public method of a resource Story class, so it is an action,
and it returns [int]. An action returns Storyfeed\Stories\Verb, string (the headline) or array
(the array form). If it is a helper, make it protected or private.
```

### Conventional Verbs

`Story::resource()` always defines `create`, `update`, `delete` and
`restore`. A method named for one of them replaces its default whole; the
others keep theirs. `only()` and `except()` name verbs as they are stored:

```php
// routes/feed.php
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class)
    ->except('restore', 'confirm_payment'); // [!code focus]
```

## Publishing a Verb

A customer places an order:

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $order->update(['status' => 'placed']);

        story('place', $order) // [!code focus]
            ->by($request->user()) // [!code focus]
            ->to($order->kitchen) // [!code focus]
            ->publish(); // [!code focus]

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

class CheckoutController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $order->update(['status' => 'placed']);

        Storyfeed::record( // [!code focus]
            verb: 'place', // [!code focus]
            object: $order, // [!code focus]
            actor: $request->user(), // [!code focus]
            target: $order->kitchen, // [!code focus]
        ); // [!code focus]

        return to_route('orders.show', $order);
    }
}
```
:::

<FeedExample context :items="[scenes.order]" />

The call names the verb, and Storyfeed finds the method that declares it. The
verb is the public handle, as a route's name is, and the Story class is the
declaration behind it:

| Laravel | Storyfeed |
|---|---|
| `Route::resource('orders', OrderController::class)` | `Story::resource(Order::class, OrderStory::class)` |
| `route('orders.show', $order)` | `story('place', $order)`, `Act::Complete->of($order)` |
| `route:list` | `storyfeed:list` |
| an unknown route name throws | an unknown verb throws in `local` and `testing` (`verbs.strict`) |

Nothing instantiates `OrderStory` at a call site, as nothing instantiates a
controller. So it has no `publish()`: the call site starts from the verb.

## Using the Request

A method may take the `Request`. The same webhook route serves two payment
providers, and the verb names whichever one called:

```php
// app/Stories/OrderStory.php
public function confirmPayment(Verb $verb, Request $request): Verb
{
    return $verb
        ->headline(':actor confirmed payment for :object')
        ->icon('credit-card')
        ->actor($request->hasHeader('Paddle-Signature') ? 'Paddle' : 'Stripe'); // [!code focus]
}
```

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PaymentWebhookController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $order = Order::where('payment_intent', $request->input('data.object.id'))->firstOrFail();

        $order->update(['paid_at' => now()]);

        story('confirm_payment', $order)->publish(); // the verb names the actor // [!code focus]

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

class PaymentWebhookController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $order = Order::where('payment_intent', $request->input('data.object.id'))->firstOrFail();

        $order->update(['paid_at' => now()]);

        Storyfeed::record( // [!code focus]
            verb: 'confirm_payment', // [!code focus]
            object: $order, // the verb names the actor // [!code focus]
        ); // [!code focus]

        return response()->noContent();
    }
}
```
:::

<FeedExample :items="[paid]" />

The verb's actor applies when the call site names none and no
`Storyfeed::as()` scope is open. A name the verb gives must be a
[declared party](/deeper/parties#declaring-parties).

Only the actor may come from the request. A method runs once when the
definitions compile, with an empty request, and what it returns there is what
the feed reads. A method that takes the `Request` runs again at each publish of
its verb, and only its `->actor()` is used:

| Read From the Compiled Definition | Read at Each Publish |
|---|---|
| the headlines, icon, intent, grouping and every other setting | `->actor()` |

A method whose headline changes with the request throws at that publish in
`local` and `testing`, where `grammar.strict` is on:

```txt
[App\Stories\OrderStory@confirmPayment] returned a different headline for this request than when
stories compiled. An action that takes the request may only use it to choose the actor: everything
else is read when no request exists (the feed, storyfeed:list, the doctor, storyfeed:cache), so it
must not depend on one.
```

## When the Object Is Deleted

`->missingHeadline()` gives a verb its own reading once the object it is about
has been deleted:

```php
// app/Stories/OrderStory.php
public function place(Verb $verb): Verb
{
    return $verb
        ->headline(':actor placed :object[ with :target]')
        ->icon('shopping-bag')
        ->missingHeadline(':actor placed an order that is no longer available'); // [!code focus]
}
```

<FeedExample :items="[gone]" />

`->forgetWhenMissing()` deletes the verb's activities instead, once the
deletion is permanent. Both are in [Deleted Models](/deeper/deleted-models).

## One-Verb Story Classes

A verb can also have a class of its own, which extends `Story`:

```php
<?php

namespace App\Stories;

use Storyfeed\Stories\Story;

class DishWentLive extends Story
{
    public function headline(): string
    {
        return ':actor put :object on the menu';
    }

    public function icon(): ?string
    {
        return 'chef-hat';
    }
}
```

`routes/feed.php` binds it to its verb, as a route binds an invokable
controller:

```php
// routes/feed.php
use App\Models\MenuItem;
use App\Stories\DishWentLive;
use Storyfeed\Facades\Story;

Story::for(MenuItem::class)->verb('publish', DishWentLive::class); // [!code focus]
```

A one-verb class is dispatched from the call site, as a job is:

```php
// app/Http/Controllers/MenuItemController.php, publish()
use App\Stories\DishWentLive;

DishWentLive::of($dish)->by($request->user())->publish();
```

<FeedExample :items="[live]" />

`of()` takes the activity's object. On an enum case it reads the same:
`Act::Complete->of($order)`.

| Member | Required | |
|---|---|---|
| `headline()` | yes | the singular template |
| `icon()`, `intent()` | no | the glyph and what it means |
| `groups()` | no | a `Group` per axis, each with its group headline |
| `missing()` | no | the roles the activity is about |
| `$verb`, `$objectType` | when not bound | the verb, and a model class, a morph alias, or a list of either |

A verb defined in two places, by a method, a class or a line in
`routes/feed.php`, stops the definitions from compiling, and the error names
both.

## Generating Story Classes

```bash
php artisan make:story OrderStory --resource --model=Order
```

```txt
   INFO  Story [app/Stories/OrderStory.php] created successfully.

   INFO  Bind it in routes/feed.php:

    Story::resource(\App\Models\Order::class, \App\Stories\OrderStory::class);
```

The class has a method for each conventional verb, returning its default.
`make:story` never edits `routes/feed.php`. Without `--resource`, it writes a
one-verb class:

```bash
php artisan make:story DishWentLive --verb=publish --model=MenuItem
```

## Listing Verbs

```bash
php artisan storyfeed:list --type=order
```

```txt
+-------+-----------------+---------------------------------------+--------------------------------------+----------------------+--------------+--------+--------+---------------------------------------+
| Type  | Verb            | Action                                | Headline                             | Anonymous headline   | Icon         | Intent | Groups | Source                                |
+-------+-----------------+---------------------------------------+--------------------------------------+----------------------+--------------+--------+--------+---------------------------------------+
| order | complete        | App\Stories\OrderStory@complete       | :actor completed :object             |                      |              |        |        | App\Stories\OrderStory@complete       |
| order | confirm_payment | App\Stories\OrderStory@confirmPayment | :actor confirmed payment for :object |                      | credit-card  |        |        | App\Stories\OrderStory@confirmPayment |
| order | create          |                                       | :actor created :object               | :object was created  | plus         |        |        | routes/feed.php:7                     |
| order | delete          |                                       | :actor deleted :object               | :object was deleted  | trash        |        |        | routes/feed.php:7                     |
| order | place           | App\Stories\OrderStory@place          | :actor placed :object[ with :target] |                      | shopping-bag |        |        | App\Stories\OrderStory@place          |
| order | restore         |                                       | :actor restored :object              | :object was restored | rotate-ccw   |        |        | routes/feed.php:7                     |
| order | update          |                                       | :actor updated :object               | :object was updated  | pencil       |        |        | routes/feed.php:7                     |
+-------+-----------------+---------------------------------------+--------------------------------------+----------------------+--------------+--------+--------+---------------------------------------+
  Showing [7] definitions
```

The Action column names the method that declares each verb. A new method is a
new verb once the definitions are compiled again, so run `storyfeed:cache`
after deploying, as you run `route:cache`.
