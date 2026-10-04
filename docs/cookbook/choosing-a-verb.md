# Choosing a Verb

Choose a verb that describes the event, then use roles to identify what was involved.

<span id="naming-a-verb"></span>

## Naming Verbs

A verb is an action alone. It never names its object, before or after, with
any separator: `accept`, not `offer.accept`, `accept_offer` or `acceptOffer`.
The object identifies what the action happened to:

::: code-group
```php [Fluent Syntax]
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)   // not 'order.place' [!code highlight]
    ->to($shop)
    ->publish();
```

```php [Named Arguments]
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'place',   // not 'order.place' [!code highlight]
    object: $order,
    actor: $request->user(),
    target: $shop,
);
```
:::

Headlines are defined by object type and verb, so including the type in the
verb repeats information. A verb such as `place` also works for other types.

Before inventing a verb, check the shipped [Verb Vocabulary](/reference/verbs).
`remind`, `invite`, `download`, `archive` and `view` already describe common
actions. Use roles for the things involved and data for event details:

| Instead of | Record |
| --- | --- |
| `doctrine.clause_add` | `add`, with the clause as object and the doctrine as target |
| `menu.item_publish` | `publish`, with the menu item as object and the menu as target |
| `accept_offer` or `acceptOffer` | `accept`, with the offer as object |
| `download_pdf` | `download`, with the document as object and the format in activity data |
| `archive_document` | `archive`, with the document as object |

Use base-form verbs such as `place`. Use past tense in headlines:
`:actor placed :object`.

## When Events Share a Verb

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

For an agreement labelled “Service terms” and a proposal labelled “New shop”,
these read “Alex accepted the agreement Service terms” and “Alex accepted the
proposal New shop”. Both activities store `accept`; the object type selects
which headline to use.

| Events | Verb choice |
| --- | --- |
| The same action on different object types | Share one verb; define a headline per type. |
| Different actions on the same object type | Choose different action verbs, such as `send` and `invite`. |
| The same action on the same type, with different details | Keep one verb; put participants in roles and event details in data. |

Sending an agreement and inviting someone to sign it are different actions:

```php memo="routes/feed.php"
use App\Models\Agreement;
use Storyfeed\Facades\Story;

Story::for(Agreement::class)->verb('send')
    ->headline(':actor sent :object to :target');

Story::for(Agreement::class)->verb('invite')
    ->headline(':actor invited :target to sign :object');
```

These read “Alex sent Service terms to Sam” and “Alex invited Sam to sign
Service terms”. Recording both as `send` would make both use the sending
headline. A second declaration for the same type and verb does not create
another kind of event; conflicting definitions fail compilation.

If two downloads differ only in format, keep `download` and store the format
in data. A [headline closure](/basics/the-feed-file#dynamic-headlines) can read that
detail when it belongs in the sentence.

With a PHP backed enum, share one case such as `Act::Accept` across the types.
Do not add `AcceptAgreement` and `AcceptProposal` with type-suffixed values;
backed enum cases cannot share the same value.

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

Use `create` for a new menu item:

::: code-group
```php [Fluent Syntax]
$product = MenuItem::create($request->validated());   // a new menu item

Act::Create->by($request->user())->object($product)->publish(); // [!code highlight]
```

```php [Named Arguments]
$product = MenuItem::create($request->validated());   // a new menu item

Storyfeed::record(
    verb: Act::Create, // [!code highlight]
    object: $product,
    actor: $request->user(),
);
```
:::

Use `add` when putting an existing menu item on a menu:

::: code-group
```php [Fluent Syntax]
$menu->menuItems()->attach($product);   // the menu item already existed

Act::Add->by($request->user())->object($product)->to($menu)->publish(); // [!code highlight]
```

```php [Named Arguments]
$menu->menuItems()->attach($product);   // the menu item already existed

Storyfeed::record(
    verb: Act::Add, // [!code highlight]
    object: $product,
    actor: $request->user(),
    target: $menu,
);
```
:::

`add` uses a target to identify the collection. Without a target, `create`
may better describe the event.

<span id="recording-outcomes"></span>
<span id="distinguishing-activities"></span>
<span id="distinguishing-activities-with-roles-and-data"></span>

See [Recording Activities](/basics/recording) for roles and `publishedAt()`,
which distinguish events that share a verb.
