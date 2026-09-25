# Story Classes

Story classes keep activity definitions together. A resource class holds a
model's verbs; a class that extends `Story` publishes one activity with its data.

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
  missing_headline_template: ':actor placed an order, since deleted' })

const live = activity({ id: 'sc5', verb: 'publish', glyph: 'chef-hat',
  published_at: '2026-08-14T09:00:00.000000Z',
  headline_template: ':actor put :object on the menu',
  actor: who.cook, object: dishes.kottu })
</script>

## Defining a Verb

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('complete')->headline(':actor completed :object');
```

<FeedExample :items="[completed]" />

When the feed file gets long, move a model's verb definitions into a resource
class. The binding below replaces the individual definition above.

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
    public function place(Verb $verb): Verb
    {
        return $verb
            ->headline(':actor placed :object[ with :target]')
            ->icon('shopping-bag')
            ->missingHeadline(':actor placed an order, since deleted');
    }

    public function complete(): string
    {
        return ':actor completed :object';
    }

    public function confirmPayment(Verb $verb, Request $request): Verb
    {
        return $verb
            ->headline(':actor confirmed payment for :object')
            ->icon('credit-card')
            ->actor($request->hasHeader('Paddle-Signature') ? 'Paddle' : 'Stripe');
    }

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
| none | `create`, `update`, `delete`, `restore` | the [defaults](/basics/the-feed-file#conventional-model-verbs) |

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

### Action Return Types

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
[App\Stories\OrderStory@total] is a public method of a resource Story class, so
it is an action, and it returns [int]. An action returns Storyfeed\Stories\Verb,
string (the headline) or array (the array form). If it is a helper, make it
protected or private.
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
    ->except('restore', 'confirm_payment');
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
use Storyfeed\Facades\Storyfeed;

class CheckoutController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $order->update(['status' => 'placed']);

        Storyfeed::activity()
            ->by($request->user())
            ->action('place', $order)
            ->to($order->kitchen)
            ->publish();

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

        Storyfeed::record(
            verb: 'place',
            object: $order,
            actor: $request->user(),
            target: $order->kitchen,
        );

        return to_route('orders.show', $order);
    }
}
```
:::

<FeedExample context :items="[scenes.order]" />

The call names the verb. Storyfeed reads the definition compiled from the
resource class.

Resource classes are declarations. Call sites publish through
`Storyfeed::activity()` or `Storyfeed::record()`.

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
        ->actor($request->hasHeader('Paddle-Signature') ? 'Paddle' : 'Stripe');
}
```

::: code-group
```php [Fluent Syntax]
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
        $order = Order::where('payment_intent', $request->input('data.object.id'))
            ->firstOrFail();

        $order->update(['paid_at' => now()]);

        Storyfeed::activity('confirm_payment', $order)->publish(); // the verb names the actor

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
        $order = Order::where('payment_intent', $request->input('data.object.id'))
            ->firstOrFail();

        $order->update(['paid_at' => now()]);

        Storyfeed::record(
            verb: 'confirm_payment',
            object: $order, // the verb names the actor
        );

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

