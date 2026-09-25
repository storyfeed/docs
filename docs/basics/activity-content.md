# Activity Content

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

## Introduction

The headline is one sentence. Under it an activity can show the words someone
wrote, the facts behind a change, or what a file is.

<a id="headlines"></a>

Most activities need nothing more. The sentence is the whole row:

::: code-group
<<< @/snippets/publish-from-controller.php {php memo="app/Http/Controllers/OrderController.php"} [Fluent Syntax]
<<< @/snippets/publish-from-controller.named-arguments.php {php memo="app/Http/Controllers/OrderController.php"} [Named Arguments]
:::

<FeedExample context :items="[scenes.order]" />

<a id="quoted-text"></a>

## Adding Quoted Text

When the activity is *about* an utterance, the utterance belongs on the
activity. `->thread()` carries it:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/OrderNoteController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNoteRequest;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedThread;

class OrderNoteController extends Controller
{
    public function store(StoreNoteRequest $request, Order $order): RedirectResponse
    {
        $customer = $request->user();
        $note = $order->notes()->create($request->validated());

        Storyfeed::activity()
            ->by($customer)
            ->action('post', $note)
            ->on($order)
            ->thread(FeedThread::make(text: $note->body, by: $customer->name, kind: 'note'))
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/OrderNoteController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNoteRequest;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedThread;

class OrderNoteController extends Controller
{
    public function store(StoreNoteRequest $request, Order $order): RedirectResponse
    {
        $customer = $request->user();
        $note = $order->notes()->create($request->validated());

        Storyfeed::record(
            verb: 'post',
            object: $note,
            actor: $customer,
            target: $order,
            thread: FeedThread::make(
                text: $note->body,
                by: $customer->name,
                kind: 'note',
            ),
        );

        return back();
    }
}
```
:::

<FeedExample :items="[withThread]" />

The text is stored on the activity, so editing the note afterwards does not
change what the row quotes.

<a id="entity-bodies"></a>

## Adding Entity Bodies

An entity's **body** carries structured content. The model supplies it in
`toFeed()`, and your frontend chooses how to draw each body type.

### Text and Labelled Values

::: code-group

```php [Fluent Syntax] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\Body\Excerpt;
use Storyfeed\FeedEntity;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
            ->label("Order #{$this->reference}")
            ->body(Excerpt::make()
                ->text($this->instructions)
                ->from('Instructions')
                ->truncated(false));
    }
}
```

```php [Named Arguments] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\Body\Excerpt;
use Storyfeed\FeedEntity;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: "Order #{$this->reference}",
            body: Excerpt::make(
                text: $this->instructions,
                from: 'Instructions',
                truncated: false,
            ),
        );
    }
}
```

:::

<FeedExample :items="[withExcerpt]" />

`truncated: false` marks the instructions as complete text. A body on the snapshot shows wherever the entity appears, so the model writes
it, not the line that records an activity:

::: code-group

```php [Fluent Syntax] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\Body\KeyValue;
use Storyfeed\FeedEntity;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

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
}
```

```php [Named Arguments] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\Body\KeyValue;
use Storyfeed\FeedEntity;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

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
}
```

:::

<FeedExample :items="[withKeyValue]" />

A missing value can carry a label for your renderer: one row with
`KeyValue::missingAs()`, or the whole body with `->missing()`. A value that is
compared rather than read, a reference or an address, is marked `verbatim`.

### File Details

::: code-group

```php [Fluent Syntax] memo="app/Models/Photo.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\Body\File;
use Storyfeed\FeedEntity;

class Photo extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
            ->label($this->name)
            ->body(
                File::make()
                    ->size($this->bytes)
                    ->mediaType($this->mime)
                    ->name($this->name)
            );
    }
}
```

```php [Named Arguments] memo="app/Models/Photo.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\Body\File;
use Storyfeed\FeedEntity;

class Photo extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: $this->name,
            body: File::make(
                size: $this->bytes,
                mediaType: $this->mime,
                name: $this->name,
            ),
        );
    }
}
```

:::

<FeedExample :items="[withFile]" />

`File` says what a file is, never where it lives: the URL comes from
[`feedMedia()`](/basics/feedable-models#the-link) at read time.

<a id="built-in-body-types"></a>

### Available Body Types

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

See [Activity Body Content](/deeper/body) for body construction and custom types.

## Linking to Content

Entity links and images are resolved when the feed is read. [Feedable Models](/basics/feedable-models#resolving-links-and-images) covers the resolver.

### Modal Links

Some entities are better opened than navigated to, like a photograph or a
document preview. `modal()` on the media marks the link, and the entity
carries `modal: true`.

::: code-group

```php [Fluent Syntax] memo="app/Models/Photo.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;

class Photo extends Model implements Feedable
{
    use InteractsWithFeed;

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make()
            ->url(route('photos.show', $context->routeKey()))
            ->modal();
    }
}
```

```php [Named Arguments] memo="app/Models/Photo.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;

class Photo extends Model implements Feedable
{
    use InteractsWithFeed;

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make(
            url: route('photos.show', $context->routeKey()),
            modal: true,
        );
    }
}
```

:::

<FeedExample :items="[openInPlace]" />

`modal` is a boolean in the payload. Opening a dialog is your renderer's job;
the flag does not open a dialog by itself.
