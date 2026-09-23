# Activity Body Content

<script setup>
import { who, where, orders, scenes, activity, ticketRows, ticketText } from '../.vitepress/theme/samples'

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

```php
// app/Models/Order.php
public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        label: "Order #{$this->reference}",
        body: $this->summary(),
    );
}
```

<FeedExample :items="[asText]" />

An `Excerpt` adds a caption saying where the words came from:

```php
// app/Models/Order.php
use Storyfeed\Body\Excerpt;

public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        label: "Order #{$this->reference}",
        body: Excerpt::make($this->summary(), from: 'Ticket'),
    );
}
```

<FeedExample :items="[asExcerpt]" />

A `KeyValue` keeps each line apart as data:

```php
// app/Models/Order.php
use Storyfeed\Body\KeyValue;

public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        label: "Order #{$this->reference}",
        body: KeyValue::make($this->lines
            ->mapWithKeys(fn (OrderLine $line) => [
                "{$line->quantity} × {$line->item->name}" => $line->total->format(),
            ])
            ->put('Total', $this->total->format())
            ->all()),
    );
}
```

<FeedExample :items="[withTicket]" />

A renderer can only print text. Given labelled rows, it can align each item
against its price and set the total apart. Use the plainest form your renderer
will make use of.

A body in `toFeed()` is rebuilt whenever the model is saved, so it suits facts
the app has finished deciding. The publishing line does not change:

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($customer)
    ->action('place', $order)
    ->to($kitchen)
    ->publish();
```

The form arrives on the node exactly as it went in:

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

Core does not read, upgrade, count or validate it. A row recorded from a form is
byte-identical to one recorded from the array that form produces.

A form is a block beneath the headline, never part of the headline itself; that
is a [grammar](/deeper/grammar) template. It holds values, not markup or a
component, and a form never contains another form.

## Where a Body Lives

A publishing line never writes a body; the model does. The activity's own keys
still go through `->data()`, which core passes on unread.

| Written with | Written | The body is |
|---|---|---|
| `FeedEntity::make(body: …)` in `toFeed()` | every time the model is saved | stored, and follows the model |
| `FeedMedia::make(body: …)` in `feedMedia()` | every read | built on the read, and never stored |

Neither one freezes a value. A row that must keep what was said at the time
names a model that does not change: a revision, a posted note, a recorded price
movement.

## Which Role's Body a Row Shows

Every `Feedable` may define a body, and it travels with that model in whatever
role it appears.

The object's body is the one drawn beneath the headline, so make the thing the
reader cares about the object. The other roles carry their bodies in the
payload, and drawing them is the renderer's choice. Most should stay undrawn: an
actor's body would repeat under every row that person acts in.

A row whose object has no body shows its headline and timestamp, and nothing is
missing.

## More Than One Form

A slot takes one form or a list:

```php
// app/Models/MenuItem.php
public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        label: $this->name,
        body: [Excerpt::make($this->description), KeyValue::make(['Station' => $this->station])],
    );
}
```

When both `toFeed()` and `feedMedia()` return a body, the row carries both: the
stored forms first, then the minted ones.

The renderer decides the order, spacing and emphasis of the forms. A form it
does not recognise draws nothing, and the others still draw.

## Minting a Form at Read Time

`feedMedia()` can return a body too, built from the model as it is at that
moment:

```php
// app/Models/MenuItem.php
public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return FeedMedia::make(
        url: route('menu.show', $context->data('id')),
        body: KeyValue::make(['Portions left' => $context->model()?->portions_left]),
    );
}
```

A renderer draws a minted form the same way as a stored one.

### Deferring the Work

The resolver runs on every read to build the url, whether or not a body is
drawn. Pass a closure to build the body only when it is needed:

```php
// app/Models/MenuItem.php, feedMedia()
body: fn () => KeyValue::make(['Portions left' => $context->model()?->portions_left]),
```

The closure runs only on a read that draws bodies, after the page's models are
loaded, so it costs one query per class and never one per row. If it throws, the
error is reported once and the body is left out, the same as a throwing resolver
leaves the url null.

Use a closure when the body reads the live row. A body built from the snapshot
is cheap enough to pass directly.

## What a Minted Form May Read

The resolver runs for every entity on the page, including a group's sampled entities
that a renderer may never draw. A form built there can read three things
without a query per row:

- the snapshot, through `$context->data()`
- a column on the live row, through `$context->model()`, which loads every model
  of that class on the page in one query
- a relation named in `$context->model(with: […])`, loaded in the same batch

Anything else is a query per row. `$dish->orders()->count()` inside a resolver
runs once for every row that names a dish. Keep a counter cache column on the
model instead.

::: headless it counts nothing for you
The count is your app's query. Core passes it through unchecked.
:::

A minted form is built by current code on every read, so it never needs
upgrading. Its version still rides along for a renderer that branches on one.

## Writing a Form

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

    public static function name(): string
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
            self::KEY => self::name(),
            self::VERSION => self::version(),
            'size' => $this->size,
            'mediaType' => $this->mediaType,
        ];
    }
}
```

