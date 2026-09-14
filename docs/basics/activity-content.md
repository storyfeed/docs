# What an Activity Shows

The headline is one sentence. Under it an activity can show the words someone
wrote, the facts behind a change, or what a file is. When you are done, a row
carries what the reader needs without your renderer knowing anything about
your app.

<script setup>
import { who, where, orders, dishes, notes, activity } from '../.vitepress/theme/samples'

const at = '2026-08-14T14:32:00.000000Z'

const base = {
  verb: 'noted', glyph: 'message-circle', published_at: at,
  headline_template: ':actor sent a note about :object',
  actor: who.regular, target: where.kitchen,
}

const plain = activity({ ...base, id: 'ac1', object: orders.first })

const withThread = activity({
  ...base, id: 'ac2', object: orders.first,
  thread: { text: notes.pickup.label, by: who.regular.label, kind: 'note', replies: null, truncated: false },
})

const withExcerpt = activity({
  ...base, id: 'ac3',
  object: { ...orders.first, data: { $detail: 'Storyfeed/Detail/Excerpt', $v: 1,
    text: notes.pickup.label, from: 'Note on the order', truncated: false } },
})

const withFields = activity({
  id: 'ac4', verb: 'confirmed', glyph: 'circle-check', published_at: at,
  headline_template: ':actor confirmed :object',
  actor: who.cook, object: orders.first,
  data: { $detail: 'Storyfeed/Detail/Fields', $v: 1, rows: [
    { label: 'Pickup', value: '7:00 pm', mono: false, missing: null },
    { label: 'Items', value: '3', mono: false, missing: null },
    { label: 'Reference', value: 'ORD-1042-8KQ', mono: true, missing: null },
    { label: 'Table', value: null, mono: false, missing: 'not seated' },
  ] },
})

const withChange = activity({
  id: 'ac5', verb: 'menu.price_changed', glyph: 'tag', published_at: '2026-08-14T09:10:00.000000Z',
  headline_template: ':actor changed the price of :object',
  actor: who.cook, object: dishes.kottu,
  data: { $detail: 'Storyfeed/Detail/Change', $v: 1, changes: {
    Price: ['$14.50', '$15.50'],
    'On the menu': [false, true],
  } },
})

const openInPlace = activity({
  id: 'ac7', verb: 'menu.photo_published', glyph: 'image',
  published_at: '2026-08-14T10:05:00.000000Z',
  headline_template: ':actor added :object to :target',
  actor: who.cook, target: dishes.chickenCurry,
  object: { type: 'photo', id: '9', label: 'chicken-curry.jpg', url: '/media/chicken-curry.svg',
    attributes: {}, modal: true, component: null, data: {}, media: null },
})

const withFile = activity({
  id: 'ac6', verb: 'menu.photo_published', glyph: 'image', published_at: '2026-08-14T10:00:00.000000Z',
  headline_template: ':actor added a photo of :target',
  actor: who.cook, target: dishes.chickenCurry,
  object: { type: 'photo', id: '1', label: 'chicken-curry.jpg', url: '/photos/1',
    attributes: {}, modal: false, component: null, media: null,
    data: { $detail: 'Storyfeed/Detail/File', $v: 1,
      name: 'chicken-curry.jpg', size: 284160, mediaType: 'image/jpeg' } },
})
</script>

## A Headline on Its Own

Most activities need nothing more. The sentence is the whole row:

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($customer)
    ->action('noted', $order)
    ->to($kitchen)
    ->publish();
```

<FeedExample context :items="[plain]" />

Everything below is for the rows where it is not enough. Add one thing at a
time, and only where a reader would ask for it.

## Words Someone Wrote

When the activity is *about* an utterance, the utterance belongs on the
activity. `->thread()` carries it:

```php
// where the fact happens: a controller, an action, a listener
use Storyfeed\FeedThread;

Storyfeed::activity()
    ->by($customer)
    ->action('noted', $order)
    ->to($kitchen)
    ->thread(FeedThread::make(text: $note->body, by: $customer->name, kind: 'note')) // [!code focus]
    ->publish();
