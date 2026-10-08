# Choosing a Verb

Choose a verb that describes the event, then use roles to identify what was involved.

<script setup>
import { activity, scene } from '../.vitepress/theme/world'
const choices = scene.cookbook.verbChoices
const createdOrder = activity({ ...scene.order, id: 'verb-created-order', verb: 'create',
  target: null, glyph: null, headline_template: ':actor created :object' })
const placedOrder = { ...scene.order, headline_template: ':actor placed :object at :target' }
</script>

<span id="naming-a-verb"></span>

## Naming Verbs

A verb is an action alone. It never names its object, before or after, with
any separator: `accept`, not `offer.accept`, `accept_offer` or `acceptOffer`.
Declaring or publishing a dotted verb throws `Storyfeed\Exceptions\DottedVerb`; use a [story name](/deeper/named-stories) for dotted lookups such as `order.place`.

The object identifies what the action happened to:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/PlaceOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class PlaceOrderController
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        Storyfeed::activity()
            ->by($request->user())
            ->action('place', $order)
            ->to($order->shop)
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/PlaceOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class PlaceOrderController
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        Storyfeed::record(
            verb: 'place',
            object: $order,
            actor: $request->user(),
            target: $order->shop,
        );

        return back();
    }
}
```
:::

<FeedExample :items="[scene.order]" />

Headlines are defined by object type and verb, so including the type in the
verb repeats information. A verb such as `place` also works for other types.

Use roles for the things involved and data for event details:

| Instead of | Record |
| --- | --- |
| `document.clause_add` | `add`, with the document as object and the clause key in data when the clause has no model |
| `menu.item_publish` | `publish`, with the menu item as object and the menu as target |
| `accept_offer` or `acceptOffer` | `accept`, with the offer as object |
| `download_pdf` | `download`, with the document as object and the format in activity data |
| `archive_document` | `archive`, with the document as object |

Use base-form verbs such as `place`. Use past tense in headlines:
`:actor placed :object`.

## Choosing a Precise Verb

Choose the verb that states the fact: `launch` or `unveil` when that is what
happened. The [Verb Vocabulary](/reference/verbs) is a starting point, not a limit.

For an order placement, `place` says more than `create`:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('create')
    ->headline(':actor created :object');

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object at :target');
```

<FeedExample :items="[createdOrder, placedOrder]" />

<a id="when-events-share-a-verb"></a>

## Sharing a Verb Across Object Types

Use one verb across object types, with a headline for each type:

```php memo="routes/feed.php"
use App\Models\Agreement;
use App\Models\Proposal;
use Storyfeed\Facades\Story;

Story::for(Agreement::class)->verb('accept')
    ->headline(':actor accepted the agreement :object');

Story::for(Proposal::class)->verb('accept')
    ->headline(':actor accepted the proposal :object');
```

<FeedExample :items="[choices.agreement, choices.proposal]" />

Both activities store `accept`; the object type selects which headline to use.

| Events | Verb choice |
| --- | --- |
| The same action on different object types | Share one verb; define a headline per type. |
| Different actions on the same object type | Choose different action verbs, such as `send` and `invite`. |
| The same action on the same type, with different details | Keep one verb; put participants in roles and event details in data. |

To decide whether two events are the same action, write the headline for one
and read it against the other. If the same headline is true for both, it is
the same action: keep one verb and put the difference in data.
*{{ choices.agreement.actor.label }} declined the agreement* is true whether
{{ choices.agreement.actor.label }} declined directly or declined to sign, so
both are `decline`. *{{ choices.send.actor.label }} sent the agreement* is not
true of an invitation to sign, so `send` and `invite` stay separate.

### Distinguishing Actions on One Object Type

Sending an agreement and inviting someone to sign it are different actions:

```php memo="routes/feed.php"
use App\Models\Agreement;
use Storyfeed\Facades\Story;

Story::for(Agreement::class)->verb('send')
    ->headline(':actor sent :object to :target');

Story::for(Agreement::class)->verb('invite')
    ->headline(':actor invited :target to sign :object');
```

<FeedExample :items="[choices.send, choices.invite]" />

Recording both as `send` would make both use the sending headline. A second declaration for the same type and verb does not create
another kind of event; conflicting definitions fail compilation.

