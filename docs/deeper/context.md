# Containers & Context

## Introduction

The `context` role records where an activity happened, such as the shop a dish
belongs to. Use it to retrieve activities within that shop.

<script setup>
import { activity, scene, role } from '../.vitepress/theme/world'
const inside = activity({ ...scene.question, context: role.shop,
  headline_template: ':actor asked about :target in :context' })
</script>

<a id="recording-context-at-publish"></a>

## Recording Context

Record the context when publishing. Storyfeed does not fill roles later, so a
context filter can only find activities recorded with that context.

::: code-group
```php [Fluent Syntax]
Storyfeed::activity()
    ->by($request->user())
    ->action('ask', $note)
    ->on($dish)           // target: what the question is about
    ->context($shop)      // context: the shop the dish belongs to [!code highlight]
    ->publish();
```

```php [Named Arguments]
Storyfeed::record(
    verb: 'ask',
    object: $note,
    actor: $request->user(),
    target: $dish,        // what the question is about
    context: $shop,       // the shop the dish belongs to [!code highlight]
);
```
:::

<FeedExample :items="[inside]" />

<a id="the-difference-between-target-and-context"></a>

<a id="target-and-context"></a>

## Choosing Between Target and Context

| Role | Holds | In the Sentence |
|---|---|---|
| `target` | what the action was directed at | asked about the dish |
| `context` | where it happened | in the shop |

Use `context` when the target belongs to a container, such as a dish in a shop.
If the target is the container itself, the `target` role is enough:

::: code-group
```php [Fluent Syntax]
Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)
    ->to($shop) // [!code highlight]
    ->publish();
```

```php [Named Arguments]
Storyfeed::record(
    verb: 'place',
    object: $order,
    actor: $request->user(),
    target: $shop, // [!code highlight]
);
```
:::

<FeedExample :items="[scene.order]" />

Record every role that describes what happened, even if the headline omits it.
Storyfeed also uses roles for filtering and grouping.

<a id="uses-of-context"></a>

Set the context when you need to filter by it or include it in a headline:

| Usage | Why It Needs `context` |
|---|---|
| `Storyfeed::feed()->context($shop)` | finds only activities recorded with that context |
| `:context` in a headline | displays the entity recorded in the context role |

<a id="the-container-query"></a>

## Reading Activities in a Container

The `context` method filters activities recorded within the shop.
The [`involving` method](/basics/reading#scoping) also includes activities about
the shop itself, such as its creation.

<a id="non-model-containers"></a>

## Using Non-Model Containers

To use a name as the context, pass a string such as
`->context('Saturday service')`. Storyfeed creates a [party](/deeper/parties)
for the name. The `:context` token displays it, and
`Storyfeed::feed()->context('Saturday service')` retrieves its activities.

Each distinct name creates a separate party. To store a value without assigning
a role, use `->data(['service' => $name])`. It is returned in the activity's
`data` and cannot be used as a headline role token.

Use [Activity Scopes](/deeper/activity-scopes) to supply context across a
callback or HTTP request.
