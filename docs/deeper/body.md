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

Props are stored with the body and reflect their values when the body was
built. To display current progress whenever the
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

Register the component under the same name used in PHP. The kit's
`Storyfeed/Body/Component` renderer looks the name up and passes the component
the body's props:

::: code-group

```vue [Vue] memo="resources/js/pages/History.vue"
<script setup lang="ts">
import { provide } from 'vue';
import { FEED_COMPONENTS } from '@/components/storyfeed/keys';
import Progress from '@/components/orders/Progress.vue';

provide(FEED_COMPONENTS, { 'Orders/Progress': Progress });
</script>
```

```tsx [React] memo="resources/js/pages/History.tsx"
import { FeedProvider, FeedStream } from '@/components/storyfeed';
import Progress from '@/components/orders/Progress';

<FeedProvider FEED_COMPONENTS={{ 'Orders/Progress': Progress }}>
    <FeedStream page={feed} />
</FeedProvider>
```

```php [Blade] memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Ui\Support\BodyComponents;

app(BodyComponents::class)->register('Orders/Progress', 'orders.progress');
```

:::

Blade renders `<x-orders.progress>` and passes it the props. A name
with no registered component draws nothing. Style the list as a stepper, with
`[aria-current="step"]` highlighting the current step:

<FeedExample :items="[scene.deeper.body.progress]" />

Names are stored unchanged. Like `data()`, `props()` merges an array of keys
or sets one with `->props('current', 'Ready')`.

Use `Component` for props you control. If their structure will change over
time, define a body type with its own `upgrade()` method.

<a id="writing-a-body-type"></a>

## Writing Body Types

Extend `Storyfeed\FeedBody` and return the body's own fields from `body()`:

```php memo="app/Feed/Attachment.php"
<?php

namespace App\Feed;

use Storyfeed\FeedBody;

class Attachment extends FeedBody
{
    protected ?int $size = null;

    protected ?string $mediaType = null;

    protected function __construct(?int $size = null, ?string $mediaType = null)
    {
        $this->size($size)->mediaType($mediaType);
    }

    public function size(?int $size): static
    {
        $this->size = $size;

        return $this;
    }

    public function mediaType(?string $mediaType): static
    {
        $this->mediaType = $mediaType;

        return $this;
    }

    public static function bodyType(): string
    {
        return 'Acme/Attachment';
    }

    protected function body(): array
    {
        // Values only: no markup, and never another body.
        return [
            'size' => $this->required($this->size, 'size'),
            'mediaType' => $this->mediaType,
        ];
    }

    protected static function defaults(): array
    {
        return ['mediaType' => null];
    }
}
```

`make()` takes the constructor's arguments, so the chain and named arguments
build the same body:

```php memo="A model's toFeed() method"
use App\Feed\Attachment;

Attachment::make()->size($this->bytes)->mediaType('application/pdf');
Attachment::make(size: $this->bytes, mediaType: 'application/pdf');
```

`FeedBody` writes the reserved keys, and leaves out any field that still holds
its value from `defaults()`. Its `upgrade()` method puts those defaults back
when the body is read. `required()` throws when the body is used without a
value, naming the method that sets it. Every body also has `fallback()`,
`maxHeight()`, `fullHeight()` and `withMeta()`.

A class that cannot extend `FeedBody`, such as a data object, implements
`Storyfeed\Contracts\FeedBody` and writes `toPayload()` itself, with the
`HasPayload` trait for `toArray()`.

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
| `$fallback` | `FeedBody::FALLBACK` | one line of plain text for a renderer that cannot draw the type |
| `$meta` | `FeedBody::META` | renderer settings, such as `maxHeight` |

The `$` prefix keeps them apart from your own keys.

### Rendering Body Types

Give each kit a renderer for the body type's exact name. The renderer receives
the body and the entity that carries it:

::: code-group

```blade [Blade] memo="resources/views/vendor/storyfeed/components/body/acme/attachment.blade.php"
@use('App\Feed\Attachment')
@props(['body', 'entity' => null])

@php($body = Attachment::upgrade($body, $body['$v'] ?? 1))

<p>{{ $body['mediaType'] }} · {{ $body['size'] }} bytes</p>
```

```ts [Vue] memo="resources/js/app.ts"
import { feedBodies } from '@/components/storyfeed/body';
import Attachment from '@/components/feed/Attachment.vue';

createApp(App).use(feedBodies({ 'Acme/Attachment': Attachment }));
```

```tsx [React] memo="resources/js/pages/History.tsx"
import { FeedProvider, FeedStream } from '@/components/storyfeed';
import Attachment from '@/components/feed/Attachment';

<FeedProvider FEED_BODIES={{ 'Acme/Attachment': Attachment }}>
    <FeedStream page={feed} />
</FeedProvider>
```

:::

Blade finds the view by the type's name, segment by segment, under
`resources/views/vendor/storyfeed/components/body`. A Vue renderer receives
`payload`, `entityLabel`, `entityUrl` and `entityMedia` props; a React renderer
receives `BodyProps`. A renderer registered for one of Storyfeed's own types
replaces the kit's. A body type with no renderer draws its `$fallback` line, or
nothing.

<a id="body-versions"></a>

### Versions and Upgrades

`version()` starts at 1. When the body's shape changes, raise `version()` and
override `upgrade()` to convert a payload an older version wrote. Storyfeed
stores the body as written, `$v` included, and returns it unchanged. A Blade
view calls `upgrade()` with the stored `$v`, as above. A Vue or React renderer
applies the same steps in TypeScript.

<a id="upgrading-payload-values"></a>

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
