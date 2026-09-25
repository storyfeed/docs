# Anatomy of a Row

These examples arrange a feed row into zones: the rail, the headline, the time,
and a few more. Each zone is filled from one part of the payload, and your
renderer decides where each one sits.

::: headless
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
| body | a `$body` key anywhere in `data` | one recognised body type, drawn by whatever draws that type |
| tiles | a group's `sample`, `distinct` | a sample of a collapsed group's pictures |
| members | `children`, `count` | the group's own rows, when a reader opens it |

The examples omit zones with no content. Your frontend controls the layout.

## The Headline

The headline is prose with entity labels in it, linked where the entity has a
link. No headings inside a row: the eye reads a heading as a new section.

## The Content Region

Give the region a position and a maximum width, and nothing else: no border,
fill or padding. Each body type brings its own register. A quoted passage draws a
rule and an indent, a file line is a muted strip, a change is its own rows. A
body type with none reads as a line of text under the sentence.

## Previews

A preview complements the headline; it does not restate it. If the sentence
named the file, the file line shows the size and type and drops the name. A
picture gets no caption.

## Compared Values

An address, identifier or user agent is checked character by character. Show
the complete value, wrapping it or giving it its own row.

## Collapsed Groups

Draw a few members' pictures as tiles, and say how many **entities** are not
shown: `distinct` minus what you drew, never `count` minus what you drew. Fewer
pictures get bigger tiles, and no row holds a single tile, so four is two and
two. Put the tile count on the row.

Each tile keeps its entity's link, and draws the preview, not the original.
