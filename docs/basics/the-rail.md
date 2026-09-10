# The rail

The rail is the column at the left of every row. It answers one question first —
*who did it*, or *what happened* — and which one it answers is a setting.

```php
// config/storyfeed-filament.php
'rail' => 'activity',
```

One surface departing from the app-wide posture says so itself:

```php
FeedTimeline::make('activity')->rail('activity');
```

## The four configurations

The rail has two slots. A **primary** — the disc — and a **secondary**, the
badge on its lower corner. Each holds the actor, the activity, or nothing, and
the two never hold the same thing.

<script setup>
import { who, where, doc, note, activity } from '../.vitepress/theme/samples'

const history = [
  activity({
    id: 'r1', verb: 'approve', glyph: 'circle-check',
    published_at: '2026-08-14T14:40:00.000000Z',
    headline_template: ':actor approved :object',
    actor: who.marcus, object: doc.annualReportV3,
  }),
  activity({
    id: 'r2', verb: 'submit', glyph: 'file-check',
    published_at: '2026-08-14T14:20:00.000000Z',
    headline_template: ':actor submitted :object to :target',
    actor: who.ines, object: doc.annualReportV3, target: where.passwordCrackdown,
  }),
  activity({
    id: 'r3', verb: 'comment', glyph: 'message-circle',
    published_at: '2026-08-14T13:05:00.000000Z',
    headline_template: ':actor commented on :object',
    actor: who.bob, object: doc.annualReportV3,
  }),
]
</script>

<div class="sf-rail-cases">
  <div>
    <h4><code>actor</code></h4>
    <FeedStream :items="history" :grouped="false" rail="actor" />
  </div>
  <div>
    <h4><code>activity</code></h4>
    <FeedStream :items="history" :grouped="false" rail="activity" />
  </div>
  <div>
    <h4><code>activity-only</code></h4>
    <FeedStream :items="history" :grouped="false" rail="activity-only" />
  </div>
  <div>
    <h4><code>actor-only</code></h4>
    <FeedStream :items="history" :grouped="false" rail="actor-only" />
  </div>
</div>

| configuration | primary | secondary | suits |
|---|---|---|---|
| `actor` | actor | activity | the default — an unscoped feed: a dashboard, a hub, a home page |
| `activity` | activity | actor | a feed scoped to one record — an order, a document, an approval chain |
| `activity-only` | activity | none | a feed whose actor is effectively constant — one person's own history, an import log |
| `actor-only` | actor | none | a feed with no useful glyph — a comment thread, a single-verb feed |

A value that is not one of the four throws where it is configured. Nothing here
reaches a colour, a size or a shape: the disc is the same disc in every
configuration, and the choice is which fact occupies it.

## Choosing one

> Flip when the feed already has a subject.

A document's history is scoped to one document. The reader knows the subject
before they start, so the varying fact is what happened and the activity is what
they scan for — `activity`. A dashboard has no subject, and the actor is how a
reader orients in it — `actor`, which is why `actor` is the default.

Dense rows drop the badge and keep the disc. Under `actor` that lands on
`actor-only` and under `activity` on `activity-only`, so a group's members read
as the same sentence about the same subject as the group above them.

::: tip
A disc whose subject is missing falls back to the other one. An
[anonymous actor](/deeper/parties#actorless-voice) on an `actor` rail draws its
glyph rather than an empty circle, and a row with neither draws a plain mark —
activities are never withheld because part of one is missing.
:::

## The glyph's intent

Two of the discs above are coloured. That is `glyph_intent`, a nullable sibling
of `glyph` on every node:

```json
{
  "verb": "approve",
  "glyph": "circle-check",
  "glyph_intent": "success"
}
```

`glyph` names a shape; `glyph_intent` says what it means. On an `actor` rail the
glyph is a 14px badge and a shape is enough. On an `activity` rail it is the
2rem disc, and a feed whose verbs cluster draws a column of identical discs
without one.

Register intents the way you register icons — keyed `type.verb`, wildcards
allowed, resolved most-specific first:

```php
Storyfeed::glyphIntents([
    '*.approve' => 'success',   // the app's own word, not the package's
    '*.submit'  => 'pending',
    '*.expire'  => 'danger',
]);
```

Or on a story class:

```php
public function intent(): ?string
{
    return 'success';
}
```

The value is **your** string. Storyfeed ships no vocabulary of intents and no
colours: `success` is not a term the package knows, ranks or validates, exactly
as `circle-check` is not an icon it ships. The three words above are this
documentation's own, and the renderer maps them onto three colours it owns —
`success`, `pending` and `danger` are what these examples chose to say, not a
list to conform to.

Intents resolve on their own registry, so a wildcard is stated once:

| key | matches |
|---|---|
| `document.approve` | that verb on that object type |
| `document.*` | every verb on that object type |
| `*.approve` | that verb on any object type |
| `*.*` | everything with no more specific entry |

Most verbs have no intent, and that is the common case. An upload is not a
success or a failure, so `glyph_intent` is `null` and the disc renders plain —
which is what every node carries until an app registers its first intent.

A renderer that meets an intent it has no colour for renders the plain disc.
Unknown strings are passed through, never dropped, so an app can add a word
without waiting for a renderer to learn it.
