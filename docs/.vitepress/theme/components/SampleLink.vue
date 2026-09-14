<script setup lang="ts">
/**
 * An entity link on a docs page, which must not navigate.
 *
 * The sample payloads carry real-looking URLs — `/orders/1`, `/users/4` —
 * because a payload with null urls would teach that entities have none. But
 * this site has no such routes, so following one lands on a 404 and the
 * example has lied about where it goes.
 *
 * So the link keeps its appearance and loses its destination: no href, no
 * middle-click, no open-in-new-tab. Where it WOULD go is on `title`, which
 * turns the dead end into the lesson — that URL was minted by `feedMedia()`
 * at read time, and it is in the payload under this card.
 *
 * Provided through the kit's own `FEED_LINK` seam rather than by forking
 * `EntityLink`, which is the seam a consumer uses for Inertia or a router.
 */
defineProps<{ href?: string }>()
</script>

<template>
    <span class="sf-sample-link" :title="href ? `Links to ${href} in the app that recorded this` : undefined">
        <slot />
    </span>
</template>

<style scoped>
.sf-sample-link {
    /* The affordance of a link without its promise: same colour and underline
       as `.sf-entity`, but the cursor says it is not going anywhere. */
    cursor: help;
    text-decoration-style: dotted;
    text-underline-offset: 2px;
}
</style>
