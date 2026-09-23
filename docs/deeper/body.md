# Activity Body Content

<script setup>
import { who, where, orders, dishes, notes, scenes, activity, ticketRows, ticketText } from '../.vitepress/theme/samples'

const row = {
  verb: 'place', glyph: 'shopping-bag',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor placed :object with :target',
  actor: who.regular, target: where.kitchen,
}

const asText = activity({
  ...row, id: 'ab1',
  object: { ...orders.first, body: [{ $body: 'Storyfeed/Body/Prose', $v: 1,
    content: ticketText('first'), mediaType: 'text/plain', verbatim: false, title: null }] },
})

const asExcerpt = activity({
  ...row, id: 'ab2',
  object: { ...orders.first, body: [{ $body: 'Storyfeed/Body/Excerpt', $v: 1,
    text: ticketText('first'), from: 'Ticket', truncated: false }] },
})

const withTicket = activity({
  ...row, id: 'ab3',
  object: { ...orders.first, body: [{ $body: 'Storyfeed/Body/KeyValue', $v: 1,
    items: ticketRows('first') }] },
})

// notes.spice carries a Storyfeed/Body/Component body named Note.
const withComponent = activity({
  id: 'ab4', verb: 'ask', glyph: 'message-circle',
  published_at: '2026-08-14T14:28:00.000000Z',
  headline_template: ':actor asked about :target',
  actor: who.customer4, object: notes.spice, target: dishes.chickenCurry,
})
</script>

A body is what an activity shows beneath its headline: the lines of an order, a
quoted passage, a before and after. The model writes it in `toFeed()`, and a
renderer draws it.

The order from [Usage Examples](/guide/usage-examples), with no body yet:

<FeedExample :items="[scenes.order]">
  <template #body><BodyPlaceholder /></template>
</FeedExample>

## Defining a Body

The plainest body is a line of text:

::: code-group

```php [Fluent Syntax]
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

```php [Named Arguments]
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

```php [Fluent Syntax]
// app/Models/Order.php, toFeed()
use Storyfeed\Body\Excerpt;

return FeedEntity::make()
    ->label("Order #{$this->reference}")
    ->body(Excerpt::make()->text($this->summary())->from('Ticket'));
```

```php [Named Arguments]
// app/Models/Order.php, toFeed()
use Storyfeed\Body\Excerpt;

return FeedEntity::make(
    label: "Order #{$this->reference}",
    body: Excerpt::make(text: $this->summary(), from: 'Ticket'),
);
```

:::

<FeedExample :items="[asExcerpt]" />

A `KeyValue` keeps each line apart as data:

::: code-group

```php [Fluent Syntax]
// app/Models/Order.php, toFeed()
use Storyfeed\Body\KeyValue;

return FeedEntity::make()
    ->label("Order #{$this->reference}")
    ->body(KeyValue::make()
        ->items($this->lines->mapWithKeys(fn (OrderLine $line) => [
            "{$line->quantity} × {$line->item->name}" => $line->total->format(),
        ])->all())
        ->items('Total', $this->total->format()));
```

```php [Named Arguments]
// app/Models/Order.php, toFeed()
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
    { "key": "1 × N101 Chicken Curry", "value": "$14.50", "verbatim": false, "missing": null }
  ]
}
```

Storyfeed stores the body and hands it back unchanged; it never looks inside.
A body holds values, not markup, and never contains another body.

### Values That Are Missing

A null value has no word of its own. Give the whole body one with `missing()`,
or one row its own with `KeyValue::missingAs()`:

::: code-group

```php [Fluent Syntax]
// app/Models/Order.php, toFeed()
KeyValue::make()
    ->missing('Not given')
    ->items([
        'Table' => $this->table_number,
        'Allergies' => KeyValue::missingAs($this->allergies, 'None'),
    ])
```

