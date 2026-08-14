import type { Component, InjectionKey } from 'vue';

/**
 * The component used to render an entity link. Defaults to a plain `<a>`.
 *
 * Provide your router's link component — Inertia's `Link`, `RouterLink`,
 * Next's `Link` — to get client-side navigation without forking a file.
 * Whatever you provide receives `href` plus the entity's `attributes`.
 */
export const FEED_LINK = Symbol('feedLink') as InjectionKey<Component | string>;

/**
 * A fixed "now", as a millisecond timestamp.
 *
 * Provide it when the page is prerendered against static sample data:
 * otherwise a build-time render bakes "2h ago" into the HTML and the phrase
 * drifts further from the truth every day the page is not rebuilt. With it,
 * relative times are stable and honest about their reference point.
 */
export const FEED_NOW = Symbol('feedNow') as InjectionKey<number>;
