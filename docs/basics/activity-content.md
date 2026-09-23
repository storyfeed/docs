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
    attributes: {}, modal: true, data: {}, media: null, body: null, tombstone: null },
})

const withFile = activity({
  id: 'ac6', verb: 'publish', glyph: 'image', published_at: '2026-08-14T10:00:00.000000Z',
  headline_template: ':actor added a photo of :target',
  actor: who.cook, target: dishes.chickenCurry,
  object: { type: 'photo', id: '1', label: 'chicken-curry.jpg', url: '/photos/1',
    attributes: {}, modal: false, data: {}, media: null, tombstone: null,
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
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedThread;

Storyfeed::activity()
    ->by($customer)
    ->action('post', $note)
    ->on($order)
    ->thread(FeedThread::make(text: $note->body, by: $customer->name, kind: 'note'))
    ->publish();
```

<FeedExample :items="[withThread]" />

The text is stored on the activity, so editing the note afterwards does not
change what the row quotes.

## A Body the Renderer Recognises

Everything else goes in the entity's **body**, a value of a known body type. The model writes it once, in `toFeed()`, and any renderer that
recognises the type draws it with no view of yours.

::: code-group

```php [Fluent Syntax]
// app/Models/Order.php
use Storyfeed\Body\Excerpt;

public function toFeed(): FeedEntity
{
    return FeedEntity::make()
        ->label("Order #{$this->reference}")
        ->body(Excerpt::make()->text($this->instructions)->from('Instructions'));
}
```

```php [Named Arguments]
// app/Models/Order.php
use Storyfeed\Body\Excerpt;

public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        label: "Order #{$this->reference}",
        body: Excerpt::make(text: $this->instructions, from: 'Instructions'),
    );
}
```

:::

<FeedExample :items="[withExcerpt]" />

A body on the snapshot shows wherever the entity appears, so the model writes
it, not the line that records an activity:

::: code-group

```php [Fluent Syntax]
// app/Models/Order.php
use Storyfeed\Body\KeyValue;

public function toFeed(): FeedEntity
{
    return FeedEntity::make()
        ->label("Order #{$this->reference}")
        ->body(KeyValue::make()->items([
            'Pickup' => $this->pickup_at->format('g:i a'),
            'Items' => $this->items->count(),
            'Reference' => KeyValue::verbatim($this->reference),
            'Table' => KeyValue::missingAs($this->table, 'not seated'),
        ]));
}
```

```php [Named Arguments]
// app/Models/Order.php
use Storyfeed\Body\KeyValue;

public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        label: "Order #{$this->reference}",
        body: KeyValue::make(items: [
            'Pickup' => $this->pickup_at->format('g:i a'),
            'Items' => $this->items->count(),
            'Reference' => KeyValue::verbatim($this->reference),
            'Table' => KeyValue::missingAs($this->table, 'not seated'),
        ]),
    );
}
```

:::

<FeedExample :items="[withKeyValue]" />

A value the row has no answer for is **silent by default**. Give it a word
only where the emptiness is itself the answer: one row with
`KeyValue::missingAs()`, or the whole body with `->missing()`. A value that is
compared rather than read, a reference or an address, is marked `verbatim`.

## What a File Is

::: code-group

```php [Fluent Syntax]
// app/Models/Photo.php
use Storyfeed\Body\File;

public function toFeed(): FeedEntity
{
    return FeedEntity::make()
        ->label($this->name)
        ->body(File::make()->size($this->bytes)->mediaType($this->mime)->name($this->name));
}
```

```php [Named Arguments]
// app/Models/Photo.php
use Storyfeed\Body\File;

public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        label: $this->name,
        body: File::make(size: $this->bytes, mediaType: $this->mime, name: $this->name),
    );
}
```

:::

<FeedExample :items="[withFile]" />

`File` says what a file is, never where it lives: the URL comes from
[`feedMedia()`](/basics/feedable-models#the-link) at read time.

## A Link That Opens in Place

Some entities are better opened than navigated to, like a photograph or a
document preview. `modal()` on the media marks the link, and the entity
carries `modal: true`.

::: code-group

```php [Fluent Syntax]
// app/Models/Photo.php
public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return FeedMedia::make()->url(route('photos.show', $context->routeKey()))->modal();
}
```

```php [Named Arguments]
// app/Models/Photo.php
public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return FeedMedia::make(url: route('photos.show', $context->routeKey()), modal: true);
}
```

:::

<FeedExample :items="[openInPlace]" />

`modal` is a boolean in the payload. Opening a dialog is your renderer's job;
on this site, clicking the file name opens a panel.

## The Body Types Storyfeed Ships

| Body Type | Shows |
|---|---|
| `KeyValue` | labelled pairs |
| `Excerpt` | a passage, and where it came from |
| `Change` | before and after, for one field or several |
| `File` | what an artefact is and how big |
| `Prose` | authored text, and how to read it |
| `ItemList` | several things, each a name and maybe a link |
| `MediaObject` | a title, some prose, one picture, the files |
| `Component` | a component of your own, by name, with its props |

They live in `Storyfeed\Body`. Each carries a version, so a renderer can
upgrade an old row before drawing it. An app may write its own body types.
