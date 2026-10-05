<script setup lang="ts">
import DemoFeed from '../source/website/resources/js/demo/DemoFeed.vue';
import fixture from './fixture.json';
const pin=Date.parse('2026-10-15T12:00:00Z');
</script>
<template><div id="capture"><DemoFeed :items="fixture" :pin="pin" /></div><p id="fixture-note">Actual website DemoFeed renderer, unchanged components and feed CSS. Local historical milestone fixture; not a production feed response. Clock pinned to 15 October 2026. No row spacing overrides. <a href="../../index.html">Return to composition review</a>.</p></template>
