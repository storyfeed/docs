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
  object: { ...content.confirmed.object, body: [{ $body: 'Storyfeed/Body/KeyValue', $v: 2,
    title: content.confirmed.object.label, items: [
    { key: 'Pickup', value: '12:10 pm', verbatim: false, placeholder: null },
    { key: 'Items', value: '1', verbatim: false, placeholder: null },
    { key: 'Reference', value: content.confirmed.object.id, verbatim: true, placeholder: null },
    { key: 'Table', value: null, verbatim: false, placeholder: 'not seated' },
  ] }] } }
// The pack's own passage from a source: the oldest row whose object quotes one.
const quoted = everything().findLast(node => node.object?.body?.some(body => body.$body === 'Storyfeed/Body/Excerpt'))
const withExcerpt = { ...quoted, object: { ...quoted.object, type: 'article' } }
const withFile = { ...content.photo, object: { ...content.photo.object,
  body: [{ $body: 'Storyfeed/Body/FileAttachment', $v: 1,
    name: content.photo.object.label, size: 137767, mediaType: 'image/jpeg' }] } }
</script>

## Introduction

You may display quoted text, structured values, or file details below an
activity's headline.

<a id="headlines"></a>

<a id="quoted-text"></a>

## Adding Quoted Text

To record quoted text with an activity, call the `thread` method:

::: code-group
```php [Fluent Syntax]
$customer = $request->user();
$note = $order->notes()->create($request->validated());

Storyfeed::activity()
    ->by($customer)
    ->action('post', $note)
    ->on($order)
    ->thread(FeedThread::make(text: $note->body, by: $customer->name, kind: 'note')) // [!code highlight]
    ->publish();
```

```php [Named Arguments]
$customer = $request->user();
$note = $order->notes()->create($request->validated());

Storyfeed::record(
    verb: 'post',
    object: $note,
    actor: $customer,
    target: $order,
    thread: FeedThread::make( // [!code highlight]
        text: $note->body,
        by: $customer->name,
        kind: 'note',
    ),
);
```
:::

<FeedExample :items="[withThread]" />

Storyfeed stores the text on the activity. Editing the note later does not
change the recorded text.

<a id="entity-bodies"></a>

## Adding Entity Bodies

A **body** contains an entity's structured content. Define it in the model's
`toFeed` method and render it in your frontend. The body is available wherever
the entity appears.

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
            ->body(
                Prose::make()
                    ->content($this->instructions)
                    ->title("Order #{$this->reference} instructions"),
            );
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

Include a title to identify the order when the body appears without a headline.
Use `KeyValue` for labelled values:

::: code-group

```php [Fluent Syntax]
FeedEntity::make()
    ->label("Order #{$this->reference}")
    ->body(
        KeyValue::make()->title("Order #{$this->reference}")->items([ // [!code highlight]
            'Pickup' => $this->pickup_at->format('g:i a'),
            'Items' => $this->items->count(),
            'Reference' => KeyValue::verbatim($this->reference),
            'Table' => KeyValue::placeholder($this->table, 'not seated'),
        ]),
    );
```

```php [Named Arguments]
FeedEntity::make(
    label: "Order #{$this->reference}",
    body: KeyValue::make( // [!code highlight]
        title: "Order #{$this->reference}",
        items: [
            'Pickup' => $this->pickup_at->format('g:i a'),
            'Items' => $this->items->count(),
            'Reference' => KeyValue::verbatim($this->reference),
            'Table' => KeyValue::placeholder($this->table, 'not seated'),
        ],
    ),
);
```

:::

<FeedExample :items="[withKeyValue]" />

Use the `KeyValue::placeholder` method to specify text for an empty value.
Use `->defaultPlaceholder('—')` to set the default for every row without its own placeholder,
or pass `defaultPlaceholder:` to `KeyValue::make()`.
The `KeyValue::verbatim` method marks a value for display without formatting,
such as a reference number.

<a id="passages-from-a-source"></a>

### Passages From a Source

Use `Excerpt` to quote a passage and its `from` argument to identify the source:

::: code-group

```php [Fluent Syntax]
FeedEntity::make()
    ->label($this->title)
    ->body(
        Excerpt::make() // [!code highlight]
            ->text($this->lede)
            ->from("Draft for {$this->publication->name}"),
    );
```

```php [Named Arguments]
FeedEntity::make(
    label: $this->title,
    body: Excerpt::make( // [!code highlight]
        text: $this->lede,
        from: "Draft for {$this->publication->name}",
    ),
);
```

:::

<FeedExample :items="[withExcerpt]" />

Excerpts are marked as `truncated` by default. Call `truncated(false)` when the
text is complete.

### File Attachment

Use `FileAttachment` in a `Photo` model's `toFeed` method to include the photo's file details:

::: code-group

```php [Fluent Syntax] memo="app/Models/Photo.php" at="toFeed()"
use Storyfeed\Body\FileAttachment;
use Storyfeed\FeedEntity;

return FeedEntity::make()
    ->label($this->name)
    ->body( // [!code highlight]
        FileAttachment::make()
            ->size($this->bytes)
            ->mediaType($this->mime)
            ->name($this->name)
    );
```

```php [Named Arguments] memo="app/Models/Photo.php" at="toFeed()"
use Storyfeed\Body\FileAttachment;
use Storyfeed\FeedEntity;

return FeedEntity::make(
    label: $this->name,
    body: FileAttachment::make( // [!code highlight]
        size: $this->bytes,
        mediaType: $this->mime,
        name: $this->name,
    ),
);
```

:::

<FeedExample :items="[withFile]" />

