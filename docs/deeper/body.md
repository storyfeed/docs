# Custom Body Types

<script setup>
import { scene } from '../.vitepress/theme/world'
const withComponent = scene.question
</script>

## Introduction

Beyond the body types Storyfeed ships, a body can be built when the feed is
read, name a component in your frontend, or be a body type you write.

<a id="defining-a-body"></a>
<a id="defining-bodies"></a>
<a id="text-and-excerpts"></a>
<a id="labelled-values"></a>
<a id="values-that-are-missing"></a>
<a id="missing-values"></a>
<a id="existing-body-types"></a>
<a id="available-body-types"></a>

Adding a body in `toFeed()`, and the body types Storyfeed ships, are covered in
[Activity Content](/basics/activity-content#built-in-body-types).

## Attaching Bodies to Entities

<a id="bodies-by-role"></a>
<a id="multiple-bodies"></a>

Each entity can carry bodies, in any role, and your frontend chooses which to
display. Each `body()` call adds to the list, in the order written:

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

When `toFeed()` and `feedMedia()` both return a body, the row carries both,
stored bodies first. The renderer decides how they're laid out.

<a id="resolving-a-body-when-the-feed-is-read"></a>

## Resolving Bodies at Read Time

`feedMedia()` can return a body too, built from the model as it is at that
moment:

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

The model writes the body, in one of two places:

| Written with | Written | The body is |
|---|---|---|
| `->body(…)` on the `FeedEntity` in `toFeed()` | every time the model is saved | stored, and follows the model |
| `->body(…)` on the `FeedMedia` in `feedMedia()` | every read | built on the read, and never stored |

Neither freezes a value. To keep what was true at the time, point the activity
at a model that never changes, such as a revision or a posted note.

<a id="deferring-the-work"></a>

### Deferred Resolution

The resolver runs on every read. Pass a closure to build the body only when a
payload resolves it:

::: code-group

```php [Fluent Syntax] memo="app/Models/MenuItem.php" at="feedMedia()"
->body(fn () => KeyValue::make()
    ->items('Portions left', $context->model()?->portions_left))
```

```php [Named Arguments] memo="app/Models/MenuItem.php" at="feedMedia()"
body: fn () => KeyValue::make(
    items: ['Portions left' => $context->model()?->portions_left],
),
```

:::

It costs one query per model class on the page, not one per row. If it throws, the error is reported once per class and that
body is left out; the activity stays in the feed with its label, link and any
other bodies.
Use a closure when the body reads the live row; a body built from the snapshot
is cheap enough to pass directly.

<a id="data-available-to-resolvers"></a>

### Resolver Data

The resolver runs for every entity on the page. Read the snapshot with
`$context->data()`, and the live row with `$context->model()`, which loads
every model of that class on the page together. Name relations in
`$context->model(with: […])` to load them in the same batch. A query of your
own, such as `$dish->orders()->count()`, runs once per row, so keep a counter
column on the model instead.

<a id="drawing-your-own-component"></a>

## Using Custom Components

A `Component` body names a component in your frontend and the props it gets:

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

The name is kept verbatim, so it can be a path such as `Orders/Ticket`. Your
frontend decides which component it means. `props()` merges, as `data()` does:
an array adds keys, and `->props('pinned', true)` sets one.

A `Component` suits props you control. When the shape will change over time,
write a body type with its own `upgrade()`.

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

`bodyType()` returns the name. A name is `Vocabulary/Type` in PascalCase: `Storyfeed/Body/MediaObject`,
`Acme/Attachment`. Renderers match it exactly. It's a lookup key, not a class
name, and stored rows keep it even if the class moves.

<a id="the-two-reserved-keys"></a>

### Reserved Keys

| Key | Constant | Holds |
|---|---|---|
| `$body` | `FeedBody::KEY` | the body type's name, verbatim |
| `$v` | `FeedBody::VERSION` | the version that wrote the body |

The `$` prefix keeps them apart from your own keys.

<a id="body-versions"></a>

### Versions and Upgrades

Start `version()` at 1. The body's `upgrade()` method converts an older
payload when your frontend calls it. Storyfeed preserves the stored body and
its version.

<a id="upgrading-payload-values"></a>

Storyfeed upgrades an activity's `thread` and `change` itself. A body arrives
as it was stored, `$v` included, so your renderer calls `upgrade()` before
drawing one, even a `FeedThread` placed in a body.


::: headless
:::
