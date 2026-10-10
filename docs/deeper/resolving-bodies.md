# Resolving Bodies When Retrieved

A body built in `feedMedia()` shows the model’s current values instead of the
stored snapshot.

<a id="resolving-a-body-when-the-feed-is-read"></a>

<a id="resolving-bodies-at-read-time"></a>

## Using Current Values

Return a body from `feedMedia()` to use the model's current values:

::: code-group

```php [Fluent Syntax] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\KeyValue;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedMedia;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()->label($this->name);
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make()
            ->body(
                KeyValue::make()
                    ->items('Portions left', $context->model()?->portions_left),
            );
    }
}
```

```php [Named Arguments] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\KeyValue;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedMedia;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(label: $this->name);
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make(
            body: KeyValue::make(
                items: ['Portions left' => $context->model()?->portions_left],
            ),
        );
    }
}
```

:::

Stored and resolved bodies share the same payload shape. When `toFeed()` and `feedMedia()` both return bodies, the item includes both,
with stored bodies first. Your renderer controls the layout.

<a id="stored-and-resolved-bodies"></a>

## Choosing Stored or Current Values

Choose when a value is decided:

| Method | When It Runs | Value |
|---|---|---|
| `->data(…)` on the activity | when the activity is published | frozen at publication |
| `->body(…)` on `FeedEntity` in `toFeed()` | whenever the model is saved | stored and updated with the model |
| `->body(…)` on `FeedMedia` in `feedMedia()` | whenever the feed is retrieved | built from current values and never stored |

See [Computed Values in the Feed](/cookbook/computed-values) for a count computed on retrieval.

<a id="deferring-the-work"></a>

## Deferring Body Construction

The resolver runs whenever the feed is retrieved. Pass a closure to defer
building the body until the payload needs it:

::: code-group

```php [Fluent Syntax] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\KeyValue;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedMedia;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()->label($this->name);
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make()->body(
            fn (): KeyValue => KeyValue::make()
                ->items('Portions left', $context->model()?->portions_left),
        );
    }
}
```

```php [Named Arguments] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\KeyValue;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedMedia;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(label: $this->name);
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make(
            body: fn (): KeyValue => KeyValue::make(
                items: ['Portions left' => $context->model()?->portions_left],
            ),
        );
    }
}
```

:::

Loading models takes one query per model class on the page. Use a closure
when the body needs current model data; bodies built from the snapshot can be
passed directly.

Storyfeed reports a thrown exception once per model class:

| What Throws | What the Entity Loses |
|---|---|
| a deferred body closure | that body only; the entity keeps its label, link and other bodies |
| `feedMedia()` itself | everything `feedMedia()` returns: its bodies, links and pictures |

<a id="data-available-to-resolvers"></a>

## Accessing Resolver Data

The resolver runs for every entity on the page. Use `$context->data()` for
the snapshot or `$context->model()` for the current model. The latter loads
all models of that class on the page together. Pass relations to
`$context->model(with: […])` to load them together too. A query such as
`$model->orders()->count()` runs once per entity. Pass `withCount:` instead to
count for every model of the class in one query:

```php memo="app/Models/MenuItem.php" at="feedMedia()"
$orders = $context->model(withCount: ['orders'])?->orders_count;
```

See [Activity Content](/basics/activity-content#adding-entity-bodies) for stored
bodies and [Feed Media](/basics/feed-media) for links, files, pictures and avatars.
