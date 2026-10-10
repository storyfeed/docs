# Activity Content

<script setup>
import { scene, everything, avatar } from '../.vitepress/theme/world'

const content = scene.basics.activityContent
const quotedNote = { ...content.note,
  object: { ...content.note.object, label: 'Order note', body: [{
    $body: 'Storyfeed/Body/Excerpt', $v: 2, text: content.note.object.label, truncated: false,
  }] } }
const withProse = { ...content.ready,
  object: { ...content.ready.object, body: [{ $body: 'Storyfeed/Body/Prose', $v: 2,
    content: 'A spoon with the order, please.', title: `${content.ready.object.label} instructions` }] } }
const withKeyValue = { ...content.confirmed,
  object: { ...content.confirmed.object, body: [{ $body: 'Storyfeed/Body/KeyValue', $v: 3,
    title: content.confirmed.object.label, items: [
    { key: 'Pickup', value: '12:10 pm' },
    { key: 'Items', value: 1 },
    { key: 'Reference', value: content.confirmed.object.id, verbatim: true },
    { key: 'Table', value: null, placeholder: 'not seated' },
  ] }] } }
// The pack's own passage from a source: the oldest row whose object quotes one.
const quoted = everything().findLast(node => node.object?.body?.some(body => body.$body === 'Storyfeed/Body/Excerpt'))
const withExcerpt = { ...quoted, object: { ...quoted.object, type: 'article' } }
const picture = content.photo.object.media.preview
const withStoredImage = { ...content.photo, object: { ...content.photo.object, body: [{
  $body: 'Storyfeed/Body/Image', $v: 3, src: picture.src, width: picture.width, height: picture.height,
  alt: content.photo.object.body[0].alt, caption: content.photo.object.body[0].caption }] } }
const lineNames = content.itemList.object.body[0].items
  .map(item => (typeof item === 'string' ? item : item.label).replace(/^an? /, ''))
  .map(name => name[0].toUpperCase() + name.slice(1))
const withTable = { ...content.itemList, object: { ...content.itemList.object, body: [{
  $body: 'Storyfeed/Body/Table', $v: 1, headers: ['Item', 'Qty', 'Price'],
  rows: [[lineNames[0], 2, '$3.00'], [lineNames[1], 1, '$1.75'], [lineNames[2], 2, '$4.00']],
  footer: [['Total', null, '$8.75']] }] } }
const withCallToAction = { ...content.notice, object: { ...content.notice.object, body: [{
  $body: 'Storyfeed/Body/CallToAction', $v: 1, $fallback: 'Read the notice', content: content.notice.object.body[0].content,
  action: { label: 'Read the notice', link: { href: null, modal: false, attributes: [] } } }] } }
// A menu item with a description and the station that makes it.
const withBodies = { ...content.product, object: { ...content.product.object, body: [
  { $body: 'Storyfeed/Body/Prose', $v: 2, content: 'Two scoops with warm sauce.' },
  { $body: 'Storyfeed/Body/KeyValue', $v: 3, items: [{ key: 'Station', value: 'Fountain' }] },
] } }
// The order's pickup time, with a plain-text line for a renderer without KeyValue.
const withFallback = { ...content.confirmed,
  object: { ...content.confirmed.object, body: [{ $body: 'Storyfeed/Body/KeyValue', $v: 3,
    $fallback: 'Pickup at 12:10 pm', items: [{ key: 'Pickup', value: '12:10 pm' }] }] } }
// The order, featuring the shop it was placed with.
const featuringShop = { ...scene.order, featured: 'target' }
const withFile = { ...content.photo, verb: 'upload', headline_template: ':actor uploaded :object', headline: null, target: null, object: { ...content.photo.object,
  type: 'document', label: 'Signed Agreement.pdf', link: { href: '/documents/signed-agreement', modal: false, attributes: [] },
  media: avatar('document', content.photo.object.id, 'Signed Agreement.pdf'),
  body: [{ $body: 'Storyfeed/Body/FileAttachment', $v: 2,
    name: 'Signed Agreement.pdf', size: 137767, mediaType: 'application/pdf' }] } }
</script>

## Introduction

A body adds structured content beneath an entity’s label: a quote, a photo,
a few labelled values. Choose a body from the evidence you have:

| Evidence | Body |
|---|---|
| page with a share preview | `MediaObject` card with the title, description, and image from its preview metadata |
| passage from a source | `Excerpt` |
| photo | `Image` |
| a few labelled values | `KeyValue` |
| nothing to add | no body; the headline alone |

Put supporting detail in the body rather than a headline closure.

<a id="entity-bodies"></a>

## Adding Entity Bodies

A **body** contains an entity's structured content. Define it in the model's
`toFeed` method and render it in your frontend. The body is available wherever
the entity appears. With `InteractsWithFeed`, saving the model refreshes its
shared snapshot while recording is enabled. That can change the body shown on
older activities too. Use activity `data` to capture values as they were at the event.

Every entity in the payload carries its own bodies, in any role. An
activity's `featured` key names the role it features, the object by default.
To feature another role's entity, see
[Featuring Another Role](#featuring-another-role).

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

```php [Fluent Syntax] memo="app/Models/Order.php" at="toFeed()"
use Storyfeed\Body\KeyValue;
use Storyfeed\FeedEntity;

FeedEntity::make()
    ->label("Order #{$this->reference}")
    ->body(
        KeyValue::make()->title("Order #{$this->reference}")->items([
            'Pickup' => $this->pickup_at->format('g:i a'),
            'Items' => $this->items->count(),
            'Reference' => KeyValue::verbatim($this->reference),
            'Table' => KeyValue::placeholder($this->table, 'not seated'),
        ]),
    );
```

```php [Named Arguments] memo="app/Models/Order.php" at="toFeed()"
use Storyfeed\Body\KeyValue;
use Storyfeed\FeedEntity;

FeedEntity::make(
    label: "Order #{$this->reference}",
    body: KeyValue::make(
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

### Formatted Text and Raw Output

For code or raw output, create the body with `Prose::verbatim`. The body
stores the text exactly as given, with `verbatim` set to `true`:

```php memo="app/Models/FieldRecord.php" at="toFeed()"
use Storyfeed\Body\Prose;

Prose::verbatim($this->output, title: $this->name);
```

<FeedExample :items="[content.program, content.terminal, content.radioLog]" />

To name the code's language, use `Prose::code` with a media type, such as
`text/x-php` or `application/json`:

```php memo="A model's toFeed() method"
use Storyfeed\Body\Prose;

Prose::code($this->source, 'text/x-php', title: $this->path);
```

The body stores the media type with the source, as verbatim text.

For formatted text, use `Prose::markdown` or `Prose::html`. Storyfeed stores
the source as written, with `text/markdown` or `text/html` as its media type:

```php memo="app/Models/FieldRecord.php" at="toFeed()"
use Storyfeed\Body\Prose;

Prose::markdown($this->notes, title: $this->title);
```

<FeedExample :items="[content.caseMemo, content.labReport]" />

<a id="headlines"></a>

<a id="quoted-text"></a>

### Adding Quoted Text

Use an `Excerpt` body for someone's words or a passage from a document.
Leave out `from` when the headline already says who said it; add it when the passage comes from someone or somewhere the headline does not name.
Define the body on the quoted model in `toFeed()`:

::: code-group
```php [Fluent Syntax] memo="app/Models/Note.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Excerpt;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Note extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
            ->label('Order note')
            ->body(
                Excerpt::make()
                    ->text($this->body)
                    ->truncated(false),
            );
    }
}
```

```php [Named Arguments] memo="app/Models/Note.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Excerpt;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Note extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: 'Order note',
            body: Excerpt::make(
                text: $this->body,
                truncated: false,
            ),
        );
    }
}
```
:::

Set `truncated(false)` when the body contains the complete text. The headline
names the note's author, so the quotation needs no separate attribution:

<FeedExample :items="[quotedNote]" />

Record the note as the activity's object and the order as its target:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/OrderNoteController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class OrderNoteController extends Controller
{
    public function store(Request $request, Order $order): RedirectResponse
    {
        $note = $order->notes()->create(
            $request->validate(['body' => ['required', 'string']]),
        );

        Storyfeed::activity()
            ->by($request->user())
            ->action('post', $note)
            ->to($order)
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/OrderNoteController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class OrderNoteController extends Controller
{
    public function store(Request $request, Order $order): RedirectResponse
    {
        $note = $order->notes()->create(
            $request->validate(['body' => ['required', 'string']]),
        );

        Storyfeed::record(
            verb: 'post',
            object: $note,
            actor: $request->user(),
            target: $order,
        );

        return back();
    }
}
```
:::