If two downloads differ only in format, keep `download` and store the format
in data. A [headline closure](/basics/the-feed-file#dynamic-headlines) can access that
detail when it belongs in the sentence.

With a PHP backed enum, share one case such as `Act::Accept` across the types.
Do not add `AcceptAgreement` and `AcceptProposal` with type-suffixed values;
backed enum cases cannot share the same value.

<a id="recording-facts-and-parts-of-a-document"></a>

## Recording a Decision

If recording a decision creates its own model record, record `create` on that model.
For example, a new `Acceptance` record is the object, and its document is the
target:

```php memo="routes/feed.php"
use App\Models\Acceptance;
use Storyfeed\Facades\Story;

Story::for(Acceptance::class)->verb('create')
    ->headline(':actor recorded :object for :target');
```

```php memo="app/Http/Controllers/RecordAcceptanceController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Acceptance;
use App\Models\Document;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class RecordAcceptanceController
{
    public function __invoke(Request $request, Acceptance $acceptance, Document $document): RedirectResponse
    {
        // $acceptance is the acceptance record created by the application.
        Storyfeed::activity()
            ->by($request->user())
            ->action('create', $acceptance)
            ->to($document)
            ->publish();

        return back();
    }
}
```

<FeedExample :items="[choices.decision]" />

The record's label or [body](/basics/activity-content) can explain its kind;
you do not need a verb such as `record_acceptance` or a kind field in data.

If the decision has no model record of its own, use the action on the document: `accept`,
`decline` or `pay`. Its feedable label or body identifies which document it is.
For an operator recording someone else's decision, keep who acted separate
from who authorised it; see [Recording an Authoriser](/cookbook/an-authoriser-who-is-not-an-actor).

## Changing a Part Without Its Own Model

A clause stored inside a document has no model to use as a separate object.
Record the change on the document and keep the clause key in activity data:

```php memo="routes/feed.php"
use App\Models\Document;
use Storyfeed\ActivityContext;
use Storyfeed\Facades\Story;

Story::for(Document::class)->verb('remove')
    ->headline(fn (ActivityContext $activity): string =>
        $activity->has('clause')
            ? ':actor removed a clause from :object'
            : ':actor removed an attachment from :object');
```

```php memo="app/Http/Controllers/RecordClauseRemovalController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class RecordClauseRemovalController
{
    public function __invoke(Request $request, Document $document): RedirectResponse
    {
        Storyfeed::activity()
            ->by($request->user())
            ->action('remove', $document)
            ->data(['clause' => 'delivery-window'])
            ->publish();

        return back();
    }
}
```

<FeedExample :items="[choices.clause]" />

Removing an attachment uses the same verb and an `attachment` key instead:

<FeedExample :items="[choices.attachment]" />

The document is the object in both cases, so its type selects the `Document`
headline. Putting the document only in the target role would not select that
definition. The activity stores the clause key as it was when the change
occurred. Give the clause its own model if it needs a separate label, link or
body. See [Activity Data](/basics/recording#adding-activity-data)
and [Casting](/deeper/casting-activity-data) for retrieving typed details, and
[Activity Content](/basics/activity-content) for displaying them.

To group a person's changes per document, use the
[`object` axis](/deeper/aggregation#built-in-axes), which requires the same
document. The `repeat` axis requires only the same object type.

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
| `create` / `add` | the object did not exist before the activity | an existing object joins a collection, identified by the target |
| `delete` / `remove` | the object no longer exists | the object still exists but has left a collection, such as through archiving |
| `remove` / `undo` | the object leaves a collection | an earlier action is reversed; use `restore` for restoring a model |
| `offer` / `invite` | something is sent for a response, such as a document | someone is asked to participate, such as signing the document |
| `accept` / `like` | the action responds to an `offer` or `invite`, including approval | the action is an unprompted reaction |
| `view` / `read` | a page opens or a preview loads; use `view` when unsure | the object is deliberately obtained, such as by downloading a file |

<a id="create-and-add"></a>

### Choosing Create or Add

Define the two headlines:

```php memo="routes/feed.php"
use App\Models\MenuItem;
use Storyfeed\Facades\Story;

Story::for(MenuItem::class)->verb('create')->headline(':actor created :object');
Story::for(MenuItem::class)->verb('add')->headline(':actor added :object to :target');
```

Use `create` for a new menu item:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/CreateMenuItemController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMenuItemRequest;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Act;
use Storyfeed\Facades\Storyfeed;

class CreateMenuItemController
{
    public function __invoke(StoreMenuItemRequest $request): RedirectResponse
    {
        $product = MenuItem::create($request->validated());

        Act::Create->by($request->user())->object($product)->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/CreateMenuItemController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMenuItemRequest;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Act;
use Storyfeed\Facades\Storyfeed;

class CreateMenuItemController
{
    public function __invoke(StoreMenuItemRequest $request): RedirectResponse
    {
        $product = MenuItem::create($request->validated());

        Storyfeed::record(
            verb: Act::Create,
            object: $product,
            actor: $request->user(),
        );

        return back();
    }
}
```
:::

<FeedExample :items="[choices.create]" />

Use `add` when putting an existing menu item on a menu:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/AddMenuItemController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Act;
use Storyfeed\Facades\Storyfeed;

class AddMenuItemController
{
    public function __invoke(Request $request, Menu $menu, MenuItem $product): RedirectResponse
    {
        $menu->menuItems()->attach($product);

        Act::Add->by($request->user())->object($product)->to($menu)->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/AddMenuItemController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Act;
use Storyfeed\Facades\Storyfeed;

class AddMenuItemController
{
    public function __invoke(Request $request, Menu $menu, MenuItem $product): RedirectResponse
    {
        $menu->menuItems()->attach($product);

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

<FeedExample :items="[choices.add]" />

Use `add` when an existing object joins a collection, and identify that
collection with the target. Use `create` only when a new object is created.

<span id="recording-outcomes"></span>
<span id="distinguishing-activities"></span>
<span id="distinguishing-activities-with-roles-and-data"></span>

See [Recording Activities](/basics/recording) for roles and `publishedAt()`,
which distinguish events that share a verb.
