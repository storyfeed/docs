# Glossary

Terms used to define, publish, retrieve, and render an activity feed.

<span id="the-activity"></span>

## Activities and Roles

| Term | Meaning |
|---|---|
| **activity** | One published fact, with a verb, roles, and publication time. |
| **verb** | The action recorded as a string, such as `upload`. See [Activity Verbs](/basics/verbs). |
| **actor / object / target / context** | Who acted, what they acted on, what the action was directed at, and its container. [Recording](/basics/recording#roles) covers all seven roles. |
| **entity** | A model or party filling a role. Each payload role contains an [entity object](/reference/payload#entities) or `null`. |
| **[Feedable](/basics/feedable-models)** | A model that can appear in an activity and provide its label, link, and other feed details. |
| **party** | A [named participant without an application model](/deeper/parties), such as a system or integration. |
| **anonymous** | No actor was recorded, so who acted is unknown. This includes deliberately using `Storyfeed::anonymous()` or `by(null)`; it does not mean nobody acted. |
| **empty role** | A role with no recorded entity. Roles other than the actor are empty, never anonymous. |

## Definitions and Stories

| Term | Meaning |
|---|---|
| **[Story class](/deeper/stories)** | A class that defines activities. A resource class declares verbs; a `Story` subclass receives data and produces an activity. |
| **[feed file](/basics/the-feed-file)** | `routes/feed.php`, where `Story::` declares headlines and activity behaviour. It defines no HTTP routes. |
| **headline** | The displayed wording for an activity or group. |
| **headline template** | A headline with tokens such as `:actor`, returned in `headline_template`. See [The Feed File](/basics/the-feed-file). |
| **[keep latest](/deeper/keeping-the-latest-activity)** | A verb policy that keeps only the latest matching activity in the feed. |

## Grouping

| Term | Meaning |
|---|---|
| **[aggregation](/deeper/aggregation)** | Combining activities that share values, such as the same actor or target, into one feed item. |
| **group** | Related activities represented by one item, such as one customer's orders at the same shop. See [Reading Feeds](/basics/reading#groups). |
| **axis** | What a group has in common, such as the same actor, verb, and target. This is the API term for its grouping rule. See [Aggregation](/deeper/aggregation#built-in-axes). |
| **repeat** | The fallback group for one actor repeating a verb on the same object type with the same target. |
| **[threshold](/deeper/aggregation#thresholds)** | The minimum needed to form a group, such as three distinct actors. Set in `grouping.policy`. |
| **group an activity is shown in** | The one group selected for an activity in `live()`, falling back to `repeat`. |
| **choosing which group shows** | Selecting among groups whose thresholds are met, with `repeat` as the fallback. This runs at publication and through [`storyfeed:curate`](/reference/commands#other-maintenance-commands). With `grouping.curate` set to `false`, `live()` shows repeats only. |
| **[grouping period](/deeper/grouping-periods)** | The calendar hour, day, week, or month a group spans. Daily by default. |
| **group node** | A group represented in the payload. See [Group Nodes](/reference/payload#group-node). |
| **sample** | A limited list of distinct entities in a group; `distinct` contains the full counts. |
| **count** | The number of activities in a group. `distinct.actors` counts different actors. |
| **[composite](/deeper/composites)** | One activity about multiple objects. |
| **batch** | An actor's activities collected together. This is not a Laravel job batch. |
| **window** | How long Storyfeed waits for more activities before closing a batch. |

<span id="reading"></span>

## Reading Feeds

| Term | Meaning |
|---|---|
| **retrieve / query** | Access the database for feed data. |
| **return** | Produce a PHP value. |
| **item** | One entry in a feed, represented by `FeedItem` or an array from `$page->items()`. |
| **node** | A payload representation, such as an activity node or group node. |
| **[named feed](/basics/named-feeds)** | A reusable definition of a feed's scope, verbs, and read mode. |
| **read mode** | The API choice of `log()`, `live()`, or `summary()`. See [Reading Feeds](/basics/reading). |
| **[live](/basics/reading#live)** | The default read mode, with each activity shown in one selected group. |
| **[summary](/basics/reading#summary)** | The mode that summarises an actor's activities per calendar period using per-verb phrases, displayed as a summary row. |
| **[log](/basics/reading#log)** | The mode that returns one item per activity without grouping. |
| **cursor** | An opaque page position passed back when requesting another page. |
| **sync_token** | An opaque value that changes when existing feed history changes. Discard accumulated nodes and fetch again when it changes. See [Synchronization](/reference/payload#sync-tokens). |

## Rendering

| Term | Meaning |
|---|---|
| **render / display** | Produce output for the frontend. |
| **row** | An item drawn on screen. |
| **token** | A placeholder such as `:actor` in a headline template. |
| **icon** | An activity's symbol, declared with `icon()`. Your frontend maps its token, such as `shopping-bag`, to artwork. |
| **`glyph` / `glyph()`** | The payload key and FeedItem method containing the activity's icon token. |
| **intent** | The icon's meaning, declared with `intent()` and returned in `glyph_intent`, such as `success`. Storyfeed defines no fixed vocabulary. See [Icons and Intents](/basics/rendering#glyphs-and-intents). |
| **icon image** | A model's picture in `entity.media.icon`, such as an avatar or logo. See [Image Slots](/reference/feedable#image-slots). |
| **[body](/deeper/body)** | Typed content beneath a headline, such as an excerpt or list. Its kind is its **body type**. |
| **degraded** | An entity with no snapshot yet, returned with `label: null` and `url: null`. Its activity still appears. See [Handling Missing Values](/basics/rendering#degraded-entities). |
| **redundant** | An activity with a tombstone in a role selected by its verb for redundancy checks. It still records what happened. See [Redundant Roles](/deeper/deleted-models#roles-that-determine-redundancy). |

<span id="storage-maintenance"></span>

## Storage and Maintenance

| Term | Meaning |
|---|---|
| **snapshot** | Cached label, data, and body fields for an entity. |
| **trickle** | Maintenance that creates missing snapshots, refreshes outdated ones, and finds deletions not reported by model events. |
| **[tombstone](/deeper/deleted-models)** | A reference to a deleted model, including its former type and deletion time. Its activities may remain. |
| **[retention](/deeper/retention)** | How long activities remain before `storyfeed:prune` permanently deletes them. |
| **[healer](/deeper/healing)** | An application policy that selects activities for soft-deletion because their source is permanently gone. |
| **soft-delete** | Mark an activity deleted without permanently removing its stored record. This is what `storyfeed:heal` does. |
