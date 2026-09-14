# Repeating Activities

Keep every occurrence in a timeline, or retain only the latest occurrence of
a verb on an object. Choose what the reader needs to revisit.

<script setup>
import { who, where, doc, activity } from '../.vitepress/theme/samples'

const on = (id, verb, glyph, at, object, template) => activity({ id, verb, glyph,
  published_at: at, headline_template: template, actor: who.lead, object, target: where.main })

const renamedTwice = [
  on('rp1', 'rename', 'file-pen', '2026-08-14T14:32:00.000000Z', doc.wireframes, ':actor renamed :object'),
  on('rp2', 'upload', 'file-up', '2026-08-14T14:20:00.000000Z', doc.wireframes, ':actor uploaded :object'),
]

const timeline = [
  on('rp3', 'submit', 'file-check', '2026-08-14T14:40:00.000000Z', doc.report, ':actor submitted :object'),
  on('rp4', 'approve', 'circle-check', '2026-08-14T14:30:00.000000Z', doc.report, ':actor approved :object'),
  on('rp5', 'submit', 'file-check', '2026-08-14T14:20:00.000000Z', doc.report, ':actor submitted :object'),
]

const pulse = [timeline[0], timeline[1]]
</script>

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()->by($user)->action('rename', $document)->replace()->publish();   // replaces the earlier rename row
Storyfeed::activity()->by($user)->action('upload', $document)->publish();              // every upload is its own row
```

After one upload and two renames:

<FeedStream :items="renamedTwice" :grouped="false" />

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::verbs([
    'rename' => ActivityType::Update,
    'upload' => ActivityType::Add,
    'submit' => ActivityType::Offer,
    'approve' => ActivityType::Accept,
]);

Storyfeed::grammar([
    'document.rename' => ':actor renamed :object',
    'document.upload' => ':actor uploaded :object',
    'document.submit' => ':actor submitted :object',
    'document.approve' => ':actor approved :object',
]);
```

## Which Verbs Replace

| Decision | Question | Consequence |
|---|---|---|
| occurrence | is this a retry of the same fact, or a new act? | a second submission after reopening is a new occurrence |
| identity | should all occurrences share one object/verb pair? | `replace()` matches object type, object id, and verb; actor, target, context, and `data` do not distinguish occurrences |
| retention | does this feed need every occurrence? | append for a full timeline; replace only when earlier occurrences may leave the feed |

A rename can be a second fact worth retaining. An upload that happens once
per object can use replacement to make replay leave one visible row. The
verb's shape alone does not decide either policy.

Replacement publishes a new row and retires earlier matches. It requires an
object id. It does not detect retries or preserve the original row's id and
time. An append-only publisher needs its own durable occurrence identity and
retry guard if delivery can repeat.

## A Full Timeline Beside a Latest-state Pulse

The document is submitted, approved, reopened, and submitted again. These are
two alternative recording policies for the same sequence:

| Request | Full Timeline | Latest-state Pulse, per Verb |
|---|---|---|
| first submission | append `submit` | replace `submit` |
| approval | append `approve` | replace `approve` |
| submission after reopening | append another `submit` | replace the earlier `submit` |
| visible rows afterward | first submit, approve, second submit | approve, second submit |

For the full timeline, each transition request runs this with its verb:

```php
// $verb is 'submit' or 'approve'; the app guards retries by occurrence id.
Storyfeed::activity()->by($user)->action($verb, $document)->publish();

$timeline = Storyfeed::feed()->involving($document)->log()->get();
```

<FeedStream :items="timeline" :grouped="false" />

For the pulse, each transition request instead runs:

```php
// Deliberately retain only the latest occurrence of EACH verb on this document.
Storyfeed::activity()->by($user)->action($verb, $document)->replace()->publish();

$pulse = Storyfeed::feed()->involving($document)->live()->get();
```

<FeedStream :items="pulse" :grouped="false" />

The pulse keeps the latest approval as well as the latest submission; it is
not a single current-status row. The second submission is new news, even
though this policy removes the first from the feed.

Replacement affects stored activities, not just one reader. Reading `log()`
after replacement cannot recover the full timeline. If both surfaces need to
coexist, retain the complete history separately or build the pulse from the
retained occurrences without replacing them. Superseded rows are soft-deleted
by default; `storyfeed.replace.delete = 'force'` hard-deletes them. See
[Repeating Activities](/cookbook/repeating-activities#what-replace-matches-on).

## A Save-shaped Verb That Is Not Published at All

A save that changes nothing a reader would notice has no row, replaced or
otherwise. See [Choosing when to publish](/cookbook/choosing-when-to-publish).

## What `->replace()` Matches On

The object and the verb. `data` is not part of the key, so a single
`status.changed` verb carrying `data: ['from' => …, 'to' => …]` supersedes its
own previous transition: seven states in, one row out. A verb per transition
keeps each one idempotent against itself and inert toward its neighbours.

The superseded rows are soft-deleted by default. They leave every feed read
but stay in storage with `deleted_at` set until `storyfeed:prune` removes them.
Set `storyfeed.replace.delete` to `'force'` to delete them, with their grouping
and participant rows, inside the publish transaction. Participant rows go in
either mode.

`->publishAndReplace()` is `->replace()->publish()` in one call.
