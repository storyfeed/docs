# What an Activity Shows

The headline is one sentence. Under it an activity can show the words someone
wrote, the facts behind a change, or what a file is. When you are done, a row
carries what the reader needs without your renderer knowing anything about
your app.

<script setup>
import { who, orders, dishes, notes, scenes, activity, INSTRUCTIONS } from '../.vitepress/theme/samples'

const at = '2026-08-14T14:32:00.000000Z'

// The note is the thing posted; the order is what it was posted on.
const withThread = activity({
  id: 'ac2', verb: 'post', glyph: 'message-circle', published_at: at,
  headline_template: ':actor sent a note about :target',
  actor: who.regular, object: notes.pickup, target: orders.first,
  thread: { text: notes.pickup.label, by: who.regular.label, kind: 'note', replies: null, truncated: false },
})

// A different activity, the same order entity: the excerpt travels with it.
const withExcerpt = activity({
  id: 'ac3', verb: 'ready', glyph: 'utensils', published_at: at,
  headline_template: ':actor marked :object ready',
  actor: who.cook,
  object: { ...orders.first, body: [{ $body: 'Storyfeed/Body/Excerpt', $v: 1,
    text: INSTRUCTIONS.first, from: 'Instructions', truncated: false }] },
})

const withFields = activity({
  id: 'ac4', verb: 'confirmed', glyph: 'circle-check', published_at: at,
  headline_template: ':actor confirmed :object',
  actor: who.cook,
  object: { ...orders.first, body: [{ $body: 'Storyfeed/Body/KeyValue', $v: 1, items: [
    { key: 'Pickup', value: '7:00 pm', verbatim: false, missing: null },
    { key: 'Items', value: '3', verbatim: false, missing: null },
    { key: 'Reference', value: 'ORD-1042-8KQ', verbatim: true, missing: null },
    { key: 'Table', value: null, verbatim: false, missing: 'not seated' },
  ] }] },
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
    body: [{ $body: 'Storyfeed/Body/File', $v: 1,
      name: 'chicken-curry.jpg', size: 284160, mediaType: 'image/jpeg' }] },
})
</script>

## A Headline on Its Own

Most activities need nothing more. The sentence is the whole row:

<<< @/snippets/publish.php

<FeedExample context :items="[scenes.order]" />

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
    ->action('post', $note)
    ->on($order)
    ->thread(FeedThread::make(text: $note->body, by: $customer->name, kind: 'note')) // [!code focus]
    ->publish();
```

<FeedExample :items="[withThread]" />

The text is stored on that activity, so editing the note afterwards does not
change what the row quotes. That is the point: the row says what was said at
the time.

## Details: a Form the Renderer Recognises

Everything else goes in `data`, where a **detail** is a value with a
conventional form. The model writes it once, in `toFeed()`, and any renderer
that recognises the form draws it with no view of yours.

```php
// app/Models/Order.php
use Storyfeed\Body\Excerpt;

public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        key: "Order #{$this->reference}",
        data: Excerpt::make($this->instructions, from: 'Instructions'), // [!code focus]
    );
}
```

<FeedExample :items="[withExcerpt]" />

A detail on a snapshot travels wherever that entity appears, which is why the
facts an entity carries are the entity's own to write. Nothing about them
belongs at the line that records an activity:

```php
// app/Models/Order.php
use Storyfeed\Body\Fields;

public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        key: "Order #{$this->reference}",
        data: Fields::make([ // [!code focus]
            'Pickup' => $this->pickup_at->format('g:i a'), // [!code focus]
            'Items' => $this->items->count(), // [!code focus]
            'Reference' => Fields::verbatim($this->reference), // [!code focus]
            'Table' => ['value' => $this->table, 'missing' => 'not seated'], // [!code focus]
        ]), // [!code focus]
    );
}
```

<FeedExample :items="[withFields]" />

A value the row has no answer for is **silent by default**. Give it a word
only where the emptiness is itself the answer, per row or for the whole block
with `missing:`. A value that is compared rather than read, a reference or an
address, is marked `verbatim` so it gets one line and an ellipsis.

## What a File Is

```php
// app/Models/Photo.php
use Storyfeed\Body\File;

public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        key: $this->name,
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

They live in `Storyfeed\Body`, and every one carries its own version so a
renderer can upgrade an old row before drawing it. An app may write its own
form and owe these nothing: a detail a renderer does not recognise draws
nothing, and the activity renders as it always would, minus the block.

[Activity Details](/deeper/details) covers writing a form, versioning one, and
where a detail lives.
