# Recording activities

<script setup>
import { who, where, firm, activity } from '../.vitepress/theme/samples'

const created = activity({
  id: 'r1', verb: 'create', icon: 'folder',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor created the project :object for :target',
  actor: who.ines, object: where.birdRemoval, target: firm.chirp,
})
</script>

An activity is a verb plus up to four entities. The builder reads in the order of
the headline it produces:

```php
Storyfeed::activity()
    ->by($user)
    ->action('create', $project)
    ->for($client)
    ->publish();
```

<FeedStream :items="[created]" :grouped="false" />

The same thing in one line, when you have everything up front:

```php
Storyfeed::record('create', $project, actor: $user, target: $client);
```

Recording is always an explicit call — from an action, an observer, an event
listener. There is no model spying.

## Roles

| role | question it answers | example |
|---|---|---|
| `actor` | who did it | the user |
| `object` | what it was done to | the document |
| `target` | what the act was directed at | the project |

There is a fourth role, `context` — the container an activity happened inside.
Most apps don't need it; see [Containers & context](/deeper/context).

Each role has a setter named for it — `actor()`, `verb()`, `object()`,
`target()`, `context()` — and aliases so the call site reads as the sentence:

| alias | sets | reads as |
|---|---|---|
| `->by()` | `actor` | who acted |
| `->action()` | `verb` | what they did |
| `->to()` `->for()` `->on()` `->with()` `->into()` `->in()` `->from()` | `target` | what it was aimed at |

An alias and its setter record identical rows — pick whichever reads at your
call site. `context` is set only by `->context()`; note that `->in()` and
`->from()` predate the context role and set the **target**, not the container
and not a source.

Roles are set at publish and **never backfilled** — `storyfeed:rebuild` rebuilds
snapshots, `storyfeed:curate` re-selects axes, and neither can populate a role
that was never recorded.

For reading an entity's own page you usually want
[`involving()`](/basics/reading#scoping) rather than any single role — it spans
all four.

## The default actor

Omit `->actor()` and the authenticated user is used. To attribute activities
in a job or command, scope a block with `as()`:

```php
Storyfeed::as('System', function () {
    Storyfeed::record('sync', object: $invoice);
});
```

A string actor becomes a [party](/deeper/parties) — a named participant with no
model. An explicit `->actor()` inside the scope still wins, and the previous
resolver is always restored, even if the callback throws.

You can also set an app-wide `actor_resolver` in the config, or a
`parties.fallback` name for queue/console publishes. When nothing resolves, the
activity is published as anonymous — a null actor means genuinely unknown.

## Extras

```php
Storyfeed::activity()
    ->action('upload', $document)
    ->data(['size' => $bytes])          // activity-level payload, arrives in the node
    ->publishedAt($importedAt)          // backdate (imports, backfills)
    ->publish();
```

`->replace()` upserts instead of appending — publishing the same activity again
replaces the earlier row rather than duplicating it:

```php
Storyfeed::activity()->action('update', $document)->replace()->publish();
```

## Recording from the verb enum

If your verbs live in an enum using the `AsFeedVerb` trait, every case is a
builder:

```php
ActivityVerb::Comment->by($user)->object($comment)->to($project)->publish();
ActivityVerb::Confirm->publish($delivery);
```

See [Verbs](/basics/verbs) for the enum setup.

## Collections

Pass `objects:` (or `->objects()`) to record one story about many objects — a
[composite](/deeper/composites):

```php
Storyfeed::record('upload', objects: $files, actor: $user, target: $project);
```
