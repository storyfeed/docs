# Naming Group Members from Activity Data

A clause rewrite can name the clause in activity data while the agreement is
the target. `:objects` lists role entities only; it cannot list `data.clause`,
and an activity with no object contributes no object name. Use a group headline
callback to name the rewrites from their recorded data.

<script setup>
import { WORLD_ANCHOR } from '../.vitepress/theme/world'
const publishedAt = new Date(WORLD_ANCHOR - 15 * 60 * 1000).toISOString()
const target = { type: 'document', id: '1', label: 'Order agreement', url: null, modal: false, media: null }
const preview = (clauses, count = clauses.length) => {
  const children = clauses.map((clause, index) => ({
    kind: 'activity', id: `rewrite-${index}`, verb: 'clause.rewritten',
    published_at: publishedAt, headline_template: null,
    headline: `Rewrote ${clause} on Order agreement`, glyph: 'file-pen',
    actor: null, object: null, target, context: null,
    data: { clause, agreement: 'Order agreement' },
  }))
  const shown = clauses.slice(0, 3)
  const more = count - shown.length
  return [{
    kind: 'group', id: `rewrites-${count}-${clauses.join('-')}`, axis: 'repeat',
    verb: 'clause.rewritten', published_at: publishedAt,
    headline_template: null,
    headline: `Recorded ${count} clause rewrites on Order agreement: ${shown.join(', ')}${more > 0 ? ` +${more} more rewrites` : ''}`,
    glyph: 'file-pen', actor: null, object: null, target, context: null,
    count, children, children_truncated: clauses.length < count,
    sample: { actors: [], objects: [], targets: [target], contexts: [] },
    distinct: { actors: 0, objects: 0, targets: 1, contexts: 0 }, distinct_tombstoned: {},
  }]
}
</script>

## Record the Name with Each Rewrite

For this example, each `clause.rewritten` activity has the agreement as target,
no object, and two strings in `data`: `clause` and `agreement`. The built-in
repeat axis keeps a shared target together. The callback uses the newest
member's recorded agreement name; this is event data, not a live model lookup.

| Activity | `data.clause` | `data.agreement` |
|---|---|---|
| newest | Scope | Order agreement |
| next | Termination | Order agreement |
| oldest | Payment terms | Order agreement |

These three activities should produce:

<FeedExample :items="preview(['Scope', 'Termination', 'Payment terms'])" />

## Write a Group Headline Callback

Register the callback in a service provider's `boot()` method. The current
`GroupBuilder::repeat()` and `Group::headline()` methods accept strings only;
a `GroupSlice` callback goes through the aggregate registry. Keep registry
calls out of `routes/feed.php` so the feed file remains cacheable.

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Models\Activity;
use Storyfeed\Payload\GroupSlice;

Storyfeed::aggregateGrammar([
    'repeat.clause.rewritten' => function (GroupSlice $slice): string {
        $agreement = $slice->members->first()?->data['agreement'] ?? null;
        $agreement = is_string($agreement) && trim($agreement) !== ''
            ? trim($agreement)
            : 'the agreement';

        $names = $slice->members->take(3)->map(function (Activity $activity): string {
            $name = $activity->data['clause'] ?? null;

            return is_string($name) && trim($name) !== ''
                ? trim($name)
                : 'unnamed clause';
        });

        $more = max(0, $slice->count - $names->count());
        $suffix = $more > 0 ? " +{$more} more rewrites" : '';
        $details = $names->isEmpty() ? '' : ': '.$names->implode(', ').$suffix;

        return "Recorded {$slice->count} clause rewrites on {$agreement}{$details}";
    },
]);
```

For the three recorded rows above, the callback returns the headline shown
in the preview. The registry key is `repeat` plus the dotted verb
`clause.rewritten`; it is not a type-qualified `rewritten` definition.

The callback returns finished text. Role tokens such as `:target` in its
return value are not expanded; the payload has a null `headline_template`
and the finished string in `headline`. Render it as text, with normal HTML
escaping. It does not create entity links for the clause names.

## Count Rewrites, Not Distinct Clauses

`GroupSlice::count` is the true number of activities in the group.
`GroupSlice::members` is newest first and capped by `grouping.children_limit`.
Taking three names limits the headline further. Subtract the number of names
actually shown from the true activity count, not from the capped member count.

With ten rewrites and only the three members above available, the same
callback produces:

<FeedExample :items="preview(['Scope', 'Termination', 'Payment terms'], 10)" />

“+7 more rewrites” counts events whose names are not shown. It does not claim
seven additional distinct clauses. The `distinct` counts on `GroupSlice`
count role entities across all members; they do not count unique data values.

If Scope is rewritten twice, keep both names. The callback produces:

<FeedExample :items="preview(['Scope', 'Scope', 'Payment terms'])" />

Calling this “3 clauses” would overstate the number of distinct clauses.
Deduplicating the sample would not establish the total either: older members
may contain the same names. To promise a distinct clause total, compute it
across the complete group in an application-owned query or summary. The capped
member list cannot supply that proof.

## Keep Other Headlines Covered

This declaration covers only repeat groups for this verb. Keep its singular
headline and icon definitions, and add headlines for any other axes your feeds
can return. With curation enabled, `live()` can choose an axis other than
repeat. See [Choosing a Read Mode](/deeper/aggregation#choosing-a-read-mode)
and [Doctor Checks](/reference/doctor#group-reachability).
