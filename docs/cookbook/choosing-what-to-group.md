# Choosing What to Group

Group activities when the reader needs an overview of who acted and where.
Keep separate rows when each event's words, time or recorded details matter.

<script setup>
import { scene, liveOf, logOf } from '../.vitepress/theme/world'
const signals = liveOf(scene.busyPlace)
const content = logOf([scene.basics.activityContent.notice, scene.basics.activityContent.linkedNotice])
const bulk = liveOf(scene.guide.usageExamples.photos)
const system = scene.cookbook.actorless.paid
const views = logOf(scene.deeper.retention.views)
</script>

<a id="start-with-the-reader-s-task"></a>
<a id="the-reader-s-task"></a>

## Choosing by the Reader's Task

| Kind of activity | A useful starting point |
|---|---|
| Signals, such as reactions or check-ins | Group when the reader mainly needs to know who participated and where. |
| Content, such as comments, questions or notes | Keep each contribution visible, including its body and attribution. |
| Bulk work, such as an upload or several completed tasks | Name the shared action and destination, then let the reader inspect members. |
| System mechanics, such as indexing and retries | Usually omit them from a person's feed; show a meaningful outcome when there is one. |

These are choices for a particular feed. An order-view count may be enough
on an overview, while an investigation needs every view's time and recorded
details. Start with what the reader needs to decide, then choose the read mode.

<a id="group-routine-signals"></a>

## Grouping Routine Signals

A group of check-ins can answer “who is here?” without a separate headline
for each person:

<FeedExample :items="signals" />

The sentence names the place as well as the people. Prefer that to an isolated
“5 check-ins”. A reaction group should likewise name the thing people reacted
to. Choose a [grouping axis](/deeper/aggregation#built-in-axes) whose activities
share the role you want to name. The built-in `actors` axis requires the same
object. The `actors_target` axis requires the same target; its objects may differ.

Show a small sample of names and the number remaining. The payload's
[`sample` and `distinct`](/reference/payload#group-node) fields support that
presentation. Use `count` for activities and `distinct` for people or objects;
one person can act more than once.

<a id="keep-content-and-evidence-visible"></a>

## Keeping Content Visible

Each notice below has something different to read. A count would hide the
reason to open the feed:

<FeedExample :items="content" />

The same applies to comments, questions and quoted notes when their words
matter. Retrieve individual activities with `log()` and render their
[bodies](/basics/activity-content). A compact layout may reduce repeated
avatars or headings while keeping every contribution and timestamp; that is
a choice in your renderer, not a different Storyfeed read mode.

When each view is evidence, keep those rows separate too:

```php memo="A controller, or wherever the feed is retrieved"
use Storyfeed\Facades\Storyfeed;

$views = Storyfeed::feed()
    ->only('view')
    ->log()
    ->get();
```

<FeedExample :items="views" />

Add `->involving($document)` when the reader is investigating one document.
Display the event details your application recorded, such as the time and
whether the request was automated. Storyfeed does not infer those details
from the verb. Grouping preserves the activities, but a collapsed sentence
puts their evidence behind another interaction.

<a id="summarize-bulk-work-with-its-members"></a>

## Summarizing Bulk Work

An upload group names the destination and keeps the photos available to
inspect:

<FeedExample :items="bulk" />

For work deliberately submitted together, consider a
[composite](/deeper/composites): one published activity with a collection of
objects. Activities that merely happen near each other can use ordinary
aggregation. Neither approach replaces the member content with the headline.

When members have names stored in activity data, show one or two names followed
by the remaining count. [Naming Group Members From Activity Data](/cookbook/naming-group-members)
shows how to limit the displayed names. Count all members, including those
omitted from the response. A “Show all” control can display only the supplied
members unless your application fetches the rest.

<a id="show-system-outcomes-not-every-step"></a>

## Showing System Outcomes

A recorded payment can be useful even when a service is the actor:

<FeedExample :items="[system]" />

The actor and the affected order explain the event. Indexing, cache rebuilds
and successful retries usually add no comparable information for the reader.
[Choose what to record](/cookbook/choosing-what-not-to-record) before trying to
hide that volume in a group. For already-recorded events, a feed's
[`only()` or `except()`](/basics/reading#filtering-by-verb) filters can select
what its readers need.

<a id="choose-the-read-mode-for-that-feed"></a>

## Choosing the Read Mode

Offer a grouped overview and a separate history of the same data when
readers need both. See
[Choosing a Read Mode](/basics/reading#choosing-a-read-mode) for `live()` and
`log()`.

[`keepLatest()`](/deeper/keeping-the-latest-activity) and
[retention](/deeper/retention) change which events remain available. Use them
only when that matches the history you intend to keep, rather than as display
settings for a crowded feed.