```php [Named Arguments]
// app/Models/Order.php, toFeed()
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

## Where a Body Lives

The model writes the body, in one of two places:

| Written with | Written | The body is |
|---|---|---|
| `->body(…)` on the `FeedEntity` in `toFeed()` | every time the model is saved | stored, and follows the model |
| `->body(…)` on the `FeedMedia` in `feedMedia()` | every read | built on the read, and never stored |

Neither freezes a value. To keep what was true at the time, point the activity
at a model that never changes, such as a revision or a posted note.

## Which Role's Body a Row Shows

A row draws its **object's** body, so make the thing the reader cares about the
object. The other roles carry their bodies in the payload too, but drawing them
would repeat an actor's body under every row that person acts in. A row whose
object has no body shows just its headline.

## More Than One Body

Each `body()` call adds to the list, in the order written:

::: code-group

```php [Fluent Syntax]
// app/Models/MenuItem.php, toFeed()
return FeedEntity::make()
    ->label($this->name)
    ->body(Excerpt::make()->text($this->description))
    ->body(KeyValue::make()->items('Station', $this->station));
```

```php [Named Arguments]
// app/Models/MenuItem.php, toFeed()
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

## Resolving a Body When the Feed Is Read

`feedMedia()` can return a body too, built from the model as it is at that
moment:

::: code-group

```php [Fluent Syntax]
// app/Models/MenuItem.php
public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return FeedMedia::make()
        ->url(route('menu.show', $context->routeKey()))
        ->body(KeyValue::make()->items('Portions left', $context->model()?->portions_left));
}
```

```php [Named Arguments]
// app/Models/MenuItem.php
public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return FeedMedia::make(
        url: route('menu.show', $context->routeKey()),
        body: KeyValue::make(items: ['Portions left' => $context->model()?->portions_left]),
    );
}
```

:::

A renderer draws it like a stored one.

### Deferring the Work

The resolver runs on every read. Pass a closure to build the body only when a
read draws it:

::: code-group

```php [Fluent Syntax]
// app/Models/MenuItem.php, feedMedia()
->body(fn () => KeyValue::make()->items('Portions left', $context->model()?->portions_left))
```

```php [Named Arguments]
// app/Models/MenuItem.php, feedMedia()
body: fn () => KeyValue::make(items: ['Portions left' => $context->model()?->portions_left]),
```

:::

It runs after the page's models are loaded, so it costs one query per class,
not one per row. If it throws, the error is reported and the body is left out.
Use a closure when the body reads the live row; a body built from the snapshot
is cheap enough to pass directly.

## What a Resolved Body May Read

The resolver runs for every entity on the page, including ones a renderer never
draws. These three reads cost no query per row:

- the snapshot, through `$context->data()`
- a column on the live row, through `$context->model()`, which loads every model
  of that class on the page in one query
- a relation named in `$context->model(with: […])`, loaded in the same batch

Anything else runs once per row: `$dish->orders()->count()` in a resolver
queries for every row that names a dish. Keep a counter column on the model
instead.

## Drawing Your Own Component

A `Component` body names a component in your frontend and the props it gets:

::: code-group

```php [Fluent Syntax]
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

```php [Named Arguments]
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

## Writing a Body Type

```php
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
        // Never throw: a row written by any version, even a newer one, still renders.
        return [
            'size' => is_int($payload['size'] ?? null) ? $payload['size'] : null,
            'mediaType' => is_string($payload['mediaType'] ?? null) ? $payload['mediaType'] : null,
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

### The Two Reserved Keys

| Key | Constant | Holds |
|---|---|---|
| `$body` | `FeedBody::KEY` | the body type's name, verbatim |
| `$v` | `FeedBody::VERSION` | the version that wrote the row |

The `$` prefix keeps them apart from your own keys.

### Names

`bodyType()` returns the name. A name is `Vocabulary/Type` in PascalCase: `Storyfeed/Body/MediaObject`,
`Acme/Attachment`. Renderers match it exactly. It's a lookup key, not a class
name, and stored rows keep it even if the class moves.

### Versions Are Add-only

Start `version()` at 1. A row with no `$v` is version 1. `upgrade()` runs when
a row is read and never writes back, so a renderer always sees the current
shape.

## Who Upgrades a Body

| Value | Node Key | Who Upgrades | Does `$v` Reach the Renderer? |
|---|---|---|---|
| `FeedThread` at `$thread` | `thread` | core, on read | no |
| `FeedChange` at `$change` | `change` | core, on read | no |
| a body type's value | stays in `body` | the renderer | yes |

Storyfeed upgrades `$thread` and `$change` itself, because it uses them to build
the node. It never looks inside a body, so your renderer calls `upgrade()`
before drawing one, even a `FeedThread` placed in a body.

## Existing Body Types

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

::: headless
:::
