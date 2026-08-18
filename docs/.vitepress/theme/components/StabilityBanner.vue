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
 */
</script>

<template>
  <div class="sf-status">
    <p class="sf-status__text">
      <strong>Pre-1.0 and unfinished.</strong>
      APIs and these docs change without a deprecation cycle. Pin a commit.
      <a href="/reference/compatibility#stability-before-1-0">What that costs you</a>
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
