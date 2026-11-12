# Changelog

## Unreleased

- Document literal headline bindings: the Payload v1 `bindings` field on activity and group nodes, `bind()` and `bind:` when recording, the `add_bindings_to_feed_activities_table` upgrade, and `FeedItem::bindings()`. The Recording Value Changes recipe binds the names instead of concatenating them into the headline (storyfeed/storyfeed#237).
- Fix schema generation and document entity names for the consolidated v0.23 migrations (storyfeed/storyfeed#60).
