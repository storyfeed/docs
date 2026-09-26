# Custom Body Types

<script setup>
import { scene, role } from '../.vitepress/theme/world'
</script>

## Introduction

You may build a body when the feed is retrieved, use a frontend component,
or define your own body type.

<a id="defining-a-body"></a>
<a id="defining-bodies"></a>
<a id="text-and-excerpts"></a>
<a id="labelled-values"></a>
<a id="values-that-are-missing"></a>
<a id="missing-values"></a>
<a id="existing-body-types"></a>
<a id="available-body-types"></a>

See [Activity Content](/basics/activity-content#built-in-body-types) for
built-in body types and adding bodies in `toFeed()`.

## Attaching Bodies to Entities

<a id="bodies-by-role"></a>
<a id="multiple-bodies"></a>

Entities in any role can have bodies. Your frontend chooses which to display.
Each `body()` call appends a body in the order given:

::: code-group

```php [Fluent Syntax] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\KeyValue;
use Storyfeed\Body\Prose;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
            ->label($this->name)
            ->body(Prose::make($this->description))
            ->body(KeyValue::make()->items('Station', $this->station));
    }
}
```

```php [Named Arguments] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\KeyValue;
use Storyfeed\Body\Prose;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: $this->name,
            body: [
                Prose::make($this->description),
                KeyValue::make(items: ['Station' => $this->station]),
            ],
        );
    }
}
```

:::

When `toFeed()` and `feedMedia()` both return bodies, the item includes both,
with stored bodies first. Your renderer controls the layout.

<a id="resolving-a-body-when-the-feed-is-read"></a>

## Resolving Bodies When Retrieved {#resolving-bodies-at-read-time}

Return a body from `feedMedia()` to use the model's current values:

::: code-group

```php [Fluent Syntax] memo="app/Models/MenuItem.php"
public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return FeedMedia::make()
        ->url(route('menu.show', $context->routeKey()))
        ->body(
            KeyValue::make()
                ->items('Portions left', $context->model()?->portions_left),
        );
}
```

```php [Named Arguments] memo="app/Models/MenuItem.php"
public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return FeedMedia::make(
        url: route('menu.show', $context->routeKey()),
        body: KeyValue::make(
            items: ['Portions left' => $context->model()?->portions_left],
        ),
    );
}
```

:::

Stored and resolved bodies share the same payload shape.

<a id="stored-and-resolved-bodies"></a>

### Stored and Resolved Values

Choose when a value is decided:

| Method | When It Runs | Value |
|---|---|---|
| `->data(…)` on the activity | when the activity is published | frozen at publication |
| `->body(…)` on `FeedEntity` in `toFeed()` | whenever the model is saved | stored and updated with the model |
| `->body(…)` on `FeedMedia` in `feedMedia()` | whenever the feed is retrieved | built from current values and never stored |

See [Computed Values in the Feed](/cookbook/computed-values) for publication-time facts and counts computed on retrieval.

<a id="deferring-the-work"></a>

### Deferred Resolution

The resolver runs whenever the feed is retrieved. Pass a closure to defer
building the body until the payload needs it:

::: code-group

```php [Fluent Syntax] memo="app/Models/MenuItem.php" at="feedMedia()"
->body(
    fn () => KeyValue::make()
        ->items('Portions left', $context->model()?->portions_left),
)
```

```php [Named Arguments] memo="app/Models/MenuItem.php" at="feedMedia()"
body: fn () => KeyValue::make(
    items: ['Portions left' => $context->model()?->portions_left],
),
```

:::

Loading models takes one query per model class on the page. If the resolver
throws, Storyfeed reports the error once per class and omits that body. The
activity keeps its label, link, and other bodies. Use a closure when the body
needs current model data; bodies built from the snapshot can be passed directly.

<a id="data-available-to-resolvers"></a>

### Resolver Data

The resolver runs for every entity on the page. Use `$context->data()` for
the snapshot or `$context->model()` for the current model. The latter loads
all models of that class on the page together. Pass relations to
`$context->model(with: […])` to load them together too. A query such as
`$dish->orders()->count()` runs once per entity, so use a counter column on
the model to avoid repeated queries.

<a id="drawing-your-own-component"></a>

## Using Custom Components

A `Component` body names a frontend component and passes it props. For
example, an order at {{ role.shop.label }} may show its pickup progress as
a stepper. The built-in bodies can display text and fields; a custom component
can connect the steps and highlight the current one.

::: code-group

```php [Fluent Syntax] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Component;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
            ->label("Order #{$this->id}")
            ->body(
                Component::make()
                    ->name('Orders/Progress') // [!code highlight]
                    ->props([
                        'title' => "Order #{$this->id}",
                        'steps' => ['Placed', 'Confirmed', 'Ready'],
                        'current' => $this->status_label,
                        'pickup' => $this->pickup_at->format('g:i A'),
                    ]),
            );
    }
}
```

```php [Named Arguments] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Component;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: "Order #{$this->id}",
            body: Component::make(
                name: 'Orders/Progress', // [!code highlight]
                props: [
                    'title' => "Order #{$this->id}",
                    'steps' => ['Placed', 'Confirmed', 'Ready'],
                    'current' => $this->status_label,
                    'pickup' => $this->pickup_at->format('g:i A'),
                ],
            ),
        );
    }
}
```

:::

The props are plain values: a title, a list of steps, the current step's label,
and a formatted pickup time. They are stored with the body and reflect the
values when the body was built. To display current progress whenever the
feed is retrieved, build the body in
[`feedMedia()`](#resolving-bodies-at-read-time), as shown above.

### Rendering the Component

Your frontend maps each name to a component. In Vue, the component receives
the stored props and marks the current step with `aria-current`:

```vue memo="resources/js/components/orders/Progress.vue"
<script setup>
defineProps(['title', 'steps', 'current', 'pickup'])
</script>

<template>
    <section class="order-progress" :aria-label="`${title} pickup progress`">
        <strong>{{ title }}</strong>
        <p>Pickup at {{ pickup }}</p>
        <ol>
            <li v-for="step in steps" :key="step"
                :aria-current="step === current ? 'step' : undefined">
                {{ step }}
            </li>
        </ol>
    </section>
</template>
```

In your body renderer, register the component under the same name used in PHP
and pass it the body's props:

```vue memo="resources/js/components/feed/ComponentBody.vue"
<script setup>
import Progress from '../orders/Progress.vue'

defineProps(['body'])
const components = { 'Orders/Progress': Progress }
</script>

<template>
    <component v-if="components[body.name]"
        :is="components[body.name]" v-bind="body.props" />
</template>
```

Use this renderer for bodies whose `$body` is `Storyfeed/Body/Component`.
Style the list as a stepper, with `[aria-current="step"]` highlighting the
current step. The following item uses that mapping and a styled component:

<FeedExample :items="[scene.deeper.body.progress]">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedExample>

Names are stored unchanged. Like `data()`, `props()` merges an array of keys
or sets one with `->props('current', 'Ready')`.

Use `Component` for props you control. If their structure will change over
time, define a body type with its own `upgrade()` method.

<a id="writing-a-body-type"></a>

## Writing Body Types

```php memo="app/Feed/Attachment.php"
<?php

namespace App\Feed;

use Storyfeed\Concerns\HasPayload;
use Storyfeed\Contracts\FeedBody;

final class Attachment implements FeedBody
{
    use HasPayload;

    private function __construct(
        private readonly ?int $size,
        private readonly ?string $mediaType,
    ) {}

    public static function make(?int $size = null, ?string $mediaType = null): self
    {
        return new self($size, $mediaType);
    }

    public static function bodyType(): string
    {
        return 'Acme/Attachment';
    }

    public static function version(): int
    {
        return 1;
    }

    public static function upgrade(array $payload, int $from): array
    {
        // Missing or unrecognised values become null.
        return [
            'size' => is_int($payload['size'] ?? null) ? $payload['size'] : null,
            'mediaType' => is_string($payload['mediaType'] ?? null)
                ? $payload['mediaType']
                : null,
        ];
    }

    public function toPayload(): array
    {
        // Values only: no markup, and never another body.
        return [
            self::KEY => self::bodyType(),
            self::VERSION => self::version(),
            'size' => $this->size,
            'mediaType' => $this->mediaType,
        ];
    }
}
```

`HasPayload` builds `toArray()` from `toPayload()`.

<a id="names"></a>

### Type Names

Return a PascalCase `Vocabulary/Type` name from `bodyType()`, such as
`Storyfeed/Body/MediaObject` or `Acme/Attachment`. Renderers match it exactly.
Stored bodies keep this name even if you move the PHP class.

<a id="the-two-reserved-keys"></a>

### Reserved Keys

| Key | Constant | Holds |
|---|---|---|
| `$body` | `FeedBody::KEY` | the body type's name, verbatim |
| `$v` | `FeedBody::VERSION` | the version that wrote the body |

The `$` prefix keeps them apart from your own keys.

<a id="body-versions"></a>

### Versions and Upgrades

Start `version()` at 1. Call the body's `upgrade()` method to convert older
payloads for your frontend. Storyfeed preserves the stored body and version.

<a id="upgrading-payload-values"></a>

Storyfeed upgrades an activity's `thread` and `change` automatically. Bodies
arrive as stored, including `$v`, so your renderer must call `upgrade()` before
displaying them. This also applies to a `FeedThread` used as a body.


::: headless
:::
