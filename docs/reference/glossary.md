# Glossary

Every term the docs use, what it is, and what it is not. Terms are grouped by
where you meet them.

## The Activity

| Term | It Is | It Is **Not** |
|---|---|---|
| **activity** | one recorded fact | a log entry — you choose what gets recorded |
| **verb** | what happened, as a string | a closed set; enums are convenience |
| **actor / object / target / context** | the roles a sentence needs; [Recording](/basics/recording#roles) covers all seven | interchangeable; target ≠ context |
| **party** | a [named participant with no model](/deeper/parties) | a null actor (that means *unknown*; see [actorless voice](/deeper/parties#actorless-voice)) |
| **[story class](/deeper/stories)** | a verb with its grammar and roles declared in one place | a required abstraction — a string verb is always enough |
| **[composite](/deeper/composites)** | one authored story about many objects | a derived group |
| **batch** | a burst-detection window | anything a reader sees |

## Grouping

| Term | It Is | It Is **Not** |
|---|---|---|
| **axis** | the question you group by | a sort order, or a display label |
| **curation** | choosing the winning axis at write time | editorial judgement, or anything at read time |
| **eligibility** | the minimum that makes an axis worth applying | a limit on how big a group can get |
| **group node** | an aggregate in its own right | a parent row with children attached |
| **sample** | a few named participants, to print | the full membership — `distinct` has the totals |
| **count** | activities in the group | distinct people (that's `distinct.actors`) |

## Rendering

| Term | It Is | It Is **Not** |
|---|---|---|
| **[grammar](/deeper/grammar)** | the registry of headline templates | rendered prose |
| **token** | a `:placeholder` your renderer fills | a value the server substituted |
| **glyph** | a token the payload ships, e.g. `shopping-bag` | an image, or a set the package owns |
| **[body](/deeper/body)** | a typed block beneath the sentence — an excerpt, a change, a list; its kind is its **body type** | part of the headline, or a place for markup |

## Reading

| Term | It Is | It Is **Not** |
|---|---|---|
| **[named feed](/basics/named-feeds)** | an audience's scope and verb allowlist, declared once | a filter applied at read time |
| **read mode** | how collapsed the reader wants it | a filter |
| **cursor** | an opaque page position | an offset, or something to parse |
| **sync_token** | "history was rewritten, resync" | a cursor, or optional metadata |

## Storage & Maintenance

| Term | It Is | It Is **Not** |
|---|---|---|
| **snapshot** | cached label, data, and body fields per entity | a copy of your model |
| **trickle** | the sweep that fills snapshots recording could not | a cache warmer you must run to read |
| **[healer](/deeper/healing)** | an app-declared policy retiring stories whose source is permanently gone | a way to discover missing sources, or to undo a deletion |

::: tip Glyph and icon, null actor and party
**`glyph`** is a token naming an activity; **`icon`** is an image, at
`entity.media.icon`. **A null actor** means the actor is unknown; **a party**
means something without a model did it.
:::
