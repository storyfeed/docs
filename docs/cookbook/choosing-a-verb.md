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
    public function store(
        PlaceOrderRequest $request,
        Kitchen $kitchen,
    ): RedirectResponse {
        $order = $kitchen->orders()->create($request->validated());

        Storyfeed::activity()
            ->by($request->user())
            ->action('place', $order)   // not 'order.place'
            ->to($kitchen)
            ->publish();

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
    public function store(
        PlaceOrderRequest $request,
        Kitchen $kitchen,
    ): RedirectResponse {
        $order = $kitchen->orders()->create($request->validated());

        Storyfeed::record(
            verb: 'place',   // not 'order.place'
            object: $order,
            actor: $request->user(),
            target: $kitchen,
        );

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
use Storyfeed\Act;

class MenuItemController extends Controller
{
    public function store(StoreMenuItemRequest $request): RedirectResponse
    {
        // the dish is written here
        $dish = MenuItem::create($request->validated());

        Act::Create->by($request->user())->object($dish)->publish();

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
use Storyfeed\Act;
use Storyfeed\Facades\Storyfeed;

class MenuItemController extends Controller
{
    public function store(StoreMenuItemRequest $request): RedirectResponse
    {
        // the dish is written here
        $dish = MenuItem::create($request->validated());

        Storyfeed::record(
            verb: Act::Create,
            object: $dish,
            actor: $request->user(),
        );

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
use Storyfeed\Act;

class MenuDishController extends Controller
{
    public function store(
        Request $request,
        Menu $menu,
        MenuItem $dish,
    ): RedirectResponse {
        $menu->dishes()->attach($dish);   // the dish already existed

        Act::Add->by($request->user())->object($dish)->to($menu)->publish();

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
use Storyfeed\Act;
use Storyfeed\Facades\Storyfeed;

class MenuDishController extends Controller
{
    public function store(
        Request $request,
        Menu $menu,
        MenuItem $dish,
    ): RedirectResponse {
        $menu->dishes()->attach($dish);   // the dish already existed

        Storyfeed::record(
            verb: Act::Add,
            object: $dish,
            actor: $request->user(),
            target: $menu,
        );

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

## Recording Outcomes

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
use Storyfeed\Act;

class MailWebhookController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $document = Document::where('message_id', $request->input('message_id'))
            ->firstOrFail();

        $deliveryEvent = $document->deliveryEvents()->create([
            'outcome' => $request->input('event'),
        ]);

        Act::Create->anonymously()
            ->object($deliveryEvent)
            ->to($document)
            ->publish();

        return response()->noContent();
    }
}
```

Likewise, three verbs for three states of one record usually want one verb
and a record of the transition.

## Distinguishing Activities

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
use Storyfeed\Act;

class MenuItemController extends Controller
{
    public function update(
        UpdateMenuItemRequest $request,
        MenuItem $dish,
    ): RedirectResponse {
        $dish->update($request->validated());

        $revision = $dish->revisions()->create($request->validated());

        Act::Update->by($request->user())
            ->object($dish)
            ->resulting($revision) // what the update produced
            ->publish();

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
use Storyfeed\Act;
use Storyfeed\Facades\Storyfeed;

class MenuItemController extends Controller
{
    public function update(
        UpdateMenuItemRequest $request,
        MenuItem $dish,
    ): RedirectResponse {
        $dish->update($request->validated());

        $revision = $dish->revisions()->create($request->validated());

        Storyfeed::record(
            verb: Act::Update,
            object: $dish,
            actor: $request->user(),
            result: $revision, // what the update produced
        );

        return back();
    }
}
```
:::
