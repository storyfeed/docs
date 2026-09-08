# Headlines for grouped activities

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
  id: 'ck5a', verb: 'upload', glyph: 'file-up',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor uploaded :object to :target',
  actor: who.ines, object: doc.annualReportV3, target: where.passwordCrackdown,
})

const burst = group({
  id: 'ck5b', verb: 'upload', axis: 'repeat', count: 3, glyph: 'file-up',
  published_at: '2026-08-14T14:33:00.000000Z',
  headline_template: ':actor uploaded :count files to :target',
  actors: [who.ines], targets: [where.passwordCrackdown],
  objects: [doc.annualReportV3, doc.signagePlanRevB, doc.pricingTableFinal],
  distinct: { actors: 1, objects: 3, targets: 1 },
})

const crowd = group({
  id: 'ck5c', verb: 'upload', axis: 'actors', count: 5, glyph: 'file-up',
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
    ->action('upload', $annualReport)
    ->to($project)
    ->publish();
```

<FeedStream :items="[one]" :grouped="false" />

*a minute later, another request*

```php
Storyfeed::activity()
    ->by($user)
    ->action('upload', $signagePlan)
    ->to($project)
    ->publish();
```

*another minute later, a third request*

```php
Storyfeed::activity()
    ->by($user)
    ->action('upload', $pricingTable)
    ->to($project)
    ->publish();
```

These are three different documents, each uploaded once. Read with grouping:

```php
$feed = Storyfeed::feed()->involving($project)->live()->get();
```

With the default grouping strategy, these activities share the same actor,
verb, object type, target, and publish day, so `live()` groups them under the
`repeat` sentence:

<FeedStream :items="[burst]" :grouped="false" />

`log()` returns individual activities. `live()` reads repeat groups and authored
composites; `summary()` can select other eligible axes. Aggregate grammar
names a group; it does not create one. The five-user example below needs
`summary()` and an eligible `actors` bucket (at least three distinct actors
under the default policy). See [Aggregation](/deeper/aggregation).

*five users, five different documents, five requests, the same project*

<FeedStream :items="[crowd]" :grouped="false" />

Without an aggregate template, a group has no authored sentence and falls back.
The fallback is described in [Grammar](/deeper/grammar#the-anti-lie-rule).

If changing the target stops a `repeat` group from forming, the built-in
[`targets` axis](/deeper/aggregation#axis-registry) leaves target free;
`repeat` includes its id in the key.

## One entry per axis the verb can group on

`:count` is always the member count; the noun after it names what a member is.

| axis | the members are | sentence |
|---|---|---|
| `repeat` | one actor, one verb, one target, one kind of object | `:actor uploaded :count files to :target` |
| `actors` | several actors' acts on one target | `:actors uploaded :count files to :target` |
| `object` | repeated acts on one object | `:actor made :count revisions to :object` |
| `targets` | one actor's acts across targets | `:actor commented :count times in :targets` |

The file wording above assumes one upload per distinct document. If the same
document can be uploaded repeatedly, count “uploads” instead: `:count` does
not count distinct documents.

On the `object` axis a member is one more act on one thing, so the count is of
revisions or times, never of documents.

Which tokens each axis allows in the singular is in
[Aggregation](/deeper/aggregation).

## When the content is the news

A group has children, but no group-level `thread` quote. Quotes and media on
individual activities remain on those children; a closed group can hide the
words or image the reader needed at a glance. Children are capped by
`grouping.children_limit` (25 by default), and `children_truncated` says when
some are omitted. The headline's count still covers the whole group.

Use `log()` for a surface where each decision or comment must remain visible.
An aggregate sentence alone cannot preserve each member's content.

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
