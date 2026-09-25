# Activity Body Content

## Introduction

<script setup>
import { scene, role, activity } from '../.vitepress/theme/world'
const row = scene.order
const ticket = [{ key: role.product.label, value: '1', verbatim: false, missing: null }]
const text = `1 × ${role.product.label}`
const asText = activity({ ...row,
  object: { ...row.object, body: [{ $body: 'Storyfeed/Body/Prose', $v: 1,
    content: text, mediaType: 'text/plain', verbatim: false, title: null }] } })
const asExcerpt = activity({ ...row,
  object: { ...row.object, body: [{ $body: 'Storyfeed/Body/Excerpt', $v: 1,
    text, from: 'Ticket', truncated: false }] } })
const withTicket = activity({ ...row,
  object: { ...row.object, body: [{ $body: 'Storyfeed/Body/KeyValue', $v: 1, items: ticket }] } })
const withComponent = scene.question
</script>

A body is what an activity shows beneath its headline: the lines of an order, a
quoted passage, a before and after. The model writes it in `toFeed()`, and a
renderer draws it.

The order from [Usage Examples](/guide/usage-examples), with no body yet:

<FeedExample :items="[scene.order]">
  <template #body><BodyPlaceholder /></template>
</FeedExample>

<a id="defining-a-body"></a>

## Defining Bodies

### Text and Excerpts

The plainest body is a line of text:

::: code-group

```php [Fluent Syntax] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
            ->label("Order #{$this->reference}")
            ->body($this->summary());
    }
}
```

```php [Named Arguments] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: "Order #{$this->reference}",
            body: $this->summary(),
        );
    }
}
```

:::

<FeedExample :items="[asText]" />

An `Excerpt` adds a caption saying where the words came from:

::: code-group

```php [Fluent Syntax] memo="app/Models/Order.php" at="toFeed()"
use Storyfeed\Body\Excerpt;

return FeedEntity::make()
    ->label("Order #{$this->reference}")
    ->body(Excerpt::make()->text($this->summary())->from('Ticket'));
```

```php [Named Arguments] memo="app/Models/Order.php" at="toFeed()"
use Storyfeed\Body\Excerpt;

return FeedEntity::make(
    label: "Order #{$this->reference}",
    body: Excerpt::make(text: $this->summary(), from: 'Ticket'),
);
```

:::

<FeedExample :items="[asExcerpt]" />

### Labelled Values

A `KeyValue` keeps each line apart as data:

::: code-group

```php [Fluent Syntax] memo="app/Models/Order.php" at="toFeed()"
use Storyfeed\Body\KeyValue;

return FeedEntity::make()
    ->label("Order #{$this->reference}")
    ->body(KeyValue::make()
        ->items($this->lines->mapWithKeys(fn (OrderLine $line) => [
            "{$line->quantity} × {$line->item->name}" => $line->total->format(),
        ])->all())
        ->items('Total', $this->total->format()));
```

```php [Named Arguments] memo="app/Models/Order.php" at="toFeed()"
use Storyfeed\Body\KeyValue;

return FeedEntity::make(
    label: "Order #{$this->reference}",
    body: KeyValue::make(items: $this->lines
        ->mapWithKeys(fn (OrderLine $line) => [
            "{$line->quantity} × {$line->item->name}" => $line->total->format(),
        ])
        ->put('Total', $this->total->format())
        ->all()),
);
```

:::

<FeedExample :items="[withTicket]" />

Plain text can only be printed as it is. Labelled rows let a renderer line up
each item with its price and set the total apart. Use the plainest body type your
renderer makes use of.

Recording the activity doesn't change: the body comes from the model. The body
arrives on the node exactly as it went in:

```json
{
  "$body": "Storyfeed/Body/KeyValue",
  "$v": 1,
  "title": null,
  "items": [
    {
      "key": "1 × N101 Chicken Curry",
      "value": "$14.50",
      "verbatim": false,
      "missing": null
    }
  ]
}
```

Storyfeed stores the body and hands it back unchanged; it never looks inside.
A body holds values, not markup, and never contains another body.

<a id="values-that-are-missing"></a>

### Missing Values

A null value has no word of its own. Give the whole body one with `missing()`,
or one row its own with `KeyValue::missingAs()`:

::: code-group

```php [Fluent Syntax] memo="app/Models/Order.php" at="toFeed()"
KeyValue::make()
    ->missing('Not given')
    ->items([
        'Table' => $this->table_number,
        'Allergies' => KeyValue::missingAs($this->allergies, 'None'),
    ])
```

