# Recording activities

<script setup>
import { who, where, firm, activity } from '../.vitepress/theme/samples'

const created = activity({
  id: 'r1', verb: 'create', glyph: 'folder',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor created the project :object for :target',
  actor: who.ines, object: where.birdRemoval, target: firm.chirp,
})
</script>

An activity is a verb plus up to seven entity roles. The builder reads in the
order of the headline it produces:

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
| `context` | where it happened | the surrounding container |
| `origin` | where it came from | the source of an accepted invitation |
| `result` | what it produced | a diff record or generated artifact, including output too large for `data` |
| `instrument` | what it happened via | an integration used to import a record, or an agent a person acted through |

::: tip
`origin`, `result` and `instrument` are not in a tagged release. An install
pinned to v0.9.0 or earlier has the first four roles.
:::

Direction decides the role. The same integration is a `target` for an upload
**to** it and an `instrument` for a record sourced **via** it.
See [Containers & context](/deeper/context) for the surrounding container.

Each role has a setter named for it: `actor()`, `object()`, `target()`,
`context()`, `origin()`, `result()` and `instrument()`. `verb()` sets the verb.
Aliases let the call site read as the sentence:

| alias | sets | reads as |
|---|---|---|
| `->by()` | `actor` | who acted |
| `->action()` | `verb` | what they did |
| `->using()` | `instrument` | what they acted via |
| `->resulting()` | `result` | what they produced |
| `->to()` `->for()` `->on()` `->with()` `->into()` `->in()` `->from()` | `target` | what it was aimed at |

An alias and its setter record identical rows — pick whichever reads at your
call site. `context` is set only by `->context()`; note that `->in()` and
`->from()` predate the context role and set the **target**, not the container
and not a source. Use `->origin($source)` for the source.

Roles are set at publish and **never backfilled** — `storyfeed:rebuild` rebuilds
snapshots, `storyfeed:curate` re-selects axes, and neither can populate a role
that was never recorded.

