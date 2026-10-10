# Feed Media

<script setup>
import { scene, avatar } from '../.vitepress/theme/world'
const photo = scene.basics.activityContent.photo
// Only a link: the photo's own preview is left out, and the avatar is derived.
const plain = { ...photo, object: { ...photo.object, body: null, media: avatar(photo.object.type, photo.object.id, photo.object.label) } }
const linked = { ...plain, object: { ...plain.object, link: { ...plain.object.link, modal: true, attributes: { 'aria-label': 'Open photo' } } } }
const sparkline = { src: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="24"><polyline fill="none" stroke="#0f766e" stroke-width="2" points="0,20 20,16 40,18 60,10 80,12 100,4 120,6"/></svg>'), width: 120, height: 24, alt: 'Orders this week', mediaType: null }
const target = photo.target
const charted = { ...photo, target: null, object: { ...target,
  media: avatar(target.type, target.id, target.label, { slots: { sparkline } }),
  body: [{ $body: 'Storyfeed/Body/Image', $v: 3, image: 'slots.sparkline' }] } }
const file = { ...photo, verb: 'upload', headline_template: ':actor uploaded :object', headline: null, target: null, object: { ...photo.object, type: 'document', label: 'Signed Agreement.pdf',
  link: { href: '/documents/signed-agreement', modal: false, attributes: [] }, media: avatar('document', photo.object.id, 'Signed Agreement.pdf', { files: [
    { type: 'Document', href: '/documents/signed-agreement/download', mediaType: 'application/pdf', name: 'Signed Agreement.pdf' }] }),
  body: [{ $body: 'Storyfeed/Body/FileAttachment', $v: 2, name: 'Signed Agreement.pdf', size: 137767, mediaType: 'application/pdf' }] } }
const actor = { ...scene.order, actor: { ...photo.object, body: null,
  media: avatar(photo.object.type, photo.object.id, photo.object.label, { icon: photo.object.media.preview }) } }
const team = scene.otherApps.team.target
const lettered = { ...scene.otherApps.task, actor: { ...team, body: null, data: { ...team.data, initials: 'ST', color: '#438d98' },
  media: { icon: null, image: null, preview: null, initials: 'ST', color: '#438d98', files: [], slots: [] } } }
</script>

## Introduction

A model's `toFeed()` method describes what is stored. Its static `feedMedia()`
method resolves links and media when a feed is retrieved:

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
        return FeedMedia::make()->url(route('photos.show', $context->routeKey()));
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
        );
    }
}
```

:::

<FeedExample :items="[plain]" />

The method receives a `FeedContext` with the snapshot's label, route key and
data, and returns a `FeedMedia` or `null`. Resolving URLs here lets a route or
thumbnail change without rewriting stored picture bodies.

### Using a Closure

With `InteractsWithFeed`, you may register a closure in `booted()` instead:

```php memo="app/Models/Photo.php" at="booted()"
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;

static::feedMediaUsing(
    fn (FeedContext $context, FeedMedia $media): FeedMedia => $media
        ->url(route('photos.show', $context->routeKey())),
);
```

<FeedExample :items="[plain]" />

A model's own `feedMedia()` method takes precedence over the registered closure.
A closure may also return a URL string or `null`. Without either resolver,
the trait returns `null`.

## Linking to the Model

Use `url()` for the destination of the entity's name in the headline. To say
more about the link, pass a `FeedLink` to `link()`. Its `modal()` method hints
that the renderer should open the link in place, and `attributes()` adds link
attributes:

::: code-group

```php [Fluent Syntax] memo="app/Models/Photo.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedLink;
use Storyfeed\FeedMedia;

