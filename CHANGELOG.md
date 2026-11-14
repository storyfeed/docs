# Changelog

## Unreleased

- Document `children($limit)`, a presentation cap on every group's `children` list that leaves `count`, the headline and samples unchanged and sets `children_truncated` when it drops members (storyfeed/storyfeed#252).
- Document the page entity map: the paginator's top-level `entities` map, the entity `entity_ref` field (null off a page), the `storyfeed.payload.inline_entities` opt-out with `{type, id, entity_ref}` stubs at every depth, the always-empty `media` map in that mode, and resolving entities before media (storyfeed/storyfeed#249).
- Document `samples($limit)`, which caps every group's sample lists without changing the node's shape (storyfeed/storyfeed#248).
- Document two page media map caveats: `inline_media` off applies only to paginated output, never `get()`, and renderers need the whole paginator, not `->toArray()['data']`, with `appendPage()` merging maps for load-more (storyfeed/storyfeed#244).
- Document the page media map: the paginator's top-level `media` map, the entity `media_ref` field, the `storyfeed.payload.inline_media` opt-out, and how renderers resolve through the map with an inline fallback (storyfeed/storyfeed#244).
- Document render-time headline bindings: `FeedHeadline::make()->bind()` from a headline closure or a registered headline, merging with stored bindings (the render-time value wins), group behaviour, when to bind at render time instead of publish time, and the name rules (storyfeed/storyfeed#238).
- Document literal headline bindings: the Payload v1 `bindings` field on activity and group nodes, `bind()` and `bind:` when recording, the `add_bindings_to_feed_activities_table` upgrade, and `FeedItem::bindings()`. The Recording Value Changes recipe binds the names instead of concatenating them into the headline (storyfeed/storyfeed#237).
- Fix schema generation and document entity names for the consolidated v0.23 migrations (storyfeed/storyfeed#60).
