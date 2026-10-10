# Choosing What Not to Record

Record what the reader of this particular feed would want to follow. The same
event can belong on an admin feed and not on a public one.

<span id="events-to-omit"></span>

## Choosing Events to Record

For a customer feed:

| Event | Record It? | Reason |
|---|---|---|
| model created as a draft | no | it is not ready for others to act on |
| save with no status change | no | no visible change occurred |
| note text edited | no | the note's [body](/basics/activity-content#adding-entity-bodies) already displays its current text |
| background indexing, cache rebuilding, or setting a dirty flag | no | internal maintenance is not useful feed content |
| someone typing or coming online | no | the state may change within seconds |
| field-level audit record | no | keep detailed change history in an audit log |
| order placed → confirmed | yes, as `confirm` | each status transition describes an event; give each [its own verb](/cookbook/choosing-when-to-publish#using-one-verb-per-transition) |
| order confirmed → ready | yes, as `prepare` | each status transition describes an event |
| order ready → completed | yes, as `complete` | each status transition describes an event |
| question asked about a menu item | yes | the activity identifies the subject and can [quote the question](/basics/activity-content#adding-quoted-text) |
| order placed | yes | others can follow the order's progress |
| order viewed | temporarily | use the verb's [retention period](/deeper/retention) to limit how long it remains |

## Skipping Publication

To leave a draft out of the feed, return `null` from the event's
`toFeedActivity()` method. See
[Skipping Publication](/deeper/events#skipping-publication).
