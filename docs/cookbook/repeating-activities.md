# Repeating Activities

When a verb repeats on the same object, keep every activity or call
`keepLatest()` on the verb to keep only the latest.

<script setup>
import { scene, logOf } from '../.vitepress/theme/world'
const timeline = logOf(scene.cookbook.transitions.timeline)
// keepLatest removes the earlier placement before a reader groups the rows.
const latest = timeline.filter((row, index) => timeline.findIndex((other) =>
  other.verb === row.verb && other.object.id === row.object.id) === index)
</script>

<span id="choosing-which-occurrences-to-keep"></span>
<span id="keeping-every-occurrence-or-the-latest"></span>

## Choosing a Storage Policy

Suppose an order is placed, confirmed, amended, and placed again. Choose
whether to keep every activity or the latest for each verb:

| Request | Full Timeline | Latest Activity per Verb |
|---|---|---|
| first placement | append `placed` | replace `placed` |
| confirmation | append `confirmed` | replace `confirmed` |
| placed again after an amendment | append another `placed` | replace the earlier `placed` |
| visible rows afterward | first placement, confirmation, second placement | confirmation, second placement |

### Keeping Every Occurrence

Publish the verb on each request, with no policy on its definition. The
order's log keeps every placement:

<FeedExample :items="timeline" />

### Keeping the Latest Occurrence

Call `keepLatest()` on each verb's definition. The order's log keeps the
latest activity for each verb:

<FeedExample :items="latest" />

Replaced activities disappear from every feed, including `log()`. Keep every
activity if any page needs the full timeline.

<a id="matching-activities"></a>

See [Keeping the Latest Activity](/deeper/keeping-the-latest-activity#replacing-earlier-activities)
for the declaration, matching roles and time limits.
