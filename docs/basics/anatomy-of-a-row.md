# Anatomy of a Row

## Introduction

These examples arrange a feed row into zones: the rail, the headline, the time,
and a few more. Each zone is filled from one part of the payload, and your
renderer decides where each one sits.

::: headless
:::

<a id="what-fills-each-zone"></a>

## Mapping Payload Values to a Row

<RowAnatomy />

| Zone | Fed by | Holds |
|---|---|---|
| rail | `glyph`, `actor` | one subject as the disc, the other as a badge on its corner |
| headline | `headline_template`, the role keys | the sentence, with entity labels substituted in |
| time | `published_at` | one timestamp, in the reader's zone |
| thread | `thread` | what someone said, quoted on this activity |
| media | `object.media.preview`, `object.media.url` | the object's picture, at the feed's scale |
| body | an entity’s `body` list | one recognised body type, drawn by whatever draws that type |
| tiles | a group's `sample`, `distinct` | a sample of a collapsed group's pictures |
| members | `children`, `count` | the group's own rows, when a reader opens it |

The examples omit zones with no content. Your frontend controls the layout.

<a id="the-headline"></a>

## Displaying the Headline and Time

The headline is prose with entity labels in it, linked where the entity has a
link. The example uses inline prose so each row reads as one activity.


The example displays `published_at` in the reader’s time zone beside the headline. [Rendering](/basics/rendering) shows the Blade code.

## Displaying Activity Content

<a id="the-content-region"></a>

### Bodies

The example gives the content region a position and maximum width, without a border, fill or padding. Each body type brings its own register. A quoted passage draws a
rule and an indent, a file line is a muted strip, a change is its own rows. A
body without extra styling reads as a line of text under the sentence.

<a id="previews"></a>

### Media Previews

A preview complements the headline; it does not restate it. If the sentence
named the file, the file line shows the size and type and drops the name. A
picture gets no caption.

### Compared Values

An address, identifier or user agent is checked character by character. Show
the complete value, wrapping it or giving it its own row.

<a id="collapsed-groups"></a>

## Displaying Collapsed Groups

Draw a few members' pictures as tiles, and say how many **entities** are not
shown: `distinct` minus what you drew, never `count` minus what you drew. In this example, fewer
pictures get bigger tiles, and four pictures form two rows of two. The tile count stays on the row.

Each tile keeps its entity's link, and draws the preview, not the original.
