# Recording Activities

<script setup>
import { scene } from '../.vitepress/theme/world'

// A price change draws no card: the item's details would show today's price, not the change.
const recorded = scene.basics.recording.priced
const priced = { ...recorded, object: { ...recorded.object, body: null }, data: { from: 275, to: 295 } }
// The same change, imported with a date from long ago.
const backdated = { ...priced, published_at: scene.distant.published_at }
</script>

## Introduction

An activity is a verb plus the models it involves. You record one with an
explicit call, wherever the fact happens: an action, an observer, an event
listener.

<a id="the-builder"></a>

## Publishing Activities

<a id="fluent-recording"></a>

The builder reads in the order of the headline it produces:

::: code-group
<<< @/snippets/publish-from-controller.php {php memo="app/Http/Controllers/OrderController.php"} [Fluent Syntax]
<<< @/snippets/publish-from-controller.named-arguments.php {php memo="app/Http/Controllers/OrderController.php"} [Named Arguments]
:::

<FeedExample :items="[scene.order]" />

The first argument to `action()` is the **verb**: a plain string naming what
happened. `place` is this app's own word, not one the package knows. The stored
verb is the string you pass, and [The Feed File](/basics/the-feed-file) gives it
the headline the feed prints.

<a id="named-arguments"></a>

`Storyfeed::record()` records the same activity in one call, with each role as
a named argument.

<a id="roles"></a>

## Assigning Roles

| Role | Question It Answers | Example |
|---|---|---|
| `actor` | who did it | the customer |
| `object` | what it was done to | the order |
| `target` | what the act was directed at | the shop |
| `context` | where it happened | the surrounding container |
| `origin` | where it came from | the source of an accepted invitation |
| `result` | what it produced | a receipt, a generated artifact |
| `instrument` | what it happened via | the device an order was taken on |

Direction decides the role. The same tablet is a `target` for an order sent
**to** it and an `instrument` for an order taken **on** it.

<a id="reading-as-a-sentence"></a>

### Role Aliases

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

An alias and its setter record the same activity.

<a id="the-actor"></a>

## Assigning the Actor

The actor is the user or model that performed the activity. You may specify
the actor using the `by` method:

::: code-group
```php [Fluent Syntax]
Storyfeed::activity()
    ->by($order->customer) // [!code highlight]
    ->action('place', $order)
    ->to($order->shop)
    ->publish();
```

```php [Named Arguments]
Storyfeed::record(
    verb: 'place',
    object: $order,
    actor: $order->customer, // [!code highlight]
    target: $order->shop,
);
```
:::

<FeedExample :items="[scene.order]" />

If you do not call the `by` method, Storyfeed will record the currently
authenticated user as the actor.

## Adding Activity Data

`->data()` adds values to the activity itself. They are stored with the
activity and returned in its `data` when the feed is read:

::: code-group
```php [Fluent Syntax]
$from = $product->price;

$product->update(['price' => $request->integer('price')]);

Storyfeed::activity()
    ->by($request->user())
    ->action('reprice', $product)
    ->data(['from' => $from, 'to' => $product->price]) // [!code highlight]
    ->publish();
```

```php [Named Arguments]
$from = $product->price;

$product->update(['price' => $request->integer('price')]);

Storyfeed::record(
    verb: 'reprice',
    object: $product,
    actor: $request->user(),
    data: ['from' => $from, 'to' => $product->price], // [!code highlight]
);
```
:::

<FeedExample :items="[priced]" expanded />

## Setting the Publication Time

`->publishedAt()` backdates an activity, for imports and backfills:

::: code-group
```php [Fluent Syntax]
foreach ($rows as $row) {
    Storyfeed::activity()
        ->by(User::findOrFail($row['user_id']))
        ->action('reprice', MenuItem::findOrFail($row['menu_item_id']))
        ->data(['from' => $row['from'], 'to' => $row['to']])
        ->publishedAt($row['changed_at']) // [!code highlight]
        ->publish();
}
```

```php [Named Arguments]
foreach ($rows as $row) {
    Storyfeed::record(
        verb: 'reprice',
        object: MenuItem::findOrFail($row['menu_item_id']),
        actor: User::findOrFail($row['user_id']),
        data: ['from' => $row['from'], 'to' => $row['to']],
        publishedAt: $row['changed_at'], // [!code highlight]
    );
}
```
:::

<FeedExample :items="[backdated]" />

<a id="recording-many-objects-at-once"></a>

## Recording Multiple Objects

`->objects()` records one activity about a set of objects. It stores a parent
activity, plus one activity per object:

::: code-group
```php [Fluent Syntax]
Storyfeed::activity()
    ->by($request->user())
    ->verb('upload')
    ->objects($photos) // [!code highlight]
    ->publish();
```

```php [Named Arguments]
Storyfeed::record(
    verb: 'upload',
    objects: $photos, // [!code highlight]
    actor: $request->user(),
);
```
:::

[Composites](/deeper/composites) covers how the set and its activities read in
the feed, and the headlines they need.
