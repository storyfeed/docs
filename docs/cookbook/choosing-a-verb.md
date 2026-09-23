# Choosing a Verb

How to name a verb, and a test for each pair of verbs that are easy to
choose between. The verb sets the Activity Streams type and is half of every
grammar key.

## Naming a Verb

A verb says what happened. It does not say what it happened to — the object
already does that.

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlaceOrderRequest;
use App\Models\Kitchen;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class OrderController extends Controller
{
    public function store(PlaceOrderRequest $request, Kitchen $kitchen): RedirectResponse
    {
        $order = $kitchen->orders()->create($request->validated());

        Storyfeed::activity() // [!code focus]
            ->by($request->user()) // [!code focus]
            ->action('place', $order)   // not 'order.place' [!code focus]
            ->to($kitchen) // [!code focus]
            ->publish(); // [!code focus]

        return to_route('orders.show', $order);
    }
}
```

```php [Named Arguments]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlaceOrderRequest;
use App\Models\Kitchen;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class OrderController extends Controller
{
    public function store(PlaceOrderRequest $request, Kitchen $kitchen): RedirectResponse
    {
        $order = $kitchen->orders()->create($request->validated());

        Storyfeed::record( // [!code focus]
            verb: 'place',   // not 'order.place' [!code focus]
            object: $order, // [!code focus]
            actor: $request->user(), // [!code focus]
            target: $kitchen, // [!code focus]
        ); // [!code focus]

        return to_route('orders.show', $order);
    }
}
```
:::

A grammar key is already the object's morph alias plus the verb, so a verb
that names its object gives `order.order.place`. A plain `place` also works for
anything else the app places.

Where a verb seems to need an extra word, the word is usually a role:

| Reaching for | Record |
| --- | --- |
| `doctrine.clause_add` | `add`, object the clause, target the doctrine |
| `menu.dish_publish` | `publish`, object the dish, target the menu |

Write verbs in the present tense: `place`, not `placed`. The headline puts it
in the past: `:actor placed :object`.

## Create or Add

`create` when the object did not exist before this activity. `add` when it
already had an identity and is now part of something.

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMenuItemRequest;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Verb;

class MenuItemController extends Controller
{
    public function store(StoreMenuItemRequest $request): RedirectResponse
    {
        $dish = MenuItem::create($request->validated());   // the dish is written here

        Verb::Create->by($request->user())->object($dish)->publish(); // [!code focus]

        return to_route('menu-items.show', $dish);
    }
}
```

```php [Named Arguments]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMenuItemRequest;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Verb;

class MenuItemController extends Controller
{
    public function store(StoreMenuItemRequest $request): RedirectResponse
    {
        $dish = MenuItem::create($request->validated());   // the dish is written here

        Storyfeed::record( // [!code focus]
            verb: Verb::Create, // [!code focus]
            object: $dish, // [!code focus]
            actor: $request->user(), // [!code focus]
        ); // [!code focus]

        return to_route('menu-items.show', $dish);
    }
}
```
:::

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Verb;

class MenuDishController extends Controller
{
    public function store(Request $request, Menu $menu, MenuItem $dish): RedirectResponse
    {
        $menu->dishes()->attach($dish);   // the dish already existed

        Verb::Add->by($request->user())->object($dish)->to($menu)->publish(); // [!code focus]

        return back();
    }
}
```

```php [Named Arguments]
<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Verb;

class MenuDishController extends Controller
{
    public function store(Request $request, Menu $menu, MenuItem $dish): RedirectResponse
    {
        $menu->dishes()->attach($dish);   // the dish already existed

        Storyfeed::record( // [!code focus]
            verb: Verb::Add, // [!code focus]
            object: $dish, // [!code focus]
            actor: $request->user(), // [!code focus]
            target: $menu, // [!code focus]
        ); // [!code focus]

        return back();
    }
}
```
:::

`add` takes a target. With no target, the verb is probably `create`.

## Delete or Remove

`delete` when nothing can be pointed at afterwards. `remove` when the object
still exists and has only left a collection.

Archiving is `remove`: the record is still there, and a feed row can still
link to it.

## Remove or Undo

`undo` reverses an activity. Its object is the earlier act, not the thing the
act was about, so restoring a retired item is `undo`, not `create`.

| The sentence you would say | Verb |
| --- | --- |
| "It left the collection." | `remove` |
| "That should not have happened." | `undo` |

## Offer or Invite

`offer` is directed at someone and expects an answer. `invite` is an offer
whose object is an invitation to take part.

Sending a document is `offer`. Sending it for signature is `invite`, because
the recipient is being asked to become a participant.

## Accept or Like

`accept` answers a prior `offer` or `invite`. `like` is unprompted.

An approval is `accept`, whatever the button says.

## View or Read

`view` for an impression — a page was opened, a preview loaded. `read` for
deliberate consumption — a file was downloaded, a document taken away.

Neither changes the object. If the choice is not clear, it is `view`.

## When No Verb Fits

A verb that fits none of the twenty-eight activity types usually means
something in the domain is not modelled yet.

An email that bounced, was delivered, or failed has no verb of its own. Make
the delivery a record, and each outcome is an ordinary `create` against it:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Storyfeed\Verb;

class MailWebhookController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $document = Document::where('message_id', $request->input('message_id'))->firstOrFail();

        $deliveryEvent = $document->deliveryEvents()->create([
            'outcome' => $request->input('event'),
        ]);

        Verb::Create->anonymously() // [!code focus]
            ->object($deliveryEvent) // [!code focus]
            ->to($document) // [!code focus]
            ->publish(); // [!code focus]

        return response()->noContent();
    }
}
```

Likewise, three verbs for three states of one record usually want one verb
and a record of the transition.

## When Two Verbs Would Be Identical

Two activities with the same verb, object type and target are the same
activity. Whatever separates them belongs somewhere other than the verb.

| What separates them | Where it belongs |
| --- | --- |
| A field moved | [a change in the body](/deeper/body) |
| Something was produced | the `result` role |
| One happened earlier | `publishedAt()` |

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateMenuItemRequest;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Verb;

class MenuItemController extends Controller
{
    public function update(UpdateMenuItemRequest $request, MenuItem $dish): RedirectResponse
    {
        $dish->update($request->validated());

        $revision = $dish->revisions()->create($request->validated());

        Verb::Update->by($request->user()) // [!code focus]
            ->object($dish) // [!code focus]
            ->resulting($revision) // what the update produced [!code focus]
            ->publish(); // [!code focus]

        return back();
    }
}
```

```php [Named Arguments]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateMenuItemRequest;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Verb;

class MenuItemController extends Controller
{
    public function update(UpdateMenuItemRequest $request, MenuItem $dish): RedirectResponse
    {
        $dish->update($request->validated());

        $revision = $dish->revisions()->create($request->validated());

        Storyfeed::record( // [!code focus]
            verb: Verb::Update, // [!code focus]
            object: $dish, // [!code focus]
            actor: $request->user(), // [!code focus]
            result: $revision, // what the update produced [!code focus]
        ); // [!code focus]

        return back();
    }
}
```
:::
