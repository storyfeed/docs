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

An activity records a verb and its participants. Publish it from the code that
handles the action, such as a controller, observer, or event listener.

<a id="the-builder"></a>

## Publishing Activities

<a id="fluent-recording"></a>

Assign the activity's roles and call the `publish` method:

::: code-group
<<< @/snippets/publish-from-controller.php {php memo="app/Http/Controllers/OrderController.php"} [Fluent Syntax]
<<< @/snippets/publish-from-controller.named-arguments.php {php memo="app/Http/Controllers/OrderController.php"} [Named Arguments]
:::

<FeedExample :items="[scene.order]" />

The first argument to the `action` method is the **verb**, a string describing
the action. This example records `place`. Define its headline in
[The Feed File](/basics/the-feed-file).

<a id="named-arguments"></a>

You may also call the `record` method on the `Storyfeed` facade, passing each
role as a named argument.

<a id="roles"></a>

## Assigning Roles

| Role | Meaning | Example |
|---|---|---|
| `actor` | who performed the action | the customer |
| `object` | the entity acted on | the order |
| `target` | the entity the action was directed at | the shop |
| `context` | the containing entity | the shop where the action occurred |
| `origin` | the source | the source of an accepted invitation |
| `result` | the entity produced | a receipt or generated file |
| `instrument` | the tool or service used | the device used to take an order |

Choose the role based on the entity's involvement. A tablet is a `target` when
an order is sent to it, or an `instrument` when used to take the order.

These roles come from [W3C Activity Streams 2.0](/deeper/activity-streams).

<a id="reading-as-a-sentence"></a>

### Role Aliases

Each role has a method with the same name, such as `actor` or `object`.
The `verb` method sets the verb. You may also use these aliases:

| Alias | Sets | Meaning |
|---|---|---|
| `->by()` | `actor` | who performed the action |
| `->action()` | `verb` and `object` | the action and affected entity |
| `->using()` | `instrument` | the tool or service used |
| `->resulting()` | `result` | the entity produced |
| `->to()` `->for()` `->on()` `->with()` `->into()` `->in()` `->from()` | `target` | the entity the action was directed at |

These aliases let you compose activities expressively, like a natural-language sentence.

<a id="the-actor"></a>

## Assigning the Actor

The actor is the user or model that performed the activity. You may specify
the actor using the `by` method:

::: code-group
```php [Fluent Syntax]
Storyfeed::activity()
    ->by($order->customer)
    ->action('place', $order)
    ->to($order->shop)
    ->publish();
```

```php [Named Arguments]
Storyfeed::record(
    verb: 'place',
    object: $order,
    actor: $order->customer,
    target: $order->shop,
);
```
:::

<FeedExample :items="[scene.order]" />

If you do not call the `by` method, Storyfeed will record the currently
authenticated user as the actor.

If no user is signed in and you do not call `by`, the activity has no actor.
An activity with no recorded actor is an [anonymous activity](/deeper/parties#recording-anonymous-activities):
who performed it is not known.

## Adding Activity Data

Use the `data` method to store arbitrary values on an activity. Storyfeed
returns them in the activity's `data` field:

::: code-group
```php [Fluent Syntax]
$from = $product->price;

$product->update(['price' => $request->integer('price')]);

Storyfeed::activity()
    ->by($request->user())
    ->action('reprice', $product)
    ->data(['from' => $from, 'to' => $product->price])
    ->publish();
```

```php [Named Arguments]
$from = $product->price;

$product->update(['price' => $request->integer('price')]);

Storyfeed::record(
    verb: 'reprice',
    object: $product,
    actor: $request->user(),
    data: ['from' => $from, 'to' => $product->price],
);
```
:::

<FeedExample :items="[priced]" expanded />

## Setting the Publication Time

To set an earlier publication time, such as when importing records, call the
`publishedAt` method:

::: code-group
```php [Fluent Syntax]
foreach ($rows as $row) {
    Storyfeed::activity()
        ->by(User::findOrFail($row['user_id']))
        ->action('reprice', MenuItem::findOrFail($row['menu_item_id']))
        ->data(['from' => $row['from'], 'to' => $row['to']])
        ->publishedAt($row['changed_at'])
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
        publishedAt: $row['changed_at'],
    );
}
```
:::

<FeedExample :items="[backdated]" />

<a id="recording-many-objects-at-once"></a>

## Recording Multiple Objects

To record an activity involving multiple objects, call the `objects` method.
Storyfeed stores a parent activity and one activity per object:

::: code-group
```php [Fluent Syntax]
Storyfeed::activity()
    ->by($request->user())
    ->verb('upload')
    ->objects($photos)
    ->publish();
```

```php [Named Arguments]
Storyfeed::record(
    verb: 'upload',
    objects: $photos,
    actor: $request->user(),
);
```
:::

See [Composites](/deeper/composites) for how these activities appear in the feed
and how to define their headlines.
