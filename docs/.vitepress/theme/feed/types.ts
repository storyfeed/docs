/**
 * The payload shapes this kit renders. These mirror the storyfeed payload
 * contract — a node from `GET /feed/page` can be passed straight in.
 */

export type FeedRole = 'actors' | 'objects' | 'targets' | 'contexts';

export interface FeedEntity {
    type: string;
    id: string;
    /** Null when the snapshot is degraded; renderers must still read. */
    label: string | null;
    url: string | null;
    attributes?: Record<string, string>;
    /** App-specific extras. This kit reads `initials` and `avatar_color`. */
    data?: Record<string, unknown> & {
        initials?: string;
        avatar_color?: string;
    };
}

interface BaseNode {
    id: string;
    verb: string;
    published_at: string;
    headline_template: string | null;
    /** Pre-rendered fallback for closure-based grammar. */
    headline?: string | null;
    icon: string | null;
}

export interface ActivityNode extends BaseNode {
    kind: 'activity';
    actor: FeedEntity | null;
    object: FeedEntity | null;
    target: FeedEntity | null;
    context: FeedEntity | null;
}

export interface GroupNode extends BaseNode {
    kind: 'group';
    axis: string;
    /** The TRUE member total, which may exceed `children.length`. */
    count: number;
    children: ActivityNode[];
    /** Every role is a list, even when the axis pins it to one. */
    exemplars: Record<FeedRole, FeedEntity[]>;
    /** True distinct totals per role, for computing overflow. */
    distinct: Partial<Record<FeedRole, number>>;
}

export type FeedNode = ActivityNode | GroupNode;

export interface FeedPayload {
    payload_version: number;
    items: FeedNode[];
    next_cursor: string | null;
    sync_token: string | null;
}
