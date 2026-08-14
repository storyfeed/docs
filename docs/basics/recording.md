# Recording activities

An activity is a verb plus up to four entities. The builder reads in the order of
the headline it produces:

```php
// Sally confirmed Delivery #1042 for Acme Co.
Storyfeed::activity()
    ->actor($user)
    ->verb('confirm', $delivery)
    ->to($customer)
    ->publish();
```

The same thing in one line, when you have everything up front:

```php
Storyfeed::record('confirm', $delivery, actor: $user, target: $customer);
```

Recording is always an explicit call — from an action, an observer, an event
listener. There is no model spying.

## Roles

| role | question it answers | example |
|---|---|---|
| `actor` | who did it | the user |
| `object` | what it was done to | the document |
| `target` | where it landed | the project |
| `context` | the surrounding scope | the workspace |

The builder has prepositional aliases for reading naturally at the call site:

| alias | sets |
|---|---|
| `->to()` `->for()` `->in()` `->from()` | `target` |

All four are the same setter — pick whichever reads at your call site. `context`
is set only by `->context()`.

**Target or context?** `target` is what the act was directed at ("commented on
the task"); `context` is the container it happened inside (the project, the
workspace, the tenant). They coexist: one comment can have a task as its target
and a project as its context.

Two consequences worth knowing before you choose:

- **Set `context` whenever there is a plausible container.** It is what
  `feed()->context($project)` filters on and what context-pinned
  [axes](/deeper/aggregation#custom-axes) group by.
- **Roles are set at publish and never backfilled.** `storyfeed:rebuild`
  rebuilds snapshots and `storyfeed:curate` re-selects axes; neither can
  populate a role that was never recorded. Adding a context later means
  rewriting rows.

For reading an entity's own page you usually want
[`involving()`](/basics/reading#scoping) rather than either role — it spans all
four.

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
    ->verb('upload', $document)
    ->data(['size' => $bytes])          // activity-level payload, arrives in the node
    ->publishedAt($importedAt)          // backdate (imports, backfills)
    ->publish();
```

`->replace()` upserts instead of appending — publishing the same activity again
replaces the earlier row rather than duplicating it:

```php
Storyfeed::activity()->verb('update', $document)->replace()->publish();
```

## Recording from the verb enum

If your verbs live in an enum using the `AsFeedVerb` trait, every case is a
builder:

```php
ActivityVerb::Comment->actor($user)->object($comment)->to($project)->publish();
ActivityVerb::Confirm->publish($delivery);
```

See [Verbs](/basics/verbs) for the enum setup.

## Collections

Pass `objects:` (or `->objects()`) to record one story about many objects — a
[composite](/deeper/composites):

```php
Storyfeed::record('upload', objects: $files, actor: $user, target: $project);
```
