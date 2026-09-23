# What an Activity Shows

The headline is one sentence. Under it an activity can show the words someone
wrote, the facts behind a change, or what a file is.

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

const withKeyValue = activity({
  id: 'ac4', verb: 'confirm', glyph: 'circle-check', published_at: at,
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
  id: 'ac7', verb: 'publish', glyph: 'image',
  published_at: '2026-08-14T10:05:00.000000Z',
  headline_template: ':actor added :object to :target',
  actor: who.cook, target: dishes.chickenCurry,
  object: { type: 'photo', id: '9', label: 'chicken-curry.jpg', url: '/media/chicken-curry.svg',
    attributes: {}, modal: true, component: null, data: {}, media: null },
})

const withFile = activity({
  id: 'ac6', verb: 'publish', glyph: 'image', published_at: '2026-08-14T10:00:00.000000Z',
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

::: code-group
<<< @/snippets/publish-from-controller.php [Fluent Syntax]
<<< @/snippets/publish-from-controller.named-arguments.php [Named Arguments]
:::

<FeedExample context :items="[scenes.order]" />

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

The text is stored on the activity, so editing the note afterwards does not
change what the row quotes.

## A Body the Renderer Recognises

Everything else goes in `data`, where a **body** is a value of a known body
type. The model writes it once, in `toFeed()`, and any renderer that
recognises the type draws it with no view of yours.

```php
// app/Models/Order.php
use Storyfeed\Body\Excerpt;

public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        label: "Order #{$this->reference}",
        body: Excerpt::make($this->instructions, from: 'Instructions'), // [!code focus]
    );
}
```

<FeedExample :items="[withExcerpt]" />

A body on the snapshot shows wherever the entity appears, so the model writes
it, not the line that records an activity:

```php
// app/Models/Order.php
use Storyfeed\Body\KeyValue;

public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        label: "Order #{$this->reference}",
        body: KeyValue::make([ // [!code focus]
            'Pickup' => $this->pickup_at->format('g:i a'), // [!code focus]
            'Items' => $this->items->count(), // [!code focus]
            'Reference' => KeyValue::verbatim($this->reference), // [!code focus]
            'Table' => ['value' => $this->table, 'missing' => 'not seated'], // [!code focus]
        ]), // [!code focus]
    );
}
```

<FeedExample :items="[withKeyValue]" />

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
        label: $this->name,
        body: File::make(size: $this->bytes, mediaType: $this->mime, name: $this->name), // [!code focus]
    );
}
```

<FeedExample :items="[withFile]" />

`File` says what a file is, never where it lives: the URL comes from
[`feedMedia()`](/basics/feedable-models#the-link) at read time.

## A Link That Opens in Place

Some entities are better opened than navigated to, like a photograph or a
document preview. `FeedMedia::modal()` marks the link, and the entity carries
`modal: true`.

```php
// app/Models/Photo.php
public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return FeedMedia::modal(route('photos.show', $context->id())); // [!code focus]
}
```

<FeedExample :items="[openInPlace]" />

`modal` is a boolean in the payload. Opening a dialog is your renderer's job;
on this site, clicking the file name opens a panel.

## The Body Types Core Ships

| Body Type | Shows |
|---|---|
| `KeyValue` | labelled pairs |
| `Excerpt` | a passage, and where it came from |
| `Change` | before and after, for one field or several |
| `File` | what an artefact is and how big |
| `Prose` | authored text, and how to read it |
| `ItemList` | several things, each a name and maybe a link |
| `MediaObject` | a title, some prose, one picture, the files |

They live in `Storyfeed\Body`. Each carries a version, so a renderer can
upgrade an old row before drawing it. An app may write its own body types; a
renderer draws nothing for a type it does not recognise, and the rest of the
row renders as usual.
