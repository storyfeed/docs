<script setup lang="ts">
import { ref } from 'vue'

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
// TWO ROOTS, SO ATTRIBUTES ARE PLACED BY HAND. The dialog sits beside the
// anchor, which means Vue cannot guess where `class="sf-entity"` belongs — and
// without it every entity in the feed loses its weight and colour.
defineOptions({ inheritAttrs: false })

const props = defineProps<{ href?: string; modal?: boolean }>()

const open = ref(false)

/**
 * `entity.modal` is a hint, and this is one renderer's answer to it: open in
 * place rather than navigate. Another renderer may ignore it entirely, which
 * is the same rule as an unknown glyph or an unrecognised detail form.
 */
function activate() {
    if (props.modal) open.value = true
}
</script>

<template>
    <a
        v-bind="$attrs"
        :href="href"
        :title="
            href
                ? `${href} — ${modal ? 'opens in place, because this entity asked for it' : 'a link in the app that recorded this; the docs stay put'}`
                : undefined
        "
        @click.prevent="activate"
        @auxclick.prevent
    >
        <slot />
    </a>

    <dialog v-if="modal" ref="panel" class="sf-sample-modal" :open="open">
        <p class="sf-sample-modal__body">
            Your renderer opens <code>{{ href }}</code> here, without leaving
            the feed. <code>entity.modal</code> is the payload asking for it.
        </p>
        <button type="button" @click="open = false">Close</button>
    </dialog>
</template>

<style scoped>
.sf-sample-modal {
    position: fixed;
    inset: auto 0 2rem;
    z-index: 60;
    max-width: 28rem;
    margin: 0 auto;
    padding: 1rem 1.25rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 10px;
    background: var(--vp-c-bg-elv);
    box-shadow: 0 12px 32px rgb(0 0 0 / 0.18);
}
.sf-sample-modal__body { margin: 0 0 0.75rem; font-size: 14px; }
.sf-sample-modal button {
    padding: 0.25rem 0.7rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 6px;
    font-size: 12.5px;
    cursor: pointer;
}
</style>
