# Story Classes

A Story is the blueprint for one type of activity: its verb, headline, icon
and grouping, in one class. A feed works without one.

<script setup>
import { who, where, orders, dishes, notes, activity, group, scenes } from '../.vitepress/theme/samples'

const at = '2026-08-14T14:30:00.000000Z'

const placed = activity({ ...scenes.order, id: 's1', glyph: null })
const placedWithIcon = scenes.order

const grouped = group({ id: 's3', verb: 'place', axis: 'repeat', count: 3, glyph: 'shopping-bag',
  published_at: at,
  headline_template: ':actor placed :count orders with :target',
  actors: [who.regular], targets: [where.kitchen],
  objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 1, objects: 3, targets: 1 } })

const examples = [
  activity({ id: 's4', verb: 'ask', glyph: 'message-circle',
    published_at: '2026-08-14T14:28:00.000000Z',
    headline_template: ':actor asked about :target',
    actor: who.customer4, object: notes.spice, target: dishes.chickenCurry }),
  activity({ id: 's5', verb: 'complete', glyph: 'receipt',
    published_at: '2026-08-14T14:25:00.000000Z',
    headline_template: ':actor completed :object',
    actor: who.cook, object: orders.first }),
  activity({ id: 's6', verb: 'publish', glyph: 'chef-hat',
    published_at: '2026-08-14T09:00:00.000000Z',
    headline_template: ':actor put :object on the menu',
    actor: who.cook, object: dishes.kottu }),
]
</script>

## Writing a Story

```php
<?php

namespace App\Stories;

use App\Models\Order;
use BackedEnum;
use Storyfeed\Contracts\FeedVerb;
use Storyfeed\Story;

class OrderWasPlaced extends Story
{
    public string|array|null $objectType = Order::class;

    public string|FeedVerb|BackedEnum|null $verb = 'place';

    public function headline(): string
    {
        return ':actor placed :object with :target';
    }
}
```

Publish through it:

```php
// where the order is placed: a controller, an action, a listener
OrderWasPlaced::activity($order)
    ->by($customer)
    ->to($kitchen)
    ->publish();
```

<FeedExample context :items="[placed]" />

Tokens name roles, not models: `:actor` becomes the label of whoever is in the
actor role.

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

use App\Models\Order;
use BackedEnum;
use Storyfeed\Contracts\FeedVerb;
use Storyfeed\Story;

class OrderWasPlaced extends Story
{
    public string|array|null $objectType = Order::class;

    public string|FeedVerb|BackedEnum|null $verb = 'place';

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

<FeedExample :items="[placedWithIcon]" />

The icon is a name; your renderer maps it to an icon.

## Grouping Repeats

`groups()` gives the story a plural headline for repeats:

```php
<?php

namespace App\Stories;

use App\Models\Order;
use BackedEnum;
use Storyfeed\Contracts\FeedVerb;
use Storyfeed\Grouping\Group; // [!code focus]
use Storyfeed\Story;

class OrderWasPlaced extends Story
{
    public string|array|null $objectType = Order::class;

    public string|FeedVerb|BackedEnum|null $verb = 'place';

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

<FeedExample :items="[grouped]" />

`:count` is how many. [Aggregation](/deeper/aggregation) covers the other ways
activities group.

## What a Story Declares

| Member | Required | |
|---|---|---|
| `$objectType` | yes | a model class (recommended), a morph alias, an array of either, or `'*'` for object-less activities |
| `$verb` | yes | a verb string or a `FeedVerb` enum case |
| `headline()` | yes | the singular template |
| `icon()` | no | an icon token |
| `groups()` | no | how repeats of this activity read as one line |
| `$type` | no | Activity Streams 2.0 type override; normally the enum's job |

Nothing is inferred from the class name.

::: tip Naming
Name a story for what happened: `OrderWasPlaced`, `CustomerJoined`.
:::

## Examples

The object is a note whose label is its text, so the sentence names the
target instead:

```php
<?php

namespace App\Stories;

use App\Models\Note;
use BackedEnum;
use Storyfeed\Contracts\FeedVerb;
use Storyfeed\Story;

class QuestionWasAsked extends Story
{
    public string|array|null $objectType = Note::class;

    public string|FeedVerb|BackedEnum|null $verb = 'ask';

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

A completed order has no target:

```php
<?php

namespace App\Stories;

use App\Models\Order;
use BackedEnum;
use Storyfeed\Contracts\FeedVerb;
use Storyfeed\Story;

class OrderWasCompleted extends Story
{
    public string|array|null $objectType = Order::class;

    public string|FeedVerb|BackedEnum|null $verb = 'complete';

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

The menu is a plain word in the sentence, not a role:

```php
<?php

namespace App\Stories;

use App\Models\MenuItem;
use BackedEnum;
use Storyfeed\Contracts\FeedVerb;
use Storyfeed\Story;

class DishWentLive extends Story
{
    public string|array|null $objectType = MenuItem::class;

    public string|FeedVerb|BackedEnum|null $verb = 'publish';

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

<FeedExample :items="examples">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedExample>
