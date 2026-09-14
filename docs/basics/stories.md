# Story Classes

A Story is the blueprint for one type of activity: its verb, its headline, its
icon and how it groups, in one class. Publishing through it produces the
activity. When you are done, each activity type your app records has one class
that says everything about it.

<script setup>
import { who, where, doc, note, firm, job, activity, group } from '../.vitepress/theme/samples'

const at = '2026-08-14T14:30:00.000000Z'

const uploaded = activity({ id: 's1', verb: 'upload',
  published_at: at,
  headline_template: ':actor uploaded :object to :target',
  actor: who.ines, object: doc.annualReportV3, target: where.passwordCrackdown })

const uploadedWithIcon = activity({ ...uploaded, id: 's2', glyph: 'file-up' })

const grouped = group({ id: 's3', verb: 'upload', axis: 'repeat', count: 3, glyph: 'file-up',
  published_at: at,
  headline_template: ':actor uploaded :count files to :target',
  actors: [who.ines], targets: [where.passwordCrackdown],
  objects: [doc.annualReportV3, doc.signagePlanRevB, doc.pricingTableFinal],
  distinct: { actors: 1, objects: 3, targets: 1 } })

const examples = [
  activity({ id: 's4', verb: 'comment', glyph: 'message-circle',
    published_at: '2026-08-14T14:28:00.000000Z',
    headline_template: ':actor commented on :target',
    actor: who.priya, object: note.overflow, target: doc.annualReportV3 }),
  activity({ id: 's5', verb: 'complete', glyph: 'square-check',
    published_at: '2026-08-14T14:25:00.000000Z',
    headline_template: ':actor completed :object',
    actor: who.marcus, object: job.simplifyWordmark }),
  activity({ id: 's6', verb: 'create', glyph: 'folder',
    published_at: '2026-08-14T14:20:00.000000Z',
    headline_template: ':actor created the project :object for :target',
    actor: who.ines, object: where.birdRemoval, target: firm.chirp }),
]
</script>

## Writing a Story

The verb and the headline it renders with, in one class:

```php
use App\Models\Document;
use Storyfeed\Contracts\FeedVerb;
use Storyfeed\Story;

class DocumentWasUploaded extends Story
{
    public string|array|null $objectType = Document::class;

    public string|FeedVerb|BackedEnum|null $verb = 'upload';

    public function headline(): string
    {
        return ':actor uploaded :object to :target';
    }
}
```

Publish through it and the activity arrives with its headline:

```php
DocumentWasUploaded::activity($document)
    ->by($user)
    ->to($project)
    ->publish();
```

<FeedStream :items="[uploaded]" :grouped="false" />

The tokens name roles, never models: `:actor`, `:object`, `:target`,
`:context`. Each becomes the label of the entity in that role.

## Generating and Registering

```bash
php artisan make:story DocumentWasUploaded
```

```php
Storyfeed::stories([
    DocumentWasUploaded::class,
]);
```

## Adding an Icon

```php
class DocumentWasUploaded extends Story
{
    public string|array|null $objectType = Document::class;

    public string|FeedVerb|BackedEnum|null $verb = 'upload';

    public function headline(): string
    {
        return ':actor uploaded :object to :target';
    }

    public function icon(): ?string // [!code focus]
    { // [!code focus]
        return 'file-up'; // [!code focus]
    } // [!code focus]
}
```

<FeedStream :items="[uploadedWithIcon]" :grouped="false" />

The icon is a token; your renderer maps it onto an icon set it owns.

## Grouping Repeats

Three uploads in a row read better as one line. `groups()` gives the story a
plural headline for that case:

```php
use Storyfeed\Grouping\Group; // [!code focus]

class DocumentWasUploaded extends Story
{
    public string|array|null $objectType = Document::class;

    public string|FeedVerb|BackedEnum|null $verb = 'upload';

    public function headline(): string
    {
        return ':actor uploaded :object to :target';
    }

    public function icon(): ?string
    {
        return 'file-up';
    }

    public function groups(): array // [!code focus]
    { // [!code focus]
        return [ // [!code focus]
            Group::repeat()->headline(':actor uploaded :count files to :target'), // [!code focus]
        ]; // [!code focus]
    } // [!code focus]
}
```

<FeedStream :items="[grouped]" :grouped="false" />

`:count` is how many, and `:actor` stays singular because every member shares
the actor. [Aggregation](/deeper/aggregation) covers the other ways activities
group.

## Anatomy

| Member | Required | |
|---|---|---|
| `$objectType` | yes | a model class (recommended), a morph alias, an array of either, or `'*'` for object-less activities |
| `$verb` | yes | a verb string or a `FeedVerb` enum case |
| `headline()` | yes | the singular template |
| `icon()` | no | an icon token |
| `groups()` | no | how repeats of this activity read as one line |
| `$type` | no | Activity Streams 2.0 type override; normally the enum's job |

Nothing is inferred from the class name. `$verb` and `$objectType` are both
explicit; the name is for the reader.

::: tip Naming
`{Object}Was{Verbed}` reads well when the object is the patient
(`DocumentWasUploaded`). For reflexive activities, write what happened:
`MemberJoined`, not `MemberWasJoined`.
:::

## Examples

Three stories in the shapes production apps use. Which role the sentence names
is the decision each one makes.

The object is the comment, but its label is the comment text, so the sentence
names the target:

```php
class CommentWasLeft extends Story
{
    public string|array|null $objectType = Comment::class;

    public string|FeedVerb|BackedEnum|null $verb = 'comment';

    public function headline(): string
    {
        return ':actor commented on :target';
    }

    public function icon(): ?string
    {
        return 'message-circle';
    }
}
```

A task has no target; the sentence ends at the object:

```php
class TaskWasCompleted extends Story
{
    public string|array|null $objectType = Task::class;

    public string|FeedVerb|BackedEnum|null $verb = 'complete';

    public function headline(): string
    {
        return ':actor completed :object';
    }

    public function icon(): ?string
    {
        return 'square-check';
    }
}
```

A project is created for a client, so the client is the target:

```php
class ProjectWasCreated extends Story
{
    public string|array|null $objectType = Project::class;

    public string|FeedVerb|BackedEnum|null $verb = 'create';

    public function headline(): string
    {
        return ':actor created the project :object for :target';
    }

    public function icon(): ?string
    {
        return 'folder';
    }
}
```

<FeedStream :items="examples" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>
