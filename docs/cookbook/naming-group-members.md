# Naming Group Members From Activity Data

Record a clause rewrite on its agreement and store the clause name in activity
data. The `:objects` token names agreements, so use a group headline callback
to list clause names.

<script setup>
import { scene } from '../.vitepress/theme/world'
import { group } from '../.vitepress/theme/samples'
const rewrites = scene.cookbook.rewrites
const preview = (members, count = members.length) => {
  const names = members.slice(0, 3).map(member => member.data.clause)
  const more = count - names.length
  return [{
    ...group({ id: `clause-rewrites-${count}-${members.map(m => m.id).join('-')}`,
      axis: 'object', verb: 'rewrite', count, published_at: members[0].published_at,
      headline_template: null, glyph: members[0].glyph,
      actors: [members[0].actor], objects: [members[0].object], children: members }),
    headline: `Recorded ${count} clause rewrites on ${members[0].data.agreement}: ${names.join(', ')}${more > 0 ? ` +${more} more rewrites` : ''}`,
  }]
}
const duplicate = [rewrites[0], { ...rewrites[1], data: rewrites[0].data }, rewrites[2]]
</script>

<a id="record-the-name-with-each-rewrite"></a>
<a id="recording-clause-names"></a>

## Recording Member Names in Data

Define the individual headline for an agreement represented by the application's
`Document` model:

```php memo="routes/feed.php"
use App\Models\Document;
use Storyfeed\Facades\Story;

Story::for(Document::class)->verb('rewrite')
    ->headline(':actor rewrote :object')
    ->icon('file-pen');
```

Record the agreement as object and the clause name in data:

```php memo="routes/web.php"
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::post('/agreements/{agreement}/rewrites', function (Request $request, Document $agreement) {
    $data = $request->validate(['clause' => ['required', 'string']]);

    Storyfeed::activity()
        ->by($request->user())
        ->action('rewrite', $agreement)
        ->data(['clause' => $data['clause'], 'agreement' => $agreement->label])
        ->publish();

    return back();
});
```

Here `label` is the application's agreement label. The activity keeps that
label as it was when the rewrite occurred:

<FeedExample :items="[rewrites[0]]" />

<a id="write-a-group-headline-callback"></a>

## Writing a Group Headline Callback

Add the group headline to the same definition in `routes/feed.php`:

```php memo="routes/feed.php"
use App\Models\Document;
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\Group;
use Storyfeed\Models\Activity;
use Storyfeed\Payload\GroupSlice;

Story::for(Document::class)->verb('rewrite')
    ->headline(':actor rewrote :object')
    ->icon('file-pen')
    ->grouped(Group::byObject()->headline(function (GroupSlice $slice): string {
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
    }));
```

For three recorded activities, the callback produces:

<FeedExample :items="preview(rewrites)" />

`Group::byObject()` uses the `object` axis, which requires the same actor and
agreement. The clause name stays in activity data; it is not part of the verb.

The callback returns finished text. Role tokens such as `:target` in its
return value are not expanded; the payload has a null `headline_template`
and the finished string in `headline`. Render it as text, with normal HTML
escaping. It does not create entity links for the clause names.

<a id="count-rewrites-not-distinct-clauses"></a>
<a id="counting-rewrites"></a>

## Counting Members Beyond the Sample

`GroupSlice::count` is the total number of activities in the group.
`GroupSlice::members` contains the newest members, up to `grouping.children_limit`.
The callback displays at most three names. Subtract the displayed name count
from the total activity count.

With ten rewrites and only the three members above available, the same
callback produces:

<FeedExample :items="preview(rewrites, 10)" />

“+7 more rewrites” counts events whose names are not shown. It does not claim
seven additional distinct clauses. The `distinct` counts on `GroupSlice`
count role entities across all members; they do not count unique data values.

If the same clause is rewritten twice, keep both names. The callback produces:

<FeedExample :items="preview(duplicate)" />

Calling this “3 clauses” would overstate the distinct clause count. Counting
unique names in the sample is insufficient because older members may repeat
them. To count distinct clauses, query all activities in the group in your
application.

<a id="keep-other-headlines-covered"></a>

## Covering Other Axes

This declaration covers only object groups for this verb. Keep its singular
headline and icon definitions, and add headlines for any other axes your feeds
can return. When `grouping.curate` is enabled, Storyfeed can select groups on other axes. See [Choosing a Read Mode](/deeper/aggregation#choosing-a-read-mode)
and [Doctor Checks](/reference/doctor#group-reachability).
