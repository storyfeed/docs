# Usage examples

Each example names a capability, describes the request in one sentence, and
shows the recording beside what it publishes — rendered by a real feed
component reading a real payload.

<script setup>
import { who, where, doc, note, entity, activity, group } from '../.vitepress/theme/samples'

const designer = who.ines
const reviewer = who.priya
const crackdown = where.passwordCrackdown
const report = doc.annualReportV3

const upload = activity({
  id: 'i1', verb: 'upload', icon: 'file-up',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor uploaded :object to :target',
  actor: designer, object: report, target: crackdown,
})

const burst = group({
  id: 'i2', verb: 'upload', axis: 'repeat', count: 7, icon: 'file-up',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor uploaded :count files to :target',
  actors: [designer], targets: [crackdown],
  objects: [
    report,
    doc.signagePlanRevB,
    doc.pricingTableFinal,
  ],
  distinct: { actors: 1, objects: 7, targets: 1 },
})

const crowd = group({
  id: 'i7', verb: 'upload', axis: 'actors', count: 5, icon: 'file-up',
  published_at: '2026-08-14T14:31:00.000000Z',
  headline_template: ':actors uploaded :count files to :target',
  actors: [who.ines, who.marcus, who.priya], targets: [crackdown],
  distinct: { actors: 5, objects: 5, targets: 1 },
})

const story = group({
  id: 'i8', verb: 'approve', axis: 'composite', count: 2, icon: 'file-check',
  published_at: '2026-08-14T14:20:00.000000Z',
  headline_template: ':actor approved :count files in :context',
  actors: [who.tomas], contexts: [where.portMigration],
  objects: [doc.wordmarkV3, doc.heroMobileRevA],
  distinct: { actors: 1, objects: 2, contexts: 1 },
})

const external = activity({
  id: 'i9', verb: 'sync', icon: 'refresh-cw',
  published_at: '2026-08-14T13:55:00.000000Z',
  headline_template: ':actor synced :object to :target',
  actor: entity('storyfeed.party', '1', 'Concur Web Service', null),
  object: doc.expenseReportQ3, target: crackdown,
})

const reply = activity({
  id: 'i3', verb: 'comment', icon: 'message-circle',
  published_at: '2026-08-14T14:28:00.000000Z',
  headline_template: ':actor commented on :target',
  actor: reviewer,
  object: note.overflow,
  target: report,
})

</script>

## Single activity

A user uploads a document to a project.

```php
Storyfeed::activity()
    ->by($user)
    ->action('upload', $document)
    ->to($project)
    ->publish();
```

<FeedStream :items="[upload]" :grouped="false" />

## Consecutive activities

The same user uploads seven documents to that project, one after another.

```php
foreach ($documents as $document) {
    Storyfeed::activity()
        ->by($user)
        ->action('upload', $document)
        ->to($project)
        ->publish();
}
```

<FeedStream :items="[burst]" :grouped="false" />

## Concurrent actions on the same project

Five users upload to the same project, each from their own request, minutes apart.
Nothing coordinates them.

```php
// Ines, 14:31
Storyfeed::activity()
    ->by($user)
    ->action('upload', $document)
    ->to($project)
    ->publish();
```

*a minute later, another request*

```php
// Marcus, 14:32
Storyfeed::activity()
    ->by($user)
    ->action('upload', $document)
    ->to($project)
    ->publish();
```

*three minutes later, another request*

```php
// Priya, 14:35
Storyfeed::activity()
    ->by($user)
    ->action('upload', $document)
    ->to($project)
    ->publish();
```

Each call knows only its own activity. The grouping is worked out as each one is
written, so the feed arrives already collapsed:

<FeedStream :items="[crowd]" :grouped="false" />

## A story you author yourself

A user approves two documents at once, and the two of them are one fact, not
two.

```php
Storyfeed::activity()
    ->by($user)
    ->action('approve')
    ->objects($documents)
    ->context($project)
    ->publish();
```

<FeedStream :items="[story]" :grouped="false" />

## An object that carries its own preview

A user comments on a document.

```php
Storyfeed::activity()
    ->by($user)
    ->action('comment', $comment)
    ->on($document)
    ->publish();
```

<FeedStream :items="[reply]" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

## A participant with no model

An external service pushes a document into a project, and it has no row in your
database to point at.

```php
Storyfeed::activity()
    ->by('Concur Web Service')
    ->action('sync', $document)
    ->to($project)
    ->publish();
```

<FeedStream :items="[external]" :grouped="false" />

## Whichever preposition the verb takes

The chain is the sentence, so the role setters have the prepositions English
actually uses. Every line below records the same thing — one activity, one actor,
one target:

```php
->by($user)->action('comment', $comment)->on($document)
->by($user)->action('share', $document)->with($teammate)
->by($user)->action('move', $document)->into($folder)
->by($user)->action('upload', $document)->to($project)
->by($user)->action('create', $project)->for($client)
```

Pick the one that reads true; the stored activity is identical either way. Each is
sugar for a role: `by()` is the actor, `action()` is the verb, and the rest are the
target. The long-hand — `actor()`, `verb()`, `object()`, `target()`, `context()` —
names the slots directly and is always there.
[Recording](/basics/recording) has the full set.
