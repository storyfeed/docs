# Custom Body Types

<script setup>
import { scene } from '../.vitepress/theme/world'
const withComponent = scene.question
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
use Storyfeed\Body\Excerpt;
use Storyfeed\Body\KeyValue;
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
            ->body(Excerpt::make()->text($this->description))
            ->body(KeyValue::make()->items('Station', $this->station));
    }
}
```

```php [Named Arguments] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Excerpt;
use Storyfeed\Body\KeyValue;
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
                Excerpt::make(text: $this->description),
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
        ->body(KeyValue::make()
            ->items('Portions left', $context->model()?->portions_left));
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

Define the body in either method:

| Method | When It Runs | Body |
|---|---|---|
| `->body(…)` on `FeedEntity` in `toFeed()` | whenever the model is saved | stored and updated with the model |
| `->body(…)` on `FeedMedia` in `feedMedia()` | whenever the feed is retrieved | built from current values and never stored |

Neither freezes a value. To keep what was true at the time, point the activity
at a model that never changes, such as a revision or a posted note.

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

A `Component` body names a frontend component and its props:

::: code-group

```php [Fluent Syntax] memo="app/Models/Note.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Component;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Note extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
            ->label($this->body)
            ->body(Component::make()
                ->name('Note')
                ->props(['excerpt' => $this->body]));
    }
}
```

```php [Named Arguments] memo="app/Models/Note.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Component;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Note extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: $this->body,
            body: Component::make(
                name: 'Note',
                props: ['excerpt' => $this->body],
            ),
        );
    }
}
```

:::

<FeedExample :items="[withComponent]">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedExample>

It is stored as `Storyfeed/Body/Component`, with `name` and `props` as given.

Names are stored unchanged and may be paths such as `Orders/Ticket`. Your
frontend maps each name to a component. Like `data()`, `props()` merges an
array of keys or sets one with `->props('pinned', true)`.

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