```php [Named Arguments] memo="app/Models/Order.php" at="toFeed()"
KeyValue::make(
    missing: 'Not given',
    items: [
        'Table' => $this->table_number,
        'Allergies' => KeyValue::missingAs($this->allergies, 'None'),
    ],
)
```

:::

| Call | Sets the word for |
|---|---|
| `->missing($word)` | every row with no value, unless it has its own |
| `KeyValue::missingAs($value, $word)` | that one row |

Every row carries its word in `missing`, beside its `value`, or `null` when
neither call gave one.

<a id="existing-body-types"></a>

## Available Body Types

Storyfeed ships eight under `Storyfeed\Body`. They're conventions a renderer
can choose to draw; Storyfeed itself treats them like any other body.

| Name | Is | Keys |
|---|---|---|
| `Storyfeed/Body/KeyValue` | labelled rows | `title`, `items[]` of `key`, `value`, `verbatim`, `missing` |
| `Storyfeed/Body/Excerpt` | a passage, and where it came from | `text`, `from`, `truncated` |
| `Storyfeed/Body/Change` | before → after, for one field or several | `items`, a map of field to `[before, after]` |
| `Storyfeed/Body/File` | what an artefact is and how big | `name`, `size`, `mediaType` |
| `Storyfeed/Body/Prose` | authored text, and how to read it | `content`, `mediaType`, `verbatim`, `title` |
| `Storyfeed/Body/ItemList` | several things, each a name and maybe a link | `title`, `items[]`, `ordered`, `totalItems`, `more` |
| `Storyfeed/Body/MediaObject` | a title, some prose, one picture, the files | `subject`, `content`, `image`, `attachments`, `footnote` |
| `Storyfeed/Body/Component` | a component of your own, by name | `name`, `props` |

A string passed as `body` is stored as `Storyfeed/Body/Prose`, so a renderer
never has to handle a bare string.

## Attaching Bodies to Entities

### Bodies By Role

Each entity can carry bodies, in any role. These examples show the object's
body beneath the headline. Your frontend chooses which bodies to display.

### Multiple Bodies

Each `body()` call adds to the list, in the order written:

::: code-group

```php [Fluent Syntax] memo="app/Models/MenuItem.php" at="toFeed()"
return FeedEntity::make()
    ->label($this->name)
    ->body(Excerpt::make()->text($this->description))
    ->body(KeyValue::make()->items('Station', $this->station));
```

```php [Named Arguments] memo="app/Models/MenuItem.php" at="toFeed()"
return FeedEntity::make(
    label: $this->name,
    body: [
        Excerpt::make(text: $this->description),
        KeyValue::make(items: ['Station' => $this->station]),
    ],
);
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

It runs after the page's models are loaded, so it costs one query per class,
not one per row. If it throws, the error is reported and the body is left out.
Use a closure when the body reads the live row; a body built from the snapshot
is cheap enough to pass directly.

<a id="data-available-to-resolvers"></a>

### Resolver Data

The resolver runs for every entity on the page, including ones a renderer never
draws. These three reads cost no query per row:

- the snapshot, through `$context->data()`
- a column on the live row, through `$context->model()`, which loads every model
  of that class on the page in one query
- a relation named in `$context->model(with: […])`, loaded in the same batch

Anything else runs once per row: `$dish->orders()->count()` in a resolver
queries for every row that names a dish. Keep a counter column on the model
instead.

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
an array adds keys, and `->props('pinned', true)` sets one. A body without a
name throws `IncompleteFeedValue` when it is used.

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
| `$v` | `FeedBody::VERSION` | the version that wrote the row |

The `$` prefix keeps them apart from your own keys.

<a id="body-versions"></a>

### Versions and Upgrades

Start `version()` at 1. The body's `upgrade()` method converts an older
payload when your frontend calls it. Storyfeed preserves the stored body and
its version.

<a id="upgrading-payload-values"></a>

## Upgrading Other Payload Values

| Value | Node Key | Who Upgrades | Does `$v` Reach the Renderer? |
|---|---|---|---|
| `FeedThread` at `$thread` | `thread` | Storyfeed, on read | no |
| `FeedChange` at `$change` | `change` | Storyfeed, on read | no |
| a body type's value | stays in `body` | the renderer | yes |

Storyfeed upgrades `$thread` and `$change` itself, because it uses them to build
the node. It never looks inside a body, so your renderer calls `upgrade()`
before drawing one, even a `FeedThread` placed in a body.


::: headless
:::