`HasPayload` supplies `toArray()` from `toPayload()`. Override `toArray()` only
to store something that should not reach the node.

### The Two Reserved Keys

| Key | Constant | Holds |
|---|---|---|
| `$body` | `FeedBody::KEY` | the form's name, verbatim |
| `$v` | `FeedBody::VERSION` | the version that wrote the row |

The `$` prefix keeps a form inside the app's `data` map apart from the app's own
keys. Core passes every other key through untouched.

### Names

A name is `Vocabulary/Form`, namespaced to whoever defines the vocabulary, with
every segment in PascalCase: `Storyfeed/Body/MediaObject`, `Acme/Attachment`.

Renderers match the name exactly. It is only a lookup key: nothing autoloads
from it, and it need not match a class. Name the vocabulary, not the PHP package,
because rows already written keep the name even if the class moves. Core never
validates a name.

### Versions Are Add-only

Start `version()` at 1 from the first commit, before a second shape exists.

A missing `$v` is version 1, for readers and writers alike. Reading it as the
current version would make old rows skip the 1 → 2 upgrade once version 2
exists.

`upgrade()` runs when the row is read and never writes back, so a renderer always
sees the current shape.

## Who Upgrades a Form

The rule is one question: does core read the value?

| Value | Node Key | Who Upgrades | Does `$v` Reach the Renderer? |
|---|---|---|---|
| `FeedThread` at `$thread` | `thread` | core, on read | no |
| `FeedChange` at `$change` | `change` | core, on read | no |
| a form in a body | stays in `body` | the renderer | yes |

Core reads `$thread` and `$change`, so it upgrades them and strips their
versions. It never reads inside a form, so the version travels to the renderer,
which calls `upgrade()` before it draws.

The rule follows the key, not the class: `FeedThread` in a body is the
renderer's to upgrade, like any other form.

## Existing Forms

Core ships seven under `Storyfeed\Body`. Any renderer may recognise them, an app
writing its own form owes nothing to them, and core reads none of them.

| Name | Is | Keys |
|---|---|---|
| `Storyfeed/Body/KeyValue` | labelled rows | `title`, `items[]` of `key`, `value`, `verbatim`, `missing` |
| `Storyfeed/Body/Excerpt` | a passage, and where it came from | `text`, `from`, `truncated` |
| `Storyfeed/Body/Change` | before → after, for one field or several | `items`, a map of field to `[before, after]` |
| `Storyfeed/Body/File` | what an artefact is and how big | `name`, `size`, `mediaType` |
| `Storyfeed/Body/Prose` | authored text, and how to read it | `content`, `mediaType`, `verbatim`, `title` |
| `Storyfeed/Body/ItemList` | several things, each a name and maybe a link | `title`, `items[]`, `ordered`, `totalItems`, `more` |
| `Storyfeed/Body/MediaObject` | a title, some prose, one picture, the files | `subject`, `content`, `image`, `attachments`, `footnote` |

A string passed as `body` is stored as `Storyfeed/Body/Prose`, so a renderer
never has to handle a bare string.

::: headless it draws no form
Core stores the block and returns it unchanged. Drawing and upgrading it is
your renderer's job.
:::

## Unknown Forms in a Renderer

A renderer skips a `$body` it does not recognise and draws the rest of the row.
It never errors, as with unknown verbs and Activity Streams extension types.
This covers an app on a newer vocabulary than its renderer, and a row stored
under a form name the renderer no longer knows.

## Inspecting What Is Stored

```bash
php artisan storyfeed:doctor --only=body
```

The check lists which forms are stored, and warns about two faults that fail
silently: a map with `$v` but no `$body`, which a renderer cannot dispatch, and
a form that declares version 2 on some rows and no version on others. See
[Doctor](/reference/doctor).