class Photo extends Model implements Feedable
{
    use InteractsWithFeed;

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make()
            ->link(
                FeedLink::to(route('photos.show', $context->routeKey()))
                    ->modal()
                    ->attributes(['aria-label' => 'Open photo'])
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
use Storyfeed\FeedContext;
use Storyfeed\FeedLink;
use Storyfeed\FeedMedia;

class Photo extends Model implements Feedable
{
    use InteractsWithFeed;

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make(
            link: FeedLink::to(route('photos.show', $context->routeKey()))
                ->modal()
                ->attributes(['aria-label' => 'Open photo']),
        );
    }
}
```

:::

<FeedExample :items="[linked]" />

A link does not show a picture; see [Showing Pictures](#showing-pictures). A resolver can also
choose a [different link for each feed](/basics/named-feeds#linking-each-feed-somewhere-different).

### Opening Links in a Modal

`modal()` sets the entity's `link.modal` to `true`; the URL stays an ordinary
destination. `url($href)` is the short form of `link(FeedLink::to($href))`.

## Linking Files

A `Document` model describes its PDF with a
[`FileAttachment` body](/basics/activity-content#attaching-a-file) in
`toFeed()`. Use `files()` in `feedMedia()` to supply the link that opens the
document and the file to download:

::: code-group

```php [Fluent Syntax] memo="app/Models/Document.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;
use Storyfeed\FeedResource;

class Document extends Model implements Feedable
{
    use InteractsWithFeed;

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make()
            ->url(route('documents.show', $context->routeKey()))
            ->files(
                FeedResource::make()
                    ->href(route('documents.download', $context->routeKey()))
                    ->name($context->label())
                    ->mediaType('application/pdf')
            );
    }
}
```

```php [Named Arguments] memo="app/Models/Document.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;
use Storyfeed\FeedResource;

class Document extends Model implements Feedable
{
    use InteractsWithFeed;

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make(
            url: route('documents.show', $context->routeKey()),
            files: [
                FeedResource::make(
                    href: route('documents.download', $context->routeKey()),
                    mediaType: 'application/pdf',
                    name: $context->label(),
                ),
            ],
        );
    }
}
```

:::

<FeedExample :items="[file]" />

The entity link points to the document. The `files()` list adds resources to
`entity.media.files`; it does not create a body. Each call appends resources.
Activity Streams output carries them in its `attachment` property.

## Showing Pictures

`feedMedia()` resolves pictures into the entity's media. To show one in a
body, name its slot: declare an `Image` body in `toFeed()` with the model's
`feedMediaPreview()`, then supply the preview from `feedMedia()`:

::: code-group

```php [Fluent Syntax] memo="app/Models/Photo.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Image;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedImage;
use Storyfeed\FeedMedia;

class Photo extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
            ->label($this->name)
            ->body(
                Image::make($this->feedMediaPreview())
                    ->caption($this->subject)
                    ->alt($this->description)
            );
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make()
            ->url(route('photos.show', $context->routeKey()))
            ->preview(FeedImage::make()->src(route('photos.thumbnail', $context->routeKey())));
    }
}
```

```php [Named Arguments] memo="app/Models/Photo.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Image;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedImage;
use Storyfeed\FeedMedia;

