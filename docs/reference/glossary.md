# Glossary

Terms used to define, publish and read an activity feed.

<span id="the-activity"></span>

## Activities and Roles

| Term | Meaning |
|---|---|
| **activity** | One published fact, with a verb, roles and publication time. |
| **verb** | The action recorded as a string, such as `upload`. See [Activity Verbs](/basics/verbs). |
| **actor / object / target / context** | Who acted, what they acted on, what the action was directed at, and its container. [Recording](/basics/recording#roles) covers all seven roles. |
| **entity** | A model or party filling a role. In the payload, each role is an [entity object](/reference/payload#entities) or `null`. |
| **[Feedable](/basics/feedable-models)** | A model that can appear in an activity. It gives the feed a label to print and a link to follow. |
| **party** | A [named participant without a model](/deeper/parties), such as a system or integration. A null actor records no participant. |

## Definitions and Stories

| Term | Meaning |
|---|---|
| **[Story class](/deeper/stories)** | A blueprint for activities. A resource class declares verbs; a `Story` subclass receives data and produces an activity. The activity is the published fact. |
| **[feed file](/basics/the-feed-file)** | `routes/feed.php`, where `Story::` declares headlines and other activity behaviour. It defines no HTTP routes. |
| **headline template** | The sentence declared for an activity or group, with tokens such as `:actor`. The payload carries it as `headline_template`. See [The Feed File](/basics/the-feed-file). |
| **[keep latest](/deeper/keeping-the-latest-activity)** | A verb policy that leaves only the latest matching activity in the feed. |

## Grouping

| Term | Meaning |
|---|---|
| **[aggregation](/deeper/aggregation)** | Showing several related activities as one row. |
| **group** | One row standing for several activities that belong together, such as one person placing order after order. See [Reading Feeds](/basics/reading#groups). |
| **axis** | The roles and values used to group activities. See [Aggregation](/deeper/aggregation#built-in-axes). |
| **repeat** | The fallback axis: one actor repeating a verb on the same kind of object, with the same target. |
| **[threshold](/deeper/aggregation#thresholds)** | The minimum an axis needs before it can group, such as three distinct actors. Set in `grouping.policy`. |
| **winner** | The one axis an activity is grouped on in `live()`. An activity with no winner reads through `repeat`. |
| **curation** | Choosing each activity's winner, from the axes whose thresholds its group meets, falling back to `repeat`. It runs when an activity is published; [`storyfeed:curate`](/reference/commands#other-maintenance-commands) runs it again for existing activities. With `grouping.curate` set to `false`, `live()` shows repeats only. |
| **[grouping period](/deeper/grouping-periods)** | The calendar hour, day, week or month a group spans. Daily by default. |
| **group node** | A group in the payload. See [Group Nodes](/reference/payload#group-node). |
| **sample** | A limited list of distinct entities in a group; `distinct` carries the full counts. |
| **count** | The number of activities in a group. `distinct.actors` counts different actors. |
| **[composite](/deeper/composites)** | One authored activity about multiple objects. |
| **batch** | A time window used to collect a burst of activity by one actor. |

<span id="reading"></span>

## Reading Feeds

| Term | Meaning |
|---|---|
| **[named feed](/basics/named-feeds)** | A reusable feed definition that applies its scope, verb selection and read mode when read. |
| **read mode** | The choice of `log()`, `live()` or `summary()` for a feed. See [Reading Feeds](/basics/reading). |
| **[live](/basics/reading#live)** | The default read mode. Each activity shows in its winner's group, so repeated actions and several people at one place read as one row. |
| **[summary](/basics/reading#summary)** | The digest read mode: one row per person per calendar period, with per-verb phrases. |
| **[log](/basics/reading#log)** | The read mode with one node per activity and no groups: the timeline. |
| **cursor** | An opaque page position to send back when requesting another page. |
| **sync_token** | An opaque value used to detect rewritten history. When it changes, discard accumulated nodes and refetch. See [Synchronization](/reference/payload#sync-tokens). |

## Rendering

| Term | Meaning |
|---|---|
| **token** | A placeholder such as `:actor` in a headline template. |
| **glyph** | An activity's icon token, such as `shopping-bag`. Your frontend resolves it to artwork. |
| **intent** | A token beside the glyph, in `glyph_intent`, naming what it means in the app's own word, such as `success`. Storyfeed ships none. See [Glyphs and Intents](/basics/rendering#glyphs-and-intents). |
| **icon** | An entity image in `entity.media.icon`. See [Image Slots](/reference/feedable#image-slots). |
| **[body](/deeper/body)** | A typed block beneath the headline, such as an excerpt or a list. Its kind is its **body type**. |
| **degraded** | An entity with no snapshot yet. It arrives with `label: null` and `url: null`, and its activity still appears. See [Handling Missing Values](/basics/rendering#degraded-entities). |
| **redundant** | An activity where a role its verb is about holds a tombstone. It is still true as history. See [Redundant Roles](/deeper/deleted-models#roles-that-determine-redundancy). |

<span id="storage-maintenance"></span>

## Storage and Maintenance

| Term | Meaning |
|---|---|
| **snapshot** | Cached label, data and body fields for an entity. |
| **trickle** | The maintenance pass that fills missing or outdated snapshots and finds deletions no model event reported. |
| **[tombstone](/deeper/deleted-models)** | The reference left by a deleted model, including its former type and deletion time. Its activities can remain. |
| **[retention](/deeper/retention)** | How long activities are kept before `storyfeed:prune` permanently deletes them. |
| **[healer](/deeper/healing)** | An application policy that identifies activities to retire because their source is permanently gone. |
