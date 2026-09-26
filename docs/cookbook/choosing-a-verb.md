# Choosing a Verb

How to name a verb, and a test for each pair of verbs that are easy to
choose between.

<span id="naming-a-verb"></span>

## Naming Verbs

A verb says what happened. It does not say what it happened to — the object
already does that.

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/OrderController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlaceOrderRequest;
use App\Models\Shop;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class OrderController extends Controller
{
    public function store(
        PlaceOrderRequest $request,
        Shop $shop,
    ): RedirectResponse {
        $order = $shop->orders()->create($request->validated());

        Storyfeed::activity()
            ->by($request->user())
            ->action('place', $order)   // not 'order.place'
            ->to($shop)
            ->publish();

        return to_route('orders.show', $order);
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/OrderController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlaceOrderRequest;
use App\Models\Shop;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class OrderController extends Controller
{
    public function store(
        PlaceOrderRequest $request,
        Shop $shop,
    ): RedirectResponse {
        $order = $shop->orders()->create($request->validated());

        Storyfeed::record(
            verb: 'place',   // not 'order.place'
            object: $order,
            actor: $request->user(),
            target: $shop,
        );

        return to_route('orders.show', $order);
    }
}
```
:::

A headline is already defined for an object type and a verb, so a verb that
names its object says it twice. A plain `place` also works for anything else
the app places.

Where a verb seems to need an extra word, the word is usually a role:

| Reaching for | Record |
| --- | --- |
| `doctrine.clause_add` | `add`, object the clause, target the doctrine |
| `menu.item_publish` | `publish`, object the menu item, target the menu |

Write verbs in the present tense: `place`, not `placed`. The headline puts it
in the past: `:actor placed :object`.

## Choosing Between Related Verbs

Choose the word that describes the event in your application.
[Verb Vocabulary](/reference/verbs) lists every built-in verb.

<span id="create-or-add"></span>
<span id="delete-or-remove"></span>
<span id="delete-and-remove"></span>
<span id="remove-or-undo"></span>
<span id="remove-and-undo"></span>
<span id="offer-or-invite"></span>
<span id="offer-and-invite"></span>
<span id="accept-or-like"></span>
<span id="accept-and-like"></span>
<span id="view-or-read"></span>
<span id="view-and-read"></span>

| Pair | Use the first when | Use the second when |
| --- | --- | --- |
| `create` / `add` | the object did not exist before this activity | the object already existed and is now part of something, its target |
| `delete` / `remove` | nothing can be pointed at afterwards | the object still exists and has only left a collection, as when it is archived |
| `remove` / `undo` | "It left the collection." | "That should not have happened." `restore` also records a reversal, for a restored model |
| `offer` / `invite` | something is sent to someone who is expected to answer, such as a document | the recipient is asked to take part, such as signing the document |
| `accept` / `like` | the activity answers a prior `offer` or `invite`; an approval is `accept`, whatever the button says | nothing prompted it |
| `view` / `read` | a page was opened or a preview loaded; if the choice is not clear, it is `view` | the object was deliberately taken away, such as a downloaded file |

<a id="create-and-add"></a>

### Choosing Create or Add

A new menu item is `create`:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/MenuItemController.php"
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
        // the menu item is written here
        $product = MenuItem::create($request->validated());

        Act::Create->by($request->user())->object($product)->publish();

        return to_route('menu-items.show', $product);
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/MenuItemController.php"
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
        // the menu item is written here
        $product = MenuItem::create($request->validated());

        Storyfeed::record(
            verb: Act::Create,
            object: $product,
            actor: $request->user(),
        );

        return to_route('menu-items.show', $product);
    }
}
```
:::

Putting an existing menu item on a menu is `add`:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/MenuDishController.php"
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
        MenuItem $product,
    ): RedirectResponse {
        $menu->menuItems()->attach($product);   // the menu item already existed

        Act::Add->by($request->user())->object($product)->to($menu)->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/MenuDishController.php"
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
        MenuItem $product,
    ): RedirectResponse {
        $menu->menuItems()->attach($product);   // the menu item already existed

        Storyfeed::record(
            verb: Act::Add,
            object: $product,
            actor: $request->user(),
            target: $menu,
        );

        return back();
    }
}
```
:::

`add` takes a target. With no target, the verb is probably `create`.

<span id="recording-outcomes"></span>
<span id="distinguishing-activities"></span>
<span id="distinguishing-activities-with-roles-and-data"></span>

When several occurrences share a verb, [Recording Activities](/basics/recording)
covers the roles and `publishedAt()` that tell them apart.