class Photo extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: $this->name,
            body: Image::make(
                image: $this->feedMediaPreview(),
                caption: $this->subject,
                alt: $this->description,
            ),
        );
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make(
            url: route('photos.show', $context->routeKey()),
            preview: FeedImage::make(
                src: route('photos.thumbnail', $context->routeKey()),
            ),
        );
    }
}
```

:::

<FeedExample :items="[photo]" />

The caption belongs to the body. The body stores the slot's name, and the
picture is resolved each time the feed is read, so a changed thumbnail shows
on every row. `Image::make()` with no picture names the `preview` slot.
`MediaObject::image()` accepts the same values for a picture alongside its text.

The three slots retain their Activity Streams 2.0 names:

| Slot | Job | Model Method |
|---|---|---|
| `icon` | a small representation that identifies the entity, such as an avatar or logo | `feedMediaIcon()` |
| `preview` | a preview of the entity, such as a photograph's thumbnail or a page's link-card image | `feedMediaPreview()` |
| `image` | a larger picture of a non-image entity, such as a menu item | `feedMediaImage()` |

Each method is shorthand for `getFeedMedia()`, such as `getFeedMedia('icon')`.

The AS2 serializer emits these as `icon`, `preview`, and `image`. None is the
entity's link.

To retain image dimensions or a media type with the entity,
[store snapshot data in `toFeed()`](/reference/feedable#storing-snapshot-data).

### Adding Your Own Slots

For a picture the three slots do not describe, such as a chart of a menu
item's orders, name a slot of your own with `slot()`, and show it in a body
with `getFeedMedia()`:

::: code-group

```php [Fluent Syntax] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Image;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedImage;
use Storyfeed\FeedMedia;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
            ->label($this->name)
            ->body(Image::make($this->getFeedMedia('sparkline')));
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make()
            ->url(route('menu.show', $context->routeKey()))
            ->slot('sparkline', FeedImage::make()
                ->src(route('menu.sparkline', $context->routeKey()))
                ->width(120)
                ->height(24)
                ->alt('Orders this week'));
    }
}
```

```php [Named Arguments] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Image;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedImage;
use Storyfeed\FeedMedia;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: $this->name,
            body: Image::make(image: $this->getFeedMedia('sparkline')),
        );
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make(
            url: route('menu.show', $context->routeKey()),
        )->slot('sparkline', FeedImage::make(
            src: route('menu.sparkline', $context->routeKey()),
            width: 120,
            height: 24,
            alt: 'Orders this week',
        ));
    }
}
```

:::

<FeedExample :items="[charted]" />

A slot name is letters, digits, `_` and `-`, starting with a letter. The
built-in names `icon`, `preview` and `image` have their own methods. Custom
slots appear under `media.slots` in the payload and are left out of Activity
Streams output. Pass a generated SVG as a `data:` URL in `src`.

## Giving an Actor an Avatar

Any feedable model can be an actor. Its `icon` slot supplies the avatar when
it appears in that role, even if it is usually the object of an activity:

::: code-group

```php [Fluent Syntax] memo="app/Models/Photo.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedImage;
use Storyfeed\FeedMedia;

class Photo extends Model implements Feedable
{
    use InteractsWithFeed;

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make()
            ->url(route('photos.show', $context->routeKey()))
            ->icon(FeedImage::make()->src(route('photos.thumbnail', $context->routeKey())));
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
use Storyfeed\FeedImage;
use Storyfeed\FeedMedia;

class Photo extends Model implements Feedable
{
    use InteractsWithFeed;

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make(
            url: route('photos.show', $context->routeKey()),
            icon: FeedImage::make(
                src: route('photos.thumbnail', $context->routeKey()),
            ),
        );
    }
}
```

:::

<FeedExample :items="[actor]" rail="actor" />

An avatar needs no `Image` body.

### Showing Initials Instead of a Picture

A model without a picture, such as a team or a project, may give initials and
a disc colour instead. Store both values in `toFeed()` to read them from
`$context->data()`:

::: code-group

```php [Fluent Syntax] memo="app/Models/Team.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedMedia;

class Team extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
            ->label($this->name)
            ->data(['initials' => $this->initials, 'color' => $this->color]);
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make()
            ->url(route('teams.show', $context->routeKey()))
            ->initials($context->data('initials'))
            ->color($context->data('color'));
    }
}
```

```php [Named Arguments] memo="app/Models/Team.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedMedia;

class Team extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: $this->name,
            data: ['initials' => $this->initials, 'color' => $this->color],
        );
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make(
            url: route('teams.show', $context->routeKey()),
            initials: $context->data('initials'),
            color: $context->data('color'),
        );
    }
}
```

:::

<FeedExample :items="[lettered]" rail="actor" />

The colour is a hex value, such as `#438d98`. Without them, Storyfeed derives
initials from the label and a colour from the type and key. An entity with an
`icon` gets neither. See
[Storing Snapshot Data](/reference/feedable#storing-snapshot-data).

See the [Feedable API](/reference/feedable#feedmedia) for the complete method list.

For bodies built from current model values, see
[Resolving Bodies When Retrieved](/deeper/resolving-bodies). Link and image
resolvers can share the same `FeedMedia` with those bodies.
