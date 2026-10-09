<script setup lang="ts">
import { partnerSponsors } from '../sponsors'
</script>

<template>
  <section v-if="partnerSponsors.length" class="sf-partner-sponsors" aria-label="Partner sponsors">
    <h2>Partner Sponsors</h2>
    <ul>
      <li v-for="sponsor in partnerSponsors" :key="sponsor.url">
        <a :href="sponsor.url" target="_blank" rel="noopener noreferrer">{{ sponsor.name }}</a>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.sf-partner-sponsors {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 13px;
  line-height: 1.5;
}

h2 {
  margin: 0 0 8px;
  color: var(--vp-c-text-2);
  font-size: inherit;
  font-weight: 600;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

li + li {
  margin-top: 8px;
}

a {
  color: var(--vp-c-text-2);
  overflow-wrap: anywhere;
}

a:hover,
a:focus-visible {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