```

<FeedExample :items="[withThread]" />

The text is stored on that activity, so editing the note afterwards does not
change what the row quotes. That is the point: the row says what was said at
the time.

## Details: a Form the Renderer Recognises

Everything else goes in `data`, where a **detail** is a value with a
conventional form. The app writes it once, at record time, and any renderer
that recognises the form draws it with no view of yours.

```php
// app/Models/Order.php
use Storyfeed\Detail\Excerpt;

public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        label: "Order #{$this->reference}",
        data: Excerpt::make($this->note, from: 'Note on the order'), // [!code focus]
    );
}
```

<FeedExample :items="[withExcerpt]" />

A detail on the **entity's** snapshot travels wherever that entity appears. A
detail on the **activity** describes this row and no other:

```php
// where the fact happens: a controller, an action, a listener
use Storyfeed\Detail\Fields;

Storyfeed::activity()
    ->by($cook)
    ->action('confirmed', $order)
    ->data(Fields::make([ // [!code focus]
        'Pickup' => $order->pickup_at->format('g:i a'), // [!code focus]
        'Items' => $order->items->count(), // [!code focus]
        'Reference' => Fields::mono($order->reference), // [!code focus]
        'Table' => ['value' => $order->table, 'missing' => 'not seated'], // [!code focus]
    ])) // [!code focus]
    ->publish();
```

<FeedExample :items="[withFields]" />

A value the row has no answer for is **silent by default**. Give it a word
only where the emptiness is itself the answer, per row or for the whole block
with `missing:`. A value that is compared rather than read, a reference or an
address, is marked `mono` so it gets one line and an ellipsis.

## Before and After

```php
// where the fact happens: a controller, an action, a listener
use Storyfeed\Detail\Change;

Storyfeed::activity()
    ->by($cook)
    ->action('menu.price_changed', $dish)
    ->data(Change::make([ // [!code focus]
        'Price' => ['$14.50', '$15.50'], // [!code focus]
        'On the menu' => [false, true], // [!code focus]
    ])) // [!code focus]
    ->publish();
```

<FeedExample :items="[withChange]" />

Both sides are kept, never a rendered diff. Omit an index for a field that was
added or removed; a `null` is a value that is present and empty.

## What a File Is

```php
// app/Models/Photo.php
use Storyfeed\Detail\File;

public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        label: $this->name,
        data: File::make(size: $this->bytes, mediaType: $this->mime, name: $this->name), // [!code focus]
    );
}
```

<FeedExample :items="[withFile]" />

`File` says what an artefact is, never where it lives: the URL is
[`feedMedia()`](/basics/feedable-models#the-link)'s job, and it is minted at
read time so it cannot go stale.

## A Link That Opens in Place

Some entities are better opened than navigated to: a photograph, a document
preview, anything whose destination is the resource rather than a page about
it. `FeedMedia::modal()` says so, and the hint rides on the entity as
`modal: true`.

```php
// app/Models/Photo.php
public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return FeedMedia::modal(route('photos.show', $context->data('id'))); // [!code focus]
}
```

<FeedExample :items="[openInPlace]" />

Open the payload and the difference is one boolean. Click the file name and
this site opens a panel instead of leaving the page — that is this renderer's
answer to the hint, not the package's.

::: headless it ships no modal
There is no dialog, no lightbox and no stylesheet for one. `modal` is a
boolean the payload carries, and a renderer that ignores it is not broken —
the same rule as an unknown glyph or an unrecognised detail form.
:::

## The Forms Core Ships

| Form | Shows |
|---|---|
| `Fields` | labelled rows |
| `Excerpt` | a passage, and where it came from |
| `Change` | before and after, for one field or several |
| `File` | what an artefact is and how big |
| `Markdown` | authored body text, as source |
| `MediaObject` | a title, some prose, one picture, the files |

They live in `Storyfeed\Detail`, and every one carries its own version so a
renderer can upgrade an old row before drawing it. An app may write its own
form and owe these nothing: a detail a renderer does not recognise draws
nothing, and the activity renders as it always would, minus the block.

[Activity Details](/deeper/details) covers writing a form, versioning one, and
where a detail lives.
