# Usage examples

<script setup>
import { who, where, doc, note, entity, activity, group } from '../.vitepress/theme/samples'

const designer = who.ines
const reviewer = who.priya
const crackdown = where.passwordCrackdown
const report = doc.annualReportV3

const upload = activity({
  id: 'i1', verb: 'upload', glyph: 'file-up',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor uploaded :object to :target',
  actor: designer, object: report, target: crackdown,
})

const burst = group({
  id: 'i2', verb: 'upload', axis: 'repeat', count: 7, glyph: 'file-up',
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
  id: 'i7', verb: 'upload', axis: 'actors', count: 5, glyph: 'file-up',
  published_at: '2026-08-14T14:31:00.000000Z',
  headline_template: ':actors uploaded :count files to :target',
  actors: [who.ines, who.marcus, who.priya], targets: [crackdown],
  distinct: { actors: 5, objects: 5, targets: 1 },
})

const story = group({
  id: 'i8', verb: 'approve', axis: 'composite', count: 2, glyph: 'file-check',
  published_at: '2026-08-14T14:20:00.000000Z',
  headline_template: ':actor approved :count files in :context',
  actors: [who.tomas], contexts: [where.portMigration],
  objects: [doc.wordmarkV3, doc.heroMobileRevA],
  distinct: { actors: 1, objects: 2, contexts: 1 },
})

const external = activity({
  id: 'i9', verb: 'sync', glyph: 'refresh-cw',
  published_at: '2026-08-14T13:55:00.000000Z',
  headline_template: ':actor synced :object to :target',
  actor: entity('storyfeed.party', '1', 'Concur Web Service', null),
  object: doc.expenseReportQ3, target: crackdown,
})

const reply = activity({
  id: 'i3', verb: 'comment', glyph: 'message-circle',
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

Each call knows only its own activity. On the feed:

<FeedStream :items="[crowd]" :grouped="false" />

## A story you author yourself

A user approves two documents at once.

```php
// app/Http/Controllers/ApproveDocumentsController.php
public function store(Request $request, Project $project)
{
    $documents = $project->documents()
        ->whereIn('id', $request->array('documents'))
        ->get();

    // Two documents, one decision, one row.
    Storyfeed::activity()
        ->by($request->user())
        ->action('approve')
        ->objects($documents)
        ->context($project)
        ->publish();

    return back();
}
```

`objects()` takes several models for **one** activity. That is the difference
between this and the loop further up: seven `publish()` calls are seven
activities that a reader sees collapsed, while this is a single activity that
happens to name two documents. Approving two files in one click is one fact.

<FeedStream :items="[story]" :grouped="false" />

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

## Pick the word that reads true

Say the sentence out loud first. You comment **on** a document, share it
**with** someone, move it **into** a folder, upload it **to** a project, create
a project **for** a client. The code takes the same word:

```php
->by($user)->action('comment', $comment)->on($document)
->by($user)->action('share', $document)->with($teammate)
->by($user)->action('move', $document)->into($folder)
->by($user)->action('upload', $document)->to($project)
->by($user)->action('create', $project)->for($client)
```

**All five prepositions do exactly the same thing.** They set the last
participant, whose real name is the *target*. `on()`, `with()`, `into()`,
`to()`, `for()`, `in()` and `from()` are one method wearing seven words, so you
can write the line that matches what you would say.

Here is the first line with nothing dressed up. It stores a byte-identical row:

```php
->actor($user)->verb('comment', $comment)->target($document)
```

Neither is the correct one. Use whichever you would rather read in six months —
and if no preposition fits your verb, `target()` always does.

[Recording](/basics/recording) lists every role and every word for it.

## When the object brings its own body

Everything above is one call. This one is two places, and that is the point: the
activity records *what happened*, and the model says *what it looks like when
something reads it back*.

```php
Storyfeed::activity()
    ->by($user)
    ->action('comment', $comment)
    ->on($document)
    ->publish();
```

Nothing there mentions the comment's text. The text arrives because the comment
model answers for itself:

```php
// app/Models/Comment.php
public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        label: $this->body,
        component: 'Note',
        data: ['excerpt' => $this->body],
    );
}
```

`component` names a body component your renderer resolves; `data` is yours and
core never reads it. So the row below draws the comment without the recording
call having carried a word of it:

<FeedStream :items="[reply]" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

Worth knowing rather than doing on day one — a feed works without it, and every
other example on this page does.
