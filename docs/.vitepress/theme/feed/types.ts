/**
 * Storyfeed Payload v1 contract types, with defensive renderer optionality.
 * W72 reconciles the W47 fields; newer contract gaps are recorded in its todo.
 */

export type FeedRole = 'actors' | 'objects' | 'targets' | 'contexts';

export interface FeedEntity {
    type: string;
    id: string;
    /** Null when the snapshot is degraded; renderers must still read. */
    label: string | null;
    url: string | null;
    modal: boolean;
    component: string | null;
    media: FeedMedia | null;
    attributes?: Record<string, string>;
    /** App-specific extras. This kit reads `initials` and `avatar_color`. */
    data?: Record<string, unknown> & {
        initials?: string;
        avatar_color?: string;
    };
}

/** AS2's slot names: the slot is what the picture is FOR. */
export interface FeedMedia {
    icon: FeedImage | null;
    image: FeedImage | null;
    preview: FeedImage | null;
    url: FeedImage | null;
}

/** width/height are int or null, never zero, so an aspect box is safe when both are set. */
export interface FeedImage {
    src: string;
    mediaType: string | null;
    width: number | null;
    height: number | null;
    alt: string | null;
}

/**
 * The utterance a row is about, and the conversation around it (storyfeed >=
 * c7fbb35, additive). Null on nearly every activity. Every key is present
 * when the object is, so a missing fact reads as null, never as undefined.
 *
 * `kind` is the recording app's own word ('commented', 'replied', 'decided') —
 * a renderer prints it and never switches on it.
 */
export interface FeedThread {
    text: string;
    by: string | null;
    kind: string | null;
    replies: number | null;
    truncated: boolean;
}

interface BaseNode {
    id: string;
    verb: string;
    published_at: string;
    headline_template: string | null;
    /** Pre-rendered fallback for closure-based grammar. */
    headline?: string | null;
    glyph: string | null;
    /**
     * What the glyph MEANS, when the app has said (storyfeed >= b465d1f,
     * additive). A free-form, app-owned string on a registry of its own —
     * core ships no vocabulary and no colours, and a renderer maps whatever
     * arrives onto its own palette. Null for every app that has not opted in,
     * which is why it is optional here as well as nullable.
     */
    glyph_intent?: string | null;
}

export interface ActivityNode extends BaseNode {
    kind: 'activity';
    data?: Record<string, unknown>;
    /** Activity-scoped passage; group children carry it normally. */
    thread?: FeedThread | null;
    actor: FeedEntity | null;
    object: FeedEntity | null;
    target: FeedEntity | null;
    context: FeedEntity | null;
}

export interface GroupNode extends BaseNode {
    kind: 'group';
    axis: string;
    /**
     * Supplied ONLY where the axis pins that role — one exemplar, one distinct
     * value. Absent everywhere else on purpose: an unpinned role has no single
     * answer, so the server declines to name one rather than picking.
     */
    actor: FeedEntity | null;
    object: FeedEntity | null;
    target: FeedEntity | null;
    context: FeedEntity | null;
    /** The TRUE member total, which may exceed `children.length`. */
    count: number;
    children: ActivityNode[];
    children_truncated: boolean;
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
    /**
     * Opaque marker for rewritten settled history. Compare for equality only;
     * this is not a timestamp. Null until the first rewrite.
     */
    sync_token: string | null;
}
