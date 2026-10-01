# Upgrade Guide

## Upgrading to 0.12.0

### Stored Discussion Data

Legacy `data.thread` and `data.$thread` values remain in `data` exactly as
stored. Core does not upgrade them, promote them to a top-level payload field,
or serialize them as Activity Streams `replies`.

Use an [`Excerpt` body](/basics/activity-content#adding-quoted-text) for quoted
words, or an [application body type](/deeper/body#writing-a-body-type) for
discussion content that needs its own fields and renderer.
