# Custom Body Types

<script setup>
import { scene, role } from '../.vitepress/theme/world'
</script>

## Introduction

Use a custom component to render application-specific props, or define a
versioned body type when you need to upgrade its stored payload over time.

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
[`feedMedia()`](/deeper/resolving-bodies#using-current-values).

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
Style the list as a stepper, with `[aria-current="step"]` highlighting the current step.
Rendered with that mapping:

<FeedExample :items="[scene.deeper.body.progress]" />

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

Return a PascalCase body type name from `bodyType()`, such as
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

Bodies arrive as stored, including `$v`, so your renderer must call the
body type's `upgrade()` method before displaying versions it supports.

<a id="defining-a-body"></a>
<a id="defining-bodies"></a>
<a id="text-and-excerpts"></a>
<a id="labelled-values"></a>
<a id="values-that-are-missing"></a>
<a id="missing-values"></a>
<a id="existing-body-types"></a>
<a id="available-body-types"></a>
<a id="attaching-bodies-to-entities"></a>
<a id="bodies-by-role"></a>
<a id="multiple-bodies"></a>
<a id="resolving-a-body-when-the-feed-is-read"></a>
<a id="resolving-bodies-at-read-time"></a>
<a id="stored-and-resolved-bodies"></a>
<a id="stored-and-resolved-values"></a>
<a id="deferring-the-work"></a>
<a id="deferred-resolution"></a>
<a id="data-available-to-resolvers"></a>
<a id="resolver-data"></a>

See [Activity Content](/basics/activity-content) for built-in bodies and
[Resolving Bodies When Retrieved](/deeper/resolving-bodies) for current values.
