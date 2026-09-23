# Anatomy of a Row

A feed row is made of a fixed set of zones: the rail, the headline, the time,
and a few more. Each zone is filled from one part of the payload, and your
renderer decides where each one sits.

::: headless it ships no renderer
This is the layout to build your renderer against, not a component you install.
:::

<RowAnatomy />

## What Fills Each Zone

| Zone | Fed by | Holds |
|---|---|---|
| rail | `glyph`, `actor` | one subject as the disc, the other as a badge on its corner |
| headline | `headline_template`, the role keys | the sentence, with entity labels substituted in |
| time | `published_at` | one timestamp, in the reader's zone |
| thread | `thread` | what someone said, quoted on this activity |
| media | `object.media.preview`, `object.media.url` | the object's picture, at the feed's scale |
| detail | a `$body` key anywhere in `data` | one recognised form, drawn by whatever draws that form |
| tiles | a group's `exemplars`, `distinct` | a sample of a collapsed group's pictures |
| members | `children`, `count` | the group's own rows, when a reader opens it |

Nothing else belongs in a row. A zone with nothing in it is absent, not empty.

## The Headline

The headline is prose with entity labels in it, linked where the entity has a
link. No headings inside a row: the eye reads a heading as a new section.

## The Content Region

Give the region a position and a maximum width, and nothing else: no border,
fill or padding. Each form brings its own register. A quoted passage draws a
rule and an indent, a file line is a muted strip, a change is its own rows. A
form with none reads as a line of text under the sentence.

## Previews

A preview complements the headline; it does not restate it. If the sentence
named the file, the file line shows the size and type and drops the name. A
picture gets no caption.

## Compared Values

An address, an identifier, a user agent is checked character by character, not
read. Give it one line, clip it with an ellipsis, and put the whole string on
`title`.

## Collapsed Groups

Draw a few members' pictures as tiles, and say how many **entities** are not
shown: `distinct` minus what you drew, never `count` minus what you drew. Fewer
pictures get bigger tiles, and no row holds a single tile, so four is two and
two. Put the tile count on the row.

Each tile keeps its entity's link, and draws the preview, not the original.

## Unknown Forms

A form the renderer does not recognise draws nothing, never an error. See
[Activity Details](/deeper/details#unknown-forms-in-a-renderer).
