# Introduction

Storyfeed records the activities that matter in your app, and reads them back
as a feed — grouped, headline-ready, and renderable without any domain
knowledge in your frontend.

```php
Storyfeed::record(ActivityVerb::Upload, object: $document, actor: $user, target: $project);
```

Record a burst of those, read the feed, and Storyfeed has already collapsed
them into a story:

<div class="storyfeed-example">
Bob, Sally, and 3 others uploaded files to Project X.
</div>

## How it works

- **You record explicitly.** `Storyfeed::record()` from an action, observer, or
  event listener — you choose what makes the feed. No model spying, no magic.
- **Reads never touch your domain tables.** Each entity is snapshotted at
  publish time, so a feed page is fast regardless of how many models it spans.
- **Grouping happens behind the scenes.** Activities are grouped at write time
  along multiple axes; the read picks the best telling.
- **The payload is a versioned contract.** Every item ships its own headline
  template, icon, and linked entities. Adding a new activity type never
  requires a frontend change.

## Conformance

Serialization follows [W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/)
— spec-conformant JSON-LD with a published `@context` — and ActivityPub
federation is on the long-range roadmap.

## License

Storyfeed is MIT, and everything MIT today stays MIT. The core is complete on
its own; paid companions like `storyfeed/ui` add convenience on top and never
take anything away. Building your own renderer against the payload contract is
expected — the [quickstart](/guide/quickstart) ends with one in plain Blade.

## Next

[Install the package](/guide/installation), then build
[your first feed](/guide/quickstart) in about ten minutes.
