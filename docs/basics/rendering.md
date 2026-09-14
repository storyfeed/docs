# Rendering

Every node in the payload is self-describing: a headline template, a glyph,
and fully described entities. A renderer holds no domain knowledge, so an
activity type you add next year renders with no frontend change. When you are
done, one loop renders every feed your app reads.

<script setup>
import { who, where, doc, note, activity, group } from '../.vitepress/theme/samples'

const items = [
  group({ id: 'rn1', verb: 'upload', axis: 'actors', count: 5, glyph: 'file-up',
    published_at: '2026-08-14T14:30:00.000000Z',
    headline_template: ':actors uploaded :count files to :target',
    actors: [who.designer, who.lead, who.reviewer, who.producer], targets: [where.main],
    objects: [doc.report, doc.signage, doc.pricing],
    distinct: { actors: 4, objects: 5, targets: 1 } }),
  activity({ id: 'rn2', verb: 'comment', glyph: 'message-circle',
    published_at: '2026-08-14T14:28:00.000000Z',
    headline_template: ':actor commented on :target',
    actor: who.reviewer, object: note.second, target: doc.report }),
]
</script>

## The Loop

```blade
{{-- resources/views/feed.blade.php --}}
@php
    // One entity becomes a linked label. A null label means the snapshot is
    // not written yet; the activity still renders, degraded.
    $entity = fn (?array $e, string $fallback) => $e === null
        ? e($fallback)
        : ($e['url'] ? '<a href="'.e($e['url']).'">'.e($e['label'] ?? $fallback).'</a>' : e($e['label'] ?? $fallback));

    // A singular token on a group resolves only when the group really has one
    // in that role: `distinct` is the true total, not the length of the list.
    $one = fn (array $node, string $role, string $fallback) => $entity(
        $node[$role] ?? (($node['distinct'][$role.'s'] ?? 0) === 1 ? ($node['exemplars'][$role.'s'][0] ?? null) : null),
        $fallback,
    );

    // A plural token: the exemplars joined, plus how many were not shown.
    $list = function (array $node, string $role) use ($entity) {
        $shown = $node['exemplars'][$role] ?? [];
        $more = max(($node['distinct'][$role] ?? 0) - count($shown), 0);

        return implode(', ', array_map(fn ($e) => $entity($e, 'Something'), $shown)).($more ? " and {$more} more" : '');
    };
@endphp

@foreach ($page['items'] as $node)
    <article>
        <i class="{{ $node['glyph'] }}"></i>

        @if ($node['headline_template'])
            {!! strtr($node['headline_template'], [
                ':actor'       => $one($node, 'actor', 'Someone'),
                ':object'      => $one($node, 'object', 'Something'),
                ':target'      => $one($node, 'target', 'Something'),
                ':context'     => $one($node, 'context', 'Something'),
                ':origin'      => $one($node, 'origin', 'Something'),
                ':result'      => $one($node, 'result', 'Something'),
                ':instrument'  => $one($node, 'instrument', 'Something'),
                ':actors'      => $list($node, 'actors'),
                ':objects'     => $list($node, 'objects'),
                ':targets'     => $list($node, 'targets'),
                ':contexts'    => $list($node, 'contexts'),
                ':origins'     => $list($node, 'origins'),
                ':results'     => $list($node, 'results'),
                ':instruments' => $list($node, 'instruments'),
                ':count'       => $node['count'] ?? 1,
                ':others'      => max(($node['distinct']['actors'] ?? 0) - count($node['exemplars']['actors'] ?? []), 0).' others',
            ]) !!}
        @elseif ($node['headline'])
            {{ $node['headline'] }}
        @else
            {{-- A group no template can summarise honestly: render the count. --}}
            {{ $node['kind'] === 'group' ? $node['count'].' activities' : $node['verb'] }}
        @endif

        <time datetime="{{ $node['published_at'] }}">
            {{ \Carbon\Carbon::parse($node['published_at'])->diffForHumans() }}
        </time>
    </article>
@endforeach
```

<FeedStream :items="items" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

## Headline Templates

`headline_template` is the primary path: substitute each token with a linked
label. `headline` is the pre-rendered fallback for grammar authored as a PHP
closure; when the template is present, `headline` is `null`, so support both
and let the template win.

| Token | On | Substitutes | Read From |
|---|---|---|---|
| `:actor` `:object` `:target` `:context` `:origin` `:result` `:instrument` | activity nodes | one linked label | `node[role]` |
| the same singular tokens | group nodes | one linked label | `node[role]`, or the exemplar only when `node.distinct[role+'s']` is `1` |
| `:actors` `:objects` `:targets` `:contexts` `:origins` `:results` `:instruments` | group nodes | the exemplar list, plus overflow | `node.exemplars[role]` |
| `:count` | group nodes | the member count | `node.count` |
| `:others` | group nodes | actor overflow: "3 others" | `node.distinct.actors - node.exemplars.actors.length` |

A group carries a singular role key only where the group has one entity in
that role. Everywhere else the key is absent, and a singular token over a
group of nine has no single answer. Recover one from the exemplars only when
`distinct` is `1`; otherwise degrade the token to the plural list, which is
true at every size. An unconditional `?? exemplars[0]` names one actor over a
many-actor group.

## Plural Tokens and Overflow

Exemplars are capped at three per role. The overflow is `distinct` minus the
number shown, the same arithmetic for `:others` and for every plural token's
"and N more", so compute it once. `:others` never vanishes at zero: a
three-actor group renders "and 0 others", so prefer a plural token where the
sentence allows it.

## Degraded Entities

An entity with no snapshot yet arrives with `label: null` and `url: null`.
Render a neutral placeholder. A null **actor** means the actor is unknown;
supply your own label, conventionally "Someone". Activities are never withheld
because an entity is degraded. A named system actor is a
[party](/deeper/parties#parties).

## Null-Headline Groups

A group with no aggregate grammar and no safe fallback arrives with **both**
`headline_template` and `headline` null. Render an avatar stack plus a bare
localised count ("5 activities"), closed like any other group. Do not compose
prose from the node's entities: a branch written for singletons names one
actor over a many-actor group.

## Group Children

`children` nests member activity nodes, newest first, capped by
`grouping.children_limit`. `count` is always the true total, and
`children_truncated: true` says the list is capped. The `distinct` counts cover
all members, not just the nested ones.

## Reconciling Updates

A static render needs none of this. A feed that polls or accumulates pages
does, because groups are not stable rows: a group of four becomes a group of
five with a new node id, or converts to a composite, and a client that merges
a fresh head page by id shows the same activities twice.

1. **Window rule.** A fresh head page supersedes accumulated nodes whose
   `published_at` falls inside the range it covers.
2. **Member identity.** Drop any accumulated node whose children a fresh node
   has claimed. A node whose members now belong elsewhere is stale regardless
   of its timestamp. `children` is capped, so this is a strong signal rather
   than a total one.
3. **Sync token.** When the envelope's `sync_token` changes, settled history
   was rewritten server-side: drop all accumulated nodes and refetch from the
   head. Equality compare only; `null` to non-null counts as a change.

All three are implemented in [Live Rendering](/basics/live-renderer).

## Verifying Your Renderer

Render every node your feed produces and count the fallback strings:

```
fallback leaks ("Someone"/"Something"): 0
```

A leak means a token resolved to nothing, and a headline containing "Someone"
reads well enough that the failure looks like an anonymous feed rather than a
bug. Run it across every read mode. Degraded entities are the exception: they
should render your placeholder.
