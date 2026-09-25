# Activity Content

<script setup>
import { scene, everything } from '../.vitepress/theme/world'

const content = scene.basics.activityContent
const withThread = { ...content.note,
  thread: { text: content.note.object.label, by: content.note.actor.label, kind: 'note', replies: null, truncated: false } }
const withProse = { ...content.ready,
  object: { ...content.ready.object, body: [{ $body: 'Storyfeed/Body/Prose', $v: 1,
    content: 'A spoon with the order, please.', mediaType: 'text/plain', verbatim: false,
    title: `${content.ready.object.label} instructions` }] } }
const withKeyValue = { ...content.confirmed,
  object: { ...content.confirmed.object, body: [{ $body: 'Storyfeed/Body/KeyValue', $v: 1,
    title: content.confirmed.object.label, items: [
    { key: 'Pickup', value: '12:10 pm', verbatim: false, missing: null },
    { key: 'Items', value: '1', verbatim: false, missing: null },
    { key: 'Reference', value: content.confirmed.object.id, verbatim: true, missing: null },
    { key: 'Table', value: null, verbatim: false, missing: 'not seated' },
  ] }] } }
// The pack's own passage from a source: the oldest row whose object quotes one.
const quoted = everything().findLast(node => node.object?.body?.some(body => body.$body === 'Storyfeed/Body/Excerpt'))
const withExcerpt = { ...quoted, object: { ...quoted.object, type: 'article' } }
const withFile = { ...content.photo, object: { ...content.photo.object,
  body: [{ $body: 'Storyfeed/Body/File', $v: 1,
    name: content.photo.object.label, size: 512, mediaType: 'image/svg+xml' }] } }
</script>

## Introduction

The headline is one sentence, and often the whole row. Under it an activity
can show the words someone wrote, the facts behind a change, or what a file is.

<a id="headlines"></a>

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
`toFeed()`, and your frontend chooses how to draw each body type. A body belongs
to the model, so it shows wherever the entity appears, not only under one
activity.

### Text and Labelled Values

::: code-group

```php [Fluent Syntax] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\Body\Prose;
use Storyfeed\FeedEntity;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
            ->label("Order #{$this->reference}")
            ->body(Prose::make()
                ->content($this->instructions)
                ->title("Order #{$this->reference} instructions"));
    }
}
```

```php [Named Arguments] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\Body\Prose;
use Storyfeed\FeedEntity;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: "Order #{$this->reference}",
            body: Prose::make(
                content: $this->instructions,
                title: "Order #{$this->reference} instructions",
            ),
        );
    }
}
```

:::

<FeedExample :items="[withProse]" />

The title names the order, so the body reads on its own wherever it appears.
`KeyValue` holds labelled values:

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
            ->body(KeyValue::make()->title("Order #{$this->reference}")->items([
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
            body: KeyValue::make(title: "Order #{$this->reference}", items: [
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

`KeyValue::missingAs()` gives an empty value its own word. `KeyValue::verbatim()`
marks a value to reproduce exactly as written, such as a reference number.

<a id="passages-from-a-source"></a>

### Passages From a Source

`Excerpt` quotes a passage, and `from` says where it came from:

::: code-group

```php [Fluent Syntax] memo="app/Models/Article.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Excerpt;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Article extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
            ->label($this->title)
            ->body(Excerpt::make()
                ->text($this->lede)
                ->from("Draft for {$this->publication->name}"));
    }
}
```

```php [Named Arguments] memo="app/Models/Article.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Excerpt;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Article extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: $this->title,
            body: Excerpt::make(
                text: $this->lede,
                from: "Draft for {$this->publication->name}",
            ),
        );
    }
}
```

:::

<FeedExample :items="[withExcerpt]" />

An excerpt is `truncated` by default: the passage is part of something longer.
Pass `truncated(false)` when the text is complete.

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
the [link resolver](/basics/feedable-models#the-link) at read time.

<a id="built-in-body-types"></a>

### Available Body Types

| Body Type | Shows | Payload Keys |
|---|---|---|
| `KeyValue` | labelled pairs | `title`, `items[]` of `key`, `value`, `verbatim`, `missing` |
| `Excerpt` | a passage, and where it came from | `text`, `from`, `truncated` |
| `Change` | before and after, for one field or several | `items`, a map of field to `[before, after]` |
| `File` | what an artefact is and how big | `name`, `size`, `mediaType` |
| `Prose` | authored text, and how to read it | `content`, `mediaType`, `verbatim`, `title` |
| `ItemList` | several things, each a name and maybe a link | `title`, `items[]`, `ordered`, `totalItems`, `more` |
| `MediaObject` | a title, some prose, one picture, the files | `subject`, `content`, `image`, `attachments`, `footnote` |
| `Component` | a component of your own, by name, with its props | `name`, `props` |

They live in `Storyfeed\Body`. In the payload, each body names its type in
`$body`, such as `Storyfeed/Body/KeyValue`, and its version in `$v`, so a
renderer can choose how to draw it. A string passed as a body becomes a `Prose`
body.

See [Custom Body Types](/deeper/body) for bodies resolved at read time, custom components and writing your own body types.