The `FileAttachment` body stores file details. Configure the URL separately with the
[link resolver](/basics/feedable-models#the-link).

### Lists of Items

Use `ItemList` for an order's items. Each item may be a plain string or a
`FeedLink` to another page:

::: code-group

```php [Fluent Syntax]
use App\Models\OrderLine;
use Storyfeed\Body\ItemList;
use Storyfeed\FeedEntity;
use Storyfeed\FeedLink;

FeedEntity::make()
    ->label("Order #{$this->reference}")
    ->body(
        ItemList::make()
            ->title("Order #{$this->reference} items")
            ->items(
                $this->lines->take(2)->map(
                    fn (OrderLine $line) => FeedLink::make( // [!code highlight]
                        $line->item->name,
                        $line->item->url,
                    ),
                ),
            )
            ->items([$this->lines->get(2)->item->name])
            ->totalItems($this->lines->count())
            ->more(FeedLink::make("Order #{$this->reference}", $this->url)),
    );
```

```php [Named Arguments]
use App\Models\OrderLine;
use Storyfeed\Body\ItemList;
use Storyfeed\FeedEntity;
use Storyfeed\FeedLink;

FeedEntity::make(
    label: "Order #{$this->reference}",
    body: ItemList::make(
        title: "Order #{$this->reference} items",
        items: [
            ...$this->lines->take(2)->map(
                fn (OrderLine $line) => FeedLink::make( // [!code highlight]
                    $line->item->name,
                    $line->item->url,
                ),
            ),
            $this->lines->get(2)->item->name,
        ],
        totalItems: $this->lines->count(),
        more: FeedLink::make("Order #{$this->reference}", $this->url),
    ),
);
```

:::

<FeedExample :items="[content.itemList]" />

This order has five items. The body includes two linked items and one
plain-string item. The `totalItems` method records the full count, and `more`
provides a link to the order containing the remaining items. Use
`ItemList::ordered()` when the sequence of the items matters.

### Linking a Title

Use `MediaObject` for a notice with a title and a short description. Pass a
`FeedLink` as its `subject` to make the title a link:

::: code-group

```php [Fluent Syntax]
use Storyfeed\Body\MediaObject;
use Storyfeed\FeedEntity;
use Storyfeed\FeedLink;

FeedEntity::make()
    ->label($this->title)
    ->body(
        MediaObject::make()
            ->subject(FeedLink::make($this->title, $this->url)) // [!code highlight]
            ->content($this->description),
    );
```

```php [Named Arguments]
use Storyfeed\Body\MediaObject;
use Storyfeed\FeedEntity;
use Storyfeed\FeedLink;

FeedEntity::make(
    label: $this->title,
    body: MediaObject::make(
        subject: FeedLink::make($this->title, $this->url), // [!code highlight]
        content: $this->description,
    ),
);
```

:::

<FeedExample :items="[content.notice]" />

The title links to the notice at the URL supplied when its body is stored.

To link to another page, pass that page's title and URL:

::: code-group

```php [Fluent Syntax]
use Storyfeed\Body\MediaObject;
use Storyfeed\FeedEntity;
use Storyfeed\FeedLink;

FeedEntity::make()
    ->label($this->title)
    ->body(
        MediaObject::make()
            ->subject(FeedLink::make($this->guide_title, $this->guide_url)) // [!code highlight]
            ->content($this->description),
    );
```

```php [Named Arguments]
use Storyfeed\Body\MediaObject;
use Storyfeed\FeedEntity;
use Storyfeed\FeedLink;

FeedEntity::make(
    label: $this->title,
    body: MediaObject::make(
        subject: FeedLink::make($this->guide_title, $this->guide_url), // [!code highlight]
        content: $this->description,
    ),
);
```

:::

<FeedExample :items="[content.linkedNotice]" />

The body title links to the visitor guide, while the headline links to the
notice. A plain-string `subject` displays a title without a link.

### Links in Bodies

A `FeedLink` contains a label and an `href`. Pass the destination URL as the
second argument to `FeedLink::make`, or set it with the `href` method.

The `href` is stored as written. It can become stale if a route changes or a
signed URL expires.

The label names the thing, such as a notice or an order. It should not be an
instruction such as “Open the conversation”. See the
[`FeedLink` reference](/reference/feedable#feedlink) for its methods and the
body fields that accept it.

<a id="built-in-body-types"></a>

### Available Body Types

| Body Type | Content | Payload Keys |
|---|---|---|
| `KeyValue` | labelled values | `title`, `defaultPlaceholder`, `items[]` of `key`, `value`, `verbatim`, `placeholder` |
| `Excerpt` | a quoted passage and its source | `text`, `from`, `truncated` |
| `Change` | before and after values for one or more fields | `items`, a map of field to `[before, after]` |
| `FileAttachment` | file name, size, and media type | `name`, `size`, `mediaType` |
| `Prose` | text and its format | `content`, `mediaType`, `verbatim`, `title` |
| `ItemList` | named items with optional links | `title`, `defaultPlaceholder`, `items[]`, `ordered`, `totalItems`, `more` |
| `MediaObject` | a title, text, image, and files | `subject`, `content`, `image`, `files`, `footnote` |
| `Component` | a custom component name and props | `name`, `props` |

These classes use the `Storyfeed\Body` namespace. Each body's payload includes
its type in `$body`, such as `Storyfeed/Body/KeyValue`, and its version in `$v`.
Your renderer uses these fields to display the body. Passing a string as a body
creates a `Prose` body.

See [Custom Body Types](/deeper/body) to resolve bodies when retrieving the feed,
render custom components, or define your own body types.
