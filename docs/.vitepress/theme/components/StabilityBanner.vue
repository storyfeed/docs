<script setup lang="ts">
/**
 * The pre-1.0 status, on every page.
 *
 * A reader arrives from a search engine on a deep page — Reading feeds, the
 * payload contract — and never sees the introduction. The status of the thing
 * they are reading about cannot live only on the page nobody entered through,
 * so it lives in the chrome, above the nav, on every route.
 *
 * In normal flow rather than fixed: it is present on arrival, then scrolls away
 * and gives the page back. A permanently pinned strip would tax every scroll of
 * every page to repeat a fact the reader took in once, and VitePress's own
 * fixed-banner path needs --vp-layout-top-height juggling that fights the
 * sidebar on small screens.
 *
 * Off-brand on purpose, same reasoning as Annotation.vue: amber is the
 * product's voice, and a status notice is the project talking about itself.
 *
 * IT STATES, IT DOES NOT ADVISE. An earlier version ended "Pin a commit",
 * which is a mitigation, and a mitigation implies there is a safe way in — it
 * half-invites the reader this notice exists to turn away. It was also
 * contradicted two lines below it on the installation page, which says
 * `composer require storyfeed/storyfeed` with nothing pinned. Advice belongs
 * on the compatibility page; the link goes there.
 *
 * "These pages may already be wrong about it" is the sentence that earns its
 * place. On 2026-09-05 this site taught `Feedable::toFeedLink()` for hours
 * after the method was deleted from core — 8 references to a dead method and
 * 15 to a dead class across four pages. A reader told only that "the API
 * changes" would still trust the page in front of them.
 */
</script>

<template>
  <div class="sf-status">
    <p class="sf-status__text">
      <strong>Pre-1.0. Not intended for public use yet.</strong>
      The API is subject to undocumented change, and these pages may already be
      wrong about it.
      <a href="/reference/compatibility#stability-before-1-0">Stability before 1.0</a>
    </p>
  </div>
</template>

<style scoped>
.sf-status {
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-alt);
}

.sf-status__text {
  margin: 0 auto;
  max-width: 1440px;
  padding: 7px 24px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

.sf-status strong {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.sf-status a {
  color: var(--vp-c-brand-1);
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 2px;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .sf-status__text {
    padding: 7px 16px;
  }
}
</style>
