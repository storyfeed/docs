<script setup lang="ts">
/**
 * The empty shape of a body, drawn into a real row's content zone.
 *
 * Goes in `FeedExample`'s `body` slot, which is the same place a rendered
 * form lands, so the outline sits exactly where the thing it stands for
 * would. A row carrying this has no body in its payload — that is the
 * point, and the payload toggle underneath will show it.
 */
</script>

<template>
    <div class="sf-body-placeholder" aria-hidden="true">body</div>
</template>

<style scoped>
.sf-body-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 72px;
    margin: 0.5rem 0 0.25rem;
    border: 1.4px dashed var(--vp-c-text-3);
    border-radius: 8px;
    color: var(--vp-c-text-3);
    font-family: var(--vp-font-family-mono);
    font-size: 13px;
    letter-spacing: 0.08em;
}
</style>