For reading an entity's own page you usually want
[`involving()`](/basics/reading#scoping) rather than any single role — it spans
all seven roles.

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
Use [actorless voice](/deeper/parties#actorless-voice) when that activity should
read without an actor slot.

### The actor survives the queue

A listener that publishes is often queued, and `Auth::user()` on a worker is
null. Storyfeed captures the authenticated user's identity into Laravel's
[Context](https://laravel.com/docs/context) when the job payload is written, and
applies it on the worker — so an activity recorded from a queued listener names
the person who caused it, not nobody.

```php
class NotifyTeam implements ShouldQueue
{
    public function handle(DocumentUploaded $event): void
    {
        // Records the user who uploaded, though this runs minutes later
        // on a worker with no session.
        Storyfeed::record('upload', object: $event->document);
    }
}
```

Nothing you have configured changes. An explicit `->actor()` and
`->anonymously()` are both decided first, and your own `actor_resolver` or
`as()` scope keeps its authority. The transported identity speaks only where
nothing else has an opinion — and there it speaks *ahead of*
`parties.fallback`, because someone who is known should not be recorded as
"System" merely because the worker has no session.

Only a morph alias and a primary key travel, never the model, so the identity is
recorded even if that user has since been deleted. To opt a scope out:

```php
Context::addHidden(\Storyfeed\Support\QueuedActor::KEY, null);
```

## Extras

```php
Storyfeed::activity()
    ->action('upload', $document)
    ->data(['size' => $bytes])          // activity-level payload, arrives in the node
    ->publishedAt($importedAt)          // backdate (imports, backfills)
    ->publish();
```

`Storyfeed::record()` also accepts named `data:`, `publishedAt:`, `replace:`,
`objects:`, and `thread:` arguments. Story subclasses expose the same options
through `YourStory::record()`, without the verb argument. `thread:` accepts a
`Storyfeed\FeedThread`; use named arguments because the parameter order differs.

`->replace()` upserts instead of appending — publishing the same activity again
replaces the earlier row rather than duplicating it:

```php
Storyfeed::activity()->action('save', $draft)->replace()->publish();
```

### What `->replace()` matches on

**The object and the verb — `data` is not part of the key**, and the superseded
rows are soft-deleted by default. They disappear from normal feed reads but
remain in storage with `deleted_at` set. No cursor, read mode, or curated view
brings them back. `storyfeed:prune` permanently removes them when pruning is
enabled and they fall outside the retention window. Set
`storyfeed.replace.delete` to `'force'` to permanently delete them and their
grouping and participant rows inside the publish transaction. Participant rows
are removed in either mode; soft deletion keeps the grouping rows until pruning.

`->publishAndReplace()` is the same thing in one call; everything below applies
to it identically.

That makes one plausible-looking shape hide earlier transitions: a single `updateStatus` verb
carrying `data: ['from' => …, 'to' => …]` supersedes its *own* previous
transition, because every transition shares the same object and verb. Seven
states in, one line out, and the survivor is whichever fired last.

For a lifecycle, use **a verb per transition, and keep `->replace()`**:

```php
Storyfeed::activity()->action('order.confirmed', $order)->replace()->publish();
Storyfeed::activity()->action('order.cooking', $order)->replace()->publish();
Storyfeed::activity()->action('order.ready', $order)->replace()->publish();
```

Distinct verbs never collide, so each transition stays idempotent against itself
— a double-clicked button or a retried webhook still collapses — and inert
toward its neighbours. The narrative survives in full, and you keep the tooling:
[grammar](/deeper/grammar) templates and icons are registered per verb, and
`storyfeed:verbs` and doctor's `verbs` check key on the verb too. One verb for a
seven-state machine gives all of them one thing to say about seven facts.

### The qualification: lifecycles that cycle

"Distinct verbs never collide" holds while the lifecycle only moves **forward**.
It stops holding the moment an object can re-enter a state it has already been
in — a ticket closed, reopened and closed again; an order marked ready, cancelled
and made ready again; anything that can be un-done and re-done.

There, `order.ready` fires twice on the same object, and `->replace()` does
precisely what it promises: the second occurrence supersedes the first. The
collapse you wanted between a double-clicked button and its retry is the same
collapse you did not want between March and September. **The row survives; the
first time it happened does not.**

The key is the object and the verb, and a cycle repeats both. Nothing in the
package can tell the two cases apart, because from storage they are identical.

So the rule is narrower than it first reads:

- **Monotonic lifecycle** — each state entered at most once. Verb per
  transition, keep `->replace()`. This is most lifecycles.
- **Cycling lifecycle** — a state can recur, and each recurrence is a fact a
  reader would want. **Drop `->replace()`** and let the occurrences append.

Dropping it costs the idempotency: a retried webhook now writes a second row.
If that matters, guard at the boundary you already have — the transition itself
should be recording once, and a lifecycle that can cycle usually has a
transition record to hang that on.

If you are unsure which kind you have, ask whether *"this happened again"* is
information. For `save` on a draft it is not. For a reopened ticket it is the
most interesting thing on the row.

One verb plus `->replace()` is still the right answer where the past instances
are genuinely noise: `save` on a draft, `viewed`, a heartbeat, "location
updated". Latest-wins state, not a story anyone reads.

## Recording from the verb enum

If your verbs live in an enum using the `AsFeedVerb` trait, every case is a
builder:

```php
ActivityVerb::Comment->by($user)->object($comment)->to($project)->publish();
ActivityVerb::Confirm->publish($delivery);
```

See [Activity Types & Verbs](/basics/activity-types-and-verbs) for the enum setup.

## Collections

Pass `objects:` (or `->objects()`) to record one story about many objects — a
[composite](/deeper/composites):

```php
Storyfeed::record('upload', objects: $files, actor: $user, target: $project);
```