<a id="passages-from-a-source"></a>

<a id="quoting-a-source"></a>

#### Attributing a Source

Use `Excerpt` to quote someone else's words, such as a person interviewed for a
story. Here the headline names the article, and `from` names the source of
the quoted passage:

::: code-group

```php [Fluent Syntax] memo="app/Models/Article.php" at="toFeed()"
use Storyfeed\Body\Excerpt;
use Storyfeed\FeedEntity;

FeedEntity::make()
    ->label($this->title)
    ->body(
        Excerpt::make()
            ->text($this->pull_quote)
            ->from($this->pull_quote_source),
    );
```

```php [Named Arguments] memo="app/Models/Article.php" at="toFeed()"
use Storyfeed\Body\Excerpt;
use Storyfeed\FeedEntity;

FeedEntity::make(
    label: $this->title,
    body: Excerpt::make(
        text: $this->pull_quote,
        from: $this->pull_quote_source,
    ),
);
```

:::

<FeedExample :items="[withExcerpt]" />

Excerpts are marked as `truncated` by default. Call `truncated(false)` when the
text is complete. For the entity's own text, such as an article's opening
paragraph, use `Prose` instead.

A record of an answer taken down word for word quotes the person who gave it,
and marks the text as complete:

::: code-group

```php [Fluent Syntax] memo="app/Models/FieldRecord.php" at="toFeed()"
use Storyfeed\Body\Excerpt;
use Storyfeed\FeedEntity;

FeedEntity::make()
    ->label($this->title)
    ->body(
        Excerpt::make()
            ->text($this->answer)
            ->from($this->answered_by)
            ->truncated(false),
    );
```

```php [Named Arguments] memo="app/Models/FieldRecord.php" at="toFeed()"
use Storyfeed\Body\Excerpt;
use Storyfeed\FeedEntity;

FeedEntity::make(
    label: $this->title,
    body: Excerpt::make(
        text: $this->answer,
        from: $this->answered_by,
        truncated: false,
    ),
);
```

:::

<FeedExample :items="[content.planck]" />

### Adding an Image

Use an `Image` body to show a photograph with a caption. Pass the picture's
URL to `make`:

::: code-group

```php [Fluent Syntax] memo="app/Models/Photo.php" at="toFeed()"
use Storyfeed\Body\Image;
use Storyfeed\FeedEntity;

return FeedEntity::make()
    ->label($this->name)
    ->body(
        Image::make($this->url)
            ->width($this->width)
            ->height($this->height)
            ->alt($this->description)
            ->caption($this->subject)
    );
```

```php [Named Arguments] memo="app/Models/Photo.php" at="toFeed()"
use Storyfeed\Body\Image;
use Storyfeed\FeedEntity;

return FeedEntity::make(
    label: $this->name,
    body: Image::make(
        image: $this->url,
        width: $this->width,
        height: $this->height,
        alt: $this->description,
        caption: $this->subject,
    ),
);
```

:::

<FeedExample :items="[withStoredImage]" />

The body stores the URL, so it keeps showing that address. You may also pass a
`FeedImage`, whose `alt`, `width` and `height` become the body's.

