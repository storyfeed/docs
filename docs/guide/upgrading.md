# Upgrade Guide

For apps declaring headlines in provider registries, see
[Moving to the Feed File](/guide/moving-to-the-feed-file).

## Upgrading to 0.12.0

### Stored Discussion Data

Legacy `data.thread` and `data.$thread` values remain in `data` exactly as
stored. Core does not upgrade them, promote them to a top-level payload field,
or serialize them as Activity Streams `replies`.

Use an [`Excerpt` body](/basics/activity-content#adding-quoted-text) for quoted
words, or an [application body type](/deeper/body#writing-a-body-type) for
discussion content that needs its own fields and renderer.

## Upgrading to 0.11.0

### Keeping a Repeats-Only Feed

`live()` now returns curated winning groups across axes, with a repeat group
as the fallback for activities that have no winner. Previously, `live()`
returned repeats only. Apps that explicitly chose that mode can now show
object, target, or other groups after curation.

To keep a repeats-only `live()` feed, set this in `config/storyfeed.php`:

```php
'grouping' => [
    // Keep your other grouping settings here.
    'curate' => false,
],
```

This also ignores winners selected by earlier curation runs. With curation
on, an activity without a selected winner still falls back to its repeat
group; there is no requirement to backfill every winner before reading.

`summary()` now returns a digest grouped by actor and calendar period. If you
used it for curated winners, switch that query to `live()`. See
[Choosing a Read Mode](/deeper/aggregation#choosing-a-read-mode).