A job dispatched during the request carries the actor the method chose, so a
queued publish of `confirm_payment` gets the same actor.
[Queues](/deeper/queues#request-based-actors) covers
how.

A method whose headline changes with the request throws at that publish in
`local` and `testing`, where `grammar.strict` is on:

```txt
[App\Stories\OrderStory@confirmPayment] returned a different headline for this
request than when stories compiled. An action that takes the request may only
use it to choose the actor: everything else is read when no request exists (the
feed, storyfeed:list, the doctor, storyfeed:cache), so it must not depend on
one.
```

## Headlines for Deleted Objects

`->missingHeadline()` gives a verb its own reading once the object it is about
has been deleted:

```php
// app/Stories/OrderStory.php
public function place(Verb $verb): Verb
{
    return $verb
        ->headline(':actor placed :object[ with :target]')
        ->icon('shopping-bag')
        ->missingHeadline(':actor placed an order, since deleted');
}
```

<FeedExample :items="[gone]" />

`->forgetWhenMissing()` deletes the verb's activities instead, once the
deletion is permanent. Both are in [Deleted Models](/deeper/deleted-models).

## Publishing a Story With Data

A class that extends `Story` receives its data in the constructor and builds
the activity in `toFeedActivity()`:

```php
<?php

namespace App\Stories;

use App\Models\MenuItem;
use App\Models\User;
use Storyfeed\PendingActivity;
use Storyfeed\Stories\Story;

class DishWentLive extends Story
{
    public function __construct(public MenuItem $dish, public User $user) {}

    public function toFeedActivity(): ?PendingActivity
    {
        return $this->activity($this->dish)->by($this->user);
    }

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

Story::for(MenuItem::class)->verb('publish', DishWentLive::class);
```

Construct it with the activity’s data and publish it:

```php
// app/Http/Controllers/MenuItemController.php, publish()
use App\Stories\DishWentLive;
use Storyfeed\Facades\Storyfeed;

Storyfeed::publish(new DishWentLive($dish, $request->user()));
```

<FeedExample :items="[live]" />

`toFeedActivity()` may return `null` to publish nothing. Presentation methods
such as `headline()` run without the constructor and cannot read its data.

| Member | Required | |
|---|---|---|
| `toFeedActivity()` | yes | builds the pending activity, or returns `null` |
| `headline()` | yes | the singular template |
| `icon()`, `intent()` | no | the glyph and what it means |
| `groups()` | no | a `Group` per [one-type axis](/deeper/aggregation#built-in-axes), each with its group headline. An `actors` or `targets` headline goes on the verb in `routes/feed.php` |
| `missing()` | no | the roles the activity is about |
| `$verb`, `$objectType` | no | optional declarations that must agree with the binding; an unscoped binding needs `$objectType` |

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
`make:story` never edits `routes/feed.php`.

With a name and no shape option, it writes a class to construct and publish.
It asks for the verb and object when the name does not settle them:

```bash
php artisan make:story DishWentLive
```

```txt
 ┌ Which verb does this story record? ─────────────────────────┐
 │ › ● publish                                                 │
 │   ○ place                                                   │
 │   ○ complete                                                │
 └─────────────────────────────────────────────────────────────┘
  The app's declared verbs. Pass --verb for one it does not declare.

 ┌ Which model is the object of this story? ───────────────────┐
 │ App\Models\MenuItem                                         │
 └─────────────────────────────────────────────────────────────┘

   INFO  Story [app/Stories/DishWentLive.php] created successfully.

   INFO  Bind it in routes/feed.php:

    Story::for(\App\Models\MenuItem::class)->verb('publish', \App\Stories\DishWentLive::class);
```

The verb is chosen from your declared verbs, and the model is suggested from
your `Feedable` models. A name like `OrderWasPlaced` settles both when the part
after `Was` spells exactly one declared verb, so nothing is asked. The class
never holds a placeholder: each group headline is a sentence, with the tokens
its axis allows listed in a comment above it. A grouping that can hold other
types is written as a commented `routes/feed.php` line instead.

`--verb` and `--object` skip their prompts, so a script passes both:

```bash
php artisan make:story DishWentLive --verb=publish --object=MenuItem
```

Without a terminal, a verb or model the name does not settle fails, naming
your declared verbs.

### Spelling the Past Tense

A name with `Was` spells the headline's past tense. Any other name leaves it
to `make:story`, which puts the verb in the past tense itself. Where the
spelling depends on how the verb is stressed, as with `ship`, `visit` and
`open`, it asks:

```bash
php artisan make:story DishWentLive --verb=ship --object=MenuItem
```

```txt
 ┌ How is 'ship' written in the past tense? ───────────────────┐
 │   ○ shiped                                                  │
 │ › ● shipped                                                 │
 │   ○ None of these — leave the headline commented            │
 └─────────────────────────────────────────────────────────────┘
  The headline says it, so it must be spelled right.
```

Some verbs have no right spelling on offer: `go` offers only `goed`. Choosing
**None of these**, or running without a terminal, writes the headline
commented out, one line per spelling, under a comment giving the reason. The
group headlines are commented the same way:

```php
// app/Stories/DishWentLive.php, headline()
// return ':actor shiped :object';
// return ':actor shipped :object';
```

The class fails when stories compile until you uncomment one line.

### Generating From Doctor Findings

```bash
php artisan make:story --from-doctor
```

It writes a class to construct and publish for each type and verb recorded with no headline,
named from the pair: `OrderWasPlaced`. The name spells the past tense, so a
verb whose spelling is uncertain is asked about, with a way to skip it:

```txt
 ┌ How is 'ship' written in the past tense? ────────────────────┐
 │   ○ shiped                                                   │
 │ › ● shipped                                                  │
 │   ○ Skip this one                                            │
 └──────────────────────────────────────────────────────────────┘
  The class is named with it, and its headline says it.
```

Choosing `shipped` writes `OrderWasShipped`. Without a terminal, it skips each such verb, writes nothing for it, and prints
a complete `make:story` command for each spelling. Run the line with the right
one:

```txt
   INFO  Story [app/Stories/DeliveryWasArchived.php] created successfully.

   INFO  Bind it in routes/feed.php:

    Story::for('delivery')->verb('archive', \App\Stories\DeliveryWasArchived::class);

   INFO  Review the generated verbs and headlines — the class names were
         derived from the recorded pairs, so a few will read awkwardly.

   WARN  Skipped, because the past tense cannot be spelled for certain. Run
         the line with the right spelling:

    php artisan make:story DeliveryWasShiped --verb=ship --object=delivery
    php artisan make:story DeliveryWasShipped --verb=ship --object=delivery
```

## Listing Verbs

```bash
php artisan storyfeed:list --type=order
```

It prints a table with a row per verb: its name, headline, anonymous headline,
icon, intent, group headlines, calendar period and keep-latest policy, the Story class
method that declares it, and the file it came from. `-v` adds middleware. `--json` prints the same rows, and `--verb` narrows them to
one:

```bash
php artisan storyfeed:list --type=order --verb=place --json
```

```json
[
    {
        "type": "order",
        "verb": "place",
        "name": "order.place",
        "action": "App\\Stories\\OrderStory@place",
        "headline": ":actor placed :object[ with :target]",
        "anonymous_headline": null,
        "icon": "shopping-bag",
        "intent": null,
        "groups": [],
        "period": "day",
        "keep_latest": null,
        "source": "App\\Stories\\OrderStory@place",
        "middleware": ["Storyfeed\\Middleware\\Batch"]
    }
]
```

`action` names the method that declares each verb. A new method is a
new verb once the definitions are compiled again, so run `storyfeed:cache`
after deploying, as you run `route:cache`.
