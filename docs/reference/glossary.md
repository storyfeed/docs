# Glossary

Terms used to define, publish and read an activity feed.

<span id="the-activity"></span>

## Activities and Roles

| Term | Meaning |
|---|---|
| **activity** | One published fact, with a verb, roles and publication time. |
| **verb** | The action recorded as a string, such as `upload`. See [Activity Verbs](/basics/verbs). |
| **actor / object / target / context** | Who acted, what they acted on, what the action was directed at, and its container. [Recording](/basics/recording#roles) covers all seven roles. |
| **party** | A [named participant without a model](/deeper/parties), such as a system or integration. A null actor records no participant. |

## Definitions and Stories

| Term | Meaning |
|---|---|
| **[Story class](/deeper/stories)** | A blueprint for activities. A resource class declares verbs; a `Story` subclass receives data and produces an activity. The activity is the published fact. |
| **[feed file](/basics/the-feed-file)** | `routes/feed.php`, where `Story::` declares headlines and other activity behaviour. It defines no HTTP routes. |
| **grammar** | The headline templates declared for activities and groups. |

## Grouping

| Term | Meaning |
|---|---|
| **axis** | The roles and values used to group activities. See [Aggregation](/deeper/aggregation). |
| **curation** | Choosing the winning grouping axis at write time. |
| **eligibility** | The thresholds a set of activities must meet for an axis to apply. |
| **group node** | An aggregate representation of several activities in the payload. |
| **sample** | A limited list of distinct entities in a group; `distinct` carries the full counts. |
| **count** | The number of activities in a group. `distinct.actors` counts different actors. |
| **[composite](/deeper/composites)** | One authored activity about multiple objects. |
| **batch** | A time window used to collect a burst of activity by one actor. |

<span id="reading"></span>

## Reading Feeds

| Term | Meaning |
|---|---|
| **[named feed](/basics/named-feeds)** | A reusable feed definition that applies its scope, verb selection and read mode when read. |
| **read mode** | The choice of timeline or grouping behaviour for a feed. See [Reading Feeds](/basics/reading). |
| **cursor** | An opaque page position to send back when requesting another page. |
| **sync_token** | An opaque value used to detect rewritten history. When it changes, discard accumulated nodes and refetch. See [Synchronization](/reference/payload#sync-tokens). |

## Rendering

| Term | Meaning |
|---|---|
| **token** | A placeholder such as `:actor` in a headline template. |
| **glyph** | An activity's icon token, such as `shopping-bag`. Your frontend resolves it to artwork. |
| **icon** | An entity image in `entity.media.icon`. See [Image Slots](/reference/feedable#image-slots). |
| **[body](/deeper/body)** | A typed block beneath the headline, such as an excerpt or a list. Its kind is its **body type**. |

<span id="storage-maintenance"></span>

## Storage and Maintenance

| Term | Meaning |
|---|---|
| **snapshot** | Cached label, data and body fields for an entity. |
| **trickle** | The maintenance pass that fills missing or outdated snapshots and finds deletions no model event reported. |
| **[tombstone](/deeper/deleted-models)** | The reference left by a deleted model, including its former type and deletion time. Its activities can remain. |
| **[retention](/deeper/retention)** | How long activities are kept before `storyfeed:prune` permanently deletes them. |
| **[healer](/deeper/healing)** | An application policy that identifies activities to retire because their source is permanently gone. |
