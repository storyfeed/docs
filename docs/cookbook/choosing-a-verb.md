# Choosing a Verb

How to name a verb, and a test for each pair of verbs that are easy to
choose between. The verb's registered mapping sets the Activity Streams type. The object type and verb
identify its headline definition.

<span id="naming-a-verb"></span>

## Naming Verbs

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

## Choosing Between Related Verbs

Choose the word that describes the event in your application. These distinctions
are naming guidance; Storyfeed stores the verb you supply.

<span id="create-or-add"></span>

### Create and Add

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

<span id="delete-or-remove"></span>

### Delete and Remove

`delete` when nothing can be pointed at afterwards. `remove` when the object
still exists and has only left a collection.

Archiving is `remove`: the record is still there, and a feed row can still
link to it.

<span id="remove-or-undo"></span>

### Remove and Undo

Use `undo` for a reversal. When recording a restored model, `restore` can
name the action more precisely; the shipped vocabulary maps it to `Undo`.
Choose the object that identifies the fact your application records.

| The sentence you would say | Verb |
| --- | --- |
| "It left the collection." | `remove` |
| "That should not have happened." | `undo` |

<span id="offer-or-invite"></span>

### Offer and Invite

`offer` is directed at someone and expects an answer. `invite` is an offer
whose object is an invitation to take part.

Sending a document is `offer`. Sending it for signature is `invite`, because
the recipient is being asked to become a participant.

<span id="accept-or-like"></span>

### Accept and Like

`accept` answers a prior `offer` or `invite`. `like` is unprompted.

An approval is `accept`, whatever the button says.

<span id="view-or-read"></span>

### View and Read

`view` for an impression — a page was opened, a preview loaded. `read` for
deliberate consumption — a file was downloaded, a document taken away.

Neither changes the object. If the choice is not clear, it is `view`.

## Recording Outcomes

You can record delivery outcomes as their own models. Each outcome then
uses `create` against that record:

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

Use separate verbs when the transitions mean different things to the reader,
as in [Choosing When to Publish](/cookbook/choosing-when-to-publish).

<span id="distinguishing-activities"></span>

## Distinguishing Activities With Roles and Data

Separate occurrences can share a verb, object type and target. Use roles,
data and publication time to describe what differs between them. Each publish
creates an activity unless a [storage policy](/cookbook/repeating-activities)
supersedes it.

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
