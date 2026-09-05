# The plural sentence is authored beside the singular

A group that reads as one sentence, written on the lines next to the sentence
for one activity.

```php
Storyfeed::verbs([
    'upload' => ActivityType::Add,
]);

Storyfeed::grammar([
    'document.upload' => ':actor uploaded :object to :target',
]);

Storyfeed::aggregateGrammar([
    'repeat.upload' => ':actor uploaded :count files to :target',
    'actors.upload' => ':actors uploaded :count files to :target',
]);
```

<script setup>
import { who, where, doc, activity, group } from '../.vitepress/theme/samples'

const one = activity({
  id: 'ck5a', verb: 'upload', icon: 'file-up',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor uploaded :object to :target',
  actor: who.ines, object: doc.annualReportV3, target: where.passwordCrackdown,
})

const burst = group({
  id: 'ck5b', verb: 'upload', axis: 'repeat', count: 3, icon: 'file-up',
  published_at: '2026-08-14T14:33:00.000000Z',
  headline_template: ':actor uploaded :count files to :target',
  actors: [who.ines], targets: [where.passwordCrackdown],
  objects: [doc.annualReportV3, doc.signagePlanRevB, doc.pricingTableFinal],
  distinct: { actors: 1, objects: 3, targets: 1 },
})

const crowd = group({
  id: 'ck5c', verb: 'upload', axis: 'actors', count: 5, icon: 'file-up',
  published_at: '2026-08-14T14:35:00.000000Z',
  headline_template: ':actors uploaded :count files to :target',
  actors: [who.ines, who.marcus, who.priya], targets: [where.passwordCrackdown],
  distinct: { actors: 5, objects: 5, targets: 1 },
})
</script>

*A user uploads a document to a project.*

```php
Storyfeed::activity()
    ->by($user)
    ->action('upload', $document)
    ->to($project)
    ->publish();
```

<FeedStream :items="[one]" :grouped="false" />

*a minute later, another request, and another after that*

```php
Storyfeed::activity()
    ->by($user)
    ->action('upload', $document)
    ->to($project)
    ->publish();
```

The three publishes are identical. The feed arrives with them already grouped,
under the `repeat` sentence:

<FeedStream :items="[burst]" :grouped="false" />

*five users, five requests, the same project*

<FeedStream :items="[crowd]" :grouped="false" />

Without an aggregate template, a group has no authored sentence and falls back.
The fallback is described in [Grammar](/deeper/grammar#the-anti-lie-rule).

## One entry per axis the verb can group on

`:count` is always the member count; the noun after it names what a member is.

| axis | the members are | sentence |
|---|---|---|
| `repeat` | one actor, one verb, one target, one kind of object | `:actor uploaded :count files to :target` |
| `actors` | several actors' acts on one target | `:actors uploaded :count files to :target` |
| `object` | repeated acts on one object | `:actor made :count revisions to :object` |
| `targets` | one actor's acts across targets | `:actor commented :count times in :targets` |

On the `object` axis a member is one more act on one thing, so the count is of
revisions or times, never of documents.

Which tokens each axis allows in the singular is in
[Aggregation](/deeper/aggregation).

## The same pair in a Story

Both sentences live in one class, singular first:

```php
class DocumentWasUploaded extends Story
{
    public string|array|null $objectType = Document::class;

    public string|FeedVerb|BackedEnum|null $verb = 'upload';

    public function headline(): string
    {
        return ':actor uploaded :object to :target';
    }

    public function groups(): array
    {
        return [
            Group::repeat()->headline(':actor uploaded :count files to :target'),
            Group::byActors()->headline(':actors uploaded :count files to :target'),
        ];
    }
}
```

A Story with `headline()` and no `groups()` is a singular with no plural.
Writing the two methods in the same edit is the whole practice.
