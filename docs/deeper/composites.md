# Composites

A composite is one authored story whose object is a **collection** — "Tomás
uploaded 6 files to Spring Campaign" as a single activity, not six grouped ones.

## Explicit

```php
Storyfeed::activity()
    ->actor($user)
    ->verb('upload')
    ->objects($files)
    ->to($project)
    ->publish();
```

This writes a parent activity plus its atomic members. In `log()` the members
appear as an ordinary timeline; in aggregated modes the parent arrives as one
node with `axis: 'composite'`. Serialized to
[Activity Streams 2.0](/deeper/activity-streams), the object is an
`OrderedCollection`.

## Automatic

Mark a model `Collectable` and runs of it bundle themselves:

```php
use Storyfeed\Contracts\Collectable;

class Document extends Model implements Feedable, Collectable
{
    // …
}
```

```php
Storyfeed::collectables(['document']);
```

```php
'composite' => [
    'auto' => true,
    'min_objects' => 2,   // smallest distinct object count that mints a story
],
```

Bundling happens when the actor's **batch** closes. Singles stay atomic.

## Batches

A batch is a burst of activity by one actor, inferred by a sliding quiet
window — recorded automatically, invisible to your recording code.

```php
'batch' => [
    'enabled' => true,
    'quiet_minutes' => 10,
],
```

A stale batch closes lazily at that actor's next publish. Schedule the command
so it closes promptly instead:

```php
Schedule::command('storyfeed:close-batches')->everyFiveMinutes();
```

Closing fires `BatchClosed`, which is the hook for digest emails and
notification batching. Batches never group the feed directly — they mint
composites at close.

::: tip
Composites are bursts by construction, so a composite's span is minutes. This
is the mechanism that turns "10 upload rows" into one readable story.
:::

## Grammar for composites

Two registries, both required — see
[Grammar](/deeper/grammar#composite-parents-need-verb):

```php
Storyfeed::aggregateGrammar(['composite.upload' => ':actor uploaded :count files to :target']);
Storyfeed::grammar(['*.upload' => ':actor uploaded files to :target']);
```

The parent has no object of its own, so it resolves through `*.{verb}`.

## Backfilling

Adopting `Collectable` affects future activity only. To bundle history:

```bash
php artisan storyfeed:bundle
php artisan storyfeed:bundle --window=30
```

Idempotent, day-partitioned, and it knowingly reshuffles settled days — run it
when readers aren't mid-scroll. A feed that was born composited mints zero.
