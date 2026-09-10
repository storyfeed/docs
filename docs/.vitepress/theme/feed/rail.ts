/**
 * WHICH FACT THE RAIL ANSWERS FIRST — who, or what.
 *
 * A port of `Storyfeed\Filament\Feeds\Rail`, kept deliberately literal: two
 * slots and three values, a PRIMARY (the 2rem disc) and a SECONDARY (the badge
 * on its lower corner), each holding the actor, the activity, or nothing, and
 * the two never holding the same thing. Four legal configurations, no fifth.
 *
 *     actor          actor / activity    who did it, then what
 *     activity       activity / actor    what happened, then who
 *     activity-only  activity / none     the actor is constant; the badge is noise
 *     actor-only     actor / none        one face, no badge
 *
 * SEMANTICS, NOT APPEARANCE. Nothing here reaches a colour, a size or a shape:
 * the disc is the same disc and the badge the same badge. What a consumer
 * chooses is which of two facts the eye meets first.
 *
 * WHY THIS KIT'S DEFAULT IS NOT THE PLUGIN'S. The Filament plugin defaults to
 * `actor` — a face with the verb badged onto it. This kit is the Newsroom's
 * renderer and has always drawn one face and no badge, which is `actor-only`,
 * with group children drawing the verb alone, which is `activity-only`. Naming
 * what it already does costs no page a repaint; see `railFor`.
 */
export type RailSlot = 'actor' | 'activity' | 'none';

export type RailName = 'actor' | 'activity' | 'activity-only' | 'actor-only';

export interface Rail {
    primary: RailSlot;
    secondary: RailSlot;
}

/**
 * The canonical name of every legal pair, keyed by "primary:secondary" — one
 * table read in both directions, so a name and a pair cannot drift into two
 * lists that disagree.
 */
const NAMES: Record<string, RailName> = {
    'actor:activity': 'actor',
    'activity:actor': 'activity',
    'activity:none': 'activity-only',
    'actor:none': 'actor-only',
};

export const RAIL_NAMES = Object.values(NAMES);

/** A configuration by name, or an already-built one passed through. */
export function rail(from: Rail | RailName): Rail {
    if (typeof from !== 'string') return from;

    const pair = Object.keys(NAMES).find((key) => NAMES[key] === from);

    if (!pair) {
        throw new Error(
            `[storyfeed] "${from}" is not a rail configuration. Expected one of: ${RAIL_NAMES.join(', ')}.`,
        );
    }

    const [primary, secondary] = pair.split(':') as [RailSlot, RailSlot];

    return { primary, secondary };
}

export function railName(of: Rail): RailName {
    return NAMES[`${of.primary}:${of.secondary}`];
}

/**
 * The same rail without its badge, which is the whole of what `dense` does to
 * this column — not a fifth configuration standing beside the model.
 */
export function withoutSecondary(of: Rail): Rail {
    return of.secondary === 'none' ? of : { primary: of.primary, secondary: 'none' };
}

/** What the disc falls back to when the primary has nothing to draw. */
export function other(slot: RailSlot): RailSlot {
    return slot === 'actor' ? 'activity' : slot === 'activity' ? 'actor' : 'none';
}

/**
 * What one row actually draws, given what it has.
 *
 * THE DISC DRAWS THE PRIMARY; failing that, the OTHER subject; failing that,
 * the blank dot. The fallback is to the other subject and NOT to whatever the
 * secondary holds — an actor-only row whose actor is anonymous has always shown
 * its glyph, and `none` means "draw no badge" rather than "never show this
 * subject".
 *
 * THE BADGE DRAWS THE SECONDARY, and only when the disc drew the primary: a
 * fallen-back disc is already holding the secondary's subject, and a badge
 * repeating it would be the same fact twice in 2rem.
 *
 * MORE THAN ONE FACE SUPPRESSES IT. Geometry: a badge over a stacked pair sits
 * on the seam between two discs and reads as a third. Honesty: a single face on
 * a group of several actors is the one-actor lie the exemplar list exists to
 * refuse. Either reason alone would do; together they are non-negotiable.
 */
export function railFor(
    of: Rail,
    has: { actors: number; glyph: boolean },
): { disc: RailSlot; badge: RailSlot } {
    const available: Record<RailSlot, boolean> = {
        actor: has.actors > 0,
        activity: has.glyph,
        none: false,
    };

    const fallback = other(of.primary);

    const disc = available[of.primary]
        ? of.primary
        : available[fallback]
          ? fallback
          : 'none';

    const badge =
        disc === of.primary && available[of.secondary] && has.actors <= 1
            ? of.secondary
            : 'none';

    return { disc, badge };
}
