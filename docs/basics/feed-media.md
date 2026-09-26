# Feed Media

<script setup>
import { scene } from '../.vitepress/theme/world'
const photo = scene.basics.activityContent.photo
const linked = { ...photo, object: { ...photo.object, modal: true, body: null } }
const file = { ...photo, verb: 'upload', headline_template: ':actor uploaded :object', headline: null, target: null, object: { ...photo.object, type: 'document', label: 'Signed Agreement.pdf',
  url: '/documents/signed-agreement', media: null,
  body: [{ $body: 'Storyfeed/Body/FileAttachment', $v: 1, name: 'Signed Agreement.pdf', size: 48213, mediaType: 'application/pdf' }] } }
const actor = { ...scene.order, actor: { ...photo.object, body: null,
  media: { ...photo.object.media, icon: photo.object.media.preview } } }
</script>

## Introduction

A model's `toFeed()` method describes what is stored. Its static `feedMedia()`
method resolves links and media when a feed is retrieved. This keeps URLs out
of stored picture bodies, so changing a route or thumbnail does not require
rewriting those bodies.

The method receives a `FeedContext` containing the snapshot's label, route key,
and data. Return a `FeedMedia`, or `null` when there is no media to resolve.
With `InteractsWithFeed`, you may instead register a typed closure in `booted()`:

```php memo="app/Models/Photo.php" at="booted()"
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;

static::feedMediaUsing(
    fn (FeedContext $context, FeedMedia $media): FeedMedia => $media
        ->url(route('photos.show', $context->routeKey())),
);
```

A model's own `feedMedia()` method takes precedence over the registered closure.
A closure may also return a URL string or `null`. Without either resolver,
the trait returns `null`.

## Linking to the Model

Use `url()` for the destination of the entity's name in the headline. Use
`modal()` to hint that the renderer should open it in place, and `attributes()`
for link attributes:

```php memo="app/Models/Photo.php"
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;

public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return FeedMedia::make()
        ->url(route('photos.show', $context->routeKey()))
        ->modal()
        ->attributes(['aria-label' => 'Open photo']);
}
```

<FeedExample :items="[linked]" />

The photo's name is linked, but no picture appears. The URL may lead to a show
page or a modal; it is never assumed to be an image source. Modal behaviour and
supported attributes depend on the renderer. A resolver can also choose a
[different link for each feed](/basics/named-feeds#linking-each-feed-somewhere-different).

## Linking Files

Use a `FileAttachment` body to describe a PDF and the entity URL to open it:

```php memo="app/Models/Document.php" at="toFeed()"
use Storyfeed\Body\FileAttachment;
use Storyfeed\FeedEntity;

return FeedEntity::make()
    ->label($this->name)
    ->body(FileAttachment::make()->size($this->bytes)->mediaType('application/pdf'));
```

```php memo="app/Models/Document.php" at="booted()"
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;
use Storyfeed\FeedResource;

static::feedMediaUsing(
    fn (FeedContext $context, FeedMedia $media): FeedMedia => $media
        ->url(route('documents.show', $context->routeKey()))
        ->files(
            FeedResource::make()
                ->href(route('documents.download', $context->routeKey()))
                ->name($context->label())
                ->mediaType('application/pdf')
        ),
);
```

<FeedExample :items="[file]" />

The body shows the file's size and type, and the entity link opens the document.
The `files()` list exposes additional resources as `entity.media.files`; it does
not create a body or display files automatically. Each call appends resources.
Activity Streams output carries them in its `attachment` property.

## Showing Pictures

A picture appears only when a body names it. Declare an `Image` body in
`toFeed()`, then supply the named slot from `feedMedia()`:

```php memo="app/Models/Photo.php" at="toFeed()"
use Storyfeed\Body\Image;
use Storyfeed\FeedEntity;

return FeedEntity::make()
    ->label($this->name)
    ->body(Image::make()->caption($this->subject)->alt($this->description)->withPreview());
```

```php memo="app/Models/Photo.php" at="booted()"
use Storyfeed\FeedContext;
use Storyfeed\FeedImage;
use Storyfeed\FeedMedia;

static::feedMediaUsing(
    fn (FeedContext $context, FeedMedia $media): FeedMedia => $media
        ->url(route('photos.show', $context->routeKey()))
        ->preview(FeedImage::make()->src(route('photos.thumbnail', $context->routeKey()))),
);
```

<FeedExample :items="[photo]" />

The caption belongs to the body. The picture's location is resolved when the
feed is read. An empty slot draws nothing. An Image body defaults to `preview`;
`withIcon()`, `withPreview()`, and `withImage()` explicitly name one slot.
`MediaObject` offers the same methods for a picture alongside its text.

The three slots retain their Activity Streams 2.0 names:

| Slot | Job | Body Method |
|---|---|---|
| `icon` | a small representation that identifies the entity, such as an avatar or logo | `withIcon()` |
| `preview` | a preview of the entity, such as a photograph's thumbnail or a page's link-card image | `withPreview()` |
| `image` | a larger picture of a non-image entity, such as a menu item | `withImage()` |

The AS2 serializer emits these as `icon`, `preview`, and `image`. None is the
entity's link. Collapsed groups sample their members' Image bodies; members
without one contribute no picture tile.

## Giving an Actor an Avatar

Any feedable model can be an actor. Its `icon` slot supplies the avatar when
it appears in that role, even if it is usually the object of an activity:

```php memo="app/Models/Photo.php" at="booted()"
use Storyfeed\FeedContext;
use Storyfeed\FeedImage;
use Storyfeed\FeedMedia;

static::feedMediaUsing(
    fn (FeedContext $context, FeedMedia $media): FeedMedia => $media
        ->url(route('photos.show', $context->routeKey()))
        ->icon(FeedImage::make()->src(route('photos.thumbnail', $context->routeKey()))),
);
```

<FeedExample :items="[actor]" rail="actor" />

The actor badge may show the icon without an Image body. This is the exception
to body-driven pictures: avatars identify participants in the headline.
See the [Feedable API](/reference/feedable#feedmedia) for the complete method list.
