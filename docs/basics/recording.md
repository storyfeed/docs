# Recording activities

An activity is a verb plus up to four entities. Record one in a single call:

```php
Storyfeed::record(ActivityVerb::Confirm, object: $delivery, actor: $user, target: $customer);
```

Or fluently, when you need to build conditionally:

```php
Storyfeed::activity(ActivityVerb::Confirm, $delivery)
    ->actor($user)
    ->target($customer)
    ->publish();
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

The fluent builder also has prepositional aliases that read naturally at the
call site — each is an alias for a role, not a new concept:

| alias | role |
|---|---|
| `->in($model)` / `->from($model)` | `context` |
| `->to($model)` / `->for($model)` | `target` |

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
Storyfeed::activity(ActivityVerb::Upload, $document)
    ->data(['size' => $bytes])          // activity-level payload, arrives in the node
    ->publishedAt($importedAt)          // backdate (imports, backfills)
    ->publish();
```

`->replace()` upserts instead of appending — publishing the same activity again
replaces the earlier row rather than duplicating it:

```php
Storyfeed::activity(ActivityVerb::Update, $document)->replace()->publish();
```

## Recording from the verb enum

If your verbs live in an enum using the `AsFeedVerb` trait, every case is a
builder:

```php
ActivityVerb::Comment->actor($user)->object($comment)->in($project)->publish();
ActivityVerb::Confirm->publish($delivery);
```

See [Verbs](/basics/verbs) for the enum setup.

## Collections

Pass `objects:` (or `->objects()`) to record one story about many objects — a
[composite](/deeper/composites):

```php
Storyfeed::record(ActivityVerb::Upload, objects: $files, actor: $user, target: $project);
```
