# Activity Body Content

<script setup>
import { who, where, orders, scenes, activity, ticketRows, ticketText } from '../.vitepress/theme/samples'

const row = {
  verb: 'placed', glyph: 'shopping-bag',
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

An activity draws as a sentence and, beneath it, a body. The order placed in
[Usage Examples](/guide/usage-examples) has never had one:

<FeedExample :items="[scenes.order]">
  <template #body><BodyPlaceholder /></template>
</FeedExample>

## Defining a Body

The row says an order was placed. What it does not say is what was in it — and
the order is the only thing here that knows, so that is where the ticket is
written. Start with the plainest version, a line of text:

```php
// app/Models/Order.php
public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        key: "Order #{$this->reference}",
        body: $this->summary(),
    );
}
```

<FeedExample :items="[asText]" />

Say where the words came from and it is an `Excerpt`, which gives the block a
caption a reader can use:

```php
// app/Models/Order.php
use Storyfeed\Body\Excerpt;

public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        key: "Order #{$this->reference}",
        body: Excerpt::make($this->summary(), from: 'Ticket'),
    );
}
```

<FeedExample :items="[asExcerpt]" />

Those are lines to a reader and one string to a renderer. `Fields` keeps them
apart as data:

```php
// app/Models/Order.php
use Storyfeed\Body\Fields;

public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        key: "Order #{$this->reference}",
        body: Fields::make($this->lines
            ->mapWithKeys(fn (OrderLine $line) => [
                "{$line->quantity} × {$line->item->name}" => $line->total->format(),
            ])
            ->put('Total', $this->total->format())
            ->all()),
    );
}
```

<FeedExample :items="[withTicket]" />

**Structure is what each step buys, and a renderer is what spends it.** The text
version is written as well as text can be, and a renderer still can do nothing
but print it. Handed labelled lines, the same renderer can set the item against
the price, align the column and hold the total apart from the rest.
All three bodies are legitimate and a small feed is often better for the
plainest, so the question is never which has the most in it — it is whether a
renderer would use what you kept.

**The lines were settled when the order was placed and have not moved since**,
which is why they belong on the snapshot. A body written here is re-derived
whenever the model is saved, so it suits facts an app has finished deciding.
Nothing about this row needs the live model, and nothing at the publishing line
changed through any of it:

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($customer)
    ->action('placed', $order)
    ->to($kitchen)
    ->publish();
```

The form arrives on the node exactly as it went in:

```json
{
  "$body": "Storyfeed/Body/KeyValue",
  "$v": 1,
  "rows": [
    { "label": "1 × N101 Chicken Curry", "value": "$14.50", "verbatim": false, "missing": null }
  ]
}
```

Core does not read it, upgrade it, count it or validate it. A row recorded from
a form is byte-identical to one recorded from the array that form produces.

| A Form Is | A Form Is **Not** |
|---|---|
| a typed block beneath the sentence | part of the headline — that is a [grammar](/deeper/grammar) template |
| the app's value, in a slot core owns | a value core reads, names or validates |
| an encoding, a pair, a passage | a component, or a place for markup |
| a leaf | nestable — a form never contains another |

## Where a Body Lives

**Nothing at a publishing line writes a body.** The line that records the order
says who placed it and where it went, and that is all it is for. What the order
shows is the order's to say, written where the order is defined. The activity
still carries the app's own keys through `->data()`, which core hands over
unread, but a form is written by a model.

A noun writes its body at one of two moments:

| Written with | Written | The body is |
|---|---|---|
| `FeedEntity::make(body: …)` in `toFeed()` | every time the model is saved | stored, and follows the model |
| `FeedMedia::make(body: …)` in `feedMedia()` | every read | minted, and never stored |

The two differ in when the value is decided. A snapshot follows its model, so a
quote written there changes when the model is edited. A minted body is read
fresh every time and stored nowhere.

**Neither one freezes anything, and nothing needs to.** A row that must say what
was said at the time says it by naming a model that does not change — a
revision, a posted note, a recorded price movement. Durability comes from what
the app kept, not from a copy taken at the moment of recording.

## Which Role's Body a Row Shows

Every `Feedable` may define a body, and it travels with that model wherever it
appears — as an actor in one row, an object in the next.

**Compose an activity so the object is the star.** The object is what a row is
about, so its body is the one drawn beneath the sentence. A sentence whose
subject of interest sits in another role reads as though something is missing,
and then shows the body of something it never named.

The other roles carry their bodies into the payload all the same, and choosing
which to draw is the renderer's. Most should stay undrawn: an actor's body would
repeat under every row that person acts in, so a feed of fifty rows by one cook
draws their card fifty times. A row whose outcome is the interesting part is the
case for drawing another role, and a renderer is free to take it.

A row whose object has no body draws none, and reads as a sentence and a
timestamp. That is an ordinary row, not a deficient one.

## More Than One Form

One noun reaches that zone from both of its homes at once — what its snapshot
stored and what its resolver minted — so two forms under one headline needs
nobody to ask for it.

Each slot takes one form or several:

```php
// app/Models/MenuItem.php
public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        key: $this->name,
        body: [Excerpt::make($this->description), Fields::make(['Station' => $this->station])],
    );
}
```

**Arrangement is the renderer's.** Core carries the forms and says nothing about
the order they are drawn in, the space between them, or which one leads. A
renderer holds the taste; the app holds the facts.

A form a renderer does not recognise draws nothing, and the rest of the body
draws as it always would. That is per form, which is why forms sit beside each
other rather than inside one another.

## Minting a Form at Read Time

`feedMedia()` mints what a snapshot cannot cache. Alongside the url and the
image slots it takes a body, built from the model as it stands at that moment:

```php
// app/Models/MenuItem.php
public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return FeedMedia::make(
        url: route('menu.show', $context->data('id')),
        body: Fields::make(['Portions left' => $context->model()?->portions_left]),
    );
}
```

Nothing about a form changes because it was minted. A renderer draws it by name
exactly as it draws a stored one.

### Deferring the Work

A resolver runs for the url whether or not a body is wanted, so a body that
costs something is better handed over unbuilt:

```php
body: fn () => Fields::make(['Portions left' => $context->model()?->portions_left]),
```

A closure is called only on a read that draws bodies, and not at all on one that
does not. It is called after the page's models are already gathered, so it pays
the same one query per class as everything else and never a query per row. A
closure that throws is reported once and its body is absent, exactly as a
resolver that throws leaves the url null.

Hand over a value when it is free and a closure when it is not. A `Fields` block
built from the snapshot costs nothing to build eagerly; one that reaches for the
live row does not.

## What a Minted Form May Read

The resolver runs on every read, for every entity on the page — including a
group's exemplars, which a renderer may never paint. A form built there may read
three things, none of which cost a query per row:

- the snapshot, through `$context->data()`
- a column on the live row, through `$context->model()`, which loads every model
  of that class on the page in one query
- a relation named in `$context->model(with: […])`, which rides the same batch

What it must not do is ask a question of its own. `$dish->orders()->count()`
inside a resolver is one query for every row that names a dish, and a feed of
fifty rows pays it fifty times. Keep a count on the row: a counter cache column
is free once the model is loaded.

::: headless it counts nothing for you
A count is the app's fact and the app's query. Core hands a minted form to the
renderer exactly as given. It does not read the form, cache it, or check that
the numbers in it agree with anything.
:::

A minted form is built by today's code on every read, so it is always current.
Its version rides along for a renderer that branches on one, and there is no
older shape behind it to repair.

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
        // Total: a row written by a NEWER version than this class still has to
        // render, because the row is in the database either way. Never throw.
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
to add something that belongs in storage and not on the node.

### The Two Reserved Keys

| Key | Constant | Holds |
|---|---|---|
| `$body` | `FeedBody::KEY` | the form's name, verbatim |
| `$v` | `FeedBody::VERSION` | the version that wrote the row |

Both are `$`-prefixed so that a form nested in the app's own `data` map is
unmistakably not the app's. Core strips the reserved keys core owns and passes
every other key through untouched.

### Names

`Vocabulary/Form` — namespaced to whoever defines the vocabulary, every segment
in PascalCase: `Storyfeed/Body/MediaObject`, `Acme/Attachment`. The name outlives every
class that writes it, and two libraries that both wanted the word "change" do
not collide in a column.

**The namespace is the vocabulary, not the package.** A form defined by this
project is `Storyfeed/…` wherever its PHP class happens to live — the class can
move between packages, and rows already written cannot. Putting a package name
in it means a row remembers which library was fashionable the year it was
recorded.

**PascalCase, because a name is not a Composer package.** It matches Activity
Streams' own type casing, which is the vocabulary this one sits beside. A
lowercase `vendor/name` reads as something you install, which it is not: it is a
pure lookup key, matched by renderers EXACTLY. Nothing reflects on it, nothing
autoloads from it, and it need not resolve to any class at all.

Free-form, like verbs. Core never validates a name against anything, and has no
list to validate against.

### Versions Are Add-only

A row recorded today outlives the class that recorded it, so `version()` starts
at 1 on the first commit rather than the day a second shape appears — by then
the unversioned rows already exist.

**A missing `$v` is version 1. That is a definition, not a fallback.** It is the
reader's rule as much as the writer's: hand-written seeder arrays exist, and so
do rows written before a library added its version key. Reading a missing
version as "whatever is current" is silently right today and silently wrong the
day a version 2 lands, because those rows would skip the 1→2 upgrade with
nothing to notice it.

`upgrade()` runs at **read** time and is never written back, so every renderer
sees the current form and no view branches on `$v`.

## Who Upgrades a Form

Two values follow opposite versioning postures, and the branch is one question:
**does core read the value?**

| Value | Node Key | Who Upgrades | Does `$v` Reach the Renderer? |
|---|---|---|---|
| `FeedThread` at `$thread` | `thread` | core, on read | no |
| `FeedChange` at `$change` | `change` | core, on read | no |
| a form in a body | stays in `body` | the renderer | yes |

Core reads `$thread` and `$change`, so it upgrades them, strips their versions
and emits one shape forever. Core owns the slot a form sits in but never looks
inside it, because looking would mean learning every form's name and shape —
the registry this contract exists to avoid. So the version travels all the way
to the renderer, and the renderer calls `upgrade()` before it draws.

The branch is about the value, not the class. `FeedThread` at the reserved key
is core's to upgrade; the same class in a body is the renderer's, like any other
form.

## Existing Forms

Core ships seven under `Storyfeed\Body`. They are the vocabulary rather than
one renderer's furniture: any renderer may recognise these names, an app
writing its own form owes nothing to them, and core reads none of them.

| Name | Is | Keys |
|---|---|---|
| `Storyfeed/Body/KeyValue` | labelled rows | `rows[]` of `label`, `value`, `verbatim`, `missing` |
| `Storyfeed/Body/Excerpt` | a passage, and where it came from | `text`, `from`, `truncated` |
| `Storyfeed/Body/Change` | before → after, for one field or several | `changes[]` of `label`, `before`, `after` |
| `Storyfeed/Body/File` | what an artefact is and how big | `name`, `size`, `mediaType` |
| `Storyfeed/Body/Prose` | authored text, and how to read it | `content`, `mediaType`, `verbatim`, `title` |
| `Storyfeed/Body/ItemList` | several things, each a name and maybe a link | `items[]`, `ordered`, `totalItems`, `more` |
| `Storyfeed/Body/MediaObject` | a title, some prose, one picture, the files | `subject`, `content`, `image`, `attachments`, `footnote` |

A line of text handed to `->body()` is stored as `Storyfeed/Body/Prose`, so
a renderer meets one kind of thing in a body and never branches on whether it
found a string.

A row written under an earlier form name keeps that name, and an unrecognised
name draws nothing, so a stale row is a blank space rather than an error.

::: headless it draws no form
The package stores the block and hands it back byte-identical. It reads no form,
upgrades none, and ships no view for one: `upgrade()` runs in the renderer,
before it draws. A renderer that recognises none of these forms is not broken,
it is a renderer that draws headlines.
:::

## Unknown Forms in a Renderer

Draws nothing, and never an error — the same rule the read path already applies
to unknown verbs and to Activity Streams extension types. It covers version skew
too: an app on a newer vocabulary than the renderer reading it is a blank space,
not a broken feed.

So a renderer that finds a `$body` it does not recognise skips it, and the
rest of the row draws as it always would.

## Inspecting What Is Stored

```bash
php artisan storyfeed:doctor --only=details
```

The check reports which forms are actually stored, and the two ways one goes
quiet without anything going wrong out loud: a map carrying `$v` with no
`$body` for a renderer to dispatch on, and a form declaring version 2 on some
rows and nothing on others. It reports only what is knowable without a
vocabulary — core having a vocabulary is the thing this contract exists to
avoid. See [Doctor](/reference/doctor).
