# Story Classes

A Story is the blueprint for one type of activity: its verb, its headline, its
icon and how it groups, in one class. Publishing through it produces the
activity. Nothing about a feed requires one; a Story is where an app with
many verbs keeps each verb's facts together.

<script setup>
import { who, where, orders, dishes, notes, activity, group, scenes } from '../.vitepress/theme/samples'

const at = '2026-08-14T14:30:00.000000Z'

const placed = activity({ ...scenes.order, id: 's1', glyph: null })
const placedWithIcon = scenes.order

const grouped = group({ id: 's3', verb: 'order.placed', axis: 'repeat', count: 3, glyph: 'shopping-bag',
  published_at: at,
  headline_template: ':actor placed :count orders with :target',
  actors: [who.regular], targets: [where.kitchen],
  objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 1, objects: 3, targets: 1 } })

const examples = [
  activity({ id: 's4', verb: 'discussion.asked', glyph: 'message-circle',
    published_at: '2026-08-14T14:28:00.000000Z',
    headline_template: ':actor asked about :target',
    actor: who.customer4, object: notes.spice, target: dishes.chickenCurry }),
  activity({ id: 's5', verb: 'order.completed', glyph: 'receipt',
    published_at: '2026-08-14T14:25:00.000000Z',
    headline_template: ':actor completed :object',
    actor: who.cook, object: orders.first }),
  activity({ id: 's6', verb: 'menu.dish_live', glyph: 'chef-hat',
    published_at: '2026-08-14T09:00:00.000000Z',
    headline_template: ':actor put :object on the menu',
    actor: who.cook, object: dishes.kottu }),
]
</script>

## Writing a Story

The verb and the headline it renders with, in one class:

```php
<?php

namespace App\Stories;

use App\Models\Order;
use Storyfeed\Contracts\FeedVerb;
use Storyfeed\Story;

class OrderWasPlaced extends Story
{
    public string|array|null $objectType = Order::class;

    public string|FeedVerb|BackedEnum|null $verb = 'order.placed';

    public function headline(): string
    {
        return ':actor placed :object with :target';
    }
}
```

Publish through it and the activity arrives with its headline:

```php
// where the order is placed: a controller, an action, a listener
OrderWasPlaced::activity($order)
    ->by($customer)
    ->to($kitchen)
    ->publish();
```

<FeedStream :items="[placed]" :grouped="false" />

The tokens name roles, never models: `:actor`, `:object`, `:target`,
`:context`. Each becomes the label of the entity in that role.

## Generating and Registering

```bash
php artisan make:story OrderWasPlaced
```

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::stories([
    OrderWasPlaced::class,
]);
```

## Adding an Icon

```php
<?php

namespace App\Stories;

class OrderWasPlaced extends Story
{
    public string|array|null $objectType = Order::class;

    public string|FeedVerb|BackedEnum|null $verb = 'order.placed';

    public function headline(): string
    {
        return ':actor placed :object with :target';
    }

    public function icon(): ?string // [!code focus]
    { // [!code focus]
        return 'shopping-bag'; // [!code focus]
    } // [!code focus]
}
```

<FeedStream :items="[placedWithIcon]" :grouped="false" />

The icon is a token; your renderer maps it onto an icon set it owns.

## Grouping Repeats

Three orders in a row read better as one line. `groups()` gives the story a
plural headline for that case:

```php
<?php

namespace App\Stories;

use Storyfeed\Grouping\Group; // [!code focus]

class OrderWasPlaced extends Story
{
    public string|array|null $objectType = Order::class;

    public string|FeedVerb|BackedEnum|null $verb = 'order.placed';

    public function headline(): string
    {
        return ':actor placed :object with :target';
    }

    public function icon(): ?string
    {
        return 'shopping-bag';
    }

    public function groups(): array // [!code focus]
    { // [!code focus]
        return [ // [!code focus]
            Group::repeat()->headline(':actor placed :count orders with :target'), // [!code focus]
        ]; // [!code focus]
    } // [!code focus]
}
```

<FeedStream :items="[grouped]" :grouped="false" />

`:count` is how many, and `:actor` stays singular because every member shares
the actor. [Aggregation](/deeper/aggregation) covers the other ways activities
group.

## Anatomy

| Member | Required | |
|---|---|---|
| `$objectType` | yes | a model class (recommended), a morph alias, an array of either, or `'*'` for object-less activities |
| `$verb` | yes | a verb string or a `FeedVerb` enum case |
| `headline()` | yes | the singular template |
| `icon()` | no | an icon token |
| `groups()` | no | how repeats of this activity read as one line |
| `$type` | no | Activity Streams 2.0 type override; normally the enum's job |

Nothing is inferred from the class name. `$verb` and `$objectType` are both
explicit; the name is for the reader.

::: tip Naming
`{Object}Was{Verbed}` reads well when the object is the patient
(`OrderWasPlaced`). For reflexive activities, write what happened:
`CustomerJoined`, not `CustomerWasJoined`.
:::

## Examples

Three stories in the shapes a production kitchen app uses. Which role the
sentence names is the decision each one makes.

The object is the note, but its label is the note's text, so the sentence
names the target:

```php
<?php

namespace App\Stories;

use App\Models\Note;
use Storyfeed\Contracts\FeedVerb;
use Storyfeed\Story;

class QuestionWasAsked extends Story
{
    public string|array|null $objectType = Note::class;

    public string|FeedVerb|BackedEnum|null $verb = 'discussion.asked';

    public function headline(): string
    {
        return ':actor asked about :target';
    }

    public function icon(): ?string
    {
        return 'message-circle';
    }
}
```

A completed order has no target; the sentence ends at the object:

```php
<?php

namespace App\Stories;

use App\Models\Order;
use Storyfeed\Contracts\FeedVerb;
use Storyfeed\Story;

class OrderWasCompleted extends Story
{
    public string|array|null $objectType = Order::class;

    public string|FeedVerb|BackedEnum|null $verb = 'order.completed';

    public function headline(): string
    {
        return ':actor completed :object';
    }

    public function icon(): ?string
    {
        return 'receipt';
    }
}
```

A dish goes on the menu, and the menu is a fixed word in the sentence rather
than a role:

```php
<?php

namespace App\Stories;

use App\Models\MenuItem;
use Storyfeed\Contracts\FeedVerb;
use Storyfeed\Story;

class DishWentLive extends Story
{
    public string|array|null $objectType = MenuItem::class;

    public string|FeedVerb|BackedEnum|null $verb = 'menu.dish_live';

    public function headline(): string
    {
        return ':actor put :object on the menu';
    }

    public function icon(): ?string
    {
        return 'chef-hat';
    }
}
```

<FeedStream :items="examples" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>
