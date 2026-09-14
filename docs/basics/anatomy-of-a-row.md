# Anatomy of a Row

A feed row is a small, fixed set of zones. The payload fills them; a renderer
places them. When you are done, you know what belongs where, and what belongs
nowhere.

::: headless it ships no renderer
This page is the shape to build against, not a component you install. Every
rule below was paid for by a renderer that got it wrong first.
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
| detail | a `$detail` key anywhere in `data` | one recognised form, drawn by whatever draws that form |
| tiles | a group's `exemplars`, `distinct` | a sample of a collapsed group's pictures |
| members | `children`, `count` | the group's own rows, when a reader opens it |

Nothing else belongs in a row. A zone with nothing to put in it is absent, not
empty.

## The Sentence Is a Sentence

The headline is prose with entity labels in it, and every renderer that has
tried to make it a structure has regretted it. No headings inside a row: a
heading in a feed is always a mistake, and the reader's eye reads it as a new
section rather than a line of history. The one thing the sentence carries that
prose does not is links, on the entities that have one.

## The Content Region Imposes Position and a Bound, Nothing Else

This is the rule that cost the most to learn, and it is worth stating as a
correction.

The content zone once drew a card around every form: a border, a fill, a
radius, padding. The evidence for it was real — a five-row block of machine
facts running the full width of a panel, a user-agent string crossing 1600
pixels, sitting flush under a sentence and reading louder than it. But only
half of that evidence was about the frame. **The bound mattered.** The border
came along with it.

What the fill and the frame did instead was impose one register on every form,
and most forms already have their own. A quoted passage draws a rule and an
indent, and was then put in a box. A file line is a muted strip. Markdown is
prose. A change is its own rows. The case finally closed when a row rendered a
fence around the single word "Discussion".

So: give the region a position and a maximum width, and let each form bring its
own register. A form that has none should read as what it is, a line of text
under a sentence.

## A Preview Complements the Headline

It does not restate it. If the sentence already named the dish, the block
beneath it does not repeat the name; if the sentence named the file, the file
line shows the size and the type and drops the name. This is one comparison in
the renderer and it is the difference between a row that reads once and a row
that reads twice.

For the same reason, a picture gets no caption. The size is the caption.

## A Value That Is Compared Is Not Read

An address, an identifier, a user agent: the reader is checking it character by
character, not reading it. Give it one line, clip it with an ellipsis, and put
the whole string on `title`. A wrapped 120-character user agent sets the height
of every row around it, and clamping it is invisible to every payload that did
not need it.

## A Collapsed Group Shows a Sample

Not all of it. Draw a few of the members' pictures as tiles, and say how many
**entities** are not shown — `distinct` minus what you drew, never `count`
minus what you drew. Two rules about the row, in order: fewer pictures get
bigger tiles, and no row is left holding a single tile, so four is two and two.
Put the tile count on the row, because both rules are statements about a row.

A tile stands for an entity, so it keeps that entity's link. And a tile is a
sample rather than the picture: six tiles each carrying a full-size original is
six originals in a document nobody asked to see.

## An Unknown Form Draws Nothing

Never an error, which is what lets an app add a form without waiting for a
renderer to learn it. A renderer that recognises none of them is not broken; it
is a renderer that draws headlines. See
[Activity Details](/deeper/details#unknown-forms-in-a-renderer).

## Where to Go From Here

[Rendering](/basics/rendering) writes the loop that fills these zones, and
[Live Rendering](/basics/live-renderer) covers a feed that keeps moving.
