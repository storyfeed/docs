<script setup lang="ts">
import { partnerSponsors } from '../sponsors'
</script>

<template>
  <section v-if="partnerSponsors.length" class="sf-partner-sponsors [margin-top:16px] [padding-top:16px] [border-top:1px_solid_var(--vp-c-divider)] [font-size:13px] [line-height:1.5] [&_h2]:[margin:0_0_8px] [&_h2]:[color:var(--vp-c-text-2)] [&_h2]:[font-size:inherit] [&_h2]:[font-weight:600] [&_ul]:[margin:0] [&_ul]:[padding:0] [&_ul]:[list-style:none] [&_li_+_li]:[margin-top:8px] [&_a]:[color:var(--vp-c-text-2)] [&_a]:[overflow-wrap:anywhere] [&_a:hover]:[color:var(--vp-c-brand-1)] [&_a:hover]:[text-decoration:underline] [&_a:hover]:[text-underline-offset:2px] [&_a:focus-visible]:[color:var(--vp-c-brand-1)] [&_a:focus-visible]:[text-decoration:underline] [&_a:focus-visible]:[text-underline-offset:2px]" aria-label="Partner sponsors">
    <h2>Partner Sponsors</h2>
    <ul>
      <li v-for="sponsor in partnerSponsors" :key="sponsor.url">
        <a :href="sponsor.url" target="_blank" rel="noopener noreferrer">{{ sponsor.name }}</a>
      </li>
    </ul>
  </section>
</template>
