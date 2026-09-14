<script setup lang="ts">
/**
 * An entity link on a docs page: a real link that does not leave the page.
 *
 * The sample payloads carry real-looking URLs — `/orders/1`, `/users/4` —
 * because a payload with null urls would teach that entities have none. This
 * site has no such routes, so following one landed on a 404 and the example
 * had lied about where it goes.
 *
 * It stays an `<a href>` on purpose: the colour, the hover underline and the
 * URL in the browser's status bar are the affordance, and a span loses all
 * three — the link styling a reader sees here is VitePress's own, which only
 * an anchor gets. What it loses is the navigation. `auxclick` is prevented
 * alongside `click` so a middle-click cannot open the 404 in a tab either.
 *
 * The URL moves to the tooltip, which turns the dead end into the lesson: that
 * address was minted by `feedMedia()` at read time, and it is in the payload
 * under the same card.
 *
 * Provided through the kit's own `FEED_LINK` seam — the one a consumer uses to
 * hand the feed an Inertia or router link — rather than by forking EntityLink.
 */
defineProps<{ href?: string }>()
</script>

<template>
    <a
        :href="href"
        :title="href ? `${href} — a link in the app that recorded this; the docs stay put` : undefined"
        @click.prevent
        @auxclick.prevent
    >
        <slot />
    </a>
</template>
