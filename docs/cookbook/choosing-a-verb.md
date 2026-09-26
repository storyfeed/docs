# Choosing a Verb

Choose a verb that describes the event, then use roles to identify what was involved.

<span id="naming-a-verb"></span>

## Naming Verbs

The verb describes what happened; the object identifies what it happened to:

::: code-group
```php [Fluent Syntax]
Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)   // not 'order.place'
    ->to($shop)
    ->publish();
```

```php [Named Arguments]
Storyfeed::record(
    verb: 'place',   // not 'order.place'
    object: $order,
    actor: $request->user(),
    target: $shop,
);
```
:::

Headlines are defined by object type and verb, so including the type in the
verb repeats information. A verb such as `place` also works for other types.

Use roles for details that would otherwise become part of the verb:

| Instead of | Record |
| --- | --- |
| `doctrine.clause_add` | `add`, with the clause as object and the doctrine as target |
| `menu.item_publish` | `publish`, with the menu item as object and the menu as target |

Use present-tense verbs such as `place`. Use past tense in headlines:
`:actor placed :object`.

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

Act::Create->by($request->user())->object($product)->publish();
```

```php [Named Arguments]
$product = MenuItem::create($request->validated());   // a new menu item

Storyfeed::record(
    verb: Act::Create,
    object: $product,
    actor: $request->user(),
);
```
:::

Use `add` when putting an existing menu item on a menu:

::: code-group
```php [Fluent Syntax]
$menu->menuItems()->attach($product);   // the menu item already existed

Act::Add->by($request->user())->object($product)->to($menu)->publish();
```

```php [Named Arguments]
$menu->menuItems()->attach($product);   // the menu item already existed

Storyfeed::record(
    verb: Act::Add,
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
