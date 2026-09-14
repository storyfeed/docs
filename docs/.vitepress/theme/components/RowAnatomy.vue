<script setup lang="ts">
/**
 * A wireframe of one feed row, with every zone a renderer has to place.
 *
 * Deliberately a drawing and not a screenshot: a screenshot shows one set of
 * choices and invites copying them, where the zones and their ORDER are the
 * part that is not negotiable. Nothing here is styled like the real kit.
 */
</script>

<template>
    <figure class="sf-anatomy">
        <svg viewBox="0 0 660 330" role="img" aria-labelledby="anatomy-title">
            <title id="anatomy-title">
                The zones of a feed row: a rail, a head with the sentence and the
                time, and a content region holding a quote, a picture, a detail
                block and a group's members.
            </title>

            <!-- rail -->
            <circle cx="42" cy="40" r="19" class="box" />
            <circle cx="55" cy="53" r="8" class="box fill" />
            <line x1="42" y1="62" x2="42" y2="300" class="rule" />
            <text x="10" y="86" class="tag">rail</text>

            <!-- head -->
            <rect x="82" y="24" width="360" height="13" rx="3" class="box fill" />
            <rect x="540" y="24" width="72" height="13" rx="3" class="box" />
            <text x="82" y="54" class="tag">headline · the sentence, tokens already substituted</text>
            <text x="540" y="54" class="tag">time</text>

            <!-- content -->
            <line x1="82" y1="74" x2="94" y2="74" class="rule" />
            <line x1="88" y1="70" x2="88" y2="104" class="rule" />
            <rect x="100" y="68" width="300" height="10" rx="3" class="box" />
            <rect x="100" y="84" width="220" height="10" rx="3" class="box" />
            <text x="82" y="118" class="tag">thread · what someone said, quoted on the activity</text>

            <rect x="82" y="132" width="150" height="86" rx="6" class="box fill" />
            <text x="82" y="234" class="tag">media · the object's picture, at the feed's scale</text>

            <rect x="82" y="248" width="96" height="9" rx="3" class="box" />
            <rect x="196" y="248" width="150" height="9" rx="3" class="box" />
            <rect x="82" y="264" width="96" height="9" rx="3" class="box" />
            <rect x="196" y="264" width="112" height="9" rx="3" class="box" />
            <text x="82" y="288" class="tag">detail · a recognised form out of the app's own data</text>

            <text x="82" y="316" class="tag muted">
                a group adds a tile strip here, and its members below
            </text>
        </svg>
    </figure>
</template>

<style scoped>
.sf-anatomy {
    margin: 1.25rem 0;
    padding: 1rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    background: var(--vp-c-bg-soft);
}
.sf-anatomy svg { display: block; width: 100%; height: auto; }
.box { fill: none; stroke: var(--vp-c-text-3); stroke-width: 1.2; }
.fill { fill: var(--vp-c-bg-elv); }
.rule { stroke: var(--vp-c-text-3); stroke-width: 1.2; }
.tag {
    fill: var(--vp-c-text-2);
    font-family: var(--vp-font-family-mono);
    font-size: 11px;
}
.muted { fill: var(--vp-c-text-3); }
</style>
