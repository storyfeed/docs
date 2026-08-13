# Introduction

Every product you use at scale has one. GitHub's dashboard, Slack's activity, the
feed on every social network you have ever opened — the same pattern, solved over
and over by teams with the headcount to solve it properly.

**None of this is a new idea.** It is a well-understood pattern that has simply
stayed out of reach for ordinary applications: you either build it yourself and
discover how much detail is hiding inside it, or you rent it from a hosted
service.

Storyfeed brings it to any Laravel app — including the small ones.

## Activity streams, not activity logs

Laravel is well served for *audit logging* — recording who changed what, for
compliance and debugging. This is the other thing: the human-readable narrative a
product shows its own users.

The difference shows up the moment a feed gets busy. An audit log has five rows;
a stream has one sentence:

<div class="storyfeed-example">
Bob, Sally, and 3 others uploaded files to Project X.
</div>

Deciding which activities collapse together, along which axis, and what the
resulting sentence can honestly claim is most of the work. That is the part this
package does for you.

## The feature nobody asks for

Across sixteen years of building operational portals, this is the one feature
that was never requested and consistently loved the most. It usually arrived as a
placeholder — something to fill an empty homepage — and became the thing people
opened the app to look at.

Users don't ask for an activity feed, because they don't know it is a thing they
can have. They recognise it instantly once it is there.

## What you get

- **Curated recording** — a typed, autocomplete-friendly API for publishing
  meaningful activities from your domain events or observers. Keep your verbs in
  an enum and they become IDE-discoverable and typo-proof. Not an audit log: you
  choose what makes the feed.
- **Fast, self-describing reads** — entity snapshots kill polymorphic N+1s; every
  feed item ships fully described (headline template, icon, linked entities) so
  renderers need zero domain knowledge.
- **Smart grouping** — activities aggregate the way social feeds do
  (*"…and 3 others"*), via a behind-the-scenes curation process.
- **Activity Streams 2.0** — spec-conformant JSON-LD serialization (`Activity`,
  `OrderedCollection`), with ActivityPub federation on the long-range roadmap.
- **Headless by design** — the core emits a stable, versioned payload contract.
  Bring your own UI, or use `storyfeed/ui` (coming) — polished pre-built
  components by Tey Labs.

## Headless, and what that means for you

The core package renders nothing. It emits a **payload contract**: a versioned
JSON envelope where every item carries its own headline template, icon, and fully
described entities. A renderer never needs to know what a `delivery` is.

That has one practical consequence worth understanding before you start: adding a
new activity type to your app should never require a frontend change. If it does,
something has been rendered in the wrong layer.

Building your own renderer against the contract is expected and encouraged —
[Your first feed](/guide/quickstart) ends with a plain Blade loop that does it in
about forty lines.

## Licensing, stated plainly

Storyfeed is MIT, and **everything MIT today stays MIT.** The core is complete on
its own — recording, reads, grouping, curation, and the payload contract — and
nothing in it will move behind a licence later. Paid companions like
`storyfeed/ui` add convenience on top; they never take anything away, and a feed
built on the core alone will keep working exactly as it does now.

## Next

- [Installation](/guide/installation) — get the tables in place.
- [Your first feed](/guide/quickstart) — record an activity, read it back, render it.
