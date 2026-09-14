# Recording Activities

An activity is a verb plus the entities in its roles. Recording one is an
explicit call from wherever the fact happens: an action, an observer, an event
listener. When you are done, each fact your app cares about is one call that
reads like the sentence it produces.

<script setup>
import { who, where, firm, doc, entity, activity } from '../.vitepress/theme/samples'

const created = activity({
  id: 'r1', verb: 'create', glyph: 'folder',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor created the project :object for :target',
  actor: who.designer, object: where.created, target: firm.main,
})

const system = entity('party', 'system', 'System', null)

const synced = activity({
  id: 'r2', verb: 'sync', glyph: 'activity',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor synced :object',
  actor: system, object: doc.expenses,
})

const saved = activity({
  id: 'r3', verb: 'save', glyph: 'file-pen',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor saved :object',
  actor: who.lead, object: doc.wireframes,
})
</script>

## The Builder

The builder reads in the order of the headline it produces:

```php
Storyfeed::activity()
    ->by($user)
    ->action('create', $project)
    ->for($client)
    ->publish();
```

<FeedStream :items="[created]" :grouped="false" />

The same activity in one call, when everything is in hand:

```php
Storyfeed::record('create', $project, actor: $user, target: $client);
```

## Roles

| Role | Question It Answers | Example |
|---|---|---|
| `actor` | who did it | the user |
| `object` | what it was done to | the document |
| `target` | what the act was directed at | the project |
| `context` | where it happened | the surrounding container |
| `origin` | where it came from | the source of an accepted invitation |
| `result` | what it produced | a diff record or a generated artifact |
| `instrument` | what it happened via | an integration used to import a record |

::: tip
`origin`, `result` and `instrument` are not in a tagged release. An install
pinned to v0.9.0 or earlier has the first four roles.
:::

Direction decides the role. The same integration is a `target` for an upload
**to** it and an `instrument` for a record sourced **via** it.

## Reading as a Sentence

Each role has a setter named for it: `actor()`, `object()`, `target()`,
`context()`, `origin()`, `result()` and `instrument()`; `verb()` sets the verb.
Aliases let the call site read as the sentence:

| Alias | Sets | Reads As |
|---|---|---|
| `->by()` | `actor` | who acted |
| `->action()` | `verb` and `object` | what they did, to what |
| `->using()` | `instrument` | what they acted via |
| `->resulting()` | `result` | what they produced |
| `->to()` `->for()` `->on()` `->with()` `->into()` `->in()` `->from()` | `target` | what it was aimed at |

An alias and its setter record identical rows. `context` is set only by
`->context()`; `->in()` and `->from()` set the target, not the container.

## The Actor

Omit the actor and the authenticated user is recorded. In a job or a command
there is no authenticated user, so name one for the block:

```php
Storyfeed::as('System', function () {
    Storyfeed::record('sync', object: $invoice);
});
```

<FeedStream :items="[synced]" :grouped="false" />

A string actor is a [party](/deeper/parties): a named participant with no
model. When nothing names an actor the activity is published with none, which
means the actor is genuinely unknown.

## Extra Data and Backdating

```php
Storyfeed::activity()
    ->action('upload', $document)
    ->data(['size' => $bytes])      // activity-level payload, arrives in the node
    ->publishedAt($importedAt)      // backdate: imports, backfills
    ->publish();
```

`Storyfeed::record()` takes the same as named arguments: `data:`,
`publishedAt:`, `replace:`, `objects:` and `thread:`.

## Replacing Instead of Appending

A draft saved five times is one fact, not five. `->replace()` supersedes the
earlier row with the same object and verb:

```php
Storyfeed::activity()->action('save', $draft)->replace()->publish();

// a minute later, another request
Storyfeed::activity()->action('save', $draft)->replace()->publish();
```

<FeedStream :items="[saved]" :grouped="false" />

The key is the object and the verb; `data` is not part of it. Which verbs
should replace and which should append is worked through in
[Repeating Activities](/cookbook/repeating-activities).

## Recording from an Enum

If your verbs live in an enum using the `AsFeedVerb` trait, every case is a
builder:

```php
ActivityVerb::Comment->by($user)->object($comment)->to($project)->publish();
ActivityVerb::Confirm->publish($delivery);
```

The enum is set up in [Activity Types & Verbs](/basics/activity-types-and-verbs).

## Recording Many Objects at Once

Pass `objects:` (or `->objects()`) to record one activity about many objects:

```php
Storyfeed::record('upload', objects: $files, actor: $user, target: $project);
```

[Composites](/deeper/composites) covers how that activity reads and groups.
