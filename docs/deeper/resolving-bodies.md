# Resolving Bodies When Retrieved

Resolve a body when its values must reflect the current model rather than the
stored snapshot. Use `FeedMedia::body()` in the model's `feedMedia()` method;
use [Activity Content](/basics/activity-content#adding-entity-bodies) for bodies
stored by `toFeed()`. [Feed Media](/basics/feed-media) covers links, files,
picture slots, and avatars.

<a id="resolving-a-body-when-the-feed-is-read"></a>

<a id="resolving-bodies-at-read-time"></a>

## Using Current Values

Return a body from `feedMedia()` to use the model's current values:

::: code-group

```php [Fluent Syntax] memo="app/Models/MenuItem.php"
use Storyfeed\Body\KeyValue;
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;

public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return FeedMedia::make()
        ->body(
            KeyValue::make()
                ->items('Portions left', $context->model()?->portions_left),
        );
}
```

```php [Named Arguments] memo="app/Models/MenuItem.php"
use Storyfeed\Body\KeyValue;
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;

public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return FeedMedia::make(
        body: KeyValue::make(
            items: ['Portions left' => $context->model()?->portions_left],
        ),
    );
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

See [Computed Values in the Feed](/cookbook/computed-values) for publication-time facts and counts computed on retrieval.

<a id="deferring-the-work"></a>

## Deferring Body Construction

The resolver runs whenever the feed is retrieved. Pass a closure to defer
building the body until the payload needs it:

::: code-group

```php [Fluent Syntax] memo="app/Models/MenuItem.php"
use Storyfeed\Body\KeyValue;
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;

public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return FeedMedia::make()->body(
        fn (): KeyValue => KeyValue::make()
            ->items('Portions left', $context->model()?->portions_left),
    );
}
```

```php [Named Arguments] memo="app/Models/MenuItem.php"
use Storyfeed\Body\KeyValue;
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;

public static function feedMedia(FeedContext $context): ?FeedMedia
{
    return FeedMedia::make(
        body: fn (): KeyValue => KeyValue::make(
            items: ['Portions left' => $context->model()?->portions_left],
        ),
    );
}
```

:::

Loading models takes one query per model class on the page. If the resolver
throws, Storyfeed reports the error once per class and omits that body. The
activity keeps its label, link, and other bodies. Use a closure when the body
needs current model data; bodies built from the snapshot can be passed directly.

<a id="data-available-to-resolvers"></a>

## Accessing Resolver Data

The resolver runs for every entity on the page. Use `$context->data()` for
the snapshot or `$context->model()` for the current model. The latter loads
all models of that class on the page together. Pass relations to
`$context->model(with: […])` to load them together too. A query such as
`$model->orders()->count()` runs once per entity, so use a counter column on
the model to avoid repeated queries.