For a URL that changes, such as a signed link, pass one of the model's
`feedMedia()` picture slots instead, such as `$this->feedMediaPreview()`. The
body stores the slot's name, and
[Feed Media](/basics/feed-media#showing-pictures) resolves the picture each
time the feed is read.

<a id="file-attachment"></a>

### Attaching a File

Use `FileAttachment` in a `Document` model's `toFeed` method to describe a PDF, such as a signed agreement:

::: code-group

```php [Fluent Syntax] memo="app/Models/Document.php" at="toFeed()"
use Storyfeed\Body\FileAttachment;
use Storyfeed\FeedEntity;

return FeedEntity::make()
    ->label($this->name)
    ->body(
        FileAttachment::make()
            ->size($this->bytes)
            ->mediaType('application/pdf')
            ->name($this->name)
    );
```

```php [Named Arguments] memo="app/Models/Document.php" at="toFeed()"
use Storyfeed\Body\FileAttachment;
use Storyfeed\FeedEntity;

return FeedEntity::make(
    label: $this->name,
    body: FileAttachment::make(
        size: $this->bytes,
        mediaType: 'application/pdf',
        name: $this->name,
    ),
);
```

:::

<FeedExample :items="[withFile]" />

The `FileAttachment` body stores file details. The link to open the document
and the download itself come from the model's resolver; see
[Linking Files](/basics/feed-media#linking-files).

<a id="lists-of-items"></a>

### Listing Items

Use `ItemList` for an order's items. Each item may be a plain string or a
`FeedLink` to another page:

::: code-group

```php [Fluent Syntax] memo="app/Models/Order.php" at="toFeed()"
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
                    fn (OrderLine $line) => FeedLink::make(
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

```php [Named Arguments] memo="app/Models/Order.php" at="toFeed()"
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
                fn (OrderLine $line) => FeedLink::make(
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

`totalItems` records the full count and `more` links to the rest. Use
`ItemList::ordered()` when the sequence of the items matters.

<a id="tables"></a>

### Adding a Table

Use `Table` for rows and columns. Its arguments follow Artisan's
`$this->table($headers, $rows)`:

::: code-group

```php [Fluent Syntax] memo="app/Models/Order.php" at="toFeed()"
use App\Models\OrderLine;
use Illuminate\Support\Number;
use Storyfeed\Body\Table;
use Storyfeed\FeedEntity;

FeedEntity::make()
    ->label("Order #{$this->reference}")
    ->body(
        Table::make()
            ->headers(['Item', 'Qty', 'Price'])
            ->rows($this->lines->map(fn (OrderLine $line) => [
                $line->item->name,
                $line->quantity,
                Number::currency($line->total),
            ]))
            ->footer(['Total', null, Number::currency($this->total)]),
    );
```

```php [Named Arguments] memo="app/Models/Order.php" at="toFeed()"
use App\Models\OrderLine;
use Illuminate\Support\Number;
use Storyfeed\Body\Table;
use Storyfeed\FeedEntity;

FeedEntity::make(
    label: "Order #{$this->reference}",
    body: Table::make(
        headers: ['Item', 'Qty', 'Price'],
        rows: $this->lines->map(fn (OrderLine $line) => [
            $line->item->name,
            $line->quantity,
            Number::currency($line->total),
        ]),
    )->footer(['Total', null, Number::currency($this->total)]),
);
```

:::

<FeedExample :items="[withTable]" />

A cell is a string, a number, `null` for an empty cell, or a `FeedLink`.
Format amounts before adding them. `footer` appends a row beneath the others,
such as a subtotal or a total, and `title` adds a line above the table.

### Adding Multiple Bodies

<a id="bodies-by-role"></a>
<a id="multiple-bodies"></a>

Entities in any role can have bodies. Your frontend chooses which to display.
Each `body()` call appends a body in the order given:

::: code-group

```php [Fluent Syntax] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\KeyValue;
use Storyfeed\Body\Prose;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
            ->label($this->name)
            ->body(Prose::make($this->description))
            ->body(KeyValue::make()->items('Station', $this->station));
    }
}
```

```php [Named Arguments] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\KeyValue;
use Storyfeed\Body\Prose;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: $this->name,
            body: [
                Prose::make($this->description),
                KeyValue::make(items: ['Station' => $this->station]),
            ],
        );
    }
}
```

:::

<FeedExample :items="[withBodies]" />

### Linking a Title

Use `MediaObject` for a notice with a title and a short description. Pass a
`FeedLink` as its `subject` to make the title a link:

::: code-group

```php [Fluent Syntax] memo="app/Models/Notice.php" at="toFeed()"
use Storyfeed\Body\MediaObject;
use Storyfeed\FeedEntity;
use Storyfeed\FeedLink;

FeedEntity::make()
    ->label($this->title)
    ->body(
        MediaObject::make()
            ->subject(FeedLink::make($this->title, $this->url))
            ->content($this->description),
    );
```

```php [Named Arguments] memo="app/Models/Notice.php" at="toFeed()"
use Storyfeed\Body\MediaObject;
use Storyfeed\FeedEntity;
use Storyfeed\FeedLink;

FeedEntity::make(
    label: $this->title,
    body: MediaObject::make(
        subject: FeedLink::make($this->title, $this->url),
        content: $this->description,
    ),
);
```

:::

<FeedExample :items="[content.notice]" />

The title links to the notice at the URL supplied when its body is stored.

To link to another page, pass that page's title and URL:

::: code-group

```php [Fluent Syntax] memo="app/Models/Notice.php" at="toFeed()"
use Storyfeed\Body\MediaObject;
use Storyfeed\FeedEntity;
use Storyfeed\FeedLink;

FeedEntity::make()
    ->label($this->title)
    ->body(
        MediaObject::make()
            ->subject(FeedLink::make($this->guide_title, $this->guide_url))
            ->content($this->description),
    );
```

```php [Named Arguments] memo="app/Models/Notice.php" at="toFeed()"
use Storyfeed\Body\MediaObject;
use Storyfeed\FeedEntity;
use Storyfeed\FeedLink;

FeedEntity::make(
    label: $this->title,
    body: MediaObject::make(
        subject: FeedLink::make($this->guide_title, $this->guide_url),
        content: $this->description,
    ),
);
```

:::

<FeedExample :items="[content.linkedNotice]" />

A plain-string `subject` stores a title without a link.

<a id="call-to-action"></a>

### Adding a Call to Action

Use `CallToAction` for a sentence or two and one action. The action's text says
what to do, and `FeedLink::toEntity()` sends it to the entity the body belongs
to:

::: code-group

```php [Fluent Syntax] memo="app/Models/Notice.php" at="toFeed()"
use Storyfeed\Body\CallToAction;
use Storyfeed\FeedEntity;
use Storyfeed\FeedLink;

FeedEntity::make()
    ->label($this->title)
    ->body(
        CallToAction::make()
            ->content($this->description)
            ->action('Read the notice', FeedLink::toEntity()),
    );
```

```php [Named Arguments] memo="app/Models/Notice.php" at="toFeed()"
use Storyfeed\Body\CallToAction;
use Storyfeed\FeedEntity;
use Storyfeed\FeedLink;

FeedEntity::make(
    label: $this->title,
    body: CallToAction::make(
        content: $this->description,
    )->action('Read the notice', FeedLink::toEntity()),
);
```

:::

<FeedExample :items="[withCallToAction]" />

`subject` adds a short heading. The action is required, and a string in place
of the `FeedLink` is a plain link.

### Links in Bodies

A `FeedLink` contains a label and an `href`. Pass the destination URL as the
second argument to `FeedLink::make`, or set it with the `href` method.
`FeedLink::toEntity()` stores no URL: the renderer links it to the entity's own
link each time the feed is read.

The `href` is stored as written. It can become stale if a route changes or a
signed URL expires.

The label names the thing, such as a notice or an order.  See the
[`FeedLink` reference](/reference/feedable#feedlink) for its methods and the
body fields that accept it.

<a id="body-height"></a>

### Setting a Body's Height

A body may tell the renderer how tall to draw it. `maxHeight` takes a CSS
length, and `fullHeight` shows the whole body:

```php memo="app/Models/Order.php" at="toFeed()"
use Storyfeed\Body\Prose;
use Storyfeed\Body\Table;
use Storyfeed\FeedEntity;

return FeedEntity::make()
    ->label("Order #{$this->reference}")
    ->body(
        Prose::markdown($this->notes)->fullHeight(),
        Table::make(['Item', 'Qty'], $this->summary)->maxHeight('16rem'),
    );
```

Both write the body's `$meta.maxHeight`. Add your own renderer settings with
`withMeta`, using a dotted key such as `acme.layout`:

```php memo="app/Models/Order.php" at="toFeed()"
use Storyfeed\Body\Prose;

Prose::markdown($this->notes)->withMeta(['acme.layout' => 'wide']);
```

<a id="body-fallback"></a>

### Adding a Fallback Line

Every body accepts a `fallback`: one line of plain text, stored in the body's
`$fallback` key, for a renderer that does not draw its type:

::: code-group

```php [Fluent Syntax] memo="app/Models/Order.php" at="toFeed()"
use Storyfeed\Body\KeyValue;
use Storyfeed\FeedEntity;

return FeedEntity::make()
    ->label("Order #{$this->reference}")
    ->body(
        KeyValue::make()
            ->items('Pickup', $this->pickup_at->format('g:i a'))
            ->fallback("Pickup at {$this->pickup_at->format('g:i a')}"),
    );
```

```php [Named Arguments] memo="app/Models/Order.php" at="toFeed()"
use Storyfeed\Body\KeyValue;
use Storyfeed\FeedEntity;

return FeedEntity::make(
    label: "Order #{$this->reference}",
    body: KeyValue::make(
        items: ['Pickup' => $this->pickup_at->format('g:i a')],
    )->fallback("Pickup at {$this->pickup_at->format('g:i a')}"),
);
```

:::

<FeedExample payload :items="[withFallback]" />

Without one, a `Table` stores its title and a `CallToAction` its subject or
action text as the fallback. Other body types store none.

<a id="built-in-body-types"></a>

### Available Body Types

| Body Type | Content | Payload Keys | Left Out at Their Default |
|---|---|---|---|
| `KeyValue` | labelled values | `title`, `defaultPlaceholder`, `items[]` of `key`, `value`, `verbatim`, `placeholder` | `title`, `defaultPlaceholder`; a row's `verbatim` (`false`) and `placeholder` (the body's `defaultPlaceholder`) |
| `Excerpt` | a quoted passage with optional source attribution | `text`, `from`, `truncated` | `from`, `truncated` (`true`) |
| `Image` | a picture and caption | `src`, `mediaType`, `caption`, `alt`, `width`, `height`, `image` (slot name) | all |
| `FileAttachment` | file name, size, and media type | `name`, `size`, `mediaType` | all |
| `Prose` | text and its format | `content`, `mediaType`, `verbatim`, `title` | `mediaType` (`text/plain`), `verbatim` (`false`), `title` |
| `ItemList` | named items with optional links | `title`, `items[]`, `ordered`, `totalItems`, `more` | `title`, `ordered` (`false`), `totalItems`, `more` |
| `MediaObject` | a title, text, image, and files | `subject`, `content`, `image`, `files`, `footnote` | `subject`, `content`, `image`, `files` (`[]`), `footnote` |
| `Table` | rows and columns | `title`, `headers`, `rows`, `footer` | `title`, `headers` (`[]`), `footer` (`[]`) |
| `CallToAction` | a heading, text, and one action | `subject`, `content`, `action` of `label`, `link` | `subject`, `content` |
| `Component` | a custom component name and props | `name`, `props` | `props` (`[]`) |

A stored body leaves out each key that holds its default, which is `null`
unless the table says otherwise. A body class's static `upgrade($payload,
$version)` method returns the payload with every key filled in.

These classes use the `Storyfeed\Body` namespace. Each body's payload includes
its type in `$body`, such as `Storyfeed/Body/KeyValue`, and its version in `$v`.
Your renderer uses these fields to display the body. A body may also carry
`$meta`, its renderer settings. Passing a string as a body creates a `Prose` body.

See [Resolving Bodies When Retrieved](/deeper/resolving-bodies) for current
and deferred values, or [Custom Body Types](/deeper/body) to render custom
components and define your own body types.

<a id="featuring"></a>

## Featuring Another Role

An activity features its object by default. To feature another role, call a
`featuring` method:

```php memo="Where the order is placed: a controller, an action, a listener"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($order->customer)
    ->action('place', $order)
    ->to($order->shop)
    ->featuringTarget()
    ->publish();
```

The activity's `featured` key names the role:

<FeedExample payload :items="[featuringShop]" />

| Method | Features |
|---|---|
| `featuringObject()` | the object; the default, to undo an earlier call |
| `featuringActor()`, `featuringTarget()`, `featuringOrigin()`, `featuringResult()`, `featuringInstrument()`, `featuringLocation()`, `featuringGenerator()` | that role's entity |
| `withoutFeature()` | no entity: `featured` is `null`; bodies in the activity's own data remain |

A context is never featured. Featuring a role the activity leaves empty throws
`IncompleteActivity` when the activity is recorded. If the featured entity is
missing when the feed is read, the activity still appears.

To set a verb's default, call the same method in the feed file. An activity's
own call wins:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->headline(':actor placed :object with :target')
    ->featuringTarget();
```

Verb enums accept the same methods.
